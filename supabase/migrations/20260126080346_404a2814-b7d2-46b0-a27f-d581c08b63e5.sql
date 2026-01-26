-- =============================================
-- 1. Create session_children table for group sessions
-- =============================================
CREATE TABLE public.session_children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT true,
  attendance_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, child_id)
);

-- Enable RLS
ALTER TABLE public.session_children ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view session children in their organization"
  ON public.session_children
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Users can insert session children in their organization"
  ON public.session_children
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.sessions 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Users can update session children in their organization"
  ON public.session_children
  FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM public.sessions 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Users can delete session children in their organization"
  ON public.session_children
  FOR DELETE
  USING (
    session_id IN (
      SELECT id FROM public.sessions 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Admins can manage all session children"
  ON public.session_children
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_session_children_updated_at
  BEFORE UPDATE ON public.session_children
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Add is_group flag to sessions table
-- =============================================
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_children_session_id ON public.session_children(session_id);
CREATE INDEX IF NOT EXISTS idx_session_children_child_id ON public.session_children(child_id);
CREATE INDEX IF NOT EXISTS idx_sessions_is_group ON public.sessions(is_group) WHERE is_group = true;