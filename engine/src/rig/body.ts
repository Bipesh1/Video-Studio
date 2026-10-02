import { tokens } from '../tokens';

const p = tokens.proportions;

/**
 * Bone lengths and fixed body layout in head units (1 = head diameter), from tokens (Style 3.1).
 * The few layout values that tokens do not specify are named here, in one place.
 */
export const body = {
  headRadiusX: 0.5,
  /** Heads may be up to 10% taller than wide. A slight 4% keeps them reading as circles. */
  headRadiusY: 0.5 * Math.min(1.04, p.headAspectMax),
  torso: p.torsoHeads,
  upperArm: p.upperArmHeads,
  lowerArm: p.lowerArmHeads,
  thigh: p.legHeads / 2,
  shin: p.legHeads / 2,
  hand: p.handHeads,
  /** Distance from the wrist (end of the forearm line) to the center of the hand. */
  handReach: p.handHeads * 0.38,
  /** Shoulders sit a little below the top of the torso line. */
  shoulderDrop: 0.14,
  /** The head overlaps the top of the torso slightly, so there is no neck and no gap. */
  headSink: 0.03,
} as const;

export const legLength = body.thigh + body.shin;

/** Shoulder to hand center, used when IK places a hand. */
export const armReachToHand = body.lowerArm + body.handReach;

/** Hip height for a relaxed stand: legs almost straight, so knees never lock or flip. */
export const STAND_HIP_HEIGHT = legLength * 0.98;
