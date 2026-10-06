import { armReachToHand, body, STAND_HIP_HEIGHT } from './body';
import { solveTwoBone } from './ik';
import {
  add,
  angleFromDown,
  clamp,
  easeOutBack,
  lerp,
  lerpVec,
  normalizeDeg,
  sub,
  vec,
} from './math';
import type { Vec2 } from './math';
import { shoulderOf } from './skeleton';
import type { HandPose, HandShape, LegState, LimbAngles, ResolvedPose } from './types';
import { tokens } from '../tokens';

type HandOptions = { hand?: HandShape; thumb?: 1 | -1; gripAxis?: number; over?: boolean };

/**
 * An arm is either joint angles (degrees) or an IK reach: the hand center's position
 * relative to the shoulder, in head units, plus which side the elbow bends to.
 */
export type ArmSpec = HandOptions &
  ({ upper: number; lower: number } | { reach: Vec2; bend: 1 | -1 });

/** A leg is either joint angles or a foot placed on a point (y = 0 is the ground line). */
export type LegSpec = { upper: number; lower: number } | { foot: Vec2; bend: 1 | -1 };

/** A pose is data (Part 2, section 7.1). */
export type Pose = {
  id: string;
  hipHeight?: number;
  torsoLean?: number;
  headTilt?: number;
  arms: { front: ArmSpec; back: ArmSpec };
  legs: { front: LegSpec; back: LegSpec };
};

export type PoseKey = { frame: number; pose: Pose; transition?: number };

/** Overshoot for pose snaps: peaks about 5% past the target, then settles. */
export const POSE_OVERSHOOT = 1.2;

const [minTransition, maxTransition] = tokens.motion.poseTransitionFrames;

/** Default snap length in frames, inside the token range (Style 8: 3 to 6 frames). */
export const DEFAULT_TRANSITION = Math.round((minTransition + maxTransition) / 2);

function anglesFromIK(root: Vec2, target: Vec2, a: number, b: number, bend: 1 | -1): LimbAngles {
  const ik = solveTwoBone(root, target, a, b, bend);
  const upper = angleFromDown(sub(ik.joint, root));
  const lowerAbs = angleFromDown(sub(ik.end, ik.joint));
  return { upper, lower: normalizeDeg(lowerAbs - upper) };
}

/** IK for a leg from the hip to a foot point. */
export function legToFoot(hip: Vec2, foot: Vec2, bend: 1 | -1): LegState {
  return { ...anglesFromIK(hip, foot, body.thigh, body.shin, bend), foot, bend };
}

/** IK for an arm from the shoulder to a hand-center point. */
export function armToHand(shoulder: Vec2, hand: Vec2, bend: 1 | -1): LimbAngles {
  return anglesFromIK(shoulder, hand, body.upperArm, armReachToHand, bend);
}

function handOf(spec: HandOptions, defaultThumb: 1 | -1): HandPose {
  const hand: HandPose = { shape: spec.hand ?? 'mitten', thumb: spec.thumb ?? defaultThumb };
  if (spec.gripAxis !== undefined) hand.gripAxis = spec.gripAxis;
  if (spec.over) hand.over = true;
  return hand;
}

function resolveArm(spec: ArmSpec, shoulder: Vec2): LimbAngles {
  if ('reach' in spec) return armToHand(shoulder, add(shoulder, spec.reach), spec.bend);
  return { upper: spec.upper, lower: spec.lower };
}

function resolveLeg(spec: LegSpec, hip: Vec2, rootX: number): LegState {
  if ('foot' in spec) return legToFoot(hip, vec(rootX + spec.foot.x, spec.foot.y), spec.bend);
  return { upper: spec.upper, lower: spec.lower };
}

/** Turn pose data into joint angles, solving IK for reaches and planted feet. */
export function resolvePose(pose: Pose, rootX = 0): ResolvedPose {
  const hipY = -(pose.hipHeight ?? STAND_HIP_HEIGHT);
  const torsoLean = pose.torsoLean ?? 0;
  const hip = vec(rootX, hipY);
  const shoulder = shoulderOf(hip, torsoLean);
  return {
    rootX,
    hipY,
    torsoLean,
    headTilt: pose.headTilt ?? 0,
    headBob: 0,
    arms: {
      front: resolveArm(pose.arms.front, shoulder),
      back: resolveArm(pose.arms.back, shoulder),
    },
    legs: {
      front: resolveLeg(pose.legs.front, hip, rootX),
      back: resolveLeg(pose.legs.back, hip, rootX),
    },
    hands: { front: handOf(pose.arms.front, -1), back: handOf(pose.arms.back, 1) },
  };
}

/**
 * Move the hip of a resolved pose, keeping planted feet where they are: the legs are solved
 * again from the new hip. Legs given as angles ride along unchanged.
 */
export function shiftHip(pose: ResolvedPose, dx: number, dy: number): ResolvedPose {
  const hip = vec(pose.rootX + dx, pose.hipY + dy);
  const replant = (l: LegState): LegState => (l.foot ? legToFoot(hip, l.foot, l.bend ?? 1) : l);
  return {
    ...pose,
    rootX: hip.x,
    hipY: hip.y,
    legs: { front: replant(pose.legs.front), back: replant(pose.legs.back) },
  };
}

const lerpLimb = (a: LimbAngles, b: LimbAngles, t: number): LimbAngles => ({
  upper: lerp(a.upper, b.upper, t),
  lower: lerp(a.lower, b.lower, t),
});

/**
 * Blend two resolved poses. t runs 0 to 1 over the transition.
 * Arms and head take the overshooting ease. Hips and planted feet take a clamped ease,
 * so feet never sink below the ground or slide during a snap.
 */
export function blendPoses(a: ResolvedPose, b: ResolvedPose, t: number): ResolvedPose {
  const e = easeOutBack(t, POSE_OVERSHOOT);
  const ec = clamp(e, 0, 1);
  const rootX = lerp(a.rootX, b.rootX, ec);
  const hipY = lerp(a.hipY, b.hipY, ec);
  const hip = vec(rootX, hipY);

  const blendLeg = (la: LegState, lb: LegState): LegState => {
    if (la.foot && lb.foot) return legToFoot(hip, lerpVec(la.foot, lb.foot, ec), lb.bend ?? 1);
    return lerpLimb(la, lb, ec);
  };

  return {
    rootX,
    hipY,
    torsoLean: lerp(a.torsoLean, b.torsoLean, e),
    headTilt: lerp(a.headTilt, b.headTilt, e),
    headBob: lerp(a.headBob, b.headBob, ec),
    arms: {
      front: lerpLimb(a.arms.front, b.arms.front, e),
      back: lerpLimb(a.arms.back, b.arms.back, e),
    },
    legs: { front: blendLeg(a.legs.front, b.legs.front), back: blendLeg(a.legs.back, b.legs.back) },
    hands: t < 0.5 ? a.hands : b.hands,
  };
}

/**
 * The pose at a frame, given keys sorted by frame. Each key snaps in over its transition
 * (default inside the token range) with a small overshoot, then holds.
 */
export function poseAt(frame: number, keys: readonly PoseKey[]): ResolvedPose {
  const firstKey = keys[0];
  if (!firstKey) throw new Error('poseAt needs at least one key');
  let index = 0;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k && k.frame <= frame) index = i;
  }
  const key = keys[index] ?? firstKey;
  const target = resolvePose(key.pose);
  const prev = keys[index - 1];
  if (!prev || frame < key.frame) return target;
  const transition = clamp(key.transition ?? DEFAULT_TRANSITION, minTransition, maxTransition);
  const t = (frame - key.frame) / transition;
  if (t >= 1) return target;
  return blendPoses(resolvePose(prev.pose), target, t);
}
