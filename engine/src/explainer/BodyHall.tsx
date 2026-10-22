import type { ReactNode } from 'react';
import { DizzyStars } from '../effects/Dizzy';
import { Drop } from '../effects/Sweat';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { ACTIONS } from '../rig/actions';
import { Character } from '../rig/Character';
import type { HandFrame } from '../rig/Character';
import { poseAt, resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { blinkAt, gazeAt, withLife } from '../rig/life';
import { handsUp, lookDown, lookUp, point, shrug, sitSlump, stand, wave } from '../rig/poses';
import type { ResolvedPose } from '../rig/types';
import { SCIENTIST } from '../wardrobe/costumes/scientist';
import { outfitFrom } from '../wardrobe/garments';
import type { Clothes } from '../wardrobe/garments';
import type { HairStyle, Identity } from '../wardrobe/types';
import { Blended } from './Blend';
import {
  Box,
  Glow,
  J,
  LINE,
  Local,
  MASCOT_HEAD,
  MASCOT_TALL,
  Mascot,
  NS,
  Puff,
  Tag,
  at,
  faceAt,
  font,
  inView,
  lerp,
  pxOf,
  rnd,
} from './bodyKit';
import type { State } from './bodyKit';
import { clamp, outBack, smooth } from './Journey';
import type { View } from './Journey';

/**
 * The hall of the world `body`: a show about where your fat goes. A dark hall with a lit stage;
 * on the stage a house set of three rooms (a living room with a sofa, your bathroom with you on
 * the scale, a gym with a treadmill) under one roof, and beside it a giant old brass balance with
 * two scientists. The experts stand in rows in front of the stage, seen from behind: doctors in
 * white coats, dietitians, trainers in gym shirts. Drawn in metres, the stage's top at 0.
 */

// ---- the layout, in metres
export const ROOMS = {
  living: { x0: -4.8, x1: -1.6 },
  bath: { x0: -1.6, x1: 1.6 },
  gym: { x0: 1.6, x1: 4.8 },
};
export const CEILING = -2.8;
export const SCALE = { x: 0, w: 0.5, h: 0.09 };
export const READOUT = { x: 0.55, y: -0.5, w: 0.46, h: 0.2 };
export const YOU = { x: 0, ground: -0.07 };
export const BLOB = { x: 0.48, y: -1.32, r: 0.075 };
/** Your mouth and belly in the hall, for the flights inside you and out again. */
export const MOUTH_HALL = { x: 0.07, y: YOU.ground - MASCOT_TALL + MASCOT_HEAD * 0.66 };
export const BELLY_HALL = { x: 0.04, y: YOU.ground - MASCOT_HEAD * 1.95 };
export const TOILET = { x: 1.12 };
export const SINK = { x: -0.95 };
export const TREADMILL = { x: 3.2, deck: -0.24 };
export const SOFA = { x: -3.2, seat: -0.4 };
/** The balance: its pivot, the half-length of its beam, how far its pans hang below. */
export const BALANCE = { x: 7.7, pivot: -3.55, arm: 1.75, hang: 2.05 };
const CROWD_TOP = 2.55;
const ROW_STEP = 1.12;
const ROWS = 7;
const PER_ROW = 8;

// ============================================================================================
/** The hall round the stage: the wall, the arch of bulbs, the curtains, the lights, the floor. */
function HallBack({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  const panels: ReactNode[] = [];
  if (v.cam.w > 2.5)
    for (let x = -14; x <= 14; x += 1.4) {
      const [sx] = at(v, x, 0);
      if (sx < -50 || sx > v.W + 50) continue;
      panels.push(
        <Box
          key={`p${x}`}
          v={v}
          x0={x + 0.08}
          y0={-12}
          x1={x + 1.32}
          y1={1}
          fill={J.hallWallLight}
          opacity={0.18}
        />,
      );
    }
  const bulbs: ReactNode[] = [];
  if (v.cam.w > 1.5)
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * (i / 40);
      const x = -10.6 * Math.cos(a);
      const y = -0.4 - 7.6 * Math.sin(a) ** 0.8;
      if (!inView(v, x, y, 0.2)) continue;
      const [sx, sy] = at(v, x, y);
      const on = 0.65 + 0.35 * Math.sin(s.t * 5 + i * 0.9);
      bulbs.push(
        <g key={`b${i}`}>
          <circle cx={sx} cy={sy} r={0.2 * v.k} fill={J.spotWarm} opacity={0.18 * on} />
          <circle cx={sx} cy={sy} r={0.075 * v.k} fill={J.spot} opacity={0.6 + 0.4 * on} />
        </g>,
      );
    }
  // Two lights high in the hall, their beams falling on the house.
  const beams = [-6.5, 6.5].map((x, i) => {
    const [ax, ay] = at(v, x, -11);
    const [bx, by] = at(v, x * 0.15, 0.1);
    const spread = 3.6 * v.k;
    const sway = Math.sin(s.t * 0.4 + i * 2) * 0.4 * v.k;
    return (
      <path
        key={`l${i}`}
        d={`M ${ax} ${ay} L ${bx - spread + sway} ${by} L ${bx + spread + sway} ${by} Z`}
        fill={J.spot}
        opacity={0.07}
      />
    );
  });
  return (
    <g>
      <defs>
        <linearGradient id="bh-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={J.night} />
          <stop offset="1" stopColor={J.hallWall} />
        </linearGradient>
      </defs>
      <rect width={v.W} height={v.H} fill="url(#bh-wall)" />
      {panels}
      {v.cam.w > 1.5 && beams}
      {v.cam.w > 2 && <Dust v={v} s={s} />}
      {bulbs}
      <Box v={v} x0={-30} y0={1} x1={30} y1={40} fill={J.hallFloor} />
      {v.cam.w > 2.5 && <Curtains v={v} p={p} />}
    </g>
  );
}

/** Dust drifting slowly through the spotlights: the hall is never still. */
function Dust({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  return (
    <g>
      {Array.from({ length: 46 }, (_, i) => {
        const x = -7 + 14 * rnd(i, 81) + 0.4 * Math.sin(s.t * 0.3 + i);
        const y = -7.5 + 7 * ((rnd(i, 82) + s.t * (0.01 + 0.02 * rnd(i, 83))) % 1);
        const [sx, sy] = at(v, x, y);
        if (sx < -20 || sx > v.W + 20 || sy < -20 || sy > v.H + 20) return null;
        const twinkle = 0.5 + 0.5 * Math.sin(s.t * (1 + rnd(i, 84)) + i);
        return (
          <circle
            key={i}
            cx={sx}
            cy={sy}
            r={(2 + 3 * rnd(i, 85)) * p}
            fill={J.spot}
            opacity={0.15 + 0.35 * twinkle}
          />
        );
      })}
    </g>
  );
}

function Curtains({ v, p }: { v: View; p: number }) {
  const side = (x0: number, dir: 1 | -1) => {
    const folds: ReactNode[] = [];
    for (let i = 0; i < 6; i++) {
      const x = x0 + dir * i * 0.4;
      folds.push(
        <Box
          key={i}
          v={v}
          x0={x}
          y0={-9}
          x1={x + dir * 0.4}
          y1={0.15}
          fill={i % 2 ? J.curtainShade : J.curtain}
        />,
      );
    }
    return folds;
  };
  const [, vy] = at(v, 0, -8.6);
  return (
    <g>
      {side(10.6, 1)}
      {side(-10.6, -1)}
      <Box v={v} x0={-14} y0={-10} x1={14} y1={-8.3} fill={J.curtain} />
      {/* The valance's scalloped edge. */}
      {Array.from({ length: 28 }, (_, i) => {
        const [cx] = at(v, -13.5 + i, 0);
        if (cx < -100 || cx > v.W + 100) return null;
        return (
          <circle
            key={i}
            cx={cx}
            cy={vy + 1.7 * 0.42 * v.k}
            r={0.5 * v.k}
            fill={J.curtainShade}
            stroke={J.stageEdge}
            strokeWidth={3 * p}
          />
        );
      })}
    </g>
  );
}

/** The stage: its boards and its front, with a gold edge. */
function Stage({ v }: { v: View }) {
  const p = pxOf(v);
  const [, top] = at(v, 0, 0.15);
  return (
    <g>
      <Box v={v} x0={-11} y0={0} x1={11} y1={0.15} fill={J.stage} />
      <Box v={v} x0={-11} y0={0.15} x1={11} y1={1} fill={J.stageShade} />
      {top > -20 && top < v.H + 20 && (
        <line x1={0} y1={top} x2={v.W} y2={top} stroke={J.stageEdge} strokeWidth={6 * p} />
      )}
    </g>
  );
}

// ============================================================================================
/** The house set: three rooms under one roof. */
function House({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  // Drawn whenever any of it is in view, however close: its walls are cut to the picture.
  const [l, t] = at(v, -5.3, -4.8);
  const [r, b] = at(v, 5.3, 0.1);
  if (r < 0 || l > v.W || b < 0 || t > v.H) return null;
  const roof = [at(v, -5.25, CEILING - 0.18), at(v, 0, -4.7), at(v, 5.25, CEILING - 0.18)];
  const roofOn = v.cam.w > 1.4;
  return (
    <g>
      {/* The back walls of the rooms. */}
      <Box
        v={v}
        x0={ROOMS.living.x0}
        y0={CEILING}
        x1={ROOMS.living.x1}
        y1={0}
        fill={J.livingWall}
      />
      <Box v={v} x0={ROOMS.bath.x0} y0={CEILING} x1={ROOMS.bath.x1} y1={0} fill={J.bathWall} />
      <Box v={v} x0={ROOMS.gym.x0} y0={CEILING} x1={ROOMS.gym.x1} y1={0} fill={J.gymWall} />
      <Living v={v} s={s} />
      <Bathroom v={v} s={s} />
      <Gym v={v} s={s} />
      {/* Floors, dividing walls, the ceiling and the roof. */}
      <Box v={v} x0={-4.95} y0={-0.06} x1={4.95} y1={0.04} fill={J.woodShade} />
      {[-4.8, -1.6, 1.6, 4.8].map((x) => (
        <Box key={x} v={v} x0={x - 0.07} y0={CEILING} x1={x + 0.07} y1={0} fill={J.counter} />
      ))}
      <Box v={v} x0={-4.95} y0={CEILING - 0.18} x1={4.95} y1={CEILING} fill={J.counter} />
      {roofOn && (
        <g>
          <path
            d={`M ${roof[0]?.[0]} ${roof[0]?.[1]} L ${roof[1]?.[0]} ${roof[1]?.[1]} L ${roof[2]?.[0]} ${roof[2]?.[1]} Z`}
            fill={J.roof}
            stroke={LINE.color}
            strokeWidth={4 * p}
            strokeLinejoin="round"
          />
          <Local v={v}>
            {/* Rows of tiles across the roof, and a round window in its gable. */}
            {[0.3, 0.65, 1.0, 1.35].map((d, i) => (
              <line
                key={i}
                x1={-5.05 + d * 3.3}
                y1={CEILING - 0.18 - d * 1.0}
                x2={5.05 - d * 3.3}
                y2={CEILING - 0.18 - d * 1.0}
                stroke={J.curtainShade}
                strokeWidth={3 * p}
                opacity={0.6}
                {...NS}
              />
            ))}
            <circle
              cx={0}
              cy={-3.55}
              r={0.32}
              fill={J.window}
              stroke={LINE.color}
              strokeWidth={4 * p}
              {...NS}
            />
            <path
              d="M -0.32 -3.55 L 0.32 -3.55 M 0 -3.87 L 0 -3.23"
              stroke={LINE.color}
              strokeWidth={3 * p}
              {...NS}
            />
          </Local>
        </g>
      )}
    </g>
  );
}

/** The living room: a picture, a lamp, a rug and the sofa. */
function Living({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  if (!inView(v, SOFA.x, -1.2, 2.5)) return null;
  const sw = { strokeWidth: 3.5 * p, stroke: LINE.color, ...NS, strokeLinejoin: 'round' as const };
  return (
    <g>
      <Box
        v={v}
        x0={ROOMS.living.x0}
        y0={-1.0}
        x1={ROOMS.living.x1}
        y1={0}
        fill={J.livingWallShade}
      />
      <Local v={v}>
        {/* A framed picture of mountains, and a standing lamp. */}
        <rect x={-3.75} y={-2.25} width={1.0} height={0.7} fill={J.sky} {...sw} />
        <path
          d="M -3.75 -1.55 L -3.45 -1.95 L -3.2 -1.7 L -2.95 -2.05 L -2.75 -1.55 Z"
          fill={J.hill}
        />
        <rect x={-3.75} y={-2.25} width={1.0} height={0.7} fill="none" {...sw} />
        <line x1={-2.0} y1={0} x2={-2.0} y2={-1.6} {...sw} />
        <path
          d="M -2.25 -1.6 L -1.75 -1.6 L -1.88 -1.95 L -2.12 -1.95 Z"
          fill={J.cushion}
          {...sw}
        />
        <ellipse cx={SOFA.x} cy={0} rx={1.35} ry={0.06} fill={J.rug} />
      </Local>
      <Glow
        id="bh-lamp"
        cx={at(v, -2.0, -1.5)[0]}
        cy={at(v, -2.0, -1.5)[1]}
        r={0.9 * v.k}
        colour={J.spotWarm}
        strength={0.6}
      />
      <Sofa v={v} s={s} />
    </g>
  );
}

function Sofa({ v }: { v: View; s: State }) {
  const p = pxOf(v);
  const sw = { strokeWidth: 4 * p, stroke: LINE.color, ...NS, strokeLinejoin: 'round' as const };
  const x = SOFA.x;
  return (
    <Local v={v}>
      <rect x={x - 1.05} y={-1.0} width={2.1} height={0.62} rx={0.14} fill={J.sofaShade} {...sw} />
      <rect x={x - 1.0} y={-0.5} width={2.0} height={0.4} rx={0.08} fill={J.sofa} {...sw} />
      <rect x={x - 1.22} y={-0.78} width={0.3} height={0.68} rx={0.13} fill={J.sofa} {...sw} />
      <rect x={x + 0.92} y={-0.78} width={0.3} height={0.68} rx={0.13} fill={J.sofa} {...sw} />
      <rect x={x + 0.45} y={-0.86} width={0.42} height={0.36} rx={0.1} fill={J.cushion} {...sw} />
      <line x1={x - 1.0} y1={-0.1} x2={x - 1.0} y2={0} {...sw} />
      <line x1={x + 1.0} y1={-0.1} x2={x + 1.0} y2={0} {...sw} />
    </Local>
  );
}

/** The bathroom: tiles, a mirror over the sink, a towel, a window, a plant, the toilet. */
function Bathroom({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  const [l, t] = at(v, ROOMS.bath.x0, CEILING);
  const [r, bt] = at(v, ROOMS.bath.x1, 0.1);
  if (r < 0 || l > v.W || bt < 0 || t > v.H) return null;
  // Close in (on the blob of fat), only the wall: the room's things would be drawn huge.
  const near = v.cam.w < 0.4;
  const sw = { strokeWidth: 4 * p, stroke: LINE.color, ...NS, strokeLinejoin: 'round' as const };
  const tiles: ReactNode[] = [];
  if (v.cam.w < 8)
    for (let x = ROOMS.bath.x0 + 0.25; x < ROOMS.bath.x1; x += 0.25) {
      tiles.push(
        <line
          key={`x${x}`}
          x1={x}
          y1={-1.15}
          x2={x}
          y2={0}
          stroke={J.bathTile}
          strokeWidth={2.5 * p}
          {...NS}
        />,
      );
    }
  if (v.cam.w < 8)
    for (let y = -1.15; y < 0; y += 0.25)
      tiles.push(
        <line
          key={`y${y}`}
          x1={ROOMS.bath.x0}
          y1={y}
          x2={ROOMS.bath.x1}
          y2={y}
          stroke={J.bathTile}
          strokeWidth={2.5 * p}
          {...NS}
        />,
      );
  const pee = s.thing('pee', 0.6);
  return (
    <g>
      <Box v={v} x0={ROOMS.bath.x0} y0={-1.15} x1={ROOMS.bath.x1} y1={0} fill={J.tile} />
      {!near && (
        <Local v={v}>
          {tiles}
          {/* The window high on the wall, a painted sky. */}
          <rect x={0.3} y={-2.5} width={0.6} height={0.5} rx={0.03} fill={J.sky} {...sw} />
          <line x1={0.6} y1={-2.5} x2={0.6} y2={-2.0} {...sw} />
          {/* The mirror over the sink, with its shine. */}
          <rect x={-1.25} y={-1.95} width={0.6} height={0.72} rx={0.06} fill={J.mirror} {...sw} />
          <path
            d="M -1.12 -1.4 L -0.95 -1.85 L -0.88 -1.85 L -1.05 -1.4 Z"
            fill={J.mirrorShine}
            opacity={0.8}
          />
          <path
            d="M -1.0 -1.3 L -0.85 -1.7 L -0.8 -1.7 L -0.95 -1.3 Z"
            fill={J.mirrorShine}
            opacity={0.6}
          />
          {/* The sink on its stand. */}
          <path d="M -1.03 -0.78 L -0.87 -0.78 L -0.9 0 L -1.0 0 Z" fill={J.tub} {...sw} />
          <path
            d="M -1.25 -0.92 L -0.65 -0.92 Q -0.67 -0.74 -0.95 -0.72 Q -1.23 -0.74 -1.25 -0.92 Z"
            fill={J.tub}
            {...sw}
          />
          <path
            d="M -0.95 -0.92 L -0.95 -1.04 L -0.84 -1.04"
            fill="none"
            stroke={J.faucetShade}
            strokeWidth={5 * p}
            {...NS}
          />
          {/* The towel on its rail. */}
          <line
            x1={-0.45}
            y1={-1.42}
            x2={0.0}
            y2={-1.42}
            stroke={J.faucetShade}
            strokeWidth={5 * p}
            {...NS}
          />
          <rect x={-0.4} y={-1.42} width={0.34} height={0.5} rx={0.03} fill={J.towel} {...sw} />
          <rect x={-0.4} y={-1.08} width={0.34} height={0.05} fill={J.towelStripe} />
          {/* A plant in the corner. */}
          <path d="M -1.5 0 L -1.45 -0.28 L -1.2 -0.28 L -1.25 0 Z" fill={J.plantPot} {...sw} />
          {[-0.55, -0.2, 0.15, 0.45].map((a, i) => (
            <ellipse
              key={i}
              cx={-1.33 + 0.16 * Math.sin(a)}
              cy={-0.45 - 0.12 * Math.cos(a)}
              rx={0.06}
              ry={0.17}
              transform={`rotate(${a * 57} ${-1.33 + 0.16 * Math.sin(a)} ${-0.45 - 0.12 * Math.cos(a)})`}
              fill={J.plant}
              {...sw}
            />
          ))}
          {/* The ceiling light. */}
          <line x1={0} y1={CEILING} x2={0} y2={-2.55} {...sw} />
          <path d="M -0.16 -2.42 Q 0 -2.62 0.16 -2.42 Z" fill={J.spot} {...sw} />
        </Local>
      )}
      <Glow
        id="bh-bathlight"
        cx={at(v, 0, -2.4)[0]}
        cy={at(v, 0, -2.4)[1]}
        r={1.2 * v.k}
        colour={J.spot}
        strength={0.5}
      />
      {!near && <Toilet v={v} glow={pee} />}
    </g>
  );
}

function Toilet({ v, glow }: { v: View; glow: number }) {
  const p = pxOf(v);
  const sw = { strokeWidth: 4 * p, stroke: LINE.color, ...NS, strokeLinejoin: 'round' as const };
  const x = TOILET.x;
  const [gx, gy] = at(v, x, -0.5);
  return (
    <g>
      {glow > 0 && (
        <Glow id="bh-toilet" cx={gx} cy={gy} r={0.7 * v.k} colour={J.water} strength={glow} />
      )}
      <Local v={v}>
        <rect x={x + 0.05} y={-0.98} width={0.32} height={0.5} rx={0.05} fill={J.tub} {...sw} />
        <rect
          x={x + 0.02}
          y={-1.02}
          width={0.38}
          height={0.07}
          rx={0.03}
          fill={J.tubShade}
          {...sw}
        />
        <path
          d={`M ${x + 0.1} -0.48 L ${x - 0.36} -0.48 Q ${x - 0.38} -0.2 ${x - 0.12} -0.14 L ${x - 0.08} 0 L ${x + 0.12} 0 L ${x + 0.14} -0.2 Z`}
          fill={J.tub}
          {...sw}
        />
        <rect
          x={x - 0.4}
          y={-0.53}
          width={0.52}
          height={0.06}
          rx={0.03}
          fill={J.tubShade}
          {...sw}
        />
      </Local>
    </g>
  );
}

/** The gym: a window, a rack of weights, a clock, the treadmill. */
function Gym({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  if (!inView(v, TREADMILL.x, -1.2, 2.5)) return null;
  const sw = { strokeWidth: 4 * p, stroke: LINE.color, ...NS, strokeLinejoin: 'round' as const };
  const x = TREADMILL.x;
  const belt = (s.t * 1.6) % 0.2;
  return (
    <g>
      <Box v={v} x0={ROOMS.gym.x0} y0={-0.9} x1={ROOMS.gym.x1} y1={0} fill={J.gymWallShade} />
      <Box v={v} x0={ROOMS.gym.x0} y0={-0.06} x1={ROOMS.gym.x1} y1={0} fill={J.gymFloor} />
      <Local v={v}>
        {/* A wide window and a clock. */}
        <rect x={2.0} y={-2.35} width={1.1} height={0.75} rx={0.04} fill={J.sky} {...sw} />
        <line x1={2.55} y1={-2.35} x2={2.55} y2={-1.6} {...sw} />
        <circle cx={4.1} cy={-2.15} r={0.22} fill={J.clockFace} {...sw} />
        <line x1={4.1} y1={-2.15} x2={4.1} y2={-2.3} {...sw} />
        <line x1={4.1} y1={-2.15} x2={4.2} y2={-2.1} {...sw} />
        {/* A rack of dumbbells. */}
        <rect x={4.15} y={-0.75} width={0.5} height={0.75} fill={J.treadmill} {...sw} />
        {[-0.62, -0.4, -0.18].map((y) => (
          <g key={y}>
            <line
              x1={4.2}
              y1={y}
              x2={4.6}
              y2={y}
              stroke={J.treadmillRail}
              strokeWidth={5 * p}
              {...NS}
            />
            <circle cx={4.22} cy={y} r={0.06} fill={J.cross} {...sw} />
            <circle cx={4.58} cy={y} r={0.06} fill={J.cross} {...sw} />
          </g>
        ))}
        {/* The treadmill: its deck and moving belt, its posts and its panel. */}
        <path
          d={`M ${x - 0.85} ${TREADMILL.deck} L ${x + 0.75} ${TREADMILL.deck} L ${x + 0.8} ${TREADMILL.deck + 0.12} L ${x - 0.9} ${TREADMILL.deck + 0.12} Z`}
          fill={J.treadmill}
          {...sw}
        />
        <rect
          x={x - 0.85}
          y={TREADMILL.deck - 0.03}
          width={1.6}
          height={0.05}
          fill={J.treadmillBelt}
        />
        {Array.from({ length: 9 }, (_, i) => {
          const bx = x - 0.85 + ((i * 0.2 - belt + 1.8) % 1.8);
          return bx < x + 0.75 ? (
            <line
              key={i}
              x1={bx}
              y1={TREADMILL.deck - 0.03}
              x2={bx}
              y2={TREADMILL.deck + 0.02}
              stroke={J.treadmillRail}
              strokeWidth={2 * p}
              {...NS}
            />
          ) : null;
        })}
        <line x1={x - 0.9} y1={TREADMILL.deck + 0.12} x2={x - 0.9} y2={0} {...sw} />
        <line x1={x + 0.8} y1={TREADMILL.deck + 0.12} x2={x + 0.8} y2={0} {...sw} />
        <line
          x1={x + 0.72}
          y1={TREADMILL.deck}
          x2={x + 0.5}
          y2={-1.15}
          stroke={J.treadmillRail}
          strokeWidth={7 * p}
          {...NS}
        />
        <rect x={x + 0.28} y={-1.3} width={0.4} height={0.2} rx={0.04} fill={J.treadmill} {...sw} />
        <rect
          x={x + 0.33}
          y={-1.26}
          width={0.3}
          height={0.11}
          rx={0.02}
          fill={J.scaleDigits}
          opacity={0.8}
        />
        <line
          x1={x + 0.5}
          y1={-1.1}
          x2={x - 0.05}
          y2={-1.0}
          stroke={J.treadmillRail}
          strokeWidth={6 * p}
          {...NS}
        />
      </Local>
    </g>
  );
}

// ============================================================================================
/** The bathroom scale, its top tipped toward us, a small screen on it. */
function Scale({ v }: { v: View }) {
  const p = pxOf(v);
  if (!inView(v, SCALE.x, -0.05, 0.3, 30)) return null;
  const sw = { strokeWidth: 4 * p, stroke: LINE.color, ...NS, strokeLinejoin: 'round' as const };
  const { x, w, h } = SCALE;
  const front = -h * 0.45;
  const back = -h * 1.15;
  return (
    <Local v={v}>
      <ellipse cx={x} cy={0.005} rx={w * 0.55} ry={0.02} fill={LINE.color} opacity={0.18} />
      <path
        d={`M ${x - w / 2} ${front} L ${x + w / 2} ${front} L ${x + w / 2 - 0.015} 0 L ${x - w / 2 + 0.015} 0 Z`}
        fill={J.scaleShade}
        {...sw}
      />
      <path
        d={`M ${x - w / 2} ${front} L ${x + w / 2} ${front} L ${x + w / 2 - 0.05} ${back} L ${x - w / 2 + 0.05} ${back} Z`}
        fill={J.scaleBody}
        {...sw}
      />
      <rect
        x={x - 0.07}
        y={back + 0.012}
        width={0.14}
        height={0.03}
        rx={0.008}
        fill={J.scaleScreen}
      />
      <rect
        x={x - 0.055}
        y={back + 0.018}
        width={0.11}
        height={0.018}
        rx={0.004}
        fill={J.scaleDigits}
        opacity={0.55}
      />
    </Local>
  );
}

/** The scale's number, large in a bubble beside it, ticking down by one as the fat goes. */
function Readout({ v, s }: { v: View; s: State }) {
  const shown = s.thing('readout', 0.4);
  if (shown <= 0) return null;
  const go = s.since('fat-blob');
  const kilos = go > 1e8 ? 71 : go < 0 ? 72 : 72 - smooth(go / 0.9);
  const glow = s.thing('readout', 1) * (s.stop === 'scale' && go > 1e8 ? 1 : 0);
  const [cx, cy] = at(v, READOUT.x, READOUT.y);
  const [tx, ty] = at(v, SCALE.x + 0.05, -SCALE.h * 0.9);
  const k = v.k * (0.7 + 0.3 * outBack(shown));
  const w = READOUT.w * k;
  const h = READOUT.h * k;
  const p = pxOf(v);
  if (w < 20 || w > v.W * 3) return null;
  const tenth = Math.round(kilos * 10) / 10;
  return (
    <g opacity={clamp(shown * 3)}>
      {glow > 0 && (
        <Glow id="bh-readglow" cx={cx} cy={cy} r={w} colour={J.scaleDigits} strength={0.5 * glow} />
      )}
      <path
        d={`M ${cx - w * 0.32} ${cy + h * 0.45} L ${tx} ${ty} L ${cx - w * 0.14} ${cy + h * 0.45} Z`}
        fill={J.scaleBody}
        stroke={LINE.color}
        strokeWidth={4 * p}
        strokeLinejoin="round"
      />
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx={h * 0.22}
        fill={J.scaleBody}
        stroke={LINE.color}
        strokeWidth={5 * p}
      />
      <rect
        x={cx - w / 2 + h * 0.12}
        y={cy - h / 2 + h * 0.12}
        width={w - h * 0.24}
        height={h * 0.76}
        rx={h * 0.12}
        fill={J.scaleScreen}
      />
      <text
        x={cx - w * 0.1}
        y={cy + h * 0.21}
        fontFamily={font}
        fontWeight={800}
        fontSize={h * 0.58}
        fill={J.scaleDigits}
        textAnchor="middle"
      >
        {tenth.toFixed(1)}
      </text>
      <text
        x={cx + w / 2 - h * 0.24}
        y={cy + h * 0.21}
        fontFamily={font}
        fontWeight={800}
        fontSize={h * 0.24}
        fill={J.scaleDigits}
        textAnchor="end"
        opacity={0.8}
      >
        KG
      </text>
    </g>
  );
}

/** The blob of fat: a soft yellow drop with a shine, wobbling. */
export function BlobShape({
  cx,
  cy,
  r,
  t,
  id,
}: {
  cx: number;
  cy: number;
  r: number;
  t: number;
  id: string;
}) {
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = r * (1 + 0.06 * Math.sin(a * 3 + t * 4) + 0.04 * Math.sin(a * 5 - t * 3));
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a) * 0.92).toFixed(2)}`);
  }
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor={J.fatLight} />
          <stop offset="0.55" stopColor={J.fat} />
          <stop offset="1" stopColor={J.fatShade} />
        </radialGradient>
      </defs>
      <Glow id={`${id}-g`} cx={cx} cy={cy} r={r * 2.2} colour={J.fatGlow} strength={0.5} />
      <path
        d={`M ${pts.join(' L ')} Z`}
        fill={`url(#${id})`}
        stroke={LINE.color}
        strokeWidth={Math.max(2, r * 0.06)}
        strokeLinejoin="round"
      />
      <ellipse
        cx={cx - r * 0.32}
        cy={cy - r * 0.36}
        rx={r * 0.22}
        ry={r * 0.13}
        fill={J.fatGlow}
        opacity={0.9}
        transform={`rotate(-30 ${cx - r * 0.32} ${cy - r * 0.36})`}
      />
    </g>
  );
}

/**
 * The fat: in the first line it lifts off your belly, floats up and vanishes in a sparkle; when
 * the camera comes back to it, it hangs over the scale and breaks into its atoms.
 */
function FatBlob({ v, s }: { v: View; s: State }) {
  const go = s.since('fat-blob');
  // Broken into its atoms, and still so while the camera dives on into your belly.
  const breaking = s.stop === 'atoms' || s.stop === 'blob' || s.since('atoms') > 1e8;
  let x = BLOB.x;
  let y = BLOB.y;
  let r = BLOB.r;
  let o = 1;
  let sparkle = 0;
  if (breaking) {
    y += 0.01 * Math.sin(s.t * 2);
  } else if (go >= 0 && go < 3) {
    const lift = smooth(go / 1.4);
    x = lerp(BELLY_HALL.x + 0.12, BLOB.x, lift);
    y = lerp(BELLY_HALL.y, BLOB.y, lift) + 0.015 * Math.sin(go * 6);
    r = BLOB.r * (0.5 + 0.5 * smooth(go / 0.4));
    const gone = clamp((go - 1.6) / 0.35);
    o = 1 - gone;
    sparkle = gone > 0 && gone < 1 ? Math.sin(gone * Math.PI) : 0;
  } else return null;
  const [cx, cy] = at(v, x, y);
  const R = r * v.k;
  const atoms = s.thing('atoms', 1.2);
  return (
    <g>
      {o > 0 && atoms < 1 && (
        <g opacity={o * (1 - atoms)}>
          <BlobShape cx={cx} cy={cy} r={R * (1 - 0.35 * atoms)} t={s.t} id="bh-blob" />
        </g>
      )}
      {sparkle > 0 &&
        Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const d = R * (1 + 1.6 * sparkle);
          return (
            <circle
              key={i}
              cx={cx + Math.cos(a) * d}
              cy={cy + Math.sin(a) * d}
              r={R * 0.12 * sparkle}
              fill={J.fatGlow}
            />
          );
        })}
      {atoms > 0 && <BlobAtoms cx={cx} cy={cy} R={R} t={s.t} open={atoms} />}
    </g>
  );
}

/** One atom as a bead: carbon dark, hydrogen white, oxygen red, each with a shine. */
export function Bead({
  x,
  y,
  r,
  kind,
  stroke,
  glow = 0,
}: {
  x: number;
  y: number;
  r: number;
  kind: 'C' | 'H' | 'O';
  stroke: number;
  glow?: number;
}) {
  const fill = kind === 'C' ? J.carbon : kind === 'H' ? J.hydrogen : J.oxygen;
  const shine = kind === 'C' ? J.carbonLight : kind === 'H' ? J.clockFace : J.cross;
  return (
    <g>
      {glow > 0 && (
        <circle
          cx={x}
          cy={y}
          r={r * (1.5 + 0.5 * glow)}
          fill={kind === 'C' ? J.carbonLight : shine}
          opacity={0.35 * glow}
        />
      )}
      <circle cx={x} cy={y} r={r} fill={fill} stroke={LINE.color} strokeWidth={stroke} />
      <circle
        cx={x - r * 0.32}
        cy={y - r * 0.32}
        r={r * 0.3}
        fill={shine}
        opacity={kind === 'H' ? 0.0 : 0.55}
      />
      {kind === 'H' && (
        <circle
          cx={x + r * 0.2}
          cy={y + r * 0.25}
          r={r * 0.55}
          fill={J.hydrogenShade}
          opacity={0.45}
        />
      )}
    </g>
  );
}

/**
 * The blob come apart: not a blob at all but a crowd of small fat molecules, chains of dark
 * carbon dressed in white hydrogen with a little red oxygen at one end, tumbling apart.
 */
function BlobAtoms({
  cx,
  cy,
  R,
  t,
  open,
}: {
  cx: number;
  cy: number;
  R: number;
  t: number;
  open: number;
}) {
  const molecules = Array.from({ length: 9 }, (_, m) => {
    const a = (m / 9) * Math.PI * 2 + rnd(m, 1) * 0.5;
    const d = R * (m === 0 ? 0 : 0.55 + 0.35 * rnd(m, 2)) * (0.6 + 0.9 * smooth(open));
    const turn = rnd(m, 3) * Math.PI * 2 + t * (0.25 + 0.2 * rnd(m, 4)) * (m % 2 ? 1 : -1);
    const size = R * (0.11 + 0.03 * rnd(m, 5)) * smooth(clamp(open * 1.6 - rnd(m, 6) * 0.5));
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, turn, size, m, z: rnd(m, 7) };
  }).sort((p, q) => p.z - q.z);
  return (
    <g>
      {molecules.map((mol) => {
        if (mol.size < 0.5) return null;
        const u = mol.size;
        const beads: ReactNode[] = [];
        const bonds: string[] = [];
        let prev: [number, number] | null = null;
        for (let j = 0; j < 6; j++) {
          const x = (j - 2.5) * u * 1.25;
          const y = (j % 2 ? 1 : -1) * u * 0.35;
          if (prev) bonds.push(`M ${prev[0]} ${prev[1]} L ${x} ${y}`);
          const up = j % 2 ? 1 : -1;
          bonds.push(`M ${x} ${y} L ${x} ${y + up * u * 1.0}`);
          beads.push(
            <Bead
              key={`h${j}`}
              x={x}
              y={y + up * u * 1.0}
              r={u * 0.32}
              kind="H"
              stroke={u * 0.06}
            />,
            <Bead key={`c${j}`} x={x} y={y} r={u * 0.5} kind="C" stroke={u * 0.06} />,
          );
          prev = [x, y];
        }
        const ox = -3.6 * u * 1.25;
        bonds.push(`M ${-2.5 * u * 1.25} ${-u * 0.35} L ${ox} ${0}`);
        beads.push(<Bead key="o" x={ox} y={0} r={u * 0.48} kind="O" stroke={u * 0.06} />);
        return (
          <g
            key={mol.m}
            transform={`translate(${mol.x} ${mol.y}) rotate(${(mol.turn * 180) / Math.PI})`}
          >
            <path d={bonds.join(' ')} stroke={LINE.color} strokeWidth={u * 0.14} fill="none" />
            {beads}
          </g>
        );
      })}
    </g>
  );
}

// ============================================================================================
/** The mascot's place, pose and face in each room. */
type You = { pose: ResolvedPose; face: ExpressionName; to?: ExpressionName; at?: number };

function youInBathroom(s: State): You {
  const st = s.stop;
  if (st === 'feet' || st === 'scale') {
    const go = s.since('fat-blob');
    if (go > 1e8) return { pose: resolvePose(stand), face: 'happy' };
    return { pose: resolvePose(lookDown), face: 'neutral', to: 'surprised', at: go - 0.25 };
  }
  if (st === 'atoms' || st === 'blob') return { pose: resolvePose(stand), face: 'surprised' };
  // Some experts said the toilet: you look at it beside you, not sure what to think of that.
  if (st === 'toilet-seat')
    return {
      pose: resolvePose(lookDown),
      face: 'thinking',
      to: 'suspicious',
      at: s.since('toilet') - 0.2,
    };
  if (st === 'cloud')
    return {
      pose: resolvePose(lookUp),
      face: 'surprised',
      to: 'jaw-drop',
      at: s.since('exhale') - 1.2,
    };
  if (st === 'sweat') return { pose: resolvePose(stand), face: 'surprised' };
  if (st === 'plate') return { pose: resolvePose(lookUp), face: 'happy' };
  return { pose: resolvePose(stand), face: 'thinking' };
}

/** The breath out: puffs from your mouth growing into one big cloud in the room. */
function BreathCloud({ v, s }: { v: View; s: State }) {
  const out = s.thing('exhale', 1.6);
  const plate = s.thing('plate', 0.8);
  // Coming out of your mouth, the first small puffs, before the big cloud on its word.
  const arriving =
    s.stop === 'cloud' && s.since('exhale') < 1e8 ? clamp((s.local / s.fps - 1.0) / 1.2) : 0;
  const small = Math.max(out, 0.5 * arriving);
  if (small <= 0 && plate <= 0) return null;
  const p = pxOf(v);
  const drift = s.stop === 'plate' ? 0.15 * Math.sin(s.t * 0.5) + (s.local / s.fps) * 0.05 : 0;
  const puffs = Array.from({ length: 6 }, (_, i) => {
    const k = clamp(small * 1.4 - i * 0.12);
    const x = MOUTH_HALL.x + 0.12 + 0.12 * i + drift;
    const y = MOUTH_HALL.y - 0.05 - 0.03 * i - 0.02 * Math.sin(s.t + i);
    return { x, y, r: (0.06 + 0.035 * i) * smooth(k), i };
  });
  const big = smooth(out);
  const [bx, by] = at(v, 0.82 + drift, -1.62);
  const br = 0.36 * big * v.k;
  return (
    <g>
      <Glow id="bh-breath" cx={bx} cy={by} r={br * 1.8} colour={J.breath} strength={0.6 * big} />
      {puffs.map((q) => {
        if (q.r <= 0) return null;
        const [cx, cy] = at(v, q.x, q.y);
        return (
          <g key={q.i} transform={`translate(${cx} ${cy})`} opacity={0.9}>
            <Puff r={q.r * v.k} fill={J.breath} shade={J.breathShade} seed={q.i + 3} />
          </g>
        );
      })}
      {br > 2 && (
        <g transform={`translate(${bx} ${by})`}>
          <Puff
            r={br}
            fill={J.breath}
            shade={J.breathShade}
            seed={11}
            stroke={LINE.color}
            sw={4 * p}
          />
          {plate > 0 && <Plate r={br * 0.42} shown={plate} p={p} />}
        </g>
      )}
    </g>
  );
}

/** A faint dinner plate inside the breath cloud. */
function Plate({ r, shown, p }: { r: number; shown: number; p: number }) {
  return (
    <g opacity={0.55 * shown} transform={`scale(${0.8 + 0.2 * outBack(shown)})`}>
      <ellipse
        cx={0}
        cy={r * 0.1}
        rx={r}
        ry={r * 0.55}
        fill={J.plate}
        stroke={J.plateRim}
        strokeWidth={6 * p}
      />
      <ellipse
        cx={0}
        cy={r * 0.1}
        rx={r * 0.62}
        ry={r * 0.33}
        fill="none"
        stroke={J.plateRim}
        strokeWidth={4 * p}
      />
      <ellipse cx={-r * 0.2} cy={0} rx={r * 0.28} ry={r * 0.14} fill={J.food} />
      <ellipse cx={r * 0.22} cy={r * 0.12} rx={r * 0.22} ry={r * 0.11} fill={J.lettuce} />
      <ellipse cx={r * 0.05} cy={-r * 0.12} rx={r * 0.18} ry={r * 0.09} fill={J.bun} />
    </g>
  );
}

/** A drop of sweat on your forehead, in head units. */
function ForeheadSweat({ shown, t }: { shown: number; t: number }) {
  if (shown <= 0) return null;
  const slide = (t * 0.15) % 0.12;
  return <Drop x={0.28} y={-0.32 + slide} size={0.09 * outBack(clamp(shown))} tip={-10} />;
}

/** You on the scale: your bare feet on it, the breath, the sweat. */
function YouInBathroom({ v, s }: { v: View; s: State }) {
  const here = s.room === 'bathroom' ? 1 : s.wasRoom === 'bathroom' ? 1 - s.leave : 0;
  if (here <= 0) return null;
  const me = youInBathroom(s);
  const face = me.to && me.at !== undefined ? faceAt(me.face, me.to, me.at) : EXPRESSIONS[me.face];
  const breathe = 0.008 * Math.sin(s.t * 2.2);
  const pose = { ...me.pose, hipY: me.pose.hipY - breathe };
  const sweat = s.thing('sweat', 0.5);
  const lookAtBlob =
    s.stop === 'toilet-seat'
      ? { x: 2.2, y: 0.9 }
      : s.stop === 'atoms' ||
          s.stop === 'blob' ||
          (s.since('fat-blob') > 0.4 && s.since('fat-blob') < 3)
        ? { x: 1.2, y: -0.4 }
        : undefined;
  return (
    <Mascot
      v={v}
      x={YOU.x}
      ground={YOU.ground}
      pose={pose}
      face={face}
      id="bh-you"
      barefoot
      lookAt={lookAtBlob}
      opacity={here}
      headEffects={<ForeheadSweat shown={sweat} t={s.t} />}
      light={J.spotWarm}
    />
  );
}

/**
 * A run kept on the spot, as on a treadmill: a run carries the body forward and plants its feet
 * where they land, so both are moved back by the distance run.
 */
function onTheSpot(pose: ResolvedPose): ResolvedPose {
  const back = (leg: ResolvedPose['legs']['front']) =>
    'foot' in leg && leg.foot ? { ...leg, foot: { ...leg.foot, x: leg.foot.x - pose.rootX } } : leg;
  return { ...pose, rootX: 0, legs: { front: back(pose.legs.front), back: back(pose.legs.back) } };
}

/** You on the treadmill, breathing out burgers. */
function YouInGym({ v, s }: { v: View; s: State }) {
  const here = s.room === 'gym' ? 1 : s.wasRoom === 'gym' ? 1 - s.leave : 0;
  if (here <= 0) return null;
  const run = ACTIONS.run(s.t);
  const burgers = s.thing('burgers', 0.3);
  const [mx, my] = at(v, TREADMILL.x + 0.38, TREADMILL.deck - MASCOT_TALL * 0.8);
  return (
    <g>
      <Mascot
        v={v}
        x={TREADMILL.x - 0.1}
        ground={TREADMILL.deck - 0.02}
        pose={onTheSpot(run)}
        face={EXPRESSIONS.determined}
        id="bh-gym"
        opacity={here}
        light={J.spotWarm}
        turn={0.9}
      />
      {burgers > 0 &&
        Array.from({ length: 6 }, (_, i) => {
          const age = (s.since('burgers') - i * 0.55) / 2.6;
          if (age < 0 || age > 1) return null;
          const x = mx + (0.1 + 1.0 * age) * v.k * 0.6;
          const y = my - 0.5 * age * v.k * 0.6;
          return (
            <g
              key={i}
              transform={`translate(${x} ${y}) scale(${(0.6 + 0.6 * age) * v.k * 0.0042})`}
              opacity={1 - age ** 2}
            >
              <BurgerPuff />
            </g>
          );
        })}
    </g>
  );
}

/** A puff of breath shaped like a little burger, about 100 units across. */
function BurgerPuff() {
  const sw = { stroke: LINE.color, strokeWidth: 5, strokeLinejoin: 'round' as const };
  return (
    <g>
      <circle r={70} fill={J.breath} opacity={0.6} />
      <path d="M -50 -6 Q 0 -62 50 -6 Z" fill={J.bun} {...sw} />
      <rect x={-54} y={-8} width={108} height={12} rx={6} fill={J.lettuce} {...sw} />
      <rect x={-50} y={4} width={100} height={16} rx={8} fill={J.patty} {...sw} />
      <path d="M -48 20 L 48 20 L 44 34 Q 0 42 -44 34 Z" fill={J.bun} {...sw} />
      {[-24, 0, 22].map((x) => (
        <ellipse
          key={x}
          cx={x}
          cy={-30 + Math.abs(x) * 0.25}
          rx={4}
          ry={2.5}
          fill={J.towelStripe}
        />
      ))}
    </g>
  );
}

/** You on the sofa, panting, dizzy. */
function YouOnSofa({ v, s }: { v: View; s: State }) {
  const here = s.room === 'sofa' ? 1 : s.wasRoom === 'sofa' ? 1 - s.leave : 0;
  if (here <= 0) return null;
  const pant = s.thing('panting', 0.3);
  const base = resolvePose(sitSlump);
  const heave = pant * 0.03 * Math.sin(s.t * 18);
  const pose = { ...base, hipY: base.hipY - heave };
  const dizzy = s.thing('dizzy', 0.4);
  const [mx, my] = at(v, SOFA.x + 0.3, SOFA.seat - 0.95);
  return (
    <g>
      <Mascot
        v={v}
        x={SOFA.x}
        ground={0}
        pose={pose}
        face={EXPRESSIONS.exhausted}
        id="bh-sofa"
        opacity={here}
        light={J.spotWarm}
        headEffects={
          dizzy > 0 ? (
            <g opacity={dizzy}>
              <DizzyStars t={s.t} />
            </g>
          ) : undefined
        }
      />
      {pant > 0 &&
        Array.from({ length: 5 }, (_, i) => {
          const age = (s.t * 2.6 + i / 5) % 1;
          return (
            <g
              key={i}
              transform={`translate(${mx + age * 0.4 * v.k} ${my - age * 0.15 * v.k})`}
              opacity={(1 - age) * 0.8 * pant}
            >
              <Puff r={(0.03 + 0.05 * age) * v.k} fill={J.breath} shade={J.breathShade} seed={i} />
            </g>
          );
        })}
    </g>
  );
}

// ============================================================================================
/** The beam's tilt in degrees, down on the heavier side, swinging to rest after each change. */
function beamTilt(s: State): number {
  const now = s.local / s.fps;
  const kgAt = (name: Parameters<State['since']>[0], kg: number, sec: number) => {
    const t = s.since(name);
    if (t > 1e8) return kg;
    if (t < -1e8) return 0;
    return kg * smooth((sec - (now - t)) / 0.35);
  };
  const target = (sec: number) => {
    const L = kgAt('fat-block', 10, sec) + kgAt('oxygen-block', 29, sec);
    const R = kgAt('gas-block', 28, sec) + kgAt('water-block', 11, sec);
    // The heavier side goes down: a negative tilt lowers the left end.
    return 13 * clamp((R - L) / 18, -1, 1);
  };
  // A swinging beam, worked out frame by frame from the start of the shot.
  const dt = 1 / s.fps;
  let a = target(0);
  let w = 0;
  for (let f = 0; f <= s.local; f++) {
    w += (-(a - target(f * dt)) * 38 - w * 4.2) * dt;
    a += w * dt;
  }
  return a;
}

/** A block of something on a pan: its colour, its name and its weight. */
function Block({
  cx,
  bottom,
  size,
  fill,
  label,
  kg,
  p,
  k,
}: {
  cx: number;
  bottom: number;
  size: number;
  fill: string;
  label: string;
  kg: string;
  p: number;
  k: number;
}) {
  const s = size * k;
  return (
    <g>
      <rect
        x={cx - s / 2}
        y={bottom - s}
        width={s}
        height={s}
        rx={s * 0.08}
        fill={fill}
        stroke={LINE.color}
        strokeWidth={5 * p}
      />
      <rect
        x={cx - s / 2 + s * 0.08}
        y={bottom - s + s * 0.08}
        width={s * 0.84}
        height={s * 0.14}
        rx={s * 0.05}
        fill={J.clockFace}
        opacity={0.3}
      />
      <text
        x={cx}
        y={bottom - s * 0.52}
        fontFamily={font}
        fontWeight={800}
        fontSize={s * (label.length > 5 ? 0.17 : 0.22)}
        fill={J.clockFace}
        stroke={LINE.color}
        strokeWidth={s * 0.03}
        paintOrder="stroke"
        textAnchor="middle"
      >
        {label}
      </text>
      <text
        x={cx}
        y={bottom - s * 0.2}
        fontFamily={font}
        fontWeight={800}
        fontSize={s * 0.22}
        fill={J.clockFace}
        stroke={LINE.color}
        strokeWidth={s * 0.03}
        paintOrder="stroke"
        textAnchor="middle"
      >
        {kg}
      </text>
    </g>
  );
}

/** The giant old balance, its pans, the blocks on them and the two scientists. */
function Balance({ v, s }: { v: View; s: State }) {
  if (!inView(v, BALANCE.x, -2, 3.5)) return null;
  const p = pxOf(v);
  const sw = { stroke: LINE.color, strokeWidth: 5 * p, strokeLinejoin: 'round' as const };
  const tilt = (beamTilt(s) * Math.PI) / 180;
  const [px, py] = at(v, BALANCE.x, BALANCE.pivot);
  const arm = BALANCE.arm * v.k;
  const ends = [-1, 1].map(
    (d) => [px + d * arm * Math.cos(tilt), py + d * arm * Math.sin(tilt)] as const,
  );
  const hang = BALANCE.hang * v.k;
  const level = s.thing('level', 0.6);
  const block = (name: Parameters<State['thing']>[0]) => {
    const t = s.since(name);
    if (t > 1e8) return 1;
    if (t < -1e8) return 0;
    return clamp(t / 0.35);
  };
  const pans = ends.map(([ex, ey]) => ({ x: ex, y: ey + hang }));
  const [lp, rp] = pans;
  const sci = s.thing('scientists', 0.6);
  const [, floor] = at(v, 0, 0);
  const baseW = 1.3 * v.k;
  return (
    <g>
      <Glow
        id="bh-bal"
        cx={px}
        cy={py + 1.2 * v.k}
        r={3.2 * v.k}
        colour={J.spotWarm}
        strength={0.35 + 0.4 * level}
      />
      {/* The column and its base. */}
      <path
        d={`M ${px - baseW / 2} ${floor} L ${px + baseW / 2} ${floor} L ${px + baseW * 0.32} ${floor - 0.22 * v.k} L ${px - baseW * 0.32} ${floor - 0.22 * v.k} Z`}
        fill={J.brassShade}
        {...sw}
      />
      <rect
        x={px - 0.09 * v.k}
        y={py}
        width={0.18 * v.k}
        height={floor - 0.22 * v.k - py}
        fill={J.brass}
        {...sw}
      />
      {[0.3, 0.55, 0.8].map((f) => (
        <rect
          key={f}
          x={px - 0.14 * v.k}
          y={py + (floor - py) * f}
          width={0.28 * v.k}
          height={0.08 * v.k}
          rx={0.03 * v.k}
          fill={J.brassLight}
          {...sw}
        />
      ))}
      {/* The dial behind the pivot and its needle. */}
      <path
        d={`M ${px - 0.5 * v.k} ${py - 0.05 * v.k} A ${0.5 * v.k} ${0.5 * v.k} 0 0 1 ${px + 0.5 * v.k} ${py - 0.05 * v.k} Z`}
        fill={J.clockFace}
        {...sw}
      />
      <line
        x1={px}
        y1={py}
        x2={px + 0.42 * v.k * Math.sin(tilt)}
        y2={py - 0.42 * v.k * Math.cos(tilt)}
        stroke={level > 0 ? J.rightMark : J.cross}
        strokeWidth={7 * p}
        strokeLinecap="round"
      />
      {/* The chains and the pans. */}
      {pans.map((pan, i) => {
        const [ex, ey] = ends[i] ?? [0, 0];
        const half = 0.55 * v.k;
        return (
          <g key={i}>
            <path
              d={`M ${ex} ${ey} L ${pan.x - half * 0.9} ${pan.y} M ${ex} ${ey} L ${pan.x + half * 0.9} ${pan.y}`}
              stroke={J.brassShade}
              strokeWidth={4 * p}
            />
            <path
              d={`M ${pan.x - half} ${pan.y} L ${pan.x + half} ${pan.y} Q ${pan.x + half * 0.8} ${pan.y + 0.22 * v.k} ${pan.x} ${pan.y + 0.24 * v.k} Q ${pan.x - half * 0.8} ${pan.y + 0.22 * v.k} ${pan.x - half} ${pan.y} Z`}
              fill={J.brass}
              {...sw}
            />
          </g>
        );
      })}
      {/* The beam, ornate, with a gold glow once it is level. */}
      <g transform={`rotate(${(tilt * 180) / Math.PI} ${px} ${py})`}>
        <rect
          x={px - arm - 0.08 * v.k}
          y={py - 0.07 * v.k}
          width={2 * arm + 0.16 * v.k}
          height={0.14 * v.k}
          rx={0.07 * v.k}
          fill={J.brass}
          {...sw}
        />
        <circle cx={px - arm} cy={py} r={0.1 * v.k} fill={J.brassLight} {...sw} />
        <circle cx={px + arm} cy={py} r={0.1 * v.k} fill={J.brassLight} {...sw} />
      </g>
      <circle cx={px} cy={py} r={0.15 * v.k} fill={J.brassLight} {...sw} />
      {level > 0 && (
        <g opacity={level}>
          <Glow id="bh-level" cx={px} cy={py} r={2.4 * v.k} colour={J.gold} strength={0.7} />
        </g>
      )}
      {/* The blocks, dropping onto their pans. */}
      {lp && block('fat-block') > 0 && (
        <g
          transform={`translate(0 ${-(1 - outBack(block('fat-block'))) * 1.2 * v.k})`}
          opacity={clamp(block('fat-block') * 4)}
        >
          <Block
            cx={lp.x - 0.24 * v.k}
            bottom={lp.y}
            size={0.42}
            fill={J.blockFat}
            label="FAT"
            kg="10 KG"
            p={p}
            k={v.k}
          />
        </g>
      )}
      {lp && block('oxygen-block') > 0 && (
        <g
          transform={`translate(0 ${-(1 - outBack(block('oxygen-block'))) * 1.2 * v.k})`}
          opacity={clamp(block('oxygen-block') * 4)}
        >
          <Block
            cx={lp.x + 0.27 * v.k}
            bottom={lp.y}
            size={0.56}
            fill={J.blockOxygen}
            label="OXYGEN"
            kg="29 KG"
            p={p}
            k={v.k}
          />
        </g>
      )}
      {rp && block('gas-block') > 0 && (
        <g
          transform={`translate(0 ${-(1 - outBack(block('gas-block'))) * 1.2 * v.k})`}
          opacity={clamp(block('gas-block') * 4)}
        >
          <Block
            cx={rp.x - 0.22 * v.k}
            bottom={rp.y}
            size={0.55}
            fill={J.blockGas}
            label="CO2"
            kg="28 KG"
            p={p}
            k={v.k}
          />
        </g>
      )}
      {rp && block('water-block') > 0 && (
        <g
          transform={`translate(0 ${-(1 - outBack(block('water-block'))) * 1.2 * v.k})`}
          opacity={clamp(block('water-block') * 4)}
        >
          <Block
            cx={rp.x + 0.3 * v.k}
            bottom={rp.y}
            size={0.42}
            fill={J.blockWater}
            label="WATER"
            kg="11 KG"
            p={p}
            k={v.k}
          />
        </g>
      )}
      <Scientists v={v} hop={sci} />
    </g>
  );
}

const CLIPBOARD = (hands: { front: HandFrame; back: HandFrame }) => {
  const c = hands.front.center;
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(-8)`}>
      <rect
        x={-0.18}
        y={-0.42}
        width={0.36}
        height={0.48}
        rx={0.03}
        fill={J.clipboard}
        stroke={LINE.color}
        strokeWidth={0.035}
      />
      <rect x={-0.14} y={-0.36} width={0.28} height={0.38} fill={J.page} />
      {[-0.28, -0.2, -0.12, -0.04].map((y) => (
        <line key={y} x1={-0.1} y1={y} x2={0.1} y2={y} stroke={J.pageBar} strokeWidth={0.025} />
      ))}
      <rect x={-0.06} y={-0.46} width={0.12} height={0.07} rx={0.02} fill={J.faucetShade} />
    </g>
  );
};

/** The two scientists by the balance, with their clipboards. */
function Scientists({ v, hop }: { v: View; hop: number }) {
  const people: { x: number; skin: number; hair: HairStyle; facing: 'left' | 'right' }[] = [
    { x: BALANCE.x - 0.05, skin: 2, hair: 'short-crop', facing: 'right' },
    { x: BALANCE.x + BALANCE.arm + 0.95, skin: 1, hair: 'bun', facing: 'left' },
  ];
  return (
    <Blended id="bh-sci" u={pxOf(v)} rim={0}>
      {people.map((m, i) => {
        const head = MASCOT_HEAD * v.k;
        if (!inView(v, m.x, -0.9, 1.2)) return null;
        const [sx, sy] = at(v, m.x, 0);
        const jump = hop > 0 && hop < 1 ? Math.sin(hop * Math.PI) * 0.12 * v.k : 0;
        return (
          <Character
            key={i}
            x={sx}
            groundY={sy - jump}
            head={head}
            facing={m.facing}
            pose={resolvePose(hop > 0 ? point : stand)}
            face={EXPRESSIONS[hop > 0 ? 'determined' : 'thinking']}
            turn={0.3}
            identity={{ skinTone: m.skin, hair: m.hair, hairColor: i ? 'gray' : 'dark-brown' }}
            outfit={SCIENTIST}
            prop={CLIPBOARD}
            lookAt={{ x: m.facing === 'right' ? 1 : -1, y: -1.2 }}
          />
        );
      })}
    </Blended>
  );
}

// ============================================================================================
type Expert = { x: number; row: number; kind: 'doctor' | 'dietitian' | 'trainer'; i: number };
const EXPERTS: Expert[] = (() => {
  const out: Expert[] = [];
  for (let row = 0; row < ROWS; row++)
    for (let c = 0; c < PER_ROW; c++) {
      const i = row * PER_ROW + c;
      const x = -4.55 + c * 1.3 + (row % 2 ? 0.65 : 0) + (rnd(i, 21) - 0.5) * 0.3;
      const kind = c < 3 ? 'doctor' : c < 6 ? 'dietitian' : 'trainer';
      out.push({ x, row, kind, i });
    }
  return out;
})();
/** The three who were right (3 of 150, Meerman and Brown, 2014). */
const RIGHT = new Set([PER_ROW * 2 + 3, PER_ROW * 4 + 6, PER_ROW * 5 + 1]);
const HAIRS: HairStyle[] = [
  'short-crop',
  'fade',
  'afro',
  'locs',
  'braids',
  'straight-bob',
  'long',
  'bun',
  'ponytail',
  'bald',
];
const HAIR_COLOURS: Identity['hairColor'][] = [
  'black',
  'dark-brown',
  'brown',
  'auburn',
  'blond',
  'gray',
];
function expertLook(e: Expert): { identity: Identity; clothes: Clothes } {
  const identity: Identity = {
    skinTone: 1 + Math.floor(rnd(e.i, 31) * 7),
    hair: HAIRS[Math.floor(rnd(e.i, 32) * HAIRS.length)] ?? 'short-crop',
    hairColor: HAIR_COLOURS[Math.floor(rnd(e.i, 33) * HAIR_COLOURS.length)] ?? 'black',
  };
  const trainer = (['crimson', 'orange', 'gold', 'forest'] as const)[e.i % 4] ?? 'crimson';
  const shirt = (['cream', 'denim', 'steel', 'tan'] as const)[e.i % 4] ?? 'cream';
  const clothes: Clothes =
    e.kind === 'doctor'
      ? {
          top: { kind: 'lab-coat', cloth: 'white', under: 'glint' },
          bottom: { kind: 'trousers', cloth: 'denim' },
        }
      : e.kind === 'dietitian'
        ? { top: { kind: 'shirt', cloth: shirt }, bottom: { kind: 'trousers', cloth: 'steel' } }
        : {
            top: { kind: 't-shirt', cloth: trainer },
            bottom: { kind: 'trousers', cloth: 'denim' },
          };
  return { identity, clothes };
}
const LOOKS = EXPERTS.map(expertLook);
const OUTFITS = LOOKS.map((l) => outfitFrom(l.clothes));

/** The front row, nearest the camera, where the close shots go. */
const FRONT = ROWS - 1;
/** Two in the front row hold up their answers on signs; a trainer beside them flexes. */
const SIGNS: { who: number; text: string; thing: 'energy' | 'heat' }[] = [
  { who: FRONT * PER_ROW + 3, text: 'ENERGY', thing: 'energy' },
  { who: FRONT * PER_ROW + 4, text: 'HEAT', thing: 'heat' },
];
const FLEXER = FRONT * PER_ROW + 6;

/** Both arms up, bent at the elbow, fists by the ears: showing off a muscle. */
const flex: Pose = {
  id: 'flex',
  torsoLean: -3,
  headTilt: -6,
  arms: { front: { upper: 95, lower: 78 }, back: { upper: -95, lower: -78 } },
  legs: stand.legs,
};

/** How each one looks once turned round to you: sure of themselves, pleased or smug. */
const sureOf = (e: Expert): ExpressionName => (rnd(e.i, 91) > 0.45 ? 'happy' : 'smug');

/**
 * A spring: from 0 it overshoots past 1 and settles, the way a thing thrown into place does.
 * `t` is seconds since it started.
 */
const springIn = (t: number) => (t <= 0 ? 0 : 1 - Math.exp(-5.5 * t) * Math.cos(9 * t));

/**
 * The experts in rows before the stage, in three groups across the hall: doctors in white coats
 * on the left, dietitians in the middle, trainers in gym shirts on the right. Re-staged on
 * 2026-10-22 after a frame-by-frame study of Kurzgesagt (knowledge/playbooks/kurzgesagt-study.md):
 * few big subjects and a camera that keeps moving. They stand with their backs to you, watching
 * the stage, until they are named: the camera goes close on each group in the front row as it
 * turns round to face you and waves; on "asked" the whole hall turns round, front rows first.
 * Faces blink and glance about. When the verdict comes, a red cross drops onto each wrong head
 * and its owner looks up at it, startled; the three right ones laugh. Then the answers, close:
 * two signs come up on their sticks and a trainer flexes. The rows move at different speeds in
 * the wide view (the nearest the most), and blurred heads very near the camera give it depth.
 */
function Crowd({ v, s }: { v: View; s: State }) {
  if (!inView(v, 0, CROWD_TOP + 3, 6)) return null;
  const p = pxOf(v);
  const head = MASCOT_HEAD * v.k;
  if (head < 4) return null;
  const clockFrame = Math.round(s.t * s.fps);
  /** The frame of the shot a thing's word is said on; long before if it is kept, null if absent. */
  const wordFrame = (name: Parameters<State['since']>[0]): number | null => {
    const since = s.since(name);
    if (since > 1e8) return -10_000;
    if (since < -1e8) return null;
    return Math.round(s.local - since * s.fps);
  };
  const named = {
    doctor: s.thing('doctors', 0.5),
    dietitian: s.thing('dietitians', 0.5),
    trainer: s.thing('trainers', 0.5),
  };
  const namedAt = {
    doctor: wordFrame('doctors'),
    dietitian: wordFrame('dietitians'),
    trainer: wordFrame('trainers'),
  };
  const askedAt = wordFrame('asked');
  const wrongAt = wordFrame('wrong');
  const wrong = s.thing('wrong', 0.9);
  const muscleAt = wordFrame('muscle');
  // Depth in the wide view: the middle row stays where it is; nearer rows grow and slide more as
  // the camera moves in and pans, farther ones less. Close up it fades out, so a close shot stays
  // framed on the people it is about.
  const deep = clamp((v.cam.w - 3.5) / 3.5);
  const zoom = 9.8 / Math.max(0.5, v.cam.w);
  const rowShift = (row: number) => {
    const depth = (row - 3) * deep;
    const k = zoom ** (0.025 * depth);
    const dx = -v.cam.x * v.k * 0.03 * depth;
    return `translate(${v.fx + dx} ${v.fy}) scale(${k}) translate(${-v.fx} ${-v.fy})`;
  };
  // A heavier blend close up, as on the mascot, so a big face keeps its soft look.
  const blend = p * Math.min(2.2, Math.max(0.35, head / 120));
  const rows: ReactNode[][] = Array.from({ length: ROWS }, () => []);
  const marks: ReactNode[] = [];
  for (const e of EXPERTS) {
    const ground = CROWD_TOP + e.row * ROW_STEP;
    const top = ground - MASCOT_TALL;
    if (!inView(v, e.x, top + 0.4, 1.2)) continue;
    const [sx, sy] = at(v, e.x, ground);
    const sign = SIGNS.find((g) => g.who === e.i);
    const signAt = sign ? wordFrame(sign.thing) : null;
    const flexing = e.i === FLEXER && muscleAt !== null;
    const front = e.row === FRONT;
    const groupAt = namedAt[e.kind];
    // When this one turns round to face you: the front row on its group's name, everyone on
    // "asked", the front rows first and the back ones last.
    const turnAts: number[] = [];
    if (front && groupAt !== null) turnAts.push(groupAt + Math.round(rnd(e.i, 81) * 5));
    if (askedAt !== null)
      turnAts.push(askedAt + Math.round(((FRONT - e.row) * 0.07 + rnd(e.i, 82) * 0.25) * s.fps));
    const turnAt = turnAts.length ? Math.min(...turnAts) : null;
    const turning = turnAt === null ? 0 : clamp((s.local - turnAt) / 9);
    const turned = turning >= 0.4;
    // The keys of this person's moves through the shot, each taken with a wind-up and a settle.
    const keys: { frame: number; pose: Pose }[] = [{ frame: -20_000, pose: stand }];
    if (front && groupAt !== null && groupAt > -10_000)
      keys.push({ frame: groupAt + 6, pose: wave }, { frame: groupAt + 30, pose: stand });
    const markDelay = Math.round((e.row * 0.1 + rnd(e.i, 51) * 0.3) * s.fps * 0.9);
    const right = RIGHT.has(e.i);
    if (wrongAt !== null && signAt === null && !flexing && !front)
      keys.push({
        frame: Math.max(-9_999, wrongAt + markDelay + 10),
        pose: right ? handsUp : shrug,
      });
    if (signAt !== null) keys.push({ frame: Math.max(-9_999, signAt), pose: wave });
    if (flexing && muscleAt !== null) keys.push({ frame: Math.max(-9_999, muscleAt), pose: flex });
    keys.sort((a, b) => a.frame - b.frame);
    const pose = withLife(poseAt(s.local, keys), clockFrame, s.fps, e.i + 7);
    // The face: sure of themselves once turned; startled when the cross lands on their head.
    const landed = wrongAt === null ? -1 : (s.local - wrongAt - markDelay) / s.fps - 0.35;
    const reacts = landed > 0 && !sign && !flexing;
    const sure = sureOf(e);
    const face = reacts
      ? faceAt(sure, right ? 'laughing' : 'surprised', landed)
      : EXPRESSIONS[sure];
    const look = LOOKS[e.i];
    const facing = rnd(e.i, 41) > 0.5 ? 'right' : 'left';
    // Turning round: the back of the head swings to a side view, then the face comes round to you.
    const turn = turned ? lerp(1, 0.18, smooth((turning - 0.4) / 0.6)) : 0.25;
    const hop = turning > 0 && turning < 1 ? Math.sin(turning * Math.PI) * 0.04 * v.k : 0;
    const looksUp = reacts && !right;
    rows[e.row]?.push(
      <Character
        key={e.i}
        x={sx}
        groundY={sy - hop}
        head={head}
        facing={facing}
        pose={pose}
        face={face}
        turn={turn}
        blink={turned ? blinkAt(clockFrame, s.fps, e.i + 3) : 0}
        lookAt={looksUp ? { x: facing === 'right' ? 0.2 : -0.2, y: -1.4 } : undefined}
        gaze={turned && !looksUp ? gazeAt(clockFrame, s.fps, e.i + 5) : undefined}
        identity={look?.identity}
        outfit={OUTFITS[e.i]}
        back={!turned}
        prop={e.kind === 'dietitian' && !sign && front ? CLIPBOARD : undefined}
      />,
    );
    // A small red cross over everyone who was wrong, a green tick over the three who were
    // right: each drops onto its head and bounces.
    if (wrong > 0 && wrongAt !== null) {
      const t = (s.local - wrongAt - markDelay) / s.fps;
      const k = springIn(t);
      if (t > 0) {
        const [hx, hy0] = at(v, e.x, top - 0.18 - 0.1 * (1 - deep));
        const hy = hy0 - (1 - Math.min(1, k)) * 0.7 * v.k;
        const r = 0.13 * v.k;
        marks.push(
          <g key={`m${e.i}`} transform={rowShift(e.row)} opacity={clamp(t * 6)}>
            <circle
              cx={hx}
              cy={hy}
              r={r * 1.25}
              fill={right ? J.rightMark : J.wrongMark}
              stroke={LINE.color}
              strokeWidth={3 * p}
            />
            {right ? (
              <path
                d={`M ${hx - r * 0.55} ${hy} L ${hx - r * 0.1} ${hy + r * 0.45} L ${hx + r * 0.6} ${hy - r * 0.45}`}
                fill="none"
                stroke={J.clockFace}
                strokeWidth={r * 0.32}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d={`M ${hx - r * 0.5} ${hy - r * 0.5} L ${hx + r * 0.5} ${hy + r * 0.5} M ${hx + r * 0.5} ${hy - r * 0.5} L ${hx - r * 0.5} ${hy + r * 0.5}`}
                stroke={J.clockFace}
                strokeWidth={r * 0.32}
                strokeLinecap="round"
              />
            )}
          </g>,
        );
      }
    }
    // A sign comes up from below on its stick and wobbles to rest.
    if (sign && signAt !== null) {
      const t = (s.local - signAt) / s.fps;
      if (t > 0) {
        const k = springIn(t);
        // Each sign leans out to its own side, so the two never cover each other.
        const [hx, hy0] = at(v, e.x + (sign === SIGNS[0] ? -0.05 : 0.05), top - 0.55);
        const hy = hy0 + (1 - k) * 1.2 * v.k;
        const tilt = -4 + 8 * rnd(e.i, 61) + 14 * Math.exp(-4 * t) * Math.sin(13 * t);
        const w = (0.36 + sign.text.length * 0.16) * v.k;
        const h = 0.5 * v.k;
        marks.push(
          <g
            key={`s${e.i}`}
            transform={`${rowShift(e.row)} translate(${hx} ${hy}) rotate(${tilt})`}
            opacity={clamp(t * 8)}
          >
            <line
              x1={0}
              y1={h / 2}
              x2={0}
              y2={h / 2 + 0.75 * v.k}
              stroke={J.signStick}
              strokeWidth={0.07 * v.k}
              strokeLinecap="round"
            />
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx={0.06 * v.k}
              fill={J.sign}
              stroke={LINE.color}
              strokeWidth={4 * p}
            />
            <text
              x={0}
              y={h * 0.2}
              fontFamily={font}
              fontWeight={800}
              fontSize={h * 0.56}
              fill={J.wrongMark}
              textAnchor="middle"
            >
              {sign.text}
            </text>
          </g>,
        );
      }
    }
  }
  // The big red cross, brushed on in two strokes, each a little curved like a hand's.
  const sweep = s.thing('wrong', 0.7) * deep;
  const stroke = (
    from: [number, number],
    to: [number, number],
    bend: number,
    drawn: number,
    key: string,
  ) => {
    if (drawn <= 0) return null;
    const [ax, ay] = at(v, from[0], from[1]);
    const [bx, by] = at(v, to[0], to[1]);
    const mx = (ax + bx) / 2 + bend * v.k;
    const my = (ay + by) / 2 - bend * v.k * 0.5;
    const d = `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
    return (
      <g key={key}>
        <path
          d={d}
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - drawn}
          fill="none"
          stroke={J.wrongMark}
          strokeWidth={0.46 * v.k}
          strokeLinecap="round"
        />
        <path
          d={d}
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - drawn}
          fill="none"
          stroke={J.curtainLight}
          strokeWidth={0.12 * v.k}
          strokeLinecap="round"
          opacity={0.5}
        />
      </g>
    );
  };
  // Heads very near the camera, dark and soft, at the bottom of the hall: the audience's own seat.
  const near: ReactNode[] =
    v.cam.w > 3.5
      ? Array.from({ length: 5 }, (_, i) => {
          const wx = -5 + i * 2.6 + 0.6 * rnd(i, 71);
          const [nx] = at(v, wx * 1.25, 0);
          const nx2 = v.fx + (nx - v.fx) * 1.25 - v.cam.x * v.k * 0.25;
          const ny = v.H - 40 * p;
          const r = 0.55 * v.k * 1.6;
          return (
            <g key={`n${i}`}>
              <ellipse cx={nx2} cy={ny + r * 0.9} rx={r * 1.5} ry={r * 0.9} fill={LINE.color} />
              <circle cx={nx2} cy={ny - r * 0.2} r={r} fill={LINE.color} />
            </g>
          );
        })
      : [];
  // Each group's name: close up over the front row, wide over the whole group.
  const close = deep < 0.5;
  const nameY = close ? CROWD_TOP + FRONT * ROW_STEP - 2.15 : CROWD_TOP - 1.1;
  return (
    <g>
      <defs>
        <filter id="bh-near" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={10 * p} />
        </filter>
      </defs>
      {rows.map((row, i) => (
        <g key={`r${i}`} transform={rowShift(i)}>
          <Blended id={`bh-crowd${i}`} u={blend} rim={0}>
            {row}
          </Blended>
        </g>
      ))}
      {sweep > 0 && (
        <g opacity={0.88}>
          {stroke([-4.2, CROWD_TOP - 1.4], [4.4, CROWD_TOP + 5.6], 0.6, clamp(sweep * 2), 'x1')}
          {stroke(
            [4.4, CROWD_TOP - 1.4],
            [-4.2, CROWD_TOP + 5.6],
            -0.5,
            clamp(sweep * 2 - 1),
            'x2',
          )}
        </g>
      )}
      {marks}
      {near.length > 0 && (
        <g filter="url(#bh-near)" opacity={0.85}>
          {near}
        </g>
      )}
      <Tag v={v} x={-3.25} y={nameY} text="DOCTORS" shown={named.doctor * (1 - s.thing('asked'))} />
      <Tag
        v={v}
        x={0}
        y={nameY}
        text="DIETITIANS"
        shown={named.dietitian * (1 - s.thing('asked'))}
      />
      <Tag v={v} x={3.9} y={nameY} text="TRAINERS" shown={named.trainer * (1 - s.thing('asked'))} />
      <Tag
        v={v}
        x={EXPERTS[FLEXER]?.x ?? 3.25}
        y={CROWD_TOP + FRONT * ROW_STEP - 2.3}
        text="MUSCLE"
        shown={s.thing('muscle', 0.5) * (close ? 1 : 0)}
        colour={J.wrongMark}
      />
    </g>
  );
}

// ============================================================================================
/** The hall at one frame. */
export function Hall({ v, s }: { v: View; s: State }) {
  return (
    <g>
      <HallBack v={v} s={s} />
      <Stage v={v} />
      <House v={v} s={s} />
      <Scale v={v} />
      <YouInBathroom v={v} s={s} />
      <YouInGym v={v} s={s} />
      <YouOnSofa v={v} s={s} />
      <BreathCloud v={v} s={s} />
      <Balance v={v} s={s} />
      <Crowd v={v} s={s} />
      <FatBlob v={v} s={s} />
      <Readout v={v} s={s} />
      <Tag
        v={v}
        x={TOILET.x - 0.1}
        y={-1.2}
        text="PEE"
        shown={s.thing('pee', 0.5) * (v.cam.w < 3 ? 1 : 0)}
      />
      <Tag
        v={v}
        x={TOILET.x}
        y={-1.15}
        text="THE TOILET?"
        shown={s.thing('toilet', 0.5)}
        colour={J.wrongMark}
      />
      <Tag
        v={v}
        x={BALANCE.x}
        y={-0.35}
        text="TWO SCIENTISTS"
        shown={s.thing('scientists', 0.5) * (1 - s.thing('fat-block'))}
      />
    </g>
  );
}
