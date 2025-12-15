import React, { useMemo, useState } from 'react';
import { presetSmooth, presetRamp, presetStatorRamp } from '../model/defaults';
import type { Config } from '../model/schema';
import { calcResults } from '../model/calc';
import { NumberField } from './components/NumberField';
import { SelectField } from './components/SelectField';
import { LineChart } from './components/LineChart';
import { Tooltip } from './components/Tooltip';
import { VisualView } from './components/VisualView';
import { StackAnalysisChart } from './components/StackAnalysisChart';
import { OutletDiameterComparison } from './components/OutletDiameterComparison';

type PresetKey = 'smooth' | 'ramp' | 'statorRamp' | 'custom';
type ViewMode = 'main' | 'visual' | 'analysis' | 'docs';

const presets: Record<Exclude<PresetKey,'custom'>, () => Config> = {
  smooth: presetSmooth,
  ramp: presetRamp,
  statorRamp: presetStatorRamp,
};

export function App() {
  const [preset, setPreset] = useState<PresetKey>('statorRamp');
  const [cfg, setCfg] = useState<Config>(() => presetStatorRamp());
  const [viewMode, setViewMode] = useState<ViewMode>('main');

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
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      padding: '24px', 
      maxWidth: 1600, 
      margin: '0 auto',
      background: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)',
      minHeight: '100vh'
    }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: 36, 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🔥 Firepit Emitter Lab
        </h1>
        <p style={{ marginTop: 8, color: '#6c757d', fontSize: 15, lineHeight: 1.5 }}>
          Variable-driven thermal model for emitter-only designs (stator + ramp). Engineering approximation for concept validation.
        </p>

        {/* Navigation Tabs */}
        <div style={{ 
          marginTop: 16, 
          display: 'flex', 
          gap: 8,
          borderBottom: '2px solid #e9ecef',
          paddingBottom: 2
        }}>
          {[
            { key: 'main', label: '📊 Main Dashboard', icon: '📊' },
            { key: 'visual', label: '🎨 Visual Model', icon: '🎨' },
            { key: 'analysis', label: '📈 Analysis & Charts', icon: '📈' },
            { key: 'docs', label: '📚 Documentation', icon: '📚' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as ViewMode)}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: viewMode === tab.key ? '#667eea' : 'transparent',
                color: viewMode === tab.key ? 'white' : '#6c757d',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.2s',
                borderBottom: viewMode === tab.key ? 'none' : '2px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (viewMode !== tab.key) {
                  e.currentTarget.style.background = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== tab.key) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Dashboard View */}
      {viewMode === 'main' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(400px, 450px) 1fr', 
          gap: 20,
          alignItems: 'start'
        }}>
          <div style={{ 
            background: 'white',
            border: '1px solid #e9ecef', 
            borderRadius: 16, 
            padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 24
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: 16,
              fontSize: 18,
              fontWeight: 600,
              color: '#212529'
            }}>⚙️ Input Parameters</h3>

            <SelectField
              label="Preset Configuration"
              value={preset}
              options={[
                { value: 'smooth', label: 'Smooth wall' },
                { value: 'ramp', label: 'Ramp only' },
                { value: 'statorRamp', label: 'Stator + ramp' },
                { value: 'custom', label: 'Custom (edit freely)' },
              ]}
              onChange={(v) => applyPreset(v as PresetKey)}
            />
            <Tooltip
              title="Preset Configuration"
              description="Pre-configured scenarios with different wall geometries and heat transfer characteristics. Each preset has optimized UA values based on expected swirl and surface enhancement."
              relationships={[
                'Smooth: Minimal turbulence, lowest UA (~12 W/K)',
                'Ramp: Tapered walls create moderate swirl, medium UA (~20 W/K)',
                'Stator+Ramp: Maximum turbulence from stator blades, highest UA (~28 W/K)'
              ]}
            />

            <hr />

            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#495057', marginBottom: 12 }}>Heat Source</h4>
            
            <NumberField 
              label="Burner Power (BTU/h)" 
              value={cfg.burnerBtuPerHr} 
              onChange={(v) => setCfg({ ...cfg, burnerBtuPerHr: v })} 
            />
            <Tooltip
              title="Burner Power"
              description="Total heat input from the gas burner, measured in British Thermal Units per hour."
              formula="P_burner [W] = BTU/h × 0.29307107"
              units="BTU/h (British Thermal Units per hour)"
              relationships={[
                'Higher BTU → More total heat available',
                'Typical patio firepits: 30,000-70,000 BTU/h',
                'Determines maximum possible radiant output'
              ]}
            />

            <NumberField 
              label="Convective Plume Fraction" 
              value={cfg.convectivePlumeFraction} 
              step={0.01} 
              onChange={(v) => setCfg({ ...cfg, convectivePlumeFraction: v })} 
            />
            <Tooltip
              title="Convective Plume Fraction"
              description="Portion of burner power that goes into hot rising gas (plume), rather than direct radiation from the flame."
              formula="P_plume = P_burner × f_conv"
              units="Dimensionless fraction (0-1)"
              relationships={[
                'Typical range: 0.60-0.75 for gas burners',
                'Higher values = more heat in exhaust gases',
                'Remaining fraction (1 - f_conv) = direct flame radiation'
              ]}
            />

            <hr />

            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#495057', marginBottom: 12 }}>Flow Capture & Losses</h4>

            <NumberField 
              label="Capture Fraction" 
              value={cfg.captureFraction} 
              step={0.01} 
              onChange={(v) => setCfg({ ...cfg, captureFraction: v })} 
            />
            <Tooltip
              title="Capture Fraction"
              description="Percentage of the convective plume that is captured by the emitter inlet (not lost to ambient)."
              formula="P_captured = P_plume × f_capture × (1 - f_wind)"
              units="Dimensionless fraction (0-1)"
              relationships={[
                'Depends on inlet geometry and positioning',
                'Larger inlet diameter → higher capture',
                'Lower inlet height → better capture',
                'Wind reduces effective capture'
              ]}
            />

            <NumberField 
              label="Bypass Fraction (damper/leaks)" 
              value={cfg.bypassFraction} 
              step={0.01} 
              onChange={(v) => setCfg({ ...cfg, bypassFraction: v })} 
            />
            <Tooltip
              title="Bypass Fraction"
              description="Portion of captured gas that bypasses heat transfer due to damper openings, gaps, or short-circuiting flow paths."
              formula="P_effective = P_captured × (1 - f_bypass)"
              units="Dimensionless fraction (0-1)"
              relationships={[
                'Typical range: 0.05-0.15',
                'Well-sealed damper: ~5% bypass',
                'Partially open damper: 15-30% bypass',
                'Reduces effective heat transfer'
              ]}
            />

            <NumberField 
              label="C effective (W/K) — mass flow × specific heat" 
              value={cfg.C_effective_W_per_K} 
              step={0.5} 
              onChange={(v) => setCfg({ ...cfg, C_effective_W_per_K: v })} 
            />
            <Tooltip
              title="C Effective (Thermal Capacitance Rate)"
              description="Product of gas mass flow rate and specific heat (ṁ·cp). Represents the thermal capacity of the gas stream."
              formula="C = ṁ × cp [W/K]"
              units="W/K (Watts per Kelvin)"
              relationships={[
                'Higher C → gas can carry more heat',
                'Used in effectiveness formula: ε = 1 - exp(-UA/C)',
                'Typical range: 15-25 W/K for firepit exhaust',
                'Affects heat transfer effectiveness'
              ]}
            />

            <hr />

            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#495057', marginBottom: 12 }}>Geometry</h4>

            <NumberField 
              label="Inlet Diameter (inches)" 
              value={cfg.inletDiameterIn} 
              onChange={(v) => setCfg({ ...cfg, inletDiameterIn: v })} 
            />
            <Tooltip
              title="Inlet Diameter"
              description="Diameter of the emitter at the base where hot gases enter."
              formula="R_avg = (D_inlet + D_outlet) / 4"
              units="inches"
              relationships={[
                'Larger inlet → better plume capture',
                'Affects average radius for irradiance calculations',
                'Typical: 18-30 inches for patio scale'
              ]}
            />

            <NumberField 
              label="Outlet Diameter (inches)" 
              value={cfg.outletDiameterIn} 
              onChange={(v) => setCfg({ ...cfg, outletDiameterIn: v })} 
            />
            <Tooltip
              title="Outlet Diameter"
              description="Diameter of the emitter at the top where gases exit. Smaller outlets increase back-pressure and contact time."
              formula="E(d) = P_IR / (2π × (d + R_avg)²)"
              units="inches"
              relationships={[
                '2-3": High pressure, best heat transfer, potential burner interference',
                '4-5": Balanced performance',
                '6"+: Low pressure, reduced capture',
                'See Outlet Diameter Comparison chart in Analysis view'
              ]}
            />

            <NumberField 
              label="Emitter Height (inches)" 
              value={cfg.emitterHeightIn} 
              onChange={(v) => setCfg({ ...cfg, emitterHeightIn: v })} 
            />
            <Tooltip
              title="Emitter Height"
              description="Vertical distance from inlet to outlet. Greater height provides more surface area for heat transfer."
              formula="Surface_Area ≈ π × (R_in + R_out) × √(h² + (R_in - R_out)²)"
              units="inches"
              relationships={[
                'Taller emitter → more contact time → more heat transfer',
                'Typical range: 10-18 inches',
                'Limited by structural and aesthetic constraints'
              ]}
            />

            <NumberField 
              label="Stack Extension (inches)" 
              value={cfg.stackExtensionIn} 
              step={1}
              min={0}
              max={6}
              onChange={(v) => setCfg({ ...cfg, stackExtensionIn: v })} 
            />
            <Tooltip
              title="Stack Extension"
              description="Additional vertical cylindrical extension above the main emitter outlet. Continues heat extraction from rising exhaust."
              formula="Additional_Capture ≈ 0.12 × (1 - e^(-h/3)) × (h/6) × P_effective"
              units="inches (0-6)"
              relationships={[
                'Each inch adds more wall contact area',
                'Diminishing returns beyond 4-5 inches',
                'See Stack Extension Impact chart in Analysis view',
                'Outlet diameter determines stack diameter'
              ]}
            />

            <hr />

            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#495057', marginBottom: 12 }}>Heat Transfer</h4>

            <NumberField 
              label="UA (W/K) — Overall heat transfer coefficient" 
              value={cfg.UA_W_per_K} 
              step={1} 
              onChange={(v) => setCfg({ ...cfg, UA_W_per_K: v })} 
            />
            <Tooltip
              title="UA (Overall Heat Transfer)"
              description="Product of overall heat transfer coefficient (U) and surface area (A). Primary parameter for wall heat capture effectiveness."
              formula="ε = 1 - exp(-UA/C)\nP_wall = P_effective × ε"
              units="W/K (Watts per Kelvin)"
              relationships={[
                'Smooth walls: UA ≈ 12-15 W/K',
                'Ramped walls: UA ≈ 18-22 W/K',
                'Stator + ramp: UA ≈ 25-32 W/K',
                'Higher UA → more heat extracted from gas',
                'Swirl and turbulence increase UA significantly'
              ]}
            />

            <hr />

            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#495057', marginBottom: 12 }}>Radiation Properties</h4>

            <NumberField 
              label="η_rad — Radiant fraction of wall heat" 
              value={cfg.etaRad} 
              step={0.01} 
              onChange={(v) => setCfg({ ...cfg, etaRad: v })} 
            />
            <Tooltip
              title="η_rad (Radiation Efficiency)"
              description="Fraction of wall-captured heat that is re-emitted as infrared radiation (vs. convection or conduction losses)."
              formula="P_IR = P_wall × η_rad"
              units="Dimensionless fraction (0-1)"
              relationships={[
                'High-emissivity surfaces: η_rad ≈ 0.6-0.7',
                'Polished metal: η_rad ≈ 0.2-0.3',
                'Black-body approximation: η_rad → 0.8-0.9',
                'Temperature-dependent: higher T → higher radiation fraction'
              ]}
            />

            <NumberField 
              label="η_out — Outward delivery factor" 
              value={cfg.etaOut} 
              step={0.01} 
              onChange={(v) => setCfg({ ...cfg, etaOut: v })} 
            />
            <Tooltip
              title="η_out (Outward Delivery Factor)"
              description="Fraction of emitted IR that travels outward toward occupants (vs. upward or reflected back)."
              formula="P_IR_out = P_IR × η_out"
              units="Dimensionless fraction (0-1)"
              relationships={[
                'Hemisphere geometry: η_out ≈ 0.5 (50% outward, 50% upward)',
                'Reflector/deflector: η_out → 0.7-0.8',
                'Flat emitter: η_out ≈ 0.6-0.65',
                'Geometry-dependent directional factor'
              ]}
            />

            <div style={{ 
              fontSize: 12, 
              color: '#6c757d', 
              marginTop: 16,
              padding: 12,
              background: '#f8f9fa',
              borderRadius: 8,
              borderLeft: '3px solid #667eea'
            }}>
              <strong>💡 Tip:</strong> Hover over ? icons for detailed parameter definitions and formulas. 
              Switch to Visual Model tab to see dimensional representation.
            </div>
          </div>

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
            }}>📊 Results & Visualization</h3>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', 
              gap: 12,
              marginBottom: 20
            }}>
              <Kpi label="Burner Power" value={`${(results.burnerPowerW / 1000).toFixed(2)} kW`} />
              <Kpi label="Wall Captured" value={`${(results.wallCapturedW / 1000).toFixed(2)} kW`} />
              <Kpi label="IR Out (effective)" value={`${(results.radiantOutW / 1000).toFixed(2)} kW`} />
              <Kpi label="Avg Radius" value={`${results.effectiveRadiusFt.toFixed(2)} ft`} />
              <Kpi label="Capture Efficiency" value={`${((results.wallCapturedW / results.burnerPowerW) * 100).toFixed(1)}%`} />
              <Kpi label="IR Efficiency" value={`${((results.radiantOutW / results.burnerPowerW) * 100).toFixed(1)}%`} />
            </div>

            <div style={{ marginTop: 16 }}>
              <LineChart 
                width={800} 
                height={400} 
                series={series} 
                xLabel="Distance from emitter surface (ft)" 
                yLabel="Absorbed IR (W)" 
              />
            </div>

            <details style={{ marginTop: 16, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#495057' }}>
                Show raw results JSON
              </summary>
              <pre style={{ 
                background: '#ffffff', 
                padding: 12, 
                borderRadius: 8, 
                overflowX: 'auto',
                fontSize: 11,
                marginTop: 12,
                border: '1px solid #e9ecef'
              }}>
{JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}

      {/* Visual Model View */}
      {viewMode === 'visual' && (
        <div>
          <VisualView config={cfg} results={results} />
          
          <div style={{ 
            marginTop: 20,
            padding: 16,
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: 12
          }}>
            <h4 style={{ marginTop: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
              📐 Dimensional Specifications
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              fontSize: 13
            }}>
              <div><strong>Inlet Diameter:</strong> {cfg.inletDiameterIn}" ({(cfg.inletDiameterIn * 2.54).toFixed(1)} cm)</div>
              <div><strong>Outlet Diameter:</strong> {cfg.outletDiameterIn}" ({(cfg.outletDiameterIn * 2.54).toFixed(1)} cm)</div>
              <div><strong>Emitter Height:</strong> {cfg.emitterHeightIn}" ({(cfg.emitterHeightIn * 2.54).toFixed(1)} cm)</div>
              <div><strong>Stack Extension:</strong> {cfg.stackExtensionIn}" ({(cfg.stackExtensionIn * 2.54).toFixed(1)} cm)</div>
              <div><strong>Taper Angle:</strong> {(Math.atan((cfg.inletDiameterIn - cfg.outletDiameterIn) / (2 * cfg.emitterHeightIn)) * 180 / Math.PI).toFixed(1)}°</div>
              <div><strong>Volume:</strong> {((Math.PI / 12) * cfg.emitterHeightIn * ((cfg.inletDiameterIn/2)**2 + (cfg.inletDiameterIn/2)*(cfg.outletDiameterIn/2) + (cfg.outletDiameterIn/2)**2) / 231).toFixed(2)} gal</div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis & Charts View */}
      {viewMode === 'analysis' && (
        <div>
          <div style={{ 
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ marginTop: 0, fontSize: 18, fontWeight: 600, color: '#212529' }}>
              📈 Comprehensive Analysis
            </h3>
            <p style={{ color: '#6c757d', fontSize: 14, lineHeight: 1.6 }}>
              Explore how different parameters affect system performance. These charts show the impact of 
              stack extensions and outlet diameter variations on heat capture and radiant output.
            </p>
          </div>

          <StackAnalysisChart results={results} />
          <OutletDiameterComparison config={cfg} />

          {/* Additional Performance Metrics */}
          <div style={{
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: 12,
            padding: 16,
            marginTop: 16
          }}>
            <h4 style={{ marginTop: 0, fontSize: 15, fontWeight: 600, color: '#212529' }}>
              ⚡ Performance Metrics Breakdown
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 12 }}>
              <div>
                <h5 style={{ fontSize: 13, fontWeight: 600, color: '#495057', marginBottom: 8 }}>
                  Power Flow (kW)
                </h5>
                <div style={{ fontSize: 12, color: '#6c757d', lineHeight: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f3f5' }}>
                    <span>1. Burner Input:</span>
                    <strong style={{ color: '#212529' }}>{(results.burnerPowerW / 1000).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f3f5' }}>
                    <span>2. Convective Plume:</span>
                    <strong style={{ color: '#212529' }}>{(results.plumePowerW / 1000).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f3f5' }}>
                    <span>3. Captured:</span>
                    <strong style={{ color: '#212529' }}>{(results.capturedPlumeW / 1000).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f3f5' }}>
                    <span>4. Wall Absorbed:</span>
                    <strong style={{ color: '#667eea' }}>{(results.wallCapturedW / 1000).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>5. IR Out (to occupants):</span>
                    <strong style={{ color: '#ff6b00' }}>{(results.radiantOutW / 1000).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              <div>
                <h5 style={{ fontSize: 13, fontWeight: 600, color: '#495057', marginBottom: 8 }}>
                  Key Efficiency Ratios
                </h5>
                <div style={{ fontSize: 12, color: '#6c757d', lineHeight: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f3f5' }}>
                    <span>Wall Capture / Burner:</span>
                    <strong style={{ color: '#667eea' }}>{((results.wallCapturedW / results.burnerPowerW) * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f3f5' }}>
                    <span>IR Out / Burner:</span>
                    <strong style={{ color: '#ff6b00' }}>{((results.radiantOutW / results.burnerPowerW) * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f3f5' }}>
                    <span>IR Out / Wall Captured:</span>
                    <strong style={{ color: '#212529' }}>{((results.radiantOutW / results.wallCapturedW) * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f3f5' }}>
                    <span>Heat Transfer Effectiveness (ε):</span>
                    <strong style={{ color: '#212529' }}>{(1 - Math.exp(-cfg.UA_W_per_K / cfg.C_effective_W_per_K)).toFixed(3)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>NTU (Number of Transfer Units):</span>
                    <strong style={{ color: '#212529' }}>{(cfg.UA_W_per_K / cfg.C_effective_W_per_K).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documentation View */}
      {viewMode === 'docs' && (
        <div style={{ 
          background: 'white',
          border: '1px solid #e9ecef',
          borderRadius: 16,
          padding: 30,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          maxWidth: 1000,
          margin: '0 auto'
        }}>
          <h2 style={{ marginTop: 0, color: '#212529' }}>📚 Model Documentation</h2>

          <section style={{ marginBottom: 30 }}>
            <h3 style={{ color: '#667eea', fontSize: 20 }}>Core Equations</h3>
            
            <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8, marginTop: 12, fontFamily: 'monospace', fontSize: 13 }}>
              <div style={{ marginBottom: 12 }}>
                <strong>1. Power Conversion:</strong><br/>
                P_burner [W] = BTU/h × 0.29307107
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>2. Plume Power:</strong><br/>
                P_plume = P_burner × f_convective
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>3. Captured Power:</strong><br/>
                P_captured = P_plume × f_capture × (1 - f_wind) × (1 - f_bypass)
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>4. Heat Transfer Effectiveness:</strong><br/>
                ε = 1 - exp(-UA/C)<br/>
                <em style={{ fontSize: 11, color: '#6c757d' }}>Where NTU = UA/C (Number of Transfer Units)</em>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>5. Wall Captured Heat:</strong><br/>
                P_wall = P_captured × ε
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>6. Radiant Output:</strong><br/>
                P_IR = P_wall × η_rad × η_out
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>7. Irradiance (Hemisphere):</strong><br/>
                E(d) = P_IR / (2π × (d + R_avg)²)<br/>
                <em style={{ fontSize: 11, color: '#6c757d' }}>Where d = distance from surface, R_avg = (R_inlet + R_outlet)/2</em>
              </div>
              <div>
                <strong>8. Absorbed by Occupant:</strong><br/>
                P_absorbed = E(d) × A_projected × α_human<br/>
                <em style={{ fontSize: 11, color: '#6c757d' }}>Where α = absorptivity (typically 0.8), A = projected area</em>
              </div>
            </div>
          </section>

          <section style={{ marginBottom: 30 }}>
            <h3 style={{ color: '#667eea', fontSize: 20 }}>Key Assumptions</h3>
            <ul style={{ lineHeight: 1.8, color: '#495057' }}>
              <li>Hemispherical irradiance distribution (simplified geometry)</li>
              <li>Steady-state operation (no transient effects)</li>
              <li>Uniform wall temperature (lumped thermal mass)</li>
              <li>Gray-body radiation (wavelength-independent emissivity)</li>
              <li>Ambient temperature effects on convection are secondary</li>
              <li>Wind effects are represented as a simple loss factor</li>
              <li>Stack extension uses empirical diminishing returns model</li>
            </ul>
          </section>

          <section style={{ marginBottom: 30 }}>
            <h3 style={{ color: '#667eea', fontSize: 20 }}>Typical Parameter Ranges</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Parameter</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Min</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Typical</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Max</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Units</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Burner Power', '30,000', '50,000', '70,000', 'BTU/h'],
                  ['Convective Fraction', '0.60', '0.70', '0.80', '—'],
                  ['Capture Fraction', '0.70', '0.85', '0.95', '—'],
                  ['Bypass Fraction', '0.05', '0.10', '0.20', '—'],
                  ['C effective', '12', '17', '25', 'W/K'],
                  ['UA (smooth)', '10', '12', '15', 'W/K'],
                  ['UA (ramp)', '18', '20', '24', 'W/K'],
                  ['UA (stator+ramp)', '25', '28', '32', 'W/K'],
                  ['η_rad', '0.45', '0.55', '0.70', '—'],
                  ['η_out', '0.55', '0.65', '0.75', '—'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f3f5' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: 10 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={{ marginBottom: 30 }}>
            <h3 style={{ color: '#667eea', fontSize: 20 }}>Links to Additional Resources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a href="./docs/reference/MODEL.md" style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                padding: 12,
                background: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e9ecef',
                display: 'block'
              }}>
                📄 <strong>MODEL.md</strong> — Detailed mathematical derivations
              </a>
              <a href="./docs/reference/ASSUMPTIONS.md" style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                padding: 12,
                background: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e9ecef',
                display: 'block'
              }}>
                📋 <strong>ASSUMPTIONS.md</strong> — Complete list of modeling assumptions
              </a>
              <a href="./docs/reference/VARIABLES.md" style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                padding: 12,
                background: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e9ecef',
                display: 'block'
              }}>
                🔢 <strong>VARIABLES.md</strong> — Variable definitions and nomenclature
              </a>
              <a href="./docs/prd/PRD.md" style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                padding: 12,
                background: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e9ecef',
                display: 'block'
              }}>
                📝 <strong>PRD.md</strong> — Product requirements document
              </a>
              <a href="./docs/architecture/ARCHITECTURE.md" style={{ 
                color: '#667eea', 
                textDecoration: 'none',
                padding: 12,
                background: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e9ecef',
                display: 'block'
              }}>
                🏗️ <strong>ARCHITECTURE.md</strong> — System architecture overview
              </a>
            </div>
          </section>

          <section>
            <h3 style={{ color: '#667eea', fontSize: 20 }}>Model Validation</h3>
            <p style={{ color: '#6c757d', lineHeight: 1.6 }}>
              This model is a <strong>lumped-parameter approximation</strong> intended for relative comparisons 
              and feasibility studies. It is NOT a substitute for CFD or experimental validation.
            </p>
            <p style={{ color: '#6c757d', lineHeight: 1.6 }}>
              <strong>Next steps for calibration:</strong>
            </p>
            <ol style={{ color: '#495057', lineHeight: 1.8 }}>
              <li>Build physical prototype with thermocouple instrumentation</li>
              <li>Measure surface temperatures at multiple locations</li>
              <li>Use radiometer to measure actual irradiance at known distances</li>
              <li>Calculate plume capture efficiency from temperature rise measurements</li>
              <li>Back-calculate UA, η_rad, and η_out from experimental data</li>
              <li>Validate absorptivity and projected area assumptions with thermal imaging</li>
            </ol>
          </section>
        </div>
      )}

      <footer style={{ 
        marginTop: 40, 
        padding: 16, 
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: 12,
        fontSize: 12, 
        color: '#6c757d',
        textAlign: 'center'
      }}>
        <strong>📁 Note:</strong> Archived concept PDFs/images are under <code style={{ background: '#f8f9fa', padding: '2px 6px', borderRadius: 4 }}>public/archive/</code>
        <br/>
        <span style={{ fontSize: 11, marginTop: 8, display: 'block' }}>
          Built with React + TypeScript + Vite | Model v0.2.0 | 
          <a href="https://github.com/WWL-scott/firepit_emitter" style={{ color: '#667eea', marginLeft: 4 }}>View on GitHub</a>
        </span>
      </footer>
    </div>
  );
}

function Kpi(props: { label: string; value: string }) {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', 
      border: '1px solid #e0e7ff', 
      borderRadius: 12, 
      padding: 14,
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}>
      <div style={{ fontSize: 11, color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {props.label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#667eea', marginTop: 4 }}>
        {props.value}
      </div>
    </div>
  );
}
