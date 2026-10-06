import type { ReactNode } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { EXPRESSIONS, EXPRESSION_NAMES, faceAt } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { HEAD_TURNS } from '../face/layout';
import { talkAt } from '../face/talk';
import type { WordTiming } from '../face/talk';
import type { EyeStyle } from '../face/types';
import { body } from '../rig/body';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { Hand, handTransform } from '../rig/Hand';
import type { HandStyle } from '../rig/Hand';
import { blinkAt, gazeAt, withLife } from '../rig/life';
import { add, fromDown, mul, smoothstep, vec } from '../rig/math';
import { poseAt, resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { PHASE1_POSES, handsUp, holdObject, point, shrug, stand, wave } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import type { Facing, HandShape } from '../rig/types';
import { walkAt } from '../rig/walk';
import { ink, lineWeights, palette, pick, tokens, white } from '../tokens';
import { Rod } from './Rod';
import { BG_SHEETS, CostumeSheet, AtmosVideo, HairTurnsSheet, IdentitySheet } from './part-b';
import { AgesSheet, ClothesSheet, CostumesBSheet, PeopleSheet, VillagersSheet } from './part-c';
import { PosesBSheet } from './part-d';
import { MoodsVideo, MouthsSheet, PolishVideo, TurnStepsSheet } from './part-e';
import { MovesASheet, MovesBSheet, ShoesSheet } from './part-f';
import { EffectsSheet } from './part-g';
import { ActionVideo } from './part-h';
import { PropsInUseSheet, PropsSheet } from './part-i';
import type { SandboxBg, SheetName } from './sheets';

export type SandboxProps = { sheet: SheetName; bg: SandboxBg };

export type Colors = { base: string; ground: string; label: string };

/** Sandbox backgrounds are flat palette fields with no outlines (Style 5.1). */
const colorsFor = (bg: SandboxBg): Colors =>
  bg === 'dark'
    ? {
        base: pick(palette('storm-slate'), 1),
        ground: pick(palette('storm-slate'), 0),
        label: white,
      }
    : { base: pick(palette('cold-dawn'), 1), ground: pick(palette('cold-dawn'), 0), label: ink };

const W = 1080;
const H = 1920;
const SEED = 4182;

export const Label = ({
  x,
  y,
  c,
  children,
}: {
  x: number;
  y: number;
  c: Colors;
  children: ReactNode;
}) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    fontFamily="Arial, Helvetica, sans-serif"
    fontWeight={700}
    fontSize={30}
    fill={c.label}
  >
    {children}
  </text>
);

const standHead = computeSkeleton(resolvePose(stand)).head;

/** A head-and-shoulders crop of a standing character, centered in a cell. */
export function Bust({
  id,
  cx,
  cy,
  w,
  h,
  head,
  expression,
  turn = 0,
  facing = 'right',
  eyeStyle = 'round',
  lookAt,
  extra: more = {},
}: {
  extra?: Partial<CharacterProps>;
  id: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  head: number;
  expression: ExpressionName;
  turn?: number;
  facing?: Facing;
  eyeStyle?: EyeStyle;
  lookAt?: CharacterProps['lookAt'];
}) {
  const sign = facing === 'left' ? -1 : 1;
  const extra: Partial<CharacterProps> = lookAt ? { lookAt } : {};
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <Character
          x={cx - standHead.x * head * sign}
          groundY={cy - 30 - standHead.y * head}
          head={head}
          facing={facing}
          pose={resolvePose(stand)}
          face={EXPRESSIONS[expression]}
          turn={turn}
          eyeStyle={eyeStyle}
          {...extra}
          {...more}
        />
      </g>
    </g>
  );
}

function ExpressionsSheet({ c }: { c: Colors }) {
  const cols = 3;
  const cw = W / cols;
  const ch = 384;
  return (
    <>
      {EXPRESSION_NAMES.map((name, i) => {
        const cx = cw * (i % cols) + cw / 2;
        const top = ch * Math.floor(i / cols);
        return (
          <g key={name}>
            <Bust
              id={`x-${i}`}
              cx={cx}
              cy={top + 172}
              w={cw - 16}
              h={326}
              head={185}
              expression={name}
            />
            <Label x={cx} y={top + 366} c={c}>
              {name}
            </Label>
          </g>
        );
      })}
    </>
  );
}

function TurnsSheet({ c }: { c: Colors }) {
  const turns = Object.entries(HEAD_TURNS).map(
    ([n, t]) => [n === 'three-quarter' ? '3/4' : n, t] as const,
  );
  const rows: Array<{
    label: string;
    expression: ExpressionName;
    facing: Facing;
    eyeStyle?: EyeStyle;
    look?: boolean;
  }> = [
    { label: 'facing right', expression: 'neutral', facing: 'right' },
    { label: 'facing left', expression: 'happy', facing: 'left' },
    { label: 'stern eyes', expression: 'angry', facing: 'right', eyeStyle: 'stern' },
    { label: 'look up-left', expression: 'afraid', facing: 'right', look: true },
  ];
  const cw = W / 3;
  const ch = 480;
  return (
    <>
      {rows.map((row, r) =>
        turns.map(([turnName, turn], k) => {
          const cx = cw * k + cw / 2;
          const top = ch * r;
          const look = row.look ? { lookAt: vec(-3, -6) } : {};
          return (
            <g key={`${r}-${k}`}>
              <Bust
                id={`t-${r}-${k}`}
                cx={cx}
                cy={top + 215}
                w={cw - 16}
                h={410}
                head={230}
                expression={row.expression}
                turn={turn}
                facing={row.facing}
                eyeStyle={row.eyeStyle ?? 'round'}
                {...look}
              />
              <Label x={cx} y={top + 455} c={c}>
                {`${turnName}, ${row.label}`}
              </Label>
            </g>
          );
        }),
      )}
    </>
  );
}

const POSE_FACES: Record<string, { expression: ExpressionName; turn: number }> = {
  stand: { expression: 'neutral', turn: 0 },
  wave: { expression: 'happy', turn: 0 },
  point: { expression: 'determined', turn: 0.5 },
  shrug: { expression: 'thinking', turn: 0 },
  'hands-up': { expression: 'afraid', turn: 0 },
  'hold-object': { expression: 'smug', turn: 0.5 },
  'hands-over-mouth': { expression: 'horrified', turn: 0 },
};

const rodProp: CharacterProps['prop'] = (hands) =>
  hands.front.hand.shape === 'grip' ? <Rod frame={hands.front} /> : null;

function PosesSheet({ c }: { c: Colors }) {
  const cw = W / 2;
  const ch = 480;
  return (
    <>
      {PHASE1_POSES.map((pose: Pose, i) => {
        const cx = cw * (i % 2) + cw / 2;
        const top = ch * Math.floor(i / 2);
        const groundY = top + 440;
        const f = POSE_FACES[pose.id] ?? { expression: 'neutral' as const, turn: 0 };
        return (
          <g key={pose.id}>
            <rect
              x={cw * (i % 2) + 8}
              y={groundY}
              width={cw - 16}
              height={ch - 450}
              fill={c.ground}
            />
            <Character
              x={cx}
              groundY={groundY}
              head={90}
              pose={resolvePose(pose)}
              face={EXPRESSIONS[f.expression]}
              turn={f.turn}
              prop={rodProp}
            />
            <Label x={cx} y={top + 36} c={c}>
              {pose.id}
            </Label>
          </g>
        );
      })}
    </>
  );
}

function HandsSheet({ c }: { c: Colors }) {
  const shapes: Array<{ shape: HandShape; forearm: number; label: string }> = [
    { shape: 'mitten', forearm: 20, label: 'resting' },
    { shape: 'grip', forearm: 70, label: 'holding' },
    { shape: 'point', forearm: 90, label: 'pointing' },
  ];
  const styles: HandStyle[] = ['bare', 'glove'];
  const scale = 560;
  const cw = W / 3;
  return (
    <>
      {styles.map((style, r) =>
        shapes.map((s, k) => {
          const cx = cw * k + cw / 2;
          const cy = 420 + r * 700;
          const dir = fromDown(s.forearm);
          const center = vec(0, 0);
          const wrist = add(center, mul(dir, -body.handReach));
          const elbow = add(wrist, mul(dir, -0.22));
          const hand =
            s.shape === 'grip'
              ? { shape: s.shape, thumb: 1 as const, gripAxis: -90 }
              : { shape: s.shape, thumb: 1 as const };
          return (
            <g key={`${r}-${k}`}>
              <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
                <polyline
                  points={`${elbow.x},${elbow.y} ${wrist.x},${wrist.y}`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={lineWeights.limb}
                  strokeLinecap={tokens.line.cap}
                />
                {s.shape === 'grip' && (
                  <Rod frame={{ center, forearm: s.forearm, hand }} length={0.9} />
                )}
                <Hand
                  shape={s.shape}
                  style={style}
                  thumb={1}
                  transform={handTransform(center, s.forearm, hand)}
                />
              </g>
              <Label x={cx} y={cy + 300} c={c}>
                {`${style}, ${s.label}`}
              </Label>
            </g>
          );
        }),
      )}
    </>
  );
}

function WalkStripSheet({ c }: { c: Colors }) {
  const cols = 4;
  const cw = W / cols;
  const head = 82;
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const cx = cw * (i % cols) + cw / 2;
        const row = Math.floor(i / cols);
        const groundY = 620 + row * 760;
        const w = walkAt(i / 8);
        return (
          <g key={i}>
            <rect x={cw * (i % cols) + 6} y={groundY} width={cw - 12} height={90} fill={c.ground} />
            <Character
              x={cx - w.pose.rootX * head}
              groundY={groundY}
              head={head}
              pose={w.pose}
              face={EXPRESSIONS.determined}
              turn={1}
            />
            <Label x={cx} y={groundY + 150} c={c}>
              {`phase ${i}/8`}
            </Label>
          </g>
        );
      })}
    </>
  );
}

function WalkVideo({ c }: { c: Colors }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const groundY = 1350;
  const w = walkAt(frame / fps);
  return (
    <>
      <rect x={0} y={groundY} width={W} height={H - groundY} fill={c.ground} />
      <Character
        x={60}
        groundY={groundY}
        head={150}
        pose={w.pose}
        face={EXPRESSIONS.determined}
        turn={1}
        blink={blinkAt(frame, fps, SEED)}
      />
    </>
  );
}

const MOTION_POSES = [stand, wave, point, shrug, handsUp, holdObject, stand];
const MOTION_FACES: ExpressionName[] = [
  'neutral',
  'happy',
  'determined',
  'thinking',
  'afraid',
  'smug',
  'neutral',
];
const MOTION_TURNS = [0, 0, 0.5, 0, 0, 0.5, 0];
const MOTION_WORDS: WordTiming[] = [
  { startMs: 1100, endMs: 1450, text: 'Pay' },
  { startMs: 1550, endMs: 2050, text: 'me' },
  { startMs: 2150, endMs: 2500, text: 'for' },
  { startMs: 2600, endMs: 2950, text: 'moonlight' },
];

function MotionVideo({ c }: { c: Colors }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = 30;
  const poseKeys = MOTION_POSES.map((pose, i) => ({ frame: i * step, pose }));
  const faceKeys = MOTION_FACES.map((expression, i) => ({ frame: i * step, expression }));
  const k = Math.min(Math.floor(frame / step), MOTION_TURNS.length - 1);
  const prevTurn = MOTION_TURNS[k - 1] ?? MOTION_TURNS[0] ?? 0;
  const turnNow = MOTION_TURNS[k] ?? 0;
  const turn = prevTurn + (turnNow - prevTurn) * smoothstep((frame - k * step) / 4);
  const pose = withLife(poseAt(frame, poseKeys), frame, fps, SEED);
  const groundY = 1350;
  return (
    <>
      <rect x={0} y={groundY} width={W} height={H - groundY} fill={c.ground} />
      <Character
        x={540}
        groundY={groundY}
        head={190}
        pose={pose}
        face={faceAt(frame, faceKeys)}
        turn={turn}
        blink={blinkAt(frame, fps, SEED)}
        gaze={gazeAt(frame, fps, SEED)}
        talk={talkAt(frame, fps, MOTION_WORDS)}
        prop={rodProp}
      />
    </>
  );
}

/** One composition for drawing and checking assets (Part 2, section 5: src/sandbox). */
export const Sandbox = ({ sheet, bg }: SandboxProps) => {
  const c = colorsFor(bg);
  const content: Record<SheetName, ReactNode> = {
    expressions: <ExpressionsSheet c={c} />,
    turns: <TurnsSheet c={c} />,
    poses: <PosesSheet c={c} />,
    hands: <HandsSheet c={c} />,
    'walk-strip': <WalkStripSheet c={c} />,
    'bg-simple': <BG_SHEETS.Simple />,
    'bg-atmospheric': <BG_SHEETS.Atmospheric />,
    'bg-palettes': <BG_SHEETS.Palettes c={c} />,
    costume: <CostumeSheet c={c} />,
    identity: <IdentitySheet c={c} />,
    'hair-turns': <HairTurnsSheet c={c} />,
    atmos: <AtmosVideo />,
    'new-expressions': <BG_SHEETS.NewExpressions />,
    clothes: <ClothesSheet c={c} />,
    'costumes-b': <CostumesBSheet c={c} />,
    ages: <AgesSheet c={c} />,
    people: <PeopleSheet c={c} />,
    'poses-b': <PosesBSheet c={c} />,
    mouths: <MouthsSheet c={c} />,
    villagers: <VillagersSheet c={c} />,
    'moves-a': <MovesASheet c={c} />,
    'moves-b': <MovesBSheet c={c} />,
    effects: <EffectsSheet c={c} />,
    'turn-steps': <TurnStepsSheet c={c} />,
    shoes: <ShoesSheet c={c} />,
    props: <PropsSheet c={c} />,
    'props-in-use': <PropsInUseSheet c={c} />,
    walk: <WalkVideo c={c} />,
    motion: <MotionVideo c={c} />,
    polish: <PolishVideo c={c} />,
    moods: <MoodsVideo c={c} />,
    action: <ActionVideo />,
  };
  return (
    <AbsoluteFill style={{ backgroundColor: c.base }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {content[sheet]}
      </svg>
    </AbsoluteFill>
  );
};
