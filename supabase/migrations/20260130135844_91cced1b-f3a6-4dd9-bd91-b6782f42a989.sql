-- Add is_completed field to track incomplete tests
ALTER TABLE public.parent_test_results 
ADD COLUMN is_completed boolean NOT NULL DEFAULT true;

-- Add index for efficient filtering of incomplete tests
CREATE INDEX idx_parent_test_results_is_completed 
ON public.parent_test_results(parent_user_id, is_completed) 
WHERE is_completed = false;