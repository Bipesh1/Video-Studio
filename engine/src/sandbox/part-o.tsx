import type { ReactNode } from 'react';
import lookTest from '../../../styles/fine-print/look-test.json';
import { VIEWER_FONT } from '../overlays/text';
import { ink, white } from '../tokens';

/**
 * A look test for The Fine Print (Biku, 2026-10-15: "instead of creating these stick men we
 * can use Vox style animations by illustrating about these businesses right?"). The same three
 * moments of the popcorn story, each in three numbered looks, every tile the size of a phone:
 *
 *   rows     the popcorn counter; where your $9 goes; the $9.99 price tag
 *   columns  1 flat and bold; 2 paper cutout; 3 line and colour
 *
 * The colours are the test's own (styles/fine-print/look-test.json); the look he picks becomes
 * this niche's style guide and tokens. The money split uses sample numbers.
 */

const W = 1080;
const H = 1920;
const TILE_W = W / 3;
const TILE_H = H / 3;
const font = `${VIEWER_FONT}, Arial, sans-serif`;

type LookSpec = (typeof lookTest.looks)[number];

/** A shape in a look: outlined in the line look, textured like paper in the cutout look. */
function Shape({
  s,
  d,
  fill,
  uid,
  outline = true,
  chart = false,
}: {
  s: LookSpec;
  d: string;
  fill: string;
  uid: string;
  outline?: boolean;
  /** A bar or a box of a diagram: outlined only in a look that outlines its charts too. */
  chart?: boolean;
}) {
  return (
    <path
      d={d}
      fill={fill}
      {...(s.outline && outline && (!chart || s.outlineCharts)
        ? {
            stroke: s.outline.color,
            strokeWidth: s.outline.width,
            strokeLinejoin: 'round' as const,
          }
        : {})}
      {...(s.paper ? { filter: `url(#${uid}-paper)` } : {})}
    />
  );
}

const rect = (x: number, y: number, w: number, h: number, r = 0) =>
  r > 0
    ? `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
    : `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
const circle = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

function Words({
  x,
  y,
  size,
  fill,
  children,
  anchor = 'middle',
  weight = 700,
}: {
  x: number;
  y: number;
  size: number;
  fill: string;
  children: ReactNode;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={font}
      fontSize={size}
      fontWeight={weight}
      fill={fill}
      textAnchor={anchor}
    >
      {children}
    </text>
  );
}

/** The filters of a look: the paper's grain, and the soft shadow under cut shapes. */
function Filters({ s, uid }: { s: LookSpec; uid: string }) {
  return (
    <defs>
      {s.paper && (
        <filter id={`${uid}-paper`} x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed="7"
            result="n"
          />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0.28 0 0 0 0.74  0.28 0 0 0 0.74  0.28 0 0 0 0.74  0 0 0 0 1"
            result="grain"
          />
          <feBlend in="SourceGraphic" in2="grain" mode="multiply" result="mixed" />
          <feComposite in="mixed" in2="SourceGraphic" operator="in" />
        </filter>
      )}
      {s.shadow && (
        <filter id={`${uid}-shadow`} x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow
            dx={s.shadow.dx}
            dy={s.shadow.dy}
            stdDeviation={s.shadow.blur}
            floodColor={ink}
            floodOpacity={s.shadow.opacity}
          />
        </filter>
      )}
    </defs>
  );
}

/** Things standing on the page: cut out and lifted in the paper look. */
const Lifted = ({ s, uid, children }: { s: LookSpec; uid: string; children: ReactNode }) => (
  <g {...(s.shadow ? { filter: `url(#${uid}-shadow)` } : {})}>{children}</g>
);

// ------------------------------------------------------------------ 1. the popcorn counter

function Counter({ s, uid }: { s: LookSpec; uid: string }) {
  const kernels = Array.from({ length: 34 }, (_, i) => ({
    x: 200 + ((i * 53) % 230),
    y: 900 - Math.floor(i / 6) * 34 - ((i * 17) % 20),
    r: 20 + ((i * 7) % 9),
    c: i % 3 === 0 ? s.light : s.yellow,
  }));
  const dome = Array.from({ length: 13 }, (_, i) => ({
    x: 680 + ((i * 41) % 190),
    y: 880 - ((i * 23) % 70),
    r: 30 + ((i * 11) % 12),
    c: i % 2 ? s.light : s.yellow,
  }));
  return (
    <>
      <rect width={W} height={H} fill={s.background} />
      <rect y={1380} width={W} height={H - 1380} fill={s.floor} />
      <Lifted s={s} uid={uid}>
        {/* The price board. */}
        <Shape s={s} uid={uid} d={rect(120, 190, 840, 340, 26)} fill={s.dark} />
        <Words x={540} y={300} size={74} fill={s.light}>
          POPCORN
        </Words>
        <Words x={540} y={480} size={190} fill={s.yellow}>
          $9
        </Words>
      </Lifted>
      <Lifted s={s} uid={uid}>
        {/* The popcorn machine: a red box with a glass window full of popcorn. */}
        <Shape s={s} uid={uid} d="M 150 600 L 460 600 L 430 560 L 180 560 Z" fill={s.red} />
        <Shape s={s} uid={uid} d={rect(140, 600, 330, 510, 14)} fill={s.red} />
        <Shape s={s} uid={uid} d={rect(172, 640, 266, 300, 10)} fill={s.light} />
        {kernels.map((k, i) => (
          <Shape key={i} s={s} uid={uid} d={circle(k.x, k.y, k.r)} fill={k.c} outline={false} />
        ))}
        <Shape s={s} uid={uid} d={rect(172, 980, 266, 60, 8)} fill={s.yellow} />
      </Lifted>
      <Lifted s={s} uid={uid}>
        {/* A striped bucket heaped with popcorn. */}
        {dome.map((k, i) => (
          <Shape key={i} s={s} uid={uid} d={circle(k.x, k.y, k.r)} fill={k.c} />
        ))}
        <Shape s={s} uid={uid} d="M 650 900 L 910 900 L 880 1110 L 680 1110 Z" fill={s.light} />
        {[0, 1, 2].map((i) => (
          <Shape
            key={i}
            s={s}
            uid={uid}
            outline={false}
            d={`M ${672 + i * 80} 900 L ${712 + i * 80} 900 L ${708 + i * 72} 1110 L ${680 + i * 72} 1110 Z`}
            fill={s.red}
          />
        ))}
      </Lifted>
      {/* The counter, and a hand coming in from the side with a ten. */}
      <Lifted s={s} uid={uid}>
        <Shape s={s} uid={uid} d={rect(-20, 1110, W + 40, 270)} fill={s.teal} />
        <Shape s={s} uid={uid} d={rect(-20, 1100, W + 40, 34)} fill={s.dark} />
      </Lifted>
      <Lifted s={s} uid={uid}>
        {/* The note, then the sleeve and the hand that holds it, the thumb over the note. */}
        <Shape s={s} uid={uid} d={rect(590, 1168, 250, 124, 12)} fill={s.green} />
        <Words x={700} y={1250} size={62} fill={s.dark}>
          $10
        </Words>
        <Shape s={s} uid={uid} d={rect(880, 1180, 240, 104, 14)} fill={s.dark} />
        <Shape s={s} uid={uid} d={rect(800, 1176, 110, 112, 48)} fill={s.mid} />
        <Shape s={s} uid={uid} d={rect(770, 1196, 74, 40, 20)} fill={s.mid} />
      </Lifted>
    </>
  );
}

// ------------------------------------------------------------------ 2. where your $9 goes

const SPLIT = [
  { label: 'THE CINEMA', value: '$7.65', share: 0.85, key: 'red' },
  { label: 'BUTTER', value: '55¢', share: 0.061, key: 'yellow' },
  { label: 'BUCKET', value: '45¢', share: 0.05, key: 'light' },
  { label: 'CORN', value: '35¢', share: 0.039, key: 'green' },
] as const;

function Split({ s, uid }: { s: LookSpec; uid: string }) {
  const top = 470;
  const bottom = 1390;
  const x = 130;
  const w = 380;
  let y = top;
  const parts = SPLIT.map((p) => {
    const h = (bottom - top) * p.share;
    const part = { ...p, y, h };
    y += h;
    return part;
  });
  return (
    <>
      <rect width={W} height={H} fill={s.background} />
      <Words x={540} y={230} size={86} fill={s.dark}>
        WHERE YOUR
      </Words>
      <Words x={540} y={360} size={120} fill={s.dark}>
        <tspan fill={s.red}>$9</tspan> GOES
      </Words>
      <Lifted s={s} uid={uid}>
        {parts.map((p) => (
          <Shape key={p.label} s={s} uid={uid} d={rect(x, p.y, w, p.h)} fill={s[p.key]} chart />
        ))}
      </Lifted>
      {parts.map((p, i) => {
        const mid = p.y + p.h / 2;
        // The big share is labelled on itself; the small ones beside the bar, spread out so
        // their labels do not touch.
        if (i === 0) {
          return (
            <g key={p.label}>
              <Words x={x + w + 40} y={mid - 20} size={58} fill={s.dark} anchor="start">
                {p.label}
              </Words>
              <Words x={x + w + 40} y={mid + 100} size={130} fill={s.red} anchor="start">
                {p.value}
              </Words>
            </g>
          );
        }
        const ly = 1180 + (i - 1) * 90;
        return (
          <g key={p.label}>
            <path
              d={`M ${x + w + 6} ${mid} L ${x + w + 40} ${ly - 16}`}
              stroke={s.dark}
              strokeWidth={4}
              fill="none"
            />
            <Words x={x + w + 52} y={ly} size={50} fill={s.dark} anchor="start">
              {p.label} <tspan fill={s.teal}>{p.value}</tspan>
            </Words>
          </g>
        );
      })}
    </>
  );
}

// ------------------------------------------------------------------ 3. the price tag

function Tag({ s, uid }: { s: LookSpec; uid: string }) {
  return (
    <>
      <rect width={W} height={H} fill={s.background} />
      <Words x={540} y={260} size={96} fill={s.dark}>
        WHY NOT
      </Words>
      <Words x={540} y={390} size={130} fill={s.red}>
        $10?
      </Words>
      <path d="M 540 470 L 540 640" stroke={s.dark} strokeWidth={6} />
      <Lifted s={s} uid={uid}>
        <g transform="rotate(-7 540 900)">
          <Shape
            s={s}
            uid={uid}
            d="M 470 640 L 610 640 L 820 760 L 820 1220 Q 820 1250 790 1250 L 290 1250 Q 260 1250 260 1220 L 260 760 Z"
            fill={s.yellow}
          />
          <Shape s={s} uid={uid} d={circle(540, 720, 30)} fill={s.background} />
          <Words x={540} y={1020} size={190} fill={s.dark}>
            $9.99
          </Words>
          <Words x={540} y={1160} size={54} fill={s.dark} weight={500}>
            SPECIAL PRICE
          </Words>
        </g>
      </Lifted>
      <Lifted s={s} uid={uid}>
        <Shape s={s} uid={uid} d={rect(610, 1330, 300, 160, 18)} fill={s.light} />
        <Words x={760} y={1440} size={92} fill={s.mid}>
          $10
        </Words>
        <path d="M 630 1460 L 890 1360" stroke={s.red} strokeWidth={14} strokeLinecap="round" />
      </Lifted>
    </>
  );
}

// ------------------------------------------------------------------ the second sheet

/** Follow the money: where your ticket and your popcorn go, box to box. */
function Flow({ s, uid }: { s: LookSpec; uid: string }) {
  const boxes = [
    { y: 470, label: 'YOU', fill: s.teal },
    { y: 860, label: 'THE CINEMA', fill: s.red },
    { y: 1250, label: 'THE FILM STUDIO', fill: s.dark },
  ];
  const arrow = (y1: number, y2: number) => (
    <>
      <path
        d={`M 540 ${y1} L 540 ${y2 - 30}`}
        stroke={s.dark}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path d={`M 505 ${y2 - 44} L 540 ${y2 - 4} L 575 ${y2 - 44} Z`} fill={s.dark} />
    </>
  );
  const coin = (y: number) => (
    <g>
      <Shape s={s} uid={uid} d={circle(540, y, 34)} fill={s.yellow} />
      <Words x={540} y={y + 15} size={42} fill={s.dark}>
        $
      </Words>
    </g>
  );
  return (
    <>
      <rect width={W} height={H} fill={s.background} />
      <Words x={540} y={250} size={92} fill={s.dark}>
        FOLLOW THE
      </Words>
      <Words x={540} y={370} size={120} fill={s.red}>
        MONEY
      </Words>
      {arrow(660, 860)}
      {arrow(1050, 1250)}
      <Lifted s={s} uid={uid}>
        {boxes.map((b) => (
          <g key={b.label}>
            <Shape s={s} uid={uid} d={rect(250, b.y, 580, 190, 30)} fill={b.fill} chart />
            <Words x={540} y={b.y + 120} size={b.label.length > 10 ? 64 : 84} fill={s.light}>
              {b.label}
            </Words>
          </g>
        ))}
        {coin(760)}
        {coin(1150)}
      </Lifted>
      <Words x={600} y={740} size={44} fill={s.dark} anchor="start">
        $15 TICKET
      </Words>
      <Words x={600} y={800} size={44} fill={s.dark} anchor="start">
        $9 POPCORN
      </Words>
      <Words x={600} y={1165} size={44} fill={s.dark} anchor="start">
        MOST OF THE
      </Words>
      <Words x={600} y={1220} size={44} fill={s.dark} anchor="start">
        TICKET
      </Words>
      <Words x={480} y={1165} size={44} fill={s.red} anchor="end">
        KEEPS THE
      </Words>
      <Words x={480} y={1220} size={44} fill={s.red} anchor="end">
        POPCORN
      </Words>
    </>
  );
}

/** People as the genre draws them: no faces, simple shapes, standing in a queue. */
function Queue({ s, uid }: { s: LookSpec; uid: string }) {
  const people = [
    { x: 440, body: s.red, h: 1 },
    { x: 610, body: s.teal, h: 0.94 },
    { x: 780, body: s.yellow, h: 1.04 },
    { x: 950, body: s.dark, h: 0.97 },
  ];
  const ground = 1400;
  return (
    <>
      <rect width={W} height={H} fill={s.background} />
      <rect y={ground} width={W} height={H - ground} fill={s.floor} />
      <Words x={540} y={250} size={92} fill={s.dark}>
        EVERY ONE OF
      </Words>
      <Words x={540} y={370} size={110} fill={s.dark}>
        THEM PAYS <tspan fill={s.red}>$9</tspan>
      </Words>
      <Lifted s={s} uid={uid}>
        <Shape s={s} uid={uid} d={rect(40, 560, 300, 180, 20)} fill={s.dark} />
        <Words x={190} y={690} size={110} fill={s.yellow}>
          $9
        </Words>
        <Shape s={s} uid={uid} d={rect(-20, 1010, 330, ground - 1010)} fill={s.teal} />
        <Shape s={s} uid={uid} d={rect(-20, 990, 340, 34)} fill={s.dark} />
      </Lifted>
      {people.map((p, i) => {
        const k = p.h;
        const hip = ground - 230 * k;
        const shoulder = hip - 270 * k;
        return (
          <Lifted key={i} s={s} uid={uid}>
            <Shape
              s={s}
              uid={uid}
              d={rect(p.x - 46, hip - 10, 36, ground - hip + 10, 16)}
              fill={s.dark}
            />
            <Shape
              s={s}
              uid={uid}
              d={rect(p.x + 10, hip - 10, 36, ground - hip + 10, 16)}
              fill={s.dark}
            />
            <Shape
              s={s}
              uid={uid}
              d={rect(p.x - 66, shoulder, 132, hip - shoulder + 20, 50)}
              fill={p.body}
            />
            <Shape s={s} uid={uid} d={circle(p.x, shoulder - 66 * k, 58 * k)} fill={s.mid} />
          </Lifted>
        );
      })}
    </>
  );
}

/** The title as a thumbnail would carry it: big words and one thing. */
function Title({ s, uid }: { s: LookSpec; uid: string }) {
  const dome = Array.from({ length: 15 }, (_, i) => ({
    x: 380 + ((i * 47) % 330),
    y: 960 - ((i * 29) % 110),
    r: 54 + ((i * 13) % 18),
    c: i % 2 ? s.light : s.yellow,
  }));
  return (
    <>
      <rect width={W} height={H} fill={s.background} />
      <Words x={540} y={300} size={130} fill={s.dark}>
        WHY POPCORN
      </Words>
      <Words x={540} y={470} size={160} fill={s.dark}>
        COSTS <tspan fill={s.red}>$9</tspan>
      </Words>
      <Lifted s={s} uid={uid}>
        {dome.map((k, i) => (
          <Shape key={i} s={s} uid={uid} d={circle(k.x, k.y, k.r)} fill={k.c} />
        ))}
        <Shape s={s} uid={uid} d="M 330 990 L 750 990 L 700 1500 L 380 1500 Z" fill={s.light} />
        {[0, 1, 2].map((i) => (
          <Shape
            key={i}
            s={s}
            uid={uid}
            outline={false}
            d={`M ${362 + i * 132} 990 L ${428 + i * 132} 990 L ${420 + i * 116} 1500 L ${392 + i * 116} 1500 Z`}
            fill={s.red}
          />
        ))}
      </Lifted>
    </>
  );
}

type Scene = (props: { s: LookSpec; uid: string }) => ReactNode;

function LooksGrid({ scenes, ids }: { scenes: Scene[]; ids: number[] }) {
  return (
    <>
      <rect width={W} height={H} fill={white} />
      {scenes.map((Scene, row) =>
        ids.map((id, col) => {
          const s = lookTest.looks.find((l) => l.id === id) as LookSpec;
          const uid = `fp-${row}-${s.id}`;
          return (
            <g key={uid}>
              <svg
                x={col * TILE_W}
                y={row * TILE_H}
                width={TILE_W}
                height={TILE_H}
                viewBox={`0 0 ${W} ${H}`}
              >
                <Filters s={s} uid={uid} />
                <Scene s={s} uid={uid} />
              </svg>
              <circle
                cx={col * TILE_W + 34}
                cy={row * TILE_H + 34}
                r={24}
                fill={white}
                stroke={ink}
                strokeWidth={3}
              />
              <text
                x={col * TILE_W + 34}
                y={row * TILE_H + 46}
                textAnchor="middle"
                fontFamily="Arial, Helvetica, sans-serif"
                fontSize={30}
                fontWeight={700}
                fill={ink}
              >
                {s.id}
              </text>
            </g>
          );
        }),
      )}
    </>
  );
}

/** The first sheet: looks 1, 2 and 3 on the counter, the split and the tag. */
export const FinePrintLooksSheet = () => (
  <LooksGrid scenes={[Counter, Split, Tag]} ids={[1, 2, 3]} />
);

/** The second sheet, when he could not choose between 1 and 3: 1, 4 between them, and 3. */
export const FinePrintLooksBSheet = () => (
  <LooksGrid scenes={[Flow, Queue, Title]} ids={[1, 4, 3]} />
);
