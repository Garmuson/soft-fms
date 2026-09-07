import { createFileRoute } from "@tanstack/react-router";
import { ReportsView } from "@/components/ReportsView";
import { RoleGate } from "@/components/RoleGate";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics · YM-FMS" },
      {
        name: "description",
        content: "Generate situation, fleet, fuel and maintenance compliance reports for SPPCC.",
      },
      { property: "og:title", content: "Reports & Analytics · YM-FMS" },
      { property: "og:description", content: "Operational reporting for the national yellow machine fleet." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "ministry_analyst"]}>
      <ReportsView hubId={null} />
    </RoleGate>
  ),
});
