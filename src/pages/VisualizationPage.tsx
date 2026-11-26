import React from 'react';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import type { SystemStatePayload, TimeRangeFilter } from '../types/airskin';
import { computePerformanceSummary, filterTelemetryByRange } from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import { BeforeAfterBarChart } from '../components/BeforeAfterBarChart';

interface VisualizationPageProps {
  state: SystemStatePayload;
  timeRange: TimeRangeFilter;
  onChangeTimeRange: (range: TimeRangeFilter) => void;
}

const TIME_FILTERS: { id: TimeRangeFilter; label: string }[] = [
  { id: '1m', label: '1 menit' },
  { id: '5m', label: '5 menit' },
  { id: '15m', label: '15 menit' },
  { id: '1h', label: '1 jam' },
];

export const VisualizationPage: React.FC<VisualizationPageProps> = ({
  state,
  timeRange,
  onChangeTimeRange,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-lg font-semibold text-[#103B66]">
              Air Quality Visualization
            </h2>
          </div>
          <p className="text-xs text-[#176FAF]/85 mt-0.5">
            Grafik interaktif perubahan konsentrasi PM2.5 dan PM10 pada sisi inlet maupun outlet terhadap waktu.
          </p>
        </div>

        {/* Time Range Selector */}
        <div
          className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#C8E5F8]"
          role="group"
          aria-label="Filter rentang waktu grafik"
        >
          {TIME_FILTERS.map((item) => {
            const active = timeRange === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTimeRange(item.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-[#176FAF] text-white'
                    : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {summary.isSimulated && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-[#6E541D]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
          <span>
            <strong className="font-mono uppercase">SIMULATION — NOT REAL SENSOR DATA.</strong>{' '}
            Seluruh kurva di bawah menampilkan ilustrasi simulasi, bukan pengukuran langsung dari sensor ESP32.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <InteractiveTrendChart
          title="Grafik Perubahan PM2.5 Inlet & Outlet"
          subtitle="Sentuh atau arahkan kursor pada titik grafik untuk melihat nilai eksak dan efisiensi sesaat."
          points={rangedPoints}
          metric="pm25"
          isSimulated={summary.isSimulated}
        />

        <InteractiveTrendChart
          title="Grafik Perubahan PM10 Inlet & Outlet"
          subtitle="Perbandingan konsentrasi partikulat kasar (PM10) sebelum dan sesudah filtrasi."
          points={rangedPoints}
          metric="pm10"
          isSimulated={summary.isSimulated}
        />
      </div>

      <BeforeAfterBarChart
        avgPm25Inlet={summary.avgPm25Inlet}
        avgPm25Outlet={summary.avgPm25Outlet}
        avgPm10Inlet={summary.avgPm10Inlet}
        avgPm10Outlet={summary.avgPm10Outlet}
        isSimulated={summary.isSimulated}
        hasData={summary.hasData}
      />
    </div>
  );
};
