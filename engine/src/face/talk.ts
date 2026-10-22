import { tokens } from '../tokens';

/**
 * One spoken word's timing, as the voice stage provides it. With the word's text the mouth
 * forms the word; without it the mouth just opens and closes in time.
 */
export type WordTiming = { startMs: number; endMs: number; text?: string; sounds?: string };

export type MouthShape = 'closed' | 'half' | 'open' | 'wide' | 'round';

/** The talking shapes, in the order tokens list them (Style 8). */
export const MOUTH_SHAPES = tokens.motion.mouthShapes as readonly string[];

/** What a talking shape does to the mouth the expression already has. */
export type MouthForm = {
  /** How far the mouth opens, 0 to 1. */
  open: number;
  /** Its width: below 1 narrows the expression's mouth, above 1 widens it. */
  width: number;
  /** A small round mouth, as on "oo", instead of the usual open shape. */
  round: boolean;
  /** How much of the opening the top teeth fill, 0 to 1. They show on "ee". */
  teeth: number;
  /**
   * True while the line is being spoken, lips together or not. A face whose own mouth is open
   * (shouting, laughing, wailing) needs this to know it should move with the words.
   */
  speaking?: boolean;
};

/**
 * The five talking shapes (guide v8): lips together for m, b and p; a little open for most
 * consonants; wide open for "ah"; wide with teeth for "ee"; small and round for "oo".
 */
export const MOUTH_FORMS: Record<MouthShape, MouthForm> = {
  closed: { open: 0, width: 1, round: false, teeth: 0 },
  half: { open: 0.45, width: 1, round: false, teeth: 0 },
  open: { open: 1, width: 1.2, round: false, teeth: 0 },
  wide: { open: 0.46, width: 1.5, round: false, teeth: 0.5 },
  round: { open: 0.8, width: 0.6, round: true, teeth: 0 },
};

/** Two frames per shape at the least, so the mouth never flickers. */
const STEP_FRAMES = 2;
/** The plain open and close used for a word whose text is not known. */
const PATTERN: readonly MouthShape[] = ['half', 'open', 'open', 'half', 'closed'];
/** Between words closer together than this the mouth stays a little open instead of shutting. */
const SHORT_GAP_MS = 120;
/** A vowel is held about twice as long as a consonant. */
const VOWEL_WEIGHT = 2;

const LETTER_SHAPES: Record<string, MouthShape> = {
  a: 'open',
  e: 'wide',
  i: 'wide',
  y: 'wide',
  o: 'round',
  u: 'round',
  w: 'round',
  q: 'round',
  m: 'closed',
  b: 'closed',
  p: 'closed',
};

const isVowel = (s: MouthShape) => s === 'open' || s === 'wide' || s === 'round';

/**
 * The mouth shapes of a word, in order, read from its spelling. English spelling is only a
 * rough guide to sound, and that is enough: what the eye checks is that the lips meet on m, b
 * and p, round on "oo" and open on the vowels.
 */
export function shapesOfWord(text: string): MouthShape[] {
  const letters = text
    .normalize('NFD')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/ph/g, 'f');
  // A final e is silent when the word has another vowel ("gave", "tale"), not in "the" or "me".
  const silentE =
    letters.length > 2 && letters.endsWith('e') && /[aeiouy]/.test(letters.slice(0, -1));
  const spoken = silentE ? letters.slice(0, -1) : letters;
  const shapes: MouthShape[] = [];
  for (const letter of spoken) {
    const shape = LETTER_SHAPES[letter] ?? 'half';
    if (shapes[shapes.length - 1] !== shape) shapes.push(shape);
  }
  return shapes;
}

/**
 * The speech sounds Kokoro writes for a word (misaki's phoneme letters), as mouth shapes. Lips
 * meet on m, b and p; round on oo, oh, ow, w and r; spread on ee, ih, ay, eh; open on the
 * other vowels. Stress marks and length marks are not sounds.
 */
const SOUND_SHAPES: Record<string, MouthShape> = {
  m: 'closed',
  b: 'closed',
  p: 'closed',
  u: 'round',
  ʊ: 'round',
  O: 'round',
  W: 'round',
  w: 'round',
  ɔ: 'round',
  o: 'round',
  ɹ: 'round',
  i: 'wide',
  ɪ: 'wide',
  A: 'wide',
  ɛ: 'wide',
  e: 'wide',
  j: 'wide',
  æ: 'open',
  ɑ: 'open',
  ʌ: 'open',
  ə: 'open',
  ᵊ: 'half',
  a: 'open',
  I: 'open',
  Y: 'open',
  ɜ: 'open',
  ɐ: 'open',
};

/** The mouth shapes of a word from the sounds the voice made for it, in order. */
export function shapesOfSounds(sounds: string): MouthShape[] {
  const shapes: MouthShape[] = [];
  for (const sound of sounds.replace(/[ˈˌː.,?!;:'"\s]/g, '')) {
    const shape = SOUND_SHAPES[sound] ?? 'half';
    if (shapes[shapes.length - 1] !== shape) shapes.push(shape);
  }
  return shapes;
}

/** Fewer shapes for a short word: the plain consonants go first, from the end of the word. */
function fit(shapes: readonly MouthShape[], slots: number): MouthShape[] {
  const kept = [...shapes];
  while (kept.length > slots) {
    const i = kept.lastIndexOf('half');
    if (i < 0) break;
    kept.splice(i, 1);
  }
  if (kept.length <= slots) return kept;
  return Array.from(
    { length: slots },
    (_, k) => kept[Math.floor((k * kept.length) / slots)] ?? 'half',
  );
}

/**
 * The talking mouth shape at a frame. While a word is spoken the mouth goes through the shapes
 * of that word, spread over the time the word takes. Between words it closes, except in the
 * short gaps inside a phrase, where it stays a little open.
 */
export function mouthShapeAt(frame: number, fps: number, words: readonly WordTiming[]): MouthShape {
  const ms = (frame / fps) * 1000;
  const word = words.find((w) => ms >= w.startMs && ms < w.endMs);
  if (!word) {
    const before = words.filter((w) => w.endMs <= ms).pop();
    const after = words.find((w) => w.startMs > ms);
    return before && after && after.startMs - before.endMs < SHORT_GAP_MS ? 'half' : 'closed';
  }
  const startFrame = Math.floor((word.startMs / 1000) * fps);
  const step = Math.floor((frame - startFrame) / STEP_FRAMES);
  // What the voice actually said when it says; otherwise a reading of the spelling.
  const spelled = word.sounds
    ? shapesOfSounds(word.sounds)
    : word.text
      ? shapesOfWord(word.text)
      : [];
  if (spelled.length === 0) return PATTERN[step % PATTERN.length] ?? 'closed';

  const frames = Math.max(1, Math.round(((word.endMs - word.startMs) / 1000) * fps));
  const slots = Math.max(1, Math.floor(frames / STEP_FRAMES));
  const shapes = fit(spelled, slots);
  const weights = shapes.map((s) => (isVowel(s) ? VOWEL_WEIGHT : 1));
  const total = weights.reduce((a, b) => a + b, 0);
  // How far through the word this step is, then which shape holds that part of the word.
  let left = ((Math.min(step, slots - 1) + 0.5) / slots) * total;
  for (let i = 0; i < shapes.length; i++) {
    left -= weights[i] ?? 1;
    if (left < 0) return shapes[i] ?? 'closed';
  }
  return shapes[shapes.length - 1] ?? 'closed';
}

/** What to give a Character's `talk`: the mouth form at a frame for one voice line's words. */
export function talkAt(frame: number, fps: number, words: readonly WordTiming[]): MouthForm {
  const form = MOUTH_FORMS[mouthShapeAt(frame, fps, words)];
  const first = words[0];
  const last = words[words.length - 1];
  const ms = (frame / fps) * 1000;
  const speaking =
    first !== undefined && last !== undefined && ms >= first.startMs - 40 && ms <= last.endMs + 60;
  return speaking ? { ...form, speaking: true } : form;
}
