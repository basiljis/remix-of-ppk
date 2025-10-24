-- Create separate table for organization API credentials to prevent token exposure
CREATE TABLE IF NOT EXISTS public.organization_api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  api_token text NOT NULL,
  token_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_api_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can access organization credentials
CREATE POLICY "Only admins can access organization credentials"
ON public.organization_api_credentials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing tokens to new table
INSERT INTO public.organization_api_credentials (organization_id, api_token, token_expires_at)
SELECT id, api_token, token_expires_at
FROM public.organizations
WHERE api_token IS NOT NULL;

-- Remove token columns from organizations table
ALTER TABLE public.organizations DROP COLUMN IF EXISTS api_token;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS token_expires_at;

-- Add trigger for updated_at
CREATE TRIGGER update_organization_api_credentials_updated_at
BEFORE UPDATE ON public.organization_api_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();