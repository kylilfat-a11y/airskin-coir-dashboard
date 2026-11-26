import React, { useMemo, useState } from 'react';
import { Calendar, FileSpreadsheet } from 'lucide-react';
import type { SystemStatePayload } from '../types/airskin';

interface ReportsPageProps {
  state: SystemStatePayload;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ state }) => {
  const { telemetry, maintenance, config, mode } = state;
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [startDate, setStartDate] = useState(() =>
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

  const isSim = mode === 'data_simulasi';
  const unit = config.measurementUnit;
  const scale = unit === 'mg/m³' ? 0.001 : 1;
  const dec = unit === 'mg/m³' ? 3 : 1;

  const summary = useMemo(() => {
    const avg = (vals: Array<number | null>) => {
      const valid = vals.filter((v): v is number => v !== null);
      return valid.length > 0
        ? ((valid.reduce((a, b) => a + b, 0) / valid.length) * scale).toFixed(dec)
        : '--';
    };
    return {
      pm25InAvg: avg(telemetry.map((t) => t.pm25Inlet)),
      pm25OutAvg: config.hasOutletSensor ? avg(telemetry.map((t) => t.pm25Outlet)) : '--',
      pm10InAvg: avg(telemetry.map((t) => t.pm10Inlet)),
      pm10OutAvg: config.hasOutletSensor ? avg(telemetry.map((t) => t.pm10Outlet)) : '--',
      totalRows: telemetry.length,
    };
  }, [telemetry, config.hasOutletSensor, scale, dec]);

  function handleExportCsv() {
    const headers = [
      'Waktu',
      'Panel',
      `PM2.5 Masuk (${unit})`,
      `PM2.5 Keluar (${unit})`,
      `PM10 Masuk (${unit})`,
      `PM10 Keluar (${unit})`,
      'Sumber Data',
    ];
    const rows = telemetry.map((t) => [
      t.timestamp,
      t.panelId,
      t.pm25Inlet !== null ? (t.pm25Inlet * scale).toFixed(dec) : '',
      config.hasOutletSensor && t.pm25Outlet !== null ? (t.pm25Outlet * scale).toFixed(dec) : '',
      t.pm10Inlet !== null ? (t.pm10Inlet * scale).toFixed(dec) : '',
      config.hasOutletSensor && t.pm10Outlet !== null ? (t.pm10Outlet * scale).toFixed(dec) : '',
      t.source === 'esp32' ? 'ESP32 AKTUAL' : 'DATA SIMULASI',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-airskin-coir-${period}-${startDate}-sd-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
            Laporan Kinerja AIRSKIN COIR
          </h1>
          <p className="mt-1 text-sm text-[#103B66]/75">
            Ringkasan hasil pemantauan, perbandingan konsentrasi masuk dan keluar, serta ekspor CSV.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-[#176FAF] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#103B66] transition-colors whitespace-nowrap self-start lg:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Unduh Laporan CSV
        </button>
      </div>

      {/* Pilih Periode Laporan */}
      <section className="airskin-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] p-1">
          {(
            [
              { id: 'harian', label: 'Periode Harian' },
              { id: 'mingguan', label: 'Periode Mingguan' },
              { id: 'bulanan', label: 'Periode Bulanan' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                period === p.id ? 'bg-[#176FAF] text-white' : 'text-[#103B66]/75 hover:text-[#103B66]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[#103B66]">
          <Calendar className="w-4 h-4 text-[#176FAF]" />
          <span className="font-medium">Rentang Tanggal:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-[#B9E0F8] bg-white px-2.5 py-1.5 font-mono text-xs"
          />
          <span>s.d.</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-[#B9E0F8] bg-white px-2.5 py-1.5 font-mono text-xs"
          />
        </div>
      </section>

      {isSim && (
        <div className="rounded-xl border border-[#D7B978] bg-[#FDF8EC] px-4 py-2.5 text-xs text-[#103B66]">
          <strong>DATA SIMULASI:</strong> Ringkasan laporan di bawah berasal dari data simulasi pratinjau.
        </div>
      )}

      {/* Ringkasan Hasil Pemantauan & Perbandingan Konsentrasi Masuk dan Keluar */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">Rata-Rata PM2.5 Masuk</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
            {summary.pm25InAvg} <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">{summary.totalRows} sampel tercatat</div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">Rata-Rata PM2.5 Keluar</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
            {summary.pm25OutAvg} <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">Sesudah filtrasi</div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">Rata-Rata PM10 Masuk</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#103B66]">
            {summary.pm10InAvg} <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">Partikulat kasar masuk</div>
        </div>

        <div className="airskin-card p-5 space-y-1">
          <div className="text-xs font-semibold text-[#176FAF]">Rata-Rata PM10 Keluar</div>
          <div className="font-mono tabular-nums text-2xl font-semibold text-[#458B6D]">
            {summary.pm10OutAvg} <span className="text-xs font-normal text-[#103B66]/60">{unit}</span>
          </div>
          <div className="text-[11px] text-[#103B66]/65">Sesudah filtrasi</div>
        </div>
      </section>

      {/* Grafik Perubahan PM2.5 dan PM10 */}
      <section className="airskin-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            Grafik Perubahan PM2.5 dan PM10 ({period.toUpperCase()})
          </h2>
          <div className="flex items-center gap-4 text-xs text-[#103B66]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#176FAF]" /> PM2.5 Masuk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#82C5EF]" /> PM10 Masuk
            </span>
          </div>
        </div>

        {chartPoints.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#82C5EF] bg-[#F5FAFF] py-12 text-center text-xs text-[#103B66]/70">
            Menunggu data sensor — Unduh Laporan CSV tetap dapat digunakan untuk mengunduh struktur kolom laporan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <svg viewBox="0 0 720 215" className="w-full min-w-[520px]">
              {[0.25, 0.5, 0.75, 1].map((t) => {
                const y = 180 - t * 150;
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
                const h25 = ((pt.pm25Inlet ?? 0) / maxVal) * 150;
                const h10 = ((pt.pm10Inlet ?? 0) / maxVal) * 150;
                return (
                  <g key={pt.id}>
                    <rect
                      x={baseX}
                      y={180 - h25}
                      width={Math.max(8, groupW * 0.34)}
                      height={h25}
                      rx="3"
                      fill="#176FAF"
                    />
                    <rect
                      x={baseX + Math.max(10, groupW * 0.38)}
                      y={180 - h10}
                      width={Math.max(8, groupW * 0.34)}
                      height={h10}
                      rx="3"
                      fill="#82C5EF"
                    />
                  </g>
                );
              })}
              <line x1="44" y1="180" x2="700" y2="180" stroke="#B9E0F8" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </section>

      {/* Tabel Data Pengukuran */}
      <section className="airskin-card overflow-hidden">
        <div className="border-b border-[#DCEEFB] px-6 py-4 flex items-center justify-between">
          <h2 className="font-[Poppins] text-base font-semibold text-[#103B66]">
            Tabel Data Pengukuran & Pemeliharaan Terkait
          </h2>
          <span className="text-xs text-[#103B66]/65">{maintenance.length} catatan pemeliharaan</span>
        </div>
        {telemetry.length === 0 ? (
          <div className="px-6 py-10 text-center text-xs text-[#103B66]/65">
            Menunggu data sensor aktual dari perangkat ESP32.
          </div>
        ) : (
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
                {telemetry.slice(-10).reverse().map((row) => (
                  <tr key={row.id}>
                    <td className="px-5 py-3">{new Date(row.timestamp).toLocaleString('id-ID')}</td>
                    <td className="px-5 py-3 text-right">
                      {row.pm25Inlet !== null ? (row.pm25Inlet * scale).toFixed(dec) : '--'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {config.hasOutletSensor && row.pm25Outlet !== null
                        ? (row.pm25Outlet * scale).toFixed(dec)
                        : '--'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.pm10Inlet !== null ? (row.pm10Inlet * scale).toFixed(dec) : '--'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {config.hasOutletSensor && row.pm10Outlet !== null
                        ? (row.pm10Outlet * scale).toFixed(dec)
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
