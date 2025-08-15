-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT,
  name TEXT NOT NULL,
  district TEXT,
  type TEXT,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on external_id for API organizations
CREATE UNIQUE INDEX idx_organizations_external_id ON public.organizations(external_id) WHERE external_id IS NOT NULL;

-- Create protocols table
CREATE TABLE public.protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_name TEXT NOT NULL,
  child_birth_date DATE,
  organization_id UUID REFERENCES public.organizations(id),
  education_level TEXT NOT NULL,
  consultation_type TEXT NOT NULL,
  consultation_reason TEXT,
  protocol_data JSONB,
  checklist_data JSONB,
  completion_percentage INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  is_ready BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Organizations are viewable by everyone" 
ON public.organizations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert organizations" 
ON public.organizations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update organizations" 
ON public.organizations 
FOR UPDATE 
USING (true);

-- Create policies for protocols
CREATE POLICY "Protocols are viewable by everyone" 
ON public.protocols 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert protocols" 
ON public.protocols 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update protocols" 
ON public.protocols 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete protocols" 
ON public.protocols 
FOR DELETE 
USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_protocols_updated_at
BEFORE UPDATE ON public.protocols
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();