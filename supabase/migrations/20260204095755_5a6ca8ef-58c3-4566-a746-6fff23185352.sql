-- Добавить поля публичного профиля для profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_private_practice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS public_slug VARCHAR(50),
ADD COLUMN IF NOT EXISTS public_bio TEXT,
ADD COLUMN IF NOT EXISTS public_photo_url TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS achievements TEXT,
ADD COLUMN IF NOT EXISTS specializations TEXT[];