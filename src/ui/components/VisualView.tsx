import React from 'react';
import type { Config, Results } from '../../model/schema';

interface VisualViewProps {
  config: Config;
  results: Results;
}

export function VisualView(props: VisualViewProps) {
  const { config, results } = props;
  
  // Scale: 1 inch = 6 pixels for better utilization (increased from 4)
  const scale = 6;
  
  const inletRadiusPx = (config.inletDiameterIn / 2) * scale;
  const outletRadiusPx = (config.outletDiameterIn / 2) * scale;
  const heightPx = config.emitterHeightIn * scale;
  const stackExtensionPx = (config.stackExtensionIn || 0) * scale;
  const totalHeightPx = heightPx + stackExtensionPx;
  
  // Canvas dimensions - taller and better proportioned
  const canvasWidth = 1000;
  const canvasHeight = 700;
  const centerX = 280; // Shift left to make room for people
  const groundY = canvasHeight - 100;
  const emitterTopY = groundY - totalHeightPx;
  
  // Calculate distances for occupants (closer for better space utilization)
  const distance1Ft = config.distancesFromSurfaceFt[0] || 2;
  const distance2Ft = config.distancesFromSurfaceFt[2] || 4;
  
  // Person positions (in pixels from center) - adjusted for better spacing
  const person1X = centerX + (distance1Ft * 12 * scale * 0.7) + inletRadiusPx; // 0.7 factor brings them closer
  const person2X = centerX + (distance2Ft * 12 * scale * 0.6) + inletRadiusPx;

  return (
    <div style={{ 
      background: 'white',
      border: '1px solid #e9ecef',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{ 
        marginTop: 0,
        marginBottom: 16,
        fontSize: 18,
        fontWeight: 600,
        color: '#212529'
      }}>🔥 Visual Representation (Scale: 1" = {scale}px)</h3>

      <svg width={canvasWidth} height={canvasHeight} style={{ 
        border: '1px solid #e9ecef',
        borderRadius: 12,
        background: 'linear-gradient(to bottom, #87ceeb 0%, #e0f6ff 50%, #8b7355 100%)'
      }}>
        {/* Ground */}
        <rect x={0} y={groundY} width={canvasWidth} height={80} fill="#6b5544" />
        <line x1={0} y1={groundY} x2={canvasWidth} y2={groundY} stroke="#4a3f35" strokeWidth={2} />
        
        {/* Flame (below emitter) */}
        <g transform={`translate(${centerX}, ${groundY - 10})`}>
          <ellipse cx={0} cy={0} rx={20} ry={15} fill="#ff6b00" opacity={0.8} />
          <ellipse cx={0} cy={-10} rx={15} ry={12} fill="#ff8c00" opacity={0.9} />
          <ellipse cx={0} cy={-18} rx={10} ry={10} fill="#ffa500" />
          <ellipse cx={0} cy={-24} rx={6} ry={8} fill="#ffff00" opacity={0.7} />
        </g>

        {/* Emitter body (tapered cone from inlet to outlet) */}
        <defs>
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#b0b0b0', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#e8e8e8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#b0b0b0', stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="heatGradient">
            <stop offset="0%" style={{ stopColor: '#ff4500', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#ff0000', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        {/* Main emitter cone */}
        <path
          d={`
            M ${centerX - inletRadiusPx} ${groundY}
            L ${centerX - outletRadiusPx} ${groundY - heightPx}
            L ${centerX + outletRadiusPx} ${groundY - heightPx}
            L ${centerX + inletRadiusPx} ${groundY}
            Z
          `}
          fill="url(#metalGradient)"
          stroke="#808080"
          strokeWidth={2}
        />

        {/* Heat glow inside emitter */}
        <ellipse 
          cx={centerX} 
          cy={groundY - heightPx/2} 
          rx={inletRadiusPx * 0.6} 
          ry={heightPx * 0.4} 
          fill="url(#heatGradient)" 
        />

        {/* Stack extension (if present) */}
        {stackExtensionPx > 0 && (
          <>
            <rect
              x={centerX - outletRadiusPx}
              y={emitterTopY}
              width={outletRadiusPx * 2}
              height={stackExtensionPx}
              fill="url(#metalGradient)"
              stroke="#808080"
              strokeWidth={2}
            />
            {/* Extension label */}
            <text
              x={centerX + outletRadiusPx + 10}
              y={emitterTopY + stackExtensionPx/2}
              fontSize={11}
              fill="#667eea"
              fontWeight={600}
            >
              +{config.stackExtensionIn || 0}" stack
            </text>
          </>
        )}

        {/* Inlet/outlet ellipses */}
        <ellipse cx={centerX} cy={groundY} rx={inletRadiusPx} ry={inletRadiusPx * 0.3} fill="#a0a0a0" stroke="#808080" strokeWidth={2} />
        <ellipse cx={centerX} cy={emitterTopY} rx={outletRadiusPx} ry={outletRadiusPx * 0.3} fill="#c0c0c0" stroke="#808080" strokeWidth={2} />

        {/* Swirl indicators */}
        {[0.3, 0.5, 0.7].map((ratio, i) => {
          const y = groundY - heightPx * ratio;
          const r = inletRadiusPx - (inletRadiusPx - outletRadiusPx) * ratio;
          return (
            <g key={i}>
              <path
                d={`M ${centerX - r} ${y} Q ${centerX - r/2} ${y - 8}, ${centerX} ${y} Q ${centerX + r/2} ${y - 8}, ${centerX + r} ${y}`}
                fill="none"
                stroke="#667eea"
                strokeWidth={1.5}
                opacity={0.5}
                strokeDasharray="3,3"
              />
            </g>
          );
        })}

        {/* Rising hot gas/IR radiation waves */}
        {[0, 1, 2, 3].map((i) => {
          const y = emitterTopY - 20 - (i * 15);
          return (
            <path
              key={i}
              d={`M ${centerX - 30} ${y} Q ${centerX - 15} ${y - 8}, ${centerX} ${y} Q ${centerX + 15} ${y - 8}, ${centerX + 30} ${y}`}
              fill="none"
              stroke="#ff6b00"
              strokeWidth={2}
              opacity={0.4 - i * 0.08}
            />
          );
        })}

        {/* IR radiation lines to people */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#ff6b00" />
          </marker>
        </defs>
        
        <line 
          x1={centerX + outletRadiusPx} 
          y1={emitterTopY + 10} 
          x2={person1X - 15} 
          y2={groundY - 50} 
          stroke="#ff6b00" 
          strokeWidth={2}
          strokeDasharray="5,5"
          opacity={0.6}
          markerEnd="url(#arrowhead)"
        />
        <line 
          x1={centerX + outletRadiusPx} 
          y1={emitterTopY + 10} 
          x2={person2X - 15} 
          y2={groundY - 35} 
          stroke="#ff6b00" 
          strokeWidth={2}
          strokeDasharray="5,5"
          opacity={0.6}
          markerEnd="url(#arrowhead)"
        />

        {/* Standing person (closer) */}
        <g transform={`translate(${person1X}, ${groundY})`}>
          {/* Body */}
          <ellipse cx={0} cy={-25} rx={12} ry={25} fill="#4a90e2" stroke="#2c5aa0" strokeWidth={1.5} />
          {/* Head */}
          <circle cx={0} cy={-55} r={10} fill="#ffdbac" stroke="#2c5aa0" strokeWidth={1.5} />
          {/* Arms */}
          <line x1={-12} y1={-20} x2={-20} y2={-10} stroke="#4a90e2" strokeWidth={4} strokeLinecap="round" />
          <line x1={12} y1={-20} x2={20} y2={-10} stroke="#4a90e2" strokeWidth={4} strokeLinecap="round" />
          {/* Legs */}
          <line x1={-5} y1={0} x2={-8} y2={18} stroke="#2c5aa0" strokeWidth={4} strokeLinecap="round" />
          <line x1={5} y1={0} x2={8} y2={18} stroke="#2c5aa0" strokeWidth={4} strokeLinecap="round" />
          {/* Label */}
          <text x={0} y={32} fontSize={13} fill="#212529" textAnchor="middle" fontWeight={700}>
            Standing
          </text>
          <text x={0} y={46} fontSize={12} fill="#6c757d" textAnchor="middle">
            {distance1Ft.toFixed(1)} ft away
          </text>
          <text x={0} y={60} fontSize={12} fill="#667eea" textAnchor="middle" fontWeight={700}>
            {results.absorbedStandingW[0]?.toFixed(0) || 0} W absorbed
          </text>
        </g>

        {/* Seated person (farther) */}
        <g transform={`translate(${person2X}, ${groundY})`}>
          {/* Body (shorter) */}
          <ellipse cx={0} cy={-15} rx={13} ry={15} fill="#e24a4a" stroke="#a02c2c" strokeWidth={1.5} />
          {/* Head */}
          <circle cx={0} cy={-35} r={9} fill="#ffdbac" stroke="#a02c2c" strokeWidth={1.5} />
          {/* Arms */}
          <line x1={-13} y1={-12} x2={-22} y2={-5} stroke="#e24a4a" strokeWidth={4} strokeLinecap="round" />
          <line x1={13} y1={-12} x2={22} y2={-5} stroke="#e24a4a" strokeWidth={4} strokeLinecap="round" />
          {/* Legs (bent, seated) */}
          <path d="M -6 0 L -10 8 L -18 8" stroke="#a02c2c" strokeWidth={4} fill="none" strokeLinecap="round" />
          <path d="M 6 0 L 10 8 L 18 8" stroke="#a02c2c" strokeWidth={4} fill="none" strokeLinecap="round" />
          {/* Label */}
          <text x={0} y={24} fontSize={13} fill="#212529" textAnchor="middle" fontWeight={700}>
            Seated
          </text>
          <text x={0} y={38} fontSize={12} fill="#6c757d" textAnchor="middle">
            {distance2Ft.toFixed(1)} ft away
          </text>
          <text x={0} y={52} fontSize={12} fill="#667eea" textAnchor="middle" fontWeight={700}>
            {results.absorbedSeatedW[2]?.toFixed(0) || 0} W absorbed
          </text>
        </g>

        {/* Dimension annotations */}
        {/* Inlet diameter */}
        <g>
          <line x1={centerX - inletRadiusPx} y1={groundY + 25} x2={centerX + inletRadiusPx} y2={groundY + 25} stroke="#667eea" strokeWidth={1.5} />
          <line x1={centerX - inletRadiusPx} y1={groundY + 20} x2={centerX - inletRadiusPx} y2={groundY + 30} stroke="#667eea" strokeWidth={1.5} />
          <line x1={centerX + inletRadiusPx} y1={groundY + 20} x2={centerX + inletRadiusPx} y2={groundY + 30} stroke="#667eea" strokeWidth={1.5} />
          <text x={centerX} y={groundY + 42} fontSize={13} fill="#667eea" textAnchor="middle" fontWeight={700}>
            Inlet: {config.inletDiameterIn}" diameter
          </text>
        </g>

        {/* Outlet diameter */}
        <g>
          <line x1={centerX - outletRadiusPx - 35} y1={emitterTopY} x2={centerX - outletRadiusPx - 15} y2={emitterTopY} stroke="#667eea" strokeWidth={1.5} />
          <text x={centerX - outletRadiusPx - 45} y={emitterTopY + 5} fontSize={13} fill="#667eea" textAnchor="end" fontWeight={700}>
            Outlet: {config.outletDiameterIn}" diameter
          </text>
        </g>

        {/* Height */}
        <g>
          <line x1={centerX - inletRadiusPx - 25} y1={groundY} x2={centerX - inletRadiusPx - 25} y2={groundY - heightPx} stroke="#667eea" strokeWidth={1.5} />
          <line x1={centerX - inletRadiusPx - 30} y1={groundY} x2={centerX - inletRadiusPx - 20} y2={groundY} stroke="#667eea" strokeWidth={1.5} />
          <line x1={centerX - inletRadiusPx - 30} y1={groundY - heightPx} x2={centerX - inletRadiusPx - 20} y2={groundY - heightPx} stroke="#667eea" strokeWidth={1.5} />
          <text x={centerX - inletRadiusPx - 35} y={groundY - heightPx/2 + 5} fontSize={13} fill="#667eea" textAnchor="end" fontWeight={700}>
            Height: {config.emitterHeightIn}"
          </text>
        </g>

        {/* Power labels */}
        <g transform={`translate(30, 40)`}>
          <text x={0} y={0} fontSize={14} fill="#212529" fontWeight={700}>System Power:</text>
          <text x={0} y={22} fontSize={13} fill="#495057">Burner: {(results.burnerPowerW / 1000).toFixed(2)} kW</text>
          <text x={0} y={40} fontSize={13} fill="#495057">Wall captured: {(results.wallCapturedW / 1000).toFixed(2)} kW</text>
          <text x={0} y={58} fontSize={13} fill="#ff6b00" fontWeight={700}>IR out: {(results.radiantOutW / 1000).toFixed(2)} kW</text>
        </g>
      </svg>

      <div style={{ 
        marginTop: 16,
        padding: 12,
        background: '#f8f9fa',
        borderRadius: 8,
        fontSize: 12,
        color: '#6c757d'
      }}>
        <strong>💡 Visual Key:</strong> Orange waves = IR radiation | Blue swirls = gas flow | 
        Dashed arrows = radiant heat delivery | Ground level = burner base
      </div>
    </div>
  );
}
