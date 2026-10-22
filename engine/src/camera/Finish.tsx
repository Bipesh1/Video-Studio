import { useId, type ReactNode } from 'react';
import { ink } from '../tokens';

/**
 * Line boil: every line of the picture trembles a little, as lines drawn by hand do from one
 * drawing to the next. The picture is pushed about by a soft noise that changes every
 * BOIL_HOLD frames, cycling through BOIL_DRAWINGS drawings, so it reads as a few hand-made
 * drawings played in turn rather than as shaking. Set by the video's `finish.boil`.
 */
const BOIL_HOLD = 3;
const BOIL_DRAWINGS = 3;
/** How far the noise pushes at full strength, and how wide its waves are, for a picture 1080 wide. */
const BOIL_SCALE = 10;
const BOIL_WAVE = 0.015;

export function Boil({
  width,
  height,
  frame,
  amount,
  children,
}: {
  width: number;
  height: number;
  frame: number;
  /** 0 to 1. */
  amount: number;
  children: ReactNode;
}) {
  const id = `boil${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  if (amount <= 0) return <>{children}</>;
  const unit = Math.min(width, height) / 1080;
  const scale = BOIL_SCALE * amount * unit;
  const seed = 1 + (Math.floor(frame / BOIL_HOLD) % BOIL_DRAWINGS);
  // A hair larger, about the middle, so the edges of the frame never pull in the dark beyond.
  const grow = 1 + scale / Math.min(width, height);
  return (
    <>
      <defs>
        <filter
          id={id}
          filterUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={width}
          height={height}
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={BOIL_WAVE / unit}
            numOctaves={1}
            seed={seed}
            result="noise"
          />
          {/* Smoothed, so a line bends in soft waves instead of breaking into little steps. */}
          <feGaussianBlur in="noise" stdDeviation={6 * unit} result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
          {/* The push moves whole pixels, which leaves tiny steps in a line; a breath of blur closes them. */}
          <feGaussianBlur stdDeviation={0.6 * unit} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <g
          transform={`translate(${(width * (1 - grow)) / 2} ${(height * (1 - grow)) / 2}) scale(${grow})`}
        >
          {children}
        </g>
      </g>
    </>
  );
}

/**
 * What lies over a finished picture (step 5 of the plan to make the animation better in every
 * kind of video): a fine grain that moves, as film and paper do, and edges a little darker, so
 * the picture stops looking machine-clean. Both are set by the video's `finish`; at 0 nothing
 * is drawn.
 */

/** How strong the grain is at its strongest, and how dark the edges get. */
const GRAIN_ALPHA = 0.16;
const VIGNETTE_ALPHA = 0.55;

export function Finish({
  width,
  height,
  frame,
  grain,
  vignette,
}: {
  width: number;
  height: number;
  frame: number;
  /** 0 to 1. */
  grain: number;
  /** 0 to 1. */
  vignette: number;
}) {
  const id = `finish${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  if (grain <= 0 && vignette <= 0) return null;
  // The grain changes every second frame, like the rest of a hand-made picture.
  const seed = 1 + (Math.floor(frame / 2) % 12);
  return (
    <g pointerEvents="none">
      <defs>
        {grain > 0 && (
          <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 ${(GRAIN_ALPHA * grain * 2).toFixed(3)} -${(GRAIN_ALPHA * grain).toFixed(3)}`}
            />
          </filter>
        )}
        {vignette > 0 && (
          <radialGradient id={`${id}-edge`} cx="50%" cy="48%" r="72%">
            <stop offset="0.5" stopColor={ink} stopOpacity={0} />
            <stop offset="1" stopColor={ink} stopOpacity={VIGNETTE_ALPHA * vignette} />
          </radialGradient>
        )}
      </defs>
      {grain > 0 && <rect width={width} height={height} filter={`url(#${id}-grain)`} />}
      {vignette > 0 && <rect width={width} height={height} fill={`url(#${id}-edge)`} />}
    </g>
  );
}
