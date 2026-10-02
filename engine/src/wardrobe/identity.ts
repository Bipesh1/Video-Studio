import { hairColor, lighten, mix, shade, skinTone, tokens } from '../tokens';
import type { Identity } from './types';

export type SkinColors = {
  skin: string;
  /** 15% darker than the skin (Style 3.4). */
  shadow: string;
  /** A thin lighter rim on the lit side, only for the darkest three tones. */
  rim?: string;
};

/** Default mode: white heads with the token head shadow. */
export const DEFAULT_SKIN: SkinColors = {
  skin: tokens.fill.head,
  shadow: tokens.fill.headShadow,
};

/** Skin colors for identity mode tone 1 (lightest) to 8 (darkest). */
export function skinColors(tone: number): SkinColors {
  const skin = skinTone(tone);
  const shadow = shade(skin, tokens.fill.shadowDarken[0]);
  const darkest = tone - 1 >= tokens.darkSkinRimFromIndex;
  return darkest ? { skin, shadow, rim: lighten(skin, 0.3) } : { skin, shadow };
}

export type HairColors = { fill: string; shadow: string };

export function identityHair(id: Identity): HairColors {
  const [fill, shadow] = hairColor(id.hairColor);
  return { fill, shadow };
}

/** The faded sides of a fade cut: between hair and skin, closer to the skin. */
export const fadeColor = (hair: HairColors, skin: string): string => mix(hair.fill, skin, 0.62);
