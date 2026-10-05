import type { CharacterCard } from '@studio/shared';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import type { EyeStyle, FaceParams } from '../face/types';
import { tokens } from '../tokens';
import { CLOTH_COLORS } from './cloth';
import { FARMER } from './costumes/farmer';
import { QUEEN } from './costumes/queen';
import { RULER } from './costumes/ruler';
import { SOLDIER } from './costumes/soldier';
import { outfitFrom } from './garments';
import { HAIR_STYLES } from './hair';
import type { Age, HairStyle, Identity, Outfit } from './types';

/** Full costumes by the name a character card or the library uses for them. */
export const COSTUMES: Readonly<Record<string, Outfit>> = {
  ruler: RULER,
  soldier: SOLDIER,
  queen: QUEEN,
  farmer: FARMER,
};

/** Everything a Character needs from a card. Spread `look` onto the Character. */
export type Cast = {
  look: { identity?: Identity; outfit?: Outfit; eyeStyle: EyeStyle; age: Age };
  /** The face to use when a shot gives no other. */
  face: FaceParams;
  /** Multiply the shot's adult head size by this. */
  size: number;
};

const oneOf = (what: string, value: string, allowed: readonly string[], card: string) => {
  if (!allowed.includes(value)) {
    throw new Error(
      `Character "${card}": unknown ${what} "${value}". Known: ${allowed.join(', ')}.`,
    );
  }
};

/**
 * Turn a character card into what the engine draws. A card that names a hair style, color,
 * costume or expression the engine does not have fails here with a plain message, before any
 * frame renders.
 */
export function castFromCard(card: CharacterCard): Cast {
  const look: Cast['look'] = { eyeStyle: card.eyeStyle, age: card.age };

  if (card.identity) {
    const id = card.identity;
    oneOf('hair style', id.hair, HAIR_STYLES, card.id);
    oneOf('hair color', id.hairColor, Object.keys(tokens.hair), card.id);
    if (id.wrap) oneOf('wrap color', id.wrap, Object.keys(tokens.accents), card.id);
    look.identity = {
      skinTone: id.skinTone,
      hair: id.hair as HairStyle,
      hairColor: id.hairColor,
      ...(id.facialHair ? { facialHair: id.facialHair } : {}),
      ...(id.wrap ? { wrap: id.wrap } : {}),
    };
  }

  if (card.outfit && 'costume' in card.outfit) {
    oneOf('costume', card.outfit.costume, Object.keys(COSTUMES), card.id);
    look.outfit = COSTUMES[card.outfit.costume] as Outfit;
  } else if (card.outfit) {
    const clothes = card.outfit.clothes;
    for (const g of Object.values(clothes)) {
      if (g) oneOf('cloth color', g.cloth, CLOTH_COLORS, card.id);
    }
    look.outfit = outfitFrom(clothes, card.id);
  }

  oneOf('expression', card.expression, Object.keys(EXPRESSIONS), card.id);
  return { look, face: EXPRESSIONS[card.expression as ExpressionName], size: card.size };
}
