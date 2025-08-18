-- Add meeting_type column to protocols table
ALTER TABLE public.protocols 
ADD COLUMN meeting_type text CHECK (meeting_type IN ('scheduled', 'unscheduled'));