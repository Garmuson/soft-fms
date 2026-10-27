// YM-FMS User Manual content — single source of truth for the in-app Help Centre
// (/help) and the exported Markdown files in /docs/user-manual/.
// Every screen, field and message below was taken from the actual codebase.
import type { Role } from "@/lib/fleet";

export const MANUAL_META = {
  name: "YM-FMS — Yellow Machine Fleet Management System",
  version: "1.0",
  date: "27 October 2026",
  preparedBy: "Soft Solutions & Systems, Monrovia, Liberia",
  contact: {
    company: "Soft Solutions & Systems",
    website: "www.softechsys.com",
    phone: "+231 776 299 741",
    supportHours: "Monday–Saturday, 08:00–18:00 GMT",
    criticalResponse: "Within 4 working hours",
    deviceReplacement: "Faulty trackers and tablets swapped within 5 working days",
    warranty: "12 months on all supplied devices from installation",
  },
};

const ALL: Role[] = [
  "hq_admin",
  "hub_supervisor",
  "ministry_analyst",
  "data_entry_supervisor",
  "data_entry_staff",
];

export type ManualCallout = { kind: "tip" | "warning" | "note"; text: string };
export type ManualField = {
  field: string;
  description: string;
  required: "Yes" | "No" | "Sometimes";
  rules: string;
};
export type ManualProcedure = { title: string; steps: string[] };

export type ManualChapter = {
  id: string;
  title: string;
  roles: Role[] | "all";
  routes: string[];
  overview: string;
  screens: string[];
  procedures: ManualProcedure[];
  fields?: ManualField[];
  roleNotes?: string[];
  callouts?: ManualCallout[];
  screenshots?: string[];
};

export const MANUAL: ManualChapter[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    roles: "all",
    routes: ["/auth"],
    overview:
      "YM-FMS (Yellow Machine Fleet Management System) is the official fleet management system for the SPPCC's yellow machine fleet — 285 machines across 19 hubs in Liberia. It tracks machine location, fuel, utilisation, drivers, projects, work orders and maintenance, and keeps a full audit trail of every action.",
    screens: [
      "**Sign-in page.** A single email and password form. Enter your SPPCC email address and your password, then click **Sign in**. If the details are correct you are taken straight to your own dashboard, which is different for each role.",
      "**Validation on sign-in.** If the email has no '@' you see 'Enter a valid email address.' If the password is shorter than 6 characters you see 'Password must be at least 6 characters.' If the account details are wrong, the message from the server appears in a red box above the button.",
      "**Interface tour.** The top bar shows the YM-FMS logo, your working context (fleet-wide or your hub), a live-connection indicator, a bell for notifications, your name and role, and the sign-out button. On desktop a side menu on the left lists every screen you are allowed to use, grouped into sections. On phones the menu collapses into a bottom bar with your four main screens plus a **More** button; the top bar keeps only the logo and a menu button.",
      "**Common icons.** The bell shows unread alerts. A yellow left border marks the screen you are on. A 'Read Only' badge in the top bar means your role (Ministry Analyst) can look but not change anything.",
      "**Offline notice.** If the connection drops, an amber bar appears at the top: 'Connection lost — showing cached data. Reconnecting…'. When it returns, a green bar shows 'Reconnected'.",
    ],
    procedures: [
      {
        title: "Sign in for the first time",
        steps: [
          "Open the YM-FMS web address in your browser.",
          "Type your SPPCC email address in the **Email** box.",
          "Type your password in the **Password** box.",
          "Click **Sign in**.",
          "You will be taken automatically to your role's home screen (for example, the Live Overview for HQ Administrators or the Hub Dashboard for Hub Supervisors).",
        ],
      },
      {
        title: "Sign out",
        steps: [
          "Click the sign-out icon (a door with an arrow) at the right end of the top bar on desktop, or open the **More** menu on a phone.",
          "You are returned to the sign-in page and your session is closed.",
        ],
      },
      {
        title: "Find help for the screen you are on",
        steps: [
          "Click the **?** help icon in the top bar.",
          "The Help Centre opens directly at the chapter that matches the screen you were using.",
        ],
      },
    ],
    roleNotes: [
      "Hub staff only see data for their own hub. Ministry Analysts see national data but cannot change anything.",
      "If you see 'This screen isn't part of your role', your account does not have access to that page — click **Go to my dashboard** to return to your own home screen.",
    ],
    callouts: [
      {
        kind: "warning",
        text: "There is no self-service password reset in the app yet. If you forget your password, contact the system administrator (see the Support section) to have it reset for you.",
      },
      {
        kind: "tip",
        text: "Never share your sign-in details. Every action you take is recorded in the Activity Log with your name and email.",
      },
    ],
    screenshots: ["[SCREENSHOT: Sign-in page]", "[SCREENSHOT: Top bar and side menu]"],
  },
  {
    id: "roles-permissions",
    title: "Roles & Permissions",
    roles: "all",
    routes: [],
    overview:
      "Every account has exactly one role. The role decides which screens you can open and what you can do there. Access rules are also enforced inside the database, so they hold even if someone tries to go around the screens.",
    screens: [
      "| Module | HQ Administrator | Hub Supervisor | Data Entry Supervisor | Data Entry Staff | Ministry Analyst |",
      "|---|---|---|---|---|---|",
      "| Live Overview / National Overview | View | — | — | — | View |",
      "| All 19 Hubs + Hub detail | View | View (own hub) | View | — | View |",
      "| Fleet Register (machines) | View, Create, Edit, Export | View (own hub) | View | View (own hub) | View |",
      "| Hub Dashboard / My Machines | — | View, Edit | — | — | — |",
      "| Work Orders | — | Create, Edit | — | View tasks, Update status | — |",
      "| Driver Registry | Create, Edit | Create, Edit (own hub) | Create, Edit | Create, Edit (own hub) | View |",
      "| Driver Assignments | Create, Edit, Delete | Create, Edit (own hub) | — | — | View |",
      "| Fuel Overview | View | — | View | — | View |",
      "| Hub Fuel Depot (deliveries) | View, Receive | View, Receive (own hub) | — | — | View |",
      "| Fuel Entry / Fuel Log | View | Create, Edit (own hub) | — | Create (own hub) | — |",
      "| Shifts (start / end) | — | — | — | Create (own hub) | — |",
      "| Inspection | — | Create (own hub) | — | Create (own hub) | — |",
      "| Incident | — | Create (own hub) | — | Create (own hub) | — |",
      "| Enter Data (fuel / maintenance) | Create | Create (own hub) | Create | Create (own hub) | — |",
      "| Review Queue | Approve, Reject | — | Approve, Reject | — | — |",
      "| Alerts | View, Acknowledge | View, Acknowledge (own hub) | — | — | View |",
      "| Geofences | View, Create, Edit | View, Create, Edit (own hub) | — | — | View |",
      "| Idling & Speeding | View | View (own hub) | — | — | View |",
      "| Device Register | View, Edit | View, Edit (own hub) | — | — | View |",
      "| Projects | View, Create, Edit | View, Create, Edit (own hub) | View | — | View |",
      "| Reports | View, Generate, Export | View, Generate (hub) | — | — | View, Generate, Export |",
      "| Users | Create, Edit | — | — | — | — |",
      "| Activity Log | View | — | View | — | View |",
      "| Settings | Edit | — | — | — | — |",
      "— means the screen is not shown and access is refused.",
    ],
    procedures: [],
    roleNotes: [
      "Only HQ Administrators can manage users, settings, and delete assignments. Hub Supervisors manage their own hub only.",
      "Data Entry Staff and Data Entry Supervisors cannot see or use Driver Assignments at all.",
      "Data entry roles cannot create or edit Projects — that belongs to HQ Administrators and Hub Supervisors.",
      "Ministry Analysts are read-only: they can view and export but every change button is hidden or refused.",
    ],
    callouts: [
      {
        kind: "note",
        text: "The old 'Field Operator' role has been retired. The field screens (Shifts, Fuel Entry, Inspection, Incident, Today's Tasks) now belong to Data Entry Staff, who work within their own hub.",
      },
    ],
  },
  {
    id: "command-dashboard",
    title: "Live Command Dashboard",
    roles: ["hq_admin"],
    routes: ["/dashboard"],
    overview:
      "The command centre for the whole fleet. It shows the live map, headline figures, hub utilisation table and the open-alerts feed on one screen. This is the HQ Administrator's home screen.",
    screens: [
      "**Headline figures (KPI cards).** Total machines, machines active, hubs below the 80% utilisation target, open alerts, fuel on hand (galleries), and average utilisation — each card has a yellow strip along the top.",
      "**Live map.** Every machine is a pin, coloured by status; hub depots are shown as zones. Click a pin to open a details panel with unit ID, type, status, operator, hub, project, fuel bar, last-seen time and GPS position.",
      "**Hub table.** One row per hub: county, machine counts by status, utilisation percentage and open alerts. Click a hub row to open its full hub page.",
      "**Alerts feed.** The most recent alerts, newest first, with level (critical, warning, info). Click **Acknowledge** on an alert you have acted on.",
    ],
    procedures: [
      {
        title: "Find a machine on the map",
        steps: [
          "On **Live Overview**, click the machine's pin on the map.",
          "Read the details panel: unit ID, machine type, status, operator, hub and project.",
          "Check the fuel bar and the 'last seen' time to confirm the machine is reporting.",
          "Close the panel when finished.",
        ],
      },
      {
        title: "Acknowledge an alert",
        steps: [
          "Find the alert in the alerts feed (or open the **Alerts** page).",
          "Click **Acknowledge**.",
          "The message 'Alert acknowledged' appears and the alert stops counting as open. Your name and the time are saved in the Activity Log.",
        ],
      },
      {
        title: "Spot a hub below target",
        steps: [
          "Look at the 'hubs below 80%' figure on the KPI cards.",
          "In the hub table, sort or scan for the lowest utilisation.",
          "Click the hub row to open its page and see which machines are idle or in maintenance.",
        ],
      },
    ],
    roleNotes: ["Only HQ Administrators can open this screen. Ministry Analysts use **National Overview** instead."],
    callouts: [
      { kind: "tip", text: "The map and figures refresh by themselves — there is no need to reload the page." },
    ],
    screenshots: ["[SCREENSHOT: Live Command Dashboard with map and KPI cards]"],
  },
  {
    id: "hubs",
    title: "Hubs",
    roles: ["hq_admin", "ministry_analyst", "data_entry_supervisor"],
    routes: ["/hubs", "/hub/$id"],
    overview:
      "The 19 SPPCC hubs are the depots where the yellow machines are based. The Hubs page lists every hub; each hub has its own page with machines, fuel depot, alerts, projects and staff.",
    screens: [
      "**Hubs list.** One card or row per hub showing name, county, machine counts (active, maintenance, idle) and utilisation. Search by county or hub name; filter by utilisation band and by alert status.",
      "**Hub page (click any hub).** Headline figures for the hub, the hub map, the **Hub Fuel Depot** panel (tank gauge, drawdown chart, deliveries), alerts, active projects and the machine register for that hub.",
      "**Hub Fuel Depot.** Tank gauge with current stock, capacity and status (Healthy, Reorder Needed, Critical Low), average daily burn, days of fuel left, and a 30-day drawdown chart. Tabs switch between **Deliveries received** and **Machine drawdowns**.",
    ],
    procedures: [
      {
        title: "Review a hub's status",
        steps: [
          "Open **All 19 Hubs** from the menu.",
          "Use the search box to type a county or hub name.",
          "Click the hub row to open the hub page.",
          "Read the KPI cards, then scroll to the **Hub Fuel Depot** panel to check fuel on hand.",
        ],
      },
      {
        title: "Receive a bulk fuel delivery into a hub tank",
        steps: [
          "Open the hub's page and find the **Hub Fuel Depot** panel.",
          "Click **Receive Bulk Fuel**.",
          "Enter the **Waybill number** and **Supplier name**.",
          "Enter the **Dipstick before (gal)** reading taken before discharge.",
          "Enter the **Volume (gal)** delivered and the **Unit cost (USD)** per gallon.",
          "Enter the **Dipstick after (gal)** reading taken after discharge.",
          "Click **Record delivery**. The message '<volume> gal received into <hub> depot' appears and the hub's stock rises immediately.",
        ],
      },
    ],
    fields: [
      { field: "Waybill number", description: "The supplier's delivery note number", required: "Yes", rules: "Free text" },
      { field: "Supplier name", description: "The company that delivered the fuel", required: "Yes", rules: "Free text" },
      { field: "Dipstick before (gal)", description: "Tank level measured before discharge", required: "No", rules: "Gallons, 0 or more" },
      { field: "Volume (gal)", description: "Fuel received, in US gallons", required: "Yes", rules: "Between 1 and 20,000 gal; must not push the tank over capacity" },
      { field: "Unit cost (USD)", description: "Price per gallon on the waybill", required: "Yes", rules: "US dollars per gallon" },
      { field: "Dipstick after (gal)", description: "Tank level measured after discharge", required: "No", rules: "Gallons, 0 or more" },
    ],
    roleNotes: [
      "Hub Supervisors open their own hub through **Hub Dashboard**, not this page.",
      "Data Entry Supervisors can view hubs and the fleet but do not receive fuel.",
    ],
    callouts: [
      {
        kind: "warning",
        text: "The hub tank stock is updated automatically by the system when deliveries are recorded and when machines refuel. Never try to change the stock figure by hand — the system does not allow it, and the ledger is designed to be tamper-proof.",
      },
    ],
    screenshots: ["[SCREENSHOT: Hubs list with filters]", "[SCREENSHOT: Hub page with Hub Fuel Depot]"],
  },
  {
    id: "fleet-register",
    title: "Fleet Register & Machine Details",
    roles: ["hq_admin", "ministry_analyst", "data_entry_supervisor", "data_entry_staff"],
    routes: ["/fleet", "/machine/$unitId"],
    overview:
      "The register of all 285 yellow machines. You can search, filter, page through the list, export it to a file, add a new machine, and open any machine for its full details.",
    screens: [
      "**Fleet Register table.** Columns: Unit ID, Type, County, Status, Project, Fuel %, Hours, Last Seen. Search by unit ID; filter by hub, machine type and status; choose rows per page (25, 50 or 100) and move between pages.",
      "**Bulk actions.** Tick machines with the checkboxes, then use **Bulk change status** or **Bulk reassign hub** to update several machines at once.",
      "**Export.** Click **Export CSV** to download the machines currently shown (the message 'Exported N machines' confirms).",
      "**Add Machine** (HQ Admin and Hub Supervisor only). Opens a form to register a new machine.",
      "**Machine details page.** Click a machine's unit ID to open its full record: live position and speed, fuel gauge, engine hours, recent fuel entries, alerts, inspections, movements (GPS replay with a play/pause timeline) and assignment history.",
    ],
    procedures: [
      {
        title: "Find a machine",
        steps: [
          "Open **Fleet Register** from the menu.",
          "Type the unit ID (or part of it) into the search box.",
          "Use the **Hub**, **Type** and **Status** filters to narrow the list.",
          "Click the machine's unit ID to open its details page.",
        ],
      },
      {
        title: "Add a new machine",
        steps: [
          "On **Fleet Register**, click **Add Machine**.",
          "Enter the **Unit ID** (must be unique — a duplicate shows 'That unit ID already exists').",
          "Select the **Hub** and the machine **Type** (the tank capacity fills in a typical size for that type).",
          "Check or change the **Tank capacity (gal)** (must be between 1 and 2,000).",
          "Enter the **Model** and **Serial number** if known.",
          "Enter the **Current fuel level (%)** (0–100).",
          "Click **Add Machine**. The message 'Machine <unit> added' confirms.",
        ],
      },
      {
        title: "Change several machines at once",
        steps: [
          "Tick the machines you want to change using the checkboxes on the left of each row.",
          "To change status: choose the new status in **Bulk change status** and confirm.",
          "To move machines: choose the destination hub in **Bulk reassign hub** and confirm.",
          "The message 'N machines set to <status>' or 'N machines reassigned' confirms.",
        ],
      },
    ],
    fields: [
      { field: "Unit ID", description: "The machine's unique fleet number, e.g. MG-014", required: "Yes", rules: "Must be unique; duplicates are refused" },
      { field: "Hub", description: "The depot the machine belongs to", required: "Yes", rules: "One of the 19 hubs" },
      { field: "Type", description: "Machine category", required: "Yes", rules: "Motor Grader, Front End Loader, Excavator, Dump Truck, Compactor, Other" },
      { field: "Tank capacity (gal)", description: "Full fuel tank size in US gallons", required: "Yes", rules: "1 to 2,000 gal; prefilled from the type" },
      { field: "Model", description: "Machine model, e.g. CAT 140K", required: "No", rules: "Free text" },
      { field: "Serial number", description: "Manufacturer's serial number", required: "No", rules: "Free text" },
      { field: "Current fuel level (%)", description: "Fuel gauge reading when registered", required: "Yes", rules: "0 to 100" },
    ],
    roleNotes: [
      "Hub Supervisors and Data Entry Staff see only machines belonging to their own hub.",
      "Ministry Analysts can view and export but not add or change machines.",
    ],
    callouts: [
      { kind: "tip", text: "On a phone, each table row becomes a card showing the first few fields; tap **View details** to see the rest." },
    ],
    screenshots: ["[SCREENSHOT: Fleet Register with filters open]", "[SCREENSHOT: Add Machine form]"],
  },
  {
    id: "hub-dashboard",
    title: "Hub Dashboard & My Machines",
    roles: ["hub_supervisor"],
    routes: ["/hub-dashboard", "/my-machines"],
    overview:
      "The Hub Supervisor's home screen for their own hub. It shows machine status, fuel, alerts and today's work at a glance, and lets the supervisor manage machine status.",
    screens: [
      "**Hub Dashboard.** Headline figures for the hub (machines, active, in maintenance, open alerts, fuel on hand), the **Hub Fuel Depot** panel with tank gauge and drawdown chart, the hub map, recent alerts and the hub's active projects.",
      "**My Machines.** The hub's machine list with status badges and fuel gauges. Open a machine to see its recent fuel entries and alerts and to change its status.",
    ],
    procedures: [
      {
        title: "Change a machine's status",
        steps: [
          "Open **My Machines**.",
          "Find the machine and click it to open its details.",
          "Choose the new status (Active, Idle, Maintenance, Alert, Offline).",
          "The message '<unit ID> marked <status>' confirms, and the change is recorded in the Activity Log.",
        ],
      },
      {
        title: "Check the hub's fuel position",
        steps: [
          "Open **Hub Dashboard**.",
          "Read the **Hub Fuel Depot** gauge: current stock, capacity and status (Healthy, Reorder Needed, Critical Low).",
          "Check 'days to empty' based on the recent daily burn.",
          "If the status is Reorder Needed or Critical Low, record the next delivery (see the Hubs chapter) or arrange one with HQ.",
        ],
      },
    ],
    roleNotes: ["Everything on these two screens covers your own hub only — other hubs' data is not shown and cannot be reached."],
    callouts: [
      { kind: "warning", text: "A machine marked **Maintenance** stops counting as available in reports. Use **Offline** only when the machine is not reporting." },
    ],
    screenshots: ["[SCREENSHOT: Hub Dashboard with fuel depot panel]"],
  },
  {
    id: "work-orders",
    title: "Work Orders & Today's Tasks",
    roles: ["hub_supervisor", "data_entry_staff"],
    routes: ["/work-orders", "/tasks"],
    overview:
      "Work orders are the tasks assigned to machines and their operators. The Hub Supervisor creates and tracks them; the Data Entry Staff member sees the tasks assigned to them personally and marks progress.",
    screens: [
      "**Work Orders (Hub Supervisor).** A table of the hub's work orders with title, machine, operator, project, priority (Low, Medium, High), scheduled date and status (Assigned, In Progress, Completed, Cancelled). Search by title; filter by status and priority; 25 rows per page. Click a status box in a row to change it directly.",
      "**Today's Tasks (Data Entry Staff).** The list of work orders assigned to you, with machine, scheduled date and priority badge. Each task has **Start**, **Complete** and **Problem** buttons.",
    ],
    procedures: [
      {
        title: "Create a work order (Hub Supervisor)",
        steps: [
          "Open **Work Orders** and click **New Work Order**.",
          "Type a short **Title** (required — 'A title is required' appears if empty).",
          "Add a **Description** of the work.",
          "Select the **Machine** and the **Operator** who should do the job.",
          "Select the **Project** if the work belongs to one (or leave it as **None**).",
          "Choose the **Priority** (Low, Medium, High).",
          "Set the **Scheduled date** (defaults to today).",
          "Click **Create**. The message 'Work order created' confirms.",
        ],
      },
      {
        title: "Work a task (Data Entry Staff)",
        steps: [
          "Open **Today's Tasks** on your phone.",
          "Find your task and read the machine, date and priority.",
          "Tap **Start** when you begin — the status becomes In Progress ('Task updated').",
          "Tap **Complete** when the work is done — the completion time is stamped.",
          "If something is wrong, tap **Problem** and add a note — the task is cancelled with your note recorded.",
        ],
      },
    ],
    roleNotes: [
      "There is no automatic daily task list: each work order is created for a specific date. Recurring jobs (e.g. daily grading) need one work order per day until recurring tasks are added.",
      "The Data Entry Staff task list shows everything assigned to you, not only today's date.",
    ],
    callouts: [
      { kind: "tip", text: "High-priority work orders are badged in red so they stand out in the list." },
    ],
  },
  {
    id: "drivers",
    title: "Driver Registry",
    roles: "all",
    routes: ["/drivers"],
    overview:
      "The official record of every driver: personal details, licence, machine certifications and employment. Staff numbers are generated automatically and cannot be edited.",
    screens: [
      "**Driver table.** Columns: Staff No, Name, Phone, Licence, Class, Licence expiry, Certified for, Employment, Joined, Active, Status (review state). Search by name, staff number or licence.",
      "**Pagination.** 25 rows per page by default, with a selector for 25/50/100 and Previous/Next buttons; the page shows 'Showing 1–25 of N'.",
      "**Add / Edit driver.** Opens a form with Basics, Licence, Certifications and Employment sections.",
      "**Review status.** New or edited records may be marked 'Pending review' and wait in the Review Queue.",
    ],
    procedures: [
      {
        title: "Add a driver",
        steps: [
          "Open **Driver Registry** and click **Add driver**.",
          "Enter the **Full name** (required — 'Full name is required' appears if empty).",
          "Add the phone number, licence number, class and expiry date.",
          "Tick the machine types the driver is **Certified for** (Motor Grader, Front End Loader, Excavator, Dump Truck, Compactor, Other).",
          "Choose the **Employment** type (Permanent, Contract, Seconded, Casual) and the date joined.",
          "Save the record. The message 'Driver added to the registry' confirms.",
        ],
      },
      {
        title: "Find a driver",
        steps: [
          "Type a name, staff number or licence number into the search box.",
          "Use the page buttons to move through the list.",
          "Click a row to open the driver's details for editing.",
        ],
      },
    ],
    fields: [
      { field: "Staff No", description: "Automatic staff number, e.g. DRV-0001", required: "No", rules: "Generated by the system (DRV- plus a zero-padded number); read-only" },
      { field: "Full name", description: "Driver's full name", required: "Yes", rules: "Free text" },
      { field: "Phone", description: "Contact number", required: "No", rules: "Free text" },
      { field: "Licence number / Class / Expiry", description: "Driving licence details", required: "No", rules: "Free text and date" },
      { field: "Certified for", description: "Machine types the driver may operate", required: "Sometimes", rules: "Multi-select of the six machine types; required before the driver can be assigned a machine" },
      { field: "Employment", description: "Employment arrangement", required: "Yes", rules: "Permanent, Contract, Seconded, Casual" },
      { field: "Joined", description: "Date the driver joined", required: "No", rules: "Date" },
    ],
    roleNotes: [
      "A driver can only be assigned to a machine whose type is in their **Certified for** list — the system refuses mismatched assignments.",
      "Data Entry Staff and Data Entry Supervisors can add and edit drivers for their own hub; their entries may go to the Review Queue first.",
    ],
    callouts: [
      { kind: "warning", text: "Check licence expiry dates regularly — expired licences are visible in the list so you can plan renewals." },
    ],
    screenshots: ["[SCREENSHOT: Driver Registry table]", "[SCREENSHOT: Add driver form]"],
  },
  {
    id: "driver-assignments",
    title: "Driver Assignments",
    roles: ["hq_admin", "hub_supervisor", "ministry_analyst"],
    routes: ["/driver-assignments"],
    overview:
      "Pairs a driver with a machine for a shift, optionally linked to a project. This is the record of who operated what, and when. Data Entry Staff and Data Entry Supervisors cannot see or use this screen at all.",
    screens: [
      "**Assignment table.** One row per assignment: hub, driver, machine, project, shift, status (Assigned, In Progress, Completed, Cancelled) and dates. Search and filter by hub, driver, machine, project and status; 25 rows per page with Previous/Next; **Clear** resets the filters. Filters are saved in the page address so you can share a filtered view.",
      "**Assign driver form.** Hub, Driver, Machine, Project (optional), Shift and notes.",
      "**Legacy note.** Some older assignments pair drivers with machines they are not certified for; these are kept for history but new assignments enforce the certification rule.",
    ],
    procedures: [
      {
        title: "Assign a driver to a machine",
        steps: [
          "Open **Assignments** and click **Assign driver**.",
          "Select the **Hub**.",
          "Type the driver's name or staff number and select them from the list (only drivers in that hub appear).",
          "Select the **Machine** — only machines the driver is **certified for** are offered.",
          "Select the **Project** if the shift belongs to one (or leave it as **No project**).",
          "Choose the **Shift** (Morning, Afternoon or Night).",
          "Click **Assign driver**. The message 'Driver assigned' confirms (or 'Assignment sent for review' if your entry needs approval first).",
        ],
      },
      {
        title: "Finish or cancel an assignment",
        steps: [
          "Find the assignment in the table.",
          "Change its **Status** to Completed or Cancelled.",
          "The message 'Assignment updated' confirms.",
        ],
      },
    ],
    fields: [
      { field: "Hub", description: "The hub the work belongs to", required: "Yes", rules: "One of the 19 hubs" },
      { field: "Driver", description: "The driver being assigned", required: "Yes", rules: "Must be active; 'Choose a driver first' if empty" },
      { field: "Machine", description: "The machine for the shift", required: "Yes", rules: "Must match the driver's certifications — mismatches are refused" },
      { field: "Project", description: "Road project the shift supports", required: "No", rules: "Optional; 'No project' allowed" },
      { field: "Shift", description: "Working period", required: "Yes", rules: "Morning, Afternoon, Night" },
    ],
    roleNotes: [
      "HQ Administrators can manage assignments for every hub; Hub Supervisors only for their own hub; Ministry Analysts can view only.",
      "Deleting an assignment is reserved for HQ Administrators.",
    ],
    callouts: [
      { kind: "warning", text: "If the machine list does not include the machine you expect, the driver is probably not certified for that machine type. Update the driver's **Certified for** list in the Driver Registry first." },
    ],
  },
  {
    id: "fuel",
    title: "Fuel: Overview, Depot, Entry & Log",
    roles: "all",
    routes: ["/fuel", "/fuel-entry", "/fuel-log"],
    overview:
      "Fuel is managed in US gallons everywhere. The hub depot stock rises when deliveries arrive and falls automatically when machines refuel. Refuel entries capture the gallons dispensed and the gauge readings before and after.",
    screens: [
      "**Fuel Overview (HQ, Ministry, Data Entry Supervisor).** A national view: fuel used per hub and per machine, totals in gallons and USD, burn-down charts, and a table of every hub's depot with capacity, current stock, daily burn and days to empty.",
      "**Hub Fuel Depot.** On each hub page: the tank gauge (Healthy / Reorder Needed / Critical Low), 30-day drawdown chart, and the Deliveries received and Machine drawdowns ledgers. The **Receive Bulk Fuel** button records incoming deliveries.",
      "**Fuel Entry (Data Entry Staff, Hub Supervisor).** The field refuel form: machine, volume in gallons, gauge reading before and after, optional GPS location, and notes.",
      "**Fuel Log (Hub Supervisor).** The hub's day-by-day refuel ledger with a flag option for anything that looks wrong.",
    ],
    procedures: [
      {
        title: "Record a machine refuel (Fuel Entry)",
        steps: [
          "Open **Fuel Entry**.",
          "Select the **Machine**.",
          "Enter the **Volume (gal)** pumped — 'Choose a machine and enter the volume' appears if either is missing.",
          "Set the gauge reading **Before (%)** and **After (%)** using the sliders.",
          "Optionally tap **Capture location** to record where the refuel happened ('Location captured'), or skip it.",
          "Add any **Notes**.",
          "Tap **Submit**. The entry is saved and the same gallons are deducted from the hub depot stock automatically.",
        ],
      },
      {
        title: "Flag a suspicious entry (Fuel Log)",
        steps: [
          "Open **Fuel Log** and find the entry.",
          "Click **Flag** and give the reason.",
          "The message 'Entry flagged' confirms; the entry is marked for attention in red.",
        ],
      },
      {
        title: "Understand the drawdown ledger",
        steps: [
          "Open a hub's page and find the **Hub Fuel Depot** panel.",
          "The **Deliveries received** tab lists every bulk delivery (waybill, supplier, gallons, cost, dipstick readings).",
          "The **Machine drawdowns** tab lists every refuel deducted from the tank.",
          "Stock today = starting stock + all deliveries − all machine drawdowns. The gauge and chart update by themselves.",
        ],
      },
    ],
    fields: [
      { field: "Machine", description: "The machine being refuelled", required: "Yes", rules: "From the hub's machine list" },
      { field: "Volume (gal)", description: "Gallons dispensed", required: "Yes", rules: "Positive number, in US gallons" },
      { field: "Before (%) / After (%)", description: "Fuel gauge readings", required: "Yes", rules: "0 to 100" },
      { field: "Location", description: "GPS position of the refuel", required: "No", rules: "Captured from the device; 'Location is not available on this device' if the device blocks it" },
    ],
    roleNotes: [
      "Data Entry Staff record refuels for their own hub; Hub Supervisors can also record and flag entries.",
      "Ministry Analysts can view the Fuel Overview but not record anything.",
    ],
    callouts: [
      {
        kind: "warning",
        text: "Never try to adjust the hub tank stock figure directly. Deliveries and refuels move it automatically, and the ledger is designed to be tamper-proof so audits can trust it.",
      },
      { kind: "tip", text: "A hub below its reorder level automatically raises a 'fuel_low_depot' warning alert." },
    ],
    screenshots: ["[SCREENSHOT: Fuel Entry form]", "[SCREENSHOT: Hub Fuel Depot gauge and chart]"],
  },
  {
    id: "shifts",
    title: "Shifts (Start & End)",
    roles: ["data_entry_staff"],
    routes: ["/operator-dashboard"],
    overview:
      "A shift records when a machine was operated, by whom, and the fuel gauge reading at the start and end. The difference is the tank used during the shift. Data Entry Staff run shifts for machines in their own hub.",
    screens: [
      "**My Machines / Shifts.** One card per machine in your hub with the unit ID, type, status badge, today's engine hours and a fuel gauge. Each card has **Start Shift**, **Log Fuel** and **Report Issue** buttons.",
      "**Active shift.** While a shift is running, a pulsing 'Shift Active' badge appears on the machine card, with the start time and the starting fuel reading. The **End Shift** button replaces **Start Shift**.",
    ],
    procedures: [
      {
        title: "Start a shift",
        steps: [
          "Open **Shifts** on your phone.",
          "Find the machine you are about to operate.",
          "Tap **Start Shift**.",
          "Enter the **starting fuel level** (0–100%) when asked — 'Enter a fuel level between 0 and 100%' appears if the value is out of range.",
          "The shift starts: the machine is set to Active, the badge starts pulsing, and the message 'Shift started · fuel N%' confirms.",
        ],
      },
      {
        title: "End a shift",
        steps: [
          "On the machine card with the active shift, tap **End Shift**.",
          "Enter the **ending fuel level** (0–100%).",
          "The shift closes: the machine is set to Idle and the message shows how much of the tank was used, e.g. 'Shift ended · used 35% of tank'.",
        ],
      },
    ],
    roleNotes: [
      "Only one shift can run at a time for you — end the current shift before starting another.",
      "Your hub's machines are listed; other hubs' machines are not shown.",
    ],
    callouts: [
      { kind: "tip", text: "If you lose signal mid-shift, keep working — entries are held on the device and sent when the connection returns (see the Offline Working chapter)." },
    ],
  },
  {
    id: "inspections",
    title: "Inspections",
    roles: ["data_entry_staff", "hub_supervisor"],
    routes: ["/inspect"],
    overview:
      "The 12-point safety checklist completed before and after operating a machine (and daily). Every item is marked Pass, Fail or N/A; failures require a note describing the problem.",
    screens: [
      "**Inspection form.** Choose the machine and the inspection type (Pre-deployment, Post-deployment, Daily), then work through the 12 checklist items.",
      "**On phones** the form shows one step per screen with a 'Step 1 of 14' progress bar and big Back / Next buttons near the thumb. The final step holds the **Submit Inspection** button.",
      "**Failure notes.** Choosing **Fail** on any item opens a box to describe the problem — 'Add notes for every failed item' appears if any failure has no note.",
    ],
    procedures: [
      {
        title: "Submit an inspection",
        steps: [
          "Open **Inspection**.",
          "Select the **machine** you inspected — 'Select the machine you inspected' appears if empty.",
          "Choose the inspection type: **Pre-deployment**, **Post-deployment** or **Daily**.",
          "For each of the 12 items, tap **Pass**, **Fail** or **N/A**.",
          "For every item marked **Fail**, describe the problem in the note box.",
          "Tap **Submit Inspection** on the last step.",
          "The inspection is saved with your name and the time; failures raise alerts for the hub.",
        ],
      },
    ],
    roleNotes: ["You can only inspect machines in your own hub."],
    callouts: [
      { kind: "warning", text: "Do not operate a machine with an unresolved Fail on a safety item — report it to your supervisor immediately." },
    ],
  },
  {
    id: "incidents",
    title: "Incidents",
    roles: ["data_entry_staff", "hub_supervisor"],
    routes: ["/incident"],
    overview:
      "Report a breakdown, accident, damage or tampering from the field, with the location captured automatically where possible.",
    screens: [
      "**Incident form.** Machine, incident type, severity, a description of what happened, and an optional GPS location.",
      "**On phones** the form is split into steps with a progress bar and large buttons.",
    ],
    procedures: [
      {
        title: "Report an incident",
        steps: [
          "Open **Incident**.",
          "Select the **machine** — 'Select a machine and describe what happened' appears if the machine or description is missing.",
          "Choose the **Incident type** (e.g. breakdown, accident, tampering).",
          "Choose the **Severity**.",
          "Describe what happened in the text box — include anything a reader needs to understand the situation.",
          "Optionally tap **Capture location** ('Location captured'), or continue without it ('Location is not available').",
          "Tap **Submit**.",
        ],
      },
    ],
    roleNotes: ["Report incidents for your own hub's machines."],
    callouts: [
      { kind: "warning", text: "For accidents involving injury, make the site safe and inform your supervisor by phone first; use the app to record the details." },
    ],
  },
  {
    id: "data-entry",
    title: "Enter Data",
    roles: ["hq_admin", "hub_supervisor", "data_entry_supervisor", "data_entry_staff"],
    routes: ["/data-entry"],
    overview:
      "The data office screen for typing paper records into the system: fuel chits and maintenance records. Depending on your role, entries may go straight in or wait in the Review Queue for approval.",
    screens: [
      "**Tabs.** **Fuel** and **Maintenance** for everyone; the **Projects** tab is shown only to HQ Administrators and Hub Supervisors.",
      "**Fuel tab.** Machine, gallons dispensed, cost, gauge before and after, and notes — the same information as a paper fuel chit.",
      "**Maintenance tab.** Machine, type of work, description, parts used, labour hours, technician name, cost and schedule dates.",
      "**Review state.** If your role's entries need approval, the message says 'sent for review'; otherwise the record is saved immediately.",
    ],
    procedures: [
      {
        title: "Enter a fuel record",
        steps: [
          "Open **Enter Data** and stay on the **Fuel** tab.",
          "Select the **machine** and enter the **gallons** — 'Choose a machine and enter the gallons' appears if missing.",
          "Enter the cost in USD and the gauge readings before and after (or leave them as 'Not recorded' if the chit has none).",
          "Add notes if needed.",
          "Click **Save**. You will see 'Fuel record saved' or 'Fuel record sent for review'.",
        ],
      },
      {
        title: "Enter a maintenance record",
        steps: [
          "Open **Enter Data** and switch to the **Maintenance** tab.",
          "Select the **machine** and describe the work — 'Choose a machine and describe the work' appears if missing.",
          "Fill in the type, parts used, labour hours, technician name and cost.",
          "Set the scheduled and completed dates.",
          "Click **Save**. You will see 'Maintenance record saved' or 'sent for review'.",
        ],
      },
    ],
    roleNotes: [
      "Data Entry Staff and Data Entry Supervisors type for their scope; the Data Entry Supervisor covers all hubs.",
      "The **Projects** tab is reserved for HQ Administrators and Hub Supervisors — data entry roles do not see it.",
    ],
    callouts: [
      { kind: "tip", text: "If an entry goes to the Review Queue, it is not lost — the reviewer sees it and either approves or rejects it with a reason." },
    ],
  },
  {
    id: "review-queue",
    title: "Review Queue",
    roles: ["hq_admin", "data_entry_supervisor"],
    routes: ["/review-queue"],
    overview:
      "The approval step for records submitted by data entry: fuel entries, maintenance records, driver records and assignments. Nothing enters the official ledger until it is approved here.",
    screens: [
      "**Queue table.** Pending records with their type, hub, who entered them and when. Filter by hub.",
      "**Decision buttons.** **Approve** accepts the record into the ledger; **Reject** marks it rejected with a reason.",
    ],
    procedures: [
      {
        title: "Review a record",
        steps: [
          "Open **Review Queue**.",
          "Open the record and read it against the source document (paper chit or logsheet).",
          "Click **Approve** — the message 'Record approved' confirms — or **Reject** and give the reason ('Record rejected').",
          "The decision, your name and the time are recorded in the Activity Log.",
        ],
      },
    ],
    roleNotes: ["HQ Administrators can review every hub; the Data Entry Supervisor reviews nationally as well."],
    callouts: [
      { kind: "warning", text: "Approving a record makes it part of the official ledger — check the figures carefully before approving." },
    ],
  },
  {
    id: "alerts",
    title: "Alerts",
    roles: ["hq_admin", "ministry_analyst", "hub_supervisor"],
    routes: ["/alerts", "/hub-alerts"],
    overview:
      "Alerts flag things that need attention: critical issues, warnings and information. They come from machines (fuel low, over-speed, idling, geofence breaches), the hub depot (stock below reorder level) and inspections (failed items).",
    screens: [
      "**Fleet Alerts (HQ, Ministry).** Machine alerts fleet-wide, newest first, with level badges (critical red, warning amber, info blue). Click **Acknowledge** when you have acted.",
      "**Hub Alerts (Hub Supervisor).** The same list scoped to your own hub.",
      "**Bell notifications.** The bell in the top bar shows unread alerts; critical alerts also pop up as a red message wherever you are in the app.",
    ],
    procedures: [
      {
        title: "Deal with an alert",
        steps: [
          "Click the bell in the top bar, or open the **Alerts** page.",
          "Read the message and note the machine or hub it concerns.",
          "Take the needed action (refuel, investigate, schedule maintenance).",
          "Click **Acknowledge** — 'Alert acknowledged' confirms, and your name and the time are saved in the Activity Log.",
        ],
      },
    ],
    roleNotes: [
      "Hub Supervisors see only their own hub's alerts.",
      "Ministry Analysts can view alerts but the acknowledge action is not available to them.",
    ],
    callouts: [
      { kind: "tip", text: "Acknowledge alerts as soon as you act on them — unacknowledged alerts keep counting in the 'open alerts' figures." },
    ],
  },
  {
    id: "geofences",
    title: "Geofences",
    roles: ["hq_admin", "hub_supervisor", "ministry_analyst"],
    routes: ["/geofences"],
    overview:
      "Work zones drawn on the map. The system can alert when a machine leaves or enters a zone — for example a road corridor a grader should stay within.",
    screens: [
      "**Geofence list.** Each zone with its name, hub, whether it is active, and its entry/exit alert settings.",
      "**Zone form.** Name, hub, the zone's shape placed on the map, and the alert switches.",
    ],
    procedures: [
      {
        title: "Create a work zone",
        steps: [
          "Open **Geofences** and click **Add zone**.",
          "Enter the **Zone name**, e.g. 'Gbarnga Corridor'.",
          "Select the **Hub** the zone belongs to.",
          "Place the zone on the map by entering the **Latitude** and **Longitude** corners or dragging the shape.",
          "Switch on **Alert on entry** and/or **Alert on exit** as needed.",
          "Save. The zone appears in the list and takes effect immediately.",
        ],
      },
    ],
    fields: [
      { field: "Zone name", description: "A clear name for the work area", required: "Yes", rules: "Free text" },
      { field: "Hub", description: "The hub responsible for the zone", required: "Yes", rules: "One of the 19 hubs" },
      { field: "Latitude / Longitude", description: "The zone's position on the map", required: "Yes", rules: "Decimal degrees" },
      { field: "Alert on entry / exit", description: "When the system should raise an alert", required: "No", rules: "On/off switches" },
    ],
    roleNotes: ["Hub Supervisors manage zones for their own hub; Ministry Analysts can view only."],
    callouts: [
      { kind: "tip", text: "Draw tight zones around the actual working corridor — zones that are too wide will not catch real deviations." },
    ],
  },
  {
    id: "idling-speeding",
    title: "Idling & Speeding",
    roles: ["hq_admin", "hub_supervisor", "ministry_analyst"],
    routes: ["/idling"],
    overview:
      "Monitors two wasteful behaviours: prolonged idling (engine running while stationary) and over-speeding. Both burn fuel and wear out machines; this screen shows where and when they happen.",
    screens: [
      "**Summary figures.** Counts of idling stretches and over-speed runs in the chosen period.",
      "**Detail list.** Each event with the machine, hub, when it happened, how long (idling) or how fast (speeding), and the limit that was exceeded.",
      "**Limits.** The idling and speeding limits are adjustable so they match your operating rules.",
    ],
    procedures: [
      {
        title: "Investigate idling or speeding",
        steps: [
          "Open **Idling & Speeding**.",
          "Scan the list for your hub's machines.",
          "Note the machine and the time of the event.",
          "Discuss with the operator or supervisor and record any corrective action in a work order or incident report.",
        ],
      },
    ],
    roleNotes: ["Hub Supervisors see their own hub's events only."],
    callouts: [
      { kind: "tip", text: "A machine idling for a long stretch may also be a sign the operator has left the engine on while off-site — cross-check the machine's position on the map." },
    ],
  },
  {
    id: "devices",
    title: "Device Register",
    roles: ["hq_admin", "hub_supervisor", "ministry_analyst"],
    routes: ["/devices"],
    overview:
      "The register of all 355 supplied devices: 300 vehicle trackers, 50 tablets and 5 command-room monitors, each with a serial number, model, SIM number, assignment and warranty dates.",
    screens: [
      "**Device tabs.** All devices, **Trackers**, **Tablets**, **Monitors**, **Faulty**, and **Checked in (2h)** — devices that reported within the last two hours.",
      "**Device table.** Serial, type, model, hub, machine, assigned person, SIM number, status (Active, Faulty, Spare, Retired), installed date, warranty end and last check-in. Search by serial or unit; filter by type and hub.",
    ],
    procedures: [
      {
        title: "Report or retire a faulty device",
        steps: [
          "Open **Device Register** and find the device (search by serial or unit ID).",
          "Click the device and set its **Status** to **Faulty** — the message '<serial> marked faulty' confirms.",
          "Report it to HQ; faulty trackers and tablets are swapped within 5 working days under the support contract.",
          "When the replacement is fitted, register it and set the old one to **Retired**.",
        ],
      },
    ],
    fields: [
      { field: "Serial", description: "The device's unique serial number", required: "Yes", rules: "Free text; unique" },
      { field: "Kind", description: "Device category", required: "Yes", rules: "Tracker, Monitor, Tablet" },
      { field: "Machine / Hub", description: "Where the device is fitted", required: "Sometimes", rules: "Trackers are fitted to machines; tablets to hubs" },
      { field: "SIM number", description: "The SIM used for data", required: "No", rules: "Free text" },
      { field: "Warranty end", description: "Warranty expiry date", required: "No", rules: "12 months from installation" },
    ],
    roleNotes: ["Hub Supervisors see their own hub's devices; HQ Administrators see all."],
    callouts: [
      { kind: "tip", text: "Check the **Checked in (2h)** tab daily — a machine that stops reporting may have a faulty tracker or a power problem." },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    roles: ["hq_admin", "hub_supervisor", "ministry_analyst", "data_entry_supervisor"],
    routes: ["/projects"],
    overview:
      "Road projects the machines work on. A project belongs to a hub, has a status, a progress percentage and a deadline, and can have many machines assigned to it at once.",
    screens: [
      "**Project list.** Cards or rows with name, hub, status (Active, Delayed, Critical, Complete), progress bar, machines assigned, kilometres covered and deadline. Search by name; filter by hub and status.",
      "**Project details.** Click a project to see its description and the machines assigned to it, with each machine's daily engine hours and fuel use.",
      "**Create / Edit.** Only HQ Administrators and Hub Supervisors can create or edit projects.",
    ],
    procedures: [
      {
        title: "Create a project (HQ Admin / Hub Supervisor)",
        steps: [
          "Open **Projects** and click **New Project**.",
          "Enter the **Name** and **Description**.",
          "Select the **Hub**.",
          "Set the **Status**, **Progress (%)** and **Deadline**.",
          "Save. The project appears in the list and can be linked to machines through assignments.",
        ],
      },
      {
        title: "See which machines work a project",
        steps: [
          "Open **Projects** and click the project.",
          "The details panel lists every machine assigned to it.",
          "Each machine shows its daily engine hours and fuel use.",
        ],
      },
    ],
    roleNotes: [
      "Data Entry Staff and Data Entry Supervisors cannot create or edit projects.",
      "Ministry Analysts can view project progress but not change it.",
    ],
    callouts: [
      { kind: "tip", text: "Assign machines to a project through **Assignments** (or the machine's project field) — a project can carry many machines at the same time." },
    ],
  },
  {
    id: "reports",
    title: "Reports, National Overview & Scorecards",
    roles: ["hq_admin", "ministry_analyst", "hub_supervisor"],
    routes: ["/reports", "/hub-reports", "/analytics", "/scorecards"],
    overview:
      "Turn the fleet's live data into briefing documents: daily, weekly and monthly reports, hub rankings, and the National Overview for ministry oversight.",
    screens: [
      "**Report types.** Daily Situation Report, Weekly Operations Summary, Monthly Fleet Report, Hub Scorecard, Fuel Analysis, Maintenance Compliance (preventive schedule adherence and overdue work), Idling & Speeding (prolonged idling and over-speed events per machine), and GPS Uptime (telemetry availability per machine and hub).",
      "**Reports page.** Choose a report type and period, click **Generate** ('Report generated' confirms), then **Download** it from the list of generated reports. Past reports stay in the list.",
      "**National Overview (Ministry).** A read-only view of the whole fleet: figures, map and hub table — the same picture HQ sees, without any change buttons.",
      "**Hub Scorecards.** A national ranking: County, Score, Grade, Utilization, Availability, Project progress, Open alerts and Fuel (gal). Export the ranking to CSV.",
      "**Hub Reports (Hub Supervisor).** The supervisor's own hub report, exportable as CSV ('Hub report exported as CSV').",
    ],
    procedures: [
      {
        title: "Generate and download a report",
        steps: [
          "Open **Reports**.",
          "Pick the **Report** type from the list on the left.",
          "Choose the **Period** (start and end dates).",
          "Click **Generate** — 'Report generated' confirms.",
          "Find it in the list and click **Download**.",
        ],
      },
      {
        title: "Rank the hubs",
        steps: [
          "Open **Hub Scorecards**.",
          "Read the table: Score and Grade summarise each hub's performance; Utilization, Availability and Project progress show where the gaps are.",
          "Export the ranking if you need it in a spreadsheet.",
        ],
      },
    ],
    roleNotes: [
      "Ministry Analysts can generate and export reports — this is their main working tool.",
      "Hub Supervisors use **Hub Reports** for their own hub only.",
    ],
    callouts: [
      { kind: "note", text: "Reports are snapshots of the data at the moment they were generated; live figures may have moved on since." },
    ],
  },
  {
    id: "users",
    title: "Users",
    roles: ["hq_admin"],
    routes: ["/users"],
    overview:
      "Manage staff accounts. Every user has exactly one role, and hub-based roles are tied to a hub. Accounts are deactivated rather than deleted, so the audit history stays intact.",
    screens: [
      "**User table.** Name, email, role, hub and active status.",
      "**Invite User.** Creates an account and sends the person a sign-in link by email.",
      "**Deactivate / Reactivate.** Switches an account off or back on ('User deactivated' / 'User reactivated').",
    ],
    procedures: [
      {
        title: "Create a user account",
        steps: [
          "Open **Users** and click **Invite User**.",
          "Enter the **Name** and **Email** — 'Name and email are required' appears if either is missing.",
          "Select the **Role** (HQ Administrator, Hub Supervisor, Data Entry Supervisor, Data Entry Staff, Ministry Analyst).",
          "Select the **Hub** for hub-based roles (Hub Supervisor, Data Entry Staff).",
          "Click **Send invite** — 'Invitation sent' confirms and the person receives a sign-in link by email.",
        ],
      },
      {
        title: "Remove someone's access",
        steps: [
          "Find the user in the **Users** table.",
          "Click **Deactivate** — the message 'User deactivated' confirms.",
          "The person can no longer sign in, but their history in the Activity Log is kept.",
        ],
      },
    ],
    fields: [
      { field: "Name", description: "The user's full name", required: "Yes", rules: "Free text" },
      { field: "Email", description: "Work email used to sign in", required: "Yes", rules: "Must be a valid email address" },
      { field: "Role", description: "The user's single role", required: "Yes", rules: "One of the five roles" },
      { field: "Hub", description: "Hub the user belongs to", required: "Sometimes", rules: "Required for hub-based roles (Hub Supervisor, Data Entry Staff); one of the 19 hubs" },
    ],
    roleNotes: ["Only HQ Administrators can open this screen."],
    callouts: [
      { kind: "warning", text: "There is no self-service password reset. When a user forgets their password, contact Soft Solutions & Systems support to reset it." },
    ],
  },
  {
    id: "activity-log",
    title: "Activity Log",
    roles: ["hq_admin", "ministry_analyst", "data_entry_supervisor"],
    routes: ["/activity"],
    overview:
      "The audit trail. Every meaningful action — sign-ins, status changes, acknowledgements, record approvals, fuel deliveries — is written here with who did it and when. It cannot be edited or deleted.",
    screens: [
      "**Activity table.** Columns: When, User, Action, Record, Reference, Detail. Records are kept permanently, newest first.",
    ],
    procedures: [
      {
        title: "Check who did something",
        steps: [
          "Open **Activity Log**.",
          "Scan the When and User columns, or scroll to the period you care about.",
          "Read the Action and Detail columns to see exactly what changed.",
        ],
      },
    ],
    roleNotes: ["Data Entry Staff and Hub Supervisors do not have this screen; their actions are still recorded."],
    callouts: [
      { kind: "note", text: "The log is append-only by design: entries cannot be changed or removed, so it can be trusted in audits." },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    roles: ["hq_admin"],
    routes: ["/settings"],
    overview:
      "Your own profile details, and the system's operational settings. Only HQ Administrators can open this screen.",
    screens: [
      "**Profile.** Your **Name** and **Email** as they appear across the system.",
      "**Role.** Your assigned role (set on the Users page, shown here for reference).",
    ],
    procedures: [
      {
        title: "Update your profile",
        steps: [
          "Open **Settings**.",
          "Change your **Name** if needed.",
          "Save — the change appears in the top bar immediately.",
        ],
      },
    ],
    roleNotes: ["If your email must change, it is safer to ask support — it is also your sign-in identity."],
  },
  {
    id: "offline",
    title: "Offline Working",
    roles: "all",
    routes: [],
    overview:
      "The field app is designed for areas with weak mobile signal. When the connection drops, entries you make on the device are held safely on the device and sent to HQ when the signal returns.",
    screens: [
      "**Connection banner.** An amber bar at the top reads 'Connection lost — showing cached data. Reconnecting…'. When the link returns, a green 'Reconnected' bar appears.",
      "**Pending Sync panel.** On the field screens, a panel lists entries still waiting to be sent, with a **Send now** button and a count.",
    ],
    procedures: [
      {
        title: "Work through a signal drop",
        steps: [
          "Keep working — save your fuel entries, inspections and incident reports as normal.",
          "The entries wait in the **Pending Sync** panel on the device.",
          "When the signal returns, tap **Send now** (or wait — they send automatically).",
          "The message 'N held entries sent to HQ' confirms. If there is still no connection you see 'Still no connection — entries are safe on this device'.",
        ],
      },
    ],
    callouts: [
      { kind: "warning", text: "Do not clear your browser data or uninstall the browser while entries are pending — held entries live on the device until they are sent." },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting & FAQ",
    roles: "all",
    routes: [],
    overview:
      "Common messages you may see, what they mean, and what to do. The exact wording of each message is shown in bold.",
    screens: [
      "| Message | What it means | What to do |",
      "|---|---|---|",
      "| **This screen isn't part of your role** | Your role cannot open this page. | Click **Go to my dashboard**, or ask HQ to review your role. |",
      "| **You do not have permission to access this page** | You tried to open Driver Assignments with a data entry account. | Use your own menu; assignments are managed by HQ and Hub Supervisors. |",
      "| **Enter a valid email address.** | The sign-in email has no '@'. | Type your full SPPCC email address. |",
      "| **Password must be at least 6 characters.** | The password is too short. | Use your real password (at least 6 characters). |",
      "| **Invalid login credentials** | The email or password is wrong. | Check spelling and capital letters; if forgotten, contact support to reset it. |",
      "| **That unit ID already exists** | A machine with that unit ID is already registered. | Check the Fleet Register; use the existing record or a different unit ID. |",
      "| **Tank capacity must be between 1 and 2,000 gal** | The capacity figure is out of range. | Enter the real tank size in US gallons. |",
      "| **Fuel level must be 0–100%** / **Enter a fuel level between 0 and 100%** | The gauge reading is out of range. | Read the gauge and enter a number from 0 to 100. |",
      "| **Choose a machine and enter the volume** | The fuel entry is missing the machine or gallons. | Select the machine and enter the gallons. |",
      "| **Choose a machine and enter the gallons** | The data-entry fuel record is incomplete. | Select the machine and enter the gallons. |",
      "| **Choose a machine and describe the work** | The maintenance record is incomplete. | Select the machine and describe the work done. |",
      "| **Select the machine you inspected** | The inspection has no machine chosen. | Select the machine before submitting. |",
      "| **Add notes for every failed item** | A checklist item was marked Fail with no explanation. | Describe the problem on each failed item. |",
      "| **Select a machine and describe what happened** | The incident report is incomplete. | Select the machine and write the description. |",
      "| **A title is required** | The work order has no title. | Give the work order a short title. |",
      "| **Name and email are required** | The invite form is incomplete. | Fill in both fields. |",
      "| **Invite could not be sent** | The email service refused the invitation. | Check the email address is correct and try again; if it repeats, contact support. |",
      "| **Enter waybill, supplier and gallons received** | The fuel delivery form is incomplete. | Fill in the waybill number, supplier and volume. |",
      "| **That would exceed tank capacity (N gal)** | The delivery is larger than the space left in the tank. | Check the dipstick reading and the delivery size. |",
      "| **Choose a driver and a machine** | The assignment is incomplete. | Select both a driver and a machine. |",
      "| **Choose a driver first** | The machine list needs a driver to filter by certification. | Select the driver before the machine. |",
      "| **Location is not available on this device** | The device blocked location access. | Allow location permission in the browser settings, or continue without it. |",
      "| **Could not read your location** | The GPS fix failed. | Move to open sky and try again. |",
      "| **Still no connection — entries are safe on this device** | The send attempt failed again. | Nothing is lost; try **Send now** later. |",
      "| **Connection lost — showing cached data. Reconnecting…** | The network dropped. | Keep working; the app reconnects by itself. |",
      "| **Update failed / Could not save…** | The server refused the change (often a permission or network issue). | Read the small text under the message, then retry; if it persists, contact support with the message text. |",
    ],
    procedures: [
      {
        title: "A machine shows no live position",
        steps: [
          "Check the machine's **Last Seen** time in the Fleet Register.",
          "If it is hours old, check the machine's tracker in the **Device Register** — its status and last check-in.",
          "If the tracker is faulty, report it to HQ for replacement.",
        ],
      },
      {
        title: "A figure looks wrong",
        steps: [
          "Open the **Activity Log** and find the relevant action.",
          "Check the machine's detail page for its fuel entries, inspections and alerts.",
          "If something was entered wrongly, the reviewer can reject it in the **Review Queue**, or HQ can correct the record and the change is logged.",
        ],
      },
    ],
    callouts: [
      { kind: "tip", text: "For anything not covered here, note the exact message on screen and the page address, then contact support — that information lets them find the cause quickly." },
    ],
  },
  {
    id: "glossary",
    title: "Glossary",
    roles: "all",
    routes: [],
    overview: "The system's key terms and status values, in plain language.",
    screens: [
      "**Hub** — a depot where machines are based and fuel is stored. There are 19 hubs.",
      "**Machine status:** **Active** (working), **Idle** (available but not working), **Maintenance** (in the workshop), **Alert** (something needs attention), **Offline** (not reporting).",
      "**Machine types:** Motor Grader, Front End Loader, Excavator, Dump Truck, Compactor, Other.",
      "**Work order status:** **Assigned** (given to an operator), **In Progress** (started), **Completed** (done), **Cancelled** (stopped, e.g. a problem was reported).",
      "**Priority:** **Low**, **Medium**, **High**.",
      "**Project status:** **Active**, **Delayed**, **Critical**, **Complete**.",
      "**Device status:** **Active**, **Faulty**, **Spare**, **Retired**.",
      "**Review status:** **Pending** (waiting for a reviewer), **Approved**, **Rejected**.",
      "**Alert levels:** **Critical** (act now), **Warning** (needs attention), **Info** (for awareness).",
      "**Geofence** — a work zone drawn on the map that can raise alerts on entry or exit.",
      "**Drawdown** — the fuel leaving the hub tank as machines refuel.",
      "**Dipstick reading** — the physical measurement of fuel in a hub tank, taken before and after a delivery.",
      "**Shift** — a period of machine operation with a fuel reading at the start and at the end.",
      "**Utilisation** — the share of the hub's machines that are active.",
      "**Gauge reading (%)** — the fuel level shown on the machine's own gauge, from 0 (empty) to 100 (full).",
    ],
    procedures: [],
    callouts: [
      { kind: "note", text: "Fuel is always shown in US gallons (gal) in this system." },
    ],
  },
  {
    id: "support",
    title: "Support & Contact",
    roles: "all",
    routes: [],
    overview:
      "The system is supplied and supported by Soft Solutions & Systems under the SPPCC contract. Use these contacts for accounts, passwords, device faults and any problem with the system.",
    screens: [
      "**Company:** Soft Solutions & Systems, Monrovia, Liberia",
      "**Website:** www.softechsys.com",
      "**Phone:** +231 776 299 741",
      "**Support hours:** Monday–Saturday, 08:00–18:00 GMT",
      "**Critical response:** within 4 working hours",
      "**Device replacement:** faulty trackers and tablets swapped within 5 working days",
      "**Warranty:** 12 months on all supplied devices from installation",
      "**Data retention:** tracking history retained for 24 months with nightly backup",
      "**Training:** delivered at the SPPCC Centre Office in Mamba Point and repeated per hub during installation and commissioning.",
    ],
    procedures: [
      {
        title: "Report a problem to support",
        steps: [
          "Note the page you were on and the exact message shown.",
          "Note the time and, if possible, take a screenshot.",
          "Call or email support with these details and your name, role and hub.",
        ],
      },
    ],
  },
];

/** Path → chapter id, for the contextual "?" help button in the top bar. */
const PATH_CHAPTER: [RegExp, string][] = [
  [/^\/dashboard/, "command-dashboard"],
  [/^\/analytics/, "reports"],
  [/^\/scorecards/, "reports"],
  [/^\/reports/, "reports"],
  [/^\/hub-reports/, "reports"],
  [/^\/hub-dashboard/, "hub-dashboard"],
  [/^\/hub\//, "hubs"],
  [/^\/hubs/, "hubs"],
  [/^\/fleet|^\/machine\//, "fleet-register"],
  [/^\/my-machines/, "hub-dashboard"],
  [/^\/work-orders|^\/tasks/, "work-orders"],
  [/^\/drivers/, "drivers"],
  [/^\/driver-assignments/, "driver-assignments"],
  [/^\/fuel/, "fuel"],
  [/^\/operator-dashboard/, "shifts"],
  [/^\/inspect/, "inspections"],
  [/^\/incident/, "incidents"],
  [/^\/data-entry/, "data-entry"],
  [/^\/review-queue/, "review-queue"],
  [/^\/alerts|^\/hub-alerts/, "alerts"],
  [/^\/geofences/, "geofences"],
  [/^\/idling/, "idling-speeding"],
  [/^\/devices/, "devices"],
  [/^\/projects/, "projects"],
  [/^\/users/, "users"],
  [/^\/activity/, "activity-log"],
  [/^\/settings/, "settings"],
  [/^\/auth/, "getting-started"],
];

export function chapterForPath(pathname: string): string {
  for (const [re, id] of PATH_CHAPTER) if (re.test(pathname)) return id;
  return "getting-started";
}

export function visibleChapters(role: Role | null, viewAll: boolean): ManualChapter[] {
  if (!role) return [];
  if (viewAll) return MANUAL;
  return MANUAL.filter((c) => c.roles === "all" || c.roles.includes(role));
}
