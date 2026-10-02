import type { Vec2 } from '../rig/math';
import { ink, lineWeights, tokens } from '../tokens';
import type { TubeSpec } from './types';

/** How far toward the light the lit area is shifted, leaving a shadow band on the far side. */
export const lightOffset = (shadowSide: 1 | -1, k = 0.06): Vec2 => ({
  x: -shadowSide * k,
  y: -k * 0.8,
});

/**
 * A closed shape with a flat fill, one hard-edged shadow tone on the side away from the light,
 * and a full black outline (Style 3.3). The lit area is the shape intersected with itself
 * shifted toward the light, which leaves a crescent of shadow on the far edges.
 */
export const Shaded = ({
  id,
  d,
  fill,
  shadow,
  offset,
  strokeWidth = lineWeights.outline,
  outline = true,
}: {
  id: string;
  d: string;
  fill: string;
  shadow: string;
  offset: Vec2;
  strokeWidth?: number;
  outline?: boolean;
}) => (
  <g>
    <defs>
      <clipPath id={id}>
        <path d={d} transform={`translate(${offset.x} ${offset.y})`} />
      </clipPath>
    </defs>
    <path d={d} fill={shadow} />
    <path d={d} fill={fill} clipPath={`url(#${id})`} />
    {outline && (
      <path
        d={d}
        fill="none"
        stroke={ink}
        strokeWidth={strokeWidth}
        strokeLinejoin={tokens.line.join}
        strokeLinecap={tokens.line.cap}
      />
    )}
  </g>
);

const linePts = (pts: readonly Vec2[]) => pts.map((p) => `${p.x},${p.y}`).join(' ');

/**
 * A sleeve or trouser leg: an outlined tube that follows the limb's joints, with a lit stripe
 * shifted toward the light so the shadow tone shows on the far side.
 */
export const Tube = ({
  pts,
  spec,
  shadowSide,
}: {
  pts: readonly Vec2[];
  spec: TubeSpec;
  shadowSide: 1 | -1;
}) => {
  const o = lightOffset(shadowSide, 0.028);
  const common = {
    points: linePts(pts),
    fill: 'none',
    strokeLinecap: tokens.line.cap,
    strokeLinejoin: tokens.line.join,
  } as const;
  return (
    <g>
      <polyline {...common} stroke={ink} strokeWidth={spec.width + 2 * lineWeights.outline} />
      <polyline {...common} stroke={spec.shadow} strokeWidth={spec.width} />
      <polyline
        {...common}
        transform={`translate(${o.x} ${o.y})`}
        stroke={spec.fill}
        strokeWidth={spec.width * 0.62}
      />
    </g>
  );
};

/** A path string from points, closed. */
export const closed = (pts: readonly Vec2[]) =>
  `M ${pts.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`;
