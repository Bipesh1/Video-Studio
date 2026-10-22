import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  FADE_FRAMES,
  Fade,
  PUNCH_IN_FRAMES,
  Pan,
  PunchIn,
  SHAKE_SECONDS,
  Shake,
  shakeAt,
} from './Camera';
import { SHOTS, focusBetween, focusOn, shotTransform, shoulderPlacement } from './Framing';
import type { Focus } from './Framing';
import { resolvePose } from '../rig/pose';
import { stand } from '../rig/poses';

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

describe('quick fade between scenes', () => {
  const darkAt = (frame: number) => {
    const html = svg(<Fade frame={frame} at={100} width={1080} height={1920} />);
    return html.includes('<rect') ? Number(/opacity="([\d.]+)"/.exec(html)?.[1]) : 0;
  };

  it('is fully dark on the frame the scene changes and clear a few frames either side', () => {
    expect(darkAt(100)).toBe(1);
    expect(darkAt(100 - FADE_FRAMES)).toBe(0);
    expect(darkAt(100 + FADE_FRAMES)).toBe(0);
    expect(darkAt(97)).toBeCloseTo(0.5, 9);
    expect(darkAt(103)).toBeCloseTo(0.5, 9);
    expect(FADE_FRAMES).toBeLessThanOrEqual(8);
  });
});

describe('shot sizes by framing (Style 7)', () => {
  const size = { width: 1080, height: 1920 };
  // One person laid out wide, in the middle of the frame.
  const one: Focus = focusOn({ x: 540, groundY: 1400, head: 200 }, resolvePose(stand));
  const headAfter = (shot: (typeof SHOTS)[number], focus: Focus) => {
    const t = shotTransform(shot, focus, size);
    return {
      size: focus.head * t.scale,
      x: focus.x * t.scale + t.x,
      y: focus.y * t.scale + t.y,
      t,
    };
  };

  it('comes a little closer in a tall wide shot than the scene is laid out, so people are bigger', () => {
    // 2026-10-14, for the Shorts: faces hold the eye on a phone.
    expect(shotTransform('wide', one, size).scale).toBeCloseTo(0.125 / 0.105, 1);
  });

  it('makes the head bigger from wide to medium to close-up', () => {
    const wide = headAfter('wide', one).size;
    const medium = headAfter('medium', one).size;
    const close = headAfter('close-up', one).size;
    expect(medium).toBeGreaterThan(wide * 1.5);
    expect(close).toBeGreaterThan(medium * 1.6);
    // A close-up head fills about two fifths of the frame height.
    expect(close / size.height).toBeGreaterThan(0.36);
    expect(close / size.height).toBeLessThan(0.42);
  });

  it('keeps the framed face in the upper part of the frame, clear of the captions', () => {
    for (const shot of SHOTS) {
      const h = headAfter(shot, one);
      // A shot of the eyes is the one where the head is meant to be bigger than the picture.
      if (shot !== 'eyes') expect(h.y + h.size / 2).toBeLessThan(size.height * 0.75);
      expect(h.y).toBeLessThan(size.height * 0.45);
    }
  });

  it('fills the picture with the head in a shot of the eyes', () => {
    const eyes = headAfter('eyes', one);
    expect(eyes.size).toBeGreaterThan(headAfter('close-up', one).size * 1.5);
    expect(eyes.size).toBeGreaterThan(size.width);
  });

  it('never moves back from the layout or shows past the edge of the scene', () => {
    const corners: Focus[] = [
      { x: 60, y: 300, head: 200 },
      { x: 1040, y: 300, head: 200 },
      { x: 540, y: 1700, head: 200 },
    ];
    for (const shot of SHOTS) {
      for (const focus of [one, ...corners]) {
        const t = shotTransform(shot, focus, size);
        expect(t.scale).toBeGreaterThanOrEqual(1);
        expect(t.x).toBeLessThanOrEqual(1e-9);
        expect(t.y).toBeLessThanOrEqual(1e-9);
        expect(t.x + size.width * t.scale).toBeGreaterThanOrEqual(size.width - 1e-6);
        expect(t.y + size.height * t.scale).toBeGreaterThanOrEqual(size.height - 1e-6);
      }
    }
  });

  it('keeps two people both in a medium shot', () => {
    const a: Focus = { x: 300, y: 800, head: 200 };
    const b: Focus = { x: 800, y: 800, head: 200 };
    const t = shotTransform('medium', focusBetween(a, b), size);
    for (const p of [a, b]) {
      const x = p.x * t.scale + t.x;
      expect(x - (p.head * t.scale) / 2).toBeGreaterThan(0);
      expect(x + (p.head * t.scale) / 2).toBeLessThan(size.width);
    }
  });

  it('puts the near shoulder at the edge of the frame, facing in', () => {
    const left = shoulderPlacement(size, 'left');
    const right = shoulderPlacement(size, 'right');
    expect(left.x).toBeLessThan(size.width * 0.1);
    expect(left.facing).toBe('right');
    expect(right.x).toBeGreaterThan(size.width * 0.9);
    expect(right.facing).toBe('left');
    // In an over-the-shoulder shot the far person is on the other side from the near one.
    expect(headAfter('over-shoulder', one).x).toBeGreaterThan(size.width * 0.55);
  });
});
