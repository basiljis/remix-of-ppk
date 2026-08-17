BEGIN;

-- Drop existing policies if they exist (to ensure we can recreate them correctly)
DROP POLICY IF EXISTS "Anon can subscribe" ON public.legal_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.legal_subscriptions;

-- 1. Policy for anonymous users (or users without a stored ID)
-- This allows anyone to insert a subscription, but only if user_id is null or matches their ID
CREATE POLICY "Enable insert for everyone" 
ON public.legal_subscriptions 
FOR INSERT 
WITH CHECK (true);

-- 2. Policy for selection/updates based on email or user_id
CREATE POLICY "Enable select for owners" 
ON public.legal_subscriptions 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL)
);

CREATE POLICY "Enable update for owners" 
ON public.legal_subscriptions 
FOR UPDATE 
USING (
  (auth.uid() = user_id) OR 
  (user_id IS NULL)
)
WITH CHECK (true);

-- Ensure public schema grants are present
GRANT ALL ON public.legal_subscriptions TO authenticated;
GRANT ALL ON public.legal_subscriptions TO anon;
GRANT ALL ON public.legal_subscriptions TO service_role;

COMMIT;