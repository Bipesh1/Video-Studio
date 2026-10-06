import { describe, expect, it } from 'vitest';
import { ACTIONS } from '../rig/actions';
import type { Vec2 } from '../rig/math';
import { resolvePose } from '../rig/pose';
import { cower, kneel, sit, stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import type { ResolvedPose } from '../rig/types';
import { DRAPES, drapeOverLegs } from './cloth';
import type { PieceContext } from './types';

/**
 * Skirts on legs (Biku, 2026-10-06: "the grandma is sitting but the clothes is straight").
 * A skirt, dress, robe or gown has to cover the legs wherever the legs are.
 */

const ctxFor = (pose: ResolvedPose, turn = 0.5): PieceContext => ({
  j: computeSkeleton(pose),
  lean: pose.torsoLean,
  turn,
  shadowSide: 1,
  uid: 't',
  skin: 'light',
  sway: { x: 0, y: 0 },
});

/** Is a point inside the outline (which bulges outward everywhere)? */
const inside = (p: Vec2, outline: readonly Vec2[]): boolean => {
  let sign = 0;
  for (let i = 0; i < outline.length; i += 1) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    if (!a || !b) continue;
    const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    if (Math.abs(cross) < 1e-9) continue;
    if (sign !== 0 && Math.sign(cross) !== sign) return false;
    sign = Math.sign(cross);
  }
  return true;
};

const POSES: Record<string, ResolvedPose> = {
  stand: resolvePose(stand),
  sit: resolvePose(sit),
  kneel: resolvePose(kneel),
  cower: resolvePose(cower),
  walk: ACTIONS.walk(0.02),
  run: ACTIONS.run(0.27),
};

describe('a skirt draped over the legs', () => {
  it('covers both thighs of a knee-length skirt in every pose, down to the hem', () => {
    for (const [name, pose] of Object.entries(POSES)) {
      for (const turn of [0, 0.5, 1]) {
        const c = ctxFor(pose, turn);
        const { outline } = drapeOverLegs(c, DRAPES.knee);
        for (const leg of [c.j.legs.back, c.j.legs.front]) {
          const thigh = Math.hypot(leg.knee.x - leg.hip.x, leg.knee.y - leg.hip.y);
          for (const far of [0.1, 0.25, 0.4, 0.49]) {
            const u = Math.min(1, far / thigh);
            const p = {
              x: leg.hip.x + (leg.knee.x - leg.hip.x) * u,
              y: leg.hip.y + (leg.knee.y - leg.hip.y) * u,
            };
            // A leg on the ground is as low as cloth can go.
            if (p.y > -0.03) continue;
            expect(inside(p, outline), `${name} at turn ${turn}, ${far} down the thigh`).toBe(true);
          }
        }
      }
    }
  });

  it('lies over the lap of someone sitting, not straight down from the hips', () => {
    const c = ctxFor(POSES.sit as ResolvedPose);
    const seated = drapeOverLegs(c, DRAPES.knee);
    const reach = Math.max(...seated.outline.map((p) => p.x)) - c.j.hip.x;
    const standing = ctxFor(POSES.stand as ResolvedPose);
    const hanging = drapeOverLegs(standing, DRAPES.knee);
    // The seated skirt goes forward along the thighs, and its hem ends much nearer the height
    // of the hips than a hanging one does.
    expect(reach).toBeGreaterThan(0.4);
    expect(seated.low - c.j.hip.y).toBeLessThan(hanging.low - standing.j.hip.y - 0.15);
  });

  it('covers the knees of a long robe or gown, sitting and kneeling too', () => {
    for (const shape of [DRAPES.ankle, DRAPES.floor]) {
      for (const name of ['stand', 'sit', 'kneel', 'walk']) {
        const c = ctxFor(POSES[name] as ResolvedPose);
        const { outline } = drapeOverLegs(c, shape);
        for (const leg of [c.j.legs.back, c.j.legs.front]) {
          if (leg.knee.y > -0.03) continue;
          expect(inside(leg.knee, outline), name).toBe(true);
        }
      }
    }
  });

  it('never goes under the ground, and its lowest point is its hem', () => {
    for (const shape of Object.values(DRAPES)) {
      for (const pose of Object.values(POSES)) {
        const drape = drapeOverLegs(ctxFor(pose), shape);
        for (const p of drape.outline) expect(p.y).toBeLessThanOrEqual(-0.03 + 1e-9);
        expect(drape.low).toBeCloseTo(Math.max(...drape.outline.map((p) => p.y)), 9);
      }
    }
  });

  it('hangs evenly on someone standing straight and facing us', () => {
    const c = ctxFor(POSES.stand as ResolvedPose, 0);
    for (const shape of Object.values(DRAPES)) {
      const { outline } = drapeOverLegs(c, shape);
      const left = c.j.hip.x - Math.min(...outline.map((p) => p.x));
      const right = Math.max(...outline.map((p) => p.x)) - c.j.hip.x;
      expect(Math.abs(left - right)).toBeLessThan(0.08);
      // Wider at the hem than at the waist.
      expect(left + right).toBeGreaterThan(shape.waist * 2);
    }
  });

  it('is longer for a robe than for a skirt, and reaches the floor for a gown', () => {
    const c = ctxFor(POSES.stand as ResolvedPose);
    const knee = drapeOverLegs(c, DRAPES.knee).low;
    const ankle = drapeOverLegs(c, DRAPES.ankle).low;
    const floor = drapeOverLegs(c, DRAPES.floor).low;
    expect(ankle).toBeGreaterThan(knee + 0.4);
    expect(floor).toBeGreaterThanOrEqual(ankle);
    expect(floor).toBeGreaterThan(-0.1);
  });

  it('draws a closed outline with rounded corners and no broken numbers', () => {
    for (const pose of Object.values(POSES)) {
      const { d } = drapeOverLegs(ctxFor(pose), DRAPES.ankle);
      expect(d.startsWith('M ')).toBe(true);
      expect(d.endsWith(' Z')).toBe(true);
      expect(d).toContain(' Q ');
      expect(d).not.toMatch(/NaN|Infinity|undefined/);
    }
  });
});
