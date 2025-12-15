# Firepit Emitter Lab (Concept Model + Web App)

A lightweight, variable-driven engineering model and visualization tool for patio firepit thermal efficiency concepts—focused on **emitter-only** designs (swirl funnel + damper) and occupant heat reception.

This repo is intended to:
- Preserve assumptions, formulas, and charts generated during early concept exploration.
- Provide a web UI to change key parameters (BTU/h, geometry, swirl/UA, emissivity proxies, distances) and see expected results in real time.
- Support future calibration against bench tests.

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn package manager

### Steps
1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Navigate to `http://localhost:5173`
   - The app will hot-reload as you edit files

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm test` - Run tests
- `npm run deploy` - Deploy to GitHub Pages

## Live Demo
🚀 **View the live app:** [https://wwl-scott.github.io/firepit_emitter/](https://wwl-scott.github.io/firepit_emitter/)

## GitHub Pages Deployment

### Automatic Deployment (Recommended)
The app automatically deploys to GitHub Pages when you push to the `main` branch via GitHub Actions.

**Setup steps:**
1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Under "Build and deployment", select **GitHub Actions** as the source
4. Push any commit to `main` branch to trigger deployment

### Manual Deployment
Alternatively, deploy manually using:
```bash
npm run deploy
```
This will build and push to the `gh-pages` branch.

## What's inside
- `docs/` – PRD, model equations, assumptions, and roadmap.
- `src/model/` – TypeScript implementation of the thermal model.
- `src/ui/` – React UI with tooltips, visual representation, and multi-view navigation.
- `public/archive/` – archived PDFs/images from the exploratory phase.

## ✨ Features (v0.2.0)
- **Interactive Tooltips**: Click ? icons for parameter definitions, formulas, and relationships
- **Visual Model View**: Dimensionally accurate SVG representation of the emitter system
- **Stack Extension Analysis**: Evaluate 1-6 inch vertical extensions with impact charts
- **Outlet Diameter Comparison**: Compare 2", 4", and 5" outlet performance
- **Multi-View Navigation**: Main Dashboard, Visual Model, Analysis & Charts, Documentation
- **Comprehensive Documentation**: All equations, assumptions, and validation guidance
- **Real-Time Calculations**: Instant updates with formula transparency

## Model Caveat
This is an engineering approximation (not CFD). Designed for relative comparisons and feasibility screening.
See `docs/reference/MODEL.md` and `docs/reference/ASSUMPTIONS.md`.

## 📚 Documentation
- **[NEW_FEATURES_GUIDE.md](NEW_FEATURES_GUIDE.md)** - Quick reference for v0.2.0 features
- **[UPDATE_SUMMARY.md](UPDATE_SUMMARY.md)** - Complete changelog and implementation details
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Comprehensive deployment instructions
- **[QUICKSTART.md](QUICKSTART.md)** - Fast setup guide
