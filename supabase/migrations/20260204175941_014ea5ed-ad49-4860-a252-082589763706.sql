-- Drop problematic policy causing infinite recursion
DROP POLICY IF EXISTS "Users can view organizations without tokens" ON public.organizations;

-- Keep only the necessary policies for public access
-- The "Public can view published organizations" policy with (is_published = true) is sufficient for public access
-- The "Admins can view all organizations" policy handles admin access
-- The "Users can view their own organization" policy handles user access