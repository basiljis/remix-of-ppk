-- Create payment_logs table for tracking all payment events
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(10, 2),
  raw_data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all payment logs"
ON public.payment_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service can insert payment logs"
ON public.payment_logs
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_payment_logs_payment_id ON public.payment_logs(payment_id);
CREATE INDEX idx_payment_logs_subscription_id ON public.payment_logs(subscription_id);
CREATE INDEX idx_payment_logs_created_at ON public.payment_logs(created_at DESC);