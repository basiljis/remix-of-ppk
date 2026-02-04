-- Add new position: Специалист адаптивной физической культуры
INSERT INTO public.positions (id, name, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Специалист адаптивной физической культуры',
  now(),
  now()
)
ON CONFLICT DO NOTHING;