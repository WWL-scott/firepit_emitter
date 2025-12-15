import type { Config } from './schema';

export const BTU_PER_HR_TO_W = 0.29307107;

export const baseConfig: Omit<Config, 'scenario' | 'UA_W_per_K'> = {
  burnerBtuPerHr: 50_000,
  convectivePlumeFraction: 0.70,
  ambientTempF: 30,

  captureFraction: 0.85,
  windLossFraction: 0.0,
  bypassFraction: 0.10,
  C_effective_W_per_K: 17.0,

  inletDiameterIn: 24,
  outletDiameterIn: 3,
  emitterHeightIn: 12,
  inletHeightAboveFlameIn: 12,
  statorDropIn: 5,

  etaRad: 0.55,
  etaOut: 0.65,

  humanAbsorptivity: 0.80,
  projectedAreaStandingM2: 0.70,
  projectedAreaSeatedM2: 0.50,

  distancesFromSurfaceFt: [2,3,4,5,6,7,8],
};

export function presetSmooth(): Config {
  return { scenario: 'smooth', UA_W_per_K: 12, ...baseConfig };
}
export function presetRamp(): Config {
  return { scenario: 'ramp', UA_W_per_K: 20, ...baseConfig };
}
export function presetStatorRamp(): Config {
  return { scenario: 'statorRamp', UA_W_per_K: 28, ...baseConfig };
}
