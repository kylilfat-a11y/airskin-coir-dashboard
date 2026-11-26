export type NavSection =
  | 'ringkasan'
  | 'pemantauan'
  | 'panel'
  | 'kinerja'
  | 'analisis'
  | 'pemeliharaan'
  | 'laporan'
  | 'pengaturan';

export type DataSourceMode = 'menunggu_koneksi' | 'data_simulasi' | 'terhubung_esp32';

export type DeviceConnectionState = 'Terhubung' | 'Terputus' | 'Menunggu koneksi';

export type TimeRangeFilter = '1h' | '6h' | '24h' | '7d';

export type MaintenanceStatus =
  | 'Kondisi Baik'
  | 'Perlu Pemeriksaan'
  | 'Perlu Pembersihan / Penggantian';

export type PanelOperationalStatus = 'Terhubung' | 'Perlu Pemeriksaan' | 'Menunggu Koneksi';

export interface TelemetryPoint {
  id: string;
  timestamp: string;
  panelId: string;
  pm25Inlet: number | null;
  pm25Outlet: number | null;
  pm10Inlet: number | null;
  pm10Outlet: number | null;
  fanPowerW: number | null;
  airflowActive: boolean;
  source: 'esp32' | 'simulasi';
}

export interface SensorNodeStatus {
  id: string;
  name: string;
  hardwareModel: string;
  status: DeviceConnectionState;
  installed: boolean;
  lastReceivedAt: string | null;
  detail: string;
}

export interface FacadePanel {
  id: string;
  label: string;
  location: string;
  level: string;
  facadeZone: string;
  status: PanelOperationalStatus;
  classification: 'Modul Prototipe Utama' | 'Modul Konsep / Rencana';
  pmMonitoringAvailable: boolean;
  inspectionStatus: MaintenanceStatus;
  coirCondition: string;
  nonwovenCondition: string;
  fanStatus: string;
  lastMaintenanceDate: string;
  hotspotX: number;
  hotspotY: number;
}

export type FilterConfigKey = 'A' | 'B' | 'C' | 'D';

export interface FilterExperimentTrial {
  id: string;
  configKey: FilterConfigKey;
  configLabel: string;
  pm25Inlet: number;
  pm25Outlet: number;
  pm10Inlet: number;
  pm10Outlet: number;
  pm25Efficiency: number;
  pm10Efficiency: number;
  recordedAt: string;
  notes: string;
  isSimulation: boolean;
}

export interface MaintenanceRecord {
  id: string;
  panelId: string;
  date: string;
  inspector: string;
  recordType: 'Pemeriksaan Rutin' | 'Penggantian Media' | 'Audit Kelembapan & Casing';
  coirCondition: string;
  nonwovenCondition: string;
  status: MaintenanceStatus;
  notes: string;
}

export interface SystemConfig {
  buildingLocation: string;
  esp32DeviceId: string;
  firmwareVersion: string;
  wifiSsid: string;
  wifiSignalDbm: number | null;
  mqttBrokerTopic: string;
  hasOutletSensor: boolean;
  dcFanInstalled: boolean;
  activePanelId: string;
  refreshIntervalSec: number;
  measurementUnit: 'µg/m³' | 'mg/m³';
  githubRepo: string;
}

export interface DeviceNotification {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'success';
  message: string;
}

export interface SystemStatePayload {
  mode: DataSourceMode;
  connectionState: DeviceConnectionState;
  lastSyncAt: string | null;
  config: SystemConfig;
  sensors: SensorNodeStatus[];
  telemetry: TelemetryPoint[];
  simulationPreview: TelemetryPoint[];
  panels: FacadePanel[];
  experiments: FilterExperimentTrial[];
  maintenance: MaintenanceRecord[];
  notifications: DeviceNotification[];
}
