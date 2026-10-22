import type { Caption } from '@remotion/captions';
import type { WordTiming } from '@studio/shared';

/** A caption word: the @remotion/captions Caption shape plus emphasis and speaker line. */
export type CaptionWord = Caption & { emphasis: boolean; lineId: string };

export type CaptionPage = {
  startMs: number;
  endMs: number;
  /** At most two lines (Style 9 and Part 2, section 11). */
  lines: CaptionWord[][];
};

export type PageOptions = {
  /** Characters per line, so a line fits the phone width at caption size. */
  maxLineChars: number;
  maxLines: number;
  /** A silence longer than this starts a new page. */
  maxGapMs: number;
  /** How long a page stays after its last word when nothing follows. */
  holdMs: number;
};

export const DEFAULT_PAGE_OPTIONS: PageOptions = {
  maxLineChars: 18,
  maxLines: 2,
  maxGapMs: 450,
  holdMs: 500,
};

/** Voice track words to @remotion/captions captions. Words carry a leading space, as Caption expects. */
export function toCaptions(words: readonly WordTiming[]): CaptionWord[] {
  return words.map((w, i) => ({
    text: i === 0 ? w.text : ` ${w.text}`,
    startMs: w.startMs,
    endMs: w.endMs,
    timestampMs: (w.startMs + w.endMs) / 2,
    confidence: 1,
    emphasis: w.emphasis,
    lineId: w.lineId,
  }));
}

const lineChars = (line: readonly CaptionWord[]) =>
  line.reduce((n, w, i) => n + w.text.trim().length + (i > 0 ? 1 : 0), 0);

/** A caption of one word spoken in less than this is a flash on the screen, in ms. */
const FLASH_MS = 600;

const endsSentence = (w: CaptionWord) => /[.!?]["')]?$/.test(w.text.trim());

/**
 * Split captions into pages of at most maxLines lines. A page breaks at a speaker change,
 * after a sentence (unless the sentence is one quick word), at a pause, or when the next word
 * would not fit.
 */
export function buildPages(
  captions: readonly CaptionWord[],
  opts: PageOptions = DEFAULT_PAGE_OPTIONS,
): CaptionPage[] {
  const pages: CaptionPage[] = [];
  let lines: CaptionWord[][] = [[]];
  const flush = () => {
    const words = lines.flat();
    const first = words[0];
    const last = words[words.length - 1];
    if (first && last) pages.push({ startMs: first.startMs, endMs: last.endMs, lines });
    lines = [[]];
  };

  captions.forEach((w, i) => {
    const prev = captions[i - 1];
    const current = lines[lines.length - 1] ?? [];
    if (prev) {
      const newSpeaker = prev.lineId !== w.lineId;
      const pause = w.startMs - prev.endMs > opts.maxGapMs;
      // One word and a full stop ("Uh.", "Right.") is gone before it can be read: it stays with
      // what the same person says next.
      const first = lines[0]?.[0];
      const flash =
        first !== undefined && lines.flat().length === 1 && prev.endMs - first.startMs < FLASH_MS;
      if (newSpeaker || pause || (endsSentence(prev) && !flash)) {
        flush();
      } else if (lineChars([...current, w]) > opts.maxLineChars) {
        if (lines.length >= opts.maxLines) flush();
        else lines.push([]);
      }
    }
    const target = lines[lines.length - 1];
    if (target) target.push(w);
  });
  flush();

  // A page stays up until the next one starts, or holdMs after its last word.
  return pages.map((p, i) => {
    const next = pages[i + 1];
    const end = next ? Math.min(next.startMs, p.endMs + opts.holdMs) : p.endMs + opts.holdMs;
    return { ...p, endMs: Math.max(end, p.endMs) };
  });
}

/** The page on screen at a time, if any. */
export const pageAt = (pages: readonly CaptionPage[], ms: number): CaptionPage | undefined =>
  pages.find((p) => ms >= p.startMs && ms < p.endMs);
