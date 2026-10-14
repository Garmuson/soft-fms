ALTER TABLE public.hubs
  ADD COLUMN IF NOT EXISTS tank_capacity_gal numeric NOT NULL DEFAULT 4000,
  ADD COLUMN IF NOT EXISTS tank_current_stock_gal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tank_reorder_level_gal numeric NOT NULL DEFAULT 800;

CREATE TABLE public.hub_fuel_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id integer NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  waybill_number text NOT NULL,
  supplier_name text NOT NULL,
  volume_gal numeric NOT NULL,
  unit_cost_usd numeric NOT NULL DEFAULT 0,
  total_cost_usd numeric NOT NULL DEFAULT 0,
  dipstick_before_gal numeric,
  dipstick_after_gal numeric,
  received_at timestamptz NOT NULL DEFAULT now(),
  received_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.hub_fuel_deliveries TO authenticated;
GRANT ALL ON public.hub_fuel_deliveries TO service_role;
ALTER TABLE public.hub_fuel_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read hub deliveries" ON public.hub_fuel_deliveries FOR SELECT TO authenticated USING (public.can_read_hub(hub_id));
CREATE POLICY "record hub deliveries" ON public.hub_fuel_deliveries FOR INSERT TO authenticated WITH CHECK (public.can_enter_hub(hub_id));
CREATE INDEX ON public.hub_fuel_deliveries(hub_id, received_at DESC);

-- seed deliveries
INSERT INTO public.hub_fuel_deliveries (hub_id, waybill_number, supplier_name, volume_gal, unit_cost_usd, total_cost_usd, dipstick_before_gal, dipstick_after_gal, received_at, notes)
SELECT h.id,
  'WB-' || to_char(now() - (d.days || ' days')::interval, 'YYMMDD') || '-' || lpad(h.id::text,2,'0'),
  (ARRAY['TotalEnergies Liberia','Conex Petroleum','Petro Trade Inc.'])[1 + ((h.id + d.n) % 3)],
  v.vol, 4.35, round(v.vol * 4.35, 2), NULL, NULL,
  now() - (d.days || ' days')::interval - ((h.id % 6) || ' hours')::interval,
  'Tanker delivery to hub depot'
FROM public.hubs h
CROSS JOIN (VALUES (1,26),(2,16),(3,6)) AS d(n, days)
CROSS JOIN LATERAL (SELECT (700 + ((h.id * 37 + d.n * 53) % 250))::numeric AS vol) v;

UPDATE public.hubs SET tank_current_stock_gal = 1700 + ((id * 131) % 1500);
UPDATE public.hubs SET tank_current_stock_gal = 640 WHERE id = 7;
UPDATE public.hubs SET tank_current_stock_gal = 410 WHERE id = 13;

-- triggers
CREATE OR REPLACE FUNCTION public.apply_hub_fuel_delivery() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.received_by := COALESCE(NEW.received_by, auth.uid());
  IF NEW.volume_gal <= 0 OR NEW.volume_gal > 20000 THEN RAISE EXCEPTION 'Delivery volume must be between 1 and 20,000 gallons'; END IF;
  NEW.total_cost_usd := round(NEW.volume_gal * NEW.unit_cost_usd, 2);
  UPDATE public.hubs SET tank_current_stock_gal = tank_current_stock_gal + NEW.volume_gal WHERE id = NEW.hub_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER hub_fuel_delivery_apply BEFORE INSERT ON public.hub_fuel_deliveries FOR EACH ROW EXECUTE FUNCTION public.apply_hub_fuel_delivery();

CREATE OR REPLACE FUNCTION public.apply_fuel_drawdown() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s numeric; r numeric; hname text;
BEGIN
  UPDATE public.hubs SET tank_current_stock_gal = GREATEST(0, tank_current_stock_gal - NEW.volume_litres / 3.78541)
  WHERE id = NEW.hub_id RETURNING tank_current_stock_gal, tank_reorder_level_gal, name INTO s, r, hname;
  IF s IS NOT NULL AND s < r AND s + NEW.volume_litres / 3.78541 >= r THEN
    INSERT INTO public.alerts (hub_id, level, type, message)
    VALUES (NEW.hub_id, 'warning', 'fuel_low_depot', hname || ' depot fuel below reorder level: ' || round(s) || ' gal left');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER fuel_logs_drawdown AFTER INSERT ON public.fuel_logs FOR EACH ROW EXECUTE FUNCTION public.apply_fuel_drawdown();

REVOKE EXECUTE ON FUNCTION public.apply_hub_fuel_delivery() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.apply_fuel_drawdown() FROM anon, authenticated, public;