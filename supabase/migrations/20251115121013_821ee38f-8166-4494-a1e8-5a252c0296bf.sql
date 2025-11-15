-- Create change_history table for audit logging
CREATE TABLE public.change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_data JSONB,
  new_data JSONB,
  changes_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.change_history ENABLE ROW LEVEL SECURITY;

-- Create index for better performance
CREATE INDEX idx_change_history_table_record ON public.change_history(table_name, record_id);
CREATE INDEX idx_change_history_changed_at ON public.change_history(changed_at DESC);

-- RLS Policies
CREATE POLICY "Admins can view all change history"
ON public.change_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Regional operators can view change history in their region"
ON public.change_history
FOR SELECT
USING (
  has_role(auth.uid(), 'regional_operator') 
  AND table_name IN ('protocols', 'access_requests')
);

CREATE POLICY "System can insert change history"
ON public.change_history
FOR INSERT
WITH CHECK (true);

-- Function to log changes
CREATE OR REPLACE FUNCTION public.log_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changes_text TEXT;
BEGIN
  -- Generate summary of changes
  IF TG_OP = 'UPDATE' THEN
    changes_text := 'Обновлено';
  ELSIF TG_OP = 'INSERT' THEN
    changes_text := 'Создано';
  ELSIF TG_OP = 'DELETE' THEN
    changes_text := 'Удалено';
  END IF;

  -- Insert change log
  INSERT INTO public.change_history (
    table_name,
    record_id,
    action,
    changed_by,
    old_data,
    new_data,
    changes_summary
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    changes_text
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for protocols table
CREATE TRIGGER log_protocols_changes
AFTER INSERT OR UPDATE OR DELETE ON public.protocols
FOR EACH ROW
EXECUTE FUNCTION public.log_change();

-- Create triggers for access_requests table
CREATE TRIGGER log_access_requests_changes
AFTER INSERT OR UPDATE OR DELETE ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.log_change();