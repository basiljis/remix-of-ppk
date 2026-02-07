-- Mark "Rendered fewer hooks" errors as resolved (they are old errors that have been addressed)
UPDATE error_logs 
SET resolved = true, resolved_at = now() 
WHERE resolved = false 
  AND severity = 'error' 
  AND error_message LIKE '%Rendered fewer hooks%';