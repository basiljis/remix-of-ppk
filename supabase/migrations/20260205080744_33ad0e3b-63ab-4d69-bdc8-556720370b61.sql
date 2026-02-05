-- Помечаем временные сетевые ошибки как решённые (Load failed, module import errors)
UPDATE error_logs 
SET resolved = true, 
    resolved_at = now()
WHERE (resolved = false OR resolved IS NULL)
AND (
    error_message LIKE '%Load failed%' 
    OR error_message LIKE '%Importing a module script failed%'
    OR error_message LIKE '%Minified React error #300%'
);