CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- protocols
DROP POLICY IF EXISTS "Authenticated users can insert protocols" ON public.protocols;
CREATE POLICY "Role holders can insert protocols in own organization" ON public.protocols
FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(),'admin') OR (
    public.has_any_role(auth.uid()) AND (organization_id IS NULL OR organization_id = public.get_user_organization(auth.uid()))
  )
);

-- service-role only inserts
DROP POLICY IF EXISTS "Authenticated users can queue notifications" ON public.telegram_notifications_queue;
DROP POLICY IF EXISTS "Authenticated can insert api logs" ON public.api_logs;

-- instruction files + storage
DROP POLICY IF EXISTS "Authenticated users can view instruction files" ON public.instruction_files;
CREATE POLICY "Role holders can view instruction files" ON public.instruction_files
FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view instruction documents" ON storage.objects;
CREATE POLICY "Role holders can view instruction documents" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'instruction-documents' AND public.has_any_role(auth.uid()));

-- checklists and settings
DROP POLICY IF EXISTS "Checklists are viewable by authenticated users" ON public.checklist;
CREATE POLICY "Role holders can view checklists" ON public.checklist FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
DROP POLICY IF EXISTS "Checklist items are viewable by authenticated users" ON public.checklist_item;
CREATE POLICY "Role holders can view checklist items" ON public.checklist_item FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
DROP POLICY IF EXISTS "Protocol checklist items are viewable by authenticated users" ON public.protocol_checklist_items;
CREATE POLICY "Role holders can view protocol checklist items" ON public.protocol_checklist_items FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view specialist workload settings" ON public.specialist_workload_settings;
CREATE POLICY "Role holders can view specialist workload settings" ON public.specialist_workload_settings FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view session duration settings" ON public.session_duration_settings;
CREATE POLICY "Role holders can view session duration settings" ON public.session_duration_settings FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()));

-- change history / error logs
DROP POLICY IF EXISTS "System can insert change history" ON public.change_history;
CREATE POLICY "Users can log their own changes" ON public.change_history FOR INSERT TO authenticated WITH CHECK (changed_by = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can create error logs" ON public.error_logs;
CREATE POLICY "Users can create their own error logs" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- organizations
DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;
CREATE POLICY "Users can add manual unpublished organizations" ON public.organizations FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'regional_operator')
  OR (is_manual = true AND COALESCE(is_published,false) = false)
);

-- public forms: validated inserts
DROP POLICY IF EXISTS "Anyone can create access request" ON public.access_requests;
CREATE POLICY "Anyone can create pending access request" ON public.access_requests FOR INSERT TO anon, authenticated WITH CHECK (
  status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND admin_notes IS NULL
  AND role NOT IN ('admin','regional_operator')
  AND (auth.uid() IS NULL OR user_id = auth.uid())
  AND length(email) BETWEEN 3 AND 255 AND length(full_name) BETWEEN 1 AND 255
);
DROP POLICY IF EXISTS "Anyone can create commercial offer requests" ON public.commercial_offer_requests;
CREATE POLICY "Anyone can submit commercial offer requests" ON public.commercial_offer_requests FOR INSERT TO anon, authenticated WITH CHECK (
  reviewed_by IS NULL AND reviewed_at IS NULL AND admin_notes IS NULL
  AND length(coalesce(email,'')) <= 255 AND length(coalesce(organization_name,'')) <= 500 AND length(coalesce(comment,'')) <= 5000
);
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.lead_magnet_downloads;
CREATE POLICY "Anyone can submit lead magnet download" ON public.lead_magnet_downloads FOR INSERT TO anon, authenticated WITH CHECK (
  length(email) BETWEEN 3 AND 255 AND length(coalesce(full_name,'')) <= 255 AND length(magnet_slug) BETWEEN 1 AND 200
);

-- analytics: insert validated, reads only through stats functions
DROP POLICY IF EXISTS "Anyone can log a blog view" ON public.blog_views;
DROP POLICY IF EXISTS "Anyone can read blog views" ON public.blog_views;
CREATE POLICY "Anyone can log a valid blog view" ON public.blog_views FOR INSERT TO anon, authenticated WITH CHECK (
  length(post_slug) BETWEEN 1 AND 300 AND length(coalesce(visitor_id::text,'')) <= 100 AND length(coalesce(referrer,'')) <= 2000 AND length(coalesce(path,'')) <= 500
);
CREATE POLICY "Admins can read blog views" ON public.blog_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Anyone can insert legal views" ON public.legal_views;
DROP POLICY IF EXISTS "Anyone can read legal views" ON public.legal_views;
CREATE POLICY "Anyone can log a valid legal view" ON public.legal_views FOR INSERT TO anon, authenticated WITH CHECK (
  length(section_id) BETWEEN 1 AND 200 AND length(coalesce(visitor_id::text,'')) <= 100
);
CREATE POLICY "Admins can read legal views" ON public.legal_views FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));