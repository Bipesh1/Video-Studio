import { useId } from 'react';
import type { ReactNode } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import words from '../../../runs/2026-10-24-black-history-test/words.json';
import bh from '../../../styles/black-history/tokens.json';
import { Blended } from '../explainer/Blend';
import { clamp, outBack, smooth, zoomPath } from '../explainer/Journey';
import type { Cam } from '../explainer/Journey';
import { EXPRESSIONS, faceAtStrength } from '../face/expressions';
import { VIEWER_FONT } from '../overlays/text';
import { Character } from '../rig/Character';
import { ELBOW_DOWN } from '../rig/ik';
import { blinkAt, withLife } from '../rig/life';
import { vec } from '../rig/math';
import { poseAt } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { holdObject, stand } from '../rig/poses';
import { TonedContext } from '../rig/tone';
import { lighten, mix, shade } from '../tokens';
import { outfitFrom } from '../wardrobe/garments';

/**
 * A 15-second look test for Biku's Black history page on Facebook (2026-10-24, "do a 15 second
 * test of how it would look for the Robert Smalls ones"). Not part of any channel. Before dawn on
 * 13 May 1862 Robert Smalls, enslaved pilot of the Confederate steamer Planter, put on the
 * captain's straw hat and steered her out of Charleston harbour past Fort Sumter, sounding the
 * right whistle signal (National Park Service). One continuous camera: close on the hat by the
 * lantern, up with the hat to his face, back out of the wheelhouse to the whole ship, and on to
 * the fort. Drawn in the toned look, dignified: real proportions of the studio's figure, no
 * exaggerated features, period clothes. The voice and its word times are in
 * runs/2026-10-24-black-history-test/.
 */

const H = bh.harbor;
const font = `${VIEWER_FONT}, Arial, sans-serif`;
const FPS = 30;
type Word = { line: string; w: string; t: number; e: number };
const WORDS = words.words as Word[];
const bare = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
/** The time a word of a line is said, in seconds. */
const when = (line: string, word: string): number =>
  WORDS.find((x) => x.line === line && bare(x.w).startsWith(word))?.t ??
  WORDS.find((x) => x.line === line)?.t ??
  0;
const L1 = when('l1', 'in');
const L2 = when('l2', 'his');
const L3 = when('l3', 'before');
const T_HAT = when('l2', 'hat');
const T_NAME = when('l3', 'robert');
const T_FORT = when('l3', 'fort');
const T_SIGNAL = when('l3', 'signal');
export const SMALLS_SECONDS = Math.ceil(words.seconds + 1.2);

// ---- the world, in metres: the water's surface at 0, the ship moving right
const DECK = -1.2;
const FORT_X = 18;
const shipX = (t: number) => 0.55 * t;
/** Where Smalls stands in the wheelhouse, and the console the hat lies on, on the ship. */
const HELM = { x: 2.7, wheel: 3.62, hub: -2.35 };
const HAT_REST = { x: 3.42, y: -2.1 };
const HEAD_TOP = { x: 2.74, y: -2.93 };
const PERSON = { tall: 1.7, head: 0.493 };

type V = { cam: Cam; W: number; Ht: number; k: number };
const P = (v: V, x: number, y: number): [number, number] => [
  v.W / 2 + (x - v.cam.x) * v.k,
  v.Ht * 0.42 + (y - v.cam.y) * v.k,
];

/** A filled shape with no outline: its colour, a darker tone away from the light, a lit rim. */
function T({ d, fill, size }: { d: string; fill: string; size: number }) {
  const id = useId().replace(/:/g, '');
  const off = Math.min(size * 0.14, 0.09);
  return (
    <g>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={d} />
        </clipPath>
        <mask id={`${id}m`}>
          <path d={d} fill={H.paper} />
          <path d={d} fill={H.ink} transform={`translate(${off * 0.35} ${off * 0.35})`} />
        </mask>
      </defs>
      <path d={d} fill={fill} />
      <g clipPath={`url(#${id}c)`}>
        <path d={d} fill={shade(fill, 0.28)} />
        <path d={d} fill={fill} transform={`translate(${-off} ${-off})`} />
      </g>
      <path d={d} fill={lighten(fill, 0.25)} mask={`url(#${id}m)`} />
    </g>
  );
}

function Halo({
  x,
  y,
  r,
  colour,
  strength,
}: {
  x: number;
  y: number;
  r: number;
  colour: string;
  strength: number;
}) {
  const id = useId().replace(/:/g, '');
  if (r <= 0 || strength <= 0) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}h`}>
          <stop offset="0" stopColor={colour} stopOpacity={strength} />
          <stop offset="0.45" stopColor={colour} stopOpacity={strength * 0.4} />
          <stop offset="1" stopColor={colour} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id}h)`} />
    </g>
  );
}

const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** The camera through the 15 seconds: one move, no cuts. */
function cameraAt(t: number): Cam {
  const s = shipX(t);
  // Smalls at the wheel, lantern-lit, the hat beside him; the big words over the roof above.
  const onHat: Cam = { x: s + 3.0, y: -3.15, w: 2.25 - 0.15 * clamp(t / Math.max(1, L2)) };
  const onFace: Cam = { x: s + 2.9, y: -2.95, w: 1.9 };
  const onShip: Cam = { x: s - 0.4, y: -2.6, w: 13.5 };
  const onFort: Cam = { x: (s + 1 + FORT_X) / 2 + 0.4, y: -3.0, w: 17 };
  const leg = (a: Cam, b: Cam, from: number, to: number) =>
    zoomPath(a, b).at(smooth(clamp((t - from) / (to - from))));
  if (t < L2 + 0.25) return onHat;
  if (t < L3) return leg(onHat, onFace, L2 + 0.25, T_HAT + 0.5);
  if (t < T_FORT - 0.9) return leg(onFace, onShip, L3, L3 + 2.4);
  const c = leg(onShip, onFort, T_FORT - 0.9, T_FORT + 1.4);
  const held = clamp((t - T_FORT - 1.4) / 4);
  return { ...c, w: c.w * (1 - 0.05 * held) };
}

// ---- the sky, the town, the water

function Sky({ v, t }: { v: V; t: number }) {
  const id = useId().replace(/:/g, '');
  const dawn = 0.25 + 0.5 * clamp((t - L3) / 8);
  const [mx, my] = P(v, v.cam.x * 0.92 - 4, -12 + v.cam.y * 0.08);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={H.nightTop} />
          <stop offset="0.65" stopColor={H.nightMid} />
          <stop offset="1" stopColor={mix(H.nightLow, H.dawnGlow, 0.25 * dawn)} />
        </linearGradient>
      </defs>
      <rect width={v.W} height={v.Ht} fill={`url(#${id}s)`} />
      {/* Dawn not far off, low on the right where the sea is. */}
      <Halo
        x={v.W * 1.1}
        y={P(v, 0, 0)[1]}
        r={v.W * 1.1}
        colour={H.dawnGlow}
        strength={0.35 * dawn}
      />
      {Array.from({ length: 70 }, (_, i) => {
        const x = rnd(i, 1) * v.W;
        const y = rnd(i, 2) * v.Ht * 0.55;
        const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + rnd(i, 3) * 3) + i);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={1.2 + 1.8 * rnd(i, 4)}
            fill={H.star}
            opacity={0.35 + 0.5 * tw}
          />
        );
      })}
      <Halo x={mx} y={my} r={180} colour={H.moonGlow} strength={0.35} />
      <circle cx={mx} cy={my} r={42} fill={H.moon} />
      <circle cx={mx + 12} cy={my - 8} r={9} fill={shade(H.moon, 0.08)} />
    </g>
  );
}

/** Charleston across the water, far and pale: roofs, steeples and a few lit windows. */
function Town({ v, t }: { v: V; t: number }) {
  const depth = 0.3;
  const shift = (x: number) => v.W / 2 + (x - v.cam.x * depth) * v.k * depth;
  const base = P(v, 0, 0)[1] - 2;
  const k = v.k * depth;
  const items = Array.from({ length: 26 }, (_, i) => {
    const x = -30 + i * 2.3 + rnd(i, 5);
    const h = 1.6 + 2.4 * rnd(i, 6);
    const steeple = i % 7 === 3;
    return { x, h, steeple, i };
  });
  return (
    <g>
      {items.map((b) => {
        const sx = shift(b.x);
        const w = 1.9 * k;
        const top = base - b.h * k;
        return (
          <g key={b.i}>
            <rect x={sx} y={top} width={w} height={base - top} fill={H.skylineFar} />
            {b.steeple && (
              <path
                d={`M ${sx + w * 0.2} ${top} L ${sx + w * 0.5} ${top - 4.5 * k} L ${sx + w * 0.8} ${top} Z`}
                fill={H.skylineFar}
              />
            )}
            {rnd(b.i, 7) > 0.45 && (
              <rect
                x={sx + w * 0.35}
                y={top + (base - top) * 0.35}
                width={w * 0.18}
                height={w * 0.18}
                fill={H.windowLight}
                opacity={0.55 + 0.35 * Math.sin(t * 2 + b.i)}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

function Water({ v, t }: { v: V; t: number }) {
  const id = useId().replace(/:/g, '');
  const [, sy] = P(v, 0, 0);
  if (sy > v.Ht) return null;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={H.water} />
          <stop offset="1" stopColor={H.waterDeep} />
        </linearGradient>
      </defs>
      <rect x={0} y={sy} width={v.W} height={v.Ht - sy + 2} fill={`url(#${id}w)`} />
      {Array.from({ length: 40 }, (_, i) => {
        const wx = ((rnd(i, 8) * 60 - 20 - t * 0.3 + 60) % 60) - 20;
        const wy = 0.2 + rnd(i, 9) * 4;
        const [x, y] = P(v, wx, wy);
        if (y < sy || y > v.Ht) return null;
        const len = (0.4 + rnd(i, 10)) * v.k * (0.5 + wy * 0.15);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={len}
            height={Math.max(1.5, v.k * 0.025)}
            rx={1}
            fill={H.waterShine}
            opacity={0.25 + 0.2 * Math.sin(t * 2 + i)}
          />
        );
      })}
    </g>
  );
}

// ---- the fort

function Fort({ v, t }: { v: V; t: number }) {
  const [x0, y0] = P(v, 0, 0);
  if (P(v, FORT_X + 6, 0)[0] < -50 || P(v, FORT_X - 6, 0)[0] > v.W + 50) return null;
  const lamp = t > T_SIGNAL + 0.4 ? clamp((t - T_SIGNAL - 0.4) / 0.5) : 0;
  const swing = lamp * Math.sin((t - T_SIGNAL) * 5) * 0.25;
  return (
    <g transform={`translate(${x0} ${y0}) scale(${v.k})`}>
      <T
        d={`M ${FORT_X - 6} 0.3 L ${FORT_X - 5.2} -4.6 L ${FORT_X + 5.2} -4.6 L ${FORT_X + 6} 0.3 Z`}
        fill={H.fort}
        size={2}
      />
      <path
        d={`M ${FORT_X - 5.3} -4.6 L ${FORT_X + 5.3} -4.6 L ${FORT_X + 5.2} -4.25 L ${FORT_X - 5.2} -4.25 Z`}
        fill={H.fortTop}
      />
      {[0, 1].map((row) =>
        Array.from({ length: 8 }, (_, i) => (
          <rect
            key={`${row}${i}`}
            x={FORT_X - 4.6 + i * 1.22}
            y={-3.4 + row * 1.5}
            width={0.42}
            height={0.5}
            rx={0.08}
            fill={H.gunport}
          />
        )),
      )}
      {/* Cannon on the wall's top, dark against the sky. */}
      {[-3.2, -0.6, 2.2].map((dx) => (
        <rect
          key={dx}
          x={FORT_X + dx}
          y={-5.0}
          width={1.1}
          height={0.22}
          rx={0.1}
          fill={H.sentry}
          transform={`rotate(-8 ${FORT_X + dx} -5)`}
        />
      ))}
      <rect x={FORT_X + 4.2} y={-7.6} width={0.08} height={3.0} fill={H.pole} />
      <path
        d={`M ${FORT_X + 4.28} -7.55 q 0.6 ${0.1 + 0.08 * Math.sin(t * 3)} 1.2 0 l 0 0.75 q -0.6 ${0.08 * Math.sin(t * 3 + 1)} -1.2 0 Z`}
        fill={H.flag}
      />
      {/* A sentry with a lantern, watching the water; he lifts it when the signal is right. */}
      <g transform={`translate(${FORT_X - 2.2} -4.6)`}>
        <path d="M -0.16 0 L -0.13 -0.95 Q 0 -1.15 0.13 -0.95 L 0.16 0 Z" fill={H.sentry} />
        <circle cx={0} cy={-1.28} r={0.18} fill={H.sentry} />
        <rect x={-0.02} y={-1.9} width={0.04} height={1.6} fill={H.sentry} transform="rotate(-8)" />
        <g transform={`translate(0.32 ${-0.55 - 0.35 * lamp}) rotate(${swing * 60})`}>
          <Halo x={0} y={0} r={1.1} colour={H.lantern} strength={0.65} />
          <rect x={-0.08} y={-0.1} width={0.16} height={0.2} rx={0.03} fill={H.lanternCore} />
        </g>
      </g>
    </g>
  );
}

// ---- the ship

function Smoke({ v, t, s }: { v: V; t: number; s: number }) {
  return (
    <g>
      {[-0.8, -0.15].map((sx, j) =>
        Array.from({ length: 10 }, (_, i) => {
          const life = (t * 0.35 + i / 10 + j * 0.05) % 1;
          const x = s + sx - life * 4.5 - 0.2 * Math.sin(i + t);
          const y = -6.7 - life * 2.6;
          const r = 0.25 + life * 0.9;
          const [cx, cy] = P(v, x, y);
          return (
            <circle
              key={`${j}${i}`}
              cx={cx}
              cy={cy}
              r={r * v.k}
              fill={H.smoke}
              opacity={0.55 * (1 - life)}
            />
          );
        }),
      )}
    </g>
  );
}

function Whistle({ v, t, s }: { v: V; t: number; s: number }) {
  const u = t - T_SIGNAL;
  if (u < 0 || u > 2.2) return null;
  const [x, y] = P(v, s - 0.15, -6.9);
  const puff = clamp(u / 0.3) * (1 - clamp((u - 1.4) / 0.8));
  return (
    <g>
      <circle
        cx={x + 0.4 * v.k * u}
        cy={y - 0.5 * v.k * u}
        r={(0.3 + 0.6 * u) * v.k}
        fill={H.steam}
        opacity={0.75 * puff}
      />
      {[0, 1, 2].map((i) => {
        const r = (0.6 + (u - i * 0.25) * 3.2) * v.k;
        const o = clamp(1 - (u - i * 0.25) / 1.4);
        return u > i * 0.25 ? (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill="none"
            stroke={H.steam}
            strokeWidth={0.06 * v.k}
            opacity={0.6 * o}
          />
        ) : null;
      })}
    </g>
  );
}

function Ship({ v, t, children }: { v: V; t: number; children: ReactNode }) {
  const s = shipX(t);
  const [x0, y0] = P(v, s, 0);
  const bob = 0.04 * Math.sin(t * 1.6);
  const wheel = t * 2.2;
  return (
    <g>
      <Smoke v={v} t={t} s={s} />
      <g transform={`translate(${x0} ${y0 + bob * v.k}) scale(${v.k})`}>
        {/* The hull, low and long, the bow to the right, a gold stripe along it. */}
        <T
          d="M -6.4 -1.25 L 4.0 -1.25 Q 5.2 -1.2 5.6 -0.95 Q 4.9 0.35 3.6 0.55 L -6.0 0.55 Q -6.6 -0.2 -6.4 -1.25 Z"
          fill={H.hull}
          size={1.2}
        />
        <rect x={-6.3} y={-0.95} width={10.9} height={0.08} fill={H.hullStripe} />
        {/* The stacks, smoking, a red band near the top of each. */}
        {[-0.8, -0.15].map((sx) => (
          <g key={sx}>
            <T d={rr(sx - 0.22, -6.8, 0.44, 5.6, 0.06)} fill={H.stack} size={0.3} />
            <rect x={sx - 0.22} y={-6.2} width={0.44} height={0.3} fill={H.stackBand} />
          </g>
        ))}
        {/* The deck house and rails. */}
        <T d={rr(-5.6, -2.3, 7.0, 1.1, 0.08)} fill={H.wheelhouse} size={0.6} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x={-5.3 + i * 0.55}
            y={-2.0}
            width={0.28}
            height={0.38}
            rx={0.05}
            fill={H.lantern}
            opacity={i % 3 ? 0.18 : 0.55}
          />
        ))}
        <rect x={-6.2} y={-2.55} width={10.2} height={0.05} fill={H.rail} />
        {/* The paddle box over the side wheel, its rays turning. */}
        <T d="M -2.4 -0.2 A 1.75 1.75 0 0 1 1.1 -0.2 Z" fill={H.paddleBox} size={1.2} />
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI * (i / 8) + (wheel % (Math.PI / 8));
          return (
            <line
              key={i}
              x1={-0.65}
              y1={-0.25}
              x2={-0.65 - Math.cos(a) * 1.55}
              y2={-0.25 - Math.sin(a) * 1.55}
              stroke={H.paddleRay}
              strokeWidth={0.06}
              opacity={0.8}
            />
          );
        })}
        {/* The wheelhouse at the front, open to us: its back wall, lantern and console. */}
        <T d={rr(1.75, -4.1, 2.1, 2.9, 0.06)} fill={H.wheelhouse} size={1.0} />
        <rect x={1.95} y={-3.85} width={1.7} height={2.55} fill={H.wheelhouseIn} />
        <T d={rr(1.55, -4.35, 2.5, 0.3, 0.08)} fill={shade(H.wheelhouse, 0.15)} size={0.3} />
        <g transform={`rotate(${4 * Math.sin(t * 1.3)} 2.9 -3.75)`}>
          <line x1={2.9} y1={-3.85} x2={2.9} y2={-3.45} stroke={H.pole} strokeWidth={0.02} />
          <Halo x={2.9} y={-3.35} r={1.6} colour={H.lantern} strength={0.55} />
          <rect x={2.83} y={-3.48} width={0.14} height={0.2} rx={0.03} fill={H.lanternCore} />
        </g>
        <T d={rr(3.15, -2.15, 0.6, 0.95, 0.05)} fill={H.wheel} size={0.3} />
      </g>
      {/* Smalls, in the captain's coat, at the helm. */}
      {children}
      <g transform={`translate(${x0} ${y0 + bob * v.k}) scale(${v.k})`}>
        <g transform={`rotate(${(t * 25) % 360} ${HELM.wheel} ${HELM.hub})`}>
          <circle
            cx={HELM.wheel}
            cy={HELM.hub}
            r={0.42}
            fill="none"
            stroke={H.wheel}
            strokeWidth={0.06}
          />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={HELM.wheel}
                y1={HELM.hub}
                x2={HELM.wheel + Math.cos(a) * 0.55}
                y2={HELM.hub + Math.sin(a) * 0.55}
                stroke={H.wheel}
                strokeWidth={0.05}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </g>
      <Whistle v={v} t={t} s={s} />
    </g>
  );
}

// ---- Robert Smalls and the hat

/** Reaching up to put the hat on. */
const hatOn: Pose = {
  id: 'hat-on',
  headTilt: -3,
  arms: {
    front: { reach: vec(0.2, -1.3), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: { upper: -12, lower: 8 },
  },
  legs: stand.legs,
};

/** The hat on the console, then lifted to his head on "hat". */
const hatPath = (t: number): { x: number; y: number; on: boolean; lift: number } => {
  const from = L2 + 0.35;
  const to = T_HAT + 0.15;
  const u = smooth(clamp((t - from) / Math.max(0.3, to - from)));
  const x = HAT_REST.x + (HEAD_TOP.x - HAT_REST.x) * u;
  const y = HAT_REST.y + (HEAD_TOP.y - HAT_REST.y) * u - 0.35 * Math.sin(Math.PI * u);
  return { x, y, on: t >= to, lift: u };
};

function StrawHat({ x, y, k, tilt }: { x: number; y: number; k: number; tilt: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${k}) rotate(${tilt})`}>
      <T d="M -0.38 0 Q 0 -0.06 0.38 0 Q 0 0.07 -0.38 0 Z" fill={H.straw} size={0.12} />
      <T
        d="M -0.17 -0.02 Q -0.17 -0.17 0 -0.18 Q 0.17 -0.17 0.17 -0.02 Z"
        fill={H.straw}
        size={0.15}
      />
      <path
        d="M -0.19 -0.07 Q 0 -0.03 0.19 -0.07 L 0.19 -0.03 Q 0 0.01 -0.19 -0.03 Z"
        fill={H.strawBand}
      />
    </g>
  );
}

const SMALLS_IDENTITY = {
  skinTone: 6,
  hair: 'short-crop',
  hairColor: 'black',
  facialHair: 'moustache',
} as const;
const COAT = outfitFrom({
  top: { kind: 'jacket', cloth: 'denim', under: 'cream' },
  bottom: { kind: 'trousers', cloth: 'brown' },
  shoes: { kind: 'boots', cloth: 'brown' },
});
const COAT_HAT = outfitFrom({
  top: { kind: 'jacket', cloth: 'denim', under: 'cream' },
  bottom: { kind: 'trousers', cloth: 'brown' },
  shoes: { kind: 'boots', cloth: 'brown' },
  hat: { kind: 'brim-hat', cloth: 'gold' },
});

function Smalls({ v, t, frame }: { v: V; t: number; frame: number }) {
  const s = shipX(t);
  const bob = 0.04 * Math.sin(t * 1.6);
  const [x, y] = P(v, s + HELM.x, DECK + bob);
  const hat = hatPath(t);
  const keys = [
    { frame: -1000, pose: holdObject },
    { frame: Math.round((L2 + 0.3) * FPS), pose: hatOn },
    { frame: Math.round((T_HAT + 0.35) * FPS), pose: holdObject },
  ];
  const pose = withLife(poseAt(frame, keys), frame, FPS, 13);
  const head = PERSON.head * v.k;
  const [hx, hy] = P(v, s + hat.x, hat.y + bob);
  return (
    <g>
      <Blended id="bh-smalls" u={Math.min(2.2, Math.max(0.35, head / 120))} light={H.lantern}>
        <Character
          x={x}
          groundY={y}
          head={head}
          facing="right"
          pose={pose}
          face={faceAtStrength(EXPRESSIONS.determined, 0.35)}
          eyeStyle="round"
          turn={0.45}
          blink={blinkAt(frame, FPS, 13)}
          identity={SMALLS_IDENTITY}
          outfit={hat.on ? COAT_HAT : COAT}
          lookAt={{ x: 1.5, y: -0.1 }}
        />
      </Blended>
      {!hat.on && <StrawHat x={hx} y={hy} k={v.k * 0.95} tilt={-8 + 14 * hat.lift} />}
    </g>
  );
}

// ---- words on the screen

function Pill({
  x,
  y,
  text,
  shown,
  gold,
}: {
  x: number;
  y: number;
  text: string;
  shown: number;
  gold?: boolean;
}) {
  if (shown <= 0) return null;
  const s = 0.75 + 0.25 * outBack(clamp(shown));
  const w = text.length * 25 + 56;
  return (
    <g
      transform={`translate(${Math.min(1080 - w / 2 - 70, Math.max(w / 2 + 70, x))} ${y}) scale(${s})`}
      opacity={clamp(shown * 3)}
    >
      <rect x={-w / 2} y={-34} width={w} height={62} rx={31} fill={gold ? H.gold : H.ink} />
      <text
        x={0}
        y={12}
        fontFamily={font}
        fontWeight={800}
        fontSize={38}
        fill={gold ? H.ink : H.paper}
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  );
}

/** The opening question in big words, then the captions, two or three words at a time. */
function Words({ t }: { t: number }) {
  if (t < L2 - 0.1) {
    const lines = ['AN ENSLAVED MAN', 'STOLE A', 'CONFEDERATE SHIP'];
    const shown = clamp((t - L1 + 0.2) / 0.3);
    return (
      <g opacity={shown * (1 - clamp((t - L2 + 0.4) / 0.3))}>
        {lines.map((l, i) => (
          <text
            key={i}
            x={540}
            y={360 + i * 112}
            fontFamily={font}
            fontWeight={800}
            fontSize={i === 1 ? 84 : 92}
            fill={i === 2 ? H.gold : H.paper}
            stroke={H.ink}
            strokeWidth={16}
            paintOrder="stroke"
            strokeLinejoin="round"
            textAnchor="middle"
            transform={`translate(0 ${(1 - outBack(clamp((t - L1 - i * 0.25) / 0.35))) * 40})`}
          >
            {l}
          </text>
        ))}
      </g>
    );
  }
  const spoken = WORDS.filter((w) => w.line !== 'l1');
  const pages: Word[][] = [];
  for (const w of spoken) {
    const page = pages.at(-1);
    if (
      !page ||
      page.length >= 3 ||
      page[0]?.line !== w.line ||
      /[,.?]$/.test(page.at(-1)?.w ?? '')
    )
      pages.push([w]);
    else page.push(w);
  }
  const page = [...pages].reverse().find((p) => (p[0]?.t ?? 0) <= t + 0.05);
  if (!page) return null;
  const end = page.at(-1)?.e ?? 0;
  if (t > end + 0.6) return null;
  const gold = ['straw', 'hat', 'sumter', 'signal', 'smalls'];
  return (
    <text
      x={540}
      y={1300}
      fontFamily={font}
      fontWeight={800}
      fontSize={74}
      textAnchor="middle"
      stroke={H.ink}
      strokeWidth={14}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {page.map((w, i) => (
        <tspan key={i} fill={gold.includes(bare(w.w)) ? H.gold : H.paper}>
          {`${i ? ' ' : ''}${w.w.replace(/[.,?]$/, '')}`}
        </tspan>
      ))}
    </text>
  );
}

export function SmallsTest() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame / FPS;
  const cam = cameraAt(t);
  const v: V = { cam, W: width, Ht: height, k: width / cam.w };
  const s = shipX(t);
  const [nx, ny] = P(v, s + HELM.x, -3.5);
  const [fx, fy] = P(v, FORT_X, -5.2);
  return (
    <TonedContext.Provider value>
      <g>
        <Sky v={v} t={t} />
        <Town v={v} t={t} />
        <Water v={v} t={t} />
        <Fort v={v} t={t} />
        <Ship v={v} t={t}>
          <Smalls v={v} t={t} frame={frame} />
        </Ship>
        <Pill
          x={nx}
          y={Math.max(330, ny)}
          text="ROBERT SMALLS"
          shown={clamp((t - T_NAME) / 0.3) * (1 - clamp((t - T_FORT + 0.4) / 0.3))}
          gold
        />
        <Pill
          x={fx}
          y={Math.max(330, fy)}
          text="FORT SUMTER"
          shown={clamp((t - T_FORT - 0.2) / 0.3)}
        />
        <Pill
          x={540}
          y={300}
          text="CHARLESTON HARBOR, MAY 13, 1862"
          shown={clamp((t - L3) / 0.3) * (1 - clamp((t - T_NAME + 0.2) / 0.3))}
        />
        <Words t={t} />
      </g>
    </TonedContext.Provider>
  );
}
