import { createFileRoute } from "@tanstack/react-router";
import { CommandDashboard } from "@/components/CommandDashboard";
import { RoleGate } from "@/components/RoleGate";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "National Overview · YM-FMS" },
      {
        name: "description",
        content: "Read-only national fleet overview for ministry analysts — 285 machines, 19 hubs.",
      },
      { property: "og:title", content: "National Overview · YM-FMS" },
      { property: "og:description", content: "Ministry read-only view of national fleet performance." },
    ],
  }),
  component: () => (
    <RoleGate allow={["ministry_analyst", "hq_admin"]}>
      <CommandDashboard readOnly />
    </RoleGate>
  ),
});
