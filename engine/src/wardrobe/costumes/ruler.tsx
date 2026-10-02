import { lerp } from '../../rig/math';
import { accent, ink, lineWeights, pick, tokens, white } from '../../tokens';
import { Shaded, lightOffset } from '../Shaded';
import type { Outfit, PieceContext } from '../types';

/**
 * An original ruler in full costume (tier 2), in the spirit of Reference A but not a copy:
 * a three-point crown with ball tips and a center gem, a crimson cape with a darker lining
 * and a high collar, a steel breastplate with gold buttons and belt, steel sleeves and boots
 * with gold trim, and white gloves. Colors: gold, crimson, steel, plus white gloves (Style 3.5).
 */

const gold = accent('gold');
const crimson = accent('crimson');
const steel = accent('steel');
const G = { fill: pick(gold, 0), shadow: pick(gold, 1) };
const C = { fill: pick(crimson, 0), shadow: pick(crimson, 1) };
const S = { fill: pick(steel, 0), shadow: pick(steel, 1), highlight: pick(steel, 2) };
/** The cape lining is the crimson shadow tone (Style 3.5: a darker inside color). */
const LINING = C.shadow;

/** Torso frame: origin at the hip, up is -y, torso top (neck) at y = -1.1. */
const torsoFrame = (c: PieceContext) => `translate(${c.j.hip.x} ${c.j.hip.y}) rotate(${c.lean})`;

const detailLine = (d: string, key?: string) => (
  <path
    key={key}
    d={d}
    fill="none"
    stroke={ink}
    strokeWidth={lineWeights.detail}
    strokeLinecap={tokens.line.cap}
  />
);

/** A small outlined gold button or rivet with one white glint (Style 3.3). */
const Stud = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={G.fill} stroke={ink} strokeWidth={lineWeights.detail} />
    <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill={white} />
  </g>
);

const capeBack = (c: PieceContext) => {
  const dx = -0.3 * c.turn;
  const d = `M ${dx - 0.3} -1.02 C ${dx - 0.5} -0.6 ${dx - 0.64} 0.3 ${dx - 0.68} 0.86 Q ${dx} 0.98 ${dx + 0.68 * (1 - 0.6 * c.turn)} 0.86 C ${dx + 0.62} 0.3 ${dx + 0.5} -0.6 ${dx + 0.3} -1.02 Z`;
  return (
    <g transform={torsoFrame(c)}>
      <path
        d={d}
        fill={LINING}
        stroke={ink}
        strokeWidth={lineWeights.outline}
        strokeLinejoin={tokens.line.join}
      />
    </g>
  );
};

const breastplate = (c: PieceContext) => {
  const w = 1 - 0.3 * c.turn;
  const x = (v: number) => v * w;
  const d = `M ${x(-0.34)} -1.07 Q 0 -1.14 ${x(0.34)} -1.07 L ${x(0.31)} -0.55 Q ${x(0.3)} -0.12 ${x(0.21)} 0.0 L ${x(-0.21)} 0.0 Q ${x(-0.3)} -0.12 ${x(-0.31)} -0.55 Z`;
  return (
    <g transform={torsoFrame(c)}>
      <Shaded
        id={`${c.uid}-plate`}
        d={d}
        fill={S.fill}
        shadow={S.shadow}
        offset={lightOffset(c.shadowSide, 0.07)}
      />
      {detailLine(`M ${x(-0.3)} -0.62 Q 0 -0.56 ${x(0.3)} -0.62`, 'l1')}
      {detailLine(`M ${x(-0.29)} -0.38 Q 0 -0.32 ${x(0.29)} -0.38`, 'l2')}
      <path
        d={`M ${x(-0.2)} -0.95 Q ${x(-0.24)} -0.8 ${x(-0.22)} -0.7`}
        fill="none"
        stroke={S.highlight}
        strokeWidth={lineWeights.detail * 1.6}
        strokeLinecap={tokens.line.cap}
      />
      <Shaded
        id={`${c.uid}-belt`}
        d={`M ${x(-0.27)} -0.17 L ${x(0.27)} -0.17 L ${x(0.24)} -0.05 L ${x(-0.24)} -0.05 Z`}
        fill={G.fill}
        shadow={G.shadow}
        offset={lightOffset(c.shadowSide, 0.03)}
      />
      <Stud x={x(-0.13)} y={-0.93} r={0.045} />
      <Stud x={x(0.13)} y={-0.93} r={0.045} />
    </g>
  );
};

const overTorso = (c: PieceContext) => {
  const t = c.turn;
  const dx = -0.22 * t;
  const off = lightOffset(c.shadowSide, 0.05);
  // Armor skirt plates over the tops of the legs.
  const skirt = `M -0.24 -0.05 L 0.24 -0.05 L 0.28 0.22 Q 0 0.27 -0.28 0.22 Z`;
  // Drapes over each shoulder, falling to the chest.
  const drape = (side: 1 | -1) => {
    const s = side * (1 - 0.5 * t);
    return `M ${dx + s * 0.12} -1.09 Q ${dx + s * 0.4} -1.1 ${dx + s * 0.48} -0.92 L ${dx + s * 0.5} -0.58 Q ${dx + s * 0.42} -0.5 ${dx + s * 0.34} -0.6 Q ${dx + s * 0.3} -0.85 ${dx + s * 0.2} -1.0 Z`;
  };
  // A high collar that flares up behind the head, outside crimson with the dark lining showing.
  // Wide enough to flare out beside the jaw, like the collar in Reference A.
  const cw = lerp(1, 0.6, t);
  const X = (v: number) => dx + v * cw;
  const collar = `M ${X(-0.24)} -1.05 L ${X(-0.7)} -1.5 Q ${X(-0.62)} -1.6 ${X(-0.44)} -1.47 Q ${X(0)} -1.36 ${X(0.44)} -1.47 Q ${X(0.62)} -1.6 ${X(0.7)} -1.5 L ${X(0.24)} -1.05 Z`;
  const lining = `M ${X(-0.21)} -1.08 L ${X(-0.58)} -1.47 Q ${X(0)} -1.32 ${X(0.58)} -1.47 L ${X(0.21)} -1.08 Z`;
  return (
    <g transform={torsoFrame(c)}>
      <Shaded id={`${c.uid}-skirt`} d={skirt} fill={S.fill} shadow={S.shadow} offset={off} />
      {detailLine('M 0 -0.05 L 0 0.24', 'sk')}
      <Shaded id={`${c.uid}-collar`} d={collar} fill={C.fill} shadow={C.shadow} offset={off} />
      <path
        d={lining}
        fill={LINING}
        stroke={ink}
        strokeWidth={lineWeights.detail}
        strokeLinejoin={tokens.line.join}
      />
      <Shaded id={`${c.uid}-drapeL`} d={drape(-1)} fill={C.fill} shadow={C.shadow} offset={off} />
      {t < 0.8 && (
        <Shaded id={`${c.uid}-drapeR`} d={drape(1)} fill={C.fill} shadow={C.shadow} offset={off} />
      )}
    </g>
  );
};

const pauldron = (c: PieceContext, arm: 'front' | 'back') => {
  const sh = c.j.arms[arm].shoulder;
  const out = arm === 'front' ? 1 : -1;
  const cx = sh.x + out * 0.03 * (1 - c.turn);
  const cy = sh.y - 0.01;
  const d = `M ${cx - 0.15} ${cy + 0.06} Q ${cx - 0.16} ${cy - 0.13} ${cx} ${cy - 0.13} Q ${cx + 0.16} ${cy - 0.13} ${cx + 0.15} ${cy + 0.06} Q ${cx} ${cy + 0.12} ${cx - 0.15} ${cy + 0.06} Z`;
  return (
    <g>
      <Shaded
        id={`${c.uid}-pd-${arm}`}
        d={d}
        fill={S.fill}
        shadow={S.shadow}
        offset={lightOffset(c.shadowSide, 0.04)}
      />
      {detailLine(`M ${cx - 0.12} ${cy + 0.0} Q ${cx} ${cy - 0.05} ${cx + 0.12} ${cy + 0.0}`)}
    </g>
  );
};

/** The crown, in head space. It sits on the top of the head, tilted a little. */
const crown = (c: PieceContext) => {
  const d =
    'M -0.37 -0.47 L -0.27 -0.82 L -0.14 -0.56 L 0 -0.92 L 0.14 -0.56 L 0.27 -0.82 L 0.37 -0.47 ' +
    'L 0.38 -0.36 Q 0 -0.29 -0.38 -0.36 Z';
  return (
    <g transform="rotate(-5 0 -0.5)">
      <Shaded
        id={`${c.uid}-crown`}
        d={d}
        fill={G.fill}
        shadow={G.shadow}
        offset={lightOffset(c.shadowSide, 0.05)}
      />
      {detailLine('M -0.37 -0.47 Q 0 -0.41 0.37 -0.47', 'band')}
      {[
        [-0.27, -0.84],
        [0, -0.95],
        [0.27, -0.84],
      ].map(([x = 0, y = 0]) => (
        <Stud key={x} x={x} y={y} r={0.04} />
      ))}
      <ellipse
        cx={0}
        cy={-0.39}
        rx={0.055}
        ry={0.045}
        fill={C.fill}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      <circle cx={-0.018} cy={-0.402} r={0.013} fill={white} />
    </g>
  );
};

export const RULER: Outfit = {
  id: 'ruler',
  tier: 2,
  colors: ['gold', 'crimson', 'steel', 'white gloves'],
  shoulderSpread: 0.27,
  gloves: true,
  sleeves: { fill: S.fill, shadow: S.shadow, width: 0.17 },
  trousers: { fill: S.fill, shadow: S.shadow, width: 0.16 },
  boots: { fill: S.fill, shadow: S.shadow, trim: [G.fill, G.shadow] },
  back: capeBack,
  torso: breastplate,
  overTorso,
  shoulder: pauldron,
  headwear: crown,
};
