UPDATE public.user_roles SET role = 'data_entry_staff' WHERE role = 'field_operator';

CREATE POLICY "insp clerk insert" ON public.inspections FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'data_entry_staff') AND hub_id = public.my_hub_id());

CREATE POLICY "Clerks manage hub shifts" ON public.shifts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'data_entry_staff') AND hub_id = public.my_hub_id() AND operator_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(),'data_entry_staff') AND hub_id = public.my_hub_id() AND operator_id = auth.uid());

CREATE POLICY "machines clerk update" ON public.machines FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'data_entry_staff') AND hub_id = public.my_hub_id())
  WITH CHECK (public.has_role(auth.uid(),'data_entry_staff') AND hub_id = public.my_hub_id());

CREATE POLICY "wo clerk update" ON public.work_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'data_entry_staff') AND hub_id = public.my_hub_id())
  WITH CHECK (public.has_role(auth.uid(),'data_entry_staff') AND hub_id = public.my_hub_id());