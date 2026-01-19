-- Create table for holiday session approval requests
CREATE TABLE public.holiday_session_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  holiday_id UUID REFERENCES public.organization_holidays(id) ON DELETE SET NULL,
  requested_by UUID NOT NULL,
  requested_date DATE NOT NULL,
  session_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.holiday_session_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view requests for their organization
CREATE POLICY "Users can view own organization requests"
  ON public.holiday_session_requests
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can create requests for their organization
CREATE POLICY "Users can create requests for own organization"
  ON public.holiday_session_requests
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND requested_by = auth.uid()
  );

-- Policy: Organization admins and directors can update requests
CREATE POLICY "Org admins can update requests"
  ON public.holiday_session_requests
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('organization_admin', 'director', 'admin')
    )
  );

-- Add index for performance
CREATE INDEX idx_holiday_session_requests_org ON public.holiday_session_requests(organization_id);
CREATE INDEX idx_holiday_session_requests_status ON public.holiday_session_requests(status);

-- Add trigger for updated_at
CREATE TRIGGER update_holiday_session_requests_updated_at
  BEFORE UPDATE ON public.holiday_session_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();