import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MachineDetailModal } from "@/components/MachineDetailModal";
import { PageHeader } from "@/components/kit";

export const Route = createFileRoute("/_authenticated/machine/$unitId")({
  head: () => ({
    meta: [
      { title: "Machine Detail · YM-FMS" },
      {
        name: "description",
        content: "Full machine record: position history, fuel log, maintenance timeline and alerts.",
      },
      { property: "og:title", content: "Machine Detail · YM-FMS" },
      { property: "og:description", content: "Deep-linked machine record in the YM-FMS fleet." },
    ],
  }),
  component: MachineRoute,
});

function MachineRoute() {
  const { unitId } = Route.useParams();
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title={unitId} subtitle="Machine record" />
      <MachineDetailModal unitId={unitId} onClose={() => navigate({ to: "/fleet" })} />
    </>
  );
}
