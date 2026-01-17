-- Создаём таблицу ставок специалистов (привязка к конкретному пользователю)
CREATE TABLE public.specialist_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rate NUMERIC NOT NULL DEFAULT 1.0 CHECK (rate > 0 AND rate <= 2.0),
  set_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- RLS для specialist_rates
ALTER TABLE public.specialist_rates ENABLE ROW LEVEL SECURITY;

-- Админы видят всё
CREATE POLICY "Admins can manage all specialist rates"
ON public.specialist_rates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Администратор организации может управлять ставками в своей организации
CREATE POLICY "Organization admins can manage rates in their org"
ON public.specialist_rates
FOR ALL
USING (
  public.has_role(auth.uid(), 'organization_admin') 
  AND organization_id = public.get_user_organization(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'organization_admin') 
  AND organization_id = public.get_user_organization(auth.uid())
);

-- Пользователи могут видеть свою ставку
CREATE POLICY "Users can view own rate"
ON public.specialist_rates
FOR SELECT
USING (user_id = auth.uid());

-- Добавляем индексы
CREATE INDEX idx_specialist_rates_user_id ON public.specialist_rates(user_id);
CREATE INDEX idx_specialist_rates_organization_id ON public.specialist_rates(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_specialist_scheduled ON public.sessions(specialist_id, scheduled_date);

-- Триггер для updated_at
CREATE TRIGGER update_specialist_rates_updated_at
BEFORE UPDATE ON public.specialist_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Добавляем политики для organization_admin на другие таблицы
-- Children: org admin can manage children in their org
CREATE POLICY "Organization admins can manage children in their org"
ON public.children
FOR ALL
USING (
  public.has_role(auth.uid(), 'organization_admin') 
  AND organization_id = public.get_user_organization(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'organization_admin') 
  AND organization_id = public.get_user_organization(auth.uid())
);

-- Sessions: org admin can manage sessions in their org
CREATE POLICY "Organization admins can manage sessions in their org"
ON public.sessions
FOR ALL
USING (
  public.has_role(auth.uid(), 'organization_admin') 
  AND organization_id = public.get_user_organization(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'organization_admin') 
  AND organization_id = public.get_user_organization(auth.uid())
);