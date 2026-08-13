
-- Таблица прочитанных новостей
CREATE TABLE IF NOT EXISTS public.user_read_news (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    news_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, news_id)
);

-- Гранты
GRANT SELECT, INSERT, DELETE ON public.user_read_news TO authenticated;
GRANT ALL ON public.user_read_news TO service_role;

-- RLS
ALTER TABLE public.user_read_news ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_read_news' 
        AND policyname = 'Users can manage their own read news'
    ) THEN
        CREATE POLICY "Users can manage their own read news"
        ON public.user_read_news
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
