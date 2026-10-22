import type { ReactNode } from 'react';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { HEADLINE_FONT, Icon } from '../explainer/ThumbParts';
import { VIEWER_FONT } from '../overlays/text';
import { ink, white } from '../tokens';

/**
 * A look test of motion-graphics styles for What's the Catch? (Biku, 2026-10-16: "i want
 * similar to motion graphics for these videos", then of the tests that only added movement to
 * the same pictures, "i dont see much of a difference though"). The same two moments of the
 * popcorn story, each in three clearly different looks, every tile the shape of a phone:
 *
 *   rows     why does popcorn cost $10?; where your snack dollar goes
 *   columns  1 big type; 2 icons and shapes; 3 2.5D (a small world drawn at an angle)
 *
 * Stills only: the one he picks is then made to move. The colours are the channel's own tokens.
 * The 82 cents is from the video's own source (AMC's 2025 food and drink costs, about 18%).
 */

const C = fineTokens.colors;
const P = fineTokens.pages;
const W = 1080;
const H = 1920;
const font = `${VIEWER_FONT}, Arial, sans-serif`;
const heavy = `${HEADLINE_FONT}, Impact, sans-serif`;

/** Two colours mixed, `t` of the way from `a` to `b`. */
function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(ch(a, i) * (1 - t) + ch(b, i) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function Text({
  x,
  y,
  size,
  fill,
  children,
  face = font,
  anchor = 'middle',
  weight = 700,
}: {
  x: number;
  y: number;
  size: number;
  fill: string;
  children: ReactNode;
  face?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontFamily={face}
      fontSize={size}
      fontWeight={weight}
      fill={fill}
      textAnchor={anchor}
    >
      {children}
    </text>
  );
}

/** A rounded label with words on it. */
function Pill({
  x,
  y,
  text,
  size,
  fill,
  ink: textFill,
}: {
  x: number;
  y: number;
  text: string;
  size: number;
  fill: string;
  ink: string;
}) {
  const w = size * 0.62 * text.length + size * 1.2;
  const h = size * 1.6;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} />
      <Text x={x} y={y + size * 0.36} size={size} fill={textFill}>
        {text}
      </Text>
    </g>
  );
}

/** A coin with a dollar sign, flat. */
function Coin({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={C.yellow} />
      <circle
        cx={x}
        cy={y}
        r={r * 0.78}
        fill="none"
        stroke={mix(C.yellow, C.dark, 0.25)}
        strokeWidth={r * 0.08}
      />
      <Text x={x} y={y + r * 0.4} size={r * 1.15} fill={mix(C.yellow, C.dark, 0.45)}>
        $
      </Text>
    </g>
  );
}

const bucket = (x: number, y: number, size: number) => (
  <Icon
    name="bucket"
    x={x / W}
    y={y / H}
    size={size / H}
    turn={0}
    crossed={false}
    W={W}
    H={H}
    line={5}
  />
);
const ticket = (x: number, y: number, size: number, turn = -8) => (
  <Icon
    name="ticket"
    x={x / W}
    y={y / H}
    size={size / H}
    turn={turn}
    crossed={false}
    W={W}
    H={H}
    line={5}
  />
);

// ------------------------------------------------------------------ 1 big type

function TypeQuestion() {
  return (
    <>
      <rect width={W} height={H} fill={C.dark} />
      <Pill x={540} y={300} text="AT THE CINEMA" size={44} fill={C.teal} ink={C.light} />
      <Text x={90} y={560} size={130} fill={C.light} face={heavy} anchor="start">
        WHY DOES
      </Text>
      <Text x={84} y={830} size={250} fill={C.yellow} face={heavy} anchor="start">
        POPCORN
      </Text>
      <Text x={90} y={1020} size={190} fill={C.light} face={heavy} anchor="start">
        COST
      </Text>
      {bucket(760, 940, 190)}
      <Text x={70} y={1430} size={460} fill={C.red} face={heavy} anchor="start">
        $10?
      </Text>
      <path
        d="M 90 1500 Q 420 1450 860 1505"
        fill="none"
        stroke={C.yellow}
        strokeWidth={26}
        strokeLinecap="round"
      />
    </>
  );
}

function TypeSplit() {
  return (
    <>
      <rect width={W} height={H} fill={C.dark} />
      <Coin x={900} y={330} r={90} />
      <Coin x={780} y={260} r={60} />
      <Text x={60} y={800} size={500} fill={C.red} face={heavy} anchor="start">
        82¢
      </Text>
      <Text x={90} y={990} size={120} fill={C.light} face={heavy} anchor="start">
        OF EVERY
      </Text>
      <Text x={90} y={1150} size={160} fill={C.yellow} face={heavy} anchor="start">
        SNACK DOLLAR
      </Text>
      <Text x={90} y={1300} size={120} fill={C.light} face={heavy} anchor="start">
        STAYS WITH
      </Text>
      <rect
        x={70}
        y={1340}
        width={760}
        height={190}
        fill={C.yellow}
        transform="rotate(-2 70 1340)"
      />
      <Text x={100} y={1495} size={160} fill={C.dark} face={heavy} anchor="start">
        THE CINEMA
      </Text>
    </>
  );
}

// ------------------------------------------------------------------ 2 icons and shapes

function IconsQuestion() {
  return (
    <>
      <rect width={W} height={H} fill={P.sky} />
      <circle cx={540} cy={860} r={520} fill={C.light} opacity={0.18} />
      <Text x={540} y={300} size={68} fill={C.dark}>
        WHY DOES POPCORN
      </Text>
      <Text x={540} y={390} size={68} fill={C.dark}>
        COST $10?
      </Text>
      {/* The bucket in a round badge, the money and the ticket on an arc round it. */}
      <path
        d="M 230 1250 Q 540 1480 850 1250"
        fill="none"
        stroke={C.dark}
        strokeWidth={6}
        strokeDasharray="4 18"
        strokeLinecap="round"
      />
      <path
        d="M 300 760 L 230 1150 M 780 760 L 850 1150"
        stroke={C.dark}
        strokeWidth={6}
        strokeDasharray="4 18"
        strokeLinecap="round"
      />
      <circle cx={540} cy={800} r={250} fill={C.light} />
      {bucket(540, 790, 330)}
      <Pill x={540} y={1100} text="$10" size={100} fill={C.red} ink={C.light} />
      <circle cx={230} cy={1250} r={115} fill={C.light} />
      {ticket(230, 1250, 160)}
      <circle cx={850} cy={1250} r={115} fill={C.light} />
      <Coin x={850} y={1250} r={70} />
      <Text x={230} y={1430} size={44} fill={C.dark}>
        TICKET
      </Text>
      <Text x={850} y={1430} size={44} fill={C.dark}>
        PROFIT
      </Text>
    </>
  );
}

/** A slice of a ring from one share to another of the way round (0 at the top, clockwise). */
function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const at = (k: number) => {
    const a = k * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };
  const [x1, y1] = at(from);
  const [x2, y2] = at(to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 0.5 ? 1 : 0} 1 ${x2} ${y2}`;
}

function IconsSplit() {
  return (
    <>
      <rect width={W} height={H} fill={P.sky} />
      <circle cx={540} cy={860} r={520} fill={C.light} opacity={0.18} />
      <Text x={540} y={300} size={64} fill={C.dark}>
        WHERE YOUR SNACK
      </Text>
      <Text x={540} y={385} size={64} fill={C.dark}>
        DOLLAR GOES
      </Text>
      <circle cx={540} cy={820} r={300} fill="none" stroke={C.light} strokeWidth={120} />
      <path d={arc(540, 820, 300, 0, 0.82)} fill="none" stroke={C.red} strokeWidth={120} />
      <path d={arc(540, 820, 300, 0.825, 0.995)} fill="none" stroke={C.teal} strokeWidth={120} />
      {bucket(540, 815, 250)}
      <Pill x={540} y={1260} text="THE CINEMA 82¢" size={64} fill={C.red} ink={C.light} />
      <Pill
        x={540}
        y={1400}
        text="CORN, BUTTER, BUCKET 18¢"
        size={44}
        fill={C.teal}
        ink={C.light}
      />
    </>
  );
}

// ------------------------------------------------------------------ 3 2.5D

/** A point of the small world on the page: x runs to the right and down, y to the left and down. */
const iso = (x: number, y: number, z: number, cx = 540, cy = 1340) =>
  [cx + (x - y) * 0.866, cy + (x + y) * 0.5 - z] as const;
const poly = (pts: (readonly [number, number])[]) =>
  `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;

/** A block of the small world: its top lit, the face to the left in its colour, the right in shade. */
function Block({
  x0,
  x1,
  y0,
  y1,
  z0,
  z1,
  fill,
}: {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  fill: string;
}) {
  return (
    <g>
      <path
        d={poly([iso(x0, y1, z1), iso(x1, y1, z1), iso(x1, y1, z0), iso(x0, y1, z0)])}
        fill={fill}
      />
      <path
        d={poly([iso(x1, y0, z1), iso(x1, y1, z1), iso(x1, y1, z0), iso(x1, y0, z0)])}
        fill={mix(fill, C.dark, 0.28)}
      />
      <path
        d={poly([iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)])}
        fill={mix(fill, C.light, 0.3)}
      />
    </g>
  );
}

function Floor() {
  return (
    <>
      <path
        d={poly([iso(-420, -420, 0), iso(420, -420, 0), iso(420, 420, 0), iso(-420, 420, 0)])}
        fill={mix(P.mint, C.dark, 0.1)}
      />
      <path
        d={poly([iso(-420, 420, 0), iso(420, 420, 0), iso(420, 420, -40), iso(-420, 420, -40)])}
        fill={mix(P.mint, C.dark, 0.3)}
      />
      <path
        d={poly([iso(420, -420, 0), iso(420, 420, 0), iso(420, 420, -40), iso(420, -420, -40)])}
        fill={mix(P.mint, C.dark, 0.4)}
      />
    </>
  );
}

function IsoQuestion() {
  const [bx, by] = iso(40, 0, 190);
  const [sx, sy] = iso(250, -120, 470);
  return (
    <>
      <rect width={W} height={H} fill={P.mint} />
      <Text x={540} y={300} size={70} fill={C.dark}>
        WHY DOES POPCORN
      </Text>
      <Pill x={540} y={400} text="COST $10?" size={70} fill={C.red} ink={C.light} />
      <Floor />
      {/* A long soft shadow behind the machine. */}
      <path
        d={poly([iso(-230, -60, 0), iso(-40, -60, 0), iso(120, -360, 0), iso(-70, -360, 0)])}
        fill={C.dark}
        opacity={0.12}
      />
      <Block x0={-240} x1={-70} y0={-60} y1={60} z0={190} z1={500} fill={C.red} />
      {/* The machine's glass, full of popcorn, on the face toward us. */}
      <path
        d={poly([iso(-215, 60, 460), iso(-95, 60, 460), iso(-95, 60, 260), iso(-215, 60, 260)])}
        fill={C.popcorn}
      />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const [kx, ky] = iso(-200 + (i % 4) * 30, 60, 280 + Math.floor(i / 4) * 40 + (i % 2) * 12);
        return <circle key={i} cx={kx} cy={ky} r={16} fill={i % 3 ? C.butter : C.yellow} />;
      })}
      <Block x0={-300} x1={300} y0={-70} y1={70} z0={0} z1={190} fill={C.teal} />
      {bucket(bx, by - 120, 250)}
      {/* The price, floating over the counter on its own shadow. */}
      <ellipse
        cx={sx}
        cy={iso(250, -120, 190)[1] + 10}
        rx={110}
        ry={26}
        fill={C.dark}
        opacity={0.15}
      />
      <rect x={sx - 150} y={sy - 90} width={300} height={170} rx={24} fill={C.dark} />
      <Text x={sx} y={sy + 40} size={120} fill={C.yellow}>
        $10
      </Text>
    </>
  );
}

function IsoSplit() {
  const [rx, ry] = iso(-140, 0, 560);
  const [tx, ty] = iso(160, 0, 170);
  return (
    <>
      <rect width={W} height={H} fill={P.mint} />
      <Text x={540} y={300} size={64} fill={C.dark}>
        WHERE YOUR SNACK
      </Text>
      <Text x={540} y={385} size={64} fill={C.dark}>
        DOLLAR GOES
      </Text>
      <Floor />
      <Block x0={-230} x1={-50} y0={-90} y1={90} z0={0} z1={470} fill={C.red} />
      <Block x0={70} x1={250} y0={-90} y1={90} z0={0} z1={132} fill={C.teal} />
      {/* Coins stacked on the tall block. */}
      {[0, 1, 2].map((i) => {
        const [cx, cy] = iso(-140, 0, 470 + 18 + i * 26);
        return (
          <g key={i}>
            <ellipse cx={cx} cy={cy + 10} rx={70} ry={36} fill={mix(C.yellow, C.dark, 0.3)} />
            <ellipse cx={cx} cy={cy} rx={70} ry={36} fill={C.yellow} />
          </g>
        );
      })}
      <Pill x={rx} y={ry - 30} text="CINEMA 82¢" size={54} fill={C.red} ink={C.light} />
      <Pill x={tx + 60} y={ty - 40} text="18¢" size={54} fill={C.teal} ink={C.light} />
      <Text x={tx + 60} y={ty + 60} size={34} fill={C.dark}>
        CORN, BUTTER, BUCKET
      </Text>
    </>
  );
}

// ------------------------------------------------------------------ the sheet

const LOOKS: Array<{ name: string; tiles: [ReactNode, ReactNode] }> = [
  { name: '1  Big type', tiles: [<TypeQuestion key="a" />, <TypeSplit key="b" />] },
  { name: '2  Icons and shapes', tiles: [<IconsQuestion key="a" />, <IconsSplit key="b" />] },
  { name: '3  2.5D world', tiles: [<IsoQuestion key="a" />, <IsoSplit key="b" />] },
];

export const MotionLooksSheet = () => {
  const k = 0.31;
  const tw = W * k;
  const th = H * k;
  const gap = (W - 3 * tw) / 4;
  return (
    <>
      {LOOKS.map((look, col) => {
        const x = gap + col * (tw + gap);
        return (
          <g key={look.name}>
            <rect x={x} y={70} width={tw} height={70} rx={14} fill={white} />
            <text
              x={x + tw / 2}
              y={118}
              fontFamily={font}
              fontSize={36}
              fontWeight={700}
              fill={ink}
              textAnchor="middle"
            >
              {look.name}
            </text>
            {look.tiles.map((tile, row) => {
              const y = 170 + row * (th + 40);
              return (
                <g key={row}>
                  <defs>
                    <clipPath id={`motion-look-${col}-${row}`}>
                      <rect width={W} height={H} />
                    </clipPath>
                  </defs>
                  <g
                    transform={`translate(${x} ${y}) scale(${k})`}
                    clipPath={`url(#motion-look-${col}-${row})`}
                  >
                    {tile}
                  </g>
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
};
