import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { AlertTriangle, Clock, Fuel, Loader2, Square, Truck } from "lucide-react";
import { machinesQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader, Panel, SkeletonCards, StatusBadge, btn } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { typeLabel } from "@/lib/fleet";
import { logAudit } from "@/lib/audit";
import { PendingSync } from "@/components/PendingSync";

export const Route = createFileRoute("/_authenticated/operator-dashboard")({
  head: () => ({
    meta: [
      { title: "My Machines · YM-FMS Field" },
      {
        name: "description",
        content: "Field operator view of assigned machines with shift start, fuel and issue reporting.",
      },
      { property: "og:title", content: "My Machines · YM-FMS Field" },
      { property: "og:description", content: "Start your shift and log activity from the field." },
    ],
  }),
  component: () => (
    <RoleGate allow={["data_entry_staff"]}>
      <OperatorHome />
    </RoleGate>
  ),
});

function Gauge({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = pct < 25 ? "#da3633" : pct < 50 ? "#f0883e" : "#2ea043";
  return (
    <svg viewBox="0 0 64 64" className="size-16" aria-label={`Fuel ${pct}%`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--cat-iron)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="36" textAnchor="middle" className="num" fontSize="13" fill="#e6edf3">
        {pct}%
      </text>
    </svg>
  );
}

function OperatorHome() {
  const { profile, hubId } = useAuth();
  const qc = useQueryClient();
  const machinesQ = useQuery(machinesQuery(hubId));

  const shiftQ = useQuery({
    queryKey: ["active-shift", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("id, machine_id, started_at, start_fuel_pct" as "id, machine_id, started_at")
        .eq("operator_id", profile!.id)
        .is("ended_at", null)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as { id: string; machine_id: string; started_at: string; start_fuel_pct: number | null } | null;
    },
  });
  const active = shiftQ.data ?? null;
  const [pending, setPending] = useState<string | null>(null);

  function askFuel(label: string, initial: number): number | null {
    const raw = window.prompt(`${label} — tank gauge reading (0–100%)`, String(initial));
    if (raw === null) return null;
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      toast.error("Enter a fuel level between 0 and 100%");
      return null;
    }
    return n;
  }

  async function startShift(id: string) {
    if (!profile) return;
    const m = (machinesQ.data ?? []).find((x) => x.id === id);
    if (!m) return;
    const startPct = askFuel("Starting fuel level", m.fuel_level);
    if (startPct === null) return;
    setPending(id);
    const { error } = await supabase
      .from("shifts")
      .insert({ operator_id: profile.id, machine_id: id, hub_id: m.hub_id, start_fuel_pct: startPct } as never);
    if (!error) {
      await supabase.from("machines").update({ status: "active" as const, ignition_on: true, fuel_level: startPct }).eq("id", id);
    }
    await shiftQ.refetch();
    setPending(null);
    if (error) {
      toast.error("Could not start shift", { description: error.message });
      return;
    }
    toast.success(`Shift started · fuel ${startPct}%`);
    void logAudit(profile, { action: "started shift", entity: "machine", entity_ref: m.unit_id, hub_id: m.hub_id, detail: `Start fuel ${startPct}%` } as never);
    qc.invalidateQueries({ queryKey: ["machines"] });
  }

  async function endShift() {
    if (!active || !profile) return;
    const m = (machinesQ.data ?? []).find((x) => x.id === active.machine_id);
    const endPct = askFuel("Ending fuel level", m?.fuel_level ?? 50);
    if (endPct === null) return;
    setPending(active.machine_id);
    const { error } = await supabase
      .from("shifts")
      .update({ ended_at: new Date().toISOString(), end_fuel_pct: endPct } as never)
      .eq("id", active.id);
    if (!error)
      await supabase
        .from("machines")
        .update({ status: "idle" as const, ignition_on: false, fuel_level: endPct })
        .eq("id", active.machine_id);
    await shiftQ.refetch();
    setPending(null);
    if (error) {
      toast.error("Could not end shift", { description: error.message });
      return;
    }
    const start = active.start_fuel_pct;
    const used = start != null ? start - endPct : null;
    toast.success(used != null ? `Shift ended · used ${used}% of tank` : "Shift ended");
    void logAudit(profile, { action: "ended shift", entity: "machine", entity_ref: m?.unit_id ?? null, hub_id: m?.hub_id ?? null, detail: `End fuel ${endPct}%` } as never);
    qc.invalidateQueries({ queryKey: ["machines"] });
  }

  const machines = machinesQ.data ?? [];

  return (
    <>
      <PageHeader title="My Machines" subtitle="Your hub's machines — start shifts and log activity" />
      <PendingSync />

      {machinesQ.isLoading ? (
        <SkeletonCards count={3} height={150} />
      ) : machines.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Truck className="size-4" />}
            title="No machines assigned"
            message="Your supervisor hasn't assigned you a machine yet. Check back at shift start."
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {machines.map((m) => (
            <Panel key={m.id}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="num text-xl font-semibold">{m.unit_id}</p>
                  <p className="text-xs text-muted-foreground">{typeLabel(m.type)}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={m.status} />
                    {active?.machine_id === m.id && <ShiftPill />}
                  </div>
                  <p className="num mt-1.5 text-[11px] text-muted-foreground">
                    {m.engine_hours_today} h today
                  </p>
                </div>
                <Gauge pct={m.fuel_level} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <ShiftControl
                  machineId={m.id}
                  active={active}
                  pending={pending === m.id}
                  loading={shiftQ.isLoading}
                  onStart={() => startShift(m.id)}
                  onEnd={endShift}
                />
                <Link to="/fuel-entry" className={`${btn.secondary} h-11 justify-center`}>
                  <Fuel className="size-4" aria-hidden /> Log Fuel
                </Link>
                <Link to="/incident" className={`${btn.secondary} h-11 justify-center`}>
                  <AlertTriangle className="size-4" aria-hidden /> Report Issue
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

function ShiftPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/50 bg-green-dim px-2 py-0.5 text-[11px] font-medium text-teal">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-teal" />
      </span>
      Shift Active
    </span>
  );
}

function ShiftControl({
  machineId,
  active,
  pending,
  loading,
  onStart,
  onEnd,
}: {
  machineId: string;
  active: { machine_id: string; started_at: string; start_fuel_pct: number | null } | null;
  pending: boolean;
  loading: boolean;
  onStart: () => void;
  onEnd: () => void;
}) {
  if (active?.machine_id === machineId) {
    return (
      <div className="flex flex-col items-start gap-1">
        <div className="flex w-full items-center gap-2">
          <ShiftPill />
          <button
            className={`${btn.danger} h-9 flex-1 justify-center`}
            onClick={onEnd}
            disabled={pending}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Square className="size-3.5" aria-hidden />}
            {pending ? "Ending..." : "End Shift"}
          </button>
        </div>
        <span className="num text-[11px] text-muted-foreground">
          Started at {new Date(active.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {active.start_fuel_pct != null && ` · start fuel ${active.start_fuel_pct}%`}
        </span>
      </div>
    );
  }
  const otherActive = !!active;
  return (
    <button
      className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal px-3 text-sm font-semibold text-background transition-opacity disabled:opacity-50"
      onClick={onStart}
      disabled={pending || loading || otherActive}
      title={otherActive ? "End your current shift first" : undefined}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Clock className="size-4" aria-hidden />}
      {pending ? "Starting..." : "Start Shift"}
    </button>
  );
}
