import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Fuel, X } from "lucide-react";
import { LITRES_PER_GAL, fuelLogsQuery, machinesQuery, profilesQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  PageHeader,
  Panel,
  SkeletonTable,
  btn,
  inputCls,
} from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime, money } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/fuel-log")({
  head: () => ({
    meta: [
      { title: "Hub Fuel Log · YM-FMS" },
      {
        name: "description",
        content: "Fuel refills logged for your hub in the last 30 days, with anomaly flagging.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Hub Fuel Log · YM-FMS" },
      { property: "og:description", content: "Record and review hub fuel consumption." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hub_supervisor"]}>
      <FuelLogPage />
    </RoleGate>
  ),
});

function FuelLogPage() {
  const { hubId, profile } = useAuth();
  const qc = useQueryClient();
  const [machineFilter, setMachineFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    machine_id: "",
    volume_gal: "",
    cost_usd: "",
    fuel_level_before: "40",
    fuel_level_after: "90",
    notes: "",
  });

  const logsQ = useQuery(fuelLogsQuery(hubId));
  const { data: machines = [] } = useQuery(machinesQuery(hubId));
  const { data: profiles = [] } = useQuery(profilesQuery());

  const rows = (logsQ.data ?? []).filter((l) => !machineFilter || l.machine_id === machineFilter);

  async function toggleFlag(id: string, flagged: boolean) {
    const { error } = await supabase
      .from("fuel_logs")
      .update({
        is_flagged: !flagged,
        flag_reason: flagged ? null : "Flagged by hub supervisor for review",
      })
      .eq("id", id);
    if (error) toast.error("Could not update flag", { description: error.message });
    else {
      toast.success(flagged ? "Flag removed" : "Entry flagged");
      qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    }
  }

  async function add() {
    if (!form.machine_id || !(Number(form.volume_gal) > 0 && Number.isFinite(Number(form.volume_gal))) || !hubId) {
      toast.error("Machine and volume are required");
      return;
    }
    const { error } = await supabase.from("fuel_logs").insert({
      machine_id: form.machine_id,
      hub_id: hubId,
      operator_id: profile?.id ?? null,
      volume_litres: Number(form.volume_gal) * LITRES_PER_GAL,
      cost_usd: Number(form.cost_usd || Number(form.volume_gal) * LITRES_PER_GAL * 0.95),
      fuel_level_before: Number(form.fuel_level_before),
      fuel_level_after: Number(form.fuel_level_after),
      notes: form.notes || null,
    });
    if (error) toast.error("Could not save entry", { description: error.message });
    else {
      toast.success("Fuel entry recorded");
      setAdding(false);
      qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    }
  }

  return (
    <>
      <PageHeader
        title="Fuel Log"
        subtitle={`${rows.length} entries for your hub`}
        actions={
          <button className={btn.primary} onClick={() => setAdding(true)}>
            Add Fuel Entry
          </button>
        }
      />

      <div className="mb-3">
        <select
          className={`${inputCls} max-w-52`}
          value={machineFilter}
          onChange={(e) => setMachineFilter(e.target.value)}
          aria-label="Filter by machine"
        >
          <option value="">All machines</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id}>
              {m.unit_id}
            </option>
          ))}
        </select>
      </div>

      <Panel className="overflow-hidden">
        {logsQ.isLoading ? (
          <SkeletonTable rows={10} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Fuel className="size-4" />}
            title="No fuel entries"
            message="Add a fuel entry after the next refill to start building the log."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["Date", "Machine", "Volume", "Cost", "Before", "After", "Operator", "Flag"].map(
                    (h) => (
                      <th key={h} className="px-2 py-2 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr
                    key={l.id}
                    className={`border-b border-border hover:bg-surface-2 ${l.is_flagged ? "bg-amber-dim/30" : ""}`}
                  >
                    <td className="num px-2 py-2">{fmtDateTime(l.logged_at)}</td>
                    <td className="num px-2 py-2">
                      {machines.find((m) => m.id === l.machine_id)?.unit_id ?? "—"}
                    </td>
                    <td className="num px-2 py-2">{(Number(l.volume_litres) / LITRES_PER_GAL).toFixed(1)} gal</td>
                    <td className="num px-2 py-2">{money(Number(l.cost_usd))}</td>
                    <td className="num px-2 py-2">{l.fuel_level_before}%</td>
                    <td className="num px-2 py-2">{l.fuel_level_after}%</td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {profiles.find((p) => p.id === l.operator_id)?.full_name ?? "—"}
                    </td>
                    <td className="px-2 py-2">
                      <button className="text-blue hover:underline" onClick={() => toggleFlag(l.id, l.is_flagged)}>
                        {l.is_flagged ? "Remove flag" : "Flag"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {adding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-border bg-surface">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Add Fuel Entry</h2>
              <button onClick={() => setAdding(false)} aria-label="Close">
                <X className="size-4 text-muted-foreground" />
              </button>
            </header>
            <div className="space-y-3 p-4">
              <label className="block text-[10px] text-muted-foreground">
                Machine
                <select
                  className={inputCls}
                  value={form.machine_id}
                  onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
                >
                  <option value="">Select machine…</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.unit_id}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[10px] text-muted-foreground">
                  Volume (gal)
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    value={form.volume_gal}
                    onChange={(e) => setForm({ ...form, volume_gal: e.target.value })}
                  />
                </label>
                <label className="block text-[10px] text-muted-foreground">
                  Cost (USD)
                  <input
                    className={inputCls}
                    inputMode="decimal"
                    value={form.cost_usd}
                    onChange={(e) => setForm({ ...form, cost_usd: e.target.value })}
                  />
                </label>
                <label className="block text-[10px] text-muted-foreground">
                  Fuel before %
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    value={form.fuel_level_before}
                    onChange={(e) => setForm({ ...form, fuel_level_before: e.target.value })}
                  />
                </label>
                <label className="block text-[10px] text-muted-foreground">
                  Fuel after %
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    value={form.fuel_level_after}
                    onChange={(e) => setForm({ ...form, fuel_level_after: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-[10px] text-muted-foreground">
                Notes
                <textarea
                  className={`${inputCls} h-16`}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
              <button className={`${btn.primary} w-full justify-center`} onClick={add}>
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
