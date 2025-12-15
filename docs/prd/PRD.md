# PRD — Firepit Emitter Lab

## Objective
Build a browser-based tool that lets designers explore patio firepit efficiency concepts by adjusting design parameters and instantly seeing:
- wall heat capture (kW),
- effective IR emitted outward (kW),
- absorbed IR by occupants vs distance,
- sensitivity to emissivity proxies, geometry, plume capture, and swirl-induced heat transfer (UA).

Primary use: iterative concept design and decision-grade feasibility for prototypes.

## Target Users
Industrial designers, thermal/mechanical engineers, product developers, advanced hobbyists/fabricators.

## Core Use Cases
1. Single scenario exploration (change inputs, see KPIs + plots).
2. Compare up to 3 scenarios side-by-side (smooth vs ramp vs stator+ramp, custom too).
3. Design-to-target: specify absorbed IR at distance and see which levers matter most (later).
4. Export: configuration JSON + results CSV.

## Key Inputs (user-editable variables)
### Heat Source
- burner BTU/h
- convective plume fraction
- ambient temperature (used later for convection and losses)

### Plume Capture / Flow
- capture fraction (geometry + wind dependent)
- bypass fraction (damper + leaks)
- effective C = m_dot*c_p proxy (W/K)
- wind loss factor (multiplier to capture)

### Geometry
- inlet diameter, outlet diameter, emitter height
- inlet elevation above flame
- distance sweep (2–8 ft from surface)

### Swirl / heat transfer surrogate
- UA (W/K) as primary heat-transfer “knob”
- later: blade count/angle, ramp turns/width mapped → UA via calibration

### Radiation / delivery
- etaRad: fraction of wall heat leaving as IR
- etaOut: outward delivery factor (hemisphere + geometry losses)
- human absorptivity + projected area (standing/seated)

## Outputs
- burner power (kW)
- plume power (kW)
- captured plume (kW)
- wall captured heat (kW)
- effective IR outward (kW)
- irradiance at distance (W/m²)
- absorbed IR per person at distance (W)

## Technical Requirements
- Client-only app (no backend)
- Deterministic results from a typed config schema
- Export JSON/CSV
- Tests for core math

## Validation (next phase)
Prototype + measurements (surface temp, plume capture, radiant flux) to calibrate UA, etaRad, etaOut.
