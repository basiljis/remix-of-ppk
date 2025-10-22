-- Auto-create profile and default role when access request is approved
CREATE OR REPLACE FUNCTION public.handle_access_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Create profile if missing
    INSERT INTO public.profiles (
      id,
      full_name,
      email,
      phone,
      region_id,
      position_id,
      organization_id,
      is_blocked
    )
    VALUES (
      NEW.user_id,
      NEW.full_name,
      NEW.email,
      NEW.phone,
      NEW.region_id,
      NEW.position_id,
      NEW.organization_id,
      false
    )
    ON CONFLICT (id) DO NOTHING;

    -- Ensure user has at least one role (default to 'user')
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles ur WHERE ur.user_id = NEW.user_id
    ) THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'user'::app_role);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger fires only when status changes to 'approved'
DROP TRIGGER IF EXISTS on_access_request_approved ON public.access_requests;
CREATE TRIGGER on_access_request_approved
AFTER UPDATE OF status ON public.access_requests
FOR EACH ROW
WHEN (NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status))
EXECUTE FUNCTION public.handle_access_request_approval();

-- Backfill: create profiles for already approved requests (idempotent)
INSERT INTO public.profiles (id, full_name, email, phone, region_id, position_id, organization_id, is_blocked)
SELECT ar.user_id, ar.full_name, ar.email, ar.phone, ar.region_id, ar.position_id, ar.organization_id, false
FROM public.access_requests ar
LEFT JOIN public.profiles p ON p.id = ar.user_id
WHERE ar.status = 'approved' AND p.id IS NULL;

-- Backfill: ensure default role for those users if none exists
INSERT INTO public.user_roles (user_id, role)
SELECT ar.user_id, 'user'::app_role
FROM public.access_requests ar
LEFT JOIN public.user_roles ur ON ur.user_id = ar.user_id
WHERE ar.status = 'approved' AND ur.user_id IS NULL;