import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertsView, type AlertTab } from "@/components/AlertsView";
import { RoleGate } from "@/components/RoleGate";

type Search = { level?: AlertTab; hub?: number };

export const Route = createFileRoute("/_authenticated/alerts")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    level: (["all", "critical", "warning", "info", "acknowledged"] as const).includes(
      s.level as AlertTab,
    )
      ? (s.level as AlertTab)
      : undefined,
    hub: s.hub ? Number(s.hub) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Fleet Alerts · YM-FMS" },
      {
        name: "description",
        content: "Critical, warning and informational alerts across all 19 SPPCC hubs.",
      },
      { property: "og:title", content: "Fleet Alerts · YM-FMS" },
      { property: "og:description", content: "Acknowledge machine alerts fleet-wide." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "ministry_analyst"]}>
      <AlertsPage />
    </RoleGate>
  ),
});

function AlertsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return (
    <AlertsView
      hubId={null}
      tab={search.level ?? "all"}
      hubFilter={search.hub ?? null}
      onTab={(level) => navigate({ search: (p) => ({ ...p, level }), replace: true })}
      onHubFilter={(hub) =>
        navigate({ search: (p) => ({ ...p, hub: hub ?? undefined }), replace: true })
      }
      title="Fleet Alerts"
    />
  );
}
