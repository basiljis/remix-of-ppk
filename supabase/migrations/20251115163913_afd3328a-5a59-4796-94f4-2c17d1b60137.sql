-- Создание RLS политик для таблицы email_logs
-- Администраторы могут просматривать все логи email
CREATE POLICY "Администраторы могут просматривать все логи email"
ON public.email_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Региональные операторы могут просматривать логи email
CREATE POLICY "Региональные операторы могут просматривать логи email"
ON public.email_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'regional_operator'
  )
);

-- Функции могут вставлять логи email
CREATE POLICY "Функции могут вставлять логи email"
ON public.email_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Функции могут обновлять логи email
CREATE POLICY "Функции могут обновлять логи email"
ON public.email_logs
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);