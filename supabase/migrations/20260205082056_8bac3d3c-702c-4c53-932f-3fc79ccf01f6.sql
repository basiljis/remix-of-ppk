-- Помечаем старые ошибки Auth Data Load Failed как решённые
-- так как они возникали из-за отсутствия профиля для новых пользователей (ожидаемое поведение)
UPDATE error_logs 
SET resolved = true, 
    resolved_at = now()
WHERE (resolved = false OR resolved IS NULL)
AND error_type = 'Auth Data Load Failed';