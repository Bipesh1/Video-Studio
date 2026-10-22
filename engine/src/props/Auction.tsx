import { VIEWER_FONT } from '../overlays/text';
import { Hand } from '../rig/Hand';
import { clamp } from '../rig/math';
import { ink, lineWeights, tokens } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * Things for an auction (Style 4): the podium, the auctioneer's gloved hand with its gavel, a
 * plain green banknote and a bidding paddle. Each is outlined with a flat fill, one shadow tone
 * and one glint. The designs are the studio's own: the note copies no real money.
 */

const font = `${VIEWER_FONT}, sans-serif`;

/** The podium's size, in head units: its top is chest high to someone standing beside it. */
export const PODIUM = { top: 1.5, width: 1.9, front: 1.76, slab: 0.12, foot: 0.12 } as const;

/**
 * An auctioneer's podium standing on the ground with the middle of its width at the origin: a
 * wooden front with one panel, a foot, and a gold top. Things stand on it at y = -PODIUM.top.
 * Draw it after anything that comes up from behind it, and before anything on its top.
 */
export function Podium({ uid, shadowSide }: PropProps) {
  const wood = paintOf('brown');
  const top = paintOf('gold');
  const w = PODIUM.width / 2;
  const f = PODIUM.front / 2;
  const t = PODIUM.top;
  const s = PODIUM.slab;
  const foot = PODIUM.foot;
  const off = lightOffset(shadowSide, 0.05);
  return (
    <g>
      <Shaded
        id={`${uid}-podium-front`}
        d={`M ${-f} ${-foot} L ${-f} ${-t + s} L ${f} ${-t + s} L ${f} ${-foot} Z`}
        {...wood}
        offset={off}
      />
      {detail(
        `M ${-f + 0.18} ${-foot - 0.16} L ${-f + 0.18} ${-t + s + 0.18} L ${f - 0.18} ${-t + s + 0.18} L ${f - 0.18} ${-foot - 0.16} Z`,
      )}
      <Shaded
        id={`${uid}-podium-foot`}
        d={`M ${-f - 0.07} 0 L ${-f - 0.07} ${-foot} L ${f + 0.07} ${-foot} L ${f + 0.07} 0 Z`}
        {...wood}
        offset={off}
      />
      <Shaded
        id={`${uid}-podium-top`}
        d={`M ${-w} ${-t} L ${w} ${-t} L ${w} ${-t + s} L ${-w} ${-t + s} Z`}
        {...top}
        offset={off}
      />
      <Glint x={-w + 0.34} y={-t + s * 0.42} length={0.28} />
    </g>
  );
}

/** The gavel and the block it lands on, in head units. The block's bottom middle is the origin. */
const GAVEL = { block: 0.09, handle: 0.52, head: 0.34, girth: 0.21, lift: 0.2, swing: 48 } as const;

/** Seconds into a shot before a knocking gavel starts down, and how long the blow takes. */
export const GAVEL_KNOCKS = { after: 0.2, over: 0.12 } as const;

/**
 * How far up a knocking gavel is, 1 raised to 0 on the block, this many seconds into the shot:
 * it hangs a moment, comes down fast, jumps a little off the block and settles.
 */
export const gavelLiftAt = (shotT: number): number => {
  const t = (shotT - GAVEL_KNOCKS.after) / GAVEL_KNOCKS.over;
  if (t <= 0) return 1;
  if (t < 1) return 1 - t * t;
  const bounce = (shotT - GAVEL_KNOCKS.after - GAVEL_KNOCKS.over) / 0.22;
  return bounce >= 1 ? 0 : 0.16 * Math.sin(Math.PI * bounce);
};

/** How far up a gavel that is being raised is, 0 to 1, this many seconds into the shot. */
export const gavelRiseAt = (shotT: number): number => {
  const t = clamp((shotT - 0.7) / 0.4, 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * The auctioneer, as much as is ever seen: a white-gloved fist and a dark cuff that come up
 * from behind the podium, holding a wooden gavel over its block. `lift` is 0 with the gavel's
 * head on the block and 1 with it raised to strike. Stand it on the podium's top, and draw it
 * before the podium so the arm is hidden behind the front.
 */
export function GavelHand({ uid, shadowSide, lift = 0 }: PropProps & { lift?: number }) {
  const wood = paintOf('brown');
  const band = paintOf('gold');
  const sleeve = paintOf('steel');
  const k = Math.min(1, Math.max(0, lift));
  const off = lightOffset(shadowSide, 0.03);
  const { block, handle, head, girth } = GAVEL;
  // The head stands on the block; the fist is one handle's length to the side of it.
  const headY = -block - head / 2;
  const hand = { x: handle, y: headY - k * GAVEL.lift };
  const g = girth / 2;
  const h = head / 2;
  return (
    <g>
      <Shaded
        id={`${uid}-gavel-block`}
        d={`M -0.2 0 L -0.17 ${-block} L 0.17 ${-block} L 0.2 0 Z`}
        {...wood}
        offset={off}
      />
      {/* Hand space: the handle runs along x through the fist, the wrist is on the -y side. */}
      <g transform={`translate(${hand.x} ${hand.y}) rotate(${180 + k * GAVEL.swing})`}>
        <Shaded
          id={`${uid}-gavel-sleeve`}
          d="M -0.125 -0.2 L 0.125 -0.2 L 0.14 -1.2 L -0.14 -1.2 Z"
          {...sleeve}
          offset={off}
        />
        <Shaded
          id={`${uid}-gavel-handle`}
          d={`M -0.2 -0.035 L ${handle - g} -0.035 L ${handle - g} 0.035 L -0.2 0.035 Z`}
          {...wood}
          offset={lightOffset(shadowSide, 0.015)}
        />
        <Shaded
          id={`${uid}-gavel-head`}
          d={`M ${handle - g} ${-h + 0.03} Q ${handle - g} ${-h} ${handle - g + 0.03} ${-h} L ${handle + g - 0.03} ${-h} Q ${handle + g} ${-h} ${handle + g} ${-h + 0.03} L ${handle + g} ${h - 0.03} Q ${handle + g} ${h} ${handle + g - 0.03} ${h} L ${handle - g + 0.03} ${h} Q ${handle - g} ${h} ${handle - g} ${h - 0.03} Z`}
          {...wood}
          offset={off}
        />
        {[-h + 0.07, h - 0.07].map((y) => (
          <rect
            key={y}
            x={handle - g}
            y={y - 0.022}
            width={girth}
            height={0.044}
            fill={band.fill}
            stroke={ink}
            strokeWidth={lineWeights.detail}
          />
        ))}
        <Glint x={handle - g * 0.35} y={0} length={0.1} turn={90} />
        <Hand shape="grip" style="glove" thumb={1} transform="" />
      </g>
    </g>
  );
}

/** The banknote's size, in head units. Its middle is the origin. */
export const BANKNOTE = { width: 0.78, height: 0.42 } as const;

/**
 * A plain green banknote facing us, with its worth in an oval in the middle: a "1", or a "20".
 * It is a drawn note, not a picture of any real one.
 */
export function Banknote({ uid, shadowSide, worth = '1' }: PropProps & { worth?: string }) {
  const note = paintOf('forest');
  const paper = paintOf('cream');
  const w = BANKNOTE.width / 2;
  const h = BANKNOTE.height / 2;
  return (
    <g>
      <Shaded
        id={`${uid}-note`}
        d={`M ${-w} ${-h} L ${w} ${-h} L ${w} ${h} L ${-w} ${h} Z`}
        {...note}
        offset={lightOffset(shadowSide, 0.035)}
      />
      {detail(
        `M ${-w + 0.05} ${-h + 0.05} L ${w - 0.05} ${-h + 0.05} L ${w - 0.05} ${h - 0.05} L ${-w + 0.05} ${h - 0.05} Z`,
      )}
      <ellipse
        rx={0.17}
        ry={h - 0.07}
        fill={paper.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {/* The figure is set at a size a browser draws well, then scaled to the scene. */}
      <g transform="translate(0 0.085) scale(0.01)">
        <text
          textAnchor="middle"
          fontFamily={font}
          fontWeight={700}
          fontSize={worth.length > 1 ? 19 : 25}
          fill={note.shadow}
        >
          {worth}
        </text>
      </g>
      {[-1, 1].map((side) => (
        <circle
          key={side}
          cx={side * (w - 0.13)}
          r={0.035}
          fill={paper.fill}
          stroke={ink}
          strokeWidth={lineWeights.detail}
        />
      ))}
      <Glint x={-w + 0.17} y={-h + 0.1} length={0.1} />
    </g>
  );
}

/** How far above the fist the middle of a paddle's face is, in head units. */
export const PADDLE = { face: 0.3, rise: 0.5 } as const;

/** What a paddle can say, by the name a shot asks for it under: a bid, or just BID. */
export const PADDLE_MARKS = {
  paddle: 'BID',
  'paddle-5c': '5¢',
  'paddle-10c': '10¢',
  'paddle-60c': '60¢',
} as const;
export type PaddleName = keyof typeof PADDLE_MARKS;

/**
 * A bidding paddle: a round cream face with a gold rim on a short wooden handle, with a bid
 * written on it. It stays the right way up whatever the arm does. The fist closes round the
 * handle at the origin.
 */
export function Paddle({ uid, shadowSide, mark = 'BID' }: PropProps & { mark?: string }) {
  const wood = paintOf('brown');
  const face = paintOf('cream');
  const rim = paintOf('gold');
  const r = PADDLE.face;
  const cy = -PADDLE.rise;
  const off = lightOffset(shadowSide, 0.04);
  return (
    <g>
      <Shaded
        id={`${uid}-paddle-handle`}
        d={`M -0.04 0.17 L -0.04 ${cy + r - 0.02} L 0.04 ${cy + r - 0.02} L 0.04 0.17 Z`}
        {...wood}
        offset={lightOffset(shadowSide, 0.015)}
      />
      <Shaded
        id={`${uid}-paddle-rim`}
        d={`M ${-r} ${cy} A ${r} ${r} 0 1 0 ${r} ${cy} A ${r} ${r} 0 1 0 ${-r} ${cy} Z`}
        {...rim}
        offset={off}
      />
      <circle
        cy={cy}
        r={r - 0.055}
        fill={face.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
        strokeLinejoin={tokens.line.join}
      />
      {/* The bid is set at a size a browser draws well, then scaled to the scene. */}
      <g transform={`translate(0 ${cy + (mark.length > 3 ? 0.055 : 0.075)}) scale(0.01)`}>
        <text
          textAnchor="middle"
          fontFamily={font}
          fontWeight={700}
          fontSize={mark.length > 3 ? 15.5 : 21}
          fill={ink}
        >
          {mark}
        </text>
      </g>
      <Glint x={-r * 0.5} y={cy - r * 0.58} length={0.09} turn={-35} />
    </g>
  );
}

/** The jar's size, in head units. It stands on the ground with its middle at the origin. */
export const CASH_JAR = { width: 1.5, height: 2.7, neck: 1.0, lid: 0.2 } as const;

/**
 * A huge glass jar with a gold lid: stuffed to the neck with banknotes, or nearly empty with a
 * few coins on its bottom. `hand` lays the auctioneer's other gloved hand on the lid, the arm
 * going down behind the jar. It stands behind the podium and behind people.
 */
export function CashJar({
  uid,
  shadowSide,
  holds = 'notes',
  hand = false,
}: PropProps & { holds?: 'notes' | 'coins'; hand?: boolean }) {
  const glass = paintOf('glint');
  const note = paintOf('forest');
  const band = paintOf('cream');
  const lid = paintOf('gold');
  const sleeve = paintOf('steel');
  const w = CASH_JAR.width / 2;
  const n = CASH_JAR.neck / 2;
  const top = -CASH_JAR.height + CASH_JAR.lid;
  const shoulder = top + 0.38;
  const body = `M ${-w + 0.08} 0 Q ${-w} 0 ${-w} -0.08 L ${-w} ${shoulder} Q ${-w} ${top + 0.1} ${-n} ${top + 0.06} L ${-n} ${top} L ${n} ${top} L ${n} ${top + 0.06} Q ${w} ${top + 0.1} ${w} ${shoulder} L ${w} -0.08 Q ${w} 0 ${w - 0.08} 0 Z`;
  const off = lightOffset(shadowSide, 0.04);
  // Bundles of notes pushed in any way they would go: rows a little off each other, each with
  // its paper band.
  const rows = 15;
  const bundle = { w: 0.46, h: 0.165 };
  const stuffed = Array.from({ length: rows }, (_, row) => {
    const y = -0.03 - row * bundle.h;
    const shift = [0, 0.19, -0.11, 0.07, -0.2][row % 5] ?? 0;
    return [-1.5, -0.5, 0.5, 1.5].map((col) => {
      const x = col * (bundle.w + 0.015) + shift;
      const lean = ((row * 7 + (col + 2) * 3) % 5) - 2;
      return (
        <g key={`${row}-${col}`} transform={`translate(${x} ${y}) rotate(${lean * 2.2})`}>
          <rect
            x={-bundle.w / 2}
            y={-bundle.h}
            width={bundle.w}
            height={bundle.h}
            fill={(row + col) % 3 === 0 ? note.shadow : note.fill}
            stroke={ink}
            strokeWidth={lineWeights.detail}
          />
          <rect
            x={-bundle.w * 0.13}
            y={-bundle.h}
            width={bundle.w * 0.26}
            height={bundle.h}
            fill={band.fill}
            stroke={ink}
            strokeWidth={lineWeights.detail}
          />
        </g>
      );
    });
  });
  const coin = (x: number, y: number, key: string) => (
    <ellipse
      key={key}
      cx={x}
      cy={y}
      rx={0.2}
      ry={0.07}
      fill={lid.fill}
      stroke={ink}
      strokeWidth={lineWeights.detail}
    />
  );
  return (
    <g>
      {hand && (
        // The arm, where it comes down behind the jar.
        <path
          d={`M 0.4 ${-CASH_JAR.height - 0.2} L 0.56 ${-CASH_JAR.height - 0.2} Q 0.68 ${-CASH_JAR.height - 0.2} 0.68 ${-CASH_JAR.height - 0.06} L 0.68 -1.4 L 0.42 -1.4 Z`}
          fill={sleeve.fill}
          stroke={ink}
          strokeWidth={lineWeights.outline}
          strokeLinejoin={tokens.line.join}
        />
      )}
      <defs>
        <clipPath id={`${uid}-jar-inside`}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill={glass.fill} fillOpacity={0.3} />
      <g clipPath={`url(#${uid}-jar-inside)`}>
        {holds === 'notes' ? (
          stuffed
        ) : (
          <>
            {/* Piled in the corner that shows beside a podium the jar stands behind. */}
            {coin(0.26, -0.08, 'a')}
            {coin(0.52, -0.08, 'b')}
            {coin(0.5, -0.17, 'c')}
            {coin(0.53, -0.26, 'd')}
          </>
        )}
      </g>
      <path
        d={body}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline}
        strokeLinejoin={tokens.line.join}
      />
      <Shaded
        id={`${uid}-jar-lid`}
        d={`M ${-n - 0.06} ${top} L ${-n - 0.06} ${-CASH_JAR.height} L ${n + 0.06} ${-CASH_JAR.height} L ${n + 0.06} ${top} Z`}
        {...lid}
        offset={off}
      />
      {detail(
        `M ${-n - 0.06} ${top - CASH_JAR.lid * 0.5} L ${n + 0.06} ${top - CASH_JAR.lid * 0.5}`,
      )}
      <Glint x={-w + 0.13} y={-1.5} length={0.5} turn={90} />
      {hand && (
        <>
          <path
            d={`M 0.12 ${-CASH_JAR.height - 0.2} L 0.56 ${-CASH_JAR.height - 0.2} L 0.56 ${-CASH_JAR.height - 0.005} L 0.12 ${-CASH_JAR.height - 0.005} Z`}
            fill={sleeve.fill}
            stroke={ink}
            strokeWidth={lineWeights.outline}
            strokeLinejoin={tokens.line.join}
          />
          <Hand
            shape="mitten"
            style="glove"
            thumb={-1}
            transform={`translate(-0.08 ${-CASH_JAR.height - 0.1}) rotate(94)`}
          />
        </>
      )}
    </g>
  );
}
