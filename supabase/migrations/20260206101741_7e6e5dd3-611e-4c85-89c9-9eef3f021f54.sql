-- Add certificate_images JSONB column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS certificate_images jsonb DEFAULT '[]'::jsonb;