import { describe, expect, it } from 'vitest';
import { CLOTH, HELD, lagBehind, swayOf } from './follow';
import { vec } from './math';
import { resolvePose } from './pose';
import { stand } from './poses';
import { walkAt, walkSpeed, DEFAULT_WALK } from './walk';

/** Phase 2C follow-through: loose things lag what they hang from. */

const fps = 30;

describe('follow-through', () => {
  it('is zero behind something that has not moved', () => {
    const lag = lagBehind(() => vec(3, -2), 90, fps);
    expect(Math.hypot(lag.x, lag.y)).toBeLessThan(1e-9);
  });

  it('trails steadily behind something moving at a steady speed', () => {
    const speed = 1.5;
    const anchor = (f: number) => vec((speed * f) / fps, 0);
    const a = lagBehind(anchor, 60, fps);
    const b = lagBehind(anchor, 120, fps);
    // Behind means the anchor is ahead of the weight: a positive lag for travel toward +x.
    expect(a.x).toBeGreaterThan(0.05);
    expect(a.x).toBeCloseTo(b.x, 3);
    // The size of the trail comes from the drag: about drag times speed over stiffness.
    const k = (2 * Math.PI * CLOTH.hertz) ** 2;
    const expected = (CLOTH.drag * speed) / k;
    expect(a.x).toBeGreaterThan(expected * 0.85);
    expect(a.x).toBeLessThan(expected * 1.15);
  });

  it('swings on past when the anchor stops, then comes to rest', () => {
    const speed = 1.5;
    const stopAt = 60;
    const anchor = (f: number) => vec((speed * Math.min(f, stopAt)) / fps, 0);
    const lags = Array.from({ length: 60 }, (_, i) => lagBehind(anchor, stopAt + i, fps).x);
    expect(lags[0]).toBeGreaterThan(0.05);
    // It carries on forward past the anchor (a negative lag) before settling: follow-through.
    const first = lags[0] ?? 0;
    expect(Math.min(...lags)).toBeLessThan(-0.1 * first);
    expect(Math.min(...lags)).toBeGreaterThan(-0.7 * first);
    expect(Math.abs(lags[59] ?? 1)).toBeLessThan(0.01);
  });

  it('gives the same answer every time for the same frame', () => {
    const anchor = (f: number) => vec(Math.sin(f / 7), Math.cos(f / 5) * 0.2);
    expect(lagBehind(anchor, 77, fps)).toEqual(lagBehind(anchor, 77, fps));
  });

  it('makes a stiff held thing settle faster than cloth', () => {
    const anchor = (f: number) => vec(f < 30 ? 0 : 0.5, 0);
    // The last frame at which the weight is still more than a little way from its anchor.
    const settled = (spring: typeof CLOTH) => {
      let last = 30;
      for (let f = 30; f < 75; f++) {
        if (Math.abs(lagBehind(anchor, f, fps, spring).x) > 0.02) last = f;
      }
      return last;
    };
    expect(settled(HELD)).toBeLessThan(settled(CLOTH));
  });
});

describe('the sway of a character', () => {
  it('is nothing while standing still', () => {
    const still = resolvePose(stand);
    const s = swayOf(() => still, 60, fps);
    expect(Math.hypot(s.body.x, s.body.y)).toBeLessThan(1e-9);
    expect(Math.hypot(s.hand.x, s.hand.y)).toBeLessThan(1e-9);
  });

  it('trails a walk: the cape is behind the walker', () => {
    const s = swayOf((f) => walkAt(f / fps).pose, 90, fps);
    expect(s.body.x).toBeGreaterThan(0.05);
    expect(s.body.x).toBeLessThan(walkSpeed(DEFAULT_WALK));
  });
});
