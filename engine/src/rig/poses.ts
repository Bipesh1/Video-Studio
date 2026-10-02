import { ELBOW_DOWN } from './ik';
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
    back: { upper: -8, lower: -10 },
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

/** Holding an upright object in front, like the king's scepter. The hand grips with fingers. */
export const holdObject: Pose = {
  id: 'hold-object',
  arms: {
    front: { reach: vec(0.62, 0.42), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: { upper: -10, lower: -8 },
  },
  legs: feet(0.22),
};

export const POSES = [stand, wave, point, shrug, handsUp, holdObject] as const;
export type PoseId = (typeof POSES)[number]['id'];

export const poseById = (id: string): Pose => {
  const p = POSES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown pose "${id}"`);
  return p;
};
