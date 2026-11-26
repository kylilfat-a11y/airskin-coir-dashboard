export type NavSection =
  | 'overview'
  | 'visualization'
  | 'mechanism'
  | 'simulation'
  | 'benchmark'
  | 'devices';

export type DashboardMode = 'live' | 'simulation';

export type TimeRangeFilter = '1m' | '5m' | '15m' | '1h';

export type PerformanceStatus = 'Monitoring' | 'Simulation' | 'Data unavailable';

export interface TelemetryPoint {
  id: string;
  timestamp: string;
  pm25Inlet: number | null;
  pm25Outlet: number | null;
  pm10Inlet: number | null;
  pm10Outlet: number | null;
  source: 'esp32' | 'simulation';
}

export interface DeviceStatusSummary {
  esp32Connected: boolean;
  pmSensorConnected: boolean;
  fanStatus: 'Active' | 'Standby' | 'Disconnected';
  dataTransmissionStatus: 'Streaming' | 'Idle' | 'Disconnected';
  lastDataReceived: string | null;
  esp32DeviceId: string;
  mqttTopic: string;
  firmwareVersion: string;
}

export interface SimulationConfig {
  running: boolean;
  initialPm25Inlet: number;
  initialPm10Inlet: number;
  startedAt: string | null;
  elapsedSeconds: number;
}

export interface SystemStatePayload {
  mode: DashboardMode;
  deviceConnected: boolean;
  lastUpdatedAt: string | null;
  liveDurationSeconds: number;
  liveTelemetry: TelemetryPoint[];
  simulationTelemetry: TelemetryPoint[];
  simulation: SimulationConfig;
  deviceStatus: DeviceStatusSummary;
  githubRepo: string;
}
