import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  driverAssignmentsQuery,
  driversQuery,
  hubsQuery,
  machinesQuery,
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, btn, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit";
import { ENTRY_STATUS_LABEL, entryStatusClasses, SHIFTS, typeLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/driver-assignments")({
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
  component: () => (
    <RoleGate
      allow={[
        "hq_admin",
        "hub_supervisor",
        "ministry_analyst",
        "data_entry_supervisor",
        "data_entry_staff",
      ]}
    >
      <AssignmentsPage />
    </RoleGate>
  ),
});

function AssignmentsPage() {
  const { role, profile, hubId } = useAuth();
  const qc = useQueryClient();
  const national =
    role === "hq_admin" || role === "data_entry_supervisor" || role === "ministry_analyst";
  const canEdit = role !== "ministry_analyst";
  const needsReview = role === "data_entry_staff";
  const [hubFilter, setHubFilter] = useState<number | "">("");
  const scope = national ? (hubFilter === "" ? null : hubFilter) : (hubId ?? null);

  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: drivers = [] } = useQuery(driversQuery(scope));
  const { data: machines = [] } = useQuery(machinesQuery(scope));
  const { data: assignments = [], isLoading } = useQuery(driverAssignmentsQuery(scope));

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"current" | "history">("current");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ driver_id: "", machine_id: "", shift: "day", notes: "" });

  const driverName = (id: string) => drivers.find((d) => d.id === id)?.full_name ?? "—";
  const machineLabel = (id: string) => {
    const m = machines.find((x) => x.id === id);
    return m ? `${m.unit_id} · ${typeLabel(m.type)}` : "—";
  };

  const rows = useMemo(
    () => assignments.filter((a) => (tab === "current" ? !a.unassigned_at : !!a.unassigned_at)),
    [assignments, tab],
  );

  async function create() {
    if (!form.driver_id || !form.machine_id) {
      toast.error("Choose a driver and a machine");
      return;
    }
    setBusy(true);
    const machine = machines.find((m) => m.id === form.machine_id);
    const driver = drivers.find((d) => d.id === form.driver_id);
    const { error } = await supabase.from("driver_assignments").insert({
      driver_id: form.driver_id,
      machine_id: form.machine_id,
      hub_id: machine?.hub_id ?? scope ?? hubId ?? 1,
      shift: form.shift,
      notes: form.notes || null,
      created_by: profile?.id ?? null,
      review_status: needsReview ? "pending" : "approved",
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save the assignment", { description: error.message });
      return;
    }
    void logAudit(profile, {
      action: "assigned driver",
      entity: "driver_assignment",
      entity_ref: machine?.unit_id ?? null,
      hub_id: machine?.hub_id ?? null,
      detail: `${driver?.full_name ?? ""} · ${form.shift} shift`,
    });
    toast.success(needsReview ? "Assignment sent for review" : "Driver assigned");
    qc.invalidateQueries({ queryKey: ["driver_assignments"] });
    qc.invalidateQueries({ queryKey: ["pending-entries"] });
    setOpen(false);
    setForm({ driver_id: "", machine_id: "", shift: "day", notes: "" });
  }

  async function end(id: string) {
    const { error } = await supabase
      .from("driver_assignments")
      .update({ unassigned_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Could not end the assignment", { description: error.message });
      return;
    }
    toast.success("Assignment ended");
    qc.invalidateQueries({ queryKey: ["driver_assignments"] });
  }

  return (
    <>
      <PageHeader
        title="Driver Assignments"
        subtitle={scope ? `Hub ${scope}` : "All 19 hubs"}
      />

      <Panel>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex gap-1">
            {(["current", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-2.5 py-1.5 text-xs capitalize ${tab === t ? "bg-green-dim text-teal" : "text-muted-foreground hover:bg-surface-2"}`}
              >
                {t === "current" ? "Current" : "History"}
              </button>
            ))}
          </div>
          {national && (
            <label className="text-[11px] text-muted-foreground">
              Hub
              <select
                className={inputCls}
                value={hubFilter}
                onChange={(e) => setHubFilter(e.target.value === "" ? "" : Number(e.target.value))}
              >
                <option value="">All hubs</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {canEdit && (
            <button className={`${btn.primary} ml-auto`} onClick={() => setOpen(true)}>
              <Plus className="size-4" aria-hidden /> New assignment
            </button>
          )}
        </div>
      </Panel>

      <Panel className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-2 py-2">Driver</th>
              <th className="px-2 py-2">Machine</th>
              <th className="px-2 py-2">Hub</th>
              <th className="px-2 py-2">Shift</th>
              <th className="px-2 py-2">Assigned</th>
              <th className="px-2 py-2">Ended</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-muted-foreground">
                  Loading assignments…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-muted-foreground">
                  {tab === "current" ? "No active assignments." : "No past assignments yet."}
                </td>
              </tr>
            )}
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-border/60 hover:bg-surface-2">
                <td className="px-2 py-2">{driverName(a.driver_id)}</td>
                <td className="num px-2 py-2">{machineLabel(a.machine_id)}</td>
                <td className="num px-2 py-2">{a.hub_id}</td>
                <td className="px-2 py-2 capitalize">{a.shift}</td>
                <td className="num px-2 py-2">{new Date(a.assigned_at).toLocaleDateString()}</td>
                <td className="num px-2 py-2">
                  {a.unassigned_at ? new Date(a.unassigned_at).toLocaleDateString() : "—"}
                </td>
                <td className="px-2 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] ${entryStatusClasses(a.review_status)}`}>
                    {ENTRY_STATUS_LABEL[a.review_status] ?? a.review_status}
                  </span>
                </td>
                <td className="px-2 py-2 text-right">
                  {canEdit && !a.unassigned_at && (
                    <button className="text-[11px] text-blue hover:underline" onClick={() => end(a.id)}>
                      End
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {open && canEdit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">New driver assignment</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-[11px] text-muted-foreground">
                Driver
                <select
                  className={inputCls}
                  value={form.driver_id}
                  onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                >
                  <option value="">Select driver…</option>
                  {drivers
                    .filter((d) => d.is_active)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.staff_no})
                      </option>
                    ))}
                </select>
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Machine
                <select
                  className={inputCls}
                  value={form.machine_id}
                  onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                >
                  <option value="">Select machine…</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.unit_id} · {typeLabel(m.type)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Shift
                <select
                  className={inputCls}
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                >
                  {SHIFTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] text-muted-foreground">
                Notes
                <textarea
                  className={`${inputCls} h-20`}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className={btn.secondary} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className={btn.primary} onClick={create} disabled={busy}>
                {busy ? "Saving…" : "Assign driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
