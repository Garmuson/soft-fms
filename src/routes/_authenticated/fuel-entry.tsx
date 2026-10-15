import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, MapPin } from "lucide-react";
import { LITRES_PER_GAL, myMachinesQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, btn, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit";
import { submitOrQueue } from "@/lib/offline-queue";

export const Route = createFileRoute("/_authenticated/fuel-entry")({
  head: () => ({
    meta: [
      { title: "Fuel Entry · YM-FMS Field" },
      { name: "description", content: "Record a fuel refill from the field with GPS location capture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Fuel Entry · YM-FMS Field" },
      { property: "og:description", content: "Log gallons, cost and tank levels in seconds." },
    ],
  }),
  component: () => (
    <RoleGate allow={["field_operator", "hub_supervisor"]}>
      <FuelEntryPage />
    </RoleGate>
  ),
});

function FuelEntryPage() {
  const { profile, hubId } = useAuth();
  const qc = useQueryClient();
  const { data: machines = [] } = useQuery(myMachinesQuery(profile?.id));
  const [done, setDone] = useState<null | { unit: string; volume: number }>(null);
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    machine_id: "",
    volume_gal: "",
    before: 40,
    after: 90,
    notes: "",
  });

  function detect() {
    if (!navigator.geolocation) {
      toast.error("Location is not available on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        toast.success("Location captured");
      },
      () => toast.error("Could not read your location"),
    );
  }

  async function submit() {
    if (!form.machine_id || !(Number(form.volume_gal) > 0 && Number.isFinite(Number(form.volume_gal)))) {
      toast.error("Choose a machine and enter the volume");
      return;
    }
    setBusy(true);
    const machine = machines.find((m) => m.id === form.machine_id);
    const result = await submitOrQueue("fuel_logs", `Fuel entry for ${machine?.unit_id ?? "machine"}`, {
      machine_id: form.machine_id,
      hub_id: machine?.hub_id ?? hubId ?? 1,
      operator_id: profile?.id ?? null,
      volume_litres: Number(form.volume_gal) * LITRES_PER_GAL,
      cost_usd: Number(form.volume_gal) * LITRES_PER_GAL * 0.95,
      fuel_level_before: form.before,
      fuel_level_after: form.after,
      location_lat: coords?.lat ?? null,
      location_lng: coords?.lng ?? null,
      notes: form.notes || null,
    });
    setBusy(false);
    if (result.error) {
      toast.error("Could not save the fuel entry", { description: result.error });
      return;
    }
    if (result.queued) {
      toast.warning("Saved on this device", {
        description: "No connection — it will be sent to HQ automatically when you are back online.",
      });
    } else {
      await supabase.from("machines").update({ fuel_level: form.after }).eq("id", form.machine_id);
      void logAudit(profile, {
        action: "logged fuel",
        entity: "fuel_log",
        entity_ref: machine?.unit_id ?? null,
        hub_id: machine?.hub_id ?? hubId ?? null,
        detail: `${form.volume_gal} gal`,
      });
    }
    qc.invalidateQueries({ queryKey: ["fuel_logs"] });
    qc.invalidateQueries({ queryKey: ["my-machines"] });
    setDone({ unit: machine?.unit_id ?? "", volume: Number(form.volume_gal) });

  }

  if (done)
    return (
      <>
        <PageHeader title="Fuel Recorded" />
        <Panel>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-teal" aria-hidden />
            <p className="num text-lg">{done.unit}</p>
            <p className="text-sm text-muted-foreground">{done.volume} gal recorded</p>
            <button
              className={`${btn.primary} h-11`}
              onClick={() => {
                setDone(null);
                setForm({ ...form, volume_gal: "", notes: "" });
              }}
            >
              Submit another
            </button>
          </div>
        </Panel>
      </>
    );

  return (
    <>
      <PageHeader title="Fuel Entry" subtitle="Record a refill" />
      <Panel>
        <div className="space-y-4">
          <label className="block text-[11px] text-muted-foreground">
            Machine
            <select
              className={`${inputCls} h-11 text-sm`}
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

          <label className="block text-[11px] text-muted-foreground">
            Volume (gal)
            <input
              className={`${inputCls} num h-14 text-2xl`}
              inputMode="decimal"
              value={form.volume_gal}
              onChange={(e) => setForm({ ...form, volume_gal: e.target.value })}
            />
          </label>

          {(["before", "after"] as const).map((k) => (
            <label key={k} className="block text-[11px] text-muted-foreground">
              Fuel level {k}: <span className="num text-foreground">{form[k]}%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })}
                className="mt-2 w-full accent-[#2ea043]"
              />
            </label>
          ))}

          <div>
            <button className={`${btn.secondary} h-11`} onClick={detect}>
              <MapPin className="size-4" aria-hidden /> Detect location
            </button>
            {coords && (
              <p className="num mt-1.5 text-[11px] text-muted-foreground">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>

          <label className="block text-[11px] text-muted-foreground">
            Notes
            <textarea
              className={`${inputCls} h-20`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <button
            className={`${btn.primary} h-12 w-full justify-center text-sm`}
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Saving…" : "Submit Fuel Entry"}
          </button>
        </div>
      </Panel>
    </>
  );
}
