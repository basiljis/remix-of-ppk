-- Drop existing policies
DROP POLICY IF EXISTS "Parents can insert progress for their children" ON child_task_progress;
DROP POLICY IF EXISTS "Parents can update progress for their children" ON child_task_progress;
DROP POLICY IF EXISTS "Parents can view progress for their children" ON child_task_progress;

-- Allow insert for any valid child from parent_children (including anonymous users)
CREATE POLICY "Allow insert progress for valid children" ON child_task_progress
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_children pc
    WHERE pc.id = child_task_progress.child_id
  )
);

-- Allow update for any valid child from parent_children
CREATE POLICY "Allow update progress for valid children" ON child_task_progress
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM parent_children pc
    WHERE pc.id = child_task_progress.child_id
  )
);

-- Allow select for any valid child from parent_children
CREATE POLICY "Allow select progress for valid children" ON child_task_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_children pc
    WHERE pc.id = child_task_progress.child_id
  )
);