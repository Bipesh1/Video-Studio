import type { JOURNEY_STOPS } from '@studio/shared';
import type { Graphic, JourneyStop, JourneyThing } from '@studio/shared';
import type { ReactNode } from 'react';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { VIEWER_FONT } from '../overlays/text';
import { arc, band, clamp, disc, outBack, path, smooth, viewOf, zoomPath } from './Journey';
import type { Cam, View } from './Journey';

/**
 * The world `water` (2026-10-18, "Why Is the Water in Your Glass Older Than the Sun?"): from a glass
 * on a kitchen counter down into one drop and one water molecule, out past the Earth to a comet and
 * the Sun, back in time to the dark icy cloud before the Sun and one speck of dust in it, forward
 * as the cloud falls in to make the Sun and planets, and home again.
 *
 * Its sizes run from a ten-billionth of a metre to a light year, more than any one set of numbers
 * can hold, so the world is a set of nested frames, each drawn in its own unit (a metre, a
 * millimetre, an angstrom, a thousand kilometres, an astronomical unit, a thousand of them, a
 * micrometre), each placed in the one round it. The camera lives in the deepest frame of its
 * flight, and every other frame is drawn from it, so each is exact at its own scale. Time is part
 * of the world too: `rewind` runs it back until the Sun goes out and the cloud is there,
 * `collapse` runs the cloud forward into the Sun and planets, `today` back to now.
 */

const J = fineTokens.journey;
const LINE = fineTokens.line;
const font = `${VIEWER_FONT}, Arial, sans-serif`;
type Journey = Extract<Graphic, { kind: 'journey' }>;
const DEG = Math.PI / 180;

// ---- the frames: each one's unit, its parent, where its origin is in the parent, and how many
// parent units one of its own is.
const AU_KM = 1.496e8;
const AU_M = AU_KM * 1000;
type FrameId = 'cloud' | 'solar' | 'earth' | 'home' | 'drop' | 'molecule' | 'dust';
type Frame = { parent: FrameId | null; at: [number, number]; size: number };
/** The Earth, in the Sun's frame: up and to the right of it. */
const EARTH_AU: [number, number] = [0.5, -0.866];
/** The Earth's radius in thousands of km, and where the house is on it (the top). */
const R = 6.371;
/** The drop on the glass's rim, in metres in the kitchen. */
const GLASS = { x: 0.6, base: -0.9, w: 0.075, h: 0.13 };
const DROP_AT: [number, number] = [GLASS.x + GLASS.w / 2 + 0.0016, GLASS.base - GLASS.h + 0.006];
/** The speck of dust, in thousands of AU from where the Sun will be. */
const DUST_AT: [number, number] = [6, -3.5];
const FRAMES: Record<FrameId, Frame> = {
  cloud: { parent: null, at: [0, 0], size: 1 },
  solar: { parent: 'cloud', at: [0, 0], size: 1e-3 },
  earth: { parent: 'solar', at: EARTH_AU, size: 1000 / AU_KM },
  home: { parent: 'earth', at: [0, -R], size: 1e-6 },
  drop: { parent: 'home', at: DROP_AT, size: 1e-3 },
  molecule: { parent: 'drop', at: [0, 0], size: 1e-7 },
  dust: { parent: 'cloud', at: DUST_AT, size: 1e-6 / (1000 * AU_M) },
};
const chain = (f: FrameId): FrameId[] => {
  const out: FrameId[] = [f];
  let p = FRAMES[f].parent;
  while (p) {
    out.push(p);
    p = FRAMES[p].parent;
  }
  return out;
};
const depth = (f: FrameId) => chain(f).length;
/** A view of the camera in one frame, given it in another. */
function camIn(cam: Cam, from: FrameId, to: FrameId): Cam {
  if (from === to) return cam;
  const up = chain(from);
  const down = chain(to);
  const common = up.find((f) => down.includes(f)) ?? 'cloud';
  let c = cam;
  for (const f of up) {
    if (f === common) break;
    const fr = FRAMES[f];
    c = { x: fr.at[0] + fr.size * c.x, y: fr.at[1] + fr.size * c.y, w: fr.size * c.w };
  }
  const path2 = down.slice(0, down.indexOf(common)).reverse();
  for (const f of path2) {
    const fr = FRAMES[f];
    c = { x: (c.x - fr.at[0]) / fr.size, y: (c.y - fr.at[1]) / fr.size, w: c.w / fr.size };
  }
  return c;
}

type WaterStop = (typeof JOURNEY_STOPS)['water'][number];

/** Where the comet is, in AU, at time t: coming in from the dark toward the Sun. */
const cometAt = (t: number): [number, number] => [-0.42 + 0.0016 * t, -0.52 + 0.0012 * t];

function stopOf(stop: JourneyStop, t: number, tall: boolean): { frame: FrameId; cam: Cam } {
  const k = tall ? 1 : 1.9;
  const s = stop as WaterStop;
  switch (s) {
    case 'glass':
      return { frame: 'home', cam: { x: GLASS.x, y: -0.99, w: 0.34 * k } };
    case 'drop':
      return { frame: 'drop', cam: { x: -0.4, y: 0, w: 7 * k } };
    case 'tap':
      return { frame: 'home', cam: { x: GLASS.x - 0.05, y: -1.16, w: 1.05 * k } };
    case 'outside':
      return { frame: 'home', cam: { x: 2600, y: -2400, w: 7600 * k } };
    case 'molecule':
      return { frame: 'molecule', cam: { x: 0, y: 0, w: 15 * k } };
    case 'earth':
      return { frame: 'earth', cam: { x: 0, y: -0.8, w: 17 * k } };
    case 'comet': {
      const [x, y] = cometAt(t);
      return { frame: 'solar', cam: { x: x + 0.004, y: y + 0.004, w: 0.032 * k } };
    }
    case 'sun':
      return { frame: 'solar', cam: { x: 0, y: 0.002, w: 0.034 * k } };
    case 'system':
      return { frame: 'solar', cam: { x: 0.22, y: -0.4, w: 1.25 * k } };
    case 'cloud':
      return { frame: 'cloud', cam: { x: 0.5, y: -1, w: 64 * k } };
    case 'dust':
      return { frame: 'dust', cam: { x: 0.05, y: 0, w: 2.5 * k } };
    case 'disk':
      return { frame: 'solar', cam: { x: 0, y: -1, w: 34 * k } };
    case 'young-earth':
      return { frame: 'earth', cam: { x: -1.5, y: -3, w: 26 * k } };
    case 'house':
      return { frame: 'home', cam: { x: -1, y: -2.2, w: 13.5 * k } };
    default:
      return { frame: 'home', cam: { x: GLASS.x, y: -0.99, w: 0.34 * k } };
  }
}

/** How many frames the flight between two stops takes: longer for a longer way. */
export function waterFlightFrames(from: JourneyStop, to: JourneyStop, fps: number): number {
  if (from === to) return 0;
  const { a, b } = shared(stopOf(from, 0, true), stopOf(to, 0, true));
  const S = zoomPath(a, b).S;
  return Math.round(fps * clamp(0.8 + 0.09 * S, 0.9, 2.3));
}
/** Both ends of a flight in one frame: the deeper of the two. */
function shared(
  a: { frame: FrameId; cam: Cam },
  b: { frame: FrameId; cam: Cam },
): { frame: FrameId; a: Cam; b: Cam } {
  const frame = depth(a.frame) >= depth(b.frame) ? a.frame : b.frame;
  return { frame, a: camIn(a.cam, a.frame, frame), b: camIn(b.cam, b.frame, frame) };
}

// ---- the state of the world: what has arrived, and the time of it
type State = {
  t: number;
  W: number;
  H: number;
  u: number;
  thing: (name: JourneyThing) => number;
  /** How far time has run back to the cloud, then forward into the young Sun, then to today. */
  rewind: number;
  collapse: number;
  today: number;
};
/** How bright the Sun of now is, and the young one: 0 none, 1 full. */
const sunNow = (s: State) => (1 - s.rewind) * (s.collapse > 0 ? 0 : 1) + (s.today >= 1 ? 1 : 0);
const sunLit = (s: State) => clamp(sunNow(s) + smooth((s.collapse - 0.45) / 0.35));
const isNow = (s: State) => s.rewind <= 0 || s.today >= 1;

// ---- drawing helpers
/**
 * An ellipse's attributes, kept within a few frames of the picture: one far larger or further off
 * than that either covers the frame or misses it, and drawn at its true size it stretches the
 * picture until the browser draws it in tiles with gaps between.
 */
const ellipse = (v: View, x: number, y: number, rx: number, ry: number, turn = 0) => {
  const lim = 4 * Math.max(v.W, v.H);
  const [cx, cy] = v.P(x, y).map((c) => clamp(c, -lim, lim)) as [number, number];
  return {
    cx,
    cy,
    rx: Math.min(rx * v.k, lim),
    ry: Math.min(ry * v.k, lim),
    transform: `rotate(${turn} ${cx} ${cy})`,
  };
};
const rect = (v: View, x0: number, y0: number, x1: number, y1: number) =>
  path([v.P(x0, y0), v.P(x1, y0), v.P(x1, y1), v.P(x0, y1)]);
const poly = (v: View, pts: [number, number][]) => path(pts.map(([x, y]) => v.P(x, y)));
const px = (v: View, units: number) => units * v.k;
/** An outline's width: its size in the world, but never thicker than a few pixels close up. */
const edge = (v: View, units: number) => Math.min(units * v.k, 4 * (v.W / 1080));
const visible = (v: View, x: number, y: number, r: number) => {
  const [sx, sy] = [v.fx + (x - v.cam.x) * v.k, v.fy + (y - v.cam.y) * v.k];
  const m = r * v.k;
  return m > 0.5 && sx > -m && sx < v.W + m && sy > -m && sy < v.H + m;
};
/** A small seeded random number, the same every frame. */
const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
function Tag({
  x,
  y,
  text,
  shown,
  W,
}: {
  x: number;
  y: number;
  text: string;
  shown: number;
  W: number;
}) {
  if (shown <= 0) return null;
  const s = (W / 1080) * (0.7 + 0.3 * outBack(clamp(shown)));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={clamp(shown * 3)}>
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
  );
}

// ---- the frames' drawings
/** Space far out: the dark, the stars, and (as time runs back) the cloud before the Sun. */
function CloudFrame({ v, s }: { v: View; s: State }) {
  // The cloud stays in sight as it falls in, and only fades as it becomes the disk.
  const cloud = s.rewind * (1 - smooth((s.collapse - 0.8) / 0.2));
  // The cloud shrinks as it falls in: from about 40 thousand AU across to the disk.
  const shrink = 1 - 0.997 * smooth(s.collapse);
  const flat = 1 - 0.65 * smooth(s.collapse);
  const blobs: [number, number, number, string][] = [
    [0, 0, 26, J.nebula],
    [-10, -8, 18, J.nebulaMid],
    [12, 6, 16, J.nebulaMid],
    [4, -14, 12, J.nebulaLight],
    [-14, 10, 11, J.nebulaLight],
    [8, 12, 9, J.nebulaMid],
  ];
  return (
    <>
      <rect width={v.W} height={v.H} fill={J.space} />
      {Array.from({ length: 80 }, (_, i) => {
        const drift = Math.log10(Math.max(1e-30, v.cam.w)) * 7;
        const x = (((i * 397.3 + drift * (1 + (i % 3))) % v.W) + v.W) % v.W;
        const y = (((i * 173.9 + drift * 0.6) % v.H) + v.H) % v.H;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={(1.2 + (i % 4) * 0.7) * (v.W / 1080)}
            fill={J.star}
            opacity={(0.3 + 0.4 * Math.sin(s.t * 1.7 + i * 2.3) ** 2) * (1 - 0.6 * cloud)}
          />
        );
      })}
      {s.u < 1 &&
        v.cam.w > 3e-8 &&
        // Flying through space: the stars streak past, so the move shows even where nothing is near.
        Array.from({ length: 90 }, (_, i) => {
          const a = rnd(i, 90) * 2 * Math.PI;
          const go = Math.min(1, 3 * Math.sin(Math.PI * s.u));
          const f = (((rnd(i, 91) + s.t * 0.9) % 1) + 1) % 1;
          const r0 = (0.03 + f * 0.75) * Math.hypot(v.W, v.H) * 0.55;
          const len = (40 + 220 * f) * (v.W / 1080) * go;
          return (
            <line
              key={`st${i}`}
              x1={v.fx + Math.cos(a) * r0}
              y1={v.fy + Math.sin(a) * r0}
              x2={v.fx + Math.cos(a) * (r0 + len)}
              y2={v.fy + Math.sin(a) * (r0 + len)}
              stroke={J.star}
              strokeWidth={(4.5 + 6 * f) * (v.W / 1080)}
              strokeLinecap="round"
              opacity={0.7 * go * Math.sin(Math.PI * f)}
            />
          );
        })}
      {cloud > 0 && (
        <defs>
          {[J.nebula, J.nebulaMid, J.nebulaLight].map((c, i) => (
            <radialGradient key={i} id={`jw-neb-${i}`}>
              <stop offset="0" stopColor={c} stopOpacity={0.95} />
              <stop offset="0.6" stopColor={c} stopOpacity={0.55} />
              <stop offset="1" stopColor={c} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>
      )}
      {cloud > 0 &&
        // The cloud: soft billows of gas and dust, lit faintly from within, turning slowly.
        Array.from({ length: 26 }, (_, i) => {
          const a = rnd(i, 60) * 2 * Math.PI + s.t * 0.01 * (i % 2 ? 1 : -1);
          const d = 30 * Math.sqrt(rnd(i, 61));
          const r = 7 + 16 * rnd(i, 62);
          const x = d * Math.cos(a) * shrink;
          const y = d * Math.sin(a) * shrink * flat;
          return (
            <ellipse
              key={`n${i}`}
              {...ellipse(
                v,
                x,
                y,
                r * shrink,
                r * shrink * flat * (0.6 + 0.4 * rnd(i, 63)),
                40 * rnd(i, 64),
              )}
              fill={`url(#jw-neb-${i % 3})`}
              opacity={0.7 * cloud}
            />
          );
        })}
      {cloud > 0 &&
        blobs.map(([x, y, r], i) => (
          <ellipse
            key={i}
            {...ellipse(v, x * shrink, y * shrink * flat, r * shrink, r * shrink * flat, 8 * i)}
            fill={`url(#jw-neb-${i % 3})`}
            opacity={0.5 * cloud}
          />
        ))}
      {cloud > 0 &&
        // Specks of dust and ice through the cloud, close together wherever the camera looks.
        Array.from({ length: 140 }, (_, i) => {
          const x = (rnd(i, 1) - 0.5) * 60 * shrink;
          const y = (rnd(i, 2) - 0.5) * 60 * shrink * flat;
          if (!visible(v, x, y, 0.1)) return null;
          const [sx, sy] = v.P(x, y);
          return (
            <circle
              key={i}
              cx={sx}
              cy={sy}
              r={(1.5 + 2 * rnd(i, 3)) * (v.W / 1080)}
              fill={J.iceCoat}
              opacity={0.6 * cloud}
            />
          );
        })}
    </>
  );
}

/** The Sun, its planets' paths, a comet, and the disk the cloud becomes. */
function SolarFrame({ v, s }: { v: View; s: State }) {
  // Closer in than a few thousand kilometres, the Sun and its planets' paths are far off.
  if (v.cam.w < 2e-5) return null;
  const lit = sunLit(s);
  const gone = 1 - (isNow(s) ? 0 : s.rewind) * (s.collapse > 0 ? 0 : 1);
  const disk = smooth((s.collapse - 0.25) / 0.5) * (1 - s.today);
  const diskK = Math.max(1, (190 * (v.W / 1080)) / (50 * v.k));
  const sunR = 0.00465;
  const [sx, sy] = v.P(0, 0);
  const rPx = Math.max(sunR * v.k, 64 * (v.W / 1080)) * (lit > 0 ? 0.3 + 0.7 * lit : 0);
  const planets = isNow(s) ? 1 : smooth((s.collapse - 0.7) / 0.3);
  const orbits = [0.39, 0.72, 1, 1.52, 5.2];
  const comet = s.thing('comet') + (s.collapse >= 1 ? 0 : 0);
  const [cx, cy] = cometAt(s.t);
  const fadeH = s.thing('fade');
  return (
    <>
      {disk > 0 && (
        <g opacity={disk}>
          {[50, 32, 18, 9].map((r, i) => (
            <ellipse
              key={r}
              // Seen from far out, the disk keeps a size the eye can find, as the Sun does.
              {...ellipse(v, 0, 0, r * diskK, r * diskK * 0.36, -12)}
              fill={i % 2 ? J.diskGlow : J.disk}
              opacity={0.35 + 0.1 * i}
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => {
            const a0 = s.t * 0.4 + (i * 2 * Math.PI) / 5;
            const pts = Array.from({ length: 40 }, (_, n) => {
              const r = 4 + n * 1.1;
              const a = a0 + n * 0.12;
              const x = r * Math.cos(a);
              const y = r * Math.sin(a) * 0.36;
              return v.P(
                x * Math.cos(-12 * DEG) - y * Math.sin(-12 * DEG),
                x * Math.sin(-12 * DEG) + y * Math.cos(-12 * DEG),
              );
            });
            return (
              <path
                key={i}
                d={path(pts, false)}
                fill="none"
                stroke={J.diskGlow}
                strokeWidth={edge(v, 0.6)}
                opacity={0.5}
              />
            );
          })}
        </g>
      )}
      {planets > 0 &&
        orbits.map((r) => (
          <ellipse
            key={r}
            {...ellipse(v, 0, 0, r, r)}
            fill="none"
            stroke={J.panelLine}
            strokeWidth={2 * (v.W / 1080)}
            opacity={0.25 * planets}
          />
        ))}
      {lit > 0 && gone > 0 && (
        <g opacity={gone}>
          <defs>
            <radialGradient id="jw-sun-glow">
              <stop offset="0" stopColor={J.sun} stopOpacity={0.6} />
              <stop offset="1" stopColor={J.sun} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={sx} cy={sy} r={rPx * 3.2} fill="url(#jw-sun-glow)" />
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i * 360) / 14 + s.t * 6;
            const long = rPx * (1.18 + 0.08 * Math.sin(s.t * 3 + i));
            return (
              <path
                key={i}
                d={`M ${sx} ${sy} L ${sx + rPx * 0.98 * Math.cos((a - 7) * DEG)} ${sy + rPx * 0.98 * Math.sin((a - 7) * DEG)} L ${sx + long * Math.cos(a * DEG)} ${sy + long * Math.sin(a * DEG)} L ${sx + rPx * 0.98 * Math.cos((a + 7) * DEG)} ${sy + rPx * 0.98 * Math.sin((a + 7) * DEG)} Z`}
                fill={J.sunFlare}
              />
            );
          })}
          <circle
            cx={sx}
            cy={sy}
            r={rPx}
            fill={J.sun}
            stroke={J.sunFlare}
            strokeWidth={rPx * 0.05}
          />
          <circle
            cx={sx - rPx * 0.2}
            cy={sy - rPx * 0.2}
            r={rPx * 0.55}
            fill={J.sunCore}
            opacity={0.6}
          />
          {fadeH > 0 && (
            // The heavy hydrogen, glowing gold near the Sun, fading out in its heat.
            <g opacity={1 - smooth(fadeH * 1.1)}>
              <circle cx={sx + rPx * 1.55} cy={sy - rPx * 1.05} r={rPx * 0.2} fill={J.heavy} />
              <circle
                cx={sx + rPx * 1.55}
                cy={sy - rPx * 1.05}
                r={rPx * 0.34}
                fill={J.heavy}
                opacity={0.35}
              />
            </g>
          )}
        </g>
      )}
      {comet > 0 && isNow(s) && visible(v, cx, cy, 0.2) && (
        <g opacity={clamp(comet * 2)}>
          {(() => {
            // The tail streams away from the Sun.
            const d = Math.hypot(cx, cy);
            const ux = cx / d;
            const uy = cy / d;
            const n = Math.max(px(v, 0.0002), 22 * (v.W / 1080));
            const [hx, hy] = v.P(cx, cy);
            const L = Math.max(px(v, 0.02), 560 * (v.W / 1080));
            const nx = -uy;
            const ny = ux;
            // A fan of dust and gas streaming back from the head, brightest along its middle,
            // and a thin straight blue tail of its own.
            const fan = (len: number, wide: number, op: number, key: string) => (
              <path
                key={key}
                d={`M ${hx + nx * n * 0.9} ${hy + ny * n * 0.9} Q ${hx + ux * len * 0.5 + nx * n * wide * 0.6} ${hy + uy * len * 0.5 + ny * n * wide * 0.6} ${hx + ux * len + nx * n * wide} ${hy + uy * len + ny * n * wide} L ${hx + ux * len - nx * n * wide} ${hy + uy * len - ny * n * wide} Q ${hx + ux * len * 0.5 - nx * n * wide * 0.6} ${hy + uy * len * 0.5 - ny * n * wide * 0.6} ${hx - nx * n * 0.9} ${hy - ny * n * 0.9} Z`}
                fill={J.cometTail}
                opacity={op}
              />
            );
            return (
              <>
                <defs>
                  <radialGradient id="jw-coma">
                    <stop offset="0" stopColor={J.comet} stopOpacity={0.9} />
                    <stop offset="1" stopColor={J.cometTail} stopOpacity={0} />
                  </radialGradient>
                </defs>
                {fan(L, 7, 0.22, 'f1')}
                {fan(L * 0.85, 4, 0.35, 'f2')}
                {fan(L * 0.7, 1.8, 0.55, 'f3')}
                <line
                  x1={hx}
                  y1={hy}
                  x2={hx + (ux * 0.96 + nx * 0.28) * L * 1.1}
                  y2={hy + (uy * 0.96 + ny * 0.28) * L * 1.1}
                  stroke={J.dotHalo}
                  strokeWidth={n * 0.35}
                  strokeLinecap="round"
                  opacity={0.5}
                />
                <circle cx={hx} cy={hy} r={n * 3.2} fill="url(#jw-coma)" />
                <circle
                  cx={hx}
                  cy={hy}
                  r={n}
                  fill={J.comet}
                  stroke={LINE.color}
                  strokeWidth={n * 0.12}
                />
              </>
            );
          })()}
        </g>
      )}
    </>
  );
}

const LANDS: [number, number][][] = [
  // The land the house stands on, its coast just east of the house, at the top.
  [
    [-150, 1],
    [-120, 1],
    [-90.0001, 1],
    [-90.0001, 0.97],
    [-88, 0.86],
    [-100, 0.72],
    [-122, 0.66],
    [-145, 0.84],
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
    if (f === 1 && g === 1)
      out.push(...arc(v, 0, 0, R, Math.min(a, b) * DEG, Math.max(a, b) * DEG));
    else out.push([R * f * Math.cos(a * DEG), R * f * Math.sin(a * DEG)]);
  }
  return path(out.map(([x, y]) => v.P(x, y)));
}
const AIR: [number, string][] = [
  [0.009, J.sky],
  [0.026, J.skyMid],
  [0.06, J.skyHigh],
  [0.14, J.skyEdge],
];

/** The Earth: its sky, its oceans and land, and the comets and rocks of its young days. */
function EarthFrame({ v, s }: { v: View; s: State }) {
  const there = isNow(s) ? 1 : smooth((s.collapse - 0.75) / 0.25);
  if (there <= 0) return null;
  const R0 = R * v.k;
  const minR = 46 * (v.W / 1080);
  const young = isNow(s) ? 0 : 1 - s.today;
  if (R0 < minR) {
    const [x, y] = v.P(0, 0);
    if (x < -minR || x > v.W + minR || y < -minR || y > v.H + minR) return null;
    return (
      <g opacity={there}>
        <circle cx={x} cy={y} r={minR} fill={young > 0.5 ? J.oceanShade : J.ocean} />
        <circle
          cx={x - minR * 0.3}
          cy={y - minR * 0.3}
          r={minR * 0.4}
          fill={young > 0.5 ? J.youngLand : J.land}
        />
      </g>
    );
  }
  const whole = R0 < 3 * Math.max(v.W, v.H);
  const oceans = s.thing('oceans');
  const rocks = s.thing('rocks');
  return (
    <g opacity={there}>
      {AIR.slice()
        .reverse()
        .map(([h, fill], i) => (
          <path key={i} d={band(v, 0, 0, R, R + h)} fill={fill} fillRule="evenodd" />
        ))}
      <path d={disc(v, 0, 0, R)} fill={young > 0.5 ? J.oceanShade : J.ocean} />
      {oceans > 0 && whole && (
        <path
          d={disc(v, 0, 0, R * 0.99)}
          fill={J.waterLight}
          opacity={0.35 * clamp(oceans * 2) * (0.6 + 0.4 * Math.sin(s.t * 4))}
        />
      )}
      {LANDS.map((land, i) => (
        <path
          key={i}
          d={landPath(v, land)}
          fill={young > 0.5 ? J.youngLand : i === 0 ? J.land : J.landShade}
        />
      ))}
      {young > 0.5 &&
        whole &&
        [
          [-40, 0.7],
          [130, 0.6],
          [60, 0.45],
        ].map(([a, f], i) => {
          const [x, y] = v.P(
            R * (f as number) * Math.cos((a as number) * DEG),
            R * (f as number) * Math.sin((a as number) * DEG),
          );
          return <circle key={i} cx={x} cy={y} r={R0 * 0.06} fill={J.lava} opacity={0.8} />;
        })}
      {whole && (
        <path
          d={disc(v, 0, 0, R)}
          fill="none"
          stroke={J.skyMid}
          strokeWidth={Math.max(2, R0 * 0.03)}
          opacity={0.5}
        />
      )}
      {whole &&
        rocks > 0 &&
        // A comet and rocks falling in to the young Earth, burning as they come.
        Array.from({ length: 6 }, (_, i) => {
          const f = (s.t * 0.35 + i / 6) % 1;
          const a = (-150 + i * 22) * DEG;
          const r0 = R * (2.6 - 1.6 * f);
          const x = r0 * Math.cos(a);
          const y = r0 * Math.sin(a);
          const [hx, hy] = v.P(x, y);
          const [tx, ty] = v.P(x * 1.12, y * 1.12);
          const n = (i === 0 ? 10 : 5) * (v.W / 1080);
          return (
            <g key={i} opacity={clamp(rocks * 2) * Math.sin(Math.PI * f)}>
              <line
                x1={hx}
                y1={hy}
                x2={tx}
                y2={ty}
                stroke={i === 0 ? J.cometTail : J.sunFlare}
                strokeWidth={n * 1.6}
                strokeLinecap="round"
                opacity={0.6}
              />
              <circle cx={hx} cy={hy} r={n} fill={i === 0 ? J.comet : J.grain} />
            </g>
          );
        })}
    </g>
  );
}

/** The house by the sea: the kitchen, its counter, the tap and the glass; outside, the coast. */
function HomeFrame({ v, s }: { v: View; s: State }) {
  if (!isNow(s) || v.cam.w > 2.5e5 || v.cam.w < 0.0008) return null;
  const tap = s.thing('tap');
  const rain = s.thing('rain') + s.thing('raindrop');
  const shower = s.thing('shower');
  const g = GLASS;
  const out: ReactNode[] = [];
  // Hills to the west, the sand, the sea to the east, its waves.
  out.push(
    <path
      key="hills"
      d={poly(v, [
        [-30000, 0],
        [-30000, -260],
        [-9000, -420],
        [-4000, -180],
        [-1500, -90],
        [-300, -12],
        [40, 0],
      ])}
      fill={J.hill}
    />,
    <path key="ground" d={rect(v, -60000, 0, 60, 30000)} fill={J.grass} />,
    <path
      key="sand"
      d={poly(v, [
        [30, 0],
        [140, 0],
        [200, 1.6],
        [200, 400],
        [30, 400],
      ])}
      fill={J.sand}
    />,
    <path key="sea" d={rect(v, 160, 1.6, 60000, 30000)} fill={J.water} />,
  );
  if (v.cam.w > 30 && v.cam.w < 60000) {
    for (let i = 0; i < 24; i++) {
      const x = 300 + i * 1200 + ((s.t * 40) % 1200);
      out.push(
        <path
          key={`w${i}`}
          d={poly(v, [
            [x, 1.6],
            [x + 300, 1.6],
            [x + 150, 0.4],
          ])}
          fill={J.waterLight}
          opacity={0.6}
        />,
      );
    }
  }
  // Clouds over the coast, and rain from one of them.
  const clouds: [number, number, number][] = [
    [1800, -1900, 900],
    [4200, -2600, 1300],
    [-1200, -2300, 1000],
    [6500, -1600, 800],
  ];
  clouds.forEach(([x0, y, r], i) => {
    const x = x0 + 8 * s.t;
    if (!visible(v, x, y, r * 1.4) || r * v.k > 6 * Math.max(v.W, v.H)) return;
    out.push(
      <g key={`c${i}`}>
        <ellipse {...ellipse(v, x, y + r * 0.15, r * 1.3, r * 0.35)} fill={J.cloudShade} />
        <circle
          cx={v.P(x - r * 0.5, y)[0]}
          cy={v.P(x - r * 0.5, y)[1]}
          r={px(v, r * 0.45)}
          fill={J.cloud}
        />
        <circle
          cx={v.P(x, y - r * 0.2)[0]}
          cy={v.P(x, y - r * 0.2)[1]}
          r={px(v, r * 0.6)}
          fill={J.cloud}
        />
        <circle
          cx={v.P(x + r * 0.55, y)[0]}
          cy={v.P(x + r * 0.55, y)[1]}
          r={px(v, r * 0.4)}
          fill={J.cloud}
        />
      </g>,
    );
    if (i === 1 && rain > 0) {
      for (let n = 0; n < 36; n++) {
        const rx = x - r + rnd(n, 7) * r * 2;
        const f = (s.t * 0.9 + rnd(n, 8)) % 1;
        const ry = y + r * 0.3 + f * (-y - r * 0.3);
        out.push(
          <line
            key={`r${n}`}
            x1={v.P(rx, ry)[0]}
            y1={v.P(rx, ry)[1]}
            x2={v.P(rx - 30, ry + 180)[0]}
            y2={v.P(rx - 30, ry + 180)[1]}
            stroke={J.spray}
            strokeWidth={3 * (v.W / 1080)}
            opacity={0.7 * clamp(rain * 2)}
          />,
        );
      }
    }
  });
  if (v.cam.w < 600) {
    // The house, cut open at the front: a bathroom to the west, the kitchen, the roof.
    out.push(
      <path
        key="roof"
        d={poly(v, [
          [-6.6, -3],
          [4.6, -3],
          [2.6, -4.8],
          [-4.6, -4.8],
        ])}
        fill={J.roof}
        stroke={LINE.color}
        strokeWidth={edge(v, 0.04)}
      />,
      <path
        key="walls"
        d={rect(v, -6.2, -3, 4.2, 0)}
        fill={J.houseWall}
        stroke={LINE.color}
        strokeWidth={edge(v, 0.04)}
      />,
      <path key="back" d={rect(v, -6, -2.85, 4, 0)} fill={J.wall} />,
      <path key="bath" d={rect(v, -6, -2.85, -3.6, 0)} fill={J.tile} />,
      <path key="divide" d={rect(v, -3.6, -2.85, -3.45, 0)} fill={J.wallShade} />,
      <path key="floor" d={rect(v, -6.2, 0, 4.2, 0.25)} fill={J.wood} />,
    );
    for (let i = 0; i < 6; i++) {
      out.push(
        <path
          key={`t${i}`}
          d={rect(v, -6, -2.85 + i * 0.48, -3.6, -2.83 + i * 0.48)}
          fill={J.tileLine}
        />,
      );
    }
    // The shower in the bathroom.
    out.push(
      <path key="pipe" d={rect(v, -4.9, -2.6, -4.84, -1.9)} fill={J.faucet} />,
      <path
        key="head"
        d={poly(v, [
          [-5.1, -1.95],
          [-4.65, -1.95],
          [-4.75, -1.85],
          [-5.0, -1.85],
        ])}
        fill={J.faucetShade}
      />,
    );
    if (shower > 0) {
      for (let n = 0; n < 24; n++) {
        const f = (s.t * 1.6 + rnd(n, 4)) % 1;
        const x = -5.0 + rnd(n, 5) * 0.3 + (rnd(n, 6) - 0.5) * f * 0.7;
        const y = -1.82 + f * 1.8;
        out.push(
          <circle
            key={`sh${n}`}
            cx={v.P(x, y)[0]}
            cy={v.P(x, y)[1]}
            r={px(v, 0.025)}
            fill={J.spray}
            opacity={clamp(shower * 2)}
          />,
        );
      }
    }
    // The kitchen window, with the morning outside it, and rain on it at the end.
    out.push(
      <path key="win" d={rect(v, -2.6, -2.3, -0.9, -1.15)} fill={J.wood} />,
      <path key="pane" d={rect(v, -2.5, -2.2, -1.0, -1.25)} fill={J.sky} />,
      <path key="bar" d={rect(v, -1.78, -2.2, -1.72, -1.25)} fill={J.wood} />,
      <path
        key="light"
        d={poly(v, [
          [-2.5, -2.2],
          [-1.0, -1.25],
          [GLASS.x + 0.5, g.base],
          [GLASS.x - 0.9, g.base],
        ])}
        fill={J.beam}
        opacity={0.18}
      />,
    );
    if (s.thing('raindrop') > 0) {
      for (let n = 0; n < 14; n++) {
        const x = -2.45 + rnd(n, 9) * 1.4;
        const y = -2.15 + ((s.t * 0.12 + rnd(n, 10)) % 1) * 0.85;
        out.push(
          <ellipse
            key={`rd${n}`}
            {...ellipse(v, x, y, 0.025, 0.04)}
            fill={J.glassEdge}
            opacity={0.8}
          />,
        );
      }
    }
    // The counter, the tap over it, and the glass.
    out.push(
      <path
        key="counter"
        d={rect(v, -0.6, g.base, 3.2, 0)}
        fill={J.wood}
        stroke={LINE.color}
        strokeWidth={edge(v, 0.02)}
      />,
      <path
        key="top"
        d={rect(v, -0.7, g.base - 0.05, 3.3, g.base)}
        fill={J.counter}
        stroke={LINE.color}
        strokeWidth={edge(v, 0.012)}
      />,
      <path
        key="tap1"
        d={rect(v, g.x - 0.02, -1.62, g.x + 0.02, -1.3)}
        fill={J.faucet}
        stroke={LINE.color}
        strokeWidth={edge(v, 0.004)}
      />,
      <path
        key="tap2"
        d={rect(v, g.x - 0.02, -1.66, g.x + 0.3, -1.62)}
        fill={J.faucet}
        stroke={LINE.color}
        strokeWidth={edge(v, 0.004)}
      />,
      <path key="tap3" d={rect(v, g.x - 0.035, -1.32, g.x + 0.035, -1.29)} fill={J.faucetShade} />,
    );
    if (tap > 0) {
      const f = (s.t * 1.3) % 1;
      const dy = -1.27 + f * (g.base - g.h * 0.4 + 1.27);
      out.push(
        <ellipse
          key="drip"
          {...ellipse(v, g.x, dy, 0.008, 0.012)}
          fill={J.water}
          opacity={clamp(tap * 2)}
        />,
      );
    }
    // The glass: water inside, its rim, a glint.
    out.push(
      <path
        key="gl"
        d={poly(v, [
          [g.x - g.w / 2, g.base - g.h],
          [g.x + g.w / 2, g.base - g.h],
          [g.x + g.w * 0.42, g.base],
          [g.x - g.w * 0.42, g.base],
        ])}
        fill={J.glass}
        opacity={0.65}
      />,
      <path
        key="water"
        d={poly(v, [
          [g.x - g.w * 0.48, g.base - g.h * 0.72],
          [g.x + g.w * 0.48, g.base - g.h * 0.72],
          [g.x + g.w * 0.42, g.base - 0.004],
          [g.x - g.w * 0.42, g.base - 0.004],
        ])}
        fill={J.water}
        opacity={0.85}
      />,
      <path
        key="glo"
        d={poly(v, [
          [g.x - g.w / 2, g.base - g.h],
          [g.x + g.w / 2, g.base - g.h],
          [g.x + g.w * 0.42, g.base],
          [g.x - g.w * 0.42, g.base],
        ])}
        fill="none"
        stroke={J.glassEdge}
        strokeWidth={edge(v, 0.0025)}
      />,
      <path
        key="glint"
        d={rect(v, g.x - g.w * 0.3, g.base - g.h * 0.9, g.x - g.w * 0.24, g.base - g.h * 0.2)}
        fill={J.clockFace}
        opacity={0.7}
      />,
    );
  }
  return <>{out}</>;
}

/** The glass's rim close up, the drop on it, and inside the drop, water. */
function DropFrame({ v, s }: { v: View; s: State }) {
  if (!isNow(s) || v.cam.w > 400) return null;
  const drop = Math.max(s.thing('drop'), s.thing('molecule') > 0 ? 1 : 0);
  const frost = s.thing('frost');
  const out: ReactNode[] = [];
  // The glass wall, seen edge on, running down from the rim; the drop hangs on its outside. It is
  // drawn only close up: further out, the kitchen's own glass is the one seen.
  const near = clamp((80 - v.cam.w) / 40);
  if (near > 0) {
    out.push(
      <path key="wall" d={rect(v, -9, -6, -1.6, 124)} fill={J.glass} opacity={0.55 * near} />,
    );
    out.push(
      <path key="edge" d={rect(v, -1.9, -6, -1.6, 124)} fill={J.glassEdge} opacity={0.8 * near} />,
    );
    out.push(
      <path key="inwater" d={rect(v, -9, 2, -1.9, 124)} fill={J.water} opacity={0.8 * near} />,
    );
  }
  if (drop > 0) {
    const sc = outBack(clamp(drop));
    const r = 2 * sc;
    out.push(
      <ellipse
        key="d"
        {...ellipse(v, 0, 0, r * 1.02, r)}
        fill={J.water}
        stroke={J.glassEdge}
        strokeWidth={edge(v, 0.08)}
      />,
      <ellipse
        key="dl"
        {...ellipse(v, -0.6, -0.7, 0.55 * sc, 0.35 * sc, -30)}
        fill={J.waterLight}
        opacity={0.8}
      />,
    );
    if (frost > 0) {
      // Frost creeping over the drop: white crystals branching out from its edge.
      for (let i = 0; i < 9; i++) {
        const a = (-150 + i * 24) * DEG;
        const L = 1.2 * smooth(frost * 1.4 - i * 0.05);
        if (L <= 0) continue;
        const x0 = r * Math.cos(a);
        const y0 = r * Math.sin(a);
        const x1 = x0 - Math.cos(a) * L;
        const y1 = y0 - Math.sin(a) * L;
        out.push(
          <line
            key={`f${i}`}
            x1={v.P(x0, y0)[0]}
            y1={v.P(x0, y0)[1]}
            x2={v.P(x1, y1)[0]}
            y2={v.P(x1, y1)[1]}
            stroke={J.frost}
            strokeWidth={px(v, 0.07)}
            strokeLinecap="round"
            opacity={0.85}
          />,
          <line
            key={`g${i}`}
            x1={v.P((x0 + x1) / 2, (y0 + y1) / 2)[0]}
            y1={v.P((x0 + x1) / 2, (y0 + y1) / 2)[1]}
            x2={
              v.P((x0 + x1) / 2 + Math.sin(a) * L * 0.3, (y0 + y1) / 2 - Math.cos(a) * L * 0.3)[0]
            }
            y2={
              v.P((x0 + x1) / 2 + Math.sin(a) * L * 0.3, (y0 + y1) / 2 - Math.cos(a) * L * 0.3)[1]
            }
            stroke={J.frost}
            strokeWidth={px(v, 0.05)}
            strokeLinecap="round"
            opacity={0.85}
          />,
        );
      }
    }
  }
  // Deep inside the drop: the water swirls, in soft bands that turn as you go in.
  if (v.cam.w < 2.2) {
    const deep = smooth((2.2 - v.cam.w) / 1.6);
    out.push(<rect key="fill" width={v.W} height={v.H} fill={J.water} opacity={deep} />);
    const turn = Math.log10(v.cam.w) * 40 + s.t * 10;
    for (let i = 0; i < 7; i++) {
      const r = (0.18 + i * 0.13) * Math.max(v.W, v.H);
      out.push(
        <ellipse
          key={`sw${i}`}
          cx={v.fx}
          cy={v.fy}
          rx={r}
          ry={r * 0.55}
          fill="none"
          stroke={J.waterLight}
          strokeWidth={10 * (v.W / 1080)}
          strokeDasharray={`${r * 0.6} ${r * 0.9}`}
          transform={`rotate(${turn * (1 + i * 0.2) + i * 25} ${v.fx} ${v.fy})`}
          opacity={0.5 * deep}
        />,
      );
    }
    // Bubbles streaming past as the camera dives in: each comes from the middle and grows as it
    // passes, so the way down is never an empty blue.
    const dive = -Math.log10(v.cam.w);
    for (let i = 0; i < 60; i++) {
      const f = (((rnd(i, 51) + dive * 0.9) % 1) + 1) % 1;
      const a = rnd(i, 52) * 2 * Math.PI + s.t * 0.15;
      const reach = (0.04 + f * f) * Math.hypot(v.W, v.H) * 0.6;
      const r = (10 + 80 * f * f) * (v.W / 1080) * (0.6 + 0.8 * rnd(i, 50));
      out.push(
        <circle
          key={`bu${i}`}
          cx={v.fx + Math.cos(a) * reach}
          cy={v.fy + Math.sin(a) * reach}
          r={r}
          fill={J.waterLight}
          stroke={J.clockFace}
          strokeWidth={2.5 * (v.W / 1080)}
          opacity={0.8 * deep * Math.min(1, 3 * Math.sin(Math.PI * f))}
        />,
      );
    }
  }
  return <>{out}</>;
}

/** One water molecule and the others jostling round it; it opens out to show its atoms. */
function Molecule({
  v,
  x,
  y,
  turn,
  scale,
  open = 0,
  heavy = 0,
  dim = 1,
  labels = false,
  t = 0,
}: {
  v: View;
  x: number;
  y: number;
  turn: number;
  scale: number;
  open?: number;
  heavy?: number;
  dim?: number;
  labels?: boolean;
  t?: number;
}) {
  const bond = 1.55 * scale * (1 + 0.35 * open);
  const half = (52.25 * DEG) as number;
  const Hs = [-1, 1].map((side) => {
    const a = turn * DEG - Math.PI / 2 + side * half + Math.PI;
    return [x + bond * Math.cos(a), y + bond * Math.sin(a)] as [number, number];
  });
  const [ox, oy] = v.P(x, y);
  const rO = px(v, 1.15 * scale);
  const rH = px(v, 0.72 * scale);
  return (
    <g opacity={dim}>
      {Hs.map(([hx, hy], i) => {
        const [sx, sy] = v.P(hx, hy);
        return (
          <line
            key={`b${i}`}
            x1={ox}
            y1={oy}
            x2={sx}
            y2={sy}
            stroke={J.hydrogenShade}
            strokeWidth={rH * 0.5}
            opacity={1 - open * 0.6}
          />
        );
      })}
      <circle cx={ox} cy={oy} r={rO} fill={J.oxygen} stroke={LINE.color} strokeWidth={rO * 0.06} />
      <circle
        cx={ox - rO * 0.3}
        cy={oy - rO * 0.3}
        r={rO * 0.35}
        fill={J.clockFace}
        opacity={0.35}
      />
      {Hs.map(([hx, hy], i) => {
        const [sx, sy] = v.P(hx, hy);
        const big = i === 1 ? heavy : 0;
        const r = rH * (1 + 0.45 * smooth(big));
        return (
          <g key={`h${i}`}>
            {big > 0 && (
              <circle
                cx={sx}
                cy={sy}
                r={r * (1.8 + 0.2 * Math.sin(t * 6))}
                fill={J.heavy}
                opacity={0.35 * smooth(big)}
              />
            )}
            <circle
              cx={sx}
              cy={sy}
              r={r}
              fill={big > 0.5 ? J.heavy : J.hydrogen}
              stroke={LINE.color}
              strokeWidth={rH * 0.08}
            />
          </g>
        );
      })}
      {labels && open > 0 && (
        <g
          opacity={clamp(open * 2)}
          fontFamily={font}
          fontWeight={700}
          textAnchor="middle"
          fill={J.clockFace}
          stroke={LINE.color}
          strokeWidth={rO * 0.08}
          paintOrder="stroke"
        >
          <text x={ox} y={oy - rO * 1.35} fontSize={rO * 0.42}>
            OXYGEN
          </text>
          {Hs.map(([hx, hy], i) => {
            const [sx, sy] = v.P(hx, hy);
            return (
              <text key={i} x={sx} y={sy + rH * 2.2} fontSize={rO * 0.34}>
                HYDROGEN
              </text>
            );
          })}
        </g>
      )}
    </g>
  );
}
function MoleculeFrame({ v, s }: { v: View; s: State }) {
  if (!isNow(s) || v.cam.w > 2e6) return null;
  const spacing = 5.2;
  const cellPx = spacing * v.k;
  const out: ReactNode[] = [];
  if (cellPx > 2.5) {
    const x0 = Math.floor((v.cam.x - (v.fx / v.k) * 1.2) / spacing);
    const x1 = Math.ceil((v.cam.x + ((v.W - v.fx) / v.k) * 1.2) / spacing);
    const y0 = Math.floor((v.cam.y - (v.fy / v.k) * 1.2) / spacing);
    const y1 = Math.ceil((v.cam.y + ((v.H - v.fy) / v.k) * 1.2) / spacing);
    const shown = smooth((cellPx - 2.5) / 20);
    // While the molecules are small, only a round cluster about the middle is drawn, growing to
    // fill the frame as the camera closes in; never more than about 750 at once.
    const ci = Math.round(v.cam.x / spacing);
    const cj = Math.round(v.cam.y / spacing);
    const reach = cellPx < 60 ? 15.5 : Infinity;
    for (let i = x0; i <= x1; i++) {
      for (let j = y0; j <= y1; j++) {
        if (Math.hypot(i - ci, j - cj) > reach) continue;
        const x = (i + 0.5 + (rnd(i, j) - 0.5) * 0.5) * spacing + 0.4 * Math.sin(s.t * 2 + i * j);
        const y = (j + 0.5 + (rnd(j, i) - 0.5) * 0.5) * spacing + 0.4 * Math.cos(s.t * 2.3 + i + j);
        if (Math.hypot(x, y) < 4.6) continue;
        out.push(
          <Molecule
            key={`${i},${j}`}
            v={v}
            x={x}
            y={y}
            turn={rnd(i, j + 9) * 360 + s.t * 30 * (rnd(i, j) - 0.5)}
            scale={0.8}
            dim={0.55 * shown}
          />,
        );
      }
    }
  }
  if (s.thing('molecule') > 0 || v.cam.w < 40) {
    out.push(
      <Molecule
        key="hero"
        v={v}
        x={0}
        y={0}
        turn={10 * Math.sin(s.t)}
        scale={outBack(clamp(Math.max(s.thing('molecule'), v.cam.w < 40 ? 1 : 0)))}
        open={smooth(s.thing('open'))}
        heavy={s.thing('heavy')}
        labels
        t={s.t}
      />,
    );
  }
  return <>{out}</>;
}

/** One speck of dust in the cloud, our water molecule on it, and the ice coating it. */
function DustFrame({ v, s }: { v: View; s: State }) {
  if (s.rewind <= 0 || s.collapse > 0.35 || v.cam.w > 3000) return null;
  const ice = s.thing('ice');
  const shown = clamp(s.thing('dust') * 2 + (v.cam.w < 20 ? 1 : 0));
  const shape: [number, number][] = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * 2 * Math.PI;
    const r = 0.55 * (0.8 + 0.35 * rnd(i, 21));
    return [r * Math.cos(a), r * Math.sin(a)];
  });
  const iceShape: [number, number][] = shape.map(([x, y], i) => {
    const r = Math.hypot(x, y);
    const k = (r + 0.2 * smooth(ice) * (0.8 + 0.4 * rnd(i, 30))) / r;
    return [x * k, y * k];
  });
  return (
    <g opacity={shown}>
      {ice > 0 && (
        <path
          d={poly(v, iceShape)}
          fill={J.iceCoat}
          opacity={0.6}
          stroke={J.clockFace}
          strokeWidth={edge(v, 0.012)}
        />
      )}
      <path d={poly(v, shape)} fill={J.grain} stroke={LINE.color} strokeWidth={edge(v, 0.012)} />
      <path
        d={poly(
          v,
          shape.map(([x, y]) => [x * 0.6 + 0.08, y * 0.6 + 0.08]),
        )}
        fill={J.grainShade}
        opacity={0.5}
      />
      {(s.thing('dust') > 0 || v.cam.w < 20) && (
        // Our water molecule, held on the speck (drawn large enough to see).
        <Molecule v={v} x={0.32} y={-0.52} turn={20} scale={0.075} heavy={1} t={s.t} />
      )}
    </g>
  );
}

/**
 * On the long dive from the whole cloud down to one speck of dust (and back out), specks of dust
 * and ice stream past the camera at every scale, as bubbles do in the drop: the way down through
 * twenty powers of ten is never an empty dark.
 */
function DustStream({ v, s }: { v: View; s: State }) {
  if (s.rewind <= 0 || s.collapse > 0.6) return null;
  const w = v.cam.w;
  // In the dust frame's micrometres: from a few speck-widths out to the whole cloud.
  const shown =
    clamp((Math.log10(w) - 1.2) / 1.2) * clamp((23.5 - Math.log10(w)) / 1.5) * Math.sqrt(s.rewind);
  if (shown <= 0) return null;
  const dive = -Math.log10(w);
  return (
    <>
      {Array.from({ length: 95 }, (_, i) => {
        const f = (((rnd(i, 71) + dive * 0.7) % 1) + 1) % 1;
        const a = rnd(i, 72) * 2 * Math.PI + s.t * 0.05;
        const reach = (0.03 + f * f) * Math.hypot(v.W, v.H) * 0.6;
        const r = (6 + 46 * f * f) * (v.W / 1080) * (0.5 + rnd(i, 73));
        const ice = i % 3 === 0;
        return (
          <circle
            key={i}
            cx={v.fx + Math.cos(a) * reach}
            cy={v.fy + Math.sin(a) * reach}
            r={r}
            fill={ice ? J.iceCoat : J.grain}
            stroke={ice ? J.clockFace : LINE.color}
            strokeWidth={1.5 * (v.W / 1080)}
            opacity={0.85 * shown * Math.min(1, 3 * Math.sin(Math.PI * f))}
          />
        );
      })}
    </>
  );
}

const FRAME_DRAW: [FrameId, (p: { v: View; s: State }) => ReactNode][] = [
  ['cloud', CloudFrame],
  ['solar', SolarFrame],
  ['earth', EarthFrame],
  ['home', HomeFrame],
  ['drop', DropFrame],
  ['molecule', MoleculeFrame],
  ['dust', DustStream],
  ['dust', DustFrame],
];

/** The water world at one frame of a shot. */
export function WaterPicture({
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
  const from = g.from ?? g.at;
  const fly = g.fly === 'whole' ? Math.max(1, duration - 2) : waterFlightFrames(from, g.at, fps);
  const u = fly > 0 ? smooth(local / fly) : 1;
  const sh = shared(stopOf(from, t, tall), stopOf(g.at, t, tall));
  const cam0 = u >= 1 ? sh.b : zoomPath(sh.a, sh.b).at(u);
  const held =
    fly > 0 ? clamp((local - fly) / Math.max(1, duration - fly)) : clamp(local / duration);
  const cam = { ...cam0, w: cam0.w * (1 - 0.05 * held) };

  const at = new Map<JourneyThing, number>();
  g.show.forEach((x, i) => at.set(x.item, times[i] ?? 0));
  const span = (name: JourneyThing, seconds: number) =>
    g.keep.includes(name)
      ? 1
      : at.has(name)
        ? clamp((local - (at.get(name) ?? 0)) / (fps * seconds))
        : 0;
  const thing = (name: JourneyThing) => span(name, 0.35);
  const s: State = {
    t,
    W: width,
    H: height,
    u,
    thing,
    rewind: span('rewind', 2.4),
    collapse: span('collapse', 1.6),
    today: span('today', 2),
  };

  const views = Object.fromEntries(
    FRAME_DRAW.map(([f]) => [f, viewOf(camIn(cam, sh.frame, f), width, height)]),
  ) as Record<FrameId, View>;
  const world = (
    <>
      {FRAME_DRAW.map(([f, Draw], i) => (
        <g key={i}>{Draw({ v: views[f], s })}</g>
      ))}
    </>
  );

  // The labels of things as they arrive, pinned to them.
  const homeV = views.home;
  const solarV = views.solar;
  const tags: ReactNode[] = [];
  const pin = (v: View, x: number, y: number, text: string, shown: number, dy = -90) => {
    const [sx, sy] = v.P(x, y);
    if (sx < 0 || sx > width || sy < 0 || sy > height) return;
    tags.push(
      <Tag
        key={text}
        x={clamp(sx, 200, width - 200)}
        y={clamp(sy + dy * (width / 1080), 120, height * 0.62)}
        text={text}
        shown={shown}
        W={width}
      />,
    );
  };
  if (isNow(s)) {
    pin(homeV, GLASS.x, -1.35, 'THE TAP', thing('tap') * (homeV.cam.w < 5 ? 1 : 0), -40);
    pin(homeV, 4000, 1.6, 'THE SEA', thing('sea') * (homeV.cam.w > 1000 ? 1 : 0), -60);
    pin(homeV, 4200, -2600, 'CLOUDS', thing('clouds') * (homeV.cam.w > 1000 ? 1 : 0), -170);
    pin(homeV, 4200, -1200, 'RAIN', thing('rain') * (homeV.cam.w > 1000 ? 1 : 0), 0);
    pin(views.earth, 3.5, 2.5, 'OCEANS', thing('oceans') * (views.earth.cam.w < 80 ? 1 : 0), 0);
    const [cx, cy] = cometAt(t);
    pin(solarV, cx, cy, 'A COMET', thing('comet') * (solarV.cam.w < 0.6 ? 1 : 0), 110);
    pin(solarV, 0, 0, 'THE SUN', thing('sun') * (solarV.cam.w < 0.6 ? 1 : 0), -260);
  }
  if (s.rewind > 0 && s.collapse <= 0) {
    pin(
      views.cloud,
      0,
      -12,
      'BEFORE THE SUN',
      clamp((s.rewind - 0.5) * 2) * (views.cloud.cam.w > 10 ? 1 : 0),
      0,
    );
    pin(
      views.dust,
      0,
      0.75,
      'A SPECK OF DUST',
      thing('dust') * (views.dust.cam.w < 20 ? 1 : 0),
      60,
    );
    pin(views.dust, -0.6, -0.6, 'ICE', thing('ice') * (views.dust.cam.w < 20 ? 1 : 0), -40);
  }
  if (s.collapse > 0 && !isNow(s)) {
    pin(
      solarV,
      0,
      0,
      'THE NEWBORN SUN',
      smooth((s.collapse - 0.6) / 0.3) * (solarV.cam.w < 80 && solarV.cam.w > 2 ? 1 : 0),
      -170,
    );
    pin(
      views.earth,
      -4,
      -8.5,
      'COMETS AND ROCKS',
      thing('rocks') * (views.earth.cam.w < 80 ? 1 : 0),
      0,
    );
  }

  // The picture shrinking into a computer's screen: the model of the Sun and planets.
  const computer = s.thing('computer') * (1 - s.rewind);
  const screenFrost = s.thing('screen-frost') * (1 - s.rewind);
  let picture: ReactNode = (
    <>
      {world}
      {tags}
    </>
  );
  const screen = { x: width / 2, y: height * 0.4, w: width * 0.82, h: height * 0.36 };
  if (computer > 0) {
    const sc = { w: screen.w / width, h: screen.h / height };
    const shrinkX = 1 - (1 - sc.w) * smooth(computer);
    const shrinkY = 1 - (1 - sc.h) * smooth(computer);
    const id = 'jw-screen';
    picture = (
      <>
        <rect width={width} height={height} fill={J.wall} />
        <path d={`M 0 ${height * 0.66} H ${width} V ${height} H 0 Z`} fill={J.desk} />
        <rect
          x={screen.x - screen.w / 2 - 34}
          y={screen.y - screen.h / 2 - 34}
          width={screen.w + 68}
          height={screen.h + 68}
          rx={26}
          fill={J.monitor}
          opacity={smooth(computer)}
        />
        <rect
          x={screen.x - 40}
          y={screen.y + screen.h / 2 + 30}
          width={80}
          height={height * 0.66 - (screen.y + screen.h / 2 + 30)}
          fill={J.monitor}
          opacity={smooth(computer)}
        />
        <defs>
          <clipPath id={id}>
            <rect
              x={screen.x - (width * shrinkX) / 2}
              y={screen.y - (height * shrinkY) / 2}
              width={width * shrinkX}
              height={height * shrinkY}
              rx={10 * smooth(computer)}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <g
            transform={`translate(${screen.x} ${screen.y}) scale(${shrinkX} ${shrinkX}) translate(${-width / 2} ${-height * 0.42})`}
          >
            {picture}
          </g>
        </g>
        {screenFrost > 0 && (
          // Frost creeping in from the screen's corners: a pale icy haze, and six-armed crystals.
          <g>
            <defs>
              <radialGradient id="jw-frost">
                <stop offset="0" stopColor={J.frost} stopOpacity={0.85} />
                <stop offset="1" stopColor={J.frost} stopOpacity={0} />
              </radialGradient>
            </defs>
            {(
              [
                [-1, -1],
                [1, -1],
                [-1, 1],
                [1, 1],
              ] as const
            ).map(([sx, sy], i) => (
              <ellipse
                key={`h${i}`}
                cx={screen.x + (sx * screen.w) / 2}
                cy={screen.y + (sy * screen.h) / 2}
                rx={screen.w * 0.42 * smooth(screenFrost)}
                ry={screen.h * 0.55 * smooth(screenFrost)}
                fill="url(#jw-frost)"
              />
            ))}
            {Array.from({ length: 22 }, (_, i) => {
              const corner = i % 4;
              const sx = corner % 2 ? 1 : -1;
              const sy = corner < 2 ? -1 : 1;
              const d = rnd(i, 80) * 0.38 * smooth(screenFrost * 1.2 - rnd(i, 81) * 0.3);
              if (d <= 0) return null;
              const cx = screen.x + sx * (screen.w / 2 - d * screen.w);
              const cy = screen.y + sy * (screen.h / 2 - d * screen.h * 1.1);
              const R = (18 + 30 * rnd(i, 82)) * (width / 1080);
              return (
                <g key={`c${i}`} stroke={J.frost} strokeLinecap="round" opacity={0.9}>
                  {[0, 60, 120].map((turn) => (
                    <g key={turn} transform={`rotate(${turn + 20 * rnd(i, 83)} ${cx} ${cy})`}>
                      <line
                        x1={cx - R}
                        y1={cy}
                        x2={cx + R}
                        y2={cy}
                        strokeWidth={3.5 * (width / 1080)}
                      />
                      {[-0.55, 0.55].map((f) => (
                        <g key={f}>
                          <line
                            x1={cx + f * R}
                            y1={cy}
                            x2={cx + f * R * 1.3}
                            y2={cy - R * 0.25}
                            strokeWidth={2.5 * (width / 1080)}
                          />
                          <line
                            x1={cx + f * R}
                            y1={cy}
                            x2={cx + f * R * 1.3}
                            y2={cy + R * 0.25}
                            strokeWidth={2.5 * (width / 1080)}
                          />
                        </g>
                      ))}
                    </g>
                  ))}
                </g>
              );
            })}
          </g>
        )}
      </>
    );
  }

  // The callout: a number and a few words in the picture, pointing at a thing in it.
  const callout = (() => {
    const c = g.callout;
    const calloutAt = times[g.show.length];
    if (!c || calloutAt === undefined) return null;
    const p = clamp((local - calloutAt) / 10);
    if (p <= 0) return null;
    const anchorOf = (): [number, number] | null => {
      switch (c.at) {
        case 'drop':
          return views.drop.P(0, 0);
        case 'atom': {
          const v = views.molecule;
          return v.P(
            1.55 * Math.cos(-Math.PI / 2 + 52.25 * DEG + Math.PI),
            1.55 * Math.sin(-Math.PI / 2 + 52.25 * DEG + Math.PI),
          );
        }
        case 'screen':
          return computer > 0 ? [screen.x, screen.y] : null;
        case 'sun':
          return solarV.P(0, 0);
        case 'sea':
        case 'earth':
          return views.earth.P(0, 0);
        default:
          return null;
      }
    };
    const anchor = anchorOf();
    const bx = width / 2;
    const by = height * (tall ? 0.16 : 0.18);
    const sc = (0.6 + 0.4 * outBack(p)) * (width / 1080);
    const caption = c.caption?.split(' / ') ?? [];
    const size = c.value.length > 6 ? 130 : 180;
    return (
      <g opacity={clamp(p * 2.5)}>
        {anchor && anchor[1] > by + 150 * sc && (
          <line
            x1={bx}
            y1={by + 130 * sc}
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
            fontSize={size}
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

  return (
    <g>
      {picture}
      {callout}
    </g>
  );
}
