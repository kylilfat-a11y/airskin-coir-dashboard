import React, { useMemo } from 'react';
import { BarChart3, ShieldAlert } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';

interface AirQualityAnalyticsPageProps {
  state: SystemStatePayload;
  onToggleMode: (mode: 'hardware_standby' | 'demo_simulation') => void;
}

export const AirQualityAnalyticsPage: React.FC<AirQualityAnalyticsPageProps> = ({
  state,
  onToggleMode,
}) => {
  const { telemetry, config, mode } = state;
  const unit = config.measurementUnit;
  const scale = unit === 'mg/m³' ? 0.001 : 1;
  const dec = unit === 'mg/m³' ? 3 : 1;

  const stats = useMemo(() => {
    const pm25 = telemetry.map((t) => t.pm25Inlet).filter((v): v is number => v !== null);
    const pm10 = telemetry.map((t) => t.pm10Inlet).filter((v): v is number => v !== null);

    const calcStats = (arr: number[]) => {
      if (arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      const sum = arr.reduce((acc, v) => acc + v, 0);
      const mean = sum / arr.length;
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
      return {
        min: sorted[0] * scale,
        mean: mean * scale,
        p95: p95 * scale,
        max: sorted[sorted.length - 1] * scale,
      };
    };

    const whoPm25Limit = 15; // WHO 24h AQG (µg/m³)
    const exceedances = pm25.filter((v) => v > whoPm25Limit).length;

    return {
      pm25: calcStats(pm25),
      pm10: calcStats(pm10),
      sampleCount: telemetry.length,
      whoExceedancePct: pm25.length > 0 ? (exceedances / pm25.length) * 100 : null,
    };
  }, [telemetry, scale]);

  const histogramBuckets = useMemo(() => {
    const buckets = [
      { label: '0–15 µg/m³ (WHO Good)', min: 0, max: 15, count: 0, color: '#72B89A' },
      { label: '15–35 µg/m³ (Moderate)', min: 15, max: 35, count: 0, color: '#82C5EF' },
      { label: '35–55 µg/m³ (Elevated)', min: 35, max: 55, count: 0, color: '#429EDB' },
      { label: '> 55 µg/m³ (High Load)', min: 55, max: 9999, count: 0, color: '#D7B978' },
    ];
    for (const point of telemetry) {
      if (point.pm25Inlet === null) continue;
      const bucket = buckets.find((b) => (point.pm25Inlet as number) >= b.min && (point.pm25Inlet as number) < b.max);
      if (bucket) bucket.count += 1;
    }
    return buckets;
  }, [telemetry]);

  const maxBucket = Math.max(...histogramBuckets.map((b) => b.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Air Quality Analytics
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Statistical particulate distribution, WHO 24-hour guideline benchmarking, and ambient load profiling.
          </p>
        </div>
        <span className="text-xs font-mono text-[#176FAF]">
          {mode === 'demo_simulation'
            ? 'Dataset: Demo Simulation'
            : mode === 'live_esp32'
              ? 'Dataset: Live ESP32 Buffer'
              : 'Dataset: Awaiting Sensor Packets'}
        </span>
      </div>

      {/* Distribution Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="airskin-card p-5 space-y-2">
          <div className="text-xs font-semibold text-[#176FAF]">PM2.5 INLET MEAN</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
            {stats.pm25 ? stats.pm25.mean.toFixed(dec) : '--'}
            <span className="ml-1.5 text-xs font-normal text-[#103B66]/60">{unit}</span>
          </div>
          <div className="text-xs text-[#103B66]/65 font-mono tabular-nums">
            {stats.pm25
              ? `Min ${stats.pm25.min.toFixed(dec)} · P95 ${stats.pm25.p95.toFixed(dec)} · Max ${stats.pm25.max.toFixed(dec)}`
              : 'Awaiting Test Data'}
          </div>
        </div>

        <div className="airskin-card p-5 space-y-2">
          <div className="text-xs font-semibold text-[#176FAF]">PM10 INLET MEAN</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
            {stats.pm10 ? stats.pm10.mean.toFixed(dec) : '--'}
            <span className="ml-1.5 text-xs font-normal text-[#103B66]/60">{unit}</span>
          </div>
          <div className="text-xs text-[#103B66]/65 font-mono tabular-nums">
            {stats.pm10
              ? `Min ${stats.pm10.min.toFixed(dec)} · P95 ${stats.pm10.p95.toFixed(dec)} · Max ${stats.pm10.max.toFixed(dec)}`
              : 'Awaiting Test Data'}
          </div>
        </div>

        <div className="airskin-card p-5 space-y-2">
          <div className="text-xs font-semibold text-[#176FAF]">WHO 24h GUIDELINE EXCEEDANCE</div>
          <div className="font-mono tabular-nums text-3xl font-semibold text-[#103B66]">
            {stats.whoExceedancePct !== null ? `${stats.whoExceedancePct.toFixed(0)}%` : '--'}
          </div>
          <div className="text-xs text-[#103B66]/65">
            Share of inlet intervals above 15 µg/m³ WHO threshold ({stats.sampleCount} samples)
          </div>
        </div>
      </div>

      {/* PM2.5 Ambient Load Histogram */}
      <section className="airskin-card p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#176FAF]" />
            <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
              Ambient PM2.5 Concentration Frequency Distribution
            </h2>
          </div>
          <span className="text-xs text-[#103B66]/65">Reference: WHO 2021 AQG (15 µg/m³ 24h)</span>
        </div>

        {telemetry.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#82C5EF] bg-[#F5FAFF] px-6 py-12 text-center">
            <p className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              No analytical telemetry records loaded yet
            </p>
            <p className="mt-1 text-xs text-[#103B66]/70">
              Transmit real ESP32 data packets or enable Demo Simulation to inspect particulate distribution buckets.
            </p>
            <button
              type="button"
              onClick={() => onToggleMode('demo_simulation')}
              className="mt-4 rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66]"
            >
              Load Demo Simulation Dataset
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {histogramBuckets.map((bucket) => {
              const widthPct = Math.round((bucket.count / maxBucket) * 100);
              return (
                <div key={bucket.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#103B66]">{bucket.label}</span>
                    <span className="font-mono tabular-nums text-[#103B66]/75">
                      {bucket.count} intervals
                    </span>
                  </div>
                  <div className="h-3.5 w-full rounded-full bg-[#EAF6FF] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${widthPct}%`, backgroundColor: bucket.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Scientific Data Table */}
      <section className="airskin-card overflow-hidden">
        <div className="border-b border-[#DCEEFB] px-6 py-4 flex items-center justify-between gap-2">
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            Recent Interval Measurements
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-[#103B66]/70">
            <ShieldAlert className="w-3.5 h-3.5 text-[#429EDB]" />
            <span>Raw & calibrated readings</span>
          </div>
        </div>

        {telemetry.length === 0 ? (
          <div className="px-6 py-10 text-center text-xs text-[#103B66]/65">
            Awaiting Test Data — No interval rows recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5FAFF] text-[#103B66]/70 border-b border-[#DCEEFB]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Timestamp</th>
                  <th className="px-5 py-3 font-semibold">Panel</th>
                  <th className="px-5 py-3 font-semibold text-right">PM2.5 Inlet</th>
                  <th className="px-5 py-3 font-semibold text-right">PM2.5 Outlet</th>
                  <th className="px-5 py-3 font-semibold text-right">PM10 Inlet</th>
                  <th className="px-5 py-3 font-semibold text-right">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAF6FF] font-mono tabular-nums">
                {telemetry.slice(-10).reverse().map((row) => (
                  <tr key={row.id} className="hover:bg-[#F5FAFF]/70">
                    <td className="px-5 py-3 text-[#103B66]">
                      {new Date(row.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 text-[#176FAF] font-medium">{row.panelId}</td>
                    <td className="px-5 py-3 text-right text-[#103B66]">
                      {row.pm25Inlet !== null ? `${(row.pm25Inlet * scale).toFixed(dec)} ${unit}` : '--'}
                    </td>
                    <td className="px-5 py-3 text-right text-[#458B6D]">
                      {config.hasOutletSensor && row.pm25Outlet !== null
                        ? `${(row.pm25Outlet * scale).toFixed(dec)} ${unit}`
                        : '--'}
                    </td>
                    <td className="px-5 py-3 text-right text-[#103B66]">
                      {row.pm10Inlet !== null ? `${(row.pm10Inlet * scale).toFixed(dec)} ${unit}` : '--'}
                    </td>
                    <td className="px-5 py-3 text-right font-sans text-[#103B66]/70">
                      {row.source === 'esp32' ? 'ESP32 Live' : 'Demo Simulation'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
