import { clamp, easeOutBack } from '../rig/math';
import { ink, palette, pick, tokens, white } from '../tokens';
import { WIDE_SAFE_BOTTOM } from './captionLayout';
import type { Box } from './captionLayout';
import { VIEWER_FONT, textBasis, textWidth, viewerText } from './text';
import { TitleCard } from './Titles';

/**
 * What a page puts on its videos (Phase 4F): a small mark in a corner of every frame, and a
 * card after the last shot. Both come from the brand file; with none set, nothing is drawn.
 * Like titles, they are text in the caption font with the line art's outline (Style 9).
 */

const font = `${VIEWER_FONT}, sans-serif`;

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type Mark = { text: string; corner: Corner; opacity: number };

/** Where a page's mark sits and how big it is, before anything is drawn. */
export function markLayout(mark: Pick<Mark, 'text' | 'corner'>, width: number, height: number) {
  const text = viewerText(mark.text);
  const basis = textBasis(width, height);
  const size = basis * 0.036;
  const textW = textWidth(text, size);
  const margin = basis * 0.04;
  const left = mark.corner.endsWith('left');
  // A bottom corner sits just above the caption band, never in it.
  const safeShare = width > height ? WIDE_SAFE_BOTTOM : tokens.captions.safeBottomPct916;
  const top = mark.corner.startsWith('top')
    ? margin
    : height * (1 - safeShare) - margin - size * 1.2;
  const x = left ? margin : width - margin - textW;
  return { text, size, x, baseline: top + size, left };
}

/** The box a page's mark takes on screen. */
export function markBox(mark: Pick<Mark, 'text' | 'corner'>, width: number, height: number): Box {
  const { text, size, x, baseline } = markLayout(mark, width, height);
  return { x, y: baseline - size, width: textWidth(text, size), height: size * 1.2 };
}

/** The page's mark: its name, small and see-through, in one corner of every frame. */
export function Watermark({ mark, width, height }: { mark: Mark; width: number; height: number }) {
  const { text, size, x, baseline } = markLayout(mark, width, height);
  return (
    <text
      x={x}
      y={baseline}
      fontFamily={font}
      fontWeight={600}
      fontSize={size}
      fill={white}
      stroke={ink}
      strokeWidth={size * 0.16}
      strokeLinejoin={tokens.line.join}
      paintOrder="stroke"
      opacity={mark.opacity}
    >
      {text}
    </text>
  );
}

/** Frames the closing card takes to pop in. */
export const CLOSING_POP_FRAMES = 8;

/**
 * The closing card: the page's line on a ribbon over a quiet flat field, with an optional
 * smaller line under it. It pops in and holds still.
 */
export function ClosingCard({
  text,
  subtext,
  width,
  height,
  frame,
  paint = 'crimson',
}: {
  text: string;
  subtext?: string;
  width: number;
  height: number;
  /** Frames since the card began. Left out, it is simply there. */
  frame?: number;
  paint?: string;
}) {
  const field = palette('storm-slate');
  const basis = textBasis(width, height);
  const rise = frame === undefined ? 1 : easeOutBack(clamp(frame / CLOSING_POP_FRAMES, 0, 1), 1.4);
  return (
    <g>
      <rect width={width} height={height} fill={pick(field, 1)} />
      {/* A lighter band behind the ribbon, so the card is not one flat slab. */}
      <rect y={height * 0.3} width={width} height={height * 0.34} fill={pick(field, 2)} />
      <g transform={`translate(0 ${(1 - rise) * basis * 0.04})`}>
        <TitleCard
          title={text}
          {...(subtext ? { subtitle: subtext } : {})}
          width={width}
          height={height}
          y={0.45}
          paint={paint}
          {...(frame === undefined ? {} : { frame })}
        />
      </g>
    </g>
  );
}
