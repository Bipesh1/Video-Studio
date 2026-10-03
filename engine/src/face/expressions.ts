import { clamp, lerp, smoothstep } from '../rig/math';
import type { Brow, Eyes, FaceParams, Mouth } from './types';

const brow = (raise = 0, tilt = 0, arch = 0.12, wave = 0, curl = 0): Brow => ({
  raise,
  tilt,
  arch,
  wave,
  curl,
});

const eyes = (o: Partial<Eyes> = {}): Eyes => ({
  upperLid: 0,
  lidTilt: 0,
  lowerLid: 0,
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
  width: 0.14,
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
    ...both(brow(-0.045, 24, 0, 0, 0.7)),
    eyes: eyes({ upperLid: 0.44, lidTilt: 18, pupil: 0.6 }),
    mouth: mouth({ width: 0.3, curve: -0.04, corners: 1.1, wobble: 0.3 }),
  },
  shouting: {
    ...both(brow(-0.04, 29, 0, 0, 0.6)),
    eyes: eyes({ upperLid: 0.3, lidTilt: 20, pupil: 0.7 }),
    mouth: mouth({ width: 0.24, open: 0.15, curve: -0.03, teeth: 'top' }),
  },
  /** Like Reference B's frightened figure: wavy worried brows, drooping lids with bags, gritted teeth. */
  afraid: {
    ...both(brow(0.06, -18, 0.25, 0.35, 0)),
    eyes: eyes({
      scale: 1.05,
      upperLid: 0.3,
      lidTilt: -12,
      pupil: 0.5,
      lookX: -0.45,
      lookY: 0.55,
      bags: true,
      worry: true,
    }),
    mouth: mouth({
      width: 0.36,
      open: 0.28,
      curve: -0.015,
      skew: -0.02,
      teeth: 'gritted',
      chin: true,
    }),
  },
  surprised: {
    ...both(brow(0.12, -4, 0.65)),
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
  /** Shock and dread: very wide eyes, tiny pupils, brows high and worried. */
  horrified: {
    ...both(brow(0.13, -12, 0.3, 0.3)),
    eyes: eyes({ scale: 1.15, pupil: 0.42 }),
    mouth: mouth({ width: 0.09, open: 0.09, round: 1, chin: true }),
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
      squeeze: late ? b.eyes.squeeze : a.eyes.squeeze,
      strain: late ? b.eyes.strain : a.eyes.strain,
      bags: late ? b.eyes.bags : a.eyes.bags,
      worry: late ? b.eyes.worry : a.eyes.worry,
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
