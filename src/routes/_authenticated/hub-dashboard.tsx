import { createFileRoute } from "@tanstack/react-router";
import { HubOverview } from "@/components/HubOverview";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { EmptyState, Panel } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/hub-dashboard")({
  head: () => ({
    meta: [
      { title: "Hub Dashboard · YM-FMS" },
      {
        name: "description",
        content: "Supervisor dashboard for a single SPPCC hub — machines, alerts, projects and fuel.",
      },
      { property: "og:title", content: "Hub Dashboard · YM-FMS" },
      { property: "og:description", content: "Live status for your assigned hub's 15 machines." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hub_supervisor"]}>
      <SupervisorHome />
    </RoleGate>
  ),
});

function SupervisorHome() {
  const { hubId } = useAuth();
  if (!hubId)
    return (
      <Panel>
        <EmptyState
          title="No hub assigned"
          message="Your account isn't linked to a hub yet. Ask an HQ administrator to assign your hub."
        />
      </Panel>
    );
  return <HubOverview hubId={hubId} isSupervisorHome />;
}
