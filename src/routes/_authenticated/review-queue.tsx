import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { hubsQuery, machinesQuery, pendingEntriesQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, btn, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/_authenticated/review-queue")({
  head: () => ({
    meta: [
      { title: "Review Queue · YM-FMS" },
      {
        name: "description",
        content:
          "Approve or reject fuel, maintenance, driver and assignment records submitted by hub data entry staff.",
      },
      { property: "og:title", content: "Review Queue · YM-FMS" },
      {
        property: "og:description",
        content: "Supervisor sign-off on every record entered from the hubs.",
      },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "data_entry_supervisor"]}>
      <ReviewQueuePage />
    </RoleGate>
  ),
});

type Table = "drivers" | "driver_assignments" | "fuel_logs" | "maintenance_records";

function ReviewQueuePage() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [hubFilter, setHubFilter] = useState<number | "">("");
  const scope = hubFilter === "" ? null : hubFilter;
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(scope));
  const { data, isLoading } = useQuery(pendingEntriesQuery(scope));

  const unit = (id: string | null) => machines.find((m) => m.id === id)?.unit_id ?? "—";
  const total =
    (data?.drivers.length ?? 0) +
    (data?.assignments.length ?? 0) +
    (data?.fuel.length ?? 0) +
    (data?.maintenance.length ?? 0);

  async function decide(table: Table, id: string, approve: boolean, label: string, hub: number | null) {
    const { error } = await supabase
      .from(table)
      .update({
        review_status: approve ? "approved" : "rejected",
        reviewed_by: profile?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error("Could not record the decision", { description: error.message });
      return;
    }
    void logAudit(profile, {
      action: approve ? "approved record" : "rejected record",
      entity: table,
      entity_ref: label,
      hub_id: hub,
      detail: approve ? "Approved after review" : "Rejected after review",
    });
    toast.success(approve ? "Record approved" : "Record rejected");
    qc.invalidateQueries({ queryKey: ["pending-entries"] });
    qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    qc.invalidateQueries({ queryKey: ["maintenance"] });
    qc.invalidateQueries({ queryKey: ["drivers"] });
    qc.invalidateQueries({ queryKey: ["driver_assignments"] });
  }

  function Actions({
    table,
    id,
    label,
    hub,
  }: {
    table: Table;
    id: string;
    label: string;
    hub: number | null;
  }) {
    return (
      <div className="flex justify-end gap-2">
        <button
          className={btn.primary}
          onClick={() => decide(table, id, true, label, hub)}
          aria-label="Approve"
        >
          <Check className="size-3.5" aria-hidden /> Approve
        </button>
        <button
          className={btn.secondary}
          onClick={() => decide(table, id, false, label, hub)}
          aria-label="Reject"
        >
          <X className="size-3.5" aria-hidden /> Reject
        </button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Review Queue"
        subtitle={`${total} record${total === 1 ? "" : "s"} waiting for sign-off`}
      />

      <Panel>
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
      </Panel>

      {isLoading && (
        <Panel className="mt-4">
          <p className="text-xs text-muted-foreground">Loading pending records…</p>
        </Panel>
      )}

      {!isLoading && total === 0 && (
        <Panel className="mt-4">
          <p className="py-6 text-center text-xs text-muted-foreground">
            Nothing is waiting for review. Everything entered from the hubs has been signed off.
          </p>
        </Panel>
      )}

      {!!data?.fuel.length && (
        <Panel className="mt-4" title={`Fuel records (${data.fuel.length})`}>
          <ul className="divide-y divide-border">
            {data.fuel.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 py-2.5 text-xs">
                <div className="min-w-40">
                  <p className="num">{unit(f.machine_id)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Hub {f.hub_id} · {new Date(f.logged_at).toLocaleString()}
                  </p>
                </div>
                <p className="num">
                  {f.volume_litres} L · ${Number(f.cost_usd).toFixed(2)}
                </p>
                {f.notes && <p className="text-muted-foreground">{f.notes}</p>}
                <div className="ml-auto">
                  <Actions table="fuel_logs" id={f.id} label={unit(f.machine_id)} hub={f.hub_id} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {!!data?.maintenance.length && (
        <Panel className="mt-4" title={`Maintenance records (${data.maintenance.length})`}>
          <ul className="divide-y divide-border">
            {data.maintenance.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5 text-xs">
                <div className="min-w-40">
                  <p className="num">{unit(m.machine_id)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Hub {m.hub_id} · {m.type} · {new Date(m.scheduled_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-muted-foreground">{m.description ?? "—"}</p>
                <div className="ml-auto">
                  <Actions
                    table="maintenance_records"
                    id={m.id}
                    label={unit(m.machine_id)}
                    hub={m.hub_id}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {!!data?.drivers.length && (
        <Panel className="mt-4" title={`Driver records (${data.drivers.length})`}>
          <ul className="divide-y divide-border">
            {data.drivers.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 py-2.5 text-xs">
                <div className="min-w-40">
                  <p>{d.full_name}</p>
                  <p className="num text-[10px] text-muted-foreground">
                    {d.staff_no} · Hub {d.hub_id}
                  </p>
                </div>
                <p className="num text-muted-foreground">
                  Licence {d.licence_number ?? "—"}
                  {d.licence_expiry ? ` · expires ${d.licence_expiry}` : ""}
                </p>
                <div className="ml-auto">
                  <Actions table="drivers" id={d.id} label={d.staff_no} hub={d.hub_id} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {!!data?.assignments.length && (
        <Panel className="mt-4" title={`Driver assignments (${data.assignments.length})`}>
          <ul className="divide-y divide-border">
            {data.assignments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5 text-xs">
                <div className="min-w-40">
                  <p className="num">{unit(a.machine_id)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Hub {a.hub_id} · {a.shift} shift ·{" "}
                    {new Date(a.assigned_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-auto">
                  <Actions
                    table="driver_assignments"
                    id={a.id}
                    label={unit(a.machine_id)}
                    hub={a.hub_id}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
