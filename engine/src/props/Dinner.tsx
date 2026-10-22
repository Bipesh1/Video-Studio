import { clamp } from '../rig/math';
import { ink, lineWeights, tokens, white } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { GAME_TABLE } from './Game';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * A dinner out (Style 4), drawn for the first game theory comedy short, "Why Splitting the Bill
 * Makes Everyone Order More" (2026-10-16): the restaurant table under a white cloth, a salad, a
 * lobster, a glass of water, a menu, the waiter's jug, and the bill that will not stop
 * unrolling. Each is outlined with a flat fill, one shadow tone and one glint; no brand or
 * logo is drawn. Sizes are in head units, the ground (or the table top) at y = 0.
 */

/** The table's size: as wide and as high as the game table, so four sit at it the same way. */
export const DINING_TABLE = { top: GAME_TABLE.top, width: GAME_TABLE.width, cloth: 1.28 } as const;

const cloth = { fill: white, shadow: tokens.fill.headShadow };

/**
 * A restaurant table seen from the side, under a white cloth that falls in soft folds to a
 * wavy hem above the floor, two dark legs below it. Things stand on it at y = -DINING_TABLE.top.
 * Draw it after the people who sit at it.
 */
export function DiningTable({ uid, shadowSide }: PropProps) {
  const t = DINING_TABLE.top;
  const w = DINING_TABLE.width / 2;
  const c = DINING_TABLE.cloth;
  const hem = -0.32;
  const legs = paintOf('steel');
  const off = lightOffset(shadowSide, 0.05);
  // The hem: five soft scallops from left to right.
  const n = 5;
  const step = (2 * (c + 0.1)) / n;
  const scallops = Array.from({ length: n }, (_, i) => {
    const x2 = c + 0.1 - (i + 1) * step;
    const mid = c + 0.1 - (i + 0.5) * step;
    return `Q ${mid} ${hem + 0.09} ${x2} ${hem}`;
  }).join(' ');
  return (
    <g>
      {[-0.9, 0.9].map((x) => (
        <Shaded
          key={x}
          id={`${uid}-leg-${x}`}
          d={`M ${x - 0.05} ${hem} L ${x + 0.05} ${hem} L ${x + 0.06} 0 L ${x - 0.06} 0 Z`}
          {...legs}
          offset={off}
        />
      ))}
      <Shaded
        id={`${uid}-cloth`}
        d={`M ${-c} ${-t + 0.08} L ${c} ${-t + 0.08} L ${c + 0.1} ${hem} ${scallops} Z`}
        {...cloth}
        offset={off}
      />
      {/* Folds, each from under the top down to a scallop, none the same length. */}
      {detail(`M ${-0.5} ${-t + 0.3} Q ${-0.56} ${-0.7} ${-0.6} ${hem + 0.06}`, 'f1')}
      {detail(`M ${0.42} ${-t + 0.42} Q ${0.47} ${-0.8} ${0.55} ${hem + 0.04}`, 'f2')}
      {detail(`M ${-1.05} ${-t + 0.5} Q ${-1.1} ${-0.7} ${-1.16} ${hem + 0.05}`, 'f3')}
      <Shaded
        id={`${uid}-top`}
        d={`M ${-w} ${-t} L ${w} ${-t} L ${w} ${-t + 0.1} L ${-w} ${-t + 0.1} Z`}
        {...cloth}
        offset={off}
      />
    </g>
  );
}

/** A white plate seen almost from the side, at the origin on the table top. */
function Plate({ uid, shadowSide, r }: PropProps & { r: number }) {
  return (
    <Shaded
      id={`${uid}-plate`}
      d={`M ${-r} -0.04 Q ${-r} 0 ${-r * 0.7} 0.005 L ${r * 0.7} 0.005 Q ${r} 0 ${r} -0.04 Q 0 -0.1 ${-r} -0.04 Z`}
      fill={white}
      shadow={tokens.fill.headShadow}
      offset={lightOffset(shadowSide, 0.015)}
    />
  );
}

/** A small salad: a few leaves and two slices of tomato on a plate. Small, as it is meant to look. */
export function SaladPlate({ uid, shadowSide }: PropProps) {
  const leaf = paintOf('forest');
  const tomato = paintOf('orange');
  const off = lightOffset(shadowSide, 0.012);
  const leaves = [
    [-0.09, -0.08, -20],
    [0.07, -0.09, 25],
    [-0.01, -0.12, 0],
  ] as const;
  return (
    <g>
      <Plate uid={uid} shadowSide={shadowSide} r={0.27} />
      {leaves.map(([x, y, turn], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${turn})`}>
          <Shaded
            id={`${uid}-leaf-${i}`}
            d="M -0.09 0.02 Q -0.05 -0.07 0.09 -0.02 Q 0.04 0.05 -0.09 0.02 Z"
            {...leaf}
            offset={off}
          />
        </g>
      ))}
      {[-0.04, 0.06].map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={-0.12 + i * 0.02}
          r={0.035}
          fill={tomato.fill}
          stroke={ink}
          strokeWidth={lineWeights.detail}
        />
      ))}
    </g>
  );
}

/**
 * A whole cooked lobster on a big plate: the shell red-orange, a curled segmented tail, two big
 * claws held up, long feelers and two small black eyes. The most expensive thing on the menu.
 */
export function LobsterPlate({ uid, shadowSide }: PropProps) {
  const shell = paintOf('orange');
  const off = lightOffset(shadowSide, 0.015);
  return (
    <g>
      <Plate uid={uid} shadowSide={shadowSide} r={0.42} />
      {/* Feelers first, behind the head. */}
      <path
        d="M -0.2 -0.15 Q -0.36 -0.42 -0.12 -0.55 M -0.17 -0.17 Q -0.26 -0.4 -0.02 -0.47"
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.detail}
        strokeLinecap="round"
      />
      {/* The tail, curled down at the end, in segments. */}
      <Shaded
        id={`${uid}-tail`}
        d="M 0.02 -0.18 Q 0.2 -0.24 0.33 -0.15 Q 0.4 -0.08 0.34 -0.03 L 0.24 -0.03 Q 0.27 -0.08 0.2 -0.11 Q 0.1 -0.13 0.02 -0.06 Z"
        {...shell}
        offset={off}
      />
      {detail('M 0.11 -0.2 Q 0.13 -0.15 0.1 -0.12', 't1')}
      {detail('M 0.2 -0.21 Q 0.23 -0.16 0.2 -0.11', 't2')}
      {detail('M 0.28 -0.18 Q 0.31 -0.13 0.28 -0.08', 't3')}
      {/* The body and head. */}
      <Shaded
        id={`${uid}-body`}
        d="M -0.28 -0.1 Q -0.3 -0.22 -0.12 -0.24 Q 0.06 -0.24 0.06 -0.12 Q 0.04 -0.04 -0.12 -0.04 Q -0.27 -0.04 -0.28 -0.1 Z"
        {...shell}
        offset={off}
      />
      {/* Two big claws, held up. */}
      {[
        [-0.3, -0.32, -25],
        [0.0, -0.36, 20],
      ].map(([x, y, turn], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${turn})`}>
          <path
            d={`M 0.02 0.16 L 0.05 0.04`}
            stroke={ink}
            strokeWidth={lineWeights.outline * 3}
            strokeLinecap="round"
          />
          <Shaded
            id={`${uid}-claw-${i}`}
            d="M -0.02 0.06 Q -0.1 -0.02 -0.05 -0.12 L 0.0 -0.04 L 0.04 -0.13 Q 0.13 -0.03 0.08 0.06 Q 0.03 0.1 -0.02 0.06 Z"
            {...shell}
            offset={off}
          />
        </g>
      ))}
      <circle cx={-0.21} cy={-0.17} r={0.016} fill={ink} />
      <circle cx={-0.15} cy={-0.18} r={0.016} fill={ink} />
      <Glint x={-0.1} y={-0.2} length={0.08} />
    </g>
  );
}

/** A tall glass of water standing on the table: clear glass, blue water, one glint. */
export function WaterGlass({ uid, shadowSide }: PropProps) {
  const water = paintOf('glint');
  return (
    <g>
      <Shaded
        id={`${uid}-water`}
        d="M -0.075 -0.24 L 0.075 -0.24 L 0.065 0 L -0.065 0 Z"
        {...water}
        offset={lightOffset(shadowSide, 0.012)}
        outline={false}
      />
      <path
        d="M -0.09 -0.33 L 0.09 -0.33 L 0.07 0 L -0.07 0 Z"
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline}
        strokeLinejoin="round"
      />
      {detail('M -0.075 -0.24 L 0.075 -0.24', 'top')}
      <Glint x={-0.035} y={-0.2} length={0.1} turn={88} />
    </g>
  );
}

/** The waiter's jug, held by its handle in a fist at the origin: glass, with water in it. */
export function WaterJug({ uid, shadowSide }: PropProps) {
  const water = paintOf('glint');
  return (
    <g transform="translate(0.16 0)">
      <Shaded
        id={`${uid}-jug-water`}
        d="M -0.13 -0.18 L 0.13 -0.18 L 0.12 0.2 L -0.12 0.2 Z"
        {...water}
        offset={lightOffset(shadowSide, 0.015)}
        outline={false}
      />
      <path
        d="M -0.15 -0.3 L 0.12 -0.3 L 0.2 -0.36 L 0.15 -0.22 L 0.14 0.2 Q 0.14 0.24 0.1 0.24 L -0.11 0.24 Q -0.15 0.24 -0.15 0.2 Z"
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline}
        strokeLinejoin="round"
      />
      {/* The handle, which the fist holds. */}
      <path
        d="M -0.15 -0.18 Q -0.3 -0.16 -0.3 0 Q -0.3 0.12 -0.15 0.12"
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline * 3}
        strokeLinecap="round"
      />
      {detail('M -0.13 -0.18 L 0.13 -0.18', 'level')}
      <Glint x={0.07} y={-0.02} length={0.16} turn={88} />
    </g>
  );
}

/** A menu held up in a fist at its lower edge: a tall card in a crimson cover with a gold border. */
export function Menu({ uid, shadowSide }: PropProps) {
  const cover = paintOf('crimson');
  const gold = paintOf('gold');
  return (
    <g>
      <Shaded
        id={`${uid}-menu`}
        d="M -0.2 -0.62 L 0.2 -0.62 L 0.2 0.08 L -0.2 0.08 Z"
        {...cover}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <rect
        x={-0.15}
        y={-0.56}
        width={0.3}
        height={0.58}
        fill="none"
        stroke={gold.fill}
        strokeWidth={lineWeights.outline * 1.4}
      />
      {/* A small fork and knife in gold, the only picture on it. */}
      <path
        d="M -0.04 -0.4 L -0.04 -0.16 M 0.04 -0.4 L 0.04 -0.16 M -0.065 -0.4 L -0.065 -0.33 M -0.015 -0.4 L -0.015 -0.33"
        stroke={gold.fill}
        strokeWidth={lineWeights.outline * 1.6}
        strokeLinecap="round"
      />
    </g>
  );
}

/** How long the bill takes to run out to its full length, seconds into its shot. */
export const BILL_UNROLL_S = 1.8;

/**
 * The bill that will not stop: it lands on the table, then unrolls over the front edge, down
 * the cloth to the floor and away along it, covered in lines of small print. `shotT` runs it
 * out; left out, it is all the way out. Stood on the ground at the table's middle, it starts
 * from the table top at `from` and runs out to the right.
 */
export function LongBill({ uid, shadowSide, shotT }: PropProps & { shotT?: number }) {
  const p = shotT === undefined ? 1 : clamp(shotT / BILL_UNROLL_S, 0, 1);
  const t = DINING_TABLE.top;
  const edge = DINING_TABLE.width / 2;
  const w = 0.24;
  // The strip's path: across the table top, down over the edge, along the floor.
  const along = 0.9 + 1.2 + 2.6;
  const out = 0.25 + (along - 0.25) * (p * (2 - p));
  const pts: Array<[number, number]> = [];
  for (let s = 0; s <= out; s += 0.05) {
    if (s < 0.9) pts.push([edge - 0.9 + s, -t]);
    else if (s < 0.9 + 1.2) pts.push([edge + 0.06, -t + (s - 0.9)]);
    else pts.push([edge + 0.06 + (s - 2.1), -0.02]);
  }
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  return (
    <g>
      <path
        d={line}
        fill="none"
        stroke={ink}
        strokeWidth={w + lineWeights.outline * 2}
        strokeLinejoin="round"
      />
      <path
        id={`${uid}-bill`}
        d={line}
        fill="none"
        stroke={white}
        strokeWidth={w}
        strokeLinejoin="round"
        opacity={1}
      />
      <path
        d={line}
        fill="none"
        stroke={shadowSide > 0 ? tokens.fill.headShadow : white}
        strokeWidth={w * 0.25}
        strokeDasharray="0.06 0.09"
        strokeLinecap="butt"
        transform={`translate(0 ${w * 0.2})`}
      />
      <path
        d={line}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.detail * 1.4}
        strokeDasharray="0.1 0.08"
        transform={`translate(0 ${-w * 0.15})`}
      />
    </g>
  );
}
