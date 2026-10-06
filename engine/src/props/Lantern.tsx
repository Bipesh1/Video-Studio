import { accent, pick } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** How far the bottom of the lantern hangs below the ring it is held by, in head units. */
export const LANTERN_DROP = 0.82;

/**
 * A lantern (Style 4): a dark frame round a glowing glass with a flame inside, hanging from a
 * ring at the origin. Hold it with InHand how="hang" and a gripping hand, or stand it on a
 * table with Placed (its bottom is LANTERN_DROP below the origin). `lit` adds a soft pool of
 * light round it, which is light, not part of the prop, so it has no outline; `t` in seconds
 * makes the flame and the light flicker.
 */
export function Lantern({
  uid,
  shadowSide,
  lit = true,
  t = 0,
}: PropProps & { lit?: boolean; t?: number }) {
  const frame = paintOf('steel');
  const glass = paintOf('gold');
  const flame = paintOf('orange');
  const flicker = 1 + 0.05 * Math.sin(t * 9) + 0.03 * Math.sin(t * 23);
  const off = lightOffset(shadowSide, 0.03);
  return (
    <g>
      {lit && <circle cy={0.46} r={0.78 * flicker} fill={pick(accent('gold'), 0)} opacity={0.2} />}
      {/* The ring and the wire handle. */}
      {detail('M -0.14 0.2 Q -0.16 0.02 0 0.02 Q 0.16 0.02 0.14 0.2')}
      <Shaded
        id={`${uid}-lantern-cap`}
        d="M -0.2 0.26 L -0.09 0.14 L 0.09 0.14 L 0.2 0.26 Z"
        {...frame}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <Shaded
        id={`${uid}-lantern-glass`}
        d="M -0.17 0.26 L 0.17 0.26 L 0.2 0.7 L -0.2 0.7 Z"
        {...glass}
        offset={off}
      />
      {lit && (
        <path
          d={`M 0 ${0.38 - 0.03 * (flicker - 1) * 20} Q 0.08 0.52 0.05 0.6 Q 0 0.66 -0.05 0.6 Q -0.08 0.52 0 ${0.38 - 0.03 * (flicker - 1) * 20} Z`}
          fill={flame.fill}
        />
      )}
      {detail('M -0.07 0.27 L -0.08 0.69')}
      {detail('M 0.07 0.27 L 0.08 0.69')}
      <Shaded
        id={`${uid}-lantern-base`}
        d={`M -0.23 0.7 L 0.23 0.7 L 0.2 ${LANTERN_DROP} L -0.2 ${LANTERN_DROP} Z`}
        {...frame}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <Glint x={-0.12} y={0.36} length={0.09} turn={-80} />
    </g>
  );
}
