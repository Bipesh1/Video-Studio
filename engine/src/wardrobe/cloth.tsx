import type { ReactNode } from 'react';
import { accent, ink, lineWeights, pick, tokens, white } from '../tokens';
import { DEG, lerp } from '../rig/math';
import type { Vec2 } from '../rig/math';
import type { LegJoints } from '../rig/types';
import type { PieceContext } from './types';

/** A cloth color: a fill and its one shadow tone (Style 3.3). */
export type Cloth = { fill: string; shadow: string };

/**
 * Cloth colors come from the token accents, plus white (the head fill with the head shadow).
 * Garments name a color; they never carry a color value of their own.
 */
export const CLOTH_COLORS = ['white', ...Object.keys(tokens.accents)] as const;

export function cloth(name: string): Cloth {
  if (name === 'white') return { fill: white, shadow: tokens.fill.headShadow };
  const a = accent(name);
  return { fill: pick(a, 0), shadow: pick(a, 1) };
}

/** Torso frame: origin at the hip, up is -y, the neck at y = -1.1. It leans with the torso. */
export const torsoFrame = (c: PieceContext) =>
  `translate(${c.j.hip.x} ${c.j.hip.y}) rotate(${c.lean})`;

/** A body garment narrows a little as the body turns toward profile. */
export const turnWidth = (c: PieceContext) => 1 - 0.3 * c.turn;

/** A thin inner detail line: a fold, a seam, a waistband. */
export const fold = (d: string, key?: string): ReactNode => (
  <path
    key={key}
    d={d}
    fill="none"
    stroke={ink}
    strokeWidth={lineWeights.detail}
    strokeLinecap={tokens.line.cap}
    strokeLinejoin={tokens.line.join}
  />
);

/** The outline of only part of a shape, for edges that must not be closed off. */
export const edge = (d: string, key?: string): ReactNode => (
  <path
    key={key}
    d={d}
    fill="none"
    stroke={ink}
    strokeWidth={lineWeights.outline}
    strokeLinecap={tokens.line.cap}
    strokeLinejoin={tokens.line.join}
  />
);

/** How far a hanging hem moves for a given sway, and how much it lifts as it swings out. */
const HEM_REACH = 1.7;
const HEM_LIFT = 0.18;
/** A hem never swings farther than this, in head units, however fast the body moves. */
const HEM_MAX = 0.42;

/**
 * Where the hem of a cape or cloak sits for the body's sway, in the torso frame: it trails
 * behind a moving body (x) and lifts a little as it swings (y, negative is up).
 */
export function hemTrail(c: PieceContext, reach = HEM_REACH): { x: number; y: number } {
  const x = Math.max(-HEM_MAX, Math.min(HEM_MAX, -c.sway.x * reach));
  return { x, y: -Math.abs(x) * HEM_LIFT + c.sway.y * 0.5 };
}

/** A point given in the torso frame, as a point of the character. */
export function fromTorso(c: PieceContext, x: number, y: number): Vec2 {
  const cos = Math.cos(c.lean * DEG);
  const sin = Math.sin(c.lean * DEG);
  return { x: c.j.hip.x + x * cos - y * sin, y: c.j.hip.y + x * sin + y * cos };
}

/** The outline round a set of points, like a band stretched round pins. */
function outlineOf(points: readonly Vec2[]): Vec2[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Vec2, a: Vec2, b: Vec2) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (list: readonly Vec2[]) => {
    const out: Vec2[] = [];
    for (const p of list) {
      while (out.length >= 2) {
        const a = out[out.length - 2];
        const b = out[out.length - 1];
        if (!a || !b || cross(a, b, p) > 0) break;
        out.pop();
      }
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

/** How much a hanging hem keeps widening, as a share of how far it hangs. */
const HEM_SPREAD = 0.45;
/** How round the corners of draped cloth are, in head units. */
const DRAPE_CORNER = 0.09;
/** Outline points closer together than this count as one corner. */
const SAME_CORNER = 0.03;

/** A closed path through the points with every corner rounded off, as cloth is never sharp. */
function softPath(points: readonly Vec2[], radius: number): string {
  const corners = points.filter((p, i) => {
    const prev = points[(i + points.length - 1) % points.length];
    return !prev || Math.hypot(p.x - prev.x, p.y - prev.y) > SAME_CORNER;
  });
  const toward = (from: Vec2, to: Vec2): Vec2 => {
    const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
    const r = Math.min(radius, len / 2);
    return { x: from.x + ((to.x - from.x) / len) * r, y: from.y + ((to.y - from.y) / len) * r };
  };
  const n = corners.length;
  const parts = corners.map((p, i) => {
    const before = toward(p, corners[(i + n - 1) % n] ?? p);
    const after = toward(p, corners[(i + 1) % n] ?? p);
    return `${i === 0 ? 'M' : 'L'} ${before.x} ${before.y} Q ${p.x} ${p.y} ${after.x} ${after.y}`;
  });
  return `${parts.join(' ')} Z`;
}

/**
 * How a skirt hangs (Biku, 2026-10-06: "the grandma is sitting but the clothes is straight").
 * Sizes are in head units for a body seen from the front; they narrow as the body turns.
 */
export type Drape = {
  /** Half the width at the waist and at the hips. */
  waist: number;
  hips: number;
  /** How far down each leg the cloth is held out by the leg. */
  length: number;
  /** Half the width at the hem. */
  flare: number;
  /** How far the hem hangs straight down below where the leg stops holding it. */
  drop: number;
};

const SHAPES = {
  knee: { waist: 0.24, hips: 0.3, length: 0.5, flare: 0.43, drop: 0.14 },
  ankle: { waist: 0.27, hips: 0.32, length: 1.06, flare: 0.44, drop: 0.16 },
  floor: { waist: 0.2, hips: 0.34, length: 1.12, flare: 0.56, drop: 0.2 },
} as const satisfies Record<string, Drape>;

/** The three skirt lengths every skirt, dress, robe and gown is cut to. */
export const DRAPES: Readonly<Record<keyof typeof SHAPES, Drape>> = SHAPES;

/** A point a given way down a leg from the hip, and the direction straight out from the leg. */
function downLeg(leg: LegJoints, far: number): { at: Vec2; out: Vec2 } {
  const thigh = Math.hypot(leg.knee.x - leg.hip.x, leg.knee.y - leg.hip.y) || 1;
  const shin = Math.hypot(leg.foot.x - leg.knee.x, leg.foot.y - leg.knee.y) || 1;
  const onThigh = far <= thigh;
  const a = onThigh ? leg.hip : leg.knee;
  const b = onThigh ? leg.knee : leg.foot;
  const u = onThigh ? far / thigh : Math.min(1, (far - thigh) / shin);
  const len = onThigh ? thigh : shin;
  return {
    at: { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) },
    out: { x: (b.y - a.y) / len, y: -(b.x - a.x) / len },
  };
}

/**
 * The lower part of a skirt, dress or robe, draped over the legs wherever they are: it hangs
 * straight when the legs are straight, lies over the thighs and falls from the knees when its
 * wearer sits, and opens with a stride. Returns the outline as a path in the character's own
 * space (not the torso frame), the lowest point of the hem, where each leg leaves the cloth, and
 * the corners of the outline before they are rounded.
 */
export function drapeOverLegs(
  c: PieceContext,
  shape: Drape,
): { d: string; low: number; ends: Vec2[]; outline: Vec2[] } {
  const w = turnWidth(c);
  const points: Vec2[] = [
    fromTorso(c, -shape.waist * w, -0.33),
    fromTorso(c, shape.waist * w, -0.33),
    fromTorso(c, -shape.hips * w, 0.02),
    fromTorso(c, shape.hips * w, 0.02),
  ];
  const ends: Vec2[] = [];
  for (const leg of [c.j.legs.back, c.j.legs.front]) {
    const thigh = Math.hypot(leg.knee.x - leg.hip.x, leg.knee.y - leg.hip.y);
    const stops = [0.34, 0.67, 1].map((u) => u * shape.length);
    // A long skirt goes round the knee, so the knee is held out too.
    if (thigh < shape.length) stops.push(thigh - 1e-3, thigh + 1e-3);
    for (const far of stops) {
      const { at, out } = downLeg(leg, far);
      const r = lerp(shape.hips, shape.flare, far / shape.length) * w * 0.78;
      for (const side of [-1, 1]) {
        const p = { x: at.x + out.x * r * side, y: at.y + out.y * r * side };
        points.push(p);
        // Past the leg the cloth just hangs, still opening a little as it falls.
        if (far === shape.length) {
          points.push({ x: p.x + out.x * side * shape.drop * HEM_SPREAD, y: p.y + shape.drop });
        }
      }
      if (far === shape.length) ends.push(at);
    }
  }
  // A hem never goes through the ground.
  const kept = points.map((p) => ({ x: p.x, y: Math.min(p.y, -0.03) }));
  const outline = outlineOf(kept);
  return {
    d: softPath(outline, DRAPE_CORNER),
    low: Math.max(...kept.map((p) => p.y)),
    ends,
    outline,
  };
}
