-- Add reminder tracking fields to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS reminder_7days_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_3days_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_1day_sent boolean DEFAULT false;

-- Create index for faster expiring subscriptions queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date_status 
ON public.subscriptions(end_date, status) 
WHERE status = 'active';

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily check for expiring subscriptions at 10:00 AM Moscow time (07:00 UTC)
SELECT cron.schedule(
  'check-expiring-subscriptions-daily',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://oxyjmeslnmhewlpgzlmf.supabase.co/functions/v1/check-expiring-subscriptions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWptZXNsbm1oZXdscGd6bG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjE2MjEsImV4cCI6MjA2OTg5NzYyMX0.zqNt8Zj0ktRLY1HBKelEYJ0gXaLkyIc4l6PAwMod7Co"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);