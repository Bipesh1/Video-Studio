import { tokens } from '../tokens';

/**
 * Face layout in head units. Eye width and pupil size come from tokens (Style 3.6).
 * The remaining placement values are named here, in one place.
 */
export const EYE_W = tokens.face.eyeWidthPctOfHead;
export const EYE_H = EYE_W * 1.25;
export const PUPIL_D = EYE_W * tokens.face.pupilPctOfEye;
/** Eyes sit around the vertical middle of the head, close together. */
export const EYE_Y = -0.03;
export const EYE_GAP = 0.02;
export const BROW_GAP = 0.045;
export const BROW_LEN = EYE_W * 1.18;
export const MOUTH_Y = 0.22;

/**
 * Feature placement by head turn, at turn = 0 (front), 0.5 (three-quarter), 1 (profile).
 * The +x eye is on the side the head turns toward; it foreshortens. The -x eye hides in profile.
 */
export const TURN = {
  shift: [0, 0.16, 0.27],
  halfSpacing: [EYE_W / 2 + EYE_GAP / 2, 0.105, 0],
  leftEyeWidth: [1, 1, 0],
  rightEyeWidth: [1, 0.8, 0.8],
  mouthShift: [0, 0.17, 0.27],
  mouthWidth: [1, 0.85, 0.55],
} as const;

export const HEAD_TURNS = { front: 0, 'three-quarter': 0.5, profile: 1 } as const;
export type HeadTurn = keyof typeof HEAD_TURNS;
