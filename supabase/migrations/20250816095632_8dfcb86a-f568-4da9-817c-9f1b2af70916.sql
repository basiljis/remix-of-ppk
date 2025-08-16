-- Очистка старых данных организаций и замена их данными из ЕКИС API
-- Сначала удаляем все существующие данные
TRUNCATE TABLE public.organizations CASCADE;

-- Сбрасываем все связанные данные в других таблицах
TRUNCATE TABLE public.organization_addresses CASCADE;
TRUNCATE TABLE public.organization_reorganizations CASCADE;