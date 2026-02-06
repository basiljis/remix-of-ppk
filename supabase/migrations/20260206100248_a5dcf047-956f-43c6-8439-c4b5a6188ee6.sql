-- Add work_directions column to profiles for specialist work areas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS work_directions text[] DEFAULT '{}'::text[];