
-- Child credentials for separate child login
CREATE TABLE public.child_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_child_id UUID REFERENCES public.parent_children(id) ON DELETE CASCADE NOT NULL,
  login VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plain_password TEXT, -- stored temporarily for parent to see
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Development materials (articles, exercises, videos)
CREATE TABLE public.development_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sphere_slug VARCHAR(50) NOT NULL, -- motor, speech, cognitive, social, emotional
  material_type VARCHAR(50) NOT NULL, -- article, exercise, video, pdf
  title TEXT NOT NULL,
  description TEXT,
  content TEXT, -- for articles
  exercise_steps JSONB, -- for exercises with steps
  image_url TEXT,
  video_url TEXT,
  pdf_url TEXT,
  duration_minutes INT,
  age_min_months INT,
  age_max_months INT,
  difficulty_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
  specialist_type VARCHAR(50), -- логопед, психолог, дефектолог
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Task blocks for children to complete
CREATE TABLE public.development_task_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sphere_slug VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  age_min_months INT,
  age_max_months INT,
  estimated_duration_minutes INT DEFAULT 10,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Individual tasks within blocks
CREATE TABLE public.development_block_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES public.development_task_blocks(id) ON DELETE CASCADE NOT NULL,
  task_type VARCHAR(50) NOT NULL, -- question, exercise, game, drawing
  title TEXT NOT NULL,
  instruction TEXT NOT NULL,
  content JSONB, -- flexible content structure
  image_url TEXT,
  video_url TEXT,
  correct_answer JSONB, -- for questions with answers
  points INT DEFAULT 10,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Child progress on task blocks
CREATE TABLE public.child_task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES public.parent_children(id) ON DELETE CASCADE NOT NULL,
  block_id UUID REFERENCES public.development_task_blocks(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.development_block_tasks(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed
  answer JSONB,
  score INT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(child_id, task_id)
);

-- Enable RLS
ALTER TABLE public.child_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_task_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_block_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_task_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for child_credentials
CREATE POLICY "Parents can view their children's credentials"
ON public.child_credentials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_children pc
    WHERE pc.id = child_credentials.parent_child_id
    AND pc.parent_user_id = auth.uid()
  )
);

CREATE POLICY "Parents can manage their children's credentials"
ON public.child_credentials FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.parent_children pc
    WHERE pc.id = child_credentials.parent_child_id
    AND pc.parent_user_id = auth.uid()
  )
);

-- RLS Policies for materials (public read)
CREATE POLICY "Anyone can view active materials"
ON public.development_materials FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage materials"
ON public.development_materials FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for task blocks (public read)
CREATE POLICY "Anyone can view active task blocks"
ON public.development_task_blocks FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage task blocks"
ON public.development_task_blocks FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for block tasks (public read)
CREATE POLICY "Anyone can view active block tasks"
ON public.development_block_tasks FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage block tasks"
ON public.development_block_tasks FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for child progress
CREATE POLICY "Parents can view their children's progress"
ON public.child_task_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_children pc
    WHERE pc.id = child_task_progress.child_id
    AND pc.parent_user_id = auth.uid()
  )
);

CREATE POLICY "Parents can manage their children's progress"
ON public.child_task_progress FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.parent_children pc
    WHERE pc.id = child_task_progress.child_id
    AND pc.parent_user_id = auth.uid()
  )
);

-- Function to generate child credentials
CREATE OR REPLACE FUNCTION public.generate_child_credentials(p_parent_child_id UUID)
RETURNS TABLE(login VARCHAR, password TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child_name TEXT;
  v_login VARCHAR(50);
  v_password TEXT;
  v_counter INT := 0;
BEGIN
  -- Get child name
  SELECT full_name INTO v_child_name
  FROM public.parent_children
  WHERE id = p_parent_child_id;
  
  -- Generate login based on child name
  v_login := lower(regexp_replace(v_child_name, '[^a-zA-Zа-яА-Я0-9]', '', 'g'));
  v_login := substring(v_login from 1 for 20);
  
  -- Add random suffix
  v_login := v_login || '_' || substring(gen_random_uuid()::text from 1 for 4);
  
  -- Generate random password
  v_password := substring(md5(random()::text) from 1 for 8);
  
  -- Insert or update credentials
  INSERT INTO public.child_credentials (parent_child_id, login, password_hash, plain_password)
  VALUES (p_parent_child_id, v_login, crypt(v_password, gen_salt('bf')), v_password)
  ON CONFLICT (parent_child_id) 
  DO UPDATE SET 
    login = EXCLUDED.login,
    password_hash = EXCLUDED.password_hash,
    plain_password = EXCLUDED.plain_password,
    updated_at = now();
  
  RETURN QUERY SELECT v_login, v_password;
END;
$$;

-- Insert sample materials for each sphere
INSERT INTO public.development_materials (sphere_slug, material_type, title, description, content, duration_minutes, specialist_type, sort_order) VALUES
-- Motor sphere
('motor', 'article', 'Развитие мелкой моторики у детей', 'Комплексное руководство по развитию мелкой моторики рук у детей дошкольного возраста', 
'<h2>Что такое мелкая моторика?</h2>
<p>Мелкая моторика — это способность выполнять точные движения кистями и пальцами рук. Развитие мелкой моторики напрямую связано с развитием речи и мышления ребенка.</p>
<h2>Упражнения для развития</h2>
<ul>
<li><strong>Пальчиковая гимнастика</strong> — ежедневные упражнения с пальцами развивают координацию</li>
<li><strong>Лепка из пластилина</strong> — укрепляет мышцы рук и развивает творческое мышление</li>
<li><strong>Рисование и раскрашивание</strong> — тренирует точность движений</li>
<li><strong>Игры с мелкими предметами</strong> — сортировка бусин, пуговиц (под присмотром взрослых)</li>
</ul>
<h2>Рекомендации специалистов</h2>
<p>Занимайтесь с ребенком регулярно по 10-15 минут в день. Важно создать позитивную атмосферу и не торопить малыша.</p>', 
15, 'дефектолог', 1),

('motor', 'exercise', 'Пальчиковая гимнастика "Семья"', 'Весёлое упражнение для развития мелкой моторики с участием всей семьи',
'<h2>Описание упражнения</h2>
<p>Это упражнение развивает координацию движений пальцев и помогает запомнить членов семьи.</p>
<h2>Как выполнять</h2>
<ol>
<li>Сожмите руку в кулак</li>
<li>По очереди разгибайте пальцы, начиная с большого</li>
<li>Произносите стишок: "Этот пальчик — дедушка, этот пальчик — бабушка..."</li>
<li>Повторите 3-5 раз для каждой руки</li>
</ol>',
5, 'логопед', 2),

('motor', 'exercise', 'Упражнение "Ножницы"', 'Тренировка точности движений с использованием безопасных ножниц',
'<h2>Цель упражнения</h2>
<p>Развитие координации и силы пальцев через работу с ножницами.</p>
<h2>Инструкция</h2>
<ol>
<li>Приготовьте безопасные детские ножницы и полоски бумаги</li>
<li>Покажите ребенку правильный захват ножниц</li>
<li>Начните с простых прямых разрезов</li>
<li>Постепенно переходите к вырезанию по линиям</li>
</ol>',
10, 'дефектолог', 3),

-- Speech sphere
('speech', 'article', 'Этапы развития речи ребёнка', 'Подробное описание нормального развития речи от рождения до 7 лет',
'<h2>Развитие речи по возрастам</h2>
<h3>0-6 месяцев</h3>
<p>Гуление, первые звуки. Ребенок начинает реагировать на голос родителей.</p>
<h3>6-12 месяцев</h3>
<p>Лепет, первые слоги ("ма-ма", "па-па"). Понимание простых слов.</p>
<h3>1-2 года</h3>
<p>Первые слова, простые фразы из 2 слов. Словарный запас 50-200 слов.</p>
<h3>2-3 года</h3>
<p>Фразовая речь, короткие предложения. Активное расширение словаря.</p>
<h3>3-5 лет</h3>
<p>Связная речь, рассказы. Освоение грамматики.</p>
<h2>Когда обращаться к специалисту</h2>
<p>Если к 2 годам ребенок не говорит простых слов или к 3 годам не строит фразы — рекомендуется консультация логопеда.</p>',
20, 'логопед', 1),

('speech', 'exercise', 'Артикуляционная гимнастика', 'Базовый комплекс упражнений для развития артикуляционного аппарата',
'<h2>Комплекс упражнений</h2>
<h3>1. "Улыбка"</h3>
<p>Широко улыбнитесь, показывая зубы. Удерживайте 5 секунд.</p>
<h3>2. "Трубочка"</h3>
<p>Вытяните губы вперед трубочкой. Удерживайте 5 секунд.</p>
<h3>3. "Часики"</h3>
<p>Двигайте языком влево-вправо, касаясь уголков рта.</p>
<h3>4. "Качели"</h3>
<p>Поднимайте и опускайте язык, касаясь верхних и нижних зубов.</p>
<h3>5. "Лошадка"</h3>
<p>Цокайте языком, как лошадка копытцами.</p>
<p><strong>Выполняйте каждое упражнение 5-10 раз ежедневно.</strong></p>',
10, 'логопед', 2),

-- Cognitive sphere
('cognitive', 'article', 'Развитие памяти у дошкольников', 'Методы и игры для тренировки памяти ребенка',
'<h2>Виды памяти у детей</h2>
<ul>
<li><strong>Зрительная память</strong> — запоминание образов</li>
<li><strong>Слуховая память</strong> — запоминание звуков и слов</li>
<li><strong>Моторная память</strong> — запоминание движений</li>
</ul>
<h2>Игры для развития памяти</h2>
<h3>"Что исчезло?"</h3>
<p>Разложите несколько предметов, дайте ребенку запомнить, уберите один. Ребенок должен назвать исчезнувший предмет.</p>
<h3>"Повтори последовательность"</h3>
<p>Покажите последовательность действий, попросите повторить.</p>
<h3>"Парные картинки"</h3>
<p>Классическая игра на поиск одинаковых карточек.</p>',
15, 'педагог-психолог', 1),

('cognitive', 'exercise', 'Логические задачки', 'Набор простых логических задач для развития мышления',
'<h2>Задачи на логику</h2>
<h3>Задача 1</h3>
<p>У Маши 3 яблока. Она дала Пете 1 яблоко. Сколько яблок осталось у Маши?</p>
<h3>Задача 2</h3>
<p>Что лишнее: яблоко, груша, морковь, банан?</p>
<h3>Задача 3</h3>
<p>Продолжи ряд: круг, квадрат, круг, квадрат, ...</p>
<h3>Задача 4</h3>
<p>Собака лает, кошка мяукает, а корова...?</p>
<p><strong>Обсуждайте ответы вместе с ребенком, объясняйте логику решения.</strong></p>',
10, 'дефектолог', 2),

-- Social sphere
('social', 'article', 'Социализация ребенка', 'Как помочь ребенку научиться общаться со сверстниками',
'<h2>Важность социальных навыков</h2>
<p>Умение общаться — один из ключевых навыков для успешной жизни. Социализация начинается в раннем детстве.</p>
<h2>Как развивать социальные навыки</h2>
<ul>
<li><strong>Игры с другими детьми</strong> — регулярное общение со сверстниками</li>
<li><strong>Ролевые игры</strong> — проигрывание разных социальных ситуаций</li>
<li><strong>Чтение книг о дружбе</strong> — обсуждение поведения героев</li>
<li><strong>Личный пример</strong> — дети копируют поведение родителей</li>
</ul>
<h2>Признаки проблем с социализацией</h2>
<p>Если ребенок избегает контакта со сверстниками, агрессивен или чрезмерно застенчив — стоит проконсультироваться с психологом.</p>',
15, 'педагог-психолог', 1),

('social', 'exercise', 'Ролевая игра "В магазине"', 'Игра для развития коммуникативных навыков',
'<h2>Подготовка</h2>
<p>Приготовьте игрушечные продукты или картинки, игрушечные деньги, сумку покупателя.</p>
<h2>Ход игры</h2>
<ol>
<li>Один игрок — продавец, другой — покупатель</li>
<li>Покупатель здоровается и просит товар</li>
<li>Продавец отвечает, называет цену</li>
<li>Покупатель благодарит и прощается</li>
<li>Поменяйтесь ролями</li>
</ol>
<h2>Чему учит игра</h2>
<p>Вежливое общение, умение просить, благодарить, ждать своей очереди.</p>',
15, 'педагог-психолог', 2),

-- Emotional sphere
('emotional', 'article', 'Эмоциональный интеллект ребенка', 'Как научить ребенка понимать и управлять эмоциями',
'<h2>Что такое эмоциональный интеллект?</h2>
<p>Это способность распознавать свои и чужие эмоции, понимать их причины и управлять ими.</p>
<h2>Как развивать EQ</h2>
<h3>Называйте эмоции</h3>
<p>"Ты сейчас злишься, потому что..." — помогайте ребенку осознавать свои чувства.</p>
<h3>Читайте книги об эмоциях</h3>
<p>Обсуждайте, что чувствуют герои и почему.</p>
<h3>Играйте в "Угадай эмоцию"</h3>
<p>Показывайте эмоции мимикой, пусть ребенок угадывает.</p>
<h3>Учите способам саморегуляции</h3>
<p>Дыхательные упражнения, счёт до 10, "место спокойствия".</p>',
20, 'психолог', 1),

('emotional', 'exercise', 'Дыхательные упражнения для успокоения', 'Простые техники для снятия стресса и тревоги',
'<h2>Упражнение "Воздушный шарик"</h2>
<ol>
<li>Представь, что в животе воздушный шарик</li>
<li>Медленно вдохни носом — шарик надувается</li>
<li>Задержи дыхание на 2 секунды</li>
<li>Медленно выдохни ртом — шарик сдувается</li>
<li>Повтори 5 раз</li>
</ol>
<h2>Упражнение "Задуй свечу"</h2>
<ol>
<li>Подними палец перед лицом — это свеча</li>
<li>Глубоко вдохни</li>
<li>Медленно выдохни, "задувая" свечу</li>
<li>Повтори 3-5 раз</li>
</ol>
<p><strong>Используйте эти упражнения, когда ребенок расстроен или взволнован.</strong></p>',
5, 'психолог', 2);

-- Insert sample task blocks
INSERT INTO public.development_task_blocks (sphere_slug, title, description, age_min_months, age_max_months, estimated_duration_minutes, sort_order) VALUES
('motor', 'Весёлые пальчики', 'Блок заданий на развитие мелкой моторики', 24, 60, 10, 1),
('motor', 'Ловкие ручки', 'Упражнения на координацию движений рук', 36, 72, 15, 2),
('speech', 'Говорим правильно', 'Артикуляционные упражнения и речевые игры', 24, 60, 10, 1),
('speech', 'Учимся рассказывать', 'Развитие связной речи', 48, 84, 15, 2),
('cognitive', 'Умные задачки', 'Логические задания и головоломки', 36, 72, 15, 1),
('cognitive', 'Тренируем память', 'Игры на развитие памяти и внимания', 24, 60, 10, 2),
('social', 'Дружим вместе', 'Задания на развитие социальных навыков', 36, 72, 15, 1),
('emotional', 'Мои эмоции', 'Учимся понимать и выражать чувства', 24, 72, 10, 1);

-- Insert sample tasks for blocks
INSERT INTO public.development_block_tasks (block_id, task_type, title, instruction, content, points, sort_order)
SELECT 
  b.id,
  'exercise',
  'Покажи пальчики',
  'Покажи по очереди все пальчики на правой руке, начиная с большого',
  '{"steps": ["Покажи большой палец", "Покажи указательный палец", "Покажи средний палец", "Покажи безымянный палец", "Покажи мизинец"]}'::jsonb,
  10,
  1
FROM public.development_task_blocks b WHERE b.title = 'Весёлые пальчики';

INSERT INTO public.development_block_tasks (block_id, task_type, title, instruction, content, points, sort_order)
SELECT 
  b.id,
  'game',
  'Собери пазл',
  'Соедини части картинки в правильном порядке',
  '{"type": "puzzle", "pieces": 4}'::jsonb,
  15,
  2
FROM public.development_task_blocks b WHERE b.title = 'Весёлые пальчики';

INSERT INTO public.development_block_tasks (block_id, task_type, title, instruction, content, points, sort_order)
SELECT 
  b.id,
  'question',
  'Что лишнее?',
  'Найди лишний предмет среди картинок',
  '{"options": ["яблоко", "груша", "машина", "банан"], "correct": 2}'::jsonb,
  10,
  1
FROM public.development_task_blocks b WHERE b.title = 'Умные задачки';

-- Create indexes for performance
CREATE INDEX idx_development_materials_sphere ON public.development_materials(sphere_slug);
CREATE INDEX idx_development_task_blocks_sphere ON public.development_task_blocks(sphere_slug);
CREATE INDEX idx_child_task_progress_child ON public.child_task_progress(child_id);
CREATE INDEX idx_child_credentials_login ON public.child_credentials(login);
