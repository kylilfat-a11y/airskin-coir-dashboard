import type { SystemStatePayload, TelemetryPoint } from '../types/airskin';

export function buildClientSimulationPoint(
  stepIndex: number,
  basePm25: number,
  basePm10: number,
  effPm25Pct: number,
  effPm10Pct: number,
  timestampIso: string,
): TelemetryPoint {
  const drift = Math.sin(stepIndex * 0.45) * 3.0 + Math.cos(stepIndex * 0.22) * 1.6;
  const pm25In = Number(Math.max(2, basePm25 + drift).toFixed(1));
  const pm10In = Number(Math.max(4, basePm10 + drift * 1.3).toFixed(1));

  const eff25 = Math.max(0, Math.min(99, effPm25Pct)) / 100;
  const eff10 = Math.max(0, Math.min(99, effPm10Pct)) / 100;

  const pm25Out = Number(Math.max(0.5, pm25In * (1 - eff25)).toFixed(1));
  const pm10Out = Number(Math.max(0.5, pm10In * (1 - eff10)).toFixed(1));

  return {
    id: `sim-local-${Date.now()}-${stepIndex}`,
    timestamp: timestampIso,
    pm25Inlet: pm25In,
    pm25Outlet: pm25Out,
    pm10Inlet: pm10In,
    pm10Outlet: pm10Out,
    source: 'simulasi',
  };
}

export function seedClientSimulation(
  basePm25 = 62.0,
  basePm10 = 98.0,
  effPm25Pct = 45.0,
  effPm10Pct = 55.0,
): TelemetryPoint[] {
  const now = Date.now();
  const offsetsMs = [
    20 * 3600_000,
    12 * 3600_000,
    5 * 3600_000,
    3 * 3600_000,
    90 * 60_000,
    45 * 60_000,
    30 * 60_000,
    20 * 60_000,
    10 * 60_000,
    5 * 60_000,
    2 * 60_000,
    60_000,
  ];
  return offsetsMs.map((offset, i) =>
    buildClientSimulationPoint(
      i,
      basePm25,
      basePm10,
      effPm25Pct,
      effPm10Pct,
      new Date(now - offset).toISOString(),
    ),
  );
}

export function createInitialClientState(): SystemStatePayload {
  const seeded = seedClientSimulation(62.0, 98.0, 45.0, 55.0);
  const startedAt = seeded[0]?.timestamp || new Date().toISOString();
  const lastUpdatedAt = seeded[seeded.length - 1]?.timestamp || startedAt;

  return {
    dataSourceMode: 'simulasi',
    deviceConnected: false,
    connectionState: 'Terputus',
    lastUpdatedAt,
    liveTelemetry: [],
    simulationTelemetry: seeded,
    simulation: {
      running: false,
      initialPm25Inlet: 62.0,
      initialPm10Inlet: 98.0,
      efficiencyPm25Pct: 45.0,
      efficiencyPm10Pct: 55.0,
      startedAt,
    },
    deviceStatus: {
      esp32Status: 'Terputus',
      sensorPmStatus: 'Terputus',
      kipasDcStatus: 'Terputus',
      lastDataReceived: null,
    },
  };
}

export async function parseJsonIfAvailable<T>(resp: Response): Promise<T | null> {
  if (!resp.ok) return null;
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return null;
  }
  try {
    return (await resp.json()) as T;
  } catch {
    return null;
  }
}
