-- Создание таблицы для хранения файлов инструкций в БД
CREATE TABLE IF NOT EXISTS public.instruction_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instruction_id UUID REFERENCES public.instructions(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  subsection_id TEXT NULL, -- NULL если файл относится к разделу, а не подразделу
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_data BYTEA NOT NULL, -- Данные файла в бинарном формате
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_instruction_files_instruction_id ON instruction_files(instruction_id);
CREATE INDEX IF NOT EXISTS idx_instruction_files_section_id ON instruction_files(section_id);
CREATE INDEX IF NOT EXISTS idx_instruction_files_subsection_id ON instruction_files(subsection_id) WHERE subsection_id IS NOT NULL;

-- RLS политики
ALTER TABLE public.instruction_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instruction files are viewable by everyone" 
ON public.instruction_files 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert instruction files" 
ON public.instruction_files 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update instruction files" 
ON public.instruction_files 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete instruction files" 
ON public.instruction_files 
FOR DELETE 
USING (true);

-- Триггер для обновления времени изменения
CREATE TRIGGER update_instruction_files_updated_at
  BEFORE UPDATE ON public.instruction_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();