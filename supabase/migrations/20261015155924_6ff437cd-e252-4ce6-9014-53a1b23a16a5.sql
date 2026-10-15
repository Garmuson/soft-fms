DROP POLICY IF EXISTS "da read" ON public.driver_assignments;
DROP POLICY IF EXISTS "da insert" ON public.driver_assignments;
DROP POLICY IF EXISTS "da update" ON public.driver_assignments;
DROP POLICY IF EXISTS "da delete" ON public.driver_assignments;
CREATE POLICY "da read" ON public.driver_assignments FOR SELECT TO authenticated
  USING (public.can_read_hub(hub_id) AND NOT public.has_role(auth.uid(),'data_entry_staff') AND NOT public.has_role(auth.uid(),'data_entry_supervisor'));
CREATE POLICY "da insert" ON public.driver_assignments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'hq_admin') OR (public.has_role(auth.uid(),'hub_supervisor') AND hub_id = public.my_hub_id()));
CREATE POLICY "da update" ON public.driver_assignments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'hq_admin') OR (public.has_role(auth.uid(),'hub_supervisor') AND hub_id = public.my_hub_id()))
  WITH CHECK (public.has_role(auth.uid(),'hq_admin') OR (public.has_role(auth.uid(),'hub_supervisor') AND hub_id = public.my_hub_id()));
CREATE POLICY "da delete" ON public.driver_assignments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'hq_admin'));