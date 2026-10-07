import type { CharacterCard, Look } from '@studio/shared';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import type { EyeStyle, FaceParams } from '../face/types';
import { tokens } from '../tokens';
import { CLOTH_COLORS } from './cloth';
import { ASTRONAUT } from './costumes/astronaut';
import { FARMER } from './costumes/farmer';
import { QUEEN } from './costumes/queen';
import { RULER } from './costumes/ruler';
import { SCIENTIST } from './costumes/scientist';
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
  scientist: SCIENTIST,
  astronaut: ASTRONAUT,
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
 * How someone looks, as the engine draws it: skin and hair, clothes or a costume, eyes, age.
 * Used for a saved character card and for a cast member a storyboard describes on the spot.
 * A hair style, color, costume or cloth the engine does not have fails here with a plain
 * message, before any frame renders.
 */
export function lookFrom(card: Look, name: string): Cast['look'] {
  const look: Cast['look'] = { eyeStyle: card.eyeStyle ?? 'round', age: card.age ?? 'adult' };

  if (card.identity) {
    const id = card.identity;
    oneOf('hair style', id.hair, HAIR_STYLES, name);
    oneOf('hair color', id.hairColor, Object.keys(tokens.hair), name);
    if (id.wrap) oneOf('wrap color', id.wrap, Object.keys(tokens.accents), name);
    look.identity = {
      skinTone: id.skinTone,
      hair: id.hair as HairStyle,
      hairColor: id.hairColor,
      ...(id.facialHair ? { facialHair: id.facialHair } : {}),
      ...(id.wrap ? { wrap: id.wrap } : {}),
    };
  }

  if (card.outfit && 'costume' in card.outfit) {
    oneOf('costume', card.outfit.costume, Object.keys(COSTUMES), name);
    look.outfit = COSTUMES[card.outfit.costume] as Outfit;
  } else if (card.outfit) {
    const clothes = card.outfit.clothes;
    for (const g of Object.values(clothes)) {
      if (g && typeof g === 'object') oneOf('cloth color', g.cloth, CLOTH_COLORS, name);
    }
    if (clothes.top?.under) oneOf('cloth color', clothes.top.under, CLOTH_COLORS, name);
    look.outfit = outfitFrom(clothes, name);
  }
  return look;
}

/**
 * Turn a character card into what the engine draws: its look, the face it wears when a shot
 * gives no other, and its size beside an adult.
 */
export function castFromCard(card: CharacterCard): Cast {
  const look = lookFrom(card, card.id);
  oneOf('expression', card.expression, Object.keys(EXPRESSIONS), card.id);
  return { look, face: EXPRESSIONS[card.expression as ExpressionName], size: card.size };
}
