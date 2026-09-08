import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export type Hub = {
  id: number;
  name: string;
  county: string;
  supervisor_id: string | null;
  machine_count: number;
  lat_center: number;
  lng_center: number;
};

export type Machine = {
  id: string;
  unit_id: string;
  hub_id: number;
  type: string;
  status: string;
  operator_id: string | null;
  current_project_id: string | null;
  fuel_level: number;
  engine_hours_today: number;
  engine_hours_lifetime: number;
  lat: number | null;
  lng: number | null;
  speed_kmh: number;
  ignition_on: boolean;
  last_seen: string;
};

export type Alert = {
  id: string;
  machine_id: string | null;
  hub_id: number;
  level: string;
  type: string;
  message: string;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  hub_id: number;
  status: string;
  progress_pct: number;
  machines_assigned: number;
  km_coverage: number;
  deadline: string | null;
  description: string | null;
};

export type FuelLog = {
  id: string;
  machine_id: string;
  hub_id: number;
  operator_id: string | null;
  volume_litres: number;
  cost_usd: number;
  fuel_level_before: number | null;
  fuel_level_after: number | null;
  is_flagged: boolean;
  flag_reason: string | null;
  logged_at: string;
  notes: string | null;
};

export type Maintenance = {
  id: string;
  machine_id: string;
  hub_id: number;
  type: string;
  status: string;
  description: string | null;
  parts_used: string | null;
  labour_hours: number | null;
  technician_name: string | null;
  scheduled_at: string;
  completed_at: string | null;
  cost_usd: number | null;
};

export type WorkOrder = {
  id: string;
  hub_id: number;
  machine_id: string | null;
  project_id: string | null;
  operator_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  scheduled_date: string;
  completed_at: string | null;
  completion_notes: string | null;
  created_at: string;
};

export const hubsQuery = () =>
  queryOptions({
    queryKey: ["hubs"],
    staleTime: 5 * 60_000,
    queryFn: () => unwrap<Hub[]>(supabase.from("hubs").select("*").order("id")),
  });

export const machinesQuery = (hubId?: number | null) =>
  queryOptions({
    queryKey: ["machines", hubId ?? "all"],
    refetchInterval: 30_000,
    staleTime: 15_000,
    queryFn: () => {
      let q = supabase.from("machines").select("*").order("unit_id");
      if (hubId) q = q.eq("hub_id", hubId);
      return unwrap<Machine[]>(q);
    },
  });

export const myMachinesQuery = (operatorId: string | null | undefined) =>
  queryOptions({
    queryKey: ["my-machines", operatorId],
    enabled: !!operatorId,
    refetchInterval: 30_000,
    queryFn: () =>
      unwrap<Machine[]>(
        supabase.from("machines").select("*").eq("operator_id", operatorId!).order("unit_id"),
      ),
  });

export const alertsQuery = (hubId?: number | null) =>
  queryOptions({
    queryKey: ["alerts", hubId ?? "all"],
    refetchInterval: 15_000,
    staleTime: 10_000,
    queryFn: () => {
      let q = supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(500);
      if (hubId) q = q.eq("hub_id", hubId);
      return unwrap<Alert[]>(q);
    },
  });

export const projectsQuery = (hubId?: number | null) =>
  queryOptions({
    queryKey: ["projects", hubId ?? "all"],
    staleTime: 5 * 60_000,
    queryFn: () => {
      let q = supabase.from("projects").select("*").order("created_at");
      if (hubId) q = q.eq("hub_id", hubId);
      return unwrap<Project[]>(q);
    },
  });

export const fuelLogsQuery = (hubId?: number | null, machineId?: string | null) =>
  queryOptions({
    queryKey: ["fuel_logs", hubId ?? "all", machineId ?? "all"],
    staleTime: 5 * 60_000,
    queryFn: () => {
      let q = supabase
        .from("fuel_logs")
        .select("*")
        .neq("review_status", "rejected")
        .order("logged_at", { ascending: false })
        .limit(2000);
      if (hubId) q = q.eq("hub_id", hubId);
      if (machineId) q = q.eq("machine_id", machineId);
      return unwrap<FuelLog[]>(q);
    },
  });

export const maintenanceQuery = (hubId?: number | null, machineId?: string | null) =>
  queryOptions({
    queryKey: ["maintenance", hubId ?? "all", machineId ?? "all"],
    staleTime: 5 * 60_000,
    queryFn: () => {
      let q = supabase
        .from("maintenance_records")
        .select("*")
        .neq("review_status", "rejected")
        .order("scheduled_at", { ascending: false })
        .limit(1000);
      if (hubId) q = q.eq("hub_id", hubId);
      if (machineId) q = q.eq("machine_id", machineId);
      return unwrap<Maintenance[]>(q);
    },
  });

export const workOrdersQuery = (hubId?: number | null, operatorId?: string | null) =>
  queryOptions({
    queryKey: ["work_orders", hubId ?? "all", operatorId ?? "all"],
    staleTime: 60_000,
    queryFn: () => {
      let q = supabase.from("work_orders").select("*").order("created_at", { ascending: false });
      if (hubId) q = q.eq("hub_id", hubId);
      if (operatorId) q = q.eq("operator_id", operatorId);
      return unwrap<WorkOrder[]>(q);
    },
  });

export const profilesQuery = () =>
  queryOptions({
    queryKey: ["profiles"],
    staleTime: 60_000,
    queryFn: () =>
      unwrap<
        { id: string; email: string; full_name: string; hub_id: number | null; is_active: boolean; last_login: string | null; created_at: string }[]
      >(supabase.from("profiles").select("*").order("created_at")),
  });

export const rolesQuery = () =>
  queryOptions({
    queryKey: ["user_roles"],
    staleTime: 60_000,
    queryFn: () => unwrap<{ user_id: string; role: string }[]>(supabase.from("user_roles").select("user_id, role")),
  });

export const reportsQuery = (hubId?: number | null) =>
  queryOptions({
    queryKey: ["reports", hubId ?? "all"],
    staleTime: 30_000,
    queryFn: () => {
      let q = supabase
        .from("reports")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(100);
      if (hubId) q = q.eq("hub_id", hubId);
      return unwrap<
        {
          id: string;
          type: string;
          hub_id: number | null;
          period_start: string | null;
          period_end: string | null;
          generated_at: string;
          generated_by: string | null;
        }[]
      >(q);
    },
  });

export const inspectionsQuery = (hubId?: number | null) =>
  queryOptions({
    queryKey: ["inspections", hubId ?? "all"],
    staleTime: 60_000,
    queryFn: () => {
      let q = supabase
        .from("inspections")
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(200);
      if (hubId) q = q.eq("hub_id", hubId);
      return unwrap<
        {
          id: string;
          machine_id: string;
          hub_id: number;
          type: string;
          overall_status: string;
          submitted_at: string;
          notes: string | null;
        }[]
      >(q);
    },
  });

export const gpsTrackQuery = (machineId: string | null, hours: number) =>
  queryOptions({
    queryKey: ["gps", machineId, hours],
    enabled: !!machineId,
    queryFn: () =>
      unwrap<{ lat: number; lng: number; speed_kmh: number; recorded_at: string }[]>(
        supabase
          .from("gps_tracks")
          .select("lat, lng, speed_kmh, recorded_at")
          .eq("machine_id", machineId!)
          .gte("recorded_at", new Date(Date.now() - hours * 3600_000).toISOString())
          .order("recorded_at"),
      ),
  });

/** GPS history between two explicit instants — used by history playback. */
export const gpsRangeQuery = (machineId: string | null, fromIso: string, toIso: string) =>
  queryOptions({
    queryKey: ["gps-range", machineId, fromIso, toIso],
    enabled: !!machineId,
    queryFn: () =>
      unwrap<{ lat: number; lng: number; speed_kmh: number; recorded_at: string }[]>(
        supabase
          .from("gps_tracks")
          .select("lat, lng, speed_kmh, recorded_at")
          .eq("machine_id", machineId!)
          .gte("recorded_at", fromIso)
          .lte("recorded_at", toIso)
          .order("recorded_at")
          .limit(2000),
      ),
  });

export type Geofence = {
  id: string;
  name: string;
  hub_id: number;
  machine_id: string | null;
  polygon_json: unknown;
  alert_on_exit: boolean;
  alert_on_entry: boolean;
  is_active: boolean;
  created_at: string;
};

export const geofencesQuery = (hubId?: number | null) =>
  queryOptions({
    queryKey: ["geofences", hubId ?? "all"],
    staleTime: 60_000,
    queryFn: () => {
      let q = supabase.from("geofences").select("*").order("name");
      if (hubId) q = q.eq("hub_id", hubId);
      return unwrap<Geofence[]>(q as never);
    },
  });

export type Device = {
  id: string;
  serial: string;
  kind: "tracker" | "monitor" | "tablet";
  model: string;
  hub_id: number | null;
  machine_id: string | null;
  sim_number: string | null;
  status: "active" | "faulty" | "spare" | "retired";
  installed_at: string | null;
  warranty_end: string | null;
  last_checkin: string | null;
  notes: string | null;
};

export const devicesQuery = (hubId?: number | null) =>
  queryOptions({
    queryKey: ["devices", hubId ?? "all"],
    staleTime: 60_000,
    queryFn: () => {
      let q = supabase.from("devices").select("*").order("serial");
      if (hubId) q = q.eq("hub_id", hubId);
      return unwrap<Device[]>(q);
    },
  });

export type AuditRow = {
  id: string;
  actor_email: string;
  action: string;
  entity: string;
  entity_ref: string | null;
  hub_id: number | null;
  detail: string | null;
  created_at: string;
};

export const auditQuery = (hubId?: number | null) =>
  queryOptions({
    queryKey: ["audit_log", hubId ?? "all"],
    staleTime: 15_000,
    queryFn: () => {
      let q = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (hubId) q = q.eq("hub_id", hubId);
      return unwrap<AuditRow[]>(q);
    },
  });

/** Recent GPS points for a set of machines, used for idling/speeding analytics. */
export const fleetTracksQuery = (hubId: number | null, hours: number) =>
  queryOptions({
    queryKey: ["fleet-tracks", hubId ?? "all", hours],
    staleTime: 60_000,
    queryFn: async () => {
      let mq = supabase.from("machines").select("id, unit_id, hub_id, type");
      if (hubId) mq = mq.eq("hub_id", hubId);
      const machines = await unwrap<{ id: string; unit_id: string; hub_id: number; type: string }[]>(
        mq,
      );
      const points = await unwrap<
        { machine_id: string; lat: number; lng: number; speed_kmh: number; recorded_at: string }[]
      >(
        supabase
          .from("gps_tracks")
          .select("machine_id, lat, lng, speed_kmh, recorded_at")
          .gte("recorded_at", new Date(Date.now() - hours * 3600_000).toISOString())
          .order("recorded_at")
          .limit(20000),
      );
      const ids = new Set(machines.map((m) => m.id));
      return { machines, points: points.filter((p) => ids.has(p.machine_id)) };
    },
  });

