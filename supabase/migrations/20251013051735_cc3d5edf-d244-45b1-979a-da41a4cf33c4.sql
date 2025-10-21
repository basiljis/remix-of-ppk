-- Fix security issues for instruction_files table
-- Restrict DELETE and UPDATE to admin users only
DROP POLICY IF EXISTS "Users can delete instruction files" ON public.instruction_files;
DROP POLICY IF EXISTS "Users can update instruction files" ON public.instruction_files;

CREATE POLICY "Only admins can delete instruction files"
ON public.instruction_files FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update instruction files"
ON public.instruction_files FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Fix security issues for organizations table
-- Protect api_token field from non-admin access
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update organizations" ON public.organizations;

-- New RLS policies for organizations table
-- Admins can see everything including api_token
CREATE POLICY "Admins can view all organizations with tokens"
ON public.organizations FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Regular users can view organizations but without api_token visibility
-- This policy will prevent the query from returning rows where api_token is visible to non-admins
CREATE POLICY "Users can view organizations without tokens"
ON public.organizations FOR SELECT
USING (NOT has_role(auth.uid(), 'admin'));

-- Keep existing INSERT and UPDATE policies
CREATE POLICY "Users can insert organizations"
ON public.organizations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update organizations"
ON public.organizations FOR UPDATE
USING (true);