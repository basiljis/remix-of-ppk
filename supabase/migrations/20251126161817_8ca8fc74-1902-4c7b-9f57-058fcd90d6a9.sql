-- Создание таблицы для логов ошибок
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_name VARCHAR(255),
  route VARCHAR(500),
  user_agent TEXT,
  browser_info JSONB,
  severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Индексы для быстрого поиска
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);

-- RLS политики
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Только админы могут читать логи ошибок
CREATE POLICY "Admins can view all error logs"
  ON public.error_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Только админы могут обновлять логи (помечать как resolved)
CREATE POLICY "Admins can update error logs"
  ON public.error_logs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Authenticated пользователи могут создавать логи (через edge function с service key)
CREATE POLICY "Authenticated users can create error logs"
  ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.error_logs IS 'Централизованное хранилище логов ошибок приложения';
COMMENT ON COLUMN public.error_logs.severity IS 'Уровень серьезности: info, warning, error, critical';
COMMENT ON COLUMN public.error_logs.metadata IS 'Дополнительные данные: состояние приложения, параметры запроса и т.д.';