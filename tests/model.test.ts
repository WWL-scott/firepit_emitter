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
});
