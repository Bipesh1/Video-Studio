import { VIEWER_FONT } from '../overlays/text';
import { clamp, easeOutBack } from '../rig/math';
import { MASK_HIDE, MASK_SHOW, accent, ink, lineWeights, mix, pick, white } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * Things of a kitchen at home (Style 4), for "She Wrote Down Every Dish She Washed for a Year"
 * (2026-10-20): the counter with its sink and a stack of dishes, a plate in the hand, the two
 * notebooks (hers blue, his orange), a window where the seasons pass, a cabinet whose drawer
 * opens on his notebook, a plate shared into his and hers, and the kitchen lit in two halves.
 * Outlined, a flat fill, one shadow tone and one glint, like every prop. Head units, the ground
 * at y = 0 under the middle unless a thing says otherwise.
 */

const font = `${VIEWER_FONT}, sans-serif`;
const box = (x0: number, y0: number, x1: number, y1: number) =>
  `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
const rounded = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;

/** The counter's size: its top stands this high, and it runs this far to each side. */
export const COUNTER = { top: 1.75, half: 1.7 } as const;

/** One plate seen from the side, a little from above: a flat ellipse with its rim. */
function PlateSide({
  x,
  y,
  w,
  uid,
  food,
}: {
  x: number;
  y: number;
  w: number;
  uid: string;
  food?: string;
}) {
  const china = paintOf('cream');
  return (
    <g>
      <Shaded
        id={`${uid}-plate`}
        d={`M ${x - w} ${y} Q ${x} ${y + w * 0.32} ${x + w} ${y} Q ${x} ${y - w * 0.22} ${x - w} ${y} Z`}
        fill={white}
        shadow={china.shadow}
        offset={{ x: 0, y: -0.03 }}
        strokeWidth={lineWeights.detail}
      />
      {food && (
        <ellipse cx={x + w * 0.15} cy={y - w * 0.02} rx={w * 0.3} ry={w * 0.06} fill={food} />
      )}
    </g>
  );
}

/**
 * The kitchen counter seen from the front: cupboard doors below, a wooden top, the sink with its
 * tap, a stack of dirty dishes beside it and a rack of clean ones drying. `dishes` is how many
 * are still waiting (0 to 7).
 */
export function KitchenCounter({ uid, shadowSide, dishes = 6 }: PropProps & { dishes?: number }) {
  const doors = paintOf('cream');
  const top = paintOf('brown');
  const steel = paintOf('steel');
  const soap = paintOf('forest');
  const smear = pick(accent('orange'), 1);
  const w = COUNTER.half;
  const t = COUNTER.top;
  const off = lightOffset(shadowSide, 0.05);
  return (
    <g>
      {/* The cupboards, three doors with a handle each, on a dark plinth. */}
      <rect x={-w + 0.06} y={-0.1} width={2 * w - 0.12} height={0.1} fill={mix(ink, white, 0.25)} />
      <Shaded
        id={`${uid}-cab`}
        d={box(-w + 0.04, -t + 0.12, w - 0.04, -0.1)}
        {...doors}
        offset={off}
      />
      {[-w + 0.04 + (2 * w - 0.08) / 3, -w + 0.04 + (2 * (2 * w - 0.08)) / 3].map((x, i) =>
        detail(`M ${x} ${-t + 0.18} L ${x} ${-0.14}`, `door${i}`),
      )}
      {[-1, 0, 1].map((k) => (
        <rect
          key={k}
          x={k * ((2 * w) / 3) - 0.12}
          y={-t + 0.32}
          width={0.24}
          height={0.05}
          rx={0.025}
          fill={steel.fill}
          stroke={ink}
          strokeWidth={lineWeights.detail}
        />
      ))}
      {/* The worktop, and the sink's steel rim set into it. */}
      <Shaded
        id={`${uid}-top`}
        d={box(-w - 0.08, -t, w + 0.08, -t + 0.13)}
        {...top}
        offset={lightOffset(shadowSide, 0.03)}
      />
      <rect
        x={-1.15}
        y={-t - 0.03}
        width={1.0}
        height={0.05}
        rx={0.02}
        fill={steel.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {/* The tap: a tall steel neck curving over the sink, and its handle. */}
      <path
        d={`M -0.55 ${-t} L -0.55 ${-t - 0.62} Q -0.55 ${-t - 0.82} -0.75 ${-t - 0.82} Q -0.92 ${-t - 0.82} -0.92 ${-t - 0.62}`}
        fill="none"
        stroke={ink}
        strokeWidth={0.11}
        strokeLinecap="round"
      />
      <path
        d={`M -0.55 ${-t} L -0.55 ${-t - 0.62} Q -0.55 ${-t - 0.82} -0.75 ${-t - 0.82} Q -0.92 ${-t - 0.82} -0.92 ${-t - 0.62}`}
        fill="none"
        stroke={steel.fill}
        strokeWidth={0.07}
        strokeLinecap="round"
      />
      <rect
        x={-0.47}
        y={-t - 0.32}
        width={0.16}
        height={0.06}
        rx={0.03}
        fill={steel.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {/* A bottle of washing-up liquid by the tap. */}
      <Shaded
        id={`${uid}-soap`}
        d={rounded(-0.32, -t - 0.42, -0.16, -t, 0.05)}
        {...soap}
        offset={lightOffset(shadowSide, 0.02)}
        strokeWidth={lineWeights.detail}
      />
      <rect
        x={-0.27}
        y={-t - 0.5}
        width={0.06}
        height={0.09}
        fill={soap.shadow}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {/* The stack of dirty dishes waiting, on the right of the sink. */}
      {Array.from({ length: clamp(Math.round(dishes), 0, 7) }, (_, i) => (
        <PlateSide
          key={i}
          uid={`${uid}-dirty${i}`}
          x={0.55 + (i % 2 ? 0.03 : -0.02)}
          y={-t - 0.05 - i * 0.09}
          w={0.36}
          food={i % 3 === 0 ? smear : undefined}
        />
      ))}
      {/* The rack of clean ones drying at the end. */}
      <path
        d={`M 1.0 ${-t} L 1.6 ${-t} M 1.02 ${-t} L 1.02 ${-t - 0.3} M 1.58 ${-t} L 1.58 ${-t - 0.3}`}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {[1.13, 1.3, 1.47].map((x, i) => (
        <g key={i}>
          <ellipse
            cx={x}
            cy={-t - 0.26}
            rx={0.06}
            ry={0.26}
            fill={white}
            stroke={ink}
            strokeWidth={lineWeights.detail}
          />
        </g>
      ))}
      <Glint x={-w + 0.4} y={-t + 0.06} length={0.3} />
    </g>
  );
}

/** A clean plate held up in the hand, seen nearly face on: white with a rim. */
export function Plate({ uid, shadowSide }: PropProps) {
  const china = paintOf('cream');
  return (
    <g>
      <Shaded
        id={`${uid}-held-plate`}
        d="M -0.34 0 A 0.34 0.3 0 1 0 0.34 0 A 0.34 0.3 0 1 0 -0.34 0 Z"
        fill={white}
        shadow={china.shadow}
        offset={lightOffset(shadowSide, 0.03)}
      />
      <ellipse
        cx={0}
        cy={0}
        rx={0.22}
        ry={0.19}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      <Glint x={-0.14} y={-0.16} length={0.1} turn={-30} />
    </g>
  );
}

/** Her notebook is blue, his orange. */
export const NOTEBOOK_PAINTS = { blue: 'ocean', orange: 'orange' } as const;
export type NotebookPaint = keyof typeof NOTEBOOK_PAINTS;

/**
 * A small notebook lying shut on a table or a counter, seen a little from above: its cover on
 * top, the cream edge of its pages along the front, an elastic band round it. The bottom of the
 * pages rests at y = 0.
 */
export function NotebookLying({ uid, shadowSide, paint }: PropProps & { paint: NotebookPaint }) {
  const cover = paintOf(NOTEBOOK_PAINTS[paint]);
  const pages = paintOf('cream');
  const d = 0.12;
  return (
    <g>
      <Shaded
        id={`${uid}-nb-pages`}
        d={box(-0.3, -0.07, 0.3, 0)}
        {...pages}
        offset={{ x: 0, y: -0.02 }}
        strokeWidth={lineWeights.detail}
      />
      <Shaded
        id={`${uid}-nb-cover`}
        d={`M -0.3 -0.07 L 0.3 -0.07 L ${0.3 + d} ${-0.07 - d} L ${-0.3 + d} ${-0.07 - d} Z`}
        {...cover}
        offset={lightOffset(shadowSide, 0.02)}
        strokeWidth={lineWeights.detail}
      />
      {detail(`M 0.16 -0.07 L ${0.16 + d} ${-0.07 - d} M 0.16 -0.07 L 0.16 0`, 'band')}
      <Glint x={-0.1} y={-0.12} length={0.12} />
    </g>
  );
}

/** A notebook held shut and upright in the hand, its cover toward us. */
export function NotebookHeld({ uid, shadowSide, paint }: PropProps & { paint: NotebookPaint }) {
  const cover = paintOf(NOTEBOOK_PAINTS[paint]);
  return (
    <g>
      <Shaded
        id={`${uid}-nbh`}
        d={rounded(-0.2, -0.28, 0.2, 0.28, 0.03)}
        {...cover}
        offset={lightOffset(shadowSide, 0.03)}
      />
      {detail('M 0.1 -0.28 L 0.1 0.28', 'band')}
      <rect
        x={-0.13}
        y={-0.18}
        width={0.17}
        height={0.08}
        fill={white}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      <Glint x={-0.1} y={0.18} length={0.1} />
    </g>
  );
}

/**
 * A notebook held open to write in: two cream pages inside its coloured cover, the left one
 * full of tally marks in groups of five, the right one filling up.
 */
export function NotebookOpen({ uid, shadowSide, paint }: PropProps & { paint: NotebookPaint }) {
  const cover = paintOf(NOTEBOOK_PAINTS[paint]);
  const pages = paintOf('cream');
  const marks = (x0: number, rows: number, key: string) =>
    Array.from({ length: rows }, (_, r) =>
      [0, 1].map((g) => {
        const gx = x0 + g * 0.12;
        const gy = -0.18 + r * 0.1;
        return (
          <path
            key={`${key}${r}-${g}`}
            d={`M ${gx} ${gy} L ${gx} ${gy + 0.06} M ${gx + 0.02} ${gy} L ${gx + 0.02} ${gy + 0.06} M ${gx + 0.04} ${gy} L ${gx + 0.04} ${gy + 0.06} M ${gx + 0.06} ${gy} L ${gx + 0.06} ${gy + 0.06} M ${gx - 0.01} ${gy + 0.05} L ${gx + 0.08} ${gy + 0.01}`}
            fill="none"
            stroke={ink}
            strokeWidth={lineWeights.detail * 0.7}
          />
        );
      }),
    );
  return (
    <g>
      <Shaded
        id={`${uid}-nbo-cover`}
        d={rounded(-0.38, -0.27, 0.38, 0.25, 0.03)}
        {...cover}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <Shaded
        id={`${uid}-nbo-l`}
        d={box(-0.34, -0.24, -0.01, 0.22)}
        {...pages}
        offset={{ x: 0, y: -0.02 }}
        strokeWidth={lineWeights.detail}
      />
      <Shaded
        id={`${uid}-nbo-r`}
        d={box(0.01, -0.24, 0.34, 0.22)}
        {...pages}
        offset={{ x: 0, y: -0.02 }}
        strokeWidth={lineWeights.detail}
      />
      {marks(-0.3, 4, 'l')}
      {marks(0.05, 2, 'r')}
    </g>
  );
}

/** When a notebook dropped on the counter lands, in seconds from the start of its shot. */
export const NOTEBOOK_LANDS = 0.45;
/** How far above, in heads, a dropped notebook starts. */
const DROP_FROM = 0.8;
/** Where a dropped notebook is, how far above its place and turned, at shotT seconds. */
export function notebookDropAt(shotT: number): { up: number; turn: number; seen: number } {
  if (shotT >= NOTEBOOK_LANDS + 0.25) return { up: 0, turn: 0, seen: 1 };
  if (shotT < NOTEBOOK_LANDS) {
    const f = clamp(shotT / NOTEBOOK_LANDS, 0, 1);
    return { up: DROP_FROM * (1 - f * f), turn: -20 * (1 - f), seen: clamp(shotT / 0.12, 0, 1) };
  }
  const b = (shotT - NOTEBOOK_LANDS) / 0.25;
  return { up: 0.12 * Math.sin(Math.PI * b), turn: 0, seen: 1 };
}

/**
 * A kitchen window on the wall, its middle at the origin: a white frame, a sill, and outside a
 * tree in the garden. `season` runs 0 winter (bare, snow falling), 1 spring (blossom), 2 summer
 * (full green), 3 autumn (orange, leaves falling); `night` darkens the sky and lights the moon.
 */
export function SeasonWindow({
  uid,
  shadowSide,
  season = 0,
  night = false,
  t = 0,
}: PropProps & { season?: number; night?: boolean; t?: number }) {
  const frame = paintOf('cream');
  const W = 0.8;
  const H = 0.7;
  const s = clamp(season, 0, 3);
  const skyDay = [
    pick(accent('glint'), 1),
    pick(accent('glint'), 0),
    pick(accent('ocean'), 0),
    pick(accent('cream'), 1),
  ];
  const at = (list: readonly string[]) => {
    const i = Math.min(2, Math.floor(s));
    return mix(list[i] ?? list[0] ?? white, list[i + 1] ?? list[i] ?? white, s - i);
  };
  const sky = night ? mix(pick(accent('denim'), 1), ink, 0.45) : at(skyDay);
  const leafColour =
    s < 1
      ? white
      : s < 2
        ? mix(white, pick(accent('crimson'), 0), 0.35)
        : s < 2.6
          ? pick(accent('forest'), 0)
          : pick(accent('orange'), 0);
  const leafy = s < 0.6 ? 0 : Math.min(1, (s - 0.6) / 0.6);
  const ground = s < 0.8 ? white : pick(accent('forest'), 1);
  const clipId = `${uid}-win-clip`;
  const falling = (n: number, colour: string, r: number, speed: number) =>
    Array.from({ length: n }, (_, i) => {
      const f = (t * speed + i / n) % 1;
      const x = -W + ((i * 0.37) % 1) * 2 * W + 0.06 * Math.sin(t * 2 + i);
      return <circle key={i} cx={x} cy={-H + f * 2 * H} r={r} fill={colour} />;
    });
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={-W} y={-H} width={2 * W} height={2 * H} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={-W} y={-H} width={2 * W} height={2 * H} fill={sky} />
        {night && <circle cx={W * 0.5} cy={-H * 0.5} r={0.12} fill={pick(accent('cream'), 0)} />}
        <rect
          x={-W}
          y={H * 0.55}
          width={2 * W}
          height={H}
          fill={night ? mix(ground, ink, 0.5) : ground}
        />
        {/* The tree in the garden: its trunk and branches, its leaves by the season. */}
        <path
          d={`M 0.1 ${H} L 0.1 ${-H * 0.05} M 0.1 ${H * 0.2} L -0.25 ${-H * 0.3} M 0.1 ${H * 0.05} L 0.45 ${-H * 0.35}`}
          fill="none"
          stroke={mix(pick(accent('brown'), 0), ink, night ? 0.5 : 0)}
          strokeWidth={0.07}
          strokeLinecap="round"
        />
        {leafy > 0 &&
          [
            [0.1, -H * 0.35, 0.36],
            [-0.22, -H * 0.3, 0.24],
            [0.42, -H * 0.32, 0.24],
          ].map(([x, y, r], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={(r ?? 0) * (0.5 + 0.5 * leafy)}
              fill={night ? mix(leafColour, ink, 0.5) : leafColour}
              opacity={leafy}
            />
          ))}
        {s < 0.9 && <g opacity={1 - s / 0.9}>{falling(14, white, 0.025, 0.25)}</g>}
        {s > 2.6 && (
          <g opacity={(s - 2.6) / 0.4}>{falling(8, pick(accent('orange'), 0), 0.035, 0.18)}</g>
        )}
      </g>
      {/* The frame, its cross bars and the sill. */}
      <path
        d={`${box(-W - 0.08, -H - 0.08, W + 0.08, H + 0.08)} ${box(-W, -H, W, H)}`}
        fill={frame.fill}
        fillRule="evenodd"
        stroke={ink}
        strokeWidth={lineWeights.outline}
      />
      {detail(`M 0 ${-H} L 0 ${H} M ${-W} 0 L ${W} 0`, 'bars')}
      <path d={`M 0 ${-H} L 0 ${H} M ${-W} 0 L ${W} 0`} stroke={frame.fill} strokeWidth={0.05} />
      <Shaded
        id={`${uid}-sill`}
        d={box(-W - 0.16, H + 0.08, W + 0.16, H + 0.16)}
        {...frame}
        offset={lightOffset(shadowSide, 0.02)}
        strokeWidth={lineWeights.detail}
      />
    </g>
  );
}

/** The season of the window passing over a shot: winter to autumn in about four seconds. */
export const seasonAt = (shotT: number): number => clamp((shotT - 0.3) / 4, 0, 1) * 3;

/** The small cabinet's size: how tall, and how far to each side. */
export const CABINET = { height: 1.35, half: 0.55 } as const;
/** When its drawer opens, in seconds from the start of its shot. */
export const DRAWER_OPENS = 0.5;

/**
 * A small cabinet by the table with a drawer at the top. `open` slides the drawer out (0 shut,
 * 1 open); inside it, `holding` shows his orange notebook.
 */
export function DrawerCabinet({
  uid,
  shadowSide,
  open = 0,
  holding = true,
}: PropProps & { open?: number; holding?: boolean }) {
  const wood = paintOf('brown');
  const steel = paintOf('steel');
  const w = CABINET.half;
  const h = CABINET.height;
  const pull = 0.35 * clamp(open, 0, 1.2);
  return (
    <g>
      <Shaded
        id={`${uid}-cab-body`}
        d={box(-w, -h, w, 0)}
        {...wood}
        offset={lightOffset(shadowSide, 0.04)}
      />
      {detail(`M ${-w + 0.06} ${-h + 0.42} L ${w - 0.06} ${-h + 0.42}`, 'shelf')}
      <rect
        x={-0.1}
        y={-h + 0.7}
        width={0.2}
        height={0.05}
        rx={0.025}
        fill={steel.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {/* The drawer, sliding out toward us: drawn lower and a little wider as it comes. */}
      <g transform={`translate(0 ${pull * 0.25}) scale(${1 + pull * 0.12} 1)`}>
        {open > 0.05 && (
          <g>
            <rect
              x={-w + 0.05}
              y={-h + 0.02 - pull * 0.3}
              width={2 * w - 0.1}
              height={0.1 + pull * 0.3}
              fill={mix(wood.shadow, ink, 0.3)}
              stroke={ink}
              strokeWidth={lineWeights.detail}
            />
            {holding && (
              <g transform={`translate(0.02 ${-h + 0.06})`}>
                <NotebookLying uid={`${uid}-in-drawer`} shadowSide={shadowSide} paint="orange" />
              </g>
            )}
          </g>
        )}
        <Shaded
          id={`${uid}-drawer`}
          d={box(-w + 0.04, -h + 0.04, w - 0.04, -h + 0.38)}
          {...wood}
          offset={lightOffset(shadowSide, 0.02)}
          strokeWidth={lineWeights.detail}
        />
        <rect
          x={-0.12}
          y={-h + 0.17}
          width={0.24}
          height={0.06}
          rx={0.03}
          fill={steel.fill}
          stroke={ink}
          strokeWidth={lineWeights.detail}
        />
      </g>
      <Glint x={-w + 0.15} y={-h + 0.08} length={0.14} />
    </g>
  );
}

/** How far a drawer opening in its shot is open, at shotT seconds. */
export const drawerOpenAt = (shotT: number): number =>
  clamp(easeOutBack(clamp((shotT - DRAWER_OPENS) / 0.45, 0, 1), 1.4), 0, 1.15);

/**
 * A plate shared into his and hers, seen from above and hung in front of the scene: her share
 * (blue) slides in from the left and his (orange) from the right, each claiming more than half,
 * until together they spill over the rim. `shotT` runs it; its middle is the origin.
 */
export function SharesPlate({ uid, shadowSide, shotT = 99 }: PropProps & { shotT?: number }) {
  const china = paintOf('cream');
  const hers = paintOf('ocean');
  const his = paintOf('orange');
  const R = 1.0;
  const slide = clamp(easeOutBack(clamp(shotT / 0.8, 0, 1), 1.3), 0, 1.1);
  const grow = clamp((shotT - 0.9) / 0.8, 0, 1);
  // Each share is a half plate pushed past the middle: 0.6 of it by the end, then more.
  // Each share's straight edge sits past the middle, so each claims more than half, and grows
  // outward until the two spill over the rim.
  const over = 0.12 + 0.08 * grow;
  const stretch = 1 + 0.45 * grow;
  const Rs = R * 0.95;
  const share = (
    side: -1 | 1,
    paint: { fill: string; shadow: string },
    label: string,
    key: string,
  ) => {
    const off = side * (1 - slide) * 1.6;
    const x = -side * over;
    const d = `M ${x} ${-Rs * 0.78} A ${Rs * stretch} ${Rs * 0.78} 0 0 ${side < 0 ? 0 : 1} ${x} ${Rs * 0.78} Z`;
    return (
      <g key={key} transform={`translate(${off} 0)`} opacity={side > 0 ? 0.85 : 0.95}>
        <Shaded id={`${uid}-${key}`} d={d} {...paint} offset={lightOffset(shadowSide, 0.04)} />
        <text
          x={side * R * 0.6}
          y={0.1}
          fontFamily={font}
          fontWeight={700}
          fontSize={0.3}
          fill={white}
          stroke={ink}
          strokeWidth={0.04}
          paintOrder="stroke"
          textAnchor="middle"
        >
          {label}
        </text>
      </g>
    );
  };
  return (
    <g>
      <ellipse
        cx={0}
        cy={0.06}
        rx={R * 1.12}
        ry={R * 0.86}
        fill={china.shadow}
        stroke={ink}
        strokeWidth={lineWeights.outline}
      />
      <ellipse
        cx={0}
        cy={0}
        rx={R * 1.12}
        ry={R * 0.86}
        fill={white}
        stroke={ink}
        strokeWidth={lineWeights.outline}
      />
      <ellipse
        cx={0}
        cy={0}
        rx={R * 0.92}
        ry={R * 0.7}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {share(-1, hers, 'HERS', 'hers')}
      {share(1, his, 'HIS', 'his')}
    </g>
  );
}

/**
 * The kitchen lit in two halves, each person only on their own side: a dark veil over the
 * whole room with two pools of light, one either side of the middle (the prop's x), and a dark
 * seam between them. List it after everyone in the shot.
 */
export function SplitLight({ uid, depth = 0.6 }: { uid: string; depth?: number }) {
  const mask = `${uid}-split-mask`;
  const glow = `${uid}-split-glow`;
  return (
    <g>
      <defs>
        <radialGradient id={glow}>
          <stop offset="0.55" stopColor={MASK_HIDE} />
          <stop offset="1" stopColor={MASK_SHOW} />
        </radialGradient>
        <mask id={mask}>
          <rect x={-80} y={-80} width={160} height={160} fill={MASK_SHOW} />
          <ellipse cx={-2.0} cy={-1.9} rx={1.7} ry={2.6} fill={`url(#${glow})`} />
          <ellipse cx={2.0} cy={-1.9} rx={1.7} ry={2.6} fill={`url(#${glow})`} />
        </mask>
      </defs>
      <rect
        x={-80}
        y={-80}
        width={160}
        height={160}
        fill={ink}
        opacity={depth}
        mask={`url(#${mask})`}
      />
      <rect x={-0.04} y={-80} width={0.08} height={160} fill={ink} opacity={0.8} />
    </g>
  );
}
