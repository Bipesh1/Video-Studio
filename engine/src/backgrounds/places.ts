import { NIGHT_PALETTES, backgroundSpec } from './Background';
import type { BackgroundSpec, Treatment } from './Background';

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
  /** Out in space: a near-black sky full of stars, and no ground to stand on. */
  space: (seed: number) =>
    backgroundSpec('simple', 'deep-space', seed, {
      horizon: 0.74,
      ground: 'none',
      tufts: 0,
      moon: null,
      stars: 70,
      silhouettes: [],
    }),
  /** Above the Earth: the planet large below, the Sun small and far, stars all round. */
  'earth-orbit': (seed: number) =>
    backgroundSpec('simple', 'deep-space', seed, {
      horizon: 0.74,
      ground: 'none',
      tufts: 0,
      moon: null,
      stars: 60,
      silhouettes: [],
      bodies: [
        { kind: 'sun', x: 0.86, y: 0.14, r: 0.045 },
        { kind: 'earth', x: 0.3, y: 0.92, r: 0.44 },
      ],
    }),
  /** On the Moon: gray dust and craters under a black sky, with the Earth hanging in it. */
  'moon-surface': (seed: number) =>
    backgroundSpec('simple', 'moon-dust', seed, {
      horizon: 0.7,
      ground: 'dust',
      tufts: 0,
      moon: null,
      stars: 50,
      silhouettes: [],
      bodies: [{ kind: 'earth', x: 0.76, y: 0.2, r: 0.085 }],
    }),
  /** A modern city street: tall blocks with rows of windows, lit at night. */
  city: (seed: number) =>
    backgroundSpec('simple', 'clear-day', seed, {
      horizon: 0.7,
      ground: 'road',
      tufts: 0,
      silhouettes: [
        { kind: 'tower', x: 0.06, size: 0.34, layer: 'mid' },
        { kind: 'tower', x: 0.22, size: 0.5, layer: 'mid' },
        { kind: 'tower', x: 0.39, size: 0.3, layer: 'mid' },
        { kind: 'tower', x: 0.55, size: 0.44, layer: 'mid' },
        { kind: 'tower', x: 0.72, size: 0.54, layer: 'mid' },
        { kind: 'tower', x: 0.9, size: 0.36, layer: 'mid' },
        { kind: 'lamp-post', x: 0.955, size: 0.4, layer: 'near' },
      ],
    }),
  /** A modern living room: a sofa, a lamp, a television, a picture on the wall. */
  'living-room': (seed: number) =>
    backgroundSpec('simple', 'warm-interior', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [{ x: 0.52, y: 0.14, w: 0.2, h: 0.22 }],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [
          { kind: 'rug', x: 0.42 },
          { kind: 'picture', x: 0.24 },
          { kind: 'sofa', x: 0.24 },
          { kind: 'floor-lamp', x: 0.04 },
          { kind: 'tv', x: 0.8 },
          { kind: 'plant', x: 0.97 },
        ],
      },
    }),
  /** A science lab: a bench with flasks and a microscope, shelves of jars, a board with a chart. */
  lab: (seed: number) =>
    backgroundSpec('simple', 'cold-dawn', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [
          { kind: 'board', x: 0.26 },
          { kind: 'lab-shelves', x: 0.76 },
          { kind: 'lab-bench', x: 0.72 },
        ],
      },
    }),
  /**
   * A gorge at night in a coming storm: a near cliff on the left, a far cliff on the right, a
   * deep drop between, and an old rope bridge across it (`GORGE` says where the edges stand).
   */
  'gorge-bridge': (seed: number) =>
    backgroundSpec('atmospheric', 'storm-slate', seed, {
      horizon: 0.72,
      ground: 'gorge',
      // Far ridges along the skyline, so the bridge is high up in open country.
      hills: true,
      tufts: 0,
      rays: false,
      stars: 10,
      clouds: 7,
      silhouettes: [],
    }),
  /** Open sea to the horizon, with nothing on it. */
  sea: (seed: number) =>
    backgroundSpec('simple', 'clear-day', seed, {
      horizon: 0.7,
      ground: 'water',
      hills: false,
      tufts: 0,
      silhouettes: [],
    }),
  /** An empty plain: low hills and grass, and nothing anyone built. */
  plain: (seed: number) =>
    backgroundSpec('simple', 'clear-day', seed, {
      horizon: 0.7,
      hills: true,
      tufts: 12,
      silhouettes: [],
    }),
  /** Bare rock before anything lived: gray ground with a few dark hollows, under the sky. */
  'bare-rock': (seed: number) =>
    backgroundSpec('simple', 'clear-day', seed, {
      horizon: 0.7,
      ground: 'rock',
      hills: false,
      tufts: 0,
      silhouettes: [],
    }),
  /** A bank vault: a round steel door in the back wall and rows of locked boxes. */
  vault: (seed: number) =>
    backgroundSpec('simple', 'storm-slate', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [
          { kind: 'vault-boxes', x: 0.16 },
          { kind: 'vault-door', x: 0.62 },
        ],
      },
    }),
  /** A game-show stage: a curtain across the back and one spotlight on the middle of the floor. */
  'game-show': (seed: number) =>
    backgroundSpec('atmospheric', 'warm-interior', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [
          { kind: 'curtain', x: 0.5 },
          { kind: 'spotlight', x: 0.5 },
        ],
      },
    }),
  /** An auction room late at night: a bare wall with two pictures and one lamp over the middle. */
  'auction-room': (seed: number) =>
    backgroundSpec('atmospheric', 'warm-interior', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [
          { kind: 'picture', x: 0.16 },
          { kind: 'picture', x: 0.84 },
          { kind: 'spotlight', x: 0.5 },
        ],
      },
    }),
  /**
   * A restaurant in the evening: warm walls, two windows on the dark street, hanging lamps,
   * pictures, a plant, and other diners at small tables further back. The table the story sits
   * at is the prop `dining-table` (the comedy short of the split bill, 2026-10-16).
   */
  restaurant: (seed: number) =>
    backgroundSpec('simple', 'warm-interior', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [
          { x: 0.1, y: 0.16, w: 0.12, h: 0.24 },
          { x: 0.9, y: 0.16, w: 0.12, h: 0.24 },
        ],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [
          { kind: 'picture', x: 0.3 },
          { kind: 'picture', x: 0.7 },
          { kind: 'pendant', x: 0.22 },
          { kind: 'pendant', x: 0.5 },
          { kind: 'pendant', x: 0.78 },
          { kind: 'diner-table', x: 0.18 },
          { kind: 'diner-table', x: 0.84 },
          { kind: 'plant', x: 0.99 },
        ],
      },
    }),
  /**
   * The front of a small daycare at closing time, seen from the pavement: a door with lit panes,
   * the name DAYCARE over it in toy blocks, and a wide playroom window lit warm from inside with
   * children's paper pictures on the glass. In the dusk colours by default. Its notice board and
   * clock are props (`notice-board`, `wall-clock-4-15` and the rest), hung beside the door
   * (the late fine, 2026-10-17).
   */
  daycare: (seed: number) =>
    backgroundSpec('atmospheric', 'dusk-violet', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [
          { kind: 'daycare-door', x: 0.3 },
          { kind: 'daycare-sign', x: 0.3 },
          { kind: 'daycare-window', x: 0.74 },
        ],
      },
    }),
  /**
   * A kitchen at home (2026-10-20, "She Wrote Down Every Dish She Washed for a Year"): a row of
   * cupboards high on the wall over tiles, and a tall fridge at the end. The counter with its
   * sink and dishes is the prop `kitchen-sink`, the window the prop `window-night` (or
   * `window-seasons`), and the table and chairs are props too.
   */
  kitchen: (seed: number) =>
    backgroundSpec('simple', 'warm-interior', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [
          { kind: 'kitchen-cupboards', x: 0.36 },
          { kind: 'fridge', x: 0.92 },
        ],
      },
    }),
  /** A classroom: a board with a chart on a plain wall and one window. */
  classroom: (seed: number) =>
    backgroundSpec('simple', 'cold-dawn', seed, {
      horizon: 0.72,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [{ x: 0.82, y: 0.14, w: 0.14, h: 0.2 }],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [{ kind: 'board', x: 0.4 }],
      },
    }),
  /**
   * The Table: the dark room of the game theory videos. Bare grey walls and floor, and the
   * light of one bulb on the wall behind the table. Hang the `bulb` prop over the table.
   */
  'the-table': (seed: number) =>
    backgroundSpec('atmospheric', 'table-grey', seed, {
      horizon: 0.7,
      ground: 'floor',
      tufts: 0,
      silhouettes: [],
      interior: {
        windows: [],
        columns: 0,
        banners: 0,
        shelf: false,
        fittings: [{ kind: 'lamp-glow', x: 0.5 }],
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

/**
 * A place as a storyboard asks for it: the place's shapes, in the treatment and colors the
 * scene names. The same castle can stand under a stormy night or a cold dawn. Night colors
 * bring the moon and stars; day colors take them away. A room has neither.
 */
export function sceneBackground(
  name: PlaceName,
  treatment: Treatment,
  palette: string,
  seed: number,
): BackgroundSpec {
  const place = PLACES[name](seed);
  // Space is always dark: a place with no ground, or the Moon's dust, keeps its own sky. So
  // does the gorge in its storm: no moon and no light beams, whatever the scene's colours.
  if (place.ground === 'none' || place.ground === 'dust') return place;
  if (place.ground === 'gorge') return { ...place, treatment, palette };
  const light = backgroundSpec(treatment, palette, seed);
  const night = NIGHT_PALETTES.includes(palette) && !place.interior;
  return {
    ...place,
    treatment,
    palette,
    moon: night ? (place.moon ?? light.moon ?? { x: 0.2, y: 0.1, r: 0.05 }) : null,
    stars: night ? Math.max(place.stars, light.stars, 10) : 0,
    clouds: place.interior ? 0 : light.clouds,
    rays: place.interior ? place.rays : light.rays,
  };
}

export const isPlace = (name: string): name is PlaceName => name in PLACES;
