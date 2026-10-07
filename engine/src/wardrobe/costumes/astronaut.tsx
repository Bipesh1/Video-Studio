import { accent, ink, lineWeights, pick, tokens, white } from '../../tokens';
import { cloth, fold, torsoFrame, turnWidth } from '../cloth';
import { Shaded, lightOffset } from '../Shaded';
import type { Outfit, PieceContext } from '../types';

/**
 * An astronaut in a space suit (tier 2): a bulky white suit with a control panel on the
 * chest, a pack on the back, thick sleeves, legs and boots, white gloves, and a clear round
 * helmet with the whole head inside it. Colors: white, steel, orange, glint blue (Style 3.5).
 * A generic space suit with no flag, badge or agency mark on it.
 */

const W = cloth('white');
const steel = accent('steel');
const S = { fill: pick(steel, 0), shadow: pick(steel, 1) };
const orange = pick(accent('orange'), 0);
const glass = pick(accent('glint'), 0);

const ring = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** The pack on the back: it shows at both sides of the body, and whole from behind. */
const pack = (c: PieceContext) => {
  const w = turnWidth(c);
  const x = (v: number) => v * w;
  return (
    <g transform={torsoFrame(c)}>
      <Shaded
        id={`${c.uid}-pack`}
        d={`M ${x(-0.36)} -1.1 Q ${x(-0.38)} -1.2 ${x(-0.28)} -1.2 L ${x(0.28)} -1.2 Q ${x(0.38)} -1.2 ${x(0.36)} -1.1 L ${x(0.36)} -0.3 Q 0 -0.24 ${x(-0.36)} -0.3 Z`}
        fill={W.shadow}
        shadow={S.fill}
        offset={lightOffset(c.shadowSide, 0.05)}
      />
    </g>
  );
};

const suit = (c: PieceContext) => {
  const w = turnWidth(c);
  const x = (v: number) => v * w;
  const off = lightOffset(c.shadowSide, 0.06);
  const body = `M ${x(-0.16)} -1.1 Q 0 -1.0 ${x(0.16)} -1.1 L ${x(0.3)} -1.04 Q ${x(0.35)} -0.86 ${x(0.31)} -0.6 L ${x(0.31)} -0.02 Q 0 0.1 ${x(-0.31)} -0.02 L ${x(-0.31)} -0.6 Q ${x(-0.35)} -0.86 ${x(-0.3)} -1.04 Z`;
  const panel = `M ${x(-0.15)} -0.82 L ${x(0.15)} -0.82 L ${x(0.15)} -0.56 L ${x(-0.15)} -0.56 Z`;
  const belt = `M ${x(-0.312)} -0.3 Q 0 -0.24 ${x(0.312)} -0.3 L ${x(0.312)} -0.2 Q 0 -0.14 ${x(-0.312)} -0.2 Z`;
  // The collar the helmet locks onto.
  const collar = ring(0, -1.1, x(0.25), 0.07);
  return (
    <g transform={torsoFrame(c)}>
      <Shaded id={`${c.uid}-suit`} d={body} fill={W.fill} shadow={W.shadow} offset={off} />
      {fold(`M ${x(-0.035)} 0 L 0 0.08 L ${x(0.035)} 0`, 'crotch')}
      <Shaded
        id={`${c.uid}-belt`}
        d={belt}
        fill={S.fill}
        shadow={S.shadow}
        offset={lightOffset(c.shadowSide, 0.03)}
      />
      <Shaded
        id={`${c.uid}-panel`}
        d={panel}
        fill={S.fill}
        shadow={S.shadow}
        offset={lightOffset(c.shadowSide, 0.03)}
      />
      <circle cx={x(-0.08)} cy={-0.73} r={0.034} fill={orange} />
      <circle cx={x(0.02)} cy={-0.73} r={0.034} fill={glass} />
      <rect x={x(-0.11)} y={-0.655} width={x(0.22)} height={0.045} rx={0.02} fill={white} />
      <Shaded
        id={`${c.uid}-collar`}
        d={collar}
        fill={S.fill}
        shadow={S.shadow}
        offset={lightOffset(c.shadowSide, 0.02)}
      />
    </g>
  );
};

/**
 * The helmet, in head space: a clear ball round the whole head, so the face is seen through
 * it, with a shine on the glass. From behind it is the white shell of the suit.
 */
const helmet = (c: PieceContext) => {
  const r = 0.69;
  const cy = -0.03;
  if (c.back) {
    return (
      <Shaded
        id={`${c.uid}-helmet-back`}
        d={ring(0, cy, r, r)}
        fill={W.fill}
        shadow={W.shadow}
        offset={lightOffset(c.shadowSide, 0.08)}
      />
    );
  }
  return (
    <g>
      <circle cx={0} cy={cy} r={r} fill={glass} fillOpacity={0.2} />
      {/* The shine on the glass: two soft bars high on the lit side. */}
      <path
        d={`M ${-r * 0.74} ${cy - r * 0.3} Q ${-r * 0.62} ${cy - r * 0.66} ${-r * 0.3} ${cy - r * 0.8}`}
        fill="none"
        stroke={white}
        strokeWidth={0.05}
        strokeLinecap={tokens.line.cap}
        opacity={0.85}
      />
      <path
        d={`M ${-r * 0.8} ${cy - r * 0.02} L ${-r * 0.79} ${cy - r * 0.12}`}
        fill="none"
        stroke={white}
        strokeWidth={0.045}
        strokeLinecap={tokens.line.cap}
        opacity={0.85}
      />
      <circle
        cx={0}
        cy={cy}
        r={r}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline * 1.6}
      />
    </g>
  );
};

export const ASTRONAUT: Outfit = {
  id: 'astronaut',
  tier: 2,
  colors: ['white', 'steel', 'orange', 'glint'],
  shoulderSpread: 0.26,
  hipSpread: 0.15,
  gloves: true,
  sleeves: { fill: W.fill, shadow: W.shadow, width: 0.23 },
  trousers: { fill: W.fill, shadow: W.shadow, width: 0.26 },
  boots: { fill: S.fill, shadow: S.shadow },
  back: pack,
  overTorso: suit,
  headwear: helmet,
};
