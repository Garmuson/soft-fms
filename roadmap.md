# YM-FMS Roadmap

## 1. Foundation
- [ ] Enable Lovable Cloud (Supabase)
- [ ] Design system tokens (dark, green/gold), Inter + JetBrains Mono
- [ ] Schema: profiles, user_roles, hubs, machines, projects, assignments, fuel_logs,
      maintenance_records, alerts, inspections, gps_tracks, geofences, work_orders, reports
- [ ] RLS + grants per role (hq_admin, hub_supervisor, field_operator, ministry_analyst)
- [ ] Seed: 19 hubs, 285 machines, 6 projects, 20 alerts, fuel logs, maintenance, gps tracks
- [ ] Demo users (hq/hub2/hub10/operator/ministry @sppcc.gov.lr, password123)
- [ ] Auth: login page, role-based routing, route guards

## 2. HQ Admin
- [ ] Live Command Dashboard (KPIs, Leaflet map, utilization ring, alerts feed, hub table)
- [ ] All 19 Hubs grid + filters
- [ ] Hub Detail /hub/:id
- [ ] Machine Detail modal (5 tabs)
- [ ] Fleet Register (filters, sort, pagination, CSV export)
- [ ] Alerts page (tabs, filters, acknowledge)
- [ ] Projects, Fuel Overview, Reports, User Management, Settings

## 3. Hub Supervisor
- [ ] Hub Dashboard, My Machines, Work Orders, Fuel Log, Hub Alerts, Hub Reports

## 4. Field Operator (mobile)
- [ ] My Machines, Inspection, Fuel Entry, Incident Report, Today's Tasks

## 5. Ministry Analyst
- [ ] National Overview (read-only), Reports, Hub Scorecards

## 6. Cross-cutting
- [ ] Realtime (machines, alerts), toasts, notification drawer
- [ ] Skeletons, empty states, error + offline banners
- [ ] URL filter state, keyboard/focus accessibility, head metadata
