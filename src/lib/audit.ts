import { supabase } from "@/integrations/supabase/client";

export type AuditEntry = {
  action: string;
  entity: string;
  entity_ref?: string | null;
  hub_id?: number | null;
  detail?: string | null;
};

/**
 * Records an activity-log entry. Failures are swallowed on purpose: an audit
 * write must never block the operational action the user just performed.
 */
export async function logAudit(
  actor: { id: string; email: string } | null | undefined,
  entry: AuditEntry,
) {
  if (!actor) return;
  await supabase.from("audit_log").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    action: entry.action,
    entity: entry.entity,
    entity_ref: entry.entity_ref ?? null,
    hub_id: entry.hub_id ?? null,
    detail: entry.detail ?? null,
  });
}
