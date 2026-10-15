import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Truck } from "lucide-react";
import { LITRES_PER_GAL, alertsQuery, fuelLogsQuery, profilesQuery, type Machine } from "@/lib/api";
import { Paging, pageRange } from "@/components/Paging";
import { cleanSearch } from "@/lib/sanitize";
import { useDebounced } from "@/hooks/use-debounced";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  FuelBar,
  LevelBadge,
  PageHeader,
  Panel,
  SkeletonTable,
  StatusBadge,
  inputCls,
} from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { MACHINE_STATUSES, MACHINE_TYPES, fmtDateTime, statusLabel, timeAgo, typeLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/my-machines")({
  head: () => ({
    meta: [
      { title: "My Machines · YM-FMS" },
      {
        name: "description",
        content: "Machine register for your hub with inline status updates, fuel history and alerts.",
      },
      { property: "og:title", content: "My Machines · YM-FMS" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Manage the 15 machines assigned to your hub." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hub_supervisor"]}>
      <MyMachinesPage />
    </RoleGate>
  ),
});

function MyMachinesPage() {
  const { hubId } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [fStatus, setFStatus] = useState("");
  const [fType, setFType] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const term = cleanSearch(useDebounced(search, 300));
  useEffect(() => setPage(0), [fStatus, fType, term]);
  const { data: profiles = [] } = useQuery(profilesQuery());
  const machinesQ = useQuery({
    queryKey: ["machines", "hub-page", hubId, fStatus, fType, term, page, size],
    enabled: !!hubId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const [from, to] = pageRange(page, size);
      let q = supabase
        .from("machines")
        .select("*", { count: "exact" })
        .eq("hub_id", hubId!)
        .order("unit_id")
        .range(from, to);
      if (fStatus) q = q.eq("status", fStatus as "active");
      if (fType) q = q.eq("type", fType as "excavator");
      if (term) {
        const { data: ops } = await supabase.from("profiles").select("id").ilike("full_name", `%${term}%`);
        const ids = (ops ?? []).map((o) => o.id);
        q = ids.length
          ? q.or(`unit_id.ilike.%${term}%,operator_id.in.(${ids.join(",")})`)
          : q.ilike("unit_id", `%${term}%`);
      }
      const { data, count, error } = await q;
      if (error) throw new Error(error.message);
      return { rows: (data ?? []) as Machine[], total: count ?? 0 };
    },
  });
  const opName = (id: string | null) => profiles.find((p) => p.id === id)?.full_name ?? "Unassigned";
  const { data: fuel = [] } = useQuery(fuelLogsQuery(hubId));
  const { data: alerts = [] } = useQuery(alertsQuery(hubId));

  async function setStatus(id: string, status: string) {
    const { error } = await supabase
      .from("machines")
      .update({ status: status as "active" })
      .eq("id", id);
    if (error) toast.error("Status update failed", { description: error.message });
    else {
      toast.success(`Status set to ${status}`);
      qc.invalidateQueries({ queryKey: ["machines"] });
    }
  }

  const machines = machinesQ.data?.rows ?? [];
  const total = machinesQ.data?.total ?? 0;

  return (
    <>
      <PageHeader title="My Machines" subtitle={`${total} machines match`} />
      <Panel className="mb-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="text-[11px] text-muted-foreground">
            Status
            <select className={inputCls} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">All</option>
              {MACHINE_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-muted-foreground">
            Machine type
            <select className={inputCls} value={fType} onChange={(e) => setFType(e.target.value)}>
              <option value="">All</option>
              {MACHINE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] text-muted-foreground">
            Search
            <input className={inputCls} placeholder="Unit ID or operator name" value={search} maxLength={60} onChange={(e) => setSearch(e.target.value)} />
          </label>
        </div>
      </Panel>
      <Panel className="overflow-hidden">
        {machinesQ.isLoading ? (
          <SkeletonTable rows={10} cols={7} />
        ) : machines.length === 0 ? (
          <EmptyState
            icon={<Truck className="size-4" />}
            title="No machines match"
            message="Try clearing a filter or search term."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["", "Unit ID", "Type", "Operator", "Status", "Fuel", "Hours Today", "Last Seen"].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => {
                  const isOpen = open === m.id;
                  const mFuel = fuel.filter((f) => f.machine_id === m.id).slice(0, 5);
                  const mAlerts = alerts.filter((a) => a.machine_id === m.id).slice(0, 3);
                  const spark = fuel
                    .filter((f) => f.machine_id === m.id)
                    .slice(0, 7)
                    .reverse();
                  return (
                    <Fragment key={m.id}>
                      <tr className="border-b border-border hover:bg-surface-2">
                        <td className="px-2 py-2">
                          <button
                            onClick={() => setOpen(isOpen ? null : m.id)}
                            aria-label={`Toggle details for ${m.unit_id}`}
                          >
                            {isOpen ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </button>
                        </td>
                        <td className="num px-2 py-2">{m.unit_id}</td>
                        <td className="px-2 py-2">{typeLabel(m.type)}</td>
                        <td className="px-2 py-2">{opName(m.operator_id)}</td>
                        <td className="px-2 py-2">
                          <select
                            className={`${inputCls} max-w-32`}
                            value={m.status}
                            onChange={(e) => setStatus(m.id, e.target.value)}
                            aria-label={`Status for ${m.unit_id}`}
                          >
                            {MACHINE_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <FuelBar pct={m.fuel_level} />
                        </td>
                        <td className="num px-2 py-2">{m.engine_hours_today} h</td>
                        <td className="num px-2 py-2 text-muted-foreground">{timeAgo(m.last_seen)}</td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-border bg-background/60">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid gap-4 md:grid-cols-3">
                              <div>
                                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Recent fuel
                                </p>
                                {mFuel.length === 0 ? (
                                  <p className="text-[11px] text-muted-foreground">No fuel entries.</p>
                                ) : (
                                  <ul className="num space-y-0.5 text-[11px]">
                                    {mFuel.map((f) => (
                                      <li key={f.id} className={f.is_flagged ? "text-amber" : ""}>
                                        {fmtDateTime(f.logged_at)} · {(Number(f.volume_litres) / LITRES_PER_GAL).toFixed(1)} gal
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div>
                                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Recent alerts
                                </p>
                                {mAlerts.length === 0 ? (
                                  <p className="text-[11px] text-muted-foreground">No alerts.</p>
                                ) : (
                                  <ul className="space-y-1 text-[11px]">
                                    {mAlerts.map((a) => (
                                      <li key={a.id} className="flex items-center gap-1.5">
                                        <LevelBadge level={a.level} />
                                        <span className="truncate">{a.message}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                              <div>
                                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                  Fuel trend (7 entries)
                                </p>
                                <svg viewBox="0 0 100 30" className="h-10 w-full" aria-label="Fuel trend">
                                  <polyline
                                    fill="none"
                                    stroke="#d4a017"
                                    strokeWidth="1.5"
                                    points={
                                      spark.length
                                        ? spark
                                            .map(
                                              (f, i) =>
                                                `${(i / Math.max(1, spark.length - 1)) * 100},${30 - ((f.fuel_level_after ?? 0) / 100) * 28}`,
                                            )
                                            .join(" ")
                                        : "0,29 100,29"
                                    }
                                  />
                                </svg>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            <Paging page={page} size={size} total={total} onPage={setPage} onSize={setSize} />
          </div>
        )}
      </Panel>
    </>
  );
}
