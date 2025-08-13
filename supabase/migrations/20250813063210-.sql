-- Function to split the Emaths deck into 6 random parts (fixed version)
CREATE OR REPLACE FUNCTION split_emaths_deck()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  original_deck_id uuid;
  original_deck_creator uuid;
  new_deck_id_1 uuid;
  new_deck_id_2 uuid;
  new_deck_id_3 uuid;
  new_deck_id_4 uuid;
  new_deck_id_5 uuid;
  new_deck_id_6 uuid;
  card_record RECORD;
  current_deck_index INTEGER := 0;
  card_count INTEGER := 0;
  target_deck_id uuid;
BEGIN
  -- Get the original deck ID and creator
  SELECT id, created_by INTO original_deck_id, original_deck_creator
  FROM public.decks 
  WHERE name = 'Emaths - Numbers and Algebra'
  LIMIT 1;
  
  IF original_deck_id IS NULL THEN
    RAISE EXCEPTION 'Original deck not found';
  END IF;
  
  -- Create 6 new decks
  INSERT INTO public.decks (name, description, created_by, is_public)
  VALUES ('Emaths Numbers & Algebra - Part 1', 'Part 1 of the split Emaths Numbers and Algebra deck', original_deck_creator, true)
  RETURNING id INTO new_deck_id_1;
  
  INSERT INTO public.decks (name, description, created_by, is_public)
  VALUES ('Emaths Numbers & Algebra - Part 2', 'Part 2 of the split Emaths Numbers and Algebra deck', original_deck_creator, true)
  RETURNING id INTO new_deck_id_2;
  
  INSERT INTO public.decks (name, description, created_by, is_public)
  VALUES ('Emaths Numbers & Algebra - Part 3', 'Part 3 of the split Emaths Numbers and Algebra deck', original_deck_creator, true)
  RETURNING id INTO new_deck_id_3;
  
  INSERT INTO public.decks (name, description, created_by, is_public)
  VALUES ('Emaths Numbers & Algebra - Part 4', 'Part 4 of the split Emaths Numbers and Algebra deck', original_deck_creator, true)
  RETURNING id INTO new_deck_id_4;
  
  INSERT INTO public.decks (name, description, created_by, is_public)
  VALUES ('Emaths Numbers & Algebra - Part 5', 'Part 5 of the split Emaths Numbers and Algebra deck', original_deck_creator, true)
  RETURNING id INTO new_deck_id_5;
  
  INSERT INTO public.decks (name, description, created_by, is_public)
  VALUES ('Emaths Numbers & Algebra - Part 6', 'Part 6 of the split Emaths Numbers and Algebra deck', original_deck_creator, true)
  RETURNING id INTO new_deck_id_6;
  
  -- Randomly distribute cards to the new decks
  FOR card_record IN 
    SELECT * FROM public.cards 
    WHERE deck_id = original_deck_id 
    ORDER BY RANDOM()
  LOOP
    -- Calculate which deck this card should go to
    current_deck_index := (card_count % 6) + 1;
    
    -- Select the target deck based on index
    IF current_deck_index = 1 THEN
      target_deck_id := new_deck_id_1;
    ELSIF current_deck_index = 2 THEN
      target_deck_id := new_deck_id_2;
    ELSIF current_deck_index = 3 THEN
      target_deck_id := new_deck_id_3;
    ELSIF current_deck_index = 4 THEN
      target_deck_id := new_deck_id_4;
    ELSIF current_deck_index = 5 THEN
      target_deck_id := new_deck_id_5;
    ELSE
      target_deck_id := new_deck_id_6;
    END IF;
    
    -- Update the card to belong to the new deck
    UPDATE public.cards 
    SET deck_id = target_deck_id
    WHERE id = card_record.id;
    
    card_count := card_count + 1;
  END LOOP;
  
  -- Delete the original deck (cards have been moved, so this is safe)
  DELETE FROM public.decks WHERE id = original_deck_id;
  
  RAISE NOTICE 'Successfully split deck into 6 parts with % cards distributed', card_count;
END;
$$;

-- Execute the function to split the deck
SELECT split_emaths_deck();