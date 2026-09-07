import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList, X } from "lucide-react";
import { machinesQuery, profilesQuery, projectsQuery, workOrdersQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  PageHeader,
  Panel,
  SkeletonTable,
  btn,
  inputCls,
} from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { fmtDate } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/work-orders")({
  head: () => ({
    meta: [
      { title: "Work Orders · YM-FMS" },
      {
        name: "description",
        content: "Create, assign and track work orders for machines and operators in your hub.",
      },
      { property: "og:title", content: "Work Orders · YM-FMS" },
      { property: "og:description", content: "Hub work order scheduling and status tracking." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hub_supervisor"]}>
      <WorkOrdersPage />
    </RoleGate>
  ),
});

const STATUSES = ["assigned", "in_progress", "completed", "cancelled"];
const PRIORITY_TONE: Record<string, string> = {
  low: "bg-surface-2 text-muted-foreground",
  medium: "bg-blue-dim text-blue",
  high: "bg-red-dim text-red",
};

function WorkOrdersPage() {
  const { hubId, profile } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    machine_id: "",
    operator_id: "",
    project_id: "",
    priority: "medium",
    scheduled_date: new Date().toISOString().slice(0, 10),
  });

  const woQ = useQuery(workOrdersQuery(hubId));
  const { data: machines = [] } = useQuery(machinesQuery(hubId));
  const { data: projects = [] } = useQuery(projectsQuery(hubId));
  const { data: profiles = [] } = useQuery(profilesQuery());

  const hubStaff = profiles.filter((p) => p.hub_id === hubId);
  const rows = (woQ.data ?? []).filter(
    (w) => (!status || w.status === status) && (!priority || w.priority === priority),
  );

  async function updateStatus(id: string, next: string) {
    const { error } = await supabase
      .from("work_orders")
      .update({
        status: next as "assigned",
        completed_at: next === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) toast.error("Update failed", { description: error.message });
    else {
      toast.success("Work order updated");
      qc.invalidateQueries({ queryKey: ["work_orders"] });
    }
  }

  async function create() {
    if (!form.title || !hubId) {
      toast.error("A title is required");
      return;
    }
    const { error } = await supabase.from("work_orders").insert({
      hub_id: hubId,
      title: form.title,
      description: form.description || null,
      machine_id: form.machine_id || null,
      operator_id: form.operator_id || null,
      project_id: form.project_id || null,
      priority: form.priority as "medium",
      scheduled_date: form.scheduled_date,
      created_by: profile?.id ?? null,
      status: "assigned" as const,
    });
    if (error) toast.error("Could not create work order", { description: error.message });
    else {
      toast.success("Work order created");
      setCreating(false);
      setForm({ ...form, title: "", description: "", machine_id: "", operator_id: "", project_id: "" });
      qc.invalidateQueries({ queryKey: ["work_orders"] });
    }
  }

  return (
    <>
      <PageHeader
        title="Work Orders"
        subtitle={`${rows.length} work orders`}
        actions={
          <button className={btn.primary} onClick={() => setCreating(true)}>
            New Work Order
          </button>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <select
          className={`${inputCls} max-w-40`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} max-w-36`}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {["low", "medium", "high"].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <Panel className="overflow-hidden">
        {woQ.isLoading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-4" />}
            title="No work orders"
            message="Create a work order to assign a machine and operator to a task."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["Title", "Machine", "Operator", "Priority", "Scheduled", "Status"].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="border-b border-border hover:bg-surface-2">
                    <td className="px-2 py-2">{w.title}</td>
                    <td className="num px-2 py-2">
                      {machines.find((m) => m.id === w.machine_id)?.unit_id ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {profiles.find((p) => p.id === w.operator_id)?.full_name ?? "—"}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${PRIORITY_TONE[w.priority]}`}>
                        {w.priority}
                      </span>
                    </td>
                    <td className="num px-2 py-2">{fmtDate(w.scheduled_date)}</td>
                    <td className="px-2 py-2">
                      <select
                        className={`${inputCls} max-w-32`}
                        value={w.status}
                        onChange={(e) => updateStatus(w.id, e.target.value)}
                        aria-label={`Status for ${w.title}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">New Work Order</h2>
              <button onClick={() => setCreating(false)} aria-label="Close">
                <X className="size-4 text-muted-foreground" />
              </button>
            </header>
            <div className="space-y-3 p-4">
              <label className="block text-[10px] text-muted-foreground">
                Title
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label className="block text-[10px] text-muted-foreground">
                Description
                <textarea
                  className={`${inputCls} h-20`}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label className="block text-[10px] text-muted-foreground">
                Machine
                <select
                  className={inputCls}
                  value={form.machine_id}
                  onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                >
                  <option value="">Select machine…</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.unit_id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] text-muted-foreground">
                Operator
                <select
                  className={inputCls}
                  value={form.operator_id}
                  onChange={(e) => setForm({ ...form, operator_id: e.target.value })}
                >
                  <option value="">Select operator…</option>
                  {hubStaff.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[10px] text-muted-foreground">
                Project (optional)
                <select
                  className={inputCls}
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[10px] text-muted-foreground">
                  Priority
                  <select
                    className={inputCls}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {["low", "medium", "high"].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-[10px] text-muted-foreground">
                  Scheduled date
                  <input
                    type="date"
                    className={inputCls}
                    value={form.scheduled_date}
                    onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  />
                </label>
              </div>
              <button className={`${btn.primary} w-full justify-center`} onClick={create}>
                Create Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
