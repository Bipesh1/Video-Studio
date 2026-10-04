import type { Vec2 } from '../rig/math';
import { tokens } from '../tokens';

/**
 * Hand-drawn creases (guide v7, Biku's feedback of 2026-10-04): wrinkles, bags, chin and cheek
 * lines are strokes that are full at one point and fine at both ends, like the pen lines on
 * Reference B's frightened face. They are drawn as filled shapes, not as even strokes.
 */

/** Thickness of a crease at its fullest point, in head units. */
export const CREASE_W = tokens.face.creasePctOfHead;
const CREASE_INK = tokens.face.featureLineColor;

export type TaperOptions = {
  /** Where along the stroke it is fullest, 0 to 1. A pen stroke is rarely fullest in the middle. */
  peak?: number;
  /** Thickness at the two ends, as a fraction of the fullest thickness. */
  tip?: number;
};

/** Thickness along the stroke: fine at 0 and 1, full at the peak. */
export function taperAt(s: number, { peak = 0.45, tip = 0.14 }: TaperOptions = {}): number {
  const p = Math.min(0.95, Math.max(0.05, peak));
  const t = s <= p ? s / p : (1 - s) / (1 - p);
  return tip + (1 - tip) * Math.sin((Math.PI / 2) * Math.min(1, Math.max(0, t))) ** 0.9;
}

/** Points along a quadratic curve. */
export function quadPoints(from: Vec2, ctrl: Vec2, to: Vec2, steps = 10): Vec2[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const a = (1 - t) * (1 - t);
    const b = 2 * t * (1 - t);
    const c = t * t;
    return { x: a * from.x + b * ctrl.x + c * to.x, y: a * from.y + b * ctrl.y + c * to.y };
  });
}

/** Points along a cubic curve. */
export function cubicPoints(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, steps = 16): Vec2[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    };
  });
}

/**
 * The outline of a tapered stroke that follows a center line: one side going out, the other
 * coming back. `width` is the thickness at the fullest point.
 */
export function taperedOutline(
  center: readonly Vec2[],
  width: number,
  options: TaperOptions = {},
): Vec2[] {
  if (center.length < 2) return [];
  const lengths = [0];
  for (let i = 1; i < center.length; i++) {
    const a = center[i - 1] as Vec2;
    const b = center[i] as Vec2;
    lengths.push((lengths[i - 1] as number) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = lengths[lengths.length - 1] || 1;
  const left: Vec2[] = [];
  const right: Vec2[] = [];
  center.forEach((p, i) => {
    const prev = center[Math.max(0, i - 1)] as Vec2;
    const next = center[Math.min(center.length - 1, i + 1)] as Vec2;
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const half = (width * taperAt((lengths[i] as number) / total, options)) / 2;
    const nx = (-dy / len) * half;
    const ny = (dx / len) * half;
    left.push({ x: p.x + nx, y: p.y + ny });
    right.push({ x: p.x - nx, y: p.y - ny });
  });
  return [...left, ...right.reverse()];
}

export const taperedPath = (
  center: readonly Vec2[],
  width: number,
  options: TaperOptions = {},
): string => {
  const outline = taperedOutline(center, width, options);
  return outline.length ? `M ${outline.map((p) => `${p.x} ${p.y}`).join(' L ')} Z` : '';
};

/** A filled tapered stroke along any center line. */
export const TaperedStroke = ({
  points,
  width,
  peak,
  tip,
  color = CREASE_INK,
}: {
  points: readonly Vec2[];
  width: number;
  color?: string;
} & TaperOptions) => (
  <path
    d={taperedPath(points, width, {
      ...(peak === undefined ? {} : { peak }),
      ...(tip === undefined ? {} : { tip }),
    })}
    fill={color}
    stroke={color}
    strokeWidth={width * 0.12}
    strokeLinejoin={tokens.line.join}
  />
);

/** One crease: a short curved pen stroke. `weight` multiplies the token crease thickness. */
export const Crease = ({
  from,
  ctrl,
  to,
  weight = 1,
  peak,
}: {
  from: Vec2;
  ctrl: Vec2;
  to: Vec2;
  weight?: number;
  peak?: number;
}) => (
  <TaperedStroke
    points={quadPoints(from, ctrl, to)}
    width={CREASE_W * weight}
    {...(peak === undefined ? {} : { peak })}
  />
);
