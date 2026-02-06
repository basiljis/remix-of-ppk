
-- Add education_entries JSONB column for multiple education records
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS education_entries jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.education_entries IS 'Array of education entries: [{institution, degree, year, speciality}]';
