-- Помечаем старые/временные ошибки как решённые
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE resolved = false AND (
  error_message LIKE '%Should have a queue%'
  OR error_message LIKE '%isAutoDetecting%'
  OR error_message LIKE '%FeaturesSection%'
  OR error_message LIKE '%FetchEvent.respondWith%'
  OR error_message LIKE '%baseQueue.next%'
  OR error_message LIKE '%Can''t find variable: Mail%'
  OR error_message LIKE '%startTransition%'
)