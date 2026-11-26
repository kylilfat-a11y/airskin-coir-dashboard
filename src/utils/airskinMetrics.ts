import type { TelemetryPoint, TimeRangeFilter } from '../types/airskin';

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
    '1h': 3600,
    '6h': 6 * 3600,
    '24h': 24 * 3600,
    '7d': 7 * 24 * 3600,
  };
  const cutoff = latestMs - windowSeconds[range] * 1000;
  const filtered = points.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
  return filtered.length >= 2 ? filtered : points.slice(-Math.min(points.length, 4));
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
  if (!iso) return 'Menunggu data sensor';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Menunggu data sensor';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
  });
}

export function formatDateTimeFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function avgField(
  points: TelemetryPoint[],
  getter: (p: TelemetryPoint) => number | null,
): number | null {
  const vals = points.map(getter).filter((v): v is number => v !== null && Number.isFinite(v));
  if (vals.length === 0) return null;
  const sum = vals.reduce((acc, cur) => acc + cur, 0);
  return Number((sum / vals.length).toFixed(1));
}

function escapeCsvCell(val: string | number | null | undefined): string {
  const str = val === null || val === undefined ? '' : String(val);
  // Cegah injeksi formula pada aplikasi spreadsheet
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportTelemetryCsv(points: TelemetryPoint[], filenamePrefix: string, isSimulated: boolean): void {
  const headers = [
    'Waktu',
    'Sumber Data',
    'PM2.5 Masuk (ug/m3)',
    'PM2.5 Keluar (ug/m3)',
    'Efisiensi PM2.5 (%)',
    'PM10 Masuk (ug/m3)',
    'PM10 Keluar (ug/m3)',
    'Efisiensi PM10 (%)',
  ];

  const rows = points.map((pt) => {
    const eff25 = calcRemovalEfficiency(pt.pm25Inlet, pt.pm25Outlet);
    const eff10 = calcRemovalEfficiency(pt.pm10Inlet, pt.pm10Outlet);
    return [
      escapeCsvCell(formatDateTimeFull(pt.timestamp)),
      escapeCsvCell(isSimulated ? 'DATA SIMULASI' : 'SENSOR ESP32'),
      escapeCsvCell(pt.pm25Inlet),
      escapeCsvCell(pt.pm25Outlet),
      escapeCsvCell(eff25),
      escapeCsvCell(pt.pm10Inlet),
      escapeCsvCell(pt.pm10Outlet),
      escapeCsvCell(eff10),
    ].join(',');
  });

  const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
