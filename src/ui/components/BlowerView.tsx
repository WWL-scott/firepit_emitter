import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Config } from '../../model/schema';
import { calcResults } from '../../model/calc';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type Dot = {
  x: number; // -1..1
  y: number; // 0..1 (bottom->top)
  r: number; // 0..1
  seed: number;
};

function makeDot(seed: number): Dot {
  const a = (seed * 9301 + 49297) % 233280;
  const b = (seed * 233280 + 49297) % 9301;
  const u = a / 233280;
  const v = b / 9301;

  // distribute across the duct cross-section (biased slightly toward center so it's readable)
  const theta = u * 2 * Math.PI;
  const rr = Math.sqrt(clamp(0.15 + 0.85 * v, 0, 1));

  return {
    x: rr * Math.cos(theta),
    r: rr,
    y: v,
    seed,
  };
}

function turbinePanel(props: {
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

export function BlowerView(props: { config: Config }) {
  // --- Assumptions (explicit, tunable ranges) ---
  // We use C_effective_W_per_K ≈ ṁ·cp to infer mass flow.
  // Wind energy uses kinetic power in the exhaust stream: P_k = 0.5·ṁ·V² = 0.5·ρ·A·V³.
  const cpJPerKgK = 1005; // air, near room temp (order-of-magnitude ok)
  const rhoRange = { min: 0.80, max: 1.20 }; // kg/m^3 (hot exhaust is less dense)
  const outletDiaIn = clamp(props.config.outletDiameterIn, 0.5, 24);
  const outletDiaLabel = Number.isFinite(outletDiaIn)
    ? outletDiaIn % 1 === 0
      ? outletDiaIn.toFixed(0)
      : outletDiaIn.toFixed(1)
    : '—';

  const baseResults = useMemo(() => calcResults(props.config), [props.config]);

  const blower = useMemo(() => {
    const C = Math.max(0.01, props.config.C_effective_W_per_K);
    const mDot = C / cpJPerKgK; // kg/s

    const D = outletDiaIn * 0.0254; // m
    const A = (Math.PI * D * D) / 4; // m^2

    const Qmin = mDot / rhoRange.max;
    const Qmax = mDot / rhoRange.min;

    const Vmin = Qmin / Math.max(1e-9, A);
    const Vmax = Qmax / Math.max(1e-9, A);

    // Kinetic power in the stream.
    // With mass flow fixed (mDot inferred from C ≈ mDot·cp), the consistent form is:
    //   Pk = 0.5 * mDot * V^2
    // where V comes from Q/A and Q = mDot/ρ.
    // Using the density bounds, power is minimized at high density (lower V) and maximized at low density (higher V).
    const PkMin = 0.5 * mDot * Vmin * Vmin;
    const PkMax = 0.5 * mDot * Vmax * Vmax;

    // Real extractable shaft power depends on turbine/duct losses.
    // Use a conservative “capture efficiency” band for a small in-duct rotor.
    const mechEff = { min: 0.10, max: 0.35 };
    const PshaftMin = PkMin * mechEff.min;
    const PshaftMax = PkMax * mechEff.max;

    return {
      mDot,
      A,
      Qmin,
      Qmax,
      Vmin,
      Vmax,
      PkMin,
      PkMax,
      PshaftMin,
      PshaftMax,
      mechEff,
    };
  }, [props.config.C_effective_W_per_K, outletDiaIn]);

  // --- Animation state ---
  const [turbineRads, setTurbineRads] = useState(0);
  const [ringFanRads, setRingFanRads] = useState(0);
  const [pumpRads, setPumpRads] = useState(0);

  const dots1Ref = useRef<Dot[]>([]);
  const dots2Ref = useRef<Dot[]>([]);
  const lastTRef = useRef<number | null>(null);
  const [, bump] = useState(0);

  const dotCount = 140;
  useMemo(() => {
    dots1Ref.current = [...Array(dotCount)].map((_, i) => makeDot(i + 1));
    dots2Ref.current = [...Array(dotCount)].map((_, i) => makeDot(i + 10_001));
    return null;
  }, [dotCount]);

  useEffect(() => {
    let raf = 0;
    lastTRef.current = null;

    // Visual speed scale (doesn't change computed numbers; purely rendering)
    const pxPerSFromV = (Vms: number) => Vms * 40; // tuned for readability

    const tick = (tMs: number) => {
      if (lastTRef.current == null) lastTRef.current = tMs;
      const dt = clamp((tMs - lastTRef.current) / 1000, 0, 0.05);
      lastTRef.current = tMs;

      // Use midpoint velocity for animation rate
      const Vmid = (blower.Vmin + blower.Vmax) / 2;
      const vY = pxPerSFromV(Vmid);

      // Dots move upward in normalized space.
      const dy = (vY * dt) / 420;
      for (const d of dots1Ref.current) {
        d.y += dy;
        if (d.y > 1.05) d.y = -0.05;
      }
      for (const d of dots2Ref.current) {
        d.y += dy;
        if (d.y > 1.05) d.y = -0.05;
      }

      // Rotor speeds ~ proportional to flow speed (qualitative).
      // Keep directions consistent (clockwise) across panels.
      const omega = 1.4 + Vmid * 0.45; // rad/s
      setTurbineRads((a) => a + omega * dt);
      setRingFanRads((a) => a + omega * 0.75 * dt);
      setPumpRads((a) => a + omega * 0.85 * dt);

      bump((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [blower.Vmin, blower.Vmax]);

  const subtitle = useMemo(() => {
    const q0 = blower.Qmin * 2118.88; // m^3/s -> CFM
    const q1 = blower.Qmax * 2118.88;
    return `${outletDiaLabel}\" outlet: ${(q0).toFixed(0)}–${(q1).toFixed(0)} CFM (est.)`;
  }, [blower.Qmin, blower.Qmax, outletDiaLabel]);

  const stats = useMemo(() => {
    const fmt = (x: number, digits = 2) => (Number.isFinite(x) ? x.toFixed(digits) : '—');
    const q0 = blower.Qmin * 2118.88;
    const q1 = blower.Qmax * 2118.88;

    return {
      mDot: fmt(blower.mDot, 3),
      qCfm: `${q0.toFixed(0)}–${q1.toFixed(0)}`,
      v: `${fmt(blower.Vmin, 1)}–${fmt(blower.Vmax, 1)}`,
      pk: `${fmt(blower.PkMin, 1)}–${fmt(blower.PkMax, 1)}`,
      pshaft: `${fmt(blower.PshaftMin, 1)}–${fmt(blower.PshaftMax, 1)}`,
    };
  }, [blower]);

  // --- Shared drawing constants ---
  const w = 520;
  const h = 340;
  const ductW = 120;
  const ductX0 = w / 2 - ductW / 2;
  const ductX1 = w / 2 + ductW / 2;
  const ductY0 = 54;
  const ductY1 = h - 26;
  const rotorY = ductY0 + 72;

  const drawRotor = (cx: number, cy: number, r: number, a: number) => {
    const blades: React.ReactNode[] = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const th = a + (i / n) * Math.PI * 2;
      const x0 = cx + r * 0.15 * Math.cos(th);
      const y0 = cy + r * 0.15 * Math.sin(th);
      const x1 = cx + r * 0.92 * Math.cos(th);
      const y1 = cy + r * 0.92 * Math.sin(th);
      blades.push(
        <path
          key={i}
          d={`M ${x0} ${y0} L ${x1} ${y1}`}
          stroke="#6c757d"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.85}
        />
      );
    }
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#adb5bd" strokeWidth={2} opacity={0.9} />
        {blades}
        <circle cx={cx} cy={cy} r={5} fill="#6c757d" opacity={0.9} />
      </g>
    );
  };

  const dotsToCircles = (dots: Dot[]) => {
    return dots.map((d, i) => {
      const x = lerp(ductX0 + 10, ductX1 - 10, (d.x + 1) / 2);
      const y = lerp(ductY1, ductY0, d.y);
      const alpha = d.y > 0.72 ? 0.35 : 0.55;
      const rr = d.y > 0.72 ? 1.6 : 1.9;
      return <circle key={i} cx={x} cy={y} r={rr} fill="#6c757d" opacity={alpha} />;
    });
  };

  return (
    <div>
      <div
        style={{
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 6, fontSize: 18, fontWeight: 600, color: '#212529' }}>🌀 Blower (wind energy)</h3>
        <div style={{ color: '#6c757d', fontSize: 12, lineHeight: 1.5 }}>
          Estimates the exhaust stream’s airflow and kinetic power through the current outlet diameter, then visualizes two ways that a small turbine could
          turn that wind into useful forced convection around occupants.
        </div>

        <div style={{ marginTop: 14, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 6 }}>Assumptions</div>
              <div style={{ fontSize: 12, color: '#212529', lineHeight: 1.55 }}>
                <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  C ≈ ṁ·cp; cp ≈ {cpJPerKgK} J/kg·K
                  <br />
                  ρ ≈ {rhoRange.min.toFixed(2)}–{rhoRange.max.toFixed(2)} kg/m³
                  <br />
                  D_outlet = {outletDiaLabel}\" → A = πD²/4
                  <br />
                  V = Q/A; P_k = 0.5·ṁ·V² (= 0.5·ρ·A·V³)
                </div>
                <div style={{ marginTop: 8, color: '#6c757d' }}>
                  Note: This is wind/flow energy only (not thermal). Shaft power depends strongly on rotor design + losses.
                </div>
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 6 }}>Estimated flow (from current inputs)</div>
              <div style={{ fontSize: 13, color: '#212529', lineHeight: 1.6 }}>
                <div>ṁ (mass flow): {stats.mDot} kg/s</div>
                <div>Q (volume flow): {stats.qCfm} CFM</div>
                <div>V (exit speed): {stats.v} m/s</div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#6c757d' }}>Uses C = {props.config.C_effective_W_per_K.toFixed(1)} W/K from the model inputs.</div>
              </div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e9ecef', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 6 }}>Kinetic / usable power (order-of-magnitude)</div>
              <div style={{ fontSize: 13, color: '#212529', lineHeight: 1.6 }}>
                <div>P_k (stream): {stats.pk} W</div>
                <div>
                  P_shaft (capturable): {stats.pshaft} W ({(blower.mechEff.min * 100).toFixed(0)}–{(blower.mechEff.max * 100).toFixed(0)}%)
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#6c757d' }}>Compare to small USB fans: ~1–5 W electrical input.</div>
              </div>
            </div>
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
          {turbinePanel({
            title: 'Concept A — in-duct turbine drives a ring fan (downwash) around the emitter',
            subtitleRight: subtitle,
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
                {/* Duct */}
                <rect x={ductX0} y={ductY0} width={ductW} height={ductY1 - ductY0} rx={12} fill="#1a1a1a" opacity={0.06} stroke="#adb5bd" strokeWidth={2} />

                {/* Flow straighteners (shown above rotor, outside emitter) */}
                <g opacity={0.45}>
                  {[...Array(6)].map((_, i) => {
                    const x = lerp(ductX0 + 16, ductX1 - 16, i / 5);
                    return <line key={i} x1={x} y1={ductY0 + 18} x2={x} y2={ductY0 + 46} stroke="#adb5bd" strokeWidth={2} strokeLinecap="round" />;
                  })}
                </g>

                {/* Particles */}
                {dotsToCircles(dots1Ref.current)}

                {/* Turbine */}
                <g transform={`rotate(${(-turbineRads * 180) / Math.PI} ${w / 2} ${rotorY})`}>
                  {drawRotor(w / 2, rotorY, 36, 0)}
                </g>

                {/* Emitter silhouette + ring fan */}
                <g>
                  <path
                    d={`M ${w / 2 - 90} ${ductY1 + 12} L ${w / 2 - 50} ${ductY0 + 150} L ${w / 2 + 50} ${ductY0 + 150} L ${w / 2 + 90} ${ductY1 + 12} Z`}
                    fill="#667eea"
                    opacity={0.08}
                    stroke="#667eea"
                    strokeWidth={2}
                    strokeOpacity={0.35}
                  />

                  <g transform={`rotate(${(-ringFanRads * 180) / Math.PI} ${w / 2} ${ductY0 + 210})`}>
                    <circle cx={w / 2} cy={ductY0 + 210} r={72} fill="none" stroke="#adb5bd" strokeWidth={2} opacity={0.85} />
                    {[...Array(10)].map((_, i) => {
                      const th = (i / 10) * Math.PI * 2;
                      const x0 = w / 2 + 48 * Math.cos(th);
                      const y0 = ductY0 + 210 + 48 * Math.sin(th);
                      const x1 = w / 2 + 70 * Math.cos(th + 0.22);
                      const y1 = ductY0 + 210 + 70 * Math.sin(th + 0.22);
                      return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#6c757d" strokeWidth={3} strokeLinecap="round" opacity={0.75} />;
                    })}
                  </g>

                  {/* Downwash hint */}
                  <g opacity={0.65}>
                    {[...Array(6)].map((_, i) => {
                      const x = lerp(w / 2 - 110, w / 2 + 110, i / 5);
                      return <path key={i} d={`M ${x} ${ductY0 + 238} L ${x} ${ductY0 + 310}`} stroke="#667eea" strokeWidth={2} strokeLinecap="round" opacity={0.35} />;
                    })}
                  </g>
                </g>

                <text x={16} y={24} fontSize={11} fill="#495057">
                  Exhaust turns a small turbine; shaft drives an external ring fan that pushes air downward.
                </text>
              </svg>
            ),
          })}

          {turbinePanel({
            title: 'Concept B — in-duct turbine drives a small air pump (annular jets down the emitter)',
            subtitleRight: subtitle,
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
                {/* Duct */}
                <rect x={ductX0} y={ductY0} width={ductW} height={ductY1 - ductY0} rx={12} fill="#1a1a1a" opacity={0.06} stroke="#adb5bd" strokeWidth={2} />

                {/* Flow straighteners */}
                <g opacity={0.45}>
                  {[...Array(6)].map((_, i) => {
                    const x = lerp(ductX0 + 16, ductX1 - 16, i / 5);
                    return <line key={i} x1={x} y1={ductY0 + 18} x2={x} y2={ductY0 + 46} stroke="#adb5bd" strokeWidth={2} strokeLinecap="round" />;
                  })}
                </g>

                {/* Particles */}
                {dotsToCircles(dots2Ref.current)}

                {/* Turbine */}
                <g transform={`rotate(${(-turbineRads * 180) / Math.PI} ${w / 2} ${rotorY})`}>
                  {drawRotor(w / 2, rotorY, 36, 0)}
                </g>

                {/* Pump / blower icon */}
                <g transform={`translate(${w / 2 + 110} ${rotorY + 20})`}>
                  <g transform={`rotate(${(-pumpRads * 180) / Math.PI} 0 0)`}>
                    <circle cx={0} cy={0} r={20} fill="none" stroke="#adb5bd" strokeWidth={2} />
                    {[...Array(5)].map((_, i) => {
                      const th = (i / 5) * Math.PI * 2;
                      const x0 = 6 * Math.cos(th);
                      const y0 = 6 * Math.sin(th);
                      const x1 = 18 * Math.cos(th + 0.35);
                      const y1 = 18 * Math.sin(th + 0.35);
                      return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#6c757d" strokeWidth={3} strokeLinecap="round" opacity={0.8} />;
                    })}
                  </g>
                  <path d="M -30 0 L -72 0" stroke="#adb5bd" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
                  <path d="M 22 0 L 72 0" stroke="#adb5bd" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
                </g>

                {/* Emitter silhouette + annular jets */}
                <g>
                  <path
                    d={`M ${w / 2 - 90} ${ductY1 + 12} L ${w / 2 - 50} ${ductY0 + 150} L ${w / 2 + 50} ${ductY0 + 150} L ${w / 2 + 90} ${ductY1 + 12} Z`}
                    fill="#667eea"
                    opacity={0.08}
                    stroke="#667eea"
                    strokeWidth={2}
                    strokeOpacity={0.35}
                  />

                  <g opacity={0.60}>
                    {[...Array(8)].map((_, i) => {
                      const t = i / 7;
                      const x = lerp(w / 2 - 78, w / 2 + 78, t);
                      return <path key={i} d={`M ${x} ${ductY0 + 190} L ${x} ${ductY0 + 310}`} stroke="#667eea" strokeWidth={2} strokeLinecap="round" opacity={0.30} />;
                    })}
                  </g>
                </g>

                <text x={16} y={24} fontSize={11} fill="#495057">
                  Exhaust spins a turbine; shaft drives a small pump feeding annular jets for forced convection.
                </text>
              </svg>
            ),
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#6c757d' }}>
          Using current model inputs: burner {baseResults.burnerPowerW.toFixed(0)} W; captured plume {baseResults.capturedPlumeW.toFixed(0)} W (for reference only).
        </div>
      </div>
    </div>
  );
}
