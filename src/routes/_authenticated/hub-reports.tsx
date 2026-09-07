import { createFileRoute } from "@tanstack/react-router";
import { ReportsView } from "@/components/ReportsView";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState, Panel } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/hub-reports")({
  head: () => ({
    meta: [
      { title: "Hub Reports · YM-FMS" },
      { name: "description", content: "Daily, weekly and monthly reports for your assigned SPPCC hub." },
      { property: "og:title", content: "Hub Reports · YM-FMS" },
      { property: "og:description", content: "Generate hub-scoped operational reports." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hub_supervisor"]}>
      <HubReportsPage />
    </RoleGate>
  ),
});

function HubReportsPage() {
  const { hubId } = useAuth();
  if (!hubId)
    return (
      <Panel>
        <EmptyState title="No hub assigned" message="Ask an HQ administrator to assign your hub." />
      </Panel>
    );
  return (
    <ReportsView
      hubId={hubId}
      types={["daily_situation", "weekly_operations", "monthly_fleet"]}
    />
  );
}
