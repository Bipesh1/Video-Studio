import type { ReactNode } from 'react';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { cheerAt, cryAt } from '../rig/actions';
import { body } from '../rig/body';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { cower, crossArms, hug, kneel, lie, lookDown, lookUp, sit } from '../rig/poses';
import type { Facing, ResolvedPose } from '../rig/types';
import { RULER } from '../wardrobe/costumes/ruler';
import { SOLDIER } from '../wardrobe/costumes/soldier';
import { outfitFrom } from '../wardrobe/garments';
import { Label } from './Sandbox';
import type { Colors } from './Sandbox';

/** Phase 2C sandbox sheets: the new poses and everyday moves. */

const W = 1080;

type Figure = {
  pose: ResolvedPose;
  expression?: ExpressionName;
  turn?: number;
  facing?: Facing;
  dx?: number;
  extra?: Partial<CharacterProps>;
};

type Cell = { label: string; figures: Figure[]; seat?: boolean };

const EVERYDAY = outfitFrom({
  top: { kind: 'shirt', cloth: 'forest', sleeves: 'short' },
  bottom: { kind: 'trousers', cloth: 'denim' },
  shoes: { kind: 'boots', cloth: 'steel' },
});
const DRESS = outfitFrom({
  onePiece: { kind: 'dress', cloth: 'crimson' },
  shoes: { kind: 'sneakers', cloth: 'white' },
});

const one = (
  pose: ResolvedPose,
  expression: ExpressionName = 'neutral',
  turn = 0.5,
  extra: Partial<CharacterProps> = {},
): Figure[] => [{ pose, expression, turn, extra }];

const CELLS: Cell[] = [
  { label: 'sit', figures: one(resolvePose(sit)), seat: true },
  { label: 'kneel', figures: one(resolvePose(kneel), 'sad') },
  {
    label: 'lie',
    figures: [{ pose: resolvePose(lie), expression: 'exhausted', turn: 0, dx: -34 }],
  },
  { label: 'cross arms, front', figures: one(resolvePose(crossArms), 'determined', 0) },
  {
    label: 'cross arms, soldier',
    figures: one(resolvePose(crossArms), 'angry', 0.5, { outfit: SOLDIER }),
  },
  { label: 'look up', figures: one(resolvePose(lookUp), 'surprised') },
  { label: 'look down', figures: one(resolvePose(lookDown), 'sad') },
  { label: 'cower', figures: one(resolvePose(cower), 'afraid') },
  {
    label: 'hug',
    figures: [
      {
        pose: resolvePose(hug),
        expression: 'happy',
        turn: 0.5,
        dx: -56,
        extra: { outfit: EVERYDAY },
      },
      {
        pose: resolvePose(hug),
        expression: 'happy',
        turn: 0.5,
        facing: 'left',
        dx: 56,
        extra: { outfit: DRESS },
      },
    ],
  },
  { label: 'cry', figures: one(cryAt(0.1), 'wailing') },
  { label: 'cheer', figures: one(cheerAt(0.12), 'laughing', 0) },
  {
    label: 'king, sitting',
    figures: one(resolvePose(sit), 'smug', 0.5, { outfit: RULER }),
    seat: true,
  },
];

export function PosesBSheet({ c }: { c: Colors }) {
  const columns = 3;
  const cw = W / columns;
  const ch = 480;
  const head = 92;
  return (
    <>
      {CELLS.map((cell, i) => {
        const left = cw * (i % columns);
        const cx = left + cw / 2;
        const top = ch * Math.floor(i / columns);
        const groundY = top + ch - 62;
        const seat: ReactNode = cell.seat ? (
          <rect
            x={cx - 0.62 * head}
            y={groundY - body.shin * head + 6}
            width={0.74 * head}
            height={body.shin * head - 6}
            rx={6}
            fill={c.ground}
          />
        ) : null;
        return (
          <g key={cell.label}>
            <rect x={left + 8} y={groundY} width={cw - 16} height={46} fill={c.ground} />
            {seat}
            {cell.figures.map((f, k) => (
              <Character
                key={k}
                x={cx + (f.dx ?? 0) - f.pose.rootX * head}
                groundY={groundY}
                head={head}
                facing={f.facing ?? 'right'}
                pose={f.pose}
                face={EXPRESSIONS[f.expression ?? 'neutral']}
                turn={f.turn ?? 0.5}
                {...f.extra}
              />
            ))}
            <Label x={cx} y={top + 36} c={c}>
              {cell.label}
            </Label>
          </g>
        );
      })}
    </>
  );
}
