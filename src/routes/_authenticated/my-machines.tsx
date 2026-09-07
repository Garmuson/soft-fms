import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Truck } from "lucide-react";
import { alertsQuery, fuelLogsQuery, machinesQuery } from "@/lib/api";
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
import { MACHINE_STATUSES, fmtDateTime, timeAgo, typeLabel } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/my-machines")({
  head: () => ({
    meta: [
      { title: "My Machines · YM-FMS" },
      {
        name: "description",
        content: "Machine register for your hub with inline status updates, fuel history and alerts.",
      },
      { property: "og:title", content: "My Machines · YM-FMS" },
      { property: "og:description", content: "Manage the 19 machines assigned to your hub." },
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
  const machinesQ = useQuery(machinesQuery(hubId));
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

  const machines = machinesQ.data ?? [];

  return (
    <>
      <PageHeader title="My Machines" subtitle={`${machines.length} machines in your hub`} />
      <Panel className="overflow-hidden">
        {machinesQ.isLoading ? (
          <SkeletonTable rows={10} cols={7} />
        ) : machines.length === 0 ? (
          <EmptyState
            icon={<Truck className="size-4" />}
            title="No machines in your hub"
            message="Ask HQ to assign machines to this hub."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["", "Unit ID", "Type", "Status", "Fuel", "Hours Today", "Last Seen"].map((h) => (
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
                          <td colSpan={7} className="px-4 py-3">
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
                                        {fmtDateTime(f.logged_at)} · {f.volume_litres} L
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
          </div>
        )}
      </Panel>
    </>
  );
}
