import type { ReactNode } from 'react';
import { DEG } from '../rig/math';
import { seeded } from '../rig/random';
import {
  MASK_HIDE,
  MASK_SHOW,
  accent,
  ink,
  lighten,
  lineWeights,
  mix,
  palette,
  pick,
  shade,
  tokens,
  white,
} from '../tokens';
import { lightOffset } from '../wardrobe/Shaded';
import { paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * Things in the sky for the science videos (guide version 14): the Sun, the full Moon, the
 * Earth, any other planet, an asteroid and a black hole. Each is drawn round its own middle
 * with its radius `r` in head units, so a scene can make it any size.
 *
 * When a shot is about one of them it is a prop (Style 4): outlined, bright, one shadow tone.
 * Far off in the sky of a place it is part of the background, and a background has no
 * outlines (Style 5.1): pass `outlined={false}`. `t` in seconds makes it live: the Sun's
 * flares breathe, the Earth turns, a tail of fire flickers.
 */

export type SkyProps = PropProps & {
  /** Radius in head units. */
  r?: number;
  /** Seconds, for the parts that move. */
  t?: number;
  /** False when it is part of a background (Style 5.1). */
  outlined?: boolean;
};

const disc = (r: number, cx = 0, cy = 0) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

const rim = (r: number, outlined: boolean): ReactNode =>
  outlined ? <circle r={r} fill="none" stroke={ink} strokeWidth={lineWeights.outline} /> : null;

/**
 * The one hard-edged shadow of a ball (Style 3.3): everything inside the ball that is not
 * inside the same ball shifted toward the light gets one darker tone, whatever is drawn on it.
 */
function BallShadow({
  uid,
  r,
  shadowSide,
  depth = 0.16,
  strength = 0.24,
}: {
  uid: string;
  r: number;
  shadowSide: 1 | -1;
  depth?: number;
  strength?: number;
}) {
  const off = lightOffset(shadowSide, r * depth);
  return (
    <g>
      <defs>
        <mask id={`${uid}-shade`}>
          <path d={disc(r)} fill={MASK_SHOW} />
          <path d={disc(r, off.x, off.y)} fill={MASK_HIDE} />
        </mask>
      </defs>
      <path d={disc(r)} fill={ink} opacity={strength} mask={`url(#${uid}-shade)`} />
    </g>
  );
}

/** Something drawn only inside a ball. */
const inside = (uid: string, r: number, children: ReactNode): ReactNode => (
  <g>
    <defs>
      <clipPath id={`${uid}-ball`}>
        <path d={disc(r)} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${uid}-ball)`}>{children}</g>
  </g>
);

/** The Sun: a gold ball in a ring of flares that breathe, with a soft glow round it. */
export function Sun({ uid, r = 1.5, t = 0, outlined = true }: SkyProps) {
  const gold = paintOf('gold');
  const orange = paintOf('orange');
  const flares = 12;
  const turn = t * 4;
  const points: string[] = [];
  for (let i = 0; i < flares * 2; i++) {
    const long = i % 2 === 0;
    const breathe = 0.05 * Math.sin(t * 2.2 + i * 1.7);
    const reach = long ? 1.42 + (i % 4 === 0 ? 0.12 : 0) + breathe : 1.08;
    const a = (turn + (360 * i) / (flares * 2)) * DEG;
    points.push(`${r * reach * Math.cos(a)} ${r * reach * Math.sin(a)}`);
  }
  return (
    <g>
      {/* Light, not part of the thing: no outline. */}
      <circle r={r * (1.62 + 0.04 * Math.sin(t * 1.3))} fill={gold.fill} opacity={0.2} />
      <path
        d={`M ${points.join(' L ')} Z`}
        fill={orange.fill}
        {...(outlined
          ? { stroke: ink, strokeWidth: lineWeights.outline, strokeLinejoin: tokens.line.join }
          : {})}
      />
      <circle r={r} fill={gold.fill} />
      {inside(
        uid,
        r,
        <>
          <circle cx={-r * 0.14} cy={-r * 0.16} r={r * 0.82} fill={lighten(gold.fill, 0.28)} />
          {/* Two slow swirls on the face of it. */}
          <path
            d={`M ${-r * 0.5} ${r * 0.3} Q ${-r * 0.1} ${r * 0.52} ${r * 0.34} ${r * 0.26}`}
            fill="none"
            stroke={orange.fill}
            strokeWidth={r * 0.07}
            strokeLinecap={tokens.line.cap}
            opacity={0.7}
          />
          <path
            d={`M ${-r * 0.2} ${-r * 0.42} Q ${r * 0.16} ${-r * 0.58} ${r * 0.46} ${-r * 0.3}`}
            fill="none"
            stroke={orange.fill}
            strokeWidth={r * 0.055}
            strokeLinecap={tokens.line.cap}
            opacity={0.55}
          />
        </>,
      )}
      {rim(r, outlined)}
    </g>
  );
}

/** Craters as fractions of the radius: x, y, size. No two alike. */
const CRATERS = [
  [-0.36, -0.3, 0.2],
  [0.28, -0.46, 0.12],
  [0.42, 0.08, 0.24],
  [-0.12, 0.34, 0.15],
  [-0.56, 0.22, 0.1],
  [0.08, -0.1, 0.09],
  [0.2, 0.58, 0.11],
] as const;

/**
 * The full Moon: a pale ball with craters. `paint="gray"` is the Moon as it looks from
 * space; the default is the warm moon of a night sky.
 */
export function FullMoon({
  uid,
  shadowSide,
  r = 1.1,
  outlined = true,
  paint = 'moon',
}: SkyProps & { paint?: 'moon' | 'gray' }) {
  const dust = palette('moon-dust');
  const fill = paint === 'gray' ? lighten(pick(dust, 2), 0.25) : tokens.background.moon;
  const mark = paint === 'gray' ? pick(dust, 3) : shade(tokens.background.moon, 0.16);
  return (
    <g>
      <circle r={r} fill={fill} />
      {inside(
        uid,
        r,
        <>
          {CRATERS.map(([x, y, s], i) => (
            <g key={i}>
              <ellipse cx={x * r} cy={y * r} rx={s * r} ry={s * r * 0.88} fill={mark} />
              <ellipse
                cx={(x + s * 0.12) * r}
                cy={(y + s * 0.14) * r}
                rx={s * r * 0.78}
                ry={s * r * 0.66}
                fill={mix(mark, fill, 0.45)}
              />
            </g>
          ))}
        </>,
      )}
      <BallShadow uid={uid} r={r} shadowSide={shadowSide} strength={0.2} />
      {rim(r, outlined)}
    </g>
  );
}

/** Land as blobs on a strip twice as wide as the ball, so it can turn for ever. Made up, not a map. */
const LAND = [
  'M -0.9 -0.5 Q -0.6 -0.78 -0.28 -0.6 Q -0.1 -0.42 -0.3 -0.2 Q -0.2 0.04 -0.46 0.14 Q -0.62 0.5 -0.8 0.2 Q -1.02 -0.1 -0.9 -0.5 Z',
  'M 0.18 -0.3 Q 0.5 -0.5 0.74 -0.24 Q 0.9 0.02 0.66 0.16 Q 0.72 0.46 0.46 0.5 Q 0.24 0.3 0.3 0.06 Q 0.06 -0.06 0.18 -0.3 Z',
  'M -0.1 0.42 Q 0.1 0.34 0.16 0.52 Q 0.06 0.7 -0.1 0.62 Z',
  'M 1.14 -0.56 Q 1.5 -0.7 1.7 -0.4 Q 1.62 -0.12 1.34 -0.16 Q 1.2 0.2 1.04 -0.08 Q 0.98 -0.36 1.14 -0.56 Z',
  'M 1.36 0.28 Q 1.62 0.2 1.72 0.44 Q 1.56 0.66 1.36 0.54 Z',
] as const;

/** The Earth from space: blue ocean, green land that turns, white caps and cloud, a thin haze. */
export function Earth({ uid, shadowSide, r = 1.6, t = 0, outlined = true }: SkyProps) {
  const sea = paintOf('ocean');
  const land = paintOf('forest');
  // One whole turn of the strip every 40 seconds: slow enough to read as a planet.
  const turn = (((t / 40) % 1) + 1) % 1;
  const strip = (dx: number, key: string) => (
    <g key={key} transform={`translate(${(dx - turn * 2.6) * r} 0) scale(${r})`}>
      {LAND.map((d, i) => (
        <path key={i} d={d} fill={land.fill} />
      ))}
    </g>
  );
  const cloud = (x: number, y: number, w: number, key: string) => (
    <rect
      key={key}
      x={(x - w / 2) * r}
      y={(y - 0.035) * r}
      width={w * r}
      height={0.07 * r}
      rx={0.035 * r}
      fill={white}
      opacity={0.9}
    />
  );
  const drift = ((t / 26) % 1) * 2.6;
  return (
    <g>
      {/* The air: light, so no outline. */}
      <circle r={r * 1.07} fill={pick(accent('glint'), 0)} opacity={0.28} />
      <circle r={r} fill={sea.fill} />
      {inside(
        uid,
        r,
        <>
          {strip(0, 'a')}
          {strip(2.6, 'b')}
          <ellipse cy={-r * 0.99} rx={r * 0.56} ry={r * 0.17} fill={white} />
          <ellipse cy={r * 0.99} rx={r * 0.5} ry={r * 0.15} fill={white} />
          {[0, 2.6].map((d) => (
            <g key={d} transform={`translate(${(d - drift) * r} 0)`}>
              {cloud(-0.3, -0.36, 0.5, 'c1')}
              {cloud(-0.16, -0.27, 0.3, 'c2')}
              {cloud(0.5, 0.3, 0.44, 'c3')}
              {cloud(1.3, -0.1, 0.56, 'c4')}
              {cloud(1.5, 0.48, 0.3, 'c5')}
            </g>
          ))}
        </>,
      )}
      <BallShadow uid={uid} r={r} shadowSide={shadowSide} />
      {rim(r, outlined)}
    </g>
  );
}

/**
 * Any other planet: a ball in a color of the style, plain, banded like a gas giant, or with
 * a ring round it. The ring passes behind the ball and in front of it.
 */
export function Planet({
  uid,
  shadowSide,
  r = 1.2,
  outlined = true,
  paint = 'orange',
  bands = false,
  ring = null,
}: SkyProps & {
  /** The ball's color: an accent of the style by name. */
  paint?: string;
  /** Bands of weather across it, as on a gas giant. */
  bands?: boolean;
  /** The ring's color by name, or none. */
  ring?: string | null;
}) {
  const k = paintOf(paint);
  const ringK = ring ? paintOf(ring) : null;
  const tilt = -16;
  const half = (front: boolean): ReactNode => {
    if (!ringK) return null;
    const [rx, ry, inner] = [r * 2.05, r * 0.5, 0.68];
    const sweep = front ? 0 : 1;
    // Half of a flat ring: the outer edge one way round and the inner edge back.
    const d = `M ${-rx} 0 A ${rx} ${ry} 0 0 ${sweep} ${rx} 0 L ${rx * inner} 0 A ${rx * inner} ${ry * inner} 0 0 ${1 - sweep} ${-rx * inner} 0 Z`;
    return (
      <g transform={`rotate(${tilt})`}>
        <path
          d={d}
          fill={front ? ringK.fill : ringK.shadow}
          {...(outlined
            ? { stroke: ink, strokeWidth: lineWeights.outline, strokeLinejoin: tokens.line.join }
            : {})}
        />
      </g>
    );
  };
  return (
    <g>
      {half(false)}
      <circle r={r} fill={k.fill} />
      {inside(
        uid,
        r,
        bands ? (
          <g transform={`rotate(${tilt})`}>
            <rect x={-r} y={-r * 0.62} width={2 * r} height={r * 0.2} fill={k.shadow} />
            <rect
              x={-r}
              y={-r * 0.2}
              width={2 * r}
              height={r * 0.13}
              fill={lighten(k.fill, 0.35)}
            />
            <rect x={-r} y={r * 0.12} width={2 * r} height={r * 0.24} fill={k.shadow} />
            <rect x={-r} y={r * 0.58} width={2 * r} height={r * 0.1} fill={lighten(k.fill, 0.35)} />
            <ellipse cx={r * 0.34} cy={r * 0.24} rx={r * 0.2} ry={r * 0.1} fill={k.fill} />
          </g>
        ) : (
          <>
            <ellipse cx={-r * 0.3} cy={-r * 0.24} rx={r * 0.26} ry={r * 0.17} fill={k.shadow} />
            <ellipse cx={r * 0.36} cy={r * 0.3} rx={r * 0.34} ry={r * 0.2} fill={k.shadow} />
            <ellipse cx={r * 0.2} cy={-r * 0.56} rx={r * 0.16} ry={r * 0.09} fill={k.shadow} />
          </>
        ),
      )}
      <BallShadow uid={uid} r={r} shadowSide={shadowSide} />
      {rim(r, outlined)}
      {half(true)}
    </g>
  );
}

/**
 * An asteroid: a lump of rock with a tail of fire streaming behind it. It flies toward the
 * lower left by default; turn it with `heading` (degrees, 0 is to the right, 90 is down).
 * Leave the fire out for a rock drifting in space.
 */
export function Asteroid({
  uid,
  shadowSide,
  r = 0.7,
  t = 0,
  outlined = true,
  heading = 145,
  fire = true,
}: SkyProps & { heading?: number; fire?: boolean }) {
  const rock = paintOf('brown');
  const orange = paintOf('orange');
  const gold = paintOf('gold');
  const lumps = 9;
  const outline = Array.from({ length: lumps }, (_, i) => {
    const a = (360 * i * DEG) / lumps;
    const reach = r * (0.82 + 0.3 * seeded(`asteroid:${i}`));
    return `${reach * Math.cos(a)} ${reach * Math.sin(a)}`;
  });
  const d = `M ${outline.join(' L ')} Z`;
  const off = lightOffset(shadowSide, r * 0.14);
  const flick = (k: number) => 1 + 0.08 * Math.sin(t * 11 + k * 2.1) + 0.05 * Math.sin(t * 23 + k);
  // The tail streams back along -x, away from where it is heading.
  const tail = (length: number, width: number, k: number) => {
    const w = width * r;
    const end = -length * r * flick(k);
    return `M ${r * 1.28} 0 Q ${r * 1.2} ${-w * 1.05} ${r * 0.1} ${-w * 1.12} Q ${end * 0.5} ${-w} ${end} ${0.12 * r * Math.sin(t * 9 + k)} Q ${end * 0.5} ${w} ${r * 0.1} ${w * 1.12} Q ${r * 1.2} ${w * 1.05} ${r * 1.28} 0 Z`;
  };
  return (
    <g transform={`rotate(${heading})`}>
      {fire && (
        <>
          <path
            d={tail(4.6, 1.02, 0)}
            fill={orange.fill}
            {...(outlined
              ? { stroke: ink, strokeWidth: lineWeights.outline, strokeLinejoin: tokens.line.join }
              : {})}
          />
          <path d={tail(3.2, 0.8, 2)} fill={gold.fill} />
        </>
      )}
      <g transform={`rotate(${-heading})`}>
        <defs>
          <clipPath id={`${uid}-rock`}>
            <path d={d} transform={`translate(${off.x} ${off.y})`} />
          </clipPath>
          <clipPath id={`${uid}-rock-in`}>
            <path d={d} />
          </clipPath>
        </defs>
        <path d={d} fill={rock.shadow} />
        <path d={d} fill={rock.fill} clipPath={`url(#${uid}-rock)`} />
        <g clipPath={`url(#${uid}-rock-in)`}>
          <ellipse cx={-r * 0.24} cy={-r * 0.2} rx={r * 0.22} ry={r * 0.18} fill={rock.shadow} />
          <ellipse cx={r * 0.3} cy={r * 0.22} rx={r * 0.16} ry={r * 0.13} fill={rock.shadow} />
          <ellipse cx={r * 0.26} cy={-r * 0.42} rx={r * 0.1} ry={r * 0.08} fill={rock.shadow} />
        </g>
        {outlined && (
          <path
            d={d}
            fill="none"
            stroke={ink}
            strokeWidth={lineWeights.outline}
            strokeLinejoin={tokens.line.join}
          />
        )}
      </g>
    </g>
  );
}

/**
 * A black hole: a ball of nothing with a thin ring of light round its edge and a wide disc of
 * glowing dust that passes behind it and in front. The dust turns.
 */
export function BlackHole({ uid, r = 1.2, t = 0, outlined = true }: SkyProps) {
  const orange = paintOf('orange');
  const gold = paintOf('gold');
  const tilt = -12;
  const [rx, ry] = [r * 2.5, r * 0.6];
  const half = (front: boolean, scale: number, fill: string, edged: boolean): ReactNode => {
    const sweep = front ? 0 : 1;
    const inner = 0.5;
    const d = `M ${-rx * scale} 0 A ${rx * scale} ${ry * scale} 0 0 ${sweep} ${rx * scale} 0 L ${rx * inner} 0 A ${rx * inner} ${ry * inner} 0 0 ${1 - sweep} ${-rx * inner} 0 Z`;
    return (
      <path
        d={d}
        fill={fill}
        {...(edged && outlined
          ? { stroke: ink, strokeWidth: lineWeights.outline, strokeLinejoin: tokens.line.join }
          : {})}
      />
    );
  };
  // Streaks of brighter dust going round, drawn as dashes on the disc.
  const streaks = (front: boolean): ReactNode => (
    <ellipse
      rx={rx * 0.76}
      ry={ry * 0.76}
      fill="none"
      stroke={lighten(gold.fill, 0.5)}
      strokeWidth={r * 0.06}
      strokeLinecap={tokens.line.cap}
      strokeDasharray={`${r * 0.7} ${r * 1.1}`}
      strokeDashoffset={-t * r * 1.6}
      clipPath={`url(#${uid}-${front ? 'front' : 'back'})`}
    />
  );
  return (
    <g>
      {/* The glow is light: no outline. */}
      <circle r={r * 2} fill={orange.fill} opacity={0.12} />
      <g transform={`rotate(${tilt})`}>
        <defs>
          <clipPath id={`${uid}-back`}>
            <rect x={-rx * 1.1} y={-ry * 1.2} width={rx * 2.2} height={ry * 1.2} />
          </clipPath>
          <clipPath id={`${uid}-front`}>
            <rect x={-rx * 1.1} y={0} width={rx * 2.2} height={ry * 1.2} />
          </clipPath>
        </defs>
        {half(false, 1, orange.shadow, true)}
        {half(false, 0.86, orange.fill, false)}
        {streaks(false)}
      </g>
      <circle r={r * 1.1} fill={gold.fill} />
      <circle r={r} fill={ink} />
      <g transform={`rotate(${tilt})`}>
        {half(true, 1, orange.fill, true)}
        {half(true, 0.86, gold.fill, false)}
        {streaks(true)}
      </g>
    </g>
  );
}
