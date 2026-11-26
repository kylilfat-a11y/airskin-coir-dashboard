import React, { useMemo, useState } from 'react';
import type { TelemetryPoint } from '../types/airskin';

interface InteractiveTrendChartProps {
  data: TelemetryPoint[];
  metric: 'pm25' | 'pm10';
  unit: 'µg/m³' | 'mg/m³';
  hasOutletSensor: boolean;
  onRequestDemo?: () => void;
}

export const InteractiveTrendChart: React.FC<InteractiveTrendChartProps> = ({
  data,
  metric,
  unit,
  hasOutletSensor,
  onRequestDemo,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const scaleFactor = unit === 'mg/m³' ? 0.001 : 1;
  const decimals = unit === 'mg/m³' ? 3 : 1;

  const series = useMemo(() => {
    return data.map((d) => ({
      timestamp: d.timestamp,
      inlet:
        metric === 'pm25'
          ? d.pm25Inlet !== null
            ? d.pm25Inlet * scaleFactor
            : null
          : d.pm10Inlet !== null
            ? d.pm10Inlet * scaleFactor
            : null,
      outlet:
        hasOutletSensor &&
        (metric === 'pm25' ? d.pm25Outlet !== null : d.pm10Outlet !== null)
          ? (metric === 'pm25' ? (d.pm25Outlet as number) : (d.pm10Outlet as number)) * scaleFactor
          : null,
    }));
  }, [data, metric, scaleFactor, hasOutletSensor]);

  const width = 760;
  const height = 270;
  const pad = { top: 20, right: 20, bottom: 38, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (series.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#82C5EF] bg-[#F5FAFF] px-6 py-16 text-center">
        <svg viewBox="0 0 320 90" className="w-64 h-20 mb-4 opacity-60" aria-hidden="true">
          <line x1="20" y1="75" x2="300" y2="75" stroke="#B9E0F8" strokeWidth="1.5" />
          <line x1="20" y1="45" x2="300" y2="45" stroke="#B9E0F8" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="20" y1="15" x2="300" y2="15" stroke="#B9E0F8" strokeWidth="1" strokeDasharray="4 4" />
          <path
            d="M 20 55 Q 90 42 160 50 T 300 44"
            fill="none"
            stroke="#82C5EF"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
        </svg>
        <p className="font-[Poppins] text-base font-semibold text-[#103B66]">
          Waiting for sensor data
        </p>
        <p className="mt-1 max-w-md text-xs text-[#103B66]/70">
          Connect an ESP32 node to POST readings to <span className="font-mono">/api/telemetry</span> or switch to labeled Demo Simulation to preview trend visualization.
        </p>
        {onRequestDemo && (
          <button
            type="button"
            onClick={onRequestDemo}
            className="mt-4 rounded-xl bg-[#176FAF] px-4 py-2 text-xs font-medium text-white hover:bg-[#103B66] transition-colors whitespace-nowrap"
          >
            Preview with Demo Simulation
          </button>
        )}
      </div>
    );
  }

  const allValues = series.flatMap((s) => [s.inlet, s.outlet]).filter((v): v is number => v !== null);
  const rawMax = Math.max(...allValues, unit === 'mg/m³' ? 0.05 : 25);
  const yMax = rawMax * 1.18;
  const yMin = 0;

  const getX = (idx: number) =>
    series.length === 1 ? pad.left + plotW / 2 : pad.left + (idx / (series.length - 1)) * plotW;
  const getY = (val: number) => pad.top + plotH - ((val - yMin) / (yMax - yMin || 1)) * plotH;

  const inletPoints = series
    .map((s, idx) => (s.inlet !== null ? `${getX(idx).toFixed(1)},${getY(s.inlet).toFixed(1)}` : null))
    .filter((v): v is string => v !== null);

  const outletPoints = series
    .map((s, idx) => (s.outlet !== null ? `${getX(idx).toFixed(1)},${getY(s.outlet).toFixed(1)}` : null))
    .filter((v): v is string => v !== null);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + t * (yMax - yMin));
  const xTickIndices =
    series.length <= 5
      ? series.map((_, i) => i)
      : [0, Math.floor(series.length * 0.25), Math.floor(series.length * 0.5), Math.floor(series.length * 0.75), series.length - 1];

  const activePoint = hoverIdx !== null && series[hoverIdx] ? series[hoverIdx] : null;

  return (
    <div className="relative w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#103B66]/80">
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-2 font-medium">
            <span className="h-2.5 w-5 rounded-xs bg-[#176FAF]" aria-hidden="true" />
            Inlet ({metric === 'pm25' ? 'PM2.5' : 'PM10'})
          </span>
          {hasOutletSensor && outletPoints.length > 0 ? (
            <span className="inline-flex items-center gap-2 font-medium">
              <span className="h-2.5 w-5 rounded-xs bg-[#72B89A]" aria-hidden="true" />
              Outlet (Filtered)
            </span>
          ) : (
            <span className="text-[#103B66]/55">
              Outlet sensor not installed · Single-sensor inlet stream
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-[#103B66]/65">Unit: {unit}</span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[540px] select-none"
          role="img"
          aria-label={`Interactive ${metric.toUpperCase()} concentration trend chart`}
        >
          <defs>
            <linearGradient id={`inletGrad-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#429EDB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#429EDB" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-axis Labels */}
          {yTicks.map((tickVal, idx) => {
            const y = getY(tickVal);
            return (
              <g key={idx}>
                <line
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  stroke="#DCEEFB"
                  strokeWidth="1"
                />
                <text
                  x={pad.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#103B66]/60 font-mono text-[10px]"
                >
                  {tickVal.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          {/* X-axis Labels */}
          {xTickIndices.map((idx) => {
            const point = series[idx];
            if (!point) return null;
            const timeLabel = new Date(point.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={height - 10}
                textAnchor="middle"
                className="fill-[#103B66]/60 font-mono text-[10px]"
              >
                {timeLabel}
              </text>
            );
          })}

          {/* Inlet Area Fill */}
          {inletPoints.length > 1 && (
            <polygon
              points={`${getX(0)},${pad.top + plotH} ${inletPoints.join(' ')} ${getX(series.length - 1)},${pad.top + plotH}`}
              fill={`url(#inletGrad-${metric})`}
            />
          )}

          {/* Inlet Line */}
          {inletPoints.length > 1 && (
            <polyline
              fill="none"
              stroke="#176FAF"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={inletPoints.join(' ')}
            />
          )}

          {/* Outlet Line */}
          {outletPoints.length > 1 && (
            <polyline
              fill="none"
              stroke="#72B89A"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={outletPoints.join(' ')}
            />
          )}

          {/* Hover Hairline & Active Markers */}
          {hoverIdx !== null && activePoint && (
            <g>
              <line
                x1={getX(hoverIdx)}
                y1={pad.top}
                x2={getX(hoverIdx)}
                y2={pad.top + plotH}
                stroke="#429EDB"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {activePoint.inlet !== null && (
                <circle
                  cx={getX(hoverIdx)}
                  cy={getY(activePoint.inlet)}
                  r="4.5"
                  fill="#176FAF"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
              {activePoint.outlet !== null && (
                <circle
                  cx={getX(hoverIdx)}
                  cy={getY(activePoint.outlet)}
                  r="4.5"
                  fill="#72B89A"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Interactive Hover Hit Columns */}
          {series.map((_, idx) => {
            const colW = plotW / Math.max(series.length, 1);
            return (
              <rect
                key={idx}
                x={getX(idx) - colW / 2}
                y={pad.top}
                width={Math.max(colW, 12)}
                height={plotH}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            );
          })}
        </svg>

        {/* Crosshair HUD Readout */}
        {activePoint && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#B9E0F8] bg-[#F5FAFF] px-4 py-2 text-xs">
            <span className="font-mono tabular-nums text-[#103B66]">
              {new Date(activePoint.timestamp).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
              <span className="text-[#176FAF] font-semibold">
                Inlet: {activePoint.inlet !== null ? `${activePoint.inlet.toFixed(decimals)} ${unit}` : '--'}
              </span>
              {hasOutletSensor && (
                <span className="text-[#458B6D] font-semibold">
                  Outlet: {activePoint.outlet !== null ? `${activePoint.outlet.toFixed(decimals)} ${unit}` : '--'}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
