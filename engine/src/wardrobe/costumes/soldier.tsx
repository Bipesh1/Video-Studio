import { accent, lineWeights, pick, tokens } from '../../tokens';
import { edge, fold, torsoFrame, turnWidth } from '../cloth';
import { Shaded, lightOffset } from '../Shaded';
import type { Outfit, PieceContext } from '../types';

/**
 * An original foot soldier in full costume (tier 2): a pointed steel helmet with a gold band
 * over a mail coif, a crimson tabard over steel mail with a gold belt, steel shoulder plates, mail
 * sleeves and leggings, and boots. Colors: steel, crimson, gold (Style 3.5).
 * A generic medieval soldier, not taken from any existing design.
 */

const gold = accent('gold');
const crimson = accent('crimson');
const steel = accent('steel');
const G = { fill: pick(gold, 0), shadow: pick(gold, 1) };
const C = { fill: pick(crimson, 0), shadow: pick(crimson, 1) };
const S = { fill: pick(steel, 0), shadow: pick(steel, 1), highlight: pick(steel, 2) };

const tabard = (c: PieceContext) => {
  const w = turnWidth(c);
  const x = (v: number) => v * w;
  const off = lightOffset(c.shadowSide, 0.06);
  // The tabard hangs from the shoulders to mid-thigh and flares a little below the belt.
  const cloth = `M ${x(-0.12)} -1.08 Q 0 -0.95 ${x(0.12)} -1.08 L ${x(0.29)} -1.03 Q ${x(0.32)} -0.8 ${x(0.28)} -0.36 Q ${x(0.31)} 0 ${x(0.33)} 0.34 Q 0 0.42 ${x(-0.33)} 0.34 Q ${x(-0.31)} 0 ${x(-0.28)} -0.36 Q ${x(-0.32)} -0.8 ${x(-0.29)} -1.03 Z`;
  // A mail collar shows at the neck.
  const collar = `M ${x(-0.2)} -1.09 Q 0 -1.14 ${x(0.2)} -1.09 Q ${x(0.16)} -0.9 0 -0.86 Q ${x(-0.16)} -0.9 ${x(-0.2)} -1.09 Z`;
  const belt = `M ${x(-0.29)} -0.4 L ${x(0.29)} -0.4 L ${x(0.29)} -0.28 L ${x(-0.29)} -0.28 Z`;
  return (
    <g transform={torsoFrame(c)}>
      <Shaded id={`${c.uid}-tabard`} d={cloth} fill={C.fill} shadow={C.shadow} offset={off} />
      {fold(`M 0 -0.28 L 0 0.36`, 'split')}
      {fold(`M ${x(-0.3)} 0.24 Q 0 0.32 ${x(0.3)} 0.24`, 'hem')}
      <Shaded
        id={`${c.uid}-mail`}
        d={collar}
        fill={S.fill}
        shadow={S.shadow}
        offset={lightOffset(c.shadowSide, 0.03)}
      />
      <Shaded
        id={`${c.uid}-belt`}
        d={belt}
        fill={G.fill}
        shadow={G.shadow}
        offset={lightOffset(c.shadowSide, 0.03)}
      />
    </g>
  );
};

const shoulderPlate = (c: PieceContext, arm: 'front' | 'back') => {
  const sh = c.j.arms[arm].shoulder;
  const out = arm === 'front' ? 1 : -1;
  const cx = sh.x + out * 0.03 * (1 - c.turn);
  const cy = sh.y - 0.01;
  const d = `M ${cx - 0.14} ${cy + 0.07} Q ${cx - 0.15} ${cy - 0.12} ${cx} ${cy - 0.12} Q ${cx + 0.15} ${cy - 0.12} ${cx + 0.14} ${cy + 0.07} Q ${cx} ${cy + 0.12} ${cx - 0.14} ${cy + 0.07} Z`;
  return (
    <Shaded
      id={`${c.uid}-plate-${arm}`}
      d={d}
      fill={S.fill}
      shadow={S.shadow}
      offset={lightOffset(c.shadowSide, 0.04)}
    />
  );
};

/**
 * Head armor, in head space: a mail coif that frames the face, under a pointed helmet with a
 * gold band. The band curves up at the front so the brows stay clear.
 */
const helmet = (c: PieceContext) => {
  const t = c.turn;
  const off = lightOffset(c.shadowSide, 0.05);
  const ring = (cx: number, cy: number, rx: number, ry: number) =>
    `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
  const coifOuter = ring(-0.03 - 0.05 * t, 0.03, 0.59, 0.62);
  const coifOpening = ring(0.04 + 0.2 * t, 0.07, 0.41 - 0.11 * t, 0.42);
  const coifId = `${c.uid}-coif`;
  // From behind the mail covers the whole head: there is no opening for a face.
  const coif = c.back ? coifOuter : `${coifOuter} ${coifOpening}`;
  const dome = 'M -0.52 -0.32 Q -0.5 -0.8 0 -1.02 Q 0.5 -0.8 0.52 -0.32 Q 0 -0.43 -0.52 -0.32 Z';
  const band = 'M -0.52 -0.32 Q 0 -0.43 0.52 -0.32 L 0.51 -0.44 Q 0 -0.55 -0.51 -0.44 Z';
  return (
    <g>
      <defs>
        <clipPath id={coifId}>
          <path d={coifOuter} transform={`translate(${off.x} ${off.y})`} />
        </clipPath>
      </defs>
      <path d={coif} fillRule="evenodd" fill={S.shadow} />
      <path d={coif} fillRule="evenodd" fill={S.fill} clipPath={`url(#${coifId})`} />
      {edge(coifOuter, 'coif-out')}
      {!c.back && edge(coifOpening, 'coif-in')}
      <Shaded id={`${c.uid}-helm`} d={dome} fill={S.fill} shadow={S.shadow} offset={off} />
      <path
        d="M -0.26 -0.82 Q -0.36 -0.68 -0.37 -0.56"
        fill="none"
        stroke={S.highlight}
        strokeWidth={lineWeights.detail * 1.6}
        strokeLinecap={tokens.line.cap}
      />
      <Shaded
        id={`${c.uid}-helm-band`}
        d={band}
        fill={G.fill}
        shadow={G.shadow}
        offset={lightOffset(c.shadowSide, 0.03)}
      />
      {fold('M 0 -1.0 L 0 -0.52', 'ridge')}
    </g>
  );
};

export const SOLDIER: Outfit = {
  id: 'soldier',
  tier: 2,
  colors: ['steel', 'crimson', 'gold'],
  shoulderSpread: 0.25,
  hipSpread: 0.1,
  sleeves: { fill: S.fill, shadow: S.shadow, width: 0.16 },
  trousers: { fill: S.fill, shadow: S.shadow, width: 0.18 },
  boots: { fill: S.fill, shadow: S.shadow },
  overTorso: tabard,
  shoulder: shoulderPlate,
  headwear: helmet,
};
