import { loadFont } from '@remotion/fonts';
import type { ReactNode } from 'react';
import { staticFile } from 'remotion';
import fineTokens from '../../../styles/fine-print/tokens.json';

/**
 * The thumbnail pieces of What's the Catch?, after the reference Biku gave on 2026-10-15 ("THE
 * REAL PRODUCT": a flat yellow page, huge heavy words with one line white on a black box, the
 * popcorn bucket circled in red, a red arrow from the words to it, the ticket crossed out, a
 * small shocked stick figure). Drawn in the channel's own style (styles/fine-print/guide.md):
 * flat fills, a navy line round things, red for the marks.
 */

export const HEADLINE_FONT = 'Anton';
// Loaded only where pictures are drawn: the command line imports this file too, and has no page
// to load a font into.
if (typeof window !== 'undefined') {
  void loadFont({
    family: HEADLINE_FONT,
    url: staticFile('fonts/Anton-Regular.ttf'),
    weight: '400',
  });
}

const C = fineTokens.colors;
const LINE = fineTokens.line;

/** A thing's line, `k` wide in the thing's own units (the same width on screen at any size). */
const stroke = (k: number) => ({
  stroke: LINE.color,
  strokeWidth: k,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
});

export type Colour = keyof typeof C;
export const colourOf = (name: Colour) => C[name];

/** Anton is narrow: about 0.47 of its size a letter, capitals and figures. */
const ANTON_WIDTH = 0.47;

/**
 * Big heavy lines from the left, each fitted to `width` (a share of the picture's width) up to
 * `size` (a share of its height). A `boxed` line is light on a dark box; a `red` line is red;
 * on a dark or busy picture, a `light` line is light with a dark edge and a `gold` line is dark
 * on a gold box (the game theory thumbnails, 2026-10-15).
 */
export function Headline({
  lines,
  x,
  top,
  size,
  width,
  W,
  H,
}: {
  lines: readonly { text: string; style: 'ink' | 'boxed' | 'red' | 'light' | 'gold' }[];
  x: number;
  top: number;
  size: number;
  width: number;
  W: number;
  H: number;
}) {
  let y = top * H;
  return (
    <>
      {lines.map((line, i) => {
        const most = size * H;
        const fitted = Math.min(most, (width * W) / (ANTON_WIDTH * Math.max(1, line.text.length)));
        const boxed = line.style === 'boxed' || line.style === 'gold';
        const pad = fitted * 0.12;
        const textW = fitted * ANTON_WIDTH * line.text.length;
        const top0 = y;
        y += fitted * 1.08 + (boxed ? pad * 2 : 0);
        return (
          <g key={i}>
            {boxed && (
              <rect
                x={x * W - pad}
                y={top0 - pad * 0.3}
                width={textW + pad * 2.4}
                height={fitted * 1.04 + pad * 1.4}
                fill={line.style === 'gold' ? C.yellow : C.dark}
                stroke={line.style === 'gold' ? C.dark : undefined}
                strokeWidth={line.style === 'gold' ? pad * 0.35 : undefined}
                transform={`rotate(-1.5 ${x * W} ${top0})`}
              />
            )}
            <text
              x={x * W + (boxed ? pad * 0.2 : 0)}
              y={top0 + fitted * 0.93 + (boxed ? pad * 0.4 : 0)}
              fontFamily={`${HEADLINE_FONT}, Impact, sans-serif`}
              fontSize={fitted}
              fill={
                line.style === 'boxed' || line.style === 'light'
                  ? C.light
                  : line.style === 'red'
                    ? C.red
                    : C.dark
              }
              stroke={line.style === 'light' ? C.dark : undefined}
              strokeWidth={line.style === 'light' ? fitted * 0.08 : undefined}
              strokeLinejoin="round"
              paintOrder="stroke"
              transform={boxed ? `rotate(-1.5 ${x * W} ${top0})` : undefined}
            >
              {line.text}
            </text>
          </g>
        );
      })}
    </>
  );
}

// ------------------------------------------------------------------ things, on a 100 by 100 square

/**
 * One popped kernel, as popcorn really looks: not a ball but a knobbly puff of four or five
 * lobes, with a crease or two, sometimes a buttery yellow side and a bit of brown hull. The
 * lobes are outlined as one shape (all the outlines first, all the fills over them).
 */
function Kernel({
  x,
  y,
  r,
  seed,
  k,
}: {
  x: number;
  y: number;
  r: number;
  seed: number;
  k: number;
}) {
  const rnd = (n: number) => {
    const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const count = 4 + Math.floor(rnd(1) * 2);
  const lobes = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + rnd(2 + i) * 0.9;
    const d = r * (0.32 + rnd(10 + i) * 0.22);
    return {
      cx: x + Math.cos(a) * d,
      cy: y + Math.sin(a) * d * 0.85,
      r: r * (0.48 + rnd(20 + i) * 0.2),
    };
  });
  const buttered = rnd(30) < 0.35;
  const hull = rnd(31) < 0.3;
  const fill = buttered ? C.butter : C.popcorn;
  const crease = (n: number) => {
    const a = rnd(40 + n) * Math.PI * 2;
    const len = r * 0.35;
    const cx = x + Math.cos(a) * r * 0.2;
    const cy = y + Math.sin(a) * r * 0.2;
    return `M ${cx - len / 2} ${cy + len * 0.15} Q ${cx} ${cy - len * 0.35} ${cx + len / 2} ${cy + len * 0.1}`;
  };
  return (
    <g>
      {lobes.map((l, i) => (
        <circle key={`o${i}`} cx={l.cx} cy={l.cy} r={l.r} fill={fill} {...stroke(k)} />
      ))}
      {lobes.map((l, i) => (
        <circle key={`f${i}`} cx={l.cx} cy={l.cy} r={l.r - k / 2} fill={fill} />
      ))}
      <path
        d={crease(0)}
        fill="none"
        stroke={C.hull}
        strokeWidth={k * 0.55}
        strokeLinecap="round"
        opacity={0.7}
      />
      {rnd(32) < 0.5 && (
        <path
          d={crease(1)}
          fill="none"
          stroke={C.hull}
          strokeWidth={k * 0.45}
          strokeLinecap="round"
          opacity={0.5}
        />
      )}
      {hull && (
        <path
          d={`M ${x + r * 0.15} ${y + r * 0.25} l ${r * 0.22} ${r * 0.05} l ${-r * 0.1} ${r * 0.18} Z`}
          fill={C.hull}
        />
      )}
    </g>
  );
}

/** A heap of popcorn: kernels from the back of the pile to the front, a few spilling over. */
const PILE = [
  [28, 20, 9],
  [46, 13, 10],
  [64, 16, 9],
  [78, 25, 8],
  [18, 31, 8],
  [37, 26, 10],
  [56, 24, 10],
  [72, 33, 9],
  [86, 38, 7],
  [12, 40, 7],
  [26, 37, 9],
  [45, 35, 9],
  [62, 36, 9],
  [52, 4, 8],
  [35, 9, 8],
  [70, 5, 7],
] as const;

function Bucket({ k }: { k: number }) {
  return (
    <>
      {PILE.map(([x, y, r], i) => (
        <Kernel key={i} x={x} y={y} r={r} seed={i + 3} k={k} />
      ))}
      <path d="M 10 42 L 90 42 L 82 100 L 18 100 Z" fill={C.light} {...stroke(k)} />
      {[0, 1, 2, 3].map((i) => (
        <path
          key={i}
          d={`M ${16 + i * 20} 42 L ${26 + i * 20} 42 L ${24 + i * 17} 100 L ${17 + i * 17 + 2} 100 Z`}
          fill={C.red}
        />
      ))}
      <path d="M 10 42 L 90 42 L 82 100 L 18 100 Z" fill="none" {...stroke(k)} />
      <rect x={6} y={38} width={88} height={9} rx={3} fill={C.light} {...stroke(k)} />
      <Kernel x={20} y={40} r={7} seed={41} k={k} />
      <Kernel x={83} y={41} r={6.5} seed={44} k={k} />
    </>
  );
}

function Ticket({ k }: { k: number }) {
  const d = 'M 4 30 L 96 30 L 96 44 A 7 7 0 0 0 96 58 L 96 72 L 4 72 L 4 58 A 7 7 0 0 0 4 44 Z';
  return (
    <>
      <path d={d} fill={C.ticket} {...stroke(k)} />
      <path d="M 74 33 L 74 69" stroke={C.dark} strokeWidth={1.4 * k} strokeDasharray="3 3" />
      <text
        x={14}
        y={58}
        fontFamily={`${HEADLINE_FONT}, Impact, sans-serif`}
        fontSize={17}
        fill={C.dark}
      >
        TICKET
      </text>
    </>
  );
}

/** A small stick figure in shock: hands on the head, eyes wide, mouth an O. */
function Shocked({ k, ink = C.dark }: { k: number; ink?: string }) {
  const limb = {
    stroke: ink,
    strokeWidth: 2 * k,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };
  return (
    <>
      <path d="M 50 40 L 50 74" {...limb} />
      <path d="M 50 74 L 38 99 M 50 74 L 62 99" {...limb} />
      {/* (limbs are drawn twice the thing's line, as stick limbs are bolder than outlines) */}
      <path d="M 50 46 L 30 40 L 36 16 M 50 46 L 70 40 L 64 16" {...limb} />
      <circle cx={50} cy={24} r={16} fill={C.yellow} {...stroke(k)} />
      <circle cx={43.5} cy={21} r={5.6} fill={C.light} {...stroke(k * 0.7)} />
      <circle cx={56.5} cy={21} r={5.6} fill={C.light} {...stroke(k * 0.7)} />
      <circle cx={43.5} cy={21.5} r={2} fill={C.dark} />
      <circle cx={56.5} cy={21.5} r={2} fill={C.dark} />
      <ellipse cx={50} cy={32} rx={2.8} ry={3.8} fill={C.dark} />
      <path
        d="M 50 4 L 50 -3 M 41 6 L 38 0 M 59 6 L 62 0"
        stroke={ink}
        strokeWidth={k}
        strokeLinecap="round"
      />
    </>
  );
}

/**
 * A card tablet on its stand, as at the counter, showing ADD A TIP and three big buttons: 20%,
 * 25%, 30% (for "Why Every Screen Asks You for a Tip Now", 2026-10-16).
 */
function TipScreen({ k }: { k: number }) {
  const big = `${HEADLINE_FONT}, Impact, sans-serif`;
  const fills = [C.red, C.yellow, C.teal];
  return (
    <>
      <path d="M 50 74 L 50 96" stroke={C.dark} strokeWidth={4 * k} strokeLinecap="round" />
      <ellipse cx={50} cy={97} rx={14} ry={3.5} fill={C.dark} />
      <rect x={4} y={14} width={92} height={62} rx={7} fill={C.dark} {...stroke(k)} />
      <rect x={8} y={18} width={84} height={54} rx={4} fill={C.light} />
      <text x={50} y={30} fontFamily={big} fontSize={8} fill={C.dark} textAnchor="middle">
        ADD A TIP
      </text>
      {['20%', '25%', '30%'].map((label, i) => (
        <g key={label}>
          <rect x={11 + i * 27} y={35} width={24} height={20} rx={3} fill={fills[i]} />
          <text
            x={23 + i * 27}
            y={49.5}
            fontFamily={big}
            fontSize={10}
            fill={i === 1 ? C.dark : C.light}
            textAnchor="middle"
          >
            {label}
          </text>
        </g>
      ))}
      <rect x={14} y={59} width={32} height={8} rx={4} fill={C.mid} />
      <rect x={54} y={59} width={32} height={8} rx={4} fill={C.mid} />
    </>
  );
}

/** The old usual tip: a small gold tag reading 15%. */
function OldTip({ k }: { k: number }) {
  return (
    <>
      <path
        d="M 30 22 L 70 22 L 90 40 L 90 86 Q 90 92 84 92 L 16 92 Q 10 92 10 86 L 10 40 Z"
        fill={C.yellow}
        {...stroke(k)}
      />
      <circle cx={50} cy={34} r={5} fill={C.light} {...stroke(k)} />
      <text
        x={50}
        y={74}
        fontFamily={`${HEADLINE_FONT}, Impact, sans-serif`}
        fontSize={34}
        fill={C.dark}
        textAnchor="middle"
      >
        15%
      </text>
    </>
  );
}

const J = fineTokens.journey;

/**
 * A tall glass of water, a drop on its rim, a glint: the glass of "Why Is the Water in Your Glass
 * Older Than the Sun?" (2026-10-18), for a picture where it stands beside the Sun.
 */
function WaterGlass({ k }: { k: number }) {
  return (
    <>
      <path d="M 22 4 L 78 4 L 72 98 L 28 98 Z" fill={J.glass} opacity={0.75} />
      <path d="M 24.5 30 L 75.5 30 L 72 98 L 28 98 Z" fill={J.water} />
      <path d="M 24.5 30 L 75.5 30 L 75 36 L 25 36 Z" fill={J.waterLight} />
      <path d="M 22 4 L 78 4 L 72 98 L 28 98 Z" fill="none" {...stroke(k)} />
      <path
        d="M 30 10 L 33 88"
        stroke={J.clockFace}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.8}
      />
      <ellipse cx={80} cy={9} rx={4} ry={5} fill={J.water} {...stroke(k * 0.7)} />
      <circle cx={34} cy={60} r={3} fill={J.waterLight} />
      <circle cx={55} cy={74} r={2.2} fill={J.waterLight} />
      <circle cx={44} cy={46} r={1.8} fill={J.waterLight} />
    </>
  );
}

/** The Sun blazing: a gold ball, a ring of flares, a soft glow. */
function BlazingSun({ k }: { k: number }) {
  return (
    <>
      <defs>
        <radialGradient id="tp-sun-glow">
          <stop offset="0.45" stopColor={J.sun} stopOpacity={0.7} />
          <stop offset="1" stopColor={J.sunFlare} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={50} cy={50} r={50} fill="url(#tp-sun-glow)" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI * 2) / 16;
        const r0 = 30;
        const r1 = i % 2 ? 41 : 46;
        const w = 0.16;
        return (
          <path
            key={i}
            d={`M ${50 + r0 * Math.cos(a - w)} ${50 + r0 * Math.sin(a - w)} L ${50 + r1 * Math.cos(a)} ${50 + r1 * Math.sin(a)} L ${50 + r0 * Math.cos(a + w)} ${50 + r0 * Math.sin(a + w)} Z`}
            fill={J.sunFlare}
          />
        );
      })}
      <circle cx={50} cy={50} r={32} fill={J.sun} {...stroke(k)} />
      <circle cx={43} cy={43} r={17} fill={J.sunCore} opacity={0.7} />
    </>
  );
}

export const ICONS = [
  'water-glass',
  'sun-blaze',
  'bucket',
  'ticket',
  'shocked',
  'shocked-light',
  'tip-screen',
  'old-tip',
] as const;
export type IconName = (typeof ICONS)[number];

/** A thing at (x, y), `size` tall (shares of the picture), turned by `turn` degrees, crossed out if asked. */
export function Icon({
  name,
  x,
  y,
  size,
  turn,
  crossed,
  W,
  H,
  line,
}: {
  name: IconName;
  x: number;
  y: number;
  size: number;
  turn: number;
  crossed: boolean;
  W: number;
  H: number;
  /** The line's width in the picture's own units, when it must match other drawings there. */
  line?: number;
}) {
  const s = (size * H) / 100;
  // Lines keep their weight however big the thing is drawn: one unit of the square is s
  // pixels, and the line is about half a percent of the picture's height on screen.
  const k = (line ?? 0.0055 * H) / s;
  const body: ReactNode =
    name === 'bucket' ? (
      <Bucket k={k} />
    ) : name === 'ticket' ? (
      <Ticket k={k} />
    ) : name === 'tip-screen' ? (
      <TipScreen k={k} />
    ) : name === 'old-tip' ? (
      <OldTip k={k} />
    ) : name === 'water-glass' ? (
      <WaterGlass k={k} />
    ) : name === 'sun-blaze' ? (
      <BlazingSun k={k} />
    ) : name === 'shocked-light' ? (
      // The same figure with light lines, for a dark page.
      <Shocked k={k} ink={C.light} />
    ) : (
      <Shocked k={k} />
    );
  return (
    <g transform={`translate(${x * W} ${y * H}) rotate(${turn}) scale(${s}) translate(-50 -50)`}>
      {body}
      {crossed && (
        <path
          d="M 8 22 L 92 80 M 92 22 L 8 80"
          stroke={C.red}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.92}
        />
      )}
    </g>
  );
}

/**
 * A mark drawn by hand in red: a loose circle round a thing (it overshoots where it closes, as a
 * pen does), or a curved arrow from one point to another.
 */
export function Mark({
  shape,
  at,
  to,
  rx,
  ry,
  W,
  H,
}: {
  shape: 'circle' | 'arrow';
  at: { x: number; y: number };
  to?: { x: number; y: number } | undefined;
  rx: number;
  ry: number;
  W: number;
  H: number;
}) {
  const width = H * 0.014;
  if (shape === 'circle') {
    const cx = at.x * W;
    const cy = at.y * H;
    const a = rx * W;
    const b = ry * H;
    const pts = Array.from({ length: 49 }, (_, i) => {
      const t = -1.9 + (i / 48) * (2 * Math.PI + 0.35);
      const wob = 1 + 0.03 * Math.sin(t * 3 + 1);
      return `${(cx + a * wob * Math.cos(t)).toFixed(1)} ${(cy + b * wob * Math.sin(t)).toFixed(1)}`;
    });
    return (
      <path
        d={`M ${pts.join(' L ')}`}
        fill="none"
        stroke={C.red}
        strokeWidth={width}
        strokeLinecap="round"
      />
    );
  }
  const from = { x: at.x * W, y: at.y * H };
  const end = { x: (to?.x ?? at.x) * W, y: (to?.y ?? at.y) * H };
  // The arrow bows upward between its ends, and its head points along its last stretch.
  const ctrl = { x: (from.x + end.x) / 2, y: Math.min(from.y, end.y) - H * 0.14 };
  const ang = Math.atan2(end.y - ctrl.y, end.x - ctrl.x);
  const head = H * 0.05;
  const left = { x: end.x - head * Math.cos(ang - 0.5), y: end.y - head * Math.sin(ang - 0.5) };
  const right = { x: end.x - head * Math.cos(ang + 0.5), y: end.y - head * Math.sin(ang + 0.5) };
  return (
    <g fill="none" stroke={C.red} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <path d={`M ${from.x} ${from.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`} />
      <path d={`M ${left.x} ${left.y} L ${end.x} ${end.y} L ${right.x} ${right.y}`} />
    </g>
  );
}
