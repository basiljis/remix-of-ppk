-- Add cancellation token and related fields to sessions
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS cancellation_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS cancelled_by_parent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_sessions_cancellation_token 
ON public.sessions(cancellation_token);

-- Create a function to regenerate cancellation token after each session update
CREATE OR REPLACE FUNCTION regenerate_cancellation_token()
RETURNS TRIGGER AS $$
BEGIN
  -- Regenerate token when session date or time changes
  IF OLD.scheduled_date != NEW.scheduled_date OR OLD.start_time != NEW.start_time THEN
    NEW.cancellation_token = gen_random_uuid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for token regeneration
DROP TRIGGER IF EXISTS regenerate_session_token ON public.sessions;
CREATE TRIGGER regenerate_session_token
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION regenerate_cancellation_token();