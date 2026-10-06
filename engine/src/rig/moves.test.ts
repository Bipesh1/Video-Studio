import { describe, expect, it } from 'vitest';
import { ACTIONS } from './actions';
import type { ActionName } from './actions';
import { STAND_HIP_HEIGHT, body } from './body';
import { dist } from './math';
import {
  FALL,
  JUMP,
  PUNCH,
  RECOIL,
  SWING,
  fallAt,
  fallBackAt,
  jumpAt,
  punchAt,
  recoilAt,
  swingAt,
  track,
} from './moves';
import { computeSkeleton } from './skeleton';
import type { ResolvedPose } from './types';
import { DEFAULT_WALK, GAITS, walkAt, walkSpeed } from './walk';
import type { Gait } from './walk';

/** Phase 2D: the action moves. */

const fps = 30;
const sides = ['front', 'back'] as const;
const framesOf = (seconds: number) => Math.round(seconds * fps);
const each = (
  seconds: number,
  fn: (time: number, pose: ResolvedPose) => void,
  at: (t: number) => ResolvedPose,
) => {
  for (let f = 0; f <= framesOf(seconds); f++) fn(f / fps, at(f / fps));
};

describe('a track of timed values', () => {
  it('holds before the first key and after the last, and eases between', () => {
    const keys = [
      [1, 10],
      [2, 20],
    ] as const;
    expect(track(0, keys)).toBe(10);
    expect(track(3, keys)).toBe(20);
    expect(track(1.5, keys)).toBeCloseTo(15, 9);
    expect(track(1.1, keys)).toBeLessThan(11);
  });
});

describe('ways of moving on foot', () => {
  const gaits = Object.keys(GAITS) as Gait[];

  it.each(gaits)('%s: feet reach their targets, planted feet never slide or sink', (name) => {
    const p = GAITS[name];
    const last: Record<(typeof sides)[number], number | null> = { front: null, back: null };
    for (let f = 0; f <= framesOf(3 * p.period); f++) {
      const w = walkAt(f / fps, p);
      const j = computeSkeleton(w.pose);
      for (const s of sides) {
        expect(dist(j.legs[s].foot, w.feet[s].pos)).toBeLessThan(1e-6);
        expect(w.feet[s].pos.y).toBeLessThanOrEqual(1e-9);
        const prev = last[s];
        if (w.feet[s].planted && prev !== null) expect(w.feet[s].pos.x).toBeCloseTo(prev, 9);
        last[s] = w.feet[s].planted ? w.feet[s].pos.x : null;
      }
    }
  });

  it('a run leaves the ground between steps and is much faster than a walk', () => {
    let flying = 0;
    for (let f = 0; f < framesOf(GAITS.run.period * 4); f++) {
      const w = walkAt(f / fps, GAITS.run);
      if (!w.feet.front.planted && !w.feet.back.planted) flying++;
    }
    expect(flying).toBeGreaterThan(4);
    expect(walkSpeed(GAITS.run)).toBeGreaterThan(walkSpeed(DEFAULT_WALK) * 2.5);
    // The body is highest in the air and lowest in the middle of a step.
    const midStep = walkAt((GAITS.run.stance / 2) * GAITS.run.period, GAITS.run).pose.hipY;
    const midAir = walkAt(((GAITS.run.stance + 0.5) / 2) * GAITS.run.period, GAITS.run).pose.hipY;
    expect(midAir).toBeLessThan(midStep);
  });

  it.each(['carry', 'push', 'pull'] as const)('%s: the hands stay on the load', (name) => {
    const p = GAITS[name];
    const heights = new Set<string>();
    const ahead = new Set<string>();
    for (let f = 0; f < framesOf(p.period * 2); f++) {
      const pose = walkAt(f / fps, p).pose;
      const j = computeSkeleton(pose);
      heights.add(j.arms.front.hand.y.toFixed(4));
      ahead.add((j.arms.front.hand.x - pose.rootX).toFixed(4));
      expect(j.arms.front.hand.x).toBeGreaterThan(pose.rootX + 0.4);
    }
    expect(heights.size).toBe(1);
    expect(ahead.size).toBe(1);
  });

  it('pushing drives from behind the hips, pulling braces out in front', () => {
    const feet = (name: 'push' | 'pull' | 'carry') => {
      const xs: number[] = [];
      for (let f = 0; f < framesOf(GAITS[name].period * 2); f++) {
        const w = walkAt(f / fps, GAITS[name]);
        for (const s of sides) if (w.feet[s].planted) xs.push(w.feet[s].pos.x - w.pose.rootX);
      }
      return { nearest: Math.max(...xs), farthest: Math.min(...xs), ahead: Math.max(...xs) };
    };
    // No planted foot is ever ahead of the hips in a push, and the back foot is far behind.
    expect(feet('push').nearest).toBeLessThan(0.05);
    expect(feet('push').farthest).toBeLessThan(-0.7);
    // In a pull no planted foot is ever behind the hips.
    expect(feet('pull').farthest).toBeGreaterThan(-0.05);
    // A carry steps evenly under the body.
    expect(feet('carry').nearest).toBeCloseTo(-feet('carry').farthest, 1);
  });

  it('both palms of a push are at the same distance ahead, one above the other', () => {
    const j = computeSkeleton(walkAt(0.3, GAITS.push).pose);
    expect(j.arms.front.hand.x).toBeCloseTo(j.arms.back.hand.x, 6);
    expect(j.arms.back.hand.y - j.arms.front.hand.y).toBeGreaterThan(0.2);
  });

  it('pulling steps backward while still facing the load', () => {
    expect(ACTIONS.pull(1).rootX).toBeLessThan(ACTIONS.pull(0).rootX - 0.3);
    expect(ACTIONS.pull(0.4).torsoLean).toBeLessThan(-15);
    expect(ACTIONS.push(0.4).torsoLean).toBeGreaterThan(25);
  });
});

describe('a jump', () => {
  it('starts and ends standing, and lands as far ahead as asked', () => {
    const start = jumpAt(0, 0.9, 1.5);
    const end = jumpAt(JUMP.end, 0.9, 1.5);
    expect(start.hipY).toBeCloseTo(-STAND_HIP_HEIGHT, 9);
    expect(end.hipY).toBeCloseTo(-STAND_HIP_HEIGHT, 9);
    expect(start.rootX).toBe(0);
    expect(end.rootX).toBeCloseTo(1.5, 9);
    expect(jumpAt(JUMP.end + 2).rootX).toBeCloseTo(1.5, 9);
  });

  it('rises as high as asked and has both feet off the ground at the top', () => {
    const top = jumpAt((JUMP.takeoff + JUMP.land) / 2, 0.9, 1.5);
    expect(-top.hipY).toBeGreaterThan(STAND_HIP_HEIGHT + 0.8);
    const j = computeSkeleton(top);
    for (const s of sides) expect(j.legs[s].foot.y).toBeLessThan(-0.6);
  });

  it('crouches before it springs and sinks when it lands', () => {
    expect(-jumpAt(JUMP.crouch).hipY).toBeLessThan(STAND_HIP_HEIGHT * 0.75);
    expect(-jumpAt(JUMP.land + 0.12).hipY).toBeLessThan(STAND_HIP_HEIGHT * 0.75);
  });

  it('never puts a foot under the ground, and feet on the ground do not slide', () => {
    let before: number | null = null;
    each(
      JUMP.end,
      (time, pose) => {
        const j = computeSkeleton(pose);
        for (const s of sides) expect(j.legs[s].foot.y).toBeLessThan(1e-6);
        if (time < JUMP.takeoff) {
          if (before !== null) expect(j.legs.front.foot.x).toBeCloseTo(before, 6);
          before = j.legs.front.foot.x;
        }
      },
      (t) => jumpAt(t),
    );
  });
});

describe('falls', () => {
  const headBottom = (pose: ResolvedPose) => computeSkeleton(pose).head.y + body.headRadiusY;

  it.each([
    ['forward', fallAt, 1],
    ['backward', fallBackAt, -1],
  ] as const)(
    '%s: ends flat on the ground, the right way round, and stays there',
    (_n, at, way) => {
      const end = at(FALL.end);
      expect(-end.hipY).toBeLessThan(0.2);
      expect(Math.abs(end.torsoLean)).toBeGreaterThan(60);
      expect(Math.sign(end.torsoLean)).toBe(way);
      expect(Math.sign(end.rootX)).toBe(way);
      expect(at(FALL.end + 3)).toEqual(end);
    },
  );

  it.each([
    ['forward', fallAt],
    ['backward', fallBackAt],
  ] as const)('%s: nothing sinks into the ground on the way down', (_n, at) => {
    each(
      FALL.end,
      (_time, pose) => {
        const j = computeSkeleton(pose);
        expect(headBottom(pose)).toBeLessThan(0.03);
        for (const s of sides) {
          expect(j.legs[s].foot.y).toBeLessThan(1e-6);
          // A knee may rest on the ground, by about the thickness of the leg line.
          expect(j.legs[s].knee.y).toBeLessThan(0.08);
        }
      },
      at,
    );
  });

  it('bounces once when it lands', () => {
    expect(-fallAt(FALL.ground + 0.09).hipY).toBeGreaterThan(-fallAt(FALL.ground).hipY + 0.05);
    expect(-fallAt(FALL.end).hipY).toBeLessThan(-fallAt(FALL.ground + 0.09).hipY);
  });
});

describe('a fight: wind-up, swing, hit, recoil', () => {
  const fistX = (pose: ResolvedPose) => computeSkeleton(pose).arms.front.hand.x;

  it('a punch pulls the fist back first, then reaches farthest at the hit', () => {
    const rest = fistX(punchAt(0));
    expect(fistX(punchAt(PUNCH.windup))).toBeLessThan(rest);
    const reach = fistX(punchAt(PUNCH.hit));
    expect(reach).toBeGreaterThan(rest + 1);
    each(PUNCH.end, (_t, pose) => expect(fistX(pose)).toBeLessThanOrEqual(reach + 0.03), punchAt);
  });

  it('a punch is thrown with fists and returns to the stand it started from', () => {
    expect(punchAt(PUNCH.hit).hands.front.shape).toBe('grip');
    expect(punchAt(0).hands.front.shape).toBe('mitten');
    const start = punchAt(0);
    const end = punchAt(PUNCH.end);
    expect(end.rootX).toBeCloseTo(start.rootX, 9);
    expect(end.arms.front.upper).toBeCloseTo(start.arms.front.upper, 9);
    expect(end.torsoLean).toBeCloseTo(0, 9);
  });

  it('a swing goes up and back, then comes down in front, gripping all the way', () => {
    const j = (t: number) => computeSkeleton(swingAt(t));
    const up = j(SWING.windup);
    const down = j(SWING.hit);
    expect(up.arms.front.hand.y).toBeLessThan(up.head.y);
    expect(up.arms.front.hand.x).toBeLessThan(up.head.x);
    expect(down.arms.front.hand.x).toBeGreaterThan(down.head.x + 0.6);
    expect(down.arms.front.hand.y).toBeGreaterThan(down.head.y);
    each(SWING.end, (_t, pose) => expect(pose.hands.front.shape).toBe('grip'), swingAt);
    // The handle is upright at rest and tipped forward when it lands.
    expect(swingAt(0).hands.front.gripAxis).toBe(-90);
    expect(swingAt(SWING.hit).hands.front.gripAxis ?? -90).toBeGreaterThan(-30);
  });

  it('a recoil throws the head back at once and ends upright, a step or two behind', () => {
    expect(recoilAt(0.06).headTilt).toBeLessThan(-20);
    expect(recoilAt(0.07).torsoLean).toBeLessThan(-15);
    const end = recoilAt(RECOIL.end);
    expect(end.rootX).toBeCloseTo(-RECOIL.back, 9);
    expect(end.torsoLean).toBeCloseTo(0, 9);
    expect(end.hipY).toBeCloseTo(-STAND_HIP_HEIGHT, 9);
  });

  it.each([
    ['punch', punchAt, PUNCH.end],
    ['swing', swingAt, SWING.end],
    ['recoil', recoilAt, RECOIL.end],
  ] as const)('%s: no foot goes under the ground and every leg reaches its foot', (_n, at, end) => {
    each(
      end,
      (_t, pose) => {
        const j = computeSkeleton(pose);
        for (const s of sides) {
          expect(j.legs[s].foot.y).toBeLessThan(1e-6);
          const planted = pose.legs[s].foot;
          if (planted) expect(dist(j.legs[s].foot, planted)).toBeLessThan(1e-6);
        }
      },
      at,
    );
  });
});

describe('every action', () => {
  it.each(Object.keys(ACTIONS) as ActionName[])(
    '%s gives a whole, finite pose at any time',
    (name) => {
      for (let f = 0; f <= 90; f++) {
        const j = computeSkeleton(ACTIONS[name](f / fps));
        const points = [
          j.hip,
          j.neck,
          j.head,
          ...sides.flatMap((s) => [j.arms[s].hand, j.legs[s].foot]),
        ];
        for (const p of points) {
          expect(Number.isFinite(p.x)).toBe(true);
          expect(Number.isFinite(p.y)).toBe(true);
        }
      }
    },
  );
});
