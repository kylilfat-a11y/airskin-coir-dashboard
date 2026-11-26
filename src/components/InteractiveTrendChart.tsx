import React, { useMemo, useState } from 'react';
import type { TelemetryPoint } from '../types/airskin';
import { calcRemovalEfficiency, formatShortTime } from '../utils/airskinMetrics';

interface InteractiveTrendChartProps {
  title: string;
  subtitle: string;
  unit?: string;
  points: TelemetryPoint[];
  metric: 'pm25' | 'pm10';
  isSimulated: boolean;
  emptyMessage?: string;
}

export const InteractiveTrendChart: React.FC<InteractiveTrendChartProps> = ({
  title,
  subtitle,
  unit = 'µg/m³',
  points,
  metric,
  isSimulated,
  emptyMessage = 'Belum ada pembacaan sensor aktif. Hubungkan ESP32 atau aktifkan Simulation Mode.',
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 640;
  const height = 240;
  const padLeft = 46;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const series = useMemo(() => {
    return points.map((p) => ({
      time: formatShortTime(p.timestamp),
      inlet: metric === 'pm25' ? p.pm25Inlet : p.pm10Inlet,
      outlet: metric === 'pm25' ? p.pm25Outlet : p.pm10Outlet,
    }));
  }, [points, metric]);

  const numericValues = useMemo(() => {
    const arr: number[] = [];
    for (const s of series) {
      if (s.inlet !== null) arr.push(s.inlet);
      if (s.outlet !== null) arr.push(s.outlet);
    }
    return arr;
  }, [series]);

  const maxVal = useMemo(() => {
    if (numericValues.length === 0) return 100;
    const peak = Math.max(...numericValues);
    return Math.max(20, Math.ceil(peak * 1.15));
  }, [numericValues]);

  const minVal = 0;

  const getX = (idx: number) => {
    if (series.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (series.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return padTop + plotH - ratio * plotH;
  };

  const buildPath = (extractor: (item: (typeof series)[number]) => number | null) => {
    let path = '';
    let started = false;
    series.forEach((item, idx) => {
      const val = extractor(item);
      if (val === null) {
        started = false;
        return;
      }
      const x = getX(idx).toFixed(1);
      const y = getY(val).toFixed(1);
      path += started ? ` L ${x} ${y}` : `M ${x} ${y}`;
      started = true;
    });
    return path;
  };

  const inletPath = buildPath((item) => item.inlet);
  const outletPath = buildPath((item) => item.outlet);

  const activeIndex =
    hoverIdx !== null && hoverIdx >= 0 && hoverIdx < series.length
      ? hoverIdx
      : series.length > 0
        ? series.length - 1
        : null;

  const activePoint = activeIndex !== null ? series[activeIndex] : null;
  const activeEfficiency = activePoint
    ? calcRemovalEfficiency(activePoint.inlet, activePoint.outlet)
    : null;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(minVal + (maxVal - minVal) * t));

  return (
    <div className="airskin-card p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-display text-base font-semibold text-[#103B66]">{title}</h3>
            <span
              className={`text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                isSimulated
                  ? 'bg-[#D7B978]/15 text-[#8A6D2E] border-[#D7B978]/50'
                  : 'bg-[#72B89A]/15 text-[#2F6F54] border-[#72B89A]/50'
              }`}
            >
              {isSimulated ? 'SIMULATED DATA' : 'LIVE IoT DATA'}
            </span>
          </div>
          <p className="text-xs text-[#176FAF]/85 mt-0.5">{subtitle}</p>
        </div>

        {/* Interactive Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5 text-[#103B66]">
            <span className="w-3 h-0.5 bg-[#176FAF] inline-block" />
            Inlet ({unit})
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#103B66]">
            <span className="w-3 h-0.5 bg-[#72B89A] inline-block" />
            Outlet ({unit})
          </span>
        </div>
      </div>

      {series.length === 0 ? (
        <div className="h-56 rounded-xl border border-dashed border-[#B9E0F8] bg-[#EAF6FF]/50 flex items-center justify-center px-6 text-center">
          <p className="text-sm text-[#103B66]/75 max-w-md">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="relative w-full">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible touch-pan-y"
              role="img"
              aria-label={title}
              onMouseLeave={() => setHoverIdx(null)}
            >
              {/* Grid lines & Y-axis ticks */}
              {yTicks.map((tickVal) => {
                const y = getY(tickVal);
                return (
                  <g key={tickVal}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={width - padRight}
                      y2={y}
                      stroke="#D8ECF9"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#103B66]/65 text-[10px] font-mono tabular-nums"
                    >
                      {tickVal}
                    </text>
                  </g>
                );
              })}

              {/* X-axis labels */}
              {series.map((pt, idx) => {
                const showLabel =
                  idx === 0 ||
                  idx === series.length - 1 ||
                  idx === Math.floor(series.length / 2);
                if (!showLabel) return null;
                return (
                  <text
                    key={`${pt.time}-${idx}`}
                    x={getX(idx)}
                    y={height - 8}
                    textAnchor={idx === 0 ? 'start' : idx === series.length - 1 ? 'end' : 'middle'}
                    className="fill-[#103B66]/65 text-[10px] font-mono tabular-nums"
                  >
                    {pt.time}
                  </text>
                );
              })}

              {/* Inlet line */}
              {inletPath && (
                <path
                  d={inletPath}
                  fill="none"
                  stroke="#176FAF"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Outlet line */}
              {outletPath && (
                <path
                  d={outletPath}
                  fill="none"
                  stroke="#72B89A"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Active crosshair */}
              {activeIndex !== null && (
                <line
                  x1={getX(activeIndex)}
                  y1={padTop}
                  x2={getX(activeIndex)}
                  y2={padTop + plotH}
                  stroke="#429EDB"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {/* Data markers + invisible hit targets */}
              {series.map((pt, idx) => {
                const x = getX(idx);
                const isSelected = activeIndex === idx;
                return (
                  <g key={`hit-${idx}`}>
                    {pt.inlet !== null && (
                      <circle
                        cx={x}
                        cy={getY(pt.inlet)}
                        r={isSelected ? 4.5 : 2.5}
                        fill="#176FAF"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    )}
                    {pt.outlet !== null && (
                      <circle
                        cx={x}
                        cy={getY(pt.outlet)}
                        r={isSelected ? 4.5 : 2.5}
                        fill="#72B89A"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                    )}
                    <rect
                      x={x - Math.max(8, plotW / (series.length * 2))}
                      y={padTop}
                      width={Math.max(16, plotW / Math.max(1, series.length))}
                      height={plotH}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoverIdx(idx)}
                      onTouchStart={() => setHoverIdx(idx)}
                      onClick={() => setHoverIdx(idx)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Readout Strip */}
          {activePoint && (
            <div className="mt-3 pt-3 border-t border-[#E2F1FC] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#103B66]/65 block">Waktu Sampel</span>
                <span className="font-mono font-semibold text-[#103B66] tabular-nums">
                  {activePoint.time}
                </span>
              </div>
              <div>
                <span className="text-[#103B66]/65 block">Inlet</span>
                <span className="font-mono font-semibold text-[#176FAF] tabular-nums">
                  {activePoint.inlet !== null ? `${activePoint.inlet} ${unit}` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[#103B66]/65 block">Outlet</span>
                <span className="font-mono font-semibold text-[#2F6F54] tabular-nums">
                  {activePoint.outlet !== null ? `${activePoint.outlet} ${unit}` : '--'}
                </span>
              </div>
              <div>
                <span className="text-[#103B66]/65 block">Selisih / Removal</span>
                <span className="font-mono font-semibold text-[#103B66] tabular-nums">
                  {activeEfficiency !== null ? `${activeEfficiency}%` : '--'}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
