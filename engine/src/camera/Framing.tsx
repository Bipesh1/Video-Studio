import type { ReactNode } from 'react';
import { toScreen } from '../rig/Character';
import { computeSkeleton } from '../rig/skeleton';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import type { Facing, ResolvedPose } from '../rig/types';

/**
 * Shot sizes by framing and cropping (Part 2, section 7.6; Style 7). A scene is laid out once,
 * wide, with everyone standing where they stand. A closer shot is the same scene with the
 * camera moved in on someone: the place, the light and where people are never change between
 * the shots of a scene, only how much of it the frame shows.
 */
export const SHOTS = ['wide', 'medium', 'close-up', 'over-shoulder'] as const;
export type Shot = (typeof SHOTS)[number];

/** What the camera frames: a head's middle and size in the wide layout, in px. */
export type Focus = {
  x: number;
  y: number;
  head: number;
  /** For two people framed together: how far apart their heads are, px. */
  span?: number;
};

type Size = { width: number; height: number };

/**
 * Where the framed head goes and how big it is, as shares of the frame (Style 7): the key face
 * in the upper third, characters big, the bottom quarter left for captions.
 */
const TARGETS: Record<Shot, { head: number; x: number; y: number; room: number }> = {
  /** Whole figures with their surroundings. */
  wide: { head: 0.105, x: 0.5, y: 0.41, room: 1.6 },
  /** Head and body down to about the hips: the everyday shot for talk and action. */
  medium: { head: 0.19, x: 0.5, y: 0.3, room: 1.6 },
  /** The head fills about two fifths of the frame: for the feeling on a face. */
  'close-up': { head: 0.4, x: 0.5, y: 0.36, room: 1.3 },
  /** The one being looked at, past the shoulder of the one looking. */
  'over-shoulder': { head: 0.17, x: 0.66, y: 0.3, room: 1.6 },
};

/**
 * The same four shots in a frame wider than it is tall. There is less height, so a head takes
 * a larger share of it, and the face sits a little higher to leave the bottom for captions.
 */
const WIDE_TARGETS: Record<Shot, { head: number; x: number; y: number; room: number }> = {
  wide: { head: 0.15, x: 0.5, y: 0.34, room: 1.6 },
  medium: { head: 0.27, x: 0.5, y: 0.33, room: 1.6 },
  'close-up': { head: 0.5, x: 0.5, y: 0.4, room: 1.3 },
  'over-shoulder': { head: 0.25, x: 0.62, y: 0.33, room: 1.6 },
};

const targetsFor = (size: Size) => (size.width > size.height ? WIDE_TARGETS : TARGETS);

/** How big a head is in the wide layout of a frame this shape, px: where every scene starts. */
export const layoutHead = (size: Size): number => targetsFor(size).wide.head * size.height;

/** A standing head's height above the ground, in head units. */
const HEAD_HEIGHT = -computeSkeleton(resolvePose(stand)).head.y;

/** The focus on one character as laid out in the scene. */
export function focusOn(
  c: { x: number; groundY: number; head: number; facing?: Facing },
  pose: ResolvedPose,
): Focus {
  const at = toScreen(computeSkeleton(pose).head, c);
  return { x: at.x, y: at.y, head: c.head };
}

/** The focus on two characters together: the point between their heads. */
export function focusBetween(a: Focus, b: Focus): Focus {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    head: Math.max(a.head, b.head),
    span: Math.abs(a.x - b.x),
  };
}

/**
 * How the scene is scaled and moved for a shot. The camera never moves back from the wide
 * layout and never shows past the edge of the scene. `side` is which side the near shoulder is
 * on in an over-the-shoulder shot.
 */
export function shotTransform(
  shot: Shot,
  focus: Focus,
  size: Size,
  side: 'left' | 'right' = 'left',
): { scale: number; x: number; y: number } {
  const target = targetsFor(size)[shot];
  const fits = (0.94 * size.width) / ((focus.span ?? 0) + target.room * focus.head);
  const scale = Math.max(1, Math.min((target.head * size.height) / focus.head, fits));
  const tx = (shot === 'over-shoulder' && side === 'right' ? 1 - target.x : target.x) * size.width;
  const clampTo = (v: number, span: number) => Math.min(0, Math.max(span - span * scale, v));
  return {
    scale,
    x: clampTo(tx - focus.x * scale, size.width),
    y: clampTo(target.y * size.height - focus.y * scale, size.height),
  };
}

/** A scene framed for a shot. Wrap the whole wide scene in it. */
export const Framed = ({
  shot,
  focus,
  width,
  height,
  side = 'left',
  children,
}: {
  shot: Shot;
  focus: Focus;
  width: number;
  height: number;
  side?: 'left' | 'right';
  children: ReactNode;
}) => {
  const t = shotTransform(shot, focus, { width, height }, side);
  return <g transform={`translate(${t.x} ${t.y}) scale(${t.scale})`}>{children}</g>;
};

/**
 * Where to draw the near person in an over-the-shoulder shot: big, at the edge of the frame,
 * seen from behind (`back` on the Character), so only part of the back of the head and a
 * shoulder show. Draw them after the framed scene, on top of it.
 */
export function shoulderPlacement(
  size: Size,
  side: 'left' | 'right' = 'left',
): { x: number; groundY: number; head: number; facing: Facing } {
  // Low in a bottom corner and mostly out of the frame, so it never covers the far person's
  // face or what they are doing with their hands.
  const head = 0.5 * Math.min(size.width, size.height * 0.8);
  return {
    x: (side === 'left' ? 0 : 1) * size.width,
    groundY: (size.width > size.height ? 0.6 : 0.52) * size.height + HEAD_HEIGHT * head,
    head,
    facing: side === 'left' ? 'right' : 'left',
  };
}
