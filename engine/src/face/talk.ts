import { tokens } from '../tokens';

/** One spoken word's timing, as the voice stage will provide it. */
export type WordTiming = { startMs: number; endMs: number };

export type MouthShape = 'closed' | 'half' | 'open';

/** The three talking shapes, in the order tokens list them (Style 8). */
export const MOUTH_SHAPES = tokens.motion.mouthShapes as readonly string[];

/** How far each talking shape opens the mouth, 0 to 1. */
export const MOUTH_OPENNESS: Record<MouthShape, number> = { closed: 0, half: 0.5, open: 1 };

/** Two frames per step, about three syllables a second at 30 fps. */
const STEP_FRAMES = 2;
const PATTERN: readonly MouthShape[] = ['half', 'open', 'open', 'half', 'closed'];

/**
 * The talking mouth shape at a frame: cycles through half, open and closed while a word
 * is spoken, and stays closed between words.
 */
export function mouthShapeAt(frame: number, fps: number, words: readonly WordTiming[]): MouthShape {
  const ms = (frame / fps) * 1000;
  const word = words.find((w) => ms >= w.startMs && ms < w.endMs);
  if (!word) return 'closed';
  const startFrame = Math.floor((word.startMs / 1000) * fps);
  const step = Math.floor((frame - startFrame) / STEP_FRAMES);
  return PATTERN[step % PATTERN.length] ?? 'closed';
}
