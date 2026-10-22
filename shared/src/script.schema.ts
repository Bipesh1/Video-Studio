import { z } from 'zod';
import { CHAPTER_MAX_S, SCRIPT_MODES, idSchema, viewerTextSchema } from './plugins.schema';
import type { Format } from './plugins.schema';
import type { World } from './storyboard.check';
import { NARRATOR, SPEAKING_WPM, plainWords } from './storyboard.schema';
import { SAY_MESSAGE, sameWords } from './voice.schema';

/**
 * The script (Part 2, sections 4.1 and 4.2; stage 2 of a run): `runs/<run>/script.json`, the
 * hand-off from writing to shot planning. It is the words and who says them, each line placed
 * on a beat of the format and in a chapter. The shot planner turns it into the storyboard.
 *
 * Three modes: `as-is` (Biku's words exactly), `refine` (his story and facts, better told, with
 * every change listed) and `original` (researched and written by Claude).
 */

export const spokenLineSchema = z
  .object({
    id: idSchema,
    speaker: z.union([z.literal(NARRATOR), idSchema]),
    /** The words. *Asterisks* mark a word the captions emphasize. */
    text: z.string().min(1),
    /** The beat of the format this line plays. */
    beat: idSchema,
    /** Which chapter it is in, counting from 1. */
    chapter: z.number().int().min(1).default(1),
    speed: z.number().min(0.5).max(2).optional(),
    /**
     * The line as the voice reads it: the very same words, with commas and "..." where the voice
     * should breathe or hold. The captions and the checks keep `text`.
     */
    say: z.string().min(1).optional(),
    /** Silence after the line, in ms. Left out: the format's usual pause. */
    pauseAfterMs: z.number().int().min(0).max(5000).optional(),
    /**
     * True for a thought: the line is heard in the speaker's own voice while their mouth stays
     * shut. For what someone tells themselves, which nobody else in the room hears.
     */
    thought: z.boolean().optional(),
  })
  .strict()
  .refine((l) => !l.say || sameWords(l.text, l.say), { message: SAY_MESSAGE, path: ['say'] });

export const scriptSchema = z
  .object({
    version: z.literal(1),
    title: viewerTextSchema,
    /** What Biku asked for, in his words. */
    request: z.string().min(1),
    mode: z.enum(SCRIPT_MODES),
    format: idSchema,
    brand: idSchema,
    /** The narrator's voice (voices/<voice>.json). */
    voice: idSchema,
    /** Everyone who speaks besides the narrator. How they look is decided in the shot plan. */
    speakers: z
      .array(z.object({ id: idSchema, name: z.string().min(1), voice: idSchema }).strict())
      .default([]),
    lines: z.array(spokenLineSchema).min(1),
    /** Where the facts come from: a title or address and what it was used for. */
    sources: z.array(z.string().min(1)).default([]),
    /** In refine mode: every change made to Biku's script, one plain sentence each. */
    changes: z.array(z.string().min(5)).default([]),
    /** A master prompt of Biku's from prompts/ that replaced the default writing rules. */
    masterPrompt: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const seen = new Set<string>();
    for (const l of s.lines) {
      if (seen.has(l.id)) issue(`line "${l.id}" is used twice`);
      seen.add(l.id);
    }
    const speakers = new Set(s.speakers.map((p) => p.id));
    if (speakers.size !== s.speakers.length) issue('a speaker is listed twice');
    if (speakers.has(NARRATOR)) issue('"narrator" is not a speaker to list; it is always there');
    let chapter = 1;
    s.lines.forEach((l, i) => {
      if (l.speaker !== NARRATOR && !speakers.has(l.speaker)) {
        issue(`line "${l.id}" is spoken by "${l.speaker}", who is not listed as a speaker`);
      }
      if (i === 0 && l.chapter !== 1) issue('the first line must be in chapter 1');
      if (l.chapter < chapter) issue(`line "${l.id}" goes back to an earlier chapter`);
      if (l.chapter > chapter + 1) issue(`line "${l.id}" skips a chapter`);
      chapter = Math.max(chapter, l.chapter);
    });
  });

export type SpokenLine = z.infer<typeof spokenLineSchema>;
export type Script = z.infer<typeof scriptSchema>;

// ------------------------------------------------------------------ lengths and chapters

/** How long a line takes: its words at the voice's pace, then its pause. */
export function lineSeconds(
  line: Pick<SpokenLine, 'text' | 'speed' | 'pauseAfterMs'>,
  pauseMs: number,
  voiceSpeed = 1,
): number {
  const count = plainWords(line.text).split(' ').filter(Boolean).length;
  const speech = (count / SPEAKING_WPM) * 60;
  return speech / ((line.speed ?? 1) * voiceSpeed) + (line.pauseAfterMs ?? pauseMs) / 1000;
}

/**
 * Lengths are guessed from word counts until the voice exists, and a guess can be an eighth
 * out, so chapters are planned to this share of the limit.
 */
export const CHAPTER_PLAN_SHARE = 0.88;

/**
 * Puts every line in a chapter: as few chapters as will fit, as even as they can be, cut where
 * the story turns (between beats) wherever that costs little. Returns the chapter of each
 * line, counting from 1. A line too long for any chapter gets a chapter to itself.
 */
export function assignChapters(
  lines: ReadonlyArray<Pick<SpokenLine, 'beat'>>,
  seconds: readonly number[],
  maxS: number = CHAPTER_MAX_S * CHAPTER_PLAN_SHARE,
): number[] {
  const n = lines.length;
  if (n === 0) return [];
  const total = seconds.reduce((a, b) => a + b, 0);
  const prefix = [0];
  for (const s of seconds) prefix.push((prefix[prefix.length - 1] ?? 0) + s);
  const span = (from: number, to: number) => (prefix[to] ?? 0) - (prefix[from] ?? 0);
  // A cut inside a beat costs as much as a chapter being this many seconds off its fair share.
  const MID_BEAT = 7;
  const cutCost = (at: number) =>
    at === 0 || at === n || lines[at - 1]?.beat !== lines[at]?.beat ? 0 : MID_BEAT * MID_BEAT;

  for (let count = Math.max(1, Math.ceil(total / maxS)); count <= n; count++) {
    const share = total / count;
    // best[k][i]: the least cost of putting the first i lines into k chapters.
    const best: number[][] = Array.from({ length: count + 1 }, () =>
      new Array<number>(n + 1).fill(Infinity),
    );
    const from: number[][] = Array.from({ length: count + 1 }, () =>
      new Array<number>(n + 1).fill(-1),
    );
    (best[0] as number[])[0] = 0;
    for (let k = 1; k <= count; k++) {
      for (let i = k; i <= n; i++) {
        for (let j = k - 1; j < i; j++) {
          const before = best[k - 1]?.[j] ?? Infinity;
          if (!Number.isFinite(before)) continue;
          const length = span(j, i);
          // One line longer than a chapter is allowed alone; nothing else may run over.
          if (length > maxS && i - j > 1) continue;
          const cost = before + (length - share) ** 2 + cutCost(j);
          if (cost < (best[k]?.[i] ?? Infinity)) {
            (best[k] as number[])[i] = cost;
            (from[k] as number[])[i] = j;
          }
        }
      }
    }
    if (!Number.isFinite(best[count]?.[n] ?? Infinity)) continue;
    const out = new Array<number>(n).fill(1);
    let end = n;
    for (let k = count; k >= 1; k--) {
      const start = from[k]?.[end] ?? 0;
      for (let i = start; i < end; i++) out[i] = k;
      end = start;
    }
    return out;
  }
  return lines.map((_, i) => i + 1);
}

// ------------------------------------------------------------------ the check

export type ScriptReport = {
  problems: string[];
  notes: string[];
  words: number;
  seconds: number;
  chapters: Array<{ chapter: number; seconds: number; lines: string[]; words: number }>;
};

const EM_DASH = '—';
const GREETING =
  /^\W*(hi|hello|hey|welcome|greetings|good (morning|evening|afternoon)|in this video|today (we|i)|what'?s up)\b/i;
const LONG_SENTENCE = 26;

/** Words as spoken, for comparing two versions: marks and spacing out, everything else kept. */
export function spokenWords(text: string): string[] {
  return text
    .replace(/[*_`#>]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** A speaker's name as a script may write it: "THE TRAINER", "Trainer" and "trainer" are one. */
const speakerKey = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, '');

/** A step heading of the script guide's layout: "1. THE QUESTION". */
const STEP_HEADING = /^(#{1,6}\s+)?\d+\.\s+[A-Z][A-Z .'-]*$/;
/** Where the spoken script ends in the guide's layout: "SOURCES:", or a heading "## SOURCES". */
const AFTER_SCRIPT = /^(#{1,6}\s+)?\**(SOURCES|YOUTUBE|FACEBOOK CAPTION)\**\s*(:|$)/i;

/**
 * Biku's script as he gave it, reduced to the words to speak: headings and blank lines go, and
 * a name before a colon at the start of a line ("MIRA: ...", "SAINT (thinks): ...") is who
 * speaks, not a word. In the script guide's layout (steps headed "1. THE QUESTION") the notes
 * above the first step, the actions in round brackets, the [requests] for the picture and
 * everything from SOURCES on are not spoken either.
 */
export function originalWords(original: string, speakerNames: readonly string[] = []): string[] {
  const names = new Set([NARRATOR, 'narration', 'outside voice', ...speakerNames].map(speakerKey));
  const rows = original.split(/\r?\n/).map((r) => r.trim());
  const firstStep = rows.findIndex((r) => STEP_HEADING.test(r));
  const out: string[] = [];
  for (const [i, line] of rows.entries()) {
    if (firstStep >= 0 && AFTER_SCRIPT.test(line)) break;
    if (firstStep >= 0 && (i <= firstStep || STEP_HEADING.test(line))) continue;
    if (!line || /^#{1,6}\s/.test(line) || /^[-=*_]{3,}$/.test(line)) continue;
    if (firstStep >= 0 && /^\(.*\)(\s*\[[^\]]*\])*$/.test(line)) continue;
    const label = /^\**([A-Za-z][A-Za-z .'-]{0,30}?)\**(\s*\(thinks\))?\s*:\s*(.*)$/.exec(line);
    const spoken = label && names.has(speakerKey(label[1] ?? '')) ? (label[3] ?? '') : line;
    out.push(...spokenWords(firstStep >= 0 ? spoken.replace(/\[[^\]]*\]/g, ' ') : spoken));
  }
  return out;
}

const numbersIn = (words: readonly string[]): string[] =>
  words
    .map((w) => w.replace(/^[^0-9]+|[^0-9%]+$/g, ''))
    .filter((w) => /\d/.test(w))
    .map((w) => w.replace(/,/g, ''));

const sentences = (text: string): string[] =>
  plainWords(text)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

/**
 * Checks a script against its mode's rules, its format and the plug-ins.
 * `original` is the text of script-original.md, when the run has one.
 */
export function checkScript(script: Script, world: World, original?: string): ScriptReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const format: Format | undefined = world.formats[script.format];
  if (!format)
    problems.push(`there is no format called "${script.format}" (formats/${script.format}.json)`);
  if (!world.brands[script.brand])
    problems.push(`there is no brand called "${script.brand}" (brands/${script.brand}.json)`);
  const narrator = world.voices[script.voice];
  if (!narrator)
    problems.push(`there is no voice called "${script.voice}" (voices/${script.voice}.json)`);
  for (const p of script.speakers) {
    if (!world.voices[p.voice])
      problems.push(
        `speaker "${p.id}": there is no voice called "${p.voice}" (voices/${p.voice}.json)`,
      );
    if (!script.lines.some((l) => l.speaker === p.id)) notes.push(`speaker "${p.id}" has no line`);
  }

  // ---- beats: the format's, in order, none missing
  if (format) {
    const order = format.structure.map((b) => b.id);
    let at = 0;
    const used = new Set<string>();
    for (const line of script.lines) {
      const index = order.indexOf(line.beat);
      if (index === -1) {
        problems.push(
          `line "${line.id}": the ${format.id} format has no beat called "${line.beat}" (its beats: ${order.join(', ')})`,
        );
        continue;
      }
      if (index < at)
        problems.push(`line "${line.id}": the beat "${line.beat}" comes after a later beat`);
      at = Math.max(at, index);
      used.add(line.beat);
    }
    for (const beat of format.structure) {
      if (!beat.optional && !used.has(beat.id))
        problems.push(`no line plays the "${beat.id}" beat, which the ${format.id} format needs`);
    }
  }

  // ---- the mode's own rules
  const speakerNames = script.speakers.flatMap((p) => [p.id, p.name]);
  const scriptWords = script.lines.flatMap((l) => spokenWords(l.text));
  const had = original === undefined ? null : originalWords(original, speakerNames);
  if (script.mode === 'as-is') {
    if (!had || had.length === 0) {
      problems.push("as-is mode needs Biku's script saved as script-original.md");
    } else {
      const at = had.findIndex((w, i) => w !== scriptWords[i]);
      const differ =
        at !== -1
          ? at
          : scriptWords.length !== had.length
            ? Math.min(had.length, scriptWords.length)
            : -1;
      if (differ !== -1) {
        const context = (words: readonly string[]) =>
          words.slice(Math.max(0, differ - 3), differ + 4).join(' ') || '(the end)';
        problems.push(
          `as-is mode: the script is not word for word what Biku wrote. Around word ${differ + 1} he wrote "${context(had)}" and the script says "${context(scriptWords)}".`,
        );
      }
    }
    if (script.changes.length)
      problems.push('as-is mode changes nothing, so the list of changes must be empty');
  }
  if (script.mode === 'refine') {
    if (!had || had.length === 0) {
      problems.push("refine mode needs Biku's script saved as script-original.md");
    } else {
      if (had.join(' ') === scriptWords.join(' ')) {
        problems.push(
          'refine mode: the script is word for word the original; nothing was refined (use as-is mode for that)',
        );
      } else if (script.changes.length === 0) {
        problems.push('refine mode: the script differs from the original but no change is listed');
      }
      // Facts are kept: every number Biku gave is still there, and none has been made up.
      const before = new Set(numbersIn(had));
      const after = new Set(numbersIn(scriptWords));
      for (const n of before)
        if (!after.has(n))
          problems.push(
            `refine mode keeps the facts: the number ${n} from the original is missing`,
          );
      for (const n of after)
        if (!before.has(n))
          problems.push(`refine mode keeps the facts: the number ${n} is not in the original`);
    }
  }
  if (script.mode === 'original') {
    if (script.changes.length)
      problems.push('original mode has no script to change, so the list of changes must be empty');
    if (format?.factRules.sourcesRequired && script.sources.length === 0) {
      problems.push(
        `the ${format.id} format needs its facts traced to sources, and the script lists none`,
      );
    }
  }
  if (
    script.mode !== 'original' &&
    format?.factRules.sourcesRequired &&
    script.sources.length === 0
  ) {
    notes.push(
      `the ${format.id} format is factual; the facts here are Biku's own and were not checked against a source`,
    );
  }

  // ---- writing rules (Part 2, section 4.2). Biku's own words are never judged in as-is mode.
  const first = script.lines[0];
  for (const line of script.lines) {
    if (!line.text.includes(EM_DASH)) continue;
    if (script.mode === 'as-is')
      notes.push(
        `line "${line.id}" has an em dash; the words stay as written and the captions show a comma there`,
      );
    else problems.push(`line "${line.id}" has an em dash; viewer text must not (ground rule 14)`);
  }
  if (script.mode !== 'as-is') {
    if (first && GREETING.test(plainWords(first.text))) {
      problems.push(
        'the script opens with a greeting or an introduction; the first 3 seconds must be the most striking line',
      );
    }
    for (const line of script.lines) {
      for (const s of sentences(line.text)) {
        const count = s.split(' ').length;
        if (count > LONG_SENTENCE)
          notes.push(
            `line "${line.id}" has a sentence of ${count} words; one idea per sentence reads better aloud`,
          );
      }
    }
  }

  // ---- lengths
  const pause = format?.pacing.pauseMs.normal ?? 500;
  const speed = narrator?.speed ?? 1;
  const chapters: ScriptReport['chapters'] = [];
  for (const line of script.lines) {
    const voice =
      line.speaker === NARRATOR
        ? speed
        : (world.voices[script.speakers.find((p) => p.id === line.speaker)?.voice ?? '']?.speed ??
          1);
    const seconds = lineSeconds(line, pause, voice);
    const words = spokenWords(line.text).length;
    const last = chapters[chapters.length - 1];
    if (last && last.chapter === line.chapter) {
      last.seconds += seconds;
      last.words += words;
      last.lines.push(line.id);
    } else {
      chapters.push({ chapter: line.chapter, seconds, words, lines: [line.id] });
    }
  }
  const total = chapters.reduce((sum, c) => sum + c.seconds, 0);
  for (const c of chapters) {
    c.seconds = Math.round(c.seconds * 10) / 10;
    if (c.seconds > CHAPTER_MAX_S * 0.97) {
      problems.push(
        `chapter ${c.chapter} runs about ${c.seconds} s; a chapter is at most ${CHAPTER_MAX_S} s, and a guess needs room. Split again with: npm run script -- chapters`,
      );
    }
  }
  if (format) {
    const over = total > format.lengthRange.max * 1.05;
    const under = total < format.lengthRange.min * 0.9;
    const say = over
      ? `the script runs about ${total.toFixed(0)} s; the ${format.id} format allows up to ${format.lengthRange.max} s`
      : under
        ? `the script runs about ${total.toFixed(0)} s; the ${format.id} format needs at least ${format.lengthRange.min} s`
        : null;
    // Biku's words cannot be cut or padded in as-is mode, so there it is only something to know.
    if (say)
      (script.mode === 'as-is' ? notes : problems).push(
        script.mode === 'as-is'
          ? `${say}; as-is mode keeps every word, so think about another format`
          : say,
      );
    const pace = (scriptWords.length / total) * 60;
    const { min, max } = format.pacing.wordsPerMinute;
    if (script.mode !== 'as-is' && (pace > max * 1.12 || pace < min * 0.85)) {
      notes.push(
        `the pace is about ${pace.toFixed(0)} words a minute with pauses; the ${format.id} format is written for ${min} to ${max}. ${pace > max ? 'Give the big moments longer pauses.' : 'Shorten some pauses.'}`,
      );
    }
  }
  return {
    problems,
    notes,
    words: scriptWords.length,
    seconds: Math.round(total * 10) / 10,
    chapters,
  };
}
