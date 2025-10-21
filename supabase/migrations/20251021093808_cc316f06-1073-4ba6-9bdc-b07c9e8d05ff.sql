-- Drop the restrictive policy that checks for blocked users
DROP POLICY IF EXISTS "Authenticated users can insert protocols" ON protocols;

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Users can insert protocols" ON protocols;

-- Create a new simplified policy for authenticated users
CREATE POLICY "Authenticated users can insert protocols" 
ON protocols 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);