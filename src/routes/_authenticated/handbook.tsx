import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, GraduationCap, LifeBuoy, ShieldCheck } from "lucide-react";
import { PageHeader, Panel } from "@/components/kit";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABEL } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/handbook")({
  head: () => ({
    meta: [
      { title: "User Handbook & Training · YM-FMS" },
      {
        name: "description",
        content:
          "Role-by-role guides, training checklist, support contacts and warranty information for the SPPCC fleet system.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "User Handbook & Training · YM-FMS" },
      { property: "og:description", content: "Guides, training checklist and support for YM-FMS users." },
    ],
  }),
  component: HandbookPage,
});

const GUIDES: { role: string; steps: string[] }[] = [
  {
    role: "HQ Administrator",
    steps: [
      "Open the Live Command Dashboard to see every machine, hub and open alert on one screen.",
      "Use the map and hub table to spot hubs below the 80% utilization target.",
      "Acknowledge alerts as soon as you act on them — the action is recorded in the Activity Log.",
      "Manage work zones on the Geofences page and equipment on the Device Register.",
      "Create staff accounts and set their role and hub under Users.",
      "Generate daily, weekly and monthly reports from the Reports page and download them as CSV.",
    ],
  },
  {
    role: "Hub Supervisor",
    steps: [
      "Start on your Hub Dashboard: machine status, fuel, alerts and today's work at a glance.",
      "Use My Machines to change a machine's status and review its recent fuel and alerts.",
      "Raise and assign Work Orders to your operators, then track them to completion.",
      "Check the Fuel Log daily and flag anything that looks wrong.",
      "Review your hub's zones and tablets, and report faulty devices to HQ.",
    ],
  },
  {
    role: "Field Operator",
    steps: [
      "Sign in on your tablet — you will only see the machines assigned to you.",
      "Press Start Shift on the machine you are operating.",
      "Complete the inspection checklist before and after each shift.",
      "Record every refuel with the gallons and the fuel gauge reading.",
      "Report any breakdown, accident or tampering straight away under Report Issue.",
      "If you lose signal, keep working — entries are held on the tablet and sent when signal returns.",
    ],
  },
  {
    role: "Ministry Analyst",
    steps: [
      "Use the National Overview for a read-only view of the whole fleet.",
      "Compare hubs on the Scorecards page and export the ranking.",
      "Download period reports for oversight and briefing notes.",
    ],
  },
];

const TRAINING = [
  "Session 1 — System overview and sign-in for all users (1 hour)",
  "Session 2 — HQ command dashboard, alerts and reporting (2 hours)",
  "Session 3 — Hub supervisor workflows: machines, work orders, fuel (2 hours)",
  "Session 4 — Field operator tablet training: inspections, fuel, incidents (2 hours)",
  "Session 5 — Geofences, device register and data security (1 hour)",
  "Session 6 — Refresher and handover of user documentation (1 hour)",
];

function HandbookPage() {
  const { role } = useAuth();
  const mine = role ? ROLE_LABEL[role] : null;

  return (
    <>
      <PageHeader
        title="User Handbook & Training"
        subtitle="Guides, training plan, support and warranty information"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {GUIDES.map((g) => (
          <Panel
            key={g.role}
            title={g.role}
            action={
              mine === g.role ? (
                <span className="rounded-full bg-green-dim px-2 py-0.5 text-[10px] text-teal">
                  Your role
                </span>
              ) : (
                <BookOpen className="size-3.5 text-muted-foreground" aria-hidden />
              )
            }
          >
            <ol className="space-y-2 text-xs text-muted-foreground">
              {g.steps.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="num text-gold">{i + 1}.</span>
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ol>
          </Panel>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Training plan"
          action={<GraduationCap className="size-3.5 text-muted-foreground" aria-hidden />}
        >
          <ul className="space-y-2 text-xs">
            {TRAINING.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Training is delivered at the SPPCC Centre Office in Mamba Point and repeated per hub
            during installation and commissioning.
          </p>
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Support & maintenance"
            action={<LifeBuoy className="size-3.5 text-muted-foreground" aria-hidden />}
          >
            <dl className="divide-y divide-border text-xs">
              {[
                ["Provider", "Soft Solutions and Systems, Monrovia, Liberia"],
                ["Website", "www.softechsys.com"],
                ["Support hours", "Monday–Saturday, 08:00–18:00 GMT"],
                ["Critical response", "Within 4 working hours"],
                ["Device replacement", "Faulty trackers and tablets swapped within 5 working days"],
                ["Warranty", "12 months on all supplied devices from installation"],
                ["Data retention", "Tracking history retained for 24 months with nightly backup"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel
            title="Data security"
            action={<ShieldCheck className="size-3.5 text-muted-foreground" aria-hidden />}
          >
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>Every account has one role, and access rules are enforced on the server.</li>
              <li>Hub staff can only reach data for their own hub.</li>
              <li>Ministry accounts can read national data but change nothing.</li>
              <li>All actions are written to the Activity Log for audit.</li>
              <li>Traffic is encrypted in transit and data is encrypted at rest.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
