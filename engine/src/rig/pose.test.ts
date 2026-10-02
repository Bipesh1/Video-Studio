import { describe, expect, it } from 'vitest';
import { blinkAt, blinkStarts, withLife } from './life';
import { DEFAULT_TRANSITION, poseAt, resolvePose } from './pose';
import { POSES, handsUp, holdObject, point, stand, wave } from './poses';
import { computeSkeleton } from './skeleton';
import { tokens } from '../tokens';

const [minT, maxT] = tokens.motion.poseTransitionFrames;
const fps = tokens.motion.fps;

describe('pose library', () => {
  it('has six distinct poses', () => {
    expect(POSES).toHaveLength(6);
    expect(new Set(POSES.map((p) => p.id)).size).toBe(6);
  });

  it('every standing pose puts both feet on the ground line', () => {
    for (const pose of POSES) {
      const j = computeSkeleton(resolvePose(pose));
      expect(Math.abs(j.legs.front.foot.y)).toBeLessThan(1e-9);
      expect(Math.abs(j.legs.back.foot.y)).toBeLessThan(1e-9);
    }
  });

  it('IK reaches put the hand where the pose asks', () => {
    const r = resolvePose(holdObject);
    const j = computeSkeleton(r);
    const spec = holdObject.arms.front;
    if (!('reach' in spec)) throw new Error('hold-object should use an IK reach');
    expect(j.arms.front.hand.x - j.shoulder.x).toBeCloseTo(spec.reach.x, 9);
    expect(j.arms.front.hand.y - j.shoulder.y).toBeCloseTo(spec.reach.y, 9);
  });

  it('hands follow guide v2: grip to hold, finger to point, mittens at rest', () => {
    expect(resolvePose(holdObject).hands.front.shape).toBe('grip');
    expect(resolvePose(point).hands.front.shape).toBe('point');
    expect(resolvePose(wave).hands.front.shape).toBe('mitten');
    expect(resolvePose(stand).hands.back.shape).toBe('mitten');
  });

  it('raised arms stay outside the head (they never cross the face)', () => {
    for (const pose of [wave, handsUp]) {
      const j = computeSkeleton(resolvePose(pose));
      for (const arm of [j.arms.front, j.arms.back]) {
        const d = Math.hypot(arm.elbow.x - j.head.x, arm.elbow.y - j.head.y);
        expect(d).toBeGreaterThan(0.5);
      }
    }
  });
});

describe('pose to pose', () => {
  const keys = [
    { frame: 0, pose: stand },
    { frame: 30, pose: handsUp },
  ];

  it('default snap length is inside the token range', () => {
    expect(DEFAULT_TRANSITION).toBeGreaterThanOrEqual(minT);
    expect(DEFAULT_TRANSITION).toBeLessThanOrEqual(maxT);
  });

  it('holds before the key and lands exactly on the target after the snap', () => {
    expect(poseAt(29, keys)).toEqual(resolvePose(stand));
    expect(poseAt(30 + DEFAULT_TRANSITION, keys)).toEqual(resolvePose(handsUp));
  });

  it('overshoots a little (under 8%) and keeps the feet planted during the snap', () => {
    const from = resolvePose(stand).arms.front.upper;
    const to = resolvePose(handsUp).arms.front.upper;
    let peak = from;
    for (let f = 30; f <= 30 + DEFAULT_TRANSITION; f += 0.25) {
      const p = poseAt(f, keys);
      peak = Math.max(peak, p.arms.front.upper);
      const j = computeSkeleton(p);
      expect(Math.abs(j.legs.front.foot.y)).toBeLessThan(1e-9);
      expect(Math.abs(j.legs.back.foot.y)).toBeLessThan(1e-9);
    }
    const overshoot = (peak - to) / (to - from);
    expect(overshoot).toBeGreaterThan(0);
    expect(overshoot).toBeLessThan(0.08);
  });

  it('life during holds moves the upper body only', () => {
    const base = resolvePose(stand);
    const alive = withLife(base, 47, fps, 7);
    expect(alive.legs).toEqual(base.legs);
    expect(alive.headTilt).not.toBe(base.headTilt);
  });
});

describe('blinking', () => {
  const [lo, hi] = tokens.motion.blinkEverySeconds;

  it('blinks every 2 to 4 seconds, from the seed', () => {
    const starts = blinkStarts(4182, fps, 60 * fps);
    expect(starts.length).toBeGreaterThan(10);
    for (let i = 1; i < starts.length; i++) {
      const gap = ((starts[i] ?? 0) - (starts[i - 1] ?? 0)) / fps;
      expect(gap).toBeGreaterThanOrEqual(lo - 1 / fps);
      expect(gap).toBeLessThanOrEqual(hi + 1 / fps);
    }
  });

  it('is deterministic per seed and different across seeds', () => {
    expect(blinkStarts(1, fps, 600)).toEqual(blinkStarts(1, fps, 600));
    expect(blinkStarts(1, fps, 600)).not.toEqual(blinkStarts(2, fps, 600));
  });

  it('closes fully and opens again within a few frames', () => {
    const start = blinkStarts(9, fps, 300)[1] ?? 0;
    expect(blinkAt(start - 1, fps, 9)).toBe(0);
    expect(blinkAt(start + 1, fps, 9)).toBe(1);
    expect(blinkAt(start + 6, fps, 9)).toBe(0);
  });
});
