import { accent, ink, lineWeights, pick, white } from '../tokens';

/**
 * Test fixture only: a plain outlined block, standing in for a crate to carry or something
 * heavy to push. Follows the prop rules (Style 4): outline, flat fill, one shadow tone, one
 * glint. x and y are its center, in the character's head units.
 */
export const Block = ({
  x,
  y,
  width,
  height,
  paint = 'orange',
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The name of a token accent. */
  paint?: string;
}) => {
  const tones = accent(paint);
  const left = x - width / 2;
  const top = y - height / 2;
  return (
    <g>
      <rect x={left} y={top} width={width} height={height} rx={0.05} fill={pick(tones, 0)} />
      <rect
        x={left + width * 0.62}
        y={top}
        width={width * 0.38}
        height={height}
        rx={0.05}
        fill={pick(tones, 1)}
      />
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={0.05}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline}
        strokeLinejoin="round"
      />
      <rect x={left + 0.08} y={top + 0.07} width={0.14} height={0.035} rx={0.017} fill={white} />
    </g>
  );
};
