import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fuelLogsQuery, hubsQuery, machinesQuery } from "@/lib/api";
import { EmptyState, KpiCard, PageHeader, Panel, SkeletonTable } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { MACHINE_TYPES, fmtDateTime, money } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/fuel")({
  head: () => ({
    meta: [
      { title: "Fuel Overview · YM-FMS" },
      {
        name: "description",
        content: "Fleet fuel consumption, cost and anomaly detection across all 19 SPPCC hubs.",
      },
      { property: "og:title", content: "Fuel Overview · YM-FMS" },
      { property: "og:description", content: "Monthly fuel volumes, costs and suspicious events." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "ministry_analyst"]}>
      <FuelPage />
    </RoleGate>
  ),
});

function FuelPage() {
  const logsQ = useQuery(fuelLogsQuery(null));
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(null));

  const logs = logsQ.data ?? [];
  const machineById = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);

  const monthStart = new Date();
  monthStart.setDate(monthStart.getDate() - 30);
  const monthLogs = logs.filter((l) => new Date(l.logged_at) >= monthStart);
  const totalVol = monthLogs.reduce((a, l) => a + Number(l.volume_litres), 0);
  const totalCost = monthLogs.reduce((a, l) => a + Number(l.cost_usd), 0);
  const avgFuel = machines.length
    ? Math.round(machines.reduce((a, m) => a + m.fuel_level, 0) / machines.length)
    : 0;
  const flagged = logs.filter((l) => l.is_flagged);

  const trend = useMemo(() => {
    const days: Record<string, Record<string, number>> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(5, 10);
      days[d] = {};
    }
    monthLogs.forEach((l) => {
      const d = l.logged_at.slice(5, 10);
      const t = machineById.get(l.machine_id)?.type ?? "other";
      if (!days[d]) days[d] = {};
      days[d]![t] = (days[d]![t] ?? 0) + Number(l.volume_litres);
    });
    return Object.entries(days).map(([date, v]) => ({ date, ...v }));
  }, [monthLogs, machineById]);

  const hubSummary = hubs.map((h) => {
    const hl = monthLogs.filter((l) => l.hub_id === h.id);
    const hm = machines.filter((m) => m.hub_id === h.id);
    return {
      ...h,
      volume: hl.reduce((a, l) => a + Number(l.volume_litres), 0),
      cost: hl.reduce((a, l) => a + Number(l.cost_usd), 0),
      avgFuel: hm.length ? Math.round(hm.reduce((a, m) => a + m.fuel_level, 0) / hm.length) : 0,
      anomalies: hl.filter((l) => l.is_flagged).length,
    };
  });

  const COLORS = ["#2ea043", "#d4a017", "#388bfd", "#f0883e", "#da3633", "#7d8590"];

  return (
    <>
      <PageHeader title="Fuel Overview" subtitle="Last 30 days across the national fleet" />

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <KpiCard
          label="Fuel This Month"
          value={`${Math.round(totalVol).toLocaleString()} L`}
          accent="gold"
          loading={logsQ.isLoading}
        />
        <KpiCard label="Fuel Cost" value={money(Math.round(totalCost))} accent="green" loading={logsQ.isLoading} />
        <KpiCard label="Fleet Avg Fuel Level" value={`${avgFuel}%`} accent="teal" />
        <KpiCard label="Anomalies Detected" value={flagged.length} accent="red" />
      </div>

      <Panel title="Daily Consumption by Machine Type" className="mt-4">
        {logsQ.isLoading ? (
          <div className="skeleton h-56 w-full" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid stroke="#21262d" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#7d8590" }} />
                <YAxis tick={{ fontSize: 10, fill: "#7d8590" }} />
                <Tooltip
                  contentStyle={{ background: "#1c2330", border: "1px solid #30363d", fontSize: 11 }}
                />
                {MACHINE_TYPES.map((t, i) => (
                  <Line
                    key={t.value}
                    type="monotone"
                    dataKey={t.value}
                    name={t.label}
                    stroke={COLORS[i] ?? "#7d8590"}
                    dot={false}
                    strokeWidth={1.5}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-[3fr_2fr]">
        <Panel title="Hub Fuel Summary">
          {logsQ.isLoading ? (
            <SkeletonTable rows={8} cols={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b border-border">
                    {["Hub", "County", "Volume", "Cost", "Avg Fuel", "Anomalies"].map((h) => (
                      <th key={h} className="px-2 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hubSummary.map((h) => (
                    <tr key={h.id} className="border-b border-border hover:bg-surface-2">
                      <td className="px-2 py-2">{h.name}</td>
                      <td className="px-2 py-2 text-muted-foreground">{h.county}</td>
                      <td className="num px-2 py-2">{Math.round(h.volume).toLocaleString()} L</td>
                      <td className="num px-2 py-2">{money(Math.round(h.cost))}</td>
                      <td className="num px-2 py-2">{h.avgFuel}%</td>
                      <td className="num px-2 py-2 text-amber">{h.anomalies || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Fuel Anomalies">
          {flagged.length === 0 ? (
            <EmptyState
              title="No anomalies"
              message="No suspicious fuel events have been flagged in the last 30 days."
            />
          ) : (
            <ul className="space-y-2">
              {flagged.slice(0, 12).map((f) => (
                <li key={f.id} className="rounded-md border border-amber/40 bg-amber-dim/30 p-2.5">
                  <p className="num text-xs">{machineById.get(f.machine_id)?.unit_id ?? "—"}</p>
                  <p className="text-[11px] text-amber">{f.flag_reason}</p>
                  <p className="num text-[10px] text-muted-foreground">
                    {hubs.find((h) => h.id === f.hub_id)?.name} · {fmtDateTime(f.logged_at)} ·{" "}
                    {f.volume_litres} L
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
