-- Sync all auth.users to profiles table (create missing profiles)
INSERT INTO public.profiles (id, full_name, email, phone, region_id, position_id, organization_id, is_blocked)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Пользователь'),
  COALESCE(au.email, ''),
  '',
  COALESCE((SELECT id FROM public.regions LIMIT 1), ''),
  COALESCE((SELECT id FROM public.positions LIMIT 1), gen_random_uuid()),
  NULL,
  false
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Sync all auth.users to user_roles table (create missing roles with default 'user' role)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  'user'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.user_id IS NULL;