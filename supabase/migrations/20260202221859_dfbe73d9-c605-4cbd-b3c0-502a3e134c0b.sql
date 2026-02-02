-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate the function with correct schema reference
CREATE OR REPLACE FUNCTION public.generate_child_credentials(p_parent_child_id UUID)
RETURNS TABLE(login VARCHAR, password TEXT) AS $$
DECLARE
  v_child_name TEXT;
  v_login VARCHAR(50);
  v_password TEXT;
  v_password_hash TEXT;
  v_suffix TEXT;
BEGIN
  -- Get child name
  SELECT pc.full_name INTO v_child_name
  FROM parent_children pc
  WHERE pc.id = p_parent_child_id;
  
  IF v_child_name IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  
  -- Generate login from child name (transliterated + random suffix)
  v_suffix := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  v_login := LOWER(REPLACE(SPLIT_PART(v_child_name, ' ', 1), ' ', '')) || '_' || v_suffix;
  
  -- Generate random password (8 characters)
  v_password := SUBSTR(MD5(RANDOM()::TEXT), 1, 8);
  
  -- Hash password using pgcrypto
  v_password_hash := extensions.crypt(v_password, extensions.gen_salt('bf'));
  
  -- Insert or update credentials
  INSERT INTO child_credentials (parent_child_id, login, password_hash, plain_password)
  VALUES (p_parent_child_id, v_login, v_password_hash, v_password)
  ON CONFLICT (parent_child_id) 
  DO UPDATE SET 
    login = v_login,
    password_hash = v_password_hash,
    plain_password = v_password,
    updated_at = NOW();
  
  RETURN QUERY SELECT v_login, v_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;