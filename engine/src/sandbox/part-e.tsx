import { useCurrentFrame, useVideoConfig } from 'remotion';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { MOUTH_FORMS } from '../face/talk';
import type { MouthShape } from '../face/talk';
import { Scepter } from '../props/Scepter';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { swayOf } from '../rig/follow';
import { blinkAt, gazeAt, withLife } from '../rig/life';
import { blendPoses, mixPoses, moveFrames, resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { holdObject, stand } from '../rig/poses';
import type { ResolvedPose } from '../rig/types';
import { WALKS, walkAt } from '../rig/walk';
import type { WalkMood } from '../rig/walk';
import { FARMER } from '../wardrobe/costumes/farmer';
import { RULER } from '../wardrobe/costumes/ruler';
import { outfitFrom } from '../wardrobe/garments';
import type { Identity } from '../wardrobe/types';
import { Bust, Label } from './Sandbox';
import type { Colors } from './Sandbox';

/**
 * Phase 2C motion polish, in motion: a walk, a stop and a raised arm, so the follow-through of
 * the cape, the hair and the scepter can be judged. The camera rides with each character and
 * the ground marks slide past.
 */

const W = 1080;
const STOP = 75;
const RAISE = 118;
const SETTLE = 8;

const scepterProp: CharacterProps['prop'] = (hands, info) =>
  hands.front.hand.shape === 'grip' ? (
    <Scepter frame={hands.front} uid={info.uid} shadowSide={info.shadowSide} sway={info.sway} />
  ) : null;

/** The scepter thrust up and forward. */
const RAISED: Pose = {
  ...holdObject,
  id: 'raise',
  torsoLean: -3,
  arms: {
    front: { upper: 128, lower: 14, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: { upper: -12, lower: 8 },
  },
};

/** Walk, stop, then (for the one who holds something) raise it. One function of the frame. */
function act(frame: number, fps: number, holds: boolean): ResolvedPose {
  const carry = (f: number): ResolvedPose => {
    const w = walkAt(f / fps).pose;
    if (!holds) return w;
    const h = resolvePose(holdObject);
    return {
      ...w,
      arms: { front: h.arms.front, back: w.arms.back },
      hands: { front: h.hands.front, back: w.hands.back },
    };
  };
  if (frame < STOP) return carry(frame);
  const last = carry(STOP);
  const rest = resolvePose(holds ? holdObject : stand, last.rootX + 0.2);
  if (frame < STOP + SETTLE) return blendPoses(last, rest, (frame - STOP) / SETTLE);
  if (!holds || frame < RAISE) return rest;
  const up = resolvePose(RAISED, rest.rootX);
  const { windup, transition } = moveFrames(rest, up);
  const f = frame - RAISE;
  if (f >= windup + transition) return up;
  if (f < windup) return mixPoses(rest, up, -0.12 * Math.sin(((f / windup) * Math.PI) / 2), 0);
  return blendPoses(rest, up, (f - windup) / transition);
}

const LONG_HAIR: Identity = { skinTone: 2, hair: 'long', hairColor: 'auburn' };
const DRESS = outfitFrom({
  onePiece: { kind: 'dress', cloth: 'forest' },
  shoes: { kind: 'sneakers', cloth: 'white' },
  cloak: { cloth: 'crimson' },
});

function Runner({
  groundY,
  holds,
  seed,
  c,
  extra,
}: {
  groundY: number;
  holds: boolean;
  seed: number;
  c: Colors;
  extra: Partial<CharacterProps>;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = 150;
  const moving = (f: number) => act(f, fps, holds);
  const pose = moving(frame);
  const still = frame >= STOP + SETTLE;
  const camera = pose.rootX * head;
  // Marks one head apart on the ground, sliding past as the character walks.
  const first = Math.floor((camera - 400) / head);
  return (
    <>
      <rect x={0} y={groundY} width={W} height={70} fill={c.ground} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect
          key={i}
          x={(first + i) * head - camera + 400}
          y={groundY + 26}
          width={26}
          height={10}
          fill={c.base}
        />
      ))}
      <Character
        x={400 - camera}
        groundY={groundY}
        head={head}
        pose={still ? withLife(pose, frame, fps, seed) : pose}
        face={EXPRESSIONS.determined}
        turn={1}
        blink={blinkAt(frame, fps, seed)}
        gaze={gazeAt(frame, fps, seed)}
        sway={swayOf(moving, frame, fps)}
        {...extra}
      />
    </>
  );
}

export const POLISH_SECONDS = 6;

export function PolishVideo({ c }: { c: Colors }) {
  return (
    <>
      <Runner groundY={840} holds seed={31} c={c} extra={{ outfit: RULER, prop: scepterProp }} />
      <Runner
        groundY={1720}
        holds={false}
        seed={47}
        c={c}
        extra={{ outfit: DRESS, identity: LONG_HAIR }}
      />
    </>
  );
}

/** The four mood walks side by side, each on its own strip of ground. */
const MOODS: Array<{
  mood: WalkMood;
  label: string;
  face: ExpressionName;
  extra: Partial<CharacterProps>;
  size?: number;
}> = [
  { mood: 'proud', label: 'proud', face: 'smug', extra: { outfit: RULER } },
  { mood: 'tired', label: 'tired', face: 'exhausted', extra: { outfit: FARMER } },
  {
    mood: 'sneaky',
    label: 'sneaky',
    face: 'determined',
    extra: {
      outfit: outfitFrom({
        top: { kind: 'shirt', cloth: 'steel' },
        bottom: { kind: 'trousers', cloth: 'steel' },
        shoes: { kind: 'boots', cloth: 'steel' },
        cloak: { cloth: 'forest', hood: true },
      }),
    },
  },
  {
    mood: 'happy',
    label: 'happy',
    face: 'happy',
    size: 0.86,
    extra: {
      age: 'child',
      identity: { skinTone: 3, hair: 'ponytail', hairColor: 'dark-brown' },
      outfit: outfitFrom({
        onePiece: { kind: 'dress', cloth: 'orange' },
        shoes: { kind: 'sneakers', cloth: 'white' },
      }),
    },
  },
];

export function MoodsVideo({ c }: { c: Colors }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cw = W / 2;
  const ch = 960;
  const adult = 150;
  return (
    <>
      {MOODS.map((m, i) => {
        const left = cw * (i % 2);
        const top = ch * Math.floor(i / 2);
        const groundY = top + ch - 110;
        const head = adult * (m.size ?? 1);
        const moving = (f: number) => walkAt(f / fps, WALKS[m.mood]).pose;
        const pose = moving(frame);
        const camera = pose.rootX * head;
        const mark = 150;
        const first = Math.floor((camera - 300) / mark);
        return (
          <g key={m.mood}>
            <svg x={left} y={top} width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`}>
              <rect x={8} y={groundY - top} width={cw - 16} height={70} fill={c.ground} />
              {Array.from({ length: 6 }, (_, k) => (
                <rect
                  key={k}
                  x={(first + k) * mark - camera + 250}
                  y={groundY - top + 28}
                  width={26}
                  height={10}
                  fill={c.base}
                />
              ))}
              <Character
                x={250 - camera}
                groundY={groundY - top}
                head={head}
                pose={pose}
                face={EXPRESSIONS[m.face]}
                turn={1}
                blink={blinkAt(frame, fps, 60 + i)}
                sway={swayOf(moving, frame, fps)}
                {...m.extra}
              />
            </svg>
            <Label x={left + cw / 2} y={top + 60} c={c}>
              {m.label}
            </Label>
          </g>
        );
      })}
    </>
  );
}

/** The five talking mouth shapes, on a calm face in three views and on three other faces. */
const MOUTH_ROWS: Array<{ label: string; expression: ExpressionName; turn: number }> = [
  { label: 'front', expression: 'neutral', turn: 0 },
  { label: 'three-quarter', expression: 'neutral', turn: 0.5 },
  { label: 'profile', expression: 'neutral', turn: 1 },
  { label: 'happy', expression: 'happy', turn: 0.5 },
  { label: 'sad', expression: 'sad', turn: 0.5 },
  { label: 'angry', expression: 'angry', turn: 0.5 },
];

export function MouthsSheet({ c }: { c: Colors }) {
  const shapes = Object.keys(MOUTH_FORMS) as MouthShape[];
  const cw = W / shapes.length;
  const ch = 290;
  const top = 130;
  return (
    <>
      {shapes.map((shape, i) => (
        <Label key={shape} x={cw * (i + 0.5)} y={70} c={c}>
          {shape}
        </Label>
      ))}
      {MOUTH_ROWS.map((row, r) =>
        shapes.map((shape, i) => (
          <Bust
            key={`${row.label}-${shape}`}
            id={`mouth-${r}-${i}`}
            cx={cw * (i + 0.5)}
            cy={top + ch * (r + 0.5)}
            w={cw - 10}
            h={ch - 20}
            head={178}
            expression={row.expression}
            turn={row.turn}
            extra={{ talk: MOUTH_FORMS[shape] }}
          />
        )),
      )}
    </>
  );
}

/**
 * The face at every step of a head turn from three-quarter to profile, on six expressions.
 * No step may show a doubled eye: a scene can hold a head at any of these turns.
 */
const TURN_STEPS = [0.5, 0.625, 0.75, 0.875, 1] as const;
const TURN_FACES: ExpressionName[] = ['neutral', 'angry', 'shouting', 'afraid', 'sad', 'happy'];

export function TurnStepsSheet({ c }: { c: Colors }) {
  const cw = W / TURN_STEPS.length;
  const ch = 290;
  const top = 130;
  return (
    <>
      {TURN_STEPS.map((turn, i) => (
        <Label key={turn} x={cw * (i + 0.5)} y={70} c={c}>
          {`turn ${turn}`}
        </Label>
      ))}
      {TURN_FACES.map((expression, r) =>
        TURN_STEPS.map((turn, i) => (
          <Bust
            key={`${expression}-${turn}`}
            id={`turn-step-${r}-${i}`}
            cx={cw * (i + 0.5)}
            cy={top + ch * (r + 0.5)}
            w={cw - 10}
            h={ch - 20}
            head={178}
            expression={expression}
            turn={turn}
          />
        )),
      )}
    </>
  );
}
