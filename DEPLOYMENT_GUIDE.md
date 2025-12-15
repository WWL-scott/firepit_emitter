# 🚀 Deployment Guide - Firepit Emitter Lab

## ✅ What's Been Done

### UI Enhancements
- ✨ Modern gradient design with professional color scheme
- 🎨 Improved form controls with focus states and transitions
- 📊 Enhanced chart styling with gradient backgrounds
- 🏷️ Sticky sidebar for better UX on scroll
- 📱 Responsive grid layout
- 🎯 Better visual hierarchy and spacing
- 💅 Custom CSS with smooth animations

### Configuration
- ⚙️ Vite configured for GitHub Pages deployment
- 📦 Added `gh-pages` npm package for deployment
- 🔄 GitHub Actions workflow for automatic deployment
- 📝 Updated README with comprehensive instructions
- 🚫 Added `.gitignore` for clean repository

---

## 📍 Current Status

### Local Development
✅ **The app is now running locally at:**
```
http://localhost:5173/firepit_emitter/
```

The development server is running in the background. The app will hot-reload when you make changes to the code.

---

## 🌐 GitHub Pages Setup

### Step 1: Push to GitHub

If you haven't already pushed this repository to GitHub:

```bash
cd "c:\Users\17208\Desktop\Firepit Emitter"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with enhanced UI and GitHub Pages setup"

# Add remote (replace with your GitHub repo URL)
git remote add origin https://github.com/WWL-scott/firepit_emitter.git

# Push to main branch
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your GitHub repository: `https://github.com/WWL-scott/firepit_emitter`

2. Click **Settings** (top right)

3. In the left sidebar, click **Pages**

4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**
   
5. Click **Save**

### Step 3: Trigger Deployment

The GitHub Actions workflow will automatically run when you push to the `main` branch.

To trigger it now:
- Just push any commit to main, or
- Go to **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**

### Step 4: Access Your Live Site

Once deployment completes (usually 1-2 minutes), your app will be live at:

```
https://wwl-scott.github.io/firepit_emitter/
```

---

## 🛠️ Development Commands

### Start Development Server
```bash
npm run dev
```
Opens at `http://localhost:5173/firepit_emitter/`

### Build for Production
```bash
npm run build
```
Creates optimized production build in `dist/` folder

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing

### Run Tests
```bash
npm test
```

### Manual Deploy to GitHub Pages
```bash
npm run deploy
```
Builds and deploys directly to `gh-pages` branch (alternative to GitHub Actions)

---

## 🔧 Project Structure

```
firepit_emitter/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── docs/                       # Documentation
├── public/                     # Static assets
├── src/
│   ├── model/                  # Thermal calculation engine
│   │   ├── calc.ts            # Core calculations
│   │   ├── defaults.ts        # Preset configurations
│   │   └── schema.ts          # TypeScript types
│   ├── ui/
│   │   ├── components/        # React components
│   │   │   ├── LineChart.tsx  # SVG chart component
│   │   │   ├── NumberField.tsx
│   │   │   └── SelectField.tsx
│   │   └── App.tsx            # Main application
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
└── README.md                  # Project documentation
```

---

## 🎨 Design Features

### Color Palette
- Primary: `#667eea` (Purple-blue gradient)
- Secondary: `#764ba2` 
- Accent: `#f093fb`, `#4facfe`
- Neutrals: `#f8f9fa`, `#e9ecef`, `#6c757d`

### Key UI Components
- **Sticky Sidebar**: Input controls stay visible while scrolling
- **Gradient Backgrounds**: Subtle gradients for depth
- **Interactive Forms**: Focus states with smooth transitions
- **KPI Cards**: Highlighted key metrics with gradient backgrounds
- **SVG Chart**: Custom line chart with responsive design
- **Collapsible Sections**: Details/summary for raw data

---

## 📊 Features Overview

### Input Controls
- **Preset Scenarios**: Smooth, Ramp, Stator+Ramp, Custom
- **Burner Settings**: BTU/h, convective fraction
- **Heat Transfer**: UA, C effective, capture/bypass fractions
- **Radiation**: etaRad, etaOut factors
- **Human Parameters**: Absorptivity, projected areas

### Results Display
- **KPIs**: Burner power, wall captured, IR out, avg radius
- **Visualization**: Absorbed IR vs distance chart
- **Two Scenarios**: Standing and seated occupant positions
- **Raw Data**: JSON output for verification

---

## 🐛 Troubleshooting

### Port Already in Use
If port 5173 is busy:
```bash
# Kill the process using the port, or
# Edit vite.config.ts to use a different port
```

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### GitHub Pages 404
- Ensure the `base` in `vite.config.ts` matches your repo name
- Current setting: `/firepit_emitter/`
- Check that GitHub Pages is enabled in repository settings

### Workflow Failures
- Check the **Actions** tab in GitHub for error logs
- Ensure repository has proper permissions (Settings → Actions → General)

---

## 📝 Next Steps / Roadmap

- [ ] Editable distance array in UI
- [ ] Side-by-side scenario comparison mode
- [ ] JSON/CSV export functionality
- [ ] Chart zoom and pan
- [ ] Mobile responsive improvements
- [ ] Dark mode toggle
- [ ] Save/load configurations
- [ ] URL parameter sharing

---

## 📚 Additional Resources

- **Vite Documentation**: https://vitejs.dev/
- **React Documentation**: https://react.dev/
- **GitHub Pages**: https://pages.github.com/
- **GitHub Actions**: https://docs.github.com/en/actions

---

## 💡 Tips

1. **Always test locally** before deploying:
   ```bash
   npm run build
   npm run preview
   ```

2. **Check for TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

3. **Monitor bundle size**:
   - The `dist/` folder shows final bundle size
   - Keep under 500KB for fast loading

4. **Use version control**:
   - Commit frequently with descriptive messages
   - Create branches for new features
   - Use pull requests for code review

---

## ✨ You're All Set!

Your Firepit Emitter Lab is now:
- ✅ Running locally with hot-reload
- ✅ Styled with modern UI/UX
- ✅ Configured for GitHub Pages
- ✅ Ready to deploy automatically

**Enjoy building and iterating on your thermal engineering tool!** 🔥🎉
