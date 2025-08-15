-- Create unique constraint on external_id for upsert operations
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_external_id_unique UNIQUE (external_id);