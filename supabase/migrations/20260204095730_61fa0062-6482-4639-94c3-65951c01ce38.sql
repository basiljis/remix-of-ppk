-- Добавить поля публичного профиля для организаций (часть может уже существовать)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS public_slug VARCHAR(50);
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS public_description TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS allow_employee_publishing BOOLEAN DEFAULT true;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Уникальный индекс для slug организаций
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_public_slug_unique 
ON public.organizations(public_slug) 
WHERE public_slug IS NOT NULL;

-- Индекс для опубликованных организаций
CREATE INDEX IF NOT EXISTS idx_organizations_published 
ON public.organizations(is_published) 
WHERE is_published = true;

-- RLS политика для публичного доступа к организациям
DROP POLICY IF EXISTS "Public can view published organizations" ON public.organizations;
CREATE POLICY "Public can view published organizations"
  ON public.organizations
  FOR SELECT
  TO anon
  USING (is_published = true);