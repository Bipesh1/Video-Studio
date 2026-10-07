import { accent, ink, lineWeights, pick, tokens, white } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * Things for a story about money and bills (Style 4): an envelope that glows, a bill, a pile
 * of bills, stacks of coins, and the three things a home pays for: coal, fuel and bread. Each
 * is outlined with a flat fill, one shadow tone and one glint. Light is not a thing: a glow
 * has no outline.
 */

/** The envelope's size, in head units. Its middle is the origin. */
export const ENVELOPE = { width: 0.66, height: 0.44 } as const;

/** A gold envelope with a small seal, warm enough to light a room. `t` makes the glow breathe. */
export function Envelope({
  uid,
  shadowSide,
  t = 0,
  glow = true,
}: PropProps & { t?: number; glow?: boolean }) {
  const gold = paintOf('gold');
  const seal = paintOf('orange');
  const w = ENVELOPE.width / 2;
  const h = ENVELOPE.height / 2;
  const breathe = 1 + 0.05 * Math.sin(t * 2.4);
  return (
    <g>
      {glow && (
        <>
          <circle r={1.3 * breathe} fill={gold.fill} opacity={0.13} />
          <circle r={0.74 * breathe} fill={gold.fill} opacity={0.22} />
        </>
      )}
      <Shaded
        id={`${uid}-envelope`}
        d={`M ${-w} ${-h} L ${w} ${-h} L ${w} ${h} L ${-w} ${h} Z`}
        {...gold}
        offset={lightOffset(shadowSide, 0.04)}
      />
      {detail(`M ${-w} ${-h} L 0 ${h * 0.16} L ${w} ${-h}`)}
      {detail(`M ${-w} ${h} L ${-w * 0.3} ${-h * 0.1}`)}
      {detail(`M ${w} ${h} L ${w * 0.3} ${-h * 0.1}`)}
      <circle
        cy={h * 0.16}
        r={0.07}
        fill={seal.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      <Glint x={-w * 0.56} y={h * 0.62} length={0.1} />
    </g>
  );
}

/** The bill's size, in head units. Its middle is the origin. */
export const BILL = { width: 0.54, height: 0.7 } as const;

/** A bill: a cream sheet with a gold band across the top and a few lines of writing. */
export function Bill({ uid, shadowSide }: PropProps) {
  const paper = paintOf('cream');
  const gold = paintOf('gold');
  const w = BILL.width / 2;
  const h = BILL.height / 2;
  return (
    <g>
      <Shaded
        id={`${uid}-bill`}
        d={`M ${-w} ${-h} L ${w} ${-h} L ${w} ${h} L ${-w} ${h} Z`}
        {...paper}
        offset={lightOffset(shadowSide, 0.035)}
      />
      <rect x={-w * 0.72} y={-h * 0.74} width={w * 1.44} height={h * 0.2} fill={gold.fill} />
      {detail(`M ${-w * 0.72} ${-h * 0.26} L ${w * 0.62} ${-h * 0.26}`)}
      {detail(`M ${-w * 0.72} ${h * 0.02} L ${w * 0.4} ${h * 0.02}`)}
      {detail(`M ${-w * 0.72} ${h * 0.3} L ${w * 0.62} ${h * 0.3}`)}
      {detail(`M ${-w * 0.1} ${h * 0.64} L ${w * 0.72} ${h * 0.64}`)}
    </g>
  );
}

/** A pile of ordinary bills lying on a table, its bottom at the origin. */
export function Bills({ uid, shadowSide }: PropProps) {
  const paper = paintOf('cream');
  const sheet = (dx: number, dy: number, lean: number, key: string, fill: string) => (
    <g key={key} transform={`translate(${dx} ${dy})`}>
      <Shaded
        id={`${uid}-bills-${key}`}
        d={`M -0.36 0 L 0.24 0 L ${0.36 + lean} -0.15 L ${-0.24 + lean} -0.15 Z`}
        fill={fill}
        shadow={paper.shadow}
        offset={lightOffset(shadowSide, 0.03)}
      />
      {detail(`M ${-0.18 + lean * 0.6} -0.09 L ${0.2 + lean * 0.6} -0.09`)}
    </g>
  );
  return (
    <g>
      {sheet(0.04, 0, 0.02, 'a', paper.fill)}
      {sheet(-0.03, -0.05, -0.03, 'b', white)}
      {sheet(0.02, -0.1, 0.04, 'c', paper.fill)}
    </g>
  );
}

/** One coin of a stack, seen from the side, in head units. */
const COIN = { half: 0.23, thick: 0.078, tilt: 0.07 } as const;

/** How tall a stack of this many coins is, in head units. */
export const stackHeight = (coins: number): number => coins * COIN.thick;

/** A stack of gold coins standing on its bottom at the origin: a dozen, or a tower of them. */
export function CoinStack({ uid, shadowSide, coins = 12 }: PropProps & { coins?: number }) {
  const gold = paintOf('gold');
  const { half, thick, tilt } = COIN;
  const top = -stackHeight(coins);
  const edges = Array.from({ length: coins - 1 }, (_, i) => -(i + 1) * thick);
  return (
    <g>
      <Shaded
        id={`${uid}-stack`}
        d={`M ${-half} 0 L ${-half} ${top} A ${half} ${tilt} 0 0 1 ${half} ${top} L ${half} 0 A ${half} ${tilt} 0 0 1 ${-half} 0 Z`}
        {...gold}
        offset={lightOffset(shadowSide, 0.05)}
      />
      {/* The edges of the coins are the gold's own shadow tone, so a tall stack is not all ink. */}
      {edges.map((y) => (
        <path
          key={y}
          d={`M ${-half} ${y} A ${half} ${tilt} 0 0 0 ${half} ${y}`}
          fill="none"
          stroke={gold.shadow}
          strokeWidth={lineWeights.detail * 1.5}
        />
      ))}
      <ellipse
        cy={top}
        rx={half}
        ry={tilt}
        fill={gold.fill}
        stroke={ink}
        strokeWidth={lineWeights.outline}
      />
      <ellipse cy={top} rx={half * 0.56} ry={tilt * 0.5} fill={gold.shadow} />
      <Glint x={-half * 0.55} y={top * 0.5} length={Math.min(0.3, -top * 0.4)} turn={90} />
    </g>
  );
}

/** A lump of coal with the print of an old fern in it, standing on its bottom at the origin. */
export function Coal({ uid, shadowSide }: PropProps) {
  const dark = paintOf('steel');
  const leaf = paintOf('forest');
  const fern = [-0.16, -0.06, 0.04, 0.14].flatMap((x, i) => {
    const y = -0.14 - i * 0.045;
    return [
      `M ${x} ${y} q 0.02 -0.1 0.1 -0.1 q -0.02 0.08 -0.1 0.1 Z`,
      `M ${x} ${y} q 0.08 0.01 0.1 0.08 q -0.08 -0.01 -0.1 -0.08 Z`,
    ];
  });
  return (
    <g>
      <Shaded
        id={`${uid}-coal`}
        d="M -0.38 0 L -0.46 -0.2 L -0.26 -0.44 L 0.06 -0.5 L 0.36 -0.36 L 0.46 -0.12 L 0.32 0 Z"
        {...dark}
        offset={lightOffset(shadowSide, 0.05)}
      />
      <path d="M -0.26 -0.44 L -0.1 -0.3 L 0.06 -0.5 Z" fill={pick(accent('steel'), 2)} />
      {detail('M -0.1 -0.3 L -0.2 -0.04')}
      {detail('M -0.1 -0.3 L 0.3 -0.2 L 0.46 -0.12')}
      <path
        d="M -0.2 -0.1 Q 0 -0.2 0.24 -0.3"
        fill="none"
        stroke={leaf.fill}
        strokeWidth={lineWeights.detail * 1.6}
        strokeLinecap={tokens.line.cap}
      />
      <path d={fern.join(' ')} fill={leaf.fill} />
    </g>
  );
}

/** A red fuel can with a spout and a grip, standing on its bottom at the origin. */
export function FuelCan({ uid, shadowSide }: PropProps) {
  const red = paintOf('crimson');
  const metal = paintOf('steel');
  return (
    <g>
      <Shaded
        id={`${uid}-can-spout`}
        d="M -0.3 -0.6 L -0.38 -0.78 L -0.26 -0.84 L -0.16 -0.7 Z"
        {...metal}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <Shaded
        id={`${uid}-can`}
        d="M -0.32 0 L -0.32 -0.56 L -0.14 -0.76 L 0.32 -0.76 L 0.32 0 Z"
        {...red}
        offset={lightOffset(shadowSide, 0.05)}
      />
      <rect
        x={-0.04}
        y={-0.68}
        width={0.28}
        height={0.09}
        rx={0.045}
        fill={red.shadow}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {detail('M -0.2 -0.12 L 0.2 -0.46')}
      {detail('M -0.2 -0.46 L 0.2 -0.12')}
      <Glint x={-0.22} y={-0.3} length={0.14} turn={90} />
    </g>
  );
}

/** A loaf of bread with three cuts across its top, standing on its bottom at the origin. */
export function Bread({ uid, shadowSide }: PropProps) {
  const crust = paintOf('tan');
  return (
    <g>
      <Shaded
        id={`${uid}-bread`}
        d="M -0.44 0 L -0.44 -0.16 Q -0.44 -0.44 0 -0.44 Q 0.44 -0.44 0.44 -0.16 L 0.44 0 Z"
        {...crust}
        offset={lightOffset(shadowSide, 0.05)}
      />
      {detail('M -0.24 -0.37 L -0.14 -0.2')}
      {detail('M -0.04 -0.41 L 0.06 -0.24')}
      {detail('M 0.16 -0.38 L 0.26 -0.22')}
      <Glint x={-0.3} y={-0.16} length={0.1} turn={70} />
    </g>
  );
}
