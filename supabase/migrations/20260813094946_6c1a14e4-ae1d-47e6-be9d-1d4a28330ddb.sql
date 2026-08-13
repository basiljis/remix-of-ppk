-- 1. Table for tracking versions/updates to the legal base
CREATE TABLE IF NOT EXISTS public.legal_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    version_label TEXT NOT NULL, -- e.g. "Август 2026"
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    changes JSONB NOT NULL DEFAULT '[]'::jsonb, -- List of specific changes
    is_major BOOLEAN DEFAULT false
);

GRANT SELECT ON public.legal_updates TO anon, authenticated;
GRANT ALL ON public.legal_updates TO service_role;

ALTER TABLE public.legal_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Legal updates are publicly viewable" ON public.legal_updates FOR SELECT TO anon, authenticated USING (true);

-- 2. Table for legal update subscriptions
CREATE TABLE IF NOT EXISTS public.legal_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    email TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    push_subscription JSONB -- For future push notifications
);

GRANT SELECT, INSERT, UPDATE ON public.legal_subscriptions TO anon, authenticated;
GRANT ALL ON public.legal_subscriptions TO service_role;

ALTER TABLE public.legal_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subscriptions" 
ON public.legal_subscriptions 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can subscribe" 
ON public.legal_subscriptions 
FOR INSERT 
TO anon 
WITH CHECK (user_id IS NULL);

-- 3. Initial sample data for legal updates
INSERT INTO public.legal_updates (version_label, title, description, changes, is_major)
VALUES 
('1.2.0', 'Обновление Август 2026', 'Актуализация ссылок на Timeweb Cloud и уточнение ФЗ-152.', '[{"type":"update","doc":"ФЗ-152","text":"Обновлены ссылки на сертификаты безопасности Timeweb Cloud (UZ-1)."},{"type":"add","doc":"Приказ ДОНМ №666","text":"Добавлены разъяснения по срокам хранения документации ППк."}]'::jsonb, true),
('1.1.0', 'Июльское уточнение', 'Добавлены ссылки на СанПиН для образовательных организаций.', '[{"type":"add","doc":"СанПиН","text":"Добавлен раздел по гигиеническим нормативам в школах."}]'::jsonb, false);
