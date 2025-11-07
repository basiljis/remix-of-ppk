-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create own access request" ON public.access_requests;

-- Create new policy that allows both authenticated and anon users to insert
CREATE POLICY "Anyone can create access request"
ON public.access_requests
FOR INSERT
TO public
WITH CHECK (true);