export type NavSection =
  | 'ringkasan'
  | 'pemantauan'
  | 'panel'
  | 'simulasi'
  | 'kinerja'
  | 'analisis'
  | 'pemeliharaan'
  | 'laporan'
  | 'pengaturan';

export type ConnectionState = 'Terhubung' | 'Terputus' | 'Menunggu koneksi';

export type DataSourceMode = 'aktual' | 'simulasi';

export type TimeRangeFilter = '1h' | '6h' | '24h' | '7d';

export interface TelemetryPoint {
  id: string;
  timestamp: string;
  pm25Inlet: number | null;
  pm25Outlet: number | null;
  pm10Inlet: number | null;
  pm10Outlet: number | null;
  source: 'esp32' | 'simulasi';
}

export interface MaintenanceRecord {
  id: string;
  tanggal: string;
  komponen: 'Media Serabut Kelapa' | 'Lapisan Nonwoven' | 'Panel & Kipas DC';
  tindakan: string;
  catatan: string;
  petugas: string;
  jenis: 'pemeriksaan' | 'penggantian' | 'catatan';
}

export interface SensorSettings {
  intervalKirimDetik: number;
  topikMqtt: string;
  ambangPm25Peringatan: number;
  ambangPm10Peringatan: number;
  fanPwmPersen: number;
}

export interface DeviceStatusSummary {
  connectionState: ConnectionState;
  esp32Connected: boolean;
  pmSensorConnected: boolean;
  fanStatus: 'Aktif' | 'Siaga' | 'Terputus';
  dataTransmissionStatus: 'Mengalir' | 'Menunggu' | 'Terputus';
  lastDataReceived: string | null;
  esp32DeviceId: string;
  mqttTopic: string;
  firmwareVersion: string;
}

export interface SimulationConfig {
  running: boolean;
  paused: boolean;
  initialPm25Inlet: number;
  initialPm10Inlet: number;
  efficiencyPm25Pct: number;
  efficiencyPm10Pct: number;
  startedAt: string | null;
  elapsedSeconds: number;
}

export interface SystemStatePayload {
  dataSourceMode: DataSourceMode;
  deviceConnected: boolean;
  connectionState: ConnectionState;
  lastUpdatedAt: string | null;
  liveDurationSeconds: number;
  liveTelemetry: TelemetryPoint[];
  simulationTelemetry: TelemetryPoint[];
  simulation: SimulationConfig;
  deviceStatus: DeviceStatusSummary;
  maintenanceRecords: MaintenanceRecord[];
  lastFilterInspectionAt: string | null;
  nextInspectionSchedule: string;
  sensorSettings: SensorSettings;
  githubRepo: string;
}
