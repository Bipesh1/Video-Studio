import { describe, expect, it } from 'vitest';
import { CHAIN_BLEND, chainAt, movePose } from './chain';
import type { Link } from './chain';
import { JUMP, jumpAt } from './moves';
import { resolvePose } from './pose';
import { stand } from './poses';
import { computeSkeleton } from './skeleton';
import { GAITS, WALKS, walkAt, walkSpeed } from './walk';

/** Phase 2D: moves played one after another. */

const fps = 30;
const sneak = (s: number) => walkAt(s, WALKS.sneaky).pose;
const run = (s: number) => walkAt(s, GAITS.run).pose;
const jump = (s: number) => jumpAt(s, 0.9, 2);
const links: Link[] = [
  { from: 0, at: sneak },
  { from: 1.3, at: run },
  { from: 2.5, at: jump },
];

describe('a chain of moves', () => {
  it('plays the first move from the start', () => {
    expect(chainAt(0.5, links)).toEqual(sneak(0.5));
  });

  it('starts each move where the last one left the body', () => {
    const sneaked = sneak(1.3).rootX;
    const mid = chainAt(2, links);
    expect(mid.rootX).toBeCloseTo(sneaked + walkSpeed(GAITS.run) * 0.7, 6);
    const ran = sneaked + run(1.2).rootX;
    const end = chainAt(2.5 + JUMP.end, links);
    expect(end.rootX).toBeCloseTo(ran + 2, 6);
  });

  it('never jumps the body along the ground at a change', () => {
    let last = chainAt(0, links).rootX;
    for (let f = 1; f <= Math.round(4 * fps); f++) {
      const x = chainAt(f / fps, links).rootX;
      // No faster than the run, with a little room for the blend.
      expect(Math.abs(x - last)).toBeLessThan((walkSpeed(GAITS.run) / fps) * 1.6);
      last = x;
    }
  });

  it('blends for a moment at each change, then is the new move exactly', () => {
    const origin = sneak(1.3).rootX;
    const during = chainAt(1.3 + CHAIN_BLEND / 2, links);
    const after = chainAt(1.3 + CHAIN_BLEND, links);
    expect(after.rootX).toBeCloseTo(movePose(run(CHAIN_BLEND), origin).rootX, 9);
    expect(after.torsoLean).toBe(run(CHAIN_BLEND).torsoLean);
    expect(after.arms.front.upper).toBeCloseTo(run(CHAIN_BLEND).arms.front.upper, 6);
    expect(during.torsoLean).toBeGreaterThan(Math.min(sneak(1.3).torsoLean, run(0.05).torsoLean));
    expect(during.torsoLean).toBeLessThan(Math.max(sneak(1.3).torsoLean, run(0.05).torsoLean) + 1);
  });

  it('keeps every foot on or above the ground through the changes', () => {
    for (let f = 0; f <= Math.round(4 * fps); f++) {
      const j = computeSkeleton(chainAt(f / fps, links));
      expect(j.legs.front.foot.y).toBeLessThan(0.02);
      expect(j.legs.back.foot.y).toBeLessThan(0.02);
    }
  });
});

describe('moving a pose along the ground', () => {
  it('takes the planted feet with the body', () => {
    const pose = resolvePose(stand);
    const moved = movePose(pose, 3);
    expect(moved.rootX).toBe(3);
    expect(moved.legs.front.foot?.x).toBeCloseTo((pose.legs.front.foot?.x ?? 0) + 3, 9);
    const a = computeSkeleton(pose);
    const b = computeSkeleton(moved);
    expect(b.legs.front.knee.x - a.legs.front.knee.x).toBeCloseTo(3, 9);
    expect(b.head.y).toBeCloseTo(a.head.y, 9);
  });
});
