-- Add new role for private practice specialists
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'private_specialist';