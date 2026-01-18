-- Create specialist goals/KPI table
CREATE TABLE public.specialist_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('sessions_count', 'children_count', 'completion_rate', 'custom')),
  goal_name TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  period_type TEXT NOT NULL CHECK (period_type IN ('week', 'month', 'quarter', 'year')) DEFAULT 'month',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.specialist_goals ENABLE ROW LEVEL SECURITY;

-- Users can view their own goals
CREATE POLICY "Users can view their own goals"
ON public.specialist_goals
FOR SELECT
USING (auth.uid() = user_id);

-- Org admins and admins can view all goals in their organization
CREATE POLICY "Org admins can view organization goals"
ON public.specialist_goals
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'organization_admin', 'director', 'regional_operator')
  )
);

-- Users can create their own goals
CREATE POLICY "Users can create their own goals"
ON public.specialist_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Org admins can create goals for organization members
CREATE POLICY "Org admins can create goals for organization"
ON public.specialist_goals
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'organization_admin', 'director')
  )
);

-- Users can update their own goals
CREATE POLICY "Users can update their own goals"
ON public.specialist_goals
FOR UPDATE
USING (auth.uid() = user_id);

-- Org admins can update organization goals
CREATE POLICY "Org admins can update organization goals"
ON public.specialist_goals
FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'organization_admin', 'director')
  )
);

-- Users can delete their own goals
CREATE POLICY "Users can delete their own goals"
ON public.specialist_goals
FOR DELETE
USING (auth.uid() = user_id);

-- Org admins can delete organization goals
CREATE POLICY "Org admins can delete organization goals"
ON public.specialist_goals
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'organization_admin', 'director')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_specialist_goals_updated_at
BEFORE UPDATE ON public.specialist_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_specialist_goals_user_id ON public.specialist_goals(user_id);
CREATE INDEX idx_specialist_goals_organization_id ON public.specialist_goals(organization_id);
CREATE INDEX idx_specialist_goals_period ON public.specialist_goals(period_start, period_end);