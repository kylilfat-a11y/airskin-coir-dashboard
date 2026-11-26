import React from 'react';

interface SparklineChartProps {
  values: number[];
  strokeColor?: string;
  fillColor?: string;
  height?: number;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  values,
  strokeColor = '#429EDB',
  fillColor = 'rgba(66, 158, 219, 0.14)',
  height = 38,
}) => {
  const width = 140;

  if (!values || values.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        aria-label="Awaiting trend data"
      >
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#B9E0F8"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padY = 4;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - padY - ((val - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full overflow-visible"
      style={{ height }}
      aria-hidden="true"
    >
      <path d={areaPath} fill={fillColor} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.8"
        fill={strokeColor}
      />
    </svg>
  );
};
