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

## Progress (phase 2-5 complete)
- HQ Admin: dashboard, hubs, hub detail, machine modal + deep link, fleet register, alerts, projects, fuel, reports, users, settings — done
- Hub Supervisor: hub dashboard, my machines, work orders, fuel log, hub alerts, hub reports — done
- Field Operator: machines, tasks, fuel entry, inspection, incident report — done
- Ministry Analyst: read-only national overview, reports, hubs — done

## Open items
- Cloud security linter reports 7 SECURITY DEFINER helper functions callable by signed-in users (needed by RLS policies) — review before production sign-off.
- Machine count: brief states 285 total but also 19 per hub across 19 hubs (= 361). Seed uses 19 per hub, matching the per-hub type breakdown. Confirm with client.

## 7. Bid gap closure (done)
- [x] Geofence/work-zone management (/geofences) with map placement, radius, entry/exit alerts
- [x] Historical movement replay in machine detail (date range, play/pause timeline)
- [x] Idling & speeding monitoring with configurable thresholds (/idling) + report type
- [x] Device register: 300 trackers, 5 HQ monitors, 50 tablets (/devices)
- [x] Durable activity/audit log incl. sign-ins, acknowledgements, status changes (/activity)
- [x] Operator offline queue with retry/sync panel on operator home
- [x] User handbook, training plan, support/warranty page (/handbook)
- [x] Ministry hub scorecards (/scorecards)

## 8. Drivers & data entry (done)
- [x] Roles: data_entry_supervisor (national) and data_entry_staff (hub-scoped) + demo accounts
- [x] Driver registry /drivers — identity, licence, certifications, employment, CSV export
- [x] Driver assignments /driver-assignments — shift-based, current + history, end assignment
- [x] Data entry desk /data-entry — fuel consumption, maintenance, projects
- [x] Review queue /review-queue — supervisor approve/reject with audit trail
- [x] Database guard forces staff entries to "pending" and blocks self-approval
- [x] Seeded 95 drivers (5 per hub) and current machine assignments

## Gallons-only fuel units
- [x] Convert remaining fuel entry forms, machine logs, review queue, scorecards and exports to US gallons while preserving depot drawdown.
- [ ] Verify gallon labels and input conversion in the running app.
