# Geofences

## Overview

Work zones drawn on the map. The system can alert when a machine leaves or enters a zone — for example a road corridor a grader should stay within.

## What you see

**Geofence list.** Each zone with its name, hub, whether it is active, and its entry/exit alert settings.

**Zone form.** Name, hub, the zone's shape placed on the map, and the alert switches.


## Create a work zone

1. Open **Geofences** and click **Add zone**.
2. Enter the **Zone name**, e.g. 'Gbarnga Corridor'.
3. Select the **Hub** the zone belongs to.
4. Place the zone on the map by entering the **Latitude** and **Longitude** corners or dragging the shape.
5. Switch on **Alert on entry** and/or **Alert on exit** as needed.
6. Save. The zone appears in the list and takes effect immediately.

## Field reference

| Field | Description | Required | Rules / Format |
|---|---|---|---|
| Zone name | A clear name for the work area | Yes | Free text |
| Hub | The hub responsible for the zone | Yes | One of the 19 hubs |
| Latitude / Longitude | The zone's position on the map | Yes | Decimal degrees |
| Alert on entry / exit | When the system should raise an alert | No | On/off switches |

## Role notes

- Hub Supervisors manage zones for their own hub; Ministry Analysts can view only.

> **Tip:** Draw tight zones around the actual working corridor — zones that are too wide will not catch real deviations.

