# Users

## Overview

Manage staff accounts. Every user has exactly one role, and hub-based roles are tied to a hub. Accounts are deactivated rather than deleted, so the audit history stays intact.

## What you see

**User table.** Name, email, role, hub and active status.

**Invite User.** Creates an account and sends the person a sign-in link by email.

**Deactivate / Reactivate.** Switches an account off or back on ('User deactivated' / 'User reactivated').


## Create a user account

1. Open **Users** and click **Invite User**.
2. Enter the **Name** and **Email** — 'Name and email are required' appears if either is missing.
3. Select the **Role** (HQ Administrator, Hub Supervisor, Data Entry Supervisor, Data Entry Staff, Ministry Analyst).
4. Select the **Hub** for hub-based roles (Hub Supervisor, Data Entry Staff).
5. Click **Send invite** — 'Invitation sent' confirms and the person receives a sign-in link by email.

## Remove someone's access

1. Find the user in the **Users** table.
2. Click **Deactivate** — the message 'User deactivated' confirms.
3. The person can no longer sign in, but their history in the Activity Log is kept.

## Field reference

| Field | Description | Required | Rules / Format |
|---|---|---|---|
| Name | The user's full name | Yes | Free text |
| Email | Work email used to sign in | Yes | Must be a valid email address |
| Role | The user's single role | Yes | One of the five roles |
| Hub | Hub the user belongs to | For hub roles | One of the 19 hubs |

## Role notes

- Only HQ Administrators can open this screen.

> **Warning:** There is no self-service password reset. When a user forgets their password, contact Soft Solutions & Systems support to reset it.

