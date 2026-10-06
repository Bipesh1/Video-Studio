import { vec } from './math';
import type { Vec2 } from './math';
import { computeSkeleton } from './skeleton';
import type { ResolvedPose } from './types';

/**
 * Follow-through (Phase 2C): loose things lag behind what they hang from. A cape hem trails a
 * walking body and swings on past it when the body stops; long hair does the same; the top of
 * a held staff lags the hand. Each loose thing is a weight on a spring, dragged through the
 * air by a moving anchor.
 *
 * The lag is worked out fresh for every frame by replaying the last second and a half, so it
 * depends only on the frame number and renders the same every time.
 */

export type Spring = {
  /** How many times a second the loose thing swings on its own. */
  hertz: number;
  /** Extra damping of the swing itself, on top of the air's: 0 none, 1 never swings past. */
  damping: number;
  /**
   * How hard the air holds it back. This sets how far it trails a steady walk (drag times
   * speed over stiffness) and, with damping, how soon a swing dies away.
   */
  drag: number;
};

/**
 * A cape hem or long hair: slow and floaty. It trails a walk by about a seventh of a head and
 * swings about half that far past the body when the body stops, then settles.
 */
export const CLOTH: Spring = { hertz: 1.3, damping: 0.12, drag: 6.2 };
/** The far end of something stiff held in the hand: quick, with one small wobble. */
export const HELD: Spring = { hertz: 2.6, damping: 0.3, drag: 5 };

/** Seconds of the past replayed to find the lag. Longer than any swing takes to die away. */
const REPLAY_SECONDS = 1.5;
const SUBSTEPS = 4;

/**
 * How far a loose weight trails its anchor at a frame: the vector from the weight to the
 * anchor, in the anchor's own units. Zero when the anchor has been still for a while.
 */
export function lagBehind(
  anchorAt: (frame: number) => Vec2,
  frame: number,
  fps: number,
  spring: Spring = CLOTH,
): Vec2 {
  const start = Math.max(0, Math.floor(frame - REPLAY_SECONDS * fps));
  const k = (2 * Math.PI * spring.hertz) ** 2;
  // Damping against the anchor (the swing dies away) and against the air (it trails).
  const c = 2 * spring.damping * Math.sqrt(k);
  const dt = 1 / (fps * SUBSTEPS);

  let a = anchorAt(start);
  const next0 = anchorAt(start + 1);
  // Begin as if the anchor had always moved the way it moves now, so a steady walk has no jolt.
  let vel = vec((next0.x - a.x) * fps, (next0.y - a.y) * fps);
  let pos = vec(a.x - (spring.drag * vel.x) / k, a.y - (spring.drag * vel.y) / k);

  for (let f = start; f < frame; f++) {
    const b = anchorAt(f + 1);
    const av = vec((b.x - a.x) * fps, (b.y - a.y) * fps);
    for (let s = 1; s <= SUBSTEPS; s++) {
      const t = s / SUBSTEPS;
      const ax = a.x + (b.x - a.x) * t;
      const ay = a.y + (b.y - a.y) * t;
      const fx = k * (ax - pos.x) - c * (vel.x - av.x) - spring.drag * vel.x;
      const fy = k * (ay - pos.y) - c * (vel.y - av.y) - spring.drag * vel.y;
      vel = vec(vel.x + fx * dt, vel.y + fy * dt);
      pos = vec(pos.x + vel.x * dt, pos.y + vel.y * dt);
    }
    a = b;
  }
  return vec(a.x - pos.x, a.y - pos.y);
}

/** What a Character needs to draw its loose parts: the lag at the shoulders and at the hand. */
export type Sway = { body: Vec2; hand: Vec2 };

export const NO_SWAY: Sway = { body: vec(0, 0), hand: vec(0, 0) };

/**
 * The sway of a character whose pose over time is `poseAt(frame)`. Give the same function the
 * scene uses for its pose, in the character's own space (a walk's rootX counts as travel).
 */
export function swayOf(poseAt: (frame: number) => ResolvedPose, frame: number, fps: number): Sway {
  const cache = new Map<number, ReturnType<typeof computeSkeleton>>();
  const joints = (f: number) => {
    let j = cache.get(f);
    if (!j) {
      j = computeSkeleton(poseAt(f));
      cache.set(f, j);
    }
    return j;
  };
  return {
    body: lagBehind((f) => joints(f).shoulder, frame, fps, CLOTH),
    hand: lagBehind((f) => joints(f).arms.front.hand, frame, fps, HELD),
  };
}
