-- Create school_years table for admin management
CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL, -- e.g. "2023/2024"
  value TEXT NOT NULL UNIQUE, -- e.g. "2023-2024"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;

-- Create policies for school_years table
CREATE POLICY "School years are viewable by everyone" 
  ON public.school_years 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can insert school years" 
  ON public.school_years 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update school years" 
  ON public.school_years 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete school years" 
  ON public.school_years 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_school_years_updated_at
  BEFORE UPDATE ON public.school_years
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();