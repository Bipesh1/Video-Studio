import { NARRATOR } from '@studio/shared';
import type { CharacterCard, Storyboard, VoiceTrack } from '@studio/shared';
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
import { blinkAt, gazeAt } from '../rig/life';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import type { Cast } from '../wardrobe/cast';
import { lookTarget, stageX, turnOf } from './layout';
import type { Size, TimedShot } from './layout';
import { GRIPPED, SEATS, StandingProp, heldProp, standingProp } from './props';
import { seedFor, stageShot } from './staging';
import type { Drawn } from './staging';

/**
 * One shot of a storyboard as a picture: the place in its light, the people in their poses
 * with their faces, what they hold, the things around them, and the camera. No captions, no
 * sound and no fonts here, so a shot can be drawn and tested on its own.
 */

const face = (name: string) => EXPRESSIONS[name as ExpressionName] ?? EXPRESSIONS.neutral;

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
  const {
    shot,
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
  } = stageShot({ ts, shots, storyboard, cards, track, size, frame, fps });

  const person = (d: Drawn, index: number): ReactNode => {
    const { actor, placement, now } = d;
    const seed = seedFor(storyboard.seed, actor.character);
    const turn = turnOf(actor);
    const expression = faceAt(
      frame,
      d.faces.map((f) => ({ frame: f.frame, expression: face(f.expression) })),
    );
    const acting = shotNow.actors[index] ?? actor;
    const target = lookTarget(acting, shotNow, stage, placements);
    const speaking = line?.speaker === actor.character && line.speaker !== NARRATOR;
    const held = now.holds ? heldProp(now.holds) : undefined;
    let pose = d.poseAt(frame);
    // The travel is already in where they stand, so the pose itself stays over its own feet.
    if (d.moving) pose = movePose(pose, -pose.rootX);
    if (held && now.holds && GRIPPED.includes(now.holds) && pose.hands.front.shape !== 'grip') {
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
    const sitter = drawn.find((d) => d.sits && Math.abs((d.actor.x ?? 0.5) - x) < 0.04);
    if (!sitter) return null;
    const child = looks.get(sitter.actor.character)?.age === 'child';
    return {
      x: sitter.placement.x,
      head: sitter.placement.head * (child ? CHILD_BODY : 1),
      flip: sitter.actor.facing === 'left',
    };
  };

  const pickedUp = new Set(drawn.flatMap((d) => d.taken(frame)));
  const things = (behind: boolean): ReactNode =>
    shot.props
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => (standingProp(p.prop)?.behindPeople ?? false) === behind)
      .filter(({ i }) => !pickedUp.has(i))
      .map(({ p, i }) => {
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
            shotT={local / fps}
            flip={seat?.flip ?? false}
            up={p.y}
            size={p.size}
          />
        );
      });

  const horizonY = stage.background.horizon * size.height;
  const scenePicture = (
    <Framed shot={shot.camera.framing} focus={focus} side={side} {...size}>
      {stage.scale > 1.001 ? (
        // In a tall frame the scene is wider than the picture and laid out smaller. The place is
        // drawn into it smaller by as much, about its own horizon, so a wide shot shows it at
        // the size it was drawn to be, and it reaches past its canvas wherever the camera can.
        <g
          transform={`translate(${(size.width / 2) * (1 - 1 / stage.scale)} ${horizonY * (1 - 1 / stage.scale)}) scale(${1 / stage.scale})`}
        >
          <Background
            spec={stage.background}
            {...size}
            frame={frame}
            fps={fps}
            cameraX={cameraX * stage.scale}
            endless={follows}
            world={{
              left: ((stage.scale - 1) * size.width) / 2,
              right: ((stage.scale - 1) * size.width) / 2,
              top: horizonY * (stage.scale - 1),
              bottom: (size.height - horizonY) * (stage.scale - 1),
            }}
          />
        </g>
      ) : (
        <Background
          spec={stage.background}
          {...size}
          frame={frame}
          fps={fps}
          cameraX={cameraX}
          endless={follows}
        />
      )}
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
