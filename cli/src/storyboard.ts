/**
 * `npm run storyboard -- <command>`: the video's master file and the plug-ins it picks.
 *
 *   plugins                    list every format, brand, voice and saved character, checked
 *   check --run=<run>          check runs/<run>/storyboard.json
 *   check <file>               check a storyboard file anywhere in the project
 *
 * A check reads the storyboard's shape, then asks whether everything it names exists: the
 * format, brand and voices, every pose, place, prop and effect in the library. It prints the
 * length of each chapter and what has to be fixed, in plain words.
 */
import path from 'node:path';
import { CHAPTER_MAX_S, SIZES, checkStoryboard } from '@studio/shared';
import { projectRoot } from './system.js';
import { loadStoryboard, loadWorld } from './world.js';

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--'));
const rest = argv.filter((a) => !a.startsWith('--')).slice(1);
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;

function plugins() {
  const world = loadWorld();
  console.log(`formats (${Object.keys(world.formats).length})`);
  for (const f of Object.values(world.formats)) {
    console.log(
      `  ${f.id.padEnd(11)} ${f.lengthRange.min} to ${f.lengthRange.max} s  ${f.structure.map((b) => b.id).join(' > ')}`,
    );
  }
  console.log(`brands (${Object.keys(world.brands).length})`);
  for (const b of Object.values(world.brands)) {
    console.log(
      `  ${b.id.padEnd(11)} "${b.pageName}"  format ${b.defaults.format}, voice ${b.defaults.voice}, sizes ${b.defaults.sizes.join(' ')}`,
    );
  }
  console.log(`voices (${Object.keys(world.voices).length})`);
  for (const v of Object.values(world.voices)) {
    console.log(`  ${v.id.padEnd(11)} ${v.kokoroVoice}, speed ${v.speed}  ${v.description}`);
  }
  console.log(`saved characters (${Object.keys(world.characters).length})`);
  for (const c of Object.values(world.characters)) console.log(`  ${c.id.padEnd(15)} ${c.name}`);
  console.log(
    `sizes: ${Object.entries(SIZES)
      .map(([name, s]) => `${name} (${s.width}x${s.height})`)
      .join(', ')}. A chapter is at most ${CHAPTER_MAX_S} s.`,
  );
  console.log('Every plug-in file is valid.');
}

function check() {
  const run = value('run');
  const file = run
    ? path.join(projectRoot, 'runs', run, 'storyboard.json')
    : rest[0]
      ? path.resolve(projectRoot, rest[0])
      : null;
  if (!file) throw new Error('Give a storyboard: check --run=<run folder>, or check <file>');
  const world = loadWorld();
  const storyboard = loadStoryboard(file);
  const report = checkStoryboard(storyboard, world);
  const shots = storyboard.scenes.reduce((n, s) => n + s.shots.length, 0);
  console.log(
    `"${storyboard.title}": ${storyboard.format}, ${storyboard.mode} mode, ${storyboard.scenes.length} scenes, ${shots} shots, ${storyboard.cast.length} in the cast`,
  );
  for (const c of report.chapters) {
    console.log(
      `  chapter ${c.chapter}: ${c.measured ? '' : 'about '}${c.seconds} s (${c.scenes.join(', ')})`,
    );
  }
  console.log(`  uses ${report.needs.length} library pieces`);
  for (const note of report.notes) console.log(`  note: ${note}`);
  if (report.problems.length) {
    for (const p of report.problems) console.log(`  PROBLEM: ${p}`);
    console.log(`${report.problems.length} problem(s) to fix before this storyboard can be made.`);
    process.exitCode = 1;
    return;
  }
  console.log('The storyboard is ready: everything it asks for exists.');
}

const commands: Record<string, () => void> = { plugins, check };
const action = command ? commands[command] : undefined;
if (!action) {
  console.log('Commands: plugins, check --run=<run>, check <file>');
  process.exitCode = 1;
} else {
  try {
    action();
  } catch (err) {
    console.log((err as Error).message);
    process.exitCode = 1;
  }
}
