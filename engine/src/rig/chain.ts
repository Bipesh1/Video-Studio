import { clamp, smoothstep } from './math';
import { BODY_MOVE, bodyMoveFrames, mixBodies, mixPoses } from './pose';
import type { LegState, ResolvedPose } from './types';
import { tokens } from '../tokens';

/**
 * Moves one after another (Phase 2D): sneak, then run, then jump. Every action in the library
 * is a pose over the seconds since it began, starting from wherever it likes. A chain plays
 * them in turn, each one starting where the last one left the body, with a short blend at
 * each change so nothing pops.
 */

export type Link = {
  /** When this move starts, in seconds from the start of the chain. */
  from: number;
  /** The move: a pose for the seconds since it started. */
  at: (seconds: number) => ResolvedPose;
};

/** Seconds a change from one move to the next takes. */
export const CHAIN_BLEND = 0.1;

/** The same pose somewhere else along the ground: the body and its planted feet move together. */
export function movePose(pose: ResolvedPose, dx: number): ResolvedPose {
  const moved = (l: LegState): LegState =>
    l.foot ? { ...l, foot: { x: l.foot.x + dx, y: l.foot.y } } : l;
  return {
    ...pose,
    rootX: pose.rootX + dx,
    legs: { front: moved(pose.legs.front), back: moved(pose.legs.back) },
  };
}

/**
 * The pose at a time for a chain of moves, given in the order they start. The body's place
 * along the ground (rootX) carries on from move to move, so a scene can read how far the
 * character has travelled from the pose alone.
 */
export function chainAt(time: number, links: readonly Link[], blend = CHAIN_BLEND): ResolvedPose {
  const first = links[0];
  if (!first) throw new Error('A chain needs at least one move.');
  let origin = -first.at(0).rootX;
  let current = first;
  let previous: { link: Link; origin: number } | null = null;
  for (let i = 1; i < links.length; i++) {
    const next = links[i];
    if (!next || next.from > time) break;
    const leftAt = current.at(next.from - current.from).rootX + origin;
    previous = { link: current, origin };
    origin = leftAt - next.at(0).rootX;
    current = next;
  }
  const pose = movePose(current.at(Math.max(0, time - current.from)), origin);
  const since = time - current.from;
  if (!previous) return pose;
  const left = movePose(previous.link.at(current.from - previous.link.from), previous.origin);
  // A change that takes the whole body down or up (walking into a kneel) is seen to happen,
  // like any body move (Style 8): it takes longer, and the feet travel with the hips.
  const start = movePose(current.at(0), origin);
  const travel = Math.abs(left.hipY - start.hipY);
  const whole = travel >= BODY_MOVE;
  const span = whole ? Math.max(blend, bodyMoveFrames(travel) / tokens.motion.fps) : blend;
  if (since >= span) return pose;
  const e = smoothstep(clamp(since / span, 0, 1));
  return whole ? mixBodies(left, pose, e, e) : mixPoses(left, pose, e, e);
}
