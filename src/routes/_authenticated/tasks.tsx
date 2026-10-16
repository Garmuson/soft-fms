import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";
import { machinesQuery, workOrdersQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader, Panel, SkeletonCards, btn } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { fmtDate } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Today's Tasks · YM-FMS Field" },
      { name: "description", content: "Work orders assigned to you, with start and complete actions." },
      { property: "og:title", content: "Today's Tasks · YM-FMS Field" },
      { property: "og:description", content: "Track and update your assigned field tasks." },
    ],
  }),
  component: () => (
    <RoleGate allow={["data_entry_staff"]}>
      <TasksPage />
    </RoleGate>
  ),
});

const PRIORITY_TONE: Record<string, string> = {
  low: "bg-surface-2 text-muted-foreground",
  medium: "bg-blue-dim text-blue",
  high: "bg-red-dim text-red",
};

function TasksPage() {
  const { hubId } = useAuth();
  const qc = useQueryClient();
  const woQ = useQuery(workOrdersQuery(hubId));
  const { data: machines = [] } = useQuery(machinesQuery(hubId));

  async function update(id: string, status: string, notes?: string) {
    const { error } = await supabase
      .from("work_orders")
      .update({
        status: status as "in_progress",
        completed_at: status === "completed" ? new Date().toISOString() : null,
        completion_notes: notes ?? null,
      })
      .eq("id", id);
    if (error) toast.error("Could not update task", { description: error.message });
    else {
      toast.success("Task updated");
      qc.invalidateQueries({ queryKey: ["work_orders"] });
    }
  }

  const rows = woQ.data ?? [];

  return (
    <>
      <PageHeader title="Today's Tasks" subtitle={`${rows.length} open for your hub`} />
      {woQ.isLoading ? (
        <SkeletonCards count={3} height={120} />
      ) : rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<ClipboardList className="size-4" />}
            title="No tasks assigned"
            message="Your supervisor hasn't assigned any work orders to you yet."
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {rows.map((w) => (
            <Panel key={w.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{w.title}</p>
                  <p className="num mt-0.5 text-[11px] text-muted-foreground">
                    {machines.find((m) => m.id === w.machine_id)?.unit_id ?? "No machine"} ·{" "}
                    {fmtDate(w.scheduled_date)}
                  </p>
                  {w.description && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{w.description}</p>
                  )}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${PRIORITY_TONE[w.priority]}`}>
                  {w.priority}
                </span>
              </div>
              <p className="mt-2 text-[11px] capitalize text-muted-foreground">
                Status: {w.status.replace("_", " ")}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  className={`${btn.secondary} h-11 justify-center`}
                  onClick={() => update(w.id, "in_progress")}
                >
                  Start
                </button>
                <button
                  className={`${btn.primary} h-11 justify-center`}
                  onClick={() => update(w.id, "completed", "Completed by operator")}
                >
                  Complete
                </button>
                <button
                  className={`${btn.danger} h-11 justify-center`}
                  onClick={() => update(w.id, "cancelled", "Flagged as a problem by operator")}
                >
                  Problem
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
