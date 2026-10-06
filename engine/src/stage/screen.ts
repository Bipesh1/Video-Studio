import { DEFAULT_PAGE_OPTIONS } from '../overlays/captionPages';
import type { PageOptions } from '../overlays/captionPages';
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
