import { VIEWER_FONT } from '../overlays/text';
import { ink, lineWeights } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';
import { TABLE } from './Table';

/**
 * Things for a game played across a table (Style 4): a golden ball that opens on a word, a
 * pile of cash, and the desk the players sit at. Each is outlined with a flat fill, one shadow
 * tone and one glint. The designs are the studio's own: no show's set, logo or lettering.
 */

const font = `${VIEWER_FONT}, sans-serif`;

/** The ball's radius, in head units. It stands on its bottom at the origin. */
export const BALL_RADIUS = 0.2;

/** What a ball can hold, and the cloth color of the disc that says so. */
export const BALL_WORDS = { split: 'forest', steal: 'crimson' } as const;
export type BallWord = keyof typeof BALL_WORDS;

/** Seconds into a shot before an opening ball starts to open, and how long it takes. */
export const BALL_OPENS = { after: 0.45, over: 0.3 } as const;

/** How far open a ball is, 0 to 1, this many seconds into the shot that opens it. */
export const ballOpenAt = (shotT: number): number => {
  const k = Math.min(1, Math.max(0, (shotT - BALL_OPENS.after) / BALL_OPENS.over));
  // Out fast, then a small settle.
  return 1 - (1 - k) ** 3;
};

/**
 * A golden ball, a little bigger than a fist. Closed it is a plain gold ball with a seam round
 * its middle, so nobody can tell two of them apart. `open` (0 to 1) lifts the top half off and
 * raises a disc with the word it was hiding: SPLIT on green, STEAL on red.
 */
export function GoldenBall({
  uid,
  shadowSide,
  word,
  open = word ? 1 : 0,
}: PropProps & { word?: BallWord; open?: number }) {
  const gold = paintOf('gold');
  const r = BALL_RADIUS;
  const cy = -r;
  const off = lightOffset(shadowSide, 0.04);
  const k = word ? Math.min(1, Math.max(0, open)) : 0;
  if (k <= 0.02) {
    return (
      <g>
        <Shaded
          id={`${uid}-ball`}
          d={`M ${-r} ${cy} A ${r} ${r} 0 1 0 ${r} ${cy} A ${r} ${r} 0 1 0 ${-r} ${cy} Z`}
          {...gold}
          offset={off}
        />
        {detail(`M ${-r} ${cy} Q 0 ${cy + r * 0.3} ${r} ${cy}`)}
        <Glint x={-r * 0.42} y={cy - r * 0.48} length={r * 0.5} turn={-35} />
      </g>
    );
  }
  const disc = paintOf(BALL_WORDS[word as BallWord]);
  const paper = paintOf('cream');
  const discR = r * 0.86;
  const discY = cy - r * 0.78 * k;
  return (
    <g>
      {/* The top half, lifted off and tipped back behind the disc, so an open ball is no wider
          than a shut one and two of them can stand side by side. */}
      <g transform={`translate(0 ${-r * 1.5 * k}) rotate(${-16 * k} 0 ${cy})`}>
        <Shaded
          id={`${uid}-ball-lid`}
          d={`M ${-r} ${cy} A ${r} ${r} 0 0 1 ${r} ${cy} Z`}
          {...gold}
          offset={off}
        />
      </g>
      <g transform={`translate(0 ${discY}) scale(${0.35 + 0.65 * k})`}>
        <circle r={discR} fill={disc.fill} stroke={ink} strokeWidth={lineWeights.outline} />
        <g transform="scale(0.01)">
          <text
            y={discR * 20}
            textAnchor="middle"
            fontFamily={font}
            fontWeight={700}
            fontSize={discR * 56}
            fill={paper.fill}
          >
            {(word as string).toUpperCase()}
          </text>
        </g>
      </g>
      <Shaded
        id={`${uid}-ball-bowl`}
        d={`M ${-r} ${cy} A ${r} ${r} 0 0 0 ${r} ${cy} Z`}
        {...gold}
        offset={off}
      />
      <Glint x={-r * 0.5} y={cy + r * 0.42} length={r * 0.4} turn={40} />
    </g>
  );
}

/** One bundle of banknotes, in head units. */
const BUNDLE = { width: 0.5, height: 0.13, gap: 0.02 } as const;

/** How tall and how wide a pile of this many rows is, in head units. */
export const cashSize = (rows: number) => ({
  width: BUNDLE.width * 2 + BUNDLE.gap,
  height: rows * BUNDLE.height,
});

/**
 * A pile of cash standing on its bottom at the origin: bundles of green notes, each with a
 * paper band, two to a row and six rows high. One column of it is half the prize: a pile cut
 * down the middle, as two people share it.
 */
export function CashPile({
  uid,
  shadowSide,
  rows = 6,
  columns = 2,
}: PropProps & { rows?: number; columns?: 1 | 2 }) {
  const note = paintOf('forest');
  const band = paintOf('cream');
  const { width: w, height: h, gap } = BUNDLE;
  const bundle = (x: number, y: number, key: string) => (
    <g key={key} transform={`translate(${x} ${y})`}>
      <Shaded
        id={`${uid}-cash-${key}`}
        d={`M ${-w / 2} 0 L ${w / 2} 0 L ${w / 2} ${-h} L ${-w / 2} ${-h} Z`}
        {...note}
        offset={lightOffset(shadowSide, 0.03)}
      />
      <rect
        x={-w * 0.13}
        y={-h}
        width={w * 0.26}
        height={h}
        fill={band.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
    </g>
  );
  const out = [];
  for (let row = 0; row < rows; row++) {
    // Each row sits a little off the one below, as a pile stacked by hand does.
    const nudge = (row % 2 === 0 ? 1 : -1) * 0.03;
    const y = -row * h;
    if (columns === 1) {
      out.push(bundle(nudge, y, `${row}a`));
      continue;
    }
    out.push(bundle(-(w + gap) / 2 + nudge, y, `${row}a`));
    out.push(bundle((w + gap) / 2 + nudge, y, `${row}b`));
  }
  return (
    <g>
      {out}
      <Glint x={columns === 1 ? -w * 0.28 : -w * 0.8} y={-rows * h + h * 0.5} length={0.12} />
    </g>
  );
}

/** The game desk's size, in head units. Its top is as high as a table's, so a sitter fits it. */
export const GAME_TABLE = { top: TABLE.top, width: 3.1, front: 2.5, slab: 0.13 } as const;

/**
 * A game-show desk seen from the side, standing on the ground with the middle of its width at
 * the origin: a gold top and a solid crimson front down to the floor. Two players sit facing
 * each other across it, about two heads from its middle; things stand on it at
 * y = -GAME_TABLE.top. Draw it after the people and before anything on its top.
 */
export function GameTable({ uid, shadowSide }: PropProps) {
  const front = paintOf('crimson');
  const top = paintOf('gold');
  const w = GAME_TABLE.width / 2;
  const f = GAME_TABLE.front / 2;
  const t = GAME_TABLE.top;
  const s = GAME_TABLE.slab;
  const off = lightOffset(shadowSide, 0.05);
  return (
    <g>
      <Shaded
        id={`${uid}-desk-front`}
        d={`M ${-f} 0 L ${-f} ${-t + s} L ${f} ${-t + s} L ${f} 0 Z`}
        {...front}
        offset={off}
      />
      {detail(
        `M ${-f + 0.2} -0.16 L ${-f + 0.2} ${-t + s + 0.2} L ${f - 0.2} ${-t + s + 0.2} L ${f - 0.2} -0.16 Z`,
      )}
      <Shaded
        id={`${uid}-desk-top`}
        d={`M ${-w} ${-t} L ${w} ${-t} L ${w} ${-t + s} L ${-w} ${-t + s} Z`}
        {...top}
        offset={off}
      />
      <Glint x={-w + 0.4} y={-t + s * 0.42} length={0.34} />
    </g>
  );
}
