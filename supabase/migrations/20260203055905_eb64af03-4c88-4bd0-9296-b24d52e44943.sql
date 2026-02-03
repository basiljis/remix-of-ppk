-- Add columns for tracking interaction time in child_task_progress
ALTER TABLE public.child_task_progress
ADD COLUMN IF NOT EXISTS interaction_time_seconds integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS started_at timestamp with time zone;

-- Add comment explaining the columns
COMMENT ON COLUMN public.child_task_progress.interaction_time_seconds IS 'Total active interaction time with the task in seconds';
COMMENT ON COLUMN public.child_task_progress.started_at IS 'When the child started working on this task';