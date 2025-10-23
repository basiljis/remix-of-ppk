-- Add role column to access_requests table
ALTER TABLE public.access_requests
ADD COLUMN role app_role NOT NULL DEFAULT 'user'::app_role;

-- Update trigger to use the selected role when approving access request
CREATE OR REPLACE FUNCTION public.handle_access_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Create profile if missing
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
      NEW.user_id,
      NEW.full_name,
      NEW.email,
      NEW.phone,
      NEW.region_id,
      NEW.position_id,
      NEW.organization_id,
      false
    )
    ON CONFLICT (id) DO NOTHING;

    -- Assign the selected role to the user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;