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
/** A wide mouth is pushed back until its front corner sits inside this radius of the head. */
export const MOUTH_FIT_R = 0.445;

/**
 * Feature placement by head turn, at turn = 0 (front), 0.5 (three-quarter), 1 (profile).
 * The +x eye is on the side the head turns toward; it foreshortens. The -x eye hides in profile.
 */
export const TURN = {
  shift: [0, 0.15, 0.25],
  halfSpacing: [EYE_W / 2 + EYE_GAP / 2, EYE_W * 0.45, 0],
  leftEyeWidth: [1, 1, 0],
  rightEyeWidth: [1, 0.8, 0.8],
  mouthShift: [0, 0.15, 0.25],
  mouthWidth: [1, 0.85, 0.55],
} as const;

export const HEAD_TURNS = { front: 0, 'three-quarter': 0.5, profile: 1 } as const;
export type HeadTurn = keyof typeof HEAD_TURNS;
