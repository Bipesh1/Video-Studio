import type { Storyboard, VoiceTrack } from '@studio/shared';
import { DEFAULT_PAGE_OPTIONS, buildPages, toCaptions } from '../overlays/captionPages';
import type { CaptionPage, PageOptions } from '../overlays/captionPages';
import type { Size } from './layout';

/**
 * What a storyboard video lays over its pictures and when: the caption pages and the title.
 * Plain numbers with no drawing, shared by the video (StoryboardVideo.tsx) and the self-check
 * (measure.ts).
 */

/** A wide frame shows one longer line at a time; a tall one takes two short lines. */
export const captionOptions = (size: Size): PageOptions =>
  size.width > size.height
    ? { ...DEFAULT_PAGE_OPTIONS, maxLineChars: 34, maxLines: 1 }
    : DEFAULT_PAGE_OPTIONS;

/** How long the title stays, in seconds, and how long it takes to go. */
export const TITLE_SECONDS = 2.6;
export const TITLE_FADE = 0.25;

/** Where the middle of the title sits, as a share of the frame height. */
export const titleY = (size: Size): number => (size.width > size.height ? 0.13 : 0.17);

/**
 * The caption pages of a storyboard video. A page stays up a moment after its last word, but
 * never past the last picture of its own line: a caption left over a fade or over the next
 * shot reads as belonging to it.
 */
export function captionPagesFor(
  storyboard: Storyboard,
  track: VoiceTrack | null,
  size: Size,
): CaptionPage[] {
  if (!track) return [];
  const lastPicture = new Map<string, number>();
  for (const scene of storyboard.scenes) {
    for (const shot of scene.shots) {
      if (shot.endMs !== undefined) lastPicture.set(shot.line, shot.endMs);
    }
  }
  return buildPages(toCaptions(track.words), captionOptions(size)).map((page) => {
    const line = page.lines[0]?.[0]?.lineId;
    const until = line === undefined ? undefined : lastPicture.get(line);
    const spoken = page.lines.flat().at(-1)?.endMs ?? page.endMs;
    return until === undefined
      ? page
      : { ...page, endMs: Math.max(spoken, Math.min(page.endMs, until)) };
  });
}
