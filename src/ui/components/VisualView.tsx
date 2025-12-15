import React from 'react';
import type { Config, Results } from '../../model/schema';

interface VisualViewProps {
  config: Config;
  results: Results;
}

export function VisualView(props: VisualViewProps) {
  const { config, results } = props;
  
  // Scale everything based on 6-foot (72 inch) tall standing person
  // Person height = 72", canvas needs person + 12" (1 ft) headroom
  const personHeightIn = 72; // 6 feet
  const headroomIn = 12; // 1 foot above person
  const canvasHeight = 600;
  const groundPaddingPx = 40; // Small ground area
  const availableHeightPx = canvasHeight - groundPaddingPx - headroomIn;
  
  // Calculate scale: pixels per inch based on person height
  const scale = (canvasHeight - groundPaddingPx - (headroomIn * 72 / personHeightIn)) / personHeightIn;
  
  const inletRadiusPx = (config.inletDiameterIn / 2) * scale;
  const outletRadiusPx = (config.outletDiameterIn / 2) * scale;
  const heightPx = config.emitterHeightIn * scale;
  const stackExtensionPx = (config.stackExtensionIn || 0) * scale;
  const totalEmitterHeightPx = heightPx + stackExtensionPx;
  
  // Firepit housing dimensions
  const firepitHousingDiameter = 48; // 4 feet = 48 inches
  const firepitHousingRadiusPx = (firepitHousingDiameter / 2) * scale;
  const firepitHousingHeightPx = 12 * scale; // 12 inches off ground
  const burnerHeightPx = 12 * scale; // Fire at 12" above housing base
  const emitterBaseHeightPx = firepitHousingHeightPx + burnerHeightPx; // 24" total
  
  // Person dimensions
  const personHeightPx = personHeightIn * scale;
  const seatedHeightIn = 43; // Seated person ~43" tall
  const seatedHeightPx = seatedHeightIn * scale;
  
  // Canvas dimensions - centered firepit
  const canvasWidth = 1000;
  const centerX = canvasWidth / 2; // Center the firepit
  const groundY = canvasHeight - groundPaddingPx;
  const emitterBaseY = groundY - emitterBaseHeightPx;
  const emitterTopY = emitterBaseY - totalEmitterHeightPx;
  
  // Calculate distances for occupants
  const distance1Ft = config.distancesFromSurfaceFt[0] || 2;
  const distance2Ft = config.distancesFromSurfaceFt[2] || 4;
  
  // Person positions - one on each side
  const person1X = centerX - firepitHousingRadiusPx - (distance1Ft * 12 * scale); // Left side (standing)
  const person2X = centerX + firepitHousingRadiusPx + (distance2Ft * 12 * scale); // Right side (seated)

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
      }}>🔥 Visual Representation (6-ft person scale, 1" = {scale.toFixed(1)}px)</h3>

      <svg width={canvasWidth} height={canvasHeight} style={{ 
        border: '1px solid #e9ecef',
        borderRadius: 12,
        background: 'linear-gradient(to bottom, #87ceeb 0%, #b8dce8 100%)'
      }}>
        <defs>
          <linearGradient id="housingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8b7355', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#a0826d', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#6b5544', stopOpacity: 1 }} />
          </linearGradient>
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#b0b0b0', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#e8e8e8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#b0b0b0', stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="heatGradient">
            <stop offset="0%" style={{ stopColor: '#ff4500', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#ff0000', stopOpacity: 0 }} />
          </radialGradient>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#ff6b00" />
          </marker>
        </defs>

        {/* Ground */}
        <rect x={0} y={groundY} width={canvasWidth} height={groundPaddingPx} fill="#8b7355" />
        <line x1={0} y1={groundY} x2={canvasWidth} y2={groundY} stroke="#4a3f35" strokeWidth={2} />
        
        {/* Firepit housing (4 foot diameter, perfectly vertical cylinder) */}
        <rect 
          x={centerX - firepitHousingRadiusPx} 
          y={groundY - firepitHousingHeightPx} 
          width={firepitHousingRadiusPx * 2} 
          height={firepitHousingHeightPx}
          fill="url(#housingGradient)"
          stroke="#4a3f35"
          strokeWidth={2}
        />
        <ellipse 
          cx={centerX} 
          cy={groundY - firepitHousingHeightPx} 
          rx={firepitHousingRadiusPx} 
          ry={firepitHousingRadiusPx * 0.2} 
          fill="#a0826d" 
          stroke="#4a3f35" 
          strokeWidth={2}
        />
        
        {/* Burner and flame (at 12" above housing base, centered) */}
        <g transform={`translate(${centerX}, ${emitterBaseY})`}>
          {/* Burner ring */}
          <ellipse cx={0} cy={0} rx={20} ry={6} fill="#404040" stroke="#2a2a2a" strokeWidth={1.5} />
          {/* Flame */}
          <ellipse cx={0} cy={-6} rx={18} ry={14} fill="#ff6b00" opacity={0.8} />
          <ellipse cx={0} cy={-14} rx={14} ry={12} fill="#ff8c00" opacity={0.9} />
          <ellipse cx={0} cy={-22} rx={10} ry={10} fill="#ffa500" />
          <ellipse cx={0} cy={-28} rx={6} ry={8} fill="#ffff00" opacity={0.7} />
        </g>

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
          const y = emitterTopY - 15 - (i * 12);
          return (
            <path
              key={i}
              d={`M ${centerX - 25} ${y} Q ${centerX - 12} ${y - 6}, ${centerX} ${y} Q ${centerX + 12} ${y - 6}, ${centerX + 25} ${y}`}
              fill="none"
              stroke="#ff6b00"
              strokeWidth={2}
              opacity={0.4 - i * 0.08}
            />
          );
        })}

        {/* IR radiation lines to people (both sides) */}
        <line 
          x1={centerX - outletRadiusPx} 
          y1={emitterTopY + heightPx/2} 
          x2={person1X + 15} 
          y2={groundY - personHeightPx/2} 
          stroke="#ff6b00" 
          strokeWidth={2}
          strokeDasharray="5,5"
          opacity={0.6}
          markerEnd="url(#arrowhead)"
        />
        <line 
          x1={centerX + outletRadiusPx} 
          y1={emitterTopY + heightPx/2} 
          x2={person2X - 15} 
          y2={groundY - seatedHeightPx/2} 
          stroke="#ff6b00" 
          strokeWidth={2}
          strokeDasharray="5,5"
          opacity={0.6}
          markerEnd="url(#arrowhead)"
        />

        {/* Standing person (LEFT side, 6 feet tall) */}
        <g transform={`translate(${person1X}, ${groundY})`}>
          {/* Legs */}
          <line x1={-5} y1={0} x2={-8} y2={personHeightPx * 0.45} stroke="#2c5aa0" strokeWidth={personHeightPx * 0.06} strokeLinecap="round" />
          <line x1={5} y1={0} x2={8} y2={personHeightPx * 0.45} stroke="#2c5aa0" strokeWidth={personHeightPx * 0.06} strokeLinecap="round" />
          {/* Body */}
          <ellipse cx={0} cy={-personHeightPx * 0.37} rx={personHeightPx * 0.12} ry={personHeightPx * 0.28} fill="#4a90e2" stroke="#2c5aa0" strokeWidth={2} />
          {/* Arms */}
          <line x1={-personHeightPx * 0.12} y1={-personHeightPx * 0.35} x2={-personHeightPx * 0.20} y2={-personHeightPx * 0.25} stroke="#4a90e2" strokeWidth={personHeightPx * 0.06} strokeLinecap="round" />
          <line x1={personHeightPx * 0.12} y1={-personHeightPx * 0.35} x2={personHeightPx * 0.20} y2={-personHeightPx * 0.25} stroke="#4a90e2" strokeWidth={personHeightPx * 0.06} strokeLinecap="round" />
          {/* Head */}
          <circle cx={0} cy={-personHeightPx * 0.86} r={personHeightPx * 0.10} fill="#ffdbac" stroke="#2c5aa0" strokeWidth={2} />
          {/* Label */}
          <text x={0} y={groundPaddingPx - 8} fontSize={11} fill="#212529" textAnchor="middle" fontWeight={600}>
            Standing (6 ft)
          </text>
          <text x={0} y={groundPaddingPx + 5} fontSize={10} fill="#6c757d" textAnchor="middle">
            {distance1Ft.toFixed(1)} ft away
          </text>
          <text x={0} y={groundPaddingPx + 18} fontSize={10} fill="#667eea" textAnchor="middle" fontWeight={700}>
            {results.absorbedStandingW[0]?.toFixed(0) || 0} W
          </text>
        </g>

        {/* Seated person (RIGHT side, ~43" tall) */}
        <g transform={`translate(${person2X}, ${groundY})`}>
          {/* Legs (bent, seated) */}
          <path d={`M ${-seatedHeightPx * 0.12} 0 L ${-seatedHeightPx * 0.18} ${seatedHeightPx * 0.15} L ${-seatedHeightPx * 0.32} ${seatedHeightPx * 0.15}`} stroke="#a02c2c" strokeWidth={seatedHeightPx * 0.09} fill="none" strokeLinecap="round" />
          <path d={`M ${seatedHeightPx * 0.12} 0 L ${seatedHeightPx * 0.18} ${seatedHeightPx * 0.15} L ${seatedHeightPx * 0.32} ${seatedHeightPx * 0.15}`} stroke="#a02c2c" strokeWidth={seatedHeightPx * 0.09} fill="none" strokeLinecap="round" />
          {/* Body (shorter) */}
          <ellipse cx={0} cy={-seatedHeightPx * 0.35} rx={seatedHeightPx * 0.15} ry={seatedHeightPx * 0.28} fill="#e24a4a" stroke="#a02c2c" strokeWidth={2} />
          {/* Arms */}
          <line x1={-seatedHeightPx * 0.15} y1={-seatedHeightPx * 0.32} x2={-seatedHeightPx * 0.28} y2={-seatedHeightPx * 0.20} stroke="#e24a4a" strokeWidth={seatedHeightPx * 0.08} strokeLinecap="round" />
          <line x1={seatedHeightPx * 0.15} y1={-seatedHeightPx * 0.32} x2={seatedHeightPx * 0.28} y2={-seatedHeightPx * 0.20} stroke="#e24a4a" strokeWidth={seatedHeightPx * 0.08} strokeLinecap="round" />
          {/* Head */}
          <circle cx={0} cy={-seatedHeightPx * 0.84} r={seatedHeightPx * 0.12} fill="#ffdbac" stroke="#a02c2c" strokeWidth={2} />
          {/* Label */}
          <text x={0} y={groundPaddingPx - 8} fontSize={11} fill="#212529" textAnchor="middle" fontWeight={600}>
            Seated
          </text>
          <text x={0} y={groundPaddingPx + 5} fontSize={10} fill="#6c757d" textAnchor="middle">
            {distance2Ft.toFixed(1)} ft away
          </text>
          <text x={0} y={groundPaddingPx + 18} fontSize={10} fill="#667eea" textAnchor="middle" fontWeight={700}>
            {results.absorbedSeatedW[2]?.toFixed(0) || 0} W
          </text>
        </g>

        {/* Dimension annotations */}
        {/* Firepit housing width */}
        <g>
          <text x={centerX} y={groundY + 22} fontSize={10} fill="#6b5544" textAnchor="middle" fontWeight={600}>
            4-ft Housing
          </text>
        </g>

        {/* Emitter dimensions */}
        <g>
          <text x={centerX + outletRadiusPx + 10} y={emitterTopY + 8} fontSize={9} fill="#667eea" textAnchor="start" fontWeight={600}>
            Outlet: {config.outletDiameterIn}"
          </text>
          <text x={centerX + inletRadiusPx + 10} y={emitterBaseY + 8} fontSize={9} fill="#667eea" textAnchor="start" fontWeight={600}>
            Inlet: {config.inletDiameterIn}"
          </text>
        </g>

        {/* Height measurements on left side */}
        <g>
          {/* Housing height: 12" */}
          <line x1={centerX - firepitHousingRadiusPx - 15} y1={groundY} x2={centerX - firepitHousingRadiusPx - 15} y2={groundY - firepitHousingHeightPx} stroke="#8b7355" strokeWidth={1.5} />
          <text x={centerX - firepitHousingRadiusPx - 20} y={(groundY + (groundY - firepitHousingHeightPx))/2 + 4} fontSize={9} fill="#6b5544" textAnchor="end" fontWeight={600}>12"</text>
          
          {/* Fire to emitter base: 12" */}
          <line x1={centerX - firepitHousingRadiusPx - 15} y1={groundY - firepitHousingHeightPx} x2={centerX - firepitHousingRadiusPx - 15} y2={emitterBaseY} stroke="#ff6b00" strokeWidth={1.5} />
          <text x={centerX - firepitHousingRadiusPx - 20} y={((groundY - firepitHousingHeightPx) + emitterBaseY)/2 + 4} fontSize={9} fill="#ff6b00" textAnchor="end" fontWeight={600}>12"</text>
          
          {/* Emitter height */}
          <line x1={centerX - firepitHousingRadiusPx - 15} y1={emitterBaseY} x2={centerX - firepitHousingRadiusPx - 15} y2={emitterTopY} stroke="#667eea" strokeWidth={1.5} />
          <text x={centerX - firepitHousingRadiusPx - 20} y={(emitterBaseY + emitterTopY)/2 + 4} fontSize={9} fill="#667eea" textAnchor="end" fontWeight={600}>{config.emitterHeightIn}"</text>
        </g>

        {/* Power labels */}
        <g transform={`translate(20, 20)`}>
          <text x={0} y={0} fontSize={12} fill="#212529" fontWeight={700}>System Power:</text>
          <text x={0} y={18} fontSize={10} fill="#495057">Burner: {(results.burnerPowerW / 1000).toFixed(2)} kW</text>
          <text x={0} y={33} fontSize={10} fill="#495057">Wall: {(results.wallCapturedW / 1000).toFixed(2)} kW</text>
          <text x={0} y={48} fontSize={10} fill="#ff6b00" fontWeight={700}>IR out: {(results.radiantOutW / 1000).toFixed(2)} kW</text>
        </g>
      </svg>

      <div style={{ 
        marginTop: 16,
        padding: 12,
        background: '#f8f9fa',
        borderRadius: 8,
        fontSize: 11,
        color: '#6c757d'
      }}>
        <strong>💡 Scale Reference:</strong> Standing person = 6 feet (72") tall. 
        4-ft firepit housing (brown) → Fire at 12" above housing → Emitter inlet at 24" from ground → 
        Tapered emitter captures rising heat → IR radiation (dashed arrows) delivered to occupants on both sides.
      </div>
    </div>
  );
}
