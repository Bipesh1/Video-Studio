import { z } from 'zod';

/**
 * Contracts between the script, the voice worker (Python) and the engine (Part 2, section 3).
 * A stage fails fast with a plain-language error when its input does not match.
 */

const kokoroVoiceSchema = z
  .string()
  .regex(/^[a-z]{2}_[a-z]+$/, 'expected a Kokoro voice id like am_michael');

/** The words of a line and nothing else: lower case, no marks, no [mood tags] for the voice. */
export function bareWords(text: string): string[] {
  return text
    .replace(/\[[^\]]*\]/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

/** True when `say` reads the very words of `text`: only commas, dots and the like differ. */
export function sameWords(text: string, say: string): boolean {
  return bareWords(text).join(' ') === bareWords(say).join(' ');
}

export const SAY_MESSAGE =
  'what the voice says must be the same words as the line: only commas and "..." may differ';

/**
 * How far the end of a question is lifted, against the measured rise of an ordinary one
 * (`audio/src/studio_audio/intonation.py`). Kokoro says a question with the falling pitch of a
 * statement; Biku picked the third of three by ear on 2026-10-13 ("question 3 is good").
 */
export const QUESTION_LIFT = 1.5;

/** One line to speak. Words wrapped in *asterisks* are emphasized in captions (Style 9). */
export const scriptLineSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'line ids use lowercase letters, digits and dashes'),
    /** "narrator" or a character id. The speaking character's mouth moves. */
    speaker: z.string().min(1),
    /** Kokoro voice id, for example am_michael. */
    voice: kokoroVoiceSchema,
    /** A voice of its own, mixed from several Kokoro voices by weight. `voice` is its main one. */
    blend: z
      .array(z.object({ voice: kokoroVoiceSchema, weight: z.number().gt(0).max(1) }))
      .min(2)
      .optional(),
    text: z.string().min(1),
    /**
     * The line as the voice reads it: the same words, with commas and "..." where it breathes,
     * and for Chatterbox its mood and sound tags ([surprised], [chuckle]).
     */
    say: z.string().min(1).optional(),
    /** Which engine speaks it; left out, Kokoro. Chatterbox copies the voice in `sample`. */
    engine: z.enum(['kokoro', 'chatterbox']).optional(),
    /** For Chatterbox: the recording it copies, from the project root (voices/samples/<id>.wav). */
    sample: z.string().min(1).optional(),
    speed: z.number().min(0.5).max(2).default(1),
    /** Silence after this line, in ms. Gives the picture time to land. */
    pauseAfterMs: z.number().int().min(0).max(5000).default(500),
  })
  .refine((l) => !l.say || sameWords(l.text, l.say), { message: SAY_MESSAGE, path: ['say'] })
  .refine((l) => !l.blend || Math.abs(l.blend.reduce((sum, b) => sum + b.weight, 0) - 1) < 0.01, {
    message: 'the weights of a blended voice add up to 1',
    path: ['blend'],
  });

export const voiceScriptSchema = z.object({
  /** Silence before the first line, in ms. */
  leadInMs: z.number().int().min(0).max(3000).default(300),
  /** Silence after the last line, in ms. */
  tailMs: z.number().int().min(0).max(5000).default(800),
  /** How far the end of every question is lifted; 0 leaves the voice as Kokoro speaks it. */
  questionLift: z.number().min(0).max(2).default(QUESTION_LIFT),
  lines: z.array(scriptLineSchema).min(1),
});

const ms = z.number().min(0);

export const wordTimingSchema = z
  .object({
    text: z.string().min(1),
    startMs: ms,
    endMs: ms,
    lineId: z.string(),
    emphasis: z.boolean(),
    /**
     * The speech sounds the voice made for the word (Kokoro's phonemes), so the mouth follows
     * what is heard and not the spelling. Left out by older tracks: the spelling is used.
     */
    sounds: z.string().optional(),
  })
  .refine((w) => w.endMs >= w.startMs, { message: 'a word must end after it starts' });

export const voiceLineSchema = z.object({
  id: z.string(),
  speaker: z.string(),
  voice: z.string(),
  text: z.string(),
  startMs: ms,
  endMs: ms,
});

/** What the voice worker writes next to the audio file: every line and word with its time. */
export const voiceTrackSchema = z
  .object({
    version: z.literal(1),
    audioFile: z.string().min(1),
    sampleRate: z.number().int().positive(),
    durationMs: ms,
    /** kokoro: from the model's own token timings. estimated: spread by text length (fallback). */
    /** heard: written down by listening back to the voice (Chatterbox, which gives no timings). */
    timingSource: z.enum(['kokoro', 'heard', 'estimated']),
    loudnessLufs: z.number(),
    lines: z.array(voiceLineSchema).min(1),
    words: z.array(wordTimingSchema).min(1),
  })
  .superRefine((t, ctx) => {
    for (let i = 1; i < t.words.length; i++) {
      const prev = t.words[i - 1];
      const cur = t.words[i];
      if (prev && cur && cur.startMs + 1 < prev.startMs) {
        ctx.addIssue({ code: 'custom', message: `word ${i} starts before the word before it` });
      }
    }
    const last = t.words[t.words.length - 1];
    if (last && last.endMs > t.durationMs + 1) {
      ctx.addIssue({ code: 'custom', message: 'the last word ends after the audio ends' });
    }
  });

export type ScriptLine = z.infer<typeof scriptLineSchema>;
export type VoiceScript = z.infer<typeof voiceScriptSchema>;
export type WordTiming = z.infer<typeof wordTimingSchema>;
export type VoiceLine = z.infer<typeof voiceLineSchema>;
export type VoiceTrack = z.infer<typeof voiceTrackSchema>;

/** Validate with a plain-language error that names the file. */
export function parseOrExplain<T>(schema: z.ZodType<T>, input: unknown, what: string): T {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  const lines = r.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`);
  throw new Error(`${what} is not valid:\n${lines.join('\n')}`);
}
