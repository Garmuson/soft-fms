import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoUsers } from "@/lib/demo.functions";
import { btn, inputCls } from "@/components/kit";
import { ROLE_HOME, type Role } from "@/lib/fleet";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · YM-FMS Fleet Command" },
      {
        name: "description",
        content:
          "Sign in to YM-FMS — fleet management for 285 Yellow Machines across 19 hubs, Republic of Liberia.",
      },
      { property: "og:title", content: "Sign in · YM-FMS Fleet Command" },
      {
        property: "og:description",
        content: "Role-based access for HQ, hub supervisors, field operators and ministry analysts.",
      },
    ],
  }),
  component: AuthPage,
});

const DEMO = [
  { email: "hq@sppcc.gov.lr", label: "HQ Administrator" },
  { email: "hub2@sppcc.gov.lr", label: "Hub 2 Supervisor (Nimba)" },
  { email: "hub10@sppcc.gov.lr", label: "Hub 10 Supervisor (Rivercess)" },
  { email: "operator@sppcc.gov.lr", label: "Field Operator (Hub 2)" },
  { email: "ministry@sppcc.gov.lr", label: "Ministry Analyst" },
  { email: "dataentry@sppcc.gov.lr", label: "Data Entry Supervisor (all hubs)" },
  { email: "dataclerk@sppcc.gov.lr", label: "Data Entry Staff (Hub 2)" },
];

function AuthPage() {
  const navigate = useNavigate();
  const provision = useServerFn(ensureDemoUsers);
  const [email, setEmail] = useState("hq@sppcc.gov.lr");
  const [password, setPassword] = useState("password123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function goHome() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: r } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();
    const role = (r?.role as Role | undefined) ?? "ministry_analyst";
    await supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", data.user.id);
    navigate({ to: ROLE_HOME[role], replace: true });
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    let res = await supabase.auth.signInWithPassword({ email, password });
    if (res.error && email.endsWith("@sppcc.gov.lr")) {
      // First run: provision the demo accounts, then retry.
      await provision({});
      res = await supabase.auth.signInWithPassword({ email, password });
    }
    setBusy(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    toast.success("Signed in to YM-FMS");
    if (res.data.user) {
      void logAudit(
        { id: res.data.user.id, email: res.data.user.email ?? email },
        { action: "signed in", entity: "session", detail: "Email and password" },
      );
    }
    await goHome();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-border bg-surface md:grid md:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-border bg-[linear-gradient(160deg,#1b4332_0%,#0d1117_75%)] p-8 md:flex">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-md bg-green-dim text-lg">🚜</span>
              <div>
                <p className="text-sm font-semibold tracking-tight">YM-FMS</p>
                <p className="text-[11px] text-muted-foreground">
                  Yellow Machine Fleet Management System
                </p>
              </div>
            </div>
            <p className="mt-8 text-sm leading-relaxed text-foreground">
              Fleet management system for 285 Yellow Machines across 19 hubs — Republic of Liberia
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Special Presidential Projects Coordinating Committee (SPPCC)
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            {[
              ["285", "Machines"],
              ["19", "Hubs"],
              ["15", "Counties"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-md border border-border bg-surface/60 py-2">
                <dt className="num text-lg text-gold">{v}</dt>
                <dd className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="p-6 sm:p-8">
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Use your SPPCC email address and password.
          </p>
          <form onSubmit={signIn} className="mt-5 space-y-3">
            <div>
              <label htmlFor="email" className="mb-1 block text-[11px] text-muted-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-[11px] text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="rounded-md border border-red/40 bg-red-dim/40 px-2.5 py-1.5 text-[11px] text-red">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className={`${btn.primary} w-full justify-center py-2`}>
              {busy ? "Signing in…" : "Sign in to Fleet Command"}
            </button>
          </form>

          <div className="mt-5 rounded-md border border-border bg-surface-2 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              Demo accounts · password123
            </p>
            <ul className="mt-2 space-y-1">
              {DEMO.map((d) => (
                <li key={d.email}>
                  <button
                    onClick={() => {
                      setEmail(d.email);
                      setPassword("password123");
                    }}
                    className="num w-full rounded px-1 py-0.5 text-left text-[11px] text-foreground hover:bg-surface"
                  >
                    {d.email}
                    <span className="ml-1 font-sans text-muted-foreground">— {d.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Powered by Soft Solutions and Systems · www.softechsys.com · Monrovia, Liberia
      </p>
    </div>
  );
}
