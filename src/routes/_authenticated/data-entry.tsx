import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { driversQuery, hubsQuery, machinesQuery, projectsQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, btn, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit";
import { typeLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/data-entry")({
  head: () => ({
    meta: [
      { title: "Data Entry · YM-FMS" },
      {
        name: "description",
        content:
          "Enter real field data for fuel consumption, maintenance and road projects, with supervisor review before it goes live.",
      },
      { property: "og:title", content: "Data Entry · YM-FMS" },
      {
        property: "og:description",
        content: "One desk for fuel, maintenance and project records from the hubs.",
      },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "hub_supervisor", "data_entry_supervisor", "data_entry_staff"]}>
      <DataEntryPage />
    </RoleGate>
  ),
});

type Tab = "fuel" | "maintenance" | "project";

function DataEntryPage() {
  const { role, profile, hubId } = useAuth();
  const qc = useQueryClient();
  const national = role === "hq_admin" || role === "data_entry_supervisor";
  const needsReview = role === "data_entry_staff";
  const [hub, setHub] = useState<number>(hubId ?? 1);
  const scope = national ? hub : (hubId ?? 1);
  const [tab, setTab] = useState<Tab>("fuel");
  const [busy, setBusy] = useState(false);

  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(scope));
  const { data: drivers = [] } = useQuery(driversQuery(scope));
  const { data: projects = [] } = useQuery(projectsQuery(scope));

  const review = needsReview ? "pending" : "approved";

  const [fuel, setFuel] = useState({
    machine_id: "",
    driver_id: "",
    volume_litres: "",
    cost_usd: "",
    before: "",
    after: "",
    logged_at: new Date().toISOString().slice(0, 16),
    notes: "",
  });
  const [maint, setMaint] = useState({
    machine_id: "",
    type: "preventive",
    status: "scheduled",
    description: "",
    parts_used: "",
    labour_hours: "",
    technician_name: "",
    scheduled_at: new Date().toISOString().slice(0, 10),
    cost_usd: "",
    notes: "",
  });
  const [proj, setProj] = useState({
    name: "",
    status: "active",
    progress_pct: "0",
    km_coverage: "0",
    deadline: "",
    description: "",
  });

  async function saveFuel() {
    if (!fuel.machine_id || !fuel.volume_litres) {
      toast.error("Choose a machine and enter the litres");
      return;
    }
    setBusy(true);
    const machine = machines.find((m) => m.id === fuel.machine_id);
    const { error } = await supabase.from("fuel_logs").insert({
      machine_id: fuel.machine_id,
      hub_id: machine?.hub_id ?? scope,
      driver_id: fuel.driver_id || null,
      volume_litres: Number(fuel.volume_litres),
      cost_usd: fuel.cost_usd ? Number(fuel.cost_usd) : Number(fuel.volume_litres) * 0.95,
      fuel_level_before: fuel.before ? Number(fuel.before) : null,
      fuel_level_after: fuel.after ? Number(fuel.after) : null,
      logged_at: new Date(fuel.logged_at).toISOString(),
      notes: fuel.notes || null,
      created_by: profile?.id ?? null,
      review_status: review,
    });
    setBusy(false);
    if (error) return toast.error("Could not save the fuel record", { description: error.message });
    void logAudit(profile, {
      action: "entered fuel record",
      entity: "fuel_log",
      entity_ref: machine?.unit_id ?? null,
      hub_id: machine?.hub_id ?? scope,
      detail: `${fuel.volume_litres} L`,
    });
    toast.success(needsReview ? "Fuel record sent for review" : "Fuel record saved");
    qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    qc.invalidateQueries({ queryKey: ["pending-entries"] });
    setFuel({ ...fuel, volume_litres: "", cost_usd: "", before: "", after: "", notes: "" });
  }

  async function saveMaint() {
    if (!maint.machine_id || !maint.description.trim()) {
      toast.error("Choose a machine and describe the work");
      return;
    }
    setBusy(true);
    const machine = machines.find((m) => m.id === maint.machine_id);
    const { error } = await supabase.from("maintenance_records").insert({
      machine_id: maint.machine_id,
      hub_id: machine?.hub_id ?? scope,
      type: maint.type,
      status: maint.status,
      description: maint.description,
      parts_used: maint.parts_used || null,
      labour_hours: maint.labour_hours ? Number(maint.labour_hours) : null,
      technician_name: maint.technician_name || null,
      scheduled_at: new Date(maint.scheduled_at).toISOString(),
      completed_at: maint.status === "completed" ? new Date().toISOString() : null,
      cost_usd: maint.cost_usd ? Number(maint.cost_usd) : null,
      notes: maint.notes || null,
      created_by: profile?.id ?? null,
      review_status: review,
    });
    setBusy(false);
    if (error)
      return toast.error("Could not save the maintenance record", { description: error.message });
    void logAudit(profile, {
      action: "entered maintenance record",
      entity: "maintenance",
      entity_ref: machine?.unit_id ?? null,
      hub_id: machine?.hub_id ?? scope,
      detail: maint.description.slice(0, 80),
    });
    toast.success(needsReview ? "Maintenance record sent for review" : "Maintenance record saved");
    qc.invalidateQueries({ queryKey: ["maintenance"] });
    qc.invalidateQueries({ queryKey: ["pending-entries"] });
    setMaint({ ...maint, description: "", parts_used: "", labour_hours: "", cost_usd: "", notes: "" });
  }

  async function saveProject() {
    if (!proj.name.trim()) {
      toast.error("Enter the project name");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("projects").insert({
      name: proj.name.trim(),
      hub_id: scope,
      status: proj.status as never,
      progress_pct: Number(proj.progress_pct || 0),
      km_coverage: Number(proj.km_coverage || 0),
      deadline: proj.deadline || null,
      description: proj.description || null,
    });
    setBusy(false);
    if (error) return toast.error("Could not save the project", { description: error.message });
    void logAudit(profile, {
      action: "created project",
      entity: "project",
      entity_ref: proj.name,
      hub_id: scope,
      detail: `${proj.km_coverage} km`,
    });
    toast.success("Project saved");
    qc.invalidateQueries({ queryKey: ["projects"] });
    setProj({ name: "", status: "active", progress_pct: "0", km_coverage: "0", deadline: "", description: "" });
  }

  return (
    <>
      <PageHeader
        title="Data Entry"
        subtitle={national ? "Any hub · national data office" : `Hub ${scope} only`}
      />

      {needsReview && (
        <Panel className="mb-4">
          <p className="text-xs text-amber">
            Everything you record is saved as “pending review”. The data entry supervisor checks it
            before it appears in fleet reports.
          </p>
        </Panel>
      )}

      <Panel>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex gap-1">
            {(
              [
                ["fuel", "Fuel consumption"],
                ["maintenance", "Maintenance"],
                ["project", "Projects"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`rounded-md px-2.5 py-1.5 text-xs ${tab === k ? "bg-green-dim text-teal" : "text-muted-foreground hover:bg-surface-2"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {national && (
            <label className="ml-auto text-[11px] text-muted-foreground">
              Hub
              <select
                className={inputCls}
                value={hub}
                onChange={(e) => setHub(Number(e.target.value))}
              >
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </Panel>

      {tab === "fuel" && (
        <Panel className="mt-4" title="Fuel consumption record">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px] text-muted-foreground">
              Machine
              <select
                className={inputCls}
                value={fuel.machine_id}
                onChange={(e) => setFuel({ ...fuel, machine_id: e.target.value })}
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
              Driver
              <select
                className={inputCls}
                value={fuel.driver_id}
                onChange={(e) => setFuel({ ...fuel, driver_id: e.target.value })}
              >
                <option value="">Not recorded</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name} ({d.staff_no})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Litres
              <input
                className={`${inputCls} num`}
                inputMode="decimal"
                value={fuel.volume_litres}
                onChange={(e) => setFuel({ ...fuel, volume_litres: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Cost (USD) — leave blank to calculate
              <input
                className={`${inputCls} num`}
                inputMode="decimal"
                value={fuel.cost_usd}
                onChange={(e) => setFuel({ ...fuel, cost_usd: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Tank level before (%)
              <input
                className={`${inputCls} num`}
                inputMode="numeric"
                value={fuel.before}
                onChange={(e) => setFuel({ ...fuel, before: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Tank level after (%)
              <input
                className={`${inputCls} num`}
                inputMode="numeric"
                value={fuel.after}
                onChange={(e) => setFuel({ ...fuel, after: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Date and time
              <input
                type="datetime-local"
                className={inputCls}
                value={fuel.logged_at}
                onChange={(e) => setFuel({ ...fuel, logged_at: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground sm:col-span-2">
              Notes
              <textarea
                className={`${inputCls} h-20`}
                value={fuel.notes}
                onChange={(e) => setFuel({ ...fuel, notes: e.target.value })}
              />
            </label>
          </div>
          <button className={`${btn.primary} mt-4`} onClick={saveFuel} disabled={busy}>
            {busy ? "Saving…" : "Save fuel record"}
          </button>
        </Panel>
      )}

      {tab === "maintenance" && (
        <Panel className="mt-4" title="Maintenance record">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px] text-muted-foreground">
              Machine
              <select
                className={inputCls}
                value={maint.machine_id}
                onChange={(e) => setMaint({ ...maint, machine_id: e.target.value })}
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
              Type
              <select
                className={inputCls}
                value={maint.type}
                onChange={(e) => setMaint({ ...maint, type: e.target.value })}
              >
                {["preventive", "corrective", "service", "inspection", "tyres", "overhaul"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Status
              <select
                className={inputCls}
                value={maint.status}
                onChange={(e) => setMaint({ ...maint, status: e.target.value })}
              >
                {["scheduled", "in_progress", "completed", "cancelled"].map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Date
              <input
                type="date"
                className={inputCls}
                value={maint.scheduled_at}
                onChange={(e) => setMaint({ ...maint, scheduled_at: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground sm:col-span-2">
              Work carried out
              <textarea
                className={`${inputCls} h-20`}
                value={maint.description}
                onChange={(e) => setMaint({ ...maint, description: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Parts used
              <input
                className={inputCls}
                value={maint.parts_used}
                onChange={(e) => setMaint({ ...maint, parts_used: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Technician
              <input
                className={inputCls}
                value={maint.technician_name}
                onChange={(e) => setMaint({ ...maint, technician_name: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Labour hours
              <input
                className={`${inputCls} num`}
                inputMode="decimal"
                value={maint.labour_hours}
                onChange={(e) => setMaint({ ...maint, labour_hours: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Cost (USD)
              <input
                className={`${inputCls} num`}
                inputMode="decimal"
                value={maint.cost_usd}
                onChange={(e) => setMaint({ ...maint, cost_usd: e.target.value })}
              />
            </label>
          </div>
          <button className={`${btn.primary} mt-4`} onClick={saveMaint} disabled={busy}>
            {busy ? "Saving…" : "Save maintenance record"}
          </button>
        </Panel>
      )}

      {tab === "project" && (
        <Panel className="mt-4" title="Road project">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px] text-muted-foreground sm:col-span-2">
              Project name
              <input
                className={inputCls}
                value={proj.name}
                onChange={(e) => setProj({ ...proj, name: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Status
              <select
                className={inputCls}
                value={proj.status}
                onChange={(e) => setProj({ ...proj, status: e.target.value })}
              >
                {["active", "delayed", "critical", "complete"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Deadline
              <input
                type="date"
                className={inputCls}
                value={proj.deadline}
                onChange={(e) => setProj({ ...proj, deadline: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Progress (%)
              <input
                className={`${inputCls} num`}
                inputMode="numeric"
                value={proj.progress_pct}
                onChange={(e) => setProj({ ...proj, progress_pct: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground">
              Road length (km)
              <input
                className={`${inputCls} num`}
                inputMode="decimal"
                value={proj.km_coverage}
                onChange={(e) => setProj({ ...proj, km_coverage: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-muted-foreground sm:col-span-2">
              Description
              <textarea
                className={`${inputCls} h-20`}
                value={proj.description}
                onChange={(e) => setProj({ ...proj, description: e.target.value })}
              />
            </label>
          </div>
          <button className={`${btn.primary} mt-4`} onClick={saveProject} disabled={busy}>
            {busy ? "Saving…" : "Save project"}
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Existing projects for this hub: {projects.length}
          </p>
        </Panel>
      )}
    </>
  );
}
