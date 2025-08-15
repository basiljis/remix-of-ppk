-- Create instructions table
CREATE TABLE public.instructions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]'::jsonb, -- Structure for sections and subsections
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instructions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Instructions are viewable by everyone" 
ON public.instructions 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can insert instructions" 
ON public.instructions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update instructions" 
ON public.instructions 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete instructions" 
ON public.instructions 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instructions_updated_at
BEFORE UPDATE ON public.instructions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for instruction documents
INSERT INTO storage.buckets (id, name, public) VALUES ('instruction-documents', 'instruction-documents', false);

-- Create storage policies
CREATE POLICY "Users can view instruction documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'instruction-documents');

CREATE POLICY "Users can upload instruction documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'instruction-documents');

CREATE POLICY "Users can update instruction documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'instruction-documents');

CREATE POLICY "Users can delete instruction documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'instruction-documents');