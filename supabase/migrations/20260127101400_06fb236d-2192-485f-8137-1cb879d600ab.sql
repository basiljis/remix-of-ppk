-- Добавить недостающий учебный год 2024-2025
INSERT INTO public.school_years (label, value, start_date, end_date, is_active)
VALUES 
  ('2024/2025', '2024-2025', '2024-09-01', '2025-08-31', true),
  ('2023/2024', '2023-2024', '2023-09-01', '2024-08-31', true),
  ('2022/2023', '2022-2023', '2022-09-01', '2023-08-31', true)
ON CONFLICT DO NOTHING;