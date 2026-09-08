export type Role =
  | "hq_admin"
  | "hub_supervisor"
  | "field_operator"
  | "ministry_analyst"
  | "data_entry_supervisor"
  | "data_entry_staff";

export type MachineStatus = "active" | "idle" | "maintenance" | "alert" | "offline";
export type MachineType =
  | "motor_grader"
  | "front_end_loader"
  | "excavator"
  | "dump_truck"
  | "compactor"
  | "other";

export const ROLE_LABEL: Record<Role, string> = {
  hq_admin: "HQ Administrator",
  hub_supervisor: "Hub Supervisor",
  field_operator: "Field Operator",
  ministry_analyst: "Ministry Analyst",
  data_entry_supervisor: "Data Entry Supervisor",
  data_entry_staff: "Data Entry Staff",
};

export const ROLE_HOME: Record<Role, string> = {
  hq_admin: "/dashboard",
  hub_supervisor: "/hub-dashboard",
  field_operator: "/operator-dashboard",
  ministry_analyst: "/analytics",
  data_entry_supervisor: "/review-queue",
  data_entry_staff: "/data-entry",
};

/** Roles that review and approve what data entry staff submit. */
export const REVIEWER_ROLES: Role[] = ["hq_admin", "data_entry_supervisor"];

export const ENTRY_STATUS_LABEL: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export function entryStatusClasses(s: string): string {
  if (s === "pending") return "bg-amber-dim text-amber";
  if (s === "rejected") return "bg-red-dim text-red";
  return "bg-green-dim text-teal";
}

export const EMPLOYMENT_TYPES = ["permanent", "contract", "seconded", "casual"] as const;
export const SHIFTS = ["day", "night", "split"] as const;

export const MACHINE_TYPES: { value: MachineType; label: string; code: string }[] = [
  { value: "motor_grader", label: "Motor Grader", code: "MG" },
  { value: "front_end_loader", label: "Front End Loader", code: "FL" },
  { value: "excavator", label: "Excavator", code: "EX" },
  { value: "dump_truck", label: "Dump Truck", code: "DT" },
  { value: "compactor", label: "Compactor", code: "CM" },
  { value: "other", label: "Other", code: "OT" },
];

export const MACHINE_STATUSES: MachineStatus[] = [
  "active",
  "idle",
  "maintenance",
  "alert",
  "offline",
];

export function typeLabel(t: string): string {
  return MACHINE_TYPES.find((x) => x.value === t)?.label ?? "Other";
}

export function statusLabel(s: string): string {
  if (s === "maintenance") return "Maintenance";
  if (s === "idle") return "Idle";
  if (s === "alert") return "Alert";
  if (s === "offline") return "Offline";
  return "Active";
}

/** Hex colour per machine status — used by map markers and charts. */
export const STATUS_HEX: Record<string, string> = {
  active: "#2ea043",
  idle: "#f0883e",
  maintenance: "#388bfd",
  alert: "#da3633",
  offline: "#7d8590",
};

export const LEVEL_HEX: Record<string, string> = {
  critical: "#da3633",
  warning: "#f0883e",
  info: "#3fb950",
};

export function statusClasses(s: string): string {
  switch (s) {
    case "active":
      return "bg-green-dim text-teal";
    case "idle":
      return "bg-amber-dim text-amber";
    case "maintenance":
      return "bg-blue-dim text-blue";
    case "alert":
      return "bg-red-dim text-red";
    default:
      return "bg-surface-2 text-muted-foreground";
  }
}

export function levelClasses(level: string): string {
  switch (level) {
    case "critical":
      return "bg-red-dim text-red";
    case "warning":
      return "bg-amber-dim text-amber";
    default:
      return "bg-green-dim text-teal";
  }
}

export function utilColor(pct: number): string {
  if (pct >= 80) return "#2ea043";
  if (pct >= 70) return "#f0883e";
  return "#da3633";
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.round(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function money(n: number | null | undefined): string {
  return `$${(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export type HubRollup = {
  id: number;
  name: string;
  county: string;
  total: number;
  active: number;
  maintenance: number;
  idle: number;
  alertMachines: number;
  offline: number;
  utilization: number;
  alerts: number;
  avgFuel: number;
};

type MachineLike = {
  hub_id: number;
  status: string;
  fuel_level: number;
};

export function rollupHubs(
  hubs: { id: number; name: string; county: string }[],
  machines: MachineLike[],
  alerts: { hub_id: number; is_acknowledged: boolean }[],
): HubRollup[] {
  return hubs.map((h) => {
    const ms = machines.filter((m) => m.hub_id === h.id);
    const count = (s: string) => ms.filter((m) => m.status === s).length;
    const active = count("active");
    const total = ms.length || 0;
    const fuel = ms.reduce((a, m) => a + (m.fuel_level ?? 0), 0);
    return {
      id: h.id,
      name: h.name,
      county: h.county,
      total,
      active,
      maintenance: count("maintenance"),
      idle: count("idle"),
      alertMachines: count("alert"),
      offline: count("offline"),
      utilization: total ? Math.round((active / total) * 100) : 0,
      alerts: alerts.filter((a) => a.hub_id === h.id && !a.is_acknowledged).length,
      avgFuel: total ? Math.round(fuel / total) : 0,
    };
  });
}

export function projectAlignment(progressPct: number, machinesAssigned: number) {
  const expected = machinesAssigned * 9;
  if (progressPct < expected - 12)
    return {
      state: "Under-Resourced" as const,
      tone: "red" as const,
      note: "Project behind schedule — add machines",
    };
  if (progressPct > expected + 12)
    return {
      state: "Over-Allocated" as const,
      tone: "amber" as const,
      note: "Machines available to redeploy",
    };
  return { state: "Aligned" as const, tone: "green" as const, note: "On track" };
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

export function downloadFile(name: string, content: string, mime = "text/csv") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
