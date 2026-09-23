CREATE OR REPLACE FUNCTION public.grant_private_specialist_free_year()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role <> 'private_specialist'::public.app_role THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = NEW.user_id
      AND s.status = 'active'
      AND s.end_date > now()
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.subscriptions (
    user_id, subscription_type, payment_type, status,
    start_date, end_date, amount, admin_notes
  ) VALUES (
    NEW.user_id, 'yearly', 'free', 'active',
    now(), now() + interval '1 year', 0,
    'Автоматический бесплатный доступ на 1 год для педагога вне организации'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_private_specialist_free_year ON public.user_roles;
CREATE TRIGGER trg_private_specialist_free_year
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.grant_private_specialist_free_year();

INSERT INTO public.subscriptions (
  user_id, subscription_type, payment_type, status,
  start_date, end_date, amount, admin_notes
)
SELECT ur.user_id, 'yearly', 'free', 'active',
       now(), now() + interval '1 year', 0,
       'Автоматический бесплатный доступ на 1 год для педагога вне организации'
FROM public.user_roles ur
WHERE ur.role = 'private_specialist'::public.app_role
  AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = ur.user_id AND s.status = 'active' AND s.end_date > now()
  );