-- Replace public SELECT policies on checklist tables with authenticated-only access.
-- These tables contain specialist working data (protocol checklists), not public content.

DROP POLICY IF EXISTS "Checklists are viewable by everyone" ON public.checklist;
CREATE POLICY "Checklists are viewable by authenticated users"
  ON public.checklist FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Checklist items are viewable by everyone" ON public.checklist_item;
CREATE POLICY "Checklist items are viewable by authenticated users"
  ON public.checklist_item FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Protocol checklist items are viewable by everyone" ON public.protocol_checklist_items;
CREATE POLICY "Protocol checklist items are viewable by authenticated users"
  ON public.protocol_checklist_items FOR SELECT
  TO authenticated
  USING (true);