import type { HandFrame } from '../rig/Character';
import { accent, ink, lineWeights, pick, white } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';

const gold = accent('gold');
const crimson = accent('crimson');

/**
 * A scepter held in a gripping hand (Style 4: outlined, flat fill, one shadow tone, one glint,
 * slightly oversized). Drawn along the hand's grip axis; the hand's fingers are drawn over it.
 */
export const Scepter = ({
  frame,
  uid,
  shadowSide,
}: {
  frame: HandFrame;
  uid: string;
  shadowSide: 1 | -1;
}) => {
  const axis = frame.hand.gripAxis ?? 90 - frame.forearm;
  const off = lightOffset(shadowSide, 0.025);
  const g = { fill: pick(gold, 0), shadow: pick(gold, 1) };
  // Drawn along +x: handle from -0.45 to 0.6, then a collar and an orb.
  const shaft = 'M -0.45 -0.04 L 0.62 -0.04 L 0.62 0.04 L -0.45 0.04 Z';
  const collar = 'M 0.6 -0.085 L 0.7 -0.085 L 0.7 0.085 L 0.6 0.085 Z';
  return (
    <g transform={`translate(${frame.center.x} ${frame.center.y}) rotate(${axis})`}>
      <Shaded id={`${uid}-sc-shaft`} d={shaft} {...g} offset={off} />
      <circle
        cx={-0.47}
        cy={0}
        r={0.06}
        fill={g.fill}
        stroke={ink}
        strokeWidth={lineWeights.outline}
      />
      <Shaded id={`${uid}-sc-collar`} d={collar} {...g} offset={off} />
      <Shaded
        id={`${uid}-sc-orb`}
        d="M 0.69 0 A 0.13 0.13 0 1 0 0.95 0 A 0.13 0.13 0 1 0 0.69 0 Z"
        fill={pick(crimson, 0)}
        shadow={pick(crimson, 1)}
        offset={lightOffset(shadowSide, 0.05)}
      />
      <circle cx={0.86} cy={-0.05} r={0.03} fill={white} />
    </g>
  );
};
