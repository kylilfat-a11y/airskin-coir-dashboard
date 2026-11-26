import React from 'react';
import { Activity, AlertTriangle, Info } from 'lucide-react';
import type { SystemStatePayload, TimeRangeFilter } from '../types/airskin';
import { filterTelemetryByRange } from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';

interface PemantauanUdaraPageProps {
  state: SystemStatePayload;
  timeRange: TimeRangeFilter;
  onChangeTimeRange: (range: TimeRangeFilter) => void;
}

const TIME_OPTIONS: { id: TimeRangeFilter; label: string }[] = [
  { id: '1h', label: '1 jam terakhir' },
  { id: '6h', label: '6 jam terakhir' },
  { id: '24h', label: '24 jam terakhir' },
  { id: '7d', label: '7 hari terakhir' },
];

export const PemantauanUdaraPage: React.FC<PemantauanUdaraPageProps> = ({
  state,
  timeRange,
  onChangeTimeRange,
}) => {
  // Jika perangkat terhubung, prioritaskan data aktual dan jangan mencampurnya dengan data simulasi
  const usingActual = state.deviceConnected;
  const rawSeries = usingActual ? state.liveTelemetry : state.simulationTelemetry;
  const rangedPoints = filterTelemetryByRange(rawSeries, timeRange);
  const latest = rangedPoints.length > 0 ? rangedPoints[rangedPoints.length - 1] : null;

  const deltaPm25 =
    latest && latest.pm25Inlet !== null && latest.pm25Outlet !== null
      ? Number((latest.pm25Inlet - latest.pm25Outlet).toFixed(1))
      : null;

  const deltaPm10 =
    latest && latest.pm10Inlet !== null && latest.pm10Outlet !== null
      ? Number((latest.pm10Inlet - latest.pm10Outlet).toFixed(1))
      : null;

  return (
    <div className="space-y-6">
      {/* Header & Rentang Waktu */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-semibold text-[#103B66]">
              Pemantauan Kualitas Udara
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Pemantauan konsentrasi partikulat PM2.5 dan PM10 pada sisi udara masuk dan udara keluar.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-xl border border-[#C8E5F8]"
          role="group"
          aria-label="Pilihan rentang waktu pemantauan"
        >
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeTimeRange(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

      {/* Label Sumber Data */}
      {!usingActual && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-[#6E541D]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
          <span>
            <strong className="font-mono uppercase">DATA SIMULASI:</strong> Perangkat ESP32 belum terhubung. Grafik di bawah menampilkan data simulasi sementara hingga sensor fisik aktif.
          </span>
        </div>
      )}

      {/* A. Pemantauan PM2.5 */}
      <section className="space-y-3" aria-labelledby="pm25-heading">
        <div className="flex items-center justify-between">
          <h3 id="pm25-heading" className="font-display text-base font-semibold text-[#103B66]">
            A. Pemantauan PM2.5
          </h3>
          {!usingActual && (
            <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-[#D7B978]/20 text-[#8A6D2E] border border-[#D7B978]/45">
              DATA SIMULASI
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="airskin-card p-4">
            <span className="text-xs text-[#103B66]/70">Konsentrasi Udara Masuk</span>
            <p className="font-display text-2xl font-semibold text-[#176FAF] tabular-nums mt-1">
              {latest?.pm25Inlet !== null && latest?.pm25Inlet !== undefined
                ? `${latest.pm25Inlet} µg/m³`
                : '--'}
            </p>
          </div>
          <div className="airskin-card p-4">
            <span className="text-xs text-[#103B66]/70">Konsentrasi Udara Keluar</span>
            <p className="font-display text-2xl font-semibold text-[#2F6F54] tabular-nums mt-1">
              {latest?.pm25Outlet !== null && latest?.pm25Outlet !== undefined
                ? `${latest.pm25Outlet} µg/m³`
                : '--'}
            </p>
          </div>
          <div className="airskin-card p-4">
            <span className="text-xs text-[#103B66]/70">Perubahan Konsentrasi</span>
            <p className="font-display text-2xl font-semibold text-[#103B66] tabular-nums mt-1">
              {deltaPm25 !== null ? `-${deltaPm25} µg/m³` : '--'}
            </p>
          </div>
        </div>

        <InteractiveTrendChart
          title="Grafik Tren PM2.5 Berdasarkan Waktu"
          subtitle="Perubahan konsentrasi PM2.5 pada udara masuk dan udara keluar."
          points={rangedPoints}
          metric="pm25"
          isSimulated={!usingActual}
        />
      </section>

      {/* B. Pemantauan PM10 */}
      <section className="space-y-3" aria-labelledby="pm10-heading">
        <div className="flex items-center justify-between">
          <h3 id="pm10-heading" className="font-display text-base font-semibold text-[#103B66]">
            B. Pemantauan PM10
          </h3>
          {!usingActual && (
            <span className="font-mono text-[11px] uppercase px-2 py-0.5 rounded bg-[#D7B978]/20 text-[#8A6D2E] border border-[#D7B978]/45">
              DATA SIMULASI
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="airskin-card p-4">
            <span className="text-xs text-[#103B66]/70">Konsentrasi Udara Masuk</span>
            <p className="font-display text-2xl font-semibold text-[#176FAF] tabular-nums mt-1">
              {latest?.pm10Inlet !== null && latest?.pm10Inlet !== undefined
                ? `${latest.pm10Inlet} µg/m³`
                : '--'}
            </p>
          </div>
          <div className="airskin-card p-4">
            <span className="text-xs text-[#103B66]/70">Konsentrasi Udara Keluar</span>
            <p className="font-display text-2xl font-semibold text-[#2F6F54] tabular-nums mt-1">
              {latest?.pm10Outlet !== null && latest?.pm10Outlet !== undefined
                ? `${latest.pm10Outlet} µg/m³`
                : '--'}
            </p>
          </div>
          <div className="airskin-card p-4">
            <span className="text-xs text-[#103B66]/70">Perubahan Konsentrasi</span>
            <p className="font-display text-2xl font-semibold text-[#103B66] tabular-nums mt-1">
              {deltaPm10 !== null ? `-${deltaPm10} µg/m³` : '--'}
            </p>
          </div>
        </div>

        <InteractiveTrendChart
          title="Grafik Tren PM10 Berdasarkan Waktu"
          subtitle="Perubahan konsentrasi PM10 pada udara masuk dan udara keluar."
          points={rangedPoints}
          metric="pm10"
          isSimulated={!usingActual}
        />
      </section>

      {/* Keterangan Batasan Pengukuran Sensor Partikulat */}
      <div className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#176FAF] shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-[#103B66]/85 leading-relaxed">
          <strong>Keterangan Ruang Lingkup Sensor:</strong> Sensor partikulat pada sistem AIRSKIN COIR hanya mengukur konsentrasi materi partikulat tersuspensi (PM2.5 dan PM10), bukan seluruh jenis polutan udara seperti gas karbon monoksida (CO), nitrogen dioksida (NO₂), ozon (O₃), maupun senyawa organik volatil.
        </p>
      </div>
    </div>
  );
};
