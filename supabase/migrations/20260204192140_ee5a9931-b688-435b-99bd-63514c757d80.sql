-- Add slot_format column to consultation_slots table
-- Allows specialists to specify online/offline/both for booking slots

ALTER TABLE public.consultation_slots
ADD COLUMN slot_format TEXT NOT NULL DEFAULT 'offline'
CHECK (slot_format IN ('online', 'offline', 'both'));

-- Add index for filtering by format
CREATE INDEX idx_consultation_slots_format ON public.consultation_slots(slot_format);

-- Add comment for documentation
COMMENT ON COLUMN public.consultation_slots.slot_format IS 'Format of consultation: online, offline, or both';