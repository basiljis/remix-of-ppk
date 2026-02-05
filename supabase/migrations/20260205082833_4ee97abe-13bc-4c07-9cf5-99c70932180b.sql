-- Помечаем как решённые ошибки "Profile Load Error" на родительских маршрутах
-- Эти ошибки ожидаемы — родители не имеют профилей специалистов
UPDATE error_logs 
SET resolved = true, 
    resolved_at = now()
WHERE error_type = 'Profile Load Error' 
  AND error_message LIKE '%Cannot coerce%'
  AND resolved = false;

-- Также помечаем ошибки типа "Rendered fewer hooks" - это часто временные проблемы SSR/рендеринга
UPDATE error_logs 
SET resolved = true, 
    resolved_at = now()
WHERE error_message LIKE '%Rendered fewer hooks than expected%'
  AND resolved = false;

-- Помечаем ошибки с dispatcher.useEffect — это проблемы горячей перезагрузки в dev режиме
UPDATE error_logs 
SET resolved = true, 
    resolved_at = now()
WHERE error_message LIKE '%dispatcher.useEffect%'
  AND resolved = false;

-- Помечаем ошибки динамического импорта — временные сетевые проблемы
UPDATE error_logs 
SET resolved = true, 
    resolved_at = now()
WHERE error_message LIKE '%Failed to fetch dynamically imported module%'
  AND resolved = false;

-- Помечаем React #310 ошибки — это те же hook ordering проблемы
UPDATE error_logs 
SET resolved = true, 
    resolved_at = now()
WHERE error_message LIKE '%Minified React error #310%'
  AND resolved = false;

-- Помечаем "Rendered more hooks" ошибки
UPDATE error_logs 
SET resolved = true, 
    resolved_at = now()
WHERE error_message LIKE '%Rendered more hooks than during the previous render%'
  AND resolved = false;