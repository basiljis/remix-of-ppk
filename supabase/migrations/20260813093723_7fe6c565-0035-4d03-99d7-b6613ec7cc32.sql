DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'blog_category' AND e.enumlabel = 'news') THEN
        ALTER TYPE public.blog_category ADD VALUE 'news';
    END IF;
END $$;

INSERT INTO public.blog_posts (
    slug, title, title_en, excerpt, excerpt_en, content, content_en, 
    category, author, published, published_at
) VALUES (
    'blog-launch-news',
    'Открытие Блога: Читайте, комментируйте и делитесь опытом!',
    'Blog Launch: Read, Comment, and Share Experience!',
    'Запуск профессионального блога для специалистов системы сопровождения с возможностью оставлять отзывы и обсуждать статьи.',
    'Launch of a professional blog for support specialists with the ability to leave feedback and discuss articles.',
    '<p>Мы рады объявить о запуске официального Блога в системе «Универсум»! Теперь это не просто инструмент для работы, но и пространство для обмена опытом, изучения новых методик и обсуждения актуальных вопросов профессиональной деятельности.</p><h2>Что нового в Блоге?</h2><ul><li><strong>Профессиональные статьи:</strong> Глубокая аналитика, разбор нормативно-правовых актов и практические рекомендации.</li><li><strong>Новости системы:</strong> Узнавайте первыми о выходе новых функций и обновлений.</li><li><strong>Интерактивность и отзывы:</strong> Теперь вы можете оставлять свои комментарии и отзывы под каждой статьей.</li></ul><p>Присоединяйтесь к обсуждению и помогайте нам развивать систему!</p>',
    '<p>We are excited to announce the launch of the official Blog in the Universum system! Now it is not just a tool for work, but also a space for sharing experience and discussing professional issues.</p><h2>What is new?</h2><ul><li><strong>Professional articles:</strong> Deep analysis and practical recommendations.</li><li><strong>System News:</strong> Be the first to know about new features.</li><li><strong>Interactivity and feedback:</strong> You can now leave comments and feedback under each article.</li></ul><p>Join the discussion and help us develop the system!</p>',
    'news'::public.blog_category,
    'Команда universum.',
    true,
    now()
) ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    category = EXCLUDED.category;