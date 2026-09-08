import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, X } from "lucide-react";
import { hubsQuery, profilesQuery, rolesQuery } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  PageHeader,
  Panel,
  SkeletonTable,
  btn,
  inputCls,
} from "@/components/kit";
import { RoleGate } from "@/components/RoleGate";
import { ROLE_LABEL, type Role, timeAgo } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "User Management · YM-FMS" },
      {
        name: "description",
        content: "Manage SPPCC administrators, hub supervisors, field operators and ministry analysts.",
      },
      { property: "og:title", content: "User Management · YM-FMS" },
      { property: "og:description", content: "Invite and manage YM-FMS system users." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin"]}>
      <UsersPage />
    </RoleGate>
  ),
});

const ROLE_DESC: Record<Role, string> = {
  hq_admin: "Full fleet-wide access to all 19 hubs and every module.",
  hub_supervisor: "Access limited strictly to one assigned hub.",
  field_operator: "Mobile access to their own assigned machines only.",
  ministry_analyst: "Read-only national overview and reports.",
  data_entry_supervisor:
    "Reviews and approves records entered by hub data entry staff, nationwide.",
  data_entry_staff: "Enters fuel, maintenance, driver and project data for one assigned hub.",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UsersPage() {
  const qc = useQueryClient();
  const profilesQ = useQuery(profilesQuery());
  const { data: roles = [] } = useQuery(rolesQuery());
  const { data: hubs = [] } = useQuery(hubsQuery());
  const [invite, setInvite] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", role: "hub_supervisor" as Role, hub_id: "" });

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from("profiles").update({ is_active: !active }).eq("id", id);
    if (error) toast.error("Update failed", { description: error.message });
    else {
      toast.success(active ? "User deactivated" : "User reactivated");
      qc.invalidateQueries({ queryKey: ["profiles"] });
    }
  }

  async function sendInvite() {
    if (!form.full_name || !form.email) {
      toast.error("Name and email are required");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: form.full_name,
          role: form.role,
          hub_id: form.hub_id ? Number(form.hub_id) : null,
        },
      },
    });
    if (error) toast.error("Invite could not be sent", { description: error.message });
    else {
      toast.success("Invitation sent", { description: `${form.email} will receive a sign-in link.` });
      setInvite(false);
      setForm({ full_name: "", email: "", role: "hub_supervisor", hub_id: "" });
    }
  }

  const rows = profilesQ.data ?? [];

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle={`${rows.length} accounts`}
        actions={
          <button className={btn.primary} onClick={() => setInvite(true)}>
            Invite User
          </button>
        }
      />

      <Panel className="overflow-hidden">
        {profilesQ.isLoading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Users className="size-4" />}
            title="No users yet"
            message="Invite your first hub supervisor to get started."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["User", "Email", "Role", "Hub", "Last Login", "Status", ""].map((h) => (
                    <th key={h} className="px-2 py-2 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const role = (roles.find((r) => r.user_id === u.id)?.role ?? "field_operator") as Role;
                  return (
                    <tr key={u.id} className="border-b border-border hover:bg-surface-2">
                      <td className="px-2 py-2">
                        <span className="flex items-center gap-2">
                          <span className="num grid size-7 place-items-center rounded-full bg-green-dim text-[10px] text-teal">
                            {initials(u.full_name)}
                          </span>
                          {u.full_name}
                        </span>
                      </td>
                      <td className="num px-2 py-2 text-muted-foreground">{u.email}</td>
                      <td className="px-2 py-2">
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px]">
                          {ROLE_LABEL[role]}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {u.hub_id ? hubs.find((h) => h.id === u.hub_id)?.name : "—"}
                      </td>
                      <td className="num px-2 py-2 text-muted-foreground">{timeAgo(u.last_login)}</td>
                      <td className="px-2 py-2">
                        <span className={u.is_active ? "text-teal" : "text-muted-foreground"}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          className="text-blue hover:underline"
                          onClick={() => toggleActive(u.id, u.is_active)}
                        >
                          {u.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {invite && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-surface">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Invite User</h2>
              <button onClick={() => setInvite(false)} aria-label="Close invite dialog">
                <X className="size-4 text-muted-foreground" />
              </button>
            </header>
            <div className="space-y-3 p-4">
              <label className="block text-[10px] text-muted-foreground">
                Full name
                <input
                  className={inputCls}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </label>
              <label className="block text-[10px] text-muted-foreground">
                Email
                <input
                  type="email"
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <fieldset className="space-y-1.5">
                <legend className="text-[10px] text-muted-foreground">Role</legend>
                {(Object.keys(ROLE_DESC) as Role[]).map((r) => (
                  <label
                    key={r}
                    className="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2 text-xs hover:border-border-hover"
                  >
                    <input
                      type="radio"
                      name="role"
                      checked={form.role === r}
                      onChange={() => setForm({ ...form, role: r })}
                      className="mt-0.5"
                    />
                    <span>
                      {ROLE_LABEL[r]}
                      <span className="block text-[10px] text-muted-foreground">{ROLE_DESC[r]}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              {(form.role === "hub_supervisor" || form.role === "field_operator") && (
                <label className="block text-[10px] text-muted-foreground">
                  Hub assignment
                  <select
                    className={inputCls}
                    value={form.hub_id}
                    onChange={(e) => setForm({ ...form, hub_id: e.target.value })}
                  >
                    <option value="">Select hub…</option>
                    {hubs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} — {h.county}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button className={`${btn.primary} w-full justify-center`} onClick={sendInvite}>
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
