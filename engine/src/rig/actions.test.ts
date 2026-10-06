import { describe, expect, it } from 'vitest';
import { ACTIONS, CHEER_PERIOD, cheerAt, cryAt } from './actions';
import { body } from './body';
import { resolvePose, shiftHip } from './pose';
import { cower, crossArms, hug, kneel, lie, lookDown, lookUp, sit, stand } from './poses';
import { computeSkeleton, naturalArm } from './skeleton';

/** Phase 2C: the new poses and everyday actions. */

describe('new poses', () => {
  it('sit on a seat as high as the shins, with level thighs', () => {
    const j = computeSkeleton(resolvePose(sit));
    expect(-j.hip.y).toBeCloseTo(body.shin, 9);
    // Knees at hip height, in front of the hip; shins straight down to the ground.
    expect(j.legs.front.knee.y).toBeCloseTo(j.hip.y, 1);
    expect(j.legs.front.knee.x).toBeGreaterThan(j.hip.x + 0.5);
    expect(Math.abs(j.legs.front.foot.x - j.legs.front.knee.x)).toBeLessThan(0.12);
  });

  it('kneel with one knee on the ground and the other foot planted ahead', () => {
    const j = computeSkeleton(resolvePose(kneel));
    expect(Math.abs(j.legs.back.knee.y)).toBeLessThan(0.05);
    expect(j.legs.back.foot.x).toBeLessThan(j.legs.back.knee.x - 0.5);
    expect(Math.abs(j.legs.front.foot.y)).toBeLessThan(1e-6);
    expect(j.legs.front.knee.y).toBeLessThan(-0.5);
  });

  it('lie with the whole body near the ground and the head resting on it', () => {
    const j = computeSkeleton(resolvePose(lie));
    const lowest = (y: number) => -y;
    expect(lowest(j.hip.y)).toBeLessThan(0.2);
    expect(lowest(j.legs.front.foot.y)).toBeLessThan(0.3);
    // The head is one radius above the ground, give or take a little.
    expect(lowest(j.head.y)).toBeGreaterThan(body.headRadiusY - 0.08);
    expect(lowest(j.head.y)).toBeLessThan(body.headRadiusY + 0.15);
    expect(j.head.x).toBeGreaterThan(1.2);
  });

  it('tip the head back to look up and forward to look down', () => {
    expect(resolvePose(lookUp).headTilt).toBeLessThan(-15);
    expect(resolvePose(lookDown).headTilt).toBeGreaterThan(15);
  });

  it('cower low with both hands above the head, drawn in front of it', () => {
    const r = resolvePose(cower);
    const j = computeSkeleton(r);
    expect(j.hip.y).toBeGreaterThan(computeSkeleton(resolvePose(stand)).hip.y + 0.2);
    expect(j.arms.front.hand.y).toBeLessThan(j.head.y);
    expect(j.arms.back.hand.y).toBeLessThan(j.head.y);
    expect(r.hands.front.over && r.hands.back.over).toBe(true);
    // Both knees bend forward, as a crouch seen from the side must.
    expect(j.legs.front.knee.x).toBeGreaterThan(j.legs.front.hip.x);
    expect(j.legs.back.knee.x).toBeGreaterThan(j.legs.back.foot.x);
  });

  it('reach far enough forward to wrap around someone in a hug', () => {
    const j = computeSkeleton(resolvePose(hug));
    expect(j.arms.front.hand.x - j.arms.front.shoulder.x).toBeGreaterThan(0.9);
    expect(j.arms.back.hand.x - j.arms.back.shoulder.x).toBeGreaterThan(0.85);
  });

  it('keep folded arms folded when the body turns', () => {
    const r = resolvePose(crossArms);
    for (const turn of [0, 0.5, 1]) {
      expect(naturalArm(r.arms.front, turn)).toEqual(r.arms.front);
      expect(naturalArm(r.arms.back, turn)).toEqual(r.arms.back);
    }
    // The two hands end on opposite sides of the body: the arms cross.
    const j = computeSkeleton(r);
    expect(j.arms.front.hand.x).toBeLessThan(j.shoulder.x);
    expect(j.arms.back.hand.x).toBeGreaterThan(j.shoulder.x);
  });
});

describe('moving the hip', () => {
  it('keeps planted feet where they are', () => {
    const base = resolvePose(stand);
    const before = computeSkeleton(base);
    const after = computeSkeleton(shiftHip(base, 0.05, 0.1));
    expect(after.hip.y).toBeCloseTo(before.hip.y + 0.1, 9);
    expect(after.hip.x).toBeCloseTo(before.hip.x + 0.05, 9);
    expect(after.legs.front.foot.x).toBeCloseTo(before.legs.front.foot.x, 6);
    expect(after.legs.back.foot.x).toBeCloseTo(before.legs.back.foot.x, 6);
    expect(Math.abs(after.legs.front.foot.y)).toBeLessThan(1e-6);
  });
});

describe('everyday actions', () => {
  it('are listed by name and give a pose at any time', () => {
    expect(Object.keys(ACTIONS).sort()).toEqual([
      'carry',
      'cheer',
      'cry',
      'fall',
      'fall-back',
      'jump',
      'pull',
      'punch',
      'push',
      'recoil',
      'run',
      'swing',
      'walk',
      'walk-happy',
      'walk-proud',
      'walk-sneaky',
      'walk-tired',
    ]);
    for (const at of Object.values(ACTIONS)) {
      expect(Number.isFinite(at(1.234).hipY)).toBe(true);
    }
  });

  it('cheer with both arms thrown up in a V, bouncing with planted feet', () => {
    const heights = new Set<number>();
    for (let k = 0; k < 8; k++) {
      const j = computeSkeleton(cheerAt((k / 8) * CHEER_PERIOD));
      // Hands well above the shoulders, out to both sides: a V.
      expect(j.arms.front.hand.y).toBeLessThan(j.shoulder.y - 0.45);
      expect(j.arms.back.hand.y).toBeLessThan(j.shoulder.y - 0.45);
      expect(j.arms.front.hand.x).toBeGreaterThan(j.shoulder.x + 0.3);
      expect(j.arms.back.hand.x).toBeLessThan(j.shoulder.x - 0.3);
      expect(Math.abs(j.legs.front.foot.y)).toBeLessThan(1e-6);
      expect(j.legs.front.foot.x).toBeCloseTo(0.22, 6);
      heights.add(Math.round(j.hip.y * 1000));
    }
    expect(heights.size).toBeGreaterThan(3);
    // It loops: one period later the pose is the same.
    expect(cheerAt(0.1).hipY).toBeCloseTo(cheerAt(0.1 + CHEER_PERIOD).hipY, 9);
  });

  it('cry with the hands at the face and the feet still', () => {
    for (const t of [0, 0.1, 0.25, 0.6, 1.3]) {
      const r = cryAt(t);
      const j = computeSkeleton(r);
      expect(r.hands.front.over && r.hands.back.over).toBe(true);
      expect(
        Math.hypot(j.arms.front.hand.x - j.head.x, j.arms.front.hand.y - j.head.y),
      ).toBeLessThan(0.4);
      expect(j.legs.back.foot.x).toBeCloseTo(-0.22, 6);
    }
  });
});
