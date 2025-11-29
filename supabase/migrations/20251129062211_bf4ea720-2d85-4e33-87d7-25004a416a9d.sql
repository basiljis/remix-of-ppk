-- Удаляем старые политики
DROP POLICY IF EXISTS "Admins can view all commercial offer requests" ON commercial_offer_requests;
DROP POLICY IF EXISTS "Admins can update commercial offer requests" ON commercial_offer_requests;

-- Создаем новые политики с использованием функции has_role
CREATE POLICY "Admins can view all commercial offer requests"
ON commercial_offer_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update commercial offer requests"
ON commercial_offer_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));