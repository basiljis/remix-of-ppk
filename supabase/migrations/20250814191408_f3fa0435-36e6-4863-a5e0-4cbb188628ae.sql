-- Create checklist table for different types of checklists
CREATE TABLE public.checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('elementary', 'middle', 'high', 'preschool')),
  type TEXT NOT NULL CHECK (type IN ('difficulties', 'protocol')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist_item table for individual checklist items
CREATE TABLE public.checklist_item (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.checklist(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_item ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is reference data)
CREATE POLICY "Checklists are viewable by everyone" 
ON public.checklist 
FOR SELECT 
USING (true);

CREATE POLICY "Checklist items are viewable by everyone" 
ON public.checklist_item 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_checklist_updated_at
BEFORE UPDATE ON public.checklist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_item_updated_at
BEFORE UPDATE ON public.checklist_item
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample checklist data for difficulties
INSERT INTO public.checklist (name, level, type) VALUES 
('Трудности в обучении - Начальная школа', 'elementary', 'difficulties'),
('Трудности в обучении - Средняя школа', 'middle', 'difficulties'),
('Трудности в обучении - Старшая школа', 'high', 'difficulties'),
('Трудности в обучении - Дошкольное образование', 'preschool', 'difficulties');

-- Insert sample checklist data for protocol
INSERT INTO public.checklist (name, level, type) VALUES 
('Протокол - Начальная школа', 'elementary', 'protocol'),
('Протокол - Средняя школа', 'middle', 'protocol'),
('Протокол - Старшая школа', 'high', 'protocol'),
('Протокол - Дошкольное образование', 'preschool', 'protocol');