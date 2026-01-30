-- Parent tests system

-- Table for test definitions
CREATE TABLE public.parent_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scientific_basis TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  scoring_config JSONB, -- Configuration for calculating results
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_tests ENABLE ROW LEVEL SECURITY;

-- Policies for parent_tests
CREATE POLICY "Active tests are viewable by everyone"
ON public.parent_tests FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage tests"
ON public.parent_tests FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Table for test questions
CREATE TABLE public.parent_test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.parent_tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  dimension TEXT NOT NULL, -- What this question measures
  is_inverted BOOLEAN NOT NULL DEFAULT false, -- For reverse-scored questions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, question_number)
);

-- Enable RLS
ALTER TABLE public.parent_test_questions ENABLE ROW LEVEL SECURITY;

-- Policies for questions
CREATE POLICY "Questions are viewable if test is active"
ON public.parent_test_questions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.parent_tests 
  WHERE id = test_id AND is_active = true
));

CREATE POLICY "Admins can manage questions"
ON public.parent_test_questions FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Table for parent test results
CREATE TABLE public.parent_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES public.parent_children(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.parent_tests(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- {question_id: score}
  scores JSONB NOT NULL, -- Calculated dimension scores
  result_type TEXT NOT NULL, -- e.g., "authoritative", "authoritarian"
  result_label TEXT NOT NULL, -- Human-readable label
  risk_level TEXT, -- "low", "medium", "high"
  recommendations JSONB, -- Array of recommendations
  is_visible_to_specialists BOOLEAN NOT NULL DEFAULT false, -- Consent to share
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parent_test_results ENABLE ROW LEVEL SECURITY;

-- Policies for results
CREATE POLICY "Parents can view own test results"
ON public.parent_test_results FOR SELECT
USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can insert own test results"
ON public.parent_test_results FOR INSERT
WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update own test results"
ON public.parent_test_results FOR UPDATE
USING (parent_user_id = auth.uid());

CREATE POLICY "Admins can view all test results"
ON public.parent_test_results FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Specialists can view results if child is linked and consent given
CREATE POLICY "Specialists can view consented results"
ON public.parent_test_results FOR SELECT
USING (
  is_visible_to_specialists = true 
  AND EXISTS (
    SELECT 1 FROM public.linked_parent_children lpc
    WHERE lpc.parent_child_id = parent_test_results.child_id
    AND lpc.organization_id = get_user_organization(auth.uid())
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_parent_tests_updated_at
  BEFORE UPDATE ON public.parent_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parent_test_questions_updated_at
  BEFORE UPDATE ON public.parent_test_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parent_test_results_updated_at
  BEFORE UPDATE ON public.parent_test_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the first test: Parenting Style
INSERT INTO public.parent_tests (slug, title, description, scientific_basis, scoring_config, sort_order)
VALUES (
  'parenting-style',
  'Стиль моего родительства',
  'Тест разработан для интеграции в карточку ребенка как контекстуальный фактор развития — описание семейной среды, влияющей на динамику развития по 5 сферам (интеллектуальная, эмоциональная, социальная, моторная, речевая). Результаты помогают специалистам ППк точнее интерпретировать данные мониторинга и формировать персонализированные рекомендации.',
  'Тест адаптирован из классификации Д. Баумринд и В.В. Столина с учетом российской специфики',
  '{
    "dimensions": {
      "warmth": {"questions": [1, 6, 8, 11], "label": "Эмоциональная теплота"},
      "control": {"questions": [2, 4, 5, 7], "inverted": [5, 7], "label": "Гибкость границ"},
      "involvement": {"questions": [3, 9, 11], "label": "Вовлеченность"}
    },
    "styles": {
      "authoritative": {
        "label": "Авторитетный (сбалансированный)",
        "description": "Высокая теплота + разумный контроль",
        "risk": "low",
        "recommendations": [
          "Поддержка текущей стратегии",
          "Развитие эмоционального интеллекта",
          "Стиль способствует развитию самостоятельности и эмоциональной регуляции"
        ]
      },
      "authoritarian": {
        "label": "Авторитарный",
        "description": "Низкая теплота + жесткий контроль",
        "risk": "medium",
        "recommendations": [
          "Тренинг эмпатичного общения",
          "Гибкость правил",
          "Попробуйте игру «Да-нетки»: задавайте ребенку вопросы, на которые можно ответить только «да» или «нет». Это тренирует диалог без давления и развивает уверенность в выражении мнения"
        ]
      },
      "permissive": {
        "label": "Попустительский",
        "description": "Высокая теплота + слабый контроль",
        "risk": "medium",
        "recommendations": [
          "Установление чётких правил",
          "Последовательность в требованиях",
          "Баланс между любовью и границами"
        ]
      },
      "uninvolved": {
        "label": "Индифферентный",
        "description": "Низкая теплота + отсутствие контроля",
        "risk": "high",
        "recommendations": [
          "Рекомендуется консультация психолога",
          "Увеличение времени с ребёнком",
          "Развитие эмоциональной связи"
        ]
      }
    }
  }'::jsonb,
  1
);

-- Insert questions for parenting style test
WITH test AS (SELECT id FROM public.parent_tests WHERE slug = 'parenting-style')
INSERT INTO public.parent_test_questions (test_id, question_number, question_text, dimension, is_inverted)
SELECT 
  test.id,
  q.question_number,
  q.question_text,
  q.dimension,
  q.is_inverted
FROM test, (VALUES
  (1, 'Когда ребенок расстроен, я сначала выясняю причину, прежде чем реагировать', 'emotional_sensitivity', false),
  (2, 'Я устанавливаю четкие правила и ожидаю их выполнения без обсуждения', 'control_rigidity', false),
  (3, 'Если ребенок нарушает правила, мы вместе обсуждаем, как это исправить', 'dialogue', false),
  (4, 'Я часто говорю «нет» без объяснения причин', 'authoritarianism', false),
  (5, 'Ребенок сам решает, во сколько ложиться спать и что есть на ужин', 'freedom_boundaries', true),
  (6, 'Я хвалю ребенка за усилия, даже если результат не идеален', 'process_support', false),
  (7, 'Мне сложно сказать «нет», чтобы не расстраивать ребенка', 'permissiveness', true),
  (8, 'Я регулярно интересуюсь, что происходит в жизни ребенка вне дома', 'involvement', false),
  (9, 'Когда ребенок ошибается, я объясняю последствия его действий', 'teaching_approach', false),
  (10, 'Я часто чувствую усталость от родительских обязанностей и отстраняюсь', 'emotional_burnout', true),
  (11, 'Мы вместе планируем семейные дела и учитываем мнение ребенка', 'child_participation', false),
  (12, 'Я сравниваю достижения моего ребенка с другими детьми', 'external_evaluation', true)
) AS q(question_number, question_text, dimension, is_inverted);