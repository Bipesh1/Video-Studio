import { storyboardSchema, thumbnailSchema } from '@studio/shared';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import fixture from '../../../shared/src/fixtures/moon-tax.storyboard.json';
import { DollarEyes, ShockLines } from '../effects/Reaction';
import { SAFE_916, meterBox } from '../overlays/Explain';
import { PosterLayers } from './Poster';
import { posterProblems } from './posterCheck';

vi.mock('remotion', () => ({
  AbsoluteFill: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useVideoConfig: () => ({ width: 1080, height: 1920, fps: 30, durationInFrames: 1 }),
}));

/** Pieces made for the Shorts on 2026-10-14. */

describe('a picture made for the moment', () => {
  const crowd = {
    kind: 'crowd',
    rows: 3,
    cols: 4,
    top: 0.3,
    bottom: 0.6,
    head: 0.05,
    hole: { x: 0.5, y: 0.45 },
    holeRadius: 0.1,
  };

  it('is a shot of its own in a storyboard, with a camera that can pull back', () => {
    const sb = structuredClone(fixture) as Record<string, unknown> & {
      scenes: Array<{ shots: Array<Record<string, unknown>> }>;
    };
    const shot = sb.scenes[0]?.shots[0];
    if (!shot) throw new Error('no shot');
    shot.picture = {
      layers: [{ kind: 'room', place: 'the-table', palette: 'table-grey' }, crowd],
      from: { x: 0.5, y: 0.45, zoom: 5 },
      to: { x: 0.5, y: 0.5, zoom: 1 },
    };
    expect(storyboardSchema.safeParse(sb).success).toBe(true);
  });

  it('draws a crowd of dressed figures, leaving room where someone of the cast stands', () => {
    const thumb = thumbnailSchema.parse({
      id: 'crowd',
      why: 'A test.',
      layers: [crowd, { kind: 'words', lines: ['ALL OF US'], bottom: 0.2 }],
    });
    expect(posterProblems(thumb, [])).toEqual([]);
    const draw = (layer: object) =>
      renderToStaticMarkup(
        <svg>
          <PosterLayers
            layers={thumbnailSchema.parse({ ...thumb, layers: [layer, thumb.layers[1]] }).layers}
            cast={[]}
            cards={{}}
            seed={1}
            width={1080}
            height={1920}
            fps={30}
          />
        </svg>,
      );
    const heads = (svg: string) => (svg.match(/<ellipse/g) ?? []).length;
    expect(heads(draw({ ...crowd, hole: undefined }))).toBeGreaterThan(heads(draw(crowd)));
  });
});

describe('a big reaction for the turning point', () => {
  it('puts a dollar sign over each eye, and lines round the head', () => {
    const eyes = renderToStaticMarkup(
      <svg>
        <DollarEyes />
      </svg>,
    );
    expect(eyes.match(/\$/g)).toHaveLength(2);
    const lines = renderToStaticMarkup(
      <svg>
        <ShockLines />
      </svg>,
    );
    expect(lines.match(/<path/g)?.length).toBeGreaterThanOrEqual(16);
  });
});

describe('words clear of the apps', () => {
  it('stands the counter of a tall video inside the safe area, and leaves a wide one in its corner', () => {
    const box = meterBox('SECONDS IN SMOKE', 3, 1080, 1920);
    expect(box.y).toBeGreaterThanOrEqual(SAFE_916.y * 1920 - 0.5);
    expect(box.x + box.width).toBeLessThanOrEqual((SAFE_916.x + SAFE_916.width) * 1080 + 0.5);
    const wide = meterBox('SECONDS IN SMOKE', 3, 1920, 1080);
    expect(wide.x + wide.width).toBeGreaterThan(1920 * 0.95);
  });
});
