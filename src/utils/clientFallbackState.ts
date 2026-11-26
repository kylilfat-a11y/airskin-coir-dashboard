import type { SystemStatePayload, TelemetryPoint } from '../types/airskin';

export function buildClientSimulationPoint(
  stepIndex: number,
  basePm25: number,
  basePm10: number,
  timestampIso: string,
): TelemetryPoint {
  const drift = Math.sin(stepIndex * 0.48) * 3.6 + Math.cos(stepIndex * 0.25) * 2.1;
  const pm25In = Number(Math.max(5, basePm25 + drift).toFixed(1));
  const pm10In = Number(Math.max(10, basePm10 + drift * 1.4).toFixed(1));

  // Ilustrasi konservatif (~48–56% PM2.5, ~58–66% PM10) terpisah dari benchmark literatur
  const pm25PassRatio = 0.48 + Math.sin(stepIndex * 0.35) * 0.035;
  const pm10PassRatio = 0.38 + Math.cos(stepIndex * 0.3) * 0.035;

  const pm25Out = Number(Math.max(2, pm25In * pm25PassRatio).toFixed(1));
  const pm10Out = Number(Math.max(3, pm10In * pm10PassRatio).toFixed(1));

  return {
    id: `sim-local-${Date.now()}-${stepIndex}`,
    timestamp: timestampIso,
    pm25Inlet: pm25In,
    pm25Outlet: pm25Out,
    pm10Inlet: pm10In,
    pm10Outlet: pm10Out,
    source: 'simulation',
  };
}

export function seedClientSimulation(basePm25 = 58.0, basePm10 = 92.0): TelemetryPoint[] {
  const now = Date.now();
  const points: TelemetryPoint[] = [];
  for (let i = 19; i >= 0; i--) {
    const ts = new Date(now - i * 15 * 1000).toISOString();
    points.push(buildClientSimulationPoint(19 - i, basePm25, basePm10, ts));
  }
  return points;
}

export function createInitialClientState(): SystemStatePayload {
  const seeded = seedClientSimulation(58.0, 92.0);
  const startedAt = seeded[0]?.timestamp || new Date().toISOString();
  const lastUpdatedAt = seeded[seeded.length - 1]?.timestamp || startedAt;

  return {
    mode: 'simulation',
    deviceConnected: false,
    lastUpdatedAt,
    liveDurationSeconds: 0,
    liveTelemetry: [],
    simulationTelemetry: seeded,
    simulation: {
      running: false,
      initialPm25Inlet: 58.0,
      initialPm10Inlet: 92.0,
      startedAt,
      elapsedSeconds: 19 * 15,
    },
    deviceStatus: {
      esp32Connected: false,
      pmSensorConnected: false,
      fanStatus: 'Disconnected',
      dataTransmissionStatus: 'Disconnected',
      lastDataReceived: null,
      esp32DeviceId: 'ESP32-WROOM-32E-AC01',
      mqttTopic: 'airskin/coir/panel01/telemetry',
      firmwareVersion: 'airskin-fw-2.0.0',
    },
    githubRepo: 'kylilfat-a11y/airskin-coir-dashboard',
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
