-- Add sequence number column to protocols table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='protocols' AND column_name='sequence_number'
  ) 
  THEN
    ALTER TABLE public.protocols ADD COLUMN sequence_number SERIAL;
  END IF;
END 
$$;

-- Create function to generate unique protocol number
CREATE OR REPLACE FUNCTION generate_protocol_number()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate protocol number on insert
CREATE OR REPLACE FUNCTION set_protocol_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ppk_number IS NULL OR NEW.ppk_number = '' THEN
    NEW.ppk_number := generate_protocol_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_set_protocol_number ON protocols;
CREATE TRIGGER trigger_set_protocol_number
  BEFORE INSERT ON protocols
  FOR EACH ROW
  EXECUTE FUNCTION set_protocol_number();