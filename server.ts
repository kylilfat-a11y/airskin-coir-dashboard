import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ConnectionState,
  DataSourceMode,
  DeviceStatusSummary,
  SimulationConfig,
  TelemetryPoint,
} from './src/types/airskin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

let dataSourceMode: DataSourceMode = 'simulasi';
let connectionState: ConnectionState = 'Terputus';
let deviceConnected = false;
let lastDataReceived: string | null = null;
let liveTelemetry: TelemetryPoint[] = [];

const simulationConfig: SimulationConfig = {
  running: false,
  initialPm25Inlet: 62.0,
  initialPm10Inlet: 98.0,
  efficiencyPm25Pct: 45.0,
  efficiencyPm10Pct: 55.0,
  startedAt: null,
};

let simulationTelemetry: TelemetryPoint[] = [];

function buildSimulationPoint(
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
    id: `sim-${Date.now()}-${stepIndex}`,
    timestamp: timestampIso,
    pm25Inlet: pm25In,
    pm25Outlet: pm25Out,
    pm10Inlet: pm10In,
    pm10Outlet: pm10Out,
    source: 'simulasi',
  };
}

function seedInitialSimulation(
  basePm25: number,
  basePm10: number,
  effPm25Pct: number,
  effPm10Pct: number,
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
    buildSimulationPoint(
      i,
      basePm25,
      basePm10,
      effPm25Pct,
      effPm10Pct,
      new Date(now - offset).toISOString(),
    ),
  );
}

simulationTelemetry = seedInitialSimulation(
  simulationConfig.initialPm25Inlet,
  simulationConfig.initialPm10Inlet,
  simulationConfig.efficiencyPm25Pct,
  simulationConfig.efficiencyPm10Pct,
);
simulationConfig.startedAt = simulationTelemetry[0]?.timestamp || new Date().toISOString();

function getDeviceStatus(): DeviceStatusSummary {
  const status: ConnectionState = deviceConnected ? 'Terhubung' : connectionState;
  return {
    esp32Status: status,
    sensorPmStatus: status,
    kipasAcStatus: status,
    lastDataReceived,
  };
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'airskin-coir-monitoring' });
});

app.get('/api/system/state', (_req, res) => {
  res.json({
    dataSourceMode,
    deviceConnected,
    connectionState,
    lastUpdatedAt:
      dataSourceMode === 'aktual'
        ? lastDataReceived
        : simulationTelemetry[simulationTelemetry.length - 1]?.timestamp || null,
    liveTelemetry,
    simulationTelemetry,
    simulation: simulationConfig,
    deviceStatus: getDeviceStatus(),
  });
});

app.post('/api/system/mode', (req, res) => {
  const { dataSourceMode: nextMode } = req.body as { dataSourceMode?: DataSourceMode };
  if (nextMode !== 'aktual' && nextMode !== 'simulasi') {
    res.status(400).json({ error: 'Mode sumber data harus aktual atau simulasi.' });
    return;
  }
  dataSourceMode = nextMode;
  res.json({ dataSourceMode });
});

app.post('/api/simulation/start', (req, res) => {
  const body = req.body as {
    initialPm25Inlet?: number;
    initialPm10Inlet?: number;
    efficiencyPm25Pct?: number;
    efficiencyPm10Pct?: number;
  };

  const pm25 = Number(body.initialPm25Inlet);
  const pm10 = Number(body.initialPm10Inlet);
  const eff25 = Number(body.efficiencyPm25Pct);
  const eff10 = Number(body.efficiencyPm10Pct);

  if (Number.isFinite(pm25) && pm25 >= 1 && pm25 <= 1000) {
    simulationConfig.initialPm25Inlet = Number(pm25.toFixed(1));
  }
  if (Number.isFinite(pm10) && pm10 >= 1 && pm10 <= 1500) {
    simulationConfig.initialPm10Inlet = Number(pm10.toFixed(1));
  }
  if (Number.isFinite(eff25) && eff25 >= 0 && eff25 <= 99) {
    simulationConfig.efficiencyPm25Pct = Number(eff25.toFixed(1));
  }
  if (Number.isFinite(eff10) && eff10 >= 0 && eff10 <= 99) {
    simulationConfig.efficiencyPm10Pct = Number(eff10.toFixed(1));
  }

  simulationConfig.running = true;
  simulationConfig.startedAt = new Date().toISOString();
  simulationTelemetry = [
    buildSimulationPoint(
      0,
      simulationConfig.initialPm25Inlet,
      simulationConfig.initialPm10Inlet,
      simulationConfig.efficiencyPm25Pct,
      simulationConfig.efficiencyPm10Pct,
      simulationConfig.startedAt,
    ),
  ];

  res.json({ simulation: simulationConfig, simulationTelemetry });
});

app.post('/api/simulation/step', (_req, res) => {
  if (!simulationConfig.running) {
    res.json({ simulation: simulationConfig });
    return;
  }
  const idx = simulationTelemetry.length;
  const pt = buildSimulationPoint(
    idx,
    simulationConfig.initialPm25Inlet,
    simulationConfig.initialPm10Inlet,
    simulationConfig.efficiencyPm25Pct,
    simulationConfig.efficiencyPm10Pct,
    new Date().toISOString(),
  );
  simulationTelemetry.push(pt);
  if (simulationTelemetry.length > 240) {
    simulationTelemetry = simulationTelemetry.slice(-240);
  }
  res.json({ simulation: simulationConfig, point: pt });
});

app.post('/api/simulation/reset', (_req, res) => {
  simulationConfig.running = false;
  simulationConfig.initialPm25Inlet = 62.0;
  simulationConfig.initialPm10Inlet = 98.0;
  simulationConfig.efficiencyPm25Pct = 45.0;
  simulationConfig.efficiencyPm10Pct = 55.0;
  simulationConfig.startedAt = new Date().toISOString();
  simulationTelemetry = seedInitialSimulation(
    simulationConfig.initialPm25Inlet,
    simulationConfig.initialPm10Inlet,
    simulationConfig.efficiencyPm25Pct,
    simulationConfig.efficiencyPm10Pct,
  );
  res.json({ simulation: simulationConfig, simulationTelemetry });
});

app.post('/api/device/connect-request', (_req, res) => {
  if (!deviceConnected) {
    connectionState = 'Menunggu Koneksi';
  }
  res.json({ connectionState, deviceConnected });
});

app.post('/api/device/disconnect', (_req, res) => {
  deviceConnected = false;
  connectionState = 'Terputus';
  liveTelemetry = [];
  lastDataReceived = null;
  res.json({ deviceConnected: false, connectionState });
});

app.post('/api/telemetry', (req, res) => {
  const configuredKey = process.env.ESP32_INGEST_KEY;
  if (configuredKey) {
    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token !== configuredKey) {
      res.status(401).json({ error: 'Kunci ingest ESP32 tidak valid.' });
      return;
    }
  }

  const body = req.body as Record<string, unknown>;
  const pm25Inlet = Number(body.pm25Inlet);
  const pm10Inlet = Number(body.pm10Inlet);
  const pm25Outlet = body.pm25Outlet !== undefined && body.pm25Outlet !== null ? Number(body.pm25Outlet) : null;
  const pm10Outlet = body.pm10Outlet !== undefined && body.pm10Outlet !== null ? Number(body.pm10Outlet) : null;

  if (!Number.isFinite(pm25Inlet) || pm25Inlet < 0 || pm25Inlet > 2000) {
    res.status(400).json({ error: 'pm25Inlet harus bernilai antara 0 hingga 2000' });
    return;
  }
  if (!Number.isFinite(pm10Inlet) || pm10Inlet < 0 || pm10Inlet > 2000) {
    res.status(400).json({ error: 'pm10Inlet harus bernilai antara 0 hingga 2000' });
    return;
  }

  const nowIso = new Date().toISOString();
  const pt: TelemetryPoint = {
    id: `esp-${Date.now()}`,
    timestamp: nowIso,
    pm25Inlet: Number(pm25Inlet.toFixed(1)),
    pm25Outlet: pm25Outlet !== null && Number.isFinite(pm25Outlet) ? Number(pm25Outlet.toFixed(1)) : null,
    pm10Inlet: Number(pm10Inlet.toFixed(1)),
    pm10Outlet: pm10Outlet !== null && Number.isFinite(pm10Outlet) ? Number(pm10Outlet.toFixed(1)) : null,
    source: 'esp32',
  };

  liveTelemetry.push(pt);
  if (liveTelemetry.length > 500) {
    liveTelemetry = liveTelemetry.slice(-500);
  }
  deviceConnected = true;
  connectionState = 'Terhubung';
  dataSourceMode = 'aktual';
  lastDataReceived = nowIso;

  res.status(201).json({ accepted: true, point: pt });
});

async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Berkas build tidak ditemukan.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server AIRSKIN COIR berjalan pada http://localhost:${PORT}`);
  });
}

startServer();
