-- Mark ServiceWorker/PWA related errors as resolved (they are expected on custom domains)
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE resolved = false 
AND (
  error_message LIKE '%Rejected%' 
  OR error_message LIKE '%ServiceWorker%'
  OR error_message LIKE '%sw.js%'
  OR error_message LIKE '%registerSW%'
  OR error_stack LIKE '%registerSW%'
  OR error_stack LIKE '%serviceWorker.register%'
);