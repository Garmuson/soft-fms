import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar as RBar, ResponsiveContainer, Tooltip, XAxis, Cell } from "recharts";
import { alertsQuery, hubsQuery, machinesQuery } from "@/lib/api";
import {
  Bar,
  Donut,
  EmptyState,
  KpiCard,
  LevelBadge,
  Panel,
  PageHeader,
  SkeletonCards,
  SkeletonTable,
} from "@/components/kit";
import { MapPanel } from "@/components/MapPanel";
import { MachineDetailModal } from "@/components/MachineDetailModal";
import { rollupHubs, timeAgo, utilColor } from "@/lib/fleet";

export function CommandDashboard({ readOnly = false }: { readOnly?: boolean }) {
  const [unit, setUnit] = useState<string | null>(null);
  const [sort, setSort] = useState<"name" | "utilization" | "alerts">("name");
  const hubsQ = useQuery(hubsQuery());
  const machinesQ = useQuery(machinesQuery(null));
  const alertsQ = useQuery(alertsQuery(null));

  const hubs = hubsQ.data ?? [];
  const machines = machinesQ.data ?? [];
  const alerts = alertsQ.data ?? [];
  const loading = hubsQ.isLoading || machinesQ.isLoading;

  const rollups = useMemo(() => rollupHubs(hubs, machines, alerts), [hubs, machines, alerts]);
  const sorted = useMemo(() => {
    const r = [...rollups];
    if (sort === "utilization") r.sort((a, b) => b.utilization - a.utilization);
    if (sort === "alerts") r.sort((a, b) => b.alerts - a.alerts);
    return r;
  }, [rollups, sort]);

  const total = machines.length;
  const count = (s: string) => machines.filter((m) => m.status === s).length;
  const active = count("active");
  const util = total ? Math.round((active / total) * 100) : 0;
  // Freshness is measured against the newest telemetry report in the fleet, so a
  // tracker that stopped reporting 2 minutes before its peers counts as offline.
  const newestReport = machines.reduce(
    (a, m) => Math.max(a, new Date(m.last_seen).getTime()),
    0,
  );
  const gpsUp = total
    ? Math.round(
        (machines.filter((m) => newestReport - new Date(m.last_seen).getTime() < 120_000).length /
          total) *
          100,
      )
    : 0;
  const critical = alerts.filter((a) => a.level === "critical" && !a.is_acknowledged).length;

  const topHubs = [...rollups].sort((a, b) => b.utilization - a.utilization).slice(0, 8);

  return (
    <>
      <PageHeader
        title={readOnly ? "National Overview" : "Live Command Dashboard"}
        subtitle={`${total} machines across ${hubs.length} hubs · ${readOnly ? "read-only ministry view" : "fleet-wide command and control"}`}
      />

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        <KpiCard label="Active Machines" value={active} accent="green" sub="Working now" loading={loading} />
        <KpiCard label="In Maintenance" value={count("maintenance")} accent="blue" sub="Workshop" loading={loading} />
        <KpiCard label="Idle / Standby" value={count("idle")} accent="amber" sub="Awaiting task" loading={loading} />
        <KpiCard label="Critical Alerts" value={critical} accent="red" sub="Unacknowledged" loading={loading} />
        <KpiCard label="Fleet Utilization" value={`${util}%`} accent="gold" sub="Active / total" loading={loading} />
        <KpiCard label="GPS Uptime" value={`${gpsUp}%`} accent="teal" sub="Seen < 2 min" loading={loading} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel title="Fleet Map · Liberia" className="overflow-hidden">
          {loading ? (
            <div className="skeleton h-[460px] w-full" />
          ) : (
            <MapPanel
              machines={machines.map((m) => ({
                ...m,
                hub_name: hubs.find((h) => h.id === m.hub_id)?.name ?? null,
              }))}
              hubs={hubs}
              onSelect={setUnit}
            />
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Fleet Utilization">
            <div className="flex flex-col items-center gap-3">
              <Donut pct={util} />
              <div className="w-full space-y-2">
                {[
                  ["Active", active, "#2ea043"],
                  ["Maintenance", count("maintenance"), "#388bfd"],
                  ["Idle", count("idle"), "#f0883e"],
                ].map(([label, n, colour]) => (
                  <div key={String(label)}>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="num">
                        {total ? Math.round((Number(n) / total) * 100) : 0}%
                      </span>
                    </div>
                    <Bar pct={total ? (Number(n) / total) * 100 : 0} color={String(colour)} />
                  </div>
                ))}
              </div>
              <div className="h-24 w-full">
                <ResponsiveContainer>
                  <BarChart data={topHubs.map((h) => ({ name: h.county, value: h.utilization }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 8, fill: "var(--cat-ash)" }} hide />
                    <Tooltip
                      contentStyle={{
                        background: "var(--cat-steel)",
                        border: "1px solid var(--cat-yellow)",
                        fontSize: 11,
                      }}
                    />
                    <RBar dataKey="value" radius={2}>
                      {topHubs.map((h) => (
                        <Cell key={h.id} fill={utilColor(h.utilization)} />
                      ))}
                    </RBar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground">Top 8 hubs by utilization</p>
            </div>
          </Panel>

          <Panel
            title="Recent Alerts"
            action={
              <Link to="/alerts" className="text-[11px] text-blue hover:underline">
                View all alerts
              </Link>
            }
          >
            {alertsQ.isLoading ? (
              <SkeletonTable rows={5} cols={2} />
            ) : alerts.length === 0 ? (
              <EmptyState title="No alerts" message="No alerts have been raised across the fleet." />
            ) : (
              <ul className="space-y-2.5">
                {alerts.slice(0, 5).map((a) => {
                  const hub = hubs.find((h) => h.id === a.hub_id);
                  return (
                    <li key={a.id} className="flex items-start gap-2.5">
                      <LevelBadge level={a.level} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">{a.message}</p>
                        <p className="num text-[10px] text-muted-foreground">
                          {hub?.name} · {hub?.county} · {timeAgo(a.created_at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title="Hub Status · All 19 Hubs"
        className="mt-4"
        action={
          <select
            aria-label="Sort hubs"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-md border border-border bg-background px-2 py-1 text-[11px]"
          >
            <option value="name">Sort: Hub</option>
            <option value="utilization">Sort: Utilization</option>
            <option value="alerts">Sort: Alerts</option>
          </select>
        }
      >
        {loading ? (
          <SkeletonCards count={4} height={40} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["Hub", "Active", "Maintenance", "Idle", "Utilization", "Alerts"].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((h) => (
                  <tr
                    key={h.id}
                    className={`border-b border-border hover:bg-surface-2 ${h.utilization < 70 ? "border-l-2 border-l-red/70" : ""}`}
                  >
                    <td className="px-2 py-2">
                      <Link to="/hub/$id" params={{ id: String(h.id) }} className="block">
                        <span className="font-medium text-foreground">{h.name}</span>
                        <span className="block text-[10px] text-muted-foreground">{h.county}</span>
                      </Link>
                    </td>
                    <td className="num px-2 py-2 text-teal">{h.active}</td>
                    <td className="num px-2 py-2 text-blue">{h.maintenance}</td>
                    <td className="num px-2 py-2 text-amber">{h.idle}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <span className="num" style={{ color: utilColor(h.utilization) }}>
                          {h.utilization}%
                        </span>
                        <span className="w-20">
                          <Bar pct={h.utilization} />
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      {h.alerts > 0 ? (
                        <span className="num rounded-full bg-red-dim px-2 py-0.5 text-red">
                          {h.alerts}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
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
