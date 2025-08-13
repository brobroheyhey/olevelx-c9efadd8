-- Function to split the Emaths deck into 6 random parts
CREATE OR REPLACE FUNCTION split_emaths_deck()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  original_deck_id uuid;
  original_deck_creator uuid;
  new_deck_ids uuid[] := ARRAY[]::uuid[];
  card_record RECORD;
  current_deck_index INTEGER := 0;
  cards_per_deck INTEGER := 20;
  card_count INTEGER := 0;
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
  FOR i IN 1..6 LOOP
    INSERT INTO public.decks (name, description, created_by, is_public)
    VALUES (
      'Emaths Numbers & Algebra - Part ' || i,
      'Part ' || i || ' of the split Emaths Numbers and Algebra deck',
      original_deck_creator,
      true
    )
    RETURNING id INTO new_deck_ids[i];
  END LOOP;
  
  -- Randomly distribute cards to the new decks
  FOR card_record IN 
    SELECT * FROM public.cards 
    WHERE deck_id = original_deck_id 
    ORDER BY RANDOM()
  LOOP
    -- Calculate which deck this card should go to
    current_deck_index := (card_count % 6) + 1;
    
    -- Update the card to belong to the new deck
    UPDATE public.cards 
    SET deck_id = new_deck_ids[current_deck_index]
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