-- Add description to scheduled_sessions to allow instance-specific descriptions
ALTER TABLE public.scheduled_sessions ADD COLUMN description TEXT;
