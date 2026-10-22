import { ink, lighten, luminance, mix, palette, pick, shade, tokens, white } from '../tokens';

/** What each part of a background is painted with, all derived from one token palette (Style 6). */
export type BgRoles = {
  skyTop: string;
  skyBottom: string;
  /** Depth by value (Style 5.1): far is closest to the sky, near is darkest. */
  far: string;
  mid: string;
  ground: string;
  groundFar: string;
  near: string;
  /** Cloud values, dark to light: the light one sits on the edge facing the light. */
  clouds: readonly [string, string, string];
  ray: string;
  star: string;
  moon: string;
  haze: string;
  tuft: string;
  /** A paved street: the sky color pulled toward ink, so it is neutral, not grass. */
  road: string;
  /** Inside a room: the wall, the band where it meets the floor, and window or lamp light. */
  wall: string;
  trim: string;
  light: string;
};

type Base = {
  skyTop: string;
  skyBottom: string;
  ground: string;
  clouds: [string, string, string];
  ray: string;
};

function base(name: string): Base {
  const p = palette(name);
  const c = (i: number) => pick(p, i);
  switch (name) {
    // Table grey is storm slate with its colour taken out, value for value.
    case 'storm-slate':
    case 'table-grey':
      return { skyTop: c(1), skyBottom: c(2), ground: c(0), clouds: [c(1), c(2), c(3)], ray: c(4) };
    case 'dusk-violet':
      return {
        skyTop: c(0),
        skyBottom: c(1),
        ground: c(3),
        clouds: [c(0), c(1), c(2)],
        ray: lighten(c(2), 0.3),
      };
    case 'clear-day':
      return {
        skyTop: c(0),
        skyBottom: c(1),
        ground: c(2),
        clouds: [c(1), lighten(c(1), 0.5), white],
        ray: white,
      };
    case 'warm-interior':
      return {
        skyTop: c(1),
        skyBottom: c(0),
        ground: c(2),
        clouds: [c(1), c(0), lighten(c(0), 0.4)],
        ray: lighten(c(0), 0.5),
      };
    case 'danger':
      return {
        skyTop: c(0),
        skyBottom: c(2),
        ground: shade(c(0), 0.25),
        clouds: [c(0), c(1), c(2)],
        ray: lighten(c(2), 0.35),
      };
    case 'cold-dawn':
      return {
        skyTop: c(0),
        skyBottom: c(2),
        ground: shade(c(0), 0.35),
        clouds: [c(0), c(1), c(2)],
        ray: c(2),
      };
    case 'deep-space':
      return { skyTop: c(0), skyBottom: c(1), ground: c(0), clouds: [c(0), c(1), c(2)], ray: c(2) };
    case 'moon-dust':
      return {
        skyTop: c(0),
        skyBottom: c(1),
        ground: c(2),
        clouds: [c(0), c(1), c(3)],
        ray: lighten(c(2), 0.3),
      };
    default: {
      // Any other palette: order its colors by value, darkest at the ground, lightest at the horizon.
      const sorted = [...p].sort((a, b) => luminance(a) - luminance(b));
      const dark = pick(sorted, 0);
      const light = pick(sorted, sorted.length - 1);
      const middle = pick(sorted, Math.floor(sorted.length / 2));
      return {
        skyTop: middle,
        skyBottom: light,
        ground: dark,
        clouds: [dark, middle, light],
        ray: lighten(light, 0.4),
      };
    }
  }
}

export function bgRoles(name: string): BgRoles {
  const b = base(name);
  return {
    ...b,
    far: mix(b.skyBottom, b.ground, 0.3),
    mid: mix(b.skyBottom, b.ground, 0.62),
    groundFar: mix(b.ground, b.skyBottom, 0.25),
    near: ink,
    star: white,
    moon: tokens.background.moon,
    haze: lighten(b.skyBottom, 0.15),
    tuft: shade(b.ground, 0.45),
    road: mix(b.skyBottom, ink, 0.5),
    wall: b.skyTop,
    trim: mix(b.skyTop, b.ground, 0.55),
    light: lighten(b.skyBottom, 0.3),
  };
}
