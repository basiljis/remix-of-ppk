-- Add unique code and verification code to children table (specialist's children)
ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS child_unique_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Add verification code to parent_children table
ALTER TABLE public.parent_children 
ADD COLUMN IF NOT EXISTS verification_code TEXT;

-- Add link from children to parent_children (reverse link)
ALTER TABLE public.children
ADD COLUMN IF NOT EXISTS linked_parent_child_id UUID REFERENCES public.parent_children(id);

-- Create sequence for specialist's children codes
CREATE SEQUENCE IF NOT EXISTS children_seq START 1;

-- Function to generate unique ID for specialist's children
CREATE OR REPLACE FUNCTION public.generate_specialist_child_unique_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.child_unique_id IS NULL THEN
    NEW.child_unique_id := 'SC-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('children_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$function$;

-- Function to generate verification code (6 characters)
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$function$;

-- Trigger to auto-generate unique ID for specialist's children
DROP TRIGGER IF EXISTS generate_specialist_child_id ON public.children;
CREATE TRIGGER generate_specialist_child_id
BEFORE INSERT ON public.children
FOR EACH ROW
EXECUTE FUNCTION public.generate_specialist_child_unique_id();

-- Trigger to auto-generate verification code for specialist's children
CREATE OR REPLACE FUNCTION public.set_specialist_child_verification_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_specialist_child_verification ON public.children;
CREATE TRIGGER set_specialist_child_verification
BEFORE INSERT ON public.children
FOR EACH ROW
EXECUTE FUNCTION public.set_specialist_child_verification_code();

-- Trigger to auto-generate verification code for parent's children
CREATE OR REPLACE FUNCTION public.set_parent_child_verification_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.verification_code IS NULL THEN
    NEW.verification_code := generate_verification_code();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS set_parent_child_verification ON public.parent_children;
CREATE TRIGGER set_parent_child_verification
BEFORE INSERT ON public.parent_children
FOR EACH ROW
EXECUTE FUNCTION public.set_parent_child_verification_code();

-- Generate verification codes for existing records that don't have them
UPDATE public.children SET verification_code = generate_verification_code() WHERE verification_code IS NULL;
UPDATE public.parent_children SET verification_code = generate_verification_code() WHERE verification_code IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_children_unique_id ON public.children(child_unique_id);
CREATE INDEX IF NOT EXISTS idx_children_verification ON public.children(verification_code);
CREATE INDEX IF NOT EXISTS idx_parent_children_verification ON public.parent_children(verification_code);