import { describe, expect, it } from 'vitest';
import { ELBOW_DOWN, KNEE_FORWARD, solveTwoBone } from './ik';
import { dist, vec } from './math';
import { seeded } from './random';

describe('two-bone IK', () => {
  const a = 0.7;
  const b = 0.7;
  const root = vec(0, 0);

  it('reaches every reachable target exactly, with bone lengths kept', () => {
    for (let i = 0; i < 500; i++) {
      const angle = seeded(`ik-a-${i}`) * Math.PI * 2;
      const r = 0.02 + seeded(`ik-r-${i}`) * (a + b - 0.04);
      const target = vec(Math.cos(angle) * r, Math.sin(angle) * r);
      for (const bend of [1, -1] as const) {
        const ik = solveTwoBone(root, target, a, b, bend);
        expect(ik.reached).toBe(true);
        expect(dist(ik.end, target)).toBeLessThan(1e-9);
        expect(dist(ik.joint, root)).toBeCloseTo(a, 9);
        expect(dist(ik.end, ik.joint)).toBeCloseTo(b, 9);
      }
    }
  });

  it('works with unequal bones (arm with hand reach)', () => {
    const ik = solveTwoBone(root, vec(0.8, 0.3), 0.6, 0.714, ELBOW_DOWN);
    expect(ik.reached).toBe(true);
    expect(dist(ik.end, vec(0.8, 0.3))).toBeLessThan(1e-9);
  });

  it('points straight at a target that is too far, and reports it', () => {
    const target = vec(3, 0);
    const ik = solveTwoBone(root, target, a, b, 1);
    expect(ik.reached).toBe(false);
    expect(ik.end.y).toBeCloseTo(0, 6);
    expect(ik.end.x).toBeCloseTo(a + b, 6);
  });

  it('never returns NaN, even with the target on the root', () => {
    const ik = solveTwoBone(root, root, a, b, 1);
    for (const v of [ik.joint.x, ik.joint.y, ik.end.x, ik.end.y])
      expect(Number.isFinite(v)).toBe(true);
  });

  it('KNEE_FORWARD puts the knee in front of a leg pointing down', () => {
    const ik = solveTwoBone(root, vec(0, 1.3), a, b, KNEE_FORWARD);
    expect(ik.joint.x).toBeGreaterThan(0);
  });

  it('ELBOW_DOWN puts the elbow below an arm reaching forward', () => {
    const ik = solveTwoBone(root, vec(1.0, 0), 0.6, 0.714, ELBOW_DOWN);
    expect(ik.joint.y).toBeGreaterThan(0);
  });
});
