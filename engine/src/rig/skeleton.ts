import { body } from './body';
import { add, fromDown, mul, vec } from './math';
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

/** Forward kinematics: every joint position from a resolved pose. */
export function computeSkeleton(p: ResolvedPose): Joints {
  const hip = vec(p.rootX, p.hipY);
  const neck = neckOf(hip, p.torsoLean);
  const shoulder = shoulderOf(hip, p.torsoLean);
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
    arms: { front: arm(shoulder, p.arms.front), back: arm(shoulder, p.arms.back) },
    legs: { front: leg(hip, p.legs.front), back: leg(hip, p.legs.back) },
  };
}
