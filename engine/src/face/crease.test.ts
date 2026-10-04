import { describe, expect, it } from 'vitest';
import { CREASE_W, quadPoints, taperAt, taperedOutline, taperedPath } from './crease';
import { tokens } from '../tokens';

describe('creases (guide v7)', () => {
  it('are fine at both ends and fullest at the peak', () => {
    expect(taperAt(0)).toBeLessThan(0.2);
    expect(taperAt(1)).toBeLessThan(0.2);
    expect(taperAt(0.45)).toBeCloseTo(1, 5);
    expect(taperAt(0.3, { peak: 0.3 })).toBeCloseTo(1, 5);
    // Thickness only grows toward the peak and only shrinks after it.
    for (let s = 0.05; s < 0.45; s += 0.05) {
      expect(taperAt(s)).toBeGreaterThan(taperAt(s - 0.05));
    }
    for (let s = 0.5; s < 1; s += 0.05) {
      expect(taperAt(s + 0.05)).toBeLessThan(taperAt(s));
    }
  });

  it('are much thinner than the other lines on the face', () => {
    expect(CREASE_W).toBe(tokens.face.creasePctOfHead);
    expect(CREASE_W).toBeLessThan(tokens.face.featureLinePctOfHead * 0.7);
  });

  it('build a closed shape around the center line, widest at the peak', () => {
    const center = quadPoints({ x: 0, y: 0 }, { x: 0.05, y: 0.02 }, { x: 0.1, y: 0 }, 10);
    const outline = taperedOutline(center, 0.012, { peak: 0.5 });
    expect(outline).toHaveLength(center.length * 2);
    const widthAt = (i: number) => {
      const a = outline[i];
      const b = outline[outline.length - 1 - i];
      if (!a || !b) throw new Error('missing outline point');
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    expect(widthAt(5)).toBeCloseTo(0.012, 4);
    expect(widthAt(0)).toBeLessThan(0.003);
    expect(widthAt(10)).toBeLessThan(0.003);
    expect(taperedPath(center, 0.012)).toMatch(/^M .* Z$/);
  });

  it('give nothing for a line with no length', () => {
    expect(taperedOutline([{ x: 0, y: 0 }], 0.012)).toEqual([]);
    expect(taperedPath([], 0.012)).toBe('');
  });
});
