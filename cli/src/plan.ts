/**
 * `npm run plan -- <command>`: the shot plan of a video run (stage 3) and its library check
 * (stage 4).
 *
 *   menu                   everything a shot can use, by name: poses, actions, faces, places...
 *   draft --run=<run>      lay the checked script out as storyboard.json: scenes, lines, words
 *                          cut into shots of 2 to 4 seconds, with each decision marked "todo"
 *   check --run=<run>      check storyboard.json: its shape, every name, the staging rules, and
 *                          that it speaks the script word for word
 *   needs --run=<run>      the library check: every piece the shots use, and what must be drawn
 *   page --run=<run>       write storyboard.md, the shot list Biku reads
 *
 * Claude fills in the draft: where each scene is, who is in each shot, what they do and feel,
 * the camera, the sound. The check refuses a storyboard with a "todo" left in it.
 */
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  checkPlan,
  checkStoryboard,
  draftStoryboard,
  scriptMismatch,
  storyboardPage,
  storyboardSchema,
} from '@studio/shared';
import type { Storyboard, World } from '@studio/shared';
import { checkRunScript, loadScript } from './script-stage.js';
import { projectRoot } from './system.js';
import { loadStoryboard, loadWorld } from './world.js';

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--'));
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;

const runDir = () => {
  const run = value('run');
  if (!run) throw new Error('Give the run folder: --run=<folder name under runs/>');
  return path.join(projectRoot, 'runs', run);
};
const rel = (file: string) => path.relative(projectRoot, file);

const MENU: Array<[string, string]> = [
  ['place', 'Places (a scene happens in one)'],
  ['palette', 'Colors of a place (the time of day and the mood)'],
  ['pose', 'Poses (held)'],
  ['action', 'Actions (moving)'],
  ['expression', 'Expressions (every person in every shot names one)'],
  ['prop', 'Props (in a hand with "holds", or standing in the scene)'],
  ['effect', 'Effects on a person'],
  ['costume', 'Costumes'],
  ['clothing', 'Everyday clothes'],
  ['hair', 'Hair'],
  ['camera', 'Camera: shot sizes and moves'],
  ['music', 'Music moods (one per scene)'],
  ['sfx', 'Sound effects'],
];

function menu() {
  const world = loadWorld();
  for (const [kind, title] of MENU) {
    const assets = world.library.assets.filter((a) => a.kind === kind && a.id !== 'prop/in-hand');
    console.log(`${title}:`);
    for (const a of assets) {
      const id = a.id.slice(kind.length + 1).padEnd(18);
      console.log(`  ${id} ${a.description.split('. ')[0]?.slice(0, 96)}`);
    }
  }
  console.log(`Voices: ${Object.keys(world.voices).join(', ')}`);
  console.log(`Saved characters: ${Object.keys(world.characters).join(', ')}`);
  // A fixed cast is used by card, never redrawn: its look and voice are the same in every video.
  const casts = new Map<string, string[]>();
  for (const c of Object.values(world.characters)) {
    if (c.series) casts.set(c.series, [...(casts.get(c.series) ?? []), c.id]);
  }
  for (const [series, members] of casts) {
    console.log(`Fixed cast "${series}" (cast with card: "<id>"): ${members.join(', ')}`);
  }
  const colors = world.library.assets
    .filter((a) => a.kind === 'color')
    .map((a) => a.id.slice('color/'.length));
  console.log(`Cloth colors: white, ${colors.join(', ')}`);
}

function draft() {
  const world = loadWorld();
  const dir = runDir();
  const script = loadScript(dir);
  const report = checkRunScript(dir, world, projectRoot);
  if (report.problems.length) {
    throw new Error(
      `The script has ${report.problems.length} problem(s). Fix it first: npm run script -- check --run=${value('run')}`,
    );
  }
  // The seed comes from the title, so the same script always drafts the same storyboard.
  const seed = [...script.title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100000, 7);
  const made = storyboardSchema.parse(draftStoryboard(script, world, seed));
  const target = path.join(dir, 'storyboard.json');
  // A storyboard someone has worked on is never written over; the fresh draft goes beside it.
  const file = existsSync(target) ? path.join(dir, 'storyboard.draft.json') : target;
  writeFileSync(file, `${JSON.stringify(made, null, 2)}\n`, 'utf8');
  const shots = made.scenes.reduce((n, s) => n + s.shots.length, 0);
  console.log(
    `${rel(file)}: ${made.scenes.length} scenes, ${shots} shots, ${made.cast.length} speakers in the cast`,
  );
  if (file !== target) console.log('storyboard.json already exists and was left alone.');
  console.log(
    'Every "todo" is a decision to make: the place and colors of each scene, who is in each shot, each expression.',
  );
}

type Full = { storyboard: Storyboard; world: World; problems: string[]; notes: string[] };

function full(): Full {
  const world = loadWorld();
  const dir = runDir();
  const storyboard = loadStoryboard(path.join(dir, 'storyboard.json'));
  const names = checkStoryboard(storyboard, world);
  const staging = checkPlan(storyboard, world);
  const problems = [...names.problems, ...staging.problems];
  if (existsSync(path.join(dir, 'script.json'))) {
    problems.push(
      ...scriptMismatch(storyboard, loadScript(dir)).map((p) => `against the script: ${p}`),
    );
  }
  return { storyboard, world, problems, notes: [...names.notes, ...staging.notes] };
}

function check() {
  const { storyboard, world, problems, notes } = full();
  const names = checkStoryboard(storyboard, world);
  const staging = checkPlan(storyboard, world);
  console.log(
    `"${storyboard.title}": ${storyboard.scenes.length} scenes, ${staging.shots} shots, ${storyboard.cast.length} in the cast, ${staging.soundEffects} sound effects`,
  );
  for (const c of names.chapters) {
    console.log(
      `  part ${c.chapter}: ${c.measured ? '' : 'about '}${c.seconds} s (${c.scenes.join(', ')})`,
    );
  }
  for (const note of notes) console.log(`  note: ${note}`);
  for (const p of problems) console.log(`  PROBLEM: ${p}`);
  if (problems.length) {
    console.log(`${problems.length} problem(s) to fix in the shot plan.`);
    process.exitCode = 1;
    return;
  }
  console.log('The shot plan is ready: every name exists and the staging holds.');
}

function needs() {
  const world = loadWorld();
  const storyboard = loadStoryboard(path.join(runDir(), 'storyboard.json'));
  const report = checkStoryboard(storyboard, world);
  const have = new Set(world.library.assets.map((a) => a.id));
  const byKind = new Map<string, string[]>();
  for (const id of report.needs) {
    const [kind = '', name = ''] = id.split('/');
    byKind.set(kind, [...(byKind.get(kind) ?? []), have.has(id) ? name : `${name} (MISSING)`]);
  }
  for (const [kind, names] of byKind) console.log(`${kind.padEnd(12)} ${names.join(', ')}`);
  const missing = report.needs.filter((id) => !have.has(id) && !id.endsWith('/todo'));
  const undecided = report.needs.filter((id) => id.endsWith('/todo')).length;
  if (undecided) console.log(`${undecided} kind(s) of thing still marked "todo".`);
  if (missing.length) {
    console.log(`To draw before this video can be made (${missing.length}): ${missing.join(', ')}`);
    console.log('Draw each with the draw, look and fix loop: /draw <description>');
    process.exitCode = 1;
    return;
  }
  console.log(
    `The library has all ${report.needs.length} pieces this video uses. Nothing to draw.`,
  );
}

function page() {
  const { storyboard, world, problems } = full();
  if (problems.length) {
    throw new Error(
      `The shot plan has ${problems.length} problem(s). Fix it first: npm run plan -- check --run=${value('run')}`,
    );
  }
  const file = path.join(runDir(), 'storyboard.md');
  writeFileSync(file, storyboardPage(storyboard, world), 'utf8');
  console.log(rel(file));
}

const commands: Record<string, () => void> = { menu, draft, check, needs, page };
const action = command ? commands[command] : undefined;
if (!action) {
  console.log(
    'Commands: menu, draft --run=<run>, check --run=<run>, needs --run=<run>, page --run=<run>',
  );
  process.exitCode = 1;
} else {
  try {
    action();
  } catch (err) {
    console.log((err as Error).message);
    process.exitCode = 1;
  }
}
