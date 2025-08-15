-- Add disabled field to protocol_checklist_items table for soft delete
ALTER TABLE protocol_checklist_items 
ADD COLUMN is_disabled boolean NOT NULL DEFAULT false;