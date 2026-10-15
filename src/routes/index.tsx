import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_HOME, type Role } from "@/lib/fleet";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [
    { title: "YM-FMS · Fleet Management" },
    { name: "description", content: "SPPCC Liberia fleet management for 285 machines across 19 hubs." },
    { property: "og:title", content: "YM-FMS · Fleet Management" },
    { property: "og:description", content: "Machine assignments, hub fuel and fleet operations for SPPCC Liberia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: r } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();
    const role = (r?.role as Role | undefined) ?? "ministry_analyst";
    throw redirect({ to: ROLE_HOME[role] });
  },
  component: () => null,
});
