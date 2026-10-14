UPDATE public.fuel_logs SET logged_at = logged_at + interval '7 days' WHERE logged_at < '2026-10-08';
DELETE FROM public.hub_fuel_deliveries WHERE hub_id IN (7,13) AND received_at > now() - interval '10 days';
UPDATE public.hubs h SET tank_current_stock_gal = GREATEST(150,
  (CASE WHEN h.id IN (7,13) THEN 1150 ELSE 1700 + (h.id * 53) % 400 END)
  + COALESCE((SELECT sum(volume_gal) FROM public.hub_fuel_deliveries d WHERE d.hub_id = h.id AND d.received_at > now() - interval '30 days'),0)
  - COALESCE((SELECT sum(volume_litres)/3.78541 FROM public.fuel_logs f WHERE f.hub_id = h.id AND f.review_status <> 'rejected' AND f.logged_at > now() - interval '30 days'),0));