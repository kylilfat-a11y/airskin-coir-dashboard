import React, { useState } from 'react';
import { AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import type { SystemStatePayload, TimeRangeFilter } from '../types/airskin';
import {
  avgField,
  calcRemovalEfficiency,
  exportTelemetryCsv,
  filterTelemetryByRange,
  formatDateTimeFull,
} from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import { BeforeAfterBarChart } from '../components/BeforeAfterBarChart';

interface LaporanPageProps {
  state: SystemStatePayload;
}

const PERIODE_OPTIONS: { id: TimeRangeFilter; label: string }[] = [
  { id: '1h', label: '1 jam terakhir' },
  { id: '6h', label: '6 jam terakhir' },
  { id: '24h', label: '24 jam terakhir' },
  { id: '7d', label: '7 hari terakhir' },
];

export const LaporanPage: React.FC<LaporanPageProps> = ({ state }) => {
  const [periode, setPeriode] = useState<TimeRangeFilter>('24h');
  const usingActual = state.deviceConnected;
  const rawSeries = usingActual ? state.liveTelemetry : state.simulationTelemetry;
  const points = filterTelemetryByRange(rawSeries, periode);

  const avgPm25In = avgField(points, (p) => p.pm25Inlet);
  const avgPm25Out = avgField(points, (p) => p.pm25Outlet);
  const avgPm10In = avgField(points, (p) => p.pm10Inlet);
  const avgPm10Out = avgField(points, (p) => p.pm10Outlet);

  const eff25 = calcRemovalEfficiency(avgPm25In, avgPm25Out);
  const eff10 = calcRemovalEfficiency(avgPm10In, avgPm10Out);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-semibold text-[#103B66]">
              Laporan Kinerja AIRSKIN COIR
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Ekspor dan tinjau ringkasan hasil pemantauan konsentrasi partikulat berdasarkan periode waktu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Pilih periode laporan"
            value={periode}
            onChange={(e) => setPeriode(e.target.value as TimeRangeFilter)}
            className="rounded-xl border border-[#B9E0F8] bg-white px-3.5 py-2 text-xs font-medium text-[#103B66]"
          >
            {PERIODE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                Periode: {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={points.length === 0}
            onClick={() =>
              exportTelemetryCsv(points, `laporan-airskin-coir-${periode}`, !usingActual)
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh Laporan CSV
          </button>
        </div>
      </div>

      {!usingActual && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-[#6E541D]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
          <span>
            <strong className="font-mono uppercase">DATA SIMULASI:</strong> Laporan ini menyertakan penanda DATA SIMULASI karena perangkat sensor ESP32 belum terhubung secara fisik.
          </span>
        </div>
      )}

      {/* Ringkasan Hasil Pemantauan */}
      <div className="airskin-card p-5 space-y-3">
        <h3 className="font-display text-base font-semibold text-[#103B66]">
          Ringkasan Hasil Pemantauan ({PERIODE_OPTIONS.find((o) => o.id === periode)?.label})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3">
            <span className="text-[#103B66]/65 block">Jumlah Sampel</span>
            <span className="font-mono text-lg font-semibold text-[#103B66] tabular-nums">
              {points.length}
            </span>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3">
            <span className="text-[#103B66]/65 block">Rata-rata PM2.5 Masuk</span>
            <span className="font-mono text-lg font-semibold text-[#176FAF] tabular-nums">
              {avgPm25In ?? '--'} µg/m³
            </span>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3">
            <span className="text-[#103B66]/65 block">Rata-rata PM2.5 Keluar</span>
            <span className="font-mono text-lg font-semibold text-[#2F6F54] tabular-nums">
              {avgPm25Out ?? '--'} µg/m³
            </span>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3">
            <span className="text-[#103B66]/65 block">Rata-rata PM10 Masuk</span>
            <span className="font-mono text-lg font-semibold text-[#176FAF] tabular-nums">
              {avgPm10In ?? '--'} µg/m³
            </span>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3">
            <span className="text-[#103B66]/65 block">Rata-rata PM10 Keluar</span>
            <span className="font-mono text-lg font-semibold text-[#2F6F54] tabular-nums">
              {avgPm10Out ?? '--'} µg/m³
            </span>
          </div>
          <div className="rounded-xl bg-[#F5FAFF] border border-[#DCEEFB] p-3">
            <span className="text-[#103B66]/65 block">Efisiensi PM2.5 / PM10</span>
            <span className="font-mono text-sm font-semibold text-[#103B66] tabular-nums">
              {eff25 ?? '--'}% / {eff10 ?? '--'}%
            </span>
          </div>
        </div>
      </div>

      {/* Grafik Perubahan & Perbandingan */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <InteractiveTrendChart
          title="Grafik Perubahan PM2.5"
          subtitle="Tren PM2.5 pada periode laporan terpilih."
          points={points}
          metric="pm25"
          isSimulated={!usingActual}
        />
        <InteractiveTrendChart
          title="Grafik Perubahan PM10"
          subtitle="Tren PM10 pada periode laporan terpilih."
          points={points}
          metric="pm10"
          isSimulated={!usingActual}
        />
      </div>

      <BeforeAfterBarChart
        avgPm25Inlet={avgPm25In}
        avgPm25Outlet={avgPm25Out}
        avgPm10Inlet={avgPm10In}
        avgPm10Outlet={avgPm10Out}
        isSimulated={!usingActual}
        hasData={points.length > 0}
      />

      {/* Tabel Data Pengukuran */}
      <div className="airskin-card p-5 space-y-3">
        <h3 className="font-display text-base font-semibold text-[#103B66]">
          Tabel Data Pengukuran
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#CBE7FA] bg-[#F5FAFF] text-[#103B66]">
                <th className="py-2.5 px-3 font-semibold">Waktu</th>
                <th className="py-2.5 px-3 font-semibold">Sumber</th>
                <th className="py-2.5 px-3 font-semibold">PM2.5 Masuk</th>
                <th className="py-2.5 px-3 font-semibold">PM2.5 Keluar</th>
                <th className="py-2.5 px-3 font-semibold">PM10 Masuk</th>
                <th className="py-2.5 px-3 font-semibold">PM10 Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F3FC] font-mono tabular-nums">
              {points.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#103B66]/65 font-sans">
                    Belum ada data pada periode laporan ini.
                  </td>
                </tr>
              ) : (
                [...points].reverse().map((pt) => (
                  <tr key={pt.id} className="hover:bg-[#F5FAFF]">
                    <td className="py-2.5 px-3 text-[#103B66]">
                      {formatDateTimeFull(pt.timestamp)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={usingActual ? 'text-[#2F6F54]' : 'text-[#8A6D2E]'}>
                        {usingActual ? 'Sensor Aktual' : 'DATA SIMULASI'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#176FAF]">
                      {pt.pm25Inlet !== null ? `${pt.pm25Inlet} µg/m³` : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-[#2F6F54]">
                      {pt.pm25Outlet !== null ? `${pt.pm25Outlet} µg/m³` : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-[#176FAF]">
                      {pt.pm10Inlet !== null ? `${pt.pm10Inlet} µg/m³` : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-[#2F6F54]">
                      {pt.pm10Outlet !== null ? `${pt.pm10Outlet} µg/m³` : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
