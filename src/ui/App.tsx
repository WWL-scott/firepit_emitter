import React, { useMemo, useState } from 'react';
import { presetSmooth, presetRamp, presetStatorRamp } from '../model/defaults';
import type { Config } from '../model/schema';
import { calcResults } from '../model/calc';
import { NumberField } from './components/NumberField';
import { SelectField } from './components/SelectField';
import { LineChart } from './components/LineChart';

type PresetKey = 'smooth' | 'ramp' | 'statorRamp' | 'custom';

const presets: Record<Exclude<PresetKey,'custom'>, () => Config> = {
  smooth: presetSmooth,
  ramp: presetRamp,
  statorRamp: presetStatorRamp,
};

export function App() {
  const [preset, setPreset] = useState<PresetKey>('statorRamp');
  const [cfg, setCfg] = useState<Config>(() => presetStatorRamp());

  function applyPreset(p: PresetKey) {
    setPreset(p);
    if (p === 'custom') return;
    setCfg(presets[p]());
  }

  const results = useMemo(() => calcResults(cfg), [cfg]);

  const distances = cfg.distancesFromSurfaceFt;
  const series = [
    { name: 'Absorbed IR (standing, W)', x: distances, y: results.absorbedStandingW },
    { name: 'Absorbed IR (seated, W)', x: distances, y: results.absorbedSeatedW },
  ];

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ margin: 0 }}>Firepit Emitter Lab</h1>
      <p style={{ marginTop: 6, color: '#444' }}>
        Variable-driven model for emitter-only designs (flat-plate stator + tapered ramp). Early-stage approximation.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Inputs</h3>

          <SelectField
            label="Preset"
            value={preset}
            options={[
              { value: 'smooth', label: 'Smooth wall' },
              { value: 'ramp', label: 'Ramp only' },
              { value: 'statorRamp', label: 'Stator + ramp' },
              { value: 'custom', label: 'Custom (edit freely)' },
            ]}
            onChange={(v) => applyPreset(v as PresetKey)}
          />

          <hr />

          <NumberField label="Burner (BTU/h)" value={cfg.burnerBtuPerHr} onChange={(v) => setCfg({ ...cfg, burnerBtuPerHr: v })} />
          <NumberField label="Convective plume fraction" value={cfg.convectivePlumeFraction} step={0.01} onChange={(v) => setCfg({ ...cfg, convectivePlumeFraction: v })} />
          <NumberField label="Capture fraction at inlet" value={cfg.captureFraction} step={0.01} onChange={(v) => setCfg({ ...cfg, captureFraction: v })} />
          <NumberField label="Bypass fraction (damper/leaks)" value={cfg.bypassFraction} step={0.01} onChange={(v) => setCfg({ ...cfg, bypassFraction: v })} />
          <NumberField label="UA (W/K)" value={cfg.UA_W_per_K} step={1} onChange={(v) => setCfg({ ...cfg, UA_W_per_K: v, scenario: 'custom' })} />
          <NumberField label="C effective (W/K) — m_dot*c_p proxy" value={cfg.C_effective_W_per_K} step={0.5} onChange={(v) => setCfg({ ...cfg, C_effective_W_per_K: v })} />

          <hr />

          <NumberField label="etaRad — radiant fraction of wall heat" value={cfg.etaRad} step={0.01} onChange={(v) => setCfg({ ...cfg, etaRad: v })} />
          <NumberField label="etaOut — outward delivery factor" value={cfg.etaOut} step={0.01} onChange={(v) => setCfg({ ...cfg, etaOut: v })} />

          <p style={{ fontSize: 12, color: '#555', marginTop: 10 }}>
            Next: editable distance list + scenario compare mode + JSON/CSV export.
          </p>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Results</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Kpi label="Burner power" value={`${(results.burnerPowerW / 1000).toFixed(2)} kW`} />
            <Kpi label="Wall captured" value={`${(results.wallCapturedW / 1000).toFixed(2)} kW`} />
            <Kpi label="IR out (effective)" value={`${(results.radiantOutW / 1000).toFixed(2)} kW`} />
            <Kpi label="Avg radius" value={`${results.effectiveRadiusFt.toFixed(2)} ft`} />
          </div>

          <div style={{ marginTop: 16 }}>
            <LineChart width={680} height={360} series={series} xLabel="Distance from emitter surface (ft)" yLabel="Absorbed IR (W)" />
          </div>

          <details style={{ marginTop: 12 }}>
            <summary>Show raw results JSON</summary>
            <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
{JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: '#555' }}>
        Archived concept PDFs/images are under <code>public/archive/</code> (copied from the session outputs).
      </p>
    </div>
  );
}

function Kpi(props: { label: string; value: string }) {
  return (
    <div style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 12, padding: 10 }}>
      <div style={{ fontSize: 12, color: '#666' }}>{props.label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{props.value}</div>
    </div>
  );
}
