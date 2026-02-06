
-- Add show_pricing field to profiles (controls visibility on public page)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_pricing boolean DEFAULT false;

-- Add allow_employee_pricing to organizations (org admin controls pricing block for employees)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS allow_employee_pricing boolean DEFAULT false;
