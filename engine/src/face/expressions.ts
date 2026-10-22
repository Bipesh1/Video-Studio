import { clamp, lerp, smoothstep } from '../rig/math';
import { CALM_MOUTH_W } from './layout';
import type { Brow, Eyes, FaceFrame, FaceParams, Mouth } from './types';

export const UPRIGHT: FaceFrame = { tilt: 0, scale: 1, dx: 0, dy: 0 };

const brow = (raise = 0, tilt = 0, arch = 0.12, wave = 0, curl = 0, weight = 1): Brow => ({
  raise,
  tilt,
  arch,
  wave,
  curl,
  weight,
});

const eyes = (o: Partial<Eyes> = {}): Eyes => ({
  upperLid: 0,
  lidTilt: 0,
  lowerLid: 0,
  lowerShaded: false,
  pupil: 1,
  scale: 1,
  closedArc: false,
  squeeze: false,
  strain: false,
  bags: false,
  worry: false,
  lookX: 0,
  lookY: 0,
  ...o,
});

const mouth = (o: Partial<Mouth> = {}): Mouth => ({
  width: CALM_MOUTH_W,
  open: 0,
  curve: 0,
  skew: 0,
  round: 0,
  teeth: 'none',
  arch: 0,
  tongue: 0,
  corners: 0,
  lip: false,
  chin: false,
  wobble: 0,
  shiftX: 0,
  ...o,
});

const both = (b: Brow) => ({ browLeft: b, browRight: b });

/**
 * Every expression in Style 3.6 as data, plus the two "or" variants the table names
 * (laughing for happy, shouting for angry). Extras such as sweat drops are effects, not faces.
 */
export const EXPRESSIONS = {
  neutral: { ...both(brow(0.015, 0, 0.12)), eyes: eyes(), mouth: mouth() },
  happy: {
    ...both(brow(0.045, -6, 0.5)),
    eyes: eyes({ lowerLid: 0.3 }),
    mouth: mouth({ width: 0.24, curve: 0.05 }),
  },
  laughing: {
    ...both(brow(0.06, -6, 0.55)),
    eyes: eyes({ closedArc: true }),
    mouth: mouth({ width: 0.3, open: 0.13, curve: 0.06, teeth: 'top' }),
  },
  sad: {
    ...both(brow(0.03, -22, 0.05, 0, -0.3)),
    eyes: eyes({ upperLid: 0.32, lidTilt: -14, lookY: 0.65, pupil: 0.95, bags: true }),
    mouth: mouth({ width: 0.16, curve: -0.06, corners: 0.6 }),
  },
  /** Like Reference B's threatening figure and the king: hooked V brows, heavy shaded lids, a wide frown with curled corners. */
  angry: {
    ...both(brow(-0.02, 22, 0.1, 0, 1, 0.65)),
    eyes: eyes({ upperLid: 0.45, lidTilt: 14, pupil: 0.55, scale: 1.18, lookX: 0.45 }),
    mouth: mouth({ width: 0.32, curve: -0.035, corners: 1.2, wobble: 0.3 }),
  },
  shouting: {
    ...both(brow(-0.04, 29, 0, 0, 0.6)),
    eyes: eyes({ upperLid: 0.3, lidTilt: 20, pupil: 0.7 }),
    mouth: mouth({ width: 0.24, open: 0.15, curve: -0.03, teeth: 'top' }),
  },
  /**
   * Like Reference B's frightened figure, measured from the picture: the face tips down toward
   * where he looks, the lower lids push up shaded with the pupils resting on them, light worried
   * brows sag from raised inner ends, and a wide arched grimace fills the lower head.
   */
  afraid: {
    frame: { tilt: 11, scale: 1, dx: 0, dy: -0.012 },
    ...both(brow(0.04, -25, -0.43, 0.05, 0.3, 0.5)),
    eyes: eyes({
      scale: 1.15,
      lowerLid: 0.25,
      lowerShaded: true,
      pupil: 0.69,
      lookX: 0.7,
      lookY: 0.9,
      bags: true,
      worry: true,
    }),
    mouth: mouth({
      width: 0.46,
      open: 0.26,
      curve: -0.015,
      skew: 0.006,
      teeth: 'gritted',
      chin: true,
    }),
  },
  surprised: {
    ...both(brow(0.05, -4, 0.5, 0, 0, 0.7)),
    eyes: eyes({ scale: 1.12, pupil: 0.55 }),
    mouth: mouth({ width: 0.1, open: 0.12, round: 1 }),
  },
  determined: {
    ...both(brow(-0.035, 13, 0)),
    eyes: eyes({ upperLid: 0.32, lidTilt: 8, lowerLid: 0.15 }),
    mouth: mouth({ width: 0.15, curve: -0.03, corners: 0.5 }),
  },
  thinking: {
    browLeft: brow(0, 6, 0.05),
    browRight: brow(0.1, -4, 0.45),
    eyes: eyes({ lookX: 0.75, lookY: -0.7 }),
    mouth: mouth({ width: 0.09, curve: -0.01, skew: 0.03, shiftX: 0.06 }),
  },
  smug: {
    browLeft: brow(-0.01, 8, 0.1),
    browRight: brow(0.08, -6, 0.4),
    eyes: eyes({ upperLid: 0.45, lidTilt: -3 }),
    mouth: mouth({ width: 0.15, curve: 0.02, skew: 0.035, shiftX: 0.03 }),
  },
  /**
   * Not buying it: both brows pressed low, one lower than the other, the eyes narrowed from
   * above and below with the pupils slid to the side, and a flat mouth pulled off centre.
   */
  suspicious: {
    browLeft: brow(-0.04, 15, 0.02),
    browRight: brow(0.015, 4, 0.22),
    eyes: eyes({ upperLid: 0.46, lidTilt: 6, lowerLid: 0.4, pupil: 0.85, lookX: 0.85 }),
    mouth: mouth({ width: 0.13, curve: -0.018, skew: -0.02, shiftX: 0.05, corners: 0.35 }),
  },
  /** A wink: one eye shut in an arc under a lowered brow, the other brow up, a lopsided grin. */
  wink: {
    browLeft: brow(0.075, -6, 0.45),
    browRight: brow(-0.025, 8, 0.2),
    eyes: eyes({ lowerLid: 0.2, wink: 1 }),
    mouth: mouth({ width: 0.21, curve: 0.035, skew: 0.04, shiftX: 0.03 }),
  },
  // -------------------------------------------------------------------------------------------
  // Faces for a darker, quieter mood (asked by Biku for the game theory videos, 2026-10-11).
  // They are small faces: what changes is the eyes, and the mouth says almost nothing.

  /** Silent fear: eyes wide with pinpoint pupils, light worried brows, the mouth a thin unsteady line. */
  dread: {
    ...both(brow(0.05, -18, 0.2, 0.2, 0, 0.6)),
    eyes: eyes({ scale: 1.15, pupil: 0.45, lowerLid: 0.12, bags: true, worry: true }),
    mouth: mouth({ width: 0.12, curve: -0.02, wobble: 0.5, lip: true }),
  },
  /** Working it out, coldly: level low brows, eyes narrowed from above and below, small steady pupils, a flat mouth. */
  calculating: {
    browLeft: brow(-0.035, 9, 0.02),
    browRight: brow(-0.025, 6, 0.04),
    eyes: eyes({ upperLid: 0.36, lidTilt: 3, lowerLid: 0.28, pupil: 0.6 }),
    mouth: mouth({ width: 0.12 }),
  },
  /** Seen it all before: level brows at rest, the lids half down, steady eyes and a small flat mouth with one corner barely up. */
  bored: {
    ...both(brow(0.0, 2, 0.08)),
    eyes: eyes({ upperLid: 0.5, lowerLid: 0.1, pupil: 0.9 }),
    mouth: mouth({ width: 0.11, curve: 0.004, skew: 0.012 }),
  },
  /** Wanting it: brows lifted, eyes wide with big pupils fixed a little low, lips just parted in a half smile. */
  tempted: {
    ...both(brow(0.06, -8, 0.5)),
    eyes: eyes({ scale: 1.1, pupil: 1.3, lowerLid: 0.2, lookY: 0.3 }),
    mouth: mouth({ width: 0.16, open: 0.028, curve: 0.035, skew: 0.02 }),
  },
  /** A smile that is not meant: the mouth smiles, one eye narrows, the eyes slide away, the brows do not agree. */
  lying: {
    browLeft: brow(0.06, -6, 0.45),
    browRight: brow(0.02, -12, 0.25, 0.1),
    eyes: eyes({ lowerLid: 0.25, squint: 0.34, pupil: 0.85, lookX: -0.55 }),
    mouth: mouth({ width: 0.25, curve: 0.05, wobble: 0.35 }),
  },
  /** After doing it: eyes down and away under heavy lids, inner brows lifted, a small mouth pulled to one side. */
  guilty: {
    ...both(brow(0.035, -20, 0.05, 0, -0.2, 0.8)),
    eyes: eyes({ upperLid: 0.3, lidTilt: -10, pupil: 0.9, lookX: -0.7, lookY: 0.7 }),
    mouth: mouth({ width: 0.1, curve: -0.015, skew: -0.02, shiftX: -0.04, lip: true }),
  },
  /** Nothing left: light brows a little raised, heavy lids, small pupils looking at nothing, a creased under-eye, a level mouth. */
  hollow: {
    ...both(brow(0.035, -7, 0.1, 0, 0, 0.55)),
    eyes: eyes({ upperLid: 0.3, pupil: 0.6, lookY: 0.15, bags: true }),
    mouth: mouth({ width: 0.11, curve: -0.005 }),
  },
  exhausted: {
    ...both(brow(-0.02, -12, 0.05)),
    eyes: eyes({ upperLid: 0.58, lidTilt: -8, lookY: 0.3, bags: true }),
    mouth: mouth({ width: 0.13, open: 0.06, curve: -0.02 }),
  },
  /** Crying out: eyes squeezed shut, strained brows, wide open mouth with teeth and tongue. */
  wailing: {
    ...both(brow(-0.01, 12, 0.05)),
    eyes: eyes({ squeeze: true, strain: true }),
    mouth: mouth({ width: 0.4, open: 0.2, curve: -0.08, arch: 0.22, teeth: 'top', tongue: 1 }),
  },
  /** Shock and dread: very wide eyes, tiny pupils, light brows high and worried. */
  horrified: {
    ...both(brow(0.055, -12, 0.3, 0.3, 0, 0.6)),
    eyes: eyes({ scale: 1.15, pupil: 0.42 }),
    mouth: mouth({ width: 0.09, open: 0.09, round: 1, chin: true }),
  },
  // -------------------------------------------------------------------------------------------
  // Big faces for the comedy shorts (2026-10-16): Biku compared our videos with stick-figure
  // comedy shorts with far more views, whose faces do the work; ours were small and polite.

  /** Jaw on the floor: brows flown up, huge eyes with pinpoint pupils, the mouth hanging wide open. */
  'jaw-drop': {
    frame: { tilt: 0, scale: 1.04, dx: 0, dy: -0.01 },
    ...both(brow(0.058, -8, 0.55, 0, 0, 0.7)),
    eyes: eyes({ scale: 1.24, pupil: 0.36 }),
    mouth: mouth({ width: 0.16, open: 0.19, round: 0.6, tongue: 0.6, chin: true }),
  },
  /** Up to something: one brow low, one shot up, lids half down, eyes slid aside, a wide toothy grin. */
  'sly-grin': {
    browLeft: brow(-0.03, 14, 0.05, 0, 0.6),
    browRight: brow(0.09, -10, 0.5),
    eyes: eyes({ upperLid: 0.42, lowerLid: 0.22, lidTilt: 4, pupil: 0.8, lookX: 0.65 }),
    mouth: mouth({
      width: 0.38,
      open: 0.07,
      curve: 0.085,
      skew: 0.025,
      teeth: 'top',
      corners: -0.4,
    }),
  },
  /** Had enough: a deep V of brows, eyes narrowed hard, every tooth gritted in a wide grimace. */
  fuming: {
    ...both(brow(-0.045, 28, 0, 0, 1, 0.75)),
    eyes: eyes({ upperLid: 0.4, lidTilt: 18, pupil: 0.5, scale: 1.12 }),
    mouth: mouth({ width: 0.44, open: 0.22, curve: -0.05, teeth: 'gritted', chin: true }),
  },
  /**
   * Asleep and at peace: the lids fully down, so each eye is one soft closed line (the same
   * closed eye a blink passes through), brows at rest, the mouth a little open with breath.
   */
  asleep: {
    ...both(brow(0.02, -8, 0.3, 0, 0, 0.6)),
    eyes: eyes({ upperLid: 1 }),
    mouth: mouth({ width: 0.085, open: 0.04, round: 0.7 }),
  },
} satisfies Record<string, FaceParams>;

export type ExpressionName = keyof typeof EXPRESSIONS;

/** The ten emotions in the Style 3.6 table. */
export const GUIDE_EMOTIONS = [
  'neutral',
  'happy',
  'sad',
  'angry',
  'afraid',
  'surprised',
  'determined',
  'thinking',
  'smug',
  'exhausted',
] as const satisfies readonly ExpressionName[];

export const EXPRESSION_NAMES = Object.keys(EXPRESSIONS) as ExpressionName[];

const lerpBrow = (a: Brow, b: Brow, t: number): Brow => ({
  raise: lerp(a.raise, b.raise, t),
  tilt: lerp(a.tilt, b.tilt, t),
  arch: lerp(a.arch, b.arch, t),
  wave: lerp(a.wave, b.wave, t),
  curl: lerp(a.curl, b.curl, t),
  weight: lerp(a.weight, b.weight, t),
});

/** Blend two faces. Numbers interpolate; on/off choices switch at the halfway point. */
export function blendFace(a: FaceParams, b: FaceParams, t: number): FaceParams {
  const x = clamp(t, 0, 1);
  // Exact endpoints, so a finished blend is the target face itself, free of rounding.
  if (x <= 0) return a;
  if (x >= 1) return b;
  const late = x >= 0.5;
  const fa = a.frame ?? UPRIGHT;
  const fb = b.frame ?? UPRIGHT;
  // Only faces that use a frame carry one, so blending two upright faces gives an upright face.
  const frame =
    a.frame || b.frame
      ? {
          frame: {
            tilt: lerp(fa.tilt, fb.tilt, x),
            scale: lerp(fa.scale, fb.scale, x),
            dx: lerp(fa.dx, fb.dx, x),
            dy: lerp(fa.dy, fb.dy, x),
          },
        }
      : {};
  return {
    ...frame,
    browLeft: lerpBrow(a.browLeft, b.browLeft, x),
    browRight: lerpBrow(a.browRight, b.browRight, x),
    eyes: {
      upperLid: lerp(a.eyes.upperLid, b.eyes.upperLid, x),
      lidTilt: lerp(a.eyes.lidTilt, b.eyes.lidTilt, x),
      lowerLid: lerp(a.eyes.lowerLid, b.eyes.lowerLid, x),
      lowerShaded: late ? b.eyes.lowerShaded : a.eyes.lowerShaded,
      pupil: lerp(a.eyes.pupil, b.eyes.pupil, x),
      scale: lerp(a.eyes.scale, b.eyes.scale, x),
      closedArc: late ? b.eyes.closedArc : a.eyes.closedArc,
      squeeze: late ? b.eyes.squeeze : a.eyes.squeeze,
      strain: late ? b.eyes.strain : a.eyes.strain,
      bags: late ? b.eyes.bags : a.eyes.bags,
      worry: late ? b.eyes.worry : a.eyes.worry,
      lookX: lerp(a.eyes.lookX, b.eyes.lookX, x),
      lookY: lerp(a.eyes.lookY, b.eyes.lookY, x),
      ...(a.eyes.wink || b.eyes.wink ? { wink: lerp(a.eyes.wink ?? 0, b.eyes.wink ?? 0, x) } : {}),
      ...(a.eyes.squint || b.eyes.squint
        ? { squint: lerp(a.eyes.squint ?? 0, b.eyes.squint ?? 0, x) }
        : {}),
    },
    mouth: {
      width: lerp(a.mouth.width, b.mouth.width, x),
      open: lerp(a.mouth.open, b.mouth.open, x),
      curve: lerp(a.mouth.curve, b.mouth.curve, x),
      skew: lerp(a.mouth.skew, b.mouth.skew, x),
      round: lerp(a.mouth.round, b.mouth.round, x),
      teeth: late ? b.mouth.teeth : a.mouth.teeth,
      arch: lerp(a.mouth.arch, b.mouth.arch, x),
      tongue: lerp(a.mouth.tongue, b.mouth.tongue, x),
      corners: lerp(a.mouth.corners, b.mouth.corners, x),
      lip: late ? b.mouth.lip : a.mouth.lip,
      chin: late ? b.mouth.chin : a.mouth.chin,
      wobble: lerp(a.mouth.wobble, b.mouth.wobble, x),
      shiftX: lerp(a.mouth.shiftX, b.mouth.shiftX, x),
    },
  };
}

/**
 * How long a change of face takes, in frames: about half a second. The plan asked for 3 to 4
 * frames (Part 2, section 7.2); Biku found that it read as a switch being flipped ("one second
 * its one expression and another second its another", 2026-10-12).
 */
export const EXPRESSION_CHANGE_FRAMES = 14;

/** A piece of the change: from 0 to 1 between two moments of it, eased at both ends. */
const part = (t: number, from: number, to: number) =>
  smoothstep(clamp((t - from) / (to - from), 0, 1));

/**
 * One face becoming another, the way a face does it: the eyes go first, the lids come down in a
 * blink and the shape of the eyes changes behind it, the brows follow, and the mouth is last.
 * `t` runs from 0 to 1 over the whole change.
 */
export function changeFace(a: FaceParams, b: FaceParams, t: number): FaceParams {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const looking = blendFace(a, b, part(t, 0, 0.28)).eyes;
  const shape = blendFace(a, b, part(t, 0.28, 0.48)).eyes;
  const brows = blendFace(a, b, part(t, 0.3, 0.72));
  const mouth = blendFace(a, b, part(t, 0.5, 1)).mouth;
  // The blink: shut at about a third of the way through, open again by the halfway point.
  const shut = 1 - clamp(Math.abs(t - 0.36) / 0.15, 0, 1);
  const blink = smoothstep(shut);
  return {
    ...(brows.frame ? { frame: brows.frame } : {}),
    browLeft: brows.browLeft,
    browRight: brows.browRight,
    eyes: {
      ...shape,
      lookX: looking.lookX,
      lookY: looking.lookY,
      upperLid: shape.upperLid + (1 - shape.upperLid) * blink,
    },
    mouth,
  };
}

/** A face at part strength: this far from a plain face toward the named one. */
export function faceAtStrength(face: FaceParams, strength = 1): FaceParams {
  return strength >= 1 ? face : blendFace(EXPRESSIONS.neutral, face, clamp(strength, 0, 1));
}

/**
 * A face from a moment on. `id` names it (the expression and its strength), so two keys with
 * the same face one after the other are a hold and not a change.
 */
export type FaceKey = { frame: number; expression: ExpressionName | FaceParams; id?: string };

const asFace = (e: ExpressionName | FaceParams): FaceParams =>
  typeof e === 'string' ? EXPRESSIONS[e] : e;

/** The face at a frame, given keys sorted by frame. */
export function faceAt(
  frame: number,
  keys: readonly FaceKey[],
  changeFrames = EXPRESSION_CHANGE_FRAMES,
): FaceParams {
  const first = keys[0];
  if (!first) return EXPRESSIONS.neutral;
  let index = 0;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k && k.frame <= frame) index = i;
  }
  const key = keys[index] ?? first;
  const prev = keys[index - 1];
  if (!prev || frame < key.frame) return asFace(key.expression);
  const same =
    prev.id !== undefined && key.id !== undefined
      ? prev.id === key.id
      : prev.expression === key.expression;
  const t = (frame - key.frame) / changeFrames;
  if (same || t >= 1) return asFace(key.expression);
  return changeFace(asFace(prev.expression), asFace(key.expression), t);
}
