import { parseStyleTokens } from '@studio/shared';
import type { StyleTokens } from '@studio/shared';
import rawTokens from '../../styles/ink-stick/tokens.json';

/**
 * The single source of every visual value in the engine.
 * Validated once at bundle time so a broken tokens.json fails loudly before any frame renders.
 */
export const tokens: StyleTokens = parseStyleTokens(rawTokens);

/** Look up a background palette by name. Components never type a hex value themselves. */
export const palette = (name: string): readonly string[] => {
  const p = tokens.palettes[name];
  if (!p) throw new Error(`Unknown palette "${name}" in tokens.json`);
  return p;
};

/** Look up an accent color pair (fill, shadow) by name. */
export const accent = (name: string): readonly string[] => {
  const a = tokens.accents[name];
  if (!a) throw new Error(`Unknown accent "${name}" in tokens.json`);
  return a;
};

/** Pick the middle of a [min, max] token range. */
export const mid = ([lo, hi]: readonly [number, number]): number => (lo + hi) / 2;

/** Pick one entry of a palette or accent list, failing loudly if the token list is too short. */
export const pick = (list: readonly string[], index: number): string => {
  const c = list[index];
  if (c === undefined) throw new Error(`Token color list has no entry ${index}`);
  return c;
};

/** Outline and line color (Style 6). */
export const ink = tokens.line.color;

/** Style 6 white. It has the same value as the default head fill. */
export const white = tokens.fill.head;

/**
 * Line weights in head units (fractions of the head diameter): the middle of each token range.
 * Characters are drawn in head units, so these scale with head size automatically (Style 3.2).
 */
export const lineWeights = {
  outline: mid(tokens.line.outlinePctOfHead),
  limb: mid(tokens.line.limbPctOfHead),
  detail: mid(tokens.line.detailPctOfHead),
  brow: tokens.line.browPctOfHead,
} as const;

/** SVG mask luminance values. These are not visible colors: white shows, black hides. */
export const MASK_SHOW = 'white';
export const MASK_HIDE = 'black';
