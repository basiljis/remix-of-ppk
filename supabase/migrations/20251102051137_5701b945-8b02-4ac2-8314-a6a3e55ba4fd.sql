-- Add region_id column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS region_id text REFERENCES public.regions(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_region_id ON public.organizations(region_id);

-- Update existing organizations to have a default region if needed
-- This is optional and can be removed if not needed
COMMENT ON COLUMN public.organizations.region_id IS 'Region identifier for the organization';