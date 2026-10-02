import type { Vec2 } from './math';

export type Facing = 'left' | 'right';

/** Resting hands are mittens; hands that hold or point show fingers (guide v2, Style 3.1). */
export type HandShape = 'mitten' | 'grip' | 'point';

export type HandPose = {
  shape: HandShape;
  /** Which side of the hand the thumb sits on, in the hand's own frame. */
  thumb: 1 | -1;
  /**
   * For a gripping hand: the screen-space SVG angle of the handle it holds, in degrees
   * (0 = handle along +x, -90 = handle pointing up). Omitted: handle across the forearm.
   */
  gripAxis?: number;
  /** Draw this arm in front of the head, as when the hands cover the mouth. */
  over?: boolean;
};

/** Upper bone angle from straight down, and the lower bone's bend relative to it, in degrees. */
export type LimbAngles = { upper: number; lower: number };

/** A leg can also remember the ground point its foot was placed on, so blends keep it planted. */
export type LegState = LimbAngles & { foot?: Vec2; bend?: 1 | -1 };

/**
 * A pose with every joint resolved to numbers. Space: head units, y down,
 * origin on the ground line under the hip at rootX = 0, character facing +x.
 */
export type ResolvedPose = {
  rootX: number;
  /** Hip height as a y value (negative: above the ground). */
  hipY: number;
  /** Degrees, positive leans the upper body toward the facing direction. */
  torsoLean: number;
  /** Degrees, extra rotation of the head about the top of the torso. */
  headTilt: number;
  /** Small vertical head offset for breathing and bobbing. */
  headBob: number;
  arms: { front: LimbAngles; back: LimbAngles };
  legs: { front: LegState; back: LegState };
  hands: { front: HandPose; back: HandPose };
};

export type ArmJoints = {
  shoulder: Vec2;
  elbow: Vec2;
  wrist: Vec2;
  /** Center of the hand. */
  hand: Vec2;
  /** Absolute forearm angle from straight down, degrees. */
  forearm: number;
};

export type LegJoints = { hip: Vec2; knee: Vec2; foot: Vec2 };

export type Joints = {
  hip: Vec2;
  /** Top of the torso line. */
  neck: Vec2;
  shoulder: Vec2;
  /** Center of the head. */
  head: Vec2;
  /** Rotation of the head in degrees (torso lean plus head tilt). */
  headAngle: number;
  arms: { front: ArmJoints; back: ArmJoints };
  legs: { front: LegJoints; back: LegJoints };
};
