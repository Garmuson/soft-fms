import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import type { MapFence, MapHub, MapMachine } from "./FleetMap";

const FleetMap = lazy(() => import("./FleetMap"));

export function MapPanel(props: {
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
  const fallback = (
    <div
      className="skeleton w-full"
      style={{ height: props.height ?? 460 }}
      aria-label="Loading map"
    />
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <FleetMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
