
-- Create table for specialist workload settings by position
CREATE TABLE public.specialist_workload_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  max_hours_per_week NUMERIC NOT NULL DEFAULT 36,
  max_hours_per_day NUMERIC NOT NULL DEFAULT 8,
  max_hours_per_year NUMERIC NOT NULL DEFAULT 1800,
  hours_per_rate NUMERIC NOT NULL DEFAULT 36,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(position_id)
);

-- Create table for session duration settings by age
CREATE TABLE public.session_duration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  age_from INTEGER NOT NULL,
  age_to INTEGER NOT NULL,
  age_label TEXT NOT NULL,
  session_duration_minutes INTEGER NOT NULL DEFAULT 30,
  max_sessions_per_day INTEGER NOT NULL DEFAULT 2,
  max_sessions_per_week INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(age_from, age_to)
);

-- Enable RLS
ALTER TABLE public.specialist_workload_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_duration_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for specialist_workload_settings
CREATE POLICY "Anyone can view specialist workload settings"
ON public.specialist_workload_settings
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert specialist workload settings"
ON public.specialist_workload_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update specialist workload settings"
ON public.specialist_workload_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete specialist workload settings"
ON public.specialist_workload_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for session_duration_settings
CREATE POLICY "Anyone can view session duration settings"
ON public.session_duration_settings
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert session duration settings"
ON public.session_duration_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update session duration settings"
ON public.session_duration_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete session duration settings"
ON public.session_duration_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_specialist_workload_settings_updated_at
BEFORE UPDATE ON public.specialist_workload_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_session_duration_settings_updated_at
BEFORE UPDATE ON public.session_duration_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default session duration settings by age groups
INSERT INTO public.session_duration_settings (age_from, age_to, age_label, session_duration_minutes, max_sessions_per_day, max_sessions_per_week)
VALUES 
  (0, 3, 'До 3 лет', 15, 1, 2),
  (3, 5, '3-5 лет', 20, 2, 4),
  (5, 7, '5-7 лет', 25, 2, 5),
  (7, 10, '7-10 лет', 30, 2, 5),
  (10, 14, '10-14 лет', 40, 3, 6),
  (14, 18, '14-18 лет', 45, 3, 6);
