import React, { useMemo, useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import type {
  FilterConfigKey,
  SimulationScenarioKey,
  SystemStatePayload,
} from '../types/airskin';
import { InteractiveTrendChart } from '../components/InteractiveTrendChart';
import { SimulationSelector } from '../components/SimulationSelector';

interface AirQualityAnalyticsPageProps {
  state: SystemStatePayload;
  onToggleMode: (mode: 'menunggu_koneksi' | 'data_simulasi') => void;
  onChangeSimulationPreset: (
    scenario: SimulationScenarioKey,
    filterConfig: FilterConfigKey,
  ) => void;
}

export const AirQualityAnalyticsPage: React.FC<AirQualityAnalyticsPageProps> = ({
  state,
  onToggleMode,
  onChangeSimulationPreset,
}) => {
  const { telemetry, simulationPreview, config, mode } = state;
  const [dateFilter, setDateFilter] = useState<string>(() => new Date().toISOString().slice(0, 10));

  // Sesuai instruksi: jika belum terhubung ke perangkat, tampilkan data simulasi dengan label jelas "DATA SIMULASI"
  const isSimDataset = mode !== 'terhubung_esp32';
  const activeDataset = mode === 'terhubung_esp32' ? telemetry : simulationPreview;
  const effectiveOutletAvailable = mode === 'terhubung_esp32' ? config.hasOutletSensor : true;

  const unit = config.measurementUnit;
  const scale = unit === 'mg/m³' ? 0.001 : 1;
  const dec = unit === 'mg/m³' ? 3 : 1;

  // Hitung seri dengan simulasi outlet jika mode simulasi agar perbandingan & tren efisiensi terlihat jelas (dengan label DATA SIMULASI)
  const displayRows = useMemo(() => {
    return activeDataset.map((pt, idx) => {
      const pm25In = pt.pm25Inlet;
      const pm25Out =
        pt.pm25Outlet !== null
          ? pt.pm25Outlet
          : isSimDataset && pm25In !== null
            ? Number((pm25In * (0.46 + (idx % 5) * 0.015)).toFixed(1))
            : null;
      const pm10In = pt.pm10Inlet;
      const pm10Out =
        pt.pm10Outlet !== null
          ? pt.pm10Outlet
          : isSimDataset && pm10In !== null
            ? Number((pm10In * (0.38 + (idx % 4) * 0.014)).toFixed(1))
            : null;

      const eff25 =
        pm25In !== null && pm25In > 0 && pm25Out !== null
          ? ((pm25In - pm25Out) / pm25In) * 100
          : null;

      return {
        ...pt,
        pm25Outlet: pm25Out,
        pm10Outlet: pm10Out,
        eff25,
      };
    });
  }, [activeDataset, isSimDataset]);

  function handleDownloadCsv() {
    const headers = [
      'Waktu',
      `PM2.5 Masuk (${unit})`,
      `PM2.5 Keluar (${unit})`,
      `PM10 Masuk (${unit})`,
      `PM10 Keluar (${unit})`,
      'Sumber',
    ];
    const rows = displayRows.map((r) => [
      r.timestamp,
      r.pm25Inlet !== null ? (r.pm25Inlet * scale).toFixed(dec) : '',
      r.pm25Outlet !== null ? (r.pm25Outlet * scale).toFixed(dec) : '',
      r.pm10Inlet !== null ? (r.pm10Inlet * scale).toFixed(dec) : '',
      r.pm10Outlet !== null ? (r.pm10Outlet * scale).toFixed(dec) : '',
      isSimDataset ? 'DATA SIMULASI' : 'ESP32 AKTUAL',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `airskin-coir-analisis-${dateFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Ringkasan rata-rata untuk grafik perbandingan masuk vs keluar
  const avgStats = useMemo(() => {
    const avg = (vals: Array<number | null>) => {
      const valid = vals.filter((v): v is number => v !== null);
      return valid.length > 0 ? (valid.reduce((a, b) => a + b, 0) / valid.length) * scale : null;
    };
    return {
      pm25In: avg(displayRows.map((r) => r.pm25Inlet)),
      pm25Out: avg(displayRows.map((r) => r.pm25Outlet)),
      pm10In: avg(displayRows.map((r) => r.pm10Inlet)),
      pm10Out: avg(displayRows.map((r) => r.pm10Outlet)),
    };
  }, [displayRows, scale]);

  const maxBar = Math.max(avgStats.pm10In ?? 80, avgStats.pm25In ?? 50, 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-[Poppins] text-2xl sm:text-3xl font-semibold tracking-tight text-[#103B66]">
            Analisis dan Riwayat Kualitas Udara
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Tren historis PM2.5 dan PM10, perbandingan udara masuk vs keluar, serta perubahan efisiensi filtrasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-xl border border-[#B9E0F8] bg-white px-3 py-2 text-xs text-[#103B66]">
            <Calendar className="w-3.5 h-3.5 text-[#176FAF]" />
            <span>Filter Tanggal:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="font-mono text-xs focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66] whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Unduh Laporan
          </button>
        </div>
      </div>

      {/* Pilihan Sumber Data & Skenario Simulasi */}
      <SimulationSelector
        mode={mode}
        scenario={config.simulationScenario}
        filterConfig={config.simulationFilterConfig}
        onToggleMode={onToggleMode}
        onChangePreset={onChangeSimulationPreset}
      />

      {/* Label Jelas DATA SIMULASI jika belum terhubung ke perangkat */}
      {isSimDataset && mode !== 'data_simulasi' && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FDF8EC] px-4 py-3 text-xs text-[#103B66]">
          <strong>DATA SIMULASI:</strong> Perangkat keras ESP32 belum terhubung. Seluruh grafik dan tabel pada halaman ini menampilkan pratinjau simulasi sesuai pilihan skenario di atas.
        </div>
      )}

      {/* Tren PM2.5 dan PM10 Berdasarkan Waktu */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="airskin-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Tren PM2.5 Berdasarkan Waktu
            </h2>
            {isSimDataset && (
              <span className="font-mono text-[11px] font-semibold text-[#A68338]">DATA SIMULASI</span>
            )}
          </div>
          <InteractiveTrendChart
            data={displayRows}
            metric="pm25"
            unit={unit}
            hasOutletSensor={effectiveOutletAvailable}
            isSimulation={isSimDataset}
          />
        </section>

        <section className="airskin-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Tren PM10 Berdasarkan Waktu
            </h2>
            {isSimDataset && (
              <span className="font-mono text-[11px] font-semibold text-[#A68338]">DATA SIMULASI</span>
            )}
          </div>
          <InteractiveTrendChart
            data={displayRows}
            metric="pm10"
            unit={unit}
            hasOutletSensor={effectiveOutletAvailable}
            isSimulation={isSimDataset}
          />
        </section>
      </div>

      {/* Perbandingan Udara Masuk vs Keluar & Perubahan Efisiensi */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="airskin-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Perbandingan Rata-Rata Udara Masuk dan Keluar
            </h2>
            {isSimDataset && (
              <span className="font-mono text-[11px] font-semibold text-[#A68338]">DATA SIMULASI</span>
            )}
          </div>

          <div className="space-y-4 text-xs">
            {[
              { label: 'PM2.5 Udara Masuk', val: avgStats.pm25In, color: '#176FAF' },
              { label: 'PM2.5 Udara Keluar', val: avgStats.pm25Out, color: '#72B89A' },
              { label: 'PM10 Udara Masuk', val: avgStats.pm10In, color: '#429EDB' },
              { label: 'PM10 Udara Keluar', val: avgStats.pm10Out, color: '#72B89A' },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium text-[#103B66]">{item.label}</span>
                  <span className="font-mono tabular-nums font-semibold text-[#103B66]">
                    {item.val !== null ? `${item.val.toFixed(dec)} ${unit}` : '--'}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#EAF6FF] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.val !== null ? Math.min(100, (item.val / maxBar) * 100) : 0}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="airskin-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[Poppins] text-sm font-semibold text-[#103B66]">
              Perubahan Efisiensi Filtrasi (%)
            </h2>
            {isSimDataset && (
              <span className="font-mono text-[11px] font-semibold text-[#A68338]">DATA SIMULASI</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <svg viewBox="0 0 540 165" className="w-full min-w-[380px]">
              {[0, 25, 50, 75, 100].map((val) => {
                const y = 140 - (val / 100) * 115;
                return (
                  <g key={val}>
                    <line x1="36" y1={y} x2="520" y2={y} stroke="#DCEEFB" strokeWidth="1" />
                    <text x="30" y={y + 4} textAnchor="end" className="fill-[#103B66]/60 font-mono text-[10px]">
                      {val}%
                    </text>
                  </g>
                );
              })}
              {displayRows.slice(-20).length > 1 && (
                <polyline
                  fill="none"
                  stroke="#72B89A"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                  points={displayRows
                    .slice(-20)
                    .map((r, i, arr) => {
                      const x = 42 + (i / (arr.length - 1)) * 470;
                      const y = 140 - ((r.eff25 ?? 0) / 100) * 115;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ')}
                />
              )}
            </svg>
          </div>
        </section>
      </div>

      {/* Tabel Riwayat Pengukuran */}
      <section className="airskin-card overflow-hidden">
        <div className="border-b border-[#DCEEFB] px-6 py-4 flex items-center justify-between gap-2">
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            Tabel Riwayat Pengukuran
          </h2>
          {isSimDataset && (
            <span className="font-mono text-xs font-semibold text-[#A68338]">DATA SIMULASI</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5FAFF] text-[#103B66]/70 border-b border-[#DCEEFB]">
              <tr>
                <th className="px-5 py-3 font-semibold">Waktu</th>
                <th className="px-5 py-3 font-semibold text-right">PM2.5 Masuk</th>
                <th className="px-5 py-3 font-semibold text-right">PM2.5 Keluar</th>
                <th className="px-5 py-3 font-semibold text-right">PM10 Masuk</th>
                <th className="px-5 py-3 font-semibold text-right">PM10 Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF6FF] font-mono tabular-nums">
              {displayRows.slice(-12).reverse().map((row) => (
                <tr key={row.id} className="hover:bg-[#F5FAFF]/70">
                  <td className="px-5 py-3 text-[#103B66]">
                    {new Date(row.timestamp).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-5 py-3 text-right text-[#176FAF]">
                    {row.pm25Inlet !== null ? `${(row.pm25Inlet * scale).toFixed(dec)} ${unit}` : '--'}
                  </td>
                  <td className="px-5 py-3 text-right text-[#458B6D]">
                    {row.pm25Outlet !== null ? `${(row.pm25Outlet * scale).toFixed(dec)} ${unit}` : '--'}
                  </td>
                  <td className="px-5 py-3 text-right text-[#176FAF]">
                    {row.pm10Inlet !== null ? `${(row.pm10Inlet * scale).toFixed(dec)} ${unit}` : '--'}
                  </td>
                  <td className="px-5 py-3 text-right text-[#458B6D]">
                    {row.pm10Outlet !== null ? `${(row.pm10Outlet * scale).toFixed(dec)} ${unit}` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
