# Driver Assignments

## Overview

Pairs a driver with a machine for a shift, optionally linked to a project. This is the record of who operated what, and when. Data Entry Staff and Data Entry Supervisors cannot see or use this screen at all.

## What you see

**Assignment table.** One row per assignment: hub, driver, machine, project, shift, status (Assigned, In Progress, Completed, Cancelled) and dates. Search and filter by hub, driver, machine, project and status; 25 rows per page with Previous/Next; **Clear** resets the filters. Filters are saved in the page address so you can share a filtered view.

**Assign driver form.** Hub, Driver, Machine, Project (optional), Shift and notes.

**Legacy note.** Some older assignments pair drivers with machines they are not certified for; these are kept for history but new assignments enforce the certification rule.


## Assign a driver to a machine

1. Open **Assignments** and click **Assign driver**.
2. Select the **Hub**.
3. Type the driver's name or staff number and select them from the list (only drivers in that hub appear).
4. Select the **Machine** — only machines the driver is **certified for** are offered.
5. Select the **Project** if the shift belongs to one (or leave it as **No project**).
6. Choose the **Shift** (Morning, Afternoon or Night).
7. Click **Assign driver**. The message 'Driver assigned' confirms (or 'Assignment sent for review' if your entry needs approval first).

## Finish or cancel an assignment

1. Find the assignment in the table.
2. Change its **Status** to Completed or Cancelled.
3. The message 'Assignment updated' confirms.

## Field reference

| Field | Description | Required | Rules / Format |
|---|---|---|---|
| Hub | The hub the work belongs to | Yes | One of the 19 hubs |
| Driver | The driver being assigned | Yes | Must be active; 'Choose a driver first' if empty |
| Machine | The machine for the shift | Yes | Must match the driver's certifications — mismatches are refused |
| Project | Road project the shift supports | No | Optional; 'No project' allowed |
| Shift | Working period | Yes | Morning, Afternoon, Night |

## Role notes

- HQ Administrators can manage assignments for every hub; Hub Supervisors only for their own hub; Ministry Analysts can view only.
- Deleting an assignment is reserved for HQ Administrators.

> **Warning:** If the machine list does not include the machine you expect, the driver is probably not certified for that machine type. Update the driver's **Certified for** list in the Driver Registry first.

