import { ink, lineWeights, tokens, white } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * A bare bulb hanging on its cord (Style 4): the one light of a dark room. The bulb itself is
 * outlined like any prop; its light is not a thing and has no outline. The middle of the bulb
 * is the origin, and the cord runs up out of the picture.
 */

/** The bulb's radius, in head units. */
export const BULB_RADIUS = 0.2;

/**
 * `on` is how brightly it burns, 0 to 1: lower it for a flicker. `cord` is how far up the cord
 * goes, in heads.
 */
/** How far and how slowly a hanging bulb swings, and the dust in its light. */
const SWING_DEG = 1.2;
const SWING_S = 5.5;
const DUST = 9;
const DUST_RISE = 0.18;

export function Bulb({
  uid,
  shadowSide,
  on = 1,
  cord = 8,
  t = 0,
}: PropProps & { on?: number; cord?: number; t?: number }) {
  const socket = paintOf('steel');
  // A bulb on a long cord never hangs quite still: it swings a degree or so, slowly, and a few
  // specks of dust drift up through its light (2026-10-14, small life for the Shorts).
  const swing = SWING_DEG * Math.sin((2 * Math.PI * t) / SWING_S);
  const r = BULB_RADIUS;
  const lit = Math.min(1, Math.max(0, on));
  const [lo, hi] = tokens.background.lightRayOpacity;
  return (
    <g transform={`translate(0 ${-cord}) rotate(${swing}) translate(0 ${cord})`}>
      {/* The light: strongest at the bulb and fading to nothing, with no edge to it. */}
      <defs>
        <radialGradient id={`${uid}-bulb-light`}>
          <stop offset="0" stopColor={white} stopOpacity={(lo + hi) * lit} />
          <stop offset="0.45" stopColor={white} stopOpacity={lo * lit} />
          <stop offset="1" stopColor={white} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={2.6} fill={`url(#${uid}-bulb-light)`} />
      <line
        x1={0}
        y1={-cord}
        x2={0}
        y2={-r - 0.16}
        stroke={ink}
        strokeWidth={lineWeights.detail * 2.2}
        strokeLinecap={tokens.line.cap}
      />
      <Shaded
        id={`${uid}-bulb-socket`}
        d={`M -0.09 ${-r - 0.2} L 0.09 ${-r - 0.2} L 0.1 ${-r + 0.04} L -0.1 ${-r + 0.04} Z`}
        {...socket}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <circle
        r={r}
        fill={white}
        fillOpacity={0.55 + 0.45 * lit}
        stroke={ink}
        strokeWidth={lineWeights.outline}
      />
      <Glint x={-r * 0.4} y={-r * 0.35} length={0.08} turn={-40} />
      {lit > 0.3 &&
        Array.from({ length: DUST }, (_, i) => {
          const k = (i * 0.618 + 0.13) % 1;
          // Each speck rises slowly through the light and starts again, drifting to one side.
          const up = (t * DUST_RISE + k * 2.4) % 2.4;
          const x = (k - 0.5) * 3.2 + 0.25 * Math.sin(t * 0.7 + i * 1.7);
          const y = 2.1 - up;
          const seen = Math.sin((Math.PI * up) / 2.4) * lit;
          return <circle key={i} cx={x} cy={y} r={0.035} fill={white} opacity={0.35 * seen} />;
        })}
    </g>
  );
}

/**
 * How brightly a failing bulb burns this many seconds into its shot, 0 to 1: it holds, stutters
 * low in short uneven bursts, and comes back. The same every time, so a render never changes.
 */
export const flickerAt = (shotT: number): number => {
  const k = Math.sin(shotT * 31) + 0.7 * Math.sin(shotT * 12.7 + 1.3);
  return k > 0.35 ? 1 : k > -0.2 ? 0.55 : 0.18;
};

/**
 * The dark closing in: a veil of the line colour over everything drawn before it. `depth` is
 * how dark, 0 to about 0.6. It has no edge and no place: it covers the whole picture.
 */
export function Gloom({ depth = 0.45 }: { depth?: number }) {
  return <rect x={-80} y={-80} width={160} height={160} fill={ink} opacity={Math.max(0, depth)} />;
}
