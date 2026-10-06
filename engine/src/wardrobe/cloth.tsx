import type { ReactNode } from 'react';
import { accent, ink, lineWeights, pick, tokens, white } from '../tokens';
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
