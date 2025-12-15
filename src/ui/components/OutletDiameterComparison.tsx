import React, { useMemo } from 'react';
import type { Config } from '../../model/schema';
import { calcResults } from '../../model/calc';

interface OutletDiameterComparisonProps {
  config: Config;
}

export function OutletDiameterComparison(props: OutletDiameterComparisonProps) {
  const { config } = props;
  
  const diameters = [2, 4, 5];
  
  const comparisonData = useMemo(() => {
    return diameters.map(diameter => {
      const testConfig = { ...config, outletDiameterIn: diameter };
      const results = calcResults(testConfig);
      return {
        diameter,
        radiantOutW: results.radiantOutW,
        wallCapturedW: results.wallCapturedW,
        effectiveRadiusFt: results.effectiveRadiusFt,
      };
    });
  }, [config]);

  const width = 500;
  const height = 300;
  const padding = { l: 60, r: 20, t: 20, b: 50 };
  const barWidth = 60;
  const groupWidth = width - padding.l - padding.r;
  const barSpacing = groupWidth / diameters.length;

  const maxY = Math.max(...comparisonData.map(d => d.radiantOutW));

  function yScale(watts: number) {
    return height - padding.b - (watts / maxY) * (height - padding.t - padding.b);
  }

  const colors = ['#667eea', '#f093fb', '#4facfe'];

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e9ecef',
      borderRadius: 12,
      padding: 16,
      marginTop: 16
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#212529' }}>
        🔄 Outlet Diameter Comparison (2", 4", 5")
      </h4>
      
      <svg width={width} height={height} style={{ 
        border: '1px solid #e9ecef',
        borderRadius: 8,
        background: 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)'
      }}>
        {/* Axes */}
        <line x1={padding.l} y1={height - padding.b} x2={width - padding.r} y2={height - padding.b} stroke="#333" strokeWidth={1.5} />
        <line x1={padding.l} y1={padding.t} x2={padding.l} y2={height - padding.b} stroke="#333" strokeWidth={1.5} />

        {/* Y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = maxY * ratio;
          const y = yScale(value);
          return (
            <g key={i}>
              <line x1={padding.l - 5} y1={y} x2={padding.l} y2={y} stroke="#333" strokeWidth={1.5} />
              <text x={padding.l - 10} y={y + 4} fontSize={11} textAnchor="end" fill="#333">
                {(value / 1000).toFixed(2)}
              </text>
              <line 
                x1={padding.l} 
                y1={y} 
                x2={width - padding.r} 
                y2={y} 
                stroke="#e9ecef" 
                strokeWidth={1}
              />
            </g>
          );
        })}

        {/* Bars */}
        {comparisonData.map((d, i) => {
          const x = padding.l + (i * barSpacing) + (barSpacing - barWidth) / 2;
          const barHeight = (height - padding.b) - yScale(d.radiantOutW);
          const y = yScale(d.radiantOutW);
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={colors[i]}
                opacity={0.8}
                stroke={colors[i]}
                strokeWidth={2}
                rx={4}
              />
              {/* Value label on bar */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                fontSize={11}
                textAnchor="middle"
                fill={colors[i]}
                fontWeight={700}
              >
                {(d.radiantOutW / 1000).toFixed(2)} kW
              </text>
              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={height - padding.b + 18}
                fontSize={12}
                textAnchor="middle"
                fill="#333"
                fontWeight={600}
              >
                {d.diameter}"ø
              </text>
              {/* Wall captured sub-label */}
              <text
                x={x + barWidth / 2}
                y={height - padding.b + 32}
                fontSize={9}
                textAnchor="middle"
                fill="#6c757d"
              >
                ({(d.wallCapturedW / 1000).toFixed(2)} kW captured)
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
        <strong>Key Insight:</strong> Smaller outlets (2-3") increase contact time and pressure, improving heat 
        transfer to walls. Larger outlets (5"+) allow more bypass but reduce back-pressure on the burner. 
        <strong> Formula impact:</strong> Outlet diameter affects effective radius R_avg = (R_inlet + R_outlet)/2, 
        which changes irradiance distribution E(d) = P_IR / (2πd²).
      </div>
    </div>
  );
}
