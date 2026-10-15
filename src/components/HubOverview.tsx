import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { alertsQuery, hubsQuery, machinesQuery, projectsQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  Bar,
  Donut,
  EmptyState,
  FuelBar,
  KpiCard,
  LevelBadge,
  PageHeader,
  Panel,
  SkeletonTable,
  StatusBadge,
  btn,
} from "@/components/kit";
import { MapPanel } from "@/components/MapPanel";
import { MachineDetailModal } from "@/components/MachineDetailModal";
import { HubFuelPanel } from "@/components/HubFuelPanel";
import {
  MACHINE_TYPES,
  fmtDate,
  projectAlignment,
  timeAgo,
  typeLabel,
  utilColor,
  toCsv,
  downloadFile,
} from "@/lib/fleet";
import { useAuth } from "@/hooks/use-auth";

export function HubOverview({ hubId, isSupervisorHome = false }: { hubId: number; isSupervisorHome?: boolean }) {
  const [unit, setUnit] = useState<string | null>(null);
  const qc = useQueryClient();
  const { readOnly } = useAuth();
  const hubsQ = useQuery(hubsQuery());
  const machinesQ = useQuery(machinesQuery(hubId));
  const alertsQ = useQuery(alertsQuery(hubId));
  const projectsQ = useQuery(projectsQuery(hubId));

  const hub = (hubsQ.data ?? []).find((h) => h.id === hubId);
  const machines = machinesQ.data ?? [];
  const alerts = alertsQ.data ?? [];
  const projects = projectsQ.data ?? [];

  const count = (s: string) => machines.filter((m) => m.status === s).length;
  const active = count("active");
  const util = machines.length ? Math.round((active / machines.length) * 100) : 0;
  const openAlerts = alerts.filter((a) => !a.is_acknowledged);

  const byType = useMemo(
    () =>
      MACHINE_TYPES.map((t) => {
        const ms = machines.filter((m) => m.type === t.value);
        const act = ms.filter((m) => m.status === "active").length;
        return {
          ...t,
          count: ms.length,
          util: ms.length ? Math.round((act / ms.length) * 100) : 0,
        };
      }),
    [machines],
  );

  async function acknowledge(id: string) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("alerts")
      .update({
        is_acknowledged: true,
        acknowledged_by: u.user?.id ?? null,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) toast.error("Could not acknowledge this alert", { description: error.message });
    else {
      toast.success("Alert acknowledged");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    }
  }

  function exportHub() {
    downloadFile(
      `${hub?.name ?? "hub"}-register.csv`,
      toCsv(
        machines.map((m) => ({
          unit_id: m.unit_id,
          type: typeLabel(m.type),
          status: m.status,
          fuel_level: m.fuel_level,
          engine_hours_today: m.engine_hours_today,
          last_seen: m.last_seen,
        })),
      ),
    );
    toast.success("Hub report exported as CSV");
  }

  return (
    <>
      <PageHeader
        breadcrumb={
          isSupervisorHome ? undefined : (
            <span>
              <Link to="/hubs" className="hover:underline">
                All Hubs
              </Link>{" "}
              → {hub?.name} — {hub?.county}
            </span>
          )
        }
        title={hub ? `${hub.name} — ${hub.county}` : "Hub"}
        subtitle={`${machines.length} machines assigned${hub?.supervisor_id ? " · supervised hub" : ""}`}
        actions={
          <>
            <button className={btn.primary} onClick={exportHub}>
              Export Hub Report
            </button>
            {!readOnly && (
              <Link to="/work-orders" className={btn.secondary}>
                Assign Task
              </Link>
            )}
          </>
        }
      />

      <div className="kpi-grid grid gap-3">
        <KpiCard label="Total Machines" value={machines.length} loading={machinesQ.isLoading} />
        <KpiCard label="Active Today" value={active} accent="green" loading={machinesQ.isLoading} />
        <KpiCard label="In Maintenance" value={count("maintenance")} accent="blue" loading={machinesQ.isLoading} />
        <KpiCard label="Idle / Standby" value={count("idle")} accent="amber" loading={machinesQ.isLoading} />
        <KpiCard
          label="Utilization"
          value={`${util}%`}
          accent={util >= 80 ? "green" : util >= 70 ? "amber" : "red"}
          sub={util >= 80 ? "Above target" : util >= 70 ? "Near target" : "Below 70% target"}
          loading={machinesQ.isLoading}
        />
        <KpiCard label="Active Alerts" value={openAlerts.length} accent="red" loading={alertsQ.isLoading} />
      </div>

      {hub && <HubFuelPanel hub={hub} />}

      <div className="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <Panel title="Hub Map">
            {machinesQ.isLoading ? (
              <div className="skeleton h-[400px] w-full" />
            ) : (
              <MapPanel
                machines={machines.map((m) => ({ ...m, hub_name: hub?.name ?? null }))}
                center={[Number(hub?.lat_center ?? 6.3), Number(hub?.lng_center ?? -9.4)]}
                zoom={10}
                height={400}
                onSelect={setUnit}
              />
            )}
          </Panel>
          <Panel title="Active Alerts">
            {alertsQ.isLoading ? (
              <SkeletonTable rows={3} cols={2} />
            ) : openAlerts.length === 0 ? (
              <EmptyState
                title="No active alerts"
                message="Every machine in this hub is reporting normally."
              />
            ) : (
              <ul className="space-y-2">
                {openAlerts.slice(0, 6).map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2"
                  >
                    <LevelBadge level={a.level} />
                    <span className="min-w-0 flex-1 truncate text-xs">{a.message}</span>
                    <span className="num text-[10px] text-muted-foreground">
                      {timeAgo(a.created_at)}
                    </span>
                    {!readOnly && (
                      <button className={btn.secondary} onClick={() => acknowledge(a.id)}>
                        Acknowledge
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Utilization">
            <div className="flex flex-col items-center gap-3">
              <Donut pct={util} />
              <div className="w-full space-y-2">
                {[
                  ["Active", active, "#2ea043"],
                  ["Maintenance", count("maintenance"), "#388bfd"],
                  ["Idle", count("idle"), "#f0883e"],
                ].map(([l, n, c]) => (
                  <div key={String(l)}>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{l}</span>
                      <span className="num">{Number(n)}</span>
                    </div>
                    <Bar
                      pct={machines.length ? (Number(n) / machines.length) * 100 : 0}
                      color={String(c)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Equipment Types">
            <ul className="space-y-2.5">
              {byType.map((t) => (
                <li key={t.value}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{t.label}</span>
                    <span className="num">
                      {t.count} · {t.util}%
                    </span>
                  </div>
                  <Bar pct={t.util} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Active Projects">
            {projects.length === 0 ? (
              <EmptyState
                title="No projects assigned"
                message="This hub has no road projects yet. HQ assigns projects from the Projects screen."
              />
            ) : (
              <ul className="space-y-3">
                {projects.map((p) => {
                  const al = projectAlignment(p.progress_pct, p.machines_assigned);
                  return (
                    <li key={p.id} className="rounded-md border border-border bg-surface-2 p-3">
                      <p className="text-xs font-medium">{p.name}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="capitalize">{p.status}</span>
                        <span className="num">{p.progress_pct}%</span>
                      </div>
                      <Bar pct={p.progress_pct} className="mt-1" />
                      <p className="num mt-1.5 text-[10px] text-muted-foreground">
                        {p.machines_assigned} machines · {p.km_coverage} km · due {fmtDate(p.deadline)}
                      </p>
                      <p
                        className={`mt-1 text-[10px] ${al.tone === "red" ? "text-red" : al.tone === "amber" ? "text-amber" : "text-teal"}`}
                      >
                        {al.state} — {al.note}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Machine Register" className="mt-4">
        {machinesQ.isLoading ? (
          <SkeletonTable rows={10} cols={7} />
        ) : machines.length === 0 ? (
          <EmptyState title="No machines" message="No machines are assigned to this hub yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["Unit ID", "Type", "Status", "Operator", "Project", "Fuel", "Hours Today"].map(
                    (h) => (
                      <th key={h} className="px-2 py-2 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setUnit(m.unit_id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setUnit(m.unit_id)}
                    className="cursor-pointer border-b border-border hover:bg-surface-2"
                  >
                    <td className="num px-2 py-2" style={{ color: utilColor(m.fuel_level) }}>
                      {m.unit_id}
                    </td>
                    <td className="px-2 py-2">{typeLabel(m.type)}</td>
                    <td className="px-2 py-2">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {m.operator_id ? "Assigned" : "—"}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {m.current_project_id
                        ? projects.find((p) => p.id === m.current_project_id)?.name ?? "Assigned"
                        : "—"}
                    </td>
                    <td className="px-2 py-2">
                      <FuelBar pct={m.fuel_level} />
                    </td>
                    <td className="num px-2 py-2">{m.engine_hours_today} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <MachineDetailModal unitId={unit} onClose={() => setUnit(null)} />
    </>
  );
}
