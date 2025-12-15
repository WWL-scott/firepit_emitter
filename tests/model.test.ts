import { describe, it, expect } from 'vitest';
import { presetStatorRamp } from '../src/model/defaults';
import { calcResults } from '../src/model/calc';

describe('calcResults', () => {
  it('produces finite outputs for baseline', () => {
    const cfg = presetStatorRamp();
    const r = calcResults(cfg);
    expect(Number.isFinite(r.wallCapturedW)).toBe(true);
    expect(r.wallCapturedW).toBeGreaterThan(0);
  });

  it('absorbed power decreases with distance', () => {
    const cfg = presetStatorRamp();
    const r = calcResults(cfg);
    expect(r.absorbedStandingW[0]).toBeGreaterThan(r.absorbedStandingW[r.absorbedStandingW.length - 1]);
  });

  it('radiant output varies with outlet diameter', () => {
    const baseCfg = presetStatorRamp();

    const outputs = [1, 2, 3, 4, 5, 6].map((outletDiameterIn) => {
      const r = calcResults({ ...baseCfg, outletDiameterIn });
      return r.radiantOutW;
    });

    const min = Math.min(...outputs);
    const max = Math.max(...outputs);
    expect(max - min).toBeGreaterThan(0);
  });
});
