-- Create a secure function to assign parent role during registration
-- This bypasses RLS using SECURITY DEFINER
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_parent_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_parent_role(uuid) TO anon;