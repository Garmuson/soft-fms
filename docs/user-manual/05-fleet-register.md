# Fleet Register & Machine Details

## Overview

The register of all 285 yellow machines. You can search, filter, page through the list, export it to a file, add a new machine, and open any machine for its full details.

## What you see

**Fleet Register table.** Columns: Unit ID, Type, County, Status, Project, Fuel %, Hours, Last Seen. Search by unit ID; filter by hub, machine type and status; choose rows per page (25, 50 or 100) and move between pages.

**Bulk actions.** Tick machines with the checkboxes, then use **Bulk change status** or **Bulk reassign hub** to update several machines at once.

**Export.** Click **Export CSV** to download the machines currently shown (the message 'Exported N machines' confirms).

**Add Machine** (HQ Admin and Hub Supervisor only). Opens a form to register a new machine.

**Machine details page.** Click a machine's unit ID to open its full record: live position and speed, fuel gauge, engine hours, recent fuel entries, alerts, inspections, movements (GPS replay with a play/pause timeline) and assignment history.


## Find a machine

1. Open **Fleet Register** from the menu.
2. Type the unit ID (or part of it) into the search box.
3. Use the **Hub**, **Type** and **Status** filters to narrow the list.
4. Click the machine's unit ID to open its details page.

## Add a new machine

1. On **Fleet Register**, click **Add Machine**.
2. Enter the **Unit ID** (must be unique — a duplicate shows 'That unit ID already exists').
3. Select the **Hub** and the machine **Type** (the tank capacity fills in a typical size for that type).
4. Check or change the **Tank capacity (gal)** (must be between 1 and 2,000).
5. Enter the **Model** and **Serial number** if known.
6. Enter the **Current fuel level (%)** (0–100).
7. Click **Add Machine**. The message 'Machine <unit> added' confirms.

## Change several machines at once

1. Tick the machines you want to change using the checkboxes on the left of each row.
2. To change status: choose the new status in **Bulk change status** and confirm.
3. To move machines: choose the destination hub in **Bulk reassign hub** and confirm.
4. The message 'N machines set to <status>' or 'N machines reassigned' confirms.

## Field reference

| Field | Description | Required | Rules / Format |
|---|---|---|---|
| Unit ID | The machine's unique fleet number, e.g. MG-014 | Yes | Must be unique; duplicates are refused |
| Hub | The depot the machine belongs to | Yes | One of the 19 hubs |
| Type | Machine category | Yes | Motor Grader, Front End Loader, Excavator, Dump Truck, Compactor, Other |
| Tank capacity (gal) | Full fuel tank size in US gallons | Yes | 1 to 2,000 gal; prefilled from the type |
| Model | Machine model, e.g. CAT 140K | No | Free text |
| Serial number | Manufacturer's serial number | No | Free text |
| Current fuel level (%) | Fuel gauge reading when registered | Yes | 0 to 100 |

## Role notes

- Hub Supervisors and Data Entry Staff see only machines belonging to their own hub.
- Ministry Analysts can view and export but not add or change machines.

> **Tip:** On a phone, each table row becomes a card showing the first few fields; tap **View details** to see the rest.

