import { clamp, easeOutBack } from '../rig/math';
import { EYE_H, EYE_W, EYE_Y, eyeSlots } from '../face/layout';
import { accent, ink, lineWeights, tokens, white } from '../tokens';

/**
 * Big cartoon reactions for the one turning point of a video (2026-10-14): used once, where the
 * story turns, never as decoration. Drawn in head space, popping in like a symbol.
 *   dollar-eyes   gold coins with a dollar sign over both eyes: greed taking over
 *   shock-lines   short lines bursting out round the head: the moment something lands
 */

const POP = 0.22;
const pop = (t: number | undefined): number =>
  t === undefined ? 1 : easeOutBack(clamp(t / POP, 0, 1), 2.2);

export function DollarEyes({ turn = 0, t }: { turn?: number; t?: number }) {
  const s = pop(t);
  if (s <= 0) return null;
  const gold = accent('gold');
  return (
    <g>
      {eyeSlots(turn).map((slot, i) => {
        const r = (Math.max(EYE_W * slot.widthFactor, EYE_H) / 2) * 1.05 * s;
        const h = r * 1.5;
        return (
          <g key={i} transform={`translate(${slot.x} ${EYE_Y})`}>
            <circle r={r} fill={gold[0]} stroke={ink} strokeWidth={lineWeights.outline * 0.8} />
            <text
              y={h * 0.36}
              textAnchor="middle"
              fontFamily="Fredoka, sans-serif"
              fontWeight={700}
              fontSize={h}
              fill={ink}
            >
              $
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function ShockLines({ t }: { t?: number }) {
  const s = pop(t);
  if (s <= 0) return null;
  // Eight short strokes round the head, a little apart from it, the top ones longest.
  const lines = Array.from({ length: 8 }, (_, i) => {
    // Over the top half of the head, clear of a hat or hair.
    const a = -Math.PI / 2 + ((i - 3.5) / 7) * Math.PI * 0.95;
    const near = 0.86;
    const far = near + (0.16 + 0.08 * Math.cos(a + Math.PI / 2)) * s;
    return `M ${near * Math.cos(a)} ${near * Math.sin(a)} L ${far * Math.cos(a)} ${far * Math.sin(a)}`;
  });
  return (
    <g fill="none" strokeLinecap={tokens.line.cap}>
      {lines.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={ink} strokeWidth={lineWeights.outline * 2.6} />
          <path d={d} stroke={white} strokeWidth={lineWeights.outline * 1.1} />
        </g>
      ))}
    </g>
  );
}
