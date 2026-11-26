export type NavSection =
  | 'ringkasan'
  | 'pemantauan'
  | 'panel'
  | 'simulasi'
  | 'kinerja'
  | 'pengaturan';

export type ConnectionState = 'Terhubung' | 'Terputus' | 'Menunggu Koneksi';

export type DataSourceMode = 'aktual' | 'simulasi';

export type TimeRangeFilter = '1h' | '6h' | '24h';

export interface TelemetryPoint {
  id: string;
  timestamp: string;
  pm25Inlet: number | null;
  pm25Outlet: number | null;
  pm10Inlet: number | null;
  pm10Outlet: number | null;
  source: 'esp32' | 'simulasi';
}

export interface DeviceStatusSummary {
  esp32Status: ConnectionState;
  sensorPmStatus: ConnectionState;
  kipasDcStatus: ConnectionState;
  lastDataReceived: string | null;
}

export interface SimulationConfig {
  running: boolean;
  initialPm25Inlet: number;
  initialPm10Inlet: number;
  efficiencyPm25Pct: number;
  efficiencyPm10Pct: number;
  startedAt: string | null;
}

export interface SystemStatePayload {
  dataSourceMode: DataSourceMode;
  deviceConnected: boolean;
  connectionState: ConnectionState;
  lastUpdatedAt: string | null;
  liveTelemetry: TelemetryPoint[];
  simulationTelemetry: TelemetryPoint[];
  simulation: SimulationConfig;
  deviceStatus: DeviceStatusSummary;
}
