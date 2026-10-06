import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EXPRESSIONS } from '../face/expressions';
import { outfitFrom } from '../wardrobe/garments';
import { Character } from './Character';
import { resolvePose } from './pose';
import { sit, stand } from './poses';
import { lineWeights } from '../tokens';

/**
 * A bare stick leg ends inside its shoe (Biku, 2026-10-06: "the legs go through the shoes").
 * The leg used to run to the sole, and with the fine outline its round end showed under it.
 */

const DRESS = outfitFrom({
  onePiece: { kind: 'dress', cloth: 'brown' },
  shoes: { kind: 'boots', cloth: 'brown' },
});

/**
 * Where the two legs end. Arms and legs are both three-point lines; the legs are the two that
 * end lowest.
 */
const legEnds = (markup: string): number[] =>
  [...markup.matchAll(/<polyline points="([^"]+)"/g)]
    .map((m) => (m[1] ?? '').split(' ').map((p) => p.split(',').map(Number)))
    .filter((points) => points.length === 3)
    .map((points) => points[2]?.[1] ?? 0)
    .sort((a, b) => b - a)
    .slice(0, 2);

describe('legs and shoes', () => {
  it.each([
    ['standing', stand],
    ['sitting', sit],
  ] as const)('a bare leg stops inside the boot when %s', (_, pose) => {
    const markup = renderToStaticMarkup(
      <svg>
        <Character
          x={0}
          groundY={0}
          head={1}
          pose={resolvePose(pose)}
          face={EXPRESSIONS.neutral}
          outfit={DRESS}
        />
      </svg>,
    );
    const ends = legEnds(markup);
    expect(ends).toHaveLength(2);
    // Its round end, half a limb wide, stays above the ground with room to spare.
    for (const y of ends) expect(y + lineWeights.limb / 2).toBeLessThan(-0.05);
  });

  it('a bare leg with no shoe still reaches the ground', () => {
    const markup = renderToStaticMarkup(
      <svg>
        <Character
          x={0}
          groundY={0}
          head={1}
          pose={resolvePose(stand)}
          face={EXPRESSIONS.neutral}
        />
      </svg>,
    );
    for (const y of legEnds(markup)) expect(y).toBeCloseTo(0, 6);
  });
});
