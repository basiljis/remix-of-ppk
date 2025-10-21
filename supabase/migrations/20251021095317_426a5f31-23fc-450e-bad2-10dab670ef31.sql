-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_position_id uuid;
  default_region_id text;
BEGIN
  -- Get default position (first available)
  SELECT id INTO default_position_id FROM positions LIMIT 1;
  
  -- Get default region (first available)
  SELECT id INTO default_region_id FROM regions LIMIT 1;
  
  -- Insert profile with user metadata or defaults
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    region_id,
    position_id,
    organization_id,
    is_blocked
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'Пользователь'),
    COALESCE(NEW.email, ''),
    '',
    COALESCE(default_region_id, ''),
    COALESCE(default_position_id, gen_random_uuid()),
    NULL,
    false
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();