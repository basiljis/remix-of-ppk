-- Fix RLS policy causing permission denied by referencing auth.users
-- Replace INSERT policy on access_requests to only allow self-insert using auth.uid()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'access_requests' 
      AND policyname = 'Users can create access requests'
  ) THEN
    DROP POLICY "Users can create access requests" ON public.access_requests;
  END IF;
END $$;

CREATE POLICY "Users can create access requests"
ON public.access_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());