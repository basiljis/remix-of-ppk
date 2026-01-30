-- Drop the overly permissive policy and replace with a more secure one
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Create a more secure policy - only allow inserting parent role for own user_id
CREATE POLICY "Users can insert their own parent role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'parent'::app_role);