# Roles & Permissions

## Overview

Every account has exactly one role. The role decides which screens you can open and what you can do there. Access rules are also enforced inside the database, so they hold even if someone tries to go around the screens.

## What you see

| Module | HQ Administrator | Hub Supervisor | Data Entry Supervisor | Data Entry Staff | Ministry Analyst |
|---|---|---|---|---|---|
| Live Overview / National Overview | View | — | — | — | View |
| All 19 Hubs + Hub detail | View | View (own hub) | View | — | View |
| Fleet Register (machines) | View, Create, Edit, Export | View (own hub) | View | View (own hub) | View |
| Hub Dashboard / My Machines | — | View, Edit | — | — | — |
| Work Orders | — | Create, Edit | — | View tasks, Update status | — |
| Driver Registry | Create, Edit | Create, Edit (own hub) | Create, Edit | Create, Edit (own hub) | View |
| Driver Assignments | Create, Edit, Delete | Create, Edit (own hub) | — | — | View |
| Fuel Overview | View | — | View | — | View |
| Hub Fuel Depot (deliveries) | View, Receive | View, Receive (own hub) | — | — | View |
| Fuel Entry / Fuel Log | View | Create, Edit (own hub) | — | Create (own hub) | — |
| Shifts (start / end) | — | — | — | Create (own hub) | — |
| Inspection | — | Create (own hub) | — | Create (own hub) | — |
| Incident | — | Create (own hub) | — | Create (own hub) | — |
| Enter Data (fuel / maintenance) | Create | Create (own hub) | Create | Create (own hub) | — |
| Review Queue | Approve, Reject | — | Approve, Reject | — | — |
| Alerts | View, Acknowledge | View, Acknowledge (own hub) | — | — | View |
| Geofences | View, Create, Edit | View, Create, Edit (own hub) | — | — | View |
| Idling & Speeding | View | View (own hub) | — | — | View |
| Device Register | View, Edit | View, Edit (own hub) | — | — | View |
| Projects | View, Create, Edit | View, Create, Edit (own hub) | View | — | View |
| Reports | View, Generate, Export | View, Generate (hub) | — | — | View, Generate, Export |
| Users | Create, Edit | — | — | — | — |
| Activity Log | View | — | View | — | View |
| Settings | Edit | — | — | — | — |
— means the screen is not shown and access is refused.


## Role notes

- Only HQ Administrators can manage users, settings, and delete assignments. Hub Supervisors manage their own hub only.
- Data Entry Staff and Data Entry Supervisors cannot see or use Driver Assignments at all.
- Data entry roles cannot create or edit Projects — that belongs to HQ Administrators and Hub Supervisors.
- Ministry Analysts are read-only: they can view and export but every change button is hidden or refused.

> **Note:** The old 'Field Operator' role has been retired. The field screens (Shifts, Fuel Entry, Inspection, Incident, Today's Tasks) now belong to Data Entry Staff, who work within their own hub.

