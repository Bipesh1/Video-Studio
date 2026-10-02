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

// ---------------------------------------------------------------------------------------------
// Color math on token colors. Components derive colors only through these, never by typing one.

type Rgb = [number, number, number];

const toRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = (rgb: Rgb): string =>
  `#${rgb
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;

/** Blend two colors: t = 0 gives a, t = 1 gives b. */
export const mix = (a: string, b: string, t: number): string => {
  const x = toRgb(a);
  const y = toRgb(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
};

/** A darker tone: amount 0.15 is 15% darker (Style 3.3 shadow tones). */
export const shade = (c: string, amount: number): string => {
  const [r, g, b] = toRgb(c);
  return toHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
};

/** A lighter tone, toward Style 6 white. */
export const lighten = (c: string, amount: number): string => mix(c, white, amount);

/** Relative luminance, 0 (black) to 1 (white). */
export const luminance = (c: string): number => {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = toRgb(c);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** Style 3.4 skin tone 1 (lightest) to 8 (darkest). */
export const skinTone = (n: number): string => {
  const c = tokens.skinTones[Math.round(n) - 1];
  if (c === undefined) throw new Error(`Skin tone must be 1 to 8, got ${n}`);
  return c;
};

/** Hair fill and shadow for a Style 3.4 hair color name. */
export const hairColor = (name: string): readonly [string, string] => {
  const c = tokens.hair[name];
  if (!c) throw new Error(`Unknown hair color "${name}" in tokens.json`);
  return c;
};

/**
 * Tongue color. The guide names no tongue color, so it is derived from the effects red,
 * lightened toward white so it reads against the dark mouth interior.
 */
export const tongue = lighten(tokens.effects.anger, 0.25);

/** SVG mask luminance values. These are not visible colors: white shows, black hides. */
export const MASK_SHOW = 'white';
export const MASK_HIDE = 'black';
