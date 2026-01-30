-- Add 'parent' role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'parent';

-- Create sequence for child unique IDs first
CREATE SEQUENCE IF NOT EXISTS parent_children_seq START WITH 1;

-- Create parent_children table to track children added by parents
CREATE TABLE public.parent_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_unique_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  school_name TEXT,
  class_or_group TEXT,
  education_level TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on parent_children
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Parents can view and manage only their own children
CREATE POLICY "Parents can manage their own children"
ON public.parent_children
FOR ALL
USING (parent_user_id = auth.uid())
WITH CHECK (parent_user_id = auth.uid());

-- Admins can view all parent children
CREATE POLICY "Admins can view all parent children"
ON public.parent_children
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create parent_profiles table for simplified parent data
CREATE TABLE public.parent_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  data_processing_consent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on parent_profiles
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;

-- Parents can view and update their own profile
CREATE POLICY "Parents can view own profile"
ON public.parent_profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Parents can update own profile"
ON public.parent_profiles
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Parents can insert own profile"
ON public.parent_profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Admins can view all parent profiles
CREATE POLICY "Admins can view all parent profiles"
ON public.parent_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update parent profiles"
ON public.parent_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on parent_children
CREATE TRIGGER update_parent_children_updated_at
BEFORE UPDATE ON public.parent_children
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on parent_profiles
CREATE TRIGGER update_parent_profiles_updated_at
BEFORE UPDATE ON public.parent_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique child ID
CREATE OR REPLACE FUNCTION public.generate_child_unique_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.child_unique_id := 'PC-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('parent_children_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate child unique ID
CREATE TRIGGER set_child_unique_id
BEFORE INSERT ON public.parent_children
FOR EACH ROW
EXECUTE FUNCTION public.generate_child_unique_id();