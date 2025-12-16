import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Config } from '../../model/schema';
import { calcResults } from '../../model/calc';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / Math.max(edge1 - edge0, 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
}

type Particle = {
  z: number; // normalized height, inlet plane at z=0, outlet at z=1
  r: number; // normalized radius (0=center, 1=wall at that z)
  theta: number; // radians
  seed: number;
};

type SwirlDesignId =
  | 'none'
  | 'outerStator'
  | 'fullStator'
  | 'statorFins'
  | 'propeller'
  | 'centerbody';

type SwirlDesign = {
  id: SwirlDesignId;
  name: string;
  description: string;
  // Impacts the thermal model (apples-to-apples comparisons)
  uaMult: number;
  cMult: number;
  // base angular speed (rad/s) inside the emitter
  omega: (z: number) => number;
  // radial multiplier (0..1+) for how much of the section actually gets swirl
  omegaByRadius: (r: number) => number;
  // where the plume tends to migrate (0..1)
  rTarget: (r: number, z: number) => number;
  // how quickly it migrates toward the target
  attach: (z: number) => number;
  // axial speed scale (draft penalty due to restriction)
  vzScale: number;
  // if present, blocks the center (enforces annulus)
  rMin?: (z: number) => number;
  // geometry overlay hint
  overlay: 'none' | 'statorOuter' | 'statorFull' | 'fins' | 'propeller' | 'centerbody';
};

const DESIGNS: SwirlDesign[] = [
  {
    id: 'none',
    name: 'No swirl hardware (baseline)',
    description: 'Mostly axial upflow; weak wall attachment; lowest restriction.',
    uaMult: 0.60,
    cMult: 1.00,
    omega: () => 0,
    omegaByRadius: () => 0,
    rTarget: () => 0.28,
    attach: () => 0.35,
    vzScale: 1.0,
    overlay: 'none',
  },
  {
    id: 'outerStator',
    name: 'Outer-only stator vanes (partial swirl)',
    description: 'Vaned ring near the wall spins only the outer annulus; inner core stays mostly axial.',
    uaMult: 0.90,
    cMult: 0.95,
    omega: (z) => 4.0 * Math.exp(-z / 0.32),
    omegaByRadius: (r) => smoothstep(0.55, 0.78, r),
    rTarget: (r) => (r < 0.55 ? 0.30 : 0.84),
    attach: (z) => 0.85 + 0.35 * Math.exp(-z / 0.45),
    vzScale: 0.92,
    overlay: 'statorOuter',
  },
  {
    id: 'fullStator',
    name: 'Full-annulus stator vanes (swirl most flow)',
    description: 'Guide vanes span the annulus so the bulk flow picks up tangential velocity quickly.',
    uaMult: 1.00,
    cMult: 0.92,
    omega: (z) => 4.2 * Math.exp(-z / 0.42),
    omegaByRadius: (r) => 0.65 + 0.45 * r,
    rTarget: () => 0.78,
    attach: (z) => 1.05 + 0.35 * Math.exp(-z / 0.60),
    vzScale: 0.88,
    overlay: 'statorFull',
  },
  {
    id: 'statorFins',
    name: 'Stator + helical wall fins (strong wall attachment)',
    description: 'Stator generates swirl; wall fins sustain it and keep hot gas pressed to the wall.',
    uaMult: 1.15,
    cMult: 0.90,
    omega: (z) => 4.4 * Math.exp(-z / 0.75),
    omegaByRadius: (r) => 0.75 + 0.55 * r,
    rTarget: () => 0.88,
    attach: (z) => 1.35 + 0.45 * Math.exp(-z / 0.80),
    vzScale: 0.84,
    overlay: 'fins',
  },
  {
    id: 'propeller',
    name: 'Propeller-style blades (axial swirler)',
    description: 'Fixed blades create swirl through the whole section but at higher turning loss.',
    uaMult: 1.05,
    cMult: 0.86,
    omega: (z) => 4.8 * (1 - 0.25 * z),
    omegaByRadius: () => 0.95,
    rTarget: () => 0.84,
    attach: (z) => 1.15 + 0.20 * (1 - z),
    vzScale: 0.78,
    overlay: 'propeller',
  },
  {
    id: 'centerbody',
    name: 'Centerbody + blades (annular jet + swirl)',
    description: 'A center cone forces annular flow; blades add swirl; tends to push gas hard into the wall.',
    uaMult: 1.20,
    cMult: 0.88,
    omega: (z) => 5.2 * Math.exp(-z / 0.70),
    omegaByRadius: () => 1.0,
    rTarget: () => 0.92,
    attach: (z) => 1.45 + 0.30 * (1 - z),
    vzScale: 0.80,
    rMin: (z) => lerp(0.30, 0.20, clamp(z / 0.35, 0, 1)),
    overlay: 'centerbody',
  },
];

function createParticle(seed: number): Particle {
  // deterministic-ish distribution without importing RNG libs
  const a = (seed * 9301 + 49297) % 233280;
  const b = (seed * 233280 + 49297) % 9301;
  const u = a / 233280;
  const v = b / 9301;

  return {
    // start below the inlet so the user can see approach
    z: -0.28 - 0.45 * u,
    r: clamp(0.12 + 0.78 * v, 0.06, 0.94),
    theta: (u * 2 * Math.PI + v * 0.6) % (2 * Math.PI),
    seed,
  };
}

function frustumRadiusAtZ(inletRpx: number, outletRpx: number, z: number) {
  const t = clamp(z, 0, 1);
  return lerp(inletRpx, outletRpx, t);
}

function stepParticle(p: Particle, dt: number, design: SwirlDesign) {
  const inside = p.z >= 0 && p.z <= 1;

  const omega = inside ? design.omega(p.z) * design.omegaByRadius(p.r) : 0;

  // axial speed: slower for higher restriction designs
  const vzBaseOutside = 0.26;
  const vzBaseInside = 0.34;
  const vz = (inside ? vzBaseInside * design.vzScale : vzBaseOutside) * (0.92 + 0.16 * Math.sin(p.seed * 0.9));

  // wall-attachment proxy: swirl pushes outward
  const attach = inside ? design.attach(p.z) : 0.25;
  const rTarget = inside ? design.rTarget(p.r, p.z) : 0.25;

  // optional center blockage
  const rMin = inside && design.rMin ? design.rMin(p.z) : 0;

  // evolve state
  p.theta = (p.theta + omega * dt) % (2 * Math.PI);
  p.r = clamp(p.r + (rTarget - p.r) * attach * dt, rMin + 0.02, 0.98);
  p.z += vz * dt;

  // recycle above the outlet
  if (p.z > 1.15) {
    const next = createParticle(p.seed + 1);
    p.z = next.z;
    p.r = next.r;
    p.theta = next.theta;
    p.seed = next.seed;
  }
}

function windTunnelPanel(props: {
  title: string;
  subtitleRight: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#212529' }}>{props.title}</div>
        <div style={{ fontSize: 11, color: '#6c757d' }}>{props.subtitleRight}</div>
      </div>
      {props.children}
    </div>
  );
}

function drawStatorVanes(params: {
  cx: number;
  cy: number;
  rOuter: number;
  rInner: number;
  count: number;
  swirl: number;
  opacity: number;
}) {
  const { cx, cy, rOuter, rInner, count, swirl, opacity } = params;
  const vanes: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2 + Math.PI * 0.10;
    const x1 = cx + rOuter * Math.cos(theta);
    const y1 = cy + rOuter * Math.sin(theta);
    const x2 = cx + rInner * Math.cos(theta + swirl);
    const y2 = cy + rInner * Math.sin(theta + swirl);
    vanes.push(
      <path
        key={i}
        d={`M ${x1} ${y1} L ${x2} ${y2}`}
        stroke="#bdbdbd"
        strokeWidth={3}
        opacity={opacity}
        strokeLinecap="round"
      />
    );
  }
  return vanes;
}

function drawHelicalFins(params: { cx: number; topY: number; bottomY: number; inletR: number; outletR: number }) {
  const { cx, topY, bottomY, inletR, outletR } = params;
  // simple perspective hints: a few tilted ribs along the wall
  const ribs: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 7;
    const y = lerp(bottomY, topY, t);
    const r = lerp(inletR, outletR, 1 - t);
    ribs.push(
      <path
        key={i}
        d={`M ${cx + r * 0.62} ${y + 10} L ${cx + r * 0.35} ${y - 10}`}
        stroke="#bdbdbd"
        strokeWidth={2.2}
        opacity={0.28}
        strokeLinecap="round"
      />
    );
  }
  return ribs;
}

export function FlowTunnelAnimations(props: {
  config: Config;
}) {
  const [designId, setDesignId] = useState<SwirlDesignId>('outerStator');
  const [outletSelIn, setOutletSelIn] = useState<number>(() => clamp(props.config.outletDiameterIn ?? 3, 2, 5));
  const design = useMemo(() => DESIGNS.find((d) => d.id === designId) ?? DESIGNS[0], [designId]);

  const pxPerIn = 10;
  const inletR = (props.config.inletDiameterIn / 2) * pxPerIn;
  const outletR = (outletSelIn / 2) * pxPerIn;
  const heightPx = props.config.emitterHeightIn * pxPerIn;

  const viewW = 520;
  const viewH = 340;
  const pad = 28;
  const cx = viewW / 2;
  const bottomY = viewH - pad;
  const topY = bottomY - heightPx;

  const particlesRef = useRef<Particle[]>([]);
  const lastTRef = useRef<number | null>(null);
  const [, bump] = useState(0);

  const particleCount = 140;

  const particles = useMemo(() => {
    const list = [...Array(particleCount)].map((_, i) => createParticle(i + 1));
    particlesRef.current = list;
    return list;
  }, [particleCount]);

  useEffect(() => {
    let raf = 0;
    lastTRef.current = null;

    const tick = (tMs: number) => {
      if (lastTRef.current == null) lastTRef.current = tMs;
      const dt = clamp((tMs - lastTRef.current) / 1000, 0, 0.05);
      lastTRef.current = tMs;

      for (const p of particlesRef.current) stepParticle(p, dt, design);
      bump((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [design]);

  const conePath = useMemo(() => {
    return `M ${cx - inletR} ${bottomY} L ${cx - outletR} ${topY} L ${cx + outletR} ${topY} L ${cx + inletR} ${bottomY} Z`;
  }, [cx, inletR, outletR, bottomY, topY]);

  const modelCfg = useMemo<Config>(() => {
    // Keep all base assumptions the same; only vary outlet diameter and the swirl concept multipliers.
    return {
      ...props.config,
      scenario: 'custom',
      outletDiameterIn: outletSelIn,
      UA_W_per_K: props.config.UA_W_per_K * design.uaMult,
      C_effective_W_per_K: props.config.C_effective_W_per_K * design.cMult,
    };
  }, [props.config, outletSelIn, design.uaMult, design.cMult]);

  const results = useMemo(() => calcResults(modelCfg), [modelCfg]);

  const capturedPlumeW = results.capturedPlumeW;
  const wallCapturedW = results.wallCapturedW;
  const outletExhaustW = results.outletExhaustW ?? Math.max(0, capturedPlumeW - wallCapturedW);
  const radiantOutW = results.radiantOutW;
  const eps = results.eps ?? 0;
  const bypassEff = results.bypassEff ?? 0;
  const uaEff = results.UA_eff ?? 0;
  const capEffW = results.capturedEffW ?? capturedPlumeW * (1 - bypassEff);

  const heatToWallFrac = capturedPlumeW > 0 ? clamp(wallCapturedW / capturedPlumeW, 0, 1) : 0;
  const subtitle = `${props.config.inletDiameterIn}" inlet → ${outletSelIn}" outlet, ${props.config.emitterHeightIn}" tall`;

  // Side view particle projection
  const sideDots = particles.map((p, i) => {
    const z = p.z;
    const y = lerp(bottomY, topY, clamp(z, 0, 1));

    const inEmitter = z >= 0 && z <= 1;
    const rWall = frustumRadiusAtZ(inletR, outletR, clamp(z, 0, 1));

    // outside: widen a bit to show plume approaching
    const outsideExpand = z < 0 ? 1.10 : 1.0;

    const rPx = p.r * rWall * outsideExpand;
    const x = cx + rPx * Math.cos(p.theta);

    // Fade particles as energy transfers to the wall (qualitative): more transfer as z increases.
    const transferAtZ = inEmitter ? heatToWallFrac * smoothstep(0.02, 1.0, clamp(z, 0, 1)) : 0;
    const alpha = inEmitter ? lerp(0.90, 0.26, transferAtZ) : 0.35;
    const radius = inEmitter ? 2.0 : 1.7;

    return <circle key={i} cx={x} cy={y} r={radius} fill="#6c757d" opacity={alpha} />;
  });

  // Top view particle projection at each particle's z
  const topDots = particles.map((p, i) => {
    const z = clamp(p.z, 0, 1);
    const sliceR = frustumRadiusAtZ(inletR, outletR, z);
    const rMin = design.rMin ? design.rMin(z) : 0;
    const effectiveR = sliceR * (clamp(p.r, rMin + 0.02, 0.98));

    const w = 520;
    const h = 340;
    const tcx = w / 2;
    const tcy = h / 2 + 10;

    const x = tcx + effectiveR * Math.cos(p.theta);
    const y = tcy + effectiveR * Math.sin(p.theta);

    return <circle key={i} cx={x} cy={y} r={1.9} fill="#6c757d" opacity={0.55} />;
  });

  const showStatorOuter = design.overlay === 'statorOuter';
  const showStatorFull = design.overlay === 'statorFull' || design.overlay === 'fins';

  const w = 520;
  const h = 340;
  const tc = { x: w / 2, y: h / 2 + 10 };

  const topOuterR = inletR;
  const topInnerR = outletR;

  const statorOuterInner = topOuterR * 0.72;
  const statorFullInner = topOuterR * 0.35;

  const centerbodyR = topOuterR * 0.28;

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
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 18, fontWeight: 600, color: '#212529' }}>
            Flow Animation (wind-tunnel style)
          </h3>
          <div style={{ color: '#6c757d', fontSize: 12, lineHeight: 1.5 }}>
            Animated particles approximate how the plume approaches, enters, and (optionally) spins/attaches to the inner wall. This is a
            qualitative visualization to compare concepts.
          </div>
        </div>

        <div style={{ width: 520, maxWidth: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 10, alignItems: 'end' }}>
            <label style={{ display: 'block', marginBottom: 0 }}>
              <div style={{ fontSize: 13, color: '#495057', fontWeight: 500, marginBottom: 6 }}>Swirl concept</div>
              <select
                value={designId}
                onChange={(e) => setDesignId(e.target.value as SwirlDesignId)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #dee2e6',
                  fontSize: 14,
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                {DESIGNS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: 0 }}>
              <div style={{ fontSize: 13, color: '#495057', fontWeight: 500, marginBottom: 6 }}>Outlet size</div>
              <select
                value={outletSelIn}
                onChange={(e) => setOutletSelIn(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #dee2e6',
                  fontSize: 14,
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                {[2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    {d}"
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: 6, fontSize: 12, color: '#6c757d', lineHeight: 1.4 }}>{design.description}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: 14,
          alignItems: 'start',
        }}
      >
        {windTunnelPanel({
          title: 'Side view (approach → enter → rise)',
          subtitleRight: subtitle,
          children: (
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
              {/* outside plume region */}
              <rect x={0} y={bottomY + 2} width={viewW} height={viewH - (bottomY + 2)} fill="#ffffff" opacity={0} />

              {/* emitter outline (wall glow intensity ∝ heat transferred) */}
              <path d={conePath} fill="#1a1a1a" opacity={0.10} stroke="#000" strokeWidth={2} />
              <path d={conePath} fill="none" stroke="#667eea" strokeWidth={3} opacity={clamp(0.08 + heatToWallFrac * 0.55, 0.08, 0.65)} />

              {/* centerbody hint */}
              {design.overlay === 'centerbody' && (
                <path
                  d={`M ${cx} ${bottomY - 6} L ${cx - inletR * 0.16} ${bottomY - heightPx * 0.22} L ${cx} ${bottomY - heightPx * 0.40} L ${cx + inletR * 0.16} ${bottomY - heightPx * 0.22} Z`}
                  fill="#2f2f2f"
                  opacity={0.45}
                  stroke="#000"
                  strokeWidth={1.6}
                />
              )}

              {/* stator plane hint near inlet */}
              {(design.overlay === 'statorOuter' || design.overlay === 'statorFull' || design.overlay === 'fins' || design.overlay === 'propeller' || design.overlay === 'centerbody') && (
                <line
                  x1={cx - inletR}
                  y1={bottomY - 14}
                  x2={cx + inletR}
                  y2={bottomY - 14}
                  stroke="#adb5bd"
                  strokeWidth={2}
                  opacity={0.45}
                />
              )}

              {/* helical fin hints */}
              {design.overlay === 'fins' && drawHelicalFins({ cx, topY, bottomY, inletR, outletR })}

              {/* particles */}
              {sideDots}

              {/* labels */}
              <text x={16} y={24} fontSize={11} fill="#495057">
                Upward plume approaches from below; inside the frustum it may spin and migrate to the wall.
              </text>
              <text x={viewW - 16} y={24} fontSize={11} fill="#6c757d" textAnchor="end">
                darker outline = emitter wall
              </text>
            </svg>
          ),
        })}

        {windTunnelPanel({
          title: 'Top view (swirl + wall attachment)',
          subtitleRight: 'particles show tangential motion',
          children: (
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
              {/* outer lip */}
              <circle cx={tc.x} cy={tc.y} r={topOuterR} fill="#151515" opacity={0.08} stroke="#000" strokeWidth={2} />

              {/* outlet opening */}
              <circle cx={tc.x} cy={tc.y} r={topInnerR} fill="#000" opacity={0.05} stroke="#000" strokeWidth={2} />

              {/* stator overlays */}
              {showStatorOuter && (
                <>
                  <circle cx={tc.x} cy={tc.y} r={topOuterR * 0.95} fill="none" stroke="#adb5bd" strokeWidth={1.6} opacity={0.40} />
                  <circle cx={tc.x} cy={tc.y} r={statorOuterInner} fill="none" stroke="#adb5bd" strokeWidth={1.6} opacity={0.25} />
                  {drawStatorVanes({ cx: tc.x, cy: tc.y, rOuter: topOuterR * 0.92, rInner: statorOuterInner, count: 12, swirl: -0.45, opacity: 0.55 })}
                </>
              )}

              {showStatorFull && (
                <>
                  <circle cx={tc.x} cy={tc.y} r={topOuterR * 0.95} fill="none" stroke="#adb5bd" strokeWidth={1.6} opacity={0.40} />
                  <circle cx={tc.x} cy={tc.y} r={statorFullInner} fill="none" stroke="#adb5bd" strokeWidth={1.6} opacity={0.25} />
                  {drawStatorVanes({ cx: tc.x, cy: tc.y, rOuter: topOuterR * 0.92, rInner: statorFullInner, count: 14, swirl: -0.45, opacity: 0.55 })}
                </>
              )}

              {design.overlay === 'propeller' && (
                <>
                  <circle cx={tc.x} cy={tc.y} r={topOuterR * 0.12} fill="#2f2f2f" opacity={0.55} stroke="#000" strokeWidth={1.6} />
                  {[0, 1, 2].map((i) => {
                    const a = (i / 3) * Math.PI * 2;
                    const r1 = topOuterR * 0.18;
                    const r2 = topOuterR * 0.70;
                    const x1 = tc.x + r1 * Math.cos(a);
                    const y1 = tc.y + r1 * Math.sin(a);
                    const x2 = tc.x + r2 * Math.cos(a + 0.55);
                    const y2 = tc.y + r2 * Math.sin(a + 0.55);
                    return <path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#bdbdbd" strokeWidth={6} opacity={0.50} strokeLinecap="round" />;
                  })}
                </>
              )}

              {design.overlay === 'centerbody' && (
                <>
                  <circle cx={tc.x} cy={tc.y} r={centerbodyR} fill="#2f2f2f" opacity={0.50} stroke="#000" strokeWidth={1.6} />
                  {[0, 1, 2, 3].map((i) => {
                    const a = (i / 4) * Math.PI * 2;
                    const r1 = centerbodyR * 1.05;
                    const r2 = topOuterR * 0.78;
                    const x1 = tc.x + r1 * Math.cos(a);
                    const y1 = tc.y + r1 * Math.sin(a);
                    const x2 = tc.x + r2 * Math.cos(a + 0.55);
                    const y2 = tc.y + r2 * Math.sin(a + 0.55);
                    return <path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#bdbdbd" strokeWidth={5} opacity={0.48} strokeLinecap="round" />;
                  })}
                </>
              )}

              {/* particles */}
              {topDots}

              <text x={16} y={24} fontSize={11} fill="#495057">
                Outer-only stator leaves a calmer core; full-annulus / propeller spins more of the plume.
              </text>
            </svg>
          ),
        })}
      </div>

      {/* Metrics + assumptions/formulas */}
      <div
        style={{
          marginTop: 14,
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 6 }}>Energy split (captured plume)</div>
            <div style={{ fontSize: 13, color: '#212529', lineHeight: 1.6 }}>
              <div>
                <strong>Outlet exhaust heat:</strong> <strong>{outletExhaustW.toFixed(0)} W</strong>
              </div>
              <div>
                <strong>Heat to wall:</strong> {wallCapturedW.toFixed(0)} W ({(heatToWallFrac * 100).toFixed(1)}%)
              </div>
              <div>
                <strong>Radiant out:</strong> {radiantOutW.toFixed(0)} W
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ height: 12, borderRadius: 999, overflow: 'hidden', border: '1px solid #dee2e6', display: 'flex' }}>
                <div style={{ width: `${clamp(heatToWallFrac, 0, 1) * 100}%`, background: '#667eea', opacity: 0.55 }} />
                <div style={{ flex: 1, background: '#adb5bd', opacity: 0.45 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6c757d', marginTop: 6 }}>
                <span>to wall</span>
                <span>exits outlet</span>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 6 }}>Real numbers (current selection)</div>
            <div style={{ fontSize: 13, color: '#212529', lineHeight: 1.6 }}>
              <div>Burner power: {results.burnerPowerW.toFixed(0)} W</div>
              <div>Plume power: {results.plumePowerW.toFixed(0)} W</div>
              <div>Captured plume: {capturedPlumeW.toFixed(0)} W</div>
              <div>Bypass (effective): {(bypassEff * 100).toFixed(1)}%</div>
              <div>Processed plume: {capEffW.toFixed(0)} W</div>
              <div>UA (effective): {uaEff.toFixed(1)} W/K</div>
              <div>Effectiveness ε: {eps.toFixed(3)}</div>
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 6 }}>Assumptions & formulas (used here)</div>
            <div style={{ fontSize: 12, color: '#212529', lineHeight: 1.55 }}>
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                P_burner[W] = BTU/h × 0.293071
                <br />
                P_plume = P_burner × f_conv
                <br />
                P_captured = P_plume × f_capture × (1 - f_wind)
                <br />
                bypassEff = clamp(f_bypass × (D/4)^0.8, 0, 0.95)
                <br />
                UA_eff = UA × (4/D)^0.35 × uaMult
                <br />
                C_eff = C × cMult
                <br />
                ε = 1 - exp(-UA_eff / C_eff)
                <br />
                Q_wall = P_captured × (1 - bypassEff) × ε
                <br />
                <strong>Q_outlet = P_captured - Q_wall</strong>
              </div>
              <div style={{ marginTop: 8, color: '#6c757d' }}>
                Note: This animation is qualitative; numbers come from the same simplified thermal model used elsewhere in the app.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
