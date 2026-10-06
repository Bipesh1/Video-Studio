import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DEG, vec } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { accent, pick } from '../tokens';
import { Footwear, shoeFit, trouserEnd } from './Footwear';

/**
 * Shoes on legs (Biku, 2026-10-06: "the shoes look like they are not properly attached to the
 * leg"). A knee is placed for a shin that leans a given number of degrees from upright.
 */

const kneeFor = (foot: Vec2, lean: number): Vec2 =>
  vec(foot.x + 0.7 * Math.sin(lean * DEG), foot.y - 0.7 * Math.cos(lean * DEG));
const ground = vec(0, 0);
const fitAt = (lean: number, lift = 0) => {
  const foot = vec(0, -lift);
  return shoeFit(foot, kneeFor(foot, lean), 1, 0.24);
};

describe('how a shoe sits on a leg', () => {
  it('stands flat and upright under an upright shin', () => {
    const fit = fitAt(0);
    expect(fit.foot).toBeCloseTo(0, 9);
    expect(fit.ankle).toBeCloseTo(0, 9);
    expect(fit.slide).toBe(0);
  });

  it('always points its upper part along the shin, whatever the leg does', () => {
    for (const lift of [0, 0.05, 0.15, 0.4]) {
      for (let lean = -90; lean <= 90; lean += 5) {
        const fit = fitAt(lean, lift);
        expect(fit.shin).toBeCloseTo(lean, 6);
        expect(fit.foot + fit.ankle).toBeCloseTo(lean, 6);
      }
    }
  });

  it('keeps a planted foot flat while the shin leans as far as an ankle bends', () => {
    for (const lean of [-30, -15, 10, 25]) {
      const fit = fitAt(lean);
      expect(fit.foot).toBeCloseTo(0, 9);
      expect(fit.ankle).toBeCloseTo(lean, 6);
    }
  });

  it('lifts the heel when the shin leans farther forward, and keeps the toe on the ground', () => {
    const fit = fitAt(48);
    expect(fit.foot).toBeGreaterThan(10);
    expect(fit.ankle).toBeLessThanOrEqual(30.0001);
    expect(fit.slide).toBeGreaterThan(0.03);
    // Leaning back, the toe lifts instead and nothing has to move.
    const back = fitAt(-55);
    expect(back.foot).toBeLessThan(-10);
    expect(back.slide).toBe(0);
  });

  it('is square to the shin once the foot is in the air', () => {
    for (const lean of [-50, -20, 20, 50]) {
      const fit = fitAt(lean, 0.3);
      expect(fit.ankle).toBeCloseTo(0, 6);
      expect(fit.foot).toBeCloseTo(lean, 6);
    }
  });

  it('points straight back when the shin lies forward along the ground', () => {
    const fit = fitAt(90, 0.02);
    expect(fit.foot).toBeGreaterThan(165);
    // The shoe is nearly in line with the shin: the upper leans right back on the foot.
    expect(fit.ankle).toBeLessThan(-75);
  });
});

describe('a trouser leg', () => {
  it('ends inside the shoe, on the shin, wherever the shoe sits', () => {
    for (const style of ['boot', 'sneaker'] as const) {
      for (let lean = -60; lean <= 60; lean += 10) {
        const knee = kneeFor(ground, lean);
        const end = trouserEnd(ground, knee, 1, style);
        // How far up the shin, and how far off its line.
        const along = end.x * Math.sin(lean * DEG) - end.y * Math.cos(lean * DEG);
        const off = Math.abs(end.x * Math.cos(lean * DEG) + end.y * Math.sin(lean * DEG));
        expect(along).toBeGreaterThan(0.1);
        expect(along).toBeLessThan(0.5);
        // Well inside the upper part, which is 0.085 to either side of the shin.
        expect(off).toBeLessThan(0.06);
      }
    }
  });
});

describe('drawn footwear', () => {
  const boots = {
    style: 'boot' as const,
    fill: pick(accent('brown'), 0),
    shadow: pick(accent('brown'), 1),
  };
  const lowestPoint = (lean: number, lift: number, dir: 1 | -1) => {
    const foot = vec(0, -lift);
    const knee = vec(
      foot.x + dir * 0.7 * Math.sin(lean * DEG),
      foot.y - 0.7 * Math.cos(lean * DEG),
    );
    const html = renderToStaticMarkup(
      <svg>
        <Footwear foot={foot} knee={knee} dir={dir} spec={boots} id="t" shadowSide={1} />
      </svg>,
    );
    const d = /<path[^>]* d="([^"]+)"/.exec(html)?.[1] ?? '';
    const numbers = d.match(/-?\d+(\.\d+)?(e-?\d+)?/g)?.map(Number) ?? [];
    const ys = numbers.filter((_, i) => i % 2 === 1);
    expect(ys.length).toBeGreaterThan(6);
    return Math.max(...ys);
  };

  it('never puts any part of a shoe under the ground, facing either way', () => {
    for (const dir of [1, -1] as const) {
      for (const lift of [0, 0.04, 0.1]) {
        for (let lean = -90; lean <= 90; lean += 6) {
          expect(lowestPoint(lean, lift, dir)).toBeLessThan(0.01);
        }
      }
    }
  });

  it('stands a plain boot exactly on the ground', () => {
    expect(lowestPoint(0, 0, 1)).toBeCloseTo(0, 6);
  });
});
