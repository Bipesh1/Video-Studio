import { clamp, lerp, smoothstep } from './math';
import type { Facing } from './types';

/**
 * Smooth head turns (Phase 2C). A character turns toward whoever speaks by easing its head
 * turn over a few frames instead of popping. Turning from facing one way to facing the other
 * passes through the front view, where the flip cannot be seen.
 */

export type TurnKey = {
  frame: number;
  facing: Facing;
  /** 0 front, 0.5 three-quarter, 1 profile. */
  turn: number;
};

/** Frames a head turn takes when a key gives none. */
export const TURN_FRAMES = 8;

/** The facing and head turn at a frame, given keys sorted by frame. */
export function turnAt(
  frame: number,
  keys: readonly TurnKey[],
  frames = TURN_FRAMES,
): { facing: Facing; turn: number } {
  const first = keys[0];
  if (!first) return { facing: 'right', turn: 0 };
  let index = 0;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k && k.frame <= frame) index = i;
  }
  const key = keys[index] ?? first;
  const prev = keys[index - 1];
  if (!prev || frame < key.frame) return { facing: key.facing, turn: key.turn };
  const t = clamp((frame - key.frame) / frames, 0, 1);
  if (t >= 1) return { facing: key.facing, turn: key.turn };
  if (prev.facing === key.facing) {
    return { facing: key.facing, turn: lerp(prev.turn, key.turn, smoothstep(t)) };
  }
  // Swing to the front, flip there, swing out the other way. Each half takes a share of the
  // time in proportion to how far it has to turn.
  const total = prev.turn + key.turn;
  const split = total > 0 ? prev.turn / total : 0.5;
  const e = smoothstep(t);
  return e < split
    ? { facing: prev.facing, turn: lerp(prev.turn, 0, split > 0 ? e / split : 1) }
    : { facing: key.facing, turn: lerp(0, key.turn, split < 1 ? (e - split) / (1 - split) : 1) };
}
