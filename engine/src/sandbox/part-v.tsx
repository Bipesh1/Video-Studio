import { characterCardSchema, parseOrExplain } from '@studio/shared';
import type { ReactNode } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import cheatCard from '../../../characters/cheat.json';
import copycatCard from '../../../characters/copycat.json';
import saintCard from '../../../characters/saint.json';
import trainerCard from '../../../characters/trainer.json';
import { Blended } from '../explainer/Blend';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { VIEWER_FONT } from '../overlays/text';
import { Character } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { handsUp, openArms, point, shrug, stand, wave } from '../rig/poses';
import type { Pose } from '../rig/pose';
import { ink, tokens } from '../tokens';
import { castFromCard } from '../wardrobe/cast';

/**
 * The Dilemma Table remade the Kurzgesagt way: a look test (Biku, 2026-10-22, "start the look
 * test"). The cast are drawn from their cards, unchanged; only the world around them changes.
 *   world  a bright, warm world in flat colour with depth and glow, the cast blended into it,
 *          on the picture that opens "Monkeys Refuse Unfair Pay"
 *   arena  the channel's signature: dozens of the cast on a bright board, meeting in pairs,
 *          trading coins and scoring, the share of each kind running at the top
 * The third look of the test, the dark room as it is now, is a frame of an earlier video.
 */

const font = `${VIEWER_FONT}, Arial, sans-serif`;
const PALETTES = tokens.palettes as Record<string, readonly string[] | undefined>;
const ACCENTS = tokens.accents as Record<string, readonly string[] | undefined>;
/** A colour of the style's clear-day palette, and one of its accents. */
const day = (i: number): string => PALETTES['clear-day']?.[i] ?? ink;
const acc = (name: string, i = 0): string => ACCENTS[name]?.[i] ?? ink;
const card = (raw: unknown, name: string) =>
  castFromCard(parseOrExplain(characterCardSchema, raw, `characters/${name}.json`));
const CAST = {
  cheat: card(cheatCard, 'cheat'),
  saint: card(saintCard, 'saint'),
  copycat: card(copycatCard, 'copycat'),
  trainer: card(trainerCard, 'trainer'),
};
type Who = keyof typeof CAST;

const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function Person({
  who,
  x,
  ground,
  head,
  pose = stand,
  face,
  facing = 'right',
  turn = 0.3,
}: {
  who: Who;
  x: number;
  ground: number;
  head: number;
  pose?: Pose;
  face?: ExpressionName;
  facing?: 'left' | 'right';
  turn?: number;
}) {
  const c = CAST[who];
  return (
    <Character
      x={x}
      groundY={ground}
      head={head}
      facing={facing}
      pose={resolvePose(pose)}
      face={face ? EXPRESSIONS[face] : c.face}
      turn={turn}
      identity={c.look.identity}
      outfit={c.look.outfit}
      eyeStyle={c.look.eyeStyle}
      age={c.look.age}
    />
  );
}

function Words({ lines, gold, y, W }: { lines: string[]; gold: number; y: number; W: number }) {
  const u = W / 1080;
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={W / 2}
          y={y + i * 112 * u}
          fontFamily={font}
          fontWeight={800}
          fontSize={96 * u}
          fill={i === gold ? acc('gold') : tokens.fill.head}
          stroke={ink}
          strokeWidth={14 * u}
          paintOrder="stroke"
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

/** The bright world: a warm sky, glowing hills at three depths, the cast in it. */
export function DilemmaWorld({ W, H, t }: { W: number; H: number; t: number }) {
  const u = W / 1080;
  const hill = (y: number, amp: number, colour: string, key: string, phase: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 24; i++) {
      const x = (i / 24) * W;
      pts.push(
        `${x} ${y + amp * Math.sin(i * 0.7 + phase) + amp * 0.4 * Math.sin(i * 1.9 + phase)}`,
      );
    }
    return <path key={key} d={`M 0 ${H} L ${pts.join(' L ')} L ${W} ${H} Z`} fill={colour} />;
  };
  const ground = H * 0.8;
  return (
    <g>
      <defs>
        <linearGradient id="dw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={acc('ocean')} />
          <stop offset="0.55" stopColor={day(0)} />
          <stop offset="1" stopColor={acc('cream')} />
        </linearGradient>
        <radialGradient id="dw-sun">
          <stop offset="0" stopColor={acc('cream')} stopOpacity={1} />
          <stop offset="0.25" stopColor={acc('gold')} stopOpacity={0.9} />
          <stop offset="1" stopColor={acc('gold')} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="dw-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={day(2)} />
          <stop offset="1" stopColor={day(3)} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#dw-sky)" />
      {/* Soft rays from the sun, turning slowly. */}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + t * 0.05;
        const sx = W * 0.5;
        const sy = H * 0.42;
        return (
          <path
            key={`r${i}`}
            d={`M ${sx} ${sy} L ${sx + Math.cos(a - 0.08) * W * 1.2} ${sy + Math.sin(a - 0.08) * W * 1.2} L ${sx + Math.cos(a + 0.08) * W * 1.2} ${sy + Math.sin(a + 0.08) * W * 1.2} Z`}
            fill={acc('cream')}
            opacity={0.12}
          />
        );
      })}
      <circle cx={W * 0.5} cy={H * 0.42} r={460 * u} fill="url(#dw-sun)" />
      <circle cx={W * 0.5} cy={H * 0.42} r={110 * u} fill={acc('cream')} />
      {/* Clouds drifting. */}
      {[0, 1, 2].map((i) => {
        const cx = ((rnd(i, 1) * W + t * (12 + 8 * i) * u) % (W + 300 * u)) - 150 * u;
        const cy = H * (0.14 + 0.08 * i);
        return (
          <g key={i} opacity={0.85}>
            {[-1, 0, 1].map((k) => (
              <circle
                key={k}
                cx={cx + k * 70 * u}
                cy={cy - (k === 0 ? 25 : 0) * u}
                r={(k === 0 ? 70 : 52) * u}
                fill={tokens.fill.head}
              />
            ))}
          </g>
        );
      })}
      <g opacity={0.55}>{hill(H * 0.55, 30 * u, day(3), 'far', 0.3)}</g>
      {hill(H * 0.62, 40 * u, day(2), 'mid', 1.4)}
      {/* Trees on the near hill: round crowns with a lit side. */}
      {[0.1, 0.24, 0.86, 0.95].map((f, i) => {
        const x = W * f;
        const y = H * 0.66 + 20 * u * Math.sin(i);
        return (
          <g key={i}>
            <rect x={x - 9 * u} y={y} width={18 * u} height={70 * u} fill={acc('brown')} />
            <circle cx={x} cy={y - 10 * u} r={58 * u} fill={acc('forest', 1)} />
            <circle cx={x - 18 * u} cy={y - 26 * u} r={34 * u} fill={acc('forest')} />
          </g>
        );
      })}
      <path
        d={`M 0 ${ground - 40 * u} Q ${W / 2} ${ground - 90 * u} ${W} ${ground - 40 * u} L ${W} ${H} L 0 ${H} Z`}
        fill="url(#dw-ground)"
      />
      <path
        d={`M ${W * 0.38} ${H} Q ${W * 0.48} ${ground} ${W * 0.5} ${ground - 70 * u} Q ${W * 0.53} ${ground} ${W * 0.66} ${H} Z`}
        fill={acc('tan')}
        opacity={0.9}
      />
      {/* A market stall: the trade of the story. */}
      <rect
        x={W * 0.34}
        y={ground - 260 * u}
        width={W * 0.32}
        height={30 * u}
        fill={acc('crimson')}
      />
      {[0, 1, 2, 3, 4].map((k) => (
        <path
          key={k}
          d={`M ${W * 0.34 + k * W * 0.064} ${ground - 230 * u} q ${W * 0.032} ${40 * u} ${W * 0.064} 0`}
          fill={k % 2 ? tokens.fill.head : acc('crimson')}
        />
      ))}
      <rect
        x={W * 0.36}
        y={ground - 120 * u}
        width={W * 0.28}
        height={120 * u}
        fill={acc('brown')}
      />
      <rect x={W * 0.36} y={ground - 132 * u} width={W * 0.28} height={18 * u} fill={acc('tan')} />
      <line
        x1={W * 0.355}
        y1={ground - 230 * u}
        x2={W * 0.355}
        y2={ground}
        stroke={acc('brown', 1)}
        strokeWidth={10 * u}
      />
      <line
        x1={W * 0.645}
        y1={ground - 230 * u}
        x2={W * 0.645}
        y2={ground}
        stroke={acc('brown', 1)}
        strokeWidth={10 * u}
      />
      {/* A cucumber and a bunch of grapes on the stall. */}
      <ellipse
        cx={W * 0.44}
        cy={ground - 140 * u}
        rx={46 * u}
        ry={14 * u}
        fill={acc('forest')}
        stroke={ink}
        strokeWidth={4 * u}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <circle
          key={i}
          cx={W * 0.56 + ((i % 3) - 1) * 16 * u}
          cy={ground - 150 * u + Math.floor(i / 3) * 14 * u}
          r={10 * u}
          fill={acc('crimson')}
          stroke={ink}
          strokeWidth={3 * u}
        />
      ))}
      {/* The near grass, darker, with tufts: depth in front of everyone. */}
      <path
        d={`M 0 ${H * 0.9} Q ${W * 0.5} ${H * 0.86} ${W} ${H * 0.9} L ${W} ${H} L 0 ${H} Z`}
        fill={day(3)}
      />
      {Array.from({ length: 14 }, (_, i) => {
        const x = (i / 13) * W;
        const y = H * 0.9 + 10 * u * Math.sin(i * 1.7);
        return (
          <path
            key={`g${i}`}
            d={`M ${x - 14 * u} ${y + 20 * u} L ${x - 4 * u} ${y - 26 * u} L ${x + 2 * u} ${y + 8 * u} L ${x + 10 * u} ${y - 34 * u} L ${x + 16 * u} ${y + 20 * u} Z`}
            fill={acc('forest', 1)}
          />
        );
      })}
      <Blended id="dw-cast" u={u} light={acc('gold')} dx={-6} dy={4}>
        <Person
          who="saint"
          x={W * 0.2}
          ground={ground + 150 * u}
          head={175 * u}
          pose={handsUp}
          face="angry"
        />
        <Person
          who="cheat"
          x={W * 0.8}
          ground={ground + 150 * u}
          head={175 * u}
          pose={wave}
          face="smug"
          facing="left"
        />
        <Person
          who="trainer"
          x={W * 0.5}
          ground={ground - 10 * u}
          head={96 * u}
          pose={openArms}
          face="happy"
        />
      </Blended>
      <Words lines={['MONKEYS REFUSE', 'UNFAIR PAY']} gold={1} y={H * 0.11} W={W} />
    </g>
  );
}

/** The arena: dozens of the cast meeting in pairs on a bright board, trading and scoring. */
export function DilemmaArena({ W, H, t }: { W: number; H: number; t: number }) {
  const u = W / 1080;
  const kinds: Who[] = ['cheat', 'saint', 'copycat'];
  const cols = 3;
  const rows = 5;
  const cellW = W / cols;
  const top = H * 0.24;
  const cellH = (H * 0.72) / rows;
  const round = Math.floor(t / 2);
  const phase = (t % 2) / 2;
  const tiles: ReactNode[] = [];
  const people: ReactNode[] = [];
  const coins: ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const cx = (c + 0.5) * cellW;
      const cy = top + (r + 0.5) * cellH;
      tiles.push(
        <rect
          key={`t${i}`}
          x={cx - cellW * 0.46}
          y={cy - cellH * 0.44}
          width={cellW * 0.92}
          height={cellH * 0.88}
          rx={24 * u}
          fill={(r + c) % 2 ? acc('cream') : acc('cream', 1)}
          opacity={0.75}
        />,
      );
      // Each tile holds a pair; who meets whom changes every round.
      const a = kinds[Math.floor(rnd(i + round * 31, 1) * 3)] ?? 'cheat';
      const b = kinds[Math.floor(rnd(i + round * 31, 2) * 3)] ?? 'saint';
      const meet = Math.min(1, phase * 3);
      const gap = cellW * (0.3 - 0.12 * meet);
      const head = 52 * u;
      const ground = cy + cellH * 0.36;
      people.push(
        <Person
          key={`a${i}`}
          who={a}
          x={cx - gap}
          ground={ground}
          head={head}
          pose={a === 'cheat' ? point : stand}
          facing="right"
          face={a === 'cheat' ? 'smug' : 'happy'}
        />,
        <Person
          key={`b${i}`}
          who={b}
          x={cx + gap}
          ground={ground}
          head={head}
          pose={b === 'saint' ? openArms : shrug}
          facing="left"
          face={b === 'cheat' ? 'smug' : 'neutral'}
        />,
      );
      // The trade: a coin crossing the gap, then the score each takes.
      if (phase > 0.35) {
        const k = Math.min(1, (phase - 0.35) / 0.3);
        const giveA = a !== 'cheat';
        const sx = giveA ? cx - gap : cx + gap;
        const ex = giveA ? cx + gap : cx - gap;
        const x = sx + (ex - sx) * k;
        const y = cy - cellH * 0.1 - Math.sin(k * Math.PI) * 50 * u;
        coins.push(
          <circle
            key={`c${i}`}
            cx={x}
            cy={y}
            r={11 * u}
            fill={acc('gold')}
            stroke={ink}
            strokeWidth={3 * u}
          />,
        );
        if (phase > 0.7) {
          const both = a !== 'cheat' && b !== 'cheat';
          const label = both ? '+3 +3' : a === 'cheat' && b === 'cheat' ? '+1 +1' : '+5 +0';
          coins.push(
            <text
              key={`s${i}`}
              x={cx}
              y={cy - cellH * 0.3}
              fontFamily={font}
              fontWeight={800}
              fontSize={30 * u}
              fill={both ? acc('forest') : acc('crimson')}
              stroke={tokens.fill.head}
              strokeWidth={6 * u}
              paintOrder="stroke"
              textAnchor="middle"
            >
              {label}
            </text>,
          );
        }
      }
    }
  // The share of each kind, drifting as the rounds go by (copycats slowly winning).
  const share = {
    cheat: 0.42 - 0.03 * Math.min(round, 4) - 0.015 * phase,
    saint: 0.33 - 0.01 * Math.min(round, 4),
    copycat: 0,
  };
  share.copycat = 1 - share.cheat - share.saint;
  const barY = H * 0.155;
  const barW = W * 0.86;
  const barX = (W - barW) / 2;
  let along = barX;
  const colours: Record<Who, string> = {
    cheat: acc('crimson'),
    saint: acc('glint'),
    copycat: acc('gold'),
    trainer: acc('steel'),
  };
  const bar = (['cheat', 'saint', 'copycat'] as const).map((k) => {
    const w = barW * share[k];
    const x = along;
    along += w;
    return (
      <g key={k}>
        <rect
          x={x}
          y={barY}
          width={w}
          height={56 * u}
          fill={colours[k]}
          stroke={ink}
          strokeWidth={4 * u}
        />
        <text
          x={x + w / 2}
          y={barY + 40 * u}
          fontFamily={font}
          fontWeight={800}
          fontSize={30 * u}
          fill={tokens.fill.head}
          stroke={ink}
          strokeWidth={5 * u}
          paintOrder="stroke"
          textAnchor="middle"
        >
          {k.toUpperCase()} {Math.round(share[k] * 100)}%
        </text>
      </g>
    );
  });
  return (
    <g>
      <defs>
        <radialGradient id="da-bg" cx="0.5" cy="0.45" r="0.8">
          <stop offset="0" stopColor={day(1)} />
          <stop offset="1" stopColor={day(0)} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#da-bg)" />
      {tiles}
      <Blended id="da-cast" u={u * 0.5} light={acc('gold')} rim={0.6}>
        {people}
      </Blended>
      {coins}
      {bar}
      <text
        x={W / 2}
        y={H * 0.075}
        fontFamily={font}
        fontWeight={800}
        fontSize={64 * u}
        fill={tokens.fill.head}
        stroke={ink}
        strokeWidth={10 * u}
        paintOrder="stroke"
        textAnchor="middle"
      >
        ROUND {round + 1}
      </text>
    </g>
  );
}

export function DilemmaWorldVideo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return <DilemmaWorld W={width} H={height} t={frame / fps} />;
}

export function DilemmaArenaVideo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return <DilemmaArena W={width} H={height} t={frame / fps + 0.9} />;
}
