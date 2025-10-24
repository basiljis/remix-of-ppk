-- Ensure trigger exists to call handle_access_request_approval after updates on access_requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_access_request_approved'
  ) THEN
    CREATE TRIGGER on_access_request_approved
    AFTER UPDATE ON public.access_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_access_request_approval();
  END IF;
END$$;

-- Backfill profiles for already approved access requests (if missing)
INSERT INTO public.profiles (id, full_name, email, phone, region_id, position_id, organization_id, is_blocked)
SELECT ar.user_id, ar.full_name, ar.email, ar.phone, ar.region_id, ar.position_id, ar.organization_id, false
FROM public.access_requests ar
LEFT JOIN public.profiles p ON p.id = ar.user_id
WHERE ar.status = 'approved' AND p.id IS NULL;

-- Backfill roles for already approved access requests (if missing)
INSERT INTO public.user_roles (user_id, role)
SELECT ar.user_id, ar.role
FROM public.access_requests ar
LEFT JOIN public.user_roles ur ON ur.user_id = ar.user_id AND ur.role = ar.role
WHERE ar.status = 'approved' AND ur.user_id IS NULL;