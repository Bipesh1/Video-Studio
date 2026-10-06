/**
 * `npm run make -- --run=<run> --part=<n> <stages>`: builds one part of a video from its
 * storyboard (Phase 4D; stages 5 to 10 of a run, for one part).
 *
 * Stages, run in this order when given:
 *   --voice    speak the part's lines (audio/voice.wav and timings.json)
 *   --time     write the voice's times into the shots (storyboard.json of the part)
 *   --sound    music and effects from the storyboard, mixed under the voice (audio/mix.wav)
 *   --stills   one still per shot, and all of them on one sheet, to look at before the video
 *   --video    the part as a video, in the size given; each render gets the next version number
 *   --all      all of the above
 *
 * `--size=16:9` (or 9:16, 4:5) picks the shape; left out, it is the brand's first size.
 * `--at=0.6` moves each still to that point of its shot. Everything for a part lives in
 * runs/<run>/part-<n>/. A stage whose inputs have not changed is skipped.
 */
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { serializeSrt } from '@remotion/captions';
import {
  CHAPTER_MAX_S,
  SIZES,
  SIZE_NAMES,
  checkPlan,
  checkStoryboard,
  parseOrExplain,
  partCount,
  partStoryboard,
  scriptMismatch,
  soundPlanFor,
  timeShots,
  voiceScriptFor,
  voiceScriptSchema,
  voiceTrackSchema,
} from '@studio/shared';
import type { SizeName, Storyboard, VoiceTrack, World } from '@studio/shared';
import { buildPages, toCaptions } from '../../engine/src/overlays/captionPages';
import { unbuildable } from '../../engine/src/stage/buildable';
import { timedShots } from '../../engine/src/stage/layout';
import { bundle, finishRendering, renderMedia, renderStill, selectComposition } from './render.js';
import { loadScript } from './script-stage.js';
import { mixRun } from './sound-stage.js';
import { projectRoot, run } from './system.js';
import { loadStoryboard, loadWorld } from './world.js';

const argv = process.argv.slice(2);
const args = new Set(argv);
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const RUN = value('run');
if (!RUN) throw new Error('Give the run folder: --run=<folder name under runs/>');
const PART = Number(value('part') ?? 1);
const stillAt = Number(value('at') ?? 0.6);
const all = args.has('--all');
const want = (s: string) => all || args.has(`--${s}`);

const runDir = path.join(projectRoot, 'runs', RUN);
const partDir = path.join(runDir, `part-${PART}`);
const audioDir = path.join(partDir, 'audio');
const engineDir = path.join(projectRoot, 'engine');
const publicDir = path.join(engineDir, 'public');
const publicPart = path.join(publicDir, 'runs', RUN, `part-${PART}`);
const rel = (file: string) => path.relative(projectRoot, file);

const log = (msg: string) => {
  console.log(msg);
  appendFileSync(
    path.join(runDir, 'log.txt'),
    `${new Date().toISOString()}  part ${PART}  ${msg}\n`,
  );
};

async function timed<T>(stage: string, fn: () => Promise<T> | T): Promise<T> {
  const t0 = Date.now();
  log(`${stage}: start`);
  const result = await fn();
  log(`${stage}: done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return result;
}

const world: World = loadWorld();

/** The whole video's plan, checked: nothing is built from a plan with a problem in it. */
function checkedPlan(): Storyboard {
  const sb = loadStoryboard(path.join(runDir, 'storyboard.json'));
  const problems = [
    ...checkStoryboard(sb, world).problems,
    ...checkPlan(sb, world).problems,
    ...(existsSync(path.join(runDir, 'script.json'))
      ? scriptMismatch(sb, loadScript(runDir)).map((p) => `against the script: ${p}`)
      : []),
    ...unbuildable(sb, world.characters),
  ];
  if (problems.length) {
    throw new Error(
      `The shot plan cannot be built yet:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
    );
  }
  if (PART < 1 || PART > partCount(sb)) {
    throw new Error(`This video has ${partCount(sb)} part(s); there is no part ${PART}.`);
  }
  return sb;
}

/** A shot this many seconds over the format's longest is refused once the real voice is known. */
const TOO_LONG_BY = 1.2;

const hashOf = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16);

/** Speak the part. Skipped when the voice script is the one already spoken. */
function voice(part: Storyboard) {
  const script = parseOrExplain(voiceScriptSchema, voiceScriptFor(part, world), 'the voice script');
  const text = `${JSON.stringify(script, null, 2)}\n`;
  const file = path.join(partDir, 'voice-script.json');
  const stamp = path.join(audioDir, 'voice.hash');
  const done =
    existsSync(path.join(audioDir, 'voice.wav')) &&
    existsSync(path.join(audioDir, 'timings.json')) &&
    existsSync(stamp) &&
    readFileSync(stamp, 'utf8') === hashOf(text);
  writeFileSync(file, text, 'utf8');
  if (done) {
    log('  the voice is already made for these lines');
    return;
  }
  const r = run(
    'uv',
    ['run', 'python', '-m', 'studio_audio.voice', 'synth', '--script', file, '--out', audioDir],
    { cwd: path.join(projectRoot, 'audio'), timeoutMs: 60 * 60_000 },
  );
  if (r.status !== 0) {
    console.error(r.stderr);
    throw new Error(`The voice worker failed (exit code ${r.status}).`);
  }
  writeFileSync(stamp, hashOf(text), 'utf8');
  const out = `${r.stdout ?? ''}`
    .trim()
    .split(/\r?\n/)
    .filter((l) => !/warn|LSTM|WeightNorm/i.test(l));
  for (const l of out.slice(-2)) log(`  ${l}`);
}

function loadTrack(): VoiceTrack {
  const file = path.join(audioDir, 'timings.json');
  if (!existsSync(file))
    throw new Error('No voice yet for this part. Run the --voice stage first.');
  return parseOrExplain(voiceTrackSchema, JSON.parse(readFileSync(file, 'utf8')), rel(file));
}

/** The part's storyboard with the voice's times in every shot. */
function time(part: Storyboard): Storyboard {
  const timedPart = timeShots(part, loadTrack());
  writeFileSync(
    path.join(partDir, 'storyboard.json'),
    `${JSON.stringify(timedPart, null, 2)}\n`,
    'utf8',
  );
  const shots = timedPart.scenes.flatMap((s) => s.shots);
  const lengths = shots.map((s) => ((s.endMs ?? 0) - (s.startMs ?? 0)) / 1000);
  const total = (shots[shots.length - 1]?.endMs ?? 0) / 1000;
  log(
    `  ${shots.length} shots over ${total.toFixed(1)} s: shortest ${Math.min(...lengths).toFixed(1)} s, longest ${Math.max(...lengths).toFixed(1)} s`,
  );
  // The plan was made from guessed lengths; now the real ones are known. A shot a little
  // long or short is only worth a look; one far over, or a part over the limit, is not built.
  const allowed = world.formats[timedPart.format]?.shotLength ?? { min: 2, max: 4 };
  const problems: string[] = [];
  shots.forEach((shot, i) => {
    const seconds = lengths[i] ?? 0;
    if (seconds > allowed.max + TOO_LONG_BY) {
      problems.push(
        `shot "${shot.id}" stays on screen ${seconds.toFixed(1)} s; split its words into two shots`,
      );
    } else if (seconds > allowed.max + 0.25) {
      log(
        `  note: shot "${shot.id}" is ${seconds.toFixed(1)} s long, a little over the ${allowed.max} s a shot should take`,
      );
    } else if (seconds < allowed.min - 0.6) {
      log(`  note: shot "${shot.id}" is only ${seconds.toFixed(1)} s long`);
    }
  });
  if (total > CHAPTER_MAX_S) {
    problems.push(
      `the part runs ${total.toFixed(1)} s; a part is at most ${CHAPTER_MAX_S} s. Move a scene to the next part.`,
    );
  }
  for (const p of problems) log(`  PROBLEM: ${p}`);
  if (problems.length) {
    throw new Error(
      'With the real voice, the plan no longer fits. Fix the storyboard and make the part again.',
    );
  }
  return timedPart;
}

function loadTimed(): Storyboard {
  const file = path.join(partDir, 'storyboard.json');
  if (!existsSync(file))
    throw new Error('The shots have no times yet. Run the --time stage first.');
  return loadStoryboard(file);
}

/** Music and effects from the storyboard, mixed under the voice. */
function sound(timedPart: Storyboard) {
  const plan = soundPlanFor(timedPart);
  const text = `${JSON.stringify(plan, null, 2)}\n`;
  const file = path.join(partDir, 'sound-plan.json');
  if (!existsSync(file) || readFileSync(file, 'utf8') !== text) writeFileSync(file, text, 'utf8');
  for (const line of mixRun(partDir)) log(`  ${line}`);
}

const SIZE: SizeName = (() => {
  const asked = value('size');
  const brand = world.brands[loadStoryboard(path.join(runDir, 'storyboard.json')).brand];
  const size = asked ?? brand?.defaults.sizes[0] ?? '9:16';
  if (!(SIZE_NAMES as readonly string[]).includes(size)) {
    throw new Error(`There is no size "${size}". The sizes are: ${SIZE_NAMES.join(', ')}.`);
  }
  return size as SizeName;
})();
const sizeTag = SIZE.replace(':', 'x');

let serveUrl: string | null = null;
const shaOfFile = (file: string) =>
  createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);

/** The mix the bundle was made with: the renderer serves its own copy of the sound, taken then. */
let bundledMix: string | null = null;

/**
 * The engine bundled for rendering. The bundle takes its own copy of the sound at the moment
 * it is made, so the mix goes in first, and a bundle made before a newer mix is made again:
 * a video must never carry the sound of the render before it.
 */
async function bundled() {
  const mix = path.join(audioDir, 'mix.wav');
  const current = existsSync(mix) ? shaOfFile(mix) : null;
  if (!serveUrl || bundledMix !== current) {
    if (current) {
      mkdirSync(publicPart, { recursive: true });
      copyFileSync(mix, path.join(publicPart, 'mix.wav'));
    }
    serveUrl = await timed('bundle', () =>
      bundle({ entryPoint: path.join(engineDir, 'src', 'index.ts'), publicDir }),
    );
    bundledMix = current;
  }
  return serveUrl;
}

function inputProps(timedPart: Storyboard, withSound: boolean) {
  const brand = world.brands[timedPart.brand];
  return {
    storyboard: timedPart,
    track: existsSync(path.join(audioDir, 'timings.json')) ? loadTrack() : null,
    audioSrc: withSound ? `runs/${RUN}/part-${PART}/mix.wav` : null,
    size: SIZE,
    cards: world.characters,
    ...(brand
      ? { colors: { titleRibbon: brand.colors.titleRibbon, label: brand.colors.label } }
      : {}),
  };
}

async function stills(timedPart: Storyboard) {
  const url = await bundled();
  const props = inputProps(timedPart, false);
  const composition = await selectComposition({
    serveUrl: url,
    id: 'Storyboard',
    inputProps: props,
  });
  const dir = path.join(partDir, 'stills', sizeTag);
  mkdirSync(dir, { recursive: true });
  const shots = timedShots(timedPart, composition.fps);
  const files: string[] = [];
  for (const s of shots) {
    const frame = Math.min(
      composition.durationInFrames - 1,
      Math.round(s.startFrame + (s.endFrame - s.startFrame) * stillAt),
    );
    const out = path.join(dir, `${s.shot.id}.png`);
    await renderStill({ composition, serveUrl: url, output: out, frame, inputProps: props });
    files.push(out);
  }
  log(`  ${files.length} stills in ${rel(dir)}`);
  // All the stills on sheets of twelve, small, to look through at a glance.
  const { width, height } = SIZES[SIZE];
  const columns = width > height ? 3 : 4;
  const cell = width > height ? 640 : 400;
  for (let i = 0; i < files.length; i += 12) {
    const batch = files.slice(i, i + 12);
    const sheet = path.join(partDir, 'stills', `sheet-${sizeTag}-${i / 12 + 1}.png`);
    const inputs = batch.flatMap((f) => ['-i', f]);
    const rows = Math.ceil(batch.length / columns);
    const filter =
      batch.map((_, k) => `[${k}]scale=${cell}:-1[s${k}]`).join(';') +
      `;${batch.map((_, k) => `[s${k}]`).join('')}xstack=inputs=${batch.length}:layout=` +
      batch
        .map((_, k) => {
          const col = k % columns;
          const row = Math.floor(k / columns);
          const h = Math.round((cell * height) / width);
          return `${col * cell}_${row * h}`;
        })
        .join('|') +
      `:fill=black[out]`;
    const r =
      batch.length === 1
        ? run('ffmpeg', [
            '-v',
            'error',
            '-y',
            '-i',
            batch[0] as string,
            '-vf',
            `scale=${cell}:-1`,
            sheet,
          ])
        : run('ffmpeg', [
            '-v',
            'error',
            '-y',
            ...inputs,
            '-filter_complex',
            filter,
            '-map',
            '[out]',
            sheet,
          ]);
    if (r.status === 0) log(`  ${rel(sheet)} (${batch.length} shots, ${rows} rows)`);
    else log(`  could not make the sheet: ${(r.stderr ?? '').trim().slice(0, 200)}`);
  }
}

/** A part's renders are never overwritten: each takes the next free version number. */
function nextVersion(outDir: string, name: string): number {
  let v = 1;
  while (existsSync(path.join(outDir, `${name}-v${v}.mp4`))) v++;
  return v;
}

async function video(timedPart: Storyboard) {
  const mix = path.join(audioDir, 'mix.wav');
  if (!existsSync(mix)) throw new Error('No sound yet for this part. Run the --sound stage first.');
  const url = await bundled();
  const props = inputProps(timedPart, true);
  const composition = await selectComposition({
    serveUrl: url,
    id: 'Storyboard',
    inputProps: props,
  });
  const outDir = path.join(partDir, 'out');
  mkdirSync(outDir, { recursive: true });
  const slug = RUN?.replace(/^\d{4}-\d{2}-\d{2}-/, '') ?? 'video';
  const base = `${slug}-part-${PART}-${sizeTag}`;
  const name = `${base}-v${nextVersion(outDir, base)}`;
  const out = path.join(outDir, `${name}.mp4`);
  const t0 = Date.now();
  await renderMedia({
    composition,
    serveUrl: url,
    codec: 'h264',
    audioCodec: 'aac',
    outputLocation: out,
    inputProps: props,
    concurrency: Math.max(1, Math.min(Math.floor(os.cpus().length / 2), 4)),
  });
  const secs = (Date.now() - t0) / 1000;
  const videoSecs = composition.durationInFrames / composition.fps;
  log(
    `  ${rel(out)}: ${videoSecs.toFixed(2)} s of video, ${composition.width}x${composition.height}, in ${secs.toFixed(1)} s (${(secs / videoSecs).toFixed(2)} s per video second)`,
  );
  const track = loadTrack();
  const pages = buildPages(toCaptions(track.words));
  const srt = serializeSrt({
    lines: pages.map((p) =>
      p.lines.flat().map((w, i) => (i === 0 ? { ...w, text: w.text.trim() } : w)),
    ),
  });
  writeFileSync(path.join(outDir, `${name}.srt`), srt);
  log(`  ${rel(path.join(outDir, `${name}.srt`))}`);
  // What this video was made from, so the self-check can tell a video older than its plan.
  const madeFrom = {
    video: `${name}.mp4`,
    storyboard: shaOfFile(path.join(partDir, 'storyboard.json')),
    mix: shaOfFile(mix),
    madeAt: new Date().toISOString(),
  };
  writeFileSync(
    path.join(outDir, `${name}.json`),
    `${JSON.stringify(madeFrom, null, 2)}\n`,
    'utf8',
  );
}

async function main() {
  const stages = ['voice', 'time', 'sound', 'stills', 'video'];
  if (!stages.some(want)) {
    console.log(`Give at least one stage: ${stages.map((s) => `--${s}`).join(' ')} or --all`);
    process.exitCode = 1;
    return;
  }
  const plan = checkedPlan();
  const part = partStoryboard(plan, PART);
  mkdirSync(audioDir, { recursive: true });
  log(
    `part ${PART} of ${partCount(plan)}, ${SIZE}: ${part.scenes.length} scenes, ${part.scenes.reduce((n, s) => n + s.shots.length, 0)} shots`,
  );
  if (want('voice')) await timed('voice', () => voice(part));
  let timedPart: Storyboard | null = null;
  if (want('time')) timedPart = await timed('time', () => time(part));
  if (want('sound')) await timed('sound', () => sound(timedPart ?? loadTimed()));
  if (want('stills')) await timed('stills', () => stills(timedPart ?? loadTimed()));
  if (want('video')) await timed('video', () => video(timedPart ?? loadTimed()));
}

try {
  await main();
} catch (err) {
  console.log((err as Error).message);
  process.exitCode = 1;
} finally {
  await finishRendering();
}
