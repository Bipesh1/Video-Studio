import { DEG } from '../rig/math';
import { seeded } from '../rig/random';
import { ink, lineWeights, tokens, white } from '../tokens';

/**
 * A sweat drop (Style 3.7): light blue teardrop, outlined, with a small white highlight.
 * Drawn in head space with the tip pointing along `tip` degrees (0 = up). Tears use it too.
 */
export function Drop({
  x,
  y,
  size,
  tip,
  opacity = 1,
}: {
  x: number;
  y: number;
  size: number;
  tip: number;
  opacity?: number;
}) {
  const s = size;
  const d = `M 0 ${-s} C ${0.35 * s} ${-0.45 * s} ${0.62 * s} ${-0.05 * s} ${0.62 * s} ${0.3 * s} A ${0.62 * s} ${0.62 * s} 0 1 1 ${-0.62 * s} ${0.3 * s} C ${-0.62 * s} ${-0.05 * s} ${-0.35 * s} ${-0.45 * s} 0 ${-s} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${tip})`} opacity={opacity}>
      <path
        d={d}
        fill={tokens.effects.sweat}
        stroke={ink}
        strokeWidth={lineWeights.outline * 0.7}
        strokeLinejoin={tokens.line.join}
      />
      <ellipse cx={-0.22 * s} cy={0.18 * s} rx={0.13 * s} ry={0.2 * s} fill={white} />
    </g>
  );
}

/**
 * Flying sweat drops (Style 8: they fly out and fade). Each drop leaves the edge of the head
 * on an upward arc, falls back under gravity and fades out, on a staggered loop.
 * Deterministic from the seed. `t` is time in seconds.
 */
export function FlyingSweat({
  t,
  seed,
  count = 4,
  period = 0.9,
}: {
  t: number;
  seed: number;
  count?: number;
  period?: number;
}) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        // Launch angles in the upper half of the head, on alternating sides.
        const a = (side < 0 ? -150 : -30) + (seeded(`${seed}:sw${i}`) - 0.5) * 30 * side;
        const dir = { x: Math.cos(a * DEG), y: Math.sin(a * DEG) };
        const u = (t / period + i / count + seeded(`${seed}:sp${i}`) * 0.2) % 1;
        const x = dir.x * (0.5 + 0.32 * u);
        const y = dir.y * (0.5 + 0.32 * u) + 0.4 * u * u;
        const vx = dir.x * 0.32;
        const vy = dir.y * 0.32 + 0.8 * u;
        // The tip trails behind the drop's motion.
        const tip = Math.atan2(-vx, vy) / DEG;
        const opacity = u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
        return <Drop key={i} x={x} y={y} size={0.06 + 0.03 * u} tip={tip} opacity={opacity} />;
      })}
    </g>
  );
}

/** A single drop resting on the head, like Reference B's frightened figure or the exhausted face. */
export const RestingSweat = ({ side = 1 }: { side?: 1 | -1 }) => (
  <Drop x={side * 0.3} y={-0.28} size={0.085} tip={side * 8} />
);
