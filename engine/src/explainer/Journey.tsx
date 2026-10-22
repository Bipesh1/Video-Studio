import type { Graphic, JourneyStop, JourneyThing } from '@studio/shared';
import type { ReactNode } from 'react';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { VIEWER_FONT } from '../overlays/text';

/**
 * A journey through one drawn world (Biku, 2026-10-17: "the animation should be very immersive,
 * not a bunch of slideshows ... actual drawings going deep, like opening up a planet and showing
 * it"). The camera never cuts: it flies from where the last shot left it to this shot's stop,
 * out and in through every scale on the way (the smooth zoom-and-pan path of van Wijk and Nuij,
 * 2003), and things open up to show their inside.
 *
 * The world `orbit` is drawn at its true sizes, in kilometres, with the Earth's middle at 0, 0
 * and you standing on top of it: your phone's screen, you in a street of the city, the clouds, the
 * whole Earth, and the GPS satellites 20,200 km up. Things too small to see at a scale are left
 * out, and the satellites keep a smallest size, as on a map. Shapes far larger than the frame
 * (the Earth when you stand on it) are drawn only where the camera can see them, so the picture
 * stays exact from a phone's screen to the whole orbit.
 */

const J = fineTokens.journey;
const LINE = fineTokens.line;
const font = `${VIEWER_FONT}, Arial, sans-serif`;

type Journey = Extract<Graphic, { kind: 'journey' }>;
export type Cam = { x: number; y: number; w: number };

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const outBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
const DEG = Math.PI / 180;

// ---- the world `orbit`, in kilometres
/** The Earth's radius, and the GPS satellites' distance from its middle (20,200 km up). */
const R = 6371;
const ORBIT = R + 20200;
/** You stand on top of the Earth. */
const YOU = { x: 0, y: -R };
/** Your phone, held up in front of you facing us: its middle, and its size. */
const PHONE = { x: 0.00036, y: -R - 0.00155, w: 0.000074, h: 0.000152 };
/** How fast the satellites move along their orbits, in degrees a second (a little quicker than life). */
const SPIN = 0.12;

type Sat = { a: number; e: number; tilt: number; phase: number; hero?: number };
/** Four satellites in your sky (the four your phone listens to), and others on their orbits. */
const SATS: Sat[] = [
  { a: ORBIT, e: 1, tilt: 0, phase: -64, hero: 1 },
  { a: ORBIT, e: 1, tilt: 0, phase: -104, hero: 2 },
  { a: ORBIT, e: 1, tilt: 0, phase: -142, hero: 3 },
  { a: ORBIT, e: 1, tilt: 0, phase: -30, hero: 4 },
  { a: ORBIT, e: 1, tilt: 0, phase: 60 },
  { a: ORBIT, e: 1, tilt: 0, phase: 150 },
  { a: ORBIT, e: 0.42, tilt: 32, phase: 25 },
  { a: ORBIT, e: 0.42, tilt: 32, phase: 140 },
  { a: ORBIT, e: 0.42, tilt: 32, phase: 250 },
  { a: ORBIT, e: 0.3, tilt: -28, phase: 80 },
  { a: ORBIT, e: 0.3, tilt: -28, phase: 205 },
  { a: ORBIT, e: 0.3, tilt: -28, phase: 320 },
];
const ORBITS = [
  { e: 1, tilt: 0 },
  { e: 0.42, tilt: 32 },
  { e: 0.3, tilt: -28 },
];

/** Where a satellite is at time t (seconds), and whether it is on the near side of its orbit. */
function satAt(s: Sat, t: number) {
  const phi = (s.phase + SPIN * t) * DEG;
  const ex = s.a * Math.cos(phi);
  const ey = s.a * s.e * Math.sin(phi);
  const c = Math.cos(s.tilt * DEG);
  const n = Math.sin(s.tilt * DEG);
  return { x: ex * c - ey * n, y: ex * n + ey * c, near: s.e === 1 || Math.sin(phi) > 0 };
}
const hero = (k: number, t: number) => satAt(SATS[k - 1] as Sat, t);
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/** The satellite's true size: its body, and its wings of solar panels, in kilometres. */
const SAT = { body: 0.0026, span: 0.0168 };

/** The camera's stops: where it looks and how wide a view it takes (the frame's width, in km). */
function stopOf(stop: JourneyStop, t: number, tall: boolean): Cam {
  const k = tall ? 1 : 1.9;
  const s1 = hero(1, t);
  switch (stop) {
    case 'phone':
      return { x: PHONE.x, y: PHONE.y - 0.000012, w: PHONE.w / 0.42 };
    case 'street':
      return { x: 0.0004, y: -R - 0.0024, w: 0.0062 * k };
    case 'clouds':
      return { x: 0.2, y: -R - 2.4, w: 9 * k };
    case 'earth':
      return { x: 0, y: -2600, w: 64000 * k };
    case 'sky':
      return { x: 0, y: -15800, w: 37000 * k };
    case 'satellite':
      return { x: s1.x, y: s1.y + 0.0012, w: (SAT.span / 0.8) * k };
    case 'inside':
      return { x: s1.x, y: s1.y + 0.0002, w: (SAT.body / 0.62) * k };
    case 'well':
      return { x: 0, y: -9000, w: 40000 * k };
    default:
      // A stop of another world: this world has none by that name.
      return { x: 0, y: -2600, w: 64000 * k };
  }
}

/**
 * The smooth zoom and pan between two views (Jarke van Wijk and Wim Nuij, "Smooth and efficient
 * zooming and panning", 2003): it pulls back as far as it must to see both, crosses, and closes
 * in, at a steady speed to the eye. Written in the stable form, so it holds across a factor of a
 * thousand million between a phone's screen and the whole orbit.
 */
export function zoomPath(a: Cam, b: Cam) {
  const rho = Math.SQRT2;
  const r2 = rho * rho;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-12 * Math.max(a.w, b.w)) {
    const S = Math.abs(Math.log(b.w / a.w)) / rho;
    return {
      S,
      at: (u: number): Cam => ({ x: a.x + u * dx, y: a.y + u * dy, w: a.w * (b.w / a.w) ** u }),
    };
  }
  const b0 = (b.w * b.w - a.w * a.w + r2 * r2 * d * d) / (2 * a.w * r2 * d);
  const b1 = (b.w * b.w - a.w * a.w - r2 * r2 * d * d) / (2 * b.w * r2 * d);
  const r0 = -Math.asinh(b0);
  const r1 = -Math.asinh(b1);
  const S = (r1 - r0) / rho;
  return {
    S,
    at: (u: number): Cam => {
      const s = u * S;
      const along = ((a.w / (r2 * d)) * Math.sinh(rho * s)) / Math.cosh(rho * s + r0);
      return {
        x: a.x + along * dx,
        y: a.y + along * dy,
        w: (a.w * Math.cosh(r0)) / Math.cosh(rho * s + r0),
      };
    },
  };
}

/** How many frames the flight between two views takes: longer for a longer way. */
export function flightFrames(from: JourneyStop, to: JourneyStop, fps: number): number {
  if (from === to) return 0;
  const path = zoomPath(stopOf(from, 0, true), stopOf(to, 0, true));
  return Math.round(fps * clamp(0.7 + 0.13 * path.S, 0.8, 3.2));
}

// ---- drawing helpers: world to screen
export type View = {
  cam: Cam;
  W: number;
  H: number;
  fx: number;
  fy: number;
  /** Pixels to a kilometre. */
  k: number;
  P: (x: number, y: number) => [number, number];
};
/** Far enough out that a point clamped there is never confused with one in view. */
const FAR = 1e6;
export function viewOf(cam: Cam, W: number, H: number): View {
  const fx = W / 2;
  const fy = H * (W < H ? 0.42 : 0.46);
  const k = W / cam.w;
  return {
    cam,
    W,
    H,
    fx,
    fy,
    k,
    P: (x, y) => [clamp(fx + (x - cam.x) * k, -FAR, FAR), clamp(fy + (y - cam.y) * k, -FAR, FAR)],
  };
}
/**
 * The box every closed shape is cut to, a little beyond any frame (the tall one is 1080 by 1920,
 * the wide one 1920 by 1080). A shape reaching far past the frame, a wall or the sky seen from
 * close up, made the browser draw the picture in tiles, with seams and gaps between them for a
 * frame at a time (the water world, 2026-10-18); cut to this box, it never does.
 */
const CUT = { lo: -400, hi: 2400 };
type Pt = [number, number];
function cutTo(pts: Pt[]): Pt[] {
  const edges: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [
    [(p) => p[0] >= CUT.lo, (a, b) => at(a, b, 0, CUT.lo)],
    [(p) => p[0] <= CUT.hi, (a, b) => at(a, b, 0, CUT.hi)],
    [(p) => p[1] >= CUT.lo, (a, b) => at(a, b, 1, CUT.lo)],
    [(p) => p[1] <= CUT.hi, (a, b) => at(a, b, 1, CUT.hi)],
  ];
  function at(a: Pt, b: Pt, axis: 0 | 1, v: number): Pt {
    const t = (v - a[axis]) / (b[axis] - a[axis]);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  }
  let out = pts;
  for (const [inside, cross] of edges) {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const cur = src[i] as Pt;
      const prev = src[(i + src.length - 1) % src.length] as Pt;
      if (inside(cur)) {
        if (!inside(prev)) out.push(cross(prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(cross(prev, cur));
    }
    if (out.length === 0) break;
  }
  return out;
}
export const path = (pts: Pt[], close = true) => {
  const shown = close
    ? cutTo(pts)
    : pts.map(
        ([x, y]) => [clamp(x, CUT.lo * 4, CUT.hi * 4), clamp(y, CUT.lo * 4, CUT.hi * 4)] as Pt,
      );
  return shown.length === 0
    ? ''
    : `M ${shown.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L ')}${close ? ' Z' : ''}`;
};

/**
 * Points along a circle of radius r round (cx, cy), from angle a0 to a1 (radians, a1 > a0):
 * close together where the camera can see, a few elsewhere. A circle a thousand million pixels
 * wide is drawn exactly where it crosses the frame.
 */
export function arc(v: View, cx: number, cy: number, r: number, a0: number, a1: number) {
  const seen = Math.hypot(v.W, v.H) / v.k;
  const ac = Math.atan2(v.cam.y - cy, v.cam.x - cx);
  const half = Math.min(Math.PI, (2.5 * seen) / r);
  const out: number[] = [];
  const coarse = Math.max(8, Math.ceil(((a1 - a0) / (2 * Math.PI)) * 96));
  for (let i = 0; i <= coarse; i++) out.push(a0 + ((a1 - a0) * i) / coarse);
  // The part in view, finely.
  for (const turn of [-2, 0, 2]) {
    const lo = Math.max(a0, ac + turn * Math.PI - half);
    const hi = Math.min(a1, ac + turn * Math.PI + half);
    if (hi <= lo) continue;
    for (let i = 0; i <= 72; i++) out.push(lo + ((hi - lo) * i) / 72);
  }
  out.sort((p, q) => p - q);
  return out.map((a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number]);
}
/** A whole disc round (cx, cy). */
export function disc(v: View, cx: number, cy: number, r: number): string {
  const px = r * v.k;
  if (px < 4 * Math.max(v.W, v.H)) {
    const [x, y] = v.P(cx, cy);
    // Wholly out of the frame: nothing to draw (a far-off circle would stretch the picture).
    if (Math.hypot(x - v.W / 2, y - v.H / 2) - px > Math.hypot(v.W, v.H)) return '';
    return `M ${x - px} ${y} A ${px} ${px} 0 1 0 ${x + px} ${y} A ${px} ${px} 0 1 0 ${x - px} ${y} Z`;
  }
  return path(arc(v, cx, cy, r, -Math.PI, Math.PI).map(([x, y]) => v.P(x, y)));
}
/** A band between two circles round (cx, cy), drawn even-odd. */
export function band(v: View, cx: number, cy: number, r0: number, r1: number): string {
  return `${disc(v, cx, cy, r1)} ${disc(v, cx, cy, r0)}`;
}
/** A part of a band, between angles a0 and a1 (degrees). */
function sector(v: View, r0: number, r1: number, a0: number, a1: number): string {
  const outer = arc(v, 0, 0, r1, a0 * DEG, a1 * DEG);
  const inner = arc(v, 0, 0, r0, a0 * DEG, a1 * DEG).reverse();
  return path([...outer, ...inner].map(([x, y]) => v.P(x, y)));
}
/** Whether something of world size `size` at (x, y) can be seen at all. */
export const seen = (v: View, x: number, y: number, size: number) => {
  if (size * v.k < 0.6) return false;
  const [sx, sy] = [v.fx + (x - v.cam.x) * v.k, v.fy + (y - v.cam.y) * v.k];
  const m = size * v.k;
  return sx > -m && sx < v.W + m && sy > -m && sy < v.H + m;
};
/** A group drawn in its own units (`unit` km each), placed at (x, y), turned by `turn` degrees. */
export function placed(v: View, x: number, y: number, unit: number, turn: number, body: ReactNode) {
  const [sx, sy] = [v.fx + (x - v.cam.x) * v.k, v.fy + (y - v.cam.y) * v.k];
  return <g transform={`translate(${sx} ${sy}) rotate(${turn}) scale(${unit * v.k})`}>{body}</g>;
}

// ---- the things of the world
function Space({ v, t }: { v: View; t: number }) {
  return (
    <>
      <rect width={v.W} height={v.H} fill={J.space} />
      <defs>
        <radialGradient id="jy-space-glow" cx="0.5" cy="0.45" r="0.7">
          <stop offset="0" stopColor={J.spaceGlow} stopOpacity={0.9} />
          <stop offset="1" stopColor={J.spaceGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={v.W} height={v.H} fill="url(#jy-space-glow)" />
      {Array.from({ length: 70 }, (_, i) => {
        const drift = Math.log10(v.cam.w) * 9;
        const x = (((i * 397.3 + drift * (1 + (i % 3))) % v.W) + v.W) % v.W;
        const y = (((i * 173.9 + drift * 0.6) % v.H) + v.H) % v.H;
        const twinkle = 0.55 + 0.45 * Math.sin(t * 1.7 + i * 2.3);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={(1.2 + (i % 4) * 0.7) * (v.W / 1080)}
            fill={J.star}
            opacity={0.25 + 0.5 * twinkle}
          />
        );
      })}
    </>
  );
}

/** The atmosphere, from the light sky at the ground to the dark blue at its top, in flat bands. */
const AIR: [number, string][] = [
  [9, J.sky],
  [26, J.skyMid],
  [60, J.skyHigh],
  [140, J.skyEdge],
];

/** The land, as outlines on the Earth's face (angle in degrees, share of the radius). */
const LANDS: [number, number][][] = [
  // Under you: a wide land from the north round the top.
  [
    [-128, 1],
    [-118, 1],
    [-104, 1],
    [-90, 1],
    [-74, 1],
    [-62, 1],
    [-55, 0.86],
    [-62, 0.7],
    [-76, 0.58],
    [-92, 0.66],
    [-106, 0.55],
    [-120, 0.7],
    [-132, 0.84],
  ],
  [
    [-30, 0.9],
    [-10, 0.98],
    [8, 0.8],
    [2, 0.55],
    [-14, 0.4],
    [-28, 0.6],
  ],
  [
    [150, 0.85],
    [172, 0.95],
    [196, 0.7],
    [178, 0.45],
    [158, 0.6],
  ],
  [
    [60, 0.6],
    [88, 0.75],
    [110, 0.5],
    [86, 0.3],
  ],
];
function landPath(v: View, pts: [number, number][]): string {
  const out: [number, number][] = [];
  for (let i = 0; i < pts.length; i++) {
    const [a, f] = pts[i] as [number, number];
    const [b, g] = pts[(i + 1) % pts.length] as [number, number];
    if (f === 1 && g === 1) {
      out.push(...arc(v, 0, 0, R, Math.min(a, b) * DEG, Math.max(a, b) * DEG));
    } else {
      out.push([R * f * Math.cos(a * DEG), R * f * Math.sin(a * DEG)]);
    }
  }
  return path(out.map(([x, y]) => v.P(x, y)));
}

function Earth({ v, t }: { v: View; t: number }) {
  const whole = R * v.k < 3 * Math.max(v.W, v.H);
  const night = whole ? (
    // The night side: a darker crescent on the far side from the Sun (to the lower right).
    <path
      d={(() => {
        const [x, y] = v.P(0, 0);
        const r = R * v.k;
        return `M ${x - r * 0.62} ${y + r * 0.78} A ${r} ${r} 0 0 0 ${x + r * 0.95} ${y - r * 0.3} A ${r * 1.15} ${r * 1.15} 0 0 1 ${x - r * 0.62} ${y + r * 0.78} Z`;
      })()}
      fill={J.night}
      opacity={0.45}
    />
  ) : null;
  return (
    <>
      {AIR.slice()
        .reverse()
        .map(([h, fill], i) => (
          <path key={i} d={band(v, 0, 0, R, R + h)} fill={fill} fillRule="evenodd" />
        ))}
      <path d={disc(v, 0, 0, R)} fill={J.ocean} />
      {whole && <path d={disc(v, 0, 0, R * 0.985)} fill={J.oceanShade} opacity={0.25} />}
      {LANDS.map((land, i) => (
        <path key={i} d={landPath(v, land)} fill={i === 0 ? J.land : J.landShade} />
      ))}
      {/* The city you stand in: grey ground a few kilometres either side of you. */}
      <path d={sector(v, R - 3, R, -90.05, -89.95)} fill={J.ground} />
      {whole &&
        // Weather over the oceans, drifting a little.
        [
          [150 + t * 0.4, 0.62, 0.22],
          [20 + t * 0.4, 0.75, 0.16],
          [100 + t * 0.4, 0.4, 0.2],
        ].map(([a, f, s], i) => {
          const x = R * (f as number) * Math.cos((a as number) * DEG);
          const y = R * (f as number) * Math.sin((a as number) * DEG);
          const [sx, sy] = v.P(x, y);
          const r = R * (s as number) * v.k;
          return (
            <ellipse key={i} cx={sx} cy={sy} rx={r} ry={r * 0.34} fill={J.cloud} opacity={0.55} />
          );
        })}
      {night}
      {whole && (
        <path
          d={disc(v, 0, 0, R)}
          fill="none"
          stroke={J.skyMid}
          strokeWidth={Math.max(2, R * v.k * 0.03)}
          opacity={0.5}
        />
      )}
    </>
  );
}

/** Clouds over the city, a few kilometres up. */
function Clouds({ v, t }: { v: View; t: number }) {
  const puffs: [number, number, number][] = [
    [-3.1, 2.2, 1.7],
    [-0.9, 3.0, 1.2],
    [1.6, 2.5, 2.0],
    [3.9, 3.3, 1.3],
    [0.4, 1.4, 0.9],
  ];
  return (
    <>
      {puffs.map(([x, h, s], i) => {
        const cx = x + 0.02 * t;
        const cy = -R - h;
        if (!seen(v, cx, cy, s * 2)) return null;
        return (
          <g key={i}>
            {placed(
              v,
              cx,
              cy,
              s,
              0,
              <>
                <ellipse cx={0} cy={0.12} rx={1} ry={0.26} fill={J.cloudShade} />
                <circle cx={-0.45} cy={0} r={0.3} fill={J.cloud} />
                <circle cx={0} cy={-0.12} r={0.42} fill={J.cloud} />
                <circle cx={0.48} cy={0.02} r={0.28} fill={J.cloud} />
                <ellipse cx={0} cy={0.1} rx={0.9} ry={0.2} fill={J.cloud} />
              </>,
            )}
          </g>
        );
      })}
    </>
  );
}

/** The street round you: the road, the pavement, buildings with lit windows, in metres. */
function Street({ v }: { v: View }) {
  if (v.k * 0.001 < 0.05) return null;
  const m = 0.001;
  const blocks: [number, number, number][] = [
    [-34, 22, 46],
    [-15, 14, 28],
    [-2.5, 9, 18],
    [8, 13, 34],
    [24, 18, 22],
    [46, 22, 52],
    [-62, 26, 30],
    [76, 30, 40],
  ];
  return placed(
    v,
    0,
    -R,
    m,
    0,
    <>
      {/* Buildings behind the street. */}
      {blocks.map(([x, w, h], i) => (
        <g key={i}>
          <rect
            x={x - w / 2}
            y={-h - 0.8}
            width={w}
            height={h}
            fill={J.buildings[i % J.buildings.length]}
            stroke={LINE.color}
            strokeWidth={0.18}
          />
          {Array.from({ length: Math.floor(h / 4) - 1 }, (_, r) =>
            Array.from({ length: Math.max(1, Math.floor(w / 4)) }, (_, c) => (
              <rect
                key={`${r}-${c}`}
                x={x - w / 2 + 1.2 + c * 4}
                y={-h - 0.8 + 2 + r * 4}
                width={1.8}
                height={2.2}
                fill={J.window}
                opacity={0.85}
              />
            )),
          )}
        </g>
      ))}
      <rect x={-400} y={-0.8} width={800} height={1.6} fill={J.pavement} />
      <rect x={-400} y={0.8} width={800} height={60} fill={J.road} />
      {Array.from({ length: 60 }, (_, i) => (
        <rect key={i} x={-400 + i * 14} y={3.2} width={7} height={0.3} fill={J.roadLine} />
      ))}
    </>,
  );
}

/** The map on your phone's screen: blocks, streets, a park, a river, and you, the blue dot. */
function MapScreen({ t, dot, drift }: { t: number; dot: number; drift: number }) {
  // In the phone's own units: its screen is 64 by 132.
  const w = 64;
  const h = 132;
  const slide = smooth(drift) * 26;
  return (
    <>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} fill={J.map} />
      <path
        d={`M ${-w / 2} ${-30} Q ${-6} ${-40} ${w / 2} ${-56} L ${w / 2} ${-46} Q ${-6} ${-30} ${-w / 2} ${-20} Z`}
        fill={J.river}
      />
      <rect x={6} y={18} width={22} height={26} rx={3} fill={J.park} />
      {[-48, -8, 32].map((y) => (
        <rect key={y} x={-w / 2} y={y} width={w} height={4.5} fill={J.street} />
      ))}
      {[-14, 14].map((x) => (
        <rect key={x} x={x} y={-h / 2} width={4.5} height={h} fill={J.street} />
      ))}
      {[-24, 0, 22].map((x) =>
        [-62, -26, 10, 48].map((y) => (
          <rect key={`${x}${y}`} x={x - 4} y={y + 3} width={8} height={8} fill={J.mapBlock} />
        )),
      )}
      {dot > 0 && (
        <g transform={`translate(${slide} ${-slide * 0.7}) scale(${outBack(clamp(dot))})`}>
          <circle r={9 + 4 * Math.sin(t * 4)} fill={J.dotHalo} opacity={0.45} />
          <circle r={5.4} fill={J.street} />
          <circle r={4} fill={J.dot} />
        </g>
      )}
      {drift > 0 && (
        // Where you really are, left behind as the dot slides away.
        <g opacity={clamp(drift * 3)}>
          <circle r={4} fill="none" stroke={J.cross} strokeWidth={1.2} strokeDasharray="2 1.5" />
        </g>
      )}
    </>
  );
}

/** You: a faceless figure holding your phone up beside you, its map toward us. */
function You({ v, t, dot, drift }: { v: View; t: number; dot: number; drift: number }) {
  if (v.k * 0.0017 < 1.5) return null;
  const m = 0.001;
  const px = (PHONE.x / m).toFixed(3);
  const py = ((PHONE.y + R) / m).toFixed(3);
  return placed(
    v,
    0,
    -R,
    m,
    0,
    <>
      <path d="M -0.13 0 L -0.1 -0.86 L 0.1 -0.86 L 0.13 0 Z" fill={J.trousers} />
      <rect x={-0.2} y={-1.46} width={0.4} height={0.66} rx={0.12} fill={J.shirt} />
      <circle cx={0} cy={-1.62} r={0.13} fill={J.skin} stroke={LINE.color} strokeWidth={0.008} />
      {/* One arm down, the other raised to hold the phone up beside the head. */}
      <path
        d="M -0.17 -1.38 Q -0.24 -1.1 -0.22 -0.9"
        stroke={J.shirt}
        strokeWidth={0.08}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M 0.17 -1.38 Q 0.3 -1.36 ${px} ${Number(py) + 0.07}`}
        stroke={J.shirt}
        strokeWidth={0.08}
        fill="none"
        strokeLinecap="round"
      />
      <g transform={`translate(${px} ${py})`}>
        <rect
          x={-0.037}
          y={-0.076}
          width={0.074}
          height={0.152}
          rx={0.01}
          fill={J.phone}
          stroke={LINE.color}
          strokeWidth={0.003}
        />
        <g transform="scale(0.001)">
          <MapScreen t={t} dot={dot} drift={drift} />
        </g>
        {/* The hand round its foot: fingers over the edge, a thumb at the side. */}
        <rect x={-0.03} y={0.062} width={0.06} height={0.032} rx={0.014} fill={J.skin} />
        <rect x={-0.043} y={0.03} width={0.011} height={0.04} rx={0.0055} fill={J.skin} />
      </g>
    </>,
  );
}

/** A satellite, its dish turned to the Earth; `open` lifts its front off its clock. */
function Satellite({
  open,
  slow,
  t,
  label,
}: {
  open: number;
  slow: number;
  t: number;
  label: boolean;
}) {
  // In metres, the body's middle at 0, 0, the dish down (toward the Earth).
  const lid = smooth(open);
  const tick = t * (1 - 0.18 * smooth(slow));
  return (
    <>
      {[-1, 1].map((side) => (
        <g key={side}>
          <rect x={side < 0 ? -2.2 : 1.2} y={-0.12} width={1} height={0.24} fill={J.ground} />
          <rect
            x={side < 0 ? -8.4 : 2.2}
            y={-1}
            width={6.2}
            height={2}
            fill={J.panel}
            stroke={LINE.color}
            strokeWidth={0.07}
          />
          {[1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={(side < 0 ? -8.4 : 2.2) + i * 1.03}
              y={-1}
              width={0.05}
              height={2}
              fill={J.panelLine}
            />
          ))}
          <rect x={side < 0 ? -8.4 : 2.2} y={-0.03} width={6.2} height={0.06} fill={J.panelLine} />
        </g>
      ))}
      {/* The dish, toward the Earth, and its antennas. */}
      <path d="M -1 1.3 Q 0 2.3 1 1.3 Z" fill={J.dish} stroke={LINE.color} strokeWidth={0.07} />
      {[-0.6, 0, 0.6].map((x) => (
        <rect key={x} x={x - 0.06} y={1.3} width={0.12} height={0.5} fill={J.dish} />
      ))}
      {/* The body: inside, the clock; the front lifts away. */}
      <rect x={-1.2} y={-1.3} width={2.4} height={2.6} fill={J.inside} />
      {open > 0 && (
        <g opacity={clamp(open * 3)}>
          <rect x={-0.62} y={-0.95} width={1.24} height={1.9} rx={0.25} fill={J.clockCase} />
          <circle
            cx={0}
            cy={-0.18}
            r={0.46}
            fill={J.clockFace}
            stroke={LINE.color}
            strokeWidth={0.05}
          />
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x={-0.015}
              y={-0.6}
              width={0.03}
              height={0.08}
              fill={LINE.color}
              transform={`rotate(${i * 30} 0 -0.18)`}
            />
          ))}
          <line
            x1={0}
            y1={-0.18}
            x2={0}
            y2={-0.56}
            stroke={J.cross}
            strokeWidth={0.04}
            strokeLinecap="round"
            transform={`rotate(${(tick * 90) % 360} 0 -0.18)`}
          />
          <line
            x1={0}
            y1={-0.18}
            x2={0.22}
            y2={-0.18}
            stroke={LINE.color}
            strokeWidth={0.06}
            strokeLinecap="round"
            transform={`rotate(${(tick * 7.5) % 360} 0 -0.18)`}
          />
          {/* The atoms that keep its time, glowing in the window below. */}
          <rect x={-0.4} y={0.42} width={0.8} height={0.36} rx={0.12} fill={J.inside} />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={-0.22 + 0.22 * i + 0.05 * Math.sin(t * 6 + i)}
              cy={0.6 + 0.05 * Math.cos(t * 5 + i * 2)}
              r={0.07}
              fill={J.atom}
              opacity={0.6 + 0.4 * Math.sin(t * 8 + i)}
            />
          ))}
          {label && (
            <text
              x={0}
              y={1.18}
              fontFamily={font}
              fontWeight={700}
              fontSize={0.3}
              fill={J.clockFace}
              textAnchor="middle"
            >
              ATOMIC CLOCK
            </text>
          )}
          {slow > 0 && (
            <g opacity={clamp(slow * 2.5)} transform={`translate(0.86 -0.4)`}>
              <circle r={0.2} fill={J.gold} stroke={LINE.color} strokeWidth={0.04} />
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={-0.16}
                stroke={LINE.color}
                strokeWidth={0.05}
                transform={`rotate(${-120 * smooth(slow)})`}
              />
            </g>
          )}
        </g>
      )}
      {/* The front, gold foil, lifting up and away on its hinge at the top. */}
      <g
        transform={`translate(0 ${-1.3 - lid * 2.2}) rotate(${-lid * 28}) scale(1 ${1 - lid * 0.82}) translate(0 1.3)`}
        opacity={1 - clamp((lid - 0.75) * 4)}
      >
        <rect
          x={-1.2}
          y={-1.3}
          width={2.4}
          height={2.6}
          fill={J.gold}
          stroke={LINE.color}
          strokeWidth={0.08}
        />
        <path
          d="M -1.2 -0.4 L 1.2 -0.6 M -1.2 0.5 L 1.2 0.3"
          stroke={J.goldShade}
          strokeWidth={0.12}
        />
        <rect x={-0.9} y={-1.0} width={0.5} height={0.5} fill={J.goldShade} opacity={0.6} />
      </g>
      <rect
        x={-1.2}
        y={-1.3}
        width={2.4}
        height={2.6}
        fill="none"
        stroke={LINE.color}
        strokeWidth={0.08}
      />
    </>
  );
}

/** A clock badge pinned to a point of the picture, its hand turning at `rate`. */
function ClockBadge({
  x,
  y,
  size,
  rate,
  t,
  text,
  shown,
}: {
  x: number;
  y: number;
  size: number;
  rate: number;
  t: number;
  text: string;
  shown: number;
}) {
  if (shown <= 0) return null;
  const s = outBack(clamp(shown)) * size;
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 100})`} opacity={clamp(shown * 3)}>
      <circle r={50} fill={J.clockFace} stroke={LINE.color} strokeWidth={5} />
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={-2}
          y={-46}
          width={4}
          height={9}
          fill={LINE.color}
          transform={`rotate(${i * 30})`}
        />
      ))}
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={-38}
        stroke={J.cross}
        strokeWidth={5}
        strokeLinecap="round"
        transform={`rotate(${(t * rate * 120) % 360})`}
      />
      <circle r={5} fill={LINE.color} />
      <rect x={-125} y={60} width={250} height={42} rx={21} fill={LINE.color} />
      <text
        x={0}
        y={90}
        fontFamily={font}
        fontWeight={700}
        fontSize={26}
        fill={J.clockFace}
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  );
}

/** When a thing of the shot has arrived (0 not yet, rising to 1 over a few frames). */
type Arrived = (thing: JourneyThing) => number;

/**
 * The journey: the camera's flight, the world at this frame, and what has arrived. `local` is
 * the frame within the shot, `clock` the frame within the whole part (the world's own time,
 * so the satellites move on across shots), `times` the frame each of the shot's things arrives.
 */
export function JourneyPicture({
  g,
  local,
  duration,
  times,
  clock,
  fps,
  width,
  height,
}: {
  g: Journey;
  local: number;
  duration: number;
  times: number[];
  clock: number;
  fps: number;
  width: number;
  height: number;
}) {
  const tall = width < height;
  const t = clock / fps;
  // The camera: the flight from the last stop, then a slow push in for the rest of the shot.
  const from = g.from ?? g.at;
  const fly = g.fly === 'whole' ? Math.max(1, duration - 2) : flightFrames(from, g.at, fps);
  const u = fly > 0 ? smooth(local / fly) : 1;
  const a = stopOf(from, t, tall);
  const b = stopOf(g.at, t, tall);
  const cam0 = u >= 1 ? b : zoomPath(a, b).at(u);
  const held =
    fly > 0 ? clamp((local - fly) / Math.max(1, duration - fly)) : clamp(local / duration);
  const cam = { ...cam0, w: cam0.w * (1 - 0.05 * held) };
  const v = viewOf(cam, width, height);

  const at = new Map<JourneyThing, number>();
  g.show.forEach((s, i) => at.set(s.item, times[i] ?? 0));
  const arrived: Arrived = (thing) => {
    if (g.keep.includes(thing)) return 1;
    const f = at.get(thing);
    return f === undefined ? 0 : clamp((local - f) / 10);
  };
  const calloutAt = times[g.show.length];

  const dot = Math.max(arrived('dot'), arrived('drift') > 0 ? 1 : 0);
  const sats = arrived('satellites');
  const open = arrived('open');
  const signals = arrived('signals');
  const ranges = arrived('ranges');
  const clocks = arrived('clocks');
  const well = arrived('well');
  const drift = g.show.some((s) => s.item === 'drift')
    ? clamp((local - (at.get('drift') ?? 0)) / (fps * 2.4))
    : g.keep.includes('drift')
      ? 1
      : 0;
  const slow = g.show.some((s) => s.item === 'slow')
    ? clamp((local - (at.get('slow') ?? 0)) / (fps * 1.2))
    : g.keep.includes('slow')
      ? 1
      : 0;
  const beam = arrived('beam');
  const noBeam = arrived('no-beam');

  const you = v.P(YOU.x, YOU.y);
  const satMin = 110 * (width / 1080);
  // The satellite the camera closes in on keeps growing as the view narrows, so the flight in
  // and out never leaves a frame with only a speck in it.
  const closeness = clamp(Math.log10(2000 / cam.w) / 2);
  const minOf = (s: Sat) => satMin * (s.hero === 1 ? 1 + 2.4 * closeness : 1);
  const satScale = (s: Sat) => Math.max(1, minOf(s) / (SAT.span * v.k));
  const drawSat = (s: Sat, i: number) => {
    const p = satAt(s, t);
    const size = Math.max(SAT.span * v.k, minOf(s));
    if (sats <= 0 && !s.hero && g.at !== 'satellite' && g.at !== 'inside') return null;
    const show = s.hero === 1 ? 1 : sats;
    if (show <= 0) return null;
    if (!seen(v, p.x, p.y, size / v.k)) return null;
    const turn = 0;
    const isHero = s.hero === 1;
    return (
      <g key={i} opacity={clamp(show * 2)}>
        {placed(
          v,
          p.x,
          p.y,
          0.001 * satScale(s),
          turn,
          <Satellite open={isHero ? open : 0} slow={isHero ? slow : 0} t={t} label={isHero} />,
        )}
      </g>
    );
  };

  // The time signals: rings from the four satellites in your sky, travelling down to you. At
  // every scale they cross the last stretch of the view, so they can be seen arriving.
  const rings: ReactNode[] = [];
  if (signals > 0) {
    const viewH = v.H / v.k;
    for (let h = 1; h <= 4; h++) {
      const p = hero(h, t);
      const d = distance(p, YOU);
      const L = Math.min(d * 1.02, 1.3 * viewH);
      for (let n = 0; n < 4; n++) {
        const f = (t * 0.55 + n / 4 + h * 0.13) % 1;
        const r = d - L + f * (L + 0.08 * L);
        if (r <= 0) continue;
        const toward = Math.atan2(YOU.y - p.y, YOU.x - p.x);
        const pts = arc(v, p.x, p.y, r, toward - 0.42, toward + 0.42).map(([x, y]) => v.P(x, y));
        rings.push(
          <path
            key={`${h}-${n}`}
            d={path(pts, false)}
            fill="none"
            stroke={J.signal}
            strokeWidth={6 * (width / 1080)}
            strokeLinecap="round"
            opacity={signals * 0.75 * Math.sin(Math.PI * f)}
          />,
        );
      }
    }
  }
  // The four distances, one round each satellite, all meeting where you stand.
  const rangeArcs: ReactNode[] = [];
  if (ranges > 0) {
    for (let h = 1; h <= 4; h++) {
      const p = hero(h, t);
      const d = distance(p, YOU);
      const grow = smooth(ranges * 1.6 - (h - 1) * 0.18);
      if (grow <= 0) continue;
      const pts = arc(v, p.x, p.y, d * grow, -Math.PI, Math.PI).map(([x, y]) => v.P(x, y));
      rangeArcs.push(
        <path
          key={h}
          d={path(pts)}
          fill="none"
          stroke={J.range}
          strokeWidth={5 * (width / 1080)}
          strokeDasharray={`${18 * (width / 1080)} ${12 * (width / 1080)}`}
          opacity={0.9}
        />,
      );
    }
  }
  // The well of gravity: a grid pulled in toward the Earth, faintly, behind it.
  const grid: ReactNode[] = [];
  if (well > 0) {
    const pull = (x: number, y: number): [number, number] => {
      const r = Math.max(Math.hypot(x, y), 1);
      const s = 0.9 * R * Math.min(1, R / r);
      const k2 = Math.min(s, r * 0.85) / r;
      return [x - x * k2, y - y * k2];
    };
    const step = 2600;
    for (let i = -18; i <= 18; i++) {
      const xs: [number, number][] = [];
      const ys: [number, number][] = [];
      for (let j = -40; j <= 40; j++) {
        xs.push(pull(i * step, j * 1500));
        ys.push(pull(j * 1500, i * step - 4000));
      }
      grid.push(
        <path
          key={`a${i}`}
          d={path(
            xs.map(([x, y]) => v.P(x, y)),
            false,
          )}
        />,
        <path
          key={`b${i}`}
          d={path(
            ys.map(([x, y]) => v.P(x, y)),
            false,
          )}
        />,
      );
    }
  }
  const orbitsBack: ReactNode[] = [];
  const orbitsNear: ReactNode[] = [];
  if (sats > 0) {
    ORBITS.forEach((o, i) => {
      const pts = Array.from({ length: 181 }, (_, n) => {
        const phi = (n / 180) * 2 * Math.PI;
        const ex = ORBIT * Math.cos(phi);
        const ey = ORBIT * o.e * Math.sin(phi);
        const c = Math.cos(o.tilt * DEG);
        const s = Math.sin(o.tilt * DEG);
        return v.P(ex * c - ey * s, ex * s + ey * c);
      });
      const style = {
        fill: 'none',
        stroke: J.panelLine,
        strokeWidth: 2.5 * (width / 1080),
        opacity: 0.45 * sats,
      };
      if (o.e === 1) orbitsNear.push(<path key={i} d={path(pts)} {...style} />);
      else {
        orbitsBack.push(
          <path key={i} d={path(pts.slice(90))} {...style} strokeDasharray="10 10" />,
        );
        orbitsNear.push(<path key={`n${i}`} d={path(pts.slice(0, 91), false)} {...style} />);
      }
    });
  }

  const s1 = v.P(hero(1, t).x, hero(1, t).y);
  // The beam a satellite would shine if it were watching you, and the cross that says it is not.
  const beamPath =
    beam > 0 ? `M ${s1[0]} ${s1[1]} L ${you[0] - 70} ${you[1]} L ${you[0] + 70} ${you[1]} Z` : '';

  const label = (x: number, y: number, text: string, shown: number) =>
    shown > 0 ? (
      <g opacity={clamp(shown * 3)} transform={`translate(${x} ${y})`}>
        <rect
          x={-text.length * 12.5 - 24}
          y={-34}
          width={text.length * 25 + 48}
          height={62}
          rx={31}
          fill={LINE.color}
        />
        <text
          x={0}
          y={13}
          fontFamily={font}
          fontWeight={700}
          fontSize={40}
          fill={J.clockFace}
          textAnchor="middle"
        >
          {text}
        </text>
      </g>
    ) : null;

  // The callout: a number and a few words in the picture, pointing at a thing in it.
  const callout = (() => {
    const c = g.callout;
    if (!c || calloutAt === undefined) return null;
    const p = clamp((local - calloutAt) / 10);
    if (p <= 0) return null;
    const anchor =
      c.at === 'you' || c.at === 'phone'
        ? you
        : c.at === 'satellite' || c.at === 'clock'
          ? s1
          : c.at === 'earth'
            ? v.P(0, 0)
            : null;
    const bx = width / 2;
    const by = height * (tall ? 0.22 : 0.2);
    const sc = (0.6 + 0.4 * outBack(p)) * (width / 1080);
    const caption = c.caption?.split(' / ') ?? [];
    return (
      <g opacity={clamp(p * 2.5)}>
        {anchor && (
          <line
            x1={bx}
            y1={by + 120 * sc}
            x2={anchor[0]}
            y2={anchor[1]}
            stroke={J.range}
            strokeWidth={4 * (width / 1080)}
            strokeDasharray={`${12 * (width / 1080)} ${10 * (width / 1080)}`}
          />
        )}
        <g transform={`translate(${bx} ${by}) scale(${sc})`}>
          <text
            x={0}
            y={0}
            fontFamily={font}
            fontWeight={700}
            fontSize={190}
            fill={J.range}
            stroke={LINE.color}
            strokeWidth={10}
            paintOrder="stroke"
            textAnchor="middle"
          >
            {c.value}
          </text>
          {caption.map((line, i) => (
            <text
              key={i}
              x={0}
              y={70 + i * 50}
              fontFamily={font}
              fontWeight={700}
              fontSize={44}
              fill={J.clockFace}
              stroke={LINE.color}
              strokeWidth={8}
              paintOrder="stroke"
              textAnchor="middle"
            >
              {line}
            </text>
          ))}
        </g>
      </g>
    );
  })();

  const back = SATS.filter((s) => !satAt(s, t).near);
  const near = SATS.filter((s) => satAt(s, t).near);
  return (
    <g>
      <Space v={v} t={t} />
      {grid.length > 0 && (
        <g stroke={J.grid} strokeWidth={2.5 * (width / 1080)} fill="none" opacity={0.6 * well}>
          {grid}
        </g>
      )}
      {orbitsBack}
      {back.map((s) => drawSat(s, SATS.indexOf(s)))}
      <Earth v={v} t={t} />
      <Clouds v={v} t={t} />
      <Street v={v} />
      <You v={v} t={t} dot={dot} drift={drift} />
      {orbitsNear}
      {rangeArcs}
      {rings}
      {beam > 0 && (
        <g opacity={beam * (1 - noBeam * 0.7)}>
          <path d={beamPath} fill={J.beam} opacity={0.35} />
        </g>
      )}
      {noBeam > 0 && (
        <g
          transform={`translate(${(s1[0] + you[0]) / 2} ${(s1[1] + you[1]) / 2}) scale(${outBack(noBeam) * (width / 1080)})`}
        >
          <path
            d="M -70 -70 L 70 70 M 70 -70 L -70 70"
            stroke={J.cross}
            strokeWidth={26}
            strokeLinecap="round"
          />
        </g>
      )}
      {near.map((s) => drawSat(s, SATS.indexOf(s)))}
      {/* At the scales where you are a dot on the Earth, the blue dot marks you. */}
      {(dot > 0 || ranges > 0) && R * v.k < 20 * width && (
        <g transform={`translate(${you[0]} ${you[1]})`}>
          <circle r={(18 + 6 * Math.sin(t * 4)) * (width / 1080)} fill={J.dotHalo} opacity={0.5} />
          <circle
            r={10 * (width / 1080)}
            fill={J.dot}
            stroke={J.street}
            strokeWidth={3 * (width / 1080)}
          />
        </g>
      )}
      <ClockBadge
        x={Math.max(
          140 * (width / 1080),
          you[0] - Math.max(220 * (width / 1080), R * v.k + 130 * (width / 1080)),
        )}
        y={you[1] + 60 * (width / 1080)}
        size={170 * (width / 1080)}
        rate={1}
        t={t}
        text="ON THE GROUND"
        shown={clocks}
      />
      <ClockBadge
        x={Math.min(s1[0] + 150 * (width / 1080), width - 140 * (width / 1080))}
        y={s1[1] + 40 * (width / 1080)}
        size={170 * (width / 1080)}
        rate={1.35}
        t={t}
        text="IN ORBIT"
        shown={clocks}
      />
      {well > 0 &&
        label(
          width / 2,
          you[1] + 2 * R * v.k + 90 * (width / 1080),
          'STRONGER GRAVITY, SLOWER TIME',
          well,
        )}
      {callout}
    </g>
  );
}
