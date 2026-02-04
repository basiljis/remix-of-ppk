-- Уникальный индекс для slug профилей
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_slug_unique 
ON public.profiles(public_slug) 
WHERE public_slug IS NOT NULL;

-- Индекс для опубликованных профилей
CREATE INDEX IF NOT EXISTS idx_profiles_published 
ON public.profiles(is_published) 
WHERE is_published = true;

-- RLS политика для публичного доступа к профилям специалистов
DROP POLICY IF EXISTS "Public can view published specialist profiles" ON public.profiles;
CREATE POLICY "Public can view published specialist profiles"
  ON public.profiles
  FOR SELECT
  TO anon
  USING (
    (is_published = true AND is_private_practice = true)
    OR (
      is_published = true 
      AND organization_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM public.organizations o 
        WHERE o.id = profiles.organization_id 
        AND o.is_published = true 
        AND o.allow_employee_publishing = true
      )
    )
  );