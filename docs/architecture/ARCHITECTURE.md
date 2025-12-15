# Architecture

Client-side web tool:
- React + TypeScript UI
- Deterministic TypeScript model library (`src/model`)
- Optional Python scripts for regenerating archived charts and validating math

Data flow:
Config → calcResults(Config) → Results → KPI cards + plots
