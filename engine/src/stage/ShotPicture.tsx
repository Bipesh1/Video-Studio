import { NARRATOR } from '@studio/shared';
import type { Actor, CharacterCard, Storyboard, VoiceTrack } from '@studio/shared';
import type { ReactNode } from 'react';
import { Background } from '../backgrounds/Background';
import { Pan, PunchIn, PushIn, Shake } from '../camera/Camera';
import { Framed, shoulderPlacement } from '../camera/Framing';
import { AngerMark } from '../effects/AngerMark';
import { DizzyStars } from '../effects/Dizzy';
import { FlyingSweat, RestingSweat } from '../effects/Sweat';
import { HeadSymbol } from '../effects/Symbol';
import { TearDrops, TearStreams } from '../effects/Tears';
import { EXPRESSIONS, faceAt } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { talkAt } from '../face/talk';
import { movePose } from '../rig/chain';
import { CHILD_BODY, Character, toLocal } from '../rig/Character';
import { swayOf } from '../rig/follow';
import { blinkAt, gazeAt, withLife } from '../rig/life';
import { clamp } from '../rig/math';
import { blendPoses, resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import { seeded } from '../rig/random';
import type { ResolvedPose } from '../rig/types';
import type { Cast } from '../wardrobe/cast';
import {
  basePose,
  castSize,
  lookTarget,
  placeActor,
  shotFocus,
  stageFor,
  stageX,
  turnOf,
} from './layout';
import type { Placement, Size, TimedShot } from './layout';
import { GRIPPED, SEATS, StandingProp, heldProp, standingProp } from './props';

/**
 * One shot of a storyboard as a picture: the place in its light, the people in their poses
 * with their faces, what they hold, the things around them, and the camera. No captions, no
 * sound and no fonts here, so a shot can be drawn and tested on its own.
 */

/** Frames a pose takes to change when a cut keeps someone on screen in a new pose. */
const POSE_FRAMES = 5;
const face = (name: string) => EXPRESSIONS[name as ExpressionName] ?? EXPRESSIONS.neutral;

/** A small steady number for each person, so their blinks and sway differ. */
const seedFor = (seed: number, id: string) => seed + Math.floor(seeded(`cast:${id}`) * 9973);

function headEffects(effects: readonly string[], t: number, turn: number, seed: number): ReactNode {
  if (effects.length === 0) return null;
  return (
    <>
      {effects.map((effect) => {
        switch (effect) {
          case 'sweat-flying':
            return <FlyingSweat key={effect} t={t} seed={seed} />;
          case 'sweat-resting':
            return <RestingSweat key={effect} />;
          case 'tear-streams':
            return <TearStreams key={effect} turn={turn} t={t} />;
          case 'tear-drops':
            return <TearDrops key={effect} turn={turn} t={t} />;
          case 'anger-mark':
            return <AngerMark key={effect} t={t} />;
          case 'dizzy-stars':
            return <DizzyStars key={effect} t={t} />;
          case 'symbol-exclaim':
            return <HeadSymbol key={effect} kind="!" t={t} />;
          case 'symbol-question':
            return <HeadSymbol key={effect} kind="?" t={t} />;
          case 'symbol-dots':
            return <HeadSymbol key={effect} kind="..." t={t} />;
          default:
            return null;
        }
      })}
    </>
  );
}

type Drawn = {
  actor: Actor;
  placement: Placement;
  /** The pose for looking and framing: where the body is, without the small moves of life. */
  pose: ResolvedPose;
  poseAt: (frame: number) => ResolvedPose;
  /** How far the action has carried them, px, when the camera travels along. */
  travel: number;
};

export function ShotPicture({
  ts,
  shots,
  storyboard,
  cards,
  looks,
  track,
  size,
  frame,
  fps,
}: {
  ts: TimedShot;
  shots: readonly TimedShot[];
  storyboard: Storyboard;
  cards: Record<string, CharacterCard>;
  looks: ReadonlyMap<string, Cast['look']>;
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
  const previous = before && before.scene.id === scene.id ? before : undefined;
  const follows = shot.camera.move === 'follow';
  const line = scene.lines.find((l) => l.id === shot.line);
  const words = track && line ? track.words.filter((w) => w.lineId === line.id) : [];

  const drawn: Drawn[] = shot.actors.map((actor) => {
    const member = storyboard.cast.find((m) => m.id === actor.character);
    const placement = placeActor(actor, stage, castSize(member, cards));
    const seed = seedFor(storyboard.seed, actor.character);
    const sign = actor.facing === 'left' ? -1 : 1;
    const was = previous?.shot.actors.find((a) => a.character === actor.character);
    const target = basePose(actor);
    const poseAt = (f: number): ResolvedPose => {
      const at = f - ts.startFrame;
      if (actor.action) return basePose(actor, Math.max(0, at) / fps);
      const settled = withLife(target, f, fps, seed);
      if (!was || was.action || was.pose === actor.pose || at >= POSE_FRAMES) return settled;
      return blendPoses(basePose(was), settled, clamp(at / POSE_FRAMES, 0, 1));
    };
    const now = poseAt(frame);
    // An action carries the body along. With a travelling camera the body stays where it is
    // and the place slides by; without one it passes through its spot in the middle of the shot.
    const middle = actor.action ? basePose(actor, duration / fps / 2).rootX : 0;
    const carried = actor.action ? now.rootX : 0;
    const x = placement.x + (follows ? 0 : carried - middle) * placement.head * sign;
    return {
      actor,
      placement: { ...placement, x },
      pose: actor.action ? now : target,
      poseAt,
      travel: follows && actor.action ? carried * placement.head * sign : 0,
    };
  });

  const placements = new Map(
    drawn.map((d) => [
      d.actor.character,
      // For looking and framing, an action's travel is already in the placement.
      { placement: d.placement, pose: d.actor.action ? movePose(d.pose, -d.pose.rootX) : d.pose },
    ]),
  );
  const overShoulder = shot.camera.framing === 'over-shoulder';
  const near = overShoulder ? drawn.find((d) => d.actor.back) : undefined;
  const focus = shotFocus(shot, stage, placements);
  const side: 'left' | 'right' = near && near.placement.x > focus.x ? 'right' : 'left';
  const cameraX = drawn.find((d) => d.travel !== 0)?.travel ?? 0;

  const person = (d: Drawn, index: number): ReactNode => {
    const { actor, placement } = d;
    const seed = seedFor(storyboard.seed, actor.character);
    const turn = turnOf(actor);
    const was = previous?.shot.actors.find((a) => a.character === actor.character);
    const expression = was
      ? faceAt(frame, [
          { frame: previous?.startFrame ?? 0, expression: face(was.expression) },
          { frame: ts.startFrame, expression: face(actor.expression) },
        ])
      : face(actor.expression);
    const target = lookTarget(actor, shot, stage, placements);
    const speaking = line?.speaker === actor.character && line.speaker !== NARRATOR;
    const held = actor.holds ? heldProp(actor.holds) : undefined;
    let pose = d.poseAt(frame);
    // The travel is already in where they stand, so the pose itself stays over its own feet.
    if (actor.action) pose = movePose(pose, -pose.rootX);
    if (held && actor.holds && GRIPPED.includes(actor.holds) && pose.hands.front.shape !== 'grip') {
      pose = { ...pose, hands: { ...pose.hands, front: { ...pose.hands.front, shape: 'grip' } } };
    }
    const look = looks.get(actor.character);
    const marks = shot.effects.filter((e) => e.on === actor.character).map((e) => e.effect);
    return (
      <Character
        key={`${actor.character}-${index}`}
        {...placement}
        pose={pose}
        face={expression}
        turn={turn}
        blink={blinkAt(frame, fps, seed)}
        gaze={gazeAt(frame, fps, seed)}
        sway={swayOf(d.poseAt, frame, fps)}
        {...(speaking ? { talk: talkAt(frame, fps, words) } : {})}
        {...(target ? { lookAt: toLocal(target, placement) } : {})}
        {...(look ?? {})}
        {...(held ? { prop: held } : {})}
        headEffects={headEffects(marks, t, turn, seed)}
        back={actor.back}
      />
    );
  };

  // A seat belongs to whoever sits on it: it stands exactly under them, faces the way they
  // face, and is the size of their body, so a child gets a child's chair (Biku, 2026-10-06:
  // "the daughter is not sitting properly on the chair").
  const sitterAt = (x: number) => {
    const sitter = drawn.find(
      (d) => d.actor.pose === 'sit' && Math.abs((d.actor.x ?? 0.5) - x) < 0.04,
    );
    if (!sitter) return null;
    const child = looks.get(sitter.actor.character)?.age === 'child';
    return {
      x: sitter.placement.x,
      head: sitter.placement.head * (child ? CHILD_BODY : 1),
      flip: sitter.actor.facing === 'left',
    };
  };

  const things = (behind: boolean): ReactNode =>
    shot.props
      .filter((p) => (standingProp(p.prop)?.behindPeople ?? false) === behind)
      .map((p, i) => {
        const seat = SEATS.includes(p.prop) ? sitterAt(p.x) : null;
        return (
          <StandingProp
            key={`${p.prop}-${i}-${behind ? 'b' : 'f'}`}
            id={p.prop}
            uid={`${shot.id}-${p.prop}-${i}`}
            x={(seat?.x ?? stageX(stage, p.x)) - cameraX}
            groundY={stage.groundY}
            head={seat?.head ?? stage.head}
            t={(frame - ts.sceneStartFrame) / fps}
            flip={seat?.flip ?? false}
          />
        );
      });

  const scenePicture = (
    <Framed shot={shot.camera.framing} focus={focus} side={side} {...size}>
      <Background
        spec={stage.background}
        {...size}
        frame={frame}
        fps={fps}
        cameraX={cameraX}
        endless={follows}
      />
      {things(true)}
      {drawn.filter((d) => d !== near).map(person)}
      {things(false)}
    </Framed>
  );

  // The point the camera closes in on: the face, where the framing put it.
  const eye = { x: size.width / 2, y: size.height * 0.36 };
  const strength = shot.camera.strength;
  const moved =
    shot.camera.move === 'push-in' ? (
      <PushIn frame={local} durationInFrames={duration} strength={0.32 * strength} focus={eye}>
        {scenePicture}
      </PushIn>
    ) : shot.camera.move === 'punch-in' ? (
      <PunchIn frame={local} at={2} strength={0.7 * strength} focus={eye}>
        {scenePicture}
      </PunchIn>
    ) : shot.camera.move === 'shake' ? (
      <Shake
        frame={local}
        fps={fps}
        at={0}
        {...size}
        strength={8 + 40 * strength}
        seed={storyboard.seed}
      >
        {scenePicture}
      </Shake>
    ) : shot.camera.move === 'pan' ? (
      <Pan frame={local} from={0} to={duration} dx={0.3 * strength * size.width}>
        {scenePicture}
      </Pan>
    ) : (
      scenePicture
    );

  const look = near ? looks.get(near.actor.character) : undefined;
  return (
    <>
      {moved}
      {near && (
        <Character
          {...shoulderPlacement(size, side)}
          pose={resolvePose(stand)}
          face={EXPRESSIONS.neutral}
          turn={0.5}
          {...(look ?? {})}
          back
        />
      )}
    </>
  );
}
