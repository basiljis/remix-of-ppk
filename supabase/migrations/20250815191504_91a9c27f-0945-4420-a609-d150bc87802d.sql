-- Add type field to instructions table to differentiate between instruction types
ALTER TABLE public.instructions 
ADD COLUMN type TEXT NOT NULL DEFAULT 'custom';

-- Update existing records to have 'custom' type
UPDATE public.instructions SET type = 'custom' WHERE type IS NULL;