import { DEG, clamp } from '../rig/math';
import { seeded } from '../rig/random';
import { ink, lineWeights, tokens, white } from '../tokens';

/** Seconds an impact flash is on screen: brief (Style 3.7). */
export const IMPACT_SECONDS = 0.24;

/**
 * An impact flash (Style 3.7): a white starburst with a black outline, for a blow, a crash or
 * a landing. This is how a hit is shown: the flash covers the point of contact and nothing is
 * ever wounded (Style 4). It bursts out in two frames, holds, shrinks and is gone.
 *
 * Placed in the scene, not on a character: x and y are screen points and `head` is the head
 * size of the characters in the shot, so its outline matches theirs.
 */
export function Impact({
  x,
  y,
  head,
  t,
  size = 0.65,
  seed = 1,
}: {
  x: number;
  y: number;
  /** Head diameter of the characters in the shot, px. */
  head: number;
  /** Seconds since the hit. Outside 0 to IMPACT_SECONDS nothing is drawn. */
  t: number;
  /** Radius of the longest spikes, in head units. */
  size?: number;
  seed?: number;
}) {
  if (t < 0 || t >= IMPACT_SECONDS) return null;
  const u = t / IMPACT_SECONDS;
  const scale =
    u < 0.3
      ? 0.45 + 0.7 * (1 - (1 - u / 0.3) ** 2)
      : 1.15 - 0.55 * clamp((u - 0.55) / 0.45, 0, 1) ** 2;
  const spikes = 9;
  const turn = seeded(`${seed}:impact`) * 360;
  const points = Array.from({ length: spikes * 2 }, (_, i) => {
    const long = i % 2 === 0;
    const r = long
      ? size * (0.78 + 0.22 * seeded(`${seed}:spike${i}`))
      : size * (0.4 + 0.1 * seeded(`${seed}:dip${i}`));
    const a = (turn + (360 * i) / (spikes * 2)) * DEG;
    return `${r * Math.cos(a)} ${r * Math.sin(a)}`;
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${head * scale})`}>
      <path
        d={`M ${points.join(' L ')} Z`}
        fill={white}
        stroke={ink}
        strokeWidth={lineWeights.outline / scale}
        strokeLinejoin={tokens.line.join}
      />
    </g>
  );
}
