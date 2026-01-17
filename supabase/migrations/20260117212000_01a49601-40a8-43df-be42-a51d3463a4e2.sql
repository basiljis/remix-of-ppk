-- Добавляем новую роль organization_admin в enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organization_admin';