import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ink, tokens } from '../tokens';
import { LABEL_PLACES, Label, TITLE_POP_FRAMES, TitleCard } from './Titles';
import { fitSize, textWidth, viewerText, wrapWords } from './text';

/** Phase 2E: titles and labels (Style 9). */

const size = { width: 1080, height: 1920 };
const svg = (node: React.ReactNode) => renderToStaticMarkup(<svg>{node}</svg>);

describe('text for the viewer', () => {
  it('refuses an em dash (ground rule 14)', () => {
    expect(() => viewerText('The King — and the Moon')).toThrow(/em dash/);
    expect(viewerText('  The King, and the Moon ')).toBe('The King, and the Moon');
  });

  it('wraps a long title without splitting a word', () => {
    const lines = wrapWords('The King Who Taxed the Moon', 16);
    expect(lines.length).toBe(2);
    expect(lines.join(' ')).toBe('The King Who Taxed the Moon');
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(16);
  });

  it('shrinks text until it fits', () => {
    const fits = fitSize(['A very long line of title text indeed'], 110, 780);
    expect(fits).toBeLessThan(110);
    expect(textWidth('A very long line of title text indeed', fits)).toBeLessThanOrEqual(
      780 + 1e-6,
    );
    expect(fitSize(['Short'], 110, 780)).toBe(110);
  });
});

describe('title card', () => {
  it('is an outlined banner with the title in the caption colors', () => {
    const html = svg(<TitleCard title="The Golden Coin" {...size} />);
    expect(html).toContain('The Golden Coin');
    expect(html).toContain(ink);
    expect(html).toContain(tokens.captions.fill);
    expect(html).toContain(tokens.accents.crimson?.[0] ?? 'no crimson');
  });

  it('puts a long title on two lines and adds the smaller line under it', () => {
    const html = svg(
      <TitleCard title="The King Who Taxed the Moon" subtitle="A folktale" {...size} />,
    );
    expect(html.split('<text').length - 1).toBe(3);
    expect(html).toContain('A folktale');
  });

  it('pops in from nothing and then holds', () => {
    expect(svg(<TitleCard title="Hi" {...size} frame={0} />)).toBe('<svg></svg>');
    expect(svg(<TitleCard title="Hi" {...size} frame={TITLE_POP_FRAMES} />)).toContain('scale(1)');
    expect(svg(<TitleCard title="Hi" {...size} frame={90} />)).toContain('scale(1)');
  });

  it('stays out of the caption area', () => {
    const html = svg(<TitleCard title="The Golden Coin" subtitle="A test" {...size} />);
    const y = Number(/translate\(\d+ ([\d.]+)\)/.exec(html)?.[1]);
    expect(y).toBeLessThan(size.height * 0.5);
  });
});

describe('label', () => {
  it.each(LABEL_PLACES)('sits at the %s of the frame, inside it', (at) => {
    const html = svg(<Label text="Three days later" at={at} {...size} />);
    const m = /translate\(([\d.]+) ([\d.]+)\)/.exec(html);
    const x = Number(m?.[1]);
    const y = Number(m?.[2]);
    const half = Number(/width="([\d.]+)"/.exec(html)?.[1]) / 2;
    expect(x - half).toBeGreaterThanOrEqual(0);
    expect(x + half).toBeLessThanOrEqual(size.width);
    expect(y).toBeLessThan(size.height * 0.15);
    expect(html).toContain('Three days later');
  });

  it('refuses an em dash too', () => {
    expect(() => svg(<Label text={'Later — much later'} {...size} />)).toThrow(/em dash/);
  });
});
