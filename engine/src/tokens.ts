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
