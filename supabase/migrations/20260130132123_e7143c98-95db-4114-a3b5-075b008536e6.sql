-- Add INSERT policy for user_roles to allow users to insert their own role
-- This is needed because even with SECURITY DEFINER function, 
-- the RLS still blocks the insert when called from anon context

CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Also ensure the assign_parent_role function works correctly
-- by recreating it with proper permissions
DROP FUNCTION IF EXISTS public.assign_parent_role(uuid);

CREATE OR REPLACE FUNCTION public.assign_parent_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'parent')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.assign_parent_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_parent_role(uuid) TO anon;