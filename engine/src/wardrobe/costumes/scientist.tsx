import { outfitFrom } from '../garments';
import type { Outfit } from '../types';

/**
 * A scientist (tier 2): a white lab coat to the thighs over a pale blue top, dark trousers,
 * brown shoes and a pair of glasses. The one who explains in the science videos. Put together
 * from the everyday garments. Colors: white, glint blue, denim, brown (Style 3.5).
 */
export const SCIENTIST: Outfit = {
  ...outfitFrom(
    {
      top: { kind: 'lab-coat', cloth: 'white', under: 'glint' },
      bottom: { kind: 'trousers', cloth: 'denim' },
      shoes: { kind: 'sneakers', cloth: 'brown' },
      glasses: true,
    },
    'scientist',
  ),
  tier: 2,
};
