import { createFileRoute } from "@tanstack/react-router";
import { CommandDashboard } from "@/components/CommandDashboard";
import { RoleGate } from "@/components/RoleGate";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Live Command Dashboard · YM-FMS" },
      {
        name: "description",
        content: "Fleet-wide command view of 285 Yellow Machines across all 19 SPPCC hubs.",
      },
      { property: "og:title", content: "Live Command Dashboard · YM-FMS" },
      { property: "og:description", content: "Real-time fleet status, alerts and hub utilization." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin"]}>
      <CommandDashboard />
    </RoleGate>
  ),
});
