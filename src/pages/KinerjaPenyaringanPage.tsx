import React from 'react';
import { AlertTriangle, Gauge, Info } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';
import {
  avgField,
  calcRemovalEfficiency,
  formatDateTimeFull,
} from '../utils/airskinMetrics';
import { BeforeAfterBarChart } from '../components/BeforeAfterBarChart';

interface KinerjaPenyaringanPageProps {
  state: SystemStatePayload;
}

export const KinerjaPenyaringanPage: React.FC<KinerjaPenyaringanPageProps> = ({ state }) => {
  const usingActual = state.deviceConnected;
  const series = usingActual ? state.liveTelemetry : state.simulationTelemetry;

  const avgPm25In = avgField(series, (p) => p.pm25Inlet);
  const avgPm25Out = avgField(series, (p) => p.pm25Outlet);
  const avgPm10In = avgField(series, (p) => p.pm10Inlet);
  const avgPm10Out = avgField(series, (p) => p.pm10Outlet);

  const effPm25 = calcRemovalEfficiency(avgPm25In, avgPm25Out);
  const effPm10 = calcRemovalEfficiency(avgPm10In, avgPm10Out);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-[#176FAF]" />
            <h2 className="font-display text-xl font-semibold text-[#103B66]">
              Analisis Kinerja Filtrasi
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#176FAF]/90 mt-0.5">
            Perbandingan konsentrasi partikulat sebelum dan sesudah filtrasi serta riwayat perhitungan efisiensi.
          </p>
        </div>

        <span
          className={`font-mono text-xs uppercase px-2.5 py-1 rounded border ${
            !usingActual
              ? 'bg-[#FCF7EC] border-[#D7B978] text-[#7A5E1B]'
              : 'bg-[#EFF9F4] border-[#72B89A] text-[#2F6F54]'
          }`}
        >
          {usingActual ? 'DATA SENSOR AKTUAL' : 'DATA SIMULASI'}
        </span>
      </div>

      {!usingActual && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FCF7EC] px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm text-[#6E541D]">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#B8923E]" />
          <span>
            <strong className="font-mono uppercase">DATA SIMULASI:</strong> Perangkat ESP32 belum terhubung sehingga angka kinerja di bawah merupakan ilustrasi simulasi dan belum menjadi hasil uji fisik prototipe.
          </span>
        </div>
      )}

      {/* Nilai Efisiensi & Rumus */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="airskin-card p-5">
          <span className="text-xs text-[#103B66]/70">Nilai Efisiensi Filtrasi PM2.5</span>
          <p className="font-display text-3xl font-semibold text-[#176FAF] tabular-nums mt-1">
            {effPm25 !== null ? `${effPm25}%` : '--'}
          </p>
          <p className="text-[11px] text-[#103B66]/65 mt-1">
            {usingActual ? 'Berdasarkan sensor aktual' : 'DATA SIMULASI'}
          </p>
        </div>

        <div className="airskin-card p-5">
          <span className="text-xs text-[#103B66]/70">Nilai Efisiensi Filtrasi PM10</span>
          <p className="font-display text-3xl font-semibold text-[#2F6F54] tabular-nums mt-1">
            {effPm10 !== null ? `${effPm10}%` : '--'}
          </p>
          <p className="text-[11px] text-[#103B66]/65 mt-1">
            {usingActual ? 'Berdasarkan sensor aktual' : 'DATA SIMULASI'}
          </p>
        </div>

        <div className="airskin-card p-5 bg-[#F8FCFF] flex flex-col justify-center">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#176FAF]">
            Rumus Perhitungan Efisiensi
          </span>
          <p className="font-mono text-xs text-[#103B66] mt-1.5 leading-relaxed">
            Efisiensi Filtrasi (%) = ((Konsentrasi Masuk − Konsentrasi Keluar) / Konsentrasi Masuk) × 100%
          </p>
        </div>
      </div>

      {/* Keterangan Validitas Data */}
      <div className="rounded-xl border border-[#B9E0F8] bg-white px-4 py-3 flex items-start gap-2.5 text-xs sm:text-sm text-[#103B66]/85">
        <Info className="w-4 h-4 text-[#176FAF] shrink-0 mt-0.5" />
        <span>
          Efisiensi filtrasi hanya dapat dihitung apabila data pengukuran konsentrasi udara masuk dan udara keluar sama-sama tersedia serta bernilai valid (&gt; 0 pada sisi masuk).
        </span>
      </div>

      {/* Grafik Perbandingan PM2.5 & PM10 */}
      <BeforeAfterBarChart
        avgPm25Inlet={avgPm25In}
        avgPm25Outlet={avgPm25Out}
        avgPm10Inlet={avgPm10In}
        avgPm10Outlet={avgPm10Out}
        isSimulated={!usingActual}
        hasData={series.length > 0}
      />

      {/* Riwayat Pengujian & Tabel Hasil Pengukuran */}
      <div className="airskin-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-[#103B66]">
              Riwayat Pengujian &amp; Tabel Hasil Pengukuran
            </h3>
            <p className="text-xs text-[#103B66]/70">
              Menampilkan {series.slice(-12).length} catatan terbaru ({usingActual ? 'Sensor ESP32' : 'DATA SIMULASI'}).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#CBE7FA] bg-[#F5FAFF] text-[#103B66]">
                <th className="py-2.5 px-3 font-semibold">Waktu</th>
                <th className="py-2.5 px-3 font-semibold">PM2.5 Masuk</th>
                <th className="py-2.5 px-3 font-semibold">PM2.5 Keluar</th>
                <th className="py-2.5 px-3 font-semibold">Efisiensi PM2.5</th>
                <th className="py-2.5 px-3 font-semibold">PM10 Masuk</th>
                <th className="py-2.5 px-3 font-semibold">PM10 Keluar</th>
                <th className="py-2.5 px-3 font-semibold">Efisiensi PM10</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6F3FC] font-mono tabular-nums">
              {series.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#103B66]/65 font-sans">
                    Menunggu data sensor masuk.
                  </td>
                </tr>
              ) : (
                [...series]
                  .reverse()
                  .slice(0, 12)
                  .map((pt) => {
                    const e25 = calcRemovalEfficiency(pt.pm25Inlet, pt.pm25Outlet);
                    const e10 = calcRemovalEfficiency(pt.pm10Inlet, pt.pm10Outlet);
                    return (
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
                        <td className="py-2.5 px-3 font-semibold text-[#103B66]">
                          {e25 !== null ? `${e25}%` : '--'}
                        </td>
                        <td className="py-2.5 px-3 text-[#176FAF]">
                          {pt.pm10Inlet !== null ? `${pt.pm10Inlet} µg/m³` : '--'}
                        </td>
                        <td className="py-2.5 px-3 text-[#2F6F54]">
                          {pt.pm10Outlet !== null ? `${pt.pm10Outlet} µg/m³` : '--'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#103B66]">
                          {e10 !== null ? `${e10}%` : '--'}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
