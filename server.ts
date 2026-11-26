import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  DashboardMode,
  DeviceStatusSummary,
  SimulationConfig,
  TelemetryPoint,
} from './src/types/airskin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Mode awal: Simulation Mode aktif saat perangkat ESP32 belum terhubung agar dashboard langsung fungsional & interaktif dengan label jelas
let currentMode: DashboardMode = 'simulation';
let deviceConnected = false;
let liveStartedAt: number | null = null;
let lastDataReceived: string | null = null;
let sessionGithubToken: string | null = null;
let githubRepo = process.env.GITHUB_REPO || 'kylilfat-a11y/airskin-coir-dashboard';

let liveTelemetry: TelemetryPoint[] = [];

// Parameter Simulasi Interaktif (tidak memakai angka literatur Kaur & Kaur 96.5%/98.2% sebagai efisiensi otomatis AIRSKIN COIR)
const simulationConfig: SimulationConfig = {
  running: false,
  initialPm25Inlet: 58.0,
  initialPm10Inlet: 92.0,
  startedAt: null,
  elapsedSeconds: 0,
};

let simulationTelemetry: TelemetryPoint[] = [];

// Faktor ilustrasi konservatif untuk Simulation Mode (bukan hasil uji prototipe & bukan benchmark literatur)
function buildSimulationPoint(
  stepIndex: number,
  basePm25: number,
  basePm10: number,
  timestampIso: string,
): TelemetryPoint {
  const drift = Math.sin(stepIndex * 0.48) * 3.6 + Math.cos(stepIndex * 0.25) * 2.1;
  const pm25In = Number(Math.max(5, basePm25 + drift).toFixed(1));
  const pm10In = Number(Math.max(10, basePm10 + drift * 1.4).toFixed(1));

  // Ilustrasi penurunan moderat (~48–56% PM2.5, ~58–66% PM10) yang jelas terpisah dari benchmark 96.5% / 98.2%
  const pm25PassRatio = 0.48 + Math.sin(stepIndex * 0.35) * 0.035;
  const pm10PassRatio = 0.38 + Math.cos(stepIndex * 0.3) * 0.035;

  const pm25Out = Number(Math.max(2, pm25In * pm25PassRatio).toFixed(1));
  const pm10Out = Number(Math.max(3, pm10In * pm10PassRatio).toFixed(1));

  return {
    id: `sim-${Date.now()}-${stepIndex}`,
    timestamp: timestampIso,
    pm25Inlet: pm25In,
    pm25Outlet: pm25Out,
    pm10Inlet: pm10In,
    pm10Outlet: pm10Out,
    source: 'simulation',
  };
}

function seedInitialSimulation(basePm25: number, basePm10: number): TelemetryPoint[] {
  const now = Date.now();
  const points: TelemetryPoint[] = [];
  for (let i = 19; i >= 0; i--) {
    const ts = new Date(now - i * 15 * 1000).toISOString();
    points.push(buildSimulationPoint(19 - i, basePm25, basePm10, ts));
  }
  return points;
}

simulationTelemetry = seedInitialSimulation(
  simulationConfig.initialPm25Inlet,
  simulationConfig.initialPm10Inlet,
);
simulationConfig.startedAt = new Date(Date.now() - 19 * 15 * 1000).toISOString();
simulationConfig.elapsedSeconds = 19 * 15;

function getDeviceStatus(): DeviceStatusSummary {
  return {
    esp32Connected: deviceConnected,
    pmSensorConnected: deviceConnected,
    fanStatus: deviceConnected ? 'Active' : currentMode === 'simulation' && simulationConfig.running ? 'Standby' : 'Disconnected',
    dataTransmissionStatus: deviceConnected ? 'Streaming' : 'Disconnected',
    lastDataReceived,
    esp32DeviceId: 'ESP32-WROOM-32E-AC01',
    mqttTopic: 'airskin/coir/panel01/telemetry',
    firmwareVersion: 'airskin-fw-2.0.0',
  };
}

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'airskin-coir-monitoring' });
});

app.get('/api/system/state', (_req, res) => {
  const liveDurationSeconds =
    deviceConnected && liveStartedAt !== null
      ? Math.max(0, Math.floor((Date.now() - liveStartedAt) / 1000))
      : 0;

  if (simulationConfig.running && simulationConfig.startedAt) {
    simulationConfig.elapsedSeconds = Math.max(
      simulationConfig.elapsedSeconds,
      Math.floor((Date.now() - new Date(simulationConfig.startedAt).getTime()) / 1000),
    );
  }

  res.json({
    mode: currentMode,
    deviceConnected,
    lastUpdatedAt: currentMode === 'live' ? lastDataReceived : simulationTelemetry[simulationTelemetry.length - 1]?.timestamp || null,
    liveDurationSeconds,
    liveTelemetry,
    simulationTelemetry,
    simulation: simulationConfig,
    deviceStatus: getDeviceStatus(),
    githubRepo,
  });
});

// Berpindah antara Live IoT Monitoring dan Simulation Mode
app.post('/api/system/mode', (req, res) => {
  const { mode } = req.body as { mode?: DashboardMode };
  if (mode !== 'live' && mode !== 'simulation') {
    res.status(400).json({ error: 'Mode must be live or simulation.' });
    return;
  }
  currentMode = mode;
  res.json({ mode: currentMode });
});

// Kontrol Simulation Mode (Start / Tick / Reset)
app.post('/api/simulation/start', (req, res) => {
  const body = req.body as { initialPm25Inlet?: number; initialPm10Inlet?: number };
  const pm25 = Number(body.initialPm25Inlet);
  const pm10 = Number(body.initialPm10Inlet);

  if (Number.isFinite(pm25) && pm25 >= 1 && pm25 <= 1000) {
    simulationConfig.initialPm25Inlet = Number(pm25.toFixed(1));
  }
  if (Number.isFinite(pm10) && pm10 >= 1 && pm10 <= 1500) {
    simulationConfig.initialPm10Inlet = Number(pm10.toFixed(1));
  }

  currentMode = 'simulation';
  simulationConfig.running = true;
  simulationConfig.startedAt = new Date().toISOString();
  simulationConfig.elapsedSeconds = 0;
  simulationTelemetry = [
    buildSimulationPoint(
      0,
      simulationConfig.initialPm25Inlet,
      simulationConfig.initialPm10Inlet,
      simulationConfig.startedAt,
    ),
  ];

  res.json({ simulation: simulationConfig, simulationTelemetry });
});

app.post('/api/simulation/step', (_req, res) => {
  if (!simulationConfig.running) {
    res.json({ simulation: simulationConfig, simulationTelemetry });
    return;
  }
  const idx = simulationTelemetry.length;
  const pt = buildSimulationPoint(
    idx,
    simulationConfig.initialPm25Inlet,
    simulationConfig.initialPm10Inlet,
    new Date().toISOString(),
  );
  simulationTelemetry.push(pt);
  if (simulationTelemetry.length > 240) {
    simulationTelemetry = simulationTelemetry.slice(-240);
  }
  simulationConfig.elapsedSeconds += 3;
  res.json({ simulation: simulationConfig, point: pt });
});

app.post('/api/simulation/reset', (_req, res) => {
  simulationConfig.running = false;
  simulationConfig.initialPm25Inlet = 58.0;
  simulationConfig.initialPm10Inlet = 92.0;
  simulationConfig.startedAt = new Date().toISOString();
  simulationConfig.elapsedSeconds = 0;
  simulationTelemetry = seedInitialSimulation(
    simulationConfig.initialPm25Inlet,
    simulationConfig.initialPm10Inlet,
  );
  res.json({ simulation: simulationConfig, simulationTelemetry });
});

// Endpoint ESP32 HTTP REST / MQTT Bridge untuk Live IoT Data
app.post('/api/telemetry', (req, res) => {
  const configuredKey = process.env.ESP32_INGEST_KEY;
  if (configuredKey) {
    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token !== configuredKey) {
      res.status(401).json({ error: 'Invalid ESP32 ingest key' });
      return;
    }
  }

  const body = req.body as Record<string, unknown>;
  const pm25Inlet = Number(body.pm25Inlet);
  const pm10Inlet = Number(body.pm10Inlet);
  const pm25Outlet = body.pm25Outlet !== undefined && body.pm25Outlet !== null ? Number(body.pm25Outlet) : null;
  const pm10Outlet = body.pm10Outlet !== undefined && body.pm10Outlet !== null ? Number(body.pm10Outlet) : null;

  if (!Number.isFinite(pm25Inlet) || pm25Inlet < 0 || pm25Inlet > 2000) {
    res.status(400).json({ error: 'pm25Inlet must be between 0 and 2000' });
    return;
  }
  if (!Number.isFinite(pm10Inlet) || pm10Inlet < 0 || pm10Inlet > 2000) {
    res.status(400).json({ error: 'pm10Inlet must be between 0 and 2000' });
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
  if (!deviceConnected) {
    liveStartedAt = Date.now();
  }
  deviceConnected = true;
  currentMode = 'live';
  lastDataReceived = nowIso;

  res.status(201).json({ accepted: true, point: pt });
});

app.post('/api/device/disconnect', (_req, res) => {
  deviceConnected = false;
  liveTelemetry = [];
  liveStartedAt = null;
  lastDataReceived = null;
  res.json({ deviceConnected: false });
});

// Integrasi GitHub (token dibaca dari process.env.GITHUB_TOKEN atau sesi memori server)
app.post('/api/github/config', (req, res) => {
  const body = req.body as { repo?: string; token?: string };
  if (typeof body.repo === 'string' && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(body.repo.trim())) {
    githubRepo = body.repo.trim();
  }
  if (typeof body.token === 'string') {
    sessionGithubToken = body.token.trim() || null;
  }
  res.json({ githubRepo, hasToken: Boolean(process.env.GITHUB_TOKEN || sessionGithubToken) });
});

app.get('/api/github/status', async (_req, res) => {
  const token = process.env.GITHUB_TOKEN || sessionGithubToken;
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepo)) {
    res.status(400).json({ connected: false, error: 'Invalid repository slug' });
    return;
  }
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'airskin-coir-monitoring',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const repoResp = await fetch(`https://api.github.com/repos/${githubRepo}`, { headers });
    if (!repoResp.ok) {
      res.json({
        connected: false,
        hasToken: Boolean(token),
        repo: githubRepo,
        message: `Repository returned HTTP ${repoResp.status}`,
      });
      return;
    }
    const repoData = (await repoResp.json()) as {
      full_name: string;
      html_url: string;
      default_branch: string;
    };
    res.json({
      connected: true,
      hasToken: Boolean(token),
      repo: repoData.full_name,
      htmlUrl: repoData.html_url,
      defaultBranch: repoData.default_branch,
    });
  } catch {
    res.json({ connected: false, hasToken: Boolean(token), repo: githubRepo });
  }
});

app.post('/api/github/sync-snapshot', async (_req, res) => {
  const token = process.env.GITHUB_TOKEN || sessionGithubToken;
  if (!token) {
    res.status(400).json({ error: 'GITHUB_TOKEN belum dikonfigurasi di server Secrets.' });
    return;
  }
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(githubRepo)) {
    res.status(400).json({ error: 'Format repositori tidak valid.' });
    return;
  }

  const snapshot = {
    exportedAt: new Date().toISOString(),
    system: 'AIRSKIN COIR | Smart Air Filtration Monitoring System',
    mode: currentMode,
    deviceConnected,
    liveTelemetryCount: liveTelemetry.length,
    latestLiveTelemetry: liveTelemetry.slice(-24),
  };

  const filePath = `snapshots/airskin-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
  const encodedContent = Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8').toString('base64');
  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'airskin-coir-monitoring',
    'Content-Type': 'application/json',
  };

  try {
    let existingSha: string | undefined;
    const checkResp = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      headers,
    });
    if (checkResp.ok) {
      const existing = (await checkResp.json()) as { sha?: string };
      existingSha = existing.sha;
    }

    const putResp = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${filePath}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        message: `chore(telemetry): sync AIRSKIN COIR snapshot ${new Date().toISOString().slice(0, 10)}`,
        content: encodedContent,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      res.status(putResp.status).json({ error: `GitHub API error: ${errText.slice(0, 180)}` });
      return;
    }

    const result = (await putResp.json()) as { content?: { path?: string; html_url?: string } };
    res.json({ synced: true, path: result.content?.path || filePath, url: result.content?.html_url });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'GitHub sync failed' });
  }
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
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AIRSKIN COIR server listening on http://localhost:${PORT}`);
  });
}

startServer();
