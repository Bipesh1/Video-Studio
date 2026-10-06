import { ink, lineWeights, tokens } from '../tokens';

/**
 * The anger mark (Style 3.7): a red cross-shaped vein mark near the top of the head. Four
 * curved strokes that bow in toward a center, outlined, throbbing. Drawn in head space.
 * `side` is which side of the head it sits on: -1 is the back of the head, away from the face.
 */
export function AngerMark({
  t = 0,
  side = -1,
  size = 0.14,
}: {
  /** Seconds, for the throb. */
  t?: number;
  side?: 1 | -1;
  /** Half the width of the mark, in head units. */
  size?: number;
}) {
  const throb = 1 + 0.14 * Math.abs(Math.sin(t * Math.PI * 2.4));
  const s = size * throb;
  const corners = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const;
  // Each stroke runs from beside one arm of the cross to beside the next, bowing inward.
  const d = corners
    .map(
      ([sx, sy]) =>
        `M ${sx * 0.3 * s} ${sy * s} Q ${sx * 0.3 * s} ${sy * 0.3 * s} ${sx * s} ${sy * 0.3 * s}`,
    )
    .join(' ');
  const w = s * 0.3;
  return (
    <g
      transform={`translate(${side * 0.3} -0.4) rotate(${side * 14})`}
      fill="none"
      strokeLinecap={tokens.line.cap}
      strokeLinejoin={tokens.line.join}
    >
      <path d={d} stroke={ink} strokeWidth={w + lineWeights.outline * 1.1} />
      <path d={d} stroke={tokens.effects.anger} strokeWidth={w} />
    </g>
  );
}
