-- Типы занятий (индивидуальное / групповое)
CREATE TABLE public.session_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Статусы занятий (запланировано, проведено, отменено)
CREATE TABLE public.session_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_statuses ENABLE ROW LEVEL SECURITY;

-- RLS policies for session_types
CREATE POLICY "Anyone can view session types" ON public.session_types FOR SELECT USING (true);
CREATE POLICY "Only admins can insert session types" ON public.session_types FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update session types" ON public.session_types FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete session types" ON public.session_types FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for session_statuses
CREATE POLICY "Anyone can view session statuses" ON public.session_statuses FOR SELECT USING (true);
CREATE POLICY "Only admins can insert session statuses" ON public.session_statuses FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update session statuses" ON public.session_statuses FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete session statuses" ON public.session_statuses FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default session types
INSERT INTO public.session_types (name, description, sort_order) VALUES
  ('Индивидуальное', 'Индивидуальное занятие с одним ребенком', 1),
  ('Групповое', 'Групповое занятие с несколькими детьми', 2);

-- Insert default session statuses
INSERT INTO public.session_statuses (name, description, color, sort_order) VALUES
  ('Запланировано', 'Занятие запланировано и ожидает проведения', '#3b82f6', 1),
  ('Проведено', 'Занятие успешно проведено', '#22c55e', 2),
  ('Отменено', 'Занятие было отменено', '#ef4444', 3);