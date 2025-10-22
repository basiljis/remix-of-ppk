-- Remove all old triggers that create profile immediately on user signup
-- This conflicts with access_requests approval flow
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;