
-- Allow superadmin to insert sedes
CREATE POLICY "Superadmin can insert sedes" ON public.sedes FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin());

-- Allow superadmin to update sedes
CREATE POLICY "Superadmin can update sedes" ON public.sedes FOR UPDATE TO authenticated
  USING (public.is_superadmin());
