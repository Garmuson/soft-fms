import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Truck } from "lucide-react";
import { hubsQuery, machinesQuery, projectsQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  FuelBar,
  PageHeader,
  Pager,
  Panel,
  SkeletonTable,
  StatusBadge,
  btn,
  inputCls,
} from "@/components/kit";
import { MachineDetailModal } from "@/components/MachineDetailModal";
import { RoleGate } from "@/components/RoleGate";
import {
  MACHINE_STATUSES,
  MACHINE_TYPES,
  downloadFile,
  timeAgo,
  toCsv,
  typeLabel,
} from "@/lib/fleet";
import { useAuth } from "@/hooks/use-auth";

type Search = { q?: string; hub?: number; type?: string; status?: string; page?: number; size?: number };

export const Route = createFileRoute("/_authenticated/fleet")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    hub: s.hub ? Number(s.hub) : undefined,
    type: typeof s.type === "string" ? s.type : undefined,
    status: typeof s.status === "string" ? s.status : undefined,
    page: s.page ? Number(s.page) : undefined,
    size: s.size ? Number(s.size) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Fleet Register · YM-FMS" },
      {
        name: "description",
        content: "Searchable register of all 285 Yellow Machines with hub, status, fuel and hours.",
      },
      { property: "og:title", content: "Fleet Register · YM-FMS" },
      { property: "og:description", content: "Filter, sort and export the national machine register." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "ministry_analyst"]}>
      <FleetPage />
    </RoleGate>
  ),
});

function FleetPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();
  const { readOnly } = useAuth();
  const [unit, setUnit] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<"unit_id" | "status" | "fuel_level" | "engine_hours_today">(
    "unit_id",
  );
  const [asc, setAsc] = useState(true);

  const machinesQ = useQuery(machinesQuery(null));
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: projects = [] } = useQuery(projectsQuery(null));

  const page = search.page ?? 1;
  const size = search.size ?? 25;
  const set = (patch: Partial<Search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const rows = useMemo(() => {
    const list = (machinesQ.data ?? []).filter((m) => {
      if (search.hub && m.hub_id !== search.hub) return false;
      if (search.type && m.type !== search.type) return false;
      if (search.status && m.status !== search.status) return false;
      if (search.q && !m.unit_id.toLowerCase().includes(search.q.toLowerCase())) return false;
      return true;
    });
    list.sort((a, b) => {
      const x = a[sortKey];
      const y = b[sortKey];
      const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return asc ? cmp : -cmp;
    });
    return list;
  }, [machinesQ.data, search.hub, search.type, search.status, search.q, sortKey, asc]);

  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const view = rows.slice((page - 1) * size, page * size);

  function exportCsv() {
    downloadFile(
      "ym-fms-fleet-register.csv",
      toCsv(
        rows.map((m) => ({
          unit_id: m.unit_id,
          type: typeLabel(m.type),
          hub: hubs.find((h) => h.id === m.hub_id)?.name ?? "",
          county: hubs.find((h) => h.id === m.hub_id)?.county ?? "",
          status: m.status,
          fuel_level: m.fuel_level,
          engine_hours_today: m.engine_hours_today,
          last_seen: m.last_seen,
        })),
      ),
    );
    toast.success(`Exported ${rows.length} machines`);
  }

  async function bulkStatus(status: string) {
    if (!selected.length) return;
    const { error } = await supabase
      .from("machines")
      .update({ status: status as "active" })
      .in("id", selected);
    if (error) toast.error("Bulk update failed", { description: error.message });
    else {
      toast.success(`${selected.length} machines set to ${status}`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["machines"] });
    }
  }

  async function bulkHub(hubId: number) {
    const { error } = await supabase.from("machines").update({ hub_id: hubId }).in("id", selected);
    if (error) toast.error("Reassignment failed", { description: error.message });
    else {
      toast.success(`${selected.length} machines reassigned`);
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["machines"] });
    }
  }

  const th = (label: string, key?: typeof sortKey) => (
    <th key={label} className="px-2 py-2 font-medium">
      {key ? (
        <button
          onClick={() => {
            setSortKey(key);
            setAsc(sortKey === key ? !asc : true);
          }}
          className="hover:text-foreground"
        >
          {label}
          {sortKey === key ? (asc ? " ↑" : " ↓") : ""}
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <>
      <PageHeader
        title="Fleet Register"
        subtitle={`${rows.length} of ${machinesQ.data?.length ?? 0} machines shown`}
        actions={
          <>
            <button className={btn.secondary} onClick={exportCsv}>
              Export CSV
            </button>
            <button className={btn.secondary} onClick={() => window.print()}>
              Export PDF
            </button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className={`${inputCls} max-w-48`}
          placeholder="Search unit ID…"
          value={search.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined, page: 1 })}
          aria-label="Search unit ID"
        />
        <select
          className={`${inputCls} max-w-44`}
          value={search.hub ?? ""}
          onChange={(e) => set({ hub: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
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
          className={`${inputCls} max-w-40`}
          value={search.type ?? ""}
          onChange={(e) => set({ type: e.target.value || undefined, page: 1 })}
          aria-label="Filter by machine type"
        >
          <option value="">All types</option>
          {MACHINE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} max-w-36`}
          value={search.status ?? ""}
          onChange={(e) => set({ status: e.target.value || undefined, page: 1 })}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {MACHINE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className={`${inputCls} max-w-28`}
          value={size}
          onChange={(e) => set({ size: Number(e.target.value), page: 1 })}
          aria-label="Rows per page"
        >
          {[25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n} rows
            </option>
          ))}
        </select>
      </div>

      {selected.length > 0 && !readOnly && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-2 p-2">
          <span className="num text-[11px] text-muted-foreground">{selected.length} selected</span>
          <select
            className={`${inputCls} max-w-36`}
            defaultValue=""
            onChange={(e) => e.target.value && bulkStatus(e.target.value)}
            aria-label="Bulk change status"
          >
            <option value="">Change status…</option>
            {MACHINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className={`${inputCls} max-w-40`}
            defaultValue=""
            onChange={(e) => e.target.value && bulkHub(Number(e.target.value))}
            aria-label="Bulk reassign hub"
          >
            <option value="">Reassign hub…</option>
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <button className={btn.secondary} onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      )}

      <Panel className="overflow-hidden">
        {machinesQ.isLoading ? (
          <SkeletonTable rows={12} cols={9} />
        ) : view.length === 0 ? (
          <EmptyState
            icon={<Truck className="size-4" />}
            title="No machines match your filters"
            message="Clear the search box or choose a different hub, type or status."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface text-left text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-2 py-2">
                    <input
                      type="checkbox"
                      aria-label="Select page"
                      checked={view.every((m) => selected.includes(m.id)) && view.length > 0}
                      onChange={(e) =>
                        setSelected(e.target.checked ? view.map((m) => m.id) : [])
                      }
                    />
                  </th>
                  {th("Unit ID", "unit_id")}
                  {th("Type")}
                  {th("Hub")}
                  {th("County")}
                  {th("Status", "status")}
                  {th("Project")}
                  {th("Fuel %", "fuel_level")}
                  {th("Hours", "engine_hours_today")}
                  {th("Last Seen")}
                </tr>
              </thead>
              <tbody>
                {view.map((m) => {
                  const hub = hubs.find((h) => h.id === m.hub_id);
                  return (
                    <tr key={m.id} className="border-b border-border hover:bg-surface-2">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${m.unit_id}`}
                          checked={selected.includes(m.id)}
                          onChange={(e) =>
                            setSelected((s) =>
                              e.target.checked ? [...s, m.id] : s.filter((x) => x !== m.id),
                            )
                          }
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          className="num text-blue hover:underline"
                          onClick={() => setUnit(m.unit_id)}
                        >
                          {m.unit_id}
                        </button>
                      </td>
                      <td className="px-2 py-2">{typeLabel(m.type)}</td>
                      <td className="px-2 py-2">{hub?.name}</td>
                      <td className="px-2 py-2 text-muted-foreground">{hub?.county}</td>
                      <td className="px-2 py-2">
                        <StatusBadge status={m.status} />
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {projects.find((p) => p.id === m.current_project_id)?.name ?? "—"}
                      </td>
                      <td className="px-2 py-2">
                        <FuelBar pct={m.fuel_level} />
                      </td>
                      <td className="num px-2 py-2">{m.engine_hours_today}</td>
                      <td className="num px-2 py-2 text-muted-foreground">{timeAgo(m.last_seen)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={page} pageCount={pageCount} total={rows.length} onPage={(p) => set({ page: p })} />
      </Panel>

      <MachineDetailModal unitId={unit} onClose={() => setUnit(null)} />
    </>
  );
}
