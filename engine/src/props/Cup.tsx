import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** How far the bottom of a cup is below its origin, in head units: mug, then goblet. */
export const CUP_REST = { mug: 0.2, goblet: 0.3 } as const;

/**
 * A cup (Style 4) with its middle at the origin. mug: a plain cup with a handle, for homes and
 * taverns. goblet: a gold cup on a stem, for kings and feasts. Hold it with InHand
 * how="upright" and a gripping hand, whose fingers wrap round it; or stand it on a table with
 * Placed, CUP_REST above the table top.
 */
export function Cup({
  uid,
  shadowSide,
  kind = 'mug',
  paint,
}: PropProps & { kind?: keyof typeof CUP_REST; paint?: string }) {
  const body = paintOf(paint ?? (kind === 'goblet' ? 'gold' : 'orange'));
  const off = lightOffset(shadowSide, 0.03);
  if (kind === 'goblet') {
    return (
      <g>
        <Shaded
          id={`${uid}-cup-stem`}
          d="M -0.035 0.02 L 0.035 0.02 L 0.04 0.22 L 0.17 0.26 L 0.17 0.3 L -0.17 0.3 L -0.17 0.26 L -0.04 0.22 Z"
          {...body}
          offset={lightOffset(shadowSide, 0.02)}
        />
        <Shaded
          id={`${uid}-cup-bowl`}
          d="M -0.2 -0.3 L 0.2 -0.3 Q 0.2 0.04 0 0.06 Q -0.2 0.04 -0.2 -0.3 Z"
          {...body}
          offset={off}
        />
        {detail('M -0.19 -0.2 L 0.19 -0.2')}
        <Glint x={-0.09} y={-0.1} length={0.1} turn={-80} />
      </g>
    );
  }
  return (
    <g>
      {/* The handle is a ring on the side away from the drinker. */}
      <path
        d="M 0.16 -0.1 Q 0.34 -0.1 0.34 0.02 Q 0.34 0.14 0.16 0.12"
        fill="none"
        stroke={body.shadow}
        strokeWidth={0.07}
        strokeLinecap="round"
      />
      {detail('M 0.16 -0.135 Q 0.375 -0.135 0.375 0.02 Q 0.375 0.175 0.16 0.155')}
      {detail('M 0.17 -0.065 Q 0.305 -0.065 0.305 0.02 Q 0.305 0.105 0.17 0.085')}
      <Shaded
        id={`${uid}-cup-body`}
        d="M -0.18 -0.2 L 0.18 -0.2 L 0.16 0.2 L -0.16 0.2 Z"
        {...body}
        offset={off}
      />
      {detail('M -0.175 -0.11 L 0.175 -0.11')}
      <Glint x={-0.09} y={0.02} length={0.1} turn={-85} />
    </g>
  );
}
