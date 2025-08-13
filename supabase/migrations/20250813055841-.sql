-- Make the existing deck public so new users can see it
UPDATE public.decks 
SET is_public = true 
WHERE name = 'Emaths - Numbers and Algebra';