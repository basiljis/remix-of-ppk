CREATE TABLE public.lead_magnet_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  magnet_slug TEXT NOT NULL,
  organization_name TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_magnet_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.lead_magnet_downloads
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view" ON public.lead_magnet_downloads
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_lead_magnet_email ON public.lead_magnet_downloads(email);
CREATE INDEX idx_lead_magnet_slug ON public.lead_magnet_downloads(magnet_slug);