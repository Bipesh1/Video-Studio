import { outfitFrom } from '../garments';
import type { Outfit } from '../types';

/**
 * A farmer or villager (tier 1): a green short-sleeved shirt, navy trousers, plain boots and a
 * straw hat. Put together from the tier 1 garments, so it is also the worked example of how a
 * new everyday outfit is made. Colors: forest green, denim navy, steel, gold (Style 3.5).
 */
export const FARMER: Outfit = outfitFrom(
  {
    top: { kind: 'shirt', cloth: 'forest', sleeves: 'short' },
    bottom: { kind: 'trousers', cloth: 'denim' },
    shoes: { kind: 'boots', cloth: 'steel' },
    hat: { kind: 'brim-hat', cloth: 'gold' },
  },
  'farmer',
);
