-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create decks table
CREATE TABLE public.decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for decks
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

-- Create policies for decks
CREATE POLICY "Users can view public decks and their own decks" 
ON public.decks 
FOR SELECT 
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own decks" 
ON public.decks 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own decks" 
ON public.decks 
FOR UPDATE 
USING (created_by = auth.uid());

-- Create cards table
CREATE TABLE public.cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.decks ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create policies for cards
CREATE POLICY "Users can view cards from accessible decks" 
ON public.cards 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.decks 
    WHERE decks.id = cards.deck_id 
    AND (decks.is_public = true OR decks.created_by = auth.uid())
  )
);

CREATE POLICY "Users can create cards in their own decks" 
ON public.cards 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.decks 
    WHERE decks.id = cards.deck_id 
    AND decks.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update cards in their own decks" 
ON public.cards 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.decks 
    WHERE decks.id = cards.deck_id 
    AND decks.created_by = auth.uid()
  )
);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'name',
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();