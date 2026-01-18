-- 1. Create employee_permissions table to manage granular access
CREATE TABLE public.employee_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- PPK Section Permissions
  ppk_view BOOLEAN NOT NULL DEFAULT false,
  ppk_edit BOOLEAN NOT NULL DEFAULT false,
  ppk_create BOOLEAN NOT NULL DEFAULT false,
  
  -- Organization Section Permissions
  org_view BOOLEAN NOT NULL DEFAULT false,
  org_edit BOOLEAN NOT NULL DEFAULT false,
  
  -- Schedule Permissions
  schedule_personal BOOLEAN NOT NULL DEFAULT true,
  schedule_organization BOOLEAN NOT NULL DEFAULT false,
  
  -- Statistics Permissions
  statistics_view BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID,
  
  UNIQUE (user_id, organization_id)
);

-- 2. Create work_schedule table for employee weekly schedules
CREATE TABLE public.work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Daily work hours (null = day off)
  monday_start TIME,
  monday_end TIME,
  tuesday_start TIME,
  tuesday_end TIME,
  wednesday_start TIME,
  wednesday_end TIME,
  thursday_start TIME,
  thursday_end TIME,
  friday_start TIME,
  friday_end TIME,
  saturday_start TIME,
  saturday_end TIME,
  sunday_start TIME,
  sunday_end TIME,
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, organization_id)
);

-- 3. Enable RLS on new tables
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies for employee_permissions
CREATE POLICY "Admins can manage all employee permissions"
ON public.employee_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage employee permissions in their org"
ON public.employee_permissions
FOR ALL
USING (
  has_role(auth.uid(), 'director') AND 
  organization_id = get_user_organization(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'director') AND 
  organization_id = get_user_organization(auth.uid())
);

CREATE POLICY "Organization admins can manage employee permissions in their org"
ON public.employee_permissions
FOR ALL
USING (
  has_role(auth.uid(), 'organization_admin') AND 
  organization_id = get_user_organization(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'organization_admin') AND 
  organization_id = get_user_organization(auth.uid())
);

CREATE POLICY "Users can view their own permissions"
ON public.employee_permissions
FOR SELECT
USING (user_id = auth.uid());

-- 5. RLS policies for work_schedules
CREATE POLICY "Admins can manage all work schedules"
ON public.work_schedules
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Directors can manage work schedules in their org"
ON public.work_schedules
FOR ALL
USING (
  has_role(auth.uid(), 'director') AND 
  organization_id = get_user_organization(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'director') AND 
  organization_id = get_user_organization(auth.uid())
);

CREATE POLICY "Organization admins can manage work schedules in their org"
ON public.work_schedules
FOR ALL
USING (
  has_role(auth.uid(), 'organization_admin') AND 
  organization_id = get_user_organization(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'organization_admin') AND 
  organization_id = get_user_organization(auth.uid())
);

CREATE POLICY "Users can view their own work schedule"
ON public.work_schedules
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can view work schedules in their organization"
ON public.work_schedules
FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

-- 6. Add indexes for performance
CREATE INDEX idx_employee_permissions_user_id ON public.employee_permissions(user_id);
CREATE INDEX idx_employee_permissions_org_id ON public.employee_permissions(organization_id);
CREATE INDEX idx_work_schedules_user_id ON public.work_schedules(user_id);
CREATE INDEX idx_work_schedules_org_id ON public.work_schedules(organization_id);

-- 7. Create triggers for updated_at
CREATE TRIGGER update_employee_permissions_updated_at
BEFORE UPDATE ON public.employee_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_schedules_updated_at
BEFORE UPDATE ON public.work_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();