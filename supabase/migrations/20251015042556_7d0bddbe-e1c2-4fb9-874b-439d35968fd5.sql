-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can create their own access requests" ON access_requests;

-- Create a new policy that allows both authenticated users and new signups
CREATE POLICY "Users can create access requests"
ON access_requests
FOR INSERT
WITH CHECK (
  -- Allow if user is authenticated and creating their own request
  (auth.uid() = user_id) OR 
  -- Allow if user_id exists in auth.users (for new signups before session is fully established)
  (EXISTS (SELECT 1 FROM auth.users WHERE id = user_id))
);