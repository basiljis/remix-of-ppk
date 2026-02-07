-- Mark old module import and hooks errors as resolved (historical build issues)
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE resolved = false 
AND (
  error_message LIKE '%Importing a module script failed%'
  OR error_message LIKE '%Rendered fewer hooks%'
  OR error_message LIKE '%opts is not defined%'
  OR error_message LIKE '%Minified React error #300%'
  OR error_message LIKE '%Select.Item%'
  OR error_message LIKE '%instructionsItem%'
  OR error_message LIKE '%variant%'
);