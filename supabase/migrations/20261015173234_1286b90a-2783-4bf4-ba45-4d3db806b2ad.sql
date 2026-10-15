ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS tank_capacity_gal numeric;
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS serial_number text;
UPDATE public.machines SET tank_capacity_gal = CASE type
  WHEN 'motor_grader' THEN 110 WHEN 'front_end_loader' THEN 100 WHEN 'excavator' THEN 130
  WHEN 'dump_truck' THEN 80 WHEN 'compactor' THEN 65 ELSE 60 END
WHERE tank_capacity_gal IS NULL;
ALTER TABLE public.machines ALTER COLUMN tank_capacity_gal SET NOT NULL;
ALTER TABLE public.machines ADD CONSTRAINT machines_tank_capacity_chk CHECK (tank_capacity_gal > 0 AND tank_capacity_gal <= 2000);
CREATE UNIQUE INDEX IF NOT EXISTS machines_unit_id_key ON public.machines(unit_id);