import React, { useMemo } from 'react';
import type { Config } from '../../model/schema';
import { calcResults } from '../../model/calc';

interface OutletDiameterComparisonProps {
  config: Config;
}

export function OutletDiameterComparison(props: OutletDiameterComparisonProps) {
  const { config } = props;

  const diameters = [1, 2, 3, 4, 5, 6];

  const comparisonData = useMemo(() => {
    return diameters.map((diameter) => {
      const results = calcResults({ ...config, outletDiameterIn: diameter });
      return {
        diameter,
        radiantOutW: results.radiantOutW,
        wallCapturedW: results.wallCapturedW,
      };
    });
  }, [config]);

  const width = 500;
  const height = 300;
  const padding = { l: 60, r: 20, t: 20, b: 50 };
  const barWidth = 44;
  const groupWidth = width - padding.l - padding.r;
  const barSpacing = groupWidth / diameters.length;

  const maxY = Math.max(1, ...comparisonData.map((d) => d.radiantOutW));

  function yScale(watts: number) {
    return height - padding.b - (watts / maxY) * (height - padding.t - padding.b);
  }

  const colors = ['#667eea', '#7b8cff', '#f093fb', '#c77dff', '#4facfe', '#00c2ff'];

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
      }}
    >
      <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#212529' }}>
        🔄 Outlet Diameter Comparison (1&quot;–6&quot;)
      </h4>

      <svg
        width={width}
        height={height}
        style={{
          border: '1px solid #e9ecef',
          borderRadius: 8,
          background: 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)',
        }}
      >
        {/* Axes */}
        <line
          x1={padding.l}
          y1={height - padding.b}
          x2={width - padding.r}
          y2={height - padding.b}
          stroke="#333"
          strokeWidth={1.5}
        />
        <line
          x1={padding.l}
          y1={padding.t}
          x2={padding.l}
          y2={height - padding.b}
          stroke="#333"
          strokeWidth={1.5}
        />

        {/* Y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = maxY * ratio;
          const y = yScale(value);
          return (
            <g key={i}>
              <line x1={padding.l - 5} y1={y} x2={padding.l} y2={y} stroke="#333" strokeWidth={1.5} />
              <text x={padding.l - 10} y={y + 4} fontSize={11} textAnchor="end" fill="#333">
                {(value / 1000).toFixed(3)}
              </text>
              <line x1={padding.l} y1={y} x2={width - padding.r} y2={y} stroke="#e9ecef" strokeWidth={1} />
            </g>
          );
        })}

        {/* Bars */}
        {comparisonData.map((d, i) => {
          const x = padding.l + i * barSpacing + (barSpacing - barWidth) / 2;
          const y = yScale(d.radiantOutW);
          const barHeight = height - padding.b - y;
          const color = colors[i] || '#667eea';

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                opacity={0.8}
                stroke={color}
                strokeWidth={2}
                rx={4}
              />
              <text x={x + barWidth / 2} y={y - 8} fontSize={11} textAnchor="middle" fill={color} fontWeight={700}>
                {(d.radiantOutW / 1000).toFixed(3)} kW
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.b + 18}
                fontSize={12}
                textAnchor="middle"
                fill="#333"
                fontWeight={600}
              >
                {d.diameter}&quot;ø
              </text>
              <text x={x + barWidth / 2} y={height - padding.b + 32} fontSize={9} textAnchor="middle" fill="#6c757d">
                ({(d.wallCapturedW / 1000).toFixed(3)} kW captured)
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={(padding.l + width - padding.r) / 2}
          y={height - 5}
          fontSize={12}
          textAnchor="middle"
          fill="#495057"
          fontWeight={600}
        >
          Outlet Diameter
        </text>
        <text
          x={15}
          y={(padding.t + height - padding.b) / 2}
          fontSize={12}
          textAnchor="middle"
          fill="#495057"
          fontWeight={600}
          transform={`rotate(-90 15 ${(padding.t + height - padding.b) / 2})`}
        >
          Radiant IR Output (kW)
        </text>
      </svg>

      <div style={{ marginTop: 12, fontSize: 12, color: '#6c757d', lineHeight: 1.5 }}>
        <strong>What changes with outlet diameter in this model:</strong> relative to a 4&quot; outlet, smaller outlets increase
        effective heat-transfer (higher UA) and reduce bypass, while larger outlets do the opposite; irradiance also shifts via the
        average radius term used in distance-to-surface.
      </div>
    </div>
  );
}
