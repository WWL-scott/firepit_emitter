export type ScenarioName = 'smooth' | 'ramp' | 'statorRamp' | 'custom';

export interface Config {
  scenario: ScenarioName;

  burnerBtuPerHr: number;
  convectivePlumeFraction: number;
  ambientTempF: number;

  captureFraction: number;
  windLossFraction: number;
  bypassFraction: number;
  C_effective_W_per_K: number;

  inletDiameterIn: number;
  outletDiameterIn: number;
  emitterHeightIn: number;
  inletHeightAboveFlameIn: number;
  statorDropIn: number;
  stackExtensionIn: number;

  UA_W_per_K: number;

  etaRad: number;
  etaOut: number;

  humanAbsorptivity: number;
  projectedAreaStandingM2: number;
  projectedAreaSeatedM2: number;

  distancesFromSurfaceFt: number[];
}

export interface Results {
  burnerPowerW: number;
  plumePowerW: number;
  capturedPlumeW: number;
  capturedEffW?: number;
  bypassEff?: number;
  UA_eff?: number;
  eps?: number;
  wallCapturedW: number;
  outletExhaustW?: number;
  radiantOutW: number;
  effectiveRadiusFt: number;

  irradiance_W_m2: number[];
  absorbedStandingW: number[];
  absorbedSeatedW: number[];
  
  stackExtensionAnalysis?: {
    extensionIn: number;
    additionalCaptureW: number;
    totalWallCapturedW: number;
    totalRadiantOutW: number;
  }[];
}
