import type { Actor, CastMember, CharacterCard, Scene, Shot, Storyboard } from '@studio/shared';
import { isPlace, sceneBackground } from '../backgrounds/places';
import type { PlaceName } from '../backgrounds/places';
import type { BackgroundSpec } from '../backgrounds/Background';
import {
  STAGE_HEADS,
  STAGE_SHARE,
  focusBetween,
  focusOn,
  layoutHead,
  layoutScale,
} from '../camera/Framing';
import type { Focus } from '../camera/Framing';
import { ACTIONS } from '../rig/actions';
import type { ActionName } from '../rig/actions';
import { toScreen } from '../rig/Character';
import { vec } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { resolvePose } from '../rig/pose';
import { poseById } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import type { Facing, ResolvedPose } from '../rig/types';
import { propHeight, standingProp } from './props';

/**
 * Where everything in a storyboard shot goes, with no drawing in it (so it can be tested and
 * used by the CLI). A scene is laid out once, wide: the ground line, the size of a head, and
 * a spot across the stage for each person and thing. The camera then frames that layout.
 */

export type Size = { width: number; height: number };

export type Stage = {
  /** An adult's head, px, in the wide layout. */
  head: number;
  /** How much closer a wide shot stands than the layout is drawn (see layoutScale). */
  scale: number;
  /** The line people stand on, px from the top. */
  groundY: number;
  /** The middle of the stage and how wide it is, px: x of 0 and 1 are its two ends. */
  centre: number;
  span: number;
  background: BackgroundSpec;
};

/** A place the engine does not have falls back to an open field, so a still can still be made. */
export function stageFor(
  scene: Pick<Scene, 'place' | 'treatment' | 'palette'>,
  size: Size,
  seed: number,
): Stage {
  const place: PlaceName = isPlace(scene.place) ? scene.place : 'field';
  const background = sceneBackground(place, scene.treatment, scene.palette, seed);
  const head = layoutHead(size);
  return {
    head,
    scale: layoutScale(size),
    // Feet stand a little way into the ground, below the horizon: the same little way on
    // screen in a wide shot whatever the shape of the frame.
    groundY: (background.horizon + 0.034 / layoutScale(size)) * size.height,
    centre: size.width / 2,
    // Wide enough to stand people apart, never so wide that two people lose each other.
    span: Math.min(STAGE_SHARE * size.width, STAGE_HEADS * head),
    background,
  };
}

/** A spot across the stage (0 left, 1 right) as a screen x, px. */
export const stageX = (stage: Stage, x: number): number => stage.centre + (x - 0.5) * stage.span;

export type Placement = { x: number; groundY: number; head: number; facing: Facing };

/** How big someone is beside an adult: a saved card or a look says; otherwise full size. */
export function castSize(
  member: CastMember | undefined,
  cards: Record<string, CharacterCard>,
): number {
  if (!member) return 1;
  if (member.card) return cards[member.card]?.size ?? 1;
  return member.look?.size ?? 1;
}

export function placeActor(actor: Actor, stage: Stage, size: number): Placement {
  return {
    x: stageX(stage, actor.x ?? 0.5),
    groundY: stage.groundY,
    head: stage.head * size,
    facing: actor.facing,
  };
}

/** The held pose a shot names, or the action's pose at the start, with no life added. */
export function basePose(
  actor: { pose?: string | undefined; action?: string | undefined },
  seconds = 0,
): ResolvedPose {
  if (actor.action) {
    const action = ACTIONS[actor.action as ActionName];
    if (action) return action(seconds);
  }
  try {
    return resolvePose(poseById(actor.pose ?? 'stand'));
  } catch {
    return resolvePose(poseById('stand'));
  }
}

/** Where someone's head is on screen in the wide layout. */
export function headPoint(placement: Placement, pose: ResolvedPose): Vec2 {
  return toScreen(computeSkeleton(pose).head, placement);
}

const TURNS = { front: 0, 'three-quarter': 0.5, profile: 1 } as const;
export const turnOf = (actor: Pick<Actor, 'headTurn'>): number => TURNS[actor.headTurn];

/** Roughly where a hand holding something is, in the holder's own head units. */
const HELD_AT = vec(0.85, -1.75);

/**
 * The screen point an actor's eyes go to, or null to look straight ahead: another person's
 * head, a thing standing in the scene, a thing in a hand, or up or down.
 */
export function lookTarget(
  actor: Actor,
  shot: Shot,
  stage: Stage,
  placements: ReadonlyMap<string, { placement: Placement; pose: ResolvedPose }>,
): Vec2 | null {
  const me = placements.get(actor.character);
  if (!me) return null;
  const from = headPoint(me.placement, me.pose);
  const ahead = actor.facing === 'left' ? -1 : 1;
  if (actor.lookAt === 'ahead' || actor.lookAt === 'camera') return null;
  if (actor.lookAt === 'up')
    return vec(from.x + ahead * 1.4 * me.placement.head, from.y - 5 * me.placement.head);
  if (actor.lookAt === 'down')
    return vec(from.x + ahead * 0.9 * me.placement.head, me.placement.groundY);
  const person = placements.get(actor.lookAt);
  if (person) return headPoint(person.placement, person.pose);
  const holder = shot.actors.find((a) => a.holds === actor.lookAt);
  const held = holder ? placements.get(holder.character) : undefined;
  if (held) return toScreen(HELD_AT, held.placement);
  const thing = shot.props.find((p) => p.prop === actor.lookAt);
  if (thing) {
    const height = (standingProp(thing.prop)?.eyeHeight ?? 0.5) + propHeight(thing);
    return vec(stageX(stage, thing.x), stage.groundY - height * stage.head);
  }
  return null;
}

/** What the camera frames in a shot: the one it favours, or everyone, or the things. */
export function shotFocus(
  shot: Shot,
  stage: Stage,
  placements: ReadonlyMap<string, { placement: Placement; pose: ResolvedPose }>,
  /** The people holding a pose right now: a wide shot keeps their whole bodies in the picture. */
  whole?: ReadonlySet<string>,
): Focus {
  const aim = aimOf(shot, stage, placements);
  if (!whole || shot.camera.framing !== 'wide') return aim;
  const ends = shot.actors
    .filter((a) => whole.has(a.character))
    .flatMap((a) => {
      const p = placements.get(a.character);
      if (!p) return [];
      const j = computeSkeleton(p.pose);
      const half = 0.5;
      const xs = [
        j.head.x - half,
        j.head.x + half,
        j.legs.front.foot.x,
        j.legs.back.foot.x,
        j.arms.front.hand.x,
        j.arms.back.hand.x,
      ].map((x) => toScreen(vec(x, 0), p.placement).x);
      return [Math.min(...xs), Math.max(...xs)];
    });
  return ends.length
    ? { ...aim, keep: { left: Math.min(...ends), right: Math.max(...ends) } }
    : aim;
}

/** Where the camera aims for a shot: the one it favours, or everyone and what they look at. */
function aimOf(
  shot: Shot,
  stage: Stage,
  placements: ReadonlyMap<string, { placement: Placement; pose: ResolvedPose }>,
): Focus {
  const seen = shot.actors.filter((a) => !(a.back && shot.camera.framing === 'over-shoulder'));
  const focusOf = (id: string): Focus | null => {
    const p = placements.get(id);
    return p ? focusOn(p.placement, p.pose) : null;
  };
  const favoured = shot.camera.focus ? focusOf(shot.camera.focus) : null;
  if (favoured) return favoured;
  const all = seen.map((a) => focusOf(a.character)).filter((f): f is Focus => f !== null);
  // A thing someone looks at, or that an arrow names, belongs in the picture with them, unless
  // the shot is a close-up.
  const named = shot.overlay?.kind === 'pointer' ? shot.overlay.to : null;
  const lookedAt =
    shot.camera.framing === 'close-up'
      ? []
      : shot.props
          .filter((p) => p.prop === named || seen.some((a) => a.lookAt === p.prop))
          .map((p) => stageX(stage, p.x));
  const first = all[0];
  if (all.length === 1 && first && lookedAt.length === 0) return first;
  if (first) {
    const xs = [...all.map((f) => f.x), ...lookedAt];
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const heads = [...all].sort((a, b) => a.x - b.x);
    const between = focusBetween(heads[0] as Focus, heads[heads.length - 1] as Focus);
    return { ...between, x: (left + right) / 2, span: right - left };
  }
  // Nobody in the shot: frame the things, at about the height of a standing head, or at the
  // height of whatever hangs in the sky.
  const xs = shot.props.map((p) => stageX(stage, p.x));
  const x = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : stage.centre;
  const ups = shot.props.map(propHeight).filter((up) => up > 0);
  const up = ups.length ? ups.reduce((a, b) => a + b, 0) / ups.length + 0.6 : 2.6;
  return {
    x,
    y: stage.groundY - up * stage.head,
    head: stage.head,
    span: xs.length > 1 ? Math.max(...xs) - Math.min(...xs) : 0,
  };
}

/** Every shot of a storyboard in order, with its scene and its frames. */
export type TimedShot = {
  shot: Shot;
  scene: Scene;
  /** Its place among all the shots, and among the shots of its scene. */
  index: number;
  startFrame: number;
  endFrame: number;
  sceneStartFrame: number;
};

/**
 * The shots with their frames. A storyboard whose shots have no times yet (before the voice)
 * gets three seconds a shot, so stills can still be made from it.
 */
export function timedShots(storyboard: Storyboard, fps: number): TimedShot[] {
  const out: TimedShot[] = [];
  let untimedAt = 0;
  for (const scene of storyboard.scenes) {
    let sceneStartFrame = -1;
    for (const shot of scene.shots) {
      const startMs = shot.startMs ?? untimedAt;
      const endMs = shot.endMs ?? startMs + 3000;
      untimedAt = endMs;
      const startFrame = Math.round((startMs / 1000) * fps);
      if (sceneStartFrame < 0) sceneStartFrame = startFrame;
      out.push({
        shot,
        scene,
        index: out.length,
        startFrame,
        endFrame: Math.max(startFrame + 1, Math.round((endMs / 1000) * fps)),
        sceneStartFrame,
      });
    }
  }
  return out;
}

/** The shot on screen at a frame. */
export function shotAt(shots: readonly TimedShot[], frame: number): TimedShot | undefined {
  let current = shots[0];
  for (const s of shots) if (s.startFrame <= frame) current = s;
  return current;
}
