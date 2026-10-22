/**
 * The script stage of a run (Part 2, section 4.1): the run folder, Biku's original, the
 * script as data (`script.json`, contract in shared/src/script.schema.ts) and the page Biku
 * reads (`script.md`).
 *
 * Claude writes script.json. This file only sets the folder up, splits the script into
 * chapters, checks it against its mode's rules and writes the readable page.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
  NARRATOR,
  assignChapters,
  checkScript,
  lineSeconds,
  parseOrExplain,
  scriptSchema,
} from '@studio/shared';
import { packagingSchema } from '@studio/shared';
import type { Script, ScriptMode, ScriptReport, World } from '@studio/shared';

export type NewRun = {
  /** The project root; runs are made under <root>/runs. */
  root: string;
  slug: string;
  /** YYYY-MM-DD. */
  date: string;
  mode: ScriptMode;
  format: string;
  brand: string;
  /** What Biku asked for, in his words. */
  request: string;
  /** His script file, for as-is and refine. */
  from?: string;
};

const SLUG = /^[a-z][a-z0-9-]*$/;

/** A master prompt of Biku's replaces the default writing rules: one for the format, or one for all. */
export function findMasterPrompt(root: string, format: string): string | null {
  for (const name of [`${format}.md`, 'master.md']) {
    if (existsSync(path.join(root, 'prompts', name))) return `prompts/${name}`;
  }
  return null;
}

/** Make the run folder with the request and, when there is one, Biku's script untouched. */
export function newRun(run: NewRun, world: World): { dir: string; id: string; made: string[] } {
  if (!SLUG.test(run.slug))
    throw new Error(`The run name "${run.slug}" must be lower case words joined by hyphens.`);
  if (!world.formats[run.format]) {
    throw new Error(
      `There is no format called "${run.format}". The formats are: ${Object.keys(world.formats).join(', ')}.`,
    );
  }
  if (!world.brands[run.brand]) {
    throw new Error(
      `There is no brand called "${run.brand}". The brands are: ${Object.keys(world.brands).join(', ')}.`,
    );
  }
  if (run.mode !== 'original' && !run.from) {
    throw new Error(`${run.mode} mode starts from Biku's script. Give it with --from=<file>.`);
  }
  if (run.from && !existsSync(run.from)) throw new Error(`There is no script file at ${run.from}.`);
  const id = `${run.date}-${run.slug}`;
  const dir = path.join(run.root, 'runs', id);
  if (existsSync(dir) && readdirSync(dir).length > 0) {
    throw new Error(
      `The run folder runs/${id} already exists. Pick another name; a run is never overwritten.`,
    );
  }
  mkdirSync(dir, { recursive: true });
  const made: string[] = [];
  const write = (name: string, text: string) => {
    writeFileSync(path.join(dir, name), text, 'utf8');
    made.push(name);
  };
  write('request.txt', `${run.request.trim()}\n`);
  if (run.from) {
    copyFileSync(run.from, path.join(dir, 'script-original.md'));
    made.push('script-original.md');
  }
  const brand = world.brands[run.brand];
  write(
    'run.json',
    `${JSON.stringify(
      {
        version: 1,
        id,
        created: run.date,
        mode: run.mode,
        format: run.format,
        brand: run.brand,
        voice: brand?.defaults.voice ?? NARRATOR,
        sizes: brand?.defaults.sizes ?? ['9:16'],
        vertical: brand?.defaults.vertical ?? 'full',
        masterPrompt: findMasterPrompt(run.root, run.format),
      },
      null,
      2,
    )}\n`,
  );
  return { dir, id, made };
}

const scriptFile = (dir: string) => path.join(dir, 'script.json');

export function loadScript(dir: string): Script {
  const file = scriptFile(dir);
  if (!existsSync(file)) {
    throw new Error(
      `There is no script yet (${path.basename(dir)}/script.json). The script is written first, then checked.`,
    );
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`script.json is not valid JSON: ${(err as Error).message}`);
  }
  return parseOrExplain(scriptSchema, raw, 'script.json');
}

export function loadOriginal(dir: string): string | undefined {
  const file = path.join(dir, 'script-original.md');
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

/** Check a run's script against its mode, its format and Biku's original. */
export function checkRunScript(dir: string, world: World, root: string): ScriptReport {
  const script = loadScript(dir);
  const report = checkScript(script, world, loadOriginal(dir));
  // The package comes first: a format that asks for it refuses a script without it.
  if (world.formats[script.format]?.packaging) {
    const file = path.join(dir, 'packaging.json');
    if (!existsSync(file)) {
      report.problems.push(
        'there is no packaging.json: decide the title, the thumbnail and the promise before the script (knowledge/playbooks/explainers.md)',
      );
    } else {
      const found = packagingSchema.safeParse(JSON.parse(readFileSync(file, 'utf8')));
      if (!found.success) {
        report.problems.push(
          `packaging.json is not right: ${found.error.issues.map((i) => `${i.path.join('.') || 'it'}: ${i.message}`).join('; ')}`,
        );
      } else if (found.data.title !== script.title) {
        report.problems.push(
          `the script's title "${script.title}" is not the package's title "${found.data.title}"`,
        );
      }
    }
  }
  const prompt = findMasterPrompt(root, script.format);
  if (prompt && script.masterPrompt !== prompt) {
    report.problems.push(
      `Biku's master prompt ${prompt} replaces the default writing rules, and the script does not say it was written under it`,
    );
  }
  if (!prompt && script.masterPrompt) {
    report.problems.push(
      `the script names the master prompt ${script.masterPrompt}, which does not exist`,
    );
  }
  return report;
}

/** Put every line in a chapter and save the script. Returns the chapter of each line. */
export function splitRunIntoChapters(dir: string, world: World): number[] {
  const script = loadScript(dir);
  const format = world.formats[script.format];
  const pause = format?.pacing.pauseMs.normal ?? 500;
  const speedOf = (speaker: string) =>
    speaker === NARRATOR
      ? (world.voices[script.voice]?.speed ?? 1)
      : (world.voices[script.speakers.find((p) => p.id === speaker)?.voice ?? '']?.speed ?? 1);
  const seconds = script.lines.map((l) => lineSeconds(l, pause, speedOf(l.speaker)));
  const chapters = assignChapters(script.lines, seconds);
  const next: Script = {
    ...script,
    lines: script.lines.map((l, i) => ({ ...l, chapter: chapters[i] ?? 1 })),
  };
  writeFileSync(scriptFile(dir), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return chapters;
}

const MODE_WORDS: Record<ScriptMode, string> = {
  'as-is': 'Used exactly as written. Not one word was changed.',
  refine: 'Refined: the story and the facts are kept, and every change is listed below.',
  original: 'Written for this video.',
};

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

/** The script as a page Biku can read: chapters, who says what, what changed, the sources. */
export function scriptPage(script: Script, report: ScriptReport): string {
  const who = new Map(script.speakers.map((p) => [p.id, p.name]));
  const out: string[] = [
    `# ${script.title}`,
    '',
    `Format: ${script.format}. ${MODE_WORDS[script.mode]}`,
    `About ${clock(report.seconds)} long (${report.words} words), in ${report.chapters.length} ${report.chapters.length === 1 ? 'part' : 'parts'}. Lengths are estimates until the voice is made.`,
    '',
  ];
  for (const c of report.chapters) {
    out.push(
      `## Part ${c.chapter} (about ${clock(c.seconds)})`,
      '',
      '| Line | Who | Words |',
      '| --- | --- | --- |',
    );
    for (const line of script.lines.filter((l) => l.chapter === c.chapter)) {
      const name = line.speaker === NARRATOR ? 'Narrator' : (who.get(line.speaker) ?? line.speaker);
      const words = line.text.replace(/\*([^*]+)\*/g, '**$1**').replace(/\|/g, '\\|');
      out.push(`| ${line.id} | ${name} | ${words} |`);
    }
    out.push('');
  }
  if (script.mode === 'refine') {
    out.push('## What changed', '');
    for (const change of script.changes) out.push(`- ${change}`);
    out.push('', 'Your original is saved untouched as `script-original.md`.', '');
  }
  if (script.sources.length) {
    out.push('## Sources', '');
    for (const source of script.sources) out.push(`- ${source}`);
    out.push('');
  }
  if (report.notes.length) {
    out.push('## Notes', '');
    for (const note of report.notes) out.push(`- ${note}`);
    out.push('');
  }
  return `${out.join('\n').trimEnd()}\n`;
}

export function writeScriptPage(dir: string, world: World, root: string): string {
  const script = loadScript(dir);
  const report = checkRunScript(dir, world, root);
  const file = path.join(dir, 'script.md');
  writeFileSync(file, scriptPage(script, report), 'utf8');
  return file;
}
