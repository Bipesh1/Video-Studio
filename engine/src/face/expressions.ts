import { clamp, lerp, smoothstep } from '../rig/math';
import type { Brow, Eyes, FaceParams, Mouth } from './types';

const brow = (raise = 0, tilt = 0, arch = 0.12, wave = 0): Brow => ({ raise, tilt, arch, wave });

const eyes = (o: Partial<Eyes> = {}): Eyes => ({
  upperLid: 0,
  lidTilt: 0,
  lowerLid: 0,
  pupil: 1,
  scale: 1,
  closedArc: false,
  lookX: 0,
  lookY: 0,
  ...o,
});

const mouth = (o: Partial<Mouth> = {}): Mouth => ({
  width: 0.14,
  open: 0,
  curve: 0,
  skew: 0,
  round: 0,
  teeth: 'none',
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
    ...both(brow(0.03, -22, 0.05)),
    eyes: eyes({ upperLid: 0.32, lidTilt: -14, lookY: 0.65, pupil: 0.95 }),
    mouth: mouth({ width: 0.16, curve: -0.06 }),
  },
  angry: {
    ...both(brow(-0.05, 27, 0)),
    eyes: eyes({ upperLid: 0.42, lidTilt: 20, pupil: 0.75 }),
    mouth: mouth({ width: 0.16, curve: -0.045 }),
  },
  shouting: {
    ...both(brow(-0.04, 29, 0)),
    eyes: eyes({ upperLid: 0.3, lidTilt: 20, pupil: 0.7 }),
    mouth: mouth({ width: 0.24, open: 0.15, curve: -0.03, teeth: 'top' }),
  },
  afraid: {
    ...both(brow(0.09, -16, 0.1, 1)),
    eyes: eyes({ scale: 1.08, pupil: 0.5 }),
    mouth: mouth({ width: 0.32, open: 0.2, curve: -0.02, teeth: 'gritted' }),
  },
  surprised: {
    ...both(brow(0.12, -4, 0.65)),
    eyes: eyes({ scale: 1.12, pupil: 0.55 }),
    mouth: mouth({ width: 0.1, open: 0.12, round: 1 }),
  },
  determined: {
    ...both(brow(-0.035, 13, 0)),
    eyes: eyes({ upperLid: 0.32, lidTilt: 8, lowerLid: 0.15 }),
    mouth: mouth({ width: 0.14, curve: -0.03 }),
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
  exhausted: {
    ...both(brow(-0.02, -12, 0.05)),
    eyes: eyes({ upperLid: 0.58, lidTilt: -8, lookY: 0.3 }),
    mouth: mouth({ width: 0.13, open: 0.06, curve: -0.02 }),
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
});

/** Blend two faces. Numbers interpolate; on/off choices switch at the halfway point. */
export function blendFace(a: FaceParams, b: FaceParams, t: number): FaceParams {
  const x = clamp(t, 0, 1);
  const late = x >= 0.5;
  return {
    browLeft: lerpBrow(a.browLeft, b.browLeft, x),
    browRight: lerpBrow(a.browRight, b.browRight, x),
    eyes: {
      upperLid: lerp(a.eyes.upperLid, b.eyes.upperLid, x),
      lidTilt: lerp(a.eyes.lidTilt, b.eyes.lidTilt, x),
      lowerLid: lerp(a.eyes.lowerLid, b.eyes.lowerLid, x),
      pupil: lerp(a.eyes.pupil, b.eyes.pupil, x),
      scale: lerp(a.eyes.scale, b.eyes.scale, x),
      closedArc: late ? b.eyes.closedArc : a.eyes.closedArc,
      lookX: lerp(a.eyes.lookX, b.eyes.lookX, x),
      lookY: lerp(a.eyes.lookY, b.eyes.lookY, x),
    },
    mouth: {
      width: lerp(a.mouth.width, b.mouth.width, x),
      open: lerp(a.mouth.open, b.mouth.open, x),
      curve: lerp(a.mouth.curve, b.mouth.curve, x),
      skew: lerp(a.mouth.skew, b.mouth.skew, x),
      round: lerp(a.mouth.round, b.mouth.round, x),
      teeth: late ? b.mouth.teeth : a.mouth.teeth,
      shiftX: lerp(a.mouth.shiftX, b.mouth.shiftX, x),
    },
  };
}

/** Expressions blend over 3 to 4 frames and never pop (Part 2, section 7.2). */
export const EXPRESSION_BLEND_FRAMES = 4;

export type FaceKey = { frame: number; expression: ExpressionName | FaceParams };

const asFace = (e: ExpressionName | FaceParams): FaceParams =>
  typeof e === 'string' ? EXPRESSIONS[e] : e;

/** The face at a frame, given keys sorted by frame. */
export function faceAt(
  frame: number,
  keys: readonly FaceKey[],
  blendFrames = EXPRESSION_BLEND_FRAMES,
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
  const t = (frame - key.frame) / blendFrames;
  if (t >= 1) return asFace(key.expression);
  return blendFace(asFace(prev.expression), asFace(key.expression), smoothstep(t));
}
