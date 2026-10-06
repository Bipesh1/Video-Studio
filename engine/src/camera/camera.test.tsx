import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PUNCH_IN_FRAMES, Pan, PunchIn, SHAKE_SECONDS, Shake, shakeAt } from './Camera';

/** Phase 2D camera moves (Style 8). */

const fps = 30;
const scene = <rect width={10} height={10} />;
const svg = (node: React.ReactNode) => renderToStaticMarkup(<svg>{node}</svg>);

describe('camera shake', () => {
  it('is still before the impact and after it has died away', () => {
    expect(shakeAt(9, fps, 10).force).toBe(0);
    expect(shakeAt(10 + Math.ceil(SHAKE_SECONDS * fps), fps, 10).force).toBe(0);
    expect(shakeAt(10, fps, 10).force).toBe(1);
  });

  it('is hardest at once and dies away', () => {
    const forces = [10, 12, 14, 16, 18].map((f) => shakeAt(f, fps, 10).force);
    for (let i = 1; i < forces.length; i++) {
      expect(forces[i]).toBeLessThan(forces[i - 1] ?? 0);
    }
  });

  it('never throws the picture farther than its strength, and is the same every render', () => {
    for (let f = 10; f < 22; f++) {
      const s = shakeAt(f, fps, 10, 7);
      expect(Math.abs(s.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(s.y)).toBeLessThanOrEqual(1);
      expect(shakeAt(f, fps, 10, 7)).toEqual(s);
    }
  });

  it('shakes again for each impact', () => {
    expect(shakeAt(40, fps, [10, 40]).force).toBe(1);
    expect(shakeAt(30, fps, [10, 40]).force).toBe(0);
  });

  it('draws the picture a touch bigger while it shakes, so no empty edge shows', () => {
    const at = (frame: number) =>
      svg(
        <Shake frame={frame} fps={fps} at={10} width={1080} height={1920} strength={16}>
          {scene}
        </Shake>,
      );
    expect(at(5)).not.toContain('transform');
    const zoom = Number(/scale\(([\d.]+)\)/.exec(at(10))?.[1]);
    // Growing by k about the middle hides a shift of (k - 1) * width / 2.
    expect(((zoom - 1) * 1080) / 2).toBeGreaterThan(16);
    expect(zoom).toBeLessThan(1.06);
  });
});

describe('fast push-in', () => {
  const zoomAt = (frame: number) =>
    Number(
      /scale\(([\d.]+)\)/.exec(
        svg(
          <PunchIn frame={frame} at={20} strength={0.2} focus={{ x: 500, y: 600 }}>
            {scene}
          </PunchIn>,
        ),
      )?.[1],
    );

  it('leaves the scene alone until it starts, then lands in a few frames and holds', () => {
    expect(zoomAt(0)).toBe(1);
    expect(zoomAt(20)).toBe(1);
    expect(zoomAt(20 + PUNCH_IN_FRAMES)).toBeCloseTo(1.2, 9);
    expect(zoomAt(200)).toBeCloseTo(1.2, 9);
    expect(PUNCH_IN_FRAMES).toBeLessThanOrEqual(6);
  });

  it('overshoots a touch on the way in', () => {
    const peak = Math.max(...[21, 22, 23, 24, 25].map(zoomAt));
    expect(peak).toBeGreaterThan(1.2);
    expect(peak).toBeLessThan(1.24);
  });
});

describe('pan', () => {
  const shiftAt = (frame: number) => {
    const m = /translate\((-?[\d.]+) (-?[\d.]+)\)/.exec(
      svg(
        <Pan frame={frame} from={10} to={40} dx={600}>
          {scene}
        </Pan>,
      ),
    );
    return Number(m?.[1]);
  };

  it('slides the scene the other way to the camera, between its two frames', () => {
    expect(shiftAt(0)).toBe(0);
    expect(shiftAt(10)).toBe(0);
    expect(shiftAt(25)).toBeCloseTo(-300, 6);
    expect(shiftAt(40)).toBe(-600);
    expect(shiftAt(90)).toBe(-600);
  });
});
