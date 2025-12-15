import React from 'react';

type Series = { name: string; x: number[]; y: number[] };

export function LineChart(props: {
  width: number;
  height: number;
  series: Series[];
  xLabel?: string;
  yLabel?: string;
}) {
  const padding = { l: 55, r: 15, t: 15, b: 45 };
  const w = props.width;
  const h = props.height;

  const allX = props.series.flatMap((s) => s.x);
  const allY = props.series.flatMap((s) => s.y);

  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);
  const yMin = 0;
  const yMax = Math.max(...allY, 1);

  function xScale(x: number) {
    return padding.l + ((x - xMin) / (xMax - xMin)) * (w - padding.l - padding.r);
  }
  function yScale(y: number) {
    return h - padding.b - ((y - yMin) / (yMax - yMin)) * (h - padding.t - padding.b);
  }

  const colors = ['#667eea', '#f093fb', '#4facfe', '#fa709a'];

  return (
    <svg width={w} height={h} style={{ 
      border: '1px solid #e9ecef', 
      borderRadius: 12, 
      background: 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <line x1={padding.l} y1={h - padding.b} x2={w - padding.r} y2={h - padding.b} stroke="#333" />
      <line x1={padding.l} y1={padding.t} x2={padding.l} y2={h - padding.b} stroke="#333" />

      {tickValues(xMin, xMax, 6).map((x, i) => (
        <g key={i}>
          <line x1={xScale(x)} y1={h - padding.b} x2={xScale(x)} y2={h - padding.b + 4} stroke="#333" />
          <text x={xScale(x)} y={h - padding.b + 18} fontSize={11} textAnchor="middle" fill="#333">
            {x.toFixed(0)}
          </text>
        </g>
      ))}
      {tickValues(yMin, yMax, 5).map((y, i) => (
        <g key={i}>
          <line x1={padding.l - 4} y1={yScale(y)} x2={padding.l} y2={yScale(y)} stroke="#333" />
          <text x={padding.l - 8} y={yScale(y) + 4} fontSize={11} textAnchor="end" fill="#333">
            {y.toFixed(0)}
          </text>
        </g>
      ))}

      {props.series.map((s, idx) => {
        const path = s.x
          .map((x, i) => {
            const px = xScale(x);
            const py = yScale(s.y[i] ?? 0);
            return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
          })
          .join(' ');
        return <path key={s.name} d={path} fill="none" stroke={colors[idx % colors.length]} strokeWidth={2.5} />;
      })}

      <g transform={`translate(${padding.l + 10}, ${padding.t + 5})`}>
        {props.series.map((s, idx) => (
          <g key={s.name} transform={`translate(0, ${idx * 16})`}>
            <line x1={0} y1={-4} x2={16} y2={-4} stroke={colors[idx % colors.length]} strokeWidth={3} />
            <text x={22} y={0} fontSize={11} fill="#333">
              {s.name}
            </text>
          </g>
        ))}
      </g>

      {props.xLabel && (
        <text x={(padding.l + w - padding.r) / 2} y={h - 10} fontSize={12} textAnchor="middle" fill="#333">
          {props.xLabel}
        </text>
      )}
      {props.yLabel && (
        <text
          x={14}
          y={(padding.t + h - padding.b) / 2}
          fontSize={12}
          textAnchor="middle"
          fill="#333"
          transform={`rotate(-90 14 ${(padding.t + h - padding.b) / 2})`}
        >
          {props.yLabel}
        </text>
      )}
    </svg>
  );
}

function tickValues(min: number, max: number, count: number): number[] {
  if (max <= min) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => min + i * step);
}
