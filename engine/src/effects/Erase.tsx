import { useId } from 'react';
import type { ReactNode } from 'react';
import { clamp } from '../rig/math';
import { graphite, paper } from './Pencil';
import { MASK_HIDE, MASK_SHOW, mix } from '../tokens';

/**
 * Being rubbed out (the short film "Erased"): part of whatever is drawn inside fades to a faint
 * grey trace, as if an eraser had gone over it, and the crumbs of the rubbing fall away.
 */

/** How much of a rubbed-out line is still there to see. */
const TRACE = 0.5;
/** The pencil grey a rubbed-out line is left in, as the three parts of a colour from 0 to 1. */
const LINE = [1, 3, 5].map((i) => parseInt(graphite.slice(i, i + 2), 16) / 255);

/**
 * Whatever is inside, with a round patch of it rubbed out. `at` is the middle of the patch and
 * `radius` its size, in the picture's own units; `amount` 0 to 1 is how far the rubbing has
 * gone. The edge of the patch is soft, and what is rubbed leaves a pale colourless trace.
 */
export function Erased({
  at,
  radius,
  amount,
  width,
  height,
  children,
}: {
  at: { x: number; y: number };
  radius: number;
  amount: number;
  width: number;
  height: number;
  children: ReactNode;
}) {
  const id = `erase${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const a = clamp(amount, 0, 1);
  if (a <= 0 || radius <= 0) return <>{children}</>;
  const frame = { maskUnits: 'userSpaceOnUse' as const, x: 0, y: 0, width, height };
  const patch = (inside: string, outside: string) => (
    <radialGradient
      id={`${id}-${inside}`}
      gradientUnits="userSpaceOnUse"
      cx={at.x}
      cy={at.y}
      r={radius}
    >
      <stop offset="0" stopColor={inside} stopOpacity={a} />
      <stop offset="0.62" stopColor={inside} stopOpacity={a} />
      <stop offset="1" stopColor={outside} stopOpacity={0} />
    </radialGradient>
  );
  return (
    <g>
      <defs>
        {patch(MASK_HIDE, MASK_HIDE)}
        {patch(MASK_SHOW, MASK_SHOW)}
        {/* Everything but the patch. */}
        <mask id={`${id}-keep`} {...frame}>
          <rect width={width} height={height} fill={MASK_SHOW} />
          <circle cx={at.x} cy={at.y} r={radius} fill={`url(#${id}-${MASK_HIDE})`} />
        </mask>
        {/* Only the patch. */}
        <mask id={`${id}-gone`} {...frame}>
          <rect width={width} height={height} fill={MASK_HIDE} />
          <circle cx={at.x} cy={at.y} r={radius} fill={`url(#${id}-${MASK_SHOW})`} />
        </mask>
        {/* What is rubbed out leaves its lines and loses its colour: the dark of a picture
            becomes pencil grey and the light of it becomes nothing. */}
        <filter id={`${id}-pale`} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={`0 0 0 0 ${LINE[0]}  0 0 0 0 ${LINE[1]}  0 0 0 0 ${LINE[2]}  -1.06 -3.58 -0.36 0 1`}
            result="lines"
          />
          <feComposite in="lines" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
      <g mask={`url(#${id}-keep)`}>{children}</g>
      <g mask={`url(#${id}-gone)`} opacity={TRACE} filter={`url(#${id}-pale)`}>
        {children}
      </g>
    </g>
  );
}

/** A number between 0 and 1 that is always the same for the same two numbers. */
const scatter = (seed: number, n: number): number => {
  const x = Math.sin(seed * 91.7 + n * 47.3) * 43758.5453;
  return x - Math.floor(x);
};

export type Crumb = {
  /** When it comes loose, in seconds. */
  at: number;
  /** Where it comes loose. */
  from: { x: number; y: number };
};

/**
 * Eraser crumbs: small grey specks that come loose, drift a little and fall to the ground,
 * where they stay. `t` is the time now, in seconds; `groundY` is where they land.
 */
export function Crumbs({
  crumbs,
  t,
  groundY,
  size = 7,
  seed = 1,
}: {
  crumbs: readonly Crumb[];
  t: number;
  groundY: number;
  size?: number;
  seed?: number;
}) {
  const tone = mix(graphite, paper, 0.25);
  return (
    <g>
      {crumbs.map((c, i) => {
        const age = t - c.at;
        if (age < 0) return null;
        const k = scatter(seed, i);
        const k2 = scatter(seed + 3, i);
        // It falls slowly at first, like something light, and drifts to one side as it goes.
        const fall = 120 * age * age + 50 * age;
        const y = Math.min(groundY - size * 0.3, c.from.y + fall);
        const landed = y >= groundY - size * 0.3 - 0.01;
        const drift = (k - 0.5) * 70 * Math.min(age, 1.2) + 6 * Math.sin(age * 5 + k * 6);
        const w = size * (0.7 + 0.8 * k2);
        const turn = landed ? k * 40 : age * (200 + 300 * k);
        const x = c.from.x + drift;
        return (
          <rect
            key={i}
            x={x - w / 2}
            y={y - w * 0.3}
            width={w}
            height={w * 0.6}
            rx={w * 0.28}
            fill={tone}
            opacity={Math.min(1, age * 6)}
            transform={`rotate(${turn} ${x} ${y})`}
          />
        );
      })}
    </g>
  );
}
