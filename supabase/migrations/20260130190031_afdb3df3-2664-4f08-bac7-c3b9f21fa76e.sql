-- Add allow_parent_registration field to organizations table
-- This controls whether parents can see this organization in their booking search
ALTER TABLE public.organizations
ADD COLUMN allow_parent_registration boolean NOT NULL DEFAULT true;

-- Add comment explaining the field
COMMENT ON COLUMN public.organizations.allow_parent_registration IS 'Controls whether parents can book consultations via their personal account. If false, organization and its specialists are hidden from parent search.';