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

  const matteFill = '#1c1c1c';
  const matteEdge = '#0f0f0f';
  const highlight = '#2b2b2b';

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
            <stop offset="40%" stopColor={matteFill} />
            <stop offset="70%" stopColor={highlight} />
            <stop offset="100%" stopColor={matteEdge} />
          </linearGradient>
          <linearGradient id="matteLip" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0b0b0b" />
            <stop offset="50%" stopColor="#222" />
            <stop offset="100%" stopColor="#0b0b0b" />
          </linearGradient>
        </defs>

        <text x={16} y={22} fontSize={12} fill="#212529" fontWeight={700}>
          Perspective (to-scale)
        </text>

        {/* soft shadow */}
        <ellipse cx={cx} cy={groundY + 10} rx={inletR * 0.92} ry={ryInlet * 1.05} fill="#000" opacity={0.10} />

        {/* body */}
        <path d={conePath} fill="url(#matteBody)" stroke="#0b0b0b" strokeWidth={2} />

        {/* bottom rim */}
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="#111" opacity={0.70} />
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="none" stroke="#000" strokeWidth={2} opacity={0.55} />

        {/* top outlet rim */}
        <ellipse cx={cx} cy={topY} rx={outletR} ry={ryOutlet} fill="url(#matteLip)" opacity={0.95} />
        <ellipse cx={cx} cy={topY} rx={outletR} ry={ryOutlet} fill="none" stroke="#000" strokeWidth={2} opacity={0.65} />

        {/* outlet opening */}
        <ellipse cx={cx} cy={topY} rx={outletR * 0.72} ry={ryOutlet * 0.60} fill="#070707" opacity={0.95} />

        {/* subtle specular line */}
        <path
          d={`M ${cx - inletR * 0.60} ${groundY - 2} Q ${cx - inletR * 0.35} ${(groundY + topY) / 2} ${cx - outletR * 0.15} ${topY + 2}`}
          fill="none"
          stroke="#3a3a3a"
          strokeWidth={2}
          opacity={0.35}
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
            <stop offset="60%" stopColor={matteFill} />
            <stop offset="100%" stopColor={matteEdge} />
          </linearGradient>
          <linearGradient id="interior" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#121212" />
          </linearGradient>
        </defs>

        <text x={16} y={22} fontSize={12} fill="#212529" fontWeight={700}>
          Cutaway (to-scale)
        </text>

        {/* shadow */}
        <ellipse cx={cx} cy={groundY + 10} rx={inletR * 0.92} ry={ryInlet * 1.05} fill="#000" opacity={0.10} />

        {/* full exterior */}
        <path d={conePath} fill="url(#matteBodyCut)" stroke="#0b0b0b" strokeWidth={2} />

        {/* cut mask (right half) */}
        <clipPath id="cutRight">
          <rect x={cutX} y={0} width={viewW - cutX} height={viewH} />
        </clipPath>

        {/* interior cavity (only on cut side) */}
        <g clipPath="url(#cutRight)">
          <path d={innerConePath} fill="url(#interior)" opacity={0.98} />

          {/* interior edge line */}
          <path d={innerConePath} fill="none" stroke="#000" strokeWidth={1.5} opacity={0.65} />

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
                stroke="#3a3a3a"
                strokeWidth={1.2}
                opacity={0.35}
              />
            );
          })}
        </g>

        {/* bottom and top rims */}
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="#111" opacity={0.65} />
        <ellipse cx={cx} cy={groundY} rx={inletR} ry={ryInlet} fill="none" stroke="#000" strokeWidth={2} opacity={0.50} />

        <ellipse cx={cx} cy={topY} rx={outletR} ry={ryOutlet} fill="#111" opacity={0.85} />
        <ellipse cx={cx} cy={topY} rx={outletR} ry={ryOutlet} fill="none" stroke="#000" strokeWidth={2} opacity={0.60} />

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
            <stop offset="0%" stopColor="#2b2b2b" />
            <stop offset="55%" stopColor="#1a1a1a" />
            <stop offset="100%" stopColor="#0b0b0b" />
          </radialGradient>
        </defs>

        <text x={16} y={22} fontSize={12} fill="#212529" fontWeight={700}>
          Top view (to-scale)
        </text>

        {/* outer lip */}
        <circle cx={c.x} cy={c.y} r={outerR} fill="url(#topMatte)" stroke="#000" strokeWidth={2} />

        {/* outlet opening */}
        <circle cx={c.x} cy={c.y} r={outletRpx} fill="#0a0a0a" stroke="#000" strokeWidth={2} />
        <circle cx={c.x} cy={c.y} r={outletRpx * 0.74} fill="#050505" opacity={0.95} />

        {/* subtle highlight arc */}
        <path
          d={`M ${c.x - outerR * 0.6} ${c.y - outerR * 0.25} A ${outerR * 0.78} ${outerR * 0.78} 0 0 1 ${c.x + outerR * 0.55} ${c.y - outerR * 0.05}`}
          fill="none"
          stroke="#3a3a3a"
          strokeWidth={3}
          opacity={0.25}
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

    // simple underside: inlet opening + a small rolled lip
    const outerR = inletR;
    const innerR = Math.max(0, (inletRIn - 0.25) * pxPerIn);

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
            <stop offset="0%" stopColor="#242424" />
            <stop offset="65%" stopColor="#141414" />
            <stop offset="100%" stopColor="#070707" />
          </radialGradient>
        </defs>

        <text x={16} y={22} fontSize={12} fill="#212529" fontWeight={700}>
          Bottom view (to-scale)
        </text>

        <circle cx={c.x} cy={c.y} r={outerR} fill="url(#bottomMatte)" stroke="#000" strokeWidth={2} />
        <circle cx={c.x} cy={c.y} r={innerR} fill="#0a0a0a" stroke="#000" strokeWidth={2} />

        {/* rolled edge hint */}
        <circle cx={c.x} cy={c.y} r={outerR * 0.93} fill="none" stroke="#3a3a3a" strokeWidth={2.5} opacity={0.22} />

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
