import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellOff } from "lucide-react";
import { alertsQuery, hubsQuery, machinesQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  LevelBadge,
  PageHeader,
  Panel,
  SkeletonTable,
  btn,
  inputCls,
} from "@/components/kit";
import { MachineDetailModal } from "@/components/MachineDetailModal";
import { fmtDateTime, timeAgo } from "@/lib/fleet";
import { useAuth } from "@/hooks/use-auth";

const TABS = ["all", "critical", "warning", "info", "acknowledged"] as const;
export type AlertTab = (typeof TABS)[number];

const ALERT_TYPES = [
  "geofence_breach",
  "idle_timeout",
  "tamper",
  "fuel_critical",
  "engine_overtemp",
  "maintenance_overdue",
  "unauthorised_movement",
  "device_offline",
  "fuel_anomaly",
];

export function AlertsView({
  hubId,
  tab,
  hubFilter,
  onTab,
  onHubFilter,
  title = "Alerts",
}: {
  hubId: number | null;
  tab: AlertTab;
  hubFilter?: number | null;
  onTab: (t: AlertTab) => void;
  onHubFilter?: (h: number | null) => void;
  title?: string;
}) {
  const qc = useQueryClient();
  const { readOnly } = useAuth();
  const [type, setType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [unit, setUnit] = useState<string | null>(null);

  const alertsQ = useQuery(alertsQuery(hubId));
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(hubId));

  const unitById = useMemo(
    () => new Map(machines.map((m) => [m.id, m.unit_id])),
    [machines],
  );

  const alerts = alertsQ.data ?? [];
  const filtered = alerts.filter((a) => {
    if (tab === "acknowledged" && !a.is_acknowledged) return false;
    if (tab !== "all" && tab !== "acknowledged" && a.level !== tab) return false;
    if (tab !== "acknowledged" && tab !== "all" && a.is_acknowledged) return false;
    if (type !== "all" && a.type !== type) return false;
    if (hubFilter && a.hub_id !== hubFilter) return false;
    if (search) {
      const u = unitById.get(a.machine_id ?? "") ?? "";
      if (!u.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const counts = {
    all: alerts.filter((a) => !a.is_acknowledged).length,
    critical: alerts.filter((a) => a.level === "critical" && !a.is_acknowledged).length,
    warning: alerts.filter((a) => a.level === "warning" && !a.is_acknowledged).length,
    info: alerts.filter((a) => a.level === "info" && !a.is_acknowledged).length,
    acknowledged: alerts.filter((a) => a.is_acknowledged).length,
  };

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
      const a = alerts.find((x) => x.id === id);
      void logAudit(profile, {
        action: "acknowledged alert",
        entity: "alert",
        entity_ref: a?.type ?? id,
        hub_id: a?.hub_id ?? null,
        detail: a?.message ?? null,
      });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    }
  }


  return (
    <>
      <PageHeader
        title={title}
        subtitle="Acknowledge critical and warning alerts to clear them from the live feed"
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {(["critical", "warning", "info"] as const).map((l) => (
          <span
            key={l}
            className={`rounded-full px-2.5 py-1 text-[11px] capitalize ${
              l === "critical"
                ? "bg-red-dim text-red"
                : l === "warning"
                  ? "bg-amber-dim text-amber"
                  : "bg-green-dim text-teal"
            }`}
          >
            <span className="num">{counts[l]}</span> {l}
          </span>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => onTab(t)}
            className={`rounded-md px-2.5 py-1 text-xs capitalize ${
              tab === t ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : t} <span className="num">({counts[t]})</span>
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {onHubFilter && (
          <select
            aria-label="Filter by hub"
            className={`${inputCls} max-w-44`}
            value={hubFilter ?? ""}
            onChange={(e) => onHubFilter(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">All hubs</option>
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} — {h.county}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Filter by alert type"
          className={`${inputCls} max-w-44`}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="all">All alert types</option>
          {ALERT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <input
          className={`${inputCls} max-w-44`}
          placeholder="Search unit ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search by machine unit ID"
        />
      </div>

      {alertsQ.isLoading ? (
        <Panel>
          <SkeletonTable rows={6} cols={3} />
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<BellOff className="size-4" />}
            title="No alerts in this view"
            message="Nothing matches these filters. Try a different tab, hub or alert type."
          />
        </Panel>
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => {
            const hub = hubs.find((h) => h.id === a.hub_id);
            const u = unitById.get(a.machine_id ?? "");
            return (
              <li
                key={a.id}
                className="panel flex flex-wrap items-center gap-3 border-l-[3px] p-3"
                style={{
                  borderLeftColor:
                    a.level === "critical" ? "#da3633" : a.level === "warning" ? "#f0883e" : "#3fb950",
                }}
              >
                <LevelBadge level={a.level} />
                <span className="text-[11px] capitalize text-muted-foreground">
                  {a.type.replace(/_/g, " ")}
                </span>
                {u && (
                  <button
                    className="num text-xs text-blue hover:underline"
                    onClick={() => setUnit(u)}
                  >
                    {u}
                  </button>
                )}
                <span className="min-w-0 flex-1 text-xs">{a.message}</span>
                <span className="text-[10px] text-muted-foreground">
                  {hub?.name} · {hub?.county}
                </span>
                <span className="num text-[10px] text-muted-foreground">
                  {timeAgo(a.created_at)}
                </span>
                {a.is_acknowledged ? (
                  <span className="num text-[10px] text-muted-foreground">
                    Acknowledged · {fmtDateTime(a.acknowledged_at)}
                  </span>
                ) : (
                  !readOnly &&
                  a.level !== "info" && (
                    <button className={btn.secondary} onClick={() => acknowledge(a.id)}>
                      Acknowledge
                    </button>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}

      <MachineDetailModal unitId={unit} onClose={() => setUnit(null)} />
    </>
  );
}
