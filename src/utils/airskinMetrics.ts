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
  };
  const cutoff = latestMs - windowSeconds[range] * 1000;
  const filtered = points.filter((p) => new Date(p.timestamp).getTime() >= cutoff);
  return filtered.length >= 2 ? filtered : points.slice(-Math.min(points.length, 4));
}

export function formatShortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
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
