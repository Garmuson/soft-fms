import "leaflet/dist/leaflet.css";
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
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
              radius={5}
              pathOptions={{
                color: "#F2C200",
                fillColor: STATUS_HEX[m.status] ?? "#888888",
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-1 text-xs">
                  <p className="num text-sm font-medium text-foreground">{m.unit_id}</p>
                  <p className="text-muted-foreground">{typeLabel(m.type)}</p>
                  <p>
                    Status: <span style={{ color: STATUS_HEX[m.status] }}>{statusLabel(m.status)}</span>
                  </p>
                  {m.hub_name && <p className="text-muted-foreground">{m.hub_name}</p>}
                  <p className="text-muted-foreground">Operator: {m.operator ?? "Unassigned"}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Fuel</span>
                    <span className="h-1 w-16 overflow-hidden rounded-sm bg-border">
                      <span
                        className="block h-full"
                        style={{ width: `${m.fuel_level}%`, background: "#2ea043" }}
                      />
                    </span>
                    <span className="num">{m.fuel_level}%</span>
                  </div>
                  <p className="num text-muted-foreground">Seen {timeAgo(m.last_seen)}</p>
                  {onSelect && (
                    <button
                      className="mt-1 text-blue underline"
                      onClick={() => onSelect(m.unit_id)}
                    >
                      View details
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
      <div className="pointer-events-none absolute bottom-2 right-2 z-[500] rounded-md border border-border bg-surface/95 px-2 py-1.5 text-[10px]">
        {["active", "idle", "alert", "maintenance", "offline"].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: STATUS_HEX[s] }} />
            <span className="text-muted-foreground">{statusLabel(s)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
