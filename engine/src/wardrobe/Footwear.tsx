import type { Vec2 } from '../rig/math';
import { ink, lineWeights, tokens } from '../tokens';
import { Shaded, lightOffset } from './Shaded';
import type { Outfit } from './types';

/**
 * Footwear at a foot, toe pointing along dir (Style 3.1: chunky outlined sneakers or boots).
 * boot: the tall default. sneaker: the low white shoe on Reference B's frightened figure,
 * about half a head long, with a round toe cap, a sole stripe and two lace lines.
 */
export function Footwear({
  foot,
  dir,
  spec,
  id,
  shadowSide,
}: {
  foot: Vec2;
  dir: 1 | -1;
  spec: NonNullable<Outfit['boots']>;
  id: string;
  shadowSide: 1 | -1;
}) {
  const f = foot;
  const X = (v: number) => f.x + v * dir;
  const off = lightOffset(shadowSide, 0.035);
  const line = (d: string, key: string) => (
    <path
      key={key}
      d={d}
      fill="none"
      stroke={ink}
      strokeWidth={lineWeights.detail}
      strokeLinecap={tokens.line.cap}
    />
  );

  if (spec.style === 'sneaker') {
    const d = `M ${X(-0.13)} ${f.y} L ${X(0.3)} ${f.y} Q ${X(0.39)} ${f.y} ${X(0.38)} ${f.y - 0.075} Q ${X(0.35)} ${f.y - 0.16} ${X(0.2)} ${f.y - 0.165} L ${X(0.07)} ${f.y - 0.21} L ${X(0.06)} ${f.y - 0.25} L ${X(-0.1)} ${f.y - 0.25} Q ${X(-0.15)} ${f.y - 0.13} ${X(-0.13)} ${f.y} Z`;
    return (
      <g>
        <Shaded id={id} d={d} fill={spec.fill} shadow={spec.shadow} offset={off} />
        {line(`M ${X(-0.13)} ${f.y - 0.05} L ${X(0.37)} ${f.y - 0.05}`, 'sole')}
        {line(
          `M ${X(0.2)} ${f.y - 0.165} Q ${X(0.25)} ${f.y - 0.1} ${X(0.22)} ${f.y - 0.05}`,
          'toe',
        )}
        {line(`M ${X(0.07)} ${f.y - 0.21} L ${X(0.13)} ${f.y - 0.12}`, 'lace1')}
        {line(`M ${X(0.13)} ${f.y - 0.19} L ${X(0.18)} ${f.y - 0.115}`, 'lace2')}
      </g>
    );
  }

  const d = `M ${X(-0.09)} ${f.y} L ${X(0.2)} ${f.y} Q ${X(0.26)} ${f.y} ${X(0.24)} ${f.y - 0.07} Q ${X(0.2)} ${f.y - 0.12} ${X(0.08)} ${f.y - 0.13} L ${X(0.08)} ${f.y - 0.24} L ${X(-0.09)} ${f.y - 0.24} Z`;
  const trim = spec.trim;
  return (
    <g>
      <Shaded id={id} d={d} fill={spec.fill} shadow={spec.shadow} offset={off} />
      {trim && (
        <Shaded
          id={`${id}-t`}
          d={`M ${X(-0.11)} ${f.y - 0.29} L ${X(0.1)} ${f.y - 0.29} L ${X(0.1)} ${f.y - 0.22} L ${X(-0.11)} ${f.y - 0.22} Z`}
          fill={trim[0]}
          shadow={trim[1]}
          offset={lightOffset(shadowSide, 0.02)}
        />
      )}
    </g>
  );
}
