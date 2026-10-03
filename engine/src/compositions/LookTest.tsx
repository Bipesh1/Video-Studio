import { Audio } from '@remotion/media';
import type { VoiceTrack } from '@studio/shared';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Background, backgroundSpec } from '../backgrounds/Background';
import { PushIn } from '../camera/Camera';
import { FlyingSweat, RestingSweat } from '../effects/Sweat';
import { EXPRESSIONS } from '../face/expressions';
import type { FaceParams } from '../face/types';
import { MOUTH_OPENNESS, mouthShapeAt } from '../face/talk';
import { Captions } from '../overlays/Captions';
import { buildPages, toCaptions } from '../overlays/captionPages';
import { Scepter } from '../props/Scepter';
import { Character, toLocal } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { blinkAt, withLife } from '../rig/life';
import { resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { handsUp, holdObject, point, stand } from '../rig/poses';
import type { Facing } from '../rig/types';
import { walkAt } from '../rig/walk';
import { RULER } from '../wardrobe/costumes/ruler';
import { SHOT_LINES, shotTimes } from './lookTestPlan';

/**
 * Phase 1 look test: 4 shots, about 15 seconds, original characters (Part 2, section 18).
 *   s1  atmospheric dramatic shot with a costumed ruler          (line n1, narrator)
 *   s2  simple night shot with two tier 0 characters; Tom speaks (line d1, Tom's voice)
 *   s3  close-up with a strong emotion and an effect             (line n2, narrator)
 *   s4  walking shot                                             (line n3, narrator)
 * Shot lengths come from the voice timings; each cut lands just before its line.
 */

export type LookTestProps = { track: VoiceTrack; audioSrc: string | null };

const W = 1080;
const H = 1920;
const SEED = 4182;
export const LOOK_TEST_PLACEHOLDER: VoiceTrack = {
  version: 1,
  audioFile: 'none',
  sampleRate: 24000,
  durationMs: 15000,
  timingSource: 'estimated',
  loudnessLufs: -16,
  lines: SHOT_LINES.map((id, i) => ({
    id,
    speaker: id === 'd1' ? 'tom' : 'narrator',
    voice: 'am_michael',
    text: '',
    startMs: 300 + i * 3600,
    endMs: 300 + i * 3600 + 2500,
  })),
  words: SHOT_LINES.map((id, i) => ({
    text: 'placeholder',
    startMs: 300 + i * 3600,
    endMs: 300 + i * 3600 + 2500,
    lineId: id,
    emphasis: false,
  })),
};

export const calculateLookTestMetadata: CalculateMetadataFunction<LookTestProps> = ({ props }) => ({
  durationInFrames: Math.max(30, Math.ceil((props.track.durationMs / 1000) * 30)),
});

type ShotProps = {
  frame: number;
  durationInFrames: number;
  globalFrame: number;
  fps: number;
  track: VoiceTrack;
};

const scepterProp: CharacterProps['prop'] = (hands, info) =>
  hands.front.hand.shape === 'grip' ? (
    <Scepter frame={hands.front} uid={info.uid} shadowSide={info.shadowSide} />
  ) : null;

/** s1: the ruler, stern, under a stormy sky with light rays. A slow push-in. */
function ShotRuler({ frame, durationInFrames, fps }: ShotProps) {
  return (
    <PushIn
      frame={frame}
      durationInFrames={durationInFrames}
      strength={0.08}
      focus={{ x: 540, y: 700 }}
    >
      <Background
        spec={backgroundSpec('atmospheric', 'storm-slate', SEED)}
        width={W}
        height={H}
        frame={frame}
        fps={fps}
      />
      <Character
        x={520}
        groundY={1830}
        head={380}
        pose={withLife(resolvePose(holdObject), frame, fps, SEED)}
        face={EXPRESSIONS.angry}
        turn={0.5}
        eyeStyle="stern"
        blink={blinkAt(frame, fps, SEED)}
        outfit={RULER}
        prop={scepterProp}
      />
    </PushIn>
  );
}

/** Tom's pleading face: afraid eyes and brows over a closed mouth that the voice opens. */
const PLEADING: FaceParams = { ...EXPRESSIONS.afraid, mouth: EXPRESSIONS.sad.mouth };

/** s2: night, the guard points, Tom pleads with his hands up. Tom's mouth follows his line. */
function ShotCaught({ frame, globalFrame, fps, track }: ShotProps) {
  // Horizon a little higher so both faces sit in the upper third (Style 7).
  const spec = backgroundSpec('simple', 'dusk-violet', SEED, { horizon: 0.7 });
  const groundY = spec.horizon * H;
  const head = 235;
  const guard = { x: 270, groundY, head, facing: 'right' as Facing };
  const tom = { x: 810, groundY, head, facing: 'left' as Facing };
  const faceOf = (c: typeof guard) => ({ x: c.x, y: c.groundY - 2.96 * c.head });
  const tomWords = track.words.filter((w) => w.lineId === 'd1');
  const talk = MOUTH_OPENNESS[mouthShapeAt(globalFrame, fps, tomWords)];
  return (
    <>
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} />
      <Character
        {...guard}
        pose={withLife(resolvePose(point), frame, fps, SEED + 1)}
        face={EXPRESSIONS.smug}
        turn={0.5}
        blink={blinkAt(frame, fps, SEED + 1)}
        lookAt={toLocal(faceOf(tom), guard)}
      />
      <Character
        {...tom}
        pose={withLife(resolvePose(handsUp), frame, fps, SEED + 2)}
        face={PLEADING}
        turn={0.5}
        blink={blinkAt(frame, fps, SEED + 2)}
        talk={talk}
        lookAt={toLocal(faceOf(guard), tom)}
      />
    </>
  );
}

/** s3: close-up, Tom horrified, sweat drops flying. The head fills about 40% of the frame. */
/** Arms hanging straight, so in a close-up the hands fall below the frame. */
const ARMS_DOWN: Pose = {
  ...stand,
  id: 'arms-down',
  arms: { front: { upper: 14, lower: 0 }, back: { upper: -14, lower: 0 } },
};

function ShotCloseUp({ frame, durationInFrames, fps }: ShotProps) {
  const head = 740;
  return (
    <PushIn
      frame={frame}
      durationInFrames={durationInFrames}
      strength={0.06}
      focus={{ x: 540, y: 660 }}
    >
      <Background
        spec={backgroundSpec('simple', 'dusk-violet', SEED + 3)}
        width={W}
        height={H}
        frame={frame}
        fps={fps}
      />
      <Character
        x={540}
        groundY={660 + 2.96 * head}
        head={head}
        pose={withLife(resolvePose(ARMS_DOWN), frame, fps, SEED + 2)}
        face={EXPRESSIONS.horrified}
        turn={0.15}
        blink={blinkAt(frame, fps, SEED + 5)}
        headEffects={<FlyingSweat t={frame / fps} seed={SEED} />}
      />
    </PushIn>
  );
}

/** s4: Tom walks home in profile; the camera follows and the layers slide past at their depths. */
function ShotWalk({ frame, fps }: ShotProps) {
  const head = 200;
  const spec = backgroundSpec('simple', 'dusk-violet', SEED + 4, {
    horizon: 0.7,
    silhouettes: [
      { kind: 'buildings', x: 0.55, size: 0.14, layer: 'mid' },
      { kind: 'tree', x: 1.05, size: 0.2, layer: 'mid' },
      { kind: 'bush', x: 1.4, size: 0.15, layer: 'near' },
    ],
  });
  const w = walkAt(frame / fps);
  const cameraX = w.pose.rootX * head;
  return (
    <>
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} cameraX={cameraX} />
      <Character
        x={480 - cameraX}
        groundY={spec.horizon * H}
        head={head}
        pose={w.pose}
        face={EXPRESSIONS.exhausted}
        turn={1}
        blink={blinkAt(frame, fps, SEED + 6)}
        headEffects={<RestingSweat />}
      />
    </>
  );
}

const SHOTS = { n1: ShotRuler, d1: ShotCaught, n2: ShotCloseUp, n3: ShotWalk } as const;

export const LookTest = ({ track, audioSrc }: LookTestProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const times = shotTimes(track);
  const shot = times.find((s) => ms >= s.startMs && ms < s.endMs) ?? times[times.length - 1];
  const pages = buildPages(toCaptions(track.words));
  if (!shot) return null;
  const startFrame = Math.round((shot.startMs / 1000) * fps);
  const Shot = SHOTS[shot.id as keyof typeof SHOTS];
  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Shot
          frame={frame - startFrame}
          durationInFrames={Math.round(((shot.endMs - shot.startMs) / 1000) * fps)}
          globalFrame={frame}
          fps={fps}
          track={track}
        />
      </svg>
      <Captions pages={pages} />
      {audioSrc && <Audio src={staticFile(audioSrc)} />}
    </AbsoluteFill>
  );
};
