import type { Clothes } from '@studio/shared';
import type { ReactNode } from 'react';
import { EYE_H, EYE_W, EYE_Y, eyeSlots } from '../face/layout';
import { accent, ink, lineWeights, pick, tokens } from '../tokens';
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
  'top-hat',
  'cap',
  'beanie',
  'tie',
  'scarf',
  'sneakers',
  'boots',
  't-shirt',
  'hoodie',
  'jacket',
  'lab-coat',
  'glasses',
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

/** The body of a plain top, shoulder to hem: shared by the T-shirt, the hoodie and what is under a jacket. */
const topBody = (x: (v: number) => number, hem = -0.29) =>
  `M ${x(-0.1)} -1.09 Q 0 -0.97 ${x(0.1)} -1.09 L ${x(0.25)} -1.04 Q ${x(0.29)} -0.9 ${x(0.26)} -0.74 L ${x(0.265)} ${hem} Q 0 ${hem + 0.07} ${x(-0.265)} ${hem} L ${x(-0.26)} -0.74 Q ${x(-0.29)} -0.9 ${x(-0.25)} -1.04 Z`;

/** A plain T-shirt: a round neck and nothing else. Its short sleeves are tubes on the arms. */
export const tShirt = (color: string): Piece =>
  onTorso('tee', color, (c, x, k) => (
    <>
      {shaded(c, 'tee', topBody(x), k)}
      {fold(`M ${x(-0.1)} -1.06 Q 0 -0.93 ${x(0.1)} -1.06`, 'neck')}
    </>
  ));

/**
 * A hoodie: a loose top with a band at the hem, a pouch pocket, two cords, and the hood lying
 * in a roll round the neck.
 */
export const hoodie = (color: string): Piece =>
  onTorso('hoodie', color, (c, x, k) => (
    <>
      {/* The hood, down: a soft roll behind the neck that shows at both sides of it. */}
      {shaded(
        c,
        'hood-roll',
        `M ${x(-0.22)} -1.02 Q ${x(-0.26)} -1.2 ${x(-0.08)} -1.17 Q 0 -1.08 ${x(0.08)} -1.17 Q ${x(0.26)} -1.2 ${x(0.22)} -1.02 Q 0 -0.9 ${x(-0.22)} -1.02 Z`,
        k,
        0.03,
      )}
      {shaded(c, 'hoodie', topBody(x, -0.25), k)}
      {fold(`M ${x(-0.1)} -1.06 Q 0 -0.9 ${x(0.1)} -1.06`, 'neck')}
      {fold(`M ${x(-0.035)} -0.96 L ${x(-0.045)} -0.76`, 'cord-a')}
      {fold(`M ${x(0.035)} -0.96 L ${x(0.045)} -0.78`, 'cord-b')}
      {fold(
        `M ${x(-0.15)} -0.33 L ${x(-0.11)} -0.52 L ${x(0.11)} -0.52 L ${x(0.15)} -0.33`,
        'pouch',
      )}
      {fold(`M ${x(-0.262)} -0.33 Q 0 -0.27 ${x(0.262)} -0.33`, 'band')}
    </>
  ));

/**
 * An open jacket or a lab coat over a plain top. The two fronts hang from the shoulders and
 * leave a strip of the top showing between them; `hem` is how far down they go (a jacket to
 * the hips, a lab coat to the thighs).
 */
const openFront = (name: string, color: string, under: string, hem: number, coat: boolean): Piece =>
  onTorso(name, color, (c, x, k) => {
    const inner = cloth(under);
    const flare = coat ? 0.05 : 0.01;
    const front = (s: 1 | -1) =>
      `M ${x(s * 0.1)} -1.09 L ${x(s * 0.255)} -1.045 Q ${x(s * 0.3)} -0.9 ${x(s * 0.27)} -0.74 L ${x(s * (0.275 + flare))} ${hem} Q ${x(s * 0.16)} ${hem + 0.05} ${x(s * 0.055)} ${hem + 0.02} L ${x(s * 0.06)} -0.7 Z`;
    return (
      <>
        {shaded(c, `${name}-under`, topBody(x), inner, 0.03)}
        {fold(`M ${x(-0.1)} -1.06 Q 0 -0.93 ${x(0.1)} -1.06`, 'neck')}
        {shaded(c, `${name}-l`, front(-1), k)}
        {shaded(c, `${name}-r`, front(1), k)}
        {/* The lapels fold back from the neck. */}
        {fold(`M ${x(-0.1)} -1.09 L ${x(-0.17)} -0.84 L ${x(-0.06)} -0.7`, 'lapel-l')}
        {fold(`M ${x(0.1)} -1.09 L ${x(0.17)} -0.84 L ${x(0.06)} -0.7`, 'lapel-r')}
        {coat ? (
          <>
            {fold(
              `M ${x(0.13)} -0.62 L ${x(0.22)} -0.62 L ${x(0.22)} -0.5 L ${x(0.13)} -0.5 Z`,
              'pocket',
            )}
            {fold(`M ${x(-0.23)} -0.08 L ${x(-0.12)} -0.08`, 'hip-pocket')}
            {[-0.5, -0.3].map((y) => (
              <circle key={y} cx={x(-0.085)} cy={y} r={0.014} fill={ink} />
            ))}
          </>
        ) : (
          fold(`M ${x(0.12)} -0.42 L ${x(0.22)} -0.44`, 'pocket')
        )}
      </>
    );
  });

export const jacket = (color: string, under = 'white'): Piece =>
  openFront('jacket', color, under, -0.27, false);
export const labCoat = (color: string, under = 'white'): Piece =>
  openFront('coat', color, under, 0.3, true);

/**
 * A pair of glasses, in head space: a round frame over each eye, a bridge between them and
 * an arm back to the side of the head. They sit on the eyes wherever the head is turned.
 */
export const glasses: Piece = (c) => {
  if (c.back) return null;
  const slots = eyeSlots(c.turn);
  const frame = lineWeights.outline * 1.5;
  const tint = pick(accent('glint'), 0);
  const lens = slots.map((slot) => ({
    x: slot.x,
    rx: (EYE_W * slot.widthFactor) / 2 + 0.032,
    ry: EYE_H / 2 + 0.028,
  }));
  const near = lens[0];
  const far = lens[1];
  if (!near) return null;
  const line = (d: string, key: string) => (
    <path
      key={key}
      d={d}
      fill="none"
      stroke={ink}
      strokeWidth={frame}
      strokeLinecap={tokens.line.cap}
    />
  );
  return (
    <g key="glasses">
      {/* The arm goes back from the near lens to the side of the head. */}
      {line(
        `M ${near.x - near.rx} ${EYE_Y - 0.02} L ${Math.min(near.x - near.rx - 0.02, -0.47)} ${EYE_Y - 0.05}`,
        'arm',
      )}
      {far &&
        c.turn < 0.25 &&
        line(`M ${far.x + far.rx} ${EYE_Y - 0.02} L 0.47 ${EYE_Y - 0.05}`, 'arm-far')}
      {far &&
        line(
          `M ${near.x + near.rx} ${EYE_Y - 0.03} Q ${(near.x + near.rx + far.x - far.rx) / 2} ${EYE_Y - 0.07} ${far.x - far.rx} ${EYE_Y - 0.03}`,
          'bridge',
        )}
      {[...lens].reverse().map((l, i) => (
        <ellipse
          key={i}
          cx={l.x}
          cy={EYE_Y}
          rx={l.rx}
          ry={l.ry}
          fill={tint}
          fillOpacity={0.16}
          stroke={ink}
          strokeWidth={frame}
        />
      ))}
    </g>
  );
};

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
 * A top hat in head space: a narrow curled brim that crosses the forehead just above the brows
 * and a tall crown, a little wider at the top than at the band. For a gentleman of the 1800s,
 * a showman or a magician.
 */
export const topHat =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const off = lightOffset(c.shadowSide, 0.05);
    return (
      <g key="hat" transform="rotate(-4 0 -0.45)">
        <Shaded
          id={`${c.uid}-brim`}
          d="M -0.66 -0.44 A 0.66 0.07 0 1 0 0.66 -0.44 A 0.66 0.07 0 1 0 -0.66 -0.44 Z"
          fill={k.fill}
          shadow={k.shadow}
          offset={off}
        />
        <Shaded
          id={`${c.uid}-crown`}
          d="M -0.4 -0.45 L -0.44 -1.22 Q 0 -1.3 0.44 -1.22 L 0.4 -0.45 Q 0 -0.39 -0.4 -0.45 Z"
          fill={k.fill}
          shadow={k.shadow}
          offset={off}
        />
        {fold('M -0.408 -0.6 Q 0 -0.54 0.408 -0.6', 'band')}
        {fold('M -0.412 -0.68 Q 0 -0.62 0.412 -0.68', 'band-top')}
      </g>
    );
  };

/**
 * A peaked cap in head space: a round crown that hugs the top of the head, a button on top and
 * a stiff peak that sticks out the way the face is turned. Seen from the front the peak is a
 * short curve over the brows; turned to the side it reaches well past the forehead.
 */
export const cap =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const off = lightOffset(c.shadowSide, 0.05);
    const turn = c.back ? 0 : c.turn;
    const peakX = 0.44 * turn;
    const peakR = 0.36 + 0.07 * turn;
    const peakY = -0.39;
    return (
      <g key="hat" transform="rotate(-3 0 -0.45)">
        <Shaded
          id={`${c.uid}-cap`}
          d="M -0.42 -0.38 Q -0.5 -0.7 0 -0.72 Q 0.5 -0.7 0.42 -0.38 Q 0 -0.33 -0.42 -0.38 Z"
          fill={k.fill}
          shadow={k.shadow}
          offset={off}
        />
        {!c.back && (
          <path
            d={`M ${peakX - peakR} ${peakY} A ${peakR} 0.05 0 1 0 ${peakX + peakR} ${peakY} A ${peakR} 0.05 0 1 0 ${peakX - peakR} ${peakY} Z`}
            fill={k.shadow}
            stroke={ink}
            strokeWidth={lineWeights.outline}
            strokeLinejoin={tokens.line.join}
          />
        )}
        {fold(`M ${0.02 + 0.3 * turn} -0.37 Q ${0.1 * turn} -0.58 0 -0.72`, 'cap-seam')}
        <circle cy={-0.72} r={0.04} fill={k.shadow} stroke={ink} strokeWidth={lineWeights.detail} />
      </g>
    );
  };

/**
 * A knitted beanie in head space: a soft dome pulled down over the top of the head, a turned-up
 * ribbed cuff that crosses the forehead just above the brows, and a bobble on top. It has no
 * peak, so from the front, the side and behind it is the same hat; only its ribs turn.
 */
export const beanie =
  (color: string): Piece =>
  (c) => {
    const k = cloth(color);
    const off = lightOffset(c.shadowSide, 0.05);
    const turn = c.back ? 0 : c.turn;
    // The ribs of the cuff bunch up on the side turned away, as on anything round.
    const rib = (u: number) => 0.4 * Math.sin((u + 0.35 * turn * (1 - u * u)) * (Math.PI / 2));
    return (
      <g key="hat" transform="translate(0 -0.035) rotate(-3 0 -0.45)">
        <Shaded
          id={`${c.uid}-bobble`}
          d="M -0.09 -0.78 A 0.09 0.09 0 1 0 0.09 -0.78 A 0.09 0.09 0 1 0 -0.09 -0.78 Z"
          fill={k.fill}
          shadow={k.shadow}
          offset={lightOffset(c.shadowSide, 0.03)}
        />
        <Shaded
          id={`${c.uid}-beanie`}
          d="M -0.45 -0.42 Q -0.5 -0.73 0 -0.74 Q 0.5 -0.73 0.45 -0.42 Q 0 -0.36 -0.45 -0.42 Z"
          fill={k.fill}
          shadow={k.shadow}
          offset={off}
        />
        <Shaded
          id={`${c.uid}-cuff`}
          d="M -0.47 -0.37 Q -0.5 -0.44 -0.46 -0.5 Q 0 -0.44 0.46 -0.5 Q 0.5 -0.44 0.47 -0.37 Q 0 -0.31 -0.47 -0.37 Z"
          fill={k.fill}
          shadow={k.shadow}
          offset={off}
        />
        {[-0.72, -0.36, 0, 0.36, 0.72].map((u) => {
          const x = rib(u);
          // The cuff's edges bow down in the middle, so each rib stays between them.
          const bow = -0.03 * (x / 0.47) ** 2;
          return fold(`M ${x} ${-0.452 + bow} L ${x * 1.02} ${-0.358 + bow}`, `rib${u}`);
        })}
      </g>
    );
  };

/**
 * A scarf in the torso frame: one soft roll wound round the neck, tucked up under the chin, and
 * a tail that hangs down the front with a fringe at its end. The tail trails a moving body. It
 * is worn over a top, or over the bare torso line of a plain stick figure.
 */
export const scarf = (color: string): Piece =>
  onTorso('scarf', color, (c, x, k) => {
    const hem = hemTrail(c, 0.7);
    const end = { x: x(0.19) + hem.x, y: -0.42 + hem.y };
    const half = 0.115;
    const tail = `M ${x(0.07)} -0.95 L ${x(0.3)} -0.96 Q ${x(0.31)} -0.7 ${end.x + half} ${end.y} Q ${end.x} ${end.y + 0.04} ${end.x - half} ${end.y} Q ${x(0.06)} -0.7 ${x(0.07)} -0.95 Z`;
    return (
      <>
        {shaded(c, 'scarf-tail', tail, k, 0.03)}
        {[-0.07, -0.023, 0.023, 0.07].map((dx) =>
          fold(
            `M ${end.x + dx} ${end.y + 0.02 - Math.abs(dx) * 0.25} L ${end.x + dx * 1.2} ${end.y + 0.1 - Math.abs(dx) * 0.25}`,
            `fringe${dx}`,
          ),
        )}
        {fold(
          `M ${end.x - half + 0.008} ${end.y - 0.07} Q ${end.x} ${end.y - 0.035} ${end.x + half - 0.008} ${end.y - 0.07}`,
          'band',
        )}
        {shaded(
          c,
          'scarf-roll',
          `M ${x(-0.27)} -1.1 Q ${x(-0.36)} -0.99 ${x(-0.27)} -0.89 Q 0 -0.8 ${x(0.27)} -0.89 Q ${x(0.36)} -0.99 ${x(0.27)} -1.1 Q 0 -1.19 ${x(-0.27)} -1.1 Z`,
          k,
          0.045,
        )}
        {fold(`M ${x(-0.28)} -0.99 Q ${x(-0.02)} -0.87 ${x(0.29)} -1.03`, 'wind')}
      </>
    );
  });

/**
 * A necktie in the torso frame: a small knot under the chin and a blade that widens down to a
 * point above the belt, with slanted stripes in a second cloth. It hangs over a shirt, or over
 * the bare torso line of a plain stick figure.
 */
export const tie = (color: string, stripe: string): Piece =>
  onTorso('tie', color, (c, x, k) => {
    const s = cloth(stripe);
    const top = -0.97;
    const wide = -0.44;
    const tip = -0.32;
    // Half the blade's width at a height: narrow under the knot, widest just above the point.
    const half = (y: number) => 0.042 + ((y - top) / (wide - top)) * 0.062;
    // Follow-through (2026-10-14): the blade swings behind a moving body, more toward its point.
    const trail = hemTrail(c, 0.45);
    const along = (y: number) => Math.max(0, (y - top) / (tip - top));
    const sx = (y: number) => trail.x * along(y);
    const sy = (y: number) => trail.y * along(y);
    const at = (dx: number, y: number) => `${x(dx) + sx(y)} ${y + sy(y)}`;
    const band = (y: number, key: string) => (
      <path
        key={key}
        d={`M ${at(-half(y + 0.06), y + 0.06)} L ${at(half(y), y)} L ${at(half(y + 0.05), y + 0.05)} L ${at(-half(y + 0.11), y + 0.11)} Z`}
        fill={s.fill}
      />
    );
    const blade = `M ${at(-half(top), top)} L ${at(half(top), top)} L ${at(half(wide), wide)} L ${at(0, tip)} L ${at(-half(wide), wide)} Z`;
    return (
      <>
        {shaded(c, 'tie-blade', blade, k, 0.02)}
        {[-0.92, -0.78, -0.64].map((y) => band(y, `stripe${y}`))}
        <path
          d={blade}
          fill="none"
          stroke={ink}
          strokeWidth={lineWeights.outline}
          strokeLinejoin={tokens.line.join}
        />
        {shaded(
          c,
          'tie-knot',
          `M ${x(-0.055)} -1.07 L ${x(0.055)} -1.07 L ${x(0.04)} -0.96 L ${x(-0.04)} -0.96 Z`,
          k,
          0.015,
        )}
      </>
    );
  });

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
  const { top, bottom, onePiece, shoes, hat, cloak, tie: necktie, scarf: wrap } = clothes;
  const specs = clothes.glasses ?? false;
  const colors = [
    ...new Set(
      [top, bottom, onePiece, shoes, hat, cloak, necktie, wrap].flatMap((g) =>
        g ? [g.cloth] : [],
      ),
    ),
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
    } else if (top.kind === 't-shirt') {
      outfit.sleeves = { fill: k.fill, shadow: k.shadow, width: 0.17 };
      outfit.sleeveLength = top.sleeves ?? 'short';
      outfit.shoulderSpread = 0.2;
      over.push(tShirt(top.cloth));
    } else if (top.kind === 'hoodie' || top.kind === 'jacket' || top.kind === 'lab-coat') {
      outfit.sleeves = { fill: k.fill, shadow: k.shadow, width: 0.19 };
      outfit.sleeveLength = 'long';
      outfit.shoulderSpread = 0.21;
      over.push(
        top.kind === 'hoodie'
          ? hoodie(top.cloth)
          : top.kind === 'jacket'
            ? jacket(top.cloth, top.under)
            : labCoat(top.cloth, top.under),
      );
      if (top.under && !colors.includes(top.under)) outfit.colors = [...colors, top.under];
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
  if (necktie) over.push(tie(necktie.cloth, necktie.stripe ?? 'gold'));
  if (wrap) over.push(scarf(wrap.cloth));
  if (cloak) over.push(cloakFront(cloak.cloth));

  const overTorso = pieces(over);
  if (overTorso) outfit.overTorso = overTorso;
  if (cloak) outfit.back = cloakBack(cloak.cloth, !cloak.hood);

  const headwear = pieces([
    cloak?.hood ? hood(cloak.cloth) : undefined,
    hat
      ? hat.kind === 'top-hat'
        ? topHat(hat.cloth)
        : hat.kind === 'cap'
          ? cap(hat.cloth)
          : hat.kind === 'beanie'
            ? beanie(hat.cloth)
            : brimHat(hat.cloth)
      : undefined,
    specs ? glasses : undefined,
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
