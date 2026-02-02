-- Add unique constraint on parent_child_id for ON CONFLICT to work
ALTER TABLE child_credentials 
ADD CONSTRAINT child_credentials_parent_child_id_unique 
UNIQUE (parent_child_id);