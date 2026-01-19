-- Create table for organization holidays/non-working days
CREATE TABLE public.organization_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, holiday_date)
);

-- Enable RLS
ALTER TABLE public.organization_holidays ENABLE ROW LEVEL SECURITY;

-- Create policies for organization holidays
CREATE POLICY "Users can view holidays of their organization" 
ON public.organization_holidays 
FOR SELECT 
USING (
  organization_id = get_user_organization(auth.uid())
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Org admins and directors can manage holidays" 
ON public.organization_holidays 
FOR ALL 
USING (
  (organization_id = get_user_organization(auth.uid()) 
   AND (has_role(auth.uid(), 'organization_admin') OR has_role(auth.uid(), 'director')))
  OR has_role(auth.uid(), 'admin')
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_organization_holidays_updated_at
BEFORE UPDATE ON public.organization_holidays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_organization_holidays_org_date ON public.organization_holidays(organization_id, holiday_date);