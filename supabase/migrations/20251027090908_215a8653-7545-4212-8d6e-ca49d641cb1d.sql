-- Обновление RLS политик для таблицы instructions
-- Удаляем старые политики
DROP POLICY IF EXISTS "Instructions are viewable by everyone" ON public.instructions;
DROP POLICY IF EXISTS "Users can delete instructions" ON public.instructions;
DROP POLICY IF EXISTS "Users can insert instructions" ON public.instructions;
DROP POLICY IF EXISTS "Users can update instructions" ON public.instructions;

-- Создаем новые политики с проверкой роли админа
CREATE POLICY "Instructions are viewable by everyone"
ON public.instructions
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can insert instructions"
ON public.instructions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update instructions"
ON public.instructions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete instructions"
ON public.instructions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));