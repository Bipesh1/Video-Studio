import type { ReactNode } from 'react';
import { Easing, interpolate } from 'remotion';
import { clamp, easeOutBack, smoothstep } from '../rig/math';
import { seeded } from '../rig/random';
import { ink } from '../tokens';

/**
 * A 2D camera over the whole scene (Part 2, section 7.6). Each move wraps the scene and can be
 * nested inside another. Plain cuts between shots are made by the shot sequences, not here.
 */

/** A slow push-in toward a focus point, for emotional lines (Style 8). */
export const PushIn = ({
  frame,
  durationInFrames,
  strength,
  focus,
  children,
}: {
  frame: number;
  durationInFrames: number;
  /** 0.1 means the frame ends 10% closer. */
  strength: number;
  focus: { x: number; y: number };
  children: ReactNode;
}) => {
  const zoom = interpolate(frame, [0, Math.max(1, durationInFrames)], [1, 1 + strength], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <g
      transform={`translate(${focus.x} ${focus.y}) scale(${zoom}) translate(${-focus.x} ${-focus.y})`}
    >
      {children}
    </g>
  );
};

/** Frames a fast push-in takes to land. */
export const PUNCH_IN_FRAMES = 5;

/**
 * A fast push-in: the camera jumps closer in a few frames, overshoots a touch and holds. For
 * a shock, a reveal, or the instant of a hit. Before `at` the scene is untouched.
 */
export const PunchIn = ({
  frame,
  at,
  strength = 0.18,
  frames = PUNCH_IN_FRAMES,
  focus,
  children,
}: {
  frame: number;
  /** The frame the push starts on. */
  at: number;
  /** 0.18 means it ends 18% closer. */
  strength?: number;
  frames?: number;
  focus: { x: number; y: number };
  children: ReactNode;
}) => {
  const zoom = 1 + strength * easeOutBack(clamp((frame - at) / Math.max(1, frames), 0, 1), 1.4);
  return (
    <g
      transform={`translate(${focus.x} ${focus.y}) scale(${zoom}) translate(${-focus.x} ${-focus.y})`}
    >
      {children}
    </g>
  );
};

/** Seconds a camera shake takes to die away. */
export const SHAKE_SECONDS = 0.36;

/** How far the picture is thrown at a frame, as a fraction of the shake's strength: 0 when still. */
export function shakeAt(
  frame: number,
  fps: number,
  at: number | readonly number[],
  seed = 1,
): { x: number; y: number; force: number } {
  let x = 0;
  let y = 0;
  let force = 0;
  for (const start of typeof at === 'number' ? [at] : at) {
    const u = (frame - start) / (SHAKE_SECONDS * fps);
    if (u < 0 || u >= 1) continue;
    // Hardest on the first frame, dying away fast.
    const decay = (1 - u) ** 2;
    x += decay * (seeded(`${seed}:shake-x:${start}:${frame}`) * 2 - 1);
    y += decay * (seeded(`${seed}:shake-y:${start}:${frame}`) * 2 - 1);
    force = Math.max(force, decay);
  }
  return { x, y, force };
}

/**
 * A small camera shake on an impact (Style 8): the whole picture jolts and settles in about a
 * third of a second. `at` is the frame of the impact, or several frames for several impacts.
 * The picture is drawn a touch bigger while it shakes, so no empty edge ever shows.
 */
export const Shake = ({
  frame,
  fps,
  at,
  width,
  height,
  strength = 16,
  seed = 1,
  children,
}: {
  frame: number;
  fps: number;
  at: number | readonly number[];
  /** The size of the picture, px. */
  width: number;
  height: number;
  /** The biggest jolt, px. */
  strength?: number;
  seed?: number;
  children: ReactNode;
}) => {
  const s = shakeAt(frame, fps, at, seed);
  if (s.force === 0) return <g>{children}</g>;
  const zoom = 1 + (s.force * strength * 2.6) / Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  return (
    <g
      transform={`translate(${cx + s.x * strength} ${cy + s.y * strength}) scale(${zoom}) translate(${-cx} ${-cy})`}
    >
      {children}
    </g>
  );
};

/**
 * A pan: the camera slides across a scene that is wider or taller than the frame, between two
 * frames, easing in and out. `dx` and `dy` are how far the camera travels, px: a camera moving
 * right slides the scene left. Over a few frames it is a whip pan, which Style 8 keeps for the
 * change from one scene to the next.
 */
export const Pan = ({
  frame,
  from,
  to,
  dx,
  dy = 0,
  children,
}: {
  frame: number;
  /** The frame the camera starts to move on, and the frame it arrives. */
  from: number;
  to: number;
  dx: number;
  dy?: number;
  children: ReactNode;
}) => {
  const e = smoothstep((frame - from) / Math.max(1, to - from));
  return <g transform={`translate(${-dx * e} ${-dy * e})`}>{children}</g>;
};

/** Frames a quick fade takes to go dark, and again to come back. */
export const FADE_FRAMES = 6;

/**
 * A quick fade between two scenes (Style 8): the picture dips to dark and comes back on the
 * next scene. Use it when the place or the time changes; inside one scene, shots change with
 * a plain cut. `at` is the frame the scene changes on. Draw it over everything else.
 */
export const Fade = ({
  frame,
  at,
  width,
  height,
  frames = FADE_FRAMES,
}: {
  frame: number;
  at: number;
  width: number;
  height: number;
  frames?: number;
}) => {
  const dark = clamp(1 - Math.abs(frame - at) / Math.max(1, frames), 0, 1);
  if (dark <= 0) return null;
  return <rect width={width} height={height} fill={ink} opacity={dark} />;
};
