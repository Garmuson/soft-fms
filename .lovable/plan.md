# Bid Requirements vs. YM-FMS — Gap Review and Closing Plan

Bid: SPPCC/GOL/RB/SBA/016/2026 — GPS Tracking, Real-Time Monitoring and Fleet Management System for 285 Yellow Machines, 19 hubs plus the SPPCC Centre Office, and 50 field tablets.

## What the app already covers

Confirmed by reading the app and querying the live data:

- Central command view for the Monrovia office with fleet-wide map, live figures, hub table and alerts feed.
- Hub-level dashboards; hub staff see only their own hub, HQ sees all 19, ministry staff read-only.
- Four user account types with server-side access rules on every table.
- 285 machines, 15 per hub, with location, status, fuel, engine hours today and lifetime.
- Alerts covering geofence breach, prolonged idling, tampering, fuel critical, fuel anomaly, engine overtemp, device offline and overdue maintenance — all present in the live data and filterable.
- Machine history: 24 hours of location points drawn as a route line, plus fuel, maintenance and alert history per machine.
- Reports: daily situation, weekly operations, monthly fleet, hub scorecard, fuel analysis, maintenance compliance, GPS uptime — hub-level and national, downloadable.
- Tablet/field screens: assigned machines, shift start, 12-point inspection, fuel entry, incident report; works on a phone-sized screen and shows a banner when the connection drops.

## Gaps the bid demonstration would expose

1. **Geofence management has no screen.** Geofences are stored and breach alerts exist, but nobody can draw, edit or switch off a fence in the app. The demo explicitly asks for "geofencing and alerts".
2. **No historical playback.** The route line exists, but not the timeline scrub/animated replay the bid calls "historical playback of machine movements", and history is limited to a fixed recent window rather than a chosen date range.
3. **Speed and idling are not monitored as such.** Speed appears only as a single number on one screen; there is no speeding threshold, no idling duration, and no report for either.
4. **No tablet fleet / device health view.** The bid covers 300 trackers, 5 HQ monitors and 50 tablets. There is no place to see which devices are installed, their last check-in, warranty or assignment.
5. **No audit trail.** "Access control and audit reports" are required; the app records no who-did-what log.
6. **No field data sync indicator.** The demo asks to show field data synchronising with the central system; the app shows only an offline banner, with no queue of pending submissions.
7. **No documentation/training page.** User training and system documentation are contract deliverables with nowhere to live in the product.

## Proposed work, in demo order

1. **Geofences page** (HQ + hub supervisor): list of fences per hub, draw a fence on the map, radius or polygon, entry/exit toggles, active switch, and the machines it applies to. Hub staff limited to their own hub.
2. **Playback on machine history**: date-range picker plus a play/pause timeline that walks the machine marker along its route, with speed and stop markers.
3. **Speed and idling monitoring**: configurable thresholds in Settings, an "Idling and Speeding" report, and alert generation matching the existing alert types.
4. **Device register**: trackers, HQ monitors and tablets with serial, assignment, install date, last check-in, warranty end and status; national and per-hub counts.
5. **Activity log**: sign-ins, acknowledgements, status changes, record creation; viewable and exportable by HQ only.
6. **Field sync panel** on the operator screens: pending submissions held locally when offline, retried and confirmed when back online.
7. **Documentation page**: role-based user guides, training checklist, support contacts.

## Technical notes

- Geofences, audit log and devices need database work: `geofences` exists (add a UI plus write policies check); new `audit_log` and `devices` tables with grants, row-level security and hub scoping.
- Playback and thresholds are presentation-layer only; extend `gpsTrackQuery` to accept a start/end range.
- Speed/idling alerts are generated on read from `gps_tracks` for the demo, so no scheduler is required.
- Offline queue uses browser local storage with retry on reconnect; no schema change.

## Open decision

Item order can change. If the ten-minute demo is the priority, items 1, 2 and 4 carry the most evaluation weight; 5, 6 and 7 are compliance items that can follow.
