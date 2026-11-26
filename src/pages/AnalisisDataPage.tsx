import React, { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Calendar, Download } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import {
  avgField,
  calcRemovalEfficiency,
  exportTelemetryCsv,
  formatDateTimeFull,
  formatShortTime,
} from '../utils/airskinMetrics';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import { BeforeAfterBarChart } from '../components/BeforeAfterBarChart';

interface AnalisisDataPageProps {
  state: SystemStatePayload;
}

export const AnalisisDataPage: React.FC<AnalisisDataPageProps> = ({ state }) => {
  const usingActual = state.deviceConnected;
  const rawSeries = usingActual ? state.liveTelemetry : state.simulationTelemetry;

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredSeries = useMemo(() => {
    return rawSeries.filter((pt) => {
      const ms = new Date(pt.timestamp).getTime();
      if (startDate) {
        const minMs = new Date(`${startDate}T00:00:00`).getTime();
        if (ms < minMs) return false;
      }
      if (endDate) {
        const maxMs = new Date(`${endDate}T23:59:59`).getTime();
        if (ms > maxMs) return false;
      }
      return true;
    });
  }, [rawSeries, startDate, endDate]);

  const avgPm25In = avgField(filteredSeries, (p) => p.pm25Inlet);
  const avgPm25Out = avgField(filteredSeries, (p) => p.pm25Outlet);
  const avgPm10In = avgField(filteredSeries, (p) => p.pm10Inlet);
  const avgPm10Out = avgField(filteredSeries, (p) => p.pm10Outlet);

  const efficiencySeries = useMemo(() => {
    return filteredSeries.slice(-16).map((pt) => ({
      time: formatShortTime(pt.timestamp),
      eff25: calcRemovalEfficiency(pt.pm25Inlet, pt.pm25Outlet),
      eff10: calcRemovalEfficiency(pt.pm10Inlet, pt.pm10Outlet),
    }));
  }, [filteredSeries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-semibold text-[#103B66]">
              Analisis dan Riwayat Kualitas Udara
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Eksplorasi tren historis, perubahan efisiensi filtrasi, penyaringan tanggal, dan tabel data terperinci.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            exportTelemetryCsv(filteredSeries, 'airskin-coir-analisis', !usingActual)
          }
          disabled={filteredSeries.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176FAF] hover:bg-[#103B66] text-white text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Unduh Laporan
        </button>
      </div>

      {!usingActual && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-[#6E541D]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
          <span>
            <strong className="font-mono uppercase">DATA SIMULASI:</strong> Perangkat ESP32 belum terhubung. Seluruh grafik dan tabel di halaman ini berlabel DATA SIMULASI.
          </span>
        </div>
      )}

      {/* Filter Tanggal */}
      <div className="airskin-card p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#103B66] self-center">
          <Calendar className="w-4 h-4 text-[#176FAF]" />
          <span>Filter Tanggal:</span>
        </div>
        <label className="block space-y-1">
          <span className="text-[11px] text-[#103B66]/70 block">Dari Tanggal</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-1.5 text-xs font-mono text-[#103B66]"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-[#103B66]/70 block">Sampai Tanggal</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-[#B9E0F8] bg-[#F8FCFF] px-3 py-1.5 text-xs font-mono text-[#103B66]"
          />
        </label>
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="px-3 py-1.5 rounded-xl border border-[#B9E0F8] bg-white hover:bg-[#EAF6FF] text-xs font-medium text-[#176FAF]"
          >
            Reset Tanggal
          </button>
        )}
      </div>

      {/* Grafik Tren PM2.5 & PM10 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <InteractiveTrendChart
          title="Tren PM2.5 Berdasarkan Waktu"
          subtitle="Rekaman konsentrasi PM2.5 udara masuk dan udara keluar."
          points={filteredSeries}
          metric="pm25"
          isSimulated={!usingActual}
        />
        <InteractiveTrendChart
          title="Tren PM10 Berdasarkan Waktu"
          subtitle="Rekaman konsentrasi PM10 udara masuk dan udara keluar."
          points={filteredSeries}
          metric="pm10"
          isSimulated={!usingActual}
        />
      </div>

      {/* Perbandingan Masuk/Keluar & Perubahan Efisiensi Filtrasi */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <BeforeAfterBarChart
          avgPm25Inlet={avgPm25In}
          avgPm25Outlet={avgPm25Out}
          avgPm10Inlet={avgPm10In}
          avgPm10Outlet={avgPm10Out}
          isSimulated={!usingActual}
          hasData={filteredSeries.length > 0}
        />

        <div className="airskin-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-semibold text-[#103B66]">
                Perubahan Efisiensi Filtrasi
              </h3>
              <p className="text-xs text-[#176FAF]/85">
                Persentase selisih konsentrasi masuk dan keluar pada sampel terakhir.
              </p>
            </div>
            <span
              className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded border ${
                !usingActual
                  ? 'bg-[#D7B978]/15 text-[#8A6D2E] border-[#D7B978]/50'
                  : 'bg-[#72B89A]/15 text-[#2F6F54] border-[#72B89A]/50'
              }`}
            >
              {usingActual ? 'DATA AKTUAL' : 'DATA SIMULASI'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {efficiencySeries.length === 0 ? (
              <p className="text-xs text-[#103B66]/65 py-6 text-center">
                Belum ada sampel untuk rentang tanggal terpilih.
              </p>
            ) : (
              efficiencySeries.map((item, idx) => (
                <div
                  key={`${item.time}-${idx}`}
                  className="rounded-xl bg-[#F8FCFF] border border-[#DCEEFB] px-3.5 py-2.5 flex items-center justify-between text-xs font-mono tabular-nums"
                >
                  <span className="text-[#103B66]/75">{item.time}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[#176FAF]">
                      PM2.5: <strong>{item.eff25 !== null ? `${item.eff25}%` : '--'}</strong>
                    </span>
                    <span className="text-[#2F6F54]">
                      PM10: <strong>{item.eff10 !== null ? `${item.eff10}%` : '--'}</strong>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Kualitas Udara */}
      <div className="airskin-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-[#103B66]">
            Tabel Riwayat Pengukuran
          </h3>
          <span className="text-xs text-[#103B66]/70 font-mono">
            Total baris: {filteredSeries.length} ({usingActual ? 'Aktual' : 'DATA SIMULASI'})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#CBE7FA] bg-[#F5FAFF] text-[#103B66]">
                <th className="py-2.5 px-3 font-semibold">Waktu</th>
                <th className="py-2.5 px-3 font-semibold">PM2.5 Masuk</th>
                <th className="py-2.5 px-3 font-semibold">PM2.5 Keluar</th>
                <th className="py-2.5 px-3 font-semibold">PM10 Masuk</th>
                <th className="py-2.5 px-3 font-semibold">PM10 Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F3FC] font-mono tabular-nums">
              {filteredSeries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-[#103B66]/65 font-sans">
                    Tidak ada data pada rentang tanggal ini.
                  </td>
                </tr>
              ) : (
                [...filteredSeries].reverse().map((pt) => (
                  <tr key={pt.id} className="hover:bg-[#F5FAFF]">
                    <td className="py-2.5 px-3 text-[#103B66]">
                      {formatDateTimeFull(pt.timestamp)}
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
