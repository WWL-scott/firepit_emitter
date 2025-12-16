import React from 'react';

type EmitterDims = {
  inletDiameterIn: number;
  heightIn: number;
  outletDiameterIn: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function frustumWallAtY(
  inletR: number,
  outletR: number,
  height: number,
  yFromBottom: number
): number {
  const t = clamp(yFromBottom / Math.max(height, 1e-6), 0, 1);
  return inletR + (outletR - inletR) * t;
}

export function EmitterRenderings() {
  const dims: EmitterDims = {
    inletDiameterIn: 24,
    heightIn: 12,
    outletDiameterIn: 3,
  };

  const inletRIn = dims.inletDiameterIn / 2;
  const outletRIn = dims.outletDiameterIn / 2;
  const heightIn = dims.heightIn;

  const wallThicknessIn = 0.125; // used only for the cutaway rendering

  const pxPerIn = 10;

  const viewW = 520;
  const viewH = 340;
  const pad = 28;

  const cx = viewW / 2;
  const groundY = viewH - pad;

  const inletR = inletRIn * pxPerIn;
  const outletR = outletRIn * pxPerIn;
  const heightPx = heightIn * pxPerIn;

  const topY = groundY - heightPx;

  // Matte black needs exaggerated value range to read well against a white UI.
  // Keep it neutral (no new colors), but increase contrast for edges/features.
  const matteFill = '#1a1a1a';
  const matteEdge = '#050505';
  const highlight = '#3a3a3a';
  const rimHighlight = '#585858';
  const cavityDark = '#050505';
  const cutFace = '#4f4f4f';
  const cutFaceLite = '#6a6a6a';
  // Anything that is NOT the outside should read as polished stainless.
  // Use bright, high-contrast grays (no new hues) to make openings obvious.
  const polishedLite = '#f6f6f6';
  const polishedMid = '#c9c9c9';
  const polishedDark = '#7a7a7a';
  const polishedEdge = '#3a3a3a';

  const conePath = `
    M ${cx - inletR} ${groundY}
    L ${cx - outletR} ${topY}
    L ${cx + outletR} ${topY}
    L ${cx + inletR} ${groundY}
    Z
  `;

  function SidePerspective() {
    const ryInlet = inletR * 0.18;
    const ryOutlet = Math.max(2, outletR * 0.55);
    const wallPx = Math.max(3, wallThicknessIn * pxPerIn);
    const openingRx = Math.max(0, inletR - wallPx * 2.5);
    const openingRy = Math.max(0, ryInlet - wallPx * 1.25);

    return (
      <svg
        width={viewW}
        height={viewH}
        viewBox={`0 0 ${viewW} ${viewH}`}
        style={{
          border: '1px solid #e9ecef',
          borderRadius: 12,
          background: 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)',
        }}
      >
        <defs>
          <linearGradient id="matteBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={matteEdge} />
            <stop offset="28%" stopColor={matteFill} />
            <stop offset="55%" stopColor={highlight} />
            <stop offset="78%" stopColor={matteFill} />
            <stop offset="100%" stopColor={matteEdge} />
          </linearGradient>
          <linearGradient id="matteLip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#020202" />
            <stop offset="55%" stopColor="#2f2f2f" />
            <stop offset="100%" stopColor="#020202" />
          </linearGradient>
          <linearGradient id="rimBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={rimHighlight} stopOpacity={0.55} />
            <stop offset="60%" stopColor="#000" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
          </linearGradient>

          {/* Polished stainless interior */}
          <radialGradient id="polishedHole" cx="38%" cy="32%" r="90%">
            <stop offset="0%" stopColor={polishedLite} stopOpacity={0.95} />
            <stop offset="28%" stopColor={polishedMid} stopOpacity={0.95} />
            <stop offset="60%" stopColor={polishedDark} stopOpacity={0.95} />
            <stop offset="100%" stopColor={polishedEdge} stopOpacity={1} />
          </radialGradient>

          <radialGradient id="stainlessCavity" cx="42%" cy="35%" r="95%">
            <stop offset="0%" stopColor={polishedLite} stopOpacity={0.98} />
            <stop offset="22%" stopColor={polishedMid} stopOpacity={0.98} />
            <stop offset="55%" stopColor={polishedDark} stopOpacity={0.98} />
            <stop offset="100%" stopColor={polishedEdge} stopOpacity={1} />
          </radialGradient>
        </defs>

        <text x={16} y={22} fontSize={12} fill="#212529" fontWeight={700}>
          Perspective (to-scale)
        </text>

        {/* soft shadow */}
        <ellipse cx={cx} cy={groundY + 12} rx={inletR * 0.96} ry={ryInlet * 1.08} fill="#000" opacity={0.14} />

        {/* body */}
        <path d={conePath} fill="url(#matteBody)" stroke="#000" strokeWidth={2.2} />

        {/* edge/crease hint to separate facets */}
        <path
          d={`M ${cx - inletR * 0.18} ${groundY - 1} L ${cx - outletR * 0.55} ${topY + 3}`}
          stroke={rimHighlight}
          strokeWidth={1.6}
          opacity={0.28}
          strokeLinecap="round"
        />

        {/* bottom rim (open inlet) */}
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="#0d0d0d" opacity={0.82} />
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="url(#rimBevel)" opacity={0.55} />
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="none" stroke="#000" strokeWidth={2.2} opacity={0.65} />
        <ellipse cx={cx} cy={groundY} rx={inletR * 0.96} ry={ryInlet * 0.96} fill="none" stroke={rimHighlight} strokeWidth={1.2} opacity={0.14} />

        {/* inlet opening (stainless interior) */}
        <ellipse cx={cx} cy={groundY} rx={openingRx} ry={openingRy} fill="url(#stainlessCavity)" opacity={0.98} />
        <ellipse cx={cx} cy={groundY} rx={openingRx} ry={openingRy} fill="none" stroke="#000" strokeWidth={2} opacity={0.55} />

        {/* stator vanes (hinted in perspective) */}
        {[...Array(10)].map((_, i) => {
          const theta = (i / 10) * Math.PI * 2 + Math.PI * 0.12;
          const swirl = -0.38;
          const f1 = 0.88;
          const f2 = 0.62;
          const x1 = cx + openingRx * f1 * Math.cos(theta);
          const y1 = groundY + openingRy * f1 * Math.sin(theta);
          const x2 = cx + openingRx * f2 * Math.cos(theta + swirl);
          const y2 = groundY + openingRy * f2 * Math.sin(theta + swirl);
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke={polishedMid}
              strokeWidth={2.4}
              opacity={0.75}
              strokeLinecap="round"
            />
          );
        })}

        {/* top outlet rim */}
        <ellipse cx={cx} cy={topY} rx={outletR} ry={ryOutlet} fill="url(#matteLip)" opacity={0.98} />
        <ellipse cx={cx} cy={topY} rx={outletR} ry={ryOutlet} fill="none" stroke="#000" strokeWidth={2.2} opacity={0.72} />
        <ellipse cx={cx} cy={topY} rx={outletR * 1.02} ry={ryOutlet * 1.02} fill="none" stroke={rimHighlight} strokeWidth={1.2} opacity={0.22} />
        <ellipse cx={cx} cy={topY} rx={outletR * 0.90} ry={ryOutlet * 0.90} fill="none" stroke={rimHighlight} strokeWidth={1.2} opacity={0.14} />

        {/* outlet opening (stainless interior) */}
        <ellipse cx={cx} cy={topY} rx={outletR * 0.78} ry={ryOutlet * 0.66} fill="url(#polishedHole)" opacity={0.98} />
        <ellipse cx={cx} cy={topY} rx={outletR * 0.64} ry={ryOutlet * 0.52} fill={polishedEdge} opacity={0.75} />

        {/* interior specular streak */}
        <path
          d={`M ${cx - outletR * 0.45} ${topY - ryOutlet * 0.05} Q ${cx} ${topY - ryOutlet * 0.55} ${cx + outletR * 0.45} ${topY - ryOutlet * 0.05}`}
          fill="none"
          stroke={polishedLite}
          strokeWidth={1.6}
          opacity={0.55}
          strokeLinecap="round"
        />

        {/* specular line */}
        <path
          d={`M ${cx - inletR * 0.60} ${groundY - 2} Q ${cx - inletR * 0.35} ${(groundY + topY) / 2} ${cx - outletR * 0.15} ${topY + 2}`}
          fill="none"
          stroke={rimHighlight}
          strokeWidth={2.2}
          opacity={0.45}
          strokeLinecap="round"
        />

        <text x={viewW - 16} y={22} fontSize={11} fill="#6c757d" textAnchor="end">
          24" Ø × 12" tall, 3" outlet
        </text>
      </svg>
    );
  }

  function Cutaway() {
    const ryInlet = inletR * 0.18;
    const ryOutlet = Math.max(2, outletR * 0.55);

    const innerInletR = Math.max(0, (inletRIn - wallThicknessIn) * pxPerIn);
    const innerOutletR = Math.max(0, (outletRIn - wallThicknessIn) * pxPerIn);

    const innerConePath = `
      M ${cx - innerInletR} ${groundY}
      L ${cx - innerOutletR} ${topY}
      L ${cx + innerOutletR} ${topY}
      L ${cx + innerInletR} ${groundY}
      Z
    `;

    // cut plane: show right half as cut
    const cutX = cx;

    return (
      <svg
        width={viewW}
        height={viewH}
        viewBox={`0 0 ${viewW} ${viewH}`}
        style={{
          border: '1px solid #e9ecef',
          borderRadius: 12,
          background: 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)',
        }}
      >
        <defs>
          <linearGradient id="matteBodyCut" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={matteEdge} />
            <stop offset="30%" stopColor={matteFill} />
            <stop offset="55%" stopColor={highlight} />
            <stop offset="80%" stopColor={matteFill} />
            <stop offset="100%" stopColor={matteEdge} />
          </linearGradient>
          {/* Polished stainless interior + cut face */}
          <linearGradient id="interior" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={polishedLite} stopOpacity={0.98} />
            <stop offset="55%" stopColor={polishedMid} stopOpacity={0.98} />
            <stop offset="100%" stopColor={polishedDark} stopOpacity={0.98} />
          </linearGradient>
          <linearGradient id="cutFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={polishedLite} stopOpacity={0.92} />
            <stop offset="55%" stopColor={polishedMid} stopOpacity={0.92} />
            <stop offset="100%" stopColor={polishedDark} stopOpacity={0.92} />
          </linearGradient>

          {/* Polished stainless interior surface */}
          <linearGradient id="polishedInterior" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={polishedEdge} stopOpacity={1} />
            <stop offset="22%" stopColor={polishedDark} stopOpacity={1} />
            <stop offset="45%" stopColor={polishedLite} stopOpacity={0.95} />
            <stop offset="62%" stopColor={polishedMid} stopOpacity={0.98} />
            <stop offset="100%" stopColor={polishedEdge} stopOpacity={1} />
          </linearGradient>
        </defs>

        <text x={16} y={22} fontSize={12} fill="#212529" fontWeight={700}>
          Cutaway (to-scale)
        </text>

        {/* shadow */}
        <ellipse cx={cx} cy={groundY + 12} rx={inletR * 0.96} ry={ryInlet * 1.08} fill="#000" opacity={0.14} />

        {/* full exterior */}
        <path d={conePath} fill="url(#matteBodyCut)" stroke="#000" strokeWidth={2.2} />

        {/* cut mask (right half) */}
        <clipPath id="cutRight">
          <rect x={cutX} y={0} width={viewW - cutX} height={viewH} />
        </clipPath>

        {/* interior cavity + cut face (only on cut side) */}
        <g clipPath="url(#cutRight)">
          {/* cut face (shows material thickness) */}
          <path d={`${conePath} ${innerConePath}`} fill="url(#cutFaceGrad)" fillRule="evenodd" opacity={0.92} />

          <path d={innerConePath} fill="url(#polishedInterior)" opacity={0.98} />

          {/* polished interior streak */}
          <path
            d={`M ${cx} ${topY + 8} Q ${cx + inletR * 0.20} ${(topY + groundY) / 2} ${cx + inletR * 0.10} ${groundY - 8}`}
            stroke={polishedLite}
            strokeWidth={2}
            opacity={0.40}
            fill="none"
            strokeLinecap="round"
          />

          {/* stator (cutaway hint): several angled vanes near the open inlet */}
          {[...Array(7)].map((_, i) => {
            const y = groundY - 18 - i * 7;
            return (
              <path
                key={i}
                d={`M ${cx + inletR * 0.08} ${y} L ${cx + inletR * 0.42} ${y - 10}`}
                stroke={polishedMid}
                strokeWidth={2.2}
                opacity={0.55}
                strokeLinecap="round"
              />
            );
          })}

          {/* interior edge line */}
          <path d={innerConePath} fill="none" stroke="#000" strokeWidth={1.8} opacity={0.75} />

          {/* cut-face outer edge accent */}
          <path d={conePath} fill="none" stroke={cutFaceLite} strokeWidth={1.2} opacity={0.20} />

          {/* a few internal guide rings to read depth */}
          {[0.25, 0.5, 0.75].map((t, i) => {
            const yFromBottom = heightIn * t;
            const rOuter = frustumWallAtY(inletR, outletR, heightPx, heightPx * t);
            const rInner = frustumWallAtY(innerInletR, innerOutletR, heightPx, heightPx * t);
            const y = groundY - heightPx * t;
            const rx = (rInner + rOuter) / 2;
            const ry = Math.max(2, rx * 0.10);
            return (
              <ellipse
                key={i}
                cx={cx}
                cy={y}
                rx={rx}
                ry={ry}
                fill="none"
                stroke={rimHighlight}
                strokeWidth={1.2}
                opacity={0.32}
              />
            );
          })}
        </g>

        {/* bottom and top rims */}
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="#0d0d0d" opacity={0.78} />
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="none" stroke="#000" strokeWidth={2.2} opacity={0.62} />
        <ellipse cx={cx} cy={groundY} rx={inletR * 0.98} ry={ryInlet * 0.98} fill="none" stroke={rimHighlight} strokeWidth={1.2} opacity={0.18} />

        <ellipse cx={cx} cy={topY} rx={outletR} ry={ryOutlet} fill="#0f0f0f" opacity={0.92} />
        <ellipse cx={cx} cy={topY} rx={outletR} ry={ryOutlet} fill="none" stroke="#000" strokeWidth={2.2} opacity={0.70} />

        {/* cut plane line */}
        <line x1={cutX} y1={topY - 6} x2={cutX} y2={groundY + 6} stroke="#6c757d" strokeWidth={1.5} strokeDasharray="4,4" opacity={0.6} />

        <text x={viewW - 16} y={22} fontSize={11} fill="#6c757d" textAnchor="end">
          matte black exterior
        </text>
      </svg>
    );
  }

  function TopView() {
    const w = 520;
    const h = 340;
    const c = { x: w / 2, y: h / 2 + 10 };

    const outerR = inletR;
    const outletRpx = outletR;

    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          border: '1px solid #e9ecef',
          borderRadius: 12,
          background: 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)',
        }}
      >
        <defs>
          <radialGradient id="topMatte" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#3a3a3a" />
            <stop offset="55%" stopColor="#151515" />
            <stop offset="100%" stopColor="#030303" />
          </radialGradient>
          <radialGradient id="topLip" cx="40%" cy="35%" r="80%">
            <stop offset="0%" stopColor={rimHighlight} stopOpacity={0.45} />
            <stop offset="70%" stopColor="#000" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
          </radialGradient>

          <radialGradient id="topHolePolished" cx="38%" cy="33%" r="90%">
            <stop offset="0%" stopColor={polishedLite} stopOpacity={0.98} />
            <stop offset="26%" stopColor={polishedMid} stopOpacity={0.98} />
            <stop offset="62%" stopColor={polishedDark} stopOpacity={0.98} />
            <stop offset="100%" stopColor={polishedEdge} stopOpacity={1} />
          </radialGradient>
        </defs>

        <text x={16} y={22} fontSize={12} fill="#212529" fontWeight={700}>
          Top view (to-scale)
        </text>

        {/* outer lip */}
        <circle cx={c.x} cy={c.y} r={outerR} fill="url(#topMatte)" stroke="#000" strokeWidth={2.2} />
        <circle cx={c.x} cy={c.y} r={outerR * 0.97} fill="url(#topLip)" opacity={0.65} />
        <circle cx={c.x} cy={c.y} r={outerR * 0.98} fill="none" stroke={rimHighlight} strokeWidth={1.4} opacity={0.20} />

        {/* outlet opening (stainless interior) */}
        <circle cx={c.x} cy={c.y} r={outletRpx} fill={polishedEdge} stroke="#000" strokeWidth={2.2} />
        <circle cx={c.x} cy={c.y} r={outletRpx * 0.92} fill="url(#topHolePolished)" opacity={0.98} />
        <circle cx={c.x} cy={c.y} r={outletRpx * 0.60} fill={polishedEdge} opacity={0.72} />

        {/* polished highlight arc inside hole */}
        <path
          d={`M ${c.x - outletRpx * 0.55} ${c.y - outletRpx * 0.05} A ${outletRpx * 0.65} ${outletRpx * 0.65} 0 0 1 ${c.x + outletRpx * 0.50} ${c.y - outletRpx * 0.15}`}
          fill="none"
          stroke={polishedLite}
          strokeWidth={2.2}
          opacity={0.40}
          strokeLinecap="round"
        />

        {/* highlight arc */}
        <path
          d={`M ${c.x - outerR * 0.6} ${c.y - outerR * 0.25} A ${outerR * 0.78} ${outerR * 0.78} 0 0 1 ${c.x + outerR * 0.55} ${c.y - outerR * 0.05}`}
          fill="none"
          stroke={rimHighlight}
          strokeWidth={3}
          opacity={0.32}
          strokeLinecap="round"
        />

        <text x={w - 16} y={22} fontSize={11} fill="#6c757d" textAnchor="end">
          inlet Ø 24", outlet Ø 3"
        </text>
      </svg>
    );
  }

  function BottomView() {
    const w = 520;
    const h = 340;
    const c = { x: w / 2, y: h / 2 + 10 };

    // underside: open inlet (stainless interior) + stator vanes
    const outerR = inletR;
    const wallPx = Math.max(3, wallThicknessIn * pxPerIn);
    const innerR = Math.max(0, outerR - wallPx * 2.5);
    const statorOuterR = innerR * 0.92;
    const statorInnerR = innerR * 0.58;
    const vaneCount = 12;

    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          border: '1px solid #e9ecef',
          borderRadius: 12,
          background: 'linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%)',
        }}
      >
        <defs>
          <radialGradient id="bottomMatte" cx="45%" cy="40%" r="75%">
            <stop offset="0%" stopColor="#2f2f2f" />
            <stop offset="65%" stopColor="#0f0f0f" />
            <stop offset="100%" stopColor="#020202" />
          </radialGradient>
          <radialGradient id="bottomLip" cx="45%" cy="40%" r="85%">
            <stop offset="0%" stopColor={rimHighlight} stopOpacity={0.35} />
            <stop offset="70%" stopColor="#000" stopOpacity={0.05} />
            <stop offset="100%" stopColor="#000" stopOpacity={0.55} />
          </radialGradient>

          <radialGradient id="bottomHolePolished" cx="40%" cy="34%" r="92%">
            <stop offset="0%" stopColor={polishedLite} stopOpacity={0.98} />
            <stop offset="28%" stopColor={polishedMid} stopOpacity={0.98} />
            <stop offset="62%" stopColor={polishedDark} stopOpacity={0.98} />
            <stop offset="100%" stopColor={polishedEdge} stopOpacity={1} />
          </radialGradient>
        </defs>

        <text x={16} y={22} fontSize={12} fill="#212529" fontWeight={700}>
          Bottom view (to-scale)
        </text>

        <circle cx={c.x} cy={c.y} r={outerR} fill="url(#bottomMatte)" stroke="#000" strokeWidth={2.2} />
        <circle cx={c.x} cy={c.y} r={outerR * 0.97} fill="url(#bottomLip)" opacity={0.65} />

        {/* OPEN inlet: stainless interior */}
        <circle cx={c.x} cy={c.y} r={innerR} fill="url(#bottomHolePolished)" stroke="#000" strokeWidth={2.2} opacity={0.98} />
        <circle cx={c.x} cy={c.y} r={innerR * 0.62} fill={polishedEdge} opacity={0.65} />

        {/* stator ring (top-view style): angled flat vanes in the annulus */}
        {[...Array(vaneCount)].map((_, i) => {
          const theta = (i / vaneCount) * Math.PI * 2 + Math.PI * 0.10;
          const swirl = -0.40;
          const x1 = c.x + statorOuterR * Math.cos(theta);
          const y1 = c.y + statorOuterR * Math.sin(theta);
          const x2 = c.x + statorInnerR * Math.cos(theta + swirl);
          const y2 = c.y + statorInnerR * Math.sin(theta + swirl);
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke={polishedMid}
              strokeWidth={3}
              opacity={0.85}
              strokeLinecap="round"
            />
          );
        })}

        <circle cx={c.x} cy={c.y} r={statorOuterR} fill="none" stroke={polishedEdge} strokeWidth={1.6} opacity={0.35} />
        <circle cx={c.x} cy={c.y} r={statorInnerR} fill="none" stroke={polishedEdge} strokeWidth={1.6} opacity={0.22} />

        <path
          d={`M ${c.x - innerR * 0.55} ${c.y - innerR * 0.10} A ${innerR * 0.70} ${innerR * 0.70} 0 0 1 ${c.x + innerR * 0.48} ${c.y - innerR * 0.18}`}
          fill="none"
          stroke={polishedLite}
          strokeWidth={2.2}
          opacity={0.35}
          strokeLinecap="round"
        />

        {/* rolled edge hint */}
        <circle cx={c.x} cy={c.y} r={outerR * 0.93} fill="none" stroke={rimHighlight} strokeWidth={2.5} opacity={0.28} />
        <circle cx={c.x} cy={c.y} r={outerR * 0.985} fill="none" stroke={rimHighlight} strokeWidth={1.2} opacity={0.18} />

        <text x={viewW - 16} y={22} fontSize={11} fill="#6c757d" textAnchor="end">
          inlet opening Ø 24"
        </text>
      </svg>
    );
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 18, fontWeight: 600, color: '#212529' }}>
        🖤 Emitter Renderings (24&quot; × 12&quot;, 3&quot; outlet)
      </h3>
      <div style={{ color: '#6c757d', fontSize: 12, lineHeight: 1.5, marginBottom: 14 }}>
        Matte-black exterior. SVG renderings are dimensionally scaled (same pixels-per-inch across views).
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 14,
          alignItems: 'start',
        }}
      >
        <SidePerspective />
        <Cutaway />
        <TopView />
        <BottomView />
      </div>
    </div>
  );
}
