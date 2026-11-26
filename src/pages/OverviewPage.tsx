import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  Clock,
  Cpu,
  Gauge,
  Wind,
} from 'lucide-react';
import type { NavSection, SystemStatePayload, TimeRangeFilter } from '../types/airskin';
import {
  computePerformanceSummary,
  filterTelemetryByRange,
  formatDuration,
} from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import { BeforeAfterBarChart } from '../components/BeforeAfterBarChart';

interface OverviewPageProps {
  state: SystemStatePayload;
  timeRange: TimeRangeFilter;
  onChangeTimeRange: (range: TimeRangeFilter) => void;
  onNavigate: (section: NavSection) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  state,
  timeRange,
  onChangeTimeRange,
  onNavigate,
}) => {
  const summary = computePerformanceSummary(
    state.mode,
    state.deviceConnected,
    state.liveTelemetry,
    state.simulationTelemetry,
    state.liveDurationSeconds,
    state.simulation.elapsedSeconds,
  );

  const activeSeries =
    state.mode === 'simulation'
      ? state.simulationTelemetry
      : state.deviceConnected
        ? state.liveTelemetry
        : [];
  const rangedPoints = filterTelemetryByRange(activeSeries, timeRange);

  const cards = [
    {
      label: 'PM2.5 Inlet',
      subtitle: 'Sebelum melewati filter',
      value: summary.latestPoint?.pm25Inlet ?? null,
      accent: 'border-t-[#176FAF]',
      textColor: 'text-[#176FAF]',
      reduction: null as number | null,
    },
    {
      label: 'PM2.5 Outlet',
      subtitle: 'Setelah melewati filter',
      value: summary.latestPoint?.pm25Outlet ?? null,
      accent: 'border-t-[#72B89A]',
      textColor: 'text-[#2F6F54]',
      reduction: summary.latestPm25Reduction,
    },
    {
      label: 'PM10 Inlet',
      subtitle: 'Sebelum filtrasi',
      value: summary.latestPoint?.pm10Inlet ?? null,
      accent: 'border-t-[#429EDB]',
      textColor: 'text-[#176FAF]',
      reduction: null as number | null,
    },
    {
      label: 'PM10 Outlet',
      subtitle: 'Setelah filtrasi',
      value: summary.latestPoint?.pm10Outlet ?? null,
      accent: 'border-t-[#72B89A]',
      textColor: 'text-[#2F6F54]',
      reduction: summary.latestPm10Reduction,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Mode / Connection Notice */}
      {state.mode === 'simulation' ? (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-[#6E541D]">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E] mt-0.5 sm:mt-0" />
            <span>
              <strong className="font-mono uppercase tracking-wide">
                SIMULATION — NOT REAL SENSOR DATA.
              </strong>{' '}
              {!state.deviceConnected
                ? 'Device not connected. You are currently viewing simulation data.'
                : 'Anda sedang meninjau mode simulasi ilustratif.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('simulation')}
            className="text-xs font-semibold text-[#176FAF] hover:text-[#103B66] inline-flex items-center gap-1"
          >
            Buka Kontrol Simulasi <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : !state.deviceConnected ? (
        <div className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#103B66]">
            <Cpu className="w-4 h-4 text-[#176FAF] shrink-0" />
            <span>
              Perangkat ESP32 belum terhubung pada mode Live IoT Monitoring. Nilai efisiensi dan sensor aktual belum tersedia.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('devices')}
            className="text-xs font-semibold text-[#176FAF] hover:text-[#103B66] inline-flex items-center gap-1"
          >
            Cek Status Perangkat <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/* 4 Primary Air Quality Overview Cards */}
      <section aria-labelledby="overview-metrics-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="overview-metrics-heading" className="font-display text-lg font-semibold text-[#103B66]">
              Ringkasan Kualitas Udara (Air Quality Overview)
            </h2>
            <p className="text-xs text-[#176FAF]/85">
              Konsentrasi partikulat sisi inlet dan outlet beserta persentase penurunan terhitung.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#103B66]/70">
            Removal Efficiency = ((Inlet - Outlet) / Inlet) × 100%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`airskin-card p-5 border-t-4 ${card.accent} flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-semibold text-[#103B66]">{card.label}</p>
                  <p className="text-xs text-[#103B66]/65">{card.subtitle}</p>
                </div>
                {summary.isSimulated ? (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D7B978]/20 text-[#8A6D2E] border border-[#D7B978]/40">
                    SIMULATED DATA
                  </span>
                ) : summary.hasData ? (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#72B89A]/20 text-[#2F6F54] border border-[#72B89A]/40">
                    LIVE DATA
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EAF6FF] text-[#103B66]/60 border border-[#B9E0F8]">
                    NO DATA
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className={`font-display text-3xl font-semibold tabular-nums ${card.textColor}`}>
                  {card.value !== null ? card.value.toFixed(1) : '--'}
                </span>
                <span className="text-xs font-mono text-[#103B66]/65">µg/m³</span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E6F3FC] flex items-center justify-between text-xs">
                {card.reduction !== null ? (
                  <>
                    <span className="text-[#103B66]/70">Penurunan Konsentrasi</span>
                    <span className="inline-flex items-center gap-0.5 font-mono font-semibold text-[#2F6F54] tabular-nums">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {card.reduction}%
                    </span>
                  </>
                ) : (
                  <span className="text-[#103B66]/55">
                    {summary.hasData ? 'Titik acuan masuk (Inlet)' : 'Menunggu pembacaan perangkat'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filtration Performance Summary */}
      <section className="airskin-card p-5 space-y-4" aria-labelledby="perf-summary-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Gauge className="w-5 h-5 text-[#176FAF]" />
            <div>
              <h2 id="perf-summary-heading" className="font-display text-base font-semibold text-[#103B66]">
                Filtration Performance Summary
              </h2>
              <p className="text-xs text-[#176FAF]/85">
                Ringkasan statistik dan interpretasi otomatis dari data yang sedang aktif.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#103B66]/65">Status Performa:</span>
            <span
              className={`px-2.5 py-1 rounded border font-semibold ${
                summary.status === 'Monitoring'
                  ? 'bg-[#72B89A]/15 text-[#2F6F54] border-[#72B89A]/45'
                  : summary.status === 'Simulation'
                    ? 'bg-[#D7B978]/15 text-[#8A6D2E] border-[#D7B978]/45'
                    : 'bg-[#EAF6FF] text-[#103B66]/75 border-[#B9E0F8]'
              }`}
            >
              {summary.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Total Durasi
            </span>
            <p className="font-mono text-lg font-semibold text-[#103B66] tabular-nums mt-1">
              {summary.hasData ? formatDuration(summary.durationSeconds) : '--:--'}
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">Rata-rata PM2.5 Inlet</span>
            <p className="font-mono text-lg font-semibold text-[#176FAF] tabular-nums mt-1">
              {summary.avgPm25Inlet !== null ? `${summary.avgPm25Inlet} µg/m³` : '--'}
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">Rata-rata PM2.5 Outlet</span>
            <p className="font-mono text-lg font-semibold text-[#2F6F54] tabular-nums mt-1">
              {summary.avgPm25Outlet !== null ? `${summary.avgPm25Outlet} µg/m³` : '--'}
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">Rata-rata PM10 Inlet</span>
            <p className="font-mono text-lg font-semibold text-[#176FAF] tabular-nums mt-1">
              {summary.avgPm10Inlet !== null ? `${summary.avgPm10Inlet} µg/m³` : '--'}
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">Rata-rata PM10 Outlet</span>
            <p className="font-mono text-lg font-semibold text-[#2F6F54] tabular-nums mt-1">
              {summary.avgPm10Outlet !== null ? `${summary.avgPm10Outlet} µg/m³` : '--'}
            </p>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3.5">
            <span className="text-[11px] text-[#103B66]/65 block">
              {summary.isSimulated ? 'Est. Penurunan PM2.5 / PM10' : 'Penurunan PM2.5 / PM10'}
            </span>
            <p className="font-mono text-base font-semibold text-[#103B66] tabular-nums mt-1">
              {summary.avgPm25Reduction !== null ? `${summary.avgPm25Reduction}%` : '--'}
              {' / '}
              {summary.avgPm10Reduction !== null ? `${summary.avgPm10Reduction}%` : '--'}
            </p>
          </div>
        </div>

        {/* Dynamic Auto-Generated Narrative */}
        <div className="rounded-xl border border-[#B9E0F8] bg-[#EAF6FF]/75 px-4 py-3.5 flex items-start gap-3">
          <Wind className="w-4 h-4 text-[#176FAF] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#176FAF]">
              Ringkasan Narasi Otomatis
            </span>
            <p className="text-sm text-[#103B66] leading-relaxed">{summary.narrative}</p>
          </div>
        </div>
      </section>

      {/* Visualization Preview + Quick Time Filter */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold text-[#103B66]">
            Tren Konsentrasi PM2.5 & Perbandingan Filtrasi
          </h2>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#C8E5F8]">
            {(['1m', '5m', '15m', '1h'] as TimeRangeFilter[]).map((range) => {
              const labels: Record<TimeRangeFilter, string> = {
                '1m': '1 menit',
                '5m': '5 menit',
                '15m': '15 menit',
                '1h': '1 jam',
              };
              const active = timeRange === range;
              return (
                <button
                  key={range}
                  type="button"
                  onClick={() => onChangeTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#176FAF] text-white'
                      : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
                  }`}
                >
                  {labels[range]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <InteractiveTrendChart
            title="Tren Konsentrasi PM2.5 (Inlet vs Outlet)"
            subtitle="Perubahan konsentrasi partikel halus terhadap waktu."
            points={rangedPoints}
            metric="pm25"
            isSimulated={summary.isSimulated}
          />
          <BeforeAfterBarChart
            avgPm25Inlet={summary.avgPm25Inlet}
            avgPm25Outlet={summary.avgPm25Outlet}
            avgPm10Inlet={summary.avgPm10Inlet}
            avgPm10Outlet={summary.avgPm10Outlet}
            isSimulated={summary.isSimulated}
            hasData={summary.hasData}
          />
        </div>
      </section>
    </div>
  );
};
