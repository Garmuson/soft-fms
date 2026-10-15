DROP POLICY IF EXISTS "projects data entry insert" ON public.projects;
DROP POLICY IF EXISTS "projects data entry update" ON public.projects;
CREATE POLICY "projects supervisors insert" ON public.projects FOR INSERT TO authenticated
WITH CHECK (public.my_role() = 'hq_admin' OR (public.my_role() = 'hub_supervisor' AND hub_id = public.my_hub_id()));
CREATE POLICY "projects supervisors update" ON public.projects FOR UPDATE TO authenticated
USING (public.my_role() = 'hq_admin' OR (public.my_role() = 'hub_supervisor' AND hub_id = public.my_hub_id()))
WITH CHECK (public.my_role() = 'hq_admin' OR (public.my_role() = 'hub_supervisor' AND hub_id = public.my_hub_id()));