import { actorMoments } from '@studio/shared';
import type { Actor, ActorMoment, CharacterCard, Storyboard, VoiceTrack } from '@studio/shared';
import type { Focus } from '../camera/Framing';
import { STAND_HIP_HEIGHT, armReachToHand, body } from '../rig/body';
import { chainAt, movePose } from '../rig/chain';
import { ELBOW_DOWN } from '../rig/ik';
import { withLife } from '../rig/life';
import { length, sub, vec } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { poseAt as posedAt } from '../rig/pose';
import type { Pose, PoseKey } from '../rig/pose';
import { poseById, stand } from '../rig/poses';
import { seeded } from '../rig/random';
import { shoulderOf } from '../rig/skeleton';
import type { ResolvedPose } from '../rig/types';
import { basePose, castSize, placeActor, shotFocus, stageFor, stageX } from './layout';
import type { Placement, Size, TimedShot } from './layout';
import { gripHeight } from './props';

/**
 * A shot worked out for one frame, before anything is drawn: where each person stands and how
 * their body is, what they hold and look at right now, which standing things are still there,
 * and where the camera aims. The picture is drawn from this (ShotPicture) and the self-check
 * measures it (measure.ts), so the two can never disagree.
 */

/** Frames a pose takes to change when a cut keeps someone on screen in a new pose. */
const POSE_FRAMES = 5;

/** A small steady number for each person, so their blinks and sway differ. */
export const seedFor = (seed: number, id: string) => seed + Math.floor(seeded(`cast:${id}`) * 9973);

export type Drawn = {
  actor: Actor;
  /** What they are doing right now: their starting state or the latest step of the shot. */
  now: ActorMoment;
  /** What they are doing at any frame of the shot. */
  momentAt: (frame: number) => ActorMoment;
  /** Which of the shot's standing things they have picked up by a frame, by their place in the list. */
  taken: (frame: number) => number[];
  /** Things they take in this shot that stand behind them or further off than an arm can reach. */
  outOfReach: string[];
  /** Where they stand and how the body is at any frame, without the small moves of life. */
  whereAt: (frame: number) => { placement: Placement; pose: ResolvedPose };
  /** Whether they sit at any point in the shot, so a seat stays theirs. */
  sits: boolean;
  placement: Placement;
  /** The pose for looking and framing: where the body is, without the small moves of life. */
  pose: ResolvedPose;
  /** The pose at a frame, life and travel included. */
  poseAt: (frame: number) => ResolvedPose;
  /** True when an action carries them along at some point in the shot. */
  moving: boolean;
  /** The frame each stretch of the shot starts on, and the face it wears. */
  faces: Array<{ frame: number; expression: string }>;
  /** How far the action has carried them, px, when the camera travels along. */
  travel: number;
};

/** A pose by name, or standing when the name is not one the engine knows. */
const poseOrStand = (id: string | undefined) => {
  try {
    return poseById(id ?? 'stand');
  } catch {
    return stand;
  }
};

/**
 * Picking a thing up off the ground. The hand goes to it first, closes on it, and only then
 * does it leave the ground with the hand (Biku, 2026-10-06, on a bag that was on the ground in
 * one shot and in the hand in the next: "looks like the posture didn't change in continuous
 * frames").
 */
const REACH_FRAMES = 10;
/** How far a body leans to reach a thing, in degrees, and how far its head bows toward it. */
const MAX_REACH_LEAN = 42;
const REACH_BOW = 6;

/**
 * A pose reaching for a point: the same body, leaning toward it as far as it needs to, the
 * near hand closing on it. The point is in the person's own space: head units, x the way they
 * face, y down from the ground line.
 */
/** How far a hand gets from its shoulder, in head units, with a little bend left in the elbow. */
const ARM_REACH = (body.upperArm + armReachToHand) * 0.98;

/** How far a body in a pose has to lean for its near hand to get to a point; null when it cannot. */
function leanToReach(pose: Pose, point: Vec2): number | null {
  const hip = vec(0, -(pose.hipHeight ?? STAND_HIP_HEIGHT));
  let lean = pose.torsoLean ?? 0;
  while (length(sub(point, shoulderOf(hip, lean))) > ARM_REACH) {
    if (lean >= MAX_REACH_LEAN) return null;
    lean += 2;
  }
  return lean;
}

function reachingFor(pose: Pose, point: Vec2): Pose {
  const hip = vec(0, -(pose.hipHeight ?? STAND_HIP_HEIGHT));
  const lean = leanToReach(pose, point) ?? MAX_REACH_LEAN;
  // The hand that will carry it, already turned the way it will hold it.
  const { hand = 'grip', gripAxis = -90, thumb = 1 } = poseById('hold-object').arms.front;
  return {
    ...pose,
    id: `${pose.id}-reach`,
    torsoLean: lean,
    headTilt: (pose.headTilt ?? 0) + REACH_BOW,
    arms: {
      ...pose.arms,
      front: { reach: sub(point, shoulderOf(hip, lean)), bend: ELBOW_DOWN, hand, gripAxis, thumb },
    },
  };
}

/** How long one move takes to hand over to the next inside a shot, in seconds. */
const STEP_BLEND = 0.16;

/**
 * How far behind the camera follows, in seconds. Locked to a head it hides every move of the
 * body: someone who stands up stays put while the room drops behind them. A beat behind, the
 * body is seen to move and the camera then comes to rest on it.
 */
const CAMERA_LAG = 0.5;
/** A cut lands with the camera already where the shot wants it, once the new pose is in. */
const CUT_SETTLE = POSE_FRAMES + 3;

/** The camera's aim a beat behind: the aims of the last stretch, eased in and out. */
function trailing(aimAt: (frame: number) => Focus, frame: number, frames: number): Focus {
  const n = Math.max(1, frames);
  let total = 0;
  let x = 0;
  let y = 0;
  let head = 0;
  let span = 0;
  let spans = false;
  let left = 0;
  let right = 0;
  let kept = 0;
  let zoom = 1;
  for (let k = 0; k < n; k++) {
    const weight = Math.sin((Math.PI * (k + 0.5)) / n);
    const aim = aimAt(frame - k);
    total += weight;
    x += aim.x * weight;
    y += aim.y * weight;
    head += aim.head * weight;
    span += (aim.span ?? 0) * weight;
    spans ||= aim.span !== undefined;
    if (aim.keep) {
      zoom = aim.keep.zoom ?? 1;
      left += aim.keep.left * weight;
      right += aim.keep.right * weight;
      kept += weight;
    }
  }
  return {
    x: x / total,
    y: y / total,
    head: head / total,
    ...(spans ? { span: span / total } : {}),
    ...(kept > 0 ? { keep: { left: left / kept, right: right / kept, zoom } } : {}),
  };
}

/** Work a shot out for one frame. */
export function stageShot({
  ts,
  shots,
  storyboard,
  cards,
  track,
  size,
  frame,
  fps,
}: {
  ts: TimedShot;
  shots: readonly TimedShot[];
  storyboard: Storyboard;
  cards: Record<string, CharacterCard>;
  track: VoiceTrack | null;
  size: Size;
  frame: number;
  fps: number;
}) {
  const { shot, scene } = ts;
  const stage = stageFor(scene, size, storyboard.seed);
  const local = frame - ts.startFrame;
  const t = local / fps;
  const duration = ts.endFrame - ts.startFrame;
  const before = shots[ts.index - 1];
  // A plain cut is the same moment seen again, inside a scene or into a new scene in the same
  // place; a fade says time has passed. Faces and poses carry across the first, not the second.
  const sameMoment =
    before &&
    (before.scene.id === scene.id ||
      (shot.transition !== 'fade' && before.scene.place === scene.place));
  const previous = sameMoment ? before : undefined;
  const follows = shot.camera.move === 'follow';
  const line = scene.lines.find((l) => l.id === shot.line);
  const words = track && line ? track.words.filter((w) => w.lineId === line.id) : [];

  const drawn: Drawn[] = shot.actors.map((actor) => {
    const member = storyboard.cast.find((m) => m.id === actor.character);
    const placement = placeActor(actor, stage, castSize(member, cards));
    const seed = seedFor(storyboard.seed, actor.character);
    const sign = actor.facing === 'left' ? -1 : 1;
    // A shot is one or more stretches: how they start, then each step (Biku, 2026-10-06:
    // "it can't change the posture in continuous frames?").
    const moments = actorMoments(actor);
    const startOf = (m: ActorMoment) => ts.startFrame + Math.round(m.at * duration);
    const stretchAt = (f: number): ActorMoment => {
      let current = moments[0] as ActorMoment;
      for (const m of moments) if (startOf(m) <= f) current = m;
      return current;
    };
    const moving = moments.some((m) => m.action);
    // A step that puts in the hand something standing in the shot picks it up: the nearest
    // one, reached for first when it is in front of them and they are not on the move.
    const pickups = moments.flatMap((m, i) => {
      const from = moments[i - 1];
      if (!from || !m.holds || m.holds === from.holds) return [];
      const spot = shot.props
        .map((p, index) => ({ index, prop: p.prop, x: stageX(stage, p.x) }))
        .filter((p) => p.prop === m.holds)
        .sort((a, b) => Math.abs(a.x - placement.x) - Math.abs(b.x - placement.x))[0];
      if (!spot) return [];
      const ahead = ((spot.x - placement.x) * sign) / placement.head;
      const reach = !moving && ahead > 0;
      return [
        {
          moment: m,
          from,
          index: spot.index,
          reach,
          point: vec(ahead, (-gripHeight(spot.prop) * stage.head) / placement.head),
          grab: startOf(m) + (reach ? REACH_FRAMES : 0),
        },
      ];
    });
    const momentAt = (f: number): ActorMoment => {
      const m = stretchAt(f);
      const pick = pickups.find((p) => p.moment === m);
      if (!pick || f >= pick.grab) return m;
      // Still reaching: the hand is not on it yet.
      const reaching = { ...m };
      delete reaching.holds;
      return pick.from.holds ? { ...reaching, holds: pick.from.holds } : reaching;
    };
    const taken = (f: number): number[] =>
      pickups
        .filter((p) => f >= p.grab && momentAt(f).holds === p.moment.holds)
        .map((p) => p.index);
    const now = momentAt(frame);
    // How the shot before left them, if the cut keeps them on screen.
    const before = previous?.shot.actors.find((a) => a.character === actor.character);
    const was = before ? actorMoments(before).at(-1) : undefined;

    // The body with no life in it. Held poses wind up, snap and settle from one to the next;
    // once an action is involved, each move starts where the last one left the body.
    const bare = (f: number): ResolvedPose => {
      if (!moving) {
        const keys: PoseKey[] = [];
        const first = moments[0] as ActorMoment;
        if (was && !was.action && was.pose !== first.pose) {
          keys.push({ frame: ts.startFrame - 1, pose: poseOrStand(was.pose) });
          keys.push({
            frame: ts.startFrame,
            pose: poseOrStand(first.pose),
            transition: POSE_FRAMES,
            windup: 0,
          });
        } else {
          keys.push({ frame: ts.startFrame - 1, pose: poseOrStand(first.pose) });
        }
        for (const m of moments.slice(1)) {
          const pick = pickups.find((p) => p.moment === m);
          if (pick?.reach) {
            const reaching = reachingFor(poseOrStand(pick.from.pose), pick.point);
            keys.push({ frame: startOf(m), pose: reaching });
          }
          keys.push({ frame: pick?.grab ?? startOf(m), pose: poseOrStand(m.pose) });
        }
        return posedAt(f, keys);
      }
      const links = moments.map((m) => ({
        from: (m.at * duration) / fps,
        at: (seconds: number) => basePose(m, seconds),
      }));
      return chainAt(Math.max(0, f - ts.startFrame) / fps, links, STEP_BLEND);
    };
    const poseAt = (f: number): ResolvedPose =>
      momentAt(f).action ? bare(f) : withLife(bare(f), f, fps, seed);

    // An action carries the body along. With a travelling camera the body stays where it is
    // and the place slides by. Without one, they are on their spot while they hold a pose
    // (so they walk in and stop there, or stand there and walk off); someone who moves for
    // the whole shot passes through their spot in the middle of it.
    const held = moments.find((m) => !m.action);
    const settle = held && held.at > 0 ? Math.round(STEP_BLEND * fps) : 0;
    const onSpot = held ? startOf(held) + settle : ts.startFrame + Math.round(duration / 2);
    const carried = moving ? bare(frame).rootX : 0;
    const anchor = moving ? bare(onSpot).rootX : 0;
    const whereAt = (f: number) => {
      const still = bare(f);
      const gone = moving && !follows ? still.rootX - anchor : 0;
      return {
        placement: { ...placement, x: placement.x + gone * placement.head * sign },
        // For looking and framing, the travel is already in where they stand.
        pose: moving ? movePose(still, -still.rootX) : still,
      };
    };
    return {
      actor,
      now,
      momentAt,
      taken,
      outOfReach: pickups
        .filter((p) => p.point.x <= 0 || leanToReach(poseOrStand(p.from.pose), p.point) === null)
        .map((p) => p.moment.holds ?? ''),
      whereAt,
      sits: moments.some((m) => m.pose === 'sit'),
      ...whereAt(frame),
      poseAt,
      moving,
      faces: [
        ...(was ? [{ frame: previous?.startFrame ?? 0, expression: was.expression }] : []),
        ...moments.map((m) => ({ frame: startOf(m), expression: m.expression })),
      ],
      travel: follows && moving ? carried * placement.head * sign : 0,
    };
  });

  // The shot as it is at a frame: who looks where, holds what and stands how.
  const sceneAt = (f: number) => ({
    shot: {
      ...shot,
      // A thing picked up is no longer standing in the scene.
      props: shot.props.filter((_, i) => !drawn.some((d) => d.taken(f).includes(i))),
      actors: drawn.map((d) => {
        const moment = d.momentAt(f);
        const acting = { ...d.actor, lookAt: moment.lookAt };
        delete acting.holds;
        return moment.holds ? { ...acting, holds: moment.holds } : acting;
      }),
    },
    placements: new Map(drawn.map((d) => [d.actor.character, d.whereAt(f)])),
    // Whoever holds a pose: a wide shot keeps the whole of them in the picture.
    held: new Set(drawn.filter((d) => !d.momentAt(f).action).map((d) => d.actor.character)),
  });
  const { shot: shotNow, placements } = sceneAt(frame);
  // How much closer the camera's own move ends (as ShotPicture applies it), so a wide shot
  // still holds whole figures when a push-in has finished.
  const strength = shot.camera.strength;
  const closer =
    shot.camera.move === 'push-in'
      ? 1 + 0.32 * strength
      : shot.camera.move === 'punch-in'
        ? 1 + 0.7 * strength
        : 1;
  const aimAt = (f: number): Focus => {
    const scene = sceneAt(Math.max(ts.startFrame + CUT_SETTLE, f));
    const aim = shotFocus(scene.shot, stage, scene.placements, scene.held);
    return aim.keep ? { ...aim, keep: { ...aim.keep, zoom: closer } } : aim;
  };
  const overShoulder = shot.camera.framing === 'over-shoulder';
  const near = overShoulder ? drawn.find((d) => d.actor.back) : undefined;
  const focus = trailing(aimAt, frame, Math.round(CAMERA_LAG * fps));
  const side: 'left' | 'right' = near && near.placement.x > focus.x ? 'right' : 'left';
  const cameraX = drawn.find((d) => d.travel !== 0)?.travel ?? 0;
  return {
    shot,
    scene,
    stage,
    local,
    t,
    duration,
    follows,
    line,
    words,
    drawn,
    shotNow,
    placements,
    near,
    focus,
    side,
    cameraX,
  };
}
