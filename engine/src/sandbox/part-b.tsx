import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Background, backgroundSpec } from '../backgrounds/Background';
import type { Treatment } from '../backgrounds/Background';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import type { EyeStyle } from '../face/types';
import { Scepter } from '../props/Scepter';
import { Character, toLocal } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { blinkAt, withLife } from '../rig/life';
import { resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { handsUp, holdObject, point, stand, wave } from '../rig/poses';
import type { Facing, ResolvedPose } from '../rig/types';
import { walkAt } from '../rig/walk';
import { RULER } from '../wardrobe/costumes/ruler';
import type { Identity } from '../wardrobe/types';
import { Bust, Label } from './Sandbox';
import type { Colors } from './Sandbox';

const W = 1080;
const H = 1920;
const SEED = 4182;

const scepterProp: CharacterProps['prop'] = (hands, info) =>
  hands.front.hand.shape === 'grip' ? (
    <Scepter frame={hands.front} uid={info.uid} shadowSide={info.shadowSide} />
  ) : null;

/** Simple treatment (Reference B): dusk violet night, two tier 0 characters facing each other. */
function SimpleScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spec = backgroundSpec('simple', 'dusk-violet', SEED);
  const groundY = spec.horizon * H;
  const head = 175;
  const left = { x: 330, groundY, head, facing: 'right' as Facing };
  const right = { x: 760, groundY, head, facing: 'left' as Facing };
  const faceOf = (c: typeof left) => ({ x: c.x, y: c.groundY - 2.96 * c.head });
  return (
    <>
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} />
      <Character
        {...left}
        pose={resolvePose(point)}
        face={EXPRESSIONS.smug}
        turn={0.5}
        lookAt={toLocal(faceOf(right), left)}
      />
      <Character
        {...right}
        pose={resolvePose(handsUp)}
        face={EXPRESSIONS.afraid}
        turn={0.5}
        lookAt={toLocal(faceOf(left), right)}
      />
    </>
  );
}

/** Atmospheric treatment (Reference A): storm slate sky, rays, clouds; the ruler in a medium shot. */
function AtmosphericScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spec = backgroundSpec('atmospheric', 'storm-slate', SEED);
  return (
    <>
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} />
      <Character
        x={520}
        groundY={1830}
        head={380}
        pose={resolvePose(holdObject)}
        face={EXPRESSIONS.angry}
        turn={0.5}
        eyeStyle="stern"
        outfit={RULER}
        prop={scepterProp}
      />
    </>
  );
}

const PALETTES = [
  'storm-slate',
  'dusk-violet',
  'clear-day',
  'warm-interior',
  'danger',
  'cold-dawn',
];

/** Every token palette in both treatments, as thumbnails. */
function PalettesSheet({ c }: { c: Colors }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cw = W / 2;
  const ch = H / 6;
  const treatments: Treatment[] = ['simple', 'atmospheric'];
  return (
    <>
      {PALETTES.map((name, r) =>
        treatments.map((tr, k) => (
          <g key={`${name}-${tr}`}>
            <svg
              x={k * cw + 6}
              y={r * ch + 6}
              width={cw - 12}
              height={ch - 12}
              viewBox="0 0 1080 640"
            >
              <Background
                spec={backgroundSpec(tr, name, SEED + r)}
                width={1080}
                height={640}
                frame={frame}
                fps={fps}
              />
            </svg>
            <Label x={k * cw + cw / 2} y={r * ch + 44} c={{ ...c, label: c.label }}>
              {`${name}, ${tr}`}
            </Label>
          </g>
        )),
      )}
    </>
  );
}

const COSTUME_CELLS: Array<{
  label: string;
  pose: ResolvedPose;
  expression: ExpressionName;
  turn: number;
  eyeStyle: EyeStyle;
}> = [
  {
    label: 'stand, stern',
    pose: resolvePose(stand),
    expression: 'neutral',
    turn: 0,
    eyeStyle: 'stern',
  },
  {
    label: 'scepter, 3/4',
    pose: resolvePose(holdObject),
    expression: 'angry',
    turn: 0.5,
    eyeStyle: 'stern',
  },
  {
    label: 'point, 3/4',
    pose: resolvePose(point),
    expression: 'determined',
    turn: 0.5,
    eyeStyle: 'stern',
  },
  {
    label: 'walk, profile',
    pose: walkAt(0.2).pose,
    expression: 'determined',
    turn: 1,
    eyeStyle: 'round',
  },
  {
    label: 'hands up, front',
    pose: resolvePose(handsUp),
    expression: 'afraid',
    turn: 0,
    eyeStyle: 'round',
  },
  {
    label: 'wave, front',
    pose: resolvePose(wave),
    expression: 'happy',
    turn: 0,
    eyeStyle: 'round',
  },
];

/** The costumed ruler in poses and turns. */
export function CostumeSheet({ c }: { c: Colors }) {
  const cw = W / 2;
  const ch = 640;
  return (
    <>
      {COSTUME_CELLS.map((cell, i) => {
        const cx = cw * (i % 2) + cw / 2;
        const top = ch * Math.floor(i / 2);
        const groundY = top + 575;
        return (
          <g key={cell.label}>
            <rect x={cw * (i % 2) + 8} y={groundY} width={cw - 16} height={55} fill={c.ground} />
            <Character
              x={cx - cell.pose.rootX * 100}
              groundY={groundY}
              head={100}
              pose={cell.pose}
              face={EXPRESSIONS[cell.expression]}
              turn={cell.turn}
              eyeStyle={cell.eyeStyle}
              outfit={RULER}
              prop={scepterProp}
            />
            <Label x={cx} y={top + 40} c={c}>
              {cell.label}
            </Label>
          </g>
        );
      })}
    </>
  );
}

const IDENTITY_CELLS: Array<{ id: Identity; expression: ExpressionName }> = [
  { id: { skinTone: 1, hair: 'straight-bob', hairColor: 'blond' }, expression: 'happy' },
  { id: { skinTone: 2, hair: 'ponytail', hairColor: 'auburn' }, expression: 'neutral' },
  {
    id: { skinTone: 3, hair: 'short-crop', hairColor: 'brown', facialHair: 'moustache' },
    expression: 'smug',
  },
  { id: { skinTone: 4, hair: 'bun', hairColor: 'dark-brown' }, expression: 'thinking' },
  {
    id: { skinTone: 5, hair: 'fade', hairColor: 'black', facialHair: 'beard' },
    expression: 'determined',
  },
  { id: { skinTone: 6, hair: 'locs', hairColor: 'black' }, expression: 'happy' },
  { id: { skinTone: 7, hair: 'afro', hairColor: 'black' }, expression: 'surprised' },
  { id: { skinTone: 8, hair: 'braids', hairColor: 'black' }, expression: 'neutral' },
  {
    id: { skinTone: 8, hair: 'head-wrap', hairColor: 'black', wrap: 'gold' },
    expression: 'laughing',
  },
  {
    id: { skinTone: 6, hair: 'short-crop', hairColor: 'gray', facialHair: 'beard' },
    expression: 'sad',
  },
  {
    id: { skinTone: 3, hair: 'bald', hairColor: 'white', facialHair: 'moustache' },
    expression: 'angry',
  },
  { id: { skinTone: 2, hair: 'afro', hairColor: 'brown' }, expression: 'afraid' },
];

/** Identity mode: all eight skin tones with hair, beards and moustaches (Style 3.4). */
export function IdentitySheet({ c }: { c: Colors }) {
  const cw = W / 3;
  const ch = 480;
  return (
    <>
      {IDENTITY_CELLS.map((cell, i) => {
        const cx = cw * (i % 3) + cw / 2;
        const top = ch * Math.floor(i / 3);
        return (
          <g key={i}>
            <Bust
              id={`id-${i}`}
              cx={cx}
              cy={top + 230}
              w={cw - 16}
              h={420}
              head={190}
              expression={cell.expression}
              extra={{ identity: cell.id }}
            />
            <Label x={cx} y={top + 462} c={c}>
              {`tone ${cell.id.skinTone}, ${cell.id.hair}`}
            </Label>
          </g>
        );
      })}
    </>
  );
}

const HAIR_ROWS: Identity[] = [
  { skinTone: 7, hair: 'afro', hairColor: 'black' },
  { skinTone: 2, hair: 'ponytail', hairColor: 'auburn' },
  { skinTone: 6, hair: 'head-wrap', hairColor: 'black', wrap: 'forest' },
  { skinTone: 5, hair: 'locs', hairColor: 'dark-brown', facialHair: 'beard' },
];

/** Hair at front, three-quarter and profile. */
export function HairTurnsSheet({ c }: { c: Colors }) {
  const cw = W / 3;
  const ch = 480;
  return (
    <>
      {HAIR_ROWS.map((id, r) =>
        [0, 0.5, 1].map((turn, k) => {
          const cx = cw * k + cw / 2;
          const top = ch * r;
          return (
            <g key={`${r}-${k}`}>
              <Bust
                id={`ht-${r}-${k}`}
                cx={cx}
                cy={top + 230}
                w={cw - 16}
                h={420}
                head={190}
                expression="neutral"
                turn={turn}
                extra={{ identity: id }}
              />
              <Label x={cx} y={top + 462} c={c}>
                {`${id.hair}, ${['front', '3/4', 'profile'][k]}`}
              </Label>
            </g>
          );
        }),
      )}
    </>
  );
}

/** Atmospheric background in motion: drifting clouds, pulsing rays, twinkling stars, a camera pan. */
export function AtmosVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spec = backgroundSpec('atmospheric', 'storm-slate', SEED);
  const cameraX = frame * 2;
  const pose: Pose = holdObject;
  return (
    <>
      <Background spec={spec} width={W} height={H} frame={frame} fps={fps} cameraX={cameraX} />
      <Character
        x={520 - cameraX}
        groundY={1830}
        head={380}
        pose={withLife(resolvePose(pose), frame, fps, SEED)}
        face={EXPRESSIONS.angry}
        turn={0.5}
        eyeStyle="stern"
        blink={blinkAt(frame, fps, SEED)}
        outfit={RULER}
        prop={scepterProp}
      />
    </>
  );
}

export const BG_SHEETS = {
  Simple: SimpleScene,
  Atmospheric: AtmosphericScene,
  Palettes: PalettesSheet,
};
