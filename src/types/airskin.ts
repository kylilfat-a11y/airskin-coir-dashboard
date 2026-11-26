export type NavSection =
  | 'overview'
  | 'live'
  | 'panels'
  | 'analytics'
  | 'performance'
  | 'maintenance'
  | 'reports'
  | 'settings';

export type DataSourceMode = 'hardware_standby' | 'demo_simulation' | 'live_esp32';

export type TimeRangeFilter = '1h' | '6h' | '24h' | '7d';

export type MaintenanceStatus =
  | 'Good Condition'
  | 'Inspection Required'
  | 'Replacement Recommended';

export type PanelConnectionStatus = 'Connected' | 'Needs Inspection' | 'Offline';

export interface TelemetryPoint {
  id: string;
  timestamp: string;
  panelId: string;
  pm25Inlet: number | null;
  pm25Outlet: number | null;
  pm10Inlet: number | null;
  pm10Outlet: number | null;
  pressureDropPa: number | null;
  airflowM3h: number | null;
  fanPowerW: number | null;
  source: 'esp32' | 'demo' | 'uploaded';
}

export interface SensorNodeStatus {
  id: string;
  name: string;
  hardwareModel: string;
  online: boolean;
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
  status: PanelConnectionStatus;
  classification: 'Prototype Bay' | 'Demo Panel · Planned Module';
  pmMonitoringAvailable: boolean;
  inspectionStatus: MaintenanceStatus;
  cartridgeCondition: string;
  coirMediaSpec: string;
  nonwovenPrefilterSpec: string;
  fanStatus: string;
  lastMaintenanceDate: string;
  hotspotX: number; // % on 3D isometric visual
  hotspotY: number; // % on 3D isometric visual
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
  pressureDropPa: number | null;
  airflowM3h: number | null;
  fanPowerW: number | null;
  recordedAt: string;
  notes: string;
  isSampleDemo: boolean;
}

export interface MaintenanceRecord {
  id: string;
  panelId: string;
  date: string;
  inspector: string;
  recordType: 'Routine Inspection' | 'Cartridge Replacement' | 'Moisture & Frame Audit';
  moistureLevelPct: number;
  visibleDamage: boolean;
  dustLoadingNote: string;
  status: MaintenanceStatus;
  notes: string;
}

export interface SystemConfig {
  buildingLocation: string;
  esp32DeviceId: string;
  firmwareVersion: string;
  wifiSsid: string;
  wifiSignalDbm: number | null;
  hasOutletSensor: boolean;
  hasPressureSensor: boolean;
  hasAirflowSensor: boolean;
  activePanelId: string;
  refreshIntervalSec: number;
  measurementUnit: 'µg/m³' | 'mg/m³';
  githubRepo: string;
}

export interface SystemStatePayload {
  mode: DataSourceMode;
  lastSyncAt: string | null;
  config: SystemConfig;
  sensors: SensorNodeStatus[];
  telemetry: TelemetryPoint[];
  panels: FacadePanel[];
  experiments: FilterExperimentTrial[];
  maintenance: MaintenanceRecord[];
}
