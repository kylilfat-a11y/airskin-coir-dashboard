import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  DataSourceMode,
  DeviceConnectionState,
  DeviceNotification,
  FacadePanel,
  FilterConfigKey,
  FilterExperimentTrial,
  MaintenanceRecord,
  SensorNodeStatus,
  SimulationScenarioKey,
  SystemConfig,
  TelemetryPoint,
} from './src/types/airskin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Status awal: Menunggu koneksi perangkat keras ESP32 (tidak mengklaim sudah terhubung)
let currentMode: DataSourceMode = 'menunggu_koneksi';
let lastSyncAt: string | null = null;
// Token GitHub opsional di memori server (tidak pernah ditulis ke disk atau kode klien)
let sessionGithubToken: string | null = null;

const systemConfig: SystemConfig = {
  buildingLocation: 'Gedung Laboratorium Teknologi Berkelanjutan · Fasad Barat',
  esp32DeviceId: 'ESP32-WROOM-32E-AC01',
  firmwareVersion: 'airskin-fw-1.2.0',
  wifiSsid: 'LivingLab-IoT-2.4G',
  wifiSignalDbm: null,
  mqttBrokerTopic: 'airskin/panel/ac01/telemetry',
  hasOutletSensor: false,
  dcFanInstalled: true,
  activePanelId: 'AC-01',
  refreshIntervalSec: 10,
  measurementUnit: 'µg/m³',
  githubRepo: process.env.GITHUB_REPO || 'kylilfat-a11y/airskin-coir-dashboard',
  simulationScenario: 'normal',
  simulationFilterConfig: 'C',
};

let realTelemetry: TelemetryPoint[] = [];
let simulationSeries: TelemetryPoint[] = generateSimulationSeries();
let experiments: FilterExperimentTrial[] = [];

const notifications: DeviceNotification[] = [
  {
    id: 'notif-init',
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Sistem siap menerima paket data HTTP POST atau MQTT bridge dari ESP32.',
  },
];

const panels: FacadePanel[] = [
  {
    id: 'AC-01',
    label: 'Panel AC-01',
    location: 'Lantai 2 · Dinding Tirai Barat Laut',
    level: 'Lantai 2',
    facadeZone: 'Zona Barat Laut',
    status: 'Menunggu Koneksi',
    classification: 'Modul Prototipe Utama',
    pmMonitoringAvailable: true,
    inspectionStatus: 'Kondisi Baik',
    coirCondition: 'Serabut kelapa kering & rapat · Diperiksa 18 Nov 2026',
    nonwovenCondition: 'Lapisan awal nonwoven bersih (debu ringan)',
    fanStatus: 'Kipas DC 12V · Siaga',
    lastMaintenanceDate: '2026-11-18',
    hotspotX: 31,
    hotspotY: 63,
  },
  {
    id: 'AC-02',
    label: 'Panel AC-02',
    location: 'Lantai 5 · Fasad Barat Laut Atas',
    level: 'Lantai 5',
    facadeZone: 'Zona Barat Laut Atas',
    status: 'Menunggu Koneksi',
    classification: 'Modul Konsep / Rencana',
    pmMonitoringAvailable: false,
    inspectionStatus: 'Kondisi Baik',
    coirCondition: 'Media terpasang untuk uji arsitektural',
    nonwovenCondition: 'Lapisan awal nonwoven terpasang',
    fanStatus: 'Modul Rencana · Belum Terhubung Daya',
    lastMaintenanceDate: '2026-11-10',
    hotspotX: 33,
    hotspotY: 36,
  },
  {
    id: 'AC-03',
    label: 'Panel AC-03',
    location: 'Lantai 3 · Koridor Fasad Timur',
    level: 'Lantai 3',
    facadeZone: 'Zona Fasad Timur',
    status: 'Perlu Pemeriksaan',
    classification: 'Modul Konsep / Rencana',
    pmMonitoringAvailable: false,
    inspectionStatus: 'Perlu Pemeriksaan',
    coirCondition: 'Jadwal pengecekan kelembapan pascahujan',
    nonwovenCondition: 'Perlu inspeksi visual bukaan louver',
    fanStatus: 'Modul Rencana · Belum Terhubung Daya',
    lastMaintenanceDate: '2026-10-14',
    hotspotX: 69,
    hotspotY: 51,
  },
  {
    id: 'AC-04',
    label: 'Panel AC-04',
    location: 'Lantai 6 · Louver Atrium Atas',
    level: 'Lantai 6',
    facadeZone: 'Zona Atrium Atas',
    status: 'Menunggu Koneksi',
    classification: 'Modul Konsep / Rencana',
    pmMonitoringAvailable: false,
    inspectionStatus: 'Kondisi Baik',
    coirCondition: 'Mockup integrasi fasad tingkat atas',
    nonwovenCondition: 'Lapisan awal nonwoven baru',
    fanStatus: 'Modul Rencana · Belum Terhubung Daya',
    lastMaintenanceDate: '2026-11-02',
    hotspotX: 65,
    hotspotY: 26,
  },
];

const maintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'MNT-2026-04',
    panelId: 'AC-01',
    date: '2026-11-18',
    inspector: 'Kaylilla Faticha',
    recordType: 'Pemeriksaan Rutin',
    coirCondition: 'Serat serabut kelapa utuh, tidak lembap (11,4%).',
    nonwovenCondition: 'Akumulasi debu permukaan ringan pada lapisan awal.',
    status: 'Kondisi Baik',
    notes: 'Casing pelindung dan jaring penyangga tersegel rapat.',
  },
  {
    id: 'MNT-2026-03',
    panelId: 'AC-03',
    date: '2026-10-14',
    inspector: 'R. Pratama',
    recordType: 'Audit Kelembapan & Casing',
    coirCondition: 'Terdeteksi kelembapan sedikit meningkat (18,7%) setelah hujan.',
    nonwovenCondition: 'Bersih dari sobekan, perlu pengeringan gasket bawah.',
    status: 'Perlu Pemeriksaan',
    notes: 'Dijadwalkan pemeriksaan ulang kelembapan fisik pekan depan.',
  },
  {
    id: 'MNT-2026-02',
    panelId: 'AC-01',
    date: '2026-09-25',
    inspector: 'Kaylilla Faticha',
    recordType: 'Penggantian Media',
    coirCondition: 'Penggantian kartrid serabut kelapa baru batch #C-09.',
    nonwovenCondition: 'Penggantian lembar nonwoven G3 baru.',
    status: 'Kondisi Baik',
    notes: 'Siklus uji lapangan 90 hari selesai; media baru terpasang rapi.',
  },
];

const SCENARIO_BASELINES: Record<
  SimulationScenarioKey,
  { pm25Base: number; pm10Base: number; amp: number; label: string }
> = {
  pagi_bersih: { pm25Base: 18.4, pm10Base: 31.2, amp: 2.8, label: 'Udara Pagi Bersih' },
  normal: { pm25Base: 38.6, pm10Base: 61.4, amp: 5.4, label: 'Udara Perkotaan Normal' },
  lalu_lintas: { pm25Base: 65.2, pm10Base: 98.5, amp: 9.2, label: 'Jam Sibuk Lalu Lintas' },
  beban_tinggi: { pm25Base: 118.0, pm10Base: 168.4, amp: 14.5, label: 'Beban Partikulat Tinggi' },
};

const FILTER_SIM_RETENTION: Record<FilterConfigKey, { pm25Pass: number; pm10Pass: number }> = {
  A: { pm25Pass: 0.68, pm10Pass: 0.6 },
  B: { pm25Pass: 0.55, pm10Pass: 0.45 },
  C: { pm25Pass: 0.41, pm10Pass: 0.31 },
  D: { pm25Pass: 0.98, pm10Pass: 0.98 },
};

function generateSimulationSeries(): TelemetryPoint[] {
  const now = Date.now();
  const points: TelemetryPoint[] = [];
  const totalPoints = 48;
  const base = SCENARIO_BASELINES[systemConfig.simulationScenario] || SCENARIO_BASELINES.normal;
  const retention =
    FILTER_SIM_RETENTION[systemConfig.simulationFilterConfig] || FILTER_SIM_RETENTION.C;

  for (let i = totalPoints - 1; i >= 0; i--) {
    const ts = new Date(now - i * 30 * 60 * 1000).toISOString();
    const wave = Math.sin(i * 0.45) * base.amp + Math.cos(i * 0.22) * (base.amp * 0.55);
    const pm25Inlet = Number(Math.max(4, base.pm25Base + wave).toFixed(1));
    const pm25Outlet = Number(
      Math.max(2, pm25Inlet * (retention.pm25Pass + ((i % 5) - 2) * 0.008)).toFixed(1),
    );
    const pm10Inlet = Number(Math.max(8, base.pm10Base + wave * 1.35).toFixed(1));
    const pm10Outlet = Number(
      Math.max(3, pm10Inlet * (retention.pm10Pass + ((i % 4) - 1.5) * 0.008)).toFixed(1),
    );

    points.push({
      id: `sim-${i}`,
      timestamp: ts,
      panelId: systemConfig.activePanelId,
      pm25Inlet,
      pm25Outlet,
      pm10Inlet,
      pm10Outlet,
      fanPowerW: systemConfig.simulationFilterConfig === 'D' ? 4.2 : 4.8,
      airflowActive: true,
      source: 'simulasi',
    });
  }
  return points;
}

function getConnectionState(): DeviceConnectionState {
  if (currentMode === 'terhubung_esp32') return 'Terhubung';
  if (currentMode === 'data_simulasi') return 'Menunggu koneksi';
  return 'Menunggu koneksi';
}

function buildSensors(): SensorNodeStatus[] {
  const isLive = currentMode === 'terhubung_esp32';
  const isSim = currentMode === 'data_simulasi';
  const activeSeries = isLive ? realTelemetry : isSim ? simulationSeries : [];
  const latestTs = activeSeries.length > 0 ? activeSeries[activeSeries.length - 1].timestamp : null;

  const espState: DeviceConnectionState = isLive ? 'Terhubung' : 'Menunggu koneksi';

  const nodes: SensorNodeStatus[] = [
    {
      id: 'esp32',
      name: 'Mikrokontroler ESP32',
      hardwareModel: systemConfig.esp32DeviceId,
      status: espState,
      installed: true,
      lastReceivedAt: isLive ? latestTs : null,
      detail: isLive
        ? `Terhubung via HTTP/MQTT (${systemConfig.firmwareVersion})`
        : isSim
          ? 'Mode DATA SIMULASI aktif (perangkat keras belum terhubung)'
          : 'Menunggu jabat tangan perangkat keras pada /api/telemetry',
    },
    {
      id: 'pm-inlet',
      name: 'Sensor Partikulat Masuk',
      hardwareModel: 'PMS5003 Laser Scattering · CH1',
      status: espState,
      installed: true,
      lastReceivedAt: isLive ? latestTs : null,
      detail: isLive
        ? 'Membaca konsentrasi PM2.5 & PM10 udara masuk aktual'
        : 'Menunggu paket data sensor partikulat pertama',
    },
    {
      id: 'dc-fan',
      name: 'Kipas DC Axial 12V',
      hardwareModel: 'PWM Brushless 12V · 4,8 W',
      status: isLive ? 'Terhubung' : systemConfig.dcFanInstalled ? 'Menunggu koneksi' : 'Terputus',
      installed: systemConfig.dcFanInstalled,
      lastReceivedAt: isLive ? latestTs : null,
      detail: isLive
        ? 'Menarik aliran udara melewati lapisan nonwoven & serabut kelapa'
        : 'Siaga menunggu aktivasi kontroler ESP32',
    },
  ];

  if (systemConfig.hasOutletSensor) {
    nodes.splice(2, 0, {
      id: 'pm-outlet',
      name: 'Sensor Partikulat Keluar',
      hardwareModel: 'PMS5003 Laser Scattering · CH2',
      status: espState,
      installed: true,
      lastReceivedAt: isLive ? latestTs : null,
      detail: isLive
        ? 'Membaca konsentrasi PM2.5 & PM10 setelah filtrasi'
        : 'Terpasang pada konfigurasi · Menunggu paket aktual',
    });
  }

  return nodes;
}

function getPanelsSnapshot(): FacadePanel[] {
  return panels.map((panel) => {
    if (panel.id === 'AC-01') {
      return {
        ...panel,
        status: currentMode === 'terhubung_esp32' ? 'Terhubung' : 'Menunggu Koneksi',
        fanStatus:
          currentMode === 'terhubung_esp32'
            ? 'Kipas DC 12V · Aktif (4,8 W)'
            : 'Kipas DC 12V · Siaga',
      };
    }
    return panel;
  });
}

const CONFIG_LABELS: Record<FilterConfigKey, string> = {
  A: 'A. Lapisan Nonwoven Saja',
  B: 'B. Media Serabut Kelapa Saja',
  C: 'C. Nonwoven + Serabut Kelapa',
  D: 'D. Kontrol Tanpa Filter',
};

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'airskin-coir-dashboard' });
});

app.get('/api/system/state', (_req, res) => {
  const telemetry =
    currentMode === 'terhubung_esp32'
      ? realTelemetry
      : currentMode === 'data_simulasi'
        ? simulationSeries
        : [];

  res.json({
    mode: currentMode,
    connectionState: getConnectionState(),
    lastSyncAt,
    config: systemConfig,
    sensors: buildSensors(),
    telemetry,
    simulationPreview: simulationSeries,
    panels: getPanelsSnapshot(),
    experiments,
    maintenance: maintenanceRecords,
    notifications: notifications.slice(0, 8),
  });
});

app.post('/api/system/mode', (req, res) => {
  const { mode } = req.body as { mode?: DataSourceMode };
  if (mode !== 'menunggu_koneksi' && mode !== 'data_simulasi') {
    res.status(400).json({ error: 'Mode harus menunggu_koneksi atau data_simulasi.' });
    return;
  }

  currentMode = realTelemetry.length > 0 && mode === 'menunggu_koneksi' ? 'terhubung_esp32' : mode;
  if (currentMode === 'data_simulasi') {
    simulationSeries = generateSimulationSeries();
    notifications.unshift({
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'warning',
      message: 'Mode DATA SIMULASI diaktifkan. Nilai yang tampil bukan data sensor aktual.',
    });
  } else if (currentMode === 'menunggu_koneksi') {
    lastSyncAt = null;
    notifications.unshift({
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Sistem kembali ke status Menunggu koneksi perangkat keras ESP32.',
    });
  }
  res.json({ mode: currentMode, lastSyncAt });
});

// Ubah pilihan skenario & konfigurasi media DATA SIMULASI
app.post('/api/system/simulation', (req, res) => {
  const body = req.body as {
    scenario?: SimulationScenarioKey;
    filterConfig?: FilterConfigKey;
    activate?: boolean;
  };
  if (
    body.scenario &&
    ['pagi_bersih', 'normal', 'lalu_lintas', 'beban_tinggi'].includes(body.scenario)
  ) {
    systemConfig.simulationScenario = body.scenario;
  }
  if (body.filterConfig && ['A', 'B', 'C', 'D'].includes(body.filterConfig)) {
    systemConfig.simulationFilterConfig = body.filterConfig;
  }
  if (body.activate !== false) {
    currentMode = 'data_simulasi';
  }
  simulationSeries = generateSimulationSeries();
  notifications.unshift({
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: 'warning',
    message: `DATA SIMULASI diperbarui: ${SCENARIO_BASELINES[systemConfig.simulationScenario].label} · Konfigurasi ${systemConfig.simulationFilterConfig}.`,
  });
  res.json({
    mode: currentMode,
    simulationScenario: systemConfig.simulationScenario,
    simulationFilterConfig: systemConfig.simulationFilterConfig,
  });
});

// Endpoint penerimaan data sensor ESP32 (HTTP POST / MQTT Bridge)
app.post('/api/telemetry', (req, res) => {
  const configuredKey = process.env.ESP32_INGEST_KEY;
  if (configuredKey) {
    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token !== configuredKey) {
      res.status(401).json({ error: 'Token otentikasi ESP32 tidak valid.' });
      return;
    }
  }

  const body = req.body as Record<string, unknown>;
  const pm25Inlet = Number(body.pm25Inlet);
  const pm10Inlet = Number(body.pm10Inlet);

  if (!Number.isFinite(pm25Inlet) || pm25Inlet < 0 || pm25Inlet > 2000) {
    res.status(400).json({ error: 'pm25Inlet harus berupa angka valid antara 0 dan 2000' });
    return;
  }
  if (!Number.isFinite(pm10Inlet) || pm10Inlet < 0 || pm10Inlet > 2000) {
    res.status(400).json({ error: 'pm10Inlet harus berupa angka valid antara 0 dan 2000' });
    return;
  }

  const pm25OutletRaw =
    body.pm25Outlet !== undefined && body.pm25Outlet !== null ? Number(body.pm25Outlet) : null;
  const pm10OutletRaw =
    body.pm10Outlet !== undefined && body.pm10Outlet !== null ? Number(body.pm10Outlet) : null;
  const fanPowerRaw =
    body.fanPowerW !== undefined && body.fanPowerW !== null ? Number(body.fanPowerW) : 4.8;

  if (pm25OutletRaw !== null) systemConfig.hasOutletSensor = true;

  const nowIso = new Date().toISOString();
  const point: TelemetryPoint = {
    id: `esp-${Date.now()}`,
    timestamp: nowIso,
    panelId:
      typeof body.panelId === 'string' && body.panelId.trim()
        ? body.panelId.trim().slice(0, 16)
        : systemConfig.activePanelId,
    pm25Inlet: Number(pm25Inlet.toFixed(1)),
    pm25Outlet:
      pm25OutletRaw !== null && Number.isFinite(pm25OutletRaw)
        ? Number(pm25OutletRaw.toFixed(1))
        : null,
    pm10Inlet: Number(pm10Inlet.toFixed(1)),
    pm10Outlet:
      pm10OutletRaw !== null && Number.isFinite(pm10OutletRaw)
        ? Number(pm10OutletRaw.toFixed(1))
        : null,
    fanPowerW: Number.isFinite(fanPowerRaw) ? Number(fanPowerRaw.toFixed(2)) : 4.8,
    airflowActive: true,
    source: 'esp32',
  };

  realTelemetry.push(point);
  if (realTelemetry.length > 500) {
    realTelemetry = realTelemetry.slice(-500);
  }
  currentMode = 'terhubung_esp32';
  lastSyncAt = nowIso;

  notifications.unshift({
    id: `notif-${Date.now()}`,
    timestamp: nowIso,
    level: 'success',
    message: `Paket aktual diterima dari ${point.panelId}: PM2.5 masuk ${point.pm25Inlet} µg/m³.`,
  });

  res.status(201).json({ accepted: true, point });
});

app.delete('/api/telemetry', (_req, res) => {
  realTelemetry = [];
  if (currentMode === 'terhubung_esp32') {
    currentMode = 'menunggu_koneksi';
    lastSyncAt = null;
  }
  res.json({ cleared: true, mode: currentMode });
});

app.put('/api/system/config', (req, res) => {
  const body = req.body as Partial<SystemConfig>;
  if (typeof body.buildingLocation === 'string' && body.buildingLocation.trim()) {
    systemConfig.buildingLocation = body.buildingLocation.trim().slice(0, 120);
  }
  if (typeof body.esp32DeviceId === 'string' && body.esp32DeviceId.trim()) {
    systemConfig.esp32DeviceId = body.esp32DeviceId.trim().slice(0, 64);
  }
  if (typeof body.wifiSsid === 'string' && body.wifiSsid.trim()) {
    systemConfig.wifiSsid = body.wifiSsid.trim().slice(0, 64);
  }
  if (typeof body.mqttBrokerTopic === 'string' && body.mqttBrokerTopic.trim()) {
    systemConfig.mqttBrokerTopic = body.mqttBrokerTopic.trim().slice(0, 96);
  }
  if (typeof body.hasOutletSensor === 'boolean') {
    systemConfig.hasOutletSensor = body.hasOutletSensor;
    simulationSeries = generateSimulationSeries();
  }
  if (typeof body.dcFanInstalled === 'boolean') {
    systemConfig.dcFanInstalled = body.dcFanInstalled;
  }
  if (
    typeof body.activePanelId === 'string' &&
    ['AC-01', 'AC-02', 'AC-03', 'AC-04'].includes(body.activePanelId)
  ) {
    systemConfig.activePanelId = body.activePanelId;
  }
  if (
    typeof body.refreshIntervalSec === 'number' &&
    body.refreshIntervalSec >= 2 &&
    body.refreshIntervalSec <= 300
  ) {
    systemConfig.refreshIntervalSec = Math.round(body.refreshIntervalSec);
  }
  if (body.measurementUnit === 'µg/m³' || body.measurementUnit === 'mg/m³') {
    systemConfig.measurementUnit = body.measurementUnit;
  }
  if (
    typeof body.githubRepo === 'string' &&
    /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(body.githubRepo.trim())
  ) {
    systemConfig.githubRepo = body.githubRepo.trim();
  }
  res.json({ config: systemConfig });
});

// Pengujian kinerja penyaringan
app.post('/api/experiments', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const configKey = body.configKey as FilterConfigKey;
  if (!['A', 'B', 'C', 'D'].includes(configKey)) {
    res.status(400).json({ error: 'configKey harus A, B, C, atau D' });
    return;
  }
  const pm25In = Number(body.pm25Inlet);
  const pm25Out = Number(body.pm25Outlet);
  const pm10In = Number(body.pm10Inlet);
  const pm10Out = Number(body.pm10Outlet);

  if (![pm25In, pm25Out, pm10In, pm10Out].every((v) => Number.isFinite(v) && v > 0)) {
    res.status(400).json({ error: 'Seluruh nilai konsentrasi masuk dan keluar harus lebih dari 0.' });
    return;
  }

  const pm25Eff = Number((((pm25In - pm25Out) / pm25In) * 100).toFixed(1));
  const pm10Eff = Number((((pm10In - pm10Out) / pm10In) * 100).toFixed(1));

  const trial: FilterExperimentTrial = {
    id: `UJI-${Date.now()}`,
    configKey,
    configLabel: CONFIG_LABELS[configKey],
    pm25Inlet: pm25In,
    pm25Outlet: pm25Out,
    pm10Inlet: pm10In,
    pm10Outlet: pm10Out,
    pm25Efficiency: pm25Eff,
    pm10Efficiency: pm10Eff,
    recordedAt: new Date().toISOString(),
    notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 200) : '',
    isSimulation: false,
  };

  experiments = [...experiments.filter((e) => e.configKey !== configKey), trial].sort((a, b) =>
    a.configKey.localeCompare(b.configKey),
  );
  res.status(201).json({ trial, experiments });
});

app.post('/api/experiments/load-sample', (_req, res) => {
  const now = new Date().toISOString();
  experiments = [
    {
      id: 'SIM-A',
      configKey: 'A',
      configLabel: CONFIG_LABELS.A,
      pm25Inlet: 52.0,
      pm25Outlet: 35.4,
      pm10Inlet: 78.0,
      pm10Outlet: 46.8,
      pm25Efficiency: 31.9,
      pm10Efficiency: 40.0,
      recordedAt: now,
      notes: 'DATA SIMULASI — Pratinjau pra-filter nonwoven',
      isSimulation: true,
    },
    {
      id: 'SIM-B',
      configKey: 'B',
      configLabel: CONFIG_LABELS.B,
      pm25Inlet: 52.4,
      pm25Outlet: 28.8,
      pm10Inlet: 79.2,
      pm10Outlet: 35.6,
      pm25Efficiency: 45.0,
      pm10Efficiency: 55.1,
      recordedAt: now,
      notes: 'DATA SIMULASI — Pratinjau media serabut kelapa 35 mm',
      isSimulation: true,
    },
    {
      id: 'SIM-C',
      configKey: 'C',
      configLabel: CONFIG_LABELS.C,
      pm25Inlet: 53.1,
      pm25Outlet: 21.8,
      pm10Inlet: 80.5,
      pm10Outlet: 24.9,
      pm25Efficiency: 58.9,
      pm10Efficiency: 69.1,
      recordedAt: now,
      notes: 'DATA SIMULASI — Pratinjau gabungan nonwoven + serabut kelapa',
      isSimulation: true,
    },
    {
      id: 'SIM-D',
      configKey: 'D',
      configLabel: CONFIG_LABELS.D,
      pm25Inlet: 51.8,
      pm25Outlet: 50.9,
      pm10Inlet: 77.4,
      pm10Outlet: 75.8,
      pm25Efficiency: 1.7,
      pm10Efficiency: 2.1,
      recordedAt: now,
      notes: 'DATA SIMULASI — Kontrol bingkai kosong',
      isSimulation: true,
    },
  ];
  res.json({ experiments });
});

app.delete('/api/experiments', (_req, res) => {
  experiments = [];
  res.json({ experiments });
});

// Pemeliharaan filter
app.post('/api/maintenance', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const panelId = typeof body.panelId === 'string' ? body.panelId : 'AC-01';
  const inspector =
    typeof body.inspector === 'string' && body.inspector.trim()
      ? body.inspector.trim().slice(0, 64)
      : 'Teknisi Lapangan';
  const recordType =
    body.recordType === 'Penggantian Media' || body.recordType === 'Audit Kelembapan & Casing'
      ? body.recordType
      : 'Pemeriksaan Rutin';
  const coirCondition =
    typeof body.coirCondition === 'string' && body.coirCondition.trim()
      ? body.coirCondition.trim().slice(0, 200)
      : 'Serabut kelapa telah diperiksa secara visual.';
  const nonwovenCondition =
    typeof body.nonwovenCondition === 'string' && body.nonwovenCondition.trim()
      ? body.nonwovenCondition.trim().slice(0, 200)
      : 'Lapisan nonwoven telah diperiksa secara visual.';
  const status =
    body.status === 'Perlu Pemeriksaan' || body.status === 'Perlu Pembersihan / Penggantian'
      ? body.status
      : 'Kondisi Baik';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 300) : '';

  const record: MaintenanceRecord = {
    id: `MNT-${Date.now()}`,
    panelId,
    date: new Date().toISOString().slice(0, 10),
    inspector,
    recordType,
    coirCondition,
    nonwovenCondition,
    status,
    notes,
  };

  maintenanceRecords.unshift(record);

  const targetPanel = panels.find((p) => p.id === panelId);
  if (targetPanel) {
    targetPanel.inspectionStatus = status;
    targetPanel.coirCondition = coirCondition;
    targetPanel.nonwovenCondition = nonwovenCondition;
    targetPanel.lastMaintenanceDate = record.date;
    if (status !== 'Kondisi Baik') {
      targetPanel.status = 'Perlu Pemeriksaan';
    }
  }

  res.status(201).json({ record, maintenance: maintenanceRecords, panels: getPanelsSnapshot() });
});

// Integrasi GitHub (token dibaca dari process.env.GITHUB_TOKEN atau sesi memori server)
app.post('/api/github/session-token', (req, res) => {
  const { token } = req.body as { token?: string };
  if (typeof token !== 'string' || !token.trim()) {
    sessionGithubToken = null;
    res.json({ configured: Boolean(process.env.GITHUB_TOKEN) });
    return;
  }
  sessionGithubToken = token.trim();
  res.json({ configured: true });
});

app.get('/api/github/status', async (_req, res) => {
  const token = process.env.GITHUB_TOKEN || sessionGithubToken;
  const repo = systemConfig.githubRepo;
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
    res.status(400).json({ connected: false, error: 'Format nama repositori tidak valid' });
    return;
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'airskin-coir-dashboard',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const repoResp = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!repoResp.ok) {
      res.json({
        connected: false,
        hasToken: Boolean(token),
        repo,
        message: token
          ? `Repositori ${repo} merespons HTTP ${repoResp.status}`
          : 'Atur GITHUB_TOKEN pada server atau masukkan token sesi untuk sinkronisasi otomatis.',
      });
      return;
    }

    const repoData = (await repoResp.json()) as {
      full_name: string;
      html_url: string;
      default_branch: string;
      updated_at: string;
      visibility: string;
    };

    const commitsResp = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=3`, {
      headers,
    });
    const commitsRaw = commitsResp.ok
      ? ((await commitsResp.json()) as Array<{
          sha: string;
          commit: { message: string; author: { date: string } };
        }>)
      : [];

    res.json({
      connected: true,
      hasToken: Boolean(token),
      repo: repoData.full_name,
      htmlUrl: repoData.html_url,
      defaultBranch: repoData.default_branch,
      visibility: repoData.visibility,
      updatedAt: repoData.updated_at,
      recentCommits: commitsRaw.map((c) => ({
        sha: c.sha.slice(0, 7),
        message: c.commit.message.split('\n')[0],
        date: c.commit.author.date,
      })),
    });
  } catch {
    res.json({
      connected: false,
      hasToken: Boolean(token),
      repo,
      message: 'Tidak dapat menjangkau API GitHub dari jaringan saat ini.',
    });
  }
});

app.post('/api/github/sync-snapshot', async (req, res) => {
  const token = process.env.GITHUB_TOKEN || sessionGithubToken;
  if (!token) {
    res.status(400).json({
      error: 'GITHUB_TOKEN belum dikonfigurasi. Atur di Secrets server atau hubungkan token sesi.',
    });
    return;
  }

  const repo = systemConfig.githubRepo;
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
    res.status(400).json({ error: 'Format nama repositori tidak valid' });
    return;
  }

  const snapshot = {
    exportedAt: new Date().toISOString(),
    system: 'AIRSKIN COIR — Sistem Pemantauan Filtrasi Udara Berbasis IoT',
    mode: currentMode,
    config: systemConfig,
    telemetryCount: realTelemetry.length,
    latestTelemetry: realTelemetry.slice(-24),
    experiments,
    maintenanceRecords,
    note:
      typeof req.body?.note === 'string'
        ? req.body.note.slice(0, 140)
        : 'Sinkronisasi snapshot telemetri dashboard',
  };

  const filePath = `snapshots/airskin-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
  const encodedContent = Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8').toString('base64');

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'airskin-coir-dashboard',
    'Content-Type': 'application/json',
  };

  try {
    let existingSha: string | undefined;
    const checkResp = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers,
    });
    if (checkResp.ok) {
      const existing = (await checkResp.json()) as { sha?: string };
      existingSha = existing.sha;
    }

    const putResp = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
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
      res.status(putResp.status).json({ error: `Kesalahan GitHub API: ${errText.slice(0, 200)}` });
      return;
    }

    const result = (await putResp.json()) as { content?: { html_url?: string; path?: string } };
    res.json({
      synced: true,
      path: result.content?.path || filePath,
      url: result.content?.html_url || `https://github.com/${repo}`,
    });
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
        res.status(404).send('Berkas build tidak ditemukan. Jalankan npm run build terlebih dahulu.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server AIRSKIN COIR berjalan di http://localhost:${PORT}`);
  });
}

startServer();
