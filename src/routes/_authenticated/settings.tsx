import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { hubsQuery, machinesQuery } from "@/lib/api";
import { PageHeader, Panel } from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABEL } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "System Settings · YM-FMS" },
      {
        name: "description",
        content: "YM-FMS system configuration, telemetry thresholds and account information.",
      },
      { property: "og:title", content: "System Settings · YM-FMS" },
      { property: "og:description", content: "Configuration overview for the SPPCC fleet system." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin"]}>
      <SettingsPage />
    </RoleGate>
  ),
});

function SettingsPage() {
  const { profile, role } = useAuth();
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(null));

  const rows: [string, string][] = [
    ["System", "YM-FMS — Yellow Machine Fleet Management System"],
    ["Client", "Special Presidential Projects Coordinating Committee (SPPCC)"],
    ["Hubs configured", String(hubs.length)],
    ["Machines registered", String(machines.length)],
    ["Machines per hub", "19"],
    ["GPS uptime window", "2 minutes"],
    ["Machine refresh interval", "30 seconds"],
    ["Alert refresh interval", "15 seconds"],
    ["Utilization target", "80% (amber 70–80%, red below 70%)"],
    ["Preventive maintenance interval", "Every 250 engine hours"],
  ];

  return (
    <>
      <PageHeader title="System Settings" subtitle="Configuration and account information" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="System Configuration">
          <dl className="divide-y divide-border text-xs">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="num text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title="Your Account">
          <dl className="divide-y divide-border text-xs">
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{profile?.full_name}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="num">{profile?.email}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-muted-foreground">Role</dt>
              <dd>{role ? ROLE_LABEL[role] : "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[11px] text-muted-foreground">
            Solution provider: Soft Solutions and Systems · www.softechsys.com · Monrovia, Liberia
          </p>
        </Panel>
      </div>
    </>
  );
}
