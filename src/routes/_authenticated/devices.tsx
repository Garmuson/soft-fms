import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Cpu, Download } from "lucide-react";
import { devicesQuery, hubsQuery, machinesQuery, type Device } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
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
import { logAudit } from "@/lib/audit";
import { downloadFile, fmtDate, timeAgo, toCsv } from "@/lib/fleet";

type Search = { kind?: string | undefined; hub?: number | undefined; q?: string | undefined };

export const Route = createFileRoute("/_authenticated/devices")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    kind: typeof s["kind"] === "string" ? s["kind"] : undefined,
    hub: s["hub"] ? Number(s["hub"]) : undefined,
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Device Register · YM-FMS" },
      {
        name: "description",
        content:
          "Register of 300 GPS trackers, 5 HQ monitoring stations and 50 field tablets, with install dates, warranty and health.",
      },
      { property: "og:title", content: "Device Register · YM-FMS" },
      { property: "og:description", content: "Tracker, monitor and tablet health across 19 hubs." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "hub_supervisor", "ministry_analyst"]}>
      <DevicesPage />
    </RoleGate>
  ),
});

const KINDS = [
  { value: "tracker", label: "GPS trackers" },
  { value: "monitor", label: "HQ monitors" },
  { value: "tablet", label: "Field tablets" },
];

const STATUS_TONE: Record<string, string> = {
  active: "text-teal",
  faulty: "text-red",
  spare: "text-blue",
  retired: "text-muted-foreground",
};

function DevicesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { role, hubId, profile, readOnly } = useAuth();
  const qc = useQueryClient();
  const scope = role === "hub_supervisor" ? hubId : null;

  const devicesQ = useQuery(devicesQuery(scope));
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(scope));

  const set = (patch: Partial<Search>) =>
    navigate({ search: (p) => ({ ...p, ...patch }), replace: true });

  const all = devicesQ.data ?? [];
  const rows = all.filter((d) => {
    if (search.kind && d.kind !== search.kind) return false;
    if (search.hub && d.hub_id !== search.hub) return false;
    if (search.q) {
      const q = search.q.toLowerCase();
      const unit = machines.find((m) => m.id === d.machine_id)?.unit_id ?? "";
      if (!d.serial.toLowerCase().includes(q) && !unit.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const canEdit = !readOnly && role !== "ministry_analyst";
  const faulty = all.filter((d) => d.status === "faulty").length;
  const online = all.filter(
    (d) => d.last_checkin && Date.now() - new Date(d.last_checkin).getTime() < 2 * 3600_000,
  ).length;

  async function setStatus(d: Device, status: Device["status"]) {
    const { error } = await supabase.from("devices").update({ status }).eq("id", d.id);
    if (error) {
      toast.error("Could not update this device", { description: error.message });
      return;
    }
    toast.success(`${d.serial} marked ${status}`);
    void logAudit(profile, {
      action: "device status changed",
      entity: "device",
      entity_ref: d.serial,
      hub_id: d.hub_id,
      detail: status,
    });
    qc.invalidateQueries({ queryKey: ["devices"] });
  }

  function exportCsv() {
    downloadFile(
      "ym-fms-device-register.csv",
      toCsv(
        rows.map((d) => ({
          serial: d.serial,
          kind: d.kind,
          model: d.model,
          hub: hubs.find((h) => h.id === d.hub_id)?.name ?? "HQ / unassigned",
          machine: machines.find((m) => m.id === d.machine_id)?.unit_id ?? "",
          sim: d.sim_number ?? "",
          status: d.status,
          installed: d.installed_at ?? "",
          warranty_end: d.warranty_end ?? "",
          last_checkin: d.last_checkin ?? "",
        })),
      ),
    );
  }

  return (
    <>
      <PageHeader
        title="Device Register"
        subtitle="Trackers, command-room monitors and field tablets"
        actions={
          <button className={btn.secondary} onClick={exportCsv}>
            <Download className="size-3.5" aria-hidden /> Export CSV
          </button>
        }
      />

      <div className="mb-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        <KpiCard label="Devices" value={all.length} accent="gold" loading={devicesQ.isLoading} />
        <KpiCard
          label="Trackers"
          value={all.filter((d) => d.kind === "tracker").length}
          accent="teal"
        />
        <KpiCard label="Tablets" value={all.filter((d) => d.kind === "tablet").length} accent="blue" />
        <KpiCard label="Monitors" value={all.filter((d) => d.kind === "monitor").length} />
        <KpiCard label="Faulty" value={faulty} accent="red" sub="Awaiting replacement" />
        <KpiCard label="Checked in (2h)" value={online} accent="teal" />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <input
          className={`${inputCls} max-w-52`}
          placeholder="Search serial or unit…"
          value={search.q ?? ""}
          onChange={(e) => set({ q: e.target.value || undefined })}
          aria-label="Search devices"
        />
        <select
          className={`${inputCls} max-w-40`}
          value={search.kind ?? ""}
          onChange={(e) => set({ kind: e.target.value || undefined })}
          aria-label="Filter by device type"
        >
          <option value="">All device types</option>
          {KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
        {!scope && (
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
        )}
      </div>

      <Panel title={`Register (${rows.length})`}>
        {devicesQ.isLoading ? (
          <SkeletonTable rows={10} cols={8} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Cpu className="size-4" />}
            title="No devices match"
            message="Clear the search or choose another device type."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {[
                    "Serial",
                    "Type",
                    "Model",
                    "Hub",
                    "Fitted to",
                    "SIM",
                    "Installed",
                    "Warranty ends",
                    "Last check-in",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 400).map((d) => (
                  <tr key={d.id} className="border-b border-border hover:bg-surface-2">
                    <td className="num px-2 py-2">{d.serial}</td>
                    <td className="px-2 py-2 capitalize">{d.kind}</td>
                    <td className="px-2 py-2 text-muted-foreground">{d.model}</td>
                    <td className="px-2 py-2">
                      {hubs.find((h) => h.id === d.hub_id)?.name ?? "HQ / unassigned"}
                    </td>
                    <td className="num px-2 py-2">
                      {machines.find((m) => m.id === d.machine_id)?.unit_id ?? "—"}
                    </td>
                    <td className="num px-2 py-2 text-muted-foreground">{d.sim_number ?? "—"}</td>
                    <td className="num px-2 py-2">{fmtDate(d.installed_at)}</td>
                    <td className="num px-2 py-2">{fmtDate(d.warranty_end)}</td>
                    <td className="num px-2 py-2 text-muted-foreground">
                      {d.last_checkin ? timeAgo(d.last_checkin) : "Never"}
                    </td>
                    <td className="px-2 py-2">
                      {canEdit ? (
                        <select
                          className="rounded-md border border-border bg-surface-2 px-1.5 py-1 text-[11px]"
                          value={d.status}
                          onChange={(e) => setStatus(d, e.target.value as Device["status"])}
                          aria-label={`Status for ${d.serial}`}
                        >
                          {["active", "faulty", "spare", "retired"].map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={STATUS_TONE[d.status]}>{d.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 400 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Showing the first 400 devices — narrow the search to see the rest.
              </p>
            )}
          </div>
        )}
      </Panel>
    </>
  );
}
