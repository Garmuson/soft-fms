import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btn, inputCls } from "@/components/kit";
import { MACHINE_TYPES } from "@/lib/fleet";
import type { Hub } from "@/lib/api";

const DEFAULT_CAP: Record<string, number> = {
  motor_grader: 110,
  front_end_loader: 100,
  excavator: 130,
  dump_truck: 80,
  compactor: 65,
  other: 60,
};

export function AddMachineModal({ hubs, onClose }: { hubs: Hub[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    unit_id: "",
    hub_id: hubs[0]?.id ?? 1,
    type: "motor_grader",
    model: "",
    serial_number: "",
    tank_capacity_gal: "110",
    fuel_level: "100",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    const unit = f.unit_id.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    const cap = Number(f.tank_capacity_gal);
    const lvl = Number(f.fuel_level);
    if (!unit) return toast.error("Unit ID is required");
    if (!Number.isFinite(cap) || cap <= 0 || cap > 2000)
      return toast.error("Tank capacity must be between 1 and 2,000 gal");
    if (!Number.isFinite(lvl) || lvl < 0 || lvl > 100) return toast.error("Fuel level must be 0–100%");
    setBusy(true);
    const { error } = await supabase.from("machines").insert({
      unit_id: unit,
      hub_id: Number(f.hub_id),
      type: f.type as never,
      model: f.model.trim() || null,
      serial_number: f.serial_number.trim() || null,
      tank_capacity_gal: cap,
      fuel_level: Math.round(lvl),
      status: "idle",
    } as never);
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "That unit ID already exists" : error.message);
    toast.success(`Machine ${unit} added`);
    qc.invalidateQueries();
    onClose();
  }

  const lbl = "block text-[10px] text-muted-foreground";
  return (
    <div className="ym-modal fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Add Machine</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="size-4 text-muted-foreground" />
          </button>
        </header>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          <label className={lbl}>
            Unit ID
            <input className={inputCls} value={f.unit_id} onChange={(e) => set("unit_id", e.target.value)} placeholder="H01-MG-04" />
          </label>
          <label className={lbl}>
            Hub
            <select className={inputCls} value={f.hub_id} onChange={(e) => set("hub_id", Number(e.target.value))}>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Type
            <select
              className={inputCls}
              value={f.type}
              onChange={(e) => {
                set("type", e.target.value);
                set("tank_capacity_gal", String(DEFAULT_CAP[e.target.value] ?? 60));
              }}
            >
              {MACHINE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className={lbl}>
            Full tank capacity (gal)
            <input type="number" min={1} max={2000} className={inputCls} value={f.tank_capacity_gal} onChange={(e) => set("tank_capacity_gal", e.target.value)} />
          </label>
          <label className={lbl}>
            Model
            <input className={inputCls} value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="CAT 140K" />
          </label>
          <label className={lbl}>
            Serial number
            <input className={inputCls} value={f.serial_number} onChange={(e) => set("serial_number", e.target.value)} />
          </label>
          <label className={lbl}>
            Current fuel level (%)
            <input type="number" min={0} max={100} className={inputCls} value={f.fuel_level} onChange={(e) => set("fuel_level", e.target.value)} />
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <button className={btn.secondary} onClick={onClose}>Cancel</button>
          <button className={btn.primary} disabled={busy} onClick={save}>{busy ? "Saving…" : "Add Machine"}</button>
        </footer>
      </div>
    </div>
  );
}
