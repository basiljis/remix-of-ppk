-- Добавляем политику INSERT для администраторов на таблицу subscriptions
CREATE POLICY "Admins can create subscriptions for users"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Также добавим политику DELETE для администраторов если её нет
CREATE POLICY "Admins can delete subscriptions"
ON public.subscriptions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));