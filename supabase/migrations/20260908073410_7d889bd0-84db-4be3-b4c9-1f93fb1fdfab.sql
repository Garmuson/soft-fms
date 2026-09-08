CREATE OR REPLACE FUNCTION public.enforce_entry_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if public.has_role(auth.uid(), 'data_entry_staff') then
    if tg_op = 'INSERT' then
      new.review_status := 'pending';
      new.reviewed_by := null;
      new.reviewed_at := null;
    else
      new.review_status := old.review_status;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
    end if;
  end if;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS drivers_review_guard ON public.drivers;
CREATE TRIGGER drivers_review_guard BEFORE INSERT OR UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.enforce_entry_review();

DROP TRIGGER IF EXISTS driver_assignments_review_guard ON public.driver_assignments;
CREATE TRIGGER driver_assignments_review_guard BEFORE INSERT OR UPDATE ON public.driver_assignments
FOR EACH ROW EXECUTE FUNCTION public.enforce_entry_review();

DROP TRIGGER IF EXISTS fuel_logs_review_guard ON public.fuel_logs;
CREATE TRIGGER fuel_logs_review_guard BEFORE INSERT OR UPDATE ON public.fuel_logs
FOR EACH ROW EXECUTE FUNCTION public.enforce_entry_review();

DROP TRIGGER IF EXISTS maintenance_review_guard ON public.maintenance_records;
CREATE TRIGGER maintenance_review_guard BEFORE INSERT OR UPDATE ON public.maintenance_records
FOR EACH ROW EXECUTE FUNCTION public.enforce_entry_review();