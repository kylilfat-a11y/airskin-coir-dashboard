import React from 'react';
import { calcRemovalEfficiency } from '../utils/airskinMetrics';

interface BeforeAfterBarChartProps {
  avgPm25Inlet: number | null;
  avgPm25Outlet: number | null;
  avgPm10Inlet: number | null;
  avgPm10Outlet: number | null;
  isSimulated: boolean;
  hasData: boolean;
}

export const BeforeAfterBarChart: React.FC<BeforeAfterBarChartProps> = ({
  avgPm25Inlet,
  avgPm25Outlet,
  avgPm10Inlet,
  avgPm10Outlet,
  isSimulated,
  hasData,
}) => {
  const rows = [
    {
      label: 'Rata-rata PM2.5',
      inlet: avgPm25Inlet,
      outlet: avgPm25Outlet,
      reduction: calcRemovalEfficiency(avgPm25Inlet, avgPm25Outlet),
    },
    {
      label: 'Rata-rata PM10',
      inlet: avgPm10Inlet,
      outlet: avgPm10Outlet,
      reduction: calcRemovalEfficiency(avgPm10Inlet, avgPm10Outlet),
    },
  ];

  const maxScale = Math.max(
    50,
    avgPm25Inlet ?? 0,
    avgPm25Outlet ?? 0,
    avgPm10Inlet ?? 0,
    avgPm10Outlet ?? 0,
  );

  return (
    <div className="airskin-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-semibold text-[#103B66]">
              Perbandingan Konsentrasi Sebelum dan Sesudah Filtrasi
            </h3>
            <span
              className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                isSimulated
                  ? 'bg-[#D7B978]/15 text-[#8A6D2E] border-[#D7B978]/50'
                  : hasData
                    ? 'bg-[#72B89A]/15 text-[#2F6F54] border-[#72B89A]/50'
                    : 'bg-[#EAF6FF] text-[#103B66]/70 border-[#B9E0F8]'
              }`}
            >
              {isSimulated ? 'DATA SIMULASI' : hasData ? 'DATA AKTUAL' : 'MENUNGGU DATA'}
            </span>
          </div>
          <p className="text-xs text-[#176FAF]/85 mt-0.5">
            Komparasi konsentrasi rata-rata udara masuk dan udara keluar pada panel AIRSKIN COIR.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 text-[#103B66]">
            <span className="w-3 h-3 rounded-sm bg-[#176FAF] inline-block" />
            Udara Masuk
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#103B66]">
            <span className="w-3 h-3 rounded-sm bg-[#72B89A] inline-block" />
            Udara Keluar
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="h-40 rounded-xl border border-dashed border-[#B9E0F8] bg-[#EAF6FF]/50 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-[#103B66]/75">
            Menunggu data sensor. Perbandingan baru dapat ditampilkan setelah tersedia pembacaan masuk dan keluar yang valid.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {rows.map((row) => {
            const inletPct = row.inlet !== null ? Math.min(100, (row.inlet / maxScale) * 100) : 0;
            const outletPct = row.outlet !== null ? Math.min(100, (row.outlet / maxScale) * 100) : 0;

            return (
              <div key={row.label} className="rounded-xl border border-[#DCEEFB] bg-[#F8FCFF] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#103B66]">{row.label}</span>
                  <span className="text-xs font-mono font-semibold text-[#176FAF] tabular-nums">
                    {row.reduction !== null
                      ? `Penurunan ${row.reduction}% ${isSimulated ? '(Simulasi)' : ''}`
                      : 'Data keluar belum tersedia'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#103B66]/75">Udara Masuk</span>
                    <span className="font-mono font-semibold text-[#176FAF] tabular-nums">
                      {row.inlet !== null ? `${row.inlet} µg/m³` : '--'}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded bg-[#E1F1FC] overflow-hidden">
                    <div
                      className="h-full bg-[#176FAF] rounded transition-all duration-500"
                      style={{ width: `${inletPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#103B66]/75">Udara Keluar</span>
                    <span className="font-mono font-semibold text-[#2F6F54] tabular-nums">
                      {row.outlet !== null ? `${row.outlet} µg/m³` : '--'}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded bg-[#E1F1FC] overflow-hidden">
                    <div
                      className="h-full bg-[#72B89A] rounded transition-all duration-500"
                      style={{ width: `${outletPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
