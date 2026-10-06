import { lineWeights } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** How wide and tall the shield is, in head units. */
export const SHIELD = { width: 0.96, height: 1.14 } as const;

/**
 * A shield (Style 4), seen from the front with its middle at the origin: a gold rim, a field
 * in one bright color, a gold boss in the middle. Hold it with InHand how="upright" on a hand
 * that is not gripping, so it covers the hand and forearm behind it.
 */
export function Shield({ uid, shadowSide, paint = 'crimson' }: PropProps & { paint?: string }) {
  const rim = paintOf('gold');
  const field = paintOf(paint);
  const off = lightOffset(shadowSide, 0.05);
  const shape = (s: number) =>
    `M ${-0.48 * s} ${-0.55 * s} Q 0 ${-0.63 * s} ${0.48 * s} ${-0.55 * s} Q ${0.52 * s} ${0.12 * s} 0 ${0.59 * s} Q ${-0.52 * s} ${0.12 * s} ${-0.48 * s} ${-0.55 * s} Z`;
  return (
    <g>
      <Shaded id={`${uid}-shield-rim`} d={shape(1)} {...rim} offset={off} />
      <Shaded
        id={`${uid}-shield-field`}
        d={shape(0.8)}
        {...field}
        offset={lightOffset(shadowSide, 0.04)}
        strokeWidth={lineWeights.detail}
      />
      {detail('M 0 -0.46 L 0 -0.16')}
      {detail('M 0 0.16 L 0 0.42')}
      <Shaded
        id={`${uid}-shield-boss`}
        d="M -0.13 0 A 0.13 0.13 0 1 0 0.13 0 A 0.13 0.13 0 1 0 -0.13 0 Z"
        {...rim}
        offset={lightOffset(shadowSide, 0.035)}
      />
      <Glint x={-0.04} y={-0.05} length={0.07} turn={-35} />
    </g>
  );
}
