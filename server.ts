import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ConnectionState,
  DataSourceMode,
  DeviceStatusSummary,
  MaintenanceRecord,
  SensorSettings,
  SimulationConfig,
  TelemetryPoint,
} from './src/types/airskin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Status koneksi awal perangkat keras (belum terhubung fisik sampai ESP32 mengirim telemetri)
let dataSourceMode: DataSourceMode = 'simulasi';
let connectionState: ConnectionState = 'Terputus';
let deviceConnected = false;
let liveStartedAt: number | null = null;
let lastDataReceived: string | null = null;
let sessionGithubToken: string | null = null;
let githubRepo = process.env.GITHUB_REPO || 'kylilfat-a11y/airskin-coir-dashboard';

let liveTelemetry: TelemetryPoint[] = [];

const sensorSettings: SensorSettings = {
  intervalKirimDetik: 5,
  topikMqtt: 'airskin/coir/panel01/telemetry',
  ambangPm25Peringatan: 55,
  ambangPm10Peringatan: 100,
  fanPwmPersen: 65,
};

let lastFilterInspectionAt: string | null = null;
const nextInspectionSchedule = 'Jadwal pemeriksaan berkala setiap 14 hari operasional';

const maintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'mnt-init-01',
    tanggal: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    komponen: 'Panel & Kipas DC',
    tindakan: 'Pemasangan Awal Prototipe Modul Fasad',
    catatan: 'Susunan casing, nonwoven, media serabut kelapa, jaring penyangga, dan kipas DC terpasang rapi untuk persiapan uji.',
    petugas: 'Tim Riset AIRSKIN COIR',
    jenis: 'pemeriksaan',
  },
];

// Parameter Simulasi Sistem (dapat disesuaikan pengguna untuk demonstrasi matematis)
const simulationConfig: SimulationConfig = {
  running: false,
  paused: false,
  initialPm25Inlet: 62.0,
  initialPm10Inlet: 98.0,
  efficiencyPm25Pct: 45.0,
  efficiencyPm10Pct: 55.0,
  startedAt: null,
  elapsedSeconds: 0,
};

let simulationTelemetry: TelemetryPoint[] = [];

// Rumus simulasi eksplisit: Konsentrasi Keluar = Konsentrasi Masuk × (1 − Efisiensi Simulasi)
function buildSimulationPoint(
  stepIndex: number,
  basePm25: number,
  basePm10: number,
  effPm25Pct: number,
  effPm10Pct: number,
  timestampIso: string,
): TelemetryPoint {
  const drift = Math.sin(stepIndex * 0.45) * 3.2 + Math.cos(stepIndex * 0.22) * 1.8;
  const pm25In = Number(Math.max(2, basePm25 + drift).toFixed(1));
  const pm10In = Number(Math.max(4, basePm10 + drift * 1.35).toFixed(1));

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
  const points: TelemetryPoint[] = [];
  // Buat titik rentang historis 7 hari hingga beberapa menit terakhir untuk tampilan grafik simulasi awal
  const offsetsMs = [
    6 * 24 * 3600_000,
    4 * 24 * 3600_000,
    2 * 24 * 3600_000,
    20 * 3600_000,
    12 * 3600_000,
    5 * 3600_000,
    3 * 3600_000,
    90 * 60_000,
    45 * 60_000,
    30 * 60_000,
    20 * 60_000,
    15 * 60_000,
    10 * 60_000,
    5 * 60_000,
    2 * 60_000,
    60_000,
  ];
  offsetsMs.forEach((offset, i) => {
    const ts = new Date(now - offset).toISOString();
    points.push(buildSimulationPoint(i, basePm25, basePm10, effPm25Pct, effPm10Pct, ts));
  });
  return points;
}

simulationTelemetry = seedInitialSimulation(
  simulationConfig.initialPm25Inlet,
  simulationConfig.initialPm10Inlet,
  simulationConfig.efficiencyPm25Pct,
  simulationConfig.efficiencyPm10Pct,
);
simulationConfig.startedAt = simulationTelemetry[0]?.timestamp || new Date().toISOString();
simulationConfig.elapsedSeconds = 0;

function getDeviceStatus(): DeviceStatusSummary {
  return {
    connectionState,
    esp32Connected: deviceConnected,
    pmSensorConnected: deviceConnected,
    fanStatus: deviceConnected
      ? 'Aktif'
      : simulationConfig.running && !simulationConfig.paused
        ? 'Siaga'
        : 'Terputus',
    dataTransmissionStatus: deviceConnected
      ? 'Mengalir'
      : connectionState === 'Menunggu koneksi'
        ? 'Menunggu'
        : 'Terputus',
    lastDataReceived,
    esp32DeviceId: 'ESP32-WROOM-32E-AC01',
    mqttTopic: sensorSettings.topikMqtt,
    firmwareVersion: 'airskin-fw-2.1.0',
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

  res.json({
    dataSourceMode,
    deviceConnected,
    connectionState,
    lastUpdatedAt:
      dataSourceMode === 'aktual'
        ? lastDataReceived
        : simulationTelemetry[simulationTelemetry.length - 1]?.timestamp || null,
    liveDurationSeconds,
    liveTelemetry,
    simulationTelemetry,
    simulation: simulationConfig,
    deviceStatus: getDeviceStatus(),
    maintenanceRecords,
    lastFilterInspectionAt,
    nextInspectionSchedule,
    sensorSettings,
    githubRepo,
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

// Kontrol Simulasi Sistem
app.post('/api/simulation/start', (req, res) => {
  const body = req.body as {
    initialPm25Inlet?: number;
    initialPm10Inlet?: number;
    efficiencyPm25Pct?: number;
    efficiencyPm10Pct?: number;
    resume?: boolean;
  };

  if (body.resume && simulationConfig.paused) {
    simulationConfig.running = true;
    simulationConfig.paused = false;
    res.json({ simulation: simulationConfig, simulationTelemetry });
    return;
  }

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
  simulationConfig.paused = false;
  simulationConfig.startedAt = new Date().toISOString();
  simulationConfig.elapsedSeconds = 0;

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

app.post('/api/simulation/pause', (_req, res) => {
  if (simulationConfig.running) {
    simulationConfig.running = false;
    simulationConfig.paused = true;
  }
  res.json({ simulation: simulationConfig });
});

app.post('/api/simulation/step', (_req, res) => {
  if (!simulationConfig.running || simulationConfig.paused) {
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
  simulationConfig.elapsedSeconds += 3;
  res.json({ simulation: simulationConfig, point: pt });
});

app.post('/api/simulation/reset', (_req, res) => {
  simulationConfig.running = false;
  simulationConfig.paused = false;
  simulationConfig.initialPm25Inlet = 62.0;
  simulationConfig.initialPm10Inlet = 98.0;
  simulationConfig.efficiencyPm25Pct = 45.0;
  simulationConfig.efficiencyPm10Pct = 55.0;
  simulationConfig.startedAt = new Date().toISOString();
  simulationConfig.elapsedSeconds = 0;
  simulationTelemetry = seedInitialSimulation(
    simulationConfig.initialPm25Inlet,
    simulationConfig.initialPm10Inlet,
    simulationConfig.efficiencyPm25Pct,
    simulationConfig.efficiencyPm10Pct,
  );
  res.json({ simulation: simulationConfig, simulationTelemetry });
});

// Pemeliharaan Filter
app.post('/api/maintenance/record', (req, res) => {
  const body = req.body as Partial<MaintenanceRecord>;
  if (!body.tindakan || typeof body.tindakan !== 'string' || !body.tindakan.trim()) {
    res.status(400).json({ error: 'Judul tindakan pemeliharaan wajib diisi.' });
    return;
  }
  const rec: MaintenanceRecord = {
    id: `mnt-${Date.now()}`,
    tanggal: new Date().toISOString(),
    komponen:
      body.komponen === 'Media Serabut Kelapa' ||
      body.komponen === 'Lapisan Nonwoven' ||
      body.komponen === 'Panel & Kipas DC'
        ? body.komponen
        : 'Media Serabut Kelapa',
    tindakan: body.tindakan.trim().slice(0, 120),
    catatan: typeof body.catatan === 'string' ? body.catatan.trim().slice(0, 400) : '',
    petugas: typeof body.petugas === 'string' && body.petugas.trim() ? body.petugas.trim().slice(0, 80) : 'Operator Fasad',
    jenis:
      body.jenis === 'penggantian' || body.jenis === 'catatan' || body.jenis === 'pemeriksaan'
        ? body.jenis
        : 'catatan',
  };
  maintenanceRecords.unshift(rec);
  if (rec.jenis === 'pemeriksaan') {
    lastFilterInspectionAt = rec.tanggal;
  }
  res.status(201).json({ record: rec, maintenanceRecords, lastFilterInspectionAt });
});

app.post('/api/maintenance/inspect', (_req, res) => {
  const nowIso = new Date().toISOString();
  lastFilterInspectionAt = nowIso;
  const rec: MaintenanceRecord = {
    id: `mnt-${Date.now()}`,
    tanggal: nowIso,
    komponen: 'Media Serabut Kelapa',
    tindakan: 'Pemeriksaan Fisik Filter & Lapisan Nonwoven',
    catatan: 'Filter telah diperiksa secara visual untuk memastikan susunan media dan kerangka tetap baik.',
    petugas: 'Operator Pemantauan',
    jenis: 'pemeriksaan',
  };
  maintenanceRecords.unshift(rec);
  res.json({ lastFilterInspectionAt, maintenanceRecords });
});

// Pengaturan Perangkat & Koneksi ESP32
app.post('/api/device/connect-request', (_req, res) => {
  if (!deviceConnected) {
    connectionState = 'Menunggu koneksi';
  }
  res.json({ connectionState, deviceConnected });
});

app.post('/api/device/settings', (req, res) => {
  const body = req.body as Partial<SensorSettings>;
  if (typeof body.intervalKirimDetik === 'number' && body.intervalKirimDetik >= 1 && body.intervalKirimDetik <= 3600) {
    sensorSettings.intervalKirimDetik = Math.round(body.intervalKirimDetik);
  }
  if (typeof body.topikMqtt === 'string' && body.topikMqtt.trim()) {
    sensorSettings.topikMqtt = body.topikMqtt.trim().slice(0, 120);
  }
  if (typeof body.ambangPm25Peringatan === 'number' && body.ambangPm25Peringatan >= 5 && body.ambangPm25Peringatan <= 500) {
    sensorSettings.ambangPm25Peringatan = Number(body.ambangPm25Peringatan);
  }
  if (typeof body.ambangPm10Peringatan === 'number' && body.ambangPm10Peringatan >= 10 && body.ambangPm10Peringatan <= 1000) {
    sensorSettings.ambangPm10Peringatan = Number(body.ambangPm10Peringatan);
  }
  if (typeof body.fanPwmPersen === 'number' && body.fanPwmPersen >= 0 && body.fanPwmPersen <= 100) {
    sensorSettings.fanPwmPersen = Math.round(body.fanPwmPersen);
  }
  res.json({ sensorSettings });
});

// Endpoint ESP32 HTTP REST / MQTT Bridge untuk Data Aktual
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
  if (!deviceConnected) {
    liveStartedAt = Date.now();
  }
  deviceConnected = true;
  connectionState = 'Terhubung';
  dataSourceMode = 'aktual';
  lastDataReceived = nowIso;

  res.status(201).json({ accepted: true, point: pt });
});

app.post('/api/device/disconnect', (_req, res) => {
  deviceConnected = false;
  connectionState = 'Terputus';
  liveTelemetry = [];
  liveStartedAt = null;
  lastDataReceived = null;
  res.json({ deviceConnected: false, connectionState });
});

// Integrasi GitHub (token hanya dari process.env.GITHUB_TOKEN atau sesi memori server)
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
    res.status(400).json({ connected: false, error: 'Format repositori tidak valid' });
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
        message: `Repositori mengembalikan HTTP ${repoResp.status}`,
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
    system: 'AIRSKIN COIR – Sistem Pemantauan Filtrasi Udara Berbasis IoT',
    dataSourceMode,
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
        message: `chore(telemetri): sinkronisasi snapshot AIRSKIN COIR ${new Date().toISOString().slice(0, 10)}`,
        content: encodedContent,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      res.status(putResp.status).json({ error: `Kesalahan GitHub API: ${errText.slice(0, 180)}` });
      return;
    }

    const result = (await putResp.json()) as { content?: { path?: string; html_url?: string } };
    res.json({ synced: true, path: result.content?.path || filePath, url: result.content?.html_url });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Sinkronisasi GitHub gagal' });
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
        res.status(404).send('Berkas build tidak ditemukan.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server AIRSKIN COIR berjalan pada http://localhost:${PORT}`);
  });
}

startServer();
