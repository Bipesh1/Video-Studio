import type { ReactNode } from 'react';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { Blended } from '../explainer/Blend';
import { MASCOT_HEAD, Mascot } from '../explainer/bodyKit';
import { viewOf } from '../explainer/Journey';
import type { View } from '../explainer/Journey';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { VIEWER_FONT } from '../overlays/text';
import { Character } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { point, stand, wave } from '../rig/poses';
import { TonedContext } from '../rig/tone';
import { lighten, mix, shade } from '../tokens';
import { outfitFrom } from '../wardrobe/garments';
import type { Clothes } from '../wardrobe/garments';
import type { Identity } from '../wardrobe/types';

/**
 * How things are drawn: a look test (Biku, 2026-10-22, after the frame-by-frame study of
 * Kurzgesagt in knowledge/playbooks/kurzgesagt-study.md). One picture of What's the Catch?, the
 * inside of your belly above and a burger, a soda and the bathroom scale on a table below, drawn
 * three ways; nothing else changes between them.
 *   1  as now: flat colour, one shadow shape, the style's navy outline
 *   2  no outlines: every shape in three tones of its own colour (a shadow shape, a highlight
 *      where the light falls), lights that glow, the far layer paler
 *   3  the same tones, with a thin edge in a darker tone of each shape's own colour
 */

const J = fineTokens.journey;
const LINE = fineTokens.line;
const font = `${VIEWER_FONT}, Arial, sans-serif`;
export type DrawingLook = 1 | 2 | 3;

type Pt = [number, number];
const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
/** A soft, uneven round shape: a cell, a drop, a cloud of tissue. */
const blob = (cx: number, cy: number, r: number, seed: number, wobble = 0.08, squash = 1) => {
  const n = 9;
  const pts: Pt[] = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wobble * (rnd(seed, i) * 2 - 1);
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * squash];
  });
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const first = mid(pts[n - 1] as Pt, pts[0] as Pt);
  let d = `M ${first[0]} ${first[1]}`;
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % n] as Pt);
    d += ` Q ${p[0]} ${p[1]} ${m[0]} ${m[1]}`;
  });
  return `${d} Z`;
};

/**
 * One shape in the look being tested. The light comes from the upper left: the shadow is the
 * shape's lower right edge, the highlight its upper left. `size` is about the shape's radius.
 */
function Shape({
  id,
  d,
  fill,
  look,
  size,
  flat = false,
  far = 0,
}: {
  id: string;
  d: string;
  fill: string;
  look: DrawingLook;
  size: number;
  /** Drawn in one colour in every look (a screen, a sticker). */
  flat?: boolean;
  /** 0 near, 1 far: the far layer is paler and simpler in looks 2 and 3. */
  far?: number;
}) {
  const base = look === 1 ? fill : lighten(fill, 0.28 * far);
  const off = size * 0.22;
  if (look === 1) {
    return (
      <g>
        <defs>
          <clipPath id={`${id}-c`}>
            <path d={d} />
          </clipPath>
        </defs>
        <path d={d} fill={base} />
        {!flat && (
          <g clipPath={`url(#${id}-c)`}>
            <path d={d} fill={shade(fill, 0.18)} />
            <path d={d} fill={base} transform={`translate(${-off * 0.7} ${-off * 0.7})`} />
          </g>
        )}
        <path d={d} fill="none" stroke={LINE.color} strokeWidth={5} strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={base} />
      {!flat && (
        <g>
          <defs>
            <mask id={`${id}-m`}>
              <path d={d} fill={J.mirrorShine} />
              <path d={d} fill={J.scaleScreen} transform={`translate(${off * 0.4} ${off * 0.4})`} />
            </mask>
          </defs>
          {/* The shadow: its lower right, in a darker tone of its own colour, never grey. */}
          <g clipPath={`url(#${id}-c)`}>
            <path d={d} fill={mix(shade(base, 0.26), J.nucleus, 0.08)} />
            <path d={d} fill={base} transform={`translate(${-off} ${-off})`} />
          </g>
          {/* The highlight: a thin rim on its upper left, where the light falls. */}
          <path d={d} fill={lighten(base, 0.35)} mask={`url(#${id}-m)`} />
        </g>
      )}
      {look === 3 && (
        <path
          d={d}
          fill="none"
          stroke={shade(fill, 0.45)}
          strokeWidth={3.5}
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

/** A soft round light: glows only in looks 2 and 3. */
function Glow({
  id,
  x,
  y,
  r,
  colour,
  look,
  strength = 0.55,
}: {
  id: string;
  x: number;
  y: number;
  r: number;
  colour: string;
  look: DrawingLook;
  strength?: number;
}) {
  if (look === 1) return null;
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={colour} stopOpacity={strength} />
          <stop offset="1" stopColor={colour} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
    </g>
  );
}

/** Inside your belly: tissue far away, a blood vessel with red cells, two big fat cells. */
function Belly({ look }: { look: DrawingLook }) {
  const out: ReactNode[] = [];
  // The far layer: soft lumps of tissue, paler and simpler.
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 125 + rnd(i, 1) * 40;
    const y = 120 + rnd(i, 2) * 760;
    out.push(
      <Shape
        key={`t${i}`}
        id={`w${look}t${i}`}
        d={blob(x, y, 90 + rnd(i, 3) * 60, i + 20, 0.1)}
        fill={J.fleshShade}
        look={look}
        size={110}
        far={1}
      />,
    );
  }
  // A blood vessel crossing the picture, with red cells flowing in it.
  const vessel =
    'M -40 640 C 260 560 520 760 760 660 S 1060 520 1140 560 L 1140 700 C 1000 690 900 800 760 820 S 300 740 -40 790 Z';
  out.push(<Shape key="v" id={`w${look}v`} d={vessel} fill={J.muscle} look={look} size={70} />);
  for (let i = 0; i < 7; i++) {
    const x = 60 + i * 160 + rnd(i, 5) * 30;
    const y = 690 + Math.sin(i * 1.3) * 45 - (i > 3 ? 40 : 0);
    out.push(
      <Shape
        key={`r${i}`}
        id={`w${look}r${i}`}
        d={ell(x, y, 46, 28)}
        fill={J.cell}
        look={look}
        size={40}
      />,
      look === 1 ? (
        <ellipse key={`rc${i}`} cx={x} cy={y} rx={20} ry={10} fill={J.cellCore} />
      ) : (
        <ellipse key={`rc${i}`} cx={x + 3} cy={y + 2} rx={20} ry={10} fill={shade(J.cell, 0.3)} />
      ),
    );
  }
  // Two big fat cells: bags of yellow oil, lit warm.
  const cells: { x: number; y: number; r: number }[] = [
    { x: 330, y: 330, r: 210 },
    { x: 790, y: 420, r: 170 },
  ];
  cells.forEach((c, i) => {
    out.push(
      <Glow
        key={`g${i}`}
        id={`w${look}g${i}`}
        x={c.x}
        y={c.y}
        r={c.r * 1.7}
        colour={J.fatGlow}
        look={look}
        strength={0.45}
      />,
      <Shape
        key={`c${i}`}
        id={`w${look}c${i}`}
        d={blob(c.x, c.y, c.r, i + 3, 0.06)}
        fill={J.fat}
        look={look}
        size={c.r}
      />,
      <Shape
        key={`n${i}`}
        id={`w${look}n${i}`}
        d={ell(c.x + c.r * 0.55, c.y + c.r * 0.45, c.r * 0.16, c.r * 0.11)}
        fill={J.nucleus}
        look={look}
        size={c.r * 0.15}
      />,
    );
    // Little drops of oil inside, and a shine on the cell's wall where the light falls.
    for (let k = 0; k < 4; k++) {
      const a = rnd(i * 10 + k, 7) * Math.PI * 2;
      const d = c.r * (0.25 + 0.3 * rnd(i * 10 + k, 8));
      out.push(
        <circle
          key={`o${i}${k}`}
          cx={c.x + Math.cos(a) * d}
          cy={c.y + Math.sin(a) * d}
          r={c.r * (0.05 + 0.04 * rnd(k, i))}
          fill={look === 1 ? J.fatShade : J.fatLight}
          opacity={look === 1 ? 0.8 : 0.7}
        />,
      );
    }
    if (look !== 1)
      out.push(
        <path
          key={`s${i}`}
          d={`M ${c.x - c.r * 0.72} ${c.y - c.r * 0.1} Q ${c.x - c.r * 0.66} ${c.y - c.r * 0.62} ${c.x - c.r * 0.12} ${c.y - c.r * 0.74}`}
          fill="none"
          stroke={J.fatGlow}
          strokeWidth={c.r * 0.07}
          strokeLinecap="round"
          opacity={0.85}
        />,
      );
  });
  return (
    <g>
      <rect width={1080} height={1000} fill={mix(J.bodyMid, J.flesh, 0.12)} />
      {out}
    </g>
  );
}

/** A table by a window: a burger on a plate, a glass of soda, the bathroom scale on the floor. */
function Table({ look }: { look: DrawingLook }) {
  const y0 = 1000;
  const lit = look !== 1;
  return (
    <g>
      <rect x={0} y={y0} width={1080} height={920} fill={J.wall} />
      {/* The window the light comes from, upper left. */}
      <Glow
        id={`w${look}win`}
        x={190}
        y={y0 + 230}
        r={420}
        colour={J.spot}
        look={look}
        strength={0.5}
      />
      <Shape
        id={`w${look}wf`}
        d={rr(60, y0 + 70, 270, 330, 18)}
        fill={J.wood}
        look={look}
        size={40}
      />
      <Shape
        id={`w${look}wg`}
        d={rr(84, y0 + 94, 222, 282, 8)}
        fill={J.sky}
        look={look}
        size={40}
        flat={!lit}
      />
      {lit &&
        [0, 1].map((i) => (
          <path
            key={i}
            d={`M ${120 + i * 70} ${y0 + 370} L ${230 + i * 70} ${y0 + 110} L ${262 + i * 70} ${y0 + 110} L ${152 + i * 70} ${y0 + 370} Z`}
            fill={J.mirrorShine}
            opacity={0.35}
          />
        ))}
      {/* The floor and the table. */}
      <rect x={0} y={y0 + 760} width={1080} height={160} fill={J.counterShade} />
      <Shape
        id={`w${look}tt`}
        d={rr(330, y0 + 470, 720, 60, 14)}
        fill={J.wood}
        look={look}
        size={30}
      />
      <Shape
        id={`w${look}tl1`}
        d={rr(380, y0 + 520, 40, 260, 8)}
        fill={J.woodShade}
        look={look}
        size={20}
      />
      <Shape
        id={`w${look}tl2`}
        d={rr(960, y0 + 520, 40, 260, 8)}
        fill={J.woodShade}
        look={look}
        size={20}
      />
      {/* The plate and the burger. */}
      <Shape
        id={`w${look}pl`}
        d={ell(560, y0 + 468, 170, 26)}
        fill={J.plate}
        look={look}
        size={40}
      />
      <Shape
        id={`w${look}b1`}
        d={rr(445, y0 + 410, 230, 50, 24)}
        fill={J.bun}
        look={look}
        size={40}
      />
      <Shape
        id={`w${look}pt`}
        d={rr(432, y0 + 380, 256, 40, 18)}
        fill={J.patty}
        look={look}
        size={30}
      />
      <Shape
        id={`w${look}ch`}
        d={`M 440 ${y0 + 372} L 680 ${y0 + 372} L 660 ${y0 + 400} L 560 ${y0 + 392} L 470 ${y0 + 404} Z`}
        fill={J.cheese}
        look={look}
        size={20}
      />
      <Shape
        id={`w${look}le`}
        d={rr(436, y0 + 356, 248, 22, 11)}
        fill={J.lettuce}
        look={look}
        size={18}
      />
      <Shape
        id={`w${look}b2`}
        d={`M 445 ${y0 + 362} C 445 ${y0 + 250} 675 ${y0 + 250} 675 ${y0 + 362} Z`}
        fill={J.bun}
        look={look}
        size={90}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={i}
          cx={500 + i * 30 + rnd(i, 4) * 10}
          cy={y0 + 300 + rnd(i, 5) * 22}
          rx={6}
          ry={3.5}
          fill={J.sign}
        />
      ))}
      {/* The glass of soda, with its shine. */}
      <Shape
        id={`w${look}sd`}
        d={rr(800, y0 + 300, 120, 168, 14)}
        fill={J.soda}
        look={look}
        size={50}
      />
      <path
        d={rr(790, y0 + 250, 140, 220, 18)}
        fill={J.glass}
        opacity={0.35}
        stroke={look === 1 ? LINE.color : look === 3 ? J.glassEdge : 'none'}
        strokeWidth={look === 1 ? 5 : 3}
      />
      {lit && (
        <path
          d={`M 812 ${y0 + 440} L 850 ${y0 + 270} L 872 ${y0 + 270} L 834 ${y0 + 440} Z`}
          fill={J.mirrorShine}
          opacity={0.45}
        />
      )}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={830 + i * 28} cy={y0 + 340 + i * 30} r={6} fill={J.sodaLight} />
      ))}
      {/* The bathroom scale on the floor, its number lit. */}
      <Shape
        id={`w${look}sc`}
        d={rr(90, y0 + 760, 260, 64, 22)}
        fill={J.scaleBody}
        look={look}
        size={40}
      />
      <Shape
        id={`w${look}ss`}
        d={rr(160, y0 + 772, 120, 34, 8)}
        fill={J.scaleScreen}
        look={look}
        size={20}
        flat
      />
      <Glow
        id={`w${look}sg`}
        x={220}
        y={y0 + 789}
        r={80}
        colour={J.scaleDigits}
        look={look}
        strength={0.35}
      />
      <text
        x={220}
        y={y0 + 800}
        fontFamily={font}
        fontWeight={800}
        fontSize={26}
        fill={J.scaleDigits}
        textAnchor="middle"
      >
        71.0
      </text>
      {/* A soft shadow under each thing in looks 2 and 3, from the window's light. */}
      {lit && (
        <g opacity={0.18}>
          <ellipse cx={600} cy={y0 + 800} rx={330} ry={22} fill={J.shadow} />
          <ellipse cx={240} cy={y0 + 830} rx={150} ry={10} fill={J.shadow} />
        </g>
      )}
    </g>
  );
}

const NAMES: Record<DrawingLook, string> = {
  1: '1  AS NOW: NAVY OUTLINE',
  2: '2  NO OUTLINES, THREE TONES',
  3: '3  TONES + THIN OWN-COLOUR EDGE',
};

/** The whole test picture in one look, 1080 by 1920. */
export function DrawingLookSheet({ look }: { look: DrawingLook }) {
  return (
    <g>
      <Belly look={look} />
      <Table look={look} />
      <rect x={0} y={0} width={1080} height={96} fill={LINE.color} opacity={0.8} />
      <text
        x={540}
        y={64}
        fontFamily={font}
        fontWeight={800}
        fontSize={44}
        fill={J.sign}
        textAnchor="middle"
      >
        {NAMES[look]}
      </text>
    </g>
  );
}

/**
 * The people in the picked look (2, Biku 2026-10-22: "2 looks good"), beside them as now: the
 * channel's mascot and three experts, close on the dark hall above and full length against a
 * light wall below, all in the blended look C as in the videos.
 */
const EXPERT_LOOKS: { identity: Identity; clothes: Clothes; x: number; face: ExpressionName }[] = [
  {
    identity: { skinTone: 6, hair: 'short-crop', hairColor: 'gray' },
    clothes: {
      top: { kind: 'lab-coat', cloth: 'white', under: 'glint' },
      bottom: { kind: 'trousers', cloth: 'denim' },
    },
    x: -0.78,
    face: 'happy',
  },
  {
    identity: { skinTone: 2, hair: 'locs', hairColor: 'auburn' },
    clothes: {
      top: { kind: 't-shirt', cloth: 'gold' },
      bottom: { kind: 'trousers', cloth: 'denim' },
    },
    x: 0.8,
    face: 'smug',
  },
];

function PeopleIn({ toned }: { toned: boolean }) {
  // Close on the dark hall: a head is about 250 pixels across.
  const near = viewOf({ x: 0, y: 0, w: 2.1 }, 1080, 1920);
  // Full length against a light wall: the floor near the bottom.
  const far = viewOf({ x: 0, y: -3.0, w: 3.6 }, 1080, 1920);
  const expert = (e: (typeof EXPERT_LOOKS)[number], v: View, ground: number, i: number) => {
    const [sx, sy] = [540 + e.x * v.k, v.fy + (ground - v.cam.y) * v.k];
    return (
      <Blended
        key={i}
        id={`wp-${toned}-e${i}-${ground}`}
        u={Math.min(2.2, (0.49 * v.k) / 120)}
        light={J.spotWarm}
      >
        <Character
          x={sx}
          groundY={sy}
          head={MASCOT_HEAD * v.k}
          facing={e.x < 0 ? 'right' : 'left'}
          pose={resolvePose(stand)}
          face={EXPRESSIONS[e.face]}
          turn={0.25}
          identity={e.identity}
          outfit={outfitFrom(e.clothes)}
        />
      </Blended>
    );
  };
  return (
    <TonedContext.Provider value={toned}>
      <defs>
        <clipPath id={`wp-top-${toned}`}>
          <rect x={0} y={0} width={1080} height={960} />
        </clipPath>
      </defs>
      <rect x={0} y={0} width={1080} height={960} fill={J.hallWall} />
      <g clipPath={`url(#wp-top-${toned})`}>
        {EXPERT_LOOKS.map((e, i) => expert(e, near, 0.95, i))}
        <Mascot
          v={near}
          x={0}
          ground={1.15}
          pose={resolvePose(wave)}
          face={EXPRESSIONS.happy}
          id={`wp-${toned}-m1`}
          light={J.spotWarm}
        />
      </g>
      <rect x={0} y={960} width={1080} height={960} fill={J.wall} />
      <rect x={0} y={1790} width={1080} height={130} fill={J.counterShade} />
      <Mascot
        v={far}
        x={-0.55}
        ground={0.45}
        pose={resolvePose(point)}
        face={EXPRESSIONS.surprised}
        id={`wp-${toned}-m2`}
        turn={0.45}
      />
      {expert({ ...EXPERT_LOOKS[0]!, x: 0.75, face: 'thinking' }, far, 0.45, 5)}
    </TonedContext.Provider>
  );
}

export function DrawingPeopleSheet({ look }: { look: 1 | 2 }) {
  return (
    <g>
      <PeopleIn toned={look === 2} />
      <rect x={0} y={0} width={1080} height={96} fill={LINE.color} opacity={0.8} />
      <text
        x={540}
        y={64}
        fontFamily={font}
        fontWeight={800}
        fontSize={44}
        fill={J.sign}
        textAnchor="middle"
      >
        {look === 1 ? '1  AS NOW: NAVY OUTLINE' : '2  NO OUTLINES, TONES'}
      </text>
    </g>
  );
}
