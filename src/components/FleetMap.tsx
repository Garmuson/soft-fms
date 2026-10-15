import "leaflet/dist/leaflet.css";
import { useState } from "react";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { profilesQuery, projectsQuery } from "@/lib/api";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Rectangle,
  useMapEvents,
} from "react-leaflet";
import { STATUS_HEX, statusLabel, timeAgo, typeLabel } from "@/lib/fleet";

export type MapMachine = {
  id: string;
  unit_id: string;
  type: string;
  status: string;
  fuel_level: number;
  lat: number | null;
  lng: number | null;
  last_seen: string;
  operator?: string | null;
  hub_name?: string | null;
  operator_id?: string | null;
  current_project_id?: string | null;
};

export type MapHub = { id: number; name: string; lat_center: number; lng_center: number };

export type MapFence = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  is_active: boolean;
};

function ClickCatcher({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function FleetMap({
  machines,
  hubs = [],
  center = [6.35, -9.4],
  zoom = 7,
  height = 460,
  track,
  fences = [],
  pin,
  onMapClick,
  onSelect,
}: {
  machines: MapMachine[];
  hubs?: MapHub[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  track?: { points: [number, number][] };
  fences?: MapFence[];
  pin?: { lat: number; lng: number; label?: string } | undefined;
  onMapClick?: (lat: number, lng: number) => void;
  onSelect?: (unitId: string) => void;
}) {
  const [selId, setSelId] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const { data: profiles = [] } = useQuery(profilesQuery());
  const { data: projects = [] } = useQuery(projectsQuery());
  const sel = machines.find((m) => m.id === selId) ?? null;
  const opName = (m: MapMachine) =>
    m.operator ?? profiles.find((p) => p.id === m.operator_id)?.full_name ?? "Unassigned";
  const projName = (m: MapMachine) =>
    projects.find((p) => p.id === m.current_project_id)?.name ?? "None";
  return (
    <div className="relative overflow-hidden rounded-lg border border-border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        preferCanvas
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-dark-tiles"
        />
        {onMapClick && <ClickCatcher onMapClick={onMapClick} />}
        {hubs.map((h) => (
          <Rectangle
            key={h.id}
            bounds={[
              [Number(h.lat_center) - 0.16, Number(h.lng_center) - 0.16],
              [Number(h.lat_center) + 0.16, Number(h.lng_center) + 0.16],
            ]}
            pathOptions={{ color: "rgba(242,194,0,0.4)", fillColor: "#F2C200", weight: 1, fillOpacity: 0.08, dashArray: "3 4" }}
          />
        ))}
        {fences.map((f) => (
          <Circle
            key={f.id}
            center={[Number(f.lat), Number(f.lng)]}
            radius={Number(f.radius_m)}
            pathOptions={{
              color: f.is_active ? "#388bfd" : "#7d8590",
              weight: 1.5,
              fillOpacity: 0.08,
              dashArray: f.is_active ? undefined : "4 4",
            }}
          >
            <Popup>
              <div className="space-y-0.5 text-xs">
                <p className="font-medium text-foreground">{f.name}</p>
                <p className="num text-muted-foreground">{Math.round(f.radius_m)} m radius</p>
                <p className="text-muted-foreground">{f.is_active ? "Active" : "Switched off"}</p>
              </div>
            </Popup>
          </Circle>
        ))}
        {track && track.points.length > 1 && (
          <Polyline positions={track.points} pathOptions={{ color: "#2ea043", weight: 3 }} />
        )}
        {pin && (
          <CircleMarker
            center={[Number(pin.lat), Number(pin.lng)]}
            radius={8}
            pathOptions={{ color: "#F2C200", fillColor: "#F2C200", fillOpacity: 0.9, weight: 2 }}
          >
            {pin.label && <Popup>{pin.label}</Popup>}
          </CircleMarker>
        )}
        {machines
          .filter((m) => m.lat != null && m.lng != null)
          .map((m) => (
            <CircleMarker
              key={m.id}
              center={[Number(m.lat), Number(m.lng)]}
              radius={selId === m.id ? 9 : 6}
              bubblingMouseEvents={false}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  e.originalEvent?.stopPropagation();
                  setSelId(m.id);
                },
              }}
              pathOptions={{
                color: "#F2C200",
                fillColor: STATUS_HEX[m.status] ?? "#888888",
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
            </CircleMarker>
          ))}
      </MapContainer>
      {sel && (
        <aside
          className="fixed inset-x-0 bottom-0 z-[1000] max-h-[70vh] overflow-y-auto rounded-t-2xl border pb-[calc(1rem+env(safe-area-inset-bottom))] sm:absolute sm:pb-3 sm:rounded-lg sm:max-h-[80%] border-border bg-surface p-3 text-xs shadow-lg sm:inset-x-auto sm:bottom-auto sm:right-2 sm:top-2 sm:w-72"
          aria-label={`Details for ${sel.unit_id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="num text-sm font-semibold text-gold">{sel.unit_id}</p>
              <p className="text-muted-foreground">{typeLabel(sel.type)}</p>
            </div>
            <button onClick={() => setSelId(null)} aria-label="Close details">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ background: `${STATUS_HEX[sel.status] ?? "#888"}33`, color: STATUS_HEX[sel.status] }}
              >
                {statusLabel(sel.status)}
              </span>
            </dd>
            <dt className="text-muted-foreground">Operator</dt>
            <dd>{opName(sel)}</dd>
            <dt className="text-muted-foreground">Hub</dt>
            <dd>{sel.hub_name ?? "—"}</dd>
            <dt className="text-muted-foreground">Project</dt>
            <dd>{projName(sel)}</dd>
            <dt className="text-muted-foreground">Fuel</dt>
            <dd className="flex items-center gap-2">
              <span className="h-1.5 w-20 overflow-hidden rounded-sm bg-border">
                <span className="block h-full" style={{ width: `${sel.fuel_level}%`, background: sel.fuel_level < 25 ? "#da3633" : "#2ea043" }} />
              </span>
              <span className="num">{sel.fuel_level}%</span>
            </dd>
            <dt className="text-muted-foreground">Last seen</dt>
            <dd className="num">{new Date(sel.last_seen).toLocaleString()} ({timeAgo(sel.last_seen)})</dd>
            <dt className="text-muted-foreground">GPS</dt>
            <dd className="num">
              {Number(sel.lat).toFixed(5)}, {Number(sel.lng).toFixed(5)}
            </dd>
          </dl>
          {onSelect && (
            <button className="mt-3 text-blue underline" onClick={() => onSelect(sel.unit_id)}>
              Open full machine record
            </button>
          )}
        </aside>
      )}
      <div className="absolute bottom-2 left-2 z-[500] rounded-md border border-border bg-surface/95 px-2 py-1.5 text-[10px] sm:pointer-events-none sm:left-auto sm:right-2">
        <button type="button" className="flex min-h-9 items-center gap-1 text-sm font-medium sm:hidden" onClick={() => setLegendOpen((o) => !o)} aria-expanded={legendOpen}>
          Legend {legendOpen ? "▾" : "▸"}
        </button>
        <div className={legendOpen ? "block" : "hidden sm:block"}>
          {["active", "idle", "alert", "maintenance", "offline"].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: STATUS_HEX[s] }} />
              <span className="text-muted-foreground">{statusLabel(s)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
