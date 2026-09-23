DROP POLICY IF EXISTS "Service can insert email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Функции могут вставлять логи email" ON public.email_logs;
DROP POLICY IF EXISTS "Функции могут обновлять логи email" ON public.email_logs;
REVOKE INSERT, UPDATE, DELETE ON public.email_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.email_logs FROM authenticated;
GRANT ALL ON public.email_logs TO service_role;

DROP POLICY IF EXISTS "Service can insert payment logs" ON public.payment_logs;
REVOKE INSERT, UPDATE, DELETE ON public.payment_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.payment_logs FROM authenticated;
GRANT ALL ON public.payment_logs TO service_role;

DROP POLICY IF EXISTS "Enable insert for everyone" ON public.legal_subscriptions;
CREATE POLICY "Anyone can subscribe to legal updates"
ON public.legal_subscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (user_id IS NULL OR user_id = auth.uid())
  AND email ~* '^[A-Za-z0-9._%%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);
DROP POLICY IF EXISTS "Enable update for owners" ON public.legal_subscriptions;