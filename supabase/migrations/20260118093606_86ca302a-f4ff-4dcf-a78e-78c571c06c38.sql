-- Добавим начальные настройки нагрузки для всех существующих должностей
INSERT INTO public.specialist_workload_settings (position_id, max_hours_per_week, max_hours_per_day, max_hours_per_year, hours_per_rate)
SELECT 
  id as position_id,
  36 as max_hours_per_week,
  8 as max_hours_per_day,
  1800 as max_hours_per_year,
  36 as hours_per_rate
FROM public.positions
ON CONFLICT DO NOTHING;