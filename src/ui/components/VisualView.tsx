import React from 'react';
import type { Config, Results } from '../../model/schema';

interface VisualViewProps {
  config: Config;
  results: Results;
}

export function VisualView(props: VisualViewProps) {
  const { config, results } = props;
  
  // Scale: 1 inch = 4 pixels (optimized for full system view)
  const scale = 4;
  
  const inletRadiusPx = (config.inletDiameterIn / 2) * scale;
  const outletRadiusPx = (config.outletDiameterIn / 2) * scale;
  const heightPx = config.emitterHeightIn * scale;
  const stackExtensionPx = (config.stackExtensionIn || 0) * scale;
  const totalHeightPx = heightPx + stackExtensionPx;
  
  // Firepit housing dimensions
  const firepitHousingDiameter = 48; // 4 feet = 48 inches
  const firepitHousingRadiusPx = (firepitHousingDiameter / 2) * scale;
  const firepitHousingHeightPx = 12 * scale; // 12 inches off ground
  const burnerHeightPx = 12 * scale; // Fire at 12" above housing base
  const emitterBaseHeightPx = firepitHousingHeightPx + burnerHeightPx; // 24" total
  
  // Canvas dimensions - optimized to show full system
  const canvasWidth = 1000;
  const canvasHeight = 550; // Reduced height, no wasted space
  const centerX = 200; // Firepit on left side
  const groundY = canvasHeight - 50; // Less ground space
  const firepitBaseY = groundY - firepitHousingHeightPx;
  const emitterBaseY = groundY - emitterBaseHeightPx;
  const emitterTopY = emitterBaseY - totalHeightPx;
  
  // Calculate distances for occupants
  const distance1Ft = config.distancesFromSurfaceFt[0] || 2;
  const distance2Ft = config.distancesFromSurfaceFt[2] || 4;
  
  // Person positions (in pixels from center) - measured from firepit edge
  const person1X = centerX + firepitHousingRadiusPx + (distance1Ft * 12 * scale);
  const person2X = centerX + firepitHousingRadiusPx + (distance2Ft * 12 * scale);

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
        background: 'linear-gradient(to bottom, #87ceeb 0%, #b8dce8 100%)'
      }}>
        {/* Ground */}
        <rect x={0} y={groundY} width={canvasWidth} height={50} fill="#6b5544" />
        <line x1={0} y1={groundY} x2={canvasWidth} y2={groundY} stroke="#4a3f35" strokeWidth={2} />
        
        {/* Firepit housing (4 foot diameter round enclosure) */}
        <defs>
          <linearGradient id="housingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8b7355', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#a0826d', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6b5544', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Firepit housing cylinder */}
        <ellipse 
          cx={centerX} 
          cy={firepitBaseY} 
          rx={firepitHousingRadiusPx} 
          ry={firepitHousingRadiusPx * 0.25} 
          fill="#6b5544" 
          stroke="#4a3f35" 
          strokeWidth={2}
        />
        <rect 
          x={centerX - firepitHousingRadiusPx} 
          y={firepitBaseY} 
          width={firepitHousingRadiusPx * 2} 
          height={firepitHousingHeightPx}
          fill="url(#housingGradient)"
          stroke="#4a3f35"
          strokeWidth={2}
        />
        <ellipse 
          cx={centerX} 
          cy={groundY} 
          rx={firepitHousingRadiusPx} 
          ry={firepitHousingRadiusPx * 0.25} 
          fill="#8b7355" 
          stroke="#4a3f35" 
          strokeWidth={2}
        />
        
        {/* Burner and flame (at 12" above housing, centered) */}
        <g transform={`translate(${centerX}, ${emitterBaseY})`}>
          {/* Burner ring */}
          <ellipse cx={0} cy={0} rx={24} ry={8} fill="#404040" stroke="#2a2a2a" strokeWidth={1.5} />
          {/* Flame */}
          <ellipse cx={0} cy={-8} rx={22} ry={18} fill="#ff6b00" opacity={0.8} />
          <ellipse cx={0} cy={-18} rx={16} ry={14} fill="#ff8c00" opacity={0.9} />
          <ellipse cx={0} cy={-26} rx={12} ry={12} fill="#ffa500" />
          <ellipse cx={0} cy={-34} rx={8} ry={10} fill="#ffff00" opacity={0.7} />
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

        {/* Main emitter cone (starts at 24" above ground) */}
        <path
          d={`
            M ${centerX - inletRadiusPx} ${emitterBaseY}
            L ${centerX - outletRadiusPx} ${emitterTopY}
            L ${centerX + outletRadiusPx} ${emitterTopY}
            L ${centerX + inletRadiusPx} ${emitterBaseY}
            Z
          `}
          fill="url(#metalGradient)"
          stroke="#808080"
          strokeWidth={2}
        />

        {/* Heat glow inside emitter */}
        <ellipse 
          cx={centerX} 
          cy={emitterBaseY - heightPx/2} 
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
        <ellipse cx={centerX} cy={emitterBaseY} rx={inletRadiusPx} ry={inletRadiusPx * 0.3} fill="#a0a0a0" stroke="#808080" strokeWidth={2} />
        <ellipse cx={centerX} cy={emitterTopY} rx={outletRadiusPx} ry={outletRadiusPx * 0.3} fill="#c0c0c0" stroke="#808080" strokeWidth={2} />

        {/* Swirl indicators */}
        {[0.3, 0.5, 0.7].map((ratio, i) => {
          const y = emitterBaseY - heightPx * ratio;
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
        {/* Firepit housing diameter */}
        <g>
          <line x1={centerX - firepitHousingRadiusPx} y1={groundY + 15} x2={centerX + firepitHousingRadiusPx} y2={groundY + 15} stroke="#8b7355" strokeWidth={1.5} />
          <line x1={centerX - firepitHousingRadiusPx} y1={groundY + 10} x2={centerX - firepitHousingRadiusPx} y2={groundY + 20} stroke="#8b7355" strokeWidth={1.5} />
          <line x1={centerX + firepitHousingRadiusPx} y1={groundY + 10} x2={centerX + firepitHousingRadiusPx} y2={groundY + 20} stroke="#8b7355" strokeWidth={1.5} />
          <text x={centerX} y={groundY + 30} fontSize={11} fill="#6b5544" textAnchor="middle" fontWeight={600}>
            Housing: 48" (4 ft)
          </text>
        </g>

        {/* Emitter inlet diameter */}
        <g>
          <line x1={centerX - inletRadiusPx} y1={emitterBaseY - 8} x2={centerX + inletRadiusPx} y2={emitterBaseY - 8} stroke="#667eea" strokeWidth={1.5} />
          <text x={centerX} y={emitterBaseY - 12} fontSize={11} fill="#667eea" textAnchor="middle" fontWeight={600}>
            Inlet: {config.inletDiameterIn}"
          </text>
        </g>

        {/* Outlet diameter */}
        <g>
          <line x1={centerX - outletRadiusPx - 35} y1={emitterTopY} x2={centerX - outletRadiusPx - 15} y2={emitterTopY} stroke="#667eea" strokeWidth={1.5} />
          <text x={centerX - outletRadiusPx - 45} y={emitterTopY + 5} fontSize={11} fill="#667eea" textAnchor="end" fontWeight={600}>
            Outlet: {config.outletDiameterIn}"
          </text>
        </g>

        {/* Height measurements on left side */}
        <g>
          {/* Ground to housing base: 12" */}
          <line x1={30} y1={groundY} x2={30} y2={firepitBaseY} stroke="#999" strokeWidth={1} strokeDasharray="2,2" />
          <text x={35} y={(groundY + firepitBaseY)/2 + 4} fontSize={10} fill="#6c757d">12"</text>
          
          {/* Housing base to fire: 12" */}
          <line x1={30} y1={firepitBaseY} x2={30} y2={emitterBaseY} stroke="#ff6b00" strokeWidth={1.5} />
          <text x={35} y={(firepitBaseY + emitterBaseY)/2 + 4} fontSize={10} fill="#ff6b00" fontWeight={600}>12"</text>
          
          {/* Emitter height */}
          <line x1={30} y1={emitterBaseY} x2={30} y2={emitterTopY} stroke="#667eea" strokeWidth={1.5} />
          <text x={35} y={(emitterBaseY + emitterTopY)/2 + 4} fontSize={10} fill="#667eea" fontWeight={600}>{config.emitterHeightIn}"</text>
        </g>

        {/* Power labels */}
        <g transform={`translate(${canvasWidth - 180}, 30)`}>
          <text x={0} y={0} fontSize={13} fill="#212529" fontWeight={700}>System Power:</text>
          <text x={0} y={20} fontSize={11} fill="#495057">Burner: {(results.burnerPowerW / 1000).toFixed(2)} kW</text>
          <text x={0} y={36} fontSize={11} fill="#495057">Wall: {(results.wallCapturedW / 1000).toFixed(2)} kW</text>
          <text x={0} y={52} fontSize={11} fill="#ff6b00" fontWeight={700}>IR out: {(results.radiantOutW / 1000).toFixed(2)} kW</text>
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
        <strong>💡 System Layout:</strong> 4-ft firepit housing (brown) at ground level → Burner and fire at 12" → 
        Emitter inlet at 24" (12" above fire) → Tapered emitter captures rising heat → 
        IR radiation delivered to occupants
      </div>
    </div>
  );
}
