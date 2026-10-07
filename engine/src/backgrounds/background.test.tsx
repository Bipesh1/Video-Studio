import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { lineWeights, palette, tokens, white } from '../tokens';
import { Background, NIGHT_PALETTES, backgroundSpec } from './Background';
import type { Treatment } from './Background';
import { placeSpec, sceneBackground } from './places';
import { bgRoles } from './roles';
import { luminance } from '../tokens';

const PALETTES = Object.keys(tokens.palettes);
const TREATMENTS: Treatment[] = ['simple', 'atmospheric'];

const render = (treatment: Treatment, name: string, frame = 0, cameraX = 0) =>
  renderToStaticMarkup(
    <svg>
      <Background
        spec={backgroundSpec(treatment, name, 7)}
        width={1080}
        height={1920}
        frame={frame}
        fps={30}
        cameraX={cameraX}
      />
    </svg>,
  );

describe('backgrounds (Style 5)', () => {
  it('have no outlines: the only strokes are white detail curls on silhouettes', () => {
    for (const name of PALETTES) {
      for (const tr of TREATMENTS) {
        const strokes = [...render(tr, name).matchAll(/stroke="([^"]+)"/g)].map((m) => m[1]);
        for (const s of strokes) expect([white, 'none']).toContain(s);
      }
    }
  });

  it('use blur and gradients only in the atmospheric treatment', () => {
    const simple = render('simple', 'dusk-violet');
    const atmo = render('atmospheric', 'storm-slate');
    expect(simple).not.toContain('feGaussianBlur');
    expect(atmo).toContain('feGaussianBlur');
    expect(atmo).toContain('linearGradient');
  });

  it('keep light rays inside the token opacity range at every frame', () => {
    const [lo, hi] = tokens.background.lightRayOpacity;
    for (const frame of [0, 17, 45, 90, 133]) {
      const svg = render('atmospheric', 'storm-slate', frame);
      const ray = bgRoles('storm-slate').ray;
      const opacities = [...svg.matchAll(new RegExp(`fill="${ray}" opacity="([0-9.]+)"`, 'g'))].map(
        (m) => Number(m[1]),
      );
      expect(opacities.length).toBeGreaterThanOrEqual(2);
      for (const o of opacities) {
        expect(o).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(o).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });

  it('are quieter than characters: every sky and ground is darker than a white head, except day skies', () => {
    for (const name of NIGHT_PALETTES) {
      const r = bgRoles(name);
      for (const c of [r.skyTop, r.skyBottom, r.ground, r.far, r.mid]) {
        expect(luminance(c)).toBeLessThan(luminance(tokens.fill.head) * 0.5);
      }
    }
  });

  it('get depth by value: far is lighter than mid, mid lighter than the ground on night palettes', () => {
    // In space the rule turns over: the ground of the Moon is lit and the sky behind it is black.
    for (const name of NIGHT_PALETTES.filter((n) => n !== 'deep-space' && n !== 'moon-dust')) {
      const r = bgRoles(name);
      expect(luminance(r.far)).toBeGreaterThan(luminance(r.mid));
      expect(luminance(r.mid)).toBeGreaterThan(luminance(r.ground));
    }
  });

  it('take their colors from the token palette of the shot', () => {
    for (const name of PALETTES) {
      const r = bgRoles(name);
      const p = palette(name);
      expect(p).toContain(r.skyTop);
    }
  });

  it('move layers by depth when the camera pans (parallax)', () => {
    const shifts = [
      ...render('atmospheric', 'storm-slate', 0, 100).matchAll(/translate\((-?[0-9.]+) 0\)/g),
    ].map((m) => Number(m[1]));
    expect(shifts).toContain(-0);
    expect(new Set(shifts).size).toBeGreaterThanOrEqual(5);
    expect(Math.min(...shifts)).toBeLessThan(-100);
  });

  it('never run out when endless: ground layers repeat and wrap as the camera travels', () => {
    const endless = (cameraX: number) =>
      renderToStaticMarkup(
        <svg>
          <Background
            spec={backgroundSpec('simple', 'clear-day', 7)}
            width={1080}
            height={1920}
            frame={0}
            fps={30}
            cameraX={cameraX}
            endless
          />
        </svg>,
      );
    const shifts = (html: string) =>
      [...html.matchAll(/translate\((-?[\d.]+) 0\)/g)].map((m) => Number(m[1]));
    // However far the camera has gone, no layer is ever more than one tile away.
    for (const x of [0, 900, 40000, -3000]) {
      for (const shift of shifts(endless(x)))
        expect(Math.abs(shift)).toBeLessThanOrEqual(1080 * 1.2);
    }
    // Each repeating layer is drawn twice, so the grass is there twice.
    const tufts = (html: string) => html.split('rotate(').length - 1;
    expect(tufts(endless(0))).toBe(2 * tufts(render('simple', 'clear-day')));
    // Twenty tiles on is a whole number of tiles for every layer, so the picture is the same.
    const here = shifts(endless(100));
    const there = shifts(endless(100 + 20 * 1080 * 1.2));
    expect(there.length).toBe(here.length);
    here.forEach((shift, i) => expect(there[i]).toBeCloseTo(shift, 6));
  });

  it('reach past their own canvas when the camera can see past it, and stand again to each side', () => {
    // A tall frame lays a scene out wider than the picture (L-0033), so the place has to go on
    // to both sides, above and below (Biku, 2026-10-07: "everything like bush and grass in
    // vertical is shown too big").
    const world = { left: 570, right: 570, top: 1400, bottom: 600 };
    const wider = (treatment: Treatment, name: string) =>
      renderToStaticMarkup(
        <svg>
          <Background
            spec={backgroundSpec(treatment, name, 7)}
            width={1080}
            height={1920}
            frame={0}
            fps={30}
            world={world}
          />
        </svg>,
      );
    const plain = render('simple', 'clear-day');
    const wide = wider('simple', 'clear-day');
    // The grass is there three times: on the canvas and one tile to each side.
    const tufts = (html: string) => html.split('rotate(').length - 1;
    expect(tufts(wide)).toBe(3 * tufts(plain));
    expect(wide).toContain(`translate(${-1.2 * 1080} 0)`);
    expect(wide).toContain(`translate(${1.2 * 1080} 0)`);
    // The sky goes on above the canvas and the ground below it.
    expect(wide).toContain('y="-1400"');
    expect(wide).toContain('y="1920"');
    expect(plain).not.toContain('y="-1400"');
    // Asked for nothing, a background is exactly what it always was.
    const none = renderToStaticMarkup(
      <svg>
        <Background
          spec={backgroundSpec('simple', 'clear-day', 7)}
          width={1080}
          height={1920}
          frame={0}
          fps={30}
          world={null}
        />
      </svg>,
    );
    expect(none.replace(/bg[A-Za-z0-9_-]+/g, 'bg')).toBe(plain.replace(/bg[A-Za-z0-9_-]+/g, 'bg'));
  });

  it('paint space dark and the Moon pale, with the Earth in its sky and no outline on it', () => {
    const space = bgRoles('deep-space');
    const moon = bgRoles('moon-dust');
    expect(luminance(space.skyTop)).toBeLessThan(0.02);
    expect(luminance(moon.ground)).toBeGreaterThan(luminance(moon.skyBottom) * 4);
    const html = renderToStaticMarkup(
      <svg>
        <Background
          spec={placeSpec('moon-surface', 7)}
          width={1920}
          height={1080}
          frame={0}
          fps={30}
        />
      </svg>,
    );
    // A body far off in a sky is background: nothing on it is stroked in ink.
    expect(html).not.toContain(`stroke="${tokens.line.color}"`);
    expect(placeSpec('moon-surface', 7).bodies?.[0]?.kind).toBe('earth');
    // Space has no ground at all, and keeps its own dark sky whatever light a scene asks for.
    expect(placeSpec('space', 7).ground).toBe('none');
    expect(sceneBackground('space', 'atmospheric', 'clear-day', 7).palette).toBe('deep-space');
    expect(sceneBackground('city', 'simple', 'dusk-violet', 7).palette).toBe('dusk-violet');
  });

  it('are deterministic for the same seed and frame', () => {
    expect(render('atmospheric', 'storm-slate', 12)).toBe(render('atmospheric', 'storm-slate', 12));
  });

  it('put moon and stars only in night palettes by default', () => {
    expect(backgroundSpec('simple', 'clear-day', 1).moon).toBeNull();
    expect(backgroundSpec('simple', 'clear-day', 1).stars).toBe(0);
    expect(backgroundSpec('simple', 'dusk-violet', 1).moon).not.toBeNull();
  });

  it('draw silhouette detail lines thinner than character outlines', () => {
    const svg = render('simple', 'dusk-violet');
    const widths = [...svg.matchAll(/stroke-width="([0-9.]+)"/g)].map((m) => Number(m[1]));
    for (const w of widths) expect(w / 1920).toBeLessThan(lineWeights.outline);
  });
});
