import { resolvePose, shiftHip } from './pose';
import type { Pose } from './pose';
import { ELBOW_DOWN } from './ik';
import { vec } from './math';
import type { ResolvedPose } from './types';
import { WALKS, walkAt } from './walk';

/**
 * Everyday actions (Part 2, section 7.4): poses that move on their own, as a function of time
 * in seconds, like the walk. Feet stay planted; only the body above them moves.
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

/** Every action by the name the library uses, as a pose over time in seconds. */
export const ACTIONS = {
  walk: (time: number) => walkAt(time).pose,
  'walk-proud': (time: number) => walkAt(time, WALKS.proud).pose,
  'walk-tired': (time: number) => walkAt(time, WALKS.tired).pose,
  'walk-sneaky': (time: number) => walkAt(time, WALKS.sneaky).pose,
  'walk-happy': (time: number) => walkAt(time, WALKS.happy).pose,
  cheer: cheerAt,
  cry: cryAt,
} as const satisfies Record<string, (time: number) => ResolvedPose>;

export type ActionName = keyof typeof ACTIONS;
