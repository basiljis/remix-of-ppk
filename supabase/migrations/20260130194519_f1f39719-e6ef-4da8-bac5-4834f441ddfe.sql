-- Тест "Мой ребенок растет" - мониторинг развития по 5 сферам

-- Таблица тестов развития
CREATE TABLE public.child_development_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Возрастные группы
CREATE TABLE public.development_age_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.child_development_tests(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- "0–3 года", "3–7 лет" и т.д.
  min_months INTEGER NOT NULL, -- минимальный возраст в месяцах
  max_months INTEGER NOT NULL, -- максимальный возраст в месяцах
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Сферы развития
CREATE TABLE public.development_spheres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.child_development_tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Моторное развитие", "Речевое развитие" и т.д.
  slug TEXT NOT NULL, -- "motor", "speech", "cognitive", "social", "emotional"
  icon TEXT, -- иконка для отображения
  color TEXT, -- цвет для радара
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Задания/вопросы для каждой возрастной группы и сферы
CREATE TABLE public.development_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sphere_id UUID NOT NULL REFERENCES public.development_spheres(id) ON DELETE CASCADE,
  age_group_id UUID NOT NULL REFERENCES public.development_age_groups(id) ON DELETE CASCADE,
  task_text TEXT NOT NULL, -- Текст задания
  age_range_hint TEXT, -- Подсказка по возрасту внутри группы "6–8 мес"
  video_demo_title TEXT, -- Заголовок видео-примера
  video_demo_url TEXT, -- URL видео-примера
  allows_media_upload BOOLEAN NOT NULL DEFAULT true, -- Можно прикрепить фото/видео
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Результаты прохождения теста
CREATE TABLE public.development_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.parent_children(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL,
  test_id UUID NOT NULL REFERENCES public.child_development_tests(id),
  age_group_id UUID NOT NULL REFERENCES public.development_age_groups(id),
  child_age_months INTEGER NOT NULL, -- Возраст ребенка на момент теста
  answers JSONB NOT NULL DEFAULT '[]', -- Массив ответов [{task_id, answer, media_urls}]
  sphere_scores JSONB NOT NULL DEFAULT '{}', -- Результаты по сферам {motor: 80, speech: 100, ...}
  overall_risk_level TEXT NOT NULL DEFAULT 'normal', -- normal, attention, help_needed
  recommendations JSONB, -- Персонализированные рекомендации
  next_test_date DATE, -- Следующий рекомендуемый тест
  consent_given BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Медиа-файлы к ответам (фото/видео доказательства)
CREATE TABLE public.development_test_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  result_id UUID NOT NULL REFERENCES public.development_test_results(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.development_tasks(id),
  media_type TEXT NOT NULL, -- 'photo' или 'video'
  storage_path TEXT NOT NULL, -- Путь в storage
  original_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.child_development_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_spheres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_test_media ENABLE ROW LEVEL SECURITY;

-- Policies для тестов (публичный просмотр активных)
CREATE POLICY "Active tests are viewable by everyone" 
ON public.child_development_tests FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage tests" 
ON public.child_development_tests FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policies для возрастных групп
CREATE POLICY "Age groups viewable if test is active" 
ON public.development_age_groups FOR SELECT 
USING (EXISTS (SELECT 1 FROM child_development_tests WHERE id = test_id AND is_active = true));

CREATE POLICY "Admins can manage age groups" 
ON public.development_age_groups FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policies для сфер развития
CREATE POLICY "Spheres viewable if test is active" 
ON public.development_spheres FOR SELECT 
USING (EXISTS (SELECT 1 FROM child_development_tests WHERE id = test_id AND is_active = true));

CREATE POLICY "Admins can manage spheres" 
ON public.development_spheres FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policies для заданий
CREATE POLICY "Tasks viewable if related test is active" 
ON public.development_tasks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM development_spheres s 
  JOIN child_development_tests t ON t.id = s.test_id 
  WHERE s.id = sphere_id AND t.is_active = true
));

CREATE POLICY "Admins can manage tasks" 
ON public.development_tasks FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policies для результатов теста
CREATE POLICY "Parents can view own test results" 
ON public.development_test_results FOR SELECT 
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can insert own test results" 
ON public.development_test_results FOR INSERT 
WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update own test results" 
ON public.development_test_results FOR UPDATE 
USING (parent_user_id = auth.uid());

CREATE POLICY "Admins can view all test results" 
ON public.development_test_results FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Specialists can view linked children results" 
ON public.development_test_results FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM linked_parent_children lpc
  WHERE lpc.parent_child_id = development_test_results.child_id 
  AND lpc.organization_id = get_user_organization(auth.uid())
));

-- Policies для медиа
CREATE POLICY "Parents can view own media" 
ON public.development_test_media FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM development_test_results r 
  WHERE r.id = result_id AND r.parent_user_id = auth.uid()
));

CREATE POLICY "Parents can insert own media" 
ON public.development_test_media FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM development_test_results r 
  WHERE r.id = result_id AND r.parent_user_id = auth.uid()
));

CREATE POLICY "Parents can delete own media" 
ON public.development_test_media FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM development_test_results r 
  WHERE r.id = result_id AND r.parent_user_id = auth.uid()
));

-- Storage bucket для медиа теста развития
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('development-test-media', 'development-test-media', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Parents can upload own child media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'development-test-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Parents can view own child media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'development-test-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Parents can delete own child media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'development-test-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Вставка начальных данных теста
INSERT INTO public.child_development_tests (id, title, description, slug) VALUES
('a0000000-0000-0000-0000-000000000001', 'Мой ребенок растет', 'Инструмент мониторинга развития по 5 сферам. Интегрируется в карточку ребенка системы UNIVERSUM.', 'child-growth');

-- Возрастные группы
INSERT INTO public.development_age_groups (id, test_id, label, min_months, max_months, sort_order) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '0–3 года', 0, 36, 1),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '3–7 лет', 36, 84, 2),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '7–10 лет', 84, 120, 3),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '10–14 лет', 120, 168, 4),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '14–18 лет', 168, 216, 5);

-- Сферы развития
INSERT INTO public.development_spheres (id, test_id, name, slug, icon, color, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Моторное развитие', 'motor', 'activity', '#3B82F6', 1),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Речевое развитие', 'speech', 'message-circle', '#10B981', 2),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Познавательное развитие', 'cognitive', 'brain', '#8B5CF6', 3),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Социально-коммуникативное', 'social', 'users', '#F59E0B', 4),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Эмоционально-волевое', 'emotional', 'heart', '#EF4444', 5);

-- Задания для каждой возрастной группы и сферы
-- МОТОРНОЕ РАЗВИТИЕ (0-3 года)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Самостоятельно садится без поддержки', '6–8 мес', 'Как проверить навык сидения', 1),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ползает на четвереньках', '8–10 мес', 'Как проверить навык ползания', 2),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ходит самостоятельно', '12–15 мес', 'Первые шаги ребенка', 3),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Строит башню из 3–4 кубиков', '1.5–2 года', 'Строим башню вместе', 4),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Рисует вертикальную линию по образцу', '2–3 года', 'Учимся рисовать линии', 5);

-- МОТОРНОЕ РАЗВИТИЕ (3-7 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Прыгает на двух ногах', '3–4 года', 'Прыжки через линию', 1),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Рисует человека из 3–4 частей', '4–5 лет', 'Рисуем человечка', 2),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Застегивает пуговицы', '5–6 лет', 'Учимся застегивать', 3),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Режет ножницами по прямой линии', '6–7 лет', 'Работа с ножницами', 4);

-- МОТОРНОЕ РАЗВИТИЕ (7-10 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Пишет печатными буквами разборчиво', '7–8 лет', 'Проверка письма', 1),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Завязывает шнурки самостоятельно', '7–8 лет', 'Завязываем шнурки за 30 сек', 2),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Ловит мяч двумя руками на расстоянии 3 м', '8–10 лет', 'Ловля мяча', 3);

-- МОТОРНОЕ РАЗВИТИЕ (10-14 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Выполняет упражнения на равновесие (стойка на одной ноге 10+ сек)', NULL, 'Тест на равновесие', 1),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Координирует движения в спортивных играх', NULL, 'Координация в игре', 2);

-- МОТОРНОЕ РАЗВИТИЕ (14-18 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'Выполняет сложные двигательные комбинации', NULL, 'Сложные движения', 1),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'Поддерживает физическую активность 3+ раза в неделю', NULL, 'Оценка выносливости', 2);

-- РЕЧЕВОЕ РАЗВИТИЕ (0-3 года)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Гулит в ответ на речь взрослого', '2–4 мес', 'Первое гуление', 1),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Произносит первые слова', '10–14 мес', 'Первые слова ребенка', 2),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Называет 5+ предметов на картинке', '1.5–2 года', 'Играем в "Где мяч?"', 3),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Составляет предложения из 3–4 слов', '2–3 года', 'Первые предложения', 4);

-- РЕЧЕВОЕ РАЗВИТИЕ (3-7 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Рассказывает короткий рассказ по картинке', '4–5 лет', 'Рассказ по картинке', 1),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Использует предлоги (в, на, под)', '5–6 лет', 'Игра с предлогами', 2),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Пересказывает сказку своими словами', '6–7 лет', 'Пересказываем "Колобок"', 3);

-- РЕЧЕВОЕ РАЗВИТИЕ (7-10 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'Читает текст вслух без ошибок', '7–8 лет', 'Проверяем чтение', 1),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'Составляет связный текст из 5–7 предложений', '8–10 лет', 'Написание текста', 2);

-- РЕЧЕВОЕ РАЗВИТИЕ (10-14 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Аргументирует свою точку зрения устно', NULL, 'Дискуссия на тему', 1),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'Использует сложные грамматические конструкции', NULL, 'Сложные предложения', 2);

-- РЕЧЕВОЕ РАЗВИТИЕ (14-18 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'Ведет публичную речь (презентация)', NULL, 'Подготовка презентации', 1),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'Анализирует тексты разного стиля', NULL, 'Анализ текста', 2);

-- ПОЗНАВАТЕЛЬНОЕ РАЗВИТИЕ (0-3 года)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Находит спрятанную игрушку', '8–12 мес', 'Игра "Найди игрушку"', 1),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Сортирует предметы по цвету', '2–3 года', 'Сортировка по цветам', 2),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Считает до 5', '2.5–3 года', 'Счет до 5', 3);

-- ПОЗНАВАТЕЛЬНОЕ РАЗВИТИЕ (3-7 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Знает 4 времени года', '4–5 лет', 'Сезоны года', 1),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Решает простые логические задачи', '5–6 лет', 'Логические загадки', 2),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'Читает цифры до 20', '6–7 лет', 'Числа до 20', 3);

-- ПОЗНАВАТЕЛЬНОЕ РАЗВИТИЕ (7-10 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Решает задачи в 2 действия', '8–10 лет', 'Математика в быту', 1),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Ориентируется во времени (часы, календарь)', '7–10 лет', 'Время и календарь', 2);

-- ПОЗНАВАТЕЛЬНОЕ РАЗВИТИЕ (10-14 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'Анализирует причинно-следственные связи', NULL, 'Логический анализ', 1),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'Планирует выполнение проекта', NULL, 'Учимся планировать', 2);

-- ПОЗНАВАТЕЛЬНОЕ РАЗВИТИЕ (14-18 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'Критически оценивает информацию', NULL, 'Проверка фактов', 1),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'Строит логические цепочки аргументов', NULL, 'Аргументация', 2);

-- СОЦИАЛЬНО-КОММУНИКАТИВНОЕ (0-3 года)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Улыбается в ответ на улыбку', '2–3 мес', 'Первые социальные реакции', 1),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Играет рядом с другими детьми', '1.5–2 года', 'Параллельная игра', 2),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Делится игрушкой по просьбе', '2–3 года', 'Учимся делиться', 3);

-- СОЦИАЛЬНО-КОММУНИКАТИВНОЕ (3-7 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Играет в ролевые игры с правилами', '4–5 лет', 'Играем в магазин', 1),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Договаривается с детьми без помощи взрослого', '5–6 лет', 'Самостоятельные договоренности', 2),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'Соблюдает правила игры', '6–7 лет', 'Правила игры', 3);

-- СОЦИАЛЬНО-КОММУНИКАТИВНОЕ (7-10 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Работает в команде над проектом', NULL, 'Командная игра', 1),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'Разрешает конфликты словами', NULL, 'Решение конфликтов', 2);

-- СОЦИАЛЬНО-КОММУНИКАТИВНОЕ (10-14 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Проявляет эмпатию к сверстникам', NULL, 'Разговор о чувствах', 1),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'Строит дружеские отношения', NULL, 'Дружба', 2);

-- СОЦИАЛЬНО-КОММУНИКАТИВНОЕ (14-18 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'Строит конструктивный диалог с разными людьми', NULL, 'Дебаты', 1),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'Проявляет гражданскую позицию', NULL, 'Гражданская активность', 2);

-- ЭМОЦИОНАЛЬНО-ВОЛЕВОЕ (0-3 года)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Успокаивается с помощью взрослого', '0–6 мес', 'Успокоение малыша', 1),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Проявляет радость при виде близких', '6–12 мес', 'Радость узнавания', 2),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Называет 3 базовые эмоции', '2–3 года', 'Эмоции на лице', 3);

-- ЭМОЦИОНАЛЬНО-ВОЛЕВОЕ (3-7 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Ждет своей очереди', '4–5 лет', 'Учимся ждать', 1),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Справляется с расстройством без истерики', '5–6 лет', 'Управление эмоциями', 2),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'Выражает эмоции словами, а не агрессией', '6–7 лет', 'Дышим, когда злимся', 3);

-- ЭМОЦИОНАЛЬНО-ВОЛЕВОЕ (7-10 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Завершает начатое дело', NULL, 'Доводим до конца', 1),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Адекватно реагирует на критику', NULL, 'Учимся принимать "нет"', 2);

-- ЭМОЦИОНАЛЬНО-ВОЛЕВОЕ (10-14 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Самостоятельно регулирует эмоции в стрессе', NULL, 'Стресс-менеджмент', 1),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'Проявляет устойчивость к давлению сверстников', NULL, 'Устойчивость к давлению', 2);

-- ЭМОЦИОНАЛЬНО-ВОЛЕВОЕ (14-18 лет)
INSERT INTO public.development_tasks (sphere_id, age_group_id, task_text, age_range_hint, video_demo_title, sort_order) VALUES
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Осознает свои эмоциональные триггеры', NULL, 'Самопознание', 1),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'Строит здоровые границы в отношениях', NULL, 'Эмоциональный интеллект', 2);

-- Индексы для производительности
CREATE INDEX idx_development_tasks_sphere ON public.development_tasks(sphere_id);
CREATE INDEX idx_development_tasks_age_group ON public.development_tasks(age_group_id);
CREATE INDEX idx_development_test_results_child ON public.development_test_results(child_id);
CREATE INDEX idx_development_test_results_parent ON public.development_test_results(parent_user_id);
CREATE INDEX idx_development_test_results_completed ON public.development_test_results(completed_at) WHERE is_completed = true;