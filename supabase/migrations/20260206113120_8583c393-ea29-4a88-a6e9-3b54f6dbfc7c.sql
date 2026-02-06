
-- Table for specialist YuKassa payment settings (each specialist has their own kassa)
CREATE TABLE public.specialist_payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  yukassa_shop_id TEXT,
  yukassa_secret_key TEXT,
  payment_mode TEXT NOT NULL DEFAULT 'prepay' CHECK (payment_mode IN ('prepay', 'postpay')),
  online_payment_enabled BOOLEAN NOT NULL DEFAULT false,
  is_configured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.specialist_payment_settings ENABLE ROW LEVEL SECURITY;

-- Specialist can view/edit their own settings
CREATE POLICY "Users can view own payment settings"
  ON public.specialist_payment_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment settings"
  ON public.specialist_payment_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment settings"
  ON public.specialist_payment_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all payment settings
CREATE POLICY "Admins can view all payment settings"
  ON public.specialist_payment_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_specialist_payment_settings_updated_at
  BEFORE UPDATE ON public.specialist_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table for session payments (tracking payments per session)
CREATE TABLE public.session_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  payment_mode TEXT NOT NULL DEFAULT 'prepay' CHECK (payment_mode IN ('prepay', 'postpay')),
  yukassa_payment_id TEXT,
  confirmation_url TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS
ALTER TABLE public.session_payments ENABLE ROW LEVEL SECURITY;

-- Specialist can view own payments
CREATE POLICY "Specialists can view own session payments"
  ON public.session_payments FOR SELECT
  USING (auth.uid() = specialist_id);

-- Specialist can create payments for their sessions
CREATE POLICY "Specialists can create session payments"
  ON public.session_payments FOR INSERT
  WITH CHECK (auth.uid() = specialist_id);

-- Specialist can update own payments
CREATE POLICY "Specialists can update own session payments"
  ON public.session_payments FOR UPDATE
  USING (auth.uid() = specialist_id);

-- Admins can view all session payments
CREATE POLICY "Admins can view all session payments"
  ON public.session_payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can update payments (for webhooks)
CREATE POLICY "Service can manage session payments"
  ON public.session_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_session_payments_updated_at
  BEFORE UPDATE ON public.session_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment-related columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS online_payment_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'prepay';
