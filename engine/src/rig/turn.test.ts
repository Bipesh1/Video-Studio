import { describe, expect, it } from 'vitest';
import { gazeAt } from './life';
import { TURN_FRAMES, turnAt } from './turn';

describe('smooth head turns', () => {
  const keys = [
    { frame: 0, facing: 'right' as const, turn: 0.5 },
    { frame: 30, facing: 'left' as const, turn: 0.5 },
    { frame: 60, facing: 'left' as const, turn: 1 },
  ];

  it('holds a key until the next one and lands on it after the turn', () => {
    expect(turnAt(29, keys)).toEqual({ facing: 'right', turn: 0.5 });
    expect(turnAt(30 + TURN_FRAMES, keys)).toEqual({ facing: 'left', turn: 0.5 });
    expect(turnAt(200, keys)).toEqual({ facing: 'left', turn: 1 });
  });

  it('passes through the front view when the facing flips, and never pops', () => {
    let last = turnAt(30, keys);
    let reachedFront = false;
    for (let f = 31; f <= 30 + TURN_FRAMES; f++) {
      const now = turnAt(f, keys);
      if (now.facing !== last.facing) {
        // The flip happens only while both sides of it are close to the front view.
        expect(last.turn).toBeLessThan(0.2);
        expect(now.turn).toBeLessThan(0.2);
        reachedFront = true;
      } else {
        expect(Math.abs(now.turn - last.turn)).toBeLessThan(0.3);
      }
      last = now;
    }
    expect(reachedFront).toBe(true);
  });

  it('eases between two turns on the same side', () => {
    const mid = turnAt(60 + TURN_FRAMES / 2, keys);
    expect(mid.facing).toBe('left');
    expect(mid.turn).toBeGreaterThan(0.5);
    expect(mid.turn).toBeLessThan(1);
  });
});

describe('eye darts', () => {
  const fps = 30;

  it('are small, rest at the center most of the time, and repeat from the seed', () => {
    let away = 0;
    for (let f = 0; f < 600; f++) {
      const g = gazeAt(f, fps, 11);
      expect(Math.abs(g.x)).toBeLessThanOrEqual(0.36);
      expect(Math.abs(g.y)).toBeLessThanOrEqual(0.16);
      if (Math.hypot(g.x, g.y) > 0.01) away++;
      expect(gazeAt(f, fps, 11)).toEqual(g);
    }
    // Some glances, but the eyes are at rest for most of twenty seconds.
    expect(away).toBeGreaterThan(20);
    expect(away).toBeLessThan(300);
  });

  it('differ from one character to the next', () => {
    const a = Array.from({ length: 300 }, (_, f) => gazeAt(f, fps, 1).x);
    const b = Array.from({ length: 300 }, (_, f) => gazeAt(f, fps, 2).x);
    expect(a).not.toEqual(b);
  });
});
