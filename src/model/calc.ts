import type { Config, Results } from './schema';
import { BTU_PER_HR_TO_W } from './defaults';

function effectiveness(UA: number, C: number): number {
  if (C <= 0) return 0;
  return 1 - Math.exp(-UA / C);
}

function avgRadiusFt(inletDiameterIn: number, outletDiameterIn: number): number {
  const rIn = inletDiameterIn / 2;
  const rOut = outletDiameterIn / 2;
  const rAvgIn = (rIn + rOut) / 2; // inches
  return rAvgIn / 12; // feet
}

export function calcResults(cfg: Config): Results {
  const burnerPowerW = cfg.burnerBtuPerHr * BTU_PER_HR_TO_W;

  const plumePowerW = burnerPowerW * cfg.convectivePlumeFraction;
  const capturedPlumeW = plumePowerW * cfg.captureFraction * (1 - cfg.windLossFraction);
  const capturedEffW = capturedPlumeW * (1 - cfg.bypassFraction);

  const eps = effectiveness(cfg.UA_W_per_K, cfg.C_effective_W_per_K);
  const wallCapturedW = capturedEffW * eps;

  const radiantOutW = wallCapturedW * cfg.etaRad * cfg.etaOut;

  const rAvgFt = avgRadiusFt(cfg.inletDiameterIn, cfg.outletDiameterIn);

  const irradiance = cfg.distancesFromSurfaceFt.map((sFt) => {
    const dM = (sFt + rAvgFt) * 0.3048;
    return dM > 0 ? radiantOutW / (2 * Math.PI * dM * dM) : 0;
  });

  const absorbedStandingW = irradiance.map((E) => E * cfg.projectedAreaStandingM2 * cfg.humanAbsorptivity);
  const absorbedSeatedW = irradiance.map((E) => E * cfg.projectedAreaSeatedM2 * cfg.humanAbsorptivity);

  // Stack extension analysis: additional capture per inch of vertical extension
  // Assumption: Each inch of stack captures additional exhaust with diminishing returns
  const stackExtensionAnalysis = [1, 2, 3, 4, 5, 6].map((extensionIn) => {
    // Additional surface area from extension (cylinder): 2*pi*r*h
    const radiusIn = cfg.outletDiameterIn / 2;
    const additionalAreaM2 = (2 * Math.PI * radiusIn * extensionIn) * 0.00064516; // in² to m²
    
    // Estimate additional heat transfer based on extended contact time
    // Assume 10-15% additional effectiveness per inch, diminishing
    const additionalEffectiveness = 0.12 * (1 - Math.exp(-extensionIn / 3));
    const additionalCaptureW = capturedEffW * additionalEffectiveness * (extensionIn / 6);
    
    const totalWallCapturedW = wallCapturedW + additionalCaptureW;
    const totalRadiantOutW = totalWallCapturedW * cfg.etaRad * cfg.etaOut;
    
    return {
      extensionIn,
      additionalCaptureW,
      totalWallCapturedW,
      totalRadiantOutW,
    };
  });

  return {
    burnerPowerW,
    plumePowerW,
    capturedPlumeW,
    wallCapturedW,
    radiantOutW,
    effectiveRadiusFt: rAvgFt,
    irradiance_W_m2: irradiance,
    absorbedStandingW,
    absorbedSeatedW,
    stackExtensionAnalysis,
  };
}
