import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertsView, type AlertTab } from "@/components/AlertsView";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState, Panel } from "@/components/kit";

type Search = { level?: AlertTab };

export const Route = createFileRoute("/_authenticated/hub-alerts")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    level: (["all", "critical", "warning", "info", "acknowledged"] as const).includes(
      s.level as AlertTab,
    )
      ? (s.level as AlertTab)
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hub Alerts · YM-FMS" },
      { name: "description", content: "Alerts raised by machines in your assigned SPPCC hub." },
      { property: "og:title", content: "Hub Alerts · YM-FMS" },
      { property: "og:description", content: "Acknowledge alerts for your hub's machines." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hub_supervisor"]}>
      <HubAlertsPage />
    </RoleGate>
  ),
});

function HubAlertsPage() {
  const { hubId } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  if (!hubId)
    return (
      <Panel>
        <EmptyState title="No hub assigned" message="Ask an HQ administrator to assign your hub." />
      </Panel>
    );
  return (
    <AlertsView
      hubId={hubId}
      tab={search.level ?? "all"}
      onTab={(level) => navigate({ search: () => ({ level }), replace: true })}
      title="Hub Alerts"
    />
  );
}
