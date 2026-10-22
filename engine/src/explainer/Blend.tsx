import fineTokens from '../../../styles/fine-print/tokens.json';
import { useToned } from '../rig/tone';

/**
 * Look C of the What's the Catch? look test, picked by Biku on 2026-10-21: a stick-figure
 * character blended into the channel's worlds. Its black lines are toned to the channel's navy,
 * its colours warmed a little, and the scene's light catches one edge. Two filters: `<id>-blend`
 * on the character, `<id>-rim` on a copy drawn under it.
 */

const J = fineTokens.journey;
const NAVY = fineTokens.line.color;

/** A token colour as three numbers from 0 to 1, for a filter. */
const channels = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [number, number, number];
};

/** The blended look (C): navy lines, warm colours, and a warm light on one edge. */
export function BlendDefs({
  id,
  light = J.sunFlare,
  u,
  dx = 6,
  dy = 6,
}: {
  id: string;
  light?: string;
  /** A pixel of a 1080 picture. */
  u: number;
  /** Where the light comes from: the rim's offset, in pixels of a 1080 picture. */
  dx?: number;
  dy?: number;
}) {
  const [nr, ng, nb] = channels(NAVY);
  return (
    <defs>
      <filter
        id={`${id}-blend`}
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
        colorInterpolationFilters="sRGB"
      >
        <feComponentTransfer>
          <feFuncR type="table" tableValues={`${nr} 0.55 1`} />
          <feFuncG type="table" tableValues={`${ng} 0.5 0.97`} />
          <feFuncB type="table" tableValues={`${nb} 0.45 0.9`} />
        </feComponentTransfer>
      </filter>
      <filter
        id={`${id}-rim`}
        x="-30%"
        y="-30%"
        width="160%"
        height="160%"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodColor={light} result="c" />
        <feComposite in="c" in2="SourceAlpha" operator="in" result="s" />
        <feOffset in="s" dx={dx * u} dy={dy * u} result="o" />
        <feGaussianBlur in="o" stdDeviation={4 * u} />
      </filter>
    </defs>
  );
}

/** Anything drawn in the blended look: its rim light under it, then itself toned. */
export function Blended({
  id,
  u,
  light,
  dx,
  dy,
  rim = 0.85,
  children,
}: {
  id: string;
  u: number;
  light?: string;
  dx?: number;
  dy?: number;
  rim?: number;
  children: React.ReactNode;
}) {
  // In the toned look there are no outlines, and a full glow round the edge would read as one.
  const glow = useToned() ? rim * 0.5 : rim;
  return (
    <g>
      <BlendDefs id={id} u={u} light={light} dx={dx} dy={dy} />
      {glow > 0 && (
        <g filter={`url(#${id}-rim)`} opacity={glow}>
          {children}
        </g>
      )}
      <g filter={`url(#${id}-blend)`}>{children}</g>
    </g>
  );
}
