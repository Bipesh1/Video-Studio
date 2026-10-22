import { useId } from 'react';
import { clamp } from '../rig/math';
import { accent, ink, lighten, mix } from '../tokens';

/**
 * A world drawn in pencil on a sheet of paper: lines that draw themselves on, and the page they
 * are drawn on. Made for the short films (Biku's script "Erased", 2026-10-14), where a hill, a
 * sun and a missing eye are drawn while we watch.
 */

/** The page, and the grey of a pencil line on it. */
export const paper = lighten(accent('cream')[0] ?? ink, 0.45);
export const graphite = mix(ink, paper, 0.3);

/**
 * A line that draws itself: `progress` runs from 0 (nothing yet) to 1 (all of it), along the
 * path from its first point. Round ends, like a soft pencil.
 */
export function PencilLine({
  d,
  progress,
  weight = 5,
  tone = graphite,
}: {
  d: string;
  progress: number;
  weight?: number;
  tone?: string;
}) {
  const p = clamp(progress, 0, 1);
  if (p <= 0) return null;
  return (
    <path
      d={d}
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={1 - p}
      fill="none"
      stroke={tone}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** How far a hand-drawn circle strays from a true one at an angle: a little, and smoothly. */
export const wobble = (angle: number, amount = 0.04): number =>
  1 + amount * Math.sin(3 * angle + 0.7);

/**
 * A circle as a hand draws it, from the top and round: not quite round, and its end runs a
 * little past its start. `progress` 0 to 1 is how much of it is drawn; `flip` draws it the
 * other way round.
 */
export function circlePath(
  cx: number,
  cy: number,
  r: number,
  progress = 1,
  flip = false,
  over = 1.05,
): string {
  const turns = clamp(progress, 0, 1) * over;
  const steps = Math.max(2, Math.ceil(72 * turns));
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * turns * i) / steps;
    const rr = r * wobble(a);
    return `${cx + (flip ? -1 : 1) * rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`;
  });
  return `M ${points.join(' L ')}`;
}

/** The sheet of paper everything is drawn on: its colour, a fine grain, and darker edges. */
export function Paper({ width, height }: { width: number; height: number }) {
  const id = `paper${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const edge = mix(accent('tan').at(-1) ?? ink, ink, 0.2);
  return (
    <g>
      <defs>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.25  0 0 0 0 0.22  0 0 0 0 0.18  0 0 0 0.11 0"
          />
        </filter>
        <radialGradient id={`${id}-edge`} cx="50%" cy="46%" r="75%">
          <stop offset="0.55" stopColor={edge} stopOpacity={0} />
          <stop offset="1" stopColor={edge} stopOpacity={0.32} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill={paper} />
      <rect width={width} height={height} filter={`url(#${id}-grain)`} />
      <rect width={width} height={height} fill={`url(#${id}-edge)`} />
    </g>
  );
}
