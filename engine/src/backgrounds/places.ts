import { backgroundSpec } from './Background';
import type { BackgroundSpec } from './Background';

/**
 * Places (Part 2, section 7.5: set kits): ready-made backgrounds a story can name. Each is a
 * recipe for a BackgroundSpec, so a scene can still change anything about it. They follow
 * Style 5: no outlines, quieter than the characters, depth by value.
 *
 * A place is where a whole scene happens. Stay in it for the scene, and change it only when
 * the story moves (playbook, L-0013).
 */
export const PLACES = {
  /** A village street after dark: houses with lit windows, a street lamp, the moon. */
  'night-street': (seed: number) =>
    backgroundSpec('simple', 'dusk-violet', seed, {
      horizon: 0.7,
      ground: 'road',
      tufts: 0,
      stars: 16,
      moon: { x: 0.2, y: 0.1, r: 0.05 },
      silhouettes: [
        { kind: 'house', x: 0.16, size: 0.3, layer: 'mid' },
        { kind: 'house', x: 0.52, size: 0.36, layer: 'mid' },
        { kind: 'house', x: 0.88, size: 0.28, layer: 'mid' },
        { kind: 'lamp-post', x: 1.0, size: 0.44, layer: 'near' },
      ],
    }),
  /** The same kind of street by day. */
  'day-street': (seed: number) =>
    backgroundSpec('simple', 'clear-day', seed, {
      horizon: 0.7,
      ground: 'road',
      tufts: 0,
      silhouettes: [
        { kind: 'house', x: 0.16, size: 0.3, layer: 'mid' },
        { kind: 'house', x: 0.52, size: 0.36, layer: 'mid' },
        { kind: 'tree', x: 0.76, size: 0.26, layer: 'mid' },
        { kind: 'house', x: 0.96, size: 0.28, layer: 'mid' },
      ],
    }),
  /** Open farmland: rolling hills, a fence, a tree, grass. */
  field: (seed: number) =>
    backgroundSpec('simple', 'clear-day', seed, {
      horizon: 0.7,
      hills: true,
      tufts: 14,
      silhouettes: [
        { kind: 'tree', x: 0.84, size: 0.24, layer: 'mid' },
        { kind: 'fence', x: 0.3, size: 0.1, layer: 'mid' },
        { kind: 'bush', x: 1.02, size: 0.13, layer: 'near' },
      ],
    }),
  /** Among trees: pines and round trees close together, dark trunks framing the picture. */
  forest: (seed: number) =>
    backgroundSpec('simple', 'clear-day', seed, {
      horizon: 0.7,
      hills: true,
      tufts: 10,
      silhouettes: [
        { kind: 'pine', x: 0.04, size: 0.56, layer: 'mid' },
        { kind: 'tree', x: 0.26, size: 0.42, layer: 'mid' },
        { kind: 'pine', x: 0.2, size: 0.62, layer: 'mid' },
        { kind: 'pine', x: 0.4, size: 0.5, layer: 'mid' },
        { kind: 'pine', x: 0.56, size: 0.64, layer: 'mid' },
        { kind: 'tree', x: 0.66, size: 0.44, layer: 'mid' },
        { kind: 'pine', x: 0.76, size: 0.54, layer: 'mid' },
        { kind: 'pine', x: 0.92, size: 0.6, layer: 'mid' },
        { kind: 'pine', x: -0.04, size: 0.76, layer: 'near' },
        { kind: 'pine', x: 1.06, size: 0.7, layer: 'near' },
      ],
    }),
  /** A castle on its hill under a stormy sky, with light breaking through the clouds. */
  castle: (seed: number) =>
    backgroundSpec('atmospheric', 'storm-slate', seed, {
      horizon: 0.72,
      silhouettes: [
        { kind: 'castle', x: 0.66, size: 0.4, layer: 'mid' },
        { kind: 'rock', x: 0.0, size: 0.1, layer: 'near' },
      ],
    }),
  /** The great hall of a castle: stone columns, banners, tall arched windows. */
  'throne-room': (seed: number) =>
    backgroundSpec('atmospheric', 'storm-slate', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [
          { x: 0.3, y: 0.16, w: 0.11, h: 0.3, arched: true },
          { x: 0.7, y: 0.16, w: 0.11, h: 0.3, arched: true },
        ],
        columns: 4,
        banners: 3,
        shelf: false,
      },
    }),
  /** A room in a house: a warm wall, a window with light coming in, a shelf of things. */
  'home-interior': (seed: number) =>
    backgroundSpec('simple', 'warm-interior', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [{ x: 0.74, y: 0.16, w: 0.24, h: 0.2 }],
        columns: 0,
        banners: 0,
        shelf: true,
      },
    }),
} as const satisfies Record<string, (seed: number) => BackgroundSpec>;

export type PlaceName = keyof typeof PLACES;

/** The background for a place by name, with anything about it changed. */
export function placeSpec(
  name: PlaceName,
  seed: number,
  overrides: Partial<BackgroundSpec> = {},
): BackgroundSpec {
  return { ...PLACES[name](seed), ...overrides };
}
