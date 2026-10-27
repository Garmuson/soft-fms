# Fuel: Overview, Depot, Entry & Log

## Overview

Fuel is managed in US gallons everywhere. The hub depot stock rises when deliveries arrive and falls automatically when machines refuel. Refuel entries capture the gallons dispensed and the gauge readings before and after.

## What you see

**Fuel Overview (HQ, Ministry, Data Entry Supervisor).** A national view: fuel used per hub and per machine, totals in gallons and USD, burn-down charts, and a table of every hub's depot with capacity, current stock, daily burn and days to empty.

**Hub Fuel Depot.** On each hub page: the tank gauge (Healthy / Reorder Needed / Critical Low), 30-day drawdown chart, and the Deliveries received and Machine drawdowns ledgers. The **Receive Bulk Fuel** button records incoming deliveries.

**Fuel Entry (Data Entry Staff, Hub Supervisor).** The field refuel form: machine, volume in gallons, gauge reading before and after, optional GPS location, and notes.

**Fuel Log (Hub Supervisor).** The hub's day-by-day refuel ledger with a flag option for anything that looks wrong.


## Record a machine refuel (Fuel Entry)

1. Open **Fuel Entry**.
2. Select the **Machine**.
3. Enter the **Volume (gal)** pumped — 'Choose a machine and enter the volume' appears if either is missing.
4. Set the gauge reading **Before (%)** and **After (%)** using the sliders.
5. Optionally tap **Capture location** to record where the refuel happened ('Location captured'), or skip it.
6. Add any **Notes**.
7. Tap **Submit**. The entry is saved and the same gallons are deducted from the hub depot stock automatically.

## Flag a suspicious entry (Fuel Log)

1. Open **Fuel Log** and find the entry.
2. Click **Flag** and give the reason.
3. The message 'Entry flagged' confirms; the entry is marked for attention in red.

## Understand the drawdown ledger

1. Open a hub's page and find the **Hub Fuel Depot** panel.
2. The **Deliveries received** tab lists every bulk delivery (waybill, supplier, gallons, cost, dipstick readings).
3. The **Machine drawdowns** tab lists every refuel deducted from the tank.
4. Stock today = starting stock + all deliveries − all machine drawdowns. The gauge and chart update by themselves.

## Field reference

| Field | Description | Required | Rules / Format |
|---|---|---|---|
| Machine | The machine being refuelled | Yes | From the hub's machine list |
| Volume (gal) | Gallons dispensed | Yes | Positive number, in US gallons |
| Before (%) / After (%) | Fuel gauge readings | Yes | 0 to 100 |
| Location | GPS position of the refuel | No | Captured from the device; 'Location is not available on this device' if the device blocks it |

## Role notes

- Data Entry Staff record refuels for their own hub; Hub Supervisors can also record and flag entries.
- Ministry Analysts can view the Fuel Overview but not record anything.

> **Warning:** Never try to adjust the hub tank stock figure directly. Deliveries and refuels move it automatically, and the ledger is designed to be tamper-proof so audits can trust it.

> **Tip:** A hub below its reorder level automatically raises a 'fuel_low_depot' warning alert.

