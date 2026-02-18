
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE resolved = false AND (
  error_message LIKE '%Rendered fewer hooks than expected%' OR
  error_message LIKE '%Minified React error #300%' OR
  error_message LIKE '%Importing a module script failed%' OR
  error_message LIKE '%dispatcher.useEffect%' OR
  error_message LIKE '%opts is not defined%' OR
  error_message LIKE '%Failed to fetch dynamically imported module%' OR
  error_message LIKE '%r["@context"].toLowerCase%'
);
