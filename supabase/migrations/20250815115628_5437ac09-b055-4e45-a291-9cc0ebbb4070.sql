-- Add address and mrsd columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN address TEXT,
ADD COLUMN mrsd TEXT;