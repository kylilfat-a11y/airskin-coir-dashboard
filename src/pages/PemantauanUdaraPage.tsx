import React from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import type { SystemStatePayload, TimeRangeFilter } from '../types/airskin';
import { filterTelemetryByRange } from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';

interface PemantauanUdaraPageProps {
  state: SystemStatePayload;
  timeRange: TimeRangeFilter;
  onChangeTimeRange: (range: TimeRangeFilter) => void;
}

const TIME_OPTIONS: { id: TimeRangeFilter; label: string }[] = [
  { id: '1h', label: '1 jam' },
  { id: '6h', label: '6 jam' },
  { id: '24h', label: '24 jam' },
];

export const PemantauanUdaraPage: React.FC<PemantauanUdaraPageProps> = ({
  state,
  timeRange,
  onChangeTimeRange,
}) => {
  const usingActual = state.deviceConnected;
  const rawSeries = usingActual ? state.liveTelemetry : state.simulationTelemetry;
  const rangedPoints = filterTelemetryByRange(rawSeries, timeRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-semibold text-[#103B66]">
              Pemantauan Udara
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Grafik konsentrasi partikulat PM2.5 dan PM10 pada udara masuk dan udara keluar.
          </p>
        </div>

        <div
          className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#C8E5F8]"
          role="group"
          aria-label="Pilihan rentang waktu"
        >
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeTimeRange(opt.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeRange === opt.id
                  ? 'bg-[#176FAF] text-white'
                  : 'text-[#103B66]/75 hover:bg-[#EAF6FF]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!usingActual && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-2.5 flex items-center gap-2.5 text-xs text-[#6E541D]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
          <span>
            <strong className="font-mono uppercase">DATA SIMULASI:</strong> Perangkat belum terhubung. Grafik menampilkan data simulasi sementara.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <InteractiveTrendChart
          title="Grafik PM2.5"
          subtitle="Konsentrasi partikel halus PM2.5 udara masuk vs udara keluar."
          points={rangedPoints}
          metric="pm25"
          isSimulated={!usingActual}
        />

        <InteractiveTrendChart
          title="Grafik PM10"
          subtitle="Konsentrasi partikel kasar PM10 udara masuk vs udara keluar."
          points={rangedPoints}
          metric="pm10"
          isSimulated={!usingActual}
        />
      </div>
    </div>
  );
};
