import type { Graphic, JourneyStop, JourneyThing } from '@studio/shared';
import type { ReactNode } from 'react';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { VIEWER_FONT } from '../overlays/text';
import { clamp, disc, outBack, path, smooth, viewOf, zoomPath } from './Journey';
import type { Cam, View } from './Journey';

/**
 * The world `sunset` (2026-10-18, "Why Is the Sun Already Gone When You Watch It Set?"): a beach at
 * sunset in kilometres, the Earth's middle at 0, 0 and you standing on top of it, the sea to your
 * right. From your phone's screen out to the beach, down to the glass of water on its towel and its
 * straw, up to the sky cut open into its layers of air, a high Sun, out to the curve of the Earth
 * with a low Sun and one beam skimming the air, and back to the beach, where the real Sun is found
 * below the horizon.
 *
 * The Sun of the beach is at no distance the world can hold, so it is drawn as the sky is, in the
 * picture's own space: it keeps its size however close the camera comes, sitting on the line of the
 * sea. Seen from the curve of the Earth it is a second, far Sun. The air's layers and the bend of
 * the beam are drawn bigger than life, as the script asks, so they can be seen.
 */

const J = fineTokens.journey;
const LINE = fineTokens.line;
const font = `${VIEWER_FONT}, Arial, sans-serif`;
type Journey = Extract<Graphic, { kind: 'journey' }>;

const R = 6371;
/** Where the sea begins, to your right, in km. */
const SHORE = 0.0009;
/** You, the phone you hold up, and the glass on its towel beside you. */
const PHONE = { x: 0.00034, y: -R - 0.00155, w: 0.00007, h: 0.000142 };
const GLASS = { x: -0.0007, base: -R - 0.000006, w: 0.000062, h: 0.00012, water: 0.7 };
/** The far Sun of the curve of the Earth, below the line of the horizon, and its size. */
const FAR_SUN = { x: 11500, y: -R + 1250, r: 800 };
/** The layers of air over the beach (heights in km, drawn bigger than life), thickest at the bottom. */
const LAYERS = [0, 1, 2.2, 3.8, 6, 9, 14];

type Stop =
  | 'screen'
  | 'beach'
  | 'sea'
  | 'glass'
  | 'straw'
  | 'sky'
  | 'high'
  | 'curve'
  | 'phone'
  | 'below'
  | 'gap'
  | 'sunclose';

function stopOf(stop: JourneyStop, tall: boolean): Cam {
  const k = tall ? 1 : 1.9;
  switch (stop as Stop) {
    case 'screen':
      return { x: PHONE.x, y: PHONE.y, w: PHONE.w / 0.42 };
    case 'beach':
      return { x: 0.0011, y: -R - 0.0019, w: 0.0048 * k };
    case 'sea':
      return { x: 0.0018, y: -R - 0.0018, w: 0.0045 * k };
    case 'glass':
      return { x: GLASS.x, y: -R - 0.00012, w: 0.0006 * k };
    case 'straw':
      return { x: GLASS.x + 0.000006, y: GLASS.base - GLASS.h * GLASS.water, w: 0.00017 * k };
    case 'sky':
      return { x: 0, y: -R - 7, w: 30 * k };
    case 'high':
      return { x: 0, y: -R - 11, w: 40 * k };
    case 'curve':
      return { x: 5000, y: -R + 1800, w: 22000 * k };
    case 'phone':
      return { x: 0.0012, y: -R - 0.002, w: 0.005 * k };
    case 'below':
      return { x: 0.0016, y: -R - 0.0016, w: 0.0055 * k };
    case 'gap':
    case 'sunclose':
      return { x: 0.0009, y: -R - 0.0018, w: 0.005 * k };
    default:
      return { x: 0.0011, y: -R - 0.0019, w: 0.0048 * k };
  }
}

/** How much of the beach's Sun each stop shows, how big it is drawn, and where across the frame. */
const SUN_AT: Partial<Record<Stop, { shown: number; zoom: number; x: number }>> = {
  beach: { shown: 1, zoom: 1, x: 0.74 },
  sea: { shown: 1, zoom: 1, x: 0.76 },
  phone: { shown: 1, zoom: 1, x: 0.76 },
  below: { shown: 1, zoom: 1, x: 0.74 },
  gap: { shown: 1, zoom: 1, x: 0.72 },
  sunclose: { shown: 1, zoom: 3.2, x: 0.5 },
};
const sunAt = (s: JourneyStop) => SUN_AT[s as Stop] ?? { shown: 0, zoom: 1, x: 0.74 };

export function sunsetFlightFrames(from: JourneyStop, to: JourneyStop, fps: number): number {
  if (from === to) return 0;
  const S = zoomPath(stopOf(from, true), stopOf(to, true)).S;
  return Math.round(fps * clamp(0.8 + 0.1 * S, 0.9, 2.4));
}

const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const rect = (v: View, x0: number, y0: number, x1: number, y1: number) =>
  path([v.P(x0, y0), v.P(x1, y0), v.P(x1, y1), v.P(x0, y1)]);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const edge = (v: View, units: number) => Math.min(units * v.k, 4 * (v.W / 1080));

/** The picture on the phone's screen: the sunset it is filming, in the screen's units (64 by 132). */
function ScreenPicture({ ghost, t }: { ghost: number; t: number }) {
  return (
    <>
      <defs>
        <linearGradient id="ss-screen-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.duskTop} />
          <stop offset="0.6" stopColor={J.duskMid} />
          <stop offset="1" stopColor={J.duskLow} />
        </linearGradient>
      </defs>
      <rect x={-32} y={-66} width={64} height={86} fill="url(#ss-screen-sky)" />
      <rect x={-32} y={20} width={64} height={46} fill={J.seaDusk} />
      <circle cx={10} cy={20 - 13} r={13} fill={J.sun} />
      <circle cx={10} cy={20 - 13} r={18} fill={J.sun} opacity={0.25} />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={10 - 9 + i * 1.5 + Math.sin(t * 3 + i) * 1.5}
          y={24 + i * 7}
          width={18 - i * 3}
          height={1.6}
          fill={J.seaGlint}
          opacity={0.8 - i * 0.15}
        />
      ))}
      {ghost > 0 && (
        <circle
          cx={10}
          cy={20 + 13}
          r={13}
          fill="none"
          stroke={J.sunGhost}
          strokeWidth={1.6}
          strokeDasharray="3 2.4"
          opacity={clamp(ghost * 2, 0, 1) * 0.95}
        />
      )}
      {/* The camera's red dot: it is filming. */}
      <circle cx={-24} cy={-58} r={2.4} fill={J.cross} opacity={0.6 + 0.4 * Math.sin(t * 5)} />
    </>
  );
}

/** You, standing on the sand, holding the phone up toward the sea. */
function You({ v, t, ghost, polish }: { v: View; t: number; ghost: number; polish: number }) {
  if (v.k * 0.0017 < 2) return null;
  const line = polish >= 2 ? 0 : 0.008;
  const m = 0.001;
  const [ox, oy] = v.P(0, -R);
  const px = PHONE.x / m;
  const py = (PHONE.y + R) / m;
  return (
    <g transform={`translate(${ox} ${oy}) scale(${m * v.k})`}>
      {polish >= 1 && (
        // The long shadow of sunset, stretching back across the sand away from the Sun.
        <path
          d="M -0.12 0 L -2.6 -0.02 Q -2.75 0.01 -2.6 0.05 L 0.12 0.03 Z"
          fill={J.shadow}
          opacity={0.35}
        />
      )}
      <path d="M -0.13 0 L -0.1 -0.86 L 0.1 -0.86 L 0.13 0 Z" fill={J.trousers} />
      <rect x={-0.2} y={-1.46} width={0.4} height={0.66} rx={0.12} fill={J.shirt} />
      <circle cx={0} cy={-1.62} r={0.13} fill={J.skin} stroke={LINE.color} strokeWidth={line} />
      {polish >= 1 && (
        // The Sun's warm light along the edges that face it.
        <g fill="none" stroke={J.sunEdge} strokeLinecap="round" opacity={0.85}>
          <path d="M 0.075 -1.72 A 0.13 0.13 0 0 1 0.12 -1.56" strokeWidth={0.025} />
          <path d="M 0.2 -1.36 L 0.2 -0.86" strokeWidth={0.03} />
          <path d="M 0.105 -0.84 L 0.13 0" strokeWidth={0.025} />
        </g>
      )}
      <path
        d="M -0.17 -1.38 Q -0.24 -1.1 -0.22 -0.9"
        stroke={J.shirt}
        strokeWidth={0.08}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M 0.17 -1.38 Q 0.3 -1.36 ${px} ${py + 0.07}`}
        stroke={J.shirt}
        strokeWidth={0.08}
        fill="none"
        strokeLinecap="round"
      />
      <g transform={`translate(${px} ${py})`}>
        <rect
          x={-0.037}
          y={-0.073}
          width={0.074}
          height={0.146}
          rx={0.01}
          fill={J.phone}
          stroke={LINE.color}
          strokeWidth={0.003}
        />
        <g transform="scale(0.001)">
          <ScreenPicture ghost={ghost} t={t} />
        </g>
        <rect x={-0.03} y={0.062} width={0.06} height={0.032} rx={0.014} fill={J.skin} />
        <rect x={-0.043} y={0.03} width={0.011} height={0.04} rx={0.0055} fill={J.skin} />
      </g>
    </g>
  );
}

/** The glass of water on its towel, its straw looking snapped at the waterline. */
function Glass({ v, t }: { v: View; t: number }) {
  if (v.k * GLASS.h < 3) return null;
  const g = GLASS;
  const top = g.base - g.h;
  const water = g.base - g.h * g.water;
  const lw = edge(v, 0.0000025);
  const tw = 0.00022;
  return (
    <g>
      <path d={rect(v, g.x - tw, -R - 0.000006, g.x + tw, -R)} fill={J.towel} />
      {[-0.6, 0, 0.6].map((f) => (
        <path
          key={f}
          d={rect(v, g.x + f * tw - 0.000012, -R - 0.000006, g.x + f * tw + 0.000012, -R)}
          fill={J.towelStripe}
        />
      ))}
      <path
        d={path([
          v.P(g.x - g.w / 2, top),
          v.P(g.x + g.w / 2, top),
          v.P(g.x + g.w * 0.42, g.base),
          v.P(g.x - g.w * 0.42, g.base),
        ])}
        fill={J.glass}
        opacity={0.55}
      />
      <path
        d={path([
          v.P(g.x - g.w * 0.47, water),
          v.P(g.x + g.w * 0.47, water),
          v.P(g.x + g.w * 0.42, g.base - 0.000002),
          v.P(g.x - g.w * 0.42, g.base - 0.000002),
        ])}
        fill={J.water}
        opacity={0.8}
      />
      <path
        d={path([
          v.P(g.x - g.w * 0.47, water - 0.0000015),
          v.P(g.x + g.w * 0.47, water - 0.0000015),
          v.P(g.x + g.w * 0.47, water + 0.0000015),
          v.P(g.x - g.w * 0.47, water + 0.0000015),
        ])}
        fill={J.waterLight}
      />
      {/* The straw: above the water it leans one way; under it, it seems to jump sideways. */}
      <line
        x1={v.P(g.x + g.w * 0.05, water)[0]}
        y1={v.P(g.x + g.w * 0.05, water)[1]}
        x2={v.P(g.x + g.w * 0.62, top - g.h * 0.32)[0]}
        y2={v.P(g.x + g.w * 0.62, top - g.h * 0.32)[1]}
        stroke={J.towel}
        strokeWidth={Math.max(2, v.k * 0.0000075)}
        strokeLinecap="round"
      />
      <line
        x1={v.P(g.x - g.w * 0.08, water)[0]}
        y1={v.P(g.x - g.w * 0.08, water)[1]}
        x2={v.P(g.x - g.w * 0.3, g.base - g.h * 0.08)[0]}
        y2={v.P(g.x - g.w * 0.3, g.base - g.h * 0.08)[1]}
        stroke={J.towel}
        strokeWidth={Math.max(2, v.k * 0.0000075)}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d={path([
          v.P(g.x - g.w / 2, top),
          v.P(g.x + g.w / 2, top),
          v.P(g.x + g.w * 0.42, g.base),
          v.P(g.x - g.w * 0.42, g.base),
        ])}
        fill="none"
        stroke={J.glassEdge}
        strokeWidth={lw}
      />
      <path
        d={rect(v, g.x - g.w * 0.32, top + g.h * 0.08, g.x - g.w * 0.26, g.base - g.h * 0.12)}
        fill={J.clockFace}
        opacity={0.6 + 0.1 * Math.sin(t)}
      />
    </g>
  );
}

/** The ground: the sand, the sea and its glints at the scale of the beach; the whole Earth from far. */
function Ground({ v, t, far, polish }: { v: View; t: number; far: number; polish: number }) {
  const out: ReactNode[] = [];
  if (far < 1) {
    out.push(
      <g key="near" opacity={1 - far}>
        {polish >= 1 && (
          <defs>
            <linearGradient
              id="ss-sea"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={v.P(0, -R)[1]}
              x2="0"
              y2={v.H}
            >
              <stop offset="0" stopColor={J.duskMid} />
              <stop offset="0.12" stopColor={J.seaDusk} />
              <stop offset="1" stopColor={J.seaDuskDeep} />
            </linearGradient>
            <linearGradient
              id="ss-sand"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={v.P(0, -R)[1]}
              x2="0"
              y2={v.H}
            >
              <stop offset="0" stopColor={J.sandLit} />
              <stop offset="0.2" stopColor={J.sandDusk} />
              <stop offset="1" stopColor={J.sandShade} />
            </linearGradient>
          </defs>
        )}
        <path
          d={rect(v, -40000, -R, SHORE, -R + 3000)}
          fill={polish >= 1 ? 'url(#ss-sand)' : J.sandDusk}
        />
        <path
          d={rect(v, SHORE, -R, 40000, -R + 3000)}
          fill={polish >= 1 ? 'url(#ss-sea)' : J.seaDusk}
        />
        <path
          d={rect(v, SHORE, -R + v.cam.w * 0.04, 40000, -R + 3000)}
          fill={J.seaDuskDeep}
          opacity={0.5}
        />
        {Array.from({ length: 14 }, (_, i) => {
          const x = v.cam.x + (rnd(i, 3) - 0.3) * v.cam.w * 1.4;
          if (x < SHORE) return null;
          const y = -R + v.cam.w * (0.006 + 0.03 * rnd(i, 4));
          const [sx, sy] = v.P(x, y);
          return (
            <rect
              key={i}
              x={sx}
              y={sy}
              width={(30 + 60 * rnd(i, 5)) * (v.W / 1080)}
              height={3 * (v.W / 1080)}
              fill={J.seaGlint}
              opacity={0.35 + 0.3 * Math.sin(t * 2 + i)}
            />
          );
        })}
      </g>,
    );
  }
  if (far > 0) {
    out.push(
      <g key="far" opacity={far}>
        {/* The air round the Earth, drawn far thicker than life, thickest at the bottom. */}
        {[1100, 780, 480, 220].map((h, i) => (
          <path key={h} d={disc(v, 0, 0, R + h)} fill={J.airDense} opacity={0.16 + 0.1 * i} />
        ))}
        <path d={disc(v, 0, 0, R)} fill={J.seaDusk} />
        <path
          d={path(
            [
              [-150, 1],
              [-118, 1],
              [-93, 1],
              [-93, 0.8],
              [-110, 0.62],
              [-140, 0.7],
            ].map(([a, f]) =>
              v.P(
                R * (f as number) * Math.cos(((a as number) * Math.PI) / 180),
                R * (f as number) * Math.sin(((a as number) * Math.PI) / 180),
              ),
            ),
          )}
          fill={J.sandShade}
        />
        {/* The beach, marked: you are here. */}
        <circle
          cx={v.P(0, -R)[0]}
          cy={v.P(0, -R)[1]}
          r={9 * (v.W / 1080)}
          fill={J.dot}
          stroke={J.clockFace}
          strokeWidth={3 * (v.W / 1080)}
        />
      </g>,
    );
  }
  return <>{out}</>;
}

/** The sky over the beach cut open into its layers of air, packed tight near the ground. */
function Layers({
  v,
  open,
  beam,
  highSun,
  t,
}: {
  v: View;
  open: number;
  beam: number;
  highSun: number;
  t: number;
}) {
  if (open <= 0 && highSun <= 0) return null;
  const x0 = -11;
  const x1 = 11;
  const top = -R - LAYERS[LAYERS.length - 1]!;
  const reveal = smooth(open);
  const midX = 0;
  const half = (x1 - x0) / 2;
  const out: ReactNode[] = [];
  if (open > 0) {
    LAYERS.slice(0, -1).forEach((h0, i) => {
      const h1 = LAYERS[i + 1]!;
      const share = i / (LAYERS.length - 2);
      out.push(
        <path
          key={`b${i}`}
          d={rect(v, midX - half * reveal, -R - h1, midX + half * reveal, -R - h0)}
          fill={i % 2 ? J.airThin : J.airDense}
          opacity={0.75 - 0.35 * share}
        />,
      );
      // The air itself: specks packed tight at the bottom, spread out at the top.
      const n = Math.round(46 * (1 - share) ** 1.6 + 4);
      for (let k = 0; k < n; k++) {
        const x = midX + (rnd(i * 97 + k, 1) - 0.5) * 2 * half * reveal;
        const y = -R - lerp(h0, h1, rnd(i * 97 + k, 2));
        const [sx, sy] = v.P(x + 0.06 * Math.sin(t * 3 + k), y);
        out.push(
          <circle
            key={`d${i}-${k}`}
            cx={sx}
            cy={sy}
            r={4 * (v.W / 1080)}
            fill={J.molecule}
            opacity={0.7}
          />,
        );
      }
    });
    out.push(
      <path
        key="frame"
        d={rect(v, midX - half * reveal, top, midX + half * reveal, -R)}
        fill="none"
        stroke={LINE.color}
        strokeWidth={4 * (v.W / 1080)}
      />,
    );
    // Which end is which, said on the picture: thin air at the top, thick air at the bottom.
    const label = (text: string, y: number, key: string) => {
      const [lx, ly] = v.P(midX, y);
      return (
        <text
          key={key}
          x={lx}
          y={ly}
          fontFamily={font}
          fontWeight={700}
          fontSize={40 * (v.W / 1080)}
          fill={J.clockFace}
          stroke={LINE.color}
          strokeWidth={8 * (v.W / 1080)}
          paintOrder="stroke"
          textAnchor="middle"
          opacity={clamp((open - 0.5) * 2, 0, 1)}
        >
          {text}
        </text>
      );
    };
    out.push(label('THIN AIR', top + 1.6, 'thin'), label('THICK AIR', -R - 0.35, 'thick'));
  }
  if (beam > 0) {
    // A beam coming down from the upper left, turning a little toward straight down at each layer.
    const pts: [number, number][] = [];
    let x = -10;
    let slope = 1.6;
    for (let i = LAYERS.length - 1; i > 0; i--) {
      const yTop = -R - LAYERS[i]!;
      const yBot = -R - LAYERS[i - 1]!;
      if (pts.length === 0) pts.push([x, yTop]);
      x += (yBot - yTop) * slope;
      pts.push([x, yBot]);
      slope *= 0.8;
    }
    const L = Math.max(1, Math.ceil(smooth(beam) * pts.length));
    out.push(
      <path
        key="beam"
        d={path(
          pts.slice(0, L).map(([a, b]) => v.P(a, b)),
          false,
        )}
        fill="none"
        stroke={J.beamGlow}
        strokeWidth={10 * (v.W / 1080)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    );
  }
  const highR = Math.max(2.3 * v.k, 40 * (v.W / 1080));
  const highOff =
    Math.hypot((0 - v.cam.x) * v.k, (-R - 19 - v.cam.y) * v.k) - highR * 1.6 > Math.hypot(v.W, v.H);
  if (highSun > 0 && !highOff) {
    const [sx, sy] = v.P(0, -R - 19);
    const r = highR;
    const go = smooth(highSun);
    out.push(
      <g key="high" opacity={clamp(highSun * 2, 0, 1)}>
        <circle cx={sx} cy={sy} r={r * 1.6} fill={J.sun} opacity={0.25} />
        <circle cx={sx} cy={sy} r={r} fill={J.sun} stroke={J.sunFlare} strokeWidth={r * 0.06} />
        <line
          x1={sx}
          y1={sy + r}
          x2={sx}
          y2={lerp(sy + r, v.P(0, -R)[1], go)}
          stroke={J.beamGlow}
          strokeWidth={10 * (v.W / 1080)}
          strokeLinecap="round"
        />
      </g>,
    );
  }
  return <>{out}</>;
}

/** The far Sun of the curve of the Earth, and the beam from it skimming through the air to you. */
function FarSun({ v, low, skim, t }: { v: View; low: number; skim: number; t: number }) {
  if (low <= 0) return null;
  const [sx, sy] = v.P(FAR_SUN.x, FAR_SUN.y);
  const r = Math.max(FAR_SUN.r * v.k, 30 * (v.W / 1080));
  // Close in, the Sun is millions of pixels across and far off the picture; drawn anyway, the browser
  // loses precision and floods the whole frame yellow. Leave it out while its glow cannot be seen.
  // (P pins far points to the edge of a box, so measure from where the Sun truly is.)
  const off =
    Math.hypot((FAR_SUN.x - v.cam.x) * v.k, (FAR_SUN.y - v.cam.y) * v.k) - r * 1.7 >
    Math.hypot(v.W, v.H);
  const out: ReactNode[] = [
    off ? null : (
      <g key="sun" opacity={clamp(low * 2, 0, 1)}>
        <circle cx={sx} cy={sy} r={r * 1.7} fill={J.sun} opacity={0.22 + 0.04 * Math.sin(t * 2)} />
        <circle cx={sx} cy={sy} r={r} fill={J.sun} stroke={J.sunFlare} strokeWidth={r * 0.05} />
      </g>
    ),
  ];
  if (skim > 0) {
    const P0: [number, number] = [0, -R];
    const P1: [number, number] = [5600, -R];
    const P2: [number, number] = [FAR_SUN.x - FAR_SUN.r * 0.6, FAR_SUN.y - FAR_SUN.r * 0.3];
    const n = 60;
    const until = smooth(skim);
    const pts = Array.from({ length: n + 1 }, (_, i) => {
      const s = 1 - (i / n) * until;
      const x = (1 - s) ** 2 * P0[0] + 2 * (1 - s) * s * P1[0] + s * s * P2[0];
      const y = (1 - s) ** 2 * P0[1] + 2 * (1 - s) * s * P1[1] + s * s * P2[1];
      return v.P(x, y);
    });
    out.push(
      <path
        key="glow"
        d={path(pts, false)}
        fill="none"
        stroke={J.beamGlow}
        strokeWidth={22 * (v.W / 1080)}
        opacity={0.3}
        strokeLinecap="round"
      />,
      <path
        key="beam"
        d={path(pts, false)}
        fill="none"
        stroke={J.beamGlow}
        strokeWidth={8 * (v.W / 1080)}
        strokeLinecap="round"
      />,
    );
  }
  return <>{out}</>;
}

/** The world `sunset` at one frame of a shot. */
export function SunsetPicture({
  g,
  local,
  duration,
  times,
  clock,
  fps,
  width,
  height,
  polish = SUNSET_POLISH,
}: {
  g: Journey;
  local: number;
  duration: number;
  times: number[];
  clock: number;
  fps: number;
  width: number;
  height: number;
  /** How finished the drawing is: 0 flat, 1 lit, 2 layered, 3 crafted (Biku picks, 2026-10-19). */
  polish?: number;
}) {
  const tall = width < height;
  const t = clock / fps;
  const u0 = width / 1080;
  const from = g.from ?? g.at;
  const fly = g.fly === 'whole' ? Math.max(1, duration - 2) : sunsetFlightFrames(from, g.at, fps);
  const u = fly > 0 ? smooth(local / fly) : 1;
  const a = stopOf(from, tall);
  const b = stopOf(g.at, tall);
  const cam0 = u >= 1 ? b : zoomPath(a, b).at(u);
  const held =
    fly > 0
      ? clamp((local - fly) / Math.max(1, duration - fly), 0, 1)
      : clamp(local / duration, 0, 1);
  const cam = { ...cam0, w: cam0.w * (1 - 0.04 * held) };
  const v = viewOf(cam, width, height);

  const at = new Map<JourneyThing, number>();
  g.show.forEach((x, i) => at.set(x.item, times[i] ?? 0));
  const thing = (name: JourneyThing, seconds = 0.35) =>
    g.keep.includes(name)
      ? 1
      : at.has(name)
        ? clamp((local - (at.get(name) ?? 0)) / (fps * seconds), 0, 1)
        : 0;

  const lw = Math.log10(cam.w);
  const space = smooth((lw - 2.3) / 1.2);
  const far = smooth((lw - 1.9) / 0.8);

  // The beach's Sun, drawn in the picture's own space.
  const sa = sunAt(from);
  const sb = sunAt(g.at);
  // It comes in while the camera is still a few kilometres up, so a dive to the beach never
  // passes through a picture of bare flat sand and sea.
  const sunShown =
    smooth(lerp(sa.shown, sb.shown, smooth(u * 1.6))) * (1 - smooth((lw - 0.3) / 0.9));
  const zoom = lerp(sa.zoom, sb.zoom, u);
  const sunX = lerp(sa.x, sb.x, u) * width;
  // From polish 2 the sea is seen as it really is, stretching away to a horizon at the height of
  // your eyes, with the beach curving off along the shore; below that the world is drawn edge on.
  const eyeLevel = polish >= 2 ? sunShown : 0;
  const groundY = v.P(0, -R)[1];
  const horizonY = lerp(groundY, v.P(0, PHONE.y)[1], eyeLevel);
  const r = 0.075 * width * zoom;
  const oval = thing('oval', 0.8);
  const ry = r * (1 - 0.2 * smooth(oval));
  const sunY = horizonY - ry;
  const realY = horizonY + r;
  const phone = v.P(PHONE.x, PHONE.y);
  const realSun = thing('real-sun', 0.6);
  const ride = thing('ride', 1.2);
  const straight = thing('straight', 0.8);
  const crack = thing('crack', 0.8);
  const straightBack = thing('straight-back', 0.8);
  const ghost = thing('ghost', 0.6);

  const beachSun =
    sunShown > 0.01 ? (
      <g opacity={sunShown}>
        <defs>
          <radialGradient id="ss-sun-glow">
            <stop offset="0" stopColor={J.duskGlow} stopOpacity={0.8} />
            <stop offset="1" stopColor={J.duskGlow} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={sunX} cy={sunY} rx={r * 3.2} ry={ry * 2.4} fill="url(#ss-sun-glow)" />
        {polish >= 1 && (
          <defs>
            <radialGradient id="ss-sun-body" cx="0.42" cy="0.4" r="0.65">
              <stop offset="0" stopColor={J.sunCore} />
              <stop offset="0.55" stopColor={J.sun} />
              <stop offset="1" stopColor={J.sunEdge} />
            </radialGradient>
            <radialGradient id="ss-bloom">
              <stop offset="0" stopColor={J.sun} stopOpacity={0.55} />
              <stop offset="0.4" stopColor={J.duskGlow} stopOpacity={0.25} />
              <stop offset="1" stopColor={J.duskGlow} stopOpacity={0} />
            </radialGradient>
          </defs>
        )}
        {polish >= 1 && (
          <ellipse cx={sunX} cy={sunY} rx={r * 2} ry={ry * 2} fill="url(#ss-bloom)" />
        )}
        <ellipse
          cx={sunX}
          cy={sunY}
          rx={r}
          ry={ry}
          fill={polish >= 1 ? 'url(#ss-sun-body)' : J.sun}
        />
        <ellipse
          cx={sunX - r * 0.2}
          cy={sunY - ry * 0.25}
          rx={r * 0.55}
          ry={ry * 0.5}
          fill={J.sunCore}
          opacity={0.55}
        />
      </g>
    ) : null;

  // The Sun's light on the water: a shimmering path of glints, under the Sun.
  const reflection =
    sunShown > 0.01 ? (
      <g opacity={sunShown}>
        {polish >= 1 && (
          <>
            <defs>
              <linearGradient id="ss-path" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={J.sun} stopOpacity={0.55} />
                <stop offset="1" stopColor={J.sun} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              d={`M ${sunX - r * 0.9} ${horizonY} L ${sunX + r * 0.9} ${horizonY} L ${sunX + r * 1.6} ${height} L ${sunX - r * 1.6} ${height} Z`}
              fill="url(#ss-path)"
              opacity={0.55}
            />
          </>
        )}
        {Array.from({ length: polish >= 1 ? 12 : 5 }, (_, i) => {
          const f = i / 11;
          const w =
            r *
            2 *
            (0.95 - 0.5 * f) *
            (polish >= 1 ? 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7) ** 2 : 1);
          return (
            <rect
              key={i}
              x={sunX - w / 2 + Math.sin(t * 2 + i) * 6 * u0}
              y={horizonY + (6 + i * (polish >= 1 ? 14 : 16)) * u0 * (1 + f * 2)}
              width={w}
              height={(3 + 3 * f) * u0}
              rx={2 * u0}
              fill={J.seaGlint}
              opacity={0.75 - f * 0.5}
            />
          );
        })}
      </g>
    ) : null;

  const lines: ReactNode[] = [];
  if (sunShown > 0.01 && straight > 0) {
    // The straight line everyone imagines, from the Sun across the water to the phone; it cracks
    // apart and falls away when it is shown to be wrong.
    const n = 18;
    for (let i = 0; i < n; i++) {
      const f0 = i / n;
      if (f0 > smooth(straight)) break;
      const f1 = f0 + 0.5 / n;
      const drop = crack * (40 + 120 * rnd(i, 9)) * u0;
      const x0 = lerp(sunX, phone[0], f0);
      const y0 = lerp(sunY, phone[1], f0) + drop;
      const x1 = lerp(sunX, phone[0], f1);
      const y1 = lerp(sunY, phone[1], f1) + drop;
      lines.push(
        <line
          key={`s${i}`}
          x1={x0}
          y1={y0}
          x2={x1}
          y2={y1}
          stroke={J.clockFace}
          strokeWidth={6 * u0}
          strokeLinecap="round"
          opacity={sunShown * (1 - crack)}
        />,
      );
    }
  }
  if (sunShown > 0.01 && (ride > 0 || realSun > 0)) {
    // The curved beam from the real Sun under the horizon, rising into the phone, and the straight
    // line the eye draws back along its last part, to the Sun it seems to see on the sea.
    const P0 = phone;
    const dir = [sunX - P0[0], sunY - P0[1]];
    const P1: [number, number] = [P0[0] + dir[0]! * 0.55, P0[1] + dir[1]! * 0.55];
    const P2: [number, number] = [sunX, realY];
    const shown = Math.max(ride, realSun);
    const pts = Array.from({ length: 41 }, (_, i) => {
      const s = (i / 40) * smooth(shown);
      return [
        (1 - s) ** 2 * P0[0] + 2 * (1 - s) * s * P1[0] + s * s * P2[0],
        (1 - s) ** 2 * P0[1] + 2 * (1 - s) * s * P1[1] + s * s * P2[1],
      ] as [number, number];
    });
    lines.push(
      <path
        key="bg"
        d={path(pts, false)}
        fill="none"
        stroke={J.beamGlow}
        strokeWidth={22 * u0}
        opacity={0.3 * sunShown}
        strokeLinecap="round"
      />,
      <path
        key="b"
        d={path(pts, false)}
        fill="none"
        stroke={J.beamGlow}
        strokeWidth={8 * u0}
        opacity={sunShown}
        strokeLinecap="round"
      />,
    );
  }
  if (sunShown > 0.01 && straightBack > 0) {
    const f = smooth(straightBack);
    lines.push(
      <line
        key="sb"
        x1={phone[0]}
        y1={phone[1]}
        x2={lerp(phone[0], sunX, f)}
        y2={lerp(phone[1], sunY, f)}
        stroke={J.clockFace}
        strokeWidth={6 * u0}
        strokeDasharray={`${16 * u0} ${12 * u0}`}
        strokeLinecap="round"
        opacity={sunShown}
      />,
    );
  }
  const real =
    sunShown > 0.01 && realSun > 0 ? (
      <g opacity={sunShown * clamp(realSun * 2, 0, 1)}>
        <circle cx={sunX} cy={realY} r={r * 1.5} fill={J.sunGhost} opacity={0.18} />
        <circle
          cx={sunX}
          cy={realY}
          r={r}
          fill={J.sunGhost}
          fillOpacity={0.35}
          stroke={J.sunGhost}
          strokeWidth={6 * u0}
          strokeDasharray={`${18 * u0} ${10 * u0}`}
        />
        <line
          x1={sunX - r * 2.2}
          y1={horizonY}
          x2={sunX + r * 2.2}
          y2={horizonY}
          stroke={J.clockFace}
          strokeWidth={3 * u0}
          strokeDasharray={`${10 * u0} ${8 * u0}`}
        />
      </g>
    ) : null;

  // The shimmer of warm air over the sea.
  const shimmer = thing('shimmer', 0.8);
  const waves =
    sunShown > 0.01 && shimmer > 0 ? (
      <g
        opacity={0.6 * shimmer * sunShown}
        stroke={J.duskGlow}
        fill="none"
        strokeWidth={3 * u0}
        strokeLinecap="round"
      >
        {Array.from({ length: 7 }, (_, i) => {
          const y = horizonY - (20 + i * 22) * u0;
          const x0 = width * (0.35 + 0.08 * (i % 3));
          const pts = Array.from({ length: 12 }, (_, k) => [
            x0 + k * 22 * u0,
            y + Math.sin(t * 4 + k * 0.9 + i) * 5 * u0,
          ]);
          return <path key={i} d={`M ${pts.map(([x, y2]) => `${x} ${y2}`).join(' L ')}`} />;
        })}
      </g>
    ) : null;

  // The callout: a number and a few words, pointing at a thing.
  const callout = (() => {
    const c = g.callout;
    const calloutAt = times[g.show.length];
    if (!c || calloutAt === undefined) return null;
    const p = clamp((local - calloutAt) / 10, 0, 1);
    if (p <= 0) return null;
    const glassWater = v.P(GLASS.x, GLASS.base - GLASS.h * GLASS.water);
    const anchor: [number, number] | null =
      c.at === 'sun' || c.at === 'sea'
        ? [sunX, sunY]
        : c.at === 'gap'
          ? [sunX + r * 1.1, horizonY]
          : c.at === 'straw'
            ? glassWater
            : c.at === 'screen' || c.at === 'phone' || c.at === 'you'
              ? phone
              : c.at === 'bottom'
                ? [sunX, horizonY - 2]
                : null;
    const bx = width / 2;
    const by = height * (tall ? 0.16 : 0.18);
    const sc = (0.6 + 0.4 * outBack(p)) * u0;
    const caption = c.caption?.split(' / ') ?? [];
    const size = c.value.length > 6 ? 130 : 180;
    return (
      <g opacity={clamp(p * 2.5, 0, 1)}>
        {anchor && anchor[1] > by + 150 * sc && (
          <line
            x1={bx}
            y1={by + 130 * sc}
            x2={anchor[0]}
            y2={anchor[1]}
            stroke={J.range}
            strokeWidth={4 * u0}
            strokeDasharray={`${12 * u0} ${10 * u0}`}
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
      <defs>
        <linearGradient id="ss-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.duskTop} />
          <stop offset="0.55" stopColor={J.duskMid} />
          <stop offset="1" stopColor={J.duskLow} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill="url(#ss-sky)" />
      <rect width={width} height={height} fill={J.space} opacity={space} />
      {space > 0 &&
        Array.from({ length: 60 }, (_, i) => (
          <circle
            key={i}
            cx={rnd(i, 11) * width}
            cy={rnd(i, 12) * height}
            r={(1.2 + 2 * rnd(i, 13)) * u0}
            fill={J.star}
            opacity={space * (0.3 + 0.5 * rnd(i, 14))}
          />
        ))}
      {polish >= 2 && sunShown > 0.01 && (
        <Distance
          W={width}
          H={height}
          horizonY={horizonY}
          sunX={sunX}
          t={t}
          shown={sunShown}
          shift={(cam.x - 0.0011) * v.k}
          polish={polish}
        />
      )}
      {beachSun}
      {waves}
      <Ground v={v} t={t} far={far} polish={polish} />
      {eyeLevel > 0.01 && (
        <Bay
          W={width}
          H={height}
          horizonY={horizonY}
          groundY={groundY}
          youX={v.P(0, -R)[0]}
          t={t}
          shown={eyeLevel}
        />
      )}
      {reflection}
      {polish >= 3 && eyeLevel > 0.01 && (
        <Shore W={width} t={t} shown={eyeLevel} groundY={groundY} youX={v.P(0, -R)[0]} />
      )}
      <FarSun v={v} low={thing('low-sun', 0.6)} skim={Math.max(thing('skim', 1.2), ride)} t={t} />
      {real}
      <Layers
        v={v}
        open={thing('layers', 0.9)}
        beam={thing('beam', 1.4)}
        highSun={thing('high-sun', 1.0)}
        t={t}
      />
      <Glass v={v} t={t} />
      <You v={v} t={t} ghost={ghost} polish={polish} />
      {lines}
      {polish >= 3 && <Grain W={width} H={height} t={t} />}
      {callout}
    </g>
  );
}

/** The polish the sunset world is drawn at, until Biku picks one. */
export const SUNSET_POLISH = 3;

/**
 * Far things at the horizon, behind the Sun, drawn in the picture's own space as the Sun is: long
 * sunset clouds lit pink from below, drifting; a low headland at the left; at polish 3 a distant
 * sailboat and two gulls gliding. They slide a little against the camera's moves, so the world has
 * depth.
 */
function Distance({
  W,
  H,
  horizonY,
  sunX,
  t,
  shown,
  shift,
  polish,
}: {
  W: number;
  H: number;
  horizonY: number;
  sunX: number;
  t: number;
  shown: number;
  shift: number;
  polish: number;
}) {
  const u = W / 1080;
  const span = W + 600 * u;
  const drift = (speed: number, at: number) =>
    ((((at + t * speed - shift * 0.05) % span) + span) % span) - 300 * u;
  const cloud = (cx: number, cy: number, w: number, k: number) => {
    const h = (22 + 18 * rnd(k, 31)) * u;
    return (
      <g key={k}>
        <rect x={cx - w * 0.5} y={cy} width={w} height={h} rx={h / 2} fill={J.cloudDusk} />
        <rect
          x={cx - w * 0.36 + 30 * u * rnd(k, 32)}
          y={cy - h * 0.55}
          width={w * 0.5}
          height={h}
          rx={h / 2}
          fill={J.cloudDusk}
        />
        <rect
          x={cx - w * 0.44}
          y={cy + h * 0.55}
          width={w * 0.86}
          height={h * 0.45}
          rx={h * 0.22}
          fill={J.cloudDuskLight}
        />
      </g>
    );
  };
  const s1 = shift * 0.02;
  const s2 = shift * 0.04;
  return (
    <g opacity={shown}>
      {[0, 1, 2, 3, 4, 5].map((i) =>
        cloud(
          drift(5 + i * 2, i * 230 * u),
          horizonY - (560 - i * 85) * u,
          (300 + 220 * rnd(i, 30)) * u,
          i,
        ),
      )}
      {/* The headland at the far left of the bay, and a nearer, darker one. */}
      <path
        d={`M ${-40 * u - s1} ${horizonY} L ${-40 * u - s1} ${horizonY - 120 * u} Q ${160 * u - s1} ${horizonY - 190 * u} ${420 * u - s1} ${horizonY - 40 * u} L ${480 * u - s1} ${horizonY} Z`}
        fill={J.headlandFar}
      />
      <path
        d={`M ${-40 * u - s2} ${horizonY} L ${-40 * u - s2} ${horizonY - 70 * u} Q ${100 * u - s2} ${horizonY - 110 * u} ${260 * u - s2} ${horizonY - 18 * u} L ${300 * u - s2} ${horizonY} Z`}
        fill={J.headland}
      />
      {polish >= 3 && (
        <>
          <g transform={`translate(${sunX - 330 * u + Math.sin(t * 0.4) * 10 * u} ${horizonY})`}>
            <path
              d={`M ${-24 * u} 0 L ${24 * u} 0 L ${16 * u} ${8 * u} L ${-16 * u} ${8 * u} Z`}
              fill={J.headland}
            />
            <path d={`M 0 ${-2 * u} L 0 ${-52 * u} L ${26 * u} ${-6 * u} Z`} fill={J.headland} />
            <path
              d={`M ${-3 * u} ${-6 * u} L ${-3 * u} ${-40 * u} L ${-20 * u} ${-6 * u} Z`}
              fill={J.headland}
              opacity={0.8}
            />
          </g>
          {[0, 1].map((i) => {
            const bx = ((t * 40 + i * 140) % (W + 200)) - 100;
            const by = horizonY - (320 + i * 60) * u + Math.sin(t * 2 + i) * 10 * u;
            const flap = Math.sin(t * 6 + i * 2) * 8 * u;
            return (
              <path
                key={i}
                d={`M ${bx - 18 * u} ${by - flap} Q ${bx - 8 * u} ${by - 10 * u} ${bx} ${by} Q ${bx + 8 * u} ${by - 10 * u} ${bx + 18 * u} ${by - flap}`}
                fill="none"
                stroke={J.bird}
                strokeWidth={4 * u}
                strokeLinecap="round"
              />
            );
          })}
        </>
      )}
      {/* A soft band of haze where the sky meets the sea. */}
      <rect
        x={0}
        y={horizonY - 60 * u}
        width={W}
        height={60 * u}
        fill={J.duskGlow}
        opacity={0.12}
      />
      <rect
        x={0}
        y={horizonY - 25 * u}
        width={W}
        height={25 * u}
        fill={J.duskGlow}
        opacity={0.12}
      />
      <rect width={W} height={H} fill="none" />
    </g>
  );
}

/** Small things on the sand of the bay (polish 3): shells, and tufts of dune grass in the breeze. */
function Shore({
  W,
  t,
  shown,
  groundY,
  youX,
}: {
  W: number;
  t: number;
  shown: number;
  groundY: number;
  youX: number;
}) {
  const u = W / 1080;
  return (
    <g opacity={shown}>
      {Array.from({ length: 8 }, (_, i) => {
        const x = (0.04 + 0.5 * rnd(i, 40)) * W;
        if (Math.abs(x - youX) < 60 * u) return null;
        const y = groundY + (40 + 420 * rnd(i, 41)) * u;
        const sway = (n: number) => Math.sin(t * 2 + i + n) * 3 * u;
        return i % 2 ? (
          <ellipse key={i} cx={x} cy={y} rx={9 * u} ry={5.5 * u} fill={J.shell} opacity={0.9} />
        ) : (
          <g key={i} stroke={J.grass} strokeWidth={3.5 * u} strokeLinecap="round" fill="none">
            <path
              d={`M ${x} ${y} Q ${x - 6 * u} ${y - 18 * u} ${x - 10 * u + sway(0)} ${y - 30 * u}`}
            />
            <path
              d={`M ${x} ${y} Q ${x + 2 * u} ${y - 20 * u} ${x + 4 * u + sway(1)} ${y - 34 * u}`}
            />
            <path
              d={`M ${x} ${y} Q ${x + 8 * u} ${y - 14 * u} ${x + 14 * u + sway(2)} ${y - 24 * u}`}
            />
          </g>
        );
      })}
    </g>
  );
}

/** A fine paper grain over the whole picture, and darker corners: hand-made, not machine-flat. */
function Grain({ W, H, t }: { W: number; H: number; t: number }) {
  const seed = Math.floor(t * 12) % 8;
  return (
    <g>
      <defs>
        <filter id="ss-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.12  0 0 0 0.6 0"
          />
        </filter>
        <radialGradient id="ss-vignette" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor={J.shadow} stopOpacity={0} />
          <stop offset="1" stopColor={J.shadow} stopOpacity={0.35} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} filter="url(#ss-grain)" opacity={0.18} />
      <rect width={W} height={H} fill="url(#ss-vignette)" />
    </g>
  );
}

/**
 * The bay as you see it from the beach (polish 2 and up): the sea stretching away to the horizon
 * at the height of your eyes, lighter where it meets the sky; the sand under your feet curving off
 * along the shore into the distance; the wet edge and a line of foam washing up and back along it.
 */
function Bay({
  W,
  H,
  horizonY,
  groundY,
  youX,
  t,
  shown,
}: {
  W: number;
  H: number;
  horizonY: number;
  groundY: number;
  youX: number;
  t: number;
  shown: number;
}) {
  const u = W / 1080;
  // The shore: far away at the left on the horizon, passing in front of you, near at the bottom right.
  const far: [number, number] = [-20 * u, groundY - 0.05 * H];
  const c1: [number, number] = [youX + 0.18 * W, groundY - 0.045 * H];
  const c2: [number, number] = [youX + 0.42 * W, groundY + 0.03 * H];
  const near: [number, number] = [0.9 * W, H + 20 * u];
  const shore = (dx: number) =>
    `M ${far[0]} ${far[1]} C ${c1[0] + dx} ${c1[1]} ${c2[0] + dx} ${c2[1]} ${near[0] + dx} ${near[1]}`;
  const wash = 10 * u * Math.sin(t * 1.1);
  return (
    <g opacity={shown}>
      <defs>
        <linearGradient
          id="ss-bay"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={horizonY}
          x2="0"
          y2={H}
        >
          <stop offset="0" stopColor={J.duskMid} />
          <stop offset="0.08" stopColor={J.seaDusk} />
          <stop offset="1" stopColor={J.seaDuskDeep} />
        </linearGradient>
        <linearGradient
          id="ss-beach"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={horizonY}
          x2="0"
          y2={H}
        >
          <stop offset="0" stopColor={J.sandShade} />
          <stop offset="0.25" stopColor={J.sandLit} />
          <stop offset="1" stopColor={J.sandDusk} />
        </linearGradient>
      </defs>
      <rect x={0} y={horizonY} width={W} height={H - horizonY} fill="url(#ss-bay)" />
      {/* Far swells, thin and close together near the horizon, wider apart as they come near. */}
      {Array.from({ length: 9 }, (_, i) => {
        const f = ((i + t * 0.12) % 9) / 9;
        const y = horizonY + (H - horizonY) * f * f;
        return (
          <path
            key={i}
            d={`M ${youX + 0.1 * W} ${y} L ${W} ${y}`}
            stroke={J.foam}
            strokeWidth={(1 + 3 * f) * u}
            opacity={0.12 + 0.2 * f}
          />
        );
      })}
      <path
        d={`${shore(22 * u + wash)} L ${-20 * u} ${H + 20 * u} Z`}
        fill={J.sandShade}
        opacity={0.35}
      />
      <path d={`${shore(wash)} L ${-20 * u} ${H + 20 * u} Z`} fill="url(#ss-beach)" />
      <path
        d={shore(26 * u + wash)}
        fill="none"
        stroke={J.foam}
        strokeWidth={7 * u}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d={shore(44 * u + wash * 0.6)}
        fill="none"
        stroke={J.foam}
        strokeWidth={3 * u}
        opacity={0.4}
      />
    </g>
  );
}
