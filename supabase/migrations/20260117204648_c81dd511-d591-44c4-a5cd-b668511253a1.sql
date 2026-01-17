-- Создаём таблицу детей для привязки занятий
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  full_name TEXT NOT NULL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  education_level TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создаём таблицу занятий
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type_id UUID NOT NULL REFERENCES public.session_types(id),
  session_status_id UUID NOT NULL REFERENCES public.session_statuses(id),
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  actual_duration_minutes INTEGER,
  topic TEXT,
  notes TEXT,
  protocol_id UUID REFERENCES public.protocols(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS для таблицы детей
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all children"
ON public.children FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view children in their organization"
ON public.children FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can insert children in their organization"
ON public.children FOR INSERT
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can update children in their organization"
ON public.children FOR UPDATE
USING (organization_id = get_user_organization(auth.uid()));

-- RLS для таблицы занятий
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all sessions"
ON public.sessions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view sessions in their organization"
ON public.sessions FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can insert sessions in their organization"
ON public.sessions FOR INSERT
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can update sessions in their organization"
ON public.sessions FOR UPDATE
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Users can delete sessions in their organization"
ON public.sessions FOR DELETE
USING (organization_id = get_user_organization(auth.uid()));

-- Индексы для производительности
CREATE INDEX idx_sessions_organization_id ON public.sessions(organization_id);
CREATE INDEX idx_sessions_child_id ON public.sessions(child_id);
CREATE INDEX idx_sessions_specialist_id ON public.sessions(specialist_id);
CREATE INDEX idx_sessions_scheduled_date ON public.sessions(scheduled_date);
CREATE INDEX idx_children_organization_id ON public.children(organization_id);

-- Триггер для обновления updated_at
CREATE TRIGGER update_children_updated_at
BEFORE UPDATE ON public.children
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();