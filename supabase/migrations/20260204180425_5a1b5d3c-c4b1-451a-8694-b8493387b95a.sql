-- Fix RLS infinite recursion for public organizations directory
-- Root cause: organizations SELECT policy was assigned to PUBLIC role, causing it to be evaluated for anon users.
-- It queries profiles, whose anon policy queries organizations again -> infinite recursion.

-- Ensure privileged policies apply only to authenticated users
ALTER POLICY "Admins can view all organizations" ON public.organizations TO authenticated;
ALTER POLICY "Users can view their own organization" ON public.organizations TO authenticated;
ALTER POLICY "Users can insert organizations" ON public.organizations TO authenticated;
ALTER POLICY "Users can update organizations" ON public.organizations TO authenticated;

-- Keep public directory access for both visitors and signed-in users
ALTER POLICY "Public can view published organizations" ON public.organizations TO anon, authenticated;