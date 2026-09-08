-- entry review state
DO $$ BEGIN
  CREATE TYPE public.entry_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- helpers -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_read_all()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select public.has_role(auth.uid(),'hq_admin')
      or public.has_role(auth.uid(),'ministry_analyst')
      or public.has_role(auth.uid(),'data_entry_supervisor')
$$;

CREATE OR REPLACE FUNCTION public.is_data_reviewer()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select public.has_role(auth.uid(),'hq_admin')
      or public.has_role(auth.uid(),'data_entry_supervisor')
$$;

-- may enter/edit operational data for a hub
CREATE OR REPLACE FUNCTION public.can_enter_hub(_hub_id integer)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select public.is_data_reviewer()
      or (public.has_role(auth.uid(),'data_entry_staff') and _hub_id = public.my_hub_id())
      or (public.has_role(auth.uid(),'hub_supervisor') and _hub_id = public.my_hub_id())
$$;

REVOKE EXECUTE ON FUNCTION public.is_data_reviewer() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_enter_hub(integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_data_reviewer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_enter_hub(integer) TO authenticated;

-- drivers -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_no text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  photo_url text,
  hub_id integer NOT NULL REFERENCES public.hubs(id),
  is_active boolean NOT NULL DEFAULT true,
  licence_number text,
  licence_class text,
  licence_issued date,
  licence_expiry date,
  certified_types text[] NOT NULL DEFAULT '{}',
  training_date date,
  medical_check_date date,
  employment_type text NOT NULL DEFAULT 'permanent',
  date_joined date,
  supervisor_id uuid REFERENCES public.profiles(id),
  next_of_kin_name text,
  next_of_kin_phone text,
  notes text,
  review_status public.entry_status NOT NULL DEFAULT 'approved',
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drivers read" ON public.drivers FOR SELECT TO authenticated USING (public.can_read_hub(hub_id));
CREATE POLICY "drivers insert" ON public.drivers FOR INSERT TO authenticated WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "drivers update" ON public.drivers FOR UPDATE TO authenticated USING (public.can_enter_hub(hub_id)) WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "drivers delete" ON public.drivers FOR DELETE TO authenticated USING (public.is_data_reviewer());
CREATE TRIGGER drivers_touch BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS drivers_hub_idx ON public.drivers(hub_id);

-- driver assignments --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.driver_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  machine_id uuid NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  hub_id integer NOT NULL REFERENCES public.hubs(id),
  shift text NOT NULL DEFAULT 'day',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  notes text,
  review_status public.entry_status NOT NULL DEFAULT 'approved',
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.driver_assignments TO authenticated;
GRANT ALL ON public.driver_assignments TO service_role;
ALTER TABLE public.driver_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "da read" ON public.driver_assignments FOR SELECT TO authenticated USING (public.can_read_hub(hub_id));
CREATE POLICY "da insert" ON public.driver_assignments FOR INSERT TO authenticated WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "da update" ON public.driver_assignments FOR UPDATE TO authenticated USING (public.can_enter_hub(hub_id)) WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "da delete" ON public.driver_assignments FOR DELETE TO authenticated USING (public.is_data_reviewer());
CREATE INDEX IF NOT EXISTS da_driver_idx ON public.driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS da_machine_idx ON public.driver_assignments(machine_id);

-- review state on entered operational data ----------------------------
ALTER TABLE public.fuel_logs
  ADD COLUMN IF NOT EXISTS review_status public.entry_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.maintenance_records
  ADD COLUMN IF NOT EXISTS review_status public.entry_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id);

-- data-entry write access to operational tables ------------------------
CREATE POLICY "fuel data entry insert" ON public.fuel_logs FOR INSERT TO authenticated WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "fuel data entry update" ON public.fuel_logs FOR UPDATE TO authenticated USING (public.can_enter_hub(hub_id)) WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "maint data entry insert" ON public.maintenance_records FOR INSERT TO authenticated WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "maint data entry update" ON public.maintenance_records FOR UPDATE TO authenticated USING (public.can_enter_hub(hub_id)) WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "projects data entry insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.can_enter_hub(hub_id));
CREATE POLICY "projects data entry update" ON public.projects FOR UPDATE TO authenticated USING (public.can_enter_hub(hub_id)) WITH CHECK (public.can_enter_hub(hub_id));