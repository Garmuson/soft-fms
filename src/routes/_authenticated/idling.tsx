import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Gauge } from "lucide-react";
import { fleetTracksQuery, hubsQuery } from "@/lib/api";
import {
  EmptyState,
  KpiCard,
  PageHeader,
  Panel,
  SkeletonTable,
  btn,
  inputCls,
} from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { analyseTrack, readThresholds, writeThresholds, type Thresholds } from "@/lib/thresholds";
import { downloadFile, toCsv, typeLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/idling")({
  head: () => ({
    meta: [
      { title: "Idling & Speeding · YM-FMS" },
      {
        name: "description",
        content:
          "Prolonged idling and over-speed monitoring for SPPCC Yellow Machines, with adjustable thresholds and CSV export.",
      },
      { property: "og:title", content: "Idling & Speeding · YM-FMS" },
      { property: "og:description", content: "Machine behaviour monitoring against operating limits." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "hub_supervisor", "ministry_analyst"]}>
      <IdlingPage />
    </RoleGate>
  ),
});

function IdlingPage() {
  const { role, hubId } = useAuth();
  const scope = role === "hub_supervisor" ? hubId : null;
  const [hours, setHours] = useState(24);
  const [thresholds, setThresholds] = useState<Thresholds>(() => readThresholds());
  const [hubFilter, setHubFilter] = useState<number | null>(scope);

  const tracksQ = useQuery(fleetTracksQuery(scope, hours));
  const { data: hubs = [] } = useQuery(hubsQuery());

  function update(patch: Partial<Thresholds>) {
    const next = { ...thresholds, ...patch };
    setThresholds(next);
    writeThresholds(next);
  }

  const rows = useMemo(() => {
    const data = tracksQ.data;
    if (!data) return [];
    const byMachine = new Map<string, typeof data.points>();
    for (const p of data.points) {
      const list = byMachine.get(p.machine_id) ?? [];
      list.push(p);
      byMachine.set(p.machine_id, list);
    }
    return data.machines
      .filter((m) => !hubFilter || m.hub_id === hubFilter)
      .map((m) => {
        const b = analyseTrack(byMachine.get(m.id) ?? [], thresholds);
        return {
          ...m,
          ...b,
          overIdle: b.longestIdleMinutes >= thresholds.idleMinutes,
          speeding: b.speedingPoints > 0,
        };
      })
      .filter((r) => r.movingMinutes + r.idleMinutes > 0)
      .sort((a, b) => b.longestIdleMinutes - a.longestIdleMinutes);
  }, [tracksQ.data, thresholds, hubFilter]);

  const overIdle = rows.filter((r) => r.overIdle).length;
  const speeding = rows.filter((r) => r.speeding).length;
  const avgIdle = rows.length
    ? Math.round(rows.reduce((a, r) => a + r.idleMinutes, 0) / rows.length)
    : 0;

  return (
    <>
      <PageHeader
        title="Idling & Speeding"
        subtitle="Machine behaviour measured against SPPCC operating limits"
        actions={
          <button
            className={btn.secondary}
            onClick={() =>
              downloadFile(
                `ym-fms-idling-speeding-${hours}h.csv`,
                toCsv(
                  rows.map((r) => ({
                    unit: r.unit_id,
                    type: r.type,
                    hub: hubs.find((h) => h.id === r.hub_id)?.name ?? "",
                    top_speed_kmh: r.topSpeed,
                    over_speed_points: r.speedingPoints,
                    idle_minutes: r.idleMinutes,
                    longest_idle_minutes: r.longestIdleMinutes,
                    moving_minutes: r.movingMinutes,
                  })),
                ),
              )
            }
          >
            <Download className="size-3.5" aria-hidden /> Export CSV
          </button>
        }
      />

      <div className="mb-4 kpi-grid grid gap-3">
        <KpiCard
          label="Machines reporting"
          value={rows.length}
          accent="gold"
          loading={tracksQ.isLoading}
        />
        <KpiCard
          label="Prolonged idling"
          value={overIdle}
          accent="amber"
          sub={`Over ${thresholds.idleMinutes} min in one stretch`}
        />
        <KpiCard
          label="Over-speed events"
          value={speeding}
          accent="red"
          sub={`Above ${thresholds.speedLimitKmh} km/h`}
        />
        <KpiCard label="Average idle time" value={`${avgIdle} min`} accent="blue" />
      </div>

      <Panel title="Monitoring thresholds" className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[10px] text-muted-foreground">
            Speed limit (km/h)
            <input
              type="number"
              min={5}
              max={120}
              className={`${inputCls} max-w-28`}
              value={thresholds.speedLimitKmh}
              onChange={(e) => update({ speedLimitKmh: Number(e.target.value) || 40 })}
            />
          </label>
          <label className="text-[10px] text-muted-foreground">
            Idling limit (minutes)
            <input
              type="number"
              min={5}
              max={240}
              className={`${inputCls} max-w-28`}
              value={thresholds.idleMinutes}
              onChange={(e) => update({ idleMinutes: Number(e.target.value) || 30 })}
            />
          </label>
          <label className="text-[10px] text-muted-foreground">
            Window
            <select
              className={`${inputCls} max-w-32`}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            >
              <option value={6}>Last 6 hours</option>
              <option value={24}>Last 24 hours</option>
              <option value={72}>Last 3 days</option>
            </select>
          </label>
          {!scope && (
            <label className="text-[10px] text-muted-foreground">
              Hub
              <select
                className={`${inputCls} max-w-44`}
                value={hubFilter ?? ""}
                onChange={(e) => setHubFilter(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All hubs</option>
                {hubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.county}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </Panel>

      <Panel title={`Machine behaviour (${rows.length})`}>
        {tracksQ.isLoading ? (
          <SkeletonTable rows={10} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Gauge className="size-4" />}
            title="No movement recorded"
            message="No tracking data was received in this window. Try a longer window."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {[
                    "Unit ID",
                    "Type",
                    "Hub",
                    "Top speed",
                    "Over-speed points",
                    "Total idle",
                    "Longest idle",
                    "Moving",
                  ].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-surface-2">
                    <td className="num px-2 py-2">{r.unit_id}</td>
                    <td className="px-2 py-2">{typeLabel(r.type)}</td>
                    <td className="px-2 py-2">{hubs.find((h) => h.id === r.hub_id)?.name ?? "—"}</td>
                    <td className={`num px-2 py-2 ${r.speeding ? "text-red" : ""}`}>
                      {r.topSpeed} km/h
                    </td>
                    <td className="num px-2 py-2">{r.speedingPoints}</td>
                    <td className="num px-2 py-2">{r.idleMinutes} min</td>
                    <td className={`num px-2 py-2 ${r.overIdle ? "text-amber" : ""}`}>
                      {r.longestIdleMinutes} min
                    </td>
                    <td className="num px-2 py-2 text-muted-foreground">{r.movingMinutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
