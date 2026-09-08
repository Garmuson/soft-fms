import { createServerFn } from "@tanstack/react-start";

type Role =
  | "hq_admin"
  | "hub_supervisor"
  | "field_operator"
  | "ministry_analyst"
  | "data_entry_supervisor"
  | "data_entry_staff";

const DEMO_USERS: { email: string; name: string; role: Role; hub: number | null }[] = [
  { email: "hq@sppcc.gov.lr", name: "SPPCC Administrator", role: "hq_admin", hub: null },
  { email: "hub2@sppcc.gov.lr", name: "Hub 2 Supervisor", role: "hub_supervisor", hub: 2 },
  { email: "hub10@sppcc.gov.lr", name: "Hub 10 Supervisor", role: "hub_supervisor", hub: 10 },
  { email: "operator@sppcc.gov.lr", name: "Field Operator", role: "field_operator", hub: 2 },
  { email: "ministry@sppcc.gov.lr", name: "Ministry Analyst", role: "ministry_analyst", hub: null },
  {
    email: "dataentry@sppcc.gov.lr",
    name: "Data Entry Supervisor",
    role: "data_entry_supervisor",
    hub: null,
  },
  {
    email: "dataclerk@sppcc.gov.lr",
    name: "Data Entry Staff — Hub 2",
    role: "data_entry_staff",
    hub: 2,
  },
];

const PASSWORD = "password123";

/**
 * Idempotently provisions the five fixed demo accounts described in the
 * project brief. Only this hard-coded list can ever be created.
 */
export const ensureDemoUsers = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const byEmail = new Map((existing?.users ?? []).map((u) => [u.email?.toLowerCase(), u]));
  const ids: Record<string, string> = {};

  for (const demo of DEMO_USERS) {
    let id = byEmail.get(demo.email)?.id;
    if (!id) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: demo.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: demo.name },
      });
      if (error || !data.user) continue;
      id = data.user.id;
    } else {
      await supabaseAdmin.auth.admin.updateUserById(id, { password: PASSWORD });
    }
    ids[demo.email] = id;

    await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id,
          email: demo.email,
          full_name: demo.name,
          hub_id: demo.hub,
          is_active: true,
        },
        { onConflict: "id" },
      )
      .select();

    await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
    await supabaseAdmin.from("user_roles").insert({ user_id: id, role: demo.role });

    if (demo.role === "hub_supervisor" && demo.hub) {
      await supabaseAdmin.from("hubs").update({ supervisor_id: id }).eq("id", demo.hub);
    }
  }

  // Give the field operator a shift: assign four Hub 2 machines + work orders.
  const operatorId = ids["operator@sppcc.gov.lr"];
  if (operatorId) {
    const { data: hubMachines } = await supabaseAdmin
      .from("machines")
      .select("id, unit_id")
      .eq("hub_id", 2)
      .in("status", ["active", "idle"])
      .limit(4);

    const machineIds = (hubMachines ?? []).map((m) => m.id);
    if (machineIds.length) {
      await supabaseAdmin.from("machines").update({ operator_id: operatorId }).in("id", machineIds);

      const { count } = await supabaseAdmin
        .from("work_orders")
        .select("id", { count: "exact", head: true })
        .eq("operator_id", operatorId);

      if (!count) {
        const titles = [
          "Grade 3km section — Ganta approach",
          "Haul laterite to km 12 stockpile",
          "Compact shoulder — east carriageway",
        ];
        await supabaseAdmin.from("work_orders").insert(
          titles.map((title, i) => ({
            hub_id: 2,
            machine_id: machineIds[i % machineIds.length]!,
            operator_id: operatorId,
            title,
            description: "Assigned by hub supervisor for today's shift.",
            status: i === 0 ? ("in_progress" as const) : ("assigned" as const),
            priority: i === 2 ? ("high" as const) : ("medium" as const),
            scheduled_date: new Date().toISOString().slice(0, 10),
          })),
        );
      }
    }
  }

  return { ok: true, accounts: DEMO_USERS.map((d) => d.email) };
});
