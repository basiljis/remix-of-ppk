-- Добавить region_id в parent_profiles
ALTER TABLE public.parent_profiles
ADD COLUMN region_id text REFERENCES public.regions(id);

-- Создать таблицу связи ребенка родителя с организацией
CREATE TABLE public.linked_parent_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_child_id uuid NOT NULL REFERENCES public.parent_children(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  linked_by uuid REFERENCES auth.users(id),
  linked_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(parent_child_id, organization_id)
);

-- Создать таблицу слотов для консультаций по записи
CREATE TABLE public.consultation_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  specialist_id uuid NOT NULL REFERENCES auth.users(id),
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_booked boolean NOT NULL DEFAULT false,
  booked_by_parent_id uuid REFERENCES auth.users(id),
  booked_for_child_id uuid REFERENCES public.parent_children(id),
  booking_notes text,
  booked_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Включить RLS
ALTER TABLE public.linked_parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;

-- Политики для linked_parent_children
CREATE POLICY "Admins can manage all linked children"
ON public.linked_parent_children FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org users can view linked children in their org"
ON public.linked_parent_children FOR SELECT
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Org users can link children to their org"
ON public.linked_parent_children FOR INSERT
WITH CHECK (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Parents can view their linked children"
ON public.linked_parent_children FOR SELECT
USING (
  parent_child_id IN (
    SELECT id FROM public.parent_children WHERE parent_user_id = auth.uid()
  )
);

-- Политики для consultation_slots
CREATE POLICY "Admins can manage all consultation slots"
ON public.consultation_slots FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Org users can manage slots in their org"
ON public.consultation_slots FOR ALL
USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Parents can view available slots in their region"
ON public.consultation_slots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.parent_profiles pp
    JOIN public.organizations o ON o.region_id = pp.region_id
    WHERE pp.id = auth.uid() AND o.id = consultation_slots.organization_id
  )
);

CREATE POLICY "Parents can book slots"
ON public.consultation_slots FOR UPDATE
USING (
  is_booked = false AND
  EXISTS (
    SELECT 1 FROM public.parent_profiles pp
    JOIN public.organizations o ON o.region_id = pp.region_id
    WHERE pp.id = auth.uid() AND o.id = consultation_slots.organization_id
  )
);

-- Триггеры updated_at
CREATE TRIGGER update_linked_parent_children_updated_at
BEFORE UPDATE ON public.linked_parent_children
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consultation_slots_updated_at
BEFORE UPDATE ON public.consultation_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();