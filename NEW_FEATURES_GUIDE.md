# 🚀 Quick Reference - New Features

## 🎯 What's New in v0.2.0

### 1. Tooltips with Formulas (❓ icons)
**How to use:** Click or hover over any **?** icon next to parameter labels

**What you'll see:**
- Parameter definition
- Mathematical formula
- Units
- Typical ranges
- How it relates to other parameters

**Example:** Click ? next to "UA (W/K)" to see:
```
Formula: ε = 1 - exp(-UA/C)
P_wall = P_effective × ε

Relationships:
- Higher UA → more heat extracted
- Smooth walls: 12-15 W/K
- Stator + ramp: 25-32 W/K
```

---

### 2. Visual Model Tab (🎨)
**How to access:** Click **🎨 Visual Model** tab at the top

**What you'll see:**
- Scaled drawing of emitter (1" = 4px)
- Flame at base
- Tapered cone with inlet/outlet
- Stack extension (if > 0)
- Standing person (5'5" tall)
- Seated person (3'7" tall) - properly shorter!
- IR radiation arrows
- Dimensional annotations
- Real-time power values

**Try this:** Change Outlet Diameter to 2" and watch the visual update!

---

### 3. Stack Extension Parameter
**Location:** In Geometry section, "Stack Extension (inches)"

**What it does:**
- Adds vertical cylinder above outlet
- Range: 0-6 inches
- Each inch captures more heat (diminishing returns)

**Formula:** 
```
Additional_Capture = 0.12 × (1 - e^(-h/3)) × (h/6) × P_effective
```

**Try this:** Set to 3 inches, go to Analysis tab, see impact chart!

---

### 4. Outlet Diameter Options
**Location:** Geometry section, "Outlet Diameter (inches)"

**Compare these:**
- 2" → High pressure, best heat transfer
- 4" → Balanced (default)
- 5" → Lower pressure, more bypass

**Where to see comparison:** 
- Go to **📈 Analysis & Charts** tab
- Scroll to "Outlet Diameter Comparison" chart
- Shows all three side-by-side

---

### 5. Analysis & Charts Tab (📈)
**How to access:** Click **📈 Analysis & Charts** tab

**What's there:**
1. **Stack Extension Impact Chart**
   - Line graph showing 1-6 inch extensions
   - Y-axis: Total IR Output (kW)
   - Shows diminishing returns

2. **Outlet Diameter Comparison**
   - Bar chart: 2", 4", 5"
   - Color-coded by diameter
   - Values labeled on each bar

3. **Performance Metrics Breakdown**
   - Power flow: Burner → Plume → Wall → IR
   - Efficiency ratios
   - Heat transfer effectiveness
   - NTU calculation

---

### 6. Documentation Tab (📚)
**How to access:** Click **📚 Documentation** tab

**Complete reference including:**
- All 8 core equations
- Key assumptions
- Typical parameter ranges table
- Links to MODEL.md, ASSUMPTIONS.md, etc.
- Validation guidance

---

## 📊 Key Views Summary

| View | Purpose | Best For |
|------|---------|----------|
| 📊 Main Dashboard | Adjust parameters, see results | Quick iterations |
| 🎨 Visual Model | See how it looks | Understanding geometry |
| 📈 Analysis | Compare options | Design decisions |
| 📚 Documentation | Learn formulas | Deep understanding |

---

## 🎮 Try These Workflows

### Workflow 1: Compare Outlet Sizes
1. Go to **Main Dashboard**
2. Note current "IR Out" value
3. Click **Analysis** tab
4. See bar chart comparing 2", 4", 5"
5. Pick best option, go back to Main
6. Change Outlet Diameter to your choice

### Workflow 2: Optimize Stack Extension
1. Set Stack Extension = 0
2. Note "IR Out" KPI value
3. Go to **Analysis** tab
4. Look at Stack Extension Impact chart
5. See which height gives best return
6. Go back, set Stack Extension to optimal value

### Workflow 3: Understand a Parameter
1. Find any parameter (e.g., "Capture Fraction")
2. Click the **?** icon
3. Read description and formula
4. See how it affects other variables
5. Adjust value and observe impact

### Workflow 4: Visualize Your Design
1. Set all geometry parameters
2. Click **Visual Model** tab
3. See scaled representation
4. Check dimensional specifications below
5. Verify proportions look correct

---

## 🔍 What Changed in Calculations

### Original Formulas (Preserved):
✅ P_burner = BTU/h × 0.29307107  
✅ P_plume = P_burner × f_conv  
✅ P_captured = P_plume × f_capture × (1 - f_wind) × (1 - f_bypass)  
✅ ε = 1 - exp(-UA/C)  
✅ P_wall = P_captured × ε  
✅ P_IR = P_wall × η_rad × η_out  
✅ E(d) = P_IR / (2π(d+R_avg)²)  
✅ P_absorbed = E × A × α  

### New Additions:
➕ Stack extension analysis (1-6 inches)  
➕ Outlet diameter comparison (2", 4", 5")  
➕ Efficiency ratio calculations  
➕ NTU = UA/C  

**Nothing removed. Nothing broken. All factors included.**

---

## 📱 Quick Tips

1. **Tooltips everywhere** - Look for ? icons
2. **Tab navigation** - Four views, switch anytime
3. **Real-time updates** - Every change recalculates instantly
4. **Visual feedback** - Charts and diagram update live
5. **Formula transparency** - All equations shown
6. **Proportional accuracy** - Visual model is to scale

---

## 🐛 Troubleshooting

**Q: I don't see the new tabs**  
A: Refresh browser (Ctrl+R or Cmd+R)

**Q: Tooltip won't close**  
A: Move mouse away from ? icon

**Q: Visual looks weird**  
A: Check your inlet/outlet/height values are reasonable

**Q: Charts not updating**  
A: Change a parameter value to trigger recalculation

**Q: Can't find a feature**  
A: Check which tab you're on (Main/Visual/Analysis/Docs)

---

## 🎯 Current Status

✅ **Running at:** http://localhost:5173/firepit_emitter/  
✅ **All features working**  
✅ **No console errors**  
✅ **Ready to deploy**

---

## 📦 What's Next

**To deploy to GitHub Pages:**
1. See `DEPLOYMENT_GUIDE.md`
2. Push to GitHub
3. Enable Pages in Settings
4. Your site will be live in ~2 minutes!

**To continue developing:**
- The dev server is running
- Edit files and see hot-reload
- All your changes are saved

---

**Version:** 0.2.0  
**Last Updated:** December 14, 2025  
**Status:** ✅ Complete

**Enjoy your enhanced Firepit Emitter Lab!** 🔥⚡
