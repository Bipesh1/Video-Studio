import type { JOURNEY_STOPS } from '@studio/shared';
import type { Graphic, JourneyStop, JourneyThing } from '@studio/shared';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { EXPRESSIONS, blendFace } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { blinkAt, withLife } from '../rig/life';
import { ELBOW_DOWN } from '../rig/ik';
import { vec } from '../rig/math';
import { poseAt, resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { handsUp, openArms, point, stand, wave } from '../rig/poses';
import { TonedContext } from '../rig/tone';
import { lighten, mix, shade } from '../tokens';
import { outfitFrom } from '../wardrobe/garments';
import { skinColors } from '../wardrobe/identity';
import { Blended } from './Blend';
import { J, MASCOT_HEAD, Mascot, Tag, at, font, pxOf, rnd } from './bodyKit';
import { clamp, outBack, smooth, viewOf, zoomPath } from './Journey';
import type { Cam, View } from './Journey';
import { wordCamera } from './wordCamera';

/**
 * The world `memory` (2026-10-23, "Your First Memory Might Never Have Happened", Biku's script):
 * the first Short drawn in the toned look he picked (look 2: no outlines, every shape in tones
 * of its own colour, lights that glow), staged after the Kurzgesagt study (big subjects, a calm
 * camera, things that react).
 *
 * Three places, each in metres (2026-10-24, rebuilt for one continuous camera after Biku: "most
 * of the time it should be continuous camera shots", and a third Kurzgesagt Short):
 *   mind    you in a dusk, your memory bubble over you with the garden in it, a second bubble
 *           of you being born; your head as an x-ray with a small toddler brain in it; then the
 *           crowd you stand in, exactly 6,641 people with a bubble each; the age ruler
 *   garden  the pram memory full size: a sunny garden, the old pram, the baby under a yellow
 *           blanket with a cupcake; it tips to be seen from above, then dives in to the baby's
 *           own view, the hood, the sky and the baby's own hands round the cupcake
 *   home    the family album on a table, and the dinner table where the story is told
 * The garden is the one inside your bubble: the camera flies into the bubble and it opens round
 * you into the garden, and flies back out of the garden as it closes into the bubble over your
 * head (a door, `toGarden` and `toMind`). Home is reached by a lens on the photo and left by a
 * lens closing into the bubble (transitions of the shots).
 */

type Journey = Extract<Graphic, { kind: 'journey' }>;
type MemoryStop = (typeof JOURNEY_STOPS)['memory'][number];
type Place = 'mind' | 'garden' | 'home';

const GARDEN_X = 200;
const HOME_X = 300;
/** Your memory bubble and the bubble of you being born, over your head in the dusk. */
const BUBBLE = { x: 0.88, y: -2.62, r: 0.56 };
const NEWBORN = { x: -0.86, y: -2.66, r: 0.44 };
/** A unit of the garden inside your bubble, in the mind's metres (GardenIn in Mind). */
const BUB_S = BUBBLE.r / 1.3;
/** The same camera, from the mind to the garden inside the bubble, and back. */
const toGarden = (c: Cam): Cam => ({
  x: GARDEN_X + (c.x - BUBBLE.x) / BUB_S,
  y: (c.y - BUBBLE.y) / BUB_S - 0.1,
  w: c.w / BUB_S,
});
const toMind = (c: Cam): Cam => ({
  x: BUBBLE.x + (c.x - GARDEN_X) * BUB_S,
  y: BUBBLE.y + (c.y + 0.1) * BUB_S,
  w: c.w * BUB_S,
});
/** The age ruler beside you: a stick with three candles at ages one, two and three. */
const RULER = { x: -0.98, y1: -0.95, step: 0.62 };
/** The crowd: 83 across and 80 deep, and you in the middle, makes 6,641. */
const CROWD = { cols: 41, rows: 40, dx: 1.2, dy: 1.75 };
const SKIN = skinColors(4);

/** Each stop: its place and where the camera looks, laid out for the tall picture. */
function stopOf(stop: JourneyStop, tall: boolean): { place: Place; cam: Cam } {
  const k = tall ? 1 : 1.9;
  const in_ = (place: Place, x: number, y: number, w: number) => ({
    place,
    cam: { x, y, w: w * k },
  });
  switch (stop as MemoryStop) {
    case 'you':
      return in_('mind', 0.35, -2.05, 2.7);
    case 'bubble':
      return in_('mind', BUBBLE.x - 0.05, BUBBLE.y + 0.05, 1.55);
    case 'newborn-bubble':
      return in_('mind', -0.25, -2.1, 2.9);
    case 'ruler':
      return in_('mind', -0.05, -1.75, 3.3);
    case 'crowd-near':
      return in_('mind', 0.25, -2.0, 6.8);
    case 'crowd':
      return in_('mind', 0.35, -2.7, 12);
    case 'head':
      return in_('mind', -0.45, -1.62, 2.0);
    case 'toddler-brain':
      return in_('mind', 0.02, -1.53, 0.8);
    case 'garden':
      return in_('garden', GARDEN_X, -0.55, 4.1);
    case 'pram-above':
      return in_('garden', GARDEN_X, -0.55, 4.1);
    case 'pram-inside':
      return in_('garden', GARDEN_X, -0.55, 4.1);
    case 'photo-back':
      return in_('mind', 0.62, -1.15, 1.75);
    case 'album':
      return in_('home', HOME_X - 1.1, -0.85, 1.9);
    case 'dinner':
      return in_('home', HOME_X + 2.2, -1.35, 3.6);
    default:
      return in_('mind', 0.3, -1.55, 2.7);
  }
}

/**
 * How many frames the flight between two stops takes: through the bubble between your mind and
 * the garden it holds, a little under two seconds; none to or from home (a lens does that).
 */
export function memoryFlightFrames(from: JourneyStop, to: JourneyStop, fps: number): number {
  if (from === to) return 0;
  const a = stopOf(from, true);
  const b = stopOf(to, true);
  if (a.place !== b.place) {
    const door = [a.place, b.place].sort().join('-') === 'garden-mind';
    return door ? Math.round(fps * 1.8) : 0;
  }
  return Math.round(fps * clamp(0.9 + 0.12 * zoomPath(a.cam, b.cam).S, 1.1, 2.4));
}

type S = {
  t: number;
  local: number;
  fps: number;
  thing: (name: JourneyThing, seconds?: number) => number;
  since: (name: JourneyThing) => number;
  /** True when the shot shows or keeps a thing, before its word as well as after. */
  has: (name: JourneyThing) => boolean;
  stop: string;
};

// ============================================================================================
// The toned look in a world: a shape in tones of its own colour, lit from the upper left.

/** A filled shape with no outline: its colour, a darker tone away from the light, a lit rim. */
function T({
  d,
  fill,
  size,
  far = 0,
  rim = true,
  opacity,
}: {
  d: string;
  fill: string;
  /** About the shape's radius, in the units it is drawn in. */
  size: number;
  /** 0 near, 1 far: paler. */
  far?: number;
  rim?: boolean;
  opacity?: number;
}) {
  const id = useId().replace(/:/g, '');
  const base = far > 0 ? mix(fill, J.mindLow, 0.35 * far) : fill;
  const off = Math.min(size * 0.14, 0.09);
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`${id}c`}>
          <path d={d} />
        </clipPath>
        {rim && (
          <mask id={`${id}m`}>
            <path d={d} fill={J.mirrorShine} />
            <path d={d} fill={J.scaleScreen} transform={`translate(${off * 0.35} ${off * 0.35})`} />
          </mask>
        )}
      </defs>
      <path d={d} fill={base} />
      <g clipPath={`url(#${id}c)`}>
        <path d={d} fill={mix(shade(base, 0.24), J.mindMid, 0.08)} />
        <path d={d} fill={base} transform={`translate(${-off} ${-off})`} />
      </g>
      {rim && <path d={d} fill={lighten(base, 0.32)} mask={`url(#${id}m)`} />}
    </g>
  );
}

const circ = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const ell = (cx: number, cy: number, rx: number, ry: number) =>
  `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
/** A soft, uneven round shape: a cloud, a bush, a brain's lobe. */
const blob = (cx: number, cy: number, r: number, seed: number, wobble = 0.1, squash = 1, n = 9) => {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wobble * (rnd(seed, i) * 2 - 1);
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k * squash] as const;
  });
  const mid = (a: readonly number[], b: readonly number[]) => [
    ((a[0] ?? 0) + (b[0] ?? 0)) / 2,
    ((a[1] ?? 0) + (b[1] ?? 0)) / 2,
  ];
  const first = mid(pts[n - 1] ?? [0, 0], pts[0] ?? [0, 0]);
  let d = `M ${first[0]} ${first[1]}`;
  pts.forEach((p, i) => {
    const m = mid(p, pts[(i + 1) % n] ?? p);
    d += ` Q ${p[0]} ${p[1]} ${m[0]} ${m[1]}`;
  });
  return `${d} Z`;
};
const spring = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-5.5 * t) * Math.cos(9 * t));

/** A soft light: a circle of colour fading out. */
function Halo({
  x,
  y,
  r,
  colour,
  strength = 0.5,
}: {
  x: number;
  y: number;
  r: number;
  colour: string;
  strength?: number;
}) {
  const id = useId().replace(/:/g, '');
  if (strength <= 0 || r <= 0) return null;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}h`}>
          <stop offset="0" stopColor={colour} stopOpacity={strength} />
          <stop offset="0.45" stopColor={colour} stopOpacity={strength * 0.45} />
          <stop offset="1" stopColor={colour} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${id}h)`} />
    </g>
  );
}

// ============================================================================================
// The garden memory: drawn in its own units (4 across, the lawn's edge at 0.55), so the same
// drawing fills the bubble, the photo and the screen.

/** The baby's head in the pram: your skin and hair, small. */
function BabyHead({
  x,
  y,
  r,
  blow,
  look = 0,
}: {
  x: number;
  y: number;
  r: number;
  blow: number;
  look?: number;
}) {
  const hair = J.trousers;
  return (
    <g>
      {Array.from({ length: 6 }, (_, i) => (
        <circle
          key={i}
          cx={x - r * 0.55 + i * r * 0.22}
          cy={y - r * 0.82 + Math.abs(i - 2.5) * r * 0.06}
          r={r * 0.26}
          fill={hair}
        />
      ))}
      <T d={circ(x, y, r)} fill={SKIN.skin} size={r} />
      <circle cx={x - r * 0.45} cy={y + r * 0.22} r={r * 0.16} fill={J.frosting} opacity={0.45} />
      <circle cx={x + r * 0.45} cy={y + r * 0.22} r={r * 0.16} fill={J.frosting} opacity={0.45} />
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse
            cx={x + s * r * 0.33 + look * r * 0.1}
            cy={y - r * 0.05}
            rx={r * 0.17}
            ry={r * 0.21}
            fill={J.photoPaper}
          />
          <circle
            cx={x + s * r * 0.33 + look * r * 0.16}
            cy={y - r * 0.02}
            r={r * 0.1}
            fill={J.trousers}
          />
          <circle
            cx={x + s * r * 0.33 + look * r * 0.16 - r * 0.035}
            cy={y - r * 0.06}
            r={r * 0.035}
            fill={J.photoPaper}
          />
        </g>
      ))}
      {blow > 0 ? (
        <ellipse
          cx={x + r * 0.08}
          cy={y + r * 0.45}
          rx={r * 0.1}
          ry={r * 0.12}
          fill={shade(SKIN.skin, 0.45)}
        />
      ) : (
        <path
          d={`M ${x - r * 0.18} ${y + r * 0.38} Q ${x} ${y + r * 0.56} ${x + r * 0.18} ${y + r * 0.38}`}
          fill="none"
          stroke={shade(SKIN.skin, 0.45)}
          strokeWidth={r * 0.07}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/** A cupcake with one candle; the flame goes out as the baby blows (out 0 to 1). */
function Cupcake({ x, y, s, out, t }: { x: number; y: number; s: number; out: number; t: number }) {
  const flicker = 1 + 0.12 * Math.sin(t * 23) + 0.06 * Math.sin(t * 37);
  const lean = out > 0 ? -25 * Math.min(1, out * 3) : 4 * Math.sin(t * 9);
  const flame = 1 - smooth(out * 1.6);
  return (
    <g>
      <T
        d={`M ${x - s * 0.5} ${y} L ${x + s * 0.5} ${y} L ${x + s * 0.38} ${y + s * 0.62} L ${x - s * 0.38} ${y + s * 0.62} Z`}
        fill={J.cake}
        size={s * 0.5}
      />
      {[-0.25, 0, 0.25].map((k) => (
        <line
          key={k}
          x1={x + s * k}
          y1={y + s * 0.05}
          x2={x + s * k * 0.8}
          y2={y + s * 0.58}
          stroke={shade(J.cake, 0.2)}
          strokeWidth={s * 0.06}
        />
      ))}
      <T d={blob(x, y - s * 0.12, s * 0.56, 4, 0.12, 0.62)} fill={J.frosting} size={s * 0.5} />
      <T
        d={rr(x - s * 0.07, y - s * 0.85, s * 0.14, s * 0.62, s * 0.05)}
        fill={J.candle}
        size={s * 0.1}
        rim={false}
      />
      {flame > 0.02 && (
        <g transform={`translate(${x} ${y - s * 0.88}) rotate(${lean}) scale(${flame * flicker})`}>
          <Halo x={0} y={-s * 0.18} r={s * 0.75} colour={J.flame} strength={0.55} />
          <path
            d={`M 0 ${-s * 0.42} Q ${s * 0.17} ${-s * 0.12} 0 0 Q ${-s * 0.17} ${-s * 0.12} 0 ${-s * 0.42} Z`}
            fill={J.flame}
          />
          <path
            d={`M 0 ${-s * 0.26} Q ${s * 0.08} ${-s * 0.08} 0 0 Q ${-s * 0.08} ${-s * 0.08} 0 ${-s * 0.26} Z`}
            fill={J.flameCore}
          />
        </g>
      )}
      {out > 0.3 && (
        <path
          d={`M ${x} ${y - s * 0.9} q ${s * 0.15} ${-s * 0.25} 0 ${-s * 0.5} q ${-s * 0.15} ${-s * 0.25} ${s * 0.05} ${-s * 0.5}`}
          fill="none"
          stroke={J.gasLight}
          strokeWidth={s * 0.06}
          strokeLinecap="round"
          opacity={0.7 * (1 - smooth((out - 0.3) * 1.2))}
          transform={`translate(0 ${-s * 0.3 * out})`}
        />
      )}
    </g>
  );
}

/** A spoked pram wheel, turning a little as if just pushed. */
function Wheel({ x, y, r, turn }: { x: number; y: number; r: number; turn: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={J.pramTyre} />
      <circle cx={x} cy={y} r={r * 0.8} fill={shade(J.pramChrome, 0.35)} />
      <circle cx={x} cy={y} r={r * 0.72} fill={J.pramTyre} opacity={0.6} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + turn;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x + Math.cos(a) * r * 0.76}
            y2={y + Math.sin(a) * r * 0.76}
            stroke={J.pramSpoke}
            strokeWidth={r * 0.045}
          />
        );
      })}
      <circle cx={x} cy={y} r={r * 0.12} fill={J.pramChrome} />
      <path
        d={`M ${x - r * 0.7} ${y - r * 0.55} A ${r * 0.9} ${r * 0.9} 0 0 1 ${x + r * 0.2} ${y - r * 0.88}`}
        fill="none"
        stroke={lighten(J.pramTyre, 0.35)}
        strokeWidth={r * 0.07}
        strokeLinecap="round"
      />
    </g>
  );
}

/** The sky, the hedge, the tree and the lawn of the memory. */
function GardenBack({ t, tint = 0 }: { t: number; tint?: number }) {
  const id = useId().replace(/:/g, '');
  const clouds = [
    { x: -1.2, y: -1.75, r: 0.32 },
    { x: 0.9, y: -1.95, r: 0.26 },
    { x: 2.3, y: -1.5, r: 0.3 },
  ];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.memSky} />
          <stop offset="1" stopColor={J.memSkyLow} />
        </linearGradient>
      </defs>
      <rect x={-2.6} y={-4.8} width={5.2} height={5.5} fill={`url(#${id}sky)`} />
      <Halo x={-1.35} y={-1.7} r={1.4} colour={J.memCloud} strength={0.65} />
      {clouds.map((c, i) => {
        const x = ((c.x + t * 0.04 + 2.6) % 5.2) - 2.6;
        return (
          <g key={i}>
            <T d={blob(x, c.y, c.r, 30 + i, 0.08, 0.55)} fill={J.memCloud} size={c.r} />
            <T
              d={blob(x + c.r * 0.7, c.y + c.r * 0.12, c.r * 0.7, 40 + i, 0.1, 0.6)}
              fill={J.memCloud}
              size={c.r * 0.7}
            />
          </g>
        );
      })}
      {/* The far hedge, paler, then the tree. */}
      <T
        d={`M -2.6 0.6 L -2.6 0.05 ${Array.from({ length: 14 }, (_, i) => `Q ${-2.6 + i * 0.4 + 0.2} ${-0.12 - 0.08 * rnd(i, 3)} ${-2.6 + (i + 1) * 0.4} ${0.05}`).join(' ')} L 2.6 0.6 Z`}
        fill={J.memHedge}
        size={0.25}
        far={0.4}
      />
      <T d={rr(1.42, -0.85, 0.16, 1.15, 0.06)} fill={J.memTrunk} size={0.1} />
      <T d={blob(1.5, -1.05, 0.55, 12, 0.14, 0.85, 11)} fill={J.memTree} size={0.55} />
      <T d={blob(1.2, -0.85, 0.36, 13, 0.14, 0.85)} fill={J.memTree} size={0.36} />
      <T d={blob(1.82, -0.8, 0.34, 14, 0.14, 0.85)} fill={J.memTree} size={0.34} />
      {/* The lawn, mown in stripes. */}
      <rect x={-2.6} y={0.48} width={5.2} height={4} fill={J.memGrass} />
      {Array.from({ length: 7 }, (_, i) => (
        <path
          key={i}
          d={`M ${-2.9 + i * 0.85} 4.4 L ${-2.3 + i * 0.85} 0.48 L ${-1.95 + i * 0.85} 0.48 L ${-2.5 + i * 0.85} 4.4 Z`}
          fill={J.memGrassShade}
          opacity={0.22}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <circle
          key={i}
          cx={-2.4 + rnd(i, 5) * 4.8}
          cy={0.6 + rnd(i, 6) * 0.8}
          r={0.025}
          fill={J.photoPaper}
        />
      ))}
      {tint > 0 && (
        <rect x={-2.6} y={-4.8} width={5.2} height={9.2} fill={J.photoTint} opacity={0.28 * tint} />
      )}
    </g>
  );
}

/** The old pram from the side, with the baby under the yellow blanket holding a cupcake. */
function PramSide({ t, blow }: { t: number; blow: number }) {
  const rock = Math.sin(t * 1.3) * 1.2;
  return (
    <g transform={`rotate(${rock} -0.1 0.62)`}>
      <ellipse cx={-0.1} cy={0.93} rx={1.05} ry={0.08} fill={J.memGrassShade} opacity={0.6} />
      {/* The chassis and its springs, the handle up to the right. */}
      <path
        d="M -0.6 0.6 Q -0.1 0.4 0.4 0.6"
        fill="none"
        stroke={J.pramChrome}
        strokeWidth={0.05}
      />
      <path
        d="M 0.5 -0.05 L 1.05 -0.62"
        stroke={J.pramChrome}
        strokeWidth={0.055}
        strokeLinecap="round"
      />
      <T d={rr(0.97, -0.72, 0.28, 0.1, 0.05)} fill={J.pramTyre} size={0.06} />
      <Wheel x={-0.6} y={0.62} r={0.29} turn={t * 0.4} />
      <Wheel x={0.38} y={0.64} r={0.27} turn={t * 0.4 + 1} />
      {/* The body, deep like a boat. */}
      <T
        d="M -0.85 -0.15 L 0.62 -0.15 Q 0.66 0.3 0.25 0.42 L -0.55 0.42 Q -0.92 0.3 -0.85 -0.15 Z"
        fill={J.pram}
        size={0.45}
      />
      <path
        d="M -0.78 0.06 L 0.58 0.06"
        stroke={lighten(J.pram, 0.35)}
        strokeWidth={0.025}
        opacity={0.6}
      />
      {/* The baby, the cupcake, the blanket over them. */}
      <BabyHead x={0.06} y={-0.31} r={0.21} blow={blow} />
      <Cupcake x={0.4} y={-0.27} s={0.17} out={blow} t={t} />
      <T d={blob(0.29, -0.2, 0.07, 9, 0.1)} fill={SKIN.skin} size={0.07} />
      <T
        d="M -0.72 -0.2 Q -0.4 -0.3 -0.15 -0.18 Q 0.1 -0.08 0.35 -0.16 Q 0.5 -0.2 0.62 -0.14 L 0.6 0.04 Q 0.1 0.12 -0.75 0.02 Z"
        fill={J.blanket}
        size={0.22}
      />
      <path
        d="M -0.5 -0.17 Q -0.4 -0.05 -0.48 0.04 M 0.12 -0.11 Q 0.2 -0.02 0.14 0.07"
        fill="none"
        stroke={shade(J.blanket, 0.18)}
        strokeWidth={0.025}
        strokeLinecap="round"
      />
      {/* The hood, folded up behind the baby. */}
      <T
        d="M -0.88 -0.12 Q -0.92 -0.82 -0.18 -0.86 Q -0.16 -0.5 -0.32 -0.14 Z"
        fill={J.pramHood}
        size={0.4}
      />
      {[0.25, 0.5, 0.75].map((k) => (
        <path
          key={k}
          d={`M ${-0.88 + k * 0.05} ${-0.12} Q ${-0.85 + k * 0.1} ${-0.8 + k * 0.15} ${-0.18 - k * 0.12} ${-0.86 + k * 0.5}`}
          fill="none"
          stroke={lighten(J.pramHood, 0.25)}
          strokeWidth={0.02}
          opacity={0.6}
        />
      ))}
      {/* Puffs of breath toward the candle. */}
      {blow > 0 && blow < 0.7 && (
        <g opacity={1 - blow / 0.7}>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={0.16 + i * 0.07 + blow * 0.1}
              cy={-0.24 - i * 0.03}
              r={0.025 - i * 0.004}
              fill={J.photoPaper}
            />
          ))}
        </g>
      )}
    </g>
  );
}

/** The same pram seen from straight above. */
function PramAbove({ t }: { t: number }) {
  return (
    <g>
      <rect x={-2.6} y={-4.8} width={5.2} height={9.2} fill={J.memGrass} />
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x={-2.6 + i * 0.7}
          y={-4.8}
          width={0.35}
          height={9.2}
          fill={J.memGrassShade}
          opacity={0.18}
        />
      ))}
      {Array.from({ length: 40 }, (_, i) => (
        <g key={i} transform={`translate(${-2.4 + rnd(i, 8) * 4.8} ${-4.4 + rnd(i, 9) * 8.4})`}>
          {[0, 1, 2, 3, 4].map((p) => (
            <circle
              key={p}
              cx={Math.cos((p / 5) * 6.28) * 0.03}
              cy={Math.sin((p / 5) * 6.28) * 0.03}
              r={0.022}
              fill={J.photoPaper}
            />
          ))}
          <circle r={0.018} fill={J.cheese} />
        </g>
      ))}
      <ellipse cx={0.12} cy={-0.4} rx={0.72} ry={1.1} fill={J.memGrassShade} opacity={0.55} />
      {[
        [-0.5, -1.15],
        [0.5, -1.15],
        [-0.5, 0.35],
        [0.5, 0.35],
      ].map(([x, y], i) => (
        <T
          key={i}
          d={rr((x ?? 0) - 0.07, (y ?? 0) - 0.18, 0.14, 0.36, 0.06)}
          fill={J.pramTyre}
          size={0.1}
        />
      ))}
      <T d={rr(-0.48, -1.42, 0.96, 1.85, 0.4)} fill={J.pram} size={0.6} />
      <path
        d="M -0.35 0.55 L 0.35 0.55"
        stroke={J.pramChrome}
        strokeWidth={0.06}
        strokeLinecap="round"
      />
      <path
        d="M -0.3 0.43 L -0.35 0.55 M 0.3 0.43 L 0.35 0.55"
        stroke={J.pramChrome}
        strokeWidth={0.04}
      />
      <T d={blob(0, -0.45, 0.25, 21, 0.06)} fill={SKIN.skin} size={0.25} />
      <BabyHead x={0} y={-0.48} r={0.24} blow={0} look={0} />
      <T
        d="M -0.42 -0.22 Q 0 -0.32 0.42 -0.22 L 0.44 0.32 Q 0 0.38 -0.44 0.32 Z"
        fill={J.blanket}
        size={0.4}
      />
      <Cupcake x={0.05} y={-0.12} s={0.15} out={1} t={t} />
      <T
        d="M -0.48 -1.0 Q -0.48 -1.45 0 -1.45 Q 0.48 -1.45 0.48 -1.0 L 0.46 -0.78 Q 0 -0.68 -0.46 -0.78 Z"
        fill={J.pramHood}
        size={0.5}
      />
    </g>
  );
}

/** From inside the pram: the hood's edge over you, the sky, the blanket's edge below. */
function PramInside({ t }: { t: number }) {
  return (
    <g>
      <GardenBack t={t} />
      <rect x={-2.6} y={-4.8} width={5.2} height={9.2} fill={J.memSky} opacity={0.35} />
      <T
        d="M -2.6 -4.8 L 2.6 -4.8 L 2.6 -1.6 Q 0.4 -2.15 -1.25 -1.0 Q -1.9 -0.4 -2.0 0.6 L -2.6 0.6 Z"
        fill={J.pramHood}
        size={0.9}
      />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M ${2.6 - i * 0.05} ${-1.6 - i * 0.18} Q ${0.4 - i * 0.2} ${-2.15 - i * 0.2} ${-1.25 - i * 0.2} ${-1.0 - i * 0.2} Q ${-1.9 - i * 0.2} ${-0.4 - i * 0.1} ${-2.0 - i * 0.18} ${0.6}`}
          fill="none"
          stroke={lighten(J.pramHood, 0.18 + i * 0.05)}
          strokeWidth={0.05}
          opacity={0.6}
        />
      ))}
      <T
        d="M -2.6 4.4 L -2.6 0.6 Q -1.6 0.25 -0.7 0.55 Q 0.3 0.85 1.2 0.45 Q 2.0 0.15 2.6 0.4 L 2.6 4.4 Z"
        fill={J.blanket}
        size={0.8}
      />
      {/* The baby's own little hands round the cupcake, so the view is plainly the baby's
          (Biku, 2026-10-24: without them "it stops at a random picture"). */}
      <Cupcake x={0} y={0.5} s={0.42} out={1} t={t} />
      <T d={blob(-0.3, 0.86, 0.2, 91, 0.1, 0.85)} fill={SKIN.skin} size={0.2} />
      <T d={blob(0.3, 0.86, 0.2, 92, 0.1, 0.85)} fill={SKIN.skin} size={0.2} />
      <path
        d="M -1.6 0.5 Q -1.4 0.9 -1.55 1.3 M 0.6 0.68 Q 0.8 1.0 0.7 1.4"
        fill="none"
        stroke={shade(J.blanket, 0.16)}
        strokeWidth={0.06}
        strokeLinecap="round"
      />
    </g>
  );
}

/** The whole memory, as it is seen: from the side, tipping to above, or from inside. */
function Garden({
  t,
  blow,
  above,
  inside,
  glitch = 0,
  tint = 0,
}: {
  t: number;
  blow: number;
  above: number;
  inside: number;
  glitch?: number;
  tint?: number;
}) {
  const id = useId().replace(/:/g, '');
  // Tipping over: the camera tilts up and over, the view from the side sliding away below as
  // the view from straight above comes in from the top, squeezed a little at the turn.
  const tip = smooth(above);
  const squeeze = 1 - 0.18 * Math.sin(Math.PI * tip);
  const span = 9.2;
  const view = (
    <g transform={`translate(0 -0.4) scale(1 ${squeeze}) translate(0 0.4)`}>
      {tip < 1 && (
        <g transform={`translate(0 ${span * tip})`}>
          <GardenBack t={t} tint={tint} />
          <PramSide t={t} blow={blow} />
        </g>
      )}
      {tip > 0 && (
        <g transform={`translate(0 ${-span * (1 - tip)})`}>
          <PramAbove t={t} />
        </g>
      )}
    </g>
  );
  // Down into the pram: the camera dives into the baby's eye, and the baby's own view opens out
  // of it in a growing circle, never a see-through fade (Biku, 2026-10-24: "a weird
  // transition" at 45 to 49 s, where the face hung see-through over the sky).
  const eye = { x: 0.08, y: -0.5 };
  const zoom = 1 + 24 * smooth(clamp(inside / 0.62)) ** 2;
  const open = smooth(clamp((inside - 0.5) / 0.45));
  return (
    <g>
      <defs>
        <filter id={`${id}g`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.4"
            numOctaves={1}
            seed={Math.floor(t * 20) % 9}
          />
          <feDisplacementMap
            in="SourceGraphic"
            scale={0.18 * glitch}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <rect x={-2.6} y={-4.8} width={5.2} height={9.2} fill={J.memSky} />
      <g filter={glitch > 0.02 ? `url(#${id}g)` : undefined}>
        {open < 1 && (
          <g
            transform={`translate(${eye.x} ${eye.y}) scale(${zoom}) translate(${-eye.x} ${-eye.y})`}
          >
            {view}
          </g>
        )}
        {open > 0 && (
          <g>
            <defs>
              <clipPath id={`${id}eye`}>
                <circle cx={eye.x} cy={eye.y} r={open * 6} />
              </clipPath>
            </defs>
            <g clipPath={open < 1 ? `url(#${id}eye)` : undefined}>
              <g transform={`scale(${1.25 - 0.25 * open})`}>
                <PramInside t={t} />
              </g>
            </g>
          </g>
        )}
        {glitch > 0.02 && (
          <g opacity={glitch}>
            {Array.from({ length: 16 }, (_, i) => (
              <rect
                key={i}
                x={-2.6}
                y={-2.6 + i * 0.27 + ((t * 3) % 0.27)}
                width={5.2}
                height={0.05}
                fill={J.mindTop}
                opacity={0.2}
              />
            ))}
            <rect
              x={-2.6}
              y={-2.6 + ((t * 7) % 4.3)}
              width={5.2}
              height={0.18}
              fill={J.photoPaper}
              opacity={0.25}
            />
          </g>
        )}
      </g>
    </g>
  );
}

// ============================================================================================
// The mind: the dusk, your bubbles, the crowd.

function Dusk({ v, s }: { v: View; s: S }) {
  const id = useId().replace(/:/g, '');
  // Faint bubbles of other memories drift up slowly, the farther ones slower.
  const orbs = Array.from({ length: 26 }, (_, i) => {
    const depth = 0.3 + 0.7 * rnd(i, 1);
    const x = (rnd(i, 2) - 0.5) * 14;
    const y = -0.5 - ((rnd(i, 3) * 9 + s.t * 0.12 * depth) % 9);
    const sx = v.fx + (x - v.cam.x * depth) * v.k * depth;
    const sy = v.fy + (y - v.cam.y * depth) * v.k * depth;
    const r = (0.08 + 0.18 * rnd(i, 4)) * v.k * depth;
    return { sx, sy, r, depth, i };
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.mindTop} />
          <stop offset="0.62" stopColor={J.mindMid} />
          <stop offset="1" stopColor={J.mindLow} />
        </linearGradient>
      </defs>
      <rect width={v.W} height={v.H} fill={`url(#${id}d)`} />
      <Halo x={v.W * 0.5} y={v.H * 1.02} r={v.H * 0.75} colour={J.mindHaze} strength={0.35} />
      {orbs.map((o) =>
        o.r < 1 ? null : (
          <g key={o.i} opacity={0.18 + 0.25 * o.depth}>
            <circle cx={o.sx} cy={o.sy} r={o.r} fill={J.orb} opacity={0.35} />
            <circle
              cx={o.sx - o.r * 0.35}
              cy={o.sy - o.r * 0.35}
              r={o.r * 0.25}
              fill={J.photoPaper}
              opacity={0.5}
            />
          </g>
        ),
      )}
    </g>
  );
}

/** A thought bubble: a cream circle, its glow, the little bubbles up from your head. */
function Bubble({
  v,
  x,
  y,
  r,
  shown,
  from,
  children,
  glow = 1,
  wobble = 0,
}: {
  v: View;
  x: number;
  y: number;
  r: number;
  shown: number;
  from: [number, number];
  children?: ReactNode;
  glow?: number;
  wobble?: number;
}) {
  const id = useId().replace(/:/g, '');
  if (shown <= 0) return null;
  const k = spring(shown * 1.6);
  const [cx, cy] = at(v, x, y);
  const R = r * v.k * Math.max(0, k) * (1 + 0.012 * Math.sin(wobble));
  const [fx, fy] = at(v, from[0], from[1]);
  const dots = [0.35, 0.62].map((f, i) => ({
    x: fx + (cx - fx) * f * 0.75,
    y: fy + (cy - fy) * f * 0.75,
    r: (0.045 + i * 0.03) * v.k * clamp(shown * 4 - i),
  }));
  return (
    <g>
      <defs>
        <clipPath id={`${id}b`}>
          <circle cx={cx} cy={cy} r={Math.max(0, R * 0.94)} />
        </clipPath>
      </defs>
      <Halo x={cx} y={cy} r={R * 1.8} colour={J.bubbleGlow} strength={0.35 * glow} />
      {dots.map((d, i) =>
        d.r > 0 ? <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={J.bubble} /> : null,
      )}
      <circle cx={cx} cy={cy} r={R} fill={J.bubble} />
      <g clipPath={`url(#${id}b)`}>{children}</g>
      <circle
        cx={cx}
        cy={cy}
        r={R * 0.97}
        fill="none"
        stroke={J.bubbleEdge}
        strokeWidth={R * 0.06}
        opacity={0.9}
      />
      <path
        d={`M ${cx - R * 0.62} ${cy - R * 0.38} A ${R * 0.75} ${R * 0.75} 0 0 1 ${cx - R * 0.2} ${cy - R * 0.72}`}
        fill="none"
        stroke={J.photoPaper}
        strokeWidth={R * 0.07}
        strokeLinecap="round"
        opacity={0.85}
      />
    </g>
  );
}

/** The garden drawn into a circle of the picture: `scale` pixels to its unit. */
function GardenIn({
  cx,
  cy,
  scale,
  children,
}: {
  cx: number;
  cy: number;
  scale: number;
  children: ReactNode;
}) {
  return <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(0 0.1)`}>{children}</g>;
}

/** You as a newborn, held up in a doctor's gloved hands, waving. */
function NewbornIn({ t }: { t: number }) {
  const wave = Math.sin(t * 7) * 18;
  return (
    <g>
      <rect x={-2} y={-2} width={4} height={4} fill={J.bathWall} />
      <rect x={-2} y={0.55} width={4} height={2} fill={J.bathTile} />
      <Halo x={0} y={-0.3} r={1.4} colour={J.spot} strength={0.6} />
      <T d={blob(-0.55, 0.45, 0.32, 51, 0.08, 0.7)} fill={J.glove} size={0.3} />
      <T d={blob(0.55, 0.45, 0.32, 52, 0.08, 0.7)} fill={J.glove} size={0.3} />
      <T d={blob(0, 0.15, 0.42, 53, 0.06, 0.85)} fill={J.newborn} size={0.4} />
      <T d={circ(0, -0.42, 0.34)} fill={J.newborn} size={0.34} />
      <circle cx={-0.12} cy={-0.44} r={0.04} fill={J.trousers} />
      <circle cx={0.12} cy={-0.44} r={0.04} fill={J.trousers} />
      <path
        d="M -0.1 -0.28 Q 0 -0.2 0.1 -0.28"
        fill="none"
        stroke={shade(J.newborn, 0.4)}
        strokeWidth={0.035}
        strokeLinecap="round"
      />
      <path
        d="M -0.06 -0.76 q 0.06 -0.12 0.12 0"
        fill="none"
        stroke={J.trousers}
        strokeWidth={0.04}
        strokeLinecap="round"
      />
      <g transform={`rotate(${-30 + wave} 0.32 0)`}>
        <T d={rr(0.3, -0.06, 0.34, 0.12, 0.06)} fill={J.newborn} size={0.08} />
      </g>
      <T d={rr(-0.62, -0.02, 0.32, 0.12, 0.06)} fill={J.newborn} size={0.08} />
      <T d={rr(-0.75, 0.42, 0.42, 0.13, 0.06)} fill={J.glove} size={0.1} />
      <T d={rr(0.33, 0.42, 0.42, 0.13, 0.06)} fill={J.glove} size={0.1} />
    </g>
  );
}

/** A burst where a bubble popped. */
function Pop({ x, y, r, k }: { x: number; y: number; r: number; k: number }) {
  if (k <= 0 || k >= 1) return null;
  return (
    <g opacity={1 - k}>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const d = r * (0.6 + 0.9 * k);
        return (
          <circle
            key={i}
            cx={x + Math.cos(a) * d}
            cy={y + Math.sin(a) * d}
            r={r * 0.08 * (1 - k)}
            fill={J.bubble}
          />
        );
      })}
      <circle
        cx={x}
        cy={y}
        r={r * (0.9 + 0.5 * k)}
        fill="none"
        stroke={J.bubbleEdge}
        strokeWidth={r * 0.05 * (1 - k)}
      />
    </g>
  );
}

// ---- the crowd

type Person = {
  x: number;
  y: number;
  c: number;
  ring: number;
  yellow: boolean;
  bright: boolean;
  pram: boolean;
};
const PEOPLE: Person[] = (() => {
  const out: Person[] = [];
  for (let r = -CROWD.rows; r < CROWD.rows; r++)
    for (let c = -CROWD.cols; c <= CROWD.cols; c++) {
      if (r === 0 && c === 0) continue;
      const i = out.length;
      const x = c * CROWD.dx + (r % 2 ? CROWD.dx / 2 : 0) + (rnd(i, 61) - 0.5) * 0.25;
      const y = r * CROWD.dy + (rnd(i, 62) - 0.5) * 0.2;
      const yellow = rnd(i, 63) < 0.386;
      out.push({
        x,
        y,
        c: Math.floor(rnd(i, 64) * 4),
        ring: Math.max(Math.abs(c), Math.abs(r)),
        yellow,
        bright: yellow && rnd(i, 65) < 0.348,
        pram: yellow && rnd(i, 66) < 0.42,
      });
    }
  return out;
})();
const RINGS = 42;
/** Each person's paths, in metres: body and head, and bubble, built once. */
/** A person of the crowd: shoulders and body, and a head a little apart, so each reads as someone. */
const personPath = (p: Person) =>
  `M ${p.x - 0.26} ${p.y} L ${p.x - 0.23} ${p.y - 0.95} Q ${p.x - 0.2} ${p.y - 1.22} ${p.x} ${p.y - 1.22} Q ${p.x + 0.2} ${p.y - 1.22} ${p.x + 0.23} ${p.y - 0.95} L ${p.x + 0.26} ${p.y} Z`;
const headPath = (p: Person) => circ(p.x, p.y - 1.5, 0.2);
const bubblePath = (p: Person) =>
  `${circ(p.x + 0.3, p.y - 2.05, 0.2)} ${circ(p.x + 0.12, p.y - 1.75, 0.04)}`;
const pramGlyph = (p: Person) => {
  const x = p.x + 0.3;
  const y = p.y - 2.05;
  return `M ${x - 0.11} ${y - 0.02} L ${x + 0.09} ${y - 0.02} Q ${x + 0.09} ${y + 0.07} ${x} ${y + 0.07} L ${x - 0.06} ${y + 0.07} Q ${x - 0.12} ${y + 0.05} ${x - 0.11} ${y - 0.02} Z M ${x - 0.11} ${y - 0.02} Q ${x - 0.11} ${y - 0.12} ${x - 0.02} ${y - 0.12} L ${x - 0.03} ${y - 0.02} Z ${circ(x - 0.06, y + 0.1, 0.025)} ${circ(x + 0.05, y + 0.1, 0.025)}`;
};
const byRingOf = (people: readonly Person[]) => {
  const rings = Array.from({ length: RINGS }, () => ({
    bodies: ['', '', '', ''],
    heads: ['', '', '', ''],
    bubbles: '',
    yellow: '',
    bright: '',
    prams: '',
    shadows: '',
  }));
  for (const p of people) {
    const r = rings[p.ring];
    if (!r) continue;
    r.bodies[p.c] += personPath(p);
    r.heads[p.c] += headPath(p);
    r.shadows += ell(p.x, p.y + 0.02, 0.32, 0.07);
    if (p.bright) r.bright += bubblePath(p);
    else if (p.yellow) r.yellow += bubblePath(p);
    else r.bubbles += bubblePath(p);
    if (p.pram) r.prams += pramGlyph(p);
  }
  return rings;
};
/** The people behind you and those in front, each ring of them as a few long paths. */
const BEHIND = byRingOf(PEOPLE.filter((p) => p.y <= 0.3));
const IN_FRONT = byRingOf(PEOPLE.filter((p) => p.y > 0.3));
// Two families of colour, each in a lighter and a deeper tone: busy enough to be people, calm
// enough not to shimmer.
const CROWD_COLOURS = [
  J.crowdA,
  mix(J.crowdA, J.mindMid, 0.3),
  J.crowdC,
  mix(J.crowdC, J.mindMid, 0.3),
];

function Crowd({ v, s, front }: { v: View; s: S; front: boolean }) {
  const id = useId().replace(/:/g, '');
  const shown = s.since('crowd');
  if (shown < -1e8) return null;
  const yellow = s.since('yellow');
  const bright = s.since('one-or-younger');
  const prams = s.since('prams');
  const glow = 0.5 + 0.5 * Math.sin(s.t * 4);
  // They come up ring by ring from you outwards; the bubbles turn yellow in a wave the same way.
  const [ox, oy] = at(v, 0, 0);
  // Close up only the few in the frame are drawn: all 6,641 at that size made a frame time out
  // (2026-10-24).
  const x0 = v.cam.x - v.fx / v.k;
  const y0 = v.cam.y - v.fy / v.k;
  const rings =
    v.cam.w < 8
      ? byRingOf(
          PEOPLE.filter(
            (p) =>
              p.y > 0.3 === front &&
              p.x > x0 - 1 &&
              p.x < x0 + v.W / v.k + 1 &&
              p.y > y0 - 0.5 &&
              p.y < y0 + v.H / v.k + 2.5,
          ),
        )
      : front
        ? IN_FRONT
        : BEHIND;
  return (
    <g>
      <defs>
        {/* The glow is worked out only over what the frame shows: across the whole crowd, close
            up, it was tens of thousands of pixels wide and a frame timed out (2026-10-23). */}
        <filter
          id={`${id}glow`}
          filterUnits="userSpaceOnUse"
          x={v.cam.x - v.fx / v.k - 0.5}
          y={v.cam.y - v.fy / v.k - 0.5}
          width={v.W / v.k + 1}
          height={v.H / v.k + 1}
        >
          <feGaussianBlur stdDeviation={0.12} />
        </filter>
      </defs>
      <g transform={`translate(${ox} ${oy}) scale(${v.k})`}>
        {rings.map((r, i) => {
          if (i === 0) return null;
          const t = shown - i * 0.11;
          if (t <= 0) return null;
          const k = spring(t * 1.8);
          const rise = (1 - Math.min(1, k)) * 0.6;
          const turned = yellow - i * 0.08;
          const lit = bright - i * 0.07;
          const pr = prams - i * 0.04;
          return (
            <g key={i} transform={`translate(0 ${rise})`} opacity={clamp(t * 5)}>
              <path d={r.shadows} fill={J.mindTop} opacity={0.35} />
              {r.bodies.map((d, c) => (
                <path key={c} d={d} fill={CROWD_COLOURS[c]} />
              ))}
              {r.heads.map((d, c) => (
                <path key={`h${c}`} d={d} fill={lighten(CROWD_COLOURS[c] ?? J.crowdA, 0.3)} />
              ))}
              {/* Once the yellow wave has passed, the other bubbles dim so the yellow ones stand out. */}
              <path d={r.bubbles} fill={J.crowdBubble} opacity={0.85 - 0.5 * clamp(turned * 3)} />
              <path
                d={r.yellow}
                fill={
                  turned > 0 ? mix(J.crowdBubble, J.crowdYellow, clamp(turned * 4)) : J.crowdBubble
                }
                opacity={0.9}
              />
              {lit > 0 && (
                <path
                  d={r.bright}
                  fill={J.crowdBright}
                  filter={`url(#${id}glow)`}
                  opacity={clamp(lit * 4) * (0.6 + 0.4 * glow)}
                />
              )}
              <path
                d={r.bright}
                fill={
                  lit > 0
                    ? mix(J.crowdYellow, J.crowdBright, clamp(lit * 4))
                    : turned > 0
                      ? mix(J.crowdBubble, J.crowdYellow, clamp(turned * 4))
                      : J.crowdBubble
                }
              />
              {pr > 0 && <path d={r.prams} fill={J.pram} opacity={clamp(pr * 4)} />}
            </g>
          );
        })}
      </g>
    </g>
  );
}

// ---- you

const holdUp: Pose = {
  id: 'hold-up',
  torsoLean: -2,
  headTilt: -4,
  arms: {
    front: { reach: vec(0.62, -0.05), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: { reach: vec(0.42, 0.05), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
  },
  legs: stand.legs,
};

type You = {
  keys: { frame: number; pose: Pose }[];
  face: ExpressionName;
  to?: ExpressionName;
  at?: number;
  look?: { x: number; y: number };
};

/** Eyes shut and smiling: remembering. */
const dreaming = { ...EXPRESSIONS.asleep, mouth: EXPRESSIONS.happy.mouth };

function youNow(s: S, place: Place): You {
  const stand0 = { frame: -20_000, pose: stand };
  const f = (name: JourneyThing, extra = 0) => {
    const x = s.since(name);
    return x > 1e8 ? -10_000 : Math.round(s.local - (x - extra) * s.fps);
  };
  if (place !== 'mind') return { keys: [stand0], face: 'happy' };
  if (s.since('eyes-shut') > -1e8)
    return { keys: [stand0], face: 'happy', to: 'asleep', at: s.since('eyes-shut') };
  if (s.has('flip') && s.since('flip') < -1e8)
    return { keys: [stand0], face: 'suspicious', look: { x: 0.8, y: -1.3 } };
  if (s.since('flip') > -1e8)
    return {
      keys: [stand0, { frame: -9_999, pose: holdUp }],
      face: 'happy',
      to: 'jaw-drop',
      at: s.since('flip') - 0.55,
      look: { x: 1.2, y: 0.7 },
    };
  if (s.since('sink') > -1e8)
    return {
      keys: [stand0],
      face: 'thinking',
      to: 'sad',
      at: s.since('sink') - 0.3,
      look: { x: -0.4, y: -1.2 },
    };
  if (s.since('collage') > -1e8)
    return {
      keys: [stand0],
      face: 'surprised',
      to: 'happy',
      at: s.since('collage') - 0.6,
      look: { x: 0.6, y: -1.4 },
    };
  if (s.since('hand-up') > -1e8)
    return { keys: [stand0, { frame: f('hand-up'), pose: wave }], face: 'happy' };
  if (s.since('crowd') > -1e8)
    return { keys: [stand0], face: 'surprised', look: { x: -0.8, y: -0.2 } };
  // Your head as an x-ray: you stand still for it.
  if (s.has('brain')) return { keys: [stand0], face: 'thinking' };
  if (s.since('pop') > -1e8)
    return {
      keys: [stand0, { frame: -9_999, pose: point }, { frame: f('pop', 0.15), pose: stand }],
      face: 'smug',
      to: 'guilty',
      at: s.since('pop') - 0.1,
      look: { x: -0.9, y: -1.2 },
    };
  if (s.since('newborn') > -1e8)
    return {
      keys: [stand0, { frame: f('newborn', 0.2), pose: point }],
      face: 'happy',
      to: 'smug',
      at: s.since('newborn') - 0.4,
      look: { x: -0.9, y: -1.2 },
    };
  if (s.since('glitch') > -1e8)
    return {
      keys: [stand0],
      face: 'happy',
      to: 'surprised',
      at: s.since('glitch') - 0.2,
      look: { x: 0.8, y: -1.3 },
    };
  if (s.since('pram') > -1e8)
    return {
      keys: [stand0, { frame: f('pram', 1.0), pose: openArms }],
      face: 'happy',
      look: { x: 0.8, y: -1.3 },
    };
  return { keys: [stand0], face: 'happy' };
}

function You({ v, s }: { v: View; s: S }) {
  const me = youNow(s, 'mind');
  const shut = s.since('eyes-shut');
  // Eyes shut and smiling while remembering, until the memory has come up, then open.
  const remembering =
    s.since('bubble') < 1e8 && s.since('pram') < 1.1 && shut < -1e8 && s.since('glitch') < -1e8;
  const face =
    me.to && me.at !== undefined
      ? blendFace(EXPRESSIONS[me.face], EXPRESSIONS[me.to], clamp(me.at / 0.5))
      : remembering
        ? dreaming
        : shut > -1e8
          ? blendFace(EXPRESSIONS.happy, dreaming, clamp(shut / 0.5))
          : EXPRESSIONS[me.face];
  const clock = Math.round(s.t * s.fps);
  const pose = withLife(poseAt(s.local, me.keys), clock, s.fps, 3);
  return (
    <g>
      <Halo
        x={at(v, 0, 0)[0]}
        y={at(v, 0, 0)[1]}
        r={1.3 * v.k}
        colour={J.mindHaze}
        strength={0.3}
      />
      <ellipse
        cx={at(v, 0, 0.02)[0]}
        cy={at(v, 0, 0.02)[1]}
        rx={0.42 * v.k}
        ry={0.07 * v.k}
        fill={J.mindTop}
        opacity={0.4}
      />
      <Mascot
        v={v}
        x={0}
        ground={0}
        pose={pose}
        face={face}
        id="mw-you"
        facing={me.look && me.look.x < 0 ? 'left' : 'right'}
        lookAt={me.look ? { x: Math.abs(me.look.x), y: me.look.y } : undefined}
        light={J.bubbleGlow}
      />
    </g>
  );
}

/** The age ruler: a stick with three candles at one, two and three years. */
function Ruler({ v, s }: { v: View; s: S }) {
  const shown = s.thing('ruler', 0.6);
  if (shown <= 0) return null;
  const p = pxOf(v);
  const colours = [J.rulerCandle, J.rulerCandleTwo, J.rulerCandleThree];
  const [bx, by] = at(v, RULER.x, 0);
  const [, ty] = at(v, RULER.x, RULER.y1 - RULER.step * 2 - 0.3);
  const k = spring(shown * 1.2);
  return (
    <g opacity={clamp(shown * 3)}>
      <rect
        x={bx - 0.04 * v.k}
        y={by - (by - ty) * Math.min(1, k)}
        width={0.08 * v.k}
        height={(by - ty) * Math.min(1, k)}
        rx={0.04 * v.k}
        fill={J.photoBack}
        opacity={0.8}
      />
      {colours.map((c, i) => {
        const [cx, cy] = at(v, RULER.x, RULER.y1 - i * RULER.step);
        const ci = clamp((shown - 0.25 - i * 0.18) * 4);
        if (ci <= 0) return null;
        const h = 0.34 * v.k * outBack(ci);
        return (
          <g key={i}>
            <rect
              x={cx + 0.07 * v.k}
              y={cy - h}
              width={0.11 * v.k}
              height={h}
              rx={0.03 * v.k}
              fill={c}
            />
            <Halo
              x={cx + 0.125 * v.k}
              y={cy - h - 0.08 * v.k}
              r={0.22 * v.k}
              colour={J.flame}
              strength={0.5}
            />
            <ellipse
              cx={cx + 0.125 * v.k}
              cy={cy - h - 0.07 * v.k}
              rx={0.035 * v.k}
              ry={0.07 * v.k}
              fill={J.flame}
            />
            <text
              x={cx - 0.1 * v.k}
              y={cy - 0.08 * v.k}
              fontFamily={font}
              fontWeight={800}
              fontSize={0.26 * v.k}
              fill={J.photoPaper}
              textAnchor="end"
            >
              {i + 1}
            </text>
            <line
              x1={cx - 0.05 * v.k}
              y1={cy}
              x2={cx + 0.05 * v.k}
              y2={cy}
              stroke={J.photoPaper}
              strokeWidth={4 * p}
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * The collage the memory really is: the same garden, cut up into pieces of different photos (the
 * sky and the tree, the pram on the lawn, a cupcake from a party), each with its white border,
 * taped on and stitched together, flying in to fill the bubble.
 */
function Collage({ shown, t }: { shown: number; t: number }) {
  const id = useId().replace(/:/g, '');
  const pieces = [
    { x: -1.25, y: -1.3, w: 1.95, h: 1.25, r: -7, from: [-3, -1.5], key: 'sky' },
    { x: -1.1, y: -0.45, w: 2.0, h: 1.45, r: 4, from: [3, 2], key: 'pram' },
    { x: 0.3, y: -1.05, w: 0.85, h: 0.85, r: -11, from: [2.5, -3], key: 'cake' },
  ] as const;
  return (
    <g>
      {pieces.map((p, i) => {
        const k = clamp(shown * 2.2 - i * 0.35);
        if (k <= 0) return null;
        const e = outBack(k);
        const dx = p.from[0] * (1 - e);
        const dy = p.from[1] * (1 - e);
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;
        return (
          <g key={p.key} transform={`translate(${dx} ${dy}) rotate(${p.r * e} ${cx} ${cy})`}>
            <defs>
              <clipPath id={`${id}${p.key}`}>
                <rect x={p.x} y={p.y} width={p.w} height={p.h} />
              </clipPath>
            </defs>
            <rect
              x={p.x - 0.08}
              y={p.y - 0.08}
              width={p.w + 0.16}
              height={p.h + 0.16}
              rx={0.03}
              fill={J.mindTop}
              opacity={0.3}
              transform="translate(0.05 0.07)"
            />
            <rect
              x={p.x - 0.08}
              y={p.y - 0.08}
              width={p.w + 0.16}
              height={p.h + 0.16}
              rx={0.03}
              fill={J.photoPaper}
            />
            <g clipPath={`url(#${id}${p.key})`}>
              {p.key === 'sky' && (
                <g transform="translate(-0.2 0.15)">
                  <GardenBack t={t} tint={1} />
                </g>
              )}
              {p.key === 'pram' && (
                <g>
                  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={J.memGrass} />
                  <PramSide t={t} blow={1} />
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.w}
                    height={p.h}
                    fill={J.photoTint}
                    opacity={0.22}
                  />
                </g>
              )}
              {p.key === 'cake' && (
                <g>
                  <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={J.frosting} opacity={0.45} />
                  <rect
                    x={p.x}
                    y={p.y}
                    width={p.w}
                    height={p.h}
                    fill={J.photoPaper}
                    opacity={0.35}
                  />
                  <Cupcake x={cx} y={cy + 0.12} s={0.32} out={0} t={t} />
                </g>
              )}
            </g>
            <rect
              x={cx - 0.22}
              y={p.y - 0.16}
              width={0.44}
              height={0.17}
              fill={J.tape}
              opacity={0.85}
              transform={`rotate(${-8 + i * 7} ${cx} ${p.y})`}
            />
          </g>
        );
      })}
      {shown > 0.5 && (
        <path
          d="M -1.05 0.02 Q -0.2 -0.12 0.75 -0.2 M 0.3 -0.95 Q 0.28 -0.5 0.36 -0.12"
          fill="none"
          stroke={J.stitch}
          strokeWidth={0.05}
          strokeDasharray="0.1 0.07"
          strokeLinecap="round"
          opacity={clamp((shown - 0.5) * 3)}
          strokeDashoffset={-t * 0.1}
        />
      )}
    </g>
  );
}

/** The printed photo in your hands, turned over to its back: "Photo: Mom". */
function Photo({ v, s }: { v: View; s: S }) {
  const flip = s.since('flip');
  if (flip < -1e8) return null;
  const k = clamp(flip / 0.7);
  // It comes down from the bubble into your hands, then turns over.
  const down = smooth(clamp(flip / 0.45));
  const turn = smooth(clamp((flip - 0.45) / 0.5));
  const sx = Math.cos(turn * Math.PI);
  const [hx, hy] = at(v, 0.66, -1.12);
  const [bx, by] = at(v, BUBBLE.x, BUBBLE.y);
  const x = bx + (hx - bx) * down;
  const y = by + (hy - by) * down;
  const w = 0.92 * v.k;
  const h = 0.72 * v.k;
  const p = pxOf(v);
  const back = sx < 0;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${-6 + 4 * down}) scale(${Math.abs(sx) * (0.9 + 0.1 * k)} 1)`}
    >
      <rect
        x={-w / 2 + 6 * p}
        y={-h / 2 + 8 * p}
        width={w}
        height={h}
        rx={0.02 * v.k}
        fill={J.mindTop}
        opacity={0.35}
      />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={0.02 * v.k}
        fill={back ? J.photoBack : J.photoPaper}
      />
      {!back ? (
        <g>
          <defs>
            <clipPath id="mw-photo-face">
              <rect
                x={-w / 2 + 0.05 * v.k}
                y={-h / 2 + 0.05 * v.k}
                width={w - 0.1 * v.k}
                height={h - 0.16 * v.k}
              />
            </clipPath>
          </defs>
          <g clipPath="url(#mw-photo-face)">
            <GardenIn cx={0} cy={-0.04 * v.k} scale={0.21 * v.k}>
              <Garden t={s.t} blow={1} above={0} inside={0} tint={1} />
            </GardenIn>
          </g>
        </g>
      ) : (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={-w * 0.4}
              y1={-h * 0.25 + i * h * 0.12}
              x2={w * 0.4}
              y2={-h * 0.25 + i * h * 0.12}
              stroke={J.photoTint}
              strokeWidth={2 * p}
              opacity={0.35}
            />
          ))}
          <text
            x={w * 0.42}
            y={h * 0.38}
            fontFamily={font}
            fontStyle="italic"
            fontWeight={700}
            fontSize={0.12 * v.k}
            fill={J.photoInk}
            textAnchor="end"
            transform={`rotate(-4 ${w * 0.42} ${h * 0.38})`}
          >
            Photo: Mom
          </text>
        </g>
      )}
    </g>
  );
}

// ============================================================================================
// Inside your head, as an x-ray in the same frame.

/**
 * Your head turned into an x-ray where you stand (2026-10-24, from the third Kurzgesagt Short,
 * where the man turns into a dark silhouette with glowing lungs and the camera never cuts):
 * the head goes dark with a glowing edge, a small toddler brain glows inside it, and memory
 * boxes drift in and fade before they reach its shelf. It fades as the camera pulls back out.
 */
function XRay({ v, s }: { v: View; s: S }) {
  const id = useId().replace(/:/g, '');
  const on = s.thing('brain', 0.6) * clamp((3.4 - v.cam.w) / 1.2);
  if (on <= 0) return null;
  const boxes = s.since('boxes');
  const c = { x: 0.01, y: -1.53 };
  const head = blob(c.x, c.y, 0.43, 77, 0.04, 1.0, 16);
  const brainShape = blob(c.x, c.y - 0.03, 0.17, 70, 0.07, 0.74, 12);
  const grow = outBack(clamp(s.thing('brain', 0.9)));
  const [x0, y0] = at(v, 0, 0);
  const pulse = 0.85 + 0.15 * Math.sin(s.t * 3);
  return (
    <g opacity={on}>
      <defs>
        <clipPath id={`${id}h`}>
          <path d={head} />
        </clipPath>
        <clipPath id={`${id}b`}>
          <path d={brainShape} />
        </clipPath>
      </defs>
      <g transform={`translate(${x0} ${y0}) scale(${v.k})`}>
        <Halo x={c.x} y={c.y} r={0.75} colour={J.brain} strength={0.35} />
        <path d={head} fill={J.mindTop} opacity={0.94} />
        <g clipPath={`url(#${id}h)`}>
          <Halo x={c.x} y={c.y - 0.03} r={0.42 * pulse} colour={J.brain} strength={0.5} />
          <g
            transform={`translate(${c.x} ${c.y}) scale(${0.6 + 0.4 * grow}) translate(${-c.x} ${-c.y})`}
          >
            <T d={brainShape} fill={J.brain} size={0.15} />
            <g clipPath={`url(#${id}b)`}>
              {Array.from({ length: 6 }, (_, i) => (
                <path
                  key={i}
                  d={`M ${c.x - 0.15 + i * 0.06} ${c.y - 0.16} q 0.04 0.05 0.008 0.1 q -0.03 0.05 0.016 0.11 q 0.03 0.04 0 0.09`}
                  fill="none"
                  stroke={J.brainFold}
                  strokeWidth={0.011}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              ))}
            </g>
            {/* The shelf where lasting memories would be kept, still being built. */}
            <rect
              x={c.x - 0.13}
              y={c.y + 0.1}
              width={0.2}
              height={0.02}
              rx={0.01}
              fill={J.memoryBoxEdge}
              opacity={0.85}
            />
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x={c.x - 0.12 + i * 0.07}
                y={c.y + 0.065}
                width={0.012}
                height={0.035}
                fill={J.memoryBoxEdge}
                opacity={0.5 + 0.5 * Math.sin(s.t * 4 + i)}
              />
            ))}
          </g>
          {/* Memory boxes drift in from the front and fade before they reach the shelf. */}
          {boxes > -1e8 &&
            Array.from({ length: 7 }, (_, i) => {
              const run = boxes > 1e8 ? s.t : boxes;
              if (boxes < 1e8 && run * 0.55 < i / 7) return null;
              const life = (((run * 0.55 - i / 7) % 1) + 1) % 1;
              const bx = c.x + 0.3 - life * 0.36 + 0.025 * Math.sin(i * 2.1);
              const by = c.y - 0.24 + (i % 4) * 0.045 + life * 0.22;
              const fade = life < 0.15 ? life / 0.15 : 1 - smooth((life - 0.45) / 0.4);
              const z = 0.026 * (1 - 0.3 * life);
              return (
                <g
                  key={i}
                  opacity={fade}
                  transform={`translate(${bx} ${by}) rotate(${life * 60 + i * 20})`}
                >
                  <rect
                    x={-z}
                    y={-z}
                    width={2 * z}
                    height={2 * z}
                    rx={z * 0.25}
                    fill={J.memoryBox}
                  />
                  <rect
                    x={-z}
                    y={-z}
                    width={2 * z}
                    height={z * 0.6}
                    rx={z * 0.2}
                    fill={lighten(J.memoryBox, 0.4)}
                  />
                  {life > 0.45 &&
                    [0, 1, 2, 3].map((k) => (
                      <circle
                        key={k}
                        cx={Math.cos(k * 1.6) * z * (1 + 3 * (life - 0.45))}
                        cy={Math.sin(k * 1.6) * z * (1 + 3 * (life - 0.45))}
                        r={z * 0.2}
                        fill={J.memoryBox}
                      />
                    ))}
                </g>
              );
            })}
        </g>
        <path d={head} fill="none" stroke={J.brain} strokeWidth={0.03} opacity={0.35} />
        <path d={head} fill="none" stroke={lighten(J.brain, 0.4)} strokeWidth={0.01} />
      </g>
    </g>
  );
}

function Mind({ v, s }: { v: View; s: S }) {
  const bubble = s.thing('bubble', 0.7);
  const memory = s.thing('pram', 0.6);
  const blow = clamp((s.since('pram') - 1.4) / 0.9);
  const glitch =
    s.since('glitch') > -1e8 && s.since('glitch') < 1e8
      ? clamp(s.since('glitch') * 3) *
        (0.55 + 0.45 * Math.sin(s.t * 31)) *
        (s.since('glitch') < 2.4 ? 1 : 0.5)
      : s.since('glitch') > 1e8
        ? 0.25 + 0.2 * Math.sin(s.t * 23)
        : 0;
  const newborn = s.thing('newborn', 0.6);
  const pop = s.since('pop');
  const collage = s.thing('collage', 1.1);
  const flip = s.since('flip');
  // The bubble sinks below the third candle on "not".
  const sink = smooth(clamp(s.since('sink') / 1.2));
  const bx = BUBBLE.x - 0.25 * sink;
  const by = BUBBLE.y + 0.75 * sink;
  const [cx, cy] = at(v, bx, by);
  const scale = (BUBBLE.r * v.k) / 1.3;
  const [nx, ny] = at(v, NEWBORN.x, NEWBORN.y);
  const popped = pop > -1e8 ? clamp(pop / 0.35) : 0;
  const crowd = s.since('crowd') > -1e8;
  return (
    <g>
      <Dusk v={v} s={s} />
      {crowd && <Crowd v={v} s={s} front={false} />}
      <Ruler v={v} s={s} />
      <You v={v} s={s} />
      <XRay v={v} s={s} />
      {crowd && <Crowd v={v} s={s} front />}
      {/* Among thousands, a small label keeps you found. */}
      {crowd && v.cam.w > 5 && (
        <Tag
          v={v}
          x={-0.15}
          y={-2.25}
          text="YOU"
          shown={clamp(s.since('crowd') * 2)}
          colour={J.crowdYellow}
          ink={J.mindTop}
        />
      )}
      {newborn > 0 && popped < 1 && (
        <Bubble
          v={v}
          x={NEWBORN.x}
          y={NEWBORN.y}
          r={NEWBORN.r * (1 + 0.15 * popped)}
          shown={newborn}
          from={[-0.12, -1.75]}
          wobble={s.t * 3}
        >
          <GardenIn cx={nx} cy={ny - 0.1 * v.k} scale={(NEWBORN.r * v.k) / 1.05}>
            <NewbornIn t={s.t} />
          </GardenIn>
        </Bubble>
      )}
      <Pop x={nx} y={ny} r={NEWBORN.r * v.k} k={popped} />
      {flip < 0.15 && (
        <g opacity={1 - 0.3 * sink}>
          <Bubble
            v={v}
            x={bx}
            y={by}
            r={BUBBLE.r}
            shown={Math.max(bubble, s.since('bubble') > 1e8 ? 1 : 0)}
            from={[0.16, -1.78]}
            wobble={s.t * 2.4}
            glow={1 + collage}
          >
            {/* The memory stays in the bubble until the pieces of the collage have covered it. */}
            {collage < 1 && (
              <g opacity={memory * (1 - smooth(clamp((collage - 0.4) / 0.6)))}>
                <GardenIn cx={cx} cy={cy} scale={scale}>
                  <Garden t={s.t} blow={blow} above={0} inside={0} glitch={glitch} />
                </GardenIn>
              </g>
            )}
            {collage > 0 && (
              <GardenIn cx={cx} cy={cy} scale={scale}>
                <Collage shown={collage} t={s.t} />
              </GardenIn>
            )}
          </Bubble>
        </g>
      )}
      <Photo v={v} s={s} />
    </g>
  );
}

// ============================================================================================
// The garden, full size.

function GardenPlace({ v, s }: { v: View; s: S }) {
  const above = s.thing('above', 1.1);
  const inside = s.thing('inside', 1.4);
  const [x0, y0] = at(v, GARDEN_X, -0.4);
  return (
    <g>
      <rect width={v.W} height={v.H} fill={J.memSky} />
      <g transform={`translate(${x0} ${y0}) scale(${v.k}) translate(0 0.4)`}>
        <Garden t={s.t} blow={1} above={above} inside={inside} />
      </g>
    </g>
  );
}

// ============================================================================================
// Home: the family album, and the dinner table where the story is told.

function Relative({
  v,
  x,
  identity,
  cloth,
  pose,
  face,
  facing,
  i,
  s,
  age,
}: {
  v: View;
  x: number;
  identity: NonNullable<CharacterProps['identity']>;
  cloth: 'crimson' | 'forest' | 'denim' | 'cream' | 'gold' | 'steel';
  pose: Pose;
  face: ExpressionName;
  facing: 'left' | 'right';
  i: number;
  s: S;
  age?: CharacterProps['age'];
}) {
  const [sx, sy] = at(v, x, -0.15);
  const clock = Math.round(s.t * s.fps);
  return (
    <Blended
      id={`mw-rel${i}`}
      u={pxOf(v) * Math.min(2.2, Math.max(0.35, (MASCOT_HEAD * v.k) / 120))}
      light={J.homeLamp}
    >
      <Character
        x={sx}
        groundY={sy}
        head={MASCOT_HEAD * v.k}
        facing={facing}
        pose={withLife(resolvePose(pose), clock, s.fps, i + 11)}
        face={EXPRESSIONS[face]}
        turn={0.35}
        identity={identity}
        outfit={outfitFrom({
          top: { kind: 'shirt', cloth },
          bottom: { kind: 'trousers', cloth: 'denim' },
        })}
        blink={blinkAt(clock, s.fps, i + 5)}
        {...(age ? { age } : {})}
      />
    </Blended>
  );
}

function Home({ v, s }: { v: View; s: S }) {
  const o = HOME_X;
  const album = s.thing('album', 0.8);
  const dinner = s.thing('dinner', 0.6);
  const [x0, y0] = at(v, o, 0);
  const talk = Math.sin(s.t * 6);
  const local = (children: ReactNode) => (
    <g transform={`translate(${x0} ${y0}) scale(${v.k})`}>{children}</g>
  );
  return (
    <g>
      <rect width={v.W} height={v.H} fill={J.homeWall} />
      {local(
        <g>
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x={-4 + i * 0.9}
              y={-5}
              width={0.45}
              height={5.1}
              fill={J.homeWallShade}
              opacity={0.25}
            />
          ))}
          <rect x={-4} y={0.1} width={10} height={4} fill={J.woodShade} />
          <rect x={-4} y={0.1} width={10} height={0.06} fill={J.wood} />
          <Halo x={1.6} y={-2.5} r={2.6} colour={J.homeLamp} strength={0.55} />
          <path d="M 1.6 -5 L 1.6 -2.75" stroke={J.trousers} strokeWidth={0.02} />
          <T
            d="M 1.35 -2.75 L 1.85 -2.75 L 1.75 -2.95 L 1.45 -2.95 Z"
            fill={J.cushion}
            size={0.15}
          />
          {/* The album, open on a side table, the pram photo on its page. */}
          <T d={rr(-2.4, -0.42, 2.6, 0.12, 0.04)} fill={J.wood} size={0.1} />
          <T d={rr(-2.25, -0.3, 0.12, 0.42, 0.03)} fill={J.woodShade} size={0.06} />
          <T d={rr(-0.05, -0.3, 0.12, 0.42, 0.03)} fill={J.woodShade} size={0.06} />
          <g
            transform={`translate(-1.1 -0.55) rotate(${-4 + 4 * (1 - outBack(album))}) scale(${0.7 + 0.3 * outBack(album)})`}
            opacity={clamp(album * 3 + 0.35)}
          >
            <T d={rr(-1.05, -0.62, 2.1, 0.66, 0.05)} fill={J.albumCover} size={0.4} />
            <rect x={-1.0} y={-0.6} width={0.98} height={0.6} fill={J.albumPage} />
            <rect x={0.02} y={-0.6} width={0.98} height={0.6} fill={J.albumPage} />
            {(
              [
                [-0.92, -0.55, 'pram'],
                [-0.47, -0.55, 'cake'],
                [0.1, -0.55, 'beach'],
                [0.55, -0.55, 'bath'],
              ] as const
            ).map(([px, py, k], i) => (
              <g key={i} transform={`rotate(${i % 2 ? 3 : -3} ${px + 0.18} ${py + 0.22})`}>
                <rect x={px} y={py} width={0.38} height={0.46} fill={J.photoPaper} />
                <defs>
                  <clipPath id={`mw-alb${i}`}>
                    <rect x={px + 0.03} y={py + 0.03} width={0.32} height={0.32} />
                  </clipPath>
                </defs>
                <rect
                  x={px + 0.03}
                  y={py + 0.03}
                  width={0.32}
                  height={0.32}
                  fill={k === 'beach' ? J.sky : k === 'bath' ? J.bathTile : J.memSky}
                />
                <g clipPath={`url(#mw-alb${i})`}>
                  {k === 'pram' && (
                    <g transform={`translate(${px + 0.19} ${py + 0.21}) scale(0.075)`}>
                      <Garden t={s.t} blow={1} above={0} inside={0} tint={1} />
                    </g>
                  )}
                  {k === 'cake' && (
                    <circle cx={px + 0.19} cy={py + 0.22} r={0.09} fill={J.frosting} />
                  )}
                  {k === 'beach' && (
                    <rect x={px + 0.03} y={py + 0.24} width={0.32} height={0.11} fill={J.sand} />
                  )}
                  {k === 'bath' && (
                    <circle cx={px + 0.19} cy={py + 0.24} r={0.07} fill={J.bubble} />
                  )}
                </g>
              </g>
            ))}
          </g>
        </g>,
      )}
      {/* The family round the dinner table, an uncle telling the story with his hands. */}
      <g opacity={clamp(dinner * 3 + (s.stop === 'dinner' ? 1 : 0.6))}>
        <Relative
          v={v}
          x={o + 1.3}
          identity={{ skinTone: 4, hair: 'bun', hairColor: 'gray' }}
          cloth="crimson"
          pose={stand}
          face="laughing"
          facing="right"
          i={1}
          s={s}
          age="elder"
        />
        <Relative
          v={v}
          x={o + 2.2}
          identity={{ skinTone: 3, hair: 'long', hairColor: 'dark-brown' }}
          cloth="gold"
          pose={stand}
          face="laughing"
          facing="right"
          i={3}
          s={s}
        />
        <Relative
          v={v}
          x={o + 3.1}
          identity={{ skinTone: 5, hair: 'short-crop', hairColor: 'black' }}
          cloth="forest"
          pose={talk > 0 ? openArms : handsUp}
          face="happy"
          facing="left"
          i={2}
          s={s}
        />
      </g>
      {local(
        <g opacity={clamp(dinner * 3 + (s.stop === 'dinner' ? 1 : 0.6))}>
          <T d={rr(0.7, -0.62, 3.0, 0.16, 0.05)} fill={J.tablecloth} size={0.12} />
          <rect x={0.75} y={-0.46} width={2.9} height={0.56} fill={shade(J.tablecloth, 0.12)} />
          {[1.3, 2.2, 3.1].map((px, i) => (
            <g key={i}>
              <ellipse cx={px} cy={-0.6} rx={0.22} ry={0.05} fill={J.plateRim2} />
              <ellipse cx={px} cy={-0.61} rx={0.14} ry={0.03} fill={J.photoPaper} />
            </g>
          ))}
          {/* What he is saying: a pram, drawn in a speech bubble. */}
          <g
            transform={`translate(2.6 -2.55) scale(${outBack(clamp(dinner * 1.5))})`}
            opacity={clamp(dinner * 3)}
          >
            <T d={blob(0, 0, 0.42, 81, 0.05, 0.75)} fill={J.photoPaper} size={0.4} />
            <path d="M 0.2 0.26 L 0.42 0.5 L 0.02 0.3 Z" fill={J.photoPaper} />
            <g transform="scale(0.14) translate(0 0.1)">
              <PramSide t={s.t} blow={1} />
            </g>
          </g>
        </g>,
      )}
    </g>
  );
}

// ============================================================================================
// The picture of a shot.

/** A callout in the picture: a number in gold and a few words, coming up on its word. */
function Callout({
  v,
  value,
  caption,
  shown,
  y,
}: {
  v: View;
  value: string;
  caption: string;
  shown: number;
  y: number;
}) {
  if (shown <= 0) return null;
  const u = pxOf(v);
  const s = outBack(clamp(shown));
  const w = Math.max(value.length * 62, caption.length * 25) + 90;
  return (
    <g
      transform={`translate(${v.W / 2} ${v.H * y}) scale(${u * (0.75 + 0.25 * s)})`}
      opacity={clamp(shown * 3)}
    >
      <rect x={-w / 2} y={-118} width={w} height={186} rx={34} fill={J.mindTop} opacity={0.88} />
      <text
        x={0}
        y={-12}
        fontFamily={font}
        fontWeight={800}
        fontSize={112}
        fill={J.crowdYellow}
        textAnchor="middle"
      >
        {value}
      </text>
      <text
        x={0}
        y={46}
        fontFamily={font}
        fontWeight={800}
        fontSize={40}
        fill={J.photoPaper}
        textAnchor="middle"
      >
        {caption}
      </text>
    </g>
  );
}

export function MemoryPicture({
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
  const from = g.from ?? g.at;
  const fly = g.fly === 'whole' ? Math.max(1, duration - 2) : memoryFlightFrames(from, g.at, fps);
  const a = stopOf(from, tall);
  const b = stopOf(g.at, tall);
  const place = b.place;
  const raw = fly > 0 ? clamp(local / fly) : 1;
  // Through the bubble: the camera flies in the garden's own units the whole way, so the bubble
  // over your head and the garden it opens into are one picture.
  const door = a.place !== b.place && fly > 0 ? (a.place === 'mind' ? 'in' : 'out') : null;
  const flown =
    raw >= 1
      ? b.cam
      : door === 'in'
        ? zoomPath(toGarden(a.cam), b.cam).at(smooth(raw))
        : door === 'out'
          ? toMind(zoomPath(a.cam, toGarden(b.cam)).at(smooth(raw)))
          : a.place === b.place
            ? zoomPath(a.cam, b.cam).at(smooth(raw))
            : b.cam;
  const drift = (c: Cam, held: number): Cam => ({
    ...c,
    x: c.x + c.w * 0.015 * held,
    w: c.w * (1 - 0.06 * held),
  });
  const moved = wordCamera({
    legs: g.show
      .map((x, i) => ({ to: x.cam, start: times[i] ?? 0 }))
      .filter((l): l is { to: JourneyStop; start: number } => !!l.to)
      .map((l) => ({ ...l, s: stopOf(l.to, tall) }))
      .filter((l) => l.s.place === place)
      .map((l) => ({ to: l.to, at: l.s.cam, start: l.start }))
      .sort((p, q) => p.start - q.start),
    flown,
    arrived: b.cam,
    fly,
    local,
    duration,
    fps,
    drift,
    tooSoon: 'glide',
  });
  const atWord = new Map<JourneyThing, number>();
  g.show.forEach((x, i) => atWord.set(x.item, times[i] ?? 0));
  const s: S = {
    t: clock / fps,
    local,
    fps,
    thing: (name, seconds = 0.35) =>
      g.keep.includes(name)
        ? 1
        : atWord.has(name)
          ? clamp((local - (atWord.get(name) ?? 0)) / (fps * seconds))
          : 0,
    since: (name) =>
      g.keep.includes(name)
        ? 1e9
        : atWord.has(name)
          ? (local - (atWord.get(name) ?? 0)) / fps
          : -1e9,
    has: (name) => g.keep.includes(name) || atWord.has(name),
    stop: moved.stop ?? g.at,
  };
  const v = viewOf(moved.cam, width, height);
  // A callout is said once: it stands only in the shot whose words say it, never kept on.
  const fresh = (name: JourneyThing) => (s.since(name) < 1e8 ? s.thing(name, 0.4) : 0);
  const world = (() => {
    if (door && raw < 1) {
      // The mind round the bubble, and the garden in a circle on the bubble: opening round you
      // on the way in, closing back into the bubble on the way out.
      const vm = door === 'in' ? viewOf(toMind(moved.cam), width, height) : v;
      const vg = door === 'in' ? v : viewOf(toGarden(moved.cam), width, height);
      const [cx, cy] = at(vm, BUBBLE.x, BUBBLE.y);
      const small = 0.94 * BUBBLE.r * vm.k;
      const far = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) * 1.04;
      const open = door === 'in' ? smooth((raw - 0.35) / 0.6) : 1 - smooth(raw / 0.8);
      const r = small + (far - small) * open;
      const shown = door === 'in' ? 1 : 1 - smooth((raw - 0.78) / 0.22);
      const ring = 0.012 * Math.min(width, height) * (1 - open);
      return (
        <g>
          <Mind v={vm} s={s} />
          <defs>
            <clipPath id="mw-door">
              <circle cx={cx} cy={cy} r={Math.max(0, r)} />
            </clipPath>
          </defs>
          <g clipPath="url(#mw-door)" opacity={shown}>
            <GardenPlace v={vg} s={s} />
          </g>
          {ring > 0.5 && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={J.bubbleEdge}
              strokeWidth={ring * 2}
              opacity={shown}
            />
          )}
        </g>
      );
    }
    return place === 'mind' ? (
      <Mind v={v} s={s} />
    ) : place === 'garden' ? (
      <GardenPlace v={v} s={s} />
    ) : (
      <Home v={v} s={s} />
    );
  })();
  return (
    <TonedContext.Provider value>
      <g>
        <defs>
          <radialGradient id="mw-vignette" cx="0.5" cy="0.45" r="0.8">
            <stop offset="0.62" stopColor={J.mindTop} stopOpacity={0} />
            <stop offset="1" stopColor={J.mindTop} stopOpacity={0.5} />
          </radialGradient>
        </defs>
        {world}
        <rect width={width} height={height} fill="url(#mw-vignette)" />
        <Callout
          v={v}
          value="6,641"
          caption="PEOPLE ASKED"
          shown={fresh('asked') * (1 - s.thing('yellow', 0.3))}
          y={0.3}
        />
        <Callout
          v={v}
          value="4 IN 10"
          caption="SAID AGE 2 OR YOUNGER"
          shown={fresh('yellow') * (1 - s.thing('one-or-younger', 0.3))}
          y={0.3}
        />
        <Callout
          v={v}
          value="893"
          caption="SAID AGE 1 OR YOUNGER"
          shown={fresh('one-or-younger')}
          y={0.3}
        />
      </g>
    </TonedContext.Provider>
  );
}

// ============================================================================================
// The thumbnail: a poster for the Short, not a frame of it (knowledge/playbooks/thumbnails.md).
// Biku's package: "a baby in an old pram under a yellow blanket, close and soft-lit, with the
// words YOUR BRAIN MADE IT UP". Three layouts to pick from, 1080 by 1920.

function PosterWords({
  lines,
  gold,
  y,
  size,
}: {
  lines: string[];
  gold: number;
  y: number;
  size: number;
}) {
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={540}
          y={y + i * size * 1.02}
          fontFamily={font}
          fontWeight={800}
          fontSize={size}
          fill={i === gold ? J.crowdYellow : J.photoPaper}
          stroke={J.mindTop}
          strokeWidth={size * 0.14}
          paintOrder="stroke"
          strokeLinejoin="round"
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

export function MemoryThumb({ option }: { option: 1 | 2 | 3 }) {
  const W = 1080;
  const H = 1920;
  const t = 0.4;
  // The mascot close, low on the poster, looking up at his memory.
  const face = viewOf({ x: 0, y: -2.45, w: 2.7 }, W, H);
  const dusk = (
    <g>
      <defs>
        <linearGradient id="mt-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.mindTop} />
          <stop offset="0.6" stopColor={J.mindMid} />
          <stop offset="1" stopColor={J.mindLow} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill="url(#mt-dusk)" />
      <Halo x={540} y={760} r={760} colour={J.bubbleGlow} strength={0.45} />
    </g>
  );
  const bubbleAt = (cx: number, cy: number, r: number, children: ReactNode) => (
    <g>
      <Halo x={cx} y={cy} r={r * 1.7} colour={J.bubbleGlow} strength={0.6} />
      <circle cx={cx} cy={cy} r={r} fill={J.bubble} />
      <defs>
        <clipPath id={`mt-b${option}`}>
          <circle cx={cx} cy={cy} r={r * 0.94} />
        </clipPath>
      </defs>
      <g clipPath={`url(#mt-b${option})`}>{children}</g>
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.97}
        fill="none"
        stroke={J.bubbleEdge}
        strokeWidth={r * 0.06}
      />
      <path
        d={`M ${cx - r * 0.62} ${cy - r * 0.38} A ${r * 0.75} ${r * 0.75} 0 0 1 ${cx - r * 0.2} ${cy - r * 0.72}`}
        fill="none"
        stroke={J.photoPaper}
        strokeWidth={r * 0.07}
        strokeLinecap="round"
        opacity={0.85}
      />
    </g>
  );
  const mascot = (
    x: number,
    ground: number,
    expr: ExpressionName,
    facing: 'left' | 'right',
    look: { x: number; y: number },
  ) => (
    <Mascot
      v={face}
      x={x}
      ground={ground}
      pose={resolvePose(stand)}
      face={EXPRESSIONS[expr]}
      id={`mt-m${option}`}
      facing={facing}
      lookAt={look}
      light={J.bubbleGlow}
    />
  );
  if (option === 1) {
    // The memory bubble big in the middle band, your face below it looking up, wide-eyed.
    return (
      <TonedContext.Provider value>
        <g>
          {dusk}
          {bubbleAt(
            580,
            640,
            370,
            <GardenIn cx={580} cy={640} scale={370 / 1.15}>
              <Garden t={t} blow={0} above={0} inside={0} />
            </GardenIn>,
          )}
          <circle cx={300} cy={1150} r={30} fill={J.bubble} />
          <circle cx={250} cy={1230} r={18} fill={J.bubble} />
          {mascot(-0.25, 0.05, 'jaw-drop', 'right', { x: 0.7, y: -1.3 })}
          <PosterWords lines={['YOUR BRAIN', 'MADE IT UP']} gold={1} y={1560} size={150} />
        </g>
      </TonedContext.Provider>
    );
  }
  if (option === 2) {
    // The same memory as a printed photo turning over: "Photo: Mom" on its back.
    return (
      <TonedContext.Provider value>
        <g>
          {dusk}
          <g transform="translate(570 640) rotate(-7)">
            <rect
              x={-420}
              y={-330}
              width={840}
              height={660}
              rx={14}
              fill={J.mindTop}
              opacity={0.35}
              transform="translate(14 22)"
            />
            <rect x={-420} y={-330} width={840} height={660} rx={14} fill={J.photoPaper} />
            <defs>
              <clipPath id="mt-photo">
                <rect x={-385} y={-295} width={770} height={520} />
              </clipPath>
            </defs>
            <g clipPath="url(#mt-photo)">
              <GardenIn cx={0} cy={-30} scale={175}>
                <Garden t={t} blow={0} above={0} inside={0} tint={1} />
              </GardenIn>
            </g>
            {/* A corner peeled up: the back of the print, and its writing. */}
            <path d="M 420 130 L 420 330 L 170 330 Z" fill={J.photoBack} />
            <path d="M 420 130 L 170 330 L 330 160 Z" fill={J.photoTint} opacity={0.4} />
            <text
              x={300}
              y={290}
              fontFamily={font}
              fontStyle="italic"
              fontWeight={700}
              fontSize={44}
              fill={J.photoInk}
              textAnchor="middle"
              transform="rotate(-38 300 290)"
            >
              Photo: Mom
            </text>
          </g>
          {mascot(-0.4, 0.05, 'surprised', 'right', { x: 0.9, y: -1.4 })}
          <PosterWords lines={['YOUR BRAIN', 'MADE IT UP']} gold={1} y={1560} size={150} />
        </g>
      </TonedContext.Provider>
    );
  }
  // 3: the package as written: the baby in the pram close and soft-lit, a crack of glitch
  // through the memory, the words over the top.
  return (
    <TonedContext.Provider value>
      <g>
        <rect width={W} height={H} fill={J.memSky} />
        <g transform="translate(560 1080) scale(520)">
          <Garden t={t} blow={0} above={0} inside={0} glitch={0.15} />
        </g>
        <rect width={W} height={H} fill={J.mindTop} opacity={0.12} />
        <path
          d="M 0 560 L 380 610 L 520 540 L 760 640 L 1080 590"
          fill="none"
          stroke={J.photoPaper}
          strokeWidth={10}
          opacity={0.85}
        />
        <path
          d="M 0 575 L 380 625 L 520 555 L 760 655 L 1080 605"
          fill="none"
          stroke={J.crowdD}
          strokeWidth={6}
          opacity={0.7}
        />
        <PosterWords lines={['YOUR BRAIN', 'MADE IT UP']} gold={1} y={330} size={150} />
      </g>
    </TonedContext.Provider>
  );
}
