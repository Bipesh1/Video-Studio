import { tokens } from '../tokens';

/**
 * Face layout in head units. Eye width and pupil size come from tokens (Style 3.6).
 * The remaining placement values are named here, in one place.
 */
export const EYE_W = tokens.face.eyeWidthPctOfHead;
export const EYE_H = EYE_W * 1.15;
export const PUPIL_D = EYE_W * tokens.face.pupilPctOfEye;
/** Eyes sit around the vertical middle of the head, close together. */
/** Eyes sit a little above the middle, leaving room for a wide mouth below (Reference B). */
export const EYE_Y = -0.08;
/** Slightly negative: the eyes just overlap, as in both references. */
export const EYE_GAP = -0.012;
export const BROW_GAP = 0.045;
/** Brows are a little shorter than an eye is wide, as on both figures in Reference B. */
export const BROW_LEN = EYE_W * 0.84;
/** Brows sit a little outward of their eyes, so the two never join into one V. */
export const BROW_OUT = EYE_W * 0.14;
export const MOUTH_Y = 0.24;
/** Mouth sizes in the presets are scaled up to match the references' wide mouths. */
export const MOUTH_SCALE = 1.35;
export const MOUTH_OPEN_SCALE = 1.2;
/** The width of a calm mouth, before scaling. Talking shapes widen any mouth by a share of it. */
export const CALM_MOUTH_W = 0.14;
/** A wide mouth is pushed back until its front corner sits inside this radius of the head. */
export const MOUTH_FIT_R = 0.445;

/** Half the distance between the two eyes of a face seen from the front. */
const FRONT_HALF = EYE_W / 2 + EYE_GAP / 2;
/** Where the two eyes sit in a three-quarter view. */
const QUARTER_NEAR = 0.15 - EYE_W * 0.45;
const QUARTER_FAR = 0.15 + EYE_W * 0.45;
/** Where the one eye of a profile sits. */
const PROFILE_EYE = 0.25;

/**
 * Feature placement by head turn. The eye values are given at turn = 0 (front), 0.25, 0.5
 * (three-quarter), 0.75 and 1 (profile); the others at 0, 0.5 and 1.
 *
 * The near eye is the -x one. It is drawn over the other, slides toward the front of the face
 * as the head turns, and is the one eye of a profile. The far eye, on the side the head turns
 * toward, narrows against the near eye and is gone by three quarters of the way to profile.
 * The two never sit on top of each other, so a head can be held at any turn (Biku, 2026-10-06).
 */
export const TURN = {
  shift: [0, 0.15, 0.25],
  nearEyeX: [-FRONT_HALF, (QUARTER_NEAR - FRONT_HALF) / 2, QUARTER_NEAR, 0.13, PROFILE_EYE],
  farEyeX: [FRONT_HALF, (QUARTER_FAR + FRONT_HALF) / 2, QUARTER_FAR, 0.3, 0.37],
  nearEyeWidth: [1, 1, 1, 0.9, 0.8],
  farEyeWidth: [1, 0.9, 0.8, 0.2, 0],
  mouthShift: [0, 0.15, 0.25],
  mouthWidth: [1, 0.85, 0.55],
} as const;

/** An eye narrower than this share of its full width is not drawn. */
export const EYE_HIDDEN_BELOW = 0.25;

export type EyeSlot = {
  /** -1 is the near eye, 1 the far eye. */
  side: -1 | 1;
  x: number;
  widthFactor: number;
  /** Where the near eye, drawn on top, stops covering this one. */
  coverX?: number;
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Piecewise-linear through values placed evenly from turn 0 to turn 1. */
const at = (turn: number, values: readonly number[]): number => {
  const span = values.length - 1;
  const u = clamp01(turn) * span;
  const i = Math.min(span - 1, Math.floor(u));
  const a = values[i] ?? 0;
  const b = values[i + 1] ?? a;
  return a + (b - a) * (u - i);
};

/** The eyes that show at a head turn and where they sit. Everything on the face reads this. */
export function eyeSlots(turn: number): EyeSlot[] {
  const slots: EyeSlot[] = [
    { side: -1, x: at(turn, TURN.nearEyeX), widthFactor: at(turn, TURN.nearEyeWidth) },
    { side: 1, x: at(turn, TURN.farEyeX), widthFactor: at(turn, TURN.farEyeWidth) },
  ];
  return slots.filter((s) => s.widthFactor >= EYE_HIDDEN_BELOW);
}

export const HEAD_TURNS = { front: 0, 'three-quarter': 0.5, profile: 1 } as const;
export type HeadTurn = keyof typeof HEAD_TURNS;
