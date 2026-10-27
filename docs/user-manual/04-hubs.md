# Hubs

## Overview

The 19 SPPCC hubs are the depots where the yellow machines are based. The Hubs page lists every hub; each hub has its own page with machines, fuel depot, alerts, projects and staff.

## What you see

**Hubs list.** One card or row per hub showing name, county, machine counts (active, maintenance, idle) and utilisation. Search by county or hub name; filter by utilisation band and by alert status.

**Hub page (click any hub).** Headline figures for the hub, the hub map, the **Hub Fuel Depot** panel (tank gauge, drawdown chart, deliveries), alerts, active projects and the machine register for that hub.

**Hub Fuel Depot.** Tank gauge with current stock, capacity and status (Healthy, Reorder Needed, Critical Low), average daily burn, days of fuel left, and a 30-day drawdown chart. Tabs switch between **Deliveries received** and **Machine drawdowns**.


## Review a hub's status

1. Open **All 19 Hubs** from the menu.
2. Use the search box to type a county or hub name.
3. Click the hub row to open the hub page.
4. Read the KPI cards, then scroll to the **Hub Fuel Depot** panel to check fuel on hand.

## Receive a bulk fuel delivery into a hub tank

1. Open the hub's page and find the **Hub Fuel Depot** panel.
2. Click **Receive Bulk Fuel**.
3. Enter the **Waybill number** and **Supplier name**.
4. Enter the **Dipstick before (gal)** reading taken before discharge.
5. Enter the **Volume (gal)** delivered and the **Unit cost (USD)** per gallon.
6. Enter the **Dipstick after (gal)** reading taken after discharge.
7. Click **Record delivery**. The message '<volume> gal received into <hub> depot' appears and the hub's stock rises immediately.

## Field reference

| Field | Description | Required | Rules / Format |
|---|---|---|---|
| Waybill number | The supplier's delivery note number | Yes | Free text |
| Supplier name | The company that delivered the fuel | Yes | Free text |
| Dipstick before (gal) | Tank level measured before discharge | No | Gallons, 0 or more |
| Volume (gal) | Fuel received, in US gallons | Yes | Between 1 and 20,000 gal; must not push the tank over capacity |
| Unit cost (USD) | Price per gallon on the waybill | Yes | US dollars per gallon |
| Dipstick after (gal) | Tank level measured after discharge | No | Gallons, 0 or more |

## Role notes

- Hub Supervisors open their own hub through **Hub Dashboard**, not this page.
- Data Entry Supervisors can view hubs and the fleet but do not receive fuel.

> **Warning:** The hub tank stock is updated automatically by the system when deliveries are recorded and when machines refuel. Never try to change the stock figure by hand — the system does not allow it, and the ledger is designed to be tamper-proof.

