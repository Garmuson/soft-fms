/**
 * Monitoring thresholds used for speeding and prolonged-idling detection.
 * Stored in the browser so a supervisor can tune them during a demo without a
 * schema change; defaults match the SPPCC operating guidance.
 */
export type Thresholds = {
  speedLimitKmh: number;
  idleMinutes: number;
  gpsStaleMinutes: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  speedLimitKmh: 40,
  idleMinutes: 30,
  gpsStaleMinutes: 2,
};

const KEY = "ymfms.thresholds";

export function readThresholds(): Thresholds {
  if (typeof window === "undefined") return DEFAULT_THRESHOLDS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_THRESHOLDS;
    return { ...DEFAULT_THRESHOLDS, ...(JSON.parse(raw) as Partial<Thresholds>) };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export function writeThresholds(t: Thresholds) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(t));
}

export type TrackPoint = { lat: number; lng: number; speed_kmh: number; recorded_at: string };

export type MachineBehaviour = {
  topSpeed: number;
  speedingPoints: number;
  idleMinutes: number;
  longestIdleMinutes: number;
  movingMinutes: number;
};

/**
 * Derives speeding and idling figures from raw GPS points. A point counts as
 * idling when the engine is reporting but the machine is barely moving.
 */
export function analyseTrack(points: TrackPoint[], t: Thresholds): MachineBehaviour {
  const sorted = [...points].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  let topSpeed = 0;
  let speedingPoints = 0;
  let idleMinutes = 0;
  let movingMinutes = 0;
  let longestIdleMinutes = 0;
  let currentIdle = 0;

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i]!;
    const speed = Number(p.speed_kmh);
    topSpeed = Math.max(topSpeed, speed);
    if (speed > t.speedLimitKmh) speedingPoints++;
    const next = sorted[i + 1];
    const gapMin = next
      ? Math.min(
          60,
          (new Date(next.recorded_at).getTime() - new Date(p.recorded_at).getTime()) / 60000,
        )
      : 0;
    if (speed < 2) {
      idleMinutes += gapMin;
      currentIdle += gapMin;
      longestIdleMinutes = Math.max(longestIdleMinutes, currentIdle);
    } else {
      movingMinutes += gapMin;
      currentIdle = 0;
    }
  }

  return {
    topSpeed: Math.round(topSpeed),
    speedingPoints,
    idleMinutes: Math.round(idleMinutes),
    longestIdleMinutes: Math.round(longestIdleMinutes),
    movingMinutes: Math.round(movingMinutes),
  };
}
