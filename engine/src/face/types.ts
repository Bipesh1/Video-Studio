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
  /** Flick of the outer tip: positive curls it up, negative down (the hooked brows in Reference B). */
  curl: number;
  /** Thickness multiplier: 1 is the token brow weight; worried brows are lighter. */
  weight: number;
};

export type Eyes = {
  /** Upper lid closure, 0 open to 1 shut. */
  upperLid: number;
  /** Degrees. Positive lowers the lid's inner corner (angry), negative the outer (sad). */
  lidTilt: number;
  /** Lower lid pushed up, 0 none to 1 (happy squint). */
  lowerLid: number;
  /**
   * Draws the lower lid as a shaded lid with a bold edge, nearly level, with the pupils resting
   * on it: the wince on Reference B's frightened face. Off, the lower lid is a cheek pushing up.
   */
  lowerShaded: boolean;
  /** Pupil size multiplier: 1 normal, about 0.5 tiny (afraid). */
  pupil: number;
  /** Whole-eye size multiplier: above 1 for wide eyes. */
  scale: number;
  /** Closed upward arcs, as when laughing. */
  closedArc: boolean;
  /** Squeezed shut as > and < chevrons, as when wailing or straining. */
  squeeze: boolean;
  /** Stress lines on the forehead and at the outer eye corners. */
  strain: boolean;
  /** A tapered crease under each eye, hugging its lower outer side (fear, sadness, tiredness). */
  bags: boolean;
  /** Two small worry ticks between the brows. */
  worry: boolean;
  /** Pupil direction bias, -1 to 1 on each axis. */
  lookX: number;
  lookY: number;
  /**
   * A wink, 0 to 1: the eye on the +x side (the side the face turns toward) shuts in a happy
   * arc while the other stays open. Left out, no wink.
   */
  wink?: number;
  /**
   * The eye on the +x side narrowed a little more than the other, 0 to about 0.5: the small
   * tell of someone lying. Left out, both eyes are alike.
   */
  squint?: number;
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
  /** Upper lip arched up, for a crying or wailing mouth with the corners pulled down. */
  arch: number;
  /** Tongue showing at the bottom of an open mouth, 0 to 1. */
  tongue: number;
  /** Little hooks at the mouth corners, like the king's frown crease. 0 none to 1. */
  corners: number;
  /** A short lower-lip line under a closed mouth. */
  lip: boolean;
  /** Short strain strokes fanned out on the chin. */
  chin: boolean;
  /** An uneven, wavy line for a tense mouth. -1 to 1. */
  wobble: number;
  /** Sideways offset of the whole mouth. */
  shiftX: number;
};

/**
 * How the whole set of features sits on the head. Reference B's frightened face tips down toward
 * where the character faces: the eye on that side sits lower. That is a frame, not a pose.
 */
export type FaceFrame = {
  /** Degrees; positive tips the face down toward the facing direction, as in Reference B. */
  tilt: number;
  /** Size of all features together; 1 is the guide size. */
  scale: number;
  /** Offset of the features, head units; +x is toward the facing direction, +y is down. */
  dx: number;
  dy: number;
};

export type FaceParams = {
  /** browLeft sits on the -x side of the face, browRight on the +x side. */
  browLeft: Brow;
  browRight: Brow;
  eyes: Eyes;
  mouth: Mouth;
  /** Omitted means upright, guide size, centered. */
  frame?: FaceFrame;
};

export type EyeStyle = 'round' | 'stern';
