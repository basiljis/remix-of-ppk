-- Add organization_id to subscriptions for organization-level subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add index for faster organization subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON public.subscriptions(organization_id);

-- Create function to check if user has active subscription (including organization-level)
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check for personal subscription
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND end_date > now()
      AND organization_id IS NULL
  ) OR EXISTS (
    -- Check for organization subscription
    SELECT 1
    FROM public.subscriptions s
    INNER JOIN public.profiles p ON p.organization_id = s.organization_id
    WHERE p.id = _user_id
      AND s.status = 'active'
      AND s.end_date > now()
      AND s.organization_id IS NOT NULL
  )
$$;

-- Create function to check if user has active organization subscription
CREATE OR REPLACE FUNCTION public.has_organization_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    INNER JOIN public.profiles p ON p.organization_id = s.organization_id
    WHERE p.id = _user_id
      AND s.status = 'active'
      AND s.end_date > now()
      AND s.organization_id IS NOT NULL
  )
$$;

-- Create function to get user's organization subscription end date
CREATE OR REPLACE FUNCTION public.get_organization_subscription_end_date(_user_id uuid)
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.end_date
  FROM public.subscriptions s
  INNER JOIN public.profiles p ON p.organization_id = s.organization_id
  WHERE p.id = _user_id
    AND s.status = 'active'
    AND s.end_date > now()
    AND s.organization_id IS NOT NULL
  ORDER BY s.end_date DESC
  LIMIT 1
$$;