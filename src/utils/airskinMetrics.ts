import type {
  DashboardMode,
  PerformanceStatus,
  TelemetryPoint,
  TimeRangeFilter,
} from '../types/airskin';

export function calcRemovalEfficiency(
  inlet: number | null | undefined,
  outlet: number | null | undefined,
): number | null {
  if (
    inlet === null ||
    inlet === undefined ||
    outlet === null ||
    outlet === undefined ||
    !Number.isFinite(inlet) ||
    !Number.isFinite(outlet) ||
    inlet <= 0
  ) {
    return null;
  }
  const eff = ((inlet - outlet) / inlet) * 100;
  return Number(eff.toFixed(1));
}

export function filterTelemetryByRange(
  points: TelemetryPoint[],
  range: TimeRangeFilter,
): TelemetryPoint[] {
  if (points.length === 0) return [];
  const latestMs = new Date(points[points.length - 1].timestamp).getTime();
  const windowSeconds: Record<TimeRangeFilter, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
  };
  const cutoff = latestMs - windowSeconds[range] * 1000;
  const filtered = points.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
  return filtered.length >= 2 ? filtered : points.slice(-Math.min(points.length, 6));
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Belum ada pembaruan';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Belum ada pembaruan';
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function avgField(
  points: TelemetryPoint[],
  getter: (p: TelemetryPoint) => number | null,
): number | null {
  const vals = points.map(getter).filter((v): v is number => v !== null && Number.isFinite(v));
  if (vals.length === 0) return null;
  const sum = vals.reduce((acc, cur) => acc + cur, 0);
  return Number((sum / vals.length).toFixed(1));
}

export interface ComputedPerformanceSummary {
  hasData: boolean;
  isSimulated: boolean;
  status: PerformanceStatus;
  durationSeconds: number;
  latestPoint: TelemetryPoint | null;
  avgPm25Inlet: number | null;
  avgPm25Outlet: number | null;
  avgPm10Inlet: number | null;
  avgPm10Outlet: number | null;
  latestPm25Reduction: number | null;
  latestPm10Reduction: number | null;
  avgPm25Reduction: number | null;
  avgPm10Reduction: number | null;
  narrative: string;
}

export function computePerformanceSummary(
  mode: DashboardMode,
  deviceConnected: boolean,
  liveTelemetry: TelemetryPoint[],
  simulationTelemetry: TelemetryPoint[],
  liveDurationSeconds: number,
  simulationDurationSeconds: number,
): ComputedPerformanceSummary {
  const isSimulated = mode === 'simulation';
  const activeSeries = isSimulated
    ? simulationTelemetry
    : deviceConnected
      ? liveTelemetry
      : [];

  const durationSeconds = isSimulated
    ? simulationDurationSeconds
    : deviceConnected
      ? liveDurationSeconds
      : 0;

  if (activeSeries.length === 0) {
    return {
      hasData: false,
      isSimulated,
      status: 'Data unavailable',
      durationSeconds: 0,
      latestPoint: null,
      avgPm25Inlet: null,
      avgPm25Outlet: null,
      avgPm10Inlet: null,
      avgPm10Outlet: null,
      latestPm25Reduction: null,
      latestPm10Reduction: null,
      avgPm25Reduction: null,
      avgPm10Reduction: null,
      narrative:
        'Perangkat ESP32 dan sensor partikulat belum terhubung pada mode Live IoT Monitoring sehingga data pengukuran belum tersedia. Hubungkan perangkat keras atau beralih ke Simulation Mode untuk meninjau ilustrasi alur sistem filtrasi.',
    };
  }

  const latestPoint = activeSeries[activeSeries.length - 1];
  const avgPm25Inlet = avgField(activeSeries, (p) => p.pm25Inlet);
  const avgPm25Outlet = avgField(activeSeries, (p) => p.pm25Outlet);
  const avgPm10Inlet = avgField(activeSeries, (p) => p.pm10Inlet);
  const avgPm10Outlet = avgField(activeSeries, (p) => p.pm10Outlet);

  const latestPm25Reduction = calcRemovalEfficiency(
    latestPoint.pm25Inlet,
    latestPoint.pm25Outlet,
  );
  const latestPm10Reduction = calcRemovalEfficiency(
    latestPoint.pm10Inlet,
    latestPoint.pm10Outlet,
  );
  const avgPm25Reduction = calcRemovalEfficiency(avgPm25Inlet, avgPm25Outlet);
  const avgPm10Reduction = calcRemovalEfficiency(avgPm10Inlet, avgPm10Outlet);

  const status: PerformanceStatus = isSimulated ? 'Simulation' : 'Monitoring';

  let narrative: string;
  if (isSimulated) {
    const pm25Dir =
      avgPm25Inlet !== null && avgPm25Outlet !== null && avgPm25Outlet < avgPm25Inlet
        ? 'lebih rendah dibandingkan'
        : 'sebanding dengan';
    const pm10Note =
      avgPm10Reduction !== null
        ? ` serta estimasi penurunan PM10 rata-rata sebesar ${avgPm10Reduction}%`
        : '';
    const pm25Note =
      avgPm25Reduction !== null ? ` (estimasi penurunan ${avgPm25Reduction}%)` : '';
    narrative = `Pada simulasi ini, konsentrasi rata-rata PM2.5 setelah melewati sistem filtrasi (${avgPm25Outlet ?? '--'} µg/m³) ${pm25Dir} konsentrasi pada sisi inlet (${avgPm25Inlet ?? '--'} µg/m³)${pm25Note}${pm10Note}. Nilai ini merupakan ilustrasi performa sistem dan belum menjadi hasil pengujian prototipe.`;
  } else {
    const hasOutlet = latestPoint.pm25Outlet !== null && latestPoint.pm10Outlet !== null;
    if (hasOutlet) {
      narrative = `Pemantauan sensor aktual mencatat rata-rata PM2.5 inlet ${avgPm25Inlet ?? '--'} µg/m³ dan outlet ${avgPm25Outlet ?? '--'} µg/m³ (${avgPm25Reduction ?? '--'}% selisih), serta PM10 inlet ${avgPm10Inlet ?? '--'} µg/m³ dan outlet ${avgPm10Outlet ?? '--'} µg/m³ (${avgPm10Reduction ?? '--'}% selisih) selama durasi ${formatDuration(durationSeconds)}.`;
    } else {
      narrative = `Perangkat ESP32 aktif mengirimkan data sisi inlet (PM2.5 rata-rata ${avgPm25Inlet ?? '--'} µg/m³, PM10 rata-rata ${avgPm10Inlet ?? '--'} µg/m³), sedangkan sensor sisi outlet belum mengirimkan nilai pembacaan.`;
    }
  }

  return {
    hasData: true,
    isSimulated,
    status,
    durationSeconds,
    latestPoint,
    avgPm25Inlet,
    avgPm25Outlet,
    avgPm10Inlet,
    avgPm10Outlet,
    latestPm25Reduction,
    latestPm10Reduction,
    avgPm25Reduction,
    avgPm10Reduction,
    narrative,
  };
}
