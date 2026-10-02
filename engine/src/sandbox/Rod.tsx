import type { HandFrame } from '../rig/Character';
import { accent, ink, lineWeights, pick, white } from '../tokens';

/**
 * Test fixture only: a plain outlined rod for checking a gripping hand.
 * Follows the prop rules (Style 4): outline, flat fill, one shadow tone, one glint.
 */
export const Rod = ({ frame, length = 1.4 }: { frame: HandFrame; length?: number }) => {
  const axis = frame.hand.gripAxis ?? 90 - frame.forearm;
  const orange = accent('orange');
  const w = 0.085;
  return (
    <g transform={`translate(${frame.center.x} ${frame.center.y}) rotate(${axis})`}>
      <rect
        x={-length / 2}
        y={-w / 2}
        width={length}
        height={w}
        rx={w / 2}
        fill={pick(orange, 0)}
      />
      <rect
        x={-length / 2 + w / 2}
        y={0.005}
        width={length - w}
        height={w / 2 - 0.012}
        fill={pick(orange, 1)}
      />
      <rect
        x={-length / 2}
        y={-w / 2}
        width={length}
        height={w}
        rx={w / 2}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline}
      />
      <rect
        x={length / 2 - 0.2}
        y={-w / 2 + 0.018}
        width={0.09}
        height={0.016}
        rx={0.008}
        fill={white}
      />
    </g>
  );
};
