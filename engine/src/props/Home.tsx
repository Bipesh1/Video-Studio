import { clamp, easeOutBack } from '../rig/math';
import { ink, lineWeights, tokens } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * Things for an evening at home on the phone (Style 4): the phone, the messages piling up in
 * a chat, and a clock on the wall whose hands run away with the night. Each is outlined with a
 * flat fill, one shadow tone and one glint. No app, logo or brand is drawn.
 */

/** The phone's size, in head units. The fist closes round its lower end, at the origin. */
export const PHONE = { width: 0.27, height: 0.5, grip: 0.12 } as const;

/** A phone held up in a fist, its lit screen toward us. */
export function Phone({ uid, shadowSide }: PropProps) {
  const body = paintOf('steel');
  const screen = paintOf('glint');
  const w = PHONE.width / 2;
  const top = -(PHONE.height - PHONE.grip);
  const bottom = PHONE.grip;
  return (
    <g>
      <Shaded
        id={`${uid}-phone`}
        d={`M ${-w + 0.04} ${top} L ${w - 0.04} ${top} Q ${w} ${top} ${w} ${top + 0.04} L ${w} ${bottom - 0.04} Q ${w} ${bottom} ${w - 0.04} ${bottom} L ${-w + 0.04} ${bottom} Q ${-w} ${bottom} ${-w} ${bottom - 0.04} L ${-w} ${top + 0.04} Q ${-w} ${top} ${-w + 0.04} ${top} Z`}
        {...body}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <rect
        x={-w + 0.03}
        y={top + 0.04}
        width={PHONE.width - 0.06}
        height={PHONE.height - 0.1}
        rx={0.02}
        fill={screen.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      <Glint x={-w + 0.085} y={top + 0.1} length={0.07} turn={-40} />
    </g>
  );
}

/** How many messages a chat can hold, and how long each takes to arrive, in seconds. */
export const CHAT = { most: 5, every: 0.42, width: 1.7, row: 0.4 } as const;

/** How many messages are up this many seconds into the shot: one at once, then one after another. */
export const chatCountAt = (shotT: number): number =>
  clamp(1 + Math.floor(Math.max(0, shotT) / CHAT.every), 1, CHAT.most);

/**
 * A chat filling up: message bubbles one under another, theirs on the left in cream and yours
 * on the right in blue, each with a line or two of writing that cannot be read. `shotT` brings
 * them in one at a time, each with a small pop. The middle of the stack is the origin.
 */
export function ChatBubbles({ uid, shadowSide, shotT = 99 }: PropProps & { shotT?: number }) {
  const theirs = paintOf('cream');
  const yours = paintOf('glint');
  const count = chatCountAt(shotT);
  const half = CHAT.width / 2;
  const top = -(CHAT.most * CHAT.row) / 2;
  // Each message: which side it is on and how long it is.
  const messages = [
    { mine: false, w: 1.05 },
    { mine: true, w: 0.9 },
    { mine: false, w: 1.2 },
    { mine: true, w: 1.1 },
    { mine: false, w: 0.8 },
  ];
  return (
    <g>
      {messages.slice(0, count).map((m, i) => {
        const h = CHAT.row - 0.09;
        const x = m.mine ? half - m.w : -half;
        const y = top + i * CHAT.row;
        const paint = m.mine ? yours : theirs;
        // The newest one pops in.
        const age = shotT - i * CHAT.every;
        const s = i === 0 ? 1 : easeOutBack(clamp(age / 0.16, 0, 1), 1.9);
        if (s <= 0) return null;
        const cx = x + m.w / 2;
        const cy = y + h / 2;
        const tailX = m.mine ? x + m.w - 0.12 : x + 0.12;
        const lean = m.mine ? 0.1 : -0.1;
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
            <Shaded
              id={`${uid}-chat-${i}`}
              d={`M ${x + 0.1} ${y} L ${x + m.w - 0.1} ${y} Q ${x + m.w} ${y} ${x + m.w} ${y + 0.1} L ${x + m.w} ${y + h - 0.1} Q ${x + m.w} ${y + h} ${x + m.w - 0.1} ${y + h} L ${tailX + 0.07} ${y + h} L ${tailX + lean} ${y + h + 0.09} L ${tailX - 0.07} ${y + h} L ${x + 0.1} ${y + h} Q ${x} ${y + h} ${x} ${y + h - 0.1} L ${x} ${y + 0.1} Q ${x} ${y} ${x + 0.1} ${y} Z`}
              {...paint}
              offset={lightOffset(shadowSide, 0.025)}
            />
            {detail(`M ${x + 0.14} ${y + h * 0.42} L ${x + m.w - 0.16} ${y + h * 0.42}`, 'a')}
            {m.w > 1 &&
              detail(`M ${x + 0.14} ${y + h * 0.7} L ${x + m.w * 0.55} ${y + h * 0.7}`, 'b')}
          </g>
        );
      })}
    </g>
  );
}

/** The wall clock's radius, in head units. Its middle is the origin. */
export const CLOCK_RADIUS = 0.62;

/** Where a spinning clock starts, and how many hours it runs through each second. */
export const CLOCK_RUNS = { from: 9, perSecond: 1.6 } as const;

/** How long a clock set to creep (`at` to `until`) takes to get there, in seconds. */
export const CLOCK_CREEP_SECONDS = 2.5;

/**
 * A round wall clock with a gold rim. Given `shotT` its hands run away: it starts at nine in
 * the evening and is past midnight two seconds later. Without it, it stands at nine. `at` sets
 * it to a time instead (in hours: 4.25 is a quarter past four); with `until` too, the minute
 * hand creeps from `at` to `until` over the first CLOCK_CREEP_SECONDS of its shot.
 */
export function WallClock({
  uid,
  shadowSide,
  shotT = 0,
  at,
  until,
}: PropProps & { shotT?: number; at?: number; until?: number }) {
  const rim = paintOf('gold');
  const face = paintOf('cream');
  const r = CLOCK_RADIUS;
  const hours =
    at === undefined
      ? CLOCK_RUNS.from + Math.max(0, shotT) * CLOCK_RUNS.perSecond
      : until === undefined
        ? at
        : at + (until - at) * clamp(shotT / CLOCK_CREEP_SECONDS, 0, 1);
  const hourTurn = (hours % 12) * 30;
  const minuteTurn = (hours % 1) * 360;
  const hand = (turn: number, length: number, weight: number, key: string) => (
    <line
      key={key}
      x1={0}
      y1={0.06}
      x2={0}
      y2={-length}
      stroke={ink}
      strokeWidth={weight}
      strokeLinecap={tokens.line.cap}
      transform={`rotate(${turn})`}
    />
  );
  return (
    <g>
      <Shaded
        id={`${uid}-clock-rim`}
        d={`M ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 Z`}
        {...rim}
        offset={lightOffset(shadowSide, 0.05)}
      />
      <circle r={r - 0.09} fill={face.fill} stroke={ink} strokeWidth={lineWeights.detail} />
      {[0, 90, 180, 270].map((turn) => (
        <line
          key={turn}
          x1={0}
          y1={-(r - 0.14)}
          x2={0}
          y2={-(r - 0.24)}
          stroke={ink}
          strokeWidth={lineWeights.detail * 1.6}
          strokeLinecap={tokens.line.cap}
          transform={`rotate(${turn})`}
        />
      ))}
      {hand(hourTurn, r * 0.42, lineWeights.limb * 0.7, 'hour')}
      {hand(minuteTurn, r * 0.66, lineWeights.limb * 0.45, 'minute')}
      <circle r={0.04} fill={ink} />
      <Glint x={-r * 0.5} y={-r * 0.62} length={0.12} turn={-40} />
    </g>
  );
}
