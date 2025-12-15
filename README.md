# Firepit Emitter Lab (Concept Model + Web App)

A lightweight, variable-driven engineering model and visualization tool for patio firepit thermal efficiency concepts—focused on **emitter-only** designs (swirl funnel + damper) and occupant heat reception.

This repo is intended to:
- Preserve assumptions, formulas, and charts generated during early concept exploration.
- Provide a web UI to change key parameters (BTU/h, geometry, swirl/UA, emissivity proxies, distances) and see expected results in real time.
- Support future calibration against bench tests.

## Quick Start (Web App)
1. Install Node.js (LTS recommended).
2. From repo root:
   - `npm install`
   - `npm run dev`
3. Open the URL printed by Vite.

## What’s inside
- `docs/` – PRD, model equations, assumptions, and roadmap.
- `src/model/` – TypeScript implementation of the thermal model.
- `src/ui/` – React UI (sliders, scenario preset selection, SVG plot).
- `public/archive/` – archived PDFs/images from the exploratory phase.

## Model Caveat
This is an engineering approximation (not CFD). Designed for relative comparisons and feasibility screening.
See `docs/reference/MODEL.md` and `docs/reference/ASSUMPTIONS.md`.
