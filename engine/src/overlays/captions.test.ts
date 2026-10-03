import type { WordTiming } from '@studio/shared';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_OPTIONS, buildPages, pageAt, toCaptions } from './captionPages';

const word = (
  text: string,
  startMs: number,
  endMs: number,
  lineId = 'n1',
  emphasis = false,
): WordTiming => ({
  text,
  startMs,
  endMs,
  lineId,
  emphasis,
});

const sentence = (texts: string[], startMs: number, lineId = 'n1') =>
  texts.map((t, i) => word(t, startMs + i * 300, startMs + i * 300 + 280, lineId));

describe('captions (Style 9)', () => {
  it('use the @remotion/captions Caption shape with a leading space on each word after the first', () => {
    const caps = toCaptions(sentence(['The', 'king', 'had'], 0));
    expect(caps[0]?.text).toBe('The');
    expect(caps[1]?.text).toBe(' king');
    expect(caps[1]?.timestampMs).toBe((caps[1]?.startMs ?? 0) / 2 + (caps[1]?.endMs ?? 0) / 2);
  });

  it('never show more than two lines, and keep each line within the width', () => {
    const words = sentence(
      'The king had one rule nobody leaves the castle after dark or before dawn'.split(' '),
      0,
    );
    const pages = buildPages(toCaptions(words));
    expect(pages.length).toBeGreaterThan(1);
    for (const p of pages) {
      expect(p.lines.length).toBeLessThanOrEqual(2);
      for (const line of p.lines) {
        const chars = line.map((w) => w.text.trim()).join(' ').length;
        expect(chars).toBeLessThanOrEqual(DEFAULT_PAGE_OPTIONS.maxLineChars);
      }
    }
    expect(pages.flatMap((p) => p.lines.flat()).length).toBe(words.length);
  });

  it('start a new page after a sentence and when the speaker changes', () => {
    const words = [
      ...sentence(['It', 'was', 'dark.'], 0, 'n1'),
      ...sentence(['Run', 'now'], 950, 'n1'),
      ...sentence(['I', 'only', 'wanted', 'snacks!'], 1600, 'd1'),
    ];
    const pages = buildPages(toCaptions(words));
    expect(
      pages.map((p) =>
        p.lines
          .flat()
          .map((w) => w.text.trim())
          .join(' '),
      ),
    ).toEqual(['It was dark.', 'Run now', 'I only wanted snacks!']);
  });

  it('start a new page after a pause', () => {
    const words = [word('Wait', 0, 300), word('there', 1200, 1500)];
    expect(buildPages(toCaptions(words))).toHaveLength(2);
  });

  it('keep emphasis so the emphasized word can turn gold', () => {
    const pages = buildPages(toCaptions([word('one', 0, 300, 'n1', true), word('rule', 300, 600)]));
    expect(pages[0]?.lines[0]?.[0]?.emphasis).toBe(true);
    expect(pages[0]?.lines[0]?.[1]?.emphasis).toBe(false);
  });

  it('show a page from its first word until the next page starts, never overlapping', () => {
    const pages = buildPages(toCaptions([...sentence(['One.'], 0), ...sentence(['Two.'], 600)]));
    expect(pageAt(pages, 100)?.lines[0]?.[0]?.text.trim()).toBe('One.');
    expect(pageAt(pages, 700)?.lines[0]?.[0]?.text.trim()).toBe('Two.');
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i]?.startMs ?? 0).toBeGreaterThanOrEqual(pages[i - 1]?.endMs ?? 0);
    }
  });
});
