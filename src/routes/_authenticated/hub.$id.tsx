import { createFileRoute } from "@tanstack/react-router";
import { HubOverview } from "@/components/HubOverview";
import { RoleGate } from "@/components/RoleGate";

export const Route = createFileRoute("/_authenticated/hub/$id")({
  head: () => ({
    meta: [
      { title: "Hub Detail · YM-FMS" },
      {
        name: "description",
        content: "Hub-level machine register, utilization, alerts and projects for an SPPCC hub.",
      },
      { property: "og:title", content: "Hub Detail · YM-FMS" },
      { property: "og:description", content: "Live status of 15 machines assigned to this hub." },
    ],
  }),
  component: HubDetailRoute,
});

function HubDetailRoute() {
  const { id } = Route.useParams();
  return (
    <RoleGate allow={["hq_admin", "ministry_analyst"]}>
      <HubOverview hubId={Number(id)} />
    </RoleGate>
  );
}
