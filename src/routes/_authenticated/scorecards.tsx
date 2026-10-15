import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { LITRES_PER_GAL, alertsQuery, fuelLogsQuery, hubsQuery, machinesQuery, projectsQuery } from "@/lib/api";
import { Bar, PageHeader, Panel, SkeletonTable, btn } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { downloadFile, rollupHubs, toCsv, utilColor } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/scorecards")({
  head: () => ({
    meta: [
      { title: "Hub Scorecards · YM-FMS" },
      {
        name: "description",
        content:
          "Ranked performance scorecards for all 19 SPPCC hubs: utilization, availability, open alerts and project delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Hub Scorecards · YM-FMS" },
      { property: "og:description", content: "National hub performance ranking against the 80% target." },
    ],
  }),
  component: () => (
    <RoleGate allow={["ministry_analyst", "hq_admin"]}>
      <ScorecardsPage />
    </RoleGate>
  ),
});

function grade(score: number) {
  if (score >= 85) return { label: "A", tone: "bg-green-dim text-teal" };
  if (score >= 75) return { label: "B", tone: "bg-blue-dim text-blue" };
  if (score >= 65) return { label: "C", tone: "bg-amber-dim text-amber" };
  return { label: "D", tone: "bg-red-dim text-red" };
}

function ScorecardsPage() {
  const hubsQ = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(null));
  const { data: alerts = [] } = useQuery(alertsQuery(null));
  const { data: projects = [] } = useQuery(projectsQuery(null));
  const { data: fuel = [] } = useQuery(fuelLogsQuery(null));

  const rows = rollupHubs(hubsQ.data ?? [], machines, alerts)
    .map((h) => {
      const hubProjects = projects.filter((p) => p.hub_id === h.id);
      const avgProgress = hubProjects.length
        ? Math.round(hubProjects.reduce((a, p) => a + p.progress_pct, 0) / hubProjects.length)
        : 0;
      const gallons = fuel
        .filter((f) => f.hub_id === h.id)
        .reduce((a, f) => a + Number(f.volume_litres), 0) / LITRES_PER_GAL;
      const availability = h.total ? Math.round(((h.total - h.maintenance) / h.total) * 100) : 0;
      const alertPenalty = Math.min(20, h.alerts * 2);
      const score = Math.max(
        0,
        Math.round(h.utilization * 0.5 + availability * 0.3 + avgProgress * 0.2 - alertPenalty),
      );
      return { ...h, avgProgress, gallons, availability, score, projects: hubProjects.length };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <>
      <PageHeader
        title="Hub Scorecards"
        subtitle="All 19 hubs ranked on utilization, availability, project delivery and open alerts"
        actions={
          <button
            className={btn.secondary}
            onClick={() =>
              downloadFile(
                "ym-fms-hub-scorecards.csv",
                toCsv(
                  rows.map((r, i) => ({
                    rank: i + 1,
                    hub: r.name,
                    county: r.county,
                    score: r.score,
                    utilization_pct: r.utilization,
                    availability_pct: r.availability,
                    project_progress_pct: r.avgProgress,
                    open_alerts: r.alerts,
                    fuel_gal: Number(r.gallons.toFixed(1)),
                  })),
                ),
              )
            }
          >
            <Download className="size-3.5" aria-hidden /> Export CSV
          </button>
        }
      />
      <Panel title="National ranking">
        {hubsQ.isLoading ? (
          <SkeletonTable rows={10} cols={8} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {[
                    "#",
                    "Hub",
                    "County",
                    "Score",
                    "Grade",
                    "Utilization",
                    "Availability",
                    "Project progress",
                    "Open alerts",
                    "Fuel (gal)",
                  ].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const g = grade(r.score);
                  return (
                    <tr key={r.id} className="border-b border-border hover:bg-surface-2">
                      <td className="num px-2 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-2">
                        <Link
                          to="/hub/$id"
                          params={{ id: String(r.id) }}
                          className="text-blue hover:underline"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">{r.county}</td>
                      <td className="num px-2 py-2">{r.score}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${g.tone}`}>
                          {g.label}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Bar pct={r.utilization} />
                          <span className="num" style={{ color: utilColor(r.utilization) }}>
                            {r.utilization}%
                          </span>
                        </div>
                      </td>
                      <td className="num px-2 py-2">{r.availability}%</td>
                      <td className="num px-2 py-2">{r.avgProgress}%</td>
                      <td className={`num px-2 py-2 ${r.alerts > 0 ? "text-amber" : ""}`}>
                        {r.alerts}
                      </td>
                      <td className="num px-2 py-2 text-muted-foreground">{r.gallons.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          Score = 50% utilization + 30% machine availability + 20% project progress, less 2 points per
          open alert (capped at 20).
        </p>
      </Panel>
    </>
  );
}
