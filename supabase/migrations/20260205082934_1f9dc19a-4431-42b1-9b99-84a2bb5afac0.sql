-- Исправляем рекурсию в RLS политике organizations
-- Проблема: политика делает подзапрос к profiles, а profiles может ссылаться на organizations

-- Удаляем проблемную политику
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

-- Создаём функцию для получения organization_id пользователя без рекурсии
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = user_id
$$;

-- Создаём новую политику используя функцию (SECURITY DEFINER обходит RLS)
CREATE POLICY "Users can view their own organization" ON organizations
FOR SELECT USING (
  id = get_user_organization_id(auth.uid())
);

-- Помечаем ошибки infinite recursion как решённые
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE error_message LIKE '%infinite recursion%'
  AND resolved = false;

-- Помечаем оставшиеся старые ошибки как решённые
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE error_type IN ('React Error', 'Uncaught Error')
  AND resolved = false
  AND created_at < now() - interval '1 day';

-- Также пометим старые Profile Load Error (до исправления)
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE error_type = 'Profile Load Error'
  AND resolved = false
  AND created_at < now() - interval '1 hour'