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
/**
 * The share of a tall frame's height, at the bottom, that a phone app draws its own things
 * over: the channel's picture and handle, the title, the buttons (Biku, 2026-10-11: "the
 * captions get hidden beside the logos and the handle in youtube"). Captions end above it.
 * YouTube publishes no figure; guides put what Shorts covers at 300 to 380 px of 1920.
 */
export const TALL_APP_BOTTOM = 0.235;
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
  // In a tall frame the last line ends just above what the app covers, so a block of two
  // lines grows upward from there. In a wide frame nothing is drawn over the picture.
  const firstBaseline =
    width > height
      ? safeTop + (height - safeTop - blockHeight) * 0.42 + fontSize
      : height * (1 - TALL_APP_BOTTOM) - blockHeight + fontSize * 0.76;
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
