import { seeded } from './random';
import type { ResolvedPose } from './types';
import { tokens } from '../tokens';

/** Eyelid closure over the frames of one blink: close, hold, open (0 open, 1 shut). */
const BLINK_SHAPE = [0.55, 1, 1, 0.55, 0.2] as const;

/**
 * Frames at which blinks start, from a seed. Gaps fall inside the token range
 * (Style 8: every 2 to 4 seconds). Deterministic for the same seed.
 */
export function blinkStarts(seed: number, fps: number, untilFrame: number): number[] {
  const [lo, hi] = tokens.motion.blinkEverySeconds;
  const starts: number[] = [];
  let f = Math.round(fps * (0.4 + seeded(`${seed}:blink:first`) * 1.2));
  for (let k = 0; f <= untilFrame; k++) {
    starts.push(f);
    f += Math.round(fps * (lo + (hi - lo) * seeded(`${seed}:blink:${k}`)));
  }
  return starts;
}

/** How closed the eyes are at a frame because of blinking, 0 to 1. */
export function blinkAt(frame: number, fps: number, seed: number): number {
  const starts = blinkStarts(seed, fps, frame);
  const last = starts[starts.length - 1];
  if (last === undefined) return 0;
  return BLINK_SHAPE[frame - last] ?? 0;
}

/**
 * Life during holds (Style 8): a slow head sway, a slight torso drift and a breathing bob.
 * Planted feet are unaffected, because only the upper body moves.
 */
export function withLife(
  pose: ResolvedPose,
  frame: number,
  fps: number,
  seed: number,
): ResolvedPose {
  const t = frame / fps;
  const phase = (k: string) => seeded(`${seed}:life:${k}`) * Math.PI * 2;
  return {
    ...pose,
    headTilt: pose.headTilt + 1.4 * Math.sin((2 * Math.PI * t) / 3.7 + phase('tilt')),
    torsoLean: pose.torsoLean + 0.6 * Math.sin((2 * Math.PI * t) / 4.3 + phase('lean')),
    headBob: pose.headBob + 0.008 * Math.sin((2 * Math.PI * t) / 2.9 + phase('bob')),
  };
}
