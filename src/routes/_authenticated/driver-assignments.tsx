import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ROLE_HOME, type Role } from "@/lib/fleet";
import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  driversQuery,
  hubsQuery,
  machinesQuery,
  projectsQuery,
  type DriverAssignment,
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, btn, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { Combo } from "@/components/Combo";
import { Paging, pageRange } from "@/components/Paging";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit";
import { cleanText } from "@/lib/sanitize";
import { ENTRY_STATUS_LABEL, entryStatusClasses, statusLabel, typeLabel } from "@/lib/fleet";

type Search = {
  driver?: string | undefined;
  machine?: string | undefined;
  hub?: number | undefined;
  shift?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  status?: string | undefined;
  page?: number | undefined;
  size?: number | undefined;
};

const str = (v: unknown) => (typeof v === "string" && v.length < 64 ? v : undefined);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const dateStr = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export const Route = createFileRoute("/_authenticated/driver-assignments")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    driver: str(s["driver"]),
    machine: str(s["machine"]),
    hub: num(s["hub"]),
    shift: str(s["shift"]),
    from: dateStr(s["from"]),
    to: dateStr(s["to"]),
    status: str(s["status"]),
    page: num(s["page"]),
    size: [25, 50, 100].includes(Number(s["size"])) ? Number(s["size"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Driver Assignments · YM-FMS" },
      {
        name: "description",
        content:
          "Assign drivers to Yellow Machines by shift and keep a full history of who operated which machine.",
      },
      { property: "og:title", content: "Driver Assignments · YM-FMS" },
      {
        property: "og:description",
        content: "Current and historical driver-to-machine assignments across the 19 hubs.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle();
    const role = r?.role as Role | undefined;
    if (role === "data_entry_staff" || role === "data_entry_supervisor") {
      toast.error("You do not have permission to access this page");
      throw redirect({ to: ROLE_HOME[role] });
    }
  },
  component: () => (
    <RoleGate allow={["hq_admin", "hub_supervisor", "ministry_analyst"]}>
      <AssignmentsPage />
    </RoleGate>
  ),
});

const SHIFT_OPTS = ["morning", "afternoon", "night"];
const STATUS_OPTS = [
  ["assigned", "Assigned"],
  ["in_progress", "In Progress"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;
const STATUS_TONE: Record<string, string> = {
  assigned: "bg-blue-dim text-blue",
  in_progress: "bg-amber-dim text-amber",
  completed: "bg-green-dim text-teal",
  cancelled: "bg-surface-2 text-muted-foreground",
};

const EMPTY_FORM = { driver_id: "", machine_id: "", hub_id: "", project_id: "", shift: "morning", notes: "" };

function AssignmentsPage() {
  const { role, profile, hubId } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const sp = Route.useSearch();
  const national = role === "hq_admin" || role === "data_entry_supervisor" || role === "ministry_analyst";
  const canEdit = role !== "ministry_analyst";
  const needsReview = role === "data_entry_staff";
  const scope = national ? (sp.hub ?? null) : (hubId ?? null);
  const page = sp.page ?? 0;
  const size = sp.size ?? 25;

  const setSearch = (patch: Partial<Search>, keepPage = false) =>
    navigate({ search: (prev) => ({ ...prev, ...patch, ...(keepPage ? {} : { page: undefined }) }), replace: true });

  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: drivers = [] } = useQuery(driversQuery(national ? null : hubId));
  const { data: machines = [] } = useQuery(machinesQuery(national ? null : hubId));
  const { data: projects = [] } = useQuery(projectsQuery(national ? null : hubId));

  const listQ = useQuery({
    queryKey: ["driver_assignments", "page", scope ?? "all", sp, page, size],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const [from, to] = pageRange(page, size);
      let q = supabase
        .from("driver_assignments")
        .select("*", { count: "exact" })
        .order("assigned_at", { ascending: false })
        .range(from, to);
      if (scope) q = q.eq("hub_id", scope);
      if (sp.driver) q = q.eq("driver_id", sp.driver);
      if (sp.machine) q = q.eq("machine_id", sp.machine);
      if (sp.shift) q = q.eq("shift", sp.shift);
      if (sp.status) q = q.eq("status", sp.status);
      if (sp.from) q = q.gte("assigned_at", `${sp.from}T00:00:00`);
      if (sp.to) q = q.lte("assigned_at", `${sp.to}T23:59:59`);
      const { data, count, error } = await q;
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as (DriverAssignment & { status: string })[], total: count ?? 0 };
    },
  });
  const rows = listQ.data?.rows ?? [];
  const total = listQ.data?.total ?? 0;

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [machineErr, setMachineErr] = useState<string | null>(null);

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);
  const machineById = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);
  const hubName = (id: number) => hubs.find((h) => h.id === id)?.name ?? `Hub ${id}`;

  const selDriver = driverById.get(form.driver_id);
  const certs = selDriver?.certified_types ?? [];
  const competency = certs.length ? certs.map(typeLabel).join(", ") : "no machine type";
  const formHub = form.hub_id ? Number(form.hub_id) : null;

  const driverOpts = drivers
    .filter((d) => d.is_active && (!formHub || d.hub_id === formHub))
    .map((d) => ({ value: d.id, label: `${d.full_name} · ${d.staff_no}`, keywords: d.staff_no }));
  const machineOpts = machines
    .filter((m) => (!formHub || m.hub_id === formHub) && (!selDriver || certs.includes(m.type)))
    .map((m) => ({
      value: m.id,
      label: `${m.unit_id} · ${typeLabel(m.type)}`,
      hint: statusLabel(m.status),
    }));
  const hubOpts = hubs.map((h) => ({ value: String(h.id), label: h.name, hint: h.county }));
  const projectOpts = projects
    .filter((p) => p.status !== "complete" && (!formHub || p.hub_id === formHub))
    .map((p) => ({ value: p.id, label: p.name }));

  function pickDriver(id: string) {
    const d = driverById.get(id);
    const m = machineById.get(form.machine_id);
    const keepMachine = !!(d && m && (d.certified_types ?? []).includes(m.type));
    setMachineErr(null);
    setForm({
      ...form,
      driver_id: id,
      hub_id: form.hub_id || (d ? String(d.hub_id) : ""),
      machine_id: keepMachine ? form.machine_id : "",
    });
  }

  async function create() {
    if (!form.driver_id || !form.machine_id) {
      toast.error("Choose a driver and a machine");
      return;
    }
    const machine = machineById.get(form.machine_id);
    if (!machine || !certs.includes(machine.type)) {
      setMachineErr(`This driver is certified for ${competency} only. Please select a compatible machine.`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("driver_assignments").insert({
      driver_id: form.driver_id,
      machine_id: form.machine_id,
      hub_id: machine.hub_id,
      project_id: form.project_id || null,
      shift: form.shift,
      status: "assigned",
      notes: cleanText(form.notes, 1000) || null,
      created_by: profile?.id ?? null,
      review_status: needsReview ? "pending" : "approved",
    });
    setBusy(false);
    if (error) {
      if (/certified for/i.test(error.message)) setMachineErr(error.message);
      else toast.error("Could not save the assignment", { description: error.message });
      return;
    }
    void logAudit(profile, {
      action: "assigned driver",
      entity: "driver_assignment",
      entity_ref: machine.unit_id,
      hub_id: machine.hub_id,
      detail: `${selDriver?.full_name ?? ""} · ${form.shift} shift`,
    });
    toast.success(needsReview ? "Assignment sent for review" : "Driver assigned");
    qc.invalidateQueries({ queryKey: ["driver_assignments"] });
    qc.invalidateQueries({ queryKey: ["pending-entries"] });
    setOpen(false);
    setForm(EMPTY_FORM);
  }

  async function setStatus(id: string, status: string) {
    const done = status === "completed" || status === "cancelled";
    const { error } = await supabase
      .from("driver_assignments")
      .update({ status, unassigned_at: done ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) {
      toast.error("Could not update the assignment", { description: error.message });
      return;
    }
    toast.success("Assignment updated");
    qc.invalidateQueries({ queryKey: ["driver_assignments"] });
  }

  const allDriverOpts = drivers.map((d) => ({ value: d.id, label: `${d.full_name} · ${d.staff_no}` }));
  const allMachineOpts = machines.map((m) => ({ value: m.id, label: `${m.unit_id} · ${typeLabel(m.type)}` }));
  const hasFilters = !!(sp.driver || sp.machine || sp.hub || sp.shift || sp.from || sp.to || sp.status);

  return (
    <>
      <PageHeader title="Driver Assignments" subtitle={scope ? hubName(scope) : "All 19 hubs"} />

      <Panel>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <label className="text-[11px] text-muted-foreground xl:col-span-2">
            Driver
            <Combo options={allDriverOpts} value={sp.driver ?? ""} allLabel="All drivers" onChange={(v) => setSearch({ driver: v || undefined })} />
          </label>
          <label className="text-[11px] text-muted-foreground xl:col-span-2">
            Machine
            <Combo options={allMachineOpts} value={sp.machine ?? ""} allLabel="All machines" onChange={(v) => setSearch({ machine: v || undefined })} />
          </label>
          {national && (
            <label className="text-[11px] text-muted-foreground">
              Hub
              <select className={inputCls} value={sp.hub ?? ""} onChange={(e) => setSearch({ hub: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">All hubs</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="text-[11px] text-muted-foreground">
            Shift
            <select className={inputCls} value={sp.shift ?? ""} onChange={(e) => setSearch({ shift: e.target.value || undefined })}>
              <option value="">All</option>
              {SHIFT_OPTS.map((s) => (
                <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-muted-foreground">
            Status
            <select className={inputCls} value={sp.status ?? ""} onChange={(e) => setSearch({ status: e.target.value || undefined })}>
              <option value="">All</option>
              {STATUS_OPTS.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-muted-foreground">
            Assigned from
            <input type="date" className={inputCls} value={sp.from ?? ""} onChange={(e) => setSearch({ from: e.target.value || undefined })} />
          </label>
          <label className="text-[11px] text-muted-foreground">
            Assigned to
            <input type="date" className={inputCls} value={sp.to ?? ""} onChange={(e) => setSearch({ to: e.target.value || undefined })} />
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button className={btn.secondary} disabled={!hasFilters} onClick={() => navigate({ search: {}, replace: true })}>
            Clear filters
          </button>
          {canEdit && (
            <button className={`${btn.primary} ml-auto`} onClick={() => { setForm({ ...EMPTY_FORM, hub_id: scope ? String(scope) : "" }); setMachineErr(null); setOpen(true); }}>
              <Plus className="size-4" aria-hidden /> New assignment
            </button>
          )}
        </div>
      </Panel>

      <Panel className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-2 py-2">Driver</th>
              <th className="px-2 py-2">Machine</th>
              <th className="px-2 py-2">Hub</th>
              <th className="px-2 py-2">Shift</th>
              <th className="px-2 py-2">Assigned</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Review</th>
            </tr>
          </thead>
          <tbody>
            {listQ.isLoading && (
              <tr><td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">Loading assignments…</td></tr>
            )}
            {!listQ.isLoading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">No assignments match these filters.</td></tr>
            )}
            {rows.map((a) => {
              const d = driverById.get(a.driver_id);
              const m = machineById.get(a.machine_id);
              return (
                <tr key={a.id} className="border-b border-border/60 hover:bg-surface-2">
                  <td className="px-2 py-2">
                    {d?.full_name ?? "—"}
                    {d && <div className="num text-[10px] text-muted-foreground">{d.staff_no}</div>}
                  </td>
                  <td className="num px-2 py-2">{m ? `${m.unit_id} · ${typeLabel(m.type)}` : "—"}</td>
                  <td className="px-2 py-2">{hubName(a.hub_id)}</td>
                  <td className="px-2 py-2 capitalize">{a.shift}</td>
                  <td className="num px-2 py-2">{new Date(a.assigned_at).toLocaleDateString()}</td>
                  <td className="px-2 py-2">
                    {canEdit ? (
                      <select
                        aria-label="Assignment status"
                        className={`${inputCls} max-w-32 py-0.5 text-[11px]`}
                        value={a.status}
                        onChange={(e) => setStatus(a.id, e.target.value)}
                      >
                        {STATUS_OPTS.map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_TONE[a.status] ?? ""}`}>
                        {STATUS_OPTS.find(([v]) => v === a.status)?.[1] ?? a.status}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${entryStatusClasses(a.review_status)}`}>
                      {ENTRY_STATUS_LABEL[a.review_status] ?? a.review_status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Paging
          page={page}
          size={size}
          total={total}
          onPage={(p) => setSearch({ page: p || undefined }, true)}
          onSize={(s) => setSearch({ size: s === 25 ? undefined : s })}
        />
      </Panel>

      {open && canEdit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">New driver assignment</h2>
              <button onClick={() => setOpen(false)} aria-label="Close"><X className="size-4" aria-hidden /></button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-[11px] text-muted-foreground">
                Hub
                <Combo
                  options={hubOpts}
                  value={form.hub_id}
                  disabled={!national}
                  placeholder="Select hub…"
                  onChange={(v) => setForm({ ...form, hub_id: v, driver_id: "", machine_id: "", project_id: "" })}
                />
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Driver
                <Combo options={driverOpts} value={form.driver_id} placeholder="Search name or staff number…" onChange={pickDriver} />
                {selDriver && <span className="mt-1 block text-[10px]">Certified for: {competency}</span>}
              </label>
              <div className="block text-[11px] text-muted-foreground">
                Machine
                <Combo
                  options={machineOpts}
                  value={form.machine_id}
                  invalid={!!machineErr}
                  placeholder={selDriver ? "Search unit ID or type…" : "Choose a driver first"}
                  disabled={!selDriver}
                  onChange={(v) => { setMachineErr(null); setForm({ ...form, machine_id: v }); }}
                />
                {machineErr && <p className="mt-1 text-[11px] text-red" role="alert">{machineErr}</p>}
                {selDriver && machineOpts.length === 0 && !machineErr && (
                  <p className="mt-1 text-[11px] text-amber">No compatible machines in this hub.</p>
                )}
              </div>
              <label className="block text-[11px] text-muted-foreground">
                Project
                <Combo options={projectOpts} value={form.project_id} allLabel="No project" placeholder="Select project…" onChange={(v) => setForm({ ...form, project_id: v })} />
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Shift
                <select className={inputCls} value={form.shift} onChange={(e) => setForm({ ...form, shift: e.target.value })}>
                  {SHIFT_OPTS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Notes
                <textarea className={`${inputCls} h-20`} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className={btn.secondary} onClick={() => setOpen(false)}>Cancel</button>
              <button className={btn.primary} onClick={create} disabled={busy}>{busy ? "Saving…" : "Assign driver"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
