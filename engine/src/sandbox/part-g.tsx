import type { ReactNode } from 'react';
import { AngerMark } from '../effects/AngerMark';
import { DizzyStars } from '../effects/Dizzy';
import { IMPACT_SECONDS, Impact } from '../effects/Impact';
import { MotionLines } from '../effects/MotionLines';
import { HeadSymbol } from '../effects/Symbol';
import { TearDrops, TearStreams } from '../effects/Tears';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Character, toScreen } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { PUNCH, punchAt, recoilAt } from '../rig/moves';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import type { Facing } from '../rig/types';
import { GAITS, walkAt } from '../rig/walk';
import { Label } from './Sandbox';
import type { Colors } from './Sandbox';

/** Phase 2D sandbox sheet: every effect, on the faces and moves it goes with. */

const W = 1080;
const standing = resolvePose(stand);
const standHead = computeSkeleton(standing).head;

type Cell = {
  label: string;
  face: ExpressionName;
  turn: number;
  facing?: Facing;
  effects: ReactNode;
  extra?: Partial<CharacterProps>;
};

const CELLS: Cell[] = [
  {
    label: 'tear streams, front',
    face: 'wailing',
    turn: 0,
    effects: <TearStreams turn={0} t={0.2} />,
  },
  {
    label: 'tear streams, 3/4',
    face: 'wailing',
    turn: 0.5,
    effects: <TearStreams turn={0.5} t={0.45} />,
  },
  {
    label: 'tear streams, profile',
    face: 'wailing',
    turn: 1,
    effects: <TearStreams turn={1} t={0.3} />,
  },
  { label: 'tear drops, front', face: 'sad', turn: 0, effects: <TearDrops turn={0} t={0.75} /> },
  { label: 'tear drops, 3/4', face: 'sad', turn: 0.5, effects: <TearDrops turn={0.5} t={1.1} /> },
  { label: 'anger mark', face: 'angry', turn: 0.5, effects: <AngerMark t={0.1} /> },
  { label: '!', face: 'surprised', turn: 0.5, effects: <HeadSymbol kind="!" /> },
  {
    label: '? (facing left)',
    face: 'thinking',
    turn: 0.5,
    facing: 'left',
    effects: <HeadSymbol kind="?" />,
  },
  { label: '...', face: 'neutral', turn: 0, effects: <HeadSymbol kind="..." /> },
  { label: 'dizzy stars', face: 'exhausted', turn: 0, effects: <DizzyStars t={0.2} /> },
  {
    label: 'dizzy stars, with hair',
    face: 'exhausted',
    turn: 0.5,
    effects: <DizzyStars t={0.55} />,
    extra: { identity: { skinTone: 6, hair: 'afro', hairColor: 'black' } },
  },
  {
    label: 'anger mark, stern',
    face: 'angry',
    turn: 0.5,
    facing: 'left',
    effects: <AngerMark t={0.3} />,
    extra: { eyeStyle: 'stern' },
  },
];

export function EffectsSheet({ c }: { c: Colors }) {
  const cols = 3;
  const cw = W / cols;
  const ch = 372;
  const head = 150;
  // The bottom row: effects that belong to the scene, not to one head.
  const rowY = ch * 4;
  const groundY = rowY + 400;
  const small = 92;
  const runner = walkAt(0.27, GAITS.run).pose;
  const runnerAt = { x: cw * 0.5 + 40, groundY, head: small };
  const back = toScreen(computeSkeleton(runner).neck, {
    ...runnerAt,
    x: runnerAt.x - runner.rootX * small,
  });
  const puncher = punchAt(PUNCH.hit);
  const puncherAt = { x: cw * 1.9, groundY, head: small };
  const fist = toScreen(computeSkeleton(puncher).arms.front.hand, puncherAt);
  const victimAt = { x: cw * 1.9 + 2.25 * small, groundY, head: small, facing: 'left' as const };
  return (
    <>
      {CELLS.map((cell, i) => {
        const left = cw * (i % cols);
        const top = ch * Math.floor(i / cols);
        const sign = cell.facing === 'left' ? -1 : 1;
        const id = `fx-cell-${i}`;
        return (
          <g key={cell.label}>
            <defs>
              <clipPath id={id}>
                <rect x={left + 4} y={top + 50} width={cw - 8} height={ch - 54} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id})`}>
              <Character
                x={left + cw / 2 - standHead.x * head * sign}
                groundY={top + ch * 0.74 - standHead.y * head}
                head={head}
                pose={standing}
                face={EXPRESSIONS[cell.face]}
                turn={cell.turn}
                facing={cell.facing ?? 'right'}
                headEffects={cell.effects}
                {...cell.extra}
              />
            </g>
            <Label x={left + cw / 2} y={top + 36} c={c}>
              {cell.label}
            </Label>
          </g>
        );
      })}

      <rect x={6} y={groundY} width={W - 12} height={20} fill={c.ground} />
      <Label x={cw * 0.5} y={rowY + 36} c={c}>
        motion lines
      </Label>
      <MotionLines x={back.x - 30} y={back.y + 20} head={small} direction={0} />
      <Character
        x={runnerAt.x - runner.rootX * small}
        groundY={groundY}
        head={small}
        pose={runner}
        face={EXPRESSIONS.determined}
        turn={1}
      />
      <Label x={cw * 1.2} y={rowY + 36} c={c}>
        impact
      </Label>
      <Impact x={cw * 1.2} y={rowY + 150} head={small} t={IMPACT_SECONDS * 0.4} seed={3} />
      <Label x={cw * 2.25} y={rowY + 36} c={c}>
        a hit: lines, flash, recoil
      </Label>
      <Character {...puncherAt} pose={puncher} face={EXPRESSIONS.angry} turn={1} />
      <Character
        {...victimAt}
        pose={recoilAt(0.07)}
        face={EXPRESSIONS.afraid}
        turn={1}
        squash={0.08}
      />
      <MotionLines
        x={fist.x - 12}
        y={fist.y}
        head={small}
        direction={0}
        length={0.7}
        spread={0.3}
      />
      <Impact x={fist.x + 30} y={fist.y - 6} head={small} t={IMPACT_SECONDS * 0.4} seed={7} />
    </>
  );
}
