import type { Vec2 } from './math';
import { shiftHip } from './pose';
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
 * Life during holds (Style 8): a slow head sway, a slight torso drift, a breathing bob, and a
 * slow shift of weight from one leg to the other. Planted feet never move: when the hip shifts,
 * the legs are solved again to the same foot points. A pose with a leg not planted on a foot
 * point (kneeling, lying) keeps its hip still.
 */
export function withLife(
  pose: ResolvedPose,
  frame: number,
  fps: number,
  seed: number,
): ResolvedPose {
  const t = frame / fps;
  const phase = (k: string) => seeded(`${seed}:life:${k}`) * Math.PI * 2;
  const wave = (period: number, k: string) => Math.sin((2 * Math.PI * t) / period + phase(k));
  const breath = wave(2.9, 'bob');
  const weight = wave(6.1, 'weight');
  const planted = Boolean(pose.legs.front.foot && pose.legs.back.foot);
  // The hip drifts toward one leg and sinks a touch on it; the shoulders lean back the other way.
  const stood = planted ? shiftHip(pose, 0.022 * weight, 0.007 * weight * weight) : pose;
  return {
    ...stood,
    headTilt: stood.headTilt + 1.4 * wave(3.7, 'tilt') + 0.5 * weight,
    torsoLean: stood.torsoLean + 0.6 * wave(4.3, 'lean') - (planted ? 0.7 * weight : 0),
    headBob: stood.headBob + 0.008 * breath,
    // Breathing lifts the shoulders: the arms swing out a hair on the in-breath.
    arms: {
      front: { ...stood.arms.front, upper: stood.arms.front.upper + 0.7 * breath },
      back: { ...stood.arms.back, upper: stood.arms.back.upper - 0.7 * breath },
    },
  };
}

/** Frames a dart of the eyes takes to get where it is going. */
const DART_FRAMES = 2;

/**
 * Eye darts: every second or three the eyes flick a little way off, rest there a moment and
 * flick back, so a held face still looks alive. Returns an offset to add to where the
 * character is looking, in the same units as a look direction. Deterministic from the seed.
 */
export function gazeAt(frame: number, fps: number, seed: number): Vec2 {
  // Walk the darts from the start: each one is a rest at center, then a glance away.
  let start = Math.round(fps * (0.6 + seeded(`${seed}:gaze:first`) * 1.4));
  for (let k = 0; start <= frame; k++) {
    const hold = Math.round(fps * (0.25 + seeded(`${seed}:gaze:hold:${k}`) * 0.4));
    const end = start + hold;
    if (frame < end + DART_FRAMES) {
      const target = {
        x: (seeded(`${seed}:gaze:x:${k}`) - 0.5) * 0.7,
        y: (seeded(`${seed}:gaze:y:${k}`) - 0.5) * 0.3,
      };
      const going = Math.min(1, (frame - start + 1) / DART_FRAMES);
      const leaving = frame >= end ? 1 - (frame - end + 1) / DART_FRAMES : 1;
      const amount = Math.max(0, Math.min(going, leaving));
      return { x: target.x * amount, y: target.y * amount };
    }
    start = end + DART_FRAMES + Math.round(fps * (1.1 + seeded(`${seed}:gaze:gap:${k}`) * 2.2));
  }
  return { x: 0, y: 0 };
}
