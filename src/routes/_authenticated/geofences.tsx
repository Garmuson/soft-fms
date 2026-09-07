import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Trash2 } from "lucide-react";
import { geofencesQuery, hubsQuery, machinesQuery, type Geofence } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  EmptyState,
  PageHeader,
  Panel,
  SkeletonTable,
  btn,
  inputCls,
} from "@/components/kit";
import { MapPanel } from "@/components/MapPanel";
import { RoleGate } from "@/components/RoleGate";
import { useAuth } from "@/hooks/use-auth";
import { logAudit } from "@/lib/audit";
import { fmtDate } from "@/lib/fleet";

export const Route = createFileRoute("/_authenticated/geofences")({
  head: () => ({
    meta: [
      { title: "Geofences · YM-FMS" },
      {
        name: "description",
        content:
          "Draw and manage geofenced work zones for SPPCC hubs, with entry and exit alerting for every Yellow Machine.",
      },
      { property: "og:title", content: "Geofences · YM-FMS" },
      { property: "og:description", content: "Zone management and unauthorised-movement alerting." },
    ],
  }),
  component: () => (
    <RoleGate allow={["hq_admin", "hub_supervisor", "ministry_analyst"]}>
      <GeofencesPage />
    </RoleGate>
  ),
});

function fenceCentre(g: Geofence) {
  const p = (g.polygon_json ?? {}) as { lat?: number; lng?: number; radius_m?: number };
  return {
    lat: Number(p.lat ?? 6.3),
    lng: Number(p.lng ?? -9.4),
    radius_m: Number(p.radius_m ?? 10000),
  };
}

function GeofencesPage() {
  const { role, hubId, profile, readOnly } = useAuth();
  const qc = useQueryClient();
  const scope = role === "hub_supervisor" ? hubId : null;

  const fencesQ = useQuery(geofencesQuery(scope));
  const { data: hubs = [] } = useQuery(hubsQuery());
  const { data: machines = [] } = useQuery(machinesQuery(scope));

  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    name: string;
    hub_id: number | "";
    lat: string;
    lng: string;
    radius_m: string;
    alert_on_exit: boolean;
    alert_on_entry: boolean;
  }>({
    name: "",
    hub_id: scope ?? "",
    lat: "",
    lng: "",
    radius_m: "10000",
    alert_on_exit: true,
    alert_on_entry: false,
  });

  const fences = fencesQ.data ?? [];
  const mapFences = useMemo(
    () =>
      fences.map((f) => ({
        id: f.id,
        name: f.name,
        is_active: f.is_active,
        ...fenceCentre(f),
      })),
    [fences],
  );

  const canEdit = !readOnly && role !== "ministry_analyst";
  const focus = fences.find((f) => f.id === selected);
  const centre = focus
    ? ([fenceCentre(focus).lat, fenceCentre(focus).lng] as [number, number])
    : ([6.35, -9.4] as [number, number]);

  async function createFence() {
    const hub = draft.hub_id === "" ? scope : Number(draft.hub_id);
    if (!draft.name.trim() || !hub || !draft.lat || !draft.lng) {
      toast.error("Add a zone name, hub and a point on the map");
      return;
    }
    const { error } = await supabase.from("geofences").insert({
      name: draft.name.trim(),
      hub_id: hub,
      polygon_json: {
        type: "circle",
        lat: Number(draft.lat),
        lng: Number(draft.lng),
        radius_m: Number(draft.radius_m),
      },
      alert_on_exit: draft.alert_on_exit,
      alert_on_entry: draft.alert_on_entry,
      is_active: true,
      created_by: profile?.id ?? null,
    });
    if (error) {
      toast.error("Could not save this zone", { description: error.message });
      return;
    }
    toast.success(`Zone “${draft.name}” created`);
    void logAudit(profile, {
      action: "created",
      entity: "geofence",
      entity_ref: draft.name.trim(),
      hub_id: hub,
      detail: `${draft.radius_m} m radius`,
    });
    setDraft((d) => ({ ...d, name: "", lat: "", lng: "" }));
    qc.invalidateQueries({ queryKey: ["geofences"] });
  }

  async function toggle(f: Geofence) {
    const { error } = await supabase
      .from("geofences")
      .update({ is_active: !f.is_active })
      .eq("id", f.id);
    if (error) {
      toast.error("Could not change this zone", { description: error.message });
      return;
    }
    toast.success(`${f.name} ${f.is_active ? "switched off" : "switched on"}`);
    void logAudit(profile, {
      action: f.is_active ? "deactivated" : "activated",
      entity: "geofence",
      entity_ref: f.name,
      hub_id: f.hub_id,
    });
    qc.invalidateQueries({ queryKey: ["geofences"] });
  }

  async function updateAlerts(f: Geofence, patch: Partial<Geofence>) {
    const { error } = await supabase.from("geofences").update(patch).eq("id", f.id);
    if (error) toast.error("Could not update alerting", { description: error.message });
    else qc.invalidateQueries({ queryKey: ["geofences"] });
  }

  async function remove(f: Geofence) {
    const { error } = await supabase.from("geofences").delete().eq("id", f.id);
    if (error) {
      toast.error("Could not remove this zone", { description: error.message });
      return;
    }
    toast.success(`${f.name} removed`);
    void logAudit(profile, {
      action: "deleted",
      entity: "geofence",
      entity_ref: f.name,
      hub_id: f.hub_id,
    });
    qc.invalidateQueries({ queryKey: ["geofences"] });
  }

  return (
    <>
      <PageHeader
        title="Geofences"
        subtitle={
          scope
            ? "Work zones for your hub — exits raise an alert immediately"
            : "Work zones across all 19 hubs — exits and entries raise alerts"
        }
      />

      <div className="grid gap-4 lg:grid-cols-[6fr_4fr]">
        <Panel title="Zone map">
          <MapPanel
            machines={machines.map((m) => ({
              ...m,
              hub_name: hubs.find((h) => h.id === m.hub_id)?.name ?? null,
            }))}
            fences={mapFences}
            center={centre}
            zoom={focus ? 10 : 7}
            height={430}
            {...(canEdit
              ? {
                  onMapClick: (lat: number, lng: number) =>
                    setDraft((d) => ({ ...d, lat: lat.toFixed(5), lng: lng.toFixed(5) })),
                }
              : {})}
            {...(draft.lat && draft.lng
              ? {
                  pin: {
                    lat: Number(draft.lat),
                    lng: Number(draft.lng),
                    label: "New zone centre",
                  },
                }
              : {})}
          />
          {canEdit && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Tap the map to place the centre of a new zone, then name it on the right.
            </p>
          )}
        </Panel>

        {canEdit ? (
          <Panel title="New zone">
            <div className="space-y-2">
              <input
                className={inputCls}
                placeholder="Zone name, e.g. Gbarnga Corridor"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                aria-label="Zone name"
              />
              {!scope && (
                <select
                  className={inputCls}
                  value={draft.hub_id}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      hub_id: e.target.value ? Number(e.target.value) : "",
                    }))
                  }
                  aria-label="Hub"
                >
                  <option value="">Select hub…</option>
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.county}
                    </option>
                  ))}
                </select>
              )}
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  placeholder="Latitude"
                  value={draft.lat}
                  onChange={(e) => setDraft((d) => ({ ...d, lat: e.target.value }))}
                  aria-label="Latitude"
                />
                <input
                  className={inputCls}
                  placeholder="Longitude"
                  value={draft.lng}
                  onChange={(e) => setDraft((d) => ({ ...d, lng: e.target.value }))}
                  aria-label="Longitude"
                />
              </div>
              <label className="block text-[11px] text-muted-foreground">
                Radius: <span className="num text-foreground">{draft.radius_m} m</span>
                <input
                  type="range"
                  min={500}
                  max={30000}
                  step={500}
                  value={draft.radius_m}
                  onChange={(e) => setDraft((d) => ({ ...d, radius_m: e.target.value }))}
                  className="mt-1 w-full accent-[#2ea043]"
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={draft.alert_on_exit}
                  onChange={(e) => setDraft((d) => ({ ...d, alert_on_exit: e.target.checked }))}
                />
                Alert when a machine leaves the zone
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={draft.alert_on_entry}
                  onChange={(e) => setDraft((d) => ({ ...d, alert_on_entry: e.target.checked }))}
                />
                Alert when a machine enters the zone
              </label>
              <button className={btn.primary} onClick={createFence}>
                Create zone
              </button>
            </div>
          </Panel>
        ) : (
          <Panel title="Read-only view">
            <p className="text-xs text-muted-foreground">
              Ministry accounts can review every zone and its alerting rules but cannot change them.
            </p>
          </Panel>
        )}
      </div>

      <Panel title={`Zones (${fences.length})`} className="mt-4">
        {fencesQ.isLoading ? (
          <SkeletonTable rows={6} cols={6} />
        ) : fences.length === 0 ? (
          <EmptyState
            icon={<MapPin className="size-4" />}
            title="No zones yet"
            message="Place a point on the map and create your first work zone."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b border-border">
                  {["Zone", "Hub", "Radius", "Exit alert", "Entry alert", "Created", "State", ""].map(
                    (h) => (
                      <th key={h} className="px-2 py-2 font-medium">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {fences.map((f) => {
                  const c = fenceCentre(f);
                  const hub = hubs.find((h) => h.id === f.hub_id);
                  return (
                    <tr
                      key={f.id}
                      className={
                        selected === f.id
                          ? "border-b border-border bg-surface-2"
                          : "border-b border-border hover:bg-surface-2"
                      }
                    >
                      <td className="px-2 py-2">
                        <button className="text-blue hover:underline" onClick={() => setSelected(f.id)}>
                          {f.name}
                        </button>
                      </td>
                      <td className="px-2 py-2">{hub?.name ?? "—"}</td>
                      <td className="num px-2 py-2">{(c.radius_m / 1000).toFixed(1)} km</td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={f.alert_on_exit}
                          disabled={!canEdit}
                          onChange={(e) => updateAlerts(f, { alert_on_exit: e.target.checked })}
                          aria-label={`Exit alert for ${f.name}`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={f.alert_on_entry}
                          disabled={!canEdit}
                          onChange={(e) => updateAlerts(f, { alert_on_entry: e.target.checked })}
                          aria-label={`Entry alert for ${f.name}`}
                        />
                      </td>
                      <td className="num px-2 py-2 text-muted-foreground">{fmtDate(f.created_at)}</td>
                      <td className="px-2 py-2">
                        {canEdit ? (
                          <button
                            className={f.is_active ? "text-teal hover:underline" : "text-muted-foreground hover:underline"}
                            onClick={() => toggle(f)}
                          >
                            {f.is_active ? "Active" : "Off"}
                          </button>
                        ) : (
                          <span className={f.is_active ? "text-teal" : "text-muted-foreground"}>
                            {f.is_active ? "Active" : "Off"}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {canEdit && (
                          <button onClick={() => remove(f)} aria-label={`Remove ${f.name}`}>
                            <Trash2 className="size-3.5 text-muted-foreground hover:text-red" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
