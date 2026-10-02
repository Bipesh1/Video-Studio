import { describe, expect, it } from 'vitest';
import { dist } from './math';
import { computeSkeleton } from './skeleton';
import { DEFAULT_WALK, walkAt, walkSpeed } from './walk';

const fps = 30;
const frames = Math.round(3 * DEFAULT_WALK.period * fps);
const sides = ['front', 'back'] as const;

describe('walk cycle', () => {
  it('feet reach their targets every frame (IK never clamps)', () => {
    for (let f = 0; f <= frames; f++) {
      const w = walkAt(f / fps);
      const j = computeSkeleton(w.pose);
      for (const s of sides) expect(dist(j.legs[s].foot, w.feet[s].pos)).toBeLessThan(1e-6);
    }
  });

  it('planted feet sit exactly on the ground line and never slide', () => {
    const lastPlanted: Record<(typeof sides)[number], number | null> = { front: null, back: null };
    for (let f = 0; f <= frames; f++) {
      const w = walkAt(f / fps);
      const j = computeSkeleton(w.pose);
      for (const s of sides) {
        const foot = w.feet[s];
        if (foot.planted) {
          expect(Math.abs(j.legs[s].foot.y)).toBeLessThan(1e-6);
          const prev = lastPlanted[s];
          if (prev !== null) expect(foot.pos.x).toBeCloseTo(prev, 9);
          lastPlanted[s] = foot.pos.x;
        } else {
          lastPlanted[s] = null;
        }
      }
    }
  });

  it('swinging feet never go below the ground', () => {
    for (let f = 0; f <= frames; f++) {
      const w = walkAt(f / fps);
      for (const s of sides) expect(w.feet[s].pos.y).toBeLessThanOrEqual(1e-9);
    }
  });

  it('always has at least one foot on the ground (a walk, not a run)', () => {
    for (let f = 0; f <= frames; f++) {
      const w = walkAt(f / fps);
      expect(w.feet.front.planted || w.feet.back.planted).toBe(true);
    }
  });

  it('moves forward at a steady speed and repeats each cycle', () => {
    const v = walkSpeed(DEFAULT_WALK);
    expect(walkAt(2).pose.rootX).toBeCloseTo(2 * v, 9);
    const a = walkAt(0.3).pose;
    const b = walkAt(0.3 + DEFAULT_WALK.period).pose;
    expect(b.legs.front.upper).toBeCloseTo(a.legs.front.upper, 6);
    expect(b.hipY).toBeCloseTo(a.hipY, 9);
  });

  it('knees bend forward, toward the facing direction', () => {
    for (let f = 0; f <= frames; f += 3) {
      const j = computeSkeleton(walkAt(f / fps).pose);
      for (const s of sides) {
        const { hip, knee, foot } = j.legs[s];
        // Knee on the +x side of the hip-to-foot line.
        const cross = (foot.x - hip.x) * (knee.y - hip.y) - (foot.y - hip.y) * (knee.x - hip.x);
        expect(cross).toBeLessThanOrEqual(1e-9);
      }
    }
  });
});
