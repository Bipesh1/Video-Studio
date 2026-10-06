import { tokens } from '../tokens';
import type { CaptionPage } from './captionPages';
import { textBasis, textWidth } from './text';

/**
 * Where captions sit and how big they are, as plain numbers with no drawing and no font
 * loading, so the picture (Captions.tsx) and the self-check (stage/measure.ts) share them.
 */

/** Caption font size in px for a 1080 wide tall frame; it scales with the frame (textBasis). */
export const CAPTION_SIZE = 78;
/** The share of a wide frame's height kept for captions, at the bottom. */
export const WIDE_SAFE_BOTTOM = 0.2;
/** The caption outline, as a share of the font size. */
export const CAPTION_STROKE = 0.2;

export type Box = { x: number; y: number; width: number; height: number };

/** The sizes of a caption block of so many lines in a frame. */
export function captionLayout(lines: number, width: number, height: number, size = CAPTION_SIZE) {
  const fontSize = (size * textBasis(width, height)) / 1080;
  const lineHeight = fontSize * 1.18;
  // A wide frame is short, so its captions keep to a thinner band along the bottom.
  const safeShare = width > height ? WIDE_SAFE_BOTTOM : tokens.captions.safeBottomPct916;
  const safeTop = height * (1 - safeShare);
  const blockHeight = lineHeight * lines;
  const firstBaseline = safeTop + (height - safeTop - blockHeight) * 0.42 + fontSize;
  return { fontSize, lineHeight, safeTop, blockHeight, firstBaseline };
}

/** The words of one caption line as they are shown. */
export const lineText = (line: CaptionPage['lines'][number]): string =>
  line.map((w) => w.text.trim()).join(' ');

/**
 * The box a page of captions takes on screen, outline included. The width is a fair guess
 * from the number of letters (text.ts), since only a browser can measure the real font.
 */
export function captionBox(
  page: CaptionPage,
  width: number,
  height: number,
  size = CAPTION_SIZE,
): Box {
  const { fontSize, lineHeight, firstBaseline } = captionLayout(
    page.lines.length,
    width,
    height,
    size,
  );
  const edge = (fontSize * CAPTION_STROKE) / 2;
  const widest = Math.max(0, ...page.lines.map((l) => textWidth(lineText(l), fontSize)));
  const top = firstBaseline - fontSize * 0.8 - edge;
  const bottom = firstBaseline + (page.lines.length - 1) * lineHeight + fontSize * 0.24 + edge;
  return {
    x: width / 2 - widest / 2 - edge,
    y: top,
    width: widest + 2 * edge,
    height: bottom - top,
  };
}
