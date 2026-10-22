import { ExplainerGraphic, pagesFor } from '../explainer/Graphic';
import { FIRST_PIECE_BY, NARRATOR, graphicSteps, stepFrames } from '@studio/shared';
import type { CharacterCard, Storyboard, VoiceTrack } from '@studio/shared';
import type { ReactNode } from 'react';
import { Background } from '../backgrounds/Background';
import { Drift, Pan, PunchIn, PushIn, Shake, pullBackZoom } from '../camera/Camera';
import { Framed, shoulderPlacement, tiltOf, tiltScale } from '../camera/Framing';
import { AngerMark } from '../effects/AngerMark';
import { SceneTag } from '../overlays/Explain';
import { Placed } from '../props/Hold';
import { clamp, smoothstep } from '../rig/math';
import { CoinRain } from '../effects/CoinRain';
import { DollarEyes, ShockLines } from '../effects/Reaction';
import { DizzyStars } from '../effects/Dizzy';
import { FlyingSweat, RestingSweat } from '../effects/Sweat';
import { HeadSymbol } from '../effects/Symbol';
import { TearDrops, TearStreams } from '../effects/Tears';
import { EXPRESSIONS, faceAt, faceAtStrength } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { talkAt } from '../face/talk';
import { movePose } from '../rig/chain';
import { listeningBody, speakingBody } from '../rig/gesture';
import { STAND_HIP_HEIGHT } from '../rig/body';
import { ink } from '../tokens';
import { CHILD_BODY, Character, toLocal } from '../rig/Character';
import { swayOf } from '../rig/follow';
import { blinkAt, gazeAt } from '../rig/life';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import type { Cast } from '../wardrobe/cast';
import { lookTarget, stageX, turnOf } from './layout';
import type { Size, TimedShot } from './layout';
import {
  GRIPPED,
  SEATS,
  StandingProp,
  heldProp,
  propHeight,
  propReach,
  standingProp,
} from './props';
import { actingFrame, seedFor, stageShot } from './staging';
import { PosterLayers } from './Poster';
import type { Drawn } from './staging';

/**
 * One shot of a storyboard as a picture: the place in its light, the people in their poses
 * with their faces, what they hold, the things around them, and the camera. No captions, no
 * sound and no fonts here, so a shot can be drawn and tested on its own.
 */

/** A thing close to the camera: how much bigger, how far its foot drops below the ground line (in heads), how soft and how much of its light it keeps. */
const NEAR_SIZE = 1.8;
const NEAR_DROP = 1.1;
const NEAR_BLUR = 0.035;
const NEAR_LIGHT = 0.45;

/** How dark the shadow under someone is, at most. */
const SHADOW_OPACITY = 0.2;
/** Frames a face takes to change in a gentle video (a snappy one takes the usual). */
const GENTLE_FACE_FRAMES = 18;

/** Frames into a shot before a thing's tag pops up. */
const TAG_AFTER = 9;

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/** True for a thing of the sky, which hangs in the air unless a shot says where. */
const hangs = (prop: string): boolean => standingProp(prop)?.hangs !== undefined;

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
          case 'coin-rain':
            return <CoinRain key={effect} t={t} />;
          case 'dollar-eyes':
            return <DollarEyes key={effect} turn={turn} t={t} />;
          case 'shock-lines':
            return <ShockLines key={effect} t={t} />;
          default:
            return null;
        }
      })}
    </>
  );
}

// The frame each piece of a graphic arrives on is worked out in shared/, where the sound of
// each arrival is timed from the same rule.
export { FIRST_PIECE_BY, stepFrames };

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
  // An explainer graphic of What's the Catch?: drawn in place of the scene, each piece arriving on
  // the word that names it.
  if (shot.graphic) {
    return (
      <ExplainerGraphic
        graphic={shot.graphic}
        local={local}
        duration={duration}
        times={stepFrames(
          graphicSteps(shot.graphic),
          words,
          ts.startFrame,
          duration,
          fps,
          shot.graphic.kind !== 'journey',
        )}
        width={size.width}
        height={size.height}
        page={pagesFor(shots.map((s) => s.shot.graphic))[ts.index]}
        look={storyboard.explainerLook ?? 'flat'}
        spoken={words.map((w) => ({
          word: w.text.toLowerCase().replace(/[^a-z0-9]/g, ''),
          frame: Math.round((w.startMs / 1000) * fps) - ts.startFrame,
        }))}
        clock={ts.startFrame + local}
        fps={fps}
      />
    );
  }
  // A picture made for the moment: drawn in place of the scene, its camera moving from `from`
  // to `to` over the shot.
  if (shot.picture) {
    const from = shot.picture.from ?? { x: 0.5, y: 0.5, zoom: 1 };
    const to = shot.picture.to ?? from;
    const k = smoothstep(clamp(local / Math.max(1, duration), 0, 1));
    const zoom = from.zoom + (to.zoom - from.zoom) * k;
    const cx = (from.x + (to.x - from.x) * k) * size.width;
    const cy = (from.y + (to.y - from.y) * k) * size.height;
    // The point of the picture at (cx, cy) comes to the middle, and nothing beyond its edges shows.
    const half = { x: size.width / 2 / zoom, y: size.height / 2 / zoom };
    const px = clamp(cx, half.x, size.width - half.x);
    const py = clamp(cy, half.y, size.height - half.y);
    return (
      <g
        transform={`translate(${size.width / 2} ${size.height / 2}) scale(${zoom}) translate(${-px} ${-py})`}
      >
        <PosterLayers
          layers={shot.picture.layers}
          cast={storyboard.cast}
          cards={cards}
          seed={storyboard.seed}
          width={size.width}
          height={size.height}
          fps={fps}
        />
      </g>
    );
  }

  // People and things are drawn at the acting frame (every second frame when the video moves on
  // twos); the camera's own moves keep every frame.
  const act = actingFrame(storyboard, ts.startFrame, frame);
  const gentle = storyboard.finish?.acting === 'gentle';

  const person = (d: Drawn, index: number): ReactNode => {
    const { actor, placement, now } = d;
    const seed = seedFor(storyboard.seed, actor.character);
    const turn = turnOf(actor);
    const expression = faceAt(
      act,
      d.faces.map((f) => ({
        frame: f.frame,
        expression: faceAtStrength(face(f.expression), f.strength),
        id: `${f.expression}@${f.strength}`,
      })),
      // A gentle video changes a face more slowly too.
      gentle ? GENTLE_FACE_FRAMES : undefined,
    );
    const acting = shotNow.actors[index] ?? actor;
    const target = lookTarget(acting, shotNow, stage, placements);
    // A thought is heard in their voice while the mouth stays shut.
    const speaking =
      line?.speaker === actor.character && line.speaker !== NARRATOR && !line.thought;
    const held = now.holds ? heldProp(now.holds) : undefined;
    let pose = d.poseAt(act);
    // The travel is already in where they stand, so the pose itself stays over its own feet.
    if (d.moving) pose = movePose(pose, -pose.rootX);
    // Talking with the body: the one speaking beats on the words they lean on, and anyone
    // listening nods now and then on what lands. Not while an action carries them.
    else if (speaking) pose = speakingBody(pose, act, fps, words, seed);
    else if (line && line.speaker !== NARRATOR && !line.thought && words.length) {
      pose = listeningBody(pose, act, fps, words, seed);
    }
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
        blink={blinkAt(act, fps, seed)}
        gaze={gazeAt(act, fps, seed)}
        sway={swayOf(d.poseAt, act, fps)}
        {...(speaking ? { talk: talkAt(act, fps, words) } : {})}
        {...(target ? { lookAt: toLocal(target, placement) } : {})}
        {...(look ?? {})}
        {...(held ? { prop: (hands, info) => held(hands, { ...info, t: frame / fps }) } : {})}
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
      // The seat stays where they sit: it does not come along while they walk to it (Biku,
      // 2026-10-12: "the chair moves with the copycat").
      x: sitter.spot,
      head: sitter.placement.head * (child ? CHILD_BODY : 1),
      flip: sitter.actor.facing === 'left',
    };
  };

  /**
   * A soft shadow on the ground under someone, flatter and fainter the higher their hips are
   * off it, so a jump lifts away from its shadow.
   */
  const shadow = (d: Drawn, index: number): ReactNode => {
    const { placement } = d;
    const pose = d.poseAt(act);
    const lift = Math.max(0, -pose.hipY - STAND_HIP_HEIGHT) * placement.head;
    const fade = Math.max(0, 1 - lift / (2 * placement.head));
    if (fade <= 0) return null;
    return (
      <ellipse
        key={`shadow-${d.actor.character}-${index}`}
        cx={placement.x + pose.rootX * placement.head * (placement.facing === 'left' ? -1 : 1)}
        cy={placement.groundY}
        rx={placement.head * 0.62 * (0.7 + 0.3 * fade)}
        ry={placement.head * 0.1}
        fill={ink}
        opacity={SHADOW_OPACITY * fade}
      />
    );
  };

  const pickedUp = new Set(drawn.flatMap((d) => d.taken(act)));
  const before = shots[ts.index - 1];
  const taggedBefore = (p: { prop: string; tag?: string | undefined }): boolean =>
    before?.scene.id === ts.scene.id &&
    before.shot.props.some((q) => q.prop === p.prop && q.tag === p.tag);
  const nearId = `${shot.id}-near`;
  const things = (layer: 'behind' | 'front' | 'near'): ReactNode =>
    shot.props
      .map((p, i) => ({ p, i }))
      .filter(({ p }) =>
        layer === 'near'
          ? p.near === true
          : !p.near && (standingProp(p.prop)?.behindPeople ?? false) === (layer === 'behind'),
      )
      .filter(({ i }) => !pickedUp.has(i))
      .map(({ p, i }) => {
        const seat = SEATS.includes(p.prop) ? sitterAt(p.x) : null;
        // A thing that slides in: from where it starts to its place, over the shot's first third.
        const slid =
          p.from === undefined
            ? p.x
            : p.from +
              (p.x - p.from) *
                easeOutCubic(
                  clamp((local - (p.slideAt ?? 0) * duration) / (duration * 0.34), 0, 1),
                );
        const x = (seat?.x ?? stageX(stage, slid)) - cameraX;
        const head = seat?.head ?? stage.head;
        const near = layer === 'near';
        return (
          <g key={`${p.prop}-${i}-${layer}`} {...(near ? { filter: `url(#${nearId})` } : {})}>
            <StandingProp
              id={p.prop}
              uid={`${shot.id}-${p.prop}-${i}`}
              x={x}
              groundY={stage.groundY + (near ? NEAR_DROP * head : 0)}
              head={head}
              t={(act - ts.sceneStartFrame) / fps}
              shotT={local / fps}
              flip={seat?.flip ?? false}
              up={p.y}
              size={(p.size ?? 1) * (near ? NEAR_SIZE : 1)}
            />
            {p.tag && (
              <Placed
                x={x}
                // A thing on the ground or a table wears its tag on top; a thing of the sky has
                // it hanging under it.
                y={
                  stage.groundY -
                  (propHeight(p) +
                    (hangs(p.prop) ? -propReach(p).down * 0.92 : propReach(p).up * 0.92)) *
                    head
                }
                head={head}
              >
                <SceneTag
                  text={p.tag}
                  below={hangs(p.prop)}
                  // A tag that was already on this thing in the shot before does not pop in again.
                  {...(taggedBefore(p) ? {} : { frame: local - TAG_AFTER })}
                />
              </Placed>
            )}
          </g>
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
            frame={act}
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
          frame={act}
          fps={fps}
          cameraX={cameraX}
          endless={follows}
        />
      )}
      {things('behind')}
      {storyboard.finish?.shadows && drawn.filter((d) => d !== near).map(shadow)}
      {drawn.filter((d) => d !== near).map(person)}
      {things('front')}
      {shot.props.some((p) => p.near) && (
        <>
          <defs>
            {/* Close to the camera: out of focus and in shadow. */}
            <filter id={nearId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={NEAR_BLUR * stage.head} />
              <feColorMatrix
                type="matrix"
                values={`${NEAR_LIGHT} 0 0 0 0  0 ${NEAR_LIGHT} 0 0 0  0 0 ${NEAR_LIGHT} 0 0  0 0 0 1 0`}
              />
            </filter>
          </defs>
          {things('near')}
        </>
      )}
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
    ) : shot.camera.move === 'pull-back' ? (
      <g
        transform={`translate(${eye.x} ${eye.y}) scale(${pullBackZoom(local, duration, 0.32 * strength)}) translate(${-eye.x} ${-eye.y})`}
      >
        {scenePicture}
      </g>
    ) : shot.camera.move === 'drift' ? (
      <Drift frame={local} durationInFrames={duration} dx={0.08 * strength * size.width} {...size}>
        {scenePicture}
      </Drift>
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
    ) : shot.camera.move === 'tilt' ? (
      // A held frame tipped a few degrees, a little closer so its corners stay filled: the
      // moment something has gone wrong.
      <g
        transform={`translate(${size.width / 2} ${size.height / 2}) rotate(${-tiltOf(strength)}) scale(${tiltScale(tiltOf(strength), size)}) translate(${-size.width / 2} ${-size.height / 2})`}
      >
        {scenePicture}
      </g>
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
