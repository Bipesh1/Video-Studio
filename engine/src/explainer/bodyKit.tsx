import type { CharacterCard, JourneyThing } from '@studio/shared';
import type { ReactNode } from 'react';
import mascotCard from '../../../characters/catch-mascot.json';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { EXPRESSIONS, blendFace } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { VIEWER_FONT } from '../overlays/text';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { lookFrom } from '../wardrobe/cast';
import { outfitFrom } from '../wardrobe/garments';
import type { Clothes } from '../wardrobe/garments';
import { Blended } from './Blend';
import { clamp, outBack } from './Journey';
import type { View } from './Journey';

/**
 * What the drawings of the world `body` share (2026-10-21, "Where Does Your Fat Go When You Lose
 * Weight?"): the colours, where a point of a frame falls on the picture, a group drawn in a
 * frame's own units, the labels, and the channel's mascot, drawn from his card in the blended
 * look (C) that Biku picked.
 */

export const J = fineTokens.journey;
export const LINE = fineTokens.line;
export const font = `${VIEWER_FONT}, Arial, sans-serif`;

/** A small seeded random number, the same every frame. */
export const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Where a point of a frame falls on the picture. */
export const at = (v: View, x: number, y: number): [number, number] => [
  v.fx + (x - v.cam.x) * v.k,
  v.fy + (y - v.cam.y) * v.k,
];
/** A group drawn in the frame's own units. */
export function Local({ v, children }: { v: View; children: ReactNode }) {
  const [x, y] = at(v, 0, 0);
  return <g transform={`translate(${x} ${y}) scale(${v.k})`}>{children}</g>;
}
/** The unit of a line's width on the picture: a pixel of a 1080 picture. */
export const pxOf = (v: View) => Math.min(v.W, v.H) / 1080;
export const NS = { vectorEffect: 'non-scaling-stroke' as const };
/** True when a thing of this size round this point can be seen and is not drawn huge. */
export const inView = (v: View, x: number, y: number, size: number, most = 6) => {
  const [sx, sy] = at(v, x, y);
  const r = size * v.k;
  return (
    r > 0.6 &&
    r < Math.max(v.W, v.H) * most &&
    sx + r > -50 &&
    sx - r < v.W + 50 &&
    sy + r > -50 &&
    sy - r < v.H + 50
  );
};
/**
 * A box of the frame drawn on the picture, cut to a little beyond it: a wall or a floor seen
 * from close up never reaches thousands of pixels past the frame (that made the browser draw
 * the water world in tiles, with seams, 2026-10-18).
 */
export function Box({
  v,
  x0,
  y0,
  x1,
  y1,
  fill,
  opacity,
}: {
  v: View;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  fill: string;
  opacity?: number;
}) {
  const [a, b] = at(v, x0, y0);
  const [c, d] = at(v, x1, y1);
  const l = Math.max(-200, Math.min(a, c));
  const r = Math.min(v.W + 200, Math.max(a, c));
  const t = Math.max(-200, Math.min(b, d));
  const bt = Math.min(v.H + 200, Math.max(b, d));
  if (r <= l || bt <= t) return null;
  return <rect x={l} y={t} width={r - l} height={bt - t} fill={fill} opacity={opacity} />;
}

/** A label pinned to a thing as it arrives: a dark pill with light words. */
export function Tag({
  v,
  x,
  y,
  text,
  shown,
  colour = LINE.color,
  ink = J.clockFace,
}: {
  v: View;
  x: number;
  y: number;
  text: string;
  shown: number;
  colour?: string;
  ink?: string;
}) {
  if (shown <= 0) return null;
  const [sx, sy] = at(v, x, y);
  if (sx < -200 || sx > v.W + 200 || sy < -100 || sy > v.H + 100) return null;
  const s = pxOf(v) * (0.7 + 0.3 * outBack(clamp(shown)));
  // It rises into place as it grows, never simply appears (the animation rules, 2026-10-22).
  const rise = (1 - outBack(clamp(shown))) * 40 * pxOf(v);
  const w = text.length * 27 + 52;
  return (
    <g
      transform={`translate(${clamp(sx, 40 + w / 2, v.W - 40 - w / 2)} ${clamp(sy, 60, v.H * 0.78) + rise}) scale(${s})`}
      opacity={clamp(shown * 3)}
    >
      <rect x={-w / 2} y={-36} width={w} height={66} rx={33} fill={colour} />
      <text
        x={0}
        y={14}
        fontFamily={font}
        fontWeight={800}
        fontSize={42}
        fill={ink}
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  );
}

/** The state of the world at one frame. */
export type State = {
  /** Seconds since the part began: the world's own time, running on across shots. */
  t: number;
  /** Frames since the shot began, and the shot's length. */
  local: number;
  fps: number;
  W: number;
  H: number;
  /** How far a thing has come in, 0 to 1, over `seconds` from its word. */
  thing: (name: JourneyThing, seconds?: number) => number;
  /** Seconds since a thing's word, or a large negative number before it. */
  since: (name: JourneyThing) => number;
  /** Where the mascot is in this shot. */
  room: Room;
  /** How far the mascot has left the room of the shot before (1 when he is gone). */
  leave: number;
  /** The room of the shot before, when the mascot moved this shot. */
  wasRoom: Room | null;
  /** The stop the camera is flying to. */
  stop: string;
};
export type Room = 'bathroom' | 'gym' | 'sofa' | 'away';

// ---- the mascot
const card = mascotCard as CharacterCard;
const look = lookFrom(card, card.id);
const clothes = (card as unknown as { outfit: { clothes: Clothes } }).outfit.clothes;
/** At home on the scale he is barefoot. */
const BAREFOOT = outfitFrom({ top: clothes.top, bottom: clothes.bottom });
/** His height in the world's metres, and the head that gives it (Ink Stick: the head is 0.29). */
export const MASCOT_TALL = 1.7;
export const MASCOT_HEAD = MASCOT_TALL * 0.29;

/** A face held, then changed to another over half a second, from a moment. */
export function faceAt(
  from: ExpressionName,
  to: ExpressionName,
  sinceChange: number,
): CharacterProps['face'] {
  return blendFace(EXPRESSIONS[from], EXPRESSIONS[to], clamp(sinceChange / 0.5));
}

/**
 * The mascot standing in the world: his card's look in the blended look C, the warm light of
 * the place on one edge. `x` and `ground` are in the frame's units; his size follows the camera.
 */
export function Mascot({
  v,
  x,
  ground,
  pose,
  face,
  id,
  turn = 0.2,
  facing = 'right',
  barefoot = false,
  lookAt,
  talk,
  headEffects,
  light,
  opacity = 1,
  scale = 1,
}: {
  v: View;
  x: number;
  ground: number;
  pose: CharacterProps['pose'];
  face: CharacterProps['face'];
  id: string;
  turn?: number;
  facing?: CharacterProps['facing'];
  barefoot?: boolean;
  lookAt?: CharacterProps['lookAt'];
  talk?: CharacterProps['talk'];
  headEffects?: ReactNode;
  light?: string;
  opacity?: number;
  scale?: number;
}) {
  const head = MASCOT_HEAD * scale * v.k;
  if (opacity <= 0 || head < 3 || head > Math.max(v.W, v.H) * 1.6) return null;
  const [sx, sy] = at(v, x, ground);
  if (sx < -head * 3 || sx > v.W + head * 3 || sy < -head || sy > v.H + head * 4) return null;
  const u = pxOf(v) * Math.min(2.2, Math.max(0.35, head / 120));
  return (
    <g opacity={opacity}>
      <Blended id={id} u={u} light={light}>
        <Character
          x={sx}
          groundY={sy}
          head={head}
          facing={facing}
          pose={pose}
          face={face}
          turn={turn}
          identity={look.identity}
          outfit={barefoot ? BAREFOOT : look.outfit}
          eyeStyle={look.eyeStyle}
          lookAt={lookAt}
          talk={talk}
          headEffects={headEffects}
        />
      </Blended>
    </g>
  );
}

/** A soft glow behind something: a circle of colour fading out. */
export function Glow({
  id,
  cx,
  cy,
  r,
  colour,
  strength = 1,
}: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  colour: string;
  strength?: number;
}) {
  if (strength <= 0 || r <= 0) return null;
  return (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={colour} stopOpacity={0.75 * strength} />
          <stop offset="0.45" stopColor={colour} stopOpacity={0.3 * strength} />
          <stop offset="1" stopColor={colour} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </g>
  );
}

/** A five-pointed star path round 0,0. */
export const starPath = (r: number, inner: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? inner : r;
    pts.push(`${(rr * Math.cos(a)).toFixed(4)} ${(rr * Math.sin(a)).toFixed(4)}`);
  }
  return `M ${pts.join(' L ')} Z`;
};

/** A puff of cloud round 0,0 of radius about r: overlapping circles with a soft shade. */
export function Puff({
  r,
  fill,
  shade,
  seed,
  stroke,
  sw,
}: {
  r: number;
  fill: string;
  shade: string;
  seed: number;
  stroke?: string;
  sw?: number;
}) {
  const lobes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 + rnd(seed, i) * 0.6;
    const d = r * (0.42 + 0.12 * rnd(seed, i + 9));
    return {
      x: Math.cos(a) * d,
      y: Math.sin(a) * d * 0.72,
      r: r * (0.5 + 0.18 * rnd(seed, i + 3)),
    };
  });
  return (
    <g>
      {stroke && (
        <g>
          {lobes.map((l, i) => (
            <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={stroke} />
          ))}
          <circle cx={0} cy={0} r={r * 0.62} fill={stroke} />
        </g>
      )}
      <g>
        {lobes.map((l, i) => (
          <circle
            key={i}
            cx={l.x}
            cy={l.y}
            r={Math.max(0, l.r - (sw ?? 0))}
            fill={i > 3 ? shade : fill}
          />
        ))}
        <circle cx={0} cy={-r * 0.05} r={Math.max(0, r * 0.62 - (sw ?? 0))} fill={fill} />
      </g>
    </g>
  );
}
