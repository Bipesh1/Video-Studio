import { add, clamp, length, mul, rotate, sub, vec } from './math';
import type { Vec2 } from './math';

export type IKResult = {
  /** Elbow or knee. */
  joint: Vec2;
  /** Hand or foot. Equals the target when the target is reachable. */
  end: Vec2;
  /** False when the target was too far or too close and the limb was clamped. */
  reached: boolean;
};

/** Bend sign that puts a knee in front of a leg pointing down (toward the facing direction). */
export const KNEE_FORWARD = -1 as const;
/** Bend sign that puts an elbow below an arm reaching forward. */
export const ELBOW_DOWN = 1 as const;

const EPS = 1e-9;

/**
 * Analytic two-bone IK.
 * Places the joint so the first bone (length a) starts at root and the second (length b)
 * ends at target. bend chooses which side of the root-to-target line the joint goes:
 * +1 rotates the joint off the line in the SVG positive direction, -1 the other way.
 */
export function solveTwoBone(
  root: Vec2,
  target: Vec2,
  a: number,
  b: number,
  bend: 1 | -1,
): IKResult {
  const d = sub(target, root);
  const distance = length(d);
  const maxReach = a + b;
  const minReach = Math.abs(a - b);
  const reached = distance <= maxReach + EPS && distance >= minReach - EPS;

  const reach = clamp(distance, minReach + EPS, maxReach - EPS);
  const dir = distance > EPS ? mul(d, 1 / distance) : vec(0, 1);

  // Law of cosines: angle at the root between the root-to-target line and the first bone.
  const cosAlpha = clamp((a * a + reach * reach - b * b) / (2 * a * reach), -1, 1);
  const alpha = Math.acos(cosAlpha) * bend;

  const joint = add(root, mul(rotate(dir, alpha), a));
  const end = add(root, mul(dir, reach));
  return { joint, end, reached };
}
