import { describe, expect, it } from 'vitest';
import { bigWordsBox, countedText } from './Explain';

/** A number that counts up (a shot's `number` overlay with `countUp`). */
describe('a number that counts up', () => {
  it('starts at nothing and ends on the figure exactly as written', () => {
    expect(countedText('$26,000,000', 0)).toBe('$0');
    expect(countedText('$26,000,000', 1)).toBe('$26,000,000');
    // Past the end, and before the start, it holds.
    expect(countedText('$26,000,000', 1.4)).toBe('$26,000,000');
    expect(countedText('$26,000,000', -0.2)).toBe('$0');
  });

  it('only ever goes up, rushing first and slowing as it arrives', () => {
    const at = (share: number) => Number(countedText('1,000', share).replace(/,/g, ''));
    const steps = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map(at);
    expect([...steps].sort((a, b) => a - b)).toEqual(steps);
    expect(at(0.5)).toBeGreaterThan(800);
  });

  it('keeps what stands round the figure, and leaves words alone', () => {
    expect(countedText('100 x', 1)).toBe('100 x');
    expect(countedText('Day 40', 0.999999)).toBe('Day 40');
    expect(countedText('CHOOSE NOW', 0.3)).toBe('CHOOSE NOW');
  });
});

/** The question a video opens on (a shot's `words` overlay). */
describe('big words over the scene', () => {
  const question = ['Would you bid', 'a nickel for', 'a dollar bill?'];

  it('are whole inside a tall frame and a wide one, in the upper part of the picture', () => {
    for (const [width, height] of [
      [1080, 1920],
      [1920, 1080],
    ] as const) {
      const box = bigWordsBox(question, width, height);
      expect(box.x).toBeGreaterThan(0);
      expect(box.x + box.width).toBeLessThan(width);
      expect(box.y).toBeGreaterThan(0);
      // Clear of the middle of the picture, where the scene is, and of the captions below.
      expect(box.y + box.height).toBeLessThan(height * 0.52);
    }
  });

  it('shrink to fit a long line instead of running off the picture', () => {
    const box = bigWordsBox(['Would you pay two dollars for a one dollar bill?'], 1080, 1920);
    expect(box.width).toBeLessThanOrEqual(1080);
  });
});
