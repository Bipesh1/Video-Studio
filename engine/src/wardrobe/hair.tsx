import type { ReactNode } from 'react';
import { MOUTH_Y, TURN } from '../face/layout';
import { body } from '../rig/body';
import { clamp, lerp, stops } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { MASK_HIDE, MASK_SHOW, accent, ink, lineWeights, pick, shade, tokens } from '../tokens';
import { fadeColor } from './identity';
import type { HairColors } from './identity';
import { Shaded, lightOffset } from './Shaded';
import type { FacialHair, HairStyle } from './types';

/**
 * Hair library starter set (Style 3.4), drawn in head space: origin at the head center,
 * head radius 0.5 wide, slightly taller. Every shape is flat, outlined, with one shadow tone.
 */

const RX = body.headRadiusX;
const RY = body.headRadiusY;

type HairCtx = {
  hair: HairColors;
  skin: string;
  turn: number;
  shadowSide: 1 | -1;
  uid: string;
  /** Accent name for a head wrap. */
  wrap: string;
  /** How far loose hair trails the head, in head units. Left out or zero: it hangs straight. */
  sway?: Vec2;
  /** Seen from behind: the hair covers the whole head, with no face showing through. */
  back?: boolean;
};

type HairShape = { d: string; fill: string; shadow: string };

type HairDraw = {
  /** Behind the head: buns, ponytails, hanging locs and braids. */
  back: HairShape[];
  /** Over the head, masked out of the face below the hairline. */
  front: HairShape[];
  /** Where the hair meets the forehead: the top of the curve and the y where it meets the head edge. */
  hairline?: { top: number; side: number };
  /** Detail lines in front (folds, wraps), masked like the front shapes. */
  details?: ReactNode;
  /** Detail lines on back pieces. */
  backDetails?: ReactNode;
};

/** The part of an ellipse above a horizontal line, as a closed path. */
function topCap(rx: number, ry: number, cy: number, limitY: number): string {
  const dy = clamp((limitY - cy) / ry, -0.999, 0.999);
  const x = rx * Math.sqrt(1 - dy * dy);
  const large = limitY > cy ? 1 : 0;
  return `M ${-x} ${limitY} A ${rx} ${ry} 0 ${large} 1 ${x} ${limitY} Z`;
}

/** A circle with rounded bumps around its edge, for afros and curls. */
function scallop(cx: number, cy: number, r: number, bumps: number, amp: number): string {
  const at = (a: number, rr: number) => `${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
  let d = `M ${at(0, r)}`;
  for (let k = 0; k < bumps; k++) {
    const a0 = (k / bumps) * Math.PI * 2;
    const a1 = ((k + 1) / bumps) * Math.PI * 2;
    d += ` Q ${at((a0 + a1) / 2, r + amp * 2)} ${at(a1, r)}`;
  }
  return `${d} Z`;
}

/** A rounded strand from a to b, width w: one loc or braid. */
function strand(a: Vec2, b: Vec2, w: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (w / 2);
  const ny = (dx / len) * (w / 2);
  const r = w / 2;
  return `M ${a.x + nx} ${a.y + ny} L ${b.x + nx} ${b.y + ny} A ${r} ${r} 0 0 0 ${b.x - nx} ${b.y - ny} L ${a.x - nx} ${a.y - ny} A ${r} ${r} 0 0 0 ${a.x + nx} ${a.y + ny} Z`;
}

const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;

/** A point on the head outline at an angle (radians, y down). */
const onHead = (a: number): Vec2 => ({ x: RX * Math.cos(a), y: RY * Math.sin(a) });

/**
 * The hairline: from the back side of the head to the front side, peaking at `top`.
 * As the head turns toward profile, the back end moves down to the nape.
 */
function hairlinePoints(top: number, side: number, turn: number) {
  const aR = Math.asin(clamp(side / RY, -0.99, 0.99));
  const aL = Math.PI - aR - turn * 0.9;
  const right = onHead(aR);
  const left = onHead(aL);
  const ctrl = { x: lerp(0, 0.18, turn), y: 2 * top - (left.y + right.y) / 2 };
  return { left, right, ctrl, span: aL - aR };
}

/** The face area below the hairline, used to mask front hair. */
function faceRegion(top: number, side: number, turn: number): string {
  const { left, right, ctrl, span } = hairlinePoints(top, side, turn);
  const large = span > Math.PI ? 1 : 0;
  return `M ${left.x} ${left.y} Q ${ctrl.x} ${ctrl.y} ${right.x} ${right.y} A ${RX + 0.005} ${RY + 0.005} 0 ${large} 1 ${left.x} ${left.y} Z`;
}

const detail = (d: string, key: string | number) => (
  <path
    key={key}
    d={d}
    fill="none"
    stroke={ink}
    strokeWidth={lineWeights.detail}
    strokeLinecap={tokens.line.cap}
  />
);

function strands(
  c: HairCtx,
  xs: readonly number[],
  width: number,
  length: number,
  pattern: 'locs' | 'braids',
): { shapes: HairShape[]; lines: ReactNode[] } {
  const shapes: HairShape[] = [];
  const lines: ReactNode[] = [];
  const back = -0.28 * c.turn;
  const trail = c.sway?.x ?? 0;
  xs.forEach((x0, i) => {
    // In profile the strands on the face side are hidden behind the head.
    if (c.turn > 0.5 && x0 > 0.15) return;
    const a = { x: x0 * 0.92 + back, y: -0.12 };
    const b = {
      x: x0 * 1.08 + back + Math.sign(x0) * 0.03 - trail * 0.8,
      y: length - 0.06 * Math.abs(Math.cos(i)),
    };
    shapes.push({ d: strand(a, b, width), fill: c.hair.fill, shadow: c.hair.shadow });
    for (let k = 1; k <= (pattern === 'braids' ? 6 : 3); k++) {
      const t = k / (pattern === 'braids' ? 7 : 4);
      const p = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
      const h = width * 0.42;
      lines.push(
        detail(
          pattern === 'braids'
            ? `M ${p.x - h} ${p.y - 0.02} L ${p.x} ${p.y + 0.015} L ${p.x + h} ${p.y - 0.02}`
            : `M ${p.x - h} ${p.y} Q ${p.x} ${p.y + 0.025} ${p.x + h} ${p.y}`,
          `${i}-${k}`,
        ),
      );
    }
  });
  return { shapes, lines };
}

function draw(style: HairStyle, c: HairCtx): HairDraw {
  const h = c.hair;
  const solid = (d: string): HairShape => ({ d, fill: h.fill, shadow: h.shadow });
  switch (style) {
    case 'bald':
      return { back: [], front: [] };
    case 'short-crop':
      return {
        back: [],
        front: [solid(topCap(0.535, 0.555, 0, -0.02))],
        hairline: { top: -0.42, side: -0.14 },
      };
    case 'fade': {
      const faded = fadeColor(h, c.skin);
      return {
        back: [],
        front: [
          { d: topCap(0.515, 0.535, 0, 0.02), fill: faded, shadow: shade(faded, 0.15) },
          solid(topCap(0.545, 0.62, -0.05, -0.26)),
        ],
        hairline: { top: -0.44, side: -0.08 },
      };
    }
    case 'afro':
      return {
        back: [],
        front: [solid(scallop(0, -0.24, 0.72, 18, 0.045))],
        hairline: { top: -0.41, side: -0.02 },
      };
    case 'locs':
    case 'braids': {
      const braids = style === 'braids';
      const xs = braids
        ? [-0.56, -0.47, -0.38, -0.29, 0.29, 0.38, 0.47, 0.56]
        : [-0.55, -0.43, -0.31, 0.31, 0.43, 0.55];
      const s = strands(
        c,
        xs,
        braids ? 0.085 : 0.11,
        braids ? 0.95 : 0.82,
        braids ? 'braids' : 'locs',
      );
      return {
        back: s.shapes,
        backDetails: s.lines,
        front: [solid(topCap(0.55, 0.57, 0, 0.0))],
        hairline: { top: -0.41, side: -0.12 },
        details: braids
          ? [-0.18, 0, 0.18].map((x, i) =>
              detail(`M ${x * 1.4} -0.5 Q ${x} -0.4 ${x * 0.9} -0.3`, i),
            )
          : null,
      };
    }
    case 'straight-bob':
      return {
        back: [],
        front: [solid(topCap(0.58, 0.6, -0.02, 0.34))],
        hairline: { top: -0.4, side: 0.02 },
        details: [detail('M 0.05 -0.6 Q 0.12 -0.45 0.1 -0.33', 0)],
      };
    case 'long': {
      // Hair falling behind the shoulders. As the head turns it gathers behind the head.
      const dx = -0.2 * c.turn;
      const right = 0.52 - 0.62 * c.turn;
      // The ends trail the head when it moves and swing past when it stops.
      const tx = -(c.sway?.x ?? 0) * 1.3;
      const fall = `M ${dx - 0.52} -0.25 Q ${dx - 0.66 + tx * 0.4} 0.45 ${dx - 0.5 + tx} 0.98 Q ${dx - 0.2 + tx} 1.08 ${dx + right * 0.2 + tx} 1.02 Q ${dx + right * 0.95 + tx} 1.02 ${dx + right + tx} 0.9 Q ${dx + right * 1.22 + tx * 0.4} 0.4 ${dx + right} -0.25 Z`;
      return {
        back: [solid(fall)],
        backDetails: [
          detail(
            `M ${dx - 0.36 + tx * 0.5} 0.5 Q ${dx - 0.4 + tx * 0.8} 0.8 ${dx - 0.34 + tx} 1.0`,
            'l1',
          ),
          detail(
            `M ${dx - 0.14 + tx * 0.6} 0.62 Q ${dx - 0.17 + tx * 0.8} 0.85 ${dx - 0.12 + tx} 1.03`,
            'l2',
          ),
        ],
        front: [solid(topCap(0.57, 0.59, -0.02, 0.12))],
        hairline: { top: -0.4, side: -0.02 },
        details: [detail('M 0.05 -0.6 Q 0.12 -0.45 0.1 -0.33', 0)],
      };
    }
    case 'bun': {
      const bx = -0.24 * c.turn;
      const by = -0.6 + 0.1 * c.turn;
      return {
        back: [solid(ellipse(bx, by, 0.18, 0.16))],
        backDetails: detail(
          `M ${bx - 0.08} ${by} Q ${bx} ${by - 0.1} ${bx + 0.08} ${by + 0.02}`,
          'bun',
        ),
        front: [solid(topCap(0.53, 0.55, 0, -0.04))],
        hairline: { top: -0.42, side: -0.12 },
      };
    }
    case 'ponytail': {
      const bx = -0.3 - 0.16 * c.turn;
      const by = -0.3;
      const tip = { x: -0.52 - 0.14 * c.turn - (c.sway?.x ?? 0) * 1.2, y: 0.55 };
      const tail = `M ${bx - 0.09} ${by} Q ${bx - 0.3} ${by + 0.4} ${tip.x} ${tip.y} Q ${bx + 0.05} ${by + 0.35} ${bx + 0.09} ${by} Z`;
      return {
        back: [
          solid(tail),
          { d: ellipse(bx, by + 0.03, 0.07, 0.05), fill: h.shadow, shadow: shade(h.shadow, 0.15) },
        ],
        front: [solid(topCap(0.53, 0.55, 0, -0.04))],
        hairline: { top: -0.42, side: -0.12 },
      };
    }
    case 'head-wrap': {
      const fabric = accent(c.wrap);
      const f = { fill: pick(fabric, 0), shadow: pick(fabric, 1) };
      return {
        back: [],
        front: [
          { d: ellipse(0.02, -0.52, 0.46, 0.32), ...f },
          { d: topCap(0.56, 0.6, -0.04, -0.04), ...f },
          { d: ellipse(0.16, -0.78, 0.12, 0.09), ...f },
          { d: ellipse(-0.05, -0.8, 0.12, 0.09), ...f },
        ],
        hairline: { top: -0.38, side: -0.16 },
        details: [
          detail('M -0.42 -0.3 Q -0.1 -0.62 0.4 -0.42', 0),
          detail('M -0.3 -0.52 Q 0.05 -0.74 0.34 -0.62', 1),
        ],
      };
    }
  }
}

/** Hair behind the head: drawn before the head fill. */
export const HairBack = ({ style, ctx }: { style: HairStyle; ctx: HairCtx }) => {
  const d = draw(style, ctx);
  const off = lightOffset(ctx.shadowSide, 0.05);
  return (
    <g>
      {d.back.map((s, i) => (
        <Shaded
          key={i}
          id={`${ctx.uid}-hb${i}`}
          d={s.d}
          fill={s.fill}
          shadow={s.shadow}
          offset={off}
        />
      ))}
      {d.backDetails}
    </g>
  );
};

/** Hair over the head: drawn after the head outline, kept out of the face below the hairline. */
export const HairFront = ({ style, ctx }: { style: HairStyle; ctx: HairCtx }) => {
  const d = draw(style, ctx);
  if (!d.hairline || d.front.length === 0) return null;
  const { top, side } = d.hairline;
  const { left, right, ctrl } = hairlinePoints(top, side, ctx.turn);
  const maskId = `${ctx.uid}-face`;
  const hairClip = `${ctx.uid}-hairclip`;
  const off = lightOffset(ctx.shadowSide, 0.07);
  // As the head turns, the hair mass swings down at the back of the head and up at the front.
  const swing = `rotate(${-40 * ctx.turn})`;
  return (
    <g>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-2} y={-2} width={4} height={4}>
          <rect x={-2} y={-2} width={4} height={4} fill={MASK_SHOW} />
          {!ctx.back && <path d={faceRegion(top, side, ctx.turn)} fill={MASK_HIDE} />}
        </mask>
        <clipPath id={hairClip}>
          {d.front.map((s, i) => (
            <path key={i} d={s.d} transform={swing} />
          ))}
        </clipPath>
      </defs>
      <g mask={`url(#${maskId})`}>
        <g transform={swing}>
          {d.front.map((s, i) => (
            <Shaded
              key={i}
              id={`${ctx.uid}-hf${i}`}
              d={s.d}
              fill={s.fill}
              shadow={s.shadow}
              offset={off}
              // On the back of a head the hair is one mass: the edge of its cap is not drawn.
              outline={!ctx.back}
            />
          ))}
          {!ctx.back && d.details}
        </g>
        {/* The hairline: only where there is hair, and only its hair-side half survives the
            face mask, so it shows one outline wide. There is none on the back of a head. */}
        {!ctx.back && (
          <path
            d={`M ${left.x} ${left.y} Q ${ctrl.x} ${ctrl.y} ${right.x} ${right.y}`}
            clipPath={`url(#${hairClip})`}
            fill="none"
            stroke={ink}
            strokeWidth={lineWeights.outline * 2}
            strokeLinecap={tokens.line.cap}
          />
        )}
      </g>
    </g>
  );
};

/** Beard or moustache, in head space, following the mouth as the head turns. */
export const FacialHairShape = ({ kind, ctx }: { kind: FacialHair; ctx: HairCtx }) => {
  if (kind === 'none') return null;
  const s = stops(ctx.turn, TURN.mouthShift);
  const off = lightOffset(ctx.shadowSide, 0.05);
  if (kind === 'moustache') {
    const w = 0.12 * stops(ctx.turn, TURN.mouthWidth);
    const y = MOUTH_Y - 0.055;
    const d = `M ${s - w} ${y + 0.025} Q ${s - w * 0.7} ${y - 0.05} ${s} ${y - 0.012} Q ${s + w * 0.7} ${y - 0.05} ${s + w} ${y + 0.025} Q ${s} ${y + 0.005} ${s - w} ${y + 0.025} Z`;
    return (
      <Shaded
        id={`${ctx.uid}-mo`}
        d={d}
        fill={ctx.hair.fill}
        shadow={ctx.hair.shadow}
        offset={off}
      />
    );
  }
  // A jaw beard: from the jaw on one side, around below the chin, to the other jaw,
  // with its top edge below the mouth so the mouth and cheeks stay clear.
  const r = onHead(0.38);
  const l = onHead(Math.PI - 0.38 - ctx.turn * 0.5);
  const chin = { x: s * 0.6, y: RY + 0.12 };
  const innerR = Math.min(0.3 + s, 0.4);
  const innerL = Math.max(-0.3 + s, l.x + 0.06);
  const d =
    `M ${r.x} ${r.y} Q ${RX + 0.04} ${RY * 0.95} ${chin.x} ${chin.y} ` +
    `Q ${l.x - 0.04} ${RY * 0.95} ${l.x} ${l.y} ` +
    `L ${innerL} ${MOUTH_Y + 0.06} Q ${s} ${MOUTH_Y + 0.26} ${innerR} ${MOUTH_Y + 0.06} Z`;
  return (
    <Shaded id={`${ctx.uid}-bd`} d={d} fill={ctx.hair.fill} shadow={ctx.hair.shadow} offset={off} />
  );
};

export type { HairCtx };

/** Styles whose back hair falls behind the whole body, so it is drawn before the body. */
export const HAIR_BEHIND_BODY: readonly HairStyle[] = ['long'];

export const HAIR_STYLES: readonly HairStyle[] = [
  'bald',
  'short-crop',
  'fade',
  'afro',
  'locs',
  'braids',
  'straight-bob',
  'long',
  'bun',
  'ponytail',
  'head-wrap',
];
