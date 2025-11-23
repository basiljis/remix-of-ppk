-- Создание таблицы для запросов коммерческих предложений
CREATE TABLE IF NOT EXISTS public.commercial_offer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  inn TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Включение RLS
ALTER TABLE public.commercial_offer_requests ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "Anyone can create commercial offer requests"
  ON public.commercial_offer_requests
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all commercial offer requests"
  ON public.commercial_offer_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admins can update commercial offer requests"
  ON public.commercial_offer_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Индексы для производительности
CREATE INDEX idx_commercial_offer_requests_status ON public.commercial_offer_requests(status);
CREATE INDEX idx_commercial_offer_requests_created_at ON public.commercial_offer_requests(created_at DESC);