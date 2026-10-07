import { STAND_HIP_HEIGHT } from './body';
import { resolvePose, shiftHip } from './pose';
import type { Pose } from './pose';
import { ELBOW_DOWN } from './ik';
import { vec } from './math';
import type { ResolvedPose } from './types';
import { fallAt, fallBackAt, jumpAt, punchAt, recoilAt, swingAt } from './moves';
import { GAITS, WALKS, walkAt } from './walk';

/**
 * Actions (Part 2, section 7.4): poses that move on their own, as a function of time in
 * seconds. The everyday ones (cheer, cry) are here; the walks and the other ways of moving on
 * foot are in walk.ts; the one-shot action moves (jump, falls, punch, swing, recoil) are in
 * moves.ts. ACTIONS at the bottom lists them all by name.
 */

const TWO_PI = Math.PI * 2;

const feet = {
  front: { foot: vec(0.22, 0), bend: -1 },
  back: { foot: vec(-0.22, 0), bend: 1 },
} as const;

/** Both arms thrown up and out in a V. The cheer pumps them and bounces on the knees. */
const CHEER: Pose = {
  id: 'cheer',
  torsoLean: -3,
  headTilt: -8,
  arms: { front: { upper: 142, lower: -14 }, back: { upper: -142, lower: 14 } },
  legs: feet,
};

/** Seconds for one bounce of a cheer. */
export const CHEER_PERIOD = 0.46;

/** Cheering: arms up and pumping, the body bouncing on bent knees twice a second. */
export function cheerAt(time: number): ResolvedPose {
  const base = resolvePose(CHEER);
  const beat = Math.sin((TWO_PI * time) / CHEER_PERIOD);
  // The body drops fast and springs up: a bounce, not a sway.
  const drop = 0.07 * Math.abs(Math.sin((Math.PI * time) / CHEER_PERIOD)) ** 1.6;
  const pose = shiftHip(base, 0, drop);
  const pump = 14 * beat;
  return {
    ...pose,
    headTilt: pose.headTilt + 3 * beat,
    arms: {
      front: { upper: base.arms.front.upper + pump, lower: base.arms.front.lower + pump * 0.6 },
      back: { upper: base.arms.back.upper - pump, lower: base.arms.back.lower - pump * 0.6 },
    },
  };
}

/** Head bowed into both hands. The cry shakes the shoulders. */
const CRY: Pose = {
  id: 'cry',
  torsoLean: 9,
  headTilt: 15,
  arms: {
    front: { reach: vec(0.22, -0.52), bend: ELBOW_DOWN, thumb: -1, over: true },
    back: { reach: vec(0.02, -0.5), bend: ELBOW_DOWN, thumb: 1, over: true },
  },
  legs: feet,
};

/** Seconds for one sob. */
export const SOB_PERIOD = 0.34;

/** Crying: the face in the hands, shoulders shaking in short sobs with a pause between bursts. */
export function cryAt(time: number): ResolvedPose {
  const base = resolvePose(CRY);
  // Three quick sobs, then a breath: the shaking comes in bursts.
  const burst = Math.max(0, Math.sin((TWO_PI * time) / (SOB_PERIOD * 5)));
  const sob = Math.sin((TWO_PI * time) / SOB_PERIOD) * burst;
  const pose = shiftHip(base, 0, 0.012 * Math.abs(sob));
  return {
    ...pose,
    torsoLean: pose.torsoLean + 1.6 * sob,
    headBob: pose.headBob + 0.02 * Math.abs(sob),
  };
}

/** Hanging in the air: arms drifting out, legs loose under the body, nothing planted. */
const FLOAT: Pose = {
  id: 'float',
  hipHeight: STAND_HIP_HEIGHT + 0.5,
  torsoLean: 3,
  headTilt: -3,
  arms: { front: { upper: 50, lower: 26 }, back: { upper: -54, lower: -22 } },
  legs: { front: { upper: 16, lower: -30 }, back: { upper: -10, lower: -22 } },
};

/**
 * Floating with no gravity: the body hangs off the ground and bobs slowly, the arms and legs
 * drift a little out of time with each other, and the head rolls a touch. For space, for a
 * fall that never lands, for a dream. It goes on for as long as it is held.
 */
export function floatAt(time: number): ResolvedPose {
  const base = resolvePose(FLOAT);
  const slow = (speed: number, phase = 0) => Math.sin(time * speed + phase);
  return {
    ...base,
    hipY: base.hipY - 0.09 * slow(1.1),
    torsoLean: base.torsoLean + 4 * slow(0.7, 1),
    headTilt: base.headTilt + 3 * slow(0.9, 2),
    arms: {
      front: { upper: 50 + 9 * slow(0.8), lower: 26 + 8 * slow(1.3, 1) },
      back: { upper: -54 - 8 * slow(0.75, 2), lower: -22 - 7 * slow(1.2) },
    },
    legs: {
      front: { upper: 16 + 7 * slow(0.9, 1), lower: -30 - 9 * slow(1.1) },
      back: { upper: -10 + 6 * slow(0.8, 3), lower: -22 - 8 * slow(1.0, 2) },
    },
  };
}

/** Every action by the name the library uses, as a pose over time in seconds. */
export const ACTIONS = {
  walk: (time: number) => walkAt(time).pose,
  'walk-proud': (time: number) => walkAt(time, WALKS.proud).pose,
  'walk-tired': (time: number) => walkAt(time, WALKS.tired).pose,
  'walk-sneaky': (time: number) => walkAt(time, WALKS.sneaky).pose,
  'walk-happy': (time: number) => walkAt(time, WALKS.happy).pose,
  cheer: cheerAt,
  cry: cryAt,
  run: (time: number) => walkAt(time, GAITS.run).pose,
  carry: (time: number) => walkAt(time, GAITS.carry).pose,
  push: (time: number) => walkAt(time, GAITS.push).pose,
  // Time runs backward, so the feet step backward while the body leans away from the load.
  pull: (time: number) => walkAt(-time, GAITS.pull).pose,
  jump: (time: number) => jumpAt(time),
  fall: fallAt,
  'fall-back': fallBackAt,
  punch: punchAt,
  swing: swingAt,
  recoil: recoilAt,
  float: floatAt,
} as const satisfies Record<string, (time: number) => ResolvedPose>;

export type ActionName = keyof typeof ACTIONS;
