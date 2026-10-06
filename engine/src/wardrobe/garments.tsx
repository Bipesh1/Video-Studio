import type { Clothes } from '@studio/shared';
import type { ReactNode } from 'react';
import { ink, lineWeights, tokens } from '../tokens';
import {
  DRAPES,
  cloth,
  drapeOverLegs,
  edge,
  fold,
  fromTorso,
  hemTrail,
  torsoFrame,
  turnWidth,
} from './cloth';
import type { Cloth, Drape } from './cloth';
import { Shaded, lightOffset } from './Shaded';
import type { Outfit, Piece, PieceContext } from './types';

/**
 * Tier 1 clothing (Style 3.5): one or two plain garments over the stick body, as on the
 * frightened figure in Reference B (white tank top, navy jeans, white sneakers). Shapes were
 * measured from that figure: a top about half a head wide at the hem, trouser legs about a
 * quarter of a head wide hanging from hips set apart, shoes about half a head long.
 *
 * Garments are mixed freely with `outfitFrom`. Every color is a token cloth color by name.
 */
export const GARMENTS = [
  'tank-top',
  'shirt',
  'trousers',
  'skirt',
  'dress',
  'robe',
  'cloak',
  'hood',
  'brim-hat',
  'sneakers',
  'boots',
] as const;
export type Garment = (typeof GARMENTS)[number];

export type { Clothes };

type Draw = (c: PieceContext, x: (v: number) => number, k: Cloth) => ReactNode;

/** A garment drawn in the torso frame, with x scaled for the body's turn. */
const onTorso =
  (name: string, color: string, draw: Draw): Piece =>
  (c) => {
    const w = turnWidth(c);
    return (
      <g key={name} transform={torsoFrame(c)}>
        {draw(c, (v) => v * w, cloth(color))}
      </g>
    );
  };

const shaded = (c: PieceContext, name: string, d: string, k: Cloth, depth = 0.06) => (
  <Shaded
    id={`${c.uid}-${name}`}
    d={d}
    fill={k.fill}
    shadow={k.shadow}
    offset={lightOffset(c.shadowSide, depth)}
  />
);

/** The white tank top in Reference B: narrow straps, wide armholes, a belly crease. */
export const tankTop = (color: string): Piece =>
  onTorso('tank', color, (c, x, k) => (
    <>
      {shaded(
        c,
        'tank',
        `M ${x(-0.1)} -1.08 Q 0 -0.9 ${x(0.1)} -1.08 L ${x(0.165)} -1.07 Q ${x(0.13)} -0.84 ${x(0.2)} -0.72 L ${x(0.25)} -0.3 Q 0 -0.23 ${x(-0.25)} -0.3 L ${x(-0.2)} -0.72 Q ${x(-0.13)} -0.84 ${x(-0.165)} -1.07 Z`,
        k,
      )}
      {fold(`M ${x(-0.04)} -0.5 Q ${x(0.03)} -0.535 ${x(0.09)} -0.49`, 'belly')}
    </>
  ));

/** A plain buttoned shirt with a small open collar. Its sleeves are tubes on the arms. */
export const shirt = (color: string): Piece =>
  onTorso('shirt', color, (c, x, k) => (
    <>
      {shaded(
        c,
        'shirt',
        `M ${x(-0.09)} -1.09 L 0 -0.97 L ${x(0.09)} -1.09 L ${x(0.25)} -1.04 Q ${x(0.29)} -0.9 ${x(0.26)} -0.74 L ${x(0.26)} -0.29 Q 0 -0.22 ${x(-0.26)} -0.29 L ${x(-0.26)} -0.74 Q ${x(-0.29)} -0.9 ${x(-0.25)} -1.04 Z`,
        k,
      )}
      {fold(`M 0 -0.97 L 0 -0.27`, 'placket')}
      {[-0.8, -0.61, -0.42].map((y) => (
        <circle key={y} cx={x(0.035)} cy={y} r={0.016} fill={ink} />
      ))}
    </>
  ));

/**
 * The top of a pair of trousers: waist to crotch, over the tops of both legs. Its lower edge
 * is left open so it runs into the legs instead of reading as shorts.
 */
export const trouserTop = (color: string): Piece =>
  onTorso('hips', color, (c, x, k) => (
    <>
      <Shaded
        id={`${c.uid}-hips`}
        d={`M ${x(-0.255)} -0.33 L ${x(0.255)} -0.33 L ${x(0.25)} 0 Q ${x(0.14)} 0.1 0 0.12 Q ${x(-0.14)} 0.1 ${x(-0.25)} 0 Z`}
        fill={k.fill}
        shadow={k.shadow}
        offset={lightOffset(c.shadowSide, 0.05)}
        outline={false}
      />
      {edge(`M ${x(-0.25)} 0 L ${x(-0.255)} -0.33 L ${x(0.255)} -0.33 L ${x(0.25)} 0`, 'waist')}
      {fold(`M ${x(-0.25)} -0.26 Q 0 -0.22 ${x(0.25)} -0.26`, 'band')}
      {fold(`M ${x(-0.035)} 0.02 L 0 0.11 L ${x(0.035)} 0.02`, 'crotch')}
    </>
  ));

/**
 * The skirt part of a garment, in the character's own space: draped over the legs, with a
 * fold running down toward each leg.
 */
const draped = (c: PieceContext, name: string, k: Cloth, shape: Drape) => {
  const drape = drapeOverLegs(c, shape);
  const w = turnWidth(c);
  return (
    <g key={`${name}-skirt`}>
      {shaded(c, `${name}-skirt`, drape.d, k)}
      {drape.ends.map((end, i) => {
        const from = fromTorso(c, (i === 0 ? -0.09 : 0.11) * w, -0.18);
        const mid = { x: (from.x + end.x) / 2, y: (from.y + end.y) / 2 };
        return fold(
          `M ${from.x} ${from.y} Q ${mid.x + (i === 0 ? -0.04 : 0.04)} ${mid.y} ${end.x} ${end.y}`,
          `f${i}`,
        );
      })}
    </g>
  );
};

/** A knee-length skirt flaring from the waist, draped over the legs. */
export const skirt =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const w = turnWidth(c);
    return (
      <g key="skirt">
        {draped(c, 'skirt', k, DRAPES.knee)}
        <g transform={torsoFrame(c)}>
          {fold(`M ${-0.24 * w} -0.25 Q 0 -0.21 ${0.24 * w} -0.25`, 'band')}
        </g>
      </g>
    );
  };

/** A knee-length dress: a fitted top, and a skirt from the waist that drapes over the legs. */
export const dress =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const w = turnWidth(c);
    const x = (v: number) => v * w;
    return (
      <g key="dress">
        {draped(c, 'dress', k, DRAPES.knee)}
        <g transform={torsoFrame(c)}>
          {shaded(
            c,
            'dress',
            `M ${x(-0.1)} -1.08 Q 0 -0.93 ${x(0.1)} -1.08 L ${x(0.2)} -1.05 Q ${x(0.24)} -0.9 ${x(0.2)} -0.74 Q ${x(0.16)} -0.5 ${x(0.2)} -0.36 L ${x(0.25)} -0.28 Q 0 -0.22 ${x(-0.25)} -0.28 L ${x(-0.2)} -0.36 Q ${x(-0.16)} -0.5 ${x(-0.2)} -0.74 Q ${x(-0.24)} -0.9 ${x(-0.2)} -1.05 Z`,
            k,
          )}
        </g>
      </g>
    );
  };

/**
 * A long robe from the shoulders to the ankles, tied with a cord. Its sleeves are wide tubes,
 * and its skirt drapes over the legs.
 */
export const robe =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const w = turnWidth(c);
    const x = (v: number) => v * w;
    return (
      <g key="robe">
        {draped(c, 'robe', k, DRAPES.ankle)}
        <g transform={torsoFrame(c)}>
          {shaded(
            c,
            'robe',
            `M ${x(-0.1)} -1.09 L 0 -0.95 L ${x(0.1)} -1.09 L ${x(0.26)} -1.04 Q ${x(0.3)} -0.8 ${x(0.27)} -0.5 L ${x(0.3)} -0.2 Q 0 -0.14 ${x(-0.3)} -0.2 L ${x(-0.27)} -0.5 Q ${x(-0.3)} -0.8 ${x(-0.26)} -1.04 Z`,
            k,
            0.07,
          )}
          {fold(`M ${x(-0.275)} -0.33 Q 0 -0.27 ${x(0.275)} -0.33`, 'cord1')}
          {fold(`M ${x(-0.28)} -0.27 Q 0 -0.21 ${x(0.28)} -0.27`, 'cord2')}
          {fold(`M ${x(0.07)} -0.25 Q ${x(0.1)} -0.1 ${x(0.07)} 0.04`, 'tail')}
          {fold(`M 0 -0.95 Q ${x(-0.02)} -0.6 0 -0.3`, 'front')}
        </g>
      </g>
    );
  };

/** The back of a cloak, in the cloth's shadow tone: we look at its inside (Style 3.5). */
const cloakBack =
  (color: string, hoodDown: boolean): Piece =>
  (c) => {
    const k = cloth(color);
    const dx = -0.28 * c.turn;
    const right = 0.62 * (1 - 0.6 * c.turn);
    // Follow-through: the hem trails the shoulders and lifts a little as it swings.
    const hem = hemTrail(c);
    const mid = dx + hem.x * 0.45;
    const low = dx + hem.x;
    return (
      <g key="cloak-back" transform={torsoFrame(c)}>
        <path
          d={`M ${dx - 0.3} -1.04 C ${dx - 0.5} -0.6 ${mid - 0.6} 0.3 ${low - 0.62} ${0.92 + hem.y} Q ${low} ${1.04 + hem.y} ${low + right} ${0.92 + hem.y} C ${mid + 0.58} 0.3 ${dx + 0.5} -0.6 ${dx + 0.3} -1.04 Z`}
          fill={k.shadow}
          stroke={ink}
          strokeWidth={lineWeights.outline}
          strokeLinejoin={tokens.line.join}
        />
        {hoodDown &&
          shaded(
            c,
            'hood-down',
            `M ${dx - 0.36} -1.0 Q ${dx - 0.4} -1.24 ${dx - 0.08} -1.24 Q ${dx + 0.3} -1.24 ${dx + 0.3} -1.02 Q ${dx} -0.92 ${dx - 0.36} -1.0 Z`,
            k,
            0.04,
          )}
      </g>
    );
  };

/** The front of a cloak: a drape over each shoulder, meeting at a tie under the chin. */
const cloakFront =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const t = c.turn;
    const dx = -0.22 * t;
    const drape = (side: 1 | -1) => {
      const s = side * (1 - 0.5 * t);
      return `M ${dx + s * 0.06} -1.09 Q ${dx + s * 0.38} -1.1 ${dx + s * 0.46} -0.92 L ${dx + s * 0.48} -0.48 Q ${dx + s * 0.4} -0.4 ${dx + s * 0.3} -0.5 Q ${dx + s * 0.26} -0.85 ${dx + s * 0.1} -0.98 Z`;
    };
    return (
      <g key="cloak-front" transform={torsoFrame(c)}>
        {shaded(c, 'cloak-l', drape(-1), k, 0.05)}
        {t < 0.8 && shaded(c, 'cloak-r', drape(1), k, 0.05)}
        <circle
          cx={dx + 0.02}
          cy={-1.0}
          r={0.05}
          fill={k.shadow}
          stroke={ink}
          strokeWidth={lineWeights.detail}
        />
      </g>
    );
  };

/**
 * A hood pulled up, in head space: a rounded shape larger than the head with an opening that
 * frames the face. The opening moves toward the front as the head turns.
 */
export const hood =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const t = c.turn;
    const ring = (cx: number, cy: number, rx: number, ry: number) =>
      `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
    const outer = ring(-0.05 - 0.07 * t, -0.03, 0.64, 0.67);
    const opening = ring(0.05 + 0.2 * t, 0.04, 0.42 - 0.11 * t, 0.46);
    const id = `${c.uid}-hood`;
    const off = lightOffset(c.shadowSide, 0.07);
    return (
      <g key="hood">
        <defs>
          <clipPath id={id}>
            <path d={outer} transform={`translate(${off.x} ${off.y})`} />
          </clipPath>
        </defs>
        <path d={c.back ? outer : `${outer} ${opening}`} fillRule="evenodd" fill={k.shadow} />
        <path
          d={c.back ? outer : `${outer} ${opening}`}
          fillRule="evenodd"
          fill={k.fill}
          clipPath={`url(#${id})`}
        />
        {edge(outer, 'outer')}
        {!c.back && edge(opening, 'opening')}
      </g>
    );
  };

/**
 * A plain brimmed hat, like a straw hat, in head space. The crown comes down over the top of
 * the head and the flat brim crosses the forehead just above the brows.
 */
export const brimHat =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const off = lightOffset(c.shadowSide, 0.05);
    return (
      <g key="hat" transform="rotate(-4 0 -0.45)">
        <Shaded
          id={`${c.uid}-brim`}
          d="M -0.76 -0.44 A 0.76 0.075 0 1 0 0.76 -0.44 A 0.76 0.075 0 1 0 -0.76 -0.44 Z"
          fill={k.fill}
          shadow={k.shadow}
          offset={off}
        />
        <Shaded
          id={`${c.uid}-crown`}
          d="M -0.4 -0.45 Q -0.42 -0.9 0 -0.92 Q 0.42 -0.9 0.4 -0.45 Q 0 -0.39 -0.4 -0.45 Z"
          fill={k.fill}
          shadow={k.shadow}
          offset={off}
        />
        {fold('M -0.405 -0.56 Q 0 -0.5 0.405 -0.56', 'band')}
      </g>
    );
  };

const pieces = (list: Array<Piece | undefined>): Piece | undefined => {
  const all = list.filter((p): p is Piece => Boolean(p));
  if (!all.length) return undefined;
  return (c) => <>{all.map((p) => p(c))}</>;
};

/** Put garments together into one outfit a Character can wear. */
export function outfitFrom(clothes: Clothes, id = 'clothes'): Outfit {
  const { top, bottom, onePiece, shoes, hat, cloak } = clothes;
  const colors = [
    ...new Set([top, bottom, onePiece, shoes, hat, cloak].flatMap((g) => (g ? [g.cloth] : []))),
  ];
  const outfit: Outfit = { id, tier: 1, colors };

  const over: Array<Piece | undefined> = [];
  if (bottom?.kind === 'trousers') {
    const k = cloth(bottom.cloth);
    outfit.trousers = { fill: k.fill, shadow: k.shadow, width: 0.22 };
    outfit.hipSpread = 0.13;
    over.push(trouserTop(bottom.cloth));
  }
  if (bottom?.kind === 'skirt') {
    outfit.hipSpread = 0.08;
    over.push(skirt(bottom.cloth));
  }
  if (top) {
    const k = cloth(top.cloth);
    if (top.kind === 'shirt') {
      outfit.sleeves = { fill: k.fill, shadow: k.shadow, width: 0.16 };
      outfit.sleeveLength = top.sleeves ?? 'long';
      outfit.shoulderSpread = 0.2;
      over.push(shirt(top.cloth));
    } else {
      outfit.shoulderSpread = 0.15;
      over.push(tankTop(top.cloth));
    }
  }
  if (onePiece) {
    const k = cloth(onePiece.cloth);
    if (onePiece.kind === 'robe') {
      outfit.sleeves = { fill: k.fill, shadow: k.shadow, width: 0.2 };
      outfit.shoulderSpread = 0.2;
      over.push(robe(onePiece.cloth));
    } else {
      outfit.shoulderSpread = 0.16;
      outfit.hipSpread = 0.08;
      over.push(dress(onePiece.cloth));
    }
  }
  if (cloak) over.push(cloakFront(cloak.cloth));

  const overTorso = pieces(over);
  if (overTorso) outfit.overTorso = overTorso;
  if (cloak) outfit.back = cloakBack(cloak.cloth, !cloak.hood);

  const headwear = pieces([
    cloak?.hood ? hood(cloak.cloth) : undefined,
    hat ? brimHat(hat.cloth) : undefined,
  ]);
  if (headwear) outfit.headwear = headwear;

  if (shoes) {
    const k = cloth(shoes.cloth);
    outfit.boots = {
      fill: k.fill,
      shadow: k.shadow,
      style: shoes.kind === 'sneakers' ? 'sneaker' : 'boot',
    };
  }
  return outfit;
}
