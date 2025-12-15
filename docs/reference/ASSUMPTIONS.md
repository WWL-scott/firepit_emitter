# Assumptions Reference (Defaults)

These defaults match the latest “decision-grade” runs and are tunable in the app.

- Burner: 50,000 BTU/h (natural gas)
- Ambient: 30°F, no wind
- f_conv (convective plume fraction): 0.70
- f_capture (capture fraction at inlet): 0.85 (24" inlet ~12" above flame, no wind)
- f_bypass (tuned damper/leak bypass): 0.10
- C_effective (m_dot*c_p proxy): 17 W/K

UA presets:
- Smooth wall: 12 W/K
- Ramp only: 20 W/K
- Stator + tapered ramp: 28 W/K

Radiation + delivery:
- etaRad: 0.55
- etaOut: 0.65

Human:
- absorptivity: 0.80
- projected area standing: 0.70 m²
- projected area seated: 0.50 m²
