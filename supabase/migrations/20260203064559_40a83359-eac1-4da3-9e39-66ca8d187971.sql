-- Allow parents to insert/update progress for their children
DROP POLICY IF EXISTS "Parents can insert progress for their children" ON child_task_progress;
DROP POLICY IF EXISTS "Parents can update progress for their children" ON child_task_progress;
DROP POLICY IF EXISTS "Parents can view progress for their children" ON child_task_progress;
DROP POLICY IF EXISTS "Allow all operations on child_task_progress" ON child_task_progress;

-- Create policy that allows insert for children linked to parent_children
CREATE POLICY "Parents can insert progress for their children" ON child_task_progress
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM parent_children pc
    WHERE pc.id = child_task_progress.child_id
  )
);

-- Create policy that allows update for children linked to parent_children  
CREATE POLICY "Parents can update progress for their children" ON child_task_progress
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM parent_children pc
    WHERE pc.id = child_task_progress.child_id
  )
);

-- Create policy that allows select for children linked to parent_children
CREATE POLICY "Parents can view progress for their children" ON child_task_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM parent_children pc
    WHERE pc.id = child_task_progress.child_id
  )
);