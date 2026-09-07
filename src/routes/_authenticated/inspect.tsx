import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { myMachinesQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, btn, inputCls } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/inspect")({
  head: () => ({
    meta: [
      { title: "Machine Inspection · YM-FMS Field" },
      {
        name: "description",
        content: "Pre and post deployment inspection checklist for yellow machine operators.",
      },
      { property: "og:title", content: "Machine Inspection · YM-FMS Field" },
      { property: "og:description", content: "Twelve-point safety and readiness checklist." },
    ],
  }),
  component: () => (
    <RoleGate allow={["field_operator", "hub_supervisor"]}>
      <InspectPage />
    </RoleGate>
  ),
});

const ITEMS: { key: string; label: string; critical: boolean }[] = [
  { key: "engine_oil", label: "Engine Oil Level", critical: true },
  { key: "hydraulic", label: "Hydraulic Fluid Level", critical: true },
  { key: "tyres", label: "Tyre or Track Condition", critical: true },
  { key: "lights", label: "Lights and Signals", critical: false },
  { key: "horn", label: "Horn", critical: false },
  { key: "seatbelt", label: "Seat Belt", critical: true },
  { key: "extinguisher", label: "Fire Extinguisher", critical: false },
  { key: "gps", label: "GPS Unit Status", critical: false },
  { key: "fuel", label: "Fuel Level Reading", critical: false },
  { key: "brakes", label: "Brake Function", critical: true },
  { key: "steering", label: "Steering", critical: true },
  { key: "exterior", label: "General Exterior Condition", critical: false },
];

type Result = "pass" | "fail" | "na";

function InspectPage() {
  const { profile, hubId } = useAuth();
  const qc = useQueryClient();
  const { data: machines = [] } = useQuery(myMachinesQuery(profile?.id));
  const [machineId, setMachineId] = useState("");
  const [type, setType] = useState("pre_deployment");
  const [state, setState] = useState<Record<string, { result: Result; notes: string }>>(
    Object.fromEntries(ITEMS.map((i) => [i.key, { result: "pass" as Result, notes: "" }])),
  );
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const criticalFail = ITEMS.some((i) => i.critical && state[i.key]!.result === "fail");
  const anyFail = ITEMS.some((i) => state[i.key]!.result === "fail");
  const overall = criticalFail ? "fail" : anyFail ? "partial" : "pass";

  async function submit() {
    if (!machineId) {
      toast.error("Select the machine you inspected");
      return;
    }
    const missingNotes = ITEMS.filter(
      (i) => state[i.key]!.result === "fail" && !state[i.key]!.notes.trim(),
    );
    if (missingNotes.length) {
      toast.error("Add notes for every failed item");
      return;
    }
    setBusy(true);
    const machine = machines.find((m) => m.id === machineId);
    const { error } = await supabase.from("inspections").insert({
      machine_id: machineId,
      hub_id: machine?.hub_id ?? hubId ?? 1,
      operator_id: profile?.id ?? null,
      type,
      overall_status: overall,
      checklist_json: ITEMS.map((i) => ({
        item: i.label,
        critical: i.critical,
        result: state[i.key]!.result,
        notes: state[i.key]!.notes,
      })),
      photo_urls: [],
    });
    setBusy(false);
    if (error) {
      toast.error("Could not submit inspection", { description: error.message });
      return;
    }
    qc.invalidateQueries({ queryKey: ["inspections"] });
    setDone(machine?.unit_id ?? "");
  }

  if (done)
    return (
      <>
        <PageHeader title="Inspection Submitted" />
        <Panel>
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="size-10 text-teal" aria-hidden />
            <p className="num text-lg">{done}</p>
            <p className="text-sm capitalize text-muted-foreground">Result: {overall}</p>
            <button className={`${btn.primary} h-11`} onClick={() => setDone(null)}>
              New inspection
            </button>
          </div>
        </Panel>
      </>
    );

  return (
    <>
      <PageHeader title="Inspection" subtitle="Pre and post deployment checklist" />
      <Panel>
        <div className="grid gap-3 sm:grid-cols-2">
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
          <label className="block text-[11px] text-muted-foreground">
            Inspection type
            <select
              className={`${inputCls} h-11 text-sm`}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="pre_deployment">Pre-deployment</option>
              <option value="post_deployment">Post-deployment</option>
              <option value="daily">Daily</option>
            </select>
          </label>
        </div>
      </Panel>

      <div className="mt-3 space-y-2">
        {ITEMS.map((i) => {
          const s = state[i.key]!;
          return (
            <Panel key={i.key}>
              <p className="text-sm">
                {i.label}
                {i.critical && <span className="ml-1.5 text-[10px] text-red">critical</span>}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["pass", "fail", "na"] as Result[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setState({ ...state, [i.key]: { ...s, result: r } })}
                    aria-pressed={s.result === r}
                    className={`h-11 rounded-md border text-xs font-medium capitalize ${
                      s.result === r
                        ? r === "pass"
                          ? "border-green bg-green-dim text-teal"
                          : r === "fail"
                            ? "border-red bg-red-dim text-red"
                            : "border-border-hover bg-surface-2"
                        : "border-border"
                    }`}
                  >
                    {r === "na" ? "N/A" : r}
                  </button>
                ))}
              </div>
              {s.result === "fail" && (
                <textarea
                  className={`${inputCls} mt-2 h-16`}
                  placeholder="What is wrong? (required)"
                  value={s.notes}
                  onChange={(e) => setState({ ...state, [i.key]: { ...s, notes: e.target.value } })}
                />
              )}
            </Panel>
          );
        })}
      </div>

      <div className="sticky bottom-16 mt-4 md:bottom-4">
        <button
          className={`${btn.primary} h-12 w-full justify-center text-sm`}
          onClick={submit}
          disabled={busy}
        >
          {busy ? "Submitting…" : `Submit Inspection (${overall})`}
        </button>
      </div>
    </>
  );
}
