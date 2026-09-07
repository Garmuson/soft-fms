import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, MapPin } from "lucide-react";
import { myMachinesQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, btn, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/incident")({
  head: () => ({
    meta: [
      { title: "Incident Report · YM-FMS Field" },
      {
        name: "description",
        content: "Report a breakdown, accident, tampering or fuel anomaly straight from the field.",
      },
      { property: "og:title", content: "Incident Report · YM-FMS Field" },
      { property: "og:description", content: "Escalate machine incidents to your hub and HQ instantly." },
    ],
  }),
  component: () => (
    <RoleGate allow={["field_operator", "hub_supervisor"]}>
      <IncidentPage />
    </RoleGate>
  ),
});

const TYPES = [
  { value: "breakdown", label: "Breakdown", alert: "device_offline" },
  { value: "accident", label: "Accident", alert: "unauthorised_movement" },
  { value: "tamper", label: "Tampering Suspected", alert: "tamper" },
  { value: "geofence", label: "Geofence Issue", alert: "geofence_breach" },
  { value: "fuel", label: "Fuel Anomaly", alert: "fuel_anomaly" },
  { value: "other", label: "Other", alert: "idle_timeout" },
];

const SEVERITY = [
  { value: "info", label: "Low", cls: "border-border" },
  { value: "warning", label: "Medium", cls: "border-amber text-amber" },
  { value: "critical", label: "High", cls: "border-red text-red" },
];

function IncidentPage() {
  const { profile, hubId } = useAuth();
  const qc = useQueryClient();
  const { data: machines = [] } = useQuery(myMachinesQuery(profile?.id));
  const [machineId, setMachineId] = useState("");
  const [type, setType] = useState(TYPES[0]!.value);
  const [severity, setSeverity] = useState("warning");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function detect() {
    if (!navigator.geolocation) {
      toast.error("Location is not available");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => toast.error("Could not read your location"),
    );
  }

  async function submit() {
    if (!machineId || !description.trim()) {
      toast.error("Select a machine and describe what happened");
      return;
    }
    setBusy(true);
    const machine = machines.find((m) => m.id === machineId);
    const t = TYPES.find((x) => x.value === type)!;
    const { error } = await supabase.from("alerts").insert({
      machine_id: machineId,
      hub_id: machine?.hub_id ?? hubId ?? 1,
      level: severity as "warning",
      type: t.alert,
      message: `${t.label} reported on ${machine?.unit_id}: ${description}${
        coords ? ` (at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})` : ""
      }`,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not submit the report", { description: error.message });
      return;
    }
    qc.invalidateQueries({ queryKey: ["alerts"] });
    setDone(true);
  }

  if (done)
    return (
      <>
        <PageHeader title="Report Submitted" />
        <Panel>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-teal" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Your hub supervisor and HQ have been notified.
            </p>
            <button
              className={`${btn.primary} h-11`}
              onClick={() => {
                setDone(false);
                setDescription("");
              }}
            >
              Report another
            </button>
          </div>
        </Panel>
      </>
    );

  return (
    <>
      <PageHeader title="Incident Report" subtitle="Report a problem in the field" />
      <Panel>
        <div className="space-y-4">
          <label className="block text-[11px] text-muted-foreground">
            Machine
            <select
              className={`${inputCls} h-11 text-sm`}
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
            >
              <option value="">Select machine…</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.unit_id}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-[11px] text-muted-foreground">Incident type</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  aria-pressed={type === t.value}
                  className={`h-11 rounded-md border text-xs font-medium ${
                    type === t.value ? "border-green bg-green-dim text-teal" : "border-border"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[11px] text-muted-foreground">Severity</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {SEVERITY.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  aria-pressed={severity === s.value}
                  className={`h-11 rounded-md border text-xs font-medium ${s.cls} ${
                    severity === s.value ? "bg-surface-2" : ""
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-[11px] text-muted-foreground">
            Description
            <textarea
              className={`${inputCls} h-24`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened"
            />
          </label>

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

          <button
            className={`${btn.primary} h-12 w-full justify-center text-sm`}
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </Panel>
    </>
  );
}
