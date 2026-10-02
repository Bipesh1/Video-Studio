/**
 * Small 2D math helpers for the rig. Coordinates follow SVG: x to the right, y down.
 * Angles for limbs are measured in degrees from straight down, positive toward +x
 * (+x is the direction the character faces before mirroring).
 */

export type Vec2 = { readonly x: number; readonly y: number };

export const vec = (x: number, y: number): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
export const length = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => length(sub(a, b));
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const DEG = Math.PI / 180;

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const lerpVec = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

/** Unit vector for an angle measured from straight down, positive toward +x. */
export const fromDown = (deg: number): Vec2 => ({
  x: Math.sin(deg * DEG),
  y: Math.cos(deg * DEG),
});

/** Inverse of fromDown: the angle of a direction, measured from straight down. */
export const angleFromDown = (d: Vec2): number => Math.atan2(d.x, d.y) / DEG;

/** Rotate a vector by radians, using the SVG convention (positive turns +x toward +y). */
export const rotate = (a: Vec2, rad: number): Vec2 => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
};

/** Wrap an angle in degrees to the range (-180, 180]. */
export const normalizeDeg = (d: number): number => {
  const r = ((((d + 180) % 360) + 360) % 360) - 180;
  return r === -180 ? 180 : r;
};

export const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/**
 * Ease out with a small overshoot past 1 before settling, used for pose-to-pose snaps.
 * overshoot 1.2 peaks about 5% past the target.
 */
export const easeOutBack = (t: number, overshoot: number): number => {
  const x = clamp(t, 0, 1);
  const c3 = overshoot + 1;
  const u = x - 1;
  return 1 + c3 * u * u * u + overshoot * u * u;
};

/** Piecewise-linear interpolation through values placed evenly at t = 0 .. 1. */
export const stops = (t: number, values: readonly number[]): number => {
  const first = values[0];
  if (first === undefined) return 0;
  if (values.length === 1) return first;
  const x = clamp(t, 0, 1) * (values.length - 1);
  const i = Math.min(Math.floor(x), values.length - 2);
  const a = values[i] ?? first;
  const b = values[i + 1] ?? a;
  return lerp(a, b, x - i);
};
