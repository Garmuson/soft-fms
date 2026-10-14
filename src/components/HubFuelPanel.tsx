import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { LITRES_PER_GAL, fuelLogsQuery, hubDeliveriesQuery, machinesQuery, type Hub } from "@/lib/api";
import { Panel, btn, inputCls } from "@/components/kit";
import { fmtDateTime, money } from "@/lib/fleet";
import { useAuth } from "@/hooks/use-auth";

const gal = (n: number) => `${Math.round(n).toLocaleString()} gal`;

export function hubFuelStatus(stock: number, cap: number, reorder: number) {
  if (stock < reorder * 0.6) return { label: "Critical Low", cls: "text-red" };
  if (stock < reorder) return { label: "Reorder Needed", cls: "text-amber" };
  return { label: "Healthy", cls: "text-teal" };
}

export function HubFuelPanel({ hub }: { hub: Hub }) {
  const qc = useQueryClient();
  const { readOnly } = useAuth();
  const { data: deliveries = [] } = useQuery(hubDeliveriesQuery(hub.id));
  const { data: logs = [] } = useQuery(fuelLogsQuery(hub.id));
  const { data: machines = [] } = useQuery(machinesQuery(hub.id));
  const [tab, setTab] = useState<"in" | "out">("in");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ waybill: "", supplier: "", volume: "", unit: "4.35", before: "", after: "", notes: "" });

  const stock = Number(hub.tank_current_stock_gal);
  const cap = Number(hub.tank_capacity_gal);
  const reorder = Number(hub.tank_reorder_level_gal);
  const pct = cap ? Math.min(100, Math.round((stock / cap) * 100)) : 0;
  const status = hubFuelStatus(stock, cap, reorder);

  const weekAgo = Date.now() - 7 * 86400000;
  const burn7 = logs.filter((l) => new Date(l.logged_at).getTime() >= weekAgo).reduce((a, l) => a + Number(l.volume_litres), 0) / LITRES_PER_GAL / 7;
  const daysLeft = burn7 > 0 ? stock / burn7 : null;
  const monthAgo = Date.now() - 30 * 86400000;
  const recvd30 = deliveries.filter((d) => new Date(d.received_at).getTime() >= monthAgo).reduce((a, d) => a + Number(d.volume_gal), 0);
  const used30 = logs.filter((l) => new Date(l.logged_at).getTime() >= monthAgo).reduce((a, l) => a + Number(l.volume_litres), 0) / LITRES_PER_GAL;

  // Walk back from today's stock to rebuild the daily tank level
  const series = useMemo(() => {
    const out: { date: string; stock: number }[] = [];
    let level = stock;
    for (let i = 0; i < 30; i++) {
      const end = new Date(); end.setHours(23, 59, 59, 999); end.setDate(end.getDate() - i);
      const start = new Date(end); start.setHours(0, 0, 0, 0);
      out.push({ date: start.toISOString().slice(5, 10), stock: Math.round(level) });
      const inDay = (t: string) => { const x = new Date(t).getTime(); return x >= start.getTime() && x <= end.getTime(); };
      const recv = deliveries.filter((d) => inDay(d.received_at)).reduce((a, d) => a + Number(d.volume_gal), 0);
      const used = logs.filter((l) => inDay(l.logged_at)).reduce((a, l) => a + Number(l.volume_litres), 0) / LITRES_PER_GAL;
      level = level - recv + used;
    }
    return out.reverse();
  }, [stock, deliveries, logs]);

  const unitById = new Map(machines.map((m) => [m.id, m.unit_id]));

  async function save() {
    const volume = Number(f.volume);
    if (!f.waybill.trim() || !f.supplier.trim() || !(volume > 0)) {
      toast.error("Enter waybill, supplier and gallons received");
      return;
    }
    if (volume + stock > cap * 1.05) {
      toast.error(`That would exceed tank capacity (${gal(cap)})`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("hub_fuel_deliveries").insert({
      hub_id: hub.id,
      waybill_number: f.waybill.trim().slice(0, 60),
      supplier_name: f.supplier.trim().slice(0, 80),
      volume_gal: volume,
      unit_cost_usd: Number(f.unit) || 0,
      dipstick_before_gal: f.before ? Number(f.before) : null,
      dipstick_after_gal: f.after ? Number(f.after) : null,
      notes: f.notes.trim().slice(0, 500) || null,
    });
    setBusy(false);
    if (error) { toast.error("Could not record delivery", { description: error.message }); return; }
    toast.success(`${gal(volume)} received into ${hub.name} depot`);
    setOpen(false);
    setF({ waybill: "", supplier: "", volume: "", unit: "4.35", before: "", after: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["hubs"] });
    qc.invalidateQueries({ queryKey: ["hub_fuel_deliveries"] });
  }

  return (
    <Panel
      title="Hub Fuel Depot"
      className="mt-4"
      action={!readOnly && <button className={btn.primary} onClick={() => setOpen((o) => !o)}>{open ? "Close" : "Receive Bulk Fuel"}</button>}
    >
      {open && (
        <div className="mb-4 grid gap-2 rounded-md border border-border p-3 sm:grid-cols-4">
          <input className={inputCls} placeholder="Waybill / slip no." value={f.waybill} onChange={(e) => setF({ ...f, waybill: e.target.value })} />
          <input className={inputCls} placeholder="Supplier" list="suppliers" value={f.supplier} onChange={(e) => setF({ ...f, supplier: e.target.value })} />
          <datalist id="suppliers"><option value="TotalEnergies Liberia" /><option value="Conex Petroleum" /><option value="Petro Trade Inc." /></datalist>
          <input className={inputCls} type="number" min="1" placeholder="Gallons received" value={f.volume} onChange={(e) => setF({ ...f, volume: e.target.value })} />
          <input className={inputCls} type="number" step="0.01" placeholder="Cost per gal (USD)" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
          <input className={inputCls} type="number" placeholder="Dipstick before (gal)" value={f.before} onChange={(e) => setF({ ...f, before: e.target.value })} />
          <input className={inputCls} type="number" placeholder="Dipstick after (gal)" value={f.after} onChange={(e) => setF({ ...f, after: e.target.value })} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Tanker plate / notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <div className="sm:col-span-4 flex items-center justify-between text-xs">
            <span>Total: {money(Math.round((Number(f.volume) || 0) * (Number(f.unit) || 0)))}</span>
            <button className={btn.primary} disabled={busy} onClick={save}>{busy ? "Saving…" : "Record Delivery"}</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div>
          <div className="relative mx-auto h-44 w-28 overflow-hidden rounded-xl border-2 border-border bg-background">
            <div className="absolute inset-x-0 bottom-0 bg-primary transition-all" style={{ height: `${pct}%` }} />
            <div className="absolute inset-x-0 border-t border-dashed border-red" style={{ bottom: `${cap ? (reorder / cap) * 100 : 0}%` }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center font-bold mix-blend-difference text-foreground">
              <span className="text-xl">{pct}%</span>
            </div>
          </div>
          <p className="mt-2 text-center text-sm font-semibold">{gal(stock)} <span className="text-muted-foreground">/ {gal(cap)}</span></p>
          <p className={`text-center text-xs font-bold ${status.cls}`}>{status.label}</p>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between"><dt className="text-muted-foreground">Daily burn (7d)</dt><dd>{gal(burn7)}/day</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Days to empty</dt><dd>{daysLeft == null ? "—" : `${daysLeft.toFixed(1)} days`}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Reorder level</dt><dd>{gal(reorder)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Received (30d)</dt><dd>{gal(recvd30)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Drawn down (30d)</dt><dd>{gal(used30)}</dd></div>
          </dl>
        </div>

        <div className="min-w-0">
          <p className="mb-1 text-xs text-muted-foreground">Depot level — last 30 days (rises on tanker deliveries, falls as machines refuel)</p>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <CartesianGrid stroke="var(--cat-iron)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--cat-white)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--cat-white)" }} domain={[0, Math.ceil(cap)]} />
                <Tooltip formatter={(v) => gal(Number(v))} contentStyle={{ background: "var(--cat-steel)", border: "1px solid var(--cat-yellow)", fontSize: 11 }} />
                <Area type="stepAfter" dataKey="stock" name="Tank level" stroke="var(--cat-yellow)" fill="var(--cat-yellow-dim)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 flex gap-2">
            <button className={tab === "in" ? btn.primary : btn.secondary} onClick={() => setTab("in")}>Deliveries received</button>
            <button className={tab === "out" ? btn.primary : btn.secondary} onClick={() => setTab("out")}>Machine drawdowns</button>
          </div>
          <div className="mt-2 max-h-64 overflow-auto">
            <table className="w-full text-xs">
              {tab === "in" ? (
                <>
                  <thead><tr className="text-left"><th className="p-1.5">Received</th><th>Waybill</th><th>Supplier</th><th className="text-right">Gallons</th><th className="text-right">Cost</th></tr></thead>
                  <tbody>
                    {deliveries.slice(0, 50).map((d) => (
                      <tr key={d.id} className="border-t border-border">
                        <td className="p-1.5">{fmtDateTime(d.received_at)}</td><td>{d.waybill_number}</td><td>{d.supplier_name}</td>
                        <td className="text-right text-teal">+{Math.round(Number(d.volume_gal)).toLocaleString()}</td><td className="text-right">{money(Number(d.total_cost_usd))}</td>
                      </tr>
                    ))}
                    {!deliveries.length && <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">No deliveries recorded yet</td></tr>}
                  </tbody>
                </>
              ) : (
                <>
                  <thead><tr className="text-left"><th className="p-1.5">Dispensed</th><th>Machine</th><th className="text-right">Gallons</th></tr></thead>
                  <tbody>
                    {logs.slice(0, 50).map((l) => (
                      <tr key={l.id} className="border-t border-border">
                        <td className="p-1.5">{fmtDateTime(l.logged_at)}</td><td>{unitById.get(l.machine_id) ?? "—"}</td>
                        <td className="text-right text-amber">−{(Number(l.volume_litres) / LITRES_PER_GAL).toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      </div>
    </Panel>
  );
}
