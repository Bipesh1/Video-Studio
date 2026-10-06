import { outfitFrom } from '../garments';
import type { Outfit } from '../types';

/**
 * A farmer or villager (tier 1): a green short-sleeved shirt, tan trousers, brown leather boots
 * and a straw hat. Put together from the tier 1 garments, so it is also the worked example of
 * how a new everyday outfit is made. Colors: forest green, tan, brown, gold (Style 3.5).
 */
export const FARMER: Outfit = outfitFrom(
  {
    top: { kind: 'shirt', cloth: 'forest', sleeves: 'short' },
    bottom: { kind: 'trousers', cloth: 'tan' },
    shoes: { kind: 'boots', cloth: 'brown' },
    hat: { kind: 'brim-hat', cloth: 'gold' },
  },
  'farmer',
);
