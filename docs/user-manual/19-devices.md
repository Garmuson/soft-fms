# Device Register

## Overview

The register of all 355 supplied devices: 300 vehicle trackers, 50 tablets and 5 command-room monitors, each with a serial number, model, SIM number, assignment and warranty dates.

## What you see

**Device tabs.** All devices, **Trackers**, **Tablets**, **Monitors**, **Faulty**, and **Checked in (2h)** — devices that reported within the last two hours.

**Device table.** Serial, type, model, hub, machine, assigned person, SIM number, status (Active, Faulty, Spare, Retired), installed date, warranty end and last check-in. Search by serial or unit; filter by type and hub.


## Report or retire a faulty device

1. Open **Device Register** and find the device (search by serial or unit ID).
2. Click the device and set its **Status** to **Faulty** — the message '<serial> marked faulty' confirms.
3. Report it to HQ; faulty trackers and tablets are swapped within 5 working days under the support contract.
4. When the replacement is fitted, register it and set the old one to **Retired**.

## Field reference

| Field | Description | Required | Rules / Format |
|---|---|---|---|
| Serial | The device's unique serial number | Yes | Free text; unique |
| Kind | Device category | Yes | Tracker, Monitor, Tablet |
| Machine / Hub | Where the device is fitted | Sometimes | Trackers are fitted to machines; tablets to hubs |
| SIM number | The SIM used for data | No | Free text |
| Warranty end | Warranty expiry date | No | 12 months from installation |

## Role notes

- Hub Supervisors see their own hub's devices; HQ Administrators see all.

> **Tip:** Check the **Checked in (2h)** tab daily — a machine that stops reporting may have a faulty tracker or a power problem.

