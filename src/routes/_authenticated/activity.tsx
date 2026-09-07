import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, History } from "lucide-react";
import { auditQuery, hubsQuery } from "@/lib/api";
import { EmptyState, PageHeader, Panel, SkeletonTable, btn } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { downloadFile, fmtDateTime, toCsv } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/activity")({
  head: () => ({
    meta: [
      { title: "Activity Log · YM-FMS" },
      {
        name: "description",
        content:
          "Audit trail of sign-ins, acknowledgements, status changes and record creation across the SPPCC fleet system.",
      },
      { property: "og:title", content: "Activity Log · YM-FMS" },
      { property: "og:description", content: "Who did what, and when, across YM-FMS." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "ministry_analyst"]}>
      <ActivityPage />
    </RoleGate>
  ),
});

function ActivityPage() {
  const { role, hubId } = useAuth();
  const scope = role === "hub_supervisor" ? hubId : null;
  const auditQ = useQuery(auditQuery(scope));
  const { data: hubs = [] } = useQuery(hubsQuery());
  const rows = auditQ.data ?? [];

  return (
    <>
      <PageHeader
        title="Activity Log"
        subtitle="Every recorded action, kept for accountability and audit"
        actions={
          <button
            className={btn.secondary}
            onClick={() =>
              downloadFile(
                "ym-fms-activity-log.csv",
                toCsv(
                  rows.map((r) => ({
                    when: r.created_at,
                    user: r.actor_email,
                    action: r.action,
                    record_type: r.entity,
                    record: r.entity_ref ?? "",
                    hub: hubs.find((h) => h.id === r.hub_id)?.name ?? "",
                    detail: r.detail ?? "",
                  })),
                ),
              )
            }
          >
            <Download className="size-3.5" aria-hidden /> Export CSV
          </button>
        }
      />
      <Panel title={`Entries (${rows.length})`}>
        {auditQ.isLoading ? (
          <SkeletonTable rows={10} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<History className="size-4" />}
            title="Nothing recorded yet"
            message="Sign-ins, alert acknowledgements and record changes will appear here as staff use the system."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["When", "User", "Action", "Record", "Reference", "Hub", "Detail"].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border hover:bg-surface-2">
                    <td className="num px-2 py-2 whitespace-nowrap">{fmtDateTime(r.created_at)}</td>
                    <td className="num px-2 py-2">{r.actor_email}</td>
                    <td className="px-2 py-2 capitalize">{r.action}</td>
                    <td className="px-2 py-2 capitalize">{r.entity.replace(/_/g, " ")}</td>
                    <td className="num px-2 py-2">{r.entity_ref ?? "—"}</td>
                    <td className="px-2 py-2">
                      {hubs.find((h) => h.id === r.hub_id)?.name ?? "Fleet-wide"}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">{r.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
