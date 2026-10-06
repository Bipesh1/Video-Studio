import { armReachToHand, body, STAND_HIP_HEIGHT } from './body';
import { KNEE_FORWARD, solveTwoBone } from './ik';
import {
  add,
  angleFromDown,
  clamp,
  easeOutBack,
  fromDown,
  lerp,
  lerpVec,
  mul,
  normalizeDeg,
  smoothstep,
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

export type PoseKey = {
  frame: number;
  pose: Pose;
  /** Frames the snap itself takes. Default inside the token range. */
  transition?: number;
  /** Frames of wind-up before the snap. Left out, big moves get WINDUP_FRAMES and small ones none. */
  windup?: number;
};

/** Overshoot for pose snaps: peaks about 5% past the target, then settles. */
export const POSE_OVERSHOOT = 1.2;

/**
 * Anticipation (Part 2, section 7.4: "anticipation before big moves"). Before a big move the
 * arms and head pull back a little the other way for a few frames, then snap.
 */
export const WINDUP_FRAMES = 3;
/** How far the wind-up pulls back, as a fraction of the whole move. */
export const WINDUP_DEPTH = 0.12;
/** A move is big when a joint turns more than this many degrees, or the hip moves as much. */
export const BIG_MOVE = 45;
/** In a big move the hip dips this far mid-way and comes back up: the body has weight. */
export const WEIGHT_DIP = 0.03;

const [minTransition, maxTransition] = tokens.motion.poseTransitionFrames;

/** Default snap length in frames, inside the token range (Style 8: 3 to 6 frames). */
export const DEFAULT_TRANSITION = Math.round((minTransition + maxTransition) / 2);

const [minBodyMove, maxBodyMove] = tokens.motion.bodyMoveFrames;

/**
 * A move of the whole body is one where the hips travel at least this far, in head units:
 * kneeling, sitting down, getting up, lying down. It is not a snap. The body is seen to go
 * there (Style 8, guide version 13; Biku on a kneel that took two frames: "looks like the
 * posture didn't change in continuous frames").
 */
export const BODY_MOVE = 0.25;
/** The hip travel that takes a body move its longest: all the way down onto a knee or a seat. */
export const FULL_BODY_MOVE = 0.9;

/** The frames a move of the whole body takes for how far the hips travel (Style 8). */
export function bodyMoveFrames(travel: number): number {
  const share = clamp((travel - BODY_MOVE) / (FULL_BODY_MOVE - BODY_MOVE), 0, 1);
  return Math.round(lerp(minBodyMove, maxBodyMove, share));
}

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
 * How far apart two poses are, in degrees: the largest turn of any arm joint or of the torso,
 * with hip travel counted as 100 degrees per head unit. Decides which moves are big.
 */
export function poseDistance(a: ResolvedPose, b: ResolvedPose): number {
  const d = (x: number, y: number) => Math.abs(x - y);
  return Math.max(
    d(a.arms.front.upper, b.arms.front.upper),
    d(a.arms.front.lower, b.arms.front.lower),
    d(a.arms.back.upper, b.arms.back.upper),
    d(a.arms.back.lower, b.arms.back.lower),
    d(a.torsoLean, b.torsoLean) * 2,
    Math.hypot(a.rootX - b.rootX, a.hipY - b.hipY) * 100,
  );
}

/**
 * Mix two resolved poses. `e` is how far along the upper body is and may run below 0 (a
 * wind-up) or above 1 (an overshoot). `ec` is how far along the hips and planted feet are and
 * stays inside 0 to 1, so feet never sink below the ground or slide. `dip` lowers the hip.
 */
export function mixPoses(
  a: ResolvedPose,
  b: ResolvedPose,
  e: number,
  ec: number,
  dip = 0,
): ResolvedPose {
  const rootX = lerp(a.rootX, b.rootX, ec);
  const hipY = lerp(a.hipY, b.hipY, ec) + dip;
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
    hands: ec < 0.5 ? a.hands : b.hands,
  };
}

/** Where a leg's foot is: the point it is planted on, or where its angles put it. */
function footPoint(leg: LegState, hip: Vec2): Vec2 {
  if (leg.foot) return leg.foot;
  const knee = add(hip, mul(fromDown(leg.upper), body.thigh));
  return add(knee, mul(fromDown(leg.upper + leg.lower), body.shin));
}

/** Which way a leg's knee bends: as it was placed, or as its angles show. */
const kneeBend = (leg: LegState): 1 | -1 => leg.bend ?? (leg.lower <= 0 ? KNEE_FORWARD : 1);

/**
 * Mix two resolved poses for a move of the whole body. Like mixPoses, but every foot travels
 * from where it was to where it will be while its leg is solved from the moving hip, so no
 * foot sinks or swims however long the move takes. Both knees bend the way they do in the
 * lower of the two poses: a straight leg has no say in it, and a knee never folds backward on
 * the way up from a chair.
 */
export function mixBodies(a: ResolvedPose, b: ResolvedPose, e: number, ec: number): ResolvedPose {
  const hipA = vec(a.rootX, a.hipY);
  const hipB = vec(b.rootX, b.hipY);
  const hip = lerpVec(hipA, hipB, ec);
  const low = a.hipY >= b.hipY ? a : b;
  const leg = (side: 'front' | 'back'): LegState => {
    const foot = lerpVec(footPoint(a.legs[side], hipA), footPoint(b.legs[side], hipB), ec);
    return legToFoot(hip, vec(foot.x, Math.min(0, foot.y)), kneeBend(low.legs[side]));
  };
  return {
    rootX: hip.x,
    hipY: hip.y,
    torsoLean: lerp(a.torsoLean, b.torsoLean, e),
    headTilt: lerp(a.headTilt, b.headTilt, e),
    headBob: lerp(a.headBob, b.headBob, ec),
    arms: {
      front: lerpLimb(a.arms.front, b.arms.front, e),
      back: lerpLimb(a.arms.back, b.arms.back, e),
    },
    legs: { front: leg('front'), back: leg('back') },
    hands: ec < 0.5 ? a.hands : b.hands,
  };
}

/**
 * Blend two resolved poses. t runs 0 to 1 over the transition.
 * Arms and head take the overshooting ease. Hips and planted feet take a clamped ease,
 * so feet never sink below the ground or slide during a snap.
 */
export function blendPoses(a: ResolvedPose, b: ResolvedPose, t: number): ResolvedPose {
  const e = easeOutBack(t, POSE_OVERSHOOT);
  return mixPoses(a, b, e, clamp(e, 0, 1));
}

/**
 * The frames a key's move takes: wind-up first (big moves only, unless the key says), then the
 * move itself. An arm or a head snaps; the whole body takes as long as its hips have far to go.
 * A key may ask for a quicker body move (a cut hides the rest), never a slower one.
 */
export function moveFrames(
  from: ResolvedPose,
  to: ResolvedPose,
  key: Pick<PoseKey, 'transition' | 'windup'> = {},
): { windup: number; transition: number; big: boolean; whole: boolean } {
  const big = poseDistance(from, to) > BIG_MOVE;
  const travel = Math.hypot(from.rootX - to.rootX, from.hipY - to.hipY);
  const whole = travel >= BODY_MOVE;
  const natural = whole ? bodyMoveFrames(travel) : DEFAULT_TRANSITION;
  return {
    windup: Math.max(0, key.windup ?? (big ? WINDUP_FRAMES : 0)),
    transition: clamp(key.transition ?? natural, minTransition, whole ? natural : maxTransition),
    big,
    whole,
  };
}

/**
 * The pose at a frame, given keys sorted by frame. From each key's frame the body winds up (if
 * the move is big), snaps to the new pose with a small overshoot and a dip of the hips, then
 * holds. Hands and heads travel on arcs, because joints turn rather than slide. A move of the
 * whole body (kneeling, sitting, getting up) is not a snap: it takes longer and is smooth.
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
  const from = resolvePose(prev.pose);
  const { windup, transition, big, whole } = moveFrames(from, target, key);
  const f = frame - key.frame;
  if (f >= windup + transition) return target;
  if (f < windup) {
    // Pull back the other way, easing into the deepest point as the snap begins.
    const back = -WINDUP_DEPTH * Math.sin(((f / windup) * Math.PI) / 2);
    return whole ? mixBodies(from, target, back, 0) : mixPoses(from, target, back, 0);
  }
  const t = (f - windup) / transition;
  const depth = windup > 0 ? WINDUP_DEPTH : 0;
  if (whole) {
    // A body has weight: it starts and stops smoothly, and the arms and head go with it.
    const along = smoothstep(t);
    return mixBodies(from, target, -depth + (1 + depth) * along, along);
  }
  const e = -depth + (1 + depth) * easeOutBack(t, POSE_OVERSHOOT);
  const ec = clamp(easeOutBack(t, POSE_OVERSHOOT), 0, 1);
  return mixPoses(from, target, e, ec, big ? WEIGHT_DIP * Math.sin(Math.PI * t) : 0);
}
