import { Audio } from '@remotion/media';
import type { VoiceTrack } from '@studio/shared';
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Background, backgroundSpec } from '../backgrounds/Background';
import { PushIn } from '../camera/Camera';
import { RestingSweat } from '../effects/Sweat';
import { EXPRESSIONS, faceAt } from '../face/expressions';
import type { FaceParams } from '../face/types';
import { talkAt } from '../face/talk';
import { Captions } from '../overlays/Captions';
import { buildPages, toCaptions } from '../overlays/captionPages';
import { Scepter } from '../props/Scepter';
import { Character, toLocal } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { blinkAt, withLife } from '../rig/life';
import { poseAt, resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { holdObject, point, stand } from '../rig/poses';
import type { Facing } from '../rig/types';
import { walkAt } from '../rig/walk';
import { RULER } from '../wardrobe/costumes/ruler';
import { shotTimesFor } from './shotPlan';

/**
 * "The King Who Taxed the Moon": a hand-built short folktale, 5 shots (runs/2026-10-04-moon-tax).
 *   n1  the proud king under his moon          (atmospheric, push-in)
 *   n2  a tired villager walks in the moonlight (walk, camera follows)
 *   n3  Mira points at the moon and speaks d1   (two characters, the king is caught out)
 *   n4  close-up, the king looks up and sweats  (atmospheric, push-in)
 *   n5  Mira walks home, the moon stays with her
 * Shot lengths come from the voice timings; each cut lands just before its line.
 */

export type MoonTaxProps = { track: VoiceTrack; audioSrc: string | null; shotLines: string[] };

const W = 1080;
const H = 1920;
const SEED = 7316;
/** Head center above the ground line, in head units, for a standing figure. */
const FACE_UP = 2.96;

export const MOON_TAX_SHOTS = ['n1', 'n2', 'n3', 'n4', 'n5'];
const LINE_IDS = ['n1', 'n2', 'n3', 'd1', 'n4', 'n5'];

export const MOON_TAX_PLACEHOLDER: VoiceTrack = {
  version: 1,
  audioFile: 'none',
  sampleRate: 24000,
  durationMs: 24000,
  timingSource: 'estimated',
  loudnessLufs: -16,
  lines: LINE_IDS.map((id, i) => ({
    id,
    speaker: id === 'd1' ? 'mira' : 'narrator',
    voice: 'am_michael',
    text: '',
    startMs: 300 + i * 3900,
    endMs: 300 + i * 3900 + 3000,
  })),
  words: LINE_IDS.map((id, i) => ({
    text: 'placeholder',
    startMs: 300 + i * 3900,
    endMs: 300 + i * 3900 + 3000,
    lineId: id,
    emphasis: false,
  })),
};

export const calculateMoonTaxMetadata: CalculateMetadataFunction<MoonTaxProps> = ({ props }) => ({
  durationInFrames: Math.max(30, Math.ceil((props.track.durationMs / 1000) * 30)),
});

type ShotProps = {
  frame: number;
  durationInFrames: number;
  startFrame: number;
  fps: number;
  track: VoiceTrack;
};

const scepterProp: CharacterProps['prop'] = (hands, info) =>
  hands.front.hand.shape === 'grip' ? (
    <Scepter frame={hands.front} uid={info.uid} shadowSide={info.shadowSide} sway={info.sway} />
  ) : null;

/** The crown sits low on the brow, so the king's faces keep their brows under it (playbook, L-0002). */
const KING_SMUG: FaceParams = {
  ...EXPRESSIONS.smug,
  browLeft: { ...EXPRESSIONS.smug.browLeft, raise: -0.035 },
  browRight: { ...EXPRESSIONS.smug.browRight, raise: -0.01 },
};
/** Afraid, but looking up at the moon: the face does not tip down. */
const KING_WORRIED: FaceParams = {
  ...EXPRESSIONS.afraid,
  frame: { tilt: 0, scale: 1, dx: 0, dy: 0.04 },
  browLeft: { ...EXPRESSIONS.afraid.browLeft, raise: 0 },
  browRight: { ...EXPRESSIONS.afraid.browRight, raise: 0 },
};

/** The same crescent in every shot, so the moon is a character of its own. */
const MOON = { x: 0.24, y: 0.12, r: 0.055 };

/** s1: the king, pleased with himself, under a stormy sky and his moon. A slow push-in. */
function ShotProudKing({ frame, durationInFrames, fps }: ShotProps) {
  return (
    <PushIn
      frame={frame}
      durationInFrames={durationInFrames}
      strength={0.08}
      focus={{ x: 540, y: 760 }}
    >
      <Background
        spec={backgroundSpec('atmospheric', 'storm-slate', SEED, { moon: MOON })}
        width={W}
        height={H}
        frame={frame}
        fps={fps}
      />
      <Character
        x={510}
        groundY={1850}
        head={370}
        pose={withLife(resolvePose(holdObject), frame, fps, SEED)}
        face={KING_SMUG}
        turn={0.5}
        blink={blinkAt(frame, fps, SEED)}
        outfit={RULER}
        prop={scepterProp}
      />
    </PushIn>
  );
}

/** s2: a villager trudges through the moonlit town; the camera follows. */
function ShotVillager({ frame, fps }: ShotProps) {
  const head = 200;
  const spec = backgroundSpec('simple', 'dusk-violet', SEED + 1, {
    horizon: 0.7,
    moon: MOON,
    silhouettes: [
      { kind: 'buildings', x: 0.6, size: 0.15, layer: 'mid' },
      { kind: 'buildings', x: 1.35, size: 0.12, layer: 'mid' },
    ],
  });
  const w = walkAt(frame / fps);
  const cameraX = w.pose.rootX * head;
  return (
    <>
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} cameraX={cameraX} />
      <Character
        x={470 - cameraX}
        groundY={spec.horizon * H}
        head={head}
        pose={w.pose}
        face={EXPRESSIONS.sad}
        turn={1}
        blink={blinkAt(frame, fps, SEED + 1)}
        headEffects={<RestingSweat side={-1} />}
      />
    </>
  );
}

/** Mira points up at the moon. The upper arm goes out first, so the arm never crosses her face. */
const POINT_UP: Pose = {
  ...point,
  id: 'point-up',
  torsoLean: 0,
  arms: {
    front: { upper: 108, lower: 46, hand: 'point', thumb: -1 },
    back: { upper: -10, lower: -8 },
  },
};

/** s3: Mira stands before the king, then points at the moon as she speaks. He is caught out. */
function ShotMira({ frame, startFrame, fps, track }: ShotProps) {
  const spec = backgroundSpec('simple', 'dusk-violet', SEED + 2, {
    horizon: 0.72,
    moon: { x: 0.5, y: 0.14, r: 0.055 },
    silhouettes: [{ kind: 'bush', x: 1.02, size: 0.16, layer: 'near' }],
  });
  const groundY = spec.horizon * H;
  const mira = { x: 280, groundY, head: 185, facing: 'right' as Facing };
  const king = { x: 835, groundY, head: 250, facing: 'left' as Facing };
  const faceOf = (c: typeof mira) => ({ x: c.x, y: c.groundY - FACE_UP * c.head });
  const moon = { x: spec.moon ? spec.moon.x * W : W / 2, y: spec.moon ? spec.moon.y * H : 0 };

  const words = track.words.filter((w) => w.lineId === 'd1');
  const local = (ms: number) => Math.round((ms / 1000) * fps) - startFrame;
  const speakAt = local(words[0]?.startMs ?? 0);
  const twist = words.find((w) => /follow/i.test(w.text)) ?? words[Math.floor(words.length / 2)];
  const twistAt = local(twist?.startMs ?? 0);
  const talk = talkAt(frame + startFrame, fps, words);

  const miraPose = poseAt(frame, [
    { frame: 0, pose: stand },
    { frame: speakAt, pose: POINT_UP },
  ]);
  const miraFace = faceAt(frame, [
    { frame: 0, expression: 'determined' },
    { frame: speakAt, expression: 'happy' },
  ]);
  const kingFace = faceAt(frame, [
    { frame: 0, expression: 'angry' },
    { frame: twistAt, expression: 'surprised' },
  ]);
  // The king glares at Mira, then his eyes go up to the moon.
  const up = interpolate(frame, [twistAt + 8, twistAt + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const from = faceOf(mira);
  const kingLook = { x: from.x + (moon.x - from.x) * up, y: from.y + (moon.y - from.y) * up };

  return (
    <>
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} />
      <Character
        {...mira}
        pose={withLife(miraPose, frame, fps, SEED + 3)}
        face={miraFace}
        turn={0.5}
        blink={blinkAt(frame, fps, SEED + 3)}
        talk={talk}
        lookAt={toLocal(faceOf(king), mira)}
      />
      <Character
        {...king}
        pose={withLife(resolvePose(holdObject), frame, fps, SEED + 4)}
        face={kingFace}
        turn={0.5}
        blink={blinkAt(frame, fps, SEED + 4)}
        lookAt={toLocal(kingLook, king)}
        outfit={RULER}
        prop={scepterProp}
      />
    </>
  );
}

/** s4: close-up. The king looks up at the moon and knows he has lost. */
function ShotLookUp({ frame, durationInFrames, fps }: ShotProps) {
  const head = 470;
  const king = { x: 790, groundY: 720 + FACE_UP * head, head, facing: 'left' as Facing };
  const spec = backgroundSpec('atmospheric', 'storm-slate', SEED + 5, {
    moon: { x: 0.2, y: 0.1, r: 0.06 },
  });
  const face = faceAt(frame, [
    { frame: 0, expression: 'surprised' },
    { frame: Math.round(durationInFrames * 0.45), expression: KING_WORRIED },
  ]);
  return (
    <PushIn
      frame={frame}
      durationInFrames={durationInFrames}
      strength={0.06}
      focus={{ x: 770, y: 720 }}
    >
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} />
      <Character
        {...king}
        pose={withLife(resolvePose(holdObject), frame, fps, SEED + 4)}
        face={face}
        turn={0.5}
        blink={blinkAt(frame, fps, SEED + 5)}
        lookAt={toLocal({ x: 0.2 * W, y: 0.1 * H }, king)}
        outfit={RULER}
        prop={scepterProp}
        headEffects={<RestingSweat side={-1} />}
      />
    </PushIn>
  );
}

/** s5: Mira walks home happy. The trees slide past; the moon stays right where it is. */
function ShotWalkHome({ frame, fps }: ShotProps) {
  const head = 185;
  const spec = backgroundSpec('simple', 'dusk-violet', SEED + 6, {
    horizon: 0.7,
    moon: { x: 0.68, y: 0.13, r: 0.06 },
    silhouettes: [
      { kind: 'tree', x: 0.75, size: 0.2, layer: 'mid' },
      { kind: 'bush', x: 1.2, size: 0.07, layer: 'near' },
      { kind: 'tree', x: 1.45, size: 0.17, layer: 'mid' },
      { kind: 'buildings', x: 1.9, size: 0.13, layer: 'mid' },
    ],
  });
  const w = walkAt(frame / fps);
  const cameraX = w.pose.rootX * head;
  return (
    <>
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} cameraX={cameraX} />
      <Character
        x={440 - cameraX}
        groundY={spec.horizon * H}
        head={head}
        pose={w.pose}
        face={EXPRESSIONS.happy}
        turn={1}
        blink={blinkAt(frame, fps, SEED + 7)}
      />
    </>
  );
}

const SHOTS: Record<string, (p: ShotProps) => React.ReactNode> = {
  n1: ShotProudKing,
  n2: ShotVillager,
  n3: ShotMira,
  n4: ShotLookUp,
  n5: ShotWalkHome,
};

export const MoonTax = ({ track, audioSrc, shotLines }: MoonTaxProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const times = shotTimesFor(track, shotLines);
  const shot = times.find((s) => ms >= s.startMs && ms < s.endMs) ?? times[times.length - 1];
  const pages = buildPages(toCaptions(track.words));
  const Shot = shot ? SHOTS[shot.id] : undefined;
  if (!shot || !Shot) return null;
  const startFrame = Math.round((shot.startMs / 1000) * fps);
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Shot
          frame={frame - startFrame}
          durationInFrames={Math.round(((shot.endMs - shot.startMs) / 1000) * fps)}
          startFrame={startFrame}
          fps={fps}
          track={track}
        />
      </svg>
      <Captions pages={pages} />
      {audioSrc && <Audio src={staticFile(audioSrc)} />}
    </AbsoluteFill>
  );
};
