/**
 * `npm run script -- <command>`: the script stage of a video run.
 *
 *   new --run=<name> --mode=<as-is|refine|original> [--format=story] [--brand=<brand>]
 *       [--from=<Biku's script file>] --request="what Biku asked for"
 *                          make runs/<today>-<name>/ with the request and his script untouched
 *   chapters --run=<run>   split script.json into parts of at most a minute
 *   check --run=<run>      check script.json against its mode, its format and his original
 *   page --run=<run>       write script.md, the page Biku reads
 *
 * Claude writes script.json between `new` and `check`. Modes: as-is keeps every word; refine
 * keeps the story and the facts and lists every change; original is researched and written.
 */
import path from 'node:path';
import { SCRIPT_MODES } from '@studio/shared';
import type { ScriptMode } from '@studio/shared';
import {
  checkRunScript,
  findMasterPrompt,
  loadScript,
  newRun,
  splitRunIntoChapters,
  writeScriptPage,
} from './script-stage.js';
import { projectRoot } from './system.js';
import { loadWorld } from './world.js';

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--'));
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;

const runDir = () => {
  const run = value('run');
  if (!run) throw new Error('Give the run folder: --run=<folder name under runs/>');
  return path.join(projectRoot, 'runs', run);
};

const today = () => {
  const d = new Date();
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
};

function create() {
  const world = loadWorld();
  const mode = value('mode');
  if (!mode || !(SCRIPT_MODES as readonly string[]).includes(mode)) {
    throw new Error(`Give the mode: --mode=${SCRIPT_MODES.join(' or ')}`);
  }
  const brand = value('brand') ?? Object.keys(world.brands)[0] ?? '';
  const format = value('format') ?? world.brands[brand]?.defaults.format ?? 'story';
  const from = value('from');
  const made = newRun(
    {
      root: projectRoot,
      slug: value('run') ?? '',
      date: today(),
      mode: mode as ScriptMode,
      format,
      brand,
      request: value('request') ?? `${mode} mode, ${format} format`,
      ...(from ? { from: path.resolve(projectRoot, from) } : {}),
    },
    world,
  );
  console.log(`runs/${made.id}: ${made.made.join(', ')}`);
  const prompt = findMasterPrompt(projectRoot, format);
  console.log(
    prompt
      ? `Biku's master prompt ${prompt} replaces the default writing rules for this script.`
      : 'No master prompt in prompts/, so the default writing rules apply (knowledge/playbooks/general.md).',
  );
  console.log(
    `Next: write runs/${made.id}/script.json, then: npm run script -- chapters --run=${made.id}`,
  );
}

function chapters() {
  const world = loadWorld();
  const dir = runDir();
  const split = splitRunIntoChapters(dir, world);
  const count = Math.max(...split);
  console.log(`Split into ${count} ${count === 1 ? 'part' : 'parts'}.`);
  report(false);
}

function report(strict = true) {
  const world = loadWorld();
  const dir = runDir();
  const script = loadScript(dir);
  const r = checkRunScript(dir, world, projectRoot);
  console.log(
    `"${script.title}": ${script.format}, ${script.mode} mode, ${script.lines.length} lines, ${r.words} words, about ${r.seconds} s`,
  );
  for (const c of r.chapters) {
    console.log(
      `  part ${c.chapter}: about ${c.seconds} s, ${c.words} words (${c.lines[0]} to ${c.lines[c.lines.length - 1]})`,
    );
  }
  for (const note of r.notes) console.log(`  note: ${note}`);
  for (const p of r.problems) console.log(`  PROBLEM: ${p}`);
  if (r.problems.length) {
    console.log(`${r.problems.length} problem(s) to fix in the script.`);
    if (strict) process.exitCode = 1;
    return;
  }
  console.log('The script is ready for the shot plan.');
}

function page() {
  const world = loadWorld();
  const file = writeScriptPage(runDir(), world, projectRoot);
  console.log(path.relative(projectRoot, file));
}

const commands: Record<string, () => void> = { new: create, chapters, check: () => report(), page };
const action = command ? commands[command] : undefined;
if (!action) {
  console.log('Commands: new, chapters --run=<run>, check --run=<run>, page --run=<run>');
  process.exitCode = 1;
} else {
  try {
    action();
  } catch (err) {
    console.log((err as Error).message);
    process.exitCode = 1;
  }
}
