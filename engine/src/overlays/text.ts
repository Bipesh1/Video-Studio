/**
 * Text the viewer reads on screen (Style 9). The font family is named here, free of side
 * effects, so anything can use it; the font file itself is loaded once by Captions.tsx.
 */
export const VIEWER_FONT = 'Fredoka';

/** How wide a letter of the heavy caption font is on average, as a share of its size. */
const LETTER = 0.56;

/**
 * Text for the viewer, checked. Ground rule 14: no em dashes in anything the application
 * writes for viewers. A title with one is a mistake in the script, so it fails loudly here
 * instead of slipping onto the screen.
 */
export function viewerText(text: string): string {
  if (/[—―]/.test(text)) {
    throw new Error(`On-screen text must not contain an em dash: "${text}"`);
  }
  return text.trim();
}

/** A fair guess at how wide a line of text is, px. */
export const textWidth = (text: string, size: number): number => text.length * size * LETTER;

/** The largest size, up to `size`, at which every line fits in `maxWidth`. */
export function fitSize(lines: readonly string[], size: number, maxWidth: number): number {
  const longest = Math.max(1, ...lines.map((l) => l.length));
  return Math.min(size, maxWidth / (longest * LETTER));
}

/** Breaks a title into lines of about `perLine` letters, never splitting a word. */
export function wrapWords(text: string, perLine: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > perLine) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
