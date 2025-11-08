-- Remove foreign key constraint from access_requests.user_id
-- This allows creating access requests before user confirmation
ALTER TABLE public.access_requests 
DROP CONSTRAINT IF EXISTS access_requests_user_id_fkey;

-- Add a comment explaining why there's no FK constraint
COMMENT ON COLUMN public.access_requests.user_id IS 'References auth.users(id) but without FK constraint to allow registration before email confirmation';