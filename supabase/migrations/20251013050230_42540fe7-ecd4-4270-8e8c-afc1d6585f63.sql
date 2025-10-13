-- Add "Руководитель организации" position
INSERT INTO public.positions (name)
VALUES ('Руководитель организации')
ON CONFLICT DO NOTHING;