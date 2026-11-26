import React, { useMemo, useState } from 'react';
import { Calendar, Download, FileSpreadsheet } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';

interface ReportsPageProps {
  state: SystemStatePayload;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ state }) => {
  const { telemetry, maintenance, experiments, sensors, config, mode } = state;
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const summary = useMemo(() => {
    const pm25In = telemetry.map((t) => t.pm25Inlet).filter((v): v is number => v !== null);
    const pm10In = telemetry.map((t) => t.pm10Inlet).filter((v): v is number => v !== null);
    const avg = (arr: number[]) =>
      arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '--';

    const onlineCount = sensors.filter((s) => s.online).length;
    const availabilityPct =
      sensors.length > 0 ? Math.round((onlineCount / sensors.length) * 100) : 0;

    return {
      dailyPm25Avg: avg(pm25In),
      dailyPm10Avg: avg(pm10In),
      availabilityPct,
      recordsCount: telemetry.length,
    };
  }, [telemetry, sensors]);

  function handleExportCsv() {
    const headers = [
      'timestamp',
      'panel_id',
      'pm25_inlet_ug_m3',
      'pm25_outlet_ug_m3',
      'pm10_inlet_ug_m3',
      'pm10_outlet_ug_m3',
      'fan_power_w',
      'source',
    ];
    const rows = telemetry.map((t) => [
      t.timestamp,
      t.panelId,
      t.pm25Inlet ?? '',
      t.pm25Outlet ?? '',
      t.pm10Inlet ?? '',
      t.pm10Outlet ?? '',
      t.fanPowerW ?? '',
      t.source,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airskin-coir-telemetry-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadReport() {
    const reportLines = [
      'AIRSKIN COIR — SMART AIR QUALITY MONITORING REPORT',
      `Generated: ${new Date().toISOString()}`,
      `Building Location: ${config.buildingLocation}`,
      `Report Horizon: ${dateRange.toUpperCase()} (${startDate} to ${endDate})`,
      `Data Source Mode: ${mode}`,
      '',
      '1. PARTICULATE SUMMARY',
      `Daily PM2.5 Inlet Mean: ${summary.dailyPm25Avg} µg/m³`,
      `Daily PM10 Inlet Mean: ${summary.dailyPm10Avg} µg/m³`,
      `Total Telemetry Samples: ${summary.recordsCount}`,
      `Sensor Node Availability: ${summary.availabilityPct}%`,
      '',
      '2. EXPERIMENTAL FILTER TRIALS',
      ...(experiments.length > 0
        ? experiments.map(
            (e) =>
              `- ${e.configLabel}: PM2.5 η=${e.pm25Efficiency}%, PM10 η=${e.pm10Efficiency}%${e.isSampleDemo ? ' [Sample Demo]' : ''}`,
          )
        : ['- No controlled filter trial records uploaded.']),
      '',
      '3. MAINTENANCE HISTORY',
      ...maintenance.map(
        (m) => `- ${m.date} | ${m.panelId} | ${m.recordType} | Moisture ${m.moistureLevelPct}% | ${m.status}`,
      ),
    ];
    const blob = new Blob([reportLines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airskin-coir-report-${dateRange}-${endDate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export-friendly clean SVG bar chart of PM2.5 vs PM10 averages
  const chartPoints = telemetry.slice(-14);
  const maxVal = Math.max(
    ...chartPoints.map((p) => Math.max(p.pm25Inlet ?? 0, p.pm10Inlet ?? 0)),
    60,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Monitoring Reports
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Daily PM2.5/PM10 summaries, weekly and monthly trends, sensor availability, and scientific exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-[#82C5EF] bg-white px-4 py-2 text-xs font-medium text-[#103B66] hover:bg-[#EAF6FF] transition-colors whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#176FAF]" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66] transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <section className="airskin-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] p-1">
          {(['daily', 'weekly', 'monthly'] as const).map((horizon) => (
            <button
              key={horizon}
              type="button"
              onClick={() => setDateRange(horizon)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                dateRange === horizon
                  ? 'bg-[#176FAF] text-white'
                  : 'text-[#103B66]/75 hover:text-[#103B66]'
              }`}
            >
              {horizon === 'daily'
                ? 'Daily Report'
                : horizon === 'weekly'
                  ? 'Weekly Trend'
                  : 'Monthly Trend'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#103B66]">
          <Calendar className="w-4 h-4 text-[#176FAF]" />
          <span className="font-medium">Select Date Range:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Report start date"
            className="rounded-lg border border-[#B9E0F8] bg-white px-2.5 py-1.5 font-mono text-xs"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="Report end date"
            className="rounded-lg border border-[#B9E0F8] bg-white px-2.5 py-1.5 font-mono text-xs"
          />
        </div>
      </section>

      {/* Summary Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">DAILY PM2.5 REPORT</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
            {summary.dailyPm25Avg} <span className="text-xs font-normal text-[#103B66]/60">µg/m³</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">Period mean inlet</div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">DAILY PM10 REPORT</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
            {summary.dailyPm10Avg} <span className="text-xs font-normal text-[#103B66]/60">µg/m³</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">Period mean coarse load</div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">FILTRATION EFFICIENCY SUMMARY</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
            {experiments.length > 0
              ? `${experiments.find((e) => e.configKey === 'C')?.pm25Efficiency ?? experiments[0].pm25Efficiency} %`
              : '--'}
          </div>
          <div className="text-[11px] text-[#103B66]/65">
            {experiments.length > 0
              ? `${experiments.length} experimental configurations logged`
              : 'Awaiting trial dataset'}
          </div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">SENSOR AVAILABILITY</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
            {summary.availabilityPct}%
          </div>
          <div className="text-[11px] text-[#103B66]/65">
            {sensors.filter((s) => s.online).length} of {sensors.length} configured nodes online
          </div>
        </div>
      </section>

      {/* Presentation-Ready Trend Chart */}
      <section className="airskin-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
              {dateRange === 'daily'
                ? 'Daily Particulate Matter Summary Chart'
                : dateRange === 'weekly'
                  ? 'Weekly Particulate Trend Overview'
                  : 'Monthly Particulate Trend Overview'}
            </h2>
            <p className="text-xs text-[#103B66]/65">
              Clean vector chart formatted for research reports and stakeholder briefings.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#103B66]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#176FAF]" /> PM2.5 Inlet
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#82C5EF]" /> PM10 Inlet
            </span>
          </div>
        </div>

        {chartPoints.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#82C5EF] bg-[#F5FAFF] py-12 text-center text-xs text-[#103B66]/70">
            Waiting for telemetry measurements — Export CSV will generate column headers until sensor packets arrive.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <svg viewBox="0 0 720 220" className="w-full min-w-[520px]">
              {[0.25, 0.5, 0.75, 1].map((t) => {
                const y = 185 - t * 155;
                return (
                  <g key={t}>
                    <line x1="44" y1={y} x2="700" y2={y} stroke="#E1F2FD" strokeWidth="1" />
                    <text x="36" y={y + 4} textAnchor="end" className="fill-[#103B66]/60 font-mono text-[10px]">
                      {(maxVal * t).toFixed(0)}
                    </text>
                  </g>
                );
              })}
              {chartPoints.map((pt, idx) => {
                const groupW = 640 / chartPoints.length;
                const baseX = 52 + idx * groupW;
                const h25 = ((pt.pm25Inlet ?? 0) / maxVal) * 155;
                const h10 = ((pt.pm10Inlet ?? 0) / maxVal) * 155;
                return (
                  <g key={pt.id}>
                    <rect
                      x={baseX}
                      y={185 - h25}
                      width={Math.max(8, groupW * 0.34)}
                      height={h25}
                      rx="3"
                      fill="#176FAF"
                    />
                    <rect
                      x={baseX + Math.max(10, groupW * 0.38)}
                      y={185 - h10}
                      width={Math.max(8, groupW * 0.34)}
                      height={h10}
                      rx="3"
                      fill="#82C5EF"
                    />
                  </g>
                );
              })}
              <line x1="44" y1="185" x2="700" y2="185" stroke="#B9E0F8" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </section>

      {/* Maintenance History Digest */}
      <section className="airskin-card p-6 space-y-3">
        <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
          Maintenance History Summary
        </h2>
        <div className="divide-y divide-[#EAF6FF] text-xs">
          {maintenance.slice(0, 5).map((m) => (
            <div key={m.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[#103B66]">
                <span className="font-mono font-semibold text-[#176FAF]">{m.date}</span> ·{' '}
                <strong>{m.panelId}</strong> · {m.recordType} ({m.inspector})
              </div>
              <span className="font-mono text-[#103B66]/75">
                Moisture {m.moistureLevelPct.toFixed(1)}% · {m.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
