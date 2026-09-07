import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart3, FileText } from "lucide-react";
import { alertsQuery, hubsQuery, machinesQuery, reportsQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  Bar,
  EmptyState,
  PageHeader,
  Panel,
  SkeletonTable,
  btn,
  inputCls,
} from "@/components/kit";
import { downloadFile, fmtDate, fmtDateTime, rollupHubs, toCsv, utilColor } from "@/lib/fleet";
import { useAuth } from "@/hooks/use-auth";

const ALL_TYPES = [
  { value: "daily_situation", label: "Daily Situation Report", desc: "Machine status, alerts and fuel for a single day" },
  { value: "weekly_operations", label: "Weekly Operations Summary", desc: "Utilization, work orders and inspections by week" },
  { value: "monthly_fleet", label: "Monthly Fleet Report", desc: "Full fleet performance and availability" },
  { value: "hub_scorecard", label: "Hub Scorecard", desc: "Ranked hub performance against the 80% target" },
  { value: "fuel_analysis", label: "Fuel Analysis", desc: "Consumption, cost and anomaly breakdown" },
  { value: "maintenance_compliance", label: "Maintenance Compliance", desc: "Preventive schedule adherence and overdue work" },
  { value: "gps_uptime", label: "GPS Uptime", desc: "Telemetry availability per machine and hub" },
];

export function ReportsView({ hubId, types }: { hubId: number | null; types?: string[] }) {
  const { profile, readOnly } = useAuth();
  const qc = useQueryClient();
  const available = types ? ALL_TYPES.filter((t) => types.includes(t.value)) : ALL_TYPES;
  const [type, setType] = useState(available[0]!.value);
  const [hub, setHub] = useState<number | null>(hubId);
  const [from, setFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const reportsQ = useQuery(reportsQuery(hubId));
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(hubId));
  const { data: alerts = [] } = useQuery(alertsQuery(hubId));

  const rollups = rollupHubs(hubs, machines, alerts)
    .filter((h) => !hubId || h.id === hubId)
    .sort((a, b) => b.utilization - a.utilization);

  const history = (reportsQ.data ?? []).filter((r) => r.type === type);

  async function generate() {
    const scoped = rollups.filter((r) => !hub || r.id === hub);
    const payload = {
      type,
      hub_id: hub,
      generated_by: profile?.id ?? null,
      period_start: from,
      period_end: to,
      data_json: {
        machines: machines.length,
        active: machines.filter((m) => m.status === "active").length,
        open_alerts: alerts.filter((a) => !a.is_acknowledged).length,
        hubs: scoped.map((h) => ({ hub: h.name, county: h.county, utilization: h.utilization })),
      },
    };
    const { error } = await supabase.from("reports").insert(payload);
    if (error) {
      toast.error("Could not generate report", { description: error.message });
      return;
    }
    toast.success("Report generated");
    qc.invalidateQueries({ queryKey: ["reports"] });
  }

  function download(id: string) {
    const r = history.find((x) => x.id === id);
    if (!r) return;
    downloadFile(
      `ym-fms-${r.type}-${r.period_start ?? "period"}.csv`,
      toCsv(rollups.map((h) => ({ hub: h.name, county: h.county, active: h.active, maintenance: h.maintenance, idle: h.idle, utilization: h.utilization, open_alerts: h.alerts }))),
    );
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate, review and download operational reports" />

      <div className="grid gap-4 lg:grid-cols-[3fr_7fr]">
        <Panel title="Report Types">
          <ul className="space-y-1.5">
            {available.map((t) => (
              <li key={t.value}>
                <button
                  onClick={() => setType(t.value)}
                  className={`w-full rounded-md border p-2.5 text-left transition-colors ${
                    type === t.value
                      ? "border-green bg-green-dim/40"
                      : "border-border hover:border-border-hover"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium">
                    <FileText className="size-3.5 text-gold" aria-hidden />
                    {t.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">{t.desc}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={available.find((t) => t.value === type)?.label ?? "Report"}>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[10px] text-muted-foreground">
              From
              <input
                type="date"
                className={inputCls}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="text-[10px] text-muted-foreground">
              To
              <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
            {!hubId && (
              <label className="text-[10px] text-muted-foreground">
                Hub
                <select
                  className={inputCls}
                  value={hub ?? ""}
                  onChange={(e) => setHub(e.target.value ? Number(e.target.value) : null)}
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
            {!readOnly && (
              <button className={btn.primary} onClick={generate}>
                Generate
              </button>
            )}
          </div>

          <div className="mt-4">
            {reportsQ.isLoading ? (
              <SkeletonTable rows={5} cols={5} />
            ) : history.length === 0 ? (
              <EmptyState
                title="No reports yet"
                message="Choose a period above and generate this report to build a history."
              />
            ) : (
              <table className="w-full text-xs">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b border-border">
                    {["Period", "Hub", "Generated", "Download"].map((h) => (
                      <th key={h} className="px-2 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-surface-2">
                      <td className="num px-2 py-2">
                        {fmtDate(r.period_start)} → {fmtDate(r.period_end)}
                      </td>
                      <td className="px-2 py-2">
                        {r.hub_id ? hubs.find((h) => h.id === r.hub_id)?.name : "Fleet-wide"}
                      </td>
                      <td className="num px-2 py-2 text-muted-foreground">
                        {fmtDateTime(r.generated_at)}
                      </td>
                      <td className="px-2 py-2">
                        <button className="text-blue hover:underline" onClick={() => download(r.id)}>
                          CSV
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Utilization Ranking"
        className="mt-4"
        action={<BarChart3 className="size-3.5 text-muted-foreground" aria-hidden />}
      >
        <ul className="space-y-1.5">
          {rollups.map((h) => (
            <li key={h.id} className="flex items-center gap-2">
              <span className="w-40 shrink-0 truncate text-[11px]">
                {h.name} <span className="text-muted-foreground">· {h.county}</span>
              </span>
              <Bar pct={h.utilization} />
              <span className="num w-10 text-right text-[11px]" style={{ color: utilColor(h.utilization) }}>
                {h.utilization}%
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
