import { STAND_HIP_HEIGHT, body } from './body';
import { ELBOW_DOWN, KNEE_FORWARD } from './ik';
import { vec } from './math';
import type { Pose } from './pose';

/**
 * Phase 1 pose set. Space: head units, character facing +x, y down.
 * Standing feet are placed with IK on the ground line, knees bowing slightly outward.
 * Arm angles are degrees from straight down, positive toward the facing direction.
 */

const feet = (spread = 0.2) =>
  ({
    front: { foot: vec(spread, 0), bend: -1 },
    back: { foot: vec(-spread, 0), bend: 1 },
  }) as const;

export const stand: Pose = {
  id: 'stand',
  arms: { front: { upper: 16, lower: 6 }, back: { upper: -16, lower: -6 } },
  legs: feet(),
};

/** Waving uses a resting (mitten) hand, per guide v2. */
export const wave: Pose = {
  id: 'wave',
  headTilt: -4,
  // The upper arm goes out to the side first, so it never crosses the face.
  arms: { front: { upper: 120, lower: 42 }, back: { upper: -16, lower: -6 } },
  legs: feet(),
};

/** Pointing shows one extended finger (guide v2). */
export const point: Pose = {
  id: 'point',
  torsoLean: 4,
  headTilt: -2,
  arms: {
    front: { upper: 86, lower: 2, hand: 'point', thumb: -1 },
    // A resting arm bends forward at the elbow, never backward.
    back: { upper: -12, lower: 8 },
  },
  legs: feet(0.24),
};

export const shrug: Pose = {
  id: 'shrug',
  headTilt: 9,
  arms: { front: { upper: 42, lower: 98 }, back: { upper: -42, lower: -98 } },
  legs: feet(),
};

export const handsUp: Pose = {
  id: 'hands-up',
  hipHeight: 1.35,
  arms: { front: { upper: 115, lower: 47 }, back: { upper: -115, lower: -47 } },
  legs: feet(0.28),
};

/**
 * Holding an upright object out in front, like the king's sword arm in Reference A: the arm
 * reaches forward and a little down, the elbow ahead of the shoulder, never folded back.
 * The other arm hangs relaxed with a slight forward bend. The hand grips with fingers.
 */
export const holdObject: Pose = {
  id: 'hold-object',
  arms: {
    front: { reach: vec(0.92, 0.46), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: { upper: -12, lower: 8 },
  },
  legs: feet(0.22),
};

/** Both hands pressed over the mouth in shock. Both arms are drawn in front of the face. */
export const handsOverMouth: Pose = {
  id: 'hands-over-mouth',
  torsoLean: -3,
  headTilt: -3,
  arms: {
    front: { reach: vec(0.13, -0.4), bend: 1, thumb: -1, over: true },
    back: { reach: vec(-0.13, -0.38), bend: -1, thumb: 1, over: true },
  },
  legs: feet(),
};

/** Both knees bend forward, for crouches and seats seen from the side. */
const crouchFeet = (front: number, back: number) =>
  ({
    front: { foot: vec(front, 0), bend: KNEE_FORWARD },
    back: { foot: vec(back, 0), bend: KNEE_FORWARD },
  }) as const;

/** A relaxed arm at the side: a little behind the body, bending forward at the elbow. */
const resting = { upper: -12, lower: 8 } as const;

// ---------------------------------------------------------------------------------------------
// Phase 2C poses. Heights are written from the bone lengths, so they follow the body if its
// proportions ever change.

/**
 * Sitting on a seat as high as the shins are long: thighs level, shins straight down, hands on
 * the lap. The seat itself is a prop or a set piece.
 */
export const sit: Pose = {
  id: 'sit',
  hipHeight: body.shin,
  torsoLean: -2,
  arms: {
    front: { reach: vec(0.46, 0.86), bend: ELBOW_DOWN },
    back: { reach: vec(0.33, 0.88), bend: ELBOW_DOWN },
  },
  legs: crouchFeet(body.thigh + 0.04, body.thigh - 0.09),
};

/** Down on one knee, the other foot planted, a hand on the raised knee and the head bowed. */
export const kneel: Pose = {
  id: 'kneel',
  hipHeight: body.thigh + 0.02,
  torsoLean: 5,
  headTilt: 7,
  arms: { front: { reach: vec(0.56, 0.88), bend: ELBOW_DOWN }, back: resting },
  legs: {
    front: { foot: vec(0.52, 0), bend: KNEE_FORWARD },
    back: { upper: -8, lower: -100 },
  },
};

/**
 * Lying on the ground on one side, head down: asleep, fallen or defeated. One arm lies along
 * the body and the other reaches forward along the ground, so the two never clump at the hip.
 */
export const lie: Pose = {
  id: 'lie',
  hipHeight: 0.1,
  torsoLean: 71,
  headTilt: 12,
  arms: { front: { upper: -72, lower: -8 }, back: { upper: 74, lower: 6 } },
  legs: { front: { upper: -84, lower: -4 }, back: { upper: -93, lower: 4 } },
};

/** Arms folded across the chest. Both forearms are drawn in front of the body. */
export const crossArms: Pose = {
  id: 'cross-arms',
  torsoLean: -2,
  arms: {
    front: { upper: 24, lower: -124, over: true },
    back: { upper: -24, lower: 124, over: true },
  },
  legs: feet(0.22),
};

/** Standing with the head tipped back to look at something above. */
export const lookUp: Pose = {
  id: 'look-up',
  torsoLean: -4,
  headTilt: -22,
  arms: { front: { upper: 10, lower: 8 }, back: resting },
  legs: feet(),
};

/** Standing with the head bowed to look at something below. */
export const lookDown: Pose = {
  id: 'look-down',
  torsoLean: 5,
  headTilt: 22,
  arms: { front: { upper: 10, lower: 8 }, back: resting },
  legs: feet(),
};

/** Crouched and hunched with both arms raised over the top of the head; the face still shows. */
export const cower: Pose = {
  id: 'cower',
  hipHeight: STAND_HIP_HEIGHT * 0.78,
  torsoLean: 20,
  headTilt: 8,
  arms: {
    front: { reach: vec(0.46, -1.0), bend: ELBOW_DOWN, over: true },
    back: { reach: vec(0.12, -1.1), bend: ELBOW_DOWN, over: true },
  },
  legs: crouchFeet(0.26, -0.22),
};

/**
 * A hug: leaning in with both arms wrapped around someone standing close in front. Stand the
 * two about 1.2 head-widths apart, facing each other, so their heads sit cheek to cheek.
 */
export const hug: Pose = {
  id: 'hug',
  torsoLean: 10,
  headTilt: -6,
  arms: {
    front: { reach: vec(0.98, 0.16), bend: ELBOW_DOWN },
    back: { reach: vec(0.92, 0.34), bend: ELBOW_DOWN },
  },
  legs: feet(0.24),
};

/** The Phase 1 set, kept together for its sheet. */
export const PHASE1_POSES = [
  stand,
  wave,
  point,
  shrug,
  handsUp,
  holdObject,
  handsOverMouth,
] as const;
/** The Phase 2C starter set. */
export const MORE_POSES = [sit, kneel, lie, crossArms, lookUp, lookDown, cower, hug] as const;

export const POSES = [...PHASE1_POSES, ...MORE_POSES] as const;
export type PoseId = (typeof POSES)[number]['id'];

export const poseById = (id: string): Pose => {
  const p = POSES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown pose "${id}"`);
  return p;
};
