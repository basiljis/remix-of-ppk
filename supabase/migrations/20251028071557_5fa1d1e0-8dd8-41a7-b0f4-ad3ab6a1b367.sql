-- Fix RLS policy for instructions table UPDATE operation
-- The policy needs both USING and WITH CHECK clauses

DROP POLICY IF EXISTS "Only admins can update instructions" ON public.instructions;

CREATE POLICY "Only admins can update instructions"
ON public.instructions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));