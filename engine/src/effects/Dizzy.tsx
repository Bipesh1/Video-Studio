import { accent, ink, lineWeights, pick, tokens } from '../tokens';

/** A five-pointed star as a path, centered on the origin, one point up. */
function starPath(outer: number, inner: number): string {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / 5 - Math.PI / 2;
    return `${r * Math.cos(a)} ${r * Math.sin(a)}`;
  });
  return `M ${points.join(' L ')} Z`;
}

/** Seconds for the stars to go once round the head. */
export const DIZZY_SECONDS = 1.2;

/**
 * Dizzy stars (Style 3.7): small gold stars circling the top of the head, for someone dazed
 * or knocked silly. They go round on a flat ring: bigger as they pass in front, smaller as
 * they pass behind. Drawn in head space.
 */
export function DizzyStars({
  t = 0,
  count = 3,
  period = DIZZY_SECONDS,
}: {
  /** Seconds. */
  t?: number;
  count?: number;
  period?: number;
}) {
  const gold = accent('gold');
  const stars = Array.from({ length: count }, (_, i) => {
    const a = 2 * Math.PI * (t / period + i / count);
    // depth runs from 0 at the back of the ring to 1 at the front.
    return { i, x: 0.6 * Math.cos(a), depth: (Math.sin(a) + 1) / 2, spin: (t * 140 + i * 40) % 72 };
  }).sort((p, q) => p.depth - q.depth);
  return (
    <g>
      {stars.map((s) => (
        <path
          key={s.i}
          d={starPath(0.115, 0.052)}
          transform={`translate(${s.x} ${-0.74 + 0.22 * s.depth}) scale(${0.72 + 0.4 * s.depth}) rotate(${s.spin})`}
          fill={pick(gold, 0)}
          stroke={ink}
          strokeWidth={lineWeights.outline * 0.7}
          strokeLinejoin={tokens.line.join}
        />
      ))}
    </g>
  );
}
