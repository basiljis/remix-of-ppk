
-- Remove overly permissive policy (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service can manage session payments" ON public.session_payments;
