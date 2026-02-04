-- Add pricing fields for private practice specialists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS consultation_price INTEGER,
ADD COLUMN IF NOT EXISTS consultation_duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS session_packages JSONB DEFAULT '[]'::jsonb;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.consultation_price IS 'Price in rubles for single consultation';
COMMENT ON COLUMN public.profiles.consultation_duration IS 'Duration in minutes';
COMMENT ON COLUMN public.profiles.session_packages IS 'Array of session packages with count, price, and discount info';