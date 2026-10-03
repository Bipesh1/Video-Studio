import { z } from 'zod';

/**
 * Contracts between the script, the voice worker (Python) and the engine (Part 2, section 3).
 * A stage fails fast with a plain-language error when its input does not match.
 */

/** One line to speak. Words wrapped in *asterisks* are emphasized in captions (Style 9). */
export const scriptLineSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'line ids use lowercase letters, digits and dashes'),
  /** "narrator" or a character id. The speaking character's mouth moves. */
  speaker: z.string().min(1),
  /** Kokoro voice id, for example am_michael. */
  voice: z.string().regex(/^[a-z]{2}_[a-z]+$/, 'expected a Kokoro voice id like am_michael'),
  text: z.string().min(1),
  speed: z.number().min(0.5).max(2).default(1),
  /** Silence after this line, in ms. Gives the picture time to land. */
  pauseAfterMs: z.number().int().min(0).max(5000).default(500),
});

export const voiceScriptSchema = z.object({
  /** Silence before the first line, in ms. */
  leadInMs: z.number().int().min(0).max(3000).default(300),
  /** Silence after the last line, in ms. */
  tailMs: z.number().int().min(0).max(5000).default(800),
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
    timingSource: z.enum(['kokoro', 'estimated']),
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
