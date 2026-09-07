insert into public.hubs (id, name, county, lat_center, lng_center) values
 (1,'Hub 1','Montserrado',6.328,-10.797),
 (2,'Hub 2','Nimba',7.360,-8.717),
 (3,'Hub 3','Bong',6.830,-9.470),
 (4,'Hub 4','Lofa',8.020,-9.750),
 (5,'Hub 5','Margibi',6.520,-10.350),
 (6,'Hub 6','Grand Bassa',6.230,-9.820),
 (7,'Hub 7','Sinoe',5.010,-8.870),
 (8,'Hub 8','Grand Gedeh',6.070,-8.130),
 (9,'Hub 9','Maryland',4.720,-7.740),
 (10,'Hub 10','Rivercess',5.900,-9.450),
 (11,'Hub 11','Grand Kru',4.760,-8.220),
 (12,'Hub 12','Gbarpolu',7.500,-10.080),
 (13,'Hub 13','Bomi',6.760,-10.800),
 (14,'Hub 14','Grand Cape Mount',6.930,-11.150),
 (15,'Hub 15','River Gee',5.280,-7.870),
 (16,'Hub 16','Zone A',6.600,-9.100),
 (17,'Hub 17','Zone B',7.100,-9.900),
 (18,'Hub 18','Zone C',5.600,-8.500),
 (19,'Hub 19','Zone D',7.800,-10.400);

with spec(mtype, code, n) as (
  values ('motor_grader','MG',3),('front_end_loader','FL',4),('excavator','EX',3),
         ('dump_truck','DT',4),('compactor','CM',3),('other','OT',2)
), base as (
  select h.id as hub_id, h.lat_center, h.lng_center, s.mtype, s.code, gs as k
  from public.hubs h cross join spec s cross join lateral generate_series(1, s.n) gs
), numbered as (
  select *,
    row_number() over (partition by code order by hub_id, k) as type_rn,
    row_number() over (partition by hub_id order by code, k) as hub_rn
  from base
), statused as (
  select *, case
      when hub_rn <= 14 then 'active'
      when hub_rn = 15 then 'maintenance'
      when hub_rn <= 18 then 'idle'
      when hub_id % 3 = 0 then 'alert'
      else 'active' end as st
  from numbered
)
insert into public.machines
 (unit_id, hub_id, type, status, fuel_level, engine_hours_today, engine_hours_lifetime,
  lat, lng, speed_kmh, ignition_on, last_seen)
select
 'LR-'||code||'-'||lpad(type_rn::text,3,'0'),
 hub_id, mtype::public.machine_type, st::public.machine_status,
 25 + floor(random()*70)::int,
 case when st='active' then round((random()*8.5)::numeric,2) else 0 end,
 round((500 + random()*4200)::numeric,2),
 round((lat_center + (random()-0.5)*0.24)::numeric,6),
 round((lng_center + (random()-0.5)*0.24)::numeric,6),
 case when st='active' then round((random()*32)::numeric,2) else 0 end,
 st='active',
 now() - (floor(random()*90)||' seconds')::interval
from statused;

insert into public.projects (name, hub_id, status, progress_pct, machines_assigned, km_coverage, deadline, description) values
 ('Montserrado Highway Rehabilitation Phase 1',1,'active',62,7,28.0,'2026-10-31','Primary corridor rehabilitation in Montserrado County.'),
 ('Rural Feeder Road — North Montserrado',1,'delayed',28,8,14.0,'2026-09-30','Feeder road network serving northern communities.'),
 ('Nimba County Feeder Road East',2,'active',74,6,18.0,'2026-11-30','Eastern feeder road upgrade in Nimba County.'),
 ('Grand Bassa Bridge Approach Road',6,'complete',100,0,8.0,'2026-06-30','Bridge approach works, completed.'),
 ('Rivercess Highway Rehabilitation',10,'critical',31,5,22.0,'2026-08-15','Highway rehabilitation running behind schedule.'),
 ('Gbarpolu Feeder Road South',12,'delayed',44,7,16.0,'2026-10-15','Southern feeder road works in Gbarpolu.');

update public.machines m set current_project_id = p.id
from (select id, hub_id, row_number() over (partition by hub_id order by created_at) rn from public.projects) p
where m.hub_id = p.hub_id and p.rn = 1 and m.status = 'active';

with al(hub_id, lvl, atype, msg) as (values
 (10,'critical','engine_overtemp','Engine coolant temperature exceeded 118°C — shut down immediately'),
 (10,'critical','fuel_critical','Fuel level below 8% — machine at risk of stranding'),
 (10,'critical','unauthorised_movement','Movement detected outside approved working hours'),
 (5,'critical','tamper','GPS unit tamper switch triggered'),
 (12,'critical','maintenance_overdue','Preventive service overdue by 62 engine hours'),
 (2,'warning','idle_timeout','Machine idling for 94 minutes with engine running'),
 (2,'warning','fuel_anomaly','Fuel level dropped 22% with no logged refill'),
 (7,'warning','geofence_breach','Machine exited assigned hub geofence'),
 (11,'warning','idle_timeout','Extended idle detected during shift hours'),
 (12,'warning','device_offline','No GPS report received for 46 minutes'),
 (12,'warning','maintenance_overdue','Hydraulic inspection overdue'),
 (14,'warning','fuel_critical','Fuel level below 15%'),
 (15,'warning','geofence_breach','Entered restricted quarry zone'),
 (18,'warning','engine_overtemp','Engine temperature trending high'),
 (18,'warning','idle_timeout','Idle timeout threshold exceeded'),
 (1,'info','maintenance_overdue','Scheduled service completed and cleared'),
 (3,'info','device_offline','GPS unit reconnected successfully'),
 (6,'info','geofence_breach','Geofence alert resolved by supervisor'),
 (8,'info','idle_timeout','Idle alert auto-resolved'),
 (16,'info','fuel_anomaly','Fuel reading reconciled after manual entry')
)
insert into public.alerts (machine_id, hub_id, level, type, message, is_acknowledged, created_at)
select m.id, al.hub_id, al.lvl::public.alert_level, al.atype, al.msg,
  al.lvl = 'info',
  now() - (floor(random()*72)||' hours')::interval
from al
cross join lateral (
  select id from public.machines where hub_id = al.hub_id order by random() limit 1
) m;

insert into public.fuel_logs
 (machine_id, hub_id, volume_litres, cost_usd, fuel_level_before, fuel_level_after,
  location_lat, location_lng, is_flagged, flag_reason, logged_at, notes)
select m.id, m.hub_id, v.vol, round((v.vol * (0.85 + random()*0.25))::numeric,2),
  v.before_lvl, least(100, v.before_lvl + 20 + floor(random()*40)::int),
  m.lat, m.lng,
  v.rn <= 8,
  case when v.rn <= 8 then (case when v.rn % 2 = 0 then 'Suspicious volume drop — possible siphoning' else 'Rapid fill not matching capacity' end) end,
  now() - (floor(random()*30)||' days')::interval - (floor(random()*20)||' hours')::interval,
  null
from (
  select gs as rn, round((60 + random()*190)::numeric,2) as vol, 10 + floor(random()*50)::int as before_lvl
  from generate_series(1,200) gs
) v
cross join lateral (select id, hub_id, lat, lng from public.machines order by random() limit 1) m;

insert into public.maintenance_records
 (machine_id, hub_id, type, status, description, parts_used, labour_hours, technician_name,
  scheduled_at, completed_at, cost_usd, notes)
select m.id, m.hub_id,
  (array['preventive','corrective','inspection','annual'])[1 + (v.rn % 4)],
  case when v.rn <= 6 then 'overdue' when v.rn <= 12 then 'scheduled' when v.rn <= 18 then 'in_progress' else 'completed' end,
  (array['250-hour preventive service','Hydraulic hose replacement','Brake system inspection','Annual certification inspection','Undercarriage repair','Cooling system flush'])[1 + (v.rn % 6)],
  (array['Oil filter, engine oil','Hydraulic hose, seals','Brake pads','—','Track rollers','Coolant, thermostat'])[1 + (v.rn % 6)],
  round((2 + random()*10)::numeric,2),
  (array['J. Kollie','M. Doe','S. Kpehe','A. Tarpeh','B. Sirleaf'])[1 + (v.rn % 5)],
  now() - (floor(random()*90)||' days')::interval,
  case when v.rn > 18 then now() - (floor(random()*40)||' days')::interval end,
  round((150 + random()*2200)::numeric,2),
  null
from generate_series(1,45) as v(rn)
cross join lateral (select id, hub_id from public.machines order by random() limit 1) m;

insert into public.gps_tracks (machine_id, lat, lng, speed_kmh, engine_on, fuel_level, recorded_at)
select m.id,
  round((m.lat + sin(gs::numeric/6) * 0.02 + (random()-0.5)*0.004)::numeric,6),
  round((m.lng + cos(gs::numeric/6) * 0.02 + (random()-0.5)*0.004)::numeric,6),
  round((random()*28)::numeric,2), true,
  greatest(5, m.fuel_level - (48 - gs)/3)::int,
  now() - ((48 - gs) * 30 || ' minutes')::interval
from public.machines m
cross join generate_series(1,48) gs
where m.status = 'active';

insert into public.geofences (name, hub_id, polygon_json, alert_on_exit, alert_on_entry)
select h.name || ' operating zone', h.id,
  jsonb_build_object('type','Polygon','coordinates', jsonb_build_array(jsonb_build_array(
    jsonb_build_array(h.lng_center-0.2, h.lat_center-0.2),
    jsonb_build_array(h.lng_center+0.2, h.lat_center-0.2),
    jsonb_build_array(h.lng_center+0.2, h.lat_center+0.2),
    jsonb_build_array(h.lng_center-0.2, h.lat_center+0.2),
    jsonb_build_array(h.lng_center-0.2, h.lat_center-0.2)))),
  true, false
from public.hubs h;