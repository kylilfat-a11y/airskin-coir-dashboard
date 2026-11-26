import React from 'react';
import { Gauge } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import { avgField, calcRemovalEfficiency } from '../utils/airskinMetrics';
import { BeforeAfterBarChart } from '../components/BeforeAfterBarChart';

interface KinerjaPenyaringanPageProps {
  state: SystemStatePayload;
}

export const KinerjaPenyaringanPage: React.FC<KinerjaPenyaringanPageProps> = ({ state }) => {
  // Hanya menggunakan data aktual sensor agar tidak tercampur dengan hasil simulasi
  const hasActual = state.deviceConnected && state.liveTelemetry.length > 0;
  const series = hasActual ? state.liveTelemetry : [];

  const avgPm25In = avgField(series, (p) => p.pm25Inlet);
  const avgPm25Out = avgField(series, (p) => p.pm25Outlet);
  const avgPm10In = avgField(series, (p) => p.pm10Inlet);
  const avgPm10Out = avgField(series, (p) => p.pm10Outlet);

  const effPm25 = calcRemovalEfficiency(avgPm25In, avgPm25Out);
  const effPm10 = calcRemovalEfficiency(avgPm10In, avgPm10Out);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-[#176FAF]" />
          <h2 className="font-display text-xl font-semibold text-[#103B66]">
            Kinerja Filtrasi
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
          Efisiensi penurunan PM2.5 dan PM10 berdasarkan pengukuran sensor udara masuk dan keluar.
        </p>
      </div>

      {/* Hanya Efisiensi Penurunan PM2.5 & PM10 + Rumus */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="airskin-card p-5">
          <span className="text-xs text-[#103B66]/70">Efisiensi Penurunan PM2.5</span>
          <p className="font-display text-3xl font-semibold text-[#176FAF] tabular-nums mt-1">
            {effPm25 !== null ? `${effPm25}%` : '--'}
          </p>
          <p className="text-xs text-[#103B66]/65 mt-1">
            {effPm25 !== null ? 'Berdasarkan data sensor aktual' : 'Menunggu data sensor'}
          </p>
        </div>

        <div className="airskin-card p-5">
          <span className="text-xs text-[#103B66]/70">Efisiensi Penurunan PM10</span>
          <p className="font-display text-3xl font-semibold text-[#2F6F54] tabular-nums mt-1">
            {effPm10 !== null ? `${effPm10}%` : '--'}
          </p>
          <p className="text-xs text-[#103B66]/65 mt-1">
            {effPm10 !== null ? 'Berdasarkan data sensor aktual' : 'Menunggu data sensor'}
          </p>
        </div>

        <div className="airskin-card p-5 bg-[#F8FCFF] flex flex-col justify-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#176FAF]">
            Rumus Efisiensi Filtrasi
          </span>
          <p className="font-mono text-xs text-[#103B66] mt-1.5 leading-relaxed">
            Efisiensi (%) = ((Masuk − Keluar) / Masuk) × 100%
          </p>
        </div>
      </div>

      {/* Grafik Perbandingan Sebelum dan Sesudah Filtrasi */}
      <BeforeAfterBarChart
        avgPm25Inlet={avgPm25In}
        avgPm25Outlet={avgPm25Out}
        avgPm10Inlet={avgPm10In}
        avgPm10Outlet={avgPm10Out}
        isSimulated={false}
        hasData={hasActual}
      />
    </div>
  );
};
