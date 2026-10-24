import { clamp, smooth, zoomPath } from './Journey';
import type { Cam } from './Journey';

/**
 * The camera of a journey shot after its first flight: on the word of a thing that names
 * another stop (`cam` on a `show` item) it goes on to that stop (2026-10-22, the Kurzgesagt
 * study: few big subjects, a camera that keeps moving between them). Measured against their
 * Shorts, a move on every word was too busy (Biku: "is the camera movement too fast?"), so a
 * move is unhurried, the camera then rests at least CAMERA_REST seconds with only a slow drift,
 * and a thing named sooner than that, or too soon for a move to finish and be seen, is cut to.
 *
 * A world that wants one continuous camera (the memory world, 2026-10-24, Biku: "most of the
 * time it should be continuous camera shots") asks for `glide`: a thing named soon after the
 * last is glided to, quicker (down to 0.6 s), from wherever the camera is, never cut to.
 */

/** Seconds the camera rests after a move before it moves again; anything sooner is a cut. */
export const CAMERA_REST = 1.5;

export type CameraLeg<S> = { to: S; at: Cam; start: number };

export function wordCamera<S>({
  legs,
  flown,
  arrived,
  fly,
  local,
  duration,
  fps,
  drift,
  tooSoon = 'cut',
}: {
  /** The stops named on words, in the order of their words, with where each puts the camera. */
  legs: readonly CameraLeg<S>[];
  /** Where the camera is at this frame from the shot's first flight alone. */
  flown: Cam;
  /** Where the first flight ends. */
  arrived: Cam;
  /** Frames of the first flight. */
  fly: number;
  local: number;
  duration: number;
  fps: number;
  /** The slow drift in, from 0 to 1 over a hold. */
  drift: (c: Cam, held: number) => Cam;
  /** What a move named too soon after the last does: a cut, or a quicker glide. */
  tooSoon?: 'cut' | 'glide';
}): { cam: Cam; stop: S | null } {
  const plans: { start: number; from: Cam; to: Cam; frames: number; stop: S }[] = [];
  let free = Math.max(0, fly) + CAMERA_REST * fps;
  let where = arrived;
  /** Where the planned moves have the camera at a frame. */
  const position = (frame: number): Cam => {
    const p = plans.filter((l) => l.start <= frame).at(-1);
    if (!p) return arrived;
    const u = p.frames > 0 ? clamp((frame - p.start) / p.frames) : 1;
    return u >= 1 ? p.to : zoomPath(p.from, p.to).at(smooth(u));
  };
  legs.forEach((leg, i) => {
    const next = legs[i + 1]?.start ?? Infinity;
    if (tooSoon === 'glide') {
      // From wherever the camera is, at its usual pace if there is time, quicker if not.
      const start = Math.max(leg.start, fly);
      const from = position(start);
      const ideal = fps * clamp(0.85 + 0.1 * zoomPath(from, leg.at).S, 1.0, 1.5);
      const frames = Math.max(0.6 * fps, Math.min(ideal, next - start - 0.5 * fps));
      plans.push({ start, from, to: leg.at, frames, stop: leg.to });
      return;
    }
    const move = fps * clamp(0.85 + 0.1 * zoomPath(where, leg.at).S, 1.0, 1.5);
    // A move it has no time to finish and show is a cut: the next thing comes too soon.
    const frames = leg.start < free || next - leg.start < move + 0.8 * fps ? 0 : move;
    plans.push({ start: leg.start, from: where, to: leg.at, frames, stop: leg.to });
    where = leg.at;
    free = leg.start + frames + CAMERA_REST * fps;
  });
  const last = plans.filter((l) => l.start <= local).at(-1);
  if (!last) {
    const held =
      fly > 0 ? clamp((local - fly) / Math.max(1, duration - fly)) : clamp(local / duration);
    return { cam: drift(flown, held), stop: null };
  }
  const u = last.frames > 0 ? clamp((local - last.start) / last.frames) : 1;
  const cam = u >= 1 ? last.to : zoomPath(last.from, last.to).at(smooth(u));
  // Once there, the slow drift in starts again from the new place.
  const settled = last.start + last.frames;
  return {
    cam: drift(cam, clamp((local - settled) / Math.max(1, duration - settled))),
    stop: last.stop,
  };
}
