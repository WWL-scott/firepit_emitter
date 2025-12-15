import React from 'react';
import type { Config, Results } from '../../model/schema';

interface VisualViewProps {
  config: Config;
  results: Results;
}

export function VisualView(props: VisualViewProps) {
  const { config, results } = props;

  // --- Scene scaling ---
  // Target: 6-ft (72") standing person with 1-ft (12") headroom.
  // Choose a deterministic scale so that:
  //   top of drawing (y=0) .. headroom .. person .. ground
  const canvasWidth = 1000;
  const canvasHeight = 600;
  const groundPaddingPx = 40;
  const personHeightIn = 72;
  const headroomIn = 12;
  const groundY = canvasHeight - groundPaddingPx;
  const scale = (groundY - 0) / (personHeightIn + headroomIn); // px per inch
  const marginX = 40;

  // --- Firepit + emitter geometry ---
  // User spec:
  // - Firepit housing: 4 ft round (48")
  // - Fire (burner/flame): ~12" off ground (at housing top)
  // - Emitter inlet: 12" above fire => 24" off ground
  const firepitDiameterIn = 48;
  const firepitRadiusPx = (firepitDiameterIn / 2) * scale;
  const firepitHeightIn = 12;
  const firepitHeightPx = firepitHeightIn * scale;
  const fireY = groundY - (12 * scale);
  const emitterInletY = groundY - (24 * scale);

  const emitterHeightPx = config.emitterHeightIn * scale;
  const stackExtensionPx = (config.stackExtensionIn || 0) * scale;
  const inletRadiusPx = (config.inletDiameterIn / 2) * scale;
  const outletRadiusPx = (config.outletDiameterIn / 2) * scale;
  const emitterConeTopY = emitterInletY - emitterHeightPx;
  const emitterTopY = emitterConeTopY - stackExtensionPx;

  // Occupant distances (from surface) in feet
  const distanceStandingFt = config.distancesFromSurfaceFt[0] || 2;
  const distanceSeatedFt = config.distancesFromSurfaceFt[2] || 4;

  const centerX = canvasWidth / 2;

  // Simple person sizing in inches (not fractions of height) so it stays realistic.
  const standingShoulderWidthPx = 18 * scale;
  const standingHalfWidthPx = Math.max(standingShoulderWidthPx, 24 * scale) / 2;
  const seatedHalfWidthPx = Math.max(16 * scale, 22 * scale) / 2;

  // Place one person on each side. Clamp so they stay visible.
  const desiredStandingX = centerX - firepitRadiusPx - (distanceStandingFt * 12 * scale) - standingHalfWidthPx;
  const desiredSeatedX = centerX + firepitRadiusPx + (distanceSeatedFt * 12 * scale) + seatedHalfWidthPx;
  const personStandingX = Math.max(marginX + standingHalfWidthPx, desiredStandingX);
  const personSeatedX = Math.min(canvasWidth - marginX - seatedHalfWidthPx, desiredSeatedX);

  function renderStandingPerson(x: number, yGround: number) {
    // Inches
    const headD = 9;
    const headR = (headD / 2) * scale;
    const neckH = 2 * scale;
    const torsoH = 26 * scale;
    const legH = 34 * scale;
    const torsoW = 16 * scale;
    const shoulderW = 18 * scale;
    const armL = 22 * scale;

    const yHeadCenter = yGround - (legH + torsoH + neckH + headR);
    const yShoulders = yGround - (legH + torsoH) + (2 * scale);
    const yTorsoCenter = yGround - (legH + torsoH / 2);
    const yHip = yGround - legH;

    return (
      <g transform={`translate(${x}, ${yGround})`}>
        {/* Legs */}
        <line x1={-4 * scale} y1={0} x2={-6 * scale} y2={-legH} stroke="#2c5aa0" strokeWidth={4 * scale} strokeLinecap="round" />
        <line x1={4 * scale} y1={0} x2={6 * scale} y2={-legH} stroke="#2c5aa0" strokeWidth={4 * scale} strokeLinecap="round" />

        {/* Torso */}
        <rect x={-torsoW / 2} y={-legH - torsoH} width={torsoW} height={torsoH} rx={6 * scale} fill="#4a90e2" stroke="#2c5aa0" strokeWidth={2} />

        {/* Arms */}
        <line x1={-shoulderW / 2} y1={-legH - torsoH + (4 * scale)} x2={-shoulderW / 2 - armL} y2={-legH - torsoH / 2} stroke="#4a90e2" strokeWidth={4 * scale} strokeLinecap="round" />
        <line x1={shoulderW / 2} y1={-legH - torsoH + (4 * scale)} x2={shoulderW / 2 + armL} y2={-legH - torsoH / 2} stroke="#4a90e2" strokeWidth={4 * scale} strokeLinecap="round" />

        {/* Head */}
        <circle cx={0} cy={-(legH + torsoH + neckH + headR)} r={headR} fill="#ffdbac" stroke="#2c5aa0" strokeWidth={2} />

        {/* Labels */}
        <text x={0} y={groundPaddingPx - 10} fontSize={11} fill="#212529" textAnchor="middle" fontWeight={600}>
          Standing (6 ft)
        </text>
        <text x={0} y={groundPaddingPx + 4} fontSize={10} fill="#6c757d" textAnchor="middle">
          {distanceStandingFt.toFixed(1)} ft away
        </text>
        <text x={0} y={groundPaddingPx + 18} fontSize={10} fill="#667eea" textAnchor="middle" fontWeight={700}>
          {results.absorbedStandingW[0]?.toFixed(0) || 0} W
        </text>

        {/* (invisible) anchor points for IR arrows */}
        <circle cx={0} cy={yTorsoCenter - yGround} r={0} opacity={0} />
        <circle cx={0} cy={yHeadCenter - yGround} r={0} opacity={0} />
        <circle cx={0} cy={yShoulders - yGround} r={0} opacity={0} />
        <circle cx={0} cy={yHip - yGround} r={0} opacity={0} />
      </g>
    );
  }

  function renderSeatedPerson(x: number, yGround: number) {
    // Inches
    const headD = 9;
    const headR = (headD / 2) * scale;
    const torsoH = 20 * scale;
    const torsoW = 16 * scale;
    const thighL = 16 * scale;
    const shinL = 14 * scale;
    const hipY = yGround - (12 * scale);
    const shoulderY = hipY - torsoH + (3 * scale);

    return (
      <g transform={`translate(${x}, ${yGround})`}>
        {/* Legs (bent downward; feet on ground) */}
        <path
          d={`M ${-3 * scale} ${-(12 * scale)} L ${-10 * scale} ${-(6 * scale)} L ${-10 * scale} 0`}
          stroke="#a02c2c"
          strokeWidth={4 * scale}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${3 * scale} ${-(12 * scale)} L ${10 * scale} ${-(6 * scale)} L ${10 * scale} 0`}
          stroke="#a02c2c"
          strokeWidth={4 * scale}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1={-14 * scale} y1={0} x2={-6 * scale} y2={0} stroke="#a02c2c" strokeWidth={4 * scale} strokeLinecap="round" />
        <line x1={6 * scale} y1={0} x2={14 * scale} y2={0} stroke="#a02c2c" strokeWidth={4 * scale} strokeLinecap="round" />

        {/* Torso */}
        <rect x={-torsoW / 2} y={-(12 * scale) - torsoH} width={torsoW} height={torsoH} rx={6 * scale} fill="#e24a4a" stroke="#a02c2c" strokeWidth={2} />

        {/* Arms */}
        <line x1={-torsoW / 2} y1={-(12 * scale) - torsoH + (5 * scale)} x2={-(torsoW / 2) - (14 * scale)} y2={-(12 * scale) - torsoH / 2} stroke="#e24a4a" strokeWidth={4 * scale} strokeLinecap="round" />
        <line x1={torsoW / 2} y1={-(12 * scale) - torsoH + (5 * scale)} x2={(torsoW / 2) + (14 * scale)} y2={-(12 * scale) - torsoH / 2} stroke="#e24a4a" strokeWidth={4 * scale} strokeLinecap="round" />

        {/* Head */}
        <circle cx={0} cy={-(12 * scale) - torsoH - (2 * scale) - headR} r={headR} fill="#ffdbac" stroke="#a02c2c" strokeWidth={2} />

        {/* Labels */}
        <text x={0} y={groundPaddingPx - 10} fontSize={11} fill="#212529" textAnchor="middle" fontWeight={600}>
          Seated
        </text>
        <text x={0} y={groundPaddingPx + 4} fontSize={10} fill="#6c757d" textAnchor="middle">
          {distanceSeatedFt.toFixed(1)} ft away
        </text>
        <text x={0} y={groundPaddingPx + 18} fontSize={10} fill="#667eea" textAnchor="middle" fontWeight={700}>
          {results.absorbedSeatedW[2]?.toFixed(0) || 0} W
        </text>

        {/* (invisible) anchor */}
        <circle cx={0} cy={(shoulderY - yGround)} r={0} opacity={0} />
        <circle cx={0} cy={(hipY - yGround)} r={0} opacity={0} />
      </g>
    );
  }

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
      }}>🔥 Visual Representation (6-ft scale, 1" = {scale.toFixed(1)}px)</h3>
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
        
        {/* Firepit housing (4-ft diameter cylinder) */}
        <ellipse
          cx={centerX}
          cy={groundY}
          rx={firepitRadiusPx}
          ry={firepitRadiusPx * 0.18}
          fill="#6b5544"
          opacity={0.55}
        />
        <rect
          x={centerX - firepitRadiusPx}
          y={groundY - firepitHeightPx}
          width={firepitRadiusPx * 2}
          height={firepitHeightPx}
          fill="url(#housingGradient)"
          stroke="#4a3f35"
          strokeWidth={2}
        />
        <ellipse
          cx={centerX}
          cy={groundY - firepitHeightPx}
          rx={firepitRadiusPx}
          ry={firepitRadiusPx * 0.18}
          fill="#a0826d"
          stroke="#4a3f35"
          strokeWidth={2}
        />
        
        {/* Burner + fire (12" above ground) */}
        <g transform={`translate(${centerX}, ${fireY})`}>
          <ellipse cx={0} cy={0} rx={18 * scale} ry={5 * scale} fill="#404040" stroke="#2a2a2a" strokeWidth={1.5} />
          <ellipse cx={0} cy={-(5 * scale)} rx={14 * scale} ry={11 * scale} fill="#ff6b00" opacity={0.85} />
          <ellipse cx={0} cy={-(12 * scale)} rx={10 * scale} ry={9 * scale} fill="#ff8c00" opacity={0.9} />
          <ellipse cx={0} cy={-(18 * scale)} rx={7 * scale} ry={7 * scale} fill="#ffa500" />
          <ellipse cx={0} cy={-(22 * scale)} rx={4 * scale} ry={6 * scale} fill="#ffff00" opacity={0.7} />
        </g>

        {/* Main emitter cone (inlet at 24" above ground) */}
        <path
          d={`
            M ${centerX - inletRadiusPx} ${emitterInletY}
            L ${centerX - outletRadiusPx} ${emitterConeTopY}
            L ${centerX + outletRadiusPx} ${emitterConeTopY}
            L ${centerX + inletRadiusPx} ${emitterInletY}
            Z
          `}
          fill="url(#metalGradient)"
          stroke="#808080"
          strokeWidth={2}
        />

        {/* Heat glow inside emitter */}
        <ellipse 
          cx={centerX} 
          cy={emitterInletY - emitterHeightPx/2} 
          rx={inletRadiusPx * 0.6} 
          ry={emitterHeightPx * 0.4} 
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
            {/* Stack top ellipse (true outlet when stack exists) */}
            <ellipse
              cx={centerX}
              cy={emitterTopY}
              rx={outletRadiusPx}
              ry={outletRadiusPx * 0.22}
              fill="#c0c0c0"
              stroke="#808080"
              strokeWidth={2}
            />
            {/* Extension label */}
            <text
              x={centerX + outletRadiusPx + 10}
              y={emitterTopY + stackExtensionPx / 2}
              fontSize={11}
              fill="#667eea"
              fontWeight={600}
            >
              +{config.stackExtensionIn || 0}" stack
            </text>
          </>
        )}

        {/* Inlet / cone-top seam / outlet ellipses */}
        <ellipse cx={centerX} cy={emitterInletY} rx={inletRadiusPx} ry={inletRadiusPx * 0.22} fill="#a0a0a0" stroke="#808080" strokeWidth={2} />
        <ellipse cx={centerX} cy={emitterConeTopY} rx={outletRadiusPx} ry={outletRadiusPx * 0.22} fill="#bdbdbd" stroke="#808080" strokeWidth={2} />
        {stackExtensionPx === 0 && (
          <ellipse cx={centerX} cy={emitterConeTopY} rx={outletRadiusPx} ry={outletRadiusPx * 0.22} fill="#c0c0c0" stroke="#808080" strokeWidth={2} />
        )}

        {/* Swirl indicators */}
        {[0.3, 0.5, 0.7].map((ratio, i) => {
          const y = emitterInletY - emitterHeightPx * ratio;
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
          const y = emitterTopY - (10 * scale) - (i * 10 * scale);
          return (
            <path
              key={i}
              d={`M ${centerX - (22 * scale)} ${y} Q ${centerX - (10 * scale)} ${y - (5 * scale)}, ${centerX} ${y} Q ${centerX + (10 * scale)} ${y - (5 * scale)}, ${centerX + (22 * scale)} ${y}`}
              fill="none"
              stroke="#ff6b00"
              strokeWidth={2}
              opacity={0.4 - i * 0.08}
            />
          );
        })}

        {/* IR radiation lines to people (both sides) */}
        {(() => {
          const outletY = stackExtensionPx > 0 ? emitterTopY : emitterConeTopY;
          const outletEmitY = outletY + (6 * scale);
          return (
            <>
        <line 
          x1={centerX - outletRadiusPx} 
          y1={outletEmitY} 
          x2={personStandingX + standingHalfWidthPx} 
          y2={groundY - (36 * scale)} 
          stroke="#ff6b00" 
          strokeWidth={2}
          strokeDasharray="5,5"
          opacity={0.6}
          markerEnd="url(#arrowhead)"
        />
        <line 
          x1={centerX + outletRadiusPx} 
          y1={outletEmitY} 
          x2={personSeatedX - seatedHalfWidthPx} 
          y2={groundY - (24 * scale)} 
          stroke="#ff6b00" 
          strokeWidth={2}
          strokeDasharray="5,5"
          opacity={0.6}
          markerEnd="url(#arrowhead)"
        />
            </>
          );
        })()}

        {renderStandingPerson(personStandingX, groundY)}
        {renderSeatedPerson(personSeatedX, groundY)}

        {/* Dimension annotations */}
        {/* Quick labels */}
        <g>
          <text x={centerX} y={groundY + 22} fontSize={10} fill="#6b5544" textAnchor="middle" fontWeight={600}>
            4-ft Housing
          </text>
          <text
            x={centerX + outletRadiusPx + 10}
            y={(stackExtensionPx > 0 ? emitterTopY : emitterConeTopY) + 6}
            fontSize={9}
            fill="#667eea"
            textAnchor="start"
            fontWeight={600}
          >
            Outlet: {config.outletDiameterIn}"
          </text>
          <text x={centerX + inletRadiusPx + 10} y={emitterInletY + 6} fontSize={9} fill="#667eea" textAnchor="start" fontWeight={600}>
            Inlet: {config.inletDiameterIn}"
          </text>
        </g>

        {/* Height markers */}
        <g>
          <line x1={centerX - firepitRadiusPx - 18} y1={groundY} x2={centerX - firepitRadiusPx - 18} y2={fireY} stroke="#ff6b00" strokeWidth={1.5} />
          <text x={centerX - firepitRadiusPx - 22} y={(groundY + fireY) / 2 + 4} fontSize={9} fill="#ff6b00" textAnchor="end" fontWeight={600}>12"</text>

          <line x1={centerX - firepitRadiusPx - 18} y1={fireY} x2={centerX - firepitRadiusPx - 18} y2={emitterInletY} stroke="#667eea" strokeWidth={1.5} />
          <text x={centerX - firepitRadiusPx - 22} y={(fireY + emitterInletY) / 2 + 4} fontSize={9} fill="#667eea" textAnchor="end" fontWeight={600}>12"</text>

          <line x1={centerX - firepitRadiusPx - 18} y1={emitterInletY} x2={centerX - firepitRadiusPx - 18} y2={emitterConeTopY} stroke="#667eea" strokeWidth={1.5} />
          <text x={centerX - firepitRadiusPx - 22} y={(emitterInletY + emitterConeTopY) / 2 + 4} fontSize={9} fill="#667eea" textAnchor="end" fontWeight={600}>{config.emitterHeightIn}"</text>
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
