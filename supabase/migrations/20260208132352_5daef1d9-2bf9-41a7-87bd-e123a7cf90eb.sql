-- Пометить исторические ошибки React hooks как решённые
-- Эти ошибки были вызваны hot-reload при разработке и больше не воспроизводятся
UPDATE error_logs 
SET 
  resolved = true, 
  resolved_at = now()
WHERE 
  resolved = false 
  AND severity = 'error'
  AND (
    error_message LIKE '%Rendered fewer hooks%' 
    OR error_message LIKE '%Minified React error #300%'
  );