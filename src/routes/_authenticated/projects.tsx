import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, X } from "lucide-react";
import { hubsQuery, machinesQuery, projectsQuery } from "@/lib/api";
import {
  Bar,
  EmptyState,
  PageHeader,
  Panel,
  SkeletonCards,
  inputCls,
} from "@/components/kit";
import { MapPanel } from "@/components/MapPanel";
import { RoleGate } from "@/components/RoleGate";
import { fmtDate, projectAlignment, typeLabel } from "@/lib/fleet";

type Search = {
  hub?: number | undefined;
  status?: string | undefined;
  q?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/projects")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    hub: s["hub"] ? Number(s["hub"]) : undefined,
    status: typeof s["status"] === "string" ? s["status"] : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Road Projects · YM-FMS" },
      {
        name: "description",
        content: "Progress, machine allocation and deadlines for SPPCC road projects in Liberia.",
      },
      { property: "og:title", content: "Road Projects · YM-FMS" },
      { property: "og:description", content: "Track project progress and machine alignment." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "ministry_analyst"]}>
      <ProjectsPage />
    </RoleGate>
  ),
});

const STATUS_TONE: Record<string, string> = {
  active: "bg-green-dim text-teal",
  delayed: "bg-amber-dim text-amber",
  critical: "bg-red-dim text-red",
  complete: "bg-blue-dim text-blue",
};

function ProjectsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const projectsQ = useQuery(projectsQuery(null));
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(null));
  const [open, setOpen] = useState<string | null>(null);

  const set = (patch: Partial<Search>) =>
    navigate({ search: (p) => ({ ...p, ...patch }), replace: true });

  const projects = (projectsQ.data ?? []).filter((p) => {
    if (search.hub && p.hub_id !== search.hub) return false;
    if (search.status && p.status !== search.status) return false;
    if (search.q && !p.name.toLowerCase().includes(search.q.toLowerCase())) return false;
    return true;
  });

  const detail = projects.find((p) => p.id === open) ?? null;
  const detailMachines = detail ? machines.filter((m) => m.current_project_id === detail.id) : [];
  const detailHub = hubs.find((h) => h.id === detail?.hub_id);

  return (
    <>
      <PageHeader title="Projects" subtitle="Road works across all 19 hubs" />

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className={`${inputCls} max-w-52`}
          placeholder="Search project name…"
          value={search.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined })}
          aria-label="Search projects"
        />
        <select
          className={`${inputCls} max-w-44`}
          value={search.hub ?? ""}
          onChange={(e) => set({ hub: e.target.value ? Number(e.target.value) : undefined })}
          aria-label="Filter by hub"
        >
          <option value="">All hubs</option>
          {hubs.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} — {h.county}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} max-w-36`}
          value={search.status ?? ""}
          onChange={(e) => set({ status: e.target.value || undefined })}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {["active", "delayed", "critical", "complete"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {projectsQ.isLoading ? (
        <SkeletonCards count={6} height={190} />
      ) : projects.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<ClipboardList className="size-4" />}
            title="No projects match"
            message="No road projects match these filters. Clear the search or pick another hub."
          />
        </Panel>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {projects.map((p) => {
            const hub = hubs.find((h) => h.id === p.hub_id);
            const al = projectAlignment(p.progress_pct, p.machines_assigned);
            const days = p.deadline
              ? Math.round((new Date(p.deadline).getTime() - Date.now()) / 86400000)
              : null;
            return (
              <button
                key={p.id}
                onClick={() => setOpen(p.id)}
                className="panel overflow-hidden p-0 text-left transition-colors hover:border-border-hover"
              >
                <div className="p-3">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground">
                      {hub?.name} · {hub?.county}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] capitalize ${STATUS_TONE[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Bar pct={p.progress_pct} />
                    <span className="num text-[11px]">{p.progress_pct}%</span>
                  </div>
                  <dl className="num mt-3 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                    <div>{p.machines_assigned} machines</div>
                    <div>{p.km_coverage} km</div>
                    <div>Due {fmtDate(p.deadline)}</div>
                    <div className={days !== null && days < 0 ? "text-red" : ""}>
                      {days === null ? "—" : days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </div>
                  </dl>
                </div>
                <p
                  className={`px-3 py-2 text-[11px] ${
                    al.tone === "red"
                      ? "bg-red-dim text-red"
                      : al.tone === "amber"
                        ? "bg-amber-dim text-amber"
                        : "bg-green-dim text-teal"
                  }`}
                >
                  {al.state} — {al.note}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <div
            className="mx-auto max-w-4xl rounded-lg border border-border bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-base font-semibold">{detail.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {detailHub?.name} — {detailHub?.county} · {detail.km_coverage} km · due{" "}
                  {fmtDate(detail.deadline)}
                </p>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close project details">
                <X className="size-5 text-muted-foreground" />
              </button>
            </header>
            <div className="space-y-4 p-4">
              <p className="text-xs text-muted-foreground">{detail.description}</p>
              <div className="flex items-center gap-2">
                <Bar pct={detail.progress_pct} />
                <span className="num text-xs">{detail.progress_pct}%</span>
              </div>
              <MapPanel
                machines={detailMachines.map((m) => ({ ...m, hub_name: detailHub?.name ?? null }))}
                center={[Number(detailHub?.lat_center ?? 6.3), Number(detailHub?.lng_center ?? -9.4)]}
                zoom={10}
                height={280}
              />
              {detailMachines.length === 0 ? (
                <EmptyState
                  title="No machines assigned"
                  message="Assign machines to this project from the hub machine register."
                />
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-left text-muted-foreground">
                    <tr className="border-b border-border">
                      {["Unit ID", "Type", "Status", "Hours Today"].map((h) => (
                        <th key={h} className="px-2 py-2 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detailMachines.map((m) => (
                      <tr key={m.id} className="border-b border-border">
                        <td className="num px-2 py-2">{m.unit_id}</td>
                        <td className="px-2 py-2">{typeLabel(m.type)}</td>
                        <td className="px-2 py-2 capitalize">{m.status}</td>
                        <td className="num px-2 py-2">{m.engine_hours_today} h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
