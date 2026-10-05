import { body } from './body';
import { THREE_QUARTER_FROM } from './layers';
import { DEG, add, clamp, fromDown, mul, vec } from './math';
import type { Vec2 } from './math';
import type { ArmJoints, Joints, LegJoints, LimbAngles, ResolvedPose } from './types';

/** Direction from the hip up along the torso, for a forward lean in degrees. */
export const torsoUp = (lean: number): Vec2 => fromDown(180 - lean);

export const neckOf = (hip: Vec2, lean: number): Vec2 => add(hip, mul(torsoUp(lean), body.torso));

export const shoulderOf = (hip: Vec2, lean: number): Vec2 =>
  add(neckOf(hip, lean), mul(torsoUp(lean), -body.shoulderDrop));

function arm(shoulder: Vec2, a: LimbAngles): ArmJoints {
  const elbow = add(shoulder, mul(fromDown(a.upper), body.upperArm));
  const forearm = a.upper + a.lower;
  const dir = fromDown(forearm);
  const wrist = add(elbow, mul(dir, body.lowerArm));
  const hand = add(wrist, mul(dir, body.handReach));
  return { shoulder, elbow, wrist, hand, forearm };
}

function leg(hip: Vec2, a: LimbAngles): LegJoints {
  const knee = add(hip, mul(fromDown(a.upper), body.thigh));
  const foot = add(knee, mul(fromDown(a.upper + a.lower), body.shin));
  return { hip, knee, foot };
}

/** A hanging arm swings at most this far from straight down, in degrees. */
const HANGING_MAX = 30;

/**
 * An elbow cannot bend backward. Front-view poses mirror their two arms, which bends the back
 * arm's elbow the other way; that is right seen from the front, where it reads as "outward".
 * Once the body is turned, a hanging arm bends forward instead (Biku, 2026-10-05). Big sideways
 * gestures such as a shrug keep their mirrored arms.
 */
export function naturalArm(a: LimbAngles, turn: number): LimbAngles {
  const turned = turn >= THREE_QUARTER_FROM;
  const hanging = Math.abs(a.upper) <= HANGING_MAX;
  return turned && hanging && a.lower < 0 ? { ...a, lower: -a.lower } : a;
}

/**
 * Body build options. shoulderSpread moves the two arm roots apart across the torso, for
 * costumes with broad shoulders; it narrows as the body turns toward profile.
 * Arm angles do not depend on the arm root, so IK reaches stay relative to each arm's shoulder.
 */
export type Build = { shoulderSpread?: number; turn?: number };

/** Forward kinematics: every joint position from a resolved pose. */
export function computeSkeleton(p: ResolvedPose, build: Build = {}): Joints {
  const hip = vec(p.rootX, p.hipY);
  const neck = neckOf(hip, p.torsoLean);
  const shoulder = shoulderOf(hip, p.torsoLean);
  const across = vec(Math.cos(p.torsoLean * DEG), Math.sin(p.torsoLean * DEG));
  const turn = clamp(build.turn ?? 0, 0, 1);
  const spread = (build.shoulderSpread ?? 0) * (1 - 0.8 * turn);
  const headAngle = p.torsoLean + p.headTilt;
  const head = add(
    add(neck, mul(fromDown(180 - headAngle), body.headRadiusY - body.headSink)),
    vec(0, p.headBob),
  );
  return {
    hip,
    neck,
    shoulder,
    head,
    headAngle,
    arms: {
      front: arm(add(shoulder, mul(across, spread)), naturalArm(p.arms.front, turn)),
      back: arm(add(shoulder, mul(across, -spread)), naturalArm(p.arms.back, turn)),
    },
    legs: { front: leg(hip, p.legs.front), back: leg(hip, p.legs.back) },
  };
}
