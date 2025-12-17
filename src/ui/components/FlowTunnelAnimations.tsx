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

function circleArea(dIn: number) {
  const r = dIn / 2;
  return Math.PI * r * r;
}

function fmtW(w: number) {
  if (!Number.isFinite(w)) return '—';
  return `${w.toFixed(0)} W`;
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

function drawVanePlate(params: {
  cx: number;
  cy: number;
  rInner: number;
  rOuter: number;
  a0: number;
  a1: number;
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}) {
  const { cx, cy, rInner, rOuter, a0, a1 } = params;
  const fill = params.fill ?? '#bdbdbd';
  const fillOpacity = params.fillOpacity ?? 0.55;
  const stroke = params.stroke ?? '#000';
  const strokeOpacity = params.strokeOpacity ?? 0.32;
  const strokeWidth = params.strokeWidth ?? 1.6;

  const x1 = cx + rOuter * Math.cos(a0);
  const y1 = cy + rOuter * Math.sin(a0);
  const x2 = cx + rOuter * Math.cos(a1);
  const y2 = cy + rOuter * Math.sin(a1);
  const x3 = cx + rInner * Math.cos(a1);
  const y3 = cy + rInner * Math.sin(a1);
  const x4 = cx + rInner * Math.cos(a0);
  const y4 = cy + rInner * Math.sin(a0);

  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;

  const d =
    `M ${x1} ${y1} ` +
    `A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${x2} ${y2} ` +
    `L ${x3} ${y3} ` +
    `A ${rInner} ${rInner} 0 ${large} ${1 - sweep} ${x4} ${y4} ` +
    `Z`;

  return <path d={d} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeOpacity={strokeOpacity} strokeWidth={strokeWidth} />;
}

export function FlowTunnelAnimations(props: {
  config: Config;
}) {
  const [designId, setDesignId] = useState<SwirlDesignId>('propeller');
  const [outletSelIn, setOutletSelIn] = useState<number>(() => clamp(props.config.outletDiameterIn ?? 3, 2, 5));
  const [jetDiaIn, setJetDiaIn] = useState<number>(6);
  const [jetStartIn, setJetStartIn] = useState<number>(1);
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
  const swirlerContactRef = useRef(
    new WeakMap<
      Particle,
      {
        segIndex: number;
        zContact: number;
        xContact: number;
        yContact: number;
        tx: number;
        ty: number;
      }
    >()
  );
  const [, bump] = useState(0);

  const particleCount = 168;

  const particles = useMemo(() => {
    const list = [...Array(particleCount)].map((_, i) => createParticle(i + 1));
    particlesRef.current = list;
    return list;
  }, [particleCount]);


  // Annular jet geometry controls (used primarily by the centerbody design)
  const jetDiaClamped = useMemo(() => clamp(jetDiaIn, 2, 10), [jetDiaIn]);
  const jetStartClamped = useMemo(() => clamp(jetStartIn, 0, Math.max(0, props.config.emitterHeightIn - 1)), [jetStartIn, props.config.emitterHeightIn]);
  const jetStartZ = useMemo(() => (props.config.emitterHeightIn > 0 ? clamp(jetStartClamped / props.config.emitterHeightIn, 0, 0.95) : 0), [jetStartClamped, props.config.emitterHeightIn]);
  const rMinFromJet = useMemo(() => {
    const jetRNorm = clamp(jetDiaClamped / props.config.inletDiameterIn, 0.04, 0.55);
    return (z: number) => {
      if (z < jetStartZ) return 0;
      // taper slightly with height (jet tip narrows)
      const t = clamp((z - jetStartZ) / Math.max(0.35, 1 - jetStartZ), 0, 1);
      return clamp(lerp(jetRNorm, jetRNorm * 0.75, t), 0.04, 0.55);
    };
  }, [jetDiaClamped, props.config.inletDiameterIn, jetStartZ]);

  useEffect(() => {
    let raf = 0;
    lastTRef.current = null;

    const tick = (tMs: number) => {
      if (lastTRef.current == null) lastTRef.current = tMs;
      const dt = clamp((tMs - lastTRef.current) / 1000, 0, 0.05);
      lastTRef.current = tMs;

      // If we're in centerbody mode, enforce annular blocking via rMinFromJet.
      const activeDesign: SwirlDesign = design.overlay === 'centerbody' ? { ...design, rMin: rMinFromJet } : design;

      for (const p of particlesRef.current) stepParticle(p, dt, activeDesign);
      bump((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [design, rMinFromJet]);

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

  // Simple restriction/backpressure proxy using open flow area (qualitative): smaller area -> higher restriction index.
  // Baseline reference: 3" outlet only.
  const outletArea = circleArea(outletSelIn);
  const outletAreaRef = circleArea(3);
  const restrictionIndexOutletOnly = outletArea > 0 ? clamp(outletAreaRef / outletArea, 0.25, 10) : 10;

  // Side ports configuration (for the "outward outlet ports" animation row)
  const sidePortsEnabled = true;
  const sidePortCount = 10;
  const sidePortDiaIn = 1; // assumption for visualization + numbers
  const sidePortsArea = sidePortCount * circleArea(sidePortDiaIn);
  // Effective vent area = top outlet + ports. (Real flow depends on losses and jetting; this is just a first-order proxy.)
  const effectiveVentArea = outletArea + sidePortsArea;
  const restrictionIndexWithPorts = effectiveVentArea > 0 ? clamp(outletAreaRef / effectiveVentArea, 0.1, 10) : 10;

  const backpressureFlag = outletSelIn <= 2 ? 'High risk' : outletSelIn <= 2.5 ? 'Moderate risk' : 'Lower risk';

  // Side view particle projection
  const sideDots = particles.map((p, i) => {
    const z = p.z;
    const y =
      z < 0
        ? lerp(bottomY, topY, 0) + (-z) * (heightPx * 0.45)
        : z <= 1
          ? lerp(bottomY, topY, z)
          : lerp(bottomY, topY, 1) - (z - 1) * (heightPx * 0.55);

    const inEmitter = z >= 0 && z <= 1;
    const rWall = frustumRadiusAtZ(inletR, outletR, clamp(z, 0, 1));

    // outside: widen a bit to show plume approaching
    const outsideExpand = z < 0 ? 1.1 : 1.0;

    const rPx = p.r * rWall * outsideExpand;
    const x = cx + rPx * Math.cos(p.theta);

    // Fade particles as energy transfers to the wall (qualitative): more transfer as z increases.
    const transferAtZ = inEmitter ? heatToWallFrac * smoothstep(0.02, 1.0, clamp(z, 0, 1)) : 0;
    const alpha = inEmitter ? lerp(0.9, 0.26, transferAtZ) : 0.35;
    const radius = inEmitter ? 2.0 : 1.7;

    return <circle key={i} cx={x} cy={y} r={radius} fill="#6c757d" opacity={alpha} />;
  });

  // Top view particle projection at each particle's z
  const topDots = particles.map((p, i) => {
    const z = clamp(p.z, 0, 1);
    const sliceR = frustumRadiusAtZ(inletR, outletR, z);
    const rMin = design.rMin ? design.rMin(z) : 0;
    const effectiveR = sliceR * clamp(p.r, rMin + 0.02, 0.98);

    const tcx = 520 / 2;
    const tcy = 340 / 2 + 10;
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

  const jetRpx = (jetDiaClamped / 2) * pxPerIn;

  // Axial swirler close-up slices (qualitative): show particles just before/over/just after the swirler.
  const swirlerZ0 = 0.06;
  const swirlerZ1 = 0.22;
  const swirlerZ2 = 0.34;

  // Side-cut fin segments for close-up (in panel pixel coordinates)
  const swirlerFinSegments = useMemo(() => {
    const segs: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];
    for (let i = 0; i < 3; i++) {
      const x0 = viewW / 2 - 70 + i * 70;
      const y0 = 140;
      const x1 = x0 + 46;
      const y1 = y0 + 70;
      segs.push({ x0, y0, x1, y1 });
    }
    return segs;
  }, [viewW]);

  const closestPointOnSegment = useMemo(() => {
    return (px: number, py: number, s: { x0: number; y0: number; x1: number; y1: number }) => {
      const vx = s.x1 - s.x0;
      const vy = s.y1 - s.y0;
      const wx = px - s.x0;
      const wy = py - s.y0;
      const vv = vx * vx + vy * vy;
      const t = vv > 0 ? clamp((wx * vx + wy * vy) / vv, 0, 1) : 0;
      return { x: s.x0 + t * vx, y: s.y0 + t * vy, t };
    };
  }, []);

  // IMPORTANT: compute every render (particles mutate in-place), so close-up dots animate.
  const swirlerSideDots = particles
    .filter((p) => p.z >= swirlerZ0 && p.z <= swirlerZ2)
    .map((p, i) => {
      const tZ = clamp((p.z - swirlerZ0) / Math.max(1e-6, swirlerZ2 - swirlerZ0), 0, 1);
      const xScale = 150;
      let x = viewW / 2 + xScale * clamp(p.r, 0, 1) * Math.cos(p.theta);
      let y = lerp(60, viewH - 40, tZ);

      // emphasize the swirler interaction band
      const inSwirler = p.z >= swirlerZ0 && p.z <= swirlerZ1;
      const alpha = inSwirler ? 0.65 : 0.35;
      const r = inSwirler ? 2.0 : 1.6;

      const contact = swirlerContactRef.current.get(p);

      if (contact) {
        // stay attached once a fin is hit
        const dz = Math.max(0, p.z - contact.zContact);
        const ride = clamp(dz / Math.max(1e-6, swirlerZ2 - swirlerZ0), 0, 1);
        const travel = lerp(8, 260, ride);
        x = contact.xContact + travel * contact.tx;
        y = contact.yContact + travel * contact.ty;
      } else if (inSwirler) {
        // first impact assignment
        let best:
          | {
              segIndex: number;
              x: number;
              y: number;
              d2: number;
            }
          | null = null;

        for (let segIndex = 0; segIndex < swirlerFinSegments.length; segIndex++) {
          const s = swirlerFinSegments[segIndex];
          const cp = closestPointOnSegment(x, y, s);
          const dx = x - cp.x;
          const dy = y - cp.y;
          const d2 = dx * dx + dy * dy;
          if (best == null || d2 < best.d2) best = { segIndex, x: cp.x, y: cp.y, d2 };
        }

        if (best && best.d2 < 14 * 14) {
          const s = swirlerFinSegments[best.segIndex];
          const vx = s.x1 - s.x0;
          const vy = s.y1 - s.y0;
          const v = Math.max(1e-6, Math.hypot(vx, vy));
          const tx = vx / v;
          const ty = vy / v;
          x = best.x;
          y = best.y;
          swirlerContactRef.current.set(p, {
            segIndex: best.segIndex,
            zContact: p.z,
            xContact: x,
            yContact: y,
            tx,
            ty,
          });
        }
      }
      return <circle key={i} cx={x} cy={y} r={r} fill="#6c757d" opacity={alpha} />;
    });

  const swirlerTopOuterR = topOuterR * 0.86; // close-up scale (~2x vs previous)
  const swirlerTopDots = particles
    .filter((p) => p.z >= swirlerZ1 && p.z <= swirlerZ2)
    .map((p, i) => {
      const effectiveR = swirlerTopOuterR * clamp(p.r, 0.12, 0.98);
      const x = tc.x + effectiveR * Math.cos(p.theta);
      const y = tc.y + effectiveR * Math.sin(p.theta);
      return <circle key={i} cx={x} cy={y} r={1.9} fill="#6c757d" opacity={0.55} />;
    });

  // Isometric-ish projection to relate side/top views (purely qualitative)
  const swirlerIsoDots = particles
    .filter((p) => p.z >= swirlerZ0 && p.z <= swirlerZ2)
    .map((p, i) => {
      const zt = clamp((p.z - swirlerZ0) / Math.max(1e-6, swirlerZ2 - swirlerZ0), 0, 1);
      const rIso = swirlerTopOuterR * 0.75 * clamp(p.r, 0.12, 0.98);
      const x = tc.x + rIso * Math.cos(p.theta) + (zt - 0.5) * 70;
      const y = tc.y + rIso * Math.sin(p.theta) - (zt - 0.5) * 55;
      const alpha = p.z <= swirlerZ1 ? 0.62 : 0.38;
      return <circle key={i} cx={x} cy={y} r={1.8} fill="#6c757d" opacity={alpha} />;
    });

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
          <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 18, fontWeight: 600, color: '#212529' }}>Flow Animation (wind-tunnel style)</h3>
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
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>
                    {d}\" 
                  </option>
                ))}
              </select>
            </label>
          </div>

          {design.overlay === 'centerbody' && (
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'block', marginBottom: 0 }}>
                <div style={{ fontSize: 13, color: '#495057', fontWeight: 500, marginBottom: 6 }}>Annular jet diameter</div>
                <select
                  value={jetDiaClamped}
                  onChange={(e) => setJetDiaIn(Number(e.target.value))}
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
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                    <option key={d} value={d}>
                      {d}\" 
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'block', marginBottom: 0 }}>
                <div style={{ fontSize: 13, color: '#495057', fontWeight: 500, marginBottom: 6 }}>Jet start above inlet</div>
                <select
                  value={jetStartClamped}
                  onChange={(e) => setJetStartIn(Number(e.target.value))}
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
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                    <option key={d} value={d}>
                      {d}\" 
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

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
              <path d={conePath} fill="#1a1a1a" opacity={0.1} stroke="#000" strokeWidth={2} />
              <path d={conePath} fill="none" stroke="#667eea" strokeWidth={3} opacity={clamp(0.08 + heatToWallFrac * 0.55, 0.08, 0.65)} />

              {design.overlay === 'centerbody' && (
                <path
                  d={`M ${cx} ${bottomY - 6} L ${cx - inletR * 0.16} ${bottomY - heightPx * 0.22} L ${cx} ${bottomY - heightPx * 0.40} L ${cx + inletR * 0.16} ${bottomY - heightPx * 0.22} Z`}
                  fill="#2f2f2f"
                  opacity={0.45}
                  stroke="#000"
                  strokeWidth={1.6}
                />
              )}

              {design.overlay === 'centerbody' && (
                <text x={16} y={40} fontSize={11} fill="#6c757d">
                  annular jet dia {jetDiaClamped}\", start {jetStartClamped}\" above inlet
                </text>
              )}

              {(design.overlay === 'statorOuter' ||
                design.overlay === 'statorFull' ||
                design.overlay === 'fins' ||
                design.overlay === 'propeller' ||
                design.overlay === 'centerbody') && (
                <line x1={cx - inletR} y1={bottomY - 14} x2={cx + inletR} y2={bottomY - 14} stroke="#adb5bd" strokeWidth={2} opacity={0.45} />
              )}

              {design.overlay === 'fins' && drawHelicalFins({ cx, topY, bottomY, inletR, outletR })}

              {sideDots}

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
              <circle cx={tc.x} cy={tc.y} r={topOuterR} fill="#151515" opacity={0.08} stroke="#000" strokeWidth={2} />
              <circle cx={tc.x} cy={tc.y} r={topInnerR} fill="#000" opacity={0.05} stroke="#000" strokeWidth={2} />

              {showStatorOuter && (
                <>
                  <circle cx={tc.x} cy={tc.y} r={topOuterR * 0.95} fill="none" stroke="#adb5bd" strokeWidth={1.6} opacity={0.4} />
                  <circle cx={tc.x} cy={tc.y} r={statorOuterInner} fill="none" stroke="#adb5bd" strokeWidth={1.6} opacity={0.25} />
                  {drawStatorVanes({ cx: tc.x, cy: tc.y, rOuter: topOuterR * 0.92, rInner: statorOuterInner, count: 12, swirl: -0.45, opacity: 0.55 })}
                </>
              )}

              {showStatorFull && (
                <>
                  <circle cx={tc.x} cy={tc.y} r={topOuterR * 0.95} fill="none" stroke="#adb5bd" strokeWidth={1.6} opacity={0.4} />
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
                    const r2 = topOuterR * 0.7;
                    const x1 = tc.x + r1 * Math.cos(a);
                    const y1 = tc.y + r1 * Math.sin(a);
                    const x2 = tc.x + r2 * Math.cos(a + 0.55);
                    const y2 = tc.y + r2 * Math.sin(a + 0.55);
                    return <path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#bdbdbd" strokeWidth={6} opacity={0.5} strokeLinecap="round" />;
                  })}
                </>
              )}

              {design.overlay === 'centerbody' && (
                <>
                  <circle cx={tc.x} cy={tc.y} r={jetRpx} fill="#2f2f2f" opacity={0.5} stroke="#000" strokeWidth={1.6} />
                  {[0, 1, 2, 3].map((i) => {
                    const a = (i / 4) * Math.PI * 2;
                    const r1 = jetRpx * 1.05;
                    const r2 = topOuterR * 0.78;
                    const x1 = tc.x + r1 * Math.cos(a);
                    const y1 = tc.y + r1 * Math.sin(a);
                    const x2 = tc.x + r2 * Math.cos(a + 0.55);
                    const y2 = tc.y + r2 * Math.sin(a + 0.55);
                    return <path key={i} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke="#bdbdbd" strokeWidth={5} opacity={0.48} strokeLinecap="round" />;
                  })}
                </>
              )}

              {topDots}

              <text x={16} y={24} fontSize={11} fill="#495057">
                Outer-only stator leaves a calmer core; full-annulus / propeller spins more of the plume.
              </text>
            </svg>
          ),
        })}
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
          title: 'Axial swirler — side cut (close-up)',
          subtitleRight: 'particle path + forces (qualitative)',
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
              <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#495057" opacity="0.7" />
                </marker>
              </defs>

              {/* Zoom window */}
              <rect x={12} y={40} width={viewW - 24} height={viewH - 60} rx={12} fill="#ffffff" stroke="#e9ecef" />

              {/* A few fins (side cut): tilted plates the flow rides over */}
              {[0, 1, 2].map((i) => {
                const x0 = viewW / 2 - 70 + i * 70;
                const y0 = 140;
                const x1 = x0 + 46;
                const y1 = y0 + 70;
                return (
                  <g key={i}>
                    <path d={`M ${x0} ${y0} L ${x1} ${y1}`} stroke="#bdbdbd" strokeWidth={10} opacity={0.55} strokeLinecap="round" />
                    <path d={`M ${x0} ${y0} L ${x1} ${y1}`} stroke="#000" strokeWidth={2} opacity={0.35} strokeLinecap="round" />
                  </g>
                );
              })}

              {/* Force vectors (qualitative) */}
              <g opacity={0.9}>
                <path d={`M ${viewW / 2} 98 L ${viewW / 2} 132`} stroke="#495057" strokeWidth={2.2} markerEnd="url(#arrow)" />
                <text x={viewW / 2 + 8} y={110} fontSize={11} fill="#495057">
                  axial push
                </text>

                <path d={`M ${viewW / 2 - 8} 178 L ${viewW / 2 + 48} 158`} stroke="#495057" strokeWidth={2.2} markerEnd="url(#arrow)" />
                <text x={viewW / 2 + 54} y={164} fontSize={11} fill="#495057">
                  turning → swirl
                </text>

                <path d={`M ${viewW / 2 + 30} 208 L ${viewW / 2 + 2} 236`} stroke="#495057" strokeWidth={2.2} markerEnd="url(#arrow)" opacity={0.65} />
                <text x={viewW / 2 + 34} y={238} fontSize={11} fill="#495057" opacity={0.85}>
                  drag/loss
                </text>
              </g>

              {/* Particles through the close-up region */}
              {swirlerSideDots}

              <text x={16} y={24} fontSize={11} fill="#495057">
                Particles ride over pitched fins; the fin reaction force adds tangential momentum (swirl).
              </text>
            </svg>
          ),
        })}

        {windTunnelPanel({
          title: 'Axial swirler — top view (close-up)',
          subtitleRight: '3 fins; induced tangential motion',
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
              <defs>
                <marker id="arrowTop" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#495057" opacity="0.7" />
                </marker>
              </defs>

              <circle cx={tc.x} cy={tc.y} r={swirlerTopOuterR} fill="#151515" opacity={0.03} stroke="#000" strokeWidth={1.6} />
              <circle cx={tc.x} cy={tc.y} r={topOuterR * 0.12} fill="#2f2f2f" opacity={0.55} stroke="#000" strokeWidth={1.6} />

              {/* Three fins (plan view): pitched vanes to add tangential velocity */}
              {[0, 1, 2].map((i) => {
                const a = (i / 3) * Math.PI * 2;
                const r1 = swirlerTopOuterR * 0.22;
                const r2 = swirlerTopOuterR * 0.92;
                const pitch = 0.62; // radians: visual pitch (not a claim about the real design)
                const chord = 0.22; // angular chord thickness
                return (
                  <g key={i}>
                    <path
                      d={`M ${tc.x} ${tc.y} L ${tc.x + r2 * Math.cos(a)} ${tc.y + r2 * Math.sin(a)}`}
                      stroke="#adb5bd"
                      strokeWidth={2}
                      opacity={0.22}
                      strokeDasharray="4 6"
                    />
                    {drawVanePlate({
                      cx: tc.x,
                      cy: tc.y,
                      rInner: r1,
                      rOuter: r2,
                      a0: a + pitch - chord * 0.5,
                      a1: a + pitch + chord * 0.5,
                      fill: '#bdbdbd',
                      fillOpacity: 0.52,
                      stroke: '#000',
                      strokeOpacity: 0.32,
                      strokeWidth: 1.4,
                    })}
                    {/* trailing edge hint */}
                    <path
                      d={`M ${tc.x + r1 * Math.cos(a + pitch + chord * 0.5)} ${tc.y + r1 * Math.sin(a + pitch + chord * 0.5)} L ${tc.x + r2 * Math.cos(a + pitch + chord * 0.5)} ${tc.y + r2 * Math.sin(a + pitch + chord * 0.5)}`}
                      stroke="#000"
                      strokeWidth={1.2}
                      opacity={0.18}
                    />
                  </g>
                );
              })}

              {/* Tangential force cue */}
              <path
                d={`M ${tc.x + swirlerTopOuterR * 0.10} ${tc.y - swirlerTopOuterR * 0.68} A ${swirlerTopOuterR * 0.68} ${swirlerTopOuterR * 0.68} 0 0 1 ${tc.x + swirlerTopOuterR * 0.68} ${tc.y - swirlerTopOuterR * 0.10}`}
                fill="none"
                stroke="#495057"
                strokeWidth={2}
                opacity={0.65}
                markerEnd="url(#arrowTop)"
              />
              <text x={tc.x + swirlerTopOuterR * 0.28} y={tc.y - swirlerTopOuterR * 0.78} fontSize={11} fill="#495057" opacity={0.9}>
                tangential impulse
              </text>

              {swirlerTopDots}
              <text x={16} y={24} fontSize={11} fill="#495057">
                If the fins are straight (no pitch), they won’t add swirl — the pitch is what creates tangential momentum.
              </text>
            </svg>
          ),
        })}
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
          title: 'Axial swirler — isometric (close-up)',
          subtitleRight: 'same fins; projected in 3D',
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
              <defs>
                <marker id="arrowIso" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#495057" opacity="0.7" />
                </marker>
              </defs>

              {(() => {
                // simple isometric projection
                const iso = {
                  ox: tc.x,
                  oy: tc.y + 10,
                  sx: 1.0,
                  sy: 0.62,
                  zx: 78,
                  zy: 64,
                };

                const proj = (r: number, theta: number, z: number) => {
                  const x = iso.ox + iso.sx * r * Math.cos(theta) + (z - 0.5) * iso.zx;
                  const y = iso.oy + iso.sy * r * Math.sin(theta) - (z - 0.5) * iso.zy;
                  return { x, y };
                };

                const rTube = swirlerTopOuterR * 0.82;
                const zBottom = 0.10;
                const zTop = 0.90;

                // tube rings
                const ring = (z: number, opacity: number, strokeOpacity: number) => {
                  const c = proj(0, 0, z);
                  return (
                    <ellipse
                      cx={c.x}
                      cy={c.y}
                      rx={rTube}
                      ry={rTube * iso.sy}
                      fill="#151515"
                      opacity={opacity}
                      stroke="#000"
                      strokeWidth={1.4}
                      strokeOpacity={strokeOpacity}
                    />
                  );
                };

                const vanes = [0, 1, 2].map((i) => {
                  const a = (i / 3) * Math.PI * 2;
                  const pitch = 0.62;
                  const chord = 0.22;
                  const r1 = rTube * 0.30;
                  const r2 = rTube * 0.92;
                  const zV = 0.55;

                  // two edges of vane sector, projected at a fixed z
                  const p0o = proj(r2, a + pitch - chord * 0.5, zV);
                  const p1o = proj(r2, a + pitch + chord * 0.5, zV);
                  const p1i = proj(r1, a + pitch + chord * 0.5, zV);
                  const p0i = proj(r1, a + pitch - chord * 0.5, zV);

                  return (
                    <g key={i}>
                      <path
                        d={`M ${p0o.x} ${p0o.y} L ${p1o.x} ${p1o.y} L ${p1i.x} ${p1i.y} L ${p0i.x} ${p0i.y} Z`}
                        fill="#bdbdbd"
                        opacity={0.52}
                        stroke="#000"
                        strokeWidth={1.2}
                        strokeOpacity={0.28}
                      />
                    </g>
                  );
                });

                const dots = particles
                  .filter((p) => p.z >= swirlerZ0 && p.z <= swirlerZ2)
                  .map((p, i) => {
                    const rIso = rTube * clamp(p.r, 0.12, 0.98);
                    const z = clamp((p.z - swirlerZ0) / Math.max(1e-6, swirlerZ2 - swirlerZ0), 0, 1);
                    const pt = proj(rIso, p.theta, lerp(zBottom, zTop, z));
                    const alpha = p.z <= swirlerZ1 ? 0.62 : 0.38;
                    return <circle key={i} cx={pt.x} cy={pt.y} r={1.8} fill="#6c757d" opacity={alpha} />;
                  });

                const pAx0 = proj(rTube * 1.05, Math.PI * 0.92, zBottom);
                const pAx1 = proj(rTube * 1.05, Math.PI * 0.92, zTop);

                return (
                  <>
                    {ring(zTop, 0.02, 0.18)}
                    {ring(zBottom, 0.03, 0.24)}
                    <path
                      d={`M ${proj(rTube, Math.PI * 0.15, zBottom).x} ${proj(rTube, Math.PI * 0.15, zBottom).y} L ${proj(rTube, Math.PI * 0.15, zTop).x} ${proj(rTube, Math.PI * 0.15, zTop).y}`}
                      stroke="#000"
                      strokeWidth={1.2}
                      opacity={0.16}
                    />
                    <path
                      d={`M ${proj(rTube, Math.PI * 1.15, zBottom).x} ${proj(rTube, Math.PI * 1.15, zBottom).y} L ${proj(rTube, Math.PI * 1.15, zTop).x} ${proj(rTube, Math.PI * 1.15, zTop).y}`}
                      stroke="#000"
                      strokeWidth={1.2}
                      opacity={0.16}
                    />

                    {vanes}
                    {dots}

                    <path d={`M ${pAx0.x} ${pAx0.y} L ${pAx1.x} ${pAx1.y}`} stroke="#495057" strokeWidth={2} opacity={0.55} markerEnd="url(#arrowIso)" />
                    <text x={pAx0.x - 22} y={pAx0.y + 14} fontSize={11} fill="#495057" opacity={0.85}>
                      axial
                    </text>

                    <path
                      d={`M ${proj(rTube * 0.2, -0.2, 0.6).x} ${proj(rTube * 0.2, -0.2, 0.6).y} A 70 45 0 0 1 ${proj(rTube * 0.2, 1.2, 0.6).x} ${proj(rTube * 0.2, 1.2, 0.6).y}`}
                      fill="none"
                      stroke="#495057"
                      strokeWidth={2}
                      opacity={0.55}
                      markerEnd="url(#arrowIso)"
                    />
                    <text x={tc.x + 70} y={tc.y - 36} fontSize={11} fill="#495057" opacity={0.85}>
                      swirl
                    </text>
                  </>
                );
              })()}

              <text x={16} y={24} fontSize={11} fill="#495057">
                Same pitched vanes; this just projects radius + height into one view.
              </text>
            </svg>
          ),
        })}

        {windTunnelPanel({
          title: 'Axial swirler — bottom view (close-up)',
          subtitleRight: 'looking up into the vanes',
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
              <defs>
                <marker id="arrowBot" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#495057" opacity="0.7" />
                </marker>
              </defs>

              <circle cx={tc.x} cy={tc.y} r={swirlerTopOuterR} fill="#151515" opacity={0.03} stroke="#000" strokeWidth={1.6} />
              <circle cx={tc.x} cy={tc.y} r={topOuterR * 0.12} fill="#2f2f2f" opacity={0.55} stroke="#000" strokeWidth={1.6} />

              {[0, 1, 2].map((i) => {
                const a = (i / 3) * Math.PI * 2;
                const r1 = swirlerTopOuterR * 0.22;
                const r2 = swirlerTopOuterR * 0.92;
                const pitch = -0.62; // mirrored when looking from bottom
                const chord = 0.22;
                return (
                  <g key={i}>
                    {drawVanePlate({
                      cx: tc.x,
                      cy: tc.y,
                      rInner: r1,
                      rOuter: r2,
                      a0: a + pitch - chord * 0.5,
                      a1: a + pitch + chord * 0.5,
                      fill: '#bdbdbd',
                      fillOpacity: 0.52,
                      stroke: '#000',
                      strokeOpacity: 0.32,
                      strokeWidth: 1.4,
                    })}
                  </g>
                );
              })}

              <path
                d={`M ${tc.x - swirlerTopOuterR * 0.2} ${tc.y + swirlerTopOuterR * 0.72} A ${swirlerTopOuterR * 0.72} ${swirlerTopOuterR * 0.72} 0 0 0 ${tc.x - swirlerTopOuterR * 0.72} ${tc.y + swirlerTopOuterR * 0.2}`}
                fill="none"
                stroke="#495057"
                strokeWidth={2}
                opacity={0.55}
                markerEnd="url(#arrowBot)"
              />
              <text x={tc.x - swirlerTopOuterR * 0.68} y={tc.y + swirlerTopOuterR * 0.84} fontSize={11} fill="#495057" opacity={0.85}>
                swirl
              </text>

              {/* reuse the same particle slice as top view */}
              {swirlerTopDots}

              <text x={16} y={24} fontSize={11} fill="#495057">
                Bottom view is the same vanes, mirrored as if you’re looking up into the emitter.
              </text>
            </svg>
          ),
        })}
      </div>

      <div style={{ marginTop: 14, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 12, padding: 14 }}>
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
              <div style={{ marginTop: 6, fontSize: 12, color: '#6c757d' }}>
                Restriction (outlet-only): ×{restrictionIndexOutletOnly.toFixed(2)}; backpressure risk: <strong>{backpressureFlag}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#6c757d' }}>
                With side ports: ×{restrictionIndexWithPorts.toFixed(2)} (assumes {sidePortCount}×{sidePortDiaIn}\")
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
                Restriction/backpressure is shown as a relative index based on open vent area (not a CFD pressure prediction).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
