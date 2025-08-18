-- Fix security issues with function search paths
CREATE OR REPLACE FUNCTION generate_protocol_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  sequence_num INTEGER;
BEGIN
  current_year := EXTRACT(year FROM NOW())::TEXT;
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(sequence_number), 0) + 1 
  INTO sequence_num
  FROM protocols 
  WHERE EXTRACT(year FROM created_at) = EXTRACT(year FROM NOW());
  
  -- Return formatted protocol number: ППК-YYYY-NNNN
  RETURN 'ППК-' || current_year || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$;

-- Fix set_protocol_number function
CREATE OR REPLACE FUNCTION set_protocol_number()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ppk_number IS NULL OR NEW.ppk_number = '' THEN
    NEW.ppk_number := generate_protocol_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;