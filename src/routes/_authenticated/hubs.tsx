import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { alertsQuery, hubsQuery, machinesQuery } from "@/lib/api";
import { Bar, EmptyState, PageHeader, Panel, SkeletonCards, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { rollupHubs, utilColor } from "@/lib/fleet";

type Search = { q?: string | undefined; util?: string | undefined; alerts?: string | undefined };

export const Route = createFileRoute("/_authenticated/hubs")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    util: typeof s["util"] === "string" ? s["util"] : undefined,
    alerts: typeof s["alerts"] === "string" ? s["alerts"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "All 19 Hubs · YM-FMS" },
      {
        name: "description",
        content: "Utilization, machine status and alerts for all 19 SPPCC yellow machine hubs.",
      },
      { property: "og:title", content: "All 19 Hubs · YM-FMS" },
      { property: "og:description", content: "Hub-by-hub fleet performance across Liberia." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "ministry_analyst"]}>
      <HubsPage />
    </RoleGate>
  ),
});

function HubsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const hubsQ = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(null));
  const { data: alerts = [] } = useQuery(alertsQuery(null));

  const rollups = rollupHubs(hubsQ.data ?? [], machines, alerts).filter((h) => {
    if (search.q && !`${h.county} ${h.name}`.toLowerCase().includes(search.q.toLowerCase()))
      return false;
    if (search.util === "high" && h.utilization < 80) return false;
    if (search.util === "mid" && (h.utilization < 70 || h.utilization >= 80)) return false;
    if (search.util === "low" && h.utilization >= 70) return false;
    if (search.alerts === "yes" && h.alerts === 0) return false;
    if (search.alerts === "no" && h.alerts > 0) return false;
    return true;
  });

  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  return (
    <>
      <PageHeader title="All 19 Hubs" subtitle="Click any hub to view its live dashboard" />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className={`${inputCls} max-w-52`}
          placeholder="Search county or hub…"
          value={search.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined })}
          aria-label="Search by county"
        />
        <select
          className={`${inputCls} max-w-44`}
          value={search.util ?? ""}
          onChange={(e) => set({ util: e.target.value || undefined })}
          aria-label="Filter by utilization"
        >
          <option value="">All utilization</option>
          <option value="high">Above 80%</option>
          <option value="mid">70–80%</option>
          <option value="low">Below 70%</option>
        </select>
        <select
          className={`${inputCls} max-w-40`}
          value={search.alerts ?? ""}
          onChange={(e) => set({ alerts: e.target.value || undefined })}
          aria-label="Filter by alert status"
        >
          <option value="">All hubs</option>
          <option value="yes">Has alerts</option>
          <option value="no">Clear</option>
        </select>
      </div>

      {hubsQ.isLoading ? (
        <SkeletonCards count={12} height={120} />
      ) : rollups.length === 0 ? (
        <Panel>
          <EmptyState
            title="No hubs match these filters"
            message="Try clearing the county search or widening the utilization range."
          />
        </Panel>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
          {rollups.map((h) => (
            <Link
              key={h.id}
              to="/hub/$id"
              params={{ id: String(h.id) }}
              className={`panel block p-3 transition-transform hover:-translate-y-0.5 hover:border-border-hover ${h.alerts > 0 ? "border-red/60" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{h.name}</p>
                  <p className="text-[11px] text-muted-foreground">{h.county}</p>
                </div>
                {h.alerts > 0 && (
                  <span className="num rounded-full bg-red-dim px-1.5 py-0.5 text-[10px] text-red">
                    {h.alerts}
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 text-center">
                {[
                  ["Active", h.active, "text-teal"],
                  ["Maint", h.maintenance, "text-blue"],
                  ["Idle", h.idle, "text-amber"],
                ].map(([l, v, c]) => (
                  <div key={String(l)}>
                    <p className={`num text-sm ${c}`}>{Number(v)}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className="num" style={{ color: utilColor(h.utilization) }}>
                    {h.utilization}%
                  </span>
                </div>
                <Bar pct={h.utilization} className="mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
