-- Add work format fields to profiles for specialists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS work_format TEXT DEFAULT 'offline' CHECK (work_format IN ('online', 'offline', 'both')),
ADD COLUMN IF NOT EXISTS work_district TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.work_format IS 'Формат работы специалиста: online, offline, both';
COMMENT ON COLUMN public.profiles.work_district IS 'Округ работы для офлайн специалистов в Москве';