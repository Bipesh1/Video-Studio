import { accent, ink, lineWeights, pick, white } from '../../tokens';
import { fold, torsoFrame, turnWidth } from '../cloth';
import { Shaded, lightOffset } from '../Shaded';
import type { Outfit, PieceContext } from '../types';

/**
 * An original queen or noblewoman in full costume (tier 2): a navy gown with a fitted bodice
 * and a wide skirt to the ground, gold belt and hem, short puffed sleeves, white gloves, and a
 * low gold crown of three arches with pearls. Colors: denim navy, gold, white (Style 3.5).
 * The crown is drawn differently from the ruler's three tall points so the two never look alike.
 */

const gold = accent('gold');
const navy = accent('denim');
const G = { fill: pick(gold, 0), shadow: pick(gold, 1) };
const N = { fill: pick(navy, 0), shadow: pick(navy, 1) };

const gown = (c: PieceContext) => {
  const w = turnWidth(c);
  const x = (v: number) => v * w;
  const off = lightOffset(c.shadowSide, 0.07);
  const dressShape = `M ${x(-0.11)} -1.07 Q 0 -0.9 ${x(0.11)} -1.07 L ${x(0.2)} -1.05 Q ${x(0.23)} -0.85 ${x(0.19)} -0.62 Q ${x(0.16)} -0.45 ${x(0.19)} -0.34 Q ${x(0.42)} 0.3 ${x(0.56)} 1.24 Q ${x(0.28)} 1.36 0 1.33 Q ${x(-0.28)} 1.36 ${x(-0.56)} 1.24 Q ${x(-0.42)} 0.3 ${x(-0.19)} -0.34 Q ${x(-0.16)} -0.45 ${x(-0.19)} -0.62 Q ${x(-0.23)} -0.85 ${x(-0.2)} -1.05 Z`;
  const hem = `M ${x(-0.535)} 1.1 Q 0 1.2 ${x(0.535)} 1.1 L ${x(0.56)} 1.24 Q ${x(0.28)} 1.36 0 1.33 Q ${x(-0.28)} 1.36 ${x(-0.56)} 1.24 Z`;
  const belt = `M ${x(-0.185)} -0.42 Q 0 -0.37 ${x(0.185)} -0.42 L ${x(0.2)} -0.31 Q 0 -0.26 ${x(-0.2)} -0.31 Z`;
  return (
    <g transform={torsoFrame(c)}>
      <Shaded id={`${c.uid}-gown`} d={dressShape} fill={N.fill} shadow={N.shadow} offset={off} />
      {fold(`M ${x(-0.08)} -0.2 Q ${x(-0.16)} 0.4 ${x(-0.24)} 1.12`, 'f1')}
      {fold(`M ${x(0.1)} -0.16 Q ${x(0.2)} 0.4 ${x(0.28)} 1.1`, 'f2')}
      <Shaded
        id={`${c.uid}-hem`}
        d={hem}
        fill={G.fill}
        shadow={G.shadow}
        offset={lightOffset(c.shadowSide, 0.04)}
      />
      <Shaded
        id={`${c.uid}-sash`}
        d={belt}
        fill={G.fill}
        shadow={G.shadow}
        offset={lightOffset(c.shadowSide, 0.03)}
      />
      <circle
        cx={0}
        cy={-0.84}
        r={0.04}
        fill={G.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
    </g>
  );
};

/** The crown, in head space: a low band rising in three rounded arches, a pearl on each. */
const crown = (c: PieceContext) => (
  <g transform="rotate(-4 0 -0.5) translate(0 -0.5) scale(1.18) translate(0 0.5)">
    <Shaded
      id={`${c.uid}-qcrown`}
      d="M -0.33 -0.45 L -0.34 -0.58 Q -0.22 -0.76 -0.11 -0.58 Q 0 -0.84 0.11 -0.58 Q 0.22 -0.76 0.34 -0.58 L 0.33 -0.45 Q 0 -0.39 -0.33 -0.45 Z"
      fill={G.fill}
      shadow={G.shadow}
      offset={lightOffset(c.shadowSide, 0.05)}
    />
    {fold('M -0.335 -0.53 Q 0 -0.47 0.335 -0.53', 'band')}
    {[
      [-0.225, -0.7],
      [0, -0.77],
      [0.225, -0.7],
    ].map(([px = 0, py = 0]) => (
      <circle
        key={px}
        cx={px}
        cy={py}
        r={0.04}
        fill={white}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
    ))}
  </g>
);

export const QUEEN: Outfit = {
  id: 'queen',
  tier: 2,
  colors: ['denim', 'gold', 'white gloves'],
  shoulderSpread: 0.17,
  hipSpread: 0.08,
  gloves: true,
  sleeves: { fill: N.fill, shadow: N.shadow, width: 0.2 },
  sleeveLength: 'short',
  overTorso: gown,
  headwear: crown,
};
