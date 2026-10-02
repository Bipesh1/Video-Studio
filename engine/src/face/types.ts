/** Face parameters. Space: head units, origin at the head center, y down. */

export type Brow = {
  /** Up from the resting position (positive raises the brow). */
  raise: number;
  /** Degrees. Positive lowers the inner end (angry V), negative raises it (sad, worried). */
  tilt: number;
  /** Upward bow of the brow, 0 flat to about 0.7 high arc. */
  arch: number;
  /** Wobble for fear, 0 to 1. */
  wave: number;
};

export type Eyes = {
  /** Upper lid closure, 0 open to 1 shut. */
  upperLid: number;
  /** Degrees. Positive lowers the lid's inner corner (angry), negative the outer (sad). */
  lidTilt: number;
  /** Lower lid pushed up, 0 none to 1 (happy squint). */
  lowerLid: number;
  /** Pupil size multiplier: 1 normal, about 0.5 tiny (afraid). */
  pupil: number;
  /** Whole-eye size multiplier: above 1 for wide eyes. */
  scale: number;
  /** Closed upward arcs, as when laughing. */
  closedArc: boolean;
  /** Pupil direction bias, -1 to 1 on each axis. */
  lookX: number;
  lookY: number;
};

export type TeethMode = 'none' | 'top' | 'gritted';

export type Mouth = {
  width: number;
  /** Opening height, 0 means a single line. */
  open: number;
  /** Positive lifts the corners (smile), negative drops them (frown). */
  curve: number;
  /** Lifts the right corner only, for a one-sided smirk. */
  skew: number;
  /** 1 draws a round O. */
  round: number;
  teeth: TeethMode;
  /** Sideways offset of the whole mouth. */
  shiftX: number;
};

export type FaceParams = {
  /** browLeft sits on the -x side of the face, browRight on the +x side. */
  browLeft: Brow;
  browRight: Brow;
  eyes: Eyes;
  mouth: Mouth;
};

export type EyeStyle = 'round' | 'stern';
