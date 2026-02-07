-- Mark network-related profile load errors as resolved (these are expected intermittent issues)
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE resolved = false 
AND (
  error_message LIKE '%FetchEvent.respondWith%'
  OR error_message LIKE '%Failed to fetch%'
  OR (error_type = 'Auth Data Load Failed' AND error_message = '[object Object]')
);