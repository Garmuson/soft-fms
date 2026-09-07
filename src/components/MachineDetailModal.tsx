import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  alertsQuery,
  fuelLogsQuery,
  gpsTrackQuery,
  hubsQuery,
  maintenanceQuery,
  type Machine,
} from "@/lib/api";
import {
  Bar,
  EmptyState,
  LevelBadge,
  Panel,
  SkeletonTable,
  StatusBadge,
  btn,
} from "@/components/kit";
import { MapPanel } from "@/components/MapPanel";
import { fmtDateTime, money, timeAgo, typeLabel } from "@/lib/fleet";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const TABS = ["Overview", "Location & History", "Fuel Log", "Maintenance", "Alerts"] as const;

export function MachineDetailModal({
  unitId,
  onClose,
}: {
  unitId: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  const { readOnly, role } = useAuth();

  const { data: machine, isLoading } = useQuery({
    queryKey: ["machine", unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .eq("unit_id", unitId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Machine | null;
    },
  });

  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: fuel = [] } = useQuery({
    ...fuelLogsQuery(null, machine?.id ?? null),
    enabled: !!machine?.id,
  });
  const { data: maint = [] } = useQuery({
    ...maintenanceQuery(null, machine?.id ?? null),
    enabled: !!machine?.id,
  });
  const { data: allAlerts = [] } = useQuery({
    ...alertsQuery(machine?.hub_id ?? null),
    enabled: !!machine?.hub_id,
  });
  });

  if (!unitId) return null;
  const hub = hubs.find((h) => h.id === machine?.hub_id);
  const alerts = allAlerts.filter((a) => a.machine_id === machine?.id);
  const canAct = !readOnly && role !== "ministry_analyst";

  async function setStatus(status: string) {
    if (!machine) return;
    const { error } = await supabase
      .from("machines")
      .update({ status: status as "active" })
      .eq("id", machine.id);
    if (error) toast.error("Could not update this machine", { description: error.message });
    else toast.success(`${machine.unit_id} marked ${status}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Machine ${unitId}`}
      onClick={onClose}
    >
      <div
        className="mx-auto max-w-6xl overflow-hidden rounded-lg border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="num text-xl font-medium">{unitId}</h2>
              {machine && <StatusBadge status={machine.status} />}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {machine ? typeLabel(machine.type) : "—"} · {hub ? `${hub.name} — ${hub.county}` : "—"}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close machine details">
            <X className="size-5 text-muted-foreground hover:text-foreground" />
          </button>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-border px-3">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "border-b-2 border-green px-3 py-2 text-xs font-medium text-foreground"
                  : "px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-4">
          {isLoading || !machine ? (
            <SkeletonTable rows={5} cols={4} />
          ) : tab === "Overview" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Key metrics">
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Fuel level</dt>
                    <dd className="mt-1 flex items-center gap-2">
                      <Bar pct={machine.fuel_level} color="#2ea043" className="max-w-48" />
                      <span className="num">{machine.fuel_level}%</span>
                    </dd>
                  </div>
                  <Metric label="Engine hours today" value={`${machine.engine_hours_today} h`} />
                  <Metric label="Engine hours lifetime" value={`${machine.engine_hours_lifetime} h`} />
                  <Metric label="Speed" value={`${machine.speed_kmh} km/h`} />
                  <Metric label="Ignition" value={machine.ignition_on ? "On" : "Off"} />
                  <Metric
                    label="GPS position"
                    value={`${Number(machine.lat).toFixed(4)}, ${Number(machine.lng).toFixed(4)}`}
                  />
                  <Metric label="Last seen" value={timeAgo(machine.last_seen)} />
                </dl>
              </Panel>
              <Panel title="Current assignment">
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <Metric label="Hub" value={hub ? `${hub.name} — ${hub.county}` : "—"} />
                  <Metric label="Operator" value={machine.operator_id ? "Assigned" : "Unassigned"} />
                  <Metric label="Project" value={machine.current_project_id ? "Assigned" : "None"} />
                  <Metric label="Status" value={machine.status} />
                </dl>
                {canAct && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className={btn.secondary} onClick={() => setStatus("idle")}>
                      Mark Idle
                    </button>
                    <button className={btn.secondary} onClick={() => setStatus("maintenance")}>
                      Request Maintenance
                    </button>
                    <button className={btn.secondary} onClick={() => setStatus("active")}>
                      Mark Active
                    </button>
                  </div>
                )}
              </Panel>
            </div>
          ) : tab === "Location & History" ? (
            <HistoryTab machine={machine} hubName={hub?.name ?? null} />

          ) : tab === "Fuel Log" ? (
            fuel.length === 0 ? (
              <EmptyState
                title="No fuel events"
                message="No refuelling has been logged for this machine yet. Operators can add entries from the Fuel Entry screen."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b border-border">
                      {["Date/Time", "Volume", "Cost", "Before", "After", "Flagged"].map((h) => (
                        <th key={h} className="px-2 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fuel.slice(0, 10).map((f) => (
                      <tr
                        key={f.id}
                        className={
                          f.is_flagged
                            ? "border-b border-border bg-amber-dim/40"
                            : "border-b border-border hover:bg-surface-2"
                        }
                      >
                        <td className="num px-2 py-2">{fmtDateTime(f.logged_at)}</td>
                        <td className="num px-2 py-2">{f.volume_litres} L</td>
                        <td className="num px-2 py-2">{money(f.cost_usd)}</td>
                        <td className="num px-2 py-2">{f.fuel_level_before}%</td>
                        <td className="num px-2 py-2">{f.fuel_level_after}%</td>
                        <td className="px-2 py-2 text-amber">{f.is_flagged ? f.flag_reason : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : tab === "Maintenance" ? (
            maint.length === 0 ? (
              <EmptyState
                title="No maintenance history"
                message="This machine has no maintenance records. Use Request Maintenance on the Overview tab to schedule work."
              />
            ) : (
              <ol className="space-y-3">
                {maint.map((m) => (
                  <li key={m.id} className="flex gap-3">
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ background: m.status === "overdue" ? "#da3633" : "#388bfd" }}
                    />
                    <div className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-blue-dim px-2 py-0.5 capitalize text-blue">
                          {m.type}
                        </span>
                        <span
                          className={
                            m.status === "overdue"
                              ? "rounded-full bg-red-dim px-2 py-0.5 capitalize text-red"
                              : "rounded-full bg-surface px-2 py-0.5 capitalize text-muted-foreground"
                          }
                        >
                          {m.status.replace("_", " ")}
                        </span>
                        <span className="num text-muted-foreground">
                          {fmtDateTime(m.scheduled_at)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-foreground">{m.description}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {m.technician_name} · {m.parts_used} · {m.labour_hours}h ·{" "}
                        {money(m.cost_usd)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )
          ) : alerts.length === 0 ? (
            <EmptyState title="No alerts" message="This machine has raised no alerts." />
          ) : (
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["Level", "Type", "Message", "Raised", "Acknowledged"].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-border">
                    <td className="px-2 py-2">
                      <LevelBadge level={a.level} />
                    </td>
                    <td className="px-2 py-2 capitalize">{a.type.replace(/_/g, " ")}</td>
                    <td className="px-2 py-2">{a.message}</td>
                    <td className="num px-2 py-2">{fmtDateTime(a.created_at)}</td>
                    <td className="num px-2 py-2">
                      {a.is_acknowledged ? fmtDateTime(a.acknowledged_at) : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="num mt-0.5 capitalize text-foreground">{value}</dd>
    </div>
  );
}
