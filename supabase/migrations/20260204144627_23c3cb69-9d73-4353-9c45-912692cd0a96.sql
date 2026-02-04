-- Add policy for users to view their own organization
CREATE POLICY "Users can view their own organization"
  ON public.organizations
  FOR SELECT
  USING (
    id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Update admin policy to work without token restriction
DROP POLICY IF EXISTS "Admins can view all organizations with tokens" ON public.organizations;

CREATE POLICY "Admins can view all organizations"
  ON public.organizations
  FOR SELECT
  USING (
    has_role(auth.uid(), 'admin'::app_role)
  );