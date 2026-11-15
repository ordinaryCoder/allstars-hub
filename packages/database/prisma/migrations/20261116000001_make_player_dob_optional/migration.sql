-- Make dob optional in players table
ALTER TABLE public.players ALTER COLUMN dob DROP NOT NULL;
