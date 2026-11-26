import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  DataSourceMode,
  FacadePanel,
  FilterConfigKey,
  FilterExperimentTrial,
  MaintenanceRecord,
  SensorNodeStatus,
  SystemConfig,
  TelemetryPoint,
} from './src/types/airskin.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// In-memory state store (persists during server lifetime; starts clean in Hardware Standby)
let currentMode: DataSourceMode = 'hardware_standby';
let lastSyncAt: string | null = null;

const systemConfig: SystemConfig = {
  buildingLocation: 'Bandung Sustainable Living Lab · West Curtain Wall',
  esp32DeviceId: 'ESP32-WROOM-32E-AC01',
  firmwareVersion: 'airskin-fw-1.2.0',
  wifiSsid: 'LivingLab-IoT-2.4G',
  wifiSignalDbm: null,
  hasOutletSensor: false,
  hasPressureSensor: false,
  hasAirflowSensor: false,
  activePanelId: 'AC-01',
  refreshIntervalSec: 10,
  measurementUnit: 'µg/m³',
  githubRepo: process.env.GITHUB_REPO || 'kylilfat-a11y/airskin-coir-dashboard',
};

let realTelemetry: TelemetryPoint[] = [];
let demoTelemetry: TelemetryPoint[] = [];
let experiments: FilterExperimentTrial[] = [];

const panels: FacadePanel[] = [
  {
    id: 'AC-01',
    label: 'Panel AC-01',
    location: 'Level 2 · North-West Curtain Wall',
    level: 'Level 2',
    facadeZone: 'North-West Bay',
    status: 'Offline',
    classification: 'Prototype Bay',
    pmMonitoringAvailable: true,
    inspectionStatus: 'Good Condition',
    cartridgeCondition: 'Clean coir fiber matrix · Verified 2026-11-18',
    coirMediaSpec: 'Compressed Cocos nucifera fiber (35 mm depth, 140 kg/m³)',
    nonwovenPrefilterSpec: 'Spunbond polypropylene G3 pre-stage (8 mm)',
    fanStatus: '12V DC Axial Fan · Standby',
    lastMaintenanceDate: '2026-11-18',
    hotspotX: 31,
    hotspotY: 63,
  },
  {
    id: 'AC-02',
    label: 'Panel AC-02',
    location: 'Level 5 · North-West Upper Bay',
    level: 'Level 5',
    facadeZone: 'North-West Upper',
    status: 'Offline',
    classification: 'Demo Panel · Planned Module',
    pmMonitoringAvailable: false,
    inspectionStatus: 'Good Condition',
    cartridgeCondition: 'Planned modular bay · Cartridge staged',
    coirMediaSpec: 'Compressed Cocos nucifera fiber (35 mm depth, 140 kg/m³)',
    nonwovenPrefilterSpec: 'Spunbond polypropylene G3 pre-stage (8 mm)',
    fanStatus: 'Planned Module · Not Electrified',
    lastMaintenanceDate: '2026-11-10',
    hotspotX: 33,
    hotspotY: 36,
  },
  {
    id: 'AC-03',
    label: 'Panel AC-03',
    location: 'Level 3 · East Facade Corridor',
    level: 'Level 3',
    facadeZone: 'East Curtain Wall',
    status: 'Needs Inspection',
    classification: 'Demo Panel · Planned Module',
    pmMonitoringAvailable: false,
    inspectionStatus: 'Inspection Required',
    cartridgeCondition: 'Scheduled moisture & gasket seal check',
    coirMediaSpec: 'Compressed Cocos nucifera fiber (35 mm depth, 140 kg/m³)',
    nonwovenPrefilterSpec: 'Spunbond polypropylene G3 pre-stage (8 mm)',
    fanStatus: 'Planned Module · Not Electrified',
    lastMaintenanceDate: '2026-10-14',
    hotspotX: 69,
    hotspotY: 51,
  },
  {
    id: 'AC-04',
    label: 'Panel AC-04',
    location: 'Level 6 · Upper Atrium Louver',
    level: 'Level 6',
    facadeZone: 'Upper Atrium',
    status: 'Offline',
    classification: 'Demo Panel · Planned Module',
    pmMonitoringAvailable: false,
    inspectionStatus: 'Good Condition',
    cartridgeCondition: 'Architectural integration mockup',
    coirMediaSpec: 'Compressed Cocos nucifera fiber (35 mm depth, 140 kg/m³)',
    nonwovenPrefilterSpec: 'Spunbond polypropylene G3 pre-stage (8 mm)',
    fanStatus: 'Planned Module · Not Electrified',
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
    recordType: 'Routine Inspection',
    moistureLevelPct: 11.4,
    visibleDamage: false,
    dustLoadingNote: 'Light surface particulate accumulation on nonwoven prefilter.',
    status: 'Good Condition',
    notes: 'Coir weave intact, aluminum perimeter gasket sealed cleanly.',
  },
  {
    id: 'MNT-2026-03',
    panelId: 'AC-03',
    date: '2026-10-14',
    inspector: 'R. Pratama',
    recordType: 'Moisture & Frame Audit',
    moistureLevelPct: 18.7,
    visibleDamage: false,
    dustLoadingNote: 'Post-rain perimeter condensation noted near lower louver.',
    status: 'Inspection Required',
    notes: 'Recommend follow-up desiccant dry check after monsoon week.',
  },
  {
    id: 'MNT-2026-02',
    panelId: 'AC-01',
    date: '2026-09-25',
    inspector: 'Kaylilla Faticha',
    recordType: 'Cartridge Replacement',
    moistureLevelPct: 10.2,
    visibleDamage: false,
    dustLoadingNote: 'Previous test cartridge reached 90-day field cycle.',
    status: 'Good Condition',
    notes: 'Installed fresh 35 mm coconut coir + G3 nonwoven cartridge batch #C-09.',
  },
];

function generateDemoSeries(): TelemetryPoint[] {
  const now = Date.now();
  const points: TelemetryPoint[] = [];
  const totalPoints = 48; // 7d/24h/6h/1h sliceable
  for (let i = totalPoints - 1; i >= 0; i--) {
    const ts = new Date(now - i * 30 * 60 * 1000).toISOString();
    const wave = Math.sin(i * 0.45) * 6.5 + Math.cos(i * 0.22) * 3.8;
    const pm25Inlet = Number((44.2 + wave).toFixed(1));
    const pm25Outlet = systemConfig.hasOutletSensor
      ? Number((pm25Inlet * (0.44 + (i % 5) * 0.012)).toFixed(1))
      : null;
    const pm10Inlet = Number((68.5 + wave * 1.35).toFixed(1));
    const pm10Outlet = systemConfig.hasOutletSensor
      ? Number((pm10Inlet * (0.37 + (i % 4) * 0.01)).toFixed(1))
      : null;

    points.push({
      id: `demo-${i}`,
      timestamp: ts,
      panelId: systemConfig.activePanelId,
      pm25Inlet,
      pm25Outlet,
      pm10Inlet,
      pm10Outlet,
      pressureDropPa: systemConfig.hasPressureSensor ? Number((28.4 + Math.sin(i * 0.3) * 1.8).toFixed(1)) : null,
      airflowM3h: systemConfig.hasAirflowSensor ? Number((46.2 + Math.cos(i * 0.3) * 1.5).toFixed(1)) : null,
      fanPowerW: 4.8,
      source: 'demo',
    });
  }
  return points;
}

function buildSensors(): SensorNodeStatus[] {
  const isLive = currentMode === 'live_esp32';
  const isDemo = currentMode === 'demo_simulation';
  const activeSeries = isLive ? realTelemetry : isDemo ? demoTelemetry : [];
  const latestTs = activeSeries.length > 0 ? activeSeries[activeSeries.length - 1].timestamp : null;

  const nodes: SensorNodeStatus[] = [
    {
      id: 'esp32',
      name: 'ESP32 Controller',
      hardwareModel: systemConfig.esp32DeviceId,
      online: isLive || isDemo,
      installed: true,
      lastReceivedAt: latestTs,
      detail: isLive
        ? `Live HTTP telemetry (${systemConfig.firmwareVersion})`
        : isDemo
          ? 'Demo simulation active (virtual node)'
          : 'Awaiting hardware handshake on /api/telemetry',
    },
    {
      id: 'pm-inlet',
      name: 'PM Sensor Inlet',
      hardwareModel: 'PMS5003 Laser Scattering · CH1',
      online: isLive || isDemo,
      installed: true,
      lastReceivedAt: latestTs,
      detail: isLive || isDemo ? 'Measuring ambient inlet PM2.5 & PM10' : 'Awaiting first sensor packet',
    },
    {
      id: 'wifi',
      name: 'Wi-Fi Connection',
      hardwareModel: systemConfig.wifiSsid,
      online: isLive || isDemo,
      installed: true,
      lastReceivedAt: latestTs,
      detail: isLive
        ? `RSSI ${systemConfig.wifiSignalDbm ?? -62} dBm`
        : isDemo
          ? 'Simulated local telemetry link'
          : 'Disconnected — Waiting for ESP32 uplink',
    },
  ];

  // Only include PM Sensor Outlet if hardware has a second sensor installed
  if (systemConfig.hasOutletSensor) {
    nodes.splice(2, 0, {
      id: 'pm-outlet',
      name: 'PM Sensor Outlet',
      hardwareModel: 'PMS5003 Laser Scattering · CH2',
      online: isLive || isDemo,
      installed: true,
      lastReceivedAt: latestTs,
      detail: isLive || isDemo ? 'Measuring post-coir outlet airflow' : 'Installed · Awaiting packet',
    });
  }

  return nodes;
}

function getPanelsSnapshot(): FacadePanel[] {
  return panels.map((panel) => {
    if (panel.id === 'AC-01') {
      return {
        ...panel,
        status:
          currentMode === 'live_esp32' || currentMode === 'demo_simulation'
            ? 'Connected'
            : 'Offline',
        fanStatus:
          currentMode === 'live_esp32' || currentMode === 'demo_simulation'
            ? '12V DC Axial Fan · Active (4.8 W)'
            : '12V DC Axial Fan · Standby',
      };
    }
    return panel;
  });
}

const CONFIG_LABELS: Record<FilterConfigKey, string> = {
  A: 'A. Nonwoven only',
  B: 'B. Coconut coir only',
  C: 'C. Nonwoven + coconut coir',
  D: 'D. No-filter control',
};

const app = express();
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'airskin-coir-dashboard' });
});

// Unified state snapshot
app.get('/api/system/state', (_req, res) => {
  if (currentMode === 'demo_simulation' && demoTelemetry.length === 0) {
    demoTelemetry = generateDemoSeries();
  }
  const telemetry =
    currentMode === 'live_esp32'
      ? realTelemetry
      : currentMode === 'demo_simulation'
        ? demoTelemetry
        : [];

  res.json({
    mode: currentMode,
    lastSyncAt,
    config: systemConfig,
    sensors: buildSensors(),
    telemetry,
    panels: getPanelsSnapshot(),
    experiments,
    maintenance: maintenanceRecords,
  });
});

// Switch between Hardware Standby and Demo Simulation
app.post('/api/system/mode', (req, res) => {
  const { mode } = req.body as { mode?: DataSourceMode };
  if (mode !== 'hardware_standby' && mode !== 'demo_simulation') {
    res.status(400).json({ error: 'Invalid mode. Use hardware_standby or demo_simulation.' });
    return;
  }
  currentMode = realTelemetry.length > 0 && mode === 'hardware_standby' ? 'live_esp32' : mode;
  if (currentMode === 'demo_simulation') {
    demoTelemetry = generateDemoSeries();
    lastSyncAt = new Date().toISOString();
  } else if (currentMode === 'hardware_standby') {
    lastSyncAt = null;
  }
  res.json({ mode: currentMode, lastSyncAt });
});

// Real ESP32 telemetry ingestion endpoint
app.post('/api/telemetry', (req, res) => {
  const configuredKey = process.env.ESP32_INGEST_KEY;
  if (configuredKey) {
    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token !== configuredKey) {
      res.status(401).json({ error: 'Invalid ESP32 ingest token' });
      return;
    }
  }

  const body = req.body as Record<string, unknown>;
  const pm25Inlet = Number(body.pm25Inlet);
  const pm10Inlet = Number(body.pm10Inlet);

  if (!Number.isFinite(pm25Inlet) || pm25Inlet < 0 || pm25Inlet > 2000) {
    res.status(400).json({ error: 'pm25Inlet must be a valid number between 0 and 2000' });
    return;
  }
  if (!Number.isFinite(pm10Inlet) || pm10Inlet < 0 || pm10Inlet > 2000) {
    res.status(400).json({ error: 'pm10Inlet must be a valid number between 0 and 2000' });
    return;
  }

  const pm25OutletRaw = body.pm25Outlet !== undefined && body.pm25Outlet !== null ? Number(body.pm25Outlet) : null;
  const pm10OutletRaw = body.pm10Outlet !== undefined && body.pm10Outlet !== null ? Number(body.pm10Outlet) : null;
  const pressureRaw = body.pressureDropPa !== undefined && body.pressureDropPa !== null ? Number(body.pressureDropPa) : null;
  const airflowRaw = body.airflowM3h !== undefined && body.airflowM3h !== null ? Number(body.airflowM3h) : null;
  const fanPowerRaw = body.fanPowerW !== undefined && body.fanPowerW !== null ? Number(body.fanPowerW) : 4.8;

  if (pm25OutletRaw !== null) systemConfig.hasOutletSensor = true;
  if (pressureRaw !== null) systemConfig.hasPressureSensor = true;
  if (airflowRaw !== null) systemConfig.hasAirflowSensor = true;

  const nowIso = new Date().toISOString();
  const point: TelemetryPoint = {
    id: `esp-${Date.now()}`,
    timestamp: nowIso,
    panelId: typeof body.panelId === 'string' && body.panelId.trim() ? body.panelId.trim().slice(0, 16) : systemConfig.activePanelId,
    pm25Inlet: Number(pm25Inlet.toFixed(1)),
    pm25Outlet: pm25OutletRaw !== null && Number.isFinite(pm25OutletRaw) ? Number(pm25OutletRaw.toFixed(1)) : null,
    pm10Inlet: Number(pm10Inlet.toFixed(1)),
    pm10Outlet: pm10OutletRaw !== null && Number.isFinite(pm10OutletRaw) ? Number(pm10OutletRaw.toFixed(1)) : null,
    pressureDropPa: pressureRaw !== null && Number.isFinite(pressureRaw) ? Number(pressureRaw.toFixed(1)) : null,
    airflowM3h: airflowRaw !== null && Number.isFinite(airflowRaw) ? Number(airflowRaw.toFixed(1)) : null,
    fanPowerW: Number.isFinite(fanPowerRaw) ? Number(fanPowerRaw.toFixed(2)) : 4.8,
    source: 'esp32',
  };

  realTelemetry.push(point);
  if (realTelemetry.length > 500) {
    realTelemetry = realTelemetry.slice(-500);
  }
  currentMode = 'live_esp32';
  lastSyncAt = nowIso;
  if (typeof body.wifiSignalDbm === 'number' && Number.isFinite(body.wifiSignalDbm)) {
    systemConfig.wifiSignalDbm = body.wifiSignalDbm;
  }

  res.status(201).json({ accepted: true, point });
});

// Clear live telemetry back to Hardware Standby
app.delete('/api/telemetry', (_req, res) => {
  realTelemetry = [];
  if (currentMode === 'live_esp32') {
    currentMode = 'hardware_standby';
    lastSyncAt = null;
  }
  res.json({ cleared: true, mode: currentMode });
});

// Update system configuration
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
  if (typeof body.hasOutletSensor === 'boolean') {
    systemConfig.hasOutletSensor = body.hasOutletSensor;
    if (currentMode === 'demo_simulation') {
      demoTelemetry = generateDemoSeries();
    }
  }
  if (typeof body.hasPressureSensor === 'boolean') {
    systemConfig.hasPressureSensor = body.hasPressureSensor;
    if (currentMode === 'demo_simulation') {
      demoTelemetry = generateDemoSeries();
    }
  }
  if (typeof body.hasAirflowSensor === 'boolean') {
    systemConfig.hasAirflowSensor = body.hasAirflowSensor;
    if (currentMode === 'demo_simulation') {
      demoTelemetry = generateDemoSeries();
    }
  }
  if (typeof body.activePanelId === 'string' && ['AC-01', 'AC-02', 'AC-03', 'AC-04'].includes(body.activePanelId)) {
    systemConfig.activePanelId = body.activePanelId;
  }
  if (typeof body.refreshIntervalSec === 'number' && body.refreshIntervalSec >= 2 && body.refreshIntervalSec <= 300) {
    systemConfig.refreshIntervalSec = Math.round(body.refreshIntervalSec);
  }
  if (body.measurementUnit === 'µg/m³' || body.measurementUnit === 'mg/m³') {
    systemConfig.measurementUnit = body.measurementUnit;
  }
  if (typeof body.githubRepo === 'string' && /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(body.githubRepo.trim())) {
    systemConfig.githubRepo = body.githubRepo.trim();
  }
  res.json({ config: systemConfig });
});

// Filter performance experiments (A/B/C/D)
app.post('/api/experiments', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const configKey = body.configKey as FilterConfigKey;
  if (!['A', 'B', 'C', 'D'].includes(configKey)) {
    res.status(400).json({ error: 'configKey must be A, B, C, or D' });
    return;
  }
  const pm25In = Number(body.pm25Inlet);
  const pm25Out = Number(body.pm25Outlet);
  const pm10In = Number(body.pm10Inlet);
  const pm10Out = Number(body.pm10Outlet);

  if (![pm25In, pm25Out, pm10In, pm10Out].every((v) => Number.isFinite(v) && v > 0)) {
    res.status(400).json({ error: 'All inlet and outlet PM values must be positive numbers.' });
    return;
  }

  const pm25Eff = Number((((pm25In - pm25Out) / pm25In) * 100).toFixed(1));
  const pm10Eff = Number((((pm10In - pm10Out) / pm10In) * 100).toFixed(1));
  const pressureDropPa =
    body.pressureDropPa !== null && body.pressureDropPa !== '' && body.pressureDropPa !== undefined
      ? Number(body.pressureDropPa)
      : null;
  const airflowM3h =
    body.airflowM3h !== null && body.airflowM3h !== '' && body.airflowM3h !== undefined
      ? Number(body.airflowM3h)
      : null;
  const fanPowerW =
    body.fanPowerW !== null && body.fanPowerW !== '' && body.fanPowerW !== undefined
      ? Number(body.fanPowerW)
      : null;

  const trial: FilterExperimentTrial = {
    id: `EXP-${Date.now()}`,
    configKey,
    configLabel: CONFIG_LABELS[configKey],
    pm25Inlet: pm25In,
    pm25Outlet: pm25Out,
    pm10Inlet: pm10In,
    pm10Outlet: pm10Out,
    pm25Efficiency: pm25Eff,
    pm10Efficiency: pm10Eff,
    pressureDropPa: pressureDropPa !== null && Number.isFinite(pressureDropPa) ? pressureDropPa : null,
    airflowM3h: airflowM3h !== null && Number.isFinite(airflowM3h) ? airflowM3h : null,
    fanPowerW: fanPowerW !== null && Number.isFinite(fanPowerW) ? fanPowerW : null,
    recordedAt: new Date().toISOString(),
    notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 200) : '',
    isSampleDemo: false,
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
      id: 'DEMO-A',
      configKey: 'A',
      configLabel: CONFIG_LABELS.A,
      pm25Inlet: 52.0,
      pm25Outlet: 35.4,
      pm10Inlet: 78.0,
      pm10Outlet: 46.8,
      pm25Efficiency: 31.9,
      pm10Efficiency: 40.0,
      pressureDropPa: 14.2,
      airflowM3h: 54.0,
      fanPowerW: 4.5,
      recordedAt: now,
      notes: 'Sample reference trial — Spunbond G3 prefilter only',
      isSampleDemo: true,
    },
    {
      id: 'DEMO-B',
      configKey: 'B',
      configLabel: CONFIG_LABELS.B,
      pm25Inlet: 52.4,
      pm25Outlet: 28.8,
      pm10Inlet: 79.2,
      pm10Outlet: 35.6,
      pm25Efficiency: 45.0,
      pm10Efficiency: 55.1,
      pressureDropPa: 22.8,
      airflowM3h: 48.5,
      fanPowerW: 4.7,
      recordedAt: now,
      notes: 'Sample reference trial — 35 mm compressed coconut coir media',
      isSampleDemo: true,
    },
    {
      id: 'DEMO-C',
      configKey: 'C',
      configLabel: CONFIG_LABELS.C,
      pm25Inlet: 53.1,
      pm25Outlet: 21.8,
      pm10Inlet: 80.5,
      pm10Outlet: 24.9,
      pm25Efficiency: 58.9,
      pm10Efficiency: 69.1,
      pressureDropPa: 31.5,
      airflowM3h: 44.2,
      fanPowerW: 4.9,
      recordedAt: now,
      notes: 'Sample reference trial — Dual-stage Nonwoven + Coconut Coir',
      isSampleDemo: true,
    },
    {
      id: 'DEMO-D',
      configKey: 'D',
      configLabel: CONFIG_LABELS.D,
      pm25Inlet: 51.8,
      pm25Outlet: 50.9,
      pm10Inlet: 77.4,
      pm10Outlet: 75.8,
      pm25Efficiency: 1.7,
      pm10Efficiency: 2.1,
      pressureDropPa: 2.1,
      airflowM3h: 62.0,
      fanPowerW: 4.2,
      recordedAt: now,
      notes: 'Sample reference trial — Empty frame baseline control',
      isSampleDemo: true,
    },
  ];
  res.json({ experiments });
});

app.delete('/api/experiments', (_req, res) => {
  experiments = [];
  res.json({ experiments });
});

// Maintenance records
app.post('/api/maintenance', (req, res) => {
  const body = req.body as Record<string, unknown>;
  const panelId = typeof body.panelId === 'string' ? body.panelId : 'AC-01';
  const inspector = typeof body.inspector === 'string' && body.inspector.trim() ? body.inspector.trim().slice(0, 64) : 'Field Engineer';
  const recordType =
    body.recordType === 'Cartridge Replacement' || body.recordType === 'Moisture & Frame Audit'
      ? body.recordType
      : 'Routine Inspection';
  const moistureLevelPct = Number(body.moistureLevelPct);
  const visibleDamage = Boolean(body.visibleDamage);
  const status =
    body.status === 'Inspection Required' || body.status === 'Replacement Recommended'
      ? body.status
      : 'Good Condition';
  const dustLoadingNote = typeof body.dustLoadingNote === 'string' ? body.dustLoadingNote.trim().slice(0, 200) : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 300) : '';

  if (!Number.isFinite(moistureLevelPct) || moistureLevelPct < 0 || moistureLevelPct > 100) {
    res.status(400).json({ error: 'Moisture level must be between 0 and 100%.' });
    return;
  }

  const record: MaintenanceRecord = {
    id: `MNT-${Date.now()}`,
    panelId,
    date: new Date().toISOString().slice(0, 10),
    inspector,
    recordType,
    moistureLevelPct: Number(moistureLevelPct.toFixed(1)),
    visibleDamage,
    dustLoadingNote: dustLoadingNote || 'Visual media check recorded.',
    status,
    notes,
  };

  maintenanceRecords.unshift(record);

  // Sync panel's recorded inspection status (based strictly on manual inspection record, never PM sensor alone)
  const targetPanel = panels.find((p) => p.id === panelId);
  if (targetPanel) {
    targetPanel.inspectionStatus = status;
    targetPanel.lastMaintenanceDate = record.date;
    if (status === 'Inspection Required' || status === 'Replacement Recommended') {
      targetPanel.status = 'Needs Inspection';
    }
  }

  res.status(201).json({ record, maintenance: maintenanceRecords, panels: getPanelsSnapshot() });
});

// GitHub Integration (reads server-side process.env.GITHUB_TOKEN; never hardcodes secrets)
app.get('/api/github/status', async (_req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const repo = systemConfig.githubRepo;
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
    res.status(400).json({ connected: false, error: 'Invalid repository slug format' });
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
          ? `Repository ${repo} returned HTTP ${repoResp.status}`
          : 'Configure GITHUB_TOKEN in server environment to enable authenticated sync',
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

    const commitsResp = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=3`, { headers });
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
      message: 'Unable to reach GitHub API from current network.',
    });
  }
});

app.post('/api/github/sync-snapshot', async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(400).json({
      error: 'GITHUB_TOKEN is not configured in server environment secrets.',
    });
    return;
  }

  const repo = systemConfig.githubRepo;
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)) {
    res.status(400).json({ error: 'Invalid repository slug' });
    return;
  }

  const snapshot = {
    exportedAt: new Date().toISOString(),
    system: 'AIRSKIN COIR — Smart Air Quality Monitoring',
    mode: currentMode,
    config: systemConfig,
    telemetryCount: currentMode === 'live_esp32' ? realTelemetry.length : demoTelemetry.length,
    latestTelemetry:
      (currentMode === 'live_esp32' ? realTelemetry : demoTelemetry).slice(-24),
    experiments,
    maintenanceRecords,
    note: typeof req.body?.note === 'string' ? req.body.note.slice(0, 140) : 'Scheduled snapshot export',
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
    // Check if file already exists to obtain sha for update
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
        message: `chore(telemetry): sync AIRSKIN COIR snapshot ${new Date().toISOString().slice(0, 10)}`,
        content: encodedContent,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      res.status(putResp.status).json({ error: `GitHub API error: ${errText.slice(0, 200)}` });
      return;
    }

    const result = (await putResp.json()) as { content?: { html_url?: string; path?: string } };
    res.json({
      synced: true,
      path: result.content?.path || filePath,
      url: result.content?.html_url || `https://github.com/${repo}`,
    });
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
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AIRSKIN COIR server listening on http://localhost:${PORT}`);
  });
}

startServer();
