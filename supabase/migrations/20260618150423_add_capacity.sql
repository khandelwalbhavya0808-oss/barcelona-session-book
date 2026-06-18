-- Add capacity column to session_types
ALTER TABLE public.session_types ADD COLUMN capacity INTEGER DEFAULT NULL;
