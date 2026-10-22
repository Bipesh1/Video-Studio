import type { JOURNEY_STOPS } from '@studio/shared';
import type { Graphic, JourneyStop, JourneyThing } from '@studio/shared';
import type { ReactNode } from 'react';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { VIEWER_FONT } from '../overlays/text';
import { clamp, outBack, smooth, viewOf, zoomPath } from './Journey';
import type { Cam, View } from './Journey';

/**
 * The world `dive` (2026-10-19, "Could Humans Evolve to Hold Their Breath Like Seals?"): places
 * joined by water. Your bathroom, with you under the bathwater and inside you your lungs, heart,
 * blood and spleen down to its red cells; the Earth from space; a cold sea with a seal; the
 * Bajau's warm sea with their village, houseboats, a diver on the reef, a scan on the shore and,
 * in the sky, the journal page of the study; and the pool of the breath-hold record.
 *
 * Within a place the camera flies as in every journey (the smooth zoom of van Wijk and Nuij,
 * through nested frames: a red cell inside the spleen, a gene inside the scan). Between places it
 * dives into the water of the one, rushes through blue with the bubbles, and comes up out of the
 * water of the next: the water joins them, as the story says (Biku, 2026-10-19: "each new info
 * should bring a great animation").
 *
 * Every place is drawn in its own unit (metres; the cells in tens of micrometres; the gene in
 * millimetres; the Earth in thousands of kilometres), in a group placed and scaled by the camera,
 * and only at the sizes where it can be seen, so no shape is ever drawn thousands of frames wide.
 */

const J = fineTokens.journey;
const LINE = fineTokens.line;
const font = `${VIEWER_FONT}, Arial, sans-serif`;
type Journey = Extract<Graphic, { kind: 'journey' }>;
type DiveStop = (typeof JOURNEY_STOPS)['dive'][number];

// ---- the frames and places
type FrameId = 'home' | 'cells' | 'earth' | 'cold' | 'bajau' | 'dna' | 'pool';
type Place = 'home' | 'earth' | 'cold' | 'bajau' | 'pool';
type Frame = { parent: FrameId | null; at: [number, number]; size: number };
/** Your spleen in the bathroom, in metres: under the ribs on the body's left. */
const SPLEEN = { x: -0.13, y: -0.305 };
/** The scan's screen on the Bajau shore, and the Bajau spleen on it. */
const SCREEN = { x: -50, y: -2.3, w: 1.3, h: 0.86 };
const SCAN_SPLEEN = { x: SCREEN.x - 0.3, y: SCREEN.y - 0.02 };
const FRAMES: Record<FrameId, Frame> = {
  home: { parent: null, at: [0, 0], size: 1 },
  cells: { parent: 'home', at: [SPLEEN.x, SPLEEN.y], size: 1e-5 },
  earth: { parent: null, at: [0, 0], size: 1 },
  cold: { parent: null, at: [0, 0], size: 1 },
  bajau: { parent: null, at: [0, 0], size: 1 },
  dna: { parent: 'bajau', at: [SCAN_SPLEEN.x, SCAN_SPLEEN.y], size: 1e-3 },
  pool: { parent: null, at: [0, 0], size: 1 },
};
const placeOf = (f: FrameId): Place => (f === 'cells' ? 'home' : f === 'dna' ? 'bajau' : f);
const chain = (f: FrameId): FrameId[] => {
  const out: FrameId[] = [f];
  let p = FRAMES[f].parent;
  while (p) {
    out.push(p);
    p = FRAMES[p].parent;
  }
  return out;
};
/** A view of the camera in one frame of a place, given it in another frame of the same place. */
function camIn(cam: Cam, from: FrameId, to: FrameId): Cam {
  if (from === to) return cam;
  let c = cam;
  for (const f of chain(from)) {
    if (chain(to).includes(f)) break;
    const fr = FRAMES[f];
    c = { x: fr.at[0] + fr.size * c.x, y: fr.at[1] + fr.size * c.y, w: fr.size * c.w };
  }
  const down = chain(to);
  const common = chain(from).find((f) => down.includes(f)) ?? to;
  for (const f of down.slice(0, down.indexOf(common)).reverse()) {
    const fr = FRAMES[f];
    c = { x: (c.x - fr.at[0]) / fr.size, y: (c.y - fr.at[1]) / fr.size, w: c.w / fr.size };
  }
  return c;
}

/** The stops, laid out for the wide picture; a tall one sees half as wide. */
function stopOf(stop: JourneyStop, tall: boolean): { frame: FrameId; cam: Cam } {
  const k = tall ? 0.5 : 1;
  const at = (frame: FrameId, x: number, y: number, w: number) => ({
    frame,
    cam: { x, y, w: w * k },
  });
  switch (stop as DiveStop) {
    case 'bath':
      return at('home', 0.12, -0.5, 2.5);
    case 'rise':
      return at('home', 0.15, -0.62, 3.7);
    case 'counter':
      return at('home', 0.75, -0.62, 1.6);
    case 'figure':
      return at('home', -0.36, -0.27, 1.0);
    case 'chest':
      return at('home', -0.27, -0.24, 0.78);
    case 'lungs':
      return at('home', -0.34, -0.24, 0.42);
    case 'heart':
      return at('home', -0.27, -0.235, 0.3);
    case 'limbs':
      return at('home', 0.02, -0.26, 1.75);
    case 'spleen':
      return at('home', SPLEEN.x, SPLEEN.y, 0.2);
    case 'cells':
      return at('cells', 0, 0, 16);
    case 'stream':
      return at('cells', 13, 0.6, 18);
    case 'globe':
      return at('earth', 0, 0.2, 26);
    case 'seal':
      return at('cold', 0.15, 1.55, 4.6);
    case 'village':
      return at('bajau', -12, -2, 44);
    case 'family':
      return at('bajau', -16.4, -3.7, 6);
    case 'boats':
      return at('bajau', 16, -0.9, 26);
    case 'reef':
      return at('bajau', 11, 5.1, 8);
    case 'scan':
      return at('bajau', SCREEN.x - 0.2, SCREEN.y + 0.25, 3.4);
    case 'scan-close':
      return at('bajau', SCREEN.x, SCREEN.y + 0.05, 1.9);
    case 'dna':
      return at('dna', 0, 0, 90);
    case 'page':
      return at('bajau', PAGE.x, PAGE.y - 1.6, 20);
    case 'page-figure':
      return at('bajau', PAGE.x, PAGE.y + 1.6, 7);
    case 'pool':
      return at('pool', 0.3, -0.5, 10);
    case 'tank':
      return at('pool', 3.7, -0.75, 3.4);
    default:
      return at('home', 0.15, -0.42, 2.9);
  }
}

/** Where the camera dives into each place's water, and comes up out of it: all water, close in. */
const WATER: Record<Place, { at: [number, number]; w: number; colour: string }> = {
  home: { at: [0.5, -0.41], w: 0.03, colour: J.bathWaterDeep },
  earth: { at: [1.6, 1.4], w: 1.2, colour: J.ocean },
  cold: { at: [-1.4, 3.6], w: 0.05, colour: J.seaCold },
  bajau: { at: [3, 2.2], w: 0.05, colour: J.seaWarm },
  pool: { at: [-1.6, 1.7], w: 0.04, colour: J.poolDeep },
};

/** Both ends of a flight in one frame of their place: the deeper of the two. */
function shared(a: { frame: FrameId; cam: Cam }, b: { frame: FrameId; cam: Cam }) {
  const frame = chain(a.frame).length >= chain(b.frame).length ? a.frame : b.frame;
  return { frame, a: camIn(a.cam, a.frame, frame), b: camIn(b.cam, b.frame, frame) };
}

/** How many frames the flight between two stops takes: through the water, a little longer. */
export function diveFlightFrames(from: JourneyStop, to: JourneyStop, fps: number): number {
  if (from === to) return 0;
  const a = stopOf(from, false);
  const b = stopOf(to, false);
  if (placeOf(a.frame) !== placeOf(b.frame)) return Math.round(fps * 2.2);
  const sh = shared(a, b);
  return Math.round(fps * clamp(0.9 + 0.1 * zoomPath(sh.a, sh.b).S, 1.0, 2.2));
}

// ---- drawing helpers
/** A small seeded random number, the same every frame. */
const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Where a point of a frame falls on the picture, without the pin to the edge. */
const at = (v: View, x: number, y: number): [number, number] => [
  v.fx + (x - v.cam.x) * v.k,
  v.fy + (y - v.cam.y) * v.k,
];
/** A group drawn in the frame's own units. */
function Local({ v, children }: { v: View; children: ReactNode }) {
  const [x, y] = at(v, 0, 0);
  return <g transform={`translate(${x} ${y}) scale(${v.k})`}>{children}</g>;
}
/** The unit of a line's width on the picture: a pixel of a 1080 picture. */
const pxOf = (v: View) => Math.min(v.W, v.H) / 1080;
const NS = { vectorEffect: 'non-scaling-stroke' as const };
/** A label pinned to a thing as it arrives: a dark pill with light words. */
function Tag({
  v,
  x,
  y,
  text,
  shown,
}: {
  v: View;
  x: number;
  y: number;
  text: string;
  shown: number;
}) {
  if (shown <= 0) return null;
  const [sx, sy] = at(v, x, y);
  if (sx < -200 || sx > v.W + 200 || sy < -100 || sy > v.H + 100) return null;
  const s = pxOf(v) * (0.7 + 0.3 * outBack(clamp(shown)));
  const w = text.length * 25 + 48;
  return (
    <g
      transform={`translate(${clamp(sx, 40 + w / 2, v.W - 40 - w / 2)} ${clamp(sy, 60, v.H * 0.7)}) scale(${s})`}
      opacity={clamp(shown * 3)}
    >
      <rect x={-w / 2} y={-34} width={w} height={62} rx={31} fill={LINE.color} />
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

// ---- the state of the world at one frame
type State = {
  t: number;
  W: number;
  H: number;
  thing: (name: JourneyThing, seconds?: number) => number;
  /** The counter's seconds. */
  count: number;
};

// ============================================================================================
// Your bathroom, in metres: the floor at 0, the bath on it, you lying under the water.
const TUB = { x0: -0.9, x1: 0.9, rim: -0.6, water: -0.47, bottom: -0.07 };
const COUNTER = { x: 1.12, y: -0.56 };

/** The water's top at x: small waves running along the bath. */
const surfaceY = (x: number, t: number, rough = 1) =>
  TUB.water + rough * (0.006 * Math.sin(x * 9 - t * 2.4) + 0.004 * Math.sin(x * 17 + t * 1.7));

function Bathroom({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  const wide = v.cam.w > 0.5;
  if (!wide && v.cam.w < 0.03) return null;
  const [, floorY] = at(v, 0, 0);
  const tiles: ReactNode[] = [];
  if (wide) {
    for (let x = -3; x <= 3; x += 0.25)
      tiles.push(
        <line
          key={`x${x}`}
          x1={x}
          y1={-3}
          x2={x}
          y2={0}
          stroke={J.bathTile}
          strokeWidth={2 * p}
          {...NS}
        />,
      );
    for (let y = -3; y < 0; y += 0.25)
      tiles.push(
        <line
          key={`y${y}`}
          x1={-3}
          y1={y}
          x2={3}
          y2={y}
          stroke={J.bathTile}
          strokeWidth={2 * p}
          {...NS}
        />,
      );
  }
  return (
    <g>
      <rect width={v.W} height={v.H} fill={J.bathWall} />
      {wide && (
        <>
          <Local v={v}>
            {tiles}
            {/* The tap on the wall above the bath's end. */}
            <path
              d="M -0.95 -0.86 L -0.8 -0.86 Q -0.74 -0.86 -0.74 -0.8 L -0.74 -0.74 L -0.78 -0.74 L -0.78 -0.8 L -0.95 -0.8 Z"
              fill={J.faucet}
              stroke={J.faucetShade}
              strokeWidth={2 * p}
              {...NS}
            />
            <circle
              cx={-0.9}
              cy={-0.92}
              r={0.035}
              fill={J.faucet}
              stroke={J.faucetShade}
              strokeWidth={2 * p}
              {...NS}
            />
            {/* A small window high on the wall. */}
            <rect
              x={-0.35}
              y={-1.75}
              width={0.6}
              height={0.5}
              rx={0.03}
              fill={J.sky}
              stroke={J.tub}
              strokeWidth={6 * p}
              {...NS}
            />
            <line
              x1={-0.05}
              y1={-1.75}
              x2={-0.05}
              y2={-1.25}
              stroke={J.tub}
              strokeWidth={4 * p}
              {...NS}
            />
          </Local>
          <rect
            x={0}
            y={floorY}
            width={v.W}
            height={Math.max(0, v.H - floorY)}
            fill={J.bathFloor}
          />
          <rect x={0} y={floorY} width={v.W} height={8 * p} fill={J.bathFloorShade} />
          <Counter v={v} s={s} />
        </>
      )}
    </g>
  );
}

/** The tub: its white sides, cut away at the front so the water and you inside can be seen. */
function Tub({ v, front }: { v: View; front: boolean }) {
  const p = pxOf(v);
  if (v.cam.w < 0.12) return null;
  const outer = `M ${TUB.x0} ${TUB.rim} L ${TUB.x1} ${TUB.rim} L 0.86 -0.07 Q 0.84 0 0.76 0 L -0.76 0 Q -0.84 0 -0.86 -0.07 Z`;
  const inner = `M -0.83 ${TUB.rim} L 0.83 ${TUB.rim} L 0.79 -0.13 Q 0.77 ${TUB.bottom} 0.7 ${TUB.bottom} L -0.7 ${TUB.bottom} Q -0.77 ${TUB.bottom} -0.79 -0.13 Z`;
  return (
    <Local v={v}>
      {front ? (
        // The cut edge of the tub's wall, and its rim and feet, over the water.
        <g>
          <path
            d={`${outer} ${inner}`}
            fill={J.tub}
            fillRule="evenodd"
            stroke={LINE.color}
            strokeWidth={3 * p}
            {...NS}
          />
          <rect
            x={TUB.x0 - 0.03}
            y={TUB.rim - 0.035}
            width={TUB.x1 - TUB.x0 + 0.06}
            height={0.05}
            rx={0.025}
            fill={J.tub}
            stroke={LINE.color}
            strokeWidth={3 * p}
            {...NS}
          />
          {[-0.7, 0.7].map((x) => (
            <path
              key={x}
              d={`M ${x - 0.06} 0 L ${x + 0.06} 0 L ${x + 0.04} 0.06 L ${x - 0.04} 0.06 Z`}
              fill={J.faucetShade}
            />
          ))}
        </g>
      ) : (
        <path d={inner} fill={J.tubShade} />
      )}
    </Local>
  );
}

/** The bathwater over you: see-through blue, its top rippling, light wavering on the bottom. */
function BathWater({ v, s, over, tint }: { v: View; s: State; over: boolean; tint: number }) {
  const p = pxOf(v);
  if (v.cam.w < 0.03) return over ? null : <rect width={v.W} height={v.H} fill={J.bathWaterDeep} />;
  const n = 48;
  const top = Array.from({ length: n + 1 }, (_, i) => {
    const x = -0.82 + (1.64 * i) / n;
    return `${x.toFixed(4)} ${surfaceY(x, s.t).toFixed(4)}`;
  });
  const body = `M ${top.join(' L ')} L 0.79 -0.13 Q 0.77 ${TUB.bottom} 0.7 ${TUB.bottom} L -0.7 ${TUB.bottom} Q -0.77 ${TUB.bottom} -0.79 -0.13 Z`;
  if (!over)
    return (
      <Local v={v}>
        <defs>
          <linearGradient id="dv-bath" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={J.bathWater} />
            <stop offset="1" stopColor={J.bathWaterDeep} />
          </linearGradient>
        </defs>
        <path d={body} fill="url(#dv-bath)" />
      </Local>
    );
  return (
    <Local v={v}>
      <path d={body} fill={J.bathWater} opacity={tint} />
      {/* Light wavering through the water. */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = -0.72 + i * 0.18 + 0.03 * Math.sin(s.t * 1.3 + i);
        const y = -0.12 - 0.02 * rnd(i, 3);
        return (
          <path
            key={i}
            d={`M ${x - 0.06} ${y} Q ${x - 0.02} ${y - 0.015 * Math.sin(s.t * 2 + i)} ${x + 0.02} ${y} T ${x + 0.08} ${y}`}
            fill="none"
            stroke={J.caustic}
            strokeWidth={3 * p}
            opacity={0.55}
            {...NS}
          />
        );
      })}
      <path d={`M ${top.join(' L ')}`} fill="none" stroke={J.caustic} strokeWidth={4 * p} {...NS} />
      {/* A few small bubbles rising from your nose and drifting. */}
      {Array.from({ length: 5 }, (_, i) => {
        const f = (s.t * 0.25 + i / 5) % 1;
        return (
          <circle
            key={`b${i}`}
            cx={-0.62 + 0.02 * Math.sin(s.t * 3 + i)}
            cy={-0.36 - f * 0.1}
            r={0.006 + 0.004 * rnd(i, 5)}
            fill="none"
            stroke={J.bubble}
            strokeWidth={2 * p}
            opacity={(1 - f) * 0.8}
            {...NS}
          />
        );
      })}
    </Local>
  );
}

/** The counter on its stool beside the bath: the seconds you have been under. */
function Counter({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  const stop = s.thing('stop', 0.4);
  const secs = Math.floor(s.count);
  const text = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const [cx, cy] = at(v, COUNTER.x, COUNTER.y);
  const size = 0.11 * v.k;
  return (
    <g>
      <Local v={v}>
        <path
          d={`M ${COUNTER.x - 0.14} -0.38 L ${COUNTER.x + 0.14} -0.38 L ${COUNTER.x + 0.11} -0.34 L ${COUNTER.x - 0.11} -0.34 Z`}
          fill={J.wood}
        />
        {[-0.09, 0.09].map((d) => (
          <line
            key={d}
            x1={COUNTER.x + d}
            y1={-0.34}
            x2={COUNTER.x + d * 1.3}
            y2={0}
            stroke={J.woodShade}
            strokeWidth={8 * p}
            {...NS}
          />
        ))}
        <rect
          x={COUNTER.x - 0.17}
          y={COUNTER.y - 0.12}
          width={0.34}
          height={0.2}
          rx={0.04}
          fill={J.timerBody}
        />
        <rect
          x={COUNTER.x - 0.03}
          y={COUNTER.y - 0.15}
          width={0.06}
          height={0.03}
          rx={0.01}
          fill={stop > 0 ? J.timerStop : J.faucetShade}
        />
      </Local>
      <text
        x={cx}
        y={cy + size * 0.33}
        fontFamily={font}
        fontWeight={700}
        fontSize={size}
        fill={stop > 0 ? J.timerStop : J.timerDigits}
        textAnchor="middle"
        opacity={stop > 0 ? 1 : 0.85 + 0.15 * Math.sin(s.t * Math.PI * 2)}
      >
        {text}
      </text>
    </g>
  );
}

/** A seal's shape gliding under the bath's ripples: what you might become. */
function RippleSeal({ v, s, shown }: { v: View; s: State; shown: number }) {
  if (shown <= 0 || v.cam.w < 0.5) return null;
  const p = pxOf(v);
  const x = -0.15 + 0.08 * Math.sin(s.t * 0.5);
  const y = -0.43 + 0.005 * Math.sin(s.t * 2);
  const d = `M ${x - 0.32} ${y} Q ${x - 0.2} ${y - 0.05} ${x + 0.05} ${y - 0.035} Q ${x + 0.24} ${y - 0.03} ${x + 0.3} ${y} Q ${x + 0.24} ${y + 0.025} ${x + 0.05} ${y + 0.02} Q ${x - 0.18} ${y + 0.02} ${x - 0.32} ${y} L ${x - 0.42} ${y - 0.04} M ${x - 0.32} ${y} L ${x - 0.42} ${y + 0.035}`;
  return (
    <Local v={v}>
      <g opacity={smooth(shown) * 0.9}>
        <path d={d} fill={J.seal} opacity={0.35} />
        <path
          d={d}
          fill="none"
          stroke={J.caustic}
          strokeWidth={(4 * p) / v.k}
          strokeDasharray="1"
          pathLength={1}
          strokeDashoffset={1 - smooth(shown)}
        />
      </g>
    </Local>
  );
}

// ---- you, lying under the water, and inside you
/** The heart's beat at time t: quick at rest, slow once the dive reflex has begun. */
function heartBeat(t: number, slow: number): number {
  const rate = lerp(1.25, 0.6, slow);
  // The phase is the integral of the rate, so the beat slows without a jump.
  const phase = t * rate;
  const f = phase - Math.floor(phase);
  return Math.exp(-f * 9) + 0.5 * Math.exp(-Math.max(0, f - 0.18) * 12) * (f > 0.18 ? 1 : 0);
}

const ARM_VESSEL = 'M -0.27 -0.24 L -0.45 -0.215 L -0.2 -0.205 L 0.03 -0.22';
const LEG_VESSEL = 'M -0.27 -0.235 L -0.05 -0.235 L 0.12 -0.245 L 0.38 -0.3 L 0.72 -0.255';

function Bather({
  v,
  s,
  lift,
  part,
}: {
  v: View;
  s: State;
  lift: number;
  part: 'body' | 'inside';
}) {
  const p = pxOf(v);
  if (v.cam.w < 0.02) return null;
  const inside = Math.max(
    s.thing('lungs', 0.8),
    s.thing('spleen-squeeze', 0.6),
    s.thing('heart-glow', 0.8),
  );
  const line = 2.5 * p;
  const rise = `translate(0 ${-lift * 0.2})`;
  if (part === 'body') {
    const skinOpacity = 1 - 0.5 * smooth(inside);
    const limb = (d: string, w: number, fill: string, key: string) => (
      <g key={key}>
        <path
          d={d}
          fill="none"
          stroke={LINE.color}
          strokeWidth={w + 0.012}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={d}
          fill="none"
          stroke={fill}
          strokeWidth={w}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
    return (
      <Local v={v}>
        <g transform={rise} opacity={skinOpacity}>
          {/* The far leg and arm, a shade darker. */}
          {limb('M 0.06 -0.21 L 0.4 -0.27 L 0.71 -0.205', 0.095, J.counterShade, 'fl')}
          {limb('M -0.44 -0.16 L -0.2 -0.15 L 0.03 -0.19', 0.06, J.counterShade, 'fa')}
          {/* The near leg, bent a little at the knee, and the foot. */}
          {limb('M 0.06 -0.25 L 0.39 -0.31 L 0.72 -0.245', 0.105, J.skin, 'nl')}
          <path
            d="M 0.7 -0.3 Q 0.72 -0.37 0.77 -0.36 Q 0.8 -0.3 0.78 -0.22 L 0.71 -0.21 Z"
            fill={J.skin}
            stroke={LINE.color}
            strokeWidth={line}
            {...NS}
          />
          {/* Chest and belly: the chest rising, the back flat. */}
          <path
            d="M -0.53 -0.3 Q -0.5 -0.36 -0.4 -0.375 Q -0.28 -0.385 -0.18 -0.355 Q -0.06 -0.33 0.06 -0.335 L 0.08 -0.15 Q -0.2 -0.115 -0.5 -0.14 Q -0.56 -0.2 -0.53 -0.3 Z"
            fill={J.skin}
            stroke={LINE.color}
            strokeWidth={line}
            {...NS}
          />
          <path
            d="M -0.08 -0.338 Q 0.02 -0.34 0.09 -0.336 L 0.11 -0.15 Q 0.01 -0.14 -0.08 -0.135 Z"
            fill={J.swim}
            stroke={LINE.color}
            strokeWidth={line}
            {...NS}
          />
          {/* The near arm, lying along the body. */}
          {limb('M -0.46 -0.21 L -0.22 -0.2 L 0.02 -0.22', 0.063, J.skin, 'na')}
          {/* The neck and the head, faceless, its hair at the back. */}
          <path d="M -0.6 -0.29 L -0.52 -0.3 L -0.52 -0.2 L -0.6 -0.21 Z" fill={J.skin} />
          <circle
            cx={-0.66}
            cy={-0.25}
            r={0.095}
            fill={J.skin}
            stroke={LINE.color}
            strokeWidth={line}
            {...NS}
          />
          <path
            d="M -0.745 -0.29 A 0.095 0.095 0 0 0 -0.69 -0.16 Q -0.71 -0.2 -0.745 -0.29 Z"
            fill={J.hair}
          />
        </g>
      </Local>
    );
  }
  if (inside <= 0) return null;
  const slow = Math.max(s.thing('heart', 2.5), s.thing('heart-glow', 1.5));
  const beat = heartBeat(s.t, slow);
  const fading = s.thing('fading', 2.4);
  const hands = s.thing('hands', 1.6);
  const feet = s.thing('feet', 1.6);
  const spleenOn = Math.max(s.thing('spleen', 0.5), s.thing('spleen-squeeze', 0.5));
  const squeeze = Math.max(s.thing('squeeze', 0.6), s.thing('spleen-squeeze', 0.6));
  const glow = s.thing('heart-glow', 0.8);
  const sq = squeeze > 0 ? 1 - 0.12 * (0.5 + 0.5 * Math.sin(s.t * 5)) * squeeze : 1;
  const open = smooth(inside);
  return (
    <Local v={v}>
      <g transform={rise}>
        {/* Inside: the chest cut open, dark, the lungs, the spleen, the ribs over them. */}
        <g opacity={open}>
          <path
            d="M -0.5 -0.3 Q -0.48 -0.35 -0.4 -0.36 Q -0.28 -0.37 -0.18 -0.345 Q -0.08 -0.325 -0.03 -0.325 L -0.03 -0.155 Q -0.2 -0.13 -0.48 -0.15 Q -0.52 -0.2 -0.5 -0.3 Z"
            fill={J.inside}
          />
          {[
            [-0.335, -0.295],
            [-0.335, -0.19],
          ].map(([x, y], i) => (
            <g key={i}>
              <ellipse
                cx={x}
                cy={y}
                rx={0.12}
                ry={0.048}
                fill={J.lung}
                stroke={J.lungShade}
                strokeWidth={2 * p}
                {...NS}
              />
              <ellipse
                cx={(x ?? 0) - 0.02}
                cy={(y ?? 0) + (i ? 0.012 : -0.012)}
                rx={0.075}
                ry={0.02}
                fill={J.lungShade}
                opacity={0.55}
              />
            </g>
          ))}
          <g transform={`translate(${SPLEEN.x} ${SPLEEN.y}) rotate(-12) scale(${sq})`}>
            {spleenOn > 0 && (
              <ellipse
                rx={0.064}
                ry={0.042}
                fill={J.spleenLight}
                opacity={0.45 * spleenOn * (0.7 + 0.3 * Math.sin(s.t * 4))}
              />
            )}
            <path
              d="M -0.05 0 Q -0.05 -0.03 -0.01 -0.03 Q 0.05 -0.03 0.05 0.005 Q 0.05 0.03 0.01 0.026 Q -0.005 0.012 -0.02 0.026 Q -0.05 0.03 -0.05 0 Z"
              fill={J.spleen}
              stroke={J.spleenLight}
              strokeWidth={3 * p}
              {...NS}
            />
          </g>
          {[-0.44, -0.39, -0.34, -0.29, -0.24, -0.19].map((x) => (
            <path
              key={x}
              d={`M ${x} -0.34 Q ${x + 0.03} -0.24 ${x} -0.15`}
              fill="none"
              stroke={J.rib}
              strokeWidth={4 * p}
              opacity={0.5}
              {...NS}
            />
          ))}
        </g>
        <Vessels v={v} s={s} shown={inside} hands={hands} feet={feet} fading={fading} />
        {/* The heart, beating. */}
        <g transform={`translate(-0.27 -0.24) scale(${0.045 * (1 + 0.1 * beat)})`} opacity={open}>
          {glow > 0 && (
            <circle r={1.6} fill={J.heartGlow} opacity={0.4 * glow * (0.5 + 0.5 * beat)} />
          )}
          {slow > 0 && <circle r={1.25} fill={J.heartGlow} opacity={0.3 * slow * beat} />}
          <path
            d="M 0 0.9 C -1.2 0 -1 -0.9 -0.45 -0.9 C -0.15 -0.9 0 -0.65 0 -0.5 C 0 -0.65 0.15 -0.9 0.45 -0.9 C 1 -0.9 1.2 0 0 0.9 Z"
            fill={J.heart}
            stroke={J.heartGlow}
            strokeWidth={3 * p}
            {...NS}
          />
        </g>
      </g>
    </Local>
  );
}

/** The blood's paths from the heart to the hands and the feet, and the oxygen in it. */
function Vessels({
  v,
  s,
  shown,
  hands,
  feet,
  fading,
}: {
  v: View;
  s: State;
  shown: number;
  hands: number;
  feet: number;
  fading: number;
}) {
  const p = pxOf(v);
  const width = 9 * p;
  const reach = (left: number) => 1 - 0.55 * smooth(left);
  const flow = (d: string, len: number, key: string) =>
    Array.from({ length: 8 }, (_, i) => {
      const f = ((s.t * 0.35 + i / 8) % 1) * len;
      return (
        <path
          key={`${key}${i}`}
          d={d}
          fill="none"
          stroke={J.bubble}
          strokeWidth={(7 * p) / v.k}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`0.005 2`}
          strokeDashoffset={-f}
          opacity={0.9 * (1 - 0.8 * smooth(fading))}
        />
      );
    });
  return (
    <g opacity={smooth(shown)}>
      {hands > 0 && (
        <circle cx={0.04} cy={-0.22} r={0.06} fill={J.vesselCold} opacity={0.55 * smooth(hands)} />
      )}
      {feet > 0 && (
        <circle cx={0.75} cy={-0.28} r={0.07} fill={J.vesselCold} opacity={0.55 * smooth(feet)} />
      )}
      {[ARM_VESSEL, LEG_VESSEL].map((d, i) => (
        <path
          key={`c${i}`}
          d={d}
          fill="none"
          stroke={J.vesselCold}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...NS}
        />
      ))}
      <path
        d={ARM_VESSEL}
        fill="none"
        stroke={J.vessel}
        strokeWidth={(width * 1.3) / v.k}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reach(hands)} 2`}
      />
      <path
        d={LEG_VESSEL}
        fill="none"
        stroke={J.vessel}
        strokeWidth={(width * 1.3) / v.k}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={`${reach(feet)} 2`}
      />
      {flow(ARM_VESSEL, reach(hands), 'a')}
      {flow(LEG_VESSEL, reach(feet), 'l')}
      {/* The oxygen in the lungs: bright bubbles that dim as you hold your breath. */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = -0.43 + 0.19 * rnd(i, 11);
        const y = (i % 2 ? -0.3 : -0.18) + 0.06 * (rnd(i, 12) - 0.5);
        const gone = smooth(fading * 1.3 - rnd(i, 13) * 0.3);
        return (
          <circle
            key={`o${i}`}
            cx={x + 0.005 * Math.sin(s.t * 2 + i)}
            cy={y}
            r={0.008 * (1 - 0.5 * gone)}
            fill={J.bubble}
            opacity={0.95 * (1 - 0.85 * gone)}
          />
        );
      })}
    </g>
  );
}

// ---- inside the spleen: the sponge, seen from millimetres down to its red cells
/** How hard the spleen is squeezing at a frame: a pulse once it has begun. */
const squeezeOf = (s: State) => {
  const q = Math.max(s.thing('squeeze', 0.8), s.thing('spleen-squeeze', 0.6));
  return q > 0 ? (0.5 + 0.5 * Math.sin(s.t * 5)) * q : 0;
};

/**
 * The spleen's sponge in the bathroom's metres: its pores, each packed with red cells, as a
 * pattern laid over the spleen as the camera closes in, and over the whole picture once the
 * spleen fills it.
 */
function SpongeNear({ v, s, whole }: { v: View; s: State; whole: boolean }) {
  const w = v.cam.w;
  const shown = whole ? clamp((0.045 - w) / 0.015) : clamp((0.14 - w) / 0.08);
  if (shown <= 0) return null;
  const k = 1 - 0.08 * squeezeOf(s);
  const id = whole ? 'dv-sponge-all' : 'dv-sponge-organ';
  const body = whole ? (
    <rect x={v.cam.x - w} y={v.cam.y - w} width={2 * w} height={2 * w} fill={`url(#${id})`} />
  ) : (
    <g transform={`translate(${SPLEEN.x} ${SPLEEN.y}) rotate(-12)`}>
      <path
        d="M -0.05 0 Q -0.05 -0.03 -0.01 -0.03 Q 0.05 -0.03 0.05 0.005 Q 0.05 0.03 0.01 0.026 Q -0.005 0.012 -0.02 0.026 Q -0.05 0.03 -0.05 0 Z"
        fill={`url(#${id})`}
      />
    </g>
  );
  return (
    <Local v={v}>
      <defs>
        <pattern
          id={id}
          patternUnits="userSpaceOnUse"
          width={0.0032}
          height={0.0028}
          patternTransform={`translate(${SPLEEN.x} ${SPLEEN.y}) scale(${k})`}
        >
          <rect width={0.0032} height={0.0028} fill={J.spleen} />
          {[
            [0.0008, 0.0007],
            [0.0024, 0.0021],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={0.00062}
                fill={J.spleenPore}
                stroke={J.spleenLight}
                strokeWidth={0.00012}
              />
              {[0, 2.1, 4.2].map((a) => (
                <circle
                  key={a}
                  cx={(x ?? 0) + 0.00028 * Math.cos(a + i)}
                  cy={(y ?? 0) + 0.00028 * Math.sin(a + i)}
                  r={0.00018}
                  fill={J.cell}
                />
              ))}
            </g>
          ))}
        </pattern>
      </defs>
      <g opacity={shown}>{body}</g>
    </Local>
  );
}

/** Close in among the red cells, in tens of micrometres: the sponge, and the vessel they pour into. */
function Cells({ v, s }: { v: View; s: State }) {
  if (v.cam.w > 400) return null;
  const p = pxOf(v);
  const shown = clamp((400 - v.cam.w) / 250);
  const squeeze = s.thing('squeeze', 0.8);
  const pour = s.thing('pour', 0.8);
  const tank = s.thing('tank', 0.6);
  const k = 1 - 0.1 * squeezeOf(s);
  const w = v.cam.w;
  // Cells leaving the spleen and pouring along the vessel to the right.
  const stream: ReactNode[] = [];
  if (pour > 0 || squeeze > 0) {
    const n = 46;
    for (let i = 0; i < n; i++) {
      const f = (s.t * 0.22 + i / n) % 1;
      const x = 4 + f * 26;
      const y = 0.6 + 1.6 * Math.sin(i * 2.1) * (0.4 + 0.6 * f) * 0.6;
      const show = clamp(Math.max(pour, squeeze * 0.4) * 1.5 - (1 - f) * 0.4);
      if (show <= 0) continue;
      stream.push(
        <Rbc key={i} x={x} y={y} turn={f * 720 + i * 40} r={0.42} p={p} opacity={show} />,
      );
    }
  }
  const tankPath =
    'M 6.5 -1.6 L 20 -1.6 Q 23 -1.6 23 0.6 Q 23 2.8 20 2.8 L 6.5 2.8 Q 5 2.8 5 0.6 Q 5 -1.6 6.5 -1.6 Z M 23 0 L 24.4 0 L 24.4 1.2 L 23 1.2';
  return (
    <g opacity={shown}>
      <rect width={v.W} height={v.H} fill={J.spleen} />
      <Local v={v}>
        <defs>
          <pattern
            id="dv-pores"
            patternUnits="userSpaceOnUse"
            width={2.2}
            height={3.8}
            patternTransform={`scale(${k})`}
          >
            <rect width={2.2} height={3.8} fill={J.spleen} />
            {[
              [1.1, 0.95],
              [0, 2.85],
              [2.2, 2.85],
            ].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                <circle r={1.0} fill={J.spleenPore} stroke={J.spleenLight} strokeWidth={0.12} />
                {[0, 1, 2].map((c) => {
                  const a = (c / 3) * Math.PI * 2 + i;
                  return (
                    <g
                      key={c}
                      transform={`translate(${0.45 * Math.cos(a)} ${0.45 * Math.sin(a)}) rotate(${a * 57})`}
                    >
                      <ellipse
                        rx={0.38}
                        ry={0.31}
                        fill={J.cell}
                        stroke={J.cellCore}
                        strokeWidth={0.04}
                      />
                      <ellipse rx={0.17} ry={0.12} fill={J.cellCore} opacity={0.7} />
                    </g>
                  );
                })}
              </g>
            ))}
          </pattern>
        </defs>
        <rect
          x={v.cam.x - w}
          y={v.cam.y - w}
          width={Math.max(0, 3.5 - (v.cam.x - w))}
          height={2 * w}
          fill="url(#dv-pores)"
        />
        {/* The vessel the cells pour into: a tube of pale blood to the right. */}
        <path d="M 3.5 -2.2 L 60 -2.2 L 60 3.4 L 3.5 3.4 Z" fill={J.plasma} opacity={0.95} />
        <path
          d="M 3.5 -2.2 L 60 -2.2 M 3.5 3.4 L 60 3.4"
          stroke={J.vessel}
          strokeWidth={10 * p}
          {...NS}
        />
        {stream}
        {tank > 0 && (
          <g>
            <path d={tankPath} fill={J.gold} opacity={0.22 * smooth(tank)} />
            <path
              d={tankPath}
              fill="none"
              stroke={J.gold}
              strokeWidth={(16 * p) / v.k}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={`${smooth(tank)} 2`}
            />
          </g>
        )}
      </Local>
    </g>
  );
}

/** One red blood cell: a red disc, dimpled in its middle. */
function Rbc({
  x,
  y,
  turn,
  r,
  p,
  opacity = 1,
}: {
  x: number;
  y: number;
  turn: number;
  r: number;
  p: number;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn})`} opacity={opacity}>
      <ellipse rx={r} ry={r * 0.82} fill={J.cell} stroke={J.cellCore} strokeWidth={2 * p} {...NS} />
      <ellipse rx={r * 0.45} ry={r * 0.32} fill={J.cellCore} opacity={0.7} />
    </g>
  );
}

// ============================================================================================
// The Earth from space, in thousands of kilometres.
const ER = 6.371;
/** Lands as patches on the globe: longitude, latitude (degrees), size in thousands of km. */
const LANDS: [number, number, number, number][] = [
  [0, 48, 2.6, 1.3],
  [40, 52, 3.2, 1.2],
  [100, 42, 2.8, 1.5],
  [160, 55, 2.4, 1.0],
  [220, 45, 3.0, 1.4],
  [280, 50, 2.8, 1.1],
  [20, 22, 1.8, 1.6],
  [130, 25, 1.6, 1.0],
  [250, 24, 1.8, 1.2],
  [60, -38, 1.4, 1.4],
  [190, -34, 2.0, 1.2],
  [300, -40, 1.6, 1.3],
];
function Earth({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  const halo = s.thing('halo', 1.2);
  const spin = s.t * 9;
  const [cx, cy] = at(v, 0, 0);
  const r = ER * v.k;
  const close = r > 3 * v.W;
  return (
    <g>
      <rect width={v.W} height={v.H} fill={J.space} />
      {Array.from({ length: 80 }, (_, i) => (
        <circle
          key={i}
          cx={rnd(i, 1) * v.W}
          cy={rnd(i, 2) * v.H}
          r={(1 + 1.6 * rnd(i, 3)) * p}
          fill={J.star}
          opacity={0.3 + 0.5 * (0.5 + 0.5 * Math.sin(s.t * 1.6 + i))}
        />
      ))}
      <defs>
        <radialGradient id="dv-earth" cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor={J.ocean} />
          <stop offset="1" stopColor={J.oceanShade} />
        </radialGradient>
        <clipPath id="dv-earth-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={close ? 0 : r * (1.05 + 0.03 * halo)}
        fill={J.skyMid}
        opacity={0.25 + 0.25 * halo * (0.6 + 0.4 * Math.sin(s.t * 3))}
      />
      {close ? (
        <rect width={v.W} height={v.H} fill={J.ocean} />
      ) : (
        <circle cx={cx} cy={cy} r={r} fill="url(#dv-earth)" />
      )}
      <g clipPath={close ? undefined : 'url(#dv-earth-clip)'}>
        {LANDS.map(([lon, lat, w, h], i) => {
          const a = ((lon - spin) * Math.PI) / 180;
          if (Math.cos(a) < -0.1) return null;
          const la = (lat * Math.PI) / 180;
          const x = ER * Math.cos(la) * Math.sin(a);
          const y = -ER * Math.sin(la);
          const [sx, sy] = at(v, x, y);
          return (
            <ellipse
              key={i}
              cx={sx}
              cy={sy}
              rx={w * v.k * Math.max(0.15, Math.cos(a))}
              ry={h * v.k}
              fill={J.land}
              opacity={clamp(Math.cos(a) * 3)}
            />
          );
        })}
        {Array.from({ length: 9 }, (_, i) => {
          const a = ((i * 40 - spin * 1.4) * Math.PI) / 180;
          if (Math.cos(a) < 0) return null;
          const la = ((i % 2 ? 30 : 60) * (i % 3 ? 1 : -1) * Math.PI) / 180;
          const [sx, sy] = at(v, ER * Math.cos(la) * Math.sin(a), -ER * Math.sin(la));
          return (
            <ellipse
              key={`c${i}`}
              cx={sx}
              cy={sy}
              rx={1.4 * v.k * Math.cos(a)}
              ry={0.3 * v.k}
              fill={J.cloud}
              opacity={0.75}
            />
          );
        })}
        <circle
          cx={cx - r * 0.25}
          cy={cy - r * 0.3}
          r={r * 1.1}
          fill="none"
          stroke={J.night}
          strokeWidth={0}
        />
        {!close && (
          <path
            d={`M ${cx + r * 0.2} ${cy - r * 1.2} A ${r * 1.3} ${r * 1.3} 0 0 1 ${cx + r * 0.2} ${cy + r * 1.2} L ${cx + r * 2} ${cy + r} L ${cx + r * 2} ${cy - r} Z`}
            fill={J.night}
            opacity={0.35}
          />
        )}
      </g>
    </g>
  );
}

// ============================================================================================
// A cold sea, in metres: the surface at 0 with ice on it, a seal gliding below.
const SEAL = { x: 0.2, y: 2.1 };
function ColdSea({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  const [, surf] = at(v, 0, 0);
  const spleen = s.thing('seal-spleen', 1);
  const glide = s.t * 0.6;
  const sx = SEAL.x + 0.15 * Math.sin(s.t * 0.7);
  const sy = SEAL.y + 0.08 * Math.sin(s.t * 1.1);
  const tail = Math.sin(s.t * 3);
  return (
    <g>
      <rect width={v.W} height={v.H} fill={J.skyCold} />
      <defs>
        <linearGradient id="dv-cold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.seaCold} />
          <stop offset="1" stopColor={J.seaColdDeep} />
        </linearGradient>
      </defs>
      <rect
        x={0}
        y={clamp(surf, -10, v.H)}
        width={v.W}
        height={Math.max(0, v.H - surf)}
        fill="url(#dv-cold)"
      />
      <Local v={v}>
        {/* Light falling through the water. */}
        {[-2.6, -1.2, 0.4, 1.9].map((x, i) => (
          <path
            key={i}
            d={`M ${x} 0 L ${x + 0.5} 0 L ${x + 1.4} 5 L ${x + 0.6} 5 Z`}
            fill={J.ice}
            opacity={0.06 + 0.03 * Math.sin(s.t + i)}
          />
        ))}
        {/* Ice floating on the surface. */}
        {[
          [-3.2, 1.6],
          [-0.9, 1.1],
          [1.6, 2.0],
          [4.2, 1.3],
        ].map(([x, w], i) => (
          <g key={i} transform={`translate(${(x ?? 0) + 0.1 * Math.sin(s.t * 0.4 + i)} 0)`}>
            <path d={`M 0 -0.12 L ${w} -0.1 L ${(w ?? 1) - 0.1} 0.22 L 0.15 0.25 Z`} fill={J.ice} />
            <path
              d={`M 0.15 0.05 L ${(w ?? 1) - 0.1} 0.05 L ${(w ?? 1) - 0.1} 0.22 L 0.15 0.25 Z`}
              fill={J.iceShade}
            />
          </g>
        ))}
        {/* Specks drifting past, so the seal is seen to glide. */}
        {Array.from({ length: 30 }, (_, i) => {
          const x = ((((rnd(i, 21) * 12 - glide) % 12) + 12) % 12) - 6;
          return (
            <circle
              key={`m${i}`}
              cx={x}
              cy={0.4 + rnd(i, 22) * 4}
              r={0.015}
              fill={J.ice}
              opacity={0.5}
            />
          );
        })}
        {/* The seal. */}
        <g transform={`translate(${sx} ${sy}) rotate(${4 * Math.sin(s.t * 1.1)})`}>
          <path
            d={`M -0.95 ${0.02 + 0.06 * tail} Q -0.7 -0.2 -0.1 -0.24 Q 0.55 -0.26 0.82 -0.06 Q 0.95 0.04 0.82 0.1 Q 0.5 0.24 -0.1 0.2 Q -0.6 0.18 -0.95 ${0.02 + 0.06 * tail} Z`}
            fill={J.seal}
            stroke={LINE.color}
            strokeWidth={2.5 * p}
            {...NS}
          />
          <path d="M -0.6 0.1 Q 0 0.24 0.6 0.1 Q 0 0.17 -0.6 0.1 Z" fill={J.sealBelly} />
          <path
            d={`M -0.95 ${0.02 + 0.06 * tail} L -1.2 ${-0.12 + 0.12 * tail} L -1.12 ${0.04 + 0.06 * tail} L -1.22 ${0.18 + 0.1 * tail} Z`}
            fill={J.sealShade}
          />
          <path d={`M 0.25 0.12 L ${0.08 + 0.05 * tail} 0.38 L 0.38 0.16 Z`} fill={J.sealShade} />
          <circle cx={0.72} cy={-0.08} r={0.025} fill={LINE.color} />
          {spleen > 0 && (
            <g opacity={smooth(spleen)}>
              <ellipse cx={0.05} cy={0.02} rx={0.42} ry={0.16} fill={J.inside} opacity={0.75} />
              <ellipse
                cx={0.05}
                cy={0.02}
                rx={0.36 * (0.9 + 0.1 * Math.sin(s.t * 3))}
                ry={0.12}
                fill={J.spleenLight}
                opacity={0.5}
              />
              <path
                d="M -0.28 0.02 Q -0.26 -0.08 0.05 -0.08 Q 0.36 -0.08 0.38 0.02 Q 0.36 0.1 0.08 0.09 Q -0.26 0.11 -0.28 0.02 Z"
                fill={J.spleen}
                stroke={J.spleenLight}
                strokeWidth={3 * p}
                {...NS}
              />
            </g>
          )}
        </g>
      </Local>
      <Tag v={v} x={sx + 0.05} y={sy - 0.45} text="ITS SPLEEN" shown={spleen} />
    </g>
  );
}

// ============================================================================================
// The Bajau's warm sea, in metres: the surface at 0, the village on stilts to the left, the
// houseboats to the right, the reef below them, the shore with the scan further left, and the
// journal page high in the sky over the village.
const PAGE = { x: -14, y: -24, w: 7, h: 9.4 };
const HOUSES = [-34, -26, -18, -10];
const BOATS = [8, 16, 24];
/** The seabed's depth at x: shallow by the village and the shore, deeper on the reef. */
const bedY = (x: number) =>
  x < -42 ? lerp(-0.8, 4, clamp((x + 46) / 4)) : x < 2 ? 4 : lerp(4, 7.5, clamp((x - 2) / 10));

function Bajau({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  if (v.cam.w < 0.05) return null;
  const [, surf] = at(v, 0, 0);
  const years = s.thing('years', 2.6);
  const night = years > 0 && years < 1 ? 0.55 * Math.sin(years * Math.PI * 6) ** 2 : 0;
  const boatsIn = s.thing('houseboats', 1.2);
  const wave = (x: number) => 0.12 * Math.sin(x * 0.8 - s.t * 1.6) + 0.06 * Math.sin(x * 1.9 + s.t);
  const seaTop = Array.from({ length: 61 }, (_, i) => {
    const x = -80 + i * 2.5;
    return `${x} ${wave(x).toFixed(3)}`;
  });
  const bed = Array.from({ length: 61 }, (_, i) => {
    const x = -80 + i * 2.5;
    return `${x} ${bedY(x).toFixed(3)}`;
  });
  const sunX = years > 0 && years < 1 ? lerp(-60, 60, (years * 3) % 1) : 30;
  return (
    <g>
      <defs>
        <linearGradient id="dv-warm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.skyWarm} />
          <stop offset="1" stopColor={J.skyWarmLow} />
        </linearGradient>
        <linearGradient id="dv-warm-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.seaWarmLight} />
          <stop offset="1" stopColor={J.seaWarmDeep} />
        </linearGradient>
      </defs>
      <rect width={v.W} height={v.H} fill="url(#dv-warm-sky)" />
      <Local v={v}>
        <circle cx={sunX} cy={-30} r={3.2} fill={J.sun} />
        {[-40, -8, 22].map((x, i) => (
          <ellipse
            key={i}
            cx={x + ((s.t * 0.6) % 20)}
            cy={-34 + i * 4}
            rx={6}
            ry={1.4}
            fill={J.cloud}
            opacity={0.85}
          />
        ))}
        {/* The shore: sand, two palms, and the scan under its shade. */}
        <path d="M -90 -0.8 L -44 -0.8 Q -42 -0.6 -41 0.5 L -38 9 L -90 9 Z" fill={J.sand} />
        {[-62, -56].map((x, i) => (
          <g key={i}>
            <path
              d={`M ${x} -0.8 Q ${x + 0.6} -4 ${x + 1.5} -7.5`}
              fill="none"
              stroke={J.wood}
              strokeWidth={0.35}
            />
            {[0, 1, 2, 3, 4].map((f) => (
              <path
                key={f}
                d={`M ${x + 1.5} -7.5 q ${2 * Math.cos(f * 1.3)} ${-1 + Math.sin(f * 1.3) * 1.2 + 0.2 * Math.sin(s.t + f)} ${3 * Math.cos(f * 1.3)} ${0.8 + Math.sin(f * 1.3)}`}
                fill="none"
                stroke={J.weed}
                strokeWidth={0.35}
                strokeLinecap="round"
              />
            ))}
          </g>
        ))}
        <path
          d="M -53.5 -0.8 L -53.5 -4.2 M -46.5 -0.8 L -46.5 -4.2"
          stroke={J.woodShade}
          strokeWidth={0.18}
        />
        <path d="M -54.5 -4 L -50 -5.4 L -45.5 -4 Z" fill={J.thatch} />
        <Scanner v={v} s={s} />
      </Local>
      <rect
        x={0}
        y={clamp(surf, -10, v.H + 10)}
        width={v.W}
        height={Math.max(0, v.H - surf)}
        fill="url(#dv-warm-sea)"
        opacity={0}
      />
      <Local v={v}>
        <path
          d={`M ${seaTop.join(' L ')} L 120 12 L -80 12 Z`}
          fill="url(#dv-warm-sea)"
          opacity={0.95}
        />
        {/* Light falling through the water. */}
        {[-30, -15, 0, 15, 30].map((x, i) => (
          <path
            key={i}
            d={`M ${x} 0 L ${x + 3} 0 L ${x + 7} 8 L ${x + 3} 8 Z`}
            fill={J.skyWarmLow}
            opacity={0.07 + 0.03 * Math.sin(s.t * 0.8 + i)}
          />
        ))}
        <path d={`M ${bed.join(' L ')} L 120 14 L -80 14 Z`} fill={J.seabed} />
        <path d={`M ${bed.join(' L ')}`} fill="none" stroke={J.seabedShade} strokeWidth={0.12} />
        <Reef v={v} s={s} />
        <path
          d={`M ${seaTop.join(' L ')} L 120 14 L -80 14 Z`}
          fill="url(#dv-warm-sea)"
          opacity={0.5}
        />
        {/* The village on its stilts. */}
        {HOUSES.map((x, i) => (
          <House key={x} x={x} i={i} p={p} />
        ))}
        <path d="M -37 -2.4 L -7 -2.4" stroke={J.woodShade} strokeWidth={0.22} />
        <Family s={s} />
        {/* The houseboats, sailing in and rocking. */}
        {BOATS.map((x, i) => {
          const dx = (1 - smooth(boatsIn)) * (24 + i * 6);
          const rock = 3 * Math.sin(s.t * 1.2 + i);
          return (
            <g
              key={x}
              transform={`translate(${x + dx} ${wave(x) - 0.1}) rotate(${rock})`}
              opacity={boatsIn > 0 || s.thing('years') > 0 ? 1 : 0.0}
            >
              <path
                d="M -3.2 -0.5 Q -2.6 0.7 0 0.7 Q 2.6 0.7 3.4 -0.6 L 3.6 -0.9 L 2.4 -0.5 L -2.4 -0.5 L -3.4 -0.8 Z"
                fill={J.hull}
              />
              <path d="M -3.2 -0.5 L 3.4 -0.5" stroke={J.hullShade} strokeWidth={0.12} />
              <path d="M -1.8 -0.5 L -1.6 -1.9 Q 0 -2.5 1.6 -1.9 L 1.8 -0.5 Z" fill={J.thatch} />
              <path
                d="M -1.6 -1.9 Q 0 -2.5 1.6 -1.9"
                fill="none"
                stroke={J.thatchShade}
                strokeWidth={0.1}
              />
              <rect x={-0.3} y={-1.5} width={0.6} height={1} fill={J.thatchShade} opacity={0.6} />
            </g>
          );
        })}
        <path
          d={`M ${seaTop.join(' L ')}`}
          fill="none"
          stroke={J.foam}
          strokeWidth={3 * p}
          opacity={0.7}
          {...NS}
        />
        <Diver s={s} p={p} />
        <Page v={v} s={s} />
      </Local>
      {night > 0 && <rect width={v.W} height={v.H} fill={J.night} opacity={night} />}
    </g>
  );
}

function House({ x, i, p }: { x: number; i: number; p: number }) {
  const w = 5.6;
  return (
    <g>
      {[-2.4, -0.8, 0.8, 2.4].map((d) => (
        <line
          key={d}
          x1={x + d}
          y1={-2.4}
          x2={x + d + 0.1 * (i % 2 ? 1 : -1)}
          y2={4.1}
          stroke={J.woodShade}
          strokeWidth={0.22}
        />
      ))}
      <rect x={x - w / 2 - 0.3} y={-2.6} width={w + 0.6} height={0.3} fill={J.wood} />
      <rect
        x={x - w / 2}
        y={-5.4}
        width={w}
        height={2.8}
        fill={i % 2 ? J.wood : J.houseWall}
        stroke={J.woodShade}
        strokeWidth={2 * p}
        {...NS}
      />
      <rect x={x - 0.5} y={-4.8} width={1} height={1.2} fill={J.inside} opacity={0.75} />
      <rect x={x + 1.4} y={-4.7} width={0.8} height={0.7} fill={J.window} />
      <path
        d={`M ${x - w / 2 - 0.8} -5.3 L ${x} -8 L ${x + w / 2 + 0.8} -5.3 Z`}
        fill={J.thatch}
        stroke={J.thatchShade}
        strokeWidth={2 * p}
        {...NS}
      />
    </g>
  );
}

/** A Bajau family on their platform; inside the grown-up, a bigger tank glowing. */
function Family({ s }: { s: State }) {
  const tank = s.thing('big-tank', 1.2);
  const fig = (x: number, h: number, shirt: string) => (
    <g transform={`translate(${x} -2.6) scale(${h})`}>
      <path d="M -0.13 0 L -0.1 -0.86 L 0.1 -0.86 L 0.13 0 Z" fill={J.trousers} />
      <rect x={-0.2} y={-1.46} width={0.4} height={0.66} rx={0.12} fill={shirt} />
      <circle cx={0} cy={-1.62} r={0.13} fill={J.skin} />
      <path
        d="M -0.17 -1.38 Q -0.24 -1.1 -0.22 -0.9 M 0.17 -1.38 Q 0.24 -1.1 0.22 -0.9"
        stroke={shirt}
        strokeWidth={0.08}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
  return (
    <g>
      {fig(-16.9, 1, J.cross)}
      {fig(-16.2, 0.7, J.gold)}
      {tank > 0 && (
        <g
          transform={`translate(-16.9 -3.85) scale(${0.6 + 0.4 * outBack(clamp(tank))})`}
          opacity={smooth(tank)}
        >
          <circle r={0.5 * (1 + 0.08 * Math.sin(s.t * 4))} fill={J.gold} opacity={0.35} />
          <rect
            x={-0.14}
            y={-0.26}
            width={0.28}
            height={0.48}
            rx={0.12}
            fill={J.gold}
            stroke={LINE.color}
            strokeWidth={0.03}
          />
          <rect x={-0.05} y={-0.34} width={0.1} height={0.09} fill={LINE.color} />
        </g>
      )}
    </g>
  );
}

/** The reef: corals, weed swaying, and a school of fish circling. */
function Reef({ v, s }: { v: View; s: State }) {
  if (v.cam.w > 80) return null;
  const fish = s.thing('fish', 1);
  return (
    <g>
      {Array.from({ length: 14 }, (_, i) => {
        const x = 2 + i * 1.3 + 0.4 * rnd(i, 31);
        const y = bedY(x);
        const h = 0.6 + 0.9 * rnd(i, 32);
        return i % 3 === 0 ? (
          <path
            key={i}
            d={`M ${x} ${y} Q ${x - 0.3 + 0.1 * Math.sin(s.t + i)} ${y - h / 2} ${x + 0.1 * Math.sin(s.t * 1.3 + i)} ${y - h * 1.3}`}
            fill="none"
            stroke={J.weed}
            strokeWidth={0.12}
            strokeLinecap="round"
          />
        ) : (
          <g key={i} fill={i % 2 ? J.coral : J.coralTwo}>
            <ellipse cx={x} cy={y - h * 0.4} rx={0.35 * h} ry={0.45 * h} />
            <ellipse cx={x + 0.3 * h} cy={y - h * 0.2} rx={0.25 * h} ry={0.3 * h} />
          </g>
        );
      })}
      {Array.from({ length: 14 }, (_, i) => {
        // Four fish are always about the reef; the rest of the school comes in on its word.
        if (i >= 4 && fish <= 0) return null;
        const a = s.t * 0.7 + (i / 14) * Math.PI * 2;
        const x = 12.6 + 1.8 * Math.cos(a) + 0.3 * rnd(i, 41);
        const y = 4.9 + 0.7 * Math.sin(a) + 0.3 * rnd(i, 42);
        const dir = -Math.sin(a) >= 0 ? 1 : -1;
        return (
          <g
            key={`f${i}`}
            transform={`translate(${x} ${y}) scale(${dir} 1)`}
            opacity={i < 4 ? 1 : smooth(fish)}
          >
            <path
              d="M -0.18 0 Q 0 -0.1 0.18 0 Q 0 0.1 -0.18 0 Z M -0.18 0 L -0.28 -0.07 L -0.28 0.07 Z"
              fill={i % 3 ? J.fish : J.fishTwo}
            />
          </g>
        );
      })}
    </g>
  );
}

/** A Bajau diver: diving down from the surface to the reef, wooden goggles on, kicking. */
function Diver({ s, p }: { s: State; p: number }) {
  const d = s.thing('diver', 1.6);
  if (d <= 0) return null;
  const x = lerp(8, 10.4, smooth(d)) + 0.15 * Math.sin(s.t * 0.8);
  const y = lerp(1.2, 5.4, smooth(d)) + 0.08 * Math.sin(s.t * 1.2);
  const kick = Math.sin(s.t * 6);
  return (
    <g transform={`translate(${x} ${y}) rotate(${lerp(60, 12, smooth(d))})`}>
      <path
        d={`M -0.2 0 L -0.75 ${0.08 * kick} M -0.2 0.06 L -0.75 ${-0.08 * kick}`}
        stroke={J.skin}
        strokeWidth={0.1}
        strokeLinecap="round"
      />
      <rect x={-0.25} y={-0.12} width={0.6} height={0.24} rx={0.1} fill={J.cross} />
      <path d="M 0.3 -0.06 L 0.62 -0.2" stroke={J.skin} strokeWidth={0.08} strokeLinecap="round" />
      <circle cx={0.48} cy={0} r={0.12} fill={J.skin} />
      <rect x={0.5} y={-0.07} width={0.12} height={0.07} rx={0.02} fill={J.goggles} />
      <rect x={0.56} y={-0.06} width={0.05} height={0.05} rx={0.01} fill={J.lens} />
      {Array.from({ length: 3 }, (_, i) => {
        const f = (s.t * 0.5 + i / 3) % 1;
        return (
          <circle
            key={i}
            cx={0.55 + 0.05 * Math.sin(s.t * 3 + i)}
            cy={-0.2 - f * 1.4}
            r={0.04}
            fill="none"
            stroke={J.bubble}
            strokeWidth={2 * p}
            opacity={1 - f}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </g>
  );
}

/** The scan on the shore: a cart with its screen, the two spleens on it as they are named. */
function Scanner({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  const bajau = s.thing('bajau-spleen', 0.6);
  const saluan = s.thing('saluan-spleen', 0.6);
  const tennis = s.thing('tennis', 0.6);
  const genes = s.thing('genes', 1);
  const S = SCREEN;
  const grain = (cx: number, cy: number, rx: number, ry: number, seed: number) =>
    Array.from({ length: 22 }, (_, i) => {
      const a = rnd(i, seed) * Math.PI * 2;
      const r = Math.sqrt(rnd(i, seed + 1));
      return (
        <circle
          key={i}
          cx={cx + rx * r * Math.cos(a)}
          cy={cy + ry * r * Math.sin(a)}
          r={0.006}
          fill={J.scanImage}
          opacity={0.6}
        />
      );
    });
  return (
    <g>
      {/* The cart, its shelf, and a Bajau sitting beside it. */}
      <rect x={S.x - 0.7} y={-1.45} width={1.4} height={0.08} fill={J.scanCase} />
      <path
        d={`M ${S.x - 0.55} -1.4 L ${S.x - 0.55} -0.8 M ${S.x + 0.55} -1.4 L ${S.x + 0.55} -0.8`}
        stroke={J.faucetShade}
        strokeWidth={0.06}
      />
      <rect x={S.x - 0.1} y={S.y + S.h / 2} width={0.2} height={0.5} fill={J.scanCase} />
      <rect
        x={S.x - S.w / 2 - 0.06}
        y={S.y - S.h / 2 - 0.06}
        width={S.w + 0.12}
        height={S.h + 0.12}
        rx={0.05}
        fill={J.scanCase}
        stroke={LINE.color}
        strokeWidth={2 * p}
        vectorEffect="non-scaling-stroke"
      />
      <rect x={S.x - S.w / 2} y={S.y - S.h / 2} width={S.w} height={S.h} fill={J.scanScreen} />
      <g transform={`translate(${S.x - 1.4} -0.8)`}>
        <rect x={-0.3} y={-0.45} width={0.6} height={0.08} fill={J.wood} />
        <path d="M -0.12 -0.45 L -0.1 -1.05 L 0.1 -1.05 L 0.12 -0.45 Z" fill={J.cross} />
        <circle cx={0} cy={-1.2} r={0.12} fill={J.skin} />
      </g>
      {bajau > 0 && (
        <g opacity={smooth(bajau) * (1 - 0.8 * smooth(genes))}>
          <ellipse
            cx={SCAN_SPLEEN.x}
            cy={SCAN_SPLEEN.y}
            rx={0.2 * (0.8 + 0.2 * smooth(bajau))}
            ry={0.13}
            fill={J.scanImageDim}
            opacity={0.7}
          />
          {grain(SCAN_SPLEEN.x, SCAN_SPLEEN.y, 0.18, 0.11, 50)}
        </g>
      )}
      {saluan > 0 && (
        <g opacity={smooth(saluan)}>
          <ellipse
            cx={S.x + 0.3}
            cy={S.y - 0.02}
            rx={0.165}
            ry={0.105}
            fill={J.scanImageDim}
            opacity={0.7}
          />
          {grain(S.x + 0.3, S.y - 0.02, 0.15, 0.09, 60)}
        </g>
      )}
      {tennis > 0 && (
        <g transform={`translate(${S.x + 0.45} ${-1.45 - 0.034}) scale(${smooth(tennis)})`}>
          <circle r={0.034} fill={J.tennis} />
          <path
            d="M -0.024 -0.024 Q 0 0 -0.024 0.024 M 0.024 -0.024 Q 0 0 0.024 0.024"
            fill="none"
            stroke={J.tennisLine}
            strokeWidth={0.005}
          />
        </g>
      )}
    </g>
  );
}

/** The words on the screen and around the scan, in the picture's own pixels. */
function ScanWords({ v, s }: { v: View; s: State }) {
  const bajau = s.thing('bajau-spleen', 0.6);
  const saluan = s.thing('saluan-spleen', 0.6);
  const tennis = s.thing('tennis', 0.6);
  const size = 0.07 * v.k;
  if (size < 8 || v.cam.w > 12) return null;
  const word = (x: number, y: number, text: string, shown: number) => {
    const [sx, sy] = at(v, x, y);
    return shown > 0 ? (
      <text
        x={sx}
        y={sy}
        fontFamily={font}
        fontWeight={700}
        fontSize={size}
        fill={J.scanImage}
        textAnchor="middle"
        opacity={smooth(shown)}
      >
        {text}
      </text>
    ) : null;
  };
  return (
    <g>
      {word(SCAN_SPLEEN.x, SCREEN.y + 0.3, 'BAJAU', bajau)}
      {word(SCREEN.x + 0.3, SCREEN.y + 0.3, 'SALUAN', saluan)}
      <Tag v={v} x={SCREEN.x + 0.45} y={-1.62} text="TENNIS BALL" shown={tennis} />
    </g>
  );
}

/** The gene, close in on the scan: a strand of DNA turning, one piece of it glowing. */
function Dna({ v, s }: { v: View; s: State }) {
  if (v.cam.w > 600) return null;
  const p = pxOf(v);
  const shown = clamp((600 - v.cam.w) / 350);
  const genes = s.thing('genes', 1);
  const turn = s.t * 1.4;
  const rungs: ReactNode[] = [];
  const a: string[] = [];
  const b: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = -90 + i * 1.5;
    const ph = x * 0.12 + turn;
    a.push(`${x} ${(10 * Math.sin(ph)).toFixed(2)}`);
    b.push(`${x} ${(10 * Math.sin(ph + Math.PI)).toFixed(2)}`);
    if (i % 3 === 0) {
      const lit = Math.abs(x - 6) < 10;
      rungs.push(
        <line
          key={i}
          x1={x}
          y1={10 * Math.sin(ph)}
          x2={x}
          y2={10 * Math.sin(ph + Math.PI)}
          stroke={lit && genes > 0 ? J.dnaGlow : J.pageBar}
          strokeWidth={(lit && genes > 0 ? 9 : 5) * p}
          opacity={0.9}
          {...NS}
        />,
      );
    }
  }
  return (
    <g opacity={shown}>
      <rect width={v.W} height={v.H} fill={J.scanScreen} />
      <Local v={v}>
        {genes > 0 && (
          <ellipse
            cx={6}
            cy={0}
            rx={16}
            ry={16}
            fill={J.dnaGlow}
            opacity={0.18 * smooth(genes) * (0.7 + 0.3 * Math.sin(s.t * 4))}
          />
        )}
        {rungs}
        <path
          d={`M ${a.join(' L ')}`}
          fill="none"
          stroke={J.dnaA}
          strokeWidth={12 * p}
          strokeLinecap="round"
          {...NS}
        />
        <path
          d={`M ${b.join(' L ')}`}
          fill="none"
          stroke={J.dnaB}
          strokeWidth={12 * p}
          strokeLinecap="round"
          {...NS}
        />
      </Local>
      <Tag v={v} x={6} y={-20} text="IN THEIR GENES" shown={genes} />
    </g>
  );
}

/** The journal page in the sky: its lines of print, a figure of a gene, a spleen beside it. */
const FIG = { x: PAGE.x, y: PAGE.y + 1.6, w: 5.2, h: 3 };
function Page({ v, s }: { v: View; s: State }) {
  const journal = s.thing('journal', 1);
  const p = pxOf(v);
  if (journal <= 0) {
    // Before its word: the page waiting in the sky as a pale outline of what is coming (L-0048).
    if (v.cam.w > 60) return null;
    const P0 = PAGE;
    return (
      <g transform={`rotate(${2 * Math.sin(s.t * 0.6)} ${P0.x} ${P0.y})`} opacity={0.35}>
        <rect
          x={P0.x - P0.w / 2}
          y={P0.y - P0.h / 2}
          width={P0.w}
          height={P0.h}
          fill={J.page}
          stroke={LINE.color}
          strokeWidth={2 * p}
          {...NS}
        />
        <rect x={P0.x - P0.w / 2} y={P0.y - P0.h / 2} width={P0.w} height={0.9} fill={J.pageBar} />
      </g>
    );
  }
  const gene = s.thing('gene', 0.8);
  const hormone = s.thing('hormone', 2);
  const sway = 2 * Math.sin(s.t * 0.6);
  const rise = (1 - smooth(journal)) * 6;
  const sc = 0.4 + 0.6 * outBack(clamp(journal));
  const P = PAGE;
  const gx = FIG.x - 0.6;
  const helix: string[] = [];
  const helix2: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = FIG.x - 2.3 + i * 0.1;
    helix.push(`${x} ${FIG.y + 0.45 * Math.sin(x * 3 + s.t)}`);
    helix2.push(`${x} ${FIG.y + 0.45 * Math.sin(x * 3 + s.t + Math.PI)}`);
  }
  return (
    <g
      transform={`translate(${P.x} ${P.y + rise}) rotate(${sway}) scale(${sc}) translate(${-P.x} ${-P.y})`}
      opacity={clamp(journal * 3)}
    >
      <rect
        x={P.x - P.w / 2 + 0.2}
        y={P.y - P.h / 2 + 0.25}
        width={P.w}
        height={P.h}
        fill={J.shadow}
        opacity={0.25}
      />
      <rect
        x={P.x - P.w / 2}
        y={P.y - P.h / 2}
        width={P.w}
        height={P.h}
        fill={J.page}
        stroke={LINE.color}
        strokeWidth={2 * p}
        {...NS}
      />
      <rect x={P.x - P.w / 2} y={P.y - P.h / 2} width={P.w} height={0.9} fill={J.pageInk} />
      {Array.from({ length: 4 }, (_, i) => (
        <rect
          key={i}
          x={P.x - P.w / 2 + 0.4}
          y={P.y - P.h / 2 + 1.3 + i * 0.35}
          width={(i === 3 ? 0.6 : 1) * (P.w - 0.8)}
          height={0.16}
          fill={J.pageBar}
        />
      ))}
      <rect
        x={FIG.x - FIG.w / 2}
        y={FIG.y - FIG.h / 2}
        width={FIG.w}
        height={FIG.h}
        fill={J.bathWall}
        stroke={J.pageBar}
        strokeWidth={2 * p}
        {...NS}
      />
      {Array.from({ length: 13 }, (_, i) => {
        const x = FIG.x - 2.3 + i * 0.33;
        const lit = Math.abs(x - gx) < 0.2;
        return (
          <line
            key={i}
            x1={x}
            y1={FIG.y + 0.45 * Math.sin(x * 3 + s.t)}
            x2={x}
            y2={FIG.y + 0.45 * Math.sin(x * 3 + s.t + Math.PI)}
            stroke={lit && gene > 0 ? J.dnaGlow : J.pageBar}
            strokeWidth={(lit && gene > 0 ? 8 : 4) * p}
            {...NS}
          />
        );
      })}
      <path d={`M ${helix.join(' L ')}`} fill="none" stroke={J.dnaA} strokeWidth={6 * p} {...NS} />
      <path d={`M ${helix2.join(' L ')}`} fill="none" stroke={J.dnaB} strokeWidth={6 * p} {...NS} />
      {gene > 0 && (
        <circle
          cx={gx}
          cy={FIG.y}
          r={0.55}
          fill={J.dnaGlow}
          opacity={0.25 * smooth(gene) * (0.7 + 0.3 * Math.sin(s.t * 4))}
        />
      )}
      {/* A spleen drawn on the page, and a hormone drifting from the gene toward it. */}
      <path
        d={`M ${FIG.x + 1.3} ${FIG.y + 0.1} q 0 -0.4 0.5 -0.4 q 0.6 0 0.6 0.4 q 0 0.4 -0.5 0.35 q -0.6 0.05 -0.6 -0.35 Z`}
        fill={J.spleen}
      />
      {hormone > 0 && (
        <g>
          <path
            d={`M ${gx} ${FIG.y} Q ${FIG.x + 0.4} ${FIG.y - 1.2} ${FIG.x + 1.5} ${FIG.y - 0.2}`}
            fill="none"
            stroke={J.hormone}
            strokeWidth={4 * p}
            strokeDasharray={`${8 * p} ${8 * p}`}
            {...NS}
          />
          {Array.from({ length: 5 }, (_, i) => {
            const f = (s.t * 0.4 + i / 5) % 1;
            const x = lerp(gx, FIG.x + 1.5, f);
            const y = FIG.y - Math.sin(f * Math.PI) * 1.0 - 0.2 * f;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={0.1}
                fill={J.hormone}
                opacity={smooth(hormone) * Math.sin(f * Math.PI)}
              />
            );
          })}
        </g>
      )}
      {Array.from({ length: 5 }, (_, i) => (
        <rect
          key={`b${i}`}
          x={P.x - P.w / 2 + 0.4}
          y={FIG.y + FIG.h / 2 + 0.4 + i * 0.35}
          width={(i === 4 ? 0.5 : 1) * (P.w - 0.8)}
          height={0.16}
          fill={J.pageBar}
        />
      ))}
    </g>
  );
}

/** The words of the page: the journal's name in its band, the gene's name by its glow. */
function PageWords({ v, s }: { v: View; s: State }) {
  const journal = s.thing('journal', 1);
  const gene = s.thing('gene', 0.8);
  if (journal < 0.6) return null;
  const size = 0.55 * v.k;
  if (size < 10) return null;
  const sway = 2 * Math.sin(s.t * 0.6);
  const [hx, hy] = at(v, PAGE.x - PAGE.w / 2 + 0.4, PAGE.y - PAGE.h / 2 + 0.66);
  return (
    <g>
      <text
        x={hx}
        y={hy}
        fontFamily={font}
        fontWeight={700}
        fontSize={size}
        fill={J.page}
        transform={`rotate(${sway} ${at(v, PAGE.x, PAGE.y).join(' ')})`}
      >
        Cell
      </text>
      <Tag v={v} x={FIG.x - 0.6} y={FIG.y - 1.0} text="PDE10A" shown={gene} />
    </g>
  );
}

// ============================================================================================
// The pool of the breath-hold record, in metres: the lobby floor at 0, the pool 3 m deep.
const TANK = { x: 3.9 };
function Pool({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  const record = s.thing('record', 2.2);
  const tank = s.thing('oxygen-tank', 0.8);
  const [, floorY] = at(v, 0, 0);
  const secs = Math.round(lerp(0, 29 * 60 + 3, smooth(record)));
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
  const [bx, by] = at(v, 0, -0.95);
  const wave = (x: number) => 0.1 + 0.03 * Math.sin(x * 3 - s.t * 2);
  const top = Array.from({ length: 31 }, (_, i) => {
    const x = -3 + i * 0.2;
    return `${x} ${wave(x).toFixed(3)}`;
  });
  return (
    <g>
      <rect width={v.W} height={v.H} fill={J.lobby} />
      <rect x={0} y={floorY} width={v.W} height={Math.max(0, v.H - floorY)} fill={J.column} />
      <Local v={v}>
        {[-5.5, 5.5].map((x) => (
          <g key={x}>
            <rect x={x - 0.35} y={-5} width={0.7} height={5} fill={J.column} />
            <rect x={x - 0.35} y={-5} width={0.18} height={5} fill={J.columnShade} />
            <rect x={x - 0.5} y={-5.2} width={1} height={0.25} fill={J.columnShade} />
          </g>
        ))}
        {/* The pool cut open: its tiled walls and the water in it. */}
        <rect x={-3.2} y={0} width={6.4} height={3.2} fill={J.poolTile} />
        {Array.from({ length: 13 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={-3 + i * 0.5}
            y1={0}
            x2={-3 + i * 0.5}
            y2={3}
            stroke={J.poolTileLine}
            strokeWidth={2 * p}
            {...NS}
          />
        ))}
        <path d={`M ${top.join(' L ')} L 3 3 L -3 3 Z`} fill={J.poolWater} opacity={0.85} />
        <path
          d={`M ${top.join(' L ')}`}
          fill="none"
          stroke={J.caustic}
          strokeWidth={3 * p}
          {...NS}
        />
        {/* The diver, lying still at the bottom, holding the breath. */}
        <g transform={`translate(-0.2 ${2.55 + 0.03 * Math.sin(s.t)})`}>
          <rect x={-0.5} y={-0.13} width={0.95} height={0.26} rx={0.1} fill={J.swim} />
          <path
            d="M 0.4 -0.02 L 1.2 0.02"
            stroke={J.skin}
            strokeWidth={0.12}
            strokeLinecap="round"
          />
          <circle cx={-0.62} cy={0} r={0.13} fill={J.skin} />
          <path
            d="M -0.4 -0.12 L 0.1 -0.16"
            stroke={J.skin}
            strokeWidth={0.08}
            strokeLinecap="round"
          />
        </g>
        {/* People watching from the side. */}
        {[-4.6, -4.0, -3.5].map((x, i) => (
          <g key={x} transform={`translate(${x} 0) scale(${0.95 + 0.05 * i})`}>
            <path d="M -0.13 0 L -0.1 -0.86 L 0.1 -0.86 L 0.13 0 Z" fill={J.trousers} />
            <rect
              x={-0.2}
              y={-1.46}
              width={0.4}
              height={0.66}
              rx={0.12}
              fill={[J.cross, J.panel, J.gold][i]}
            />
            <circle cx={0} cy={-1.62} r={0.13} fill={J.skin} />
          </g>
        ))}
        {/* The board over the pool, the record's clock running up. */}
        <rect x={-1.7} y={-1.45} width={3.4} height={1.0} rx={0.1} fill={J.timerBody} />
        {/* The oxygen tank beside the pool, its hose and mask over the edge. */}
        <g opacity={1}>
          {tank > 0 && (
            <ellipse
              cx={TANK.x}
              cy={-0.7}
              rx={0.6}
              ry={0.9}
              fill={J.atom}
              opacity={0.25 * smooth(tank) * (0.7 + 0.3 * Math.sin(s.t * 3))}
            />
          )}
          <rect
            x={TANK.x - 0.16}
            y={-1.35}
            width={0.32}
            height={1.35}
            rx={0.14}
            fill={J.tankGreen}
            stroke={LINE.color}
            strokeWidth={2 * p}
            {...NS}
          />
          <rect
            x={TANK.x - 0.16}
            y={-1.0}
            width={0.1}
            height={0.9}
            fill={J.tankShade}
            opacity={0.6}
          />
          <rect x={TANK.x - 0.05} y={-1.5} width={0.1} height={0.16} fill={J.faucetShade} />
          <path
            d={`M ${TANK.x} -1.45 Q ${TANK.x - 0.5} -1.7 ${TANK.x - 0.85} -0.2 Q ${TANK.x - 0.9} 0.1 ${3.1} 0.05`}
            fill="none"
            stroke={J.hose}
            strokeWidth={0.04}
          />
          <path
            d="M 3.0 -0.02 Q 2.88 0.12 3.0 0.24 L 3.12 0.24 Q 3.2 0.12 3.12 -0.02 Z"
            fill={J.lens}
            stroke={J.hose}
            strokeWidth={0.02}
          />
        </g>
      </Local>
      <text
        x={bx}
        y={by + 0.28 * v.k}
        fontFamily={font}
        fontWeight={700}
        fontSize={0.6 * v.k}
        fill={record > 0 ? J.timerStop : J.timerDigits}
        textAnchor="middle"
      >
        {record > 0 ? clock : '00:00'}
      </text>
      <Tag v={v} x={TANK.x} y={-1.95} text="PURE OXYGEN" shown={tank} />
    </g>
  );
}

// ============================================================================================
/** The rush through the water between two places: blue, and bubbles streaming past. */
function Rush({
  W,
  H,
  t,
  shown,
  colour,
}: {
  W: number;
  H: number;
  t: number;
  shown: number;
  colour: string;
}) {
  if (shown <= 0) return null;
  const p = Math.min(W, H) / 1080;
  return (
    <g opacity={shown}>
      <rect width={W} height={H} fill={colour} />
      {/* Shafts of light slanting down through the water as you plunge. */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = ((rnd(i, 74) + t * 0.3) % 1) * W * 1.4 - W * 0.2;
        return (
          <path
            key={`l${i}`}
            d={`M ${x} 0 L ${x + 90 * p} 0 L ${x + 260 * p} ${H} L ${x + 120 * p} ${H} Z`}
            fill={J.bubble}
            opacity={0.12}
          />
        );
      })}
      {Array.from({ length: 70 }, (_, i) => {
        const f = (t * 1.8 + rnd(i, 71)) % 1;
        return (
          <circle
            key={i}
            cx={rnd(i, 72) * W + 30 * Math.sin(t * 4 + i) * p}
            cy={H * (1.1 - f * 1.3)}
            r={(10 + 34 * rnd(i, 73)) * p}
            fill={J.bubble}
            fillOpacity={0.3}
            stroke={J.bubble}
            strokeWidth={5 * p}
            opacity={0.85 * Math.sin(f * Math.PI)}
          />
        );
      })}
    </g>
  );
}

/** The world `dive` at one frame of a shot. */
export function DivePicture({
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
  const fly = g.fly === 'whole' ? Math.max(1, duration - 2) : diveFlightFrames(from, g.at, fps);
  const a = stopOf(from, tall);
  const b = stopOf(g.at, tall);
  const raw = fly > 0 ? clamp(local / fly) : 1;
  const held =
    fly > 0 ? clamp((local - fly) / Math.max(1, duration - fly)) : clamp(local / duration);
  // The camera never quite stops: once there, it keeps drifting slowly in.
  const drift = (c: Cam): Cam => ({
    ...c,
    x: c.x + c.w * 0.025 * held,
    w: c.w * (1 - 0.08 * held),
  });

  // Where the camera is, in which frame, and how much of the rush through the water is showing.
  let frame: FrameId;
  let cam: Cam;
  let rush = 0;
  let rushColour = J.bathWaterDeep;
  if (placeOf(a.frame) === placeOf(b.frame)) {
    const sh = shared(a, b);
    frame = sh.frame;
    cam = raw >= 1 ? sh.b : zoomPath(sh.a, sh.b).at(smooth(raw));
  } else {
    const A = placeOf(a.frame);
    const B = placeOf(b.frame);
    const wa = {
      frame: A as FrameId,
      cam: { x: WATER[A].at[0], y: WATER[A].at[1], w: WATER[A].w },
    };
    const wb = {
      frame: B as FrameId,
      cam: { x: WATER[B].at[0], y: WATER[B].at[1], w: WATER[B].w },
    };
    if (raw < 0.5) {
      const sh = shared(a, wa);
      frame = sh.frame;
      cam = zoomPath(sh.a, sh.b).at(smooth(raw / 0.4));
      rush = smooth((raw - 0.12) / 0.26);
      rushColour = WATER[A].colour;
    } else {
      const sh = shared(wb, b);
      frame = sh.frame;
      cam = zoomPath(sh.a, sh.b).at(smooth((raw - 0.6) / 0.4));
      rush = 1 - smooth((raw - 0.62) / 0.24);
      rushColour = WATER[B].colour;
    }
  }
  cam = drift(cam);
  const place = placeOf(frame);

  const atWord = new Map<JourneyThing, number>();
  g.show.forEach((x, i) => atWord.set(x.item, times[i] ?? 0));
  const thing = (name: JourneyThing, seconds = 0.35) =>
    g.keep.includes(name)
      ? 1
      : atWord.has(name)
        ? clamp((local - (atWord.get(name) ?? 0)) / (fps * seconds))
        : 0;
  const stopAt = atWord.get('stop');
  const s: State = {
    t,
    W: width,
    H: height,
    thing,
    count: stopAt !== undefined && local >= stopAt ? (clock - local + stopAt) / fps : t,
  };

  const view = (f: FrameId) => viewOf(camIn(cam, frame, f), width, height);
  let world: ReactNode = null;
  let words: ReactNode = null;
  if (place === 'home') {
    const v = view('home');
    const vc = view('cells');
    const lift = s.thing('surface', 1.2);
    world = (
      <>
        <Bathroom v={v} s={s} />
        <Tub v={v} front={false} />
        <BathWater v={v} s={s} over={false} tint={0} />
        <Bather v={v} s={s} lift={lift} part="body" />
        <BathWater
          v={v}
          s={s}
          over
          tint={
            0.22 *
            (1 -
              smooth(Math.max(s.thing('lungs'), s.thing('spleen-squeeze'), s.thing('heart-glow'))))
          }
        />
        <Bather v={v} s={s} lift={lift} part="inside" />
        <RippleSeal v={v} s={s} shown={s.thing('ripple-seal', 1.2)} />
        <Tub v={v} front />
        <SpongeNear v={v} s={s} whole={false} />
        <SpongeNear v={v} s={s} whole />
        <Cells v={vc} s={s} />
      </>
    );
    words = (
      <>
        <Tag
          v={v}
          x={-0.34}
          y={-0.42}
          text="LUNGS"
          shown={s.thing('lungs', 0.5) * (v.cam.w < 1.2 ? 1 : 0) * (1 - s.thing('heart'))}
        />
        <Tag
          v={v}
          x={-0.27}
          y={-0.31}
          text="HEART"
          shown={s.thing('heart', 0.5) * (v.cam.w < 0.6 ? 1 : 0)}
        />
        <Tag
          v={v}
          x={0.05}
          y={-0.42}
          text="HANDS"
          shown={s.thing('hands', 0.5) * (v.cam.w > 1 ? 1 : 0)}
        />
        <Tag
          v={v}
          x={0.72}
          y={-0.44}
          text="FEET"
          shown={s.thing('feet', 0.5) * (v.cam.w > 1 ? 1 : 0)}
        />
        <Tag
          v={v}
          x={SPLEEN.x}
          y={SPLEEN.y - 0.07}
          text="SPLEEN"
          shown={s.thing('spleen', 0.5) * (v.cam.w < 0.6 && v.cam.w > 0.05 ? 1 : 0)}
        />
        <Tag
          v={vc}
          x={18}
          y={-4}
          text="BACKUP TANK"
          shown={s.thing('tank', 0.8) * (vc.cam.w < 40 ? 1 : 0)}
        />
        <Tag
          v={vc}
          x={-2}
          y={-6}
          text="RED BLOOD CELLS"
          shown={s.thing('squeeze', 0.5) * (vc.cam.w < 40 ? 1 : 0) * (1 - s.thing('pour'))}
        />
      </>
    );
  } else if (place === 'earth') {
    world = <Earth v={view('earth')} s={s} />;
  } else if (place === 'cold') {
    world = <ColdSea v={view('cold')} s={s} />;
  } else if (place === 'bajau') {
    const v = view('bajau');
    world = (
      <>
        <Bajau v={v} s={s} />
        <ScanWords v={v} s={s} />
        <PageWords v={v} s={s} />
        <Dna v={view('dna')} s={s} />
      </>
    );
    words = (
      <>
        <Tag
          v={v}
          x={-16.9}
          y={-6.0}
          text="A BIGGER TANK"
          shown={s.thing('big-tank', 0.6) * (v.cam.w < 20 ? 1 : 0)}
        />
        <Tag
          v={v}
          x={10.4}
          y={4.3}
          text="A BAJAU DIVER"
          shown={s.thing('diver', 0.6) * (v.cam.w < 30 ? 1 : 0)}
        />
      </>
    );
  } else {
    world = <Pool v={view('pool')} s={s} />;
  }

  // The callout: a number and a few words at the top, a dashed line down to its thing.
  const callout = (() => {
    const c = g.callout;
    const calloutAt = times[g.show.length];
    if (!c || calloutAt === undefined) return null;
    const pr = clamp((local - calloutAt) / 10);
    if (pr <= 0) return null;
    const anchor = ((): [number, number] | null => {
      switch (c.at) {
        case 'counter':
          return place === 'home' ? at(view('home'), COUNTER.x, COUNTER.y - 0.12) : null;
        case 'spleen':
          return place === 'bajau' ? at(view('bajau'), SCAN_SPLEEN.x, SCAN_SPLEEN.y - 0.13) : null;
        case 'boats':
          return place === 'bajau' ? at(view('bajau'), BOATS[1] ?? 16, -2.4) : null;
        case 'gene':
          return place === 'bajau' ? at(view('bajau'), FIG.x - 0.6, FIG.y - 0.5) : null;
        default:
          return null;
      }
    })();
    const u = Math.min(width, height) / 1080;
    const bx = tall ? width / 2 : width * 0.5;
    const by = height * (tall ? 0.16 : 0.2);
    const sc = (0.6 + 0.4 * outBack(pr)) * u;
    const caption = c.caption?.split(' / ') ?? [];
    const size = c.value.length > 6 ? 130 : 170;
    return (
      <g opacity={clamp(pr * 2.5)}>
        {anchor && anchor[1] > by + 150 * sc && (
          <line
            x1={bx}
            y1={by + 120 * sc}
            x2={anchor[0]}
            y2={anchor[1]}
            stroke={J.range}
            strokeWidth={4 * u}
            strokeDasharray={`${12 * u} ${10 * u}`}
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
              y={66 + i * 50}
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
      {world}
      {words}
      <Rush W={width} H={height} t={t} shown={rush} colour={rushColour} />
      {callout}
    </g>
  );
}
