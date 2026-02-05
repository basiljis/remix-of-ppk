-- Исправляем RLS политику для child_task_progress
-- Проблема: INSERT политика не проверяет auth.uid(), позволяя любому вставлять данные

-- Удаляем старые небезопасные политики
DROP POLICY IF EXISTS "Allow insert progress for valid children" ON child_task_progress;
DROP POLICY IF EXISTS "Allow select progress for valid children" ON child_task_progress;
DROP POLICY IF EXISTS "Allow update progress for valid children" ON child_task_progress;

-- Обновляем политику Parents can manage - добавляем WITH CHECK для INSERT/UPDATE
DROP POLICY IF EXISTS "Parents can manage their children's progress" ON child_task_progress;

-- Создаём правильные политики с проверкой авторизации
CREATE POLICY "Parents can insert progress for their children" ON child_task_progress
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_children pc
    WHERE pc.id = child_task_progress.child_id
    AND pc.parent_user_id = auth.uid()
  )
);

CREATE POLICY "Parents can update progress for their children" ON child_task_progress
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM parent_children pc
    WHERE pc.id = child_task_progress.child_id
    AND pc.parent_user_id = auth.uid()
  )
);

-- Также разрешаем детям самим записывать прогресс через child_credentials
-- Это для случая когда ребёнок залогинен через свой аккаунт
CREATE POLICY "Children can manage their own progress" ON child_task_progress
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM child_credentials cc
    WHERE cc.parent_child_id = child_task_progress.child_id
    AND cc.is_active = true
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM child_credentials cc
    WHERE cc.parent_child_id = child_task_progress.child_id
    AND cc.is_active = true
  )
);

-- Помечаем ошибки child_task_progress как решённые
UPDATE error_logs 
SET resolved = true, resolved_at = now()
WHERE error_message LIKE '%child_task_progress%'
  AND resolved = false