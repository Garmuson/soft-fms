import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Fuel, Play, Truck } from "lucide-react";
import { myMachinesQuery } from "@/lib/api";
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
    <RoleGate allow={["field_operator"]}>
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
      <circle cx="32" cy="32" r={r} fill="none" stroke="#21262d" strokeWidth="6" />
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
  const { profile } = useAuth();
  const qc = useQueryClient();
  const machinesQ = useQuery(myMachinesQuery(profile?.id));

  async function startShift(id: string) {
    const { error } = await supabase
      .from("machines")
      .update({ status: "active" as const, ignition_on: true })
      .eq("id", id);
    if (error) toast.error("Could not start shift", { description: error.message });
    else {
      toast.success("Shift started");
      const m = (machinesQ.data ?? []).find((x) => x.id === id);
      void logAudit(profile, {
        action: "started shift",
        entity: "machine",
        entity_ref: m?.unit_id ?? null,
        hub_id: m?.hub_id ?? null,
      });
      qc.invalidateQueries({ queryKey: ["my-machines"] });
    }
  }

  const machines = machinesQ.data ?? [];

  return (
    <>
      <PageHeader title="My Machines" subtitle="Machines assigned to you for this shift" />
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
                  <div className="mt-1.5">
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="num mt-1.5 text-[11px] text-muted-foreground">
                    {m.engine_hours_today} h today
                  </p>
                </div>
                <Gauge pct={m.fuel_level} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button
                  className={`${btn.primary} h-11 justify-center`}
                  onClick={() => startShift(m.id)}
                >
                  <Play className="size-4" aria-hidden /> Start Shift
                </button>
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
