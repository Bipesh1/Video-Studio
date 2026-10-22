import { graphicSchema, graphicSteps } from '@studio/shared';
import type { Graphic } from '@studio/shared';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { stepFrames } from '../stage/ShotPicture';
import { ExplainerGraphic } from './Graphic';

const fps = 30;
const word = (text: string, s: number) => ({ text, startMs: s * 1000 });

describe('explainer graphics, built step by step', () => {
  it('brings each piece in on the word that names it, in order', () => {
    const words = [
      word('Your', 10),
      word('ticket', 10.4),
      word('goes', 10.9),
      word('to', 11.2),
      word('studio.', 11.6),
    ];
    // The shot starts at 10 s (frame 300).
    expect(
      stepFrames(['your', 'ticket', 'goes', undefined, 'studio'], words, 300, 90, fps),
    ).toEqual([0, 12, 27, 35, 48]);
  });

  it('finds a word said before the piece ahead of it', () => {
    const words = [word('sixty', 0), word('grams', 0.5), word('sweat', 1), word('pee', 2)];
    // The drop of sweat on "sweat", the toilet on "pee", then the callout on "sixty".
    expect(stepFrames(['sweat', 'pee', 'sixty'], words, 0, 90, fps, false)).toEqual([30, 60, 0]);
  });

  it('spreads the pieces through the shot when there are no words to go by', () => {
    const frames = stepFrames(['a', 'b', 'c'], [], 0, 120, fps);
    expect(frames[0]).toBeLessThan(frames[1] ?? 0);
    expect(frames[2]).toBeLessThan(120 * 0.8);
  });

  it('refuses a split whose shares do not add up, and a flow with too many arrows', () => {
    const split = {
      kind: 'split',
      parts: [
        { label: 'A', value: '$1', share: 0.5 },
        { label: 'B', value: '$1', share: 0.2 },
      ],
    };
    expect(graphicSchema.safeParse(split).success).toBe(false);
    const flow = {
      kind: 'flow',
      nodes: [{ label: 'A' }, { label: 'B' }],
      links: [{ label: 'x' }, { label: 'y' }],
    };
    expect(graphicSchema.safeParse(flow).success).toBe(false);
  });

  it('draws every kind, at the start and at the end of its shot', () => {
    const all: Graphic[] = [
      { kind: 'scene', name: 'cinema-counter', show: [{ item: 'hand' }] },
      { kind: 'number', value: '$1,250', caption: 'A YEAR', countUp: true },
      {
        kind: 'receipt',
        lines: [{ label: 'CORN', value: '35¢' }],
        total: { label: 'TOTAL', value: '$1' },
      },
      {
        kind: 'split',
        parts: [
          { label: 'A', value: '$8', share: 0.9 },
          { label: 'B', value: '$1', share: 0.1 },
        ],
      },
      {
        kind: 'flow',
        nodes: [{ label: 'YOU' }, { label: 'THEM' }],
        links: [{ label: 'MONEY / NOW' }],
      },
      {
        kind: 'bars',
        bars: [
          { label: 'A', value: 2 },
          { label: 'B', value: 5, text: '$5' },
        ],
        stress: 1,
      },
      { kind: 'tag', price: '$9.99', was: '$10' },
      { kind: 'queue', people: 5 },
    ].map((g) => graphicSchema.parse(g));
    for (const g of all) {
      const times = graphicSteps(g).map((_, i) => i * 6);
      for (const local of [0, 89]) {
        const svg = renderToStaticMarkup(
          <svg>
            <ExplainerGraphic
              graphic={g}
              local={local}
              duration={90}
              times={times}
              width={1080}
              height={1920}
            />
          </svg>,
        );
        expect(svg).toContain('<rect');
      }
    }
  });
});
