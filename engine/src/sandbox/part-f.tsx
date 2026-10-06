import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { ACTIONS } from '../rig/actions';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { FALL, JUMP, PUNCH, RECOIL, SWING } from '../rig/moves';
import type { ResolvedPose } from '../rig/types';
import { GAITS } from '../rig/walk';
import { boulderProp, clubProp, crateProp, ropeProp } from './fixtures';
import { Label } from './Sandbox';
import type { Colors } from './Sandbox';

/**
 * Phase 2D sandbox sheets: every action move as a strip of moments, left to right, so a wrong
 * pose, a sliding foot or a body sunk in the ground shows at once.
 */

const W = 1080;

type Strip = {
  label: string;
  at: (time: number) => ResolvedPose;
  times: readonly number[];
  face?: ExpressionName;
  turn?: number;
  /** Keep the figure in the middle of its cell: for moves that travel a long way. */
  follow?: boolean;
  /** Shift the figure inside its cell, px. */
  dx?: number;
  prop?: CharacterProps['prop'];
};

/** Evenly spaced moments from 0 to the end of a move. */
const spread = (end: number, count = 6): number[] =>
  Array.from({ length: count }, (_, i) => (end * i) / (count - 1));

const cycle = (period: number): number[] => Array.from({ length: 6 }, (_, i) => (period * i) / 6);

const STRIPS_A: Strip[] = [
  {
    label: 'run',
    at: ACTIONS.run,
    times: cycle(GAITS.run.period),
    face: 'determined',
    follow: true,
  },
  { label: 'jump', at: ACTIONS.jump, times: spread(JUMP.end), face: 'determined', dx: -50 },
  { label: 'fall (trip)', at: ACTIONS.fall, times: spread(FALL.end), face: 'surprised', dx: -62 },
  {
    label: 'fall back (knocked down)',
    at: ACTIONS['fall-back'],
    times: spread(FALL.end),
    face: 'surprised',
    dx: 58,
  },
  {
    label: 'carry',
    at: ACTIONS.carry,
    times: cycle(GAITS.carry.period),
    face: 'exhausted',
    follow: true,
    dx: -16,
    prop: crateProp,
  },
  {
    label: 'push',
    at: ACTIONS.push,
    times: cycle(GAITS.push.period),
    face: 'determined',
    follow: true,
    dx: -46,
    prop: boulderProp,
  },
];

const STRIPS_B: Strip[] = [
  {
    label: 'pull (stepping backward)',
    at: ACTIONS.pull,
    times: cycle(GAITS.pull.period),
    face: 'determined',
    follow: true,
    dx: -20,
    prop: ropeProp,
  },
  { label: 'punch', at: ACTIONS.punch, times: spread(PUNCH.end), face: 'angry', dx: -30 },
  {
    label: 'swing',
    at: ACTIONS.swing,
    times: spread(SWING.end),
    face: 'angry',
    dx: -30,
    prop: clubProp,
  },
  {
    label: 'recoil (hit from the right)',
    at: ACTIONS.recoil,
    times: spread(RECOIL.end),
    face: 'afraid',
    dx: 40,
  },
  {
    label: 'punch, key moments',
    at: ACTIONS.punch,
    times: [0, PUNCH.windup, PUNCH.hit, PUNCH.hold, 0.5, PUNCH.end],
    face: 'angry',
    turn: 0.5,
    dx: -30,
  },
  {
    label: 'swing, key moments',
    at: ACTIONS.swing,
    times: [0, SWING.windup, SWING.hit, SWING.hold, 0.62, SWING.end],
    face: 'angry',
    turn: 0.5,
    dx: -30,
    prop: clubProp,
  },
];

function Strips({ strips, c }: { strips: Strip[]; c: Colors }) {
  const rowH = 318;
  const head = 62;
  return (
    <>
      {strips.map((s, r) => {
        const cw = W / s.times.length;
        const groundY = rowH * r + rowH - 24;
        return (
          <g key={s.label}>
            <rect x={6} y={groundY} width={W - 12} height={18} fill={c.ground} />
            {s.times.map((time, i) => {
              const pose = s.at(time);
              const x = cw * (i + 0.5) + (s.dx ?? 0) - (s.follow ? pose.rootX * head : 0);
              return (
                <Character
                  key={i}
                  x={x}
                  groundY={groundY}
                  head={head}
                  pose={pose}
                  face={EXPRESSIONS[s.face ?? 'neutral']}
                  turn={s.turn ?? 1}
                  {...(s.prop ? { prop: s.prop } : {})}
                />
              );
            })}
            <Label x={W / 2} y={rowH * r + 34} c={c}>
              {s.label}
            </Label>
          </g>
        );
      })}
    </>
  );
}

export const MovesASheet = ({ c }: { c: Colors }) => <Strips strips={STRIPS_A} c={c} />;
export const MovesBSheet = ({ c }: { c: Colors }) => <Strips strips={STRIPS_B} c={c} />;
