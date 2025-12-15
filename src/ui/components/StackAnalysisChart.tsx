import React from 'react';
import type { Results } from '../../model/schema';

interface StackAnalysisChartProps {
  results: Results;
}

export function StackAnalysisChart(props: StackAnalysisChartProps) {
  const { results } = props;
  
  if (!results.stackExtensionAnalysis) return null;

  const data = results.stackExtensionAnalysis;
  const width = 500;
  const height = 300;
  const padding = { l: 60, r: 20, t: 20, b: 50 };

  const maxY = Math.max(...data.map(d => d.totalRadiantOutW));
  const minY = Math.min(...data.map(d => d.totalRadiantOutW));

  function xScale(extensionIn: number) {
    return padding.l + ((extensionIn - 1) / 5) * (width - padding.l - padding.r);
  }

  function yScale(watts: number) {
    return height - padding.b - ((watts - minY) / (maxY - minY)) * (height - padding.t - padding.b);
  }

  const pathData = data.map((d, i) => {
    const x = xScale(d.extensionIn);
    const y = yScale(d.totalRadiantOutW);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e9ecef',
      borderRadius: 12,
      padding: 16,
      marginTop: 16
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 600, color: '#212529' }}>
        📏 Stack Extension Impact Analysis
      </h4>
      
      <svg width={width} height={height} style={{ 
        border: '1px solid #e9ecef',
        borderRadius: 8,
        background: 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)'
      }}>
        {/* Axes */}
        <line x1={padding.l} y1={height - padding.b} x2={width - padding.r} y2={height - padding.b} stroke="#333" strokeWidth={1.5} />
        <line x1={padding.l} y1={padding.t} x2={padding.l} y2={height - padding.b} stroke="#333" strokeWidth={1.5} />

        {/* X-axis ticks and labels */}
        {data.map((d, i) => (
          <g key={i}>
            <line 
              x1={xScale(d.extensionIn)} 
              y1={height - padding.b} 
              x2={xScale(d.extensionIn)} 
              y2={height - padding.b + 5} 
              stroke="#333" 
              strokeWidth={1.5}
            />
            <text 
              x={xScale(d.extensionIn)} 
              y={height - padding.b + 18} 
              fontSize={11} 
              textAnchor="middle" 
              fill="#333"
            >
              {d.extensionIn}"
            </text>
          </g>
        ))}

        {/* Y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = minY + (maxY - minY) * ratio;
          const y = yScale(value);
          return (
            <g key={i}>
              <line x1={padding.l - 5} y1={y} x2={padding.l} y2={y} stroke="#333" strokeWidth={1.5} />
              <text x={padding.l - 10} y={y + 4} fontSize={11} textAnchor="end" fill="#333">
                {(value / 1000).toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => {
          const y = yScale(minY + (maxY - minY) * ratio);
          return (
            <line 
              key={i}
              x1={padding.l} 
              y1={y} 
              x2={width - padding.r} 
              y2={y} 
              stroke="#e9ecef" 
              strokeWidth={1}
            />
          );
        })}

        {/* Data line */}
        <path d={pathData} fill="none" stroke="#667eea" strokeWidth={3} />

        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle 
              cx={xScale(d.extensionIn)} 
              cy={yScale(d.totalRadiantOutW)} 
              r={5} 
              fill="white" 
              stroke="#667eea" 
              strokeWidth={2.5}
            />
            {/* Hover label */}
            <text
              x={xScale(d.extensionIn)}
              y={yScale(d.totalRadiantOutW) - 12}
              fontSize={10}
              textAnchor="middle"
              fill="#667eea"
              fontWeight={600}
            >
              {(d.totalRadiantOutW / 1000).toFixed(2)}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text 
          x={(padding.l + width - padding.r) / 2} 
          y={height - 10} 
          fontSize={12} 
          textAnchor="middle" 
          fill="#495057"
          fontWeight={600}
        >
          Stack Extension (inches)
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
          Total IR Output (kW)
        </text>
      </svg>

      <div style={{ marginTop: 12, fontSize: 12, color: '#6c757d' }}>
        <strong>Analysis:</strong> Each additional inch of vertical stack extension increases contact time between 
        hot exhaust gases and the emitter wall, capturing more heat before release. Diminishing returns occur 
        beyond 4-5 inches due to reduced gas temperature.
      </div>
    </div>
  );
}
