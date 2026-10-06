import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** The coin's radius, in head units: far bigger than a real coin, so it reads on a phone. */
export const COIN_RADIUS = 0.17;

/**
 * A gold coin (Style 4), seen flat-on with its middle at the origin, with a star stamped on
 * it. Hold it up with InHand and a `reach` of about 0.2, so it sits at the fingertips of a hand
 * that is not gripping; or stand a few on a table with Placed.
 */
export function Coin({ uid, shadowSide }: PropProps) {
  const gold = paintOf('gold');
  const r = COIN_RADIUS;
  const star = Array.from({ length: 10 }, (_, i) => {
    const s = i % 2 === 0 ? r * 0.5 : r * 0.21;
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    return `${s * Math.cos(a)} ${s * Math.sin(a)}`;
  });
  return (
    <g>
      <Shaded
        id={`${uid}-coin`}
        d={`M ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 Z`}
        {...gold}
        offset={lightOffset(shadowSide, 0.035)}
      />
      {/* The mark is the gold's own shadow tone, so the small coin is not all outline. */}
      <path d={`M ${star.join(' L ')} Z`} fill={gold.shadow} />
      <Glint x={-r * 0.42} y={-r * 0.5} length={0.07} turn={-40} />
    </g>
  );
}
