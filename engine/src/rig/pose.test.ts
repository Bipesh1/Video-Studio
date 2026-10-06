import { describe, expect, it } from 'vitest';
import { blinkAt, blinkStarts, withLife } from './life';
import {
  BIG_MOVE,
  DEFAULT_TRANSITION,
  WINDUP_DEPTH,
  WINDUP_FRAMES,
  moveFrames,
  poseAt,
  poseDistance,
  resolvePose,
} from './pose';
import {
  POSES,
  handsOverMouth,
  handsUp,
  holdObject,
  kneel,
  point,
  shrug,
  stand,
  wave,
} from './poses';
import { computeSkeleton } from './skeleton';
import { tokens } from '../tokens';

const [minT, maxT] = tokens.motion.poseTransitionFrames;
const fps = tokens.motion.fps;

describe('pose library', () => {
  it('has at least six distinct poses', () => {
    expect(POSES.length).toBeGreaterThanOrEqual(6);
    expect(new Set(POSES.map((p) => p.id)).size).toBe(POSES.length);
  });

  it('hands-over-mouth puts both hands on the mouth, drawn in front of the face', () => {
    const r = resolvePose(handsOverMouth);
    const j = computeSkeleton(r);
    const mouth = { x: j.head.x, y: j.head.y + 0.22 };
    for (const arm of [j.arms.front, j.arms.back]) {
      // Each hand covers one side of the mouth.
      expect(Math.hypot(arm.hand.x - mouth.x, arm.hand.y - mouth.y)).toBeLessThan(0.22);
    }
    expect(r.hands.back.over).toBe(true);
  });

  it('every standing pose puts both feet on the ground line', () => {
    // Kneeling and lying put a leg on the ground along its length, so they are checked apart.
    const planted = POSES.filter((p) => 'foot' in p.legs.front && 'foot' in p.legs.back);
    expect(planted.length).toBeGreaterThanOrEqual(12);
    for (const pose of planted) {
      const j = computeSkeleton(resolvePose(pose));
      expect(Math.abs(j.legs.front.foot.y)).toBeLessThan(1e-6);
      expect(Math.abs(j.legs.back.foot.y)).toBeLessThan(1e-6);
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

  it('directional poses never bend an arm backward (Biku, 2026-10-05)', () => {
    // The resting arm hangs a little behind the body and bends forward at the elbow.
    for (const pose of [holdObject, point]) {
      const back = resolvePose(pose).arms.back;
      expect(back.upper).toBeLessThan(0);
      expect(back.lower).toBeGreaterThan(0);
    }
    // The holding arm reaches out: its elbow is ahead of and below the shoulder, not folded back.
    const arm = computeSkeleton(resolvePose(holdObject)).arms.front;
    expect(arm.elbow.x).toBeGreaterThan(arm.shoulder.x + 0.2);
    expect(arm.elbow.y).toBeGreaterThan(arm.shoulder.y);
    expect(arm.hand.x).toBeGreaterThan(arm.elbow.x);
  });

  it('a hanging arm bends forward once the body is turned, and mirrors seen from the front', () => {
    const r = resolvePose(stand);
    // Seen from the front the two arms mirror each other.
    const front = computeSkeleton(r, { turn: 0 }).arms.back;
    expect(front.forearm).toBeLessThan(r.arms.back.upper);
    // Turned three-quarter or to profile, the same arm bends forward at the elbow.
    for (const turn of [0.5, 1]) {
      const turned = computeSkeleton(r, { turn }).arms.back;
      expect(turned.forearm).toBeGreaterThan(r.arms.back.upper);
    }
    // A shrug is a sideways gesture: it keeps its mirrored arms at every turn.
    const s = resolvePose(shrug);
    expect(computeSkeleton(s, { turn: 0.5 }).arms.back.forearm).toBeCloseTo(
      s.arms.back.upper + s.arms.back.lower,
      9,
    );
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

/** A small move: standing, with the head a little down. */
const lookDownLike = { ...stand, id: 'nod', headTilt: 8 };

describe('pose to pose', () => {
  const keys = [
    { frame: 0, pose: stand },
    { frame: 30, pose: handsUp },
  ];

  it('default snap length is inside the token range', () => {
    expect(DEFAULT_TRANSITION).toBeGreaterThanOrEqual(minT);
    expect(DEFAULT_TRANSITION).toBeLessThanOrEqual(maxT);
  });

  const move = moveFrames(resolvePose(stand), resolvePose(handsUp));
  const done = 30 + move.windup + move.transition;

  it('holds before the key and lands exactly on the target after the move', () => {
    expect(poseAt(29, keys)).toEqual(resolvePose(stand));
    expect(poseAt(done, keys)).toEqual(resolvePose(handsUp));
  });

  it('winds up before a big move and not before a small one', () => {
    const from = resolvePose(stand);
    const to = resolvePose(handsUp);
    expect(poseDistance(from, to)).toBeGreaterThan(BIG_MOVE);
    expect(move.windup).toBe(WINDUP_FRAMES);
    // During the wind-up the arm goes the other way first, by a fraction of the whole move.
    const span = to.arms.front.upper - from.arms.front.upper;
    const pulled = poseAt(30 + WINDUP_FRAMES, keys).arms.front.upper;
    expect((pulled - from.arms.front.upper) / span).toBeCloseTo(-WINDUP_DEPTH, 6);
    for (let f = 30; f <= 30 + WINDUP_FRAMES; f++) {
      expect(poseAt(f, keys).arms.front.upper).toBeLessThanOrEqual(from.arms.front.upper);
    }
    // A small move snaps straight away.
    expect(moveFrames(resolvePose(stand), resolvePose(lookDownLike)).windup).toBe(0);
    // A key can ask for its own wind-up, or for none.
    expect(moveFrames(from, to, { windup: 0 }).windup).toBe(0);
  });

  it('dips the hips in the middle of a big move and brings them back', () => {
    const rest = resolvePose(stand).hipY;
    const mid = poseAt(30 + move.windup + move.transition / 2, keys).hipY;
    // y grows downward, so a dip is a larger y than the straight path between the two poses.
    const straight = (rest + resolvePose(handsUp).hipY) / 2;
    expect(mid).toBeGreaterThan(straight - 0.03);
    expect(poseAt(done, keys).hipY).toBe(resolvePose(handsUp).hipY);
  });

  it('overshoots a little (under 8%) and keeps the feet planted during the snap', () => {
    const from = resolvePose(stand).arms.front.upper;
    const to = resolvePose(handsUp).arms.front.upper;
    let peak = from;
    for (let f = 30; f <= done; f += 0.25) {
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

  it('life during holds shifts the weight but never moves a planted foot', () => {
    const base = resolvePose(stand);
    const feet = computeSkeleton(base).legs;
    let hipMoved = false;
    for (let f = 0; f < 300; f += 7) {
      const alive = withLife(base, f, fps, 7);
      const j = computeSkeleton(alive);
      expect(j.legs.front.foot.x).toBeCloseTo(feet.front.foot.x, 6);
      expect(j.legs.back.foot.x).toBeCloseTo(feet.back.foot.x, 6);
      expect(Math.abs(j.legs.front.foot.y)).toBeLessThan(1e-6);
      if (Math.abs(alive.rootX - base.rootX) > 0.01) hipMoved = true;
    }
    expect(hipMoved).toBe(true);
    expect(withLife(base, 47, fps, 7).headTilt).not.toBe(base.headTilt);
  });

  it('life leaves the hip alone when a leg is not planted on a foot point', () => {
    const base = resolvePose(kneel);
    const alive = withLife(base, 60, fps, 3);
    expect(alive.rootX).toBe(base.rootX);
    expect(alive.hipY).toBe(base.hipY);
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
