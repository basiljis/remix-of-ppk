-- Расширение таблицы organizations для поддержки данных из ЕКИС API
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS status_id INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS status_name TEXT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_education_activity BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS parent_organization TEXT,
ADD COLUMN IF NOT EXISTS ekis_id TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS coordinates_lat DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS coordinates_lng DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS metro_station TEXT,
ADD COLUMN IF NOT EXISTS api_token TEXT,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Создание таблицы для хранения истории реорганизаций
CREATE TABLE IF NOT EXISTS public.organization_reorganizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type_name TEXT NOT NULL,
  event_comments TEXT,
  ekis_in TEXT,
  ekis_out TEXT,
  event_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы для детальных адресов организаций
CREATE TABLE IF NOT EXISTS public.organization_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL DEFAULT 'main',
  full_address TEXT NOT NULL,
  postal_code TEXT,
  region TEXT,
  city TEXT,
  street TEXT,
  building TEXT,
  is_main_building BOOLEAN DEFAULT FALSE,
  coordinates_lat DECIMAL(10,8),
  coordinates_lng DECIMAL(11,8),
  district TEXT,
  metro_station TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы для журналирования действий API
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  endpoint TEXT,
  request_data JSONB,
  response_data JSONB,
  status_code INTEGER,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы для хранения токенов сессий
CREATE TABLE IF NOT EXISTS public.api_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL DEFAULT 'educom',
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS для новых таблиц
ALTER TABLE public.organization_reorganizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_sessions ENABLE ROW LEVEL SECURITY;

-- Создание политик RLS для новых таблиц
CREATE POLICY "Organization reorganizations are viewable by everyone" 
ON public.organization_reorganizations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert organization reorganizations" 
ON public.organization_reorganizations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update organization reorganizations" 
ON public.organization_reorganizations 
FOR UPDATE 
USING (true);

CREATE POLICY "Organization addresses are viewable by everyone" 
ON public.organization_addresses 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert organization addresses" 
ON public.organization_addresses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update organization addresses" 
ON public.organization_addresses 
FOR UPDATE 
USING (true);

CREATE POLICY "API logs are viewable by everyone" 
ON public.api_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert API logs" 
ON public.api_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "API sessions are viewable by everyone" 
ON public.api_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert API sessions" 
ON public.api_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update API sessions" 
ON public.api_sessions 
FOR UPDATE 
USING (true);

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_organization_reorganizations_updated_at
BEFORE UPDATE ON public.organization_reorganizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_addresses_updated_at
BEFORE UPDATE ON public.organization_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_sessions_updated_at
BEFORE UPDATE ON public.api_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Создание индексов для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_organizations_ekis_id ON public.organizations(ekis_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status_id ON public.organizations(status_id);
CREATE INDEX IF NOT EXISTS idx_organizations_is_archived ON public.organizations(is_archived);
CREATE INDEX IF NOT EXISTS idx_organization_reorganizations_org_id ON public.organization_reorganizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_addresses_org_id ON public.organization_addresses(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_addresses_is_main ON public.organization_addresses(is_main_building);
CREATE INDEX IF NOT EXISTS idx_api_logs_action_type ON public.api_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON public.api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_sessions_service_name ON public.api_sessions(service_name);
CREATE INDEX IF NOT EXISTS idx_api_sessions_expires_at ON public.api_sessions(expires_at);