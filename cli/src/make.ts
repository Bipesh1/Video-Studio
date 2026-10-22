/**
 * `npm run make -- --run=<run> --part=<n> <stages>`: builds one part of a video from its
 * storyboard (Phase 4D; stages 5 to 10 of a run, for one part).
 *
 * Stages, run in this order when given:
 *   --voice    speak the part's lines (audio/voice.wav and timings.json)
 *   --time     write the voice's times into the shots (storyboard.json of the part)
 *   --sound    music and effects from the storyboard, mixed under the voice (audio/mix.wav)
 *   --stills   one still per shot, all of them on sheets, and a colour strip (the first still
 *              of each scene in a row: the colour of the story at a glance)
 *   --animatic a rough timed storyboard: each still held for as long as its shot, with the
 *              sound, made in seconds, to judge the story before the pictures move (numbered)
 *   --preview  the part as a small, quick video to check before the final one is made (numbered too)
 *   --video    the part as a video, in the size given; each render gets the next version number
 *   --clip=9-15 only those seconds of the part, full size, to look closely at one moment
 *              (numbered, in part-<n>/clips/; a clip never stands for the video in the self-check)
 *   --all      all of the above
 *
 * `--size=16:9` (or 9:16, 4:5) picks the shape; left out, it is the brand's first size.
 * `--at=0.6` moves each still to that point of its shot. Everything for a part lives in
 * runs/<run>/part-<n>/. A stage whose inputs have not changed is skipped.
 */
import { picturesSha } from './pictures.js';
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  rmSync,
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
import type {
  MadeFrom,
  SizeName,
  SoundProfile,
  Storyboard,
  VoiceTrack,
  World,
} from '@studio/shared';
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

/**
 * A Short or a long video, for its sound: a run made only in the tall shape is a Short (Biku,
 * 2026-10-21: the sound "should be different according to shorts or videos").
 */
function soundProfile(): SoundProfile {
  const file = path.join(runDir, 'run.json');
  const sizes: unknown = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as { sizes?: unknown }).sizes
    : undefined;
  return Array.isArray(sizes) && sizes.length > 0 && sizes.every((s) => s === '9:16')
    ? 'short'
    : 'long';
}

/** Music and effects from the storyboard, mixed under the voice. */
function sound(timedPart: Storyboard) {
  // The voice's words time the sound of every piece of an explainer graphic landing.
  const timings = path.join(partDir, 'audio', 'timings.json');
  const words = existsSync(timings)
    ? parseOrExplain(
        voiceTrackSchema,
        JSON.parse(readFileSync(timings, 'utf8')),
        'audio/timings.json',
      ).words
    : [];
  const plan = soundPlanFor(timedPart, world.formats[timedPart.format]?.roomTone, words, {
    profile: soundProfile(),
    opens: PART === 1,
  });
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

/**
 * For a video with a counter: how far into the whole video this part starts, from the voices
 * of the parts before it, and whether it is the last part. A part is built after the ones
 * before it, so their voices exist; one that does not is counted from the script's guess.
 */
function meterAt(timedPart: Storyboard): {
  meterStartMs?: number;
  meterEnds?: boolean;
  meterFromMs?: number;
} {
  const whole = loadStoryboard(path.join(runDir, 'storyboard.json'));
  if (!whole.meter) return {};
  const from = whole.meter.from;
  // Where the shot the counter starts on begins, in a part's own time, when that part has it.
  const startIn = (part: Storyboard): number | undefined =>
    part.scenes.flatMap((s) => s.shots).find((s) => s.id === from)?.startMs;
  let fromMs: number | undefined = from ? undefined : 0;
  let startMs = 0;
  for (let n = 1; n < PART; n++) {
    const earlier = path.join(runDir, `part-${n}`, 'storyboard.json');
    if (fromMs === undefined && existsSync(earlier)) {
      const at = startIn(loadStoryboard(earlier));
      if (at !== undefined) fromMs = startMs + at;
    }
    const timings = path.join(runDir, `part-${n}`, 'audio', 'timings.json');
    if (!existsSync(timings))
      throw new Error(
        `This video has a counter that runs through every part, so part ${n} needs its voice before part ${PART} is drawn.`,
      );
    startMs += parseOrExplain(
      voiceTrackSchema,
      JSON.parse(readFileSync(timings, 'utf8')),
      'timings.json',
    ).durationMs;
  }
  if (fromMs === undefined) {
    const at = startIn(timedPart);
    // Not in this part or an earlier one: it has not started yet.
    fromMs = at === undefined ? Number.MAX_SAFE_INTEGER : startMs + at;
  }
  return { meterStartMs: startMs, meterEnds: PART === partCount(whole), meterFromMs: fromMs };
}

function inputProps(timedPart: Storyboard, withSound: boolean) {
  const brand = world.brands[timedPart.brand];
  return {
    storyboard: timedPart,
    track: existsSync(path.join(audioDir, 'timings.json')) ? loadTrack() : null,
    audioSrc: withSound ? `runs/${RUN}/part-${PART}/mix.wav` : null,
    size: SIZE,
    cards: world.characters,
    mark: brand?.watermark ?? null,
    ...meterAt(timedPart),
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
  colourStrip(shots, dir);
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

/**
 * The colour strip: the first still of each scene, in order, side by side, so the colour of the
 * whole part can be seen at once (step 5, 2026-10-14: a colour plan per scene).
 */
function colourStrip(shots: ReturnType<typeof timedShots>, dir: string) {
  const firsts = shots.filter((s, i) => i === 0 || shots[i - 1]?.scene.id !== s.scene.id);
  const files = firsts.map((s) => path.join(dir, `${s.shot.id}.png`)).filter((f) => existsSync(f));
  if (files.length === 0) return;
  const strip = path.join(partDir, 'stills', `colours-${sizeTag}.png`);
  const tall = 360;
  const r = run('ffmpeg', [
    '-v',
    'error',
    '-y',
    ...files.flatMap((f) => ['-i', f]),
    '-filter_complex',
    files.length === 1
      ? `[0]scale=-2:${tall}[out]`
      : `${files.map((_, k) => `[${k}]scale=-2:${tall},pad=iw+12:ih:0:0:black[s${k}]`).join(';')};${files
          .map((_, k) => `[s${k}]`)
          .join('')}hstack=inputs=${files.length}[out]`,
    '-map',
    '[out]',
    strip,
  ]);
  if (r.status === 0) log(`  ${rel(strip)} (the first shot of each of ${files.length} scenes)`);
  else log(`  could not make the colour strip: ${(r.stderr ?? '').trim().slice(0, 200)}`);
}

/**
 * The rough timed storyboard (step 5, 2026-10-14): every shot's still held for as long as the
 * shot lasts, with the part's sound under it. It takes seconds where a preview takes minutes,
 * so the story, the pace and the sound can be judged before anything is animated.
 */
async function animatic(timedPart: Storyboard) {
  const dir = path.join(partDir, 'stills', sizeTag);
  const mix = path.join(audioDir, 'mix.wav');
  if (!existsSync(mix)) throw new Error('The rough storyboard needs the sound first: run --sound.');
  const fps = 30;
  const shots = timedShots(timedPart, fps);
  const missing = shots.filter((s) => !existsSync(path.join(dir, `${s.shot.id}.png`)));
  if (missing.length) {
    throw new Error(
      `The rough storyboard needs a still of every shot first: run --stills (missing ${missing.map((s) => s.shot.id).join(', ')}).`,
    );
  }
  const outDir = path.join(partDir, 'animatic');
  mkdirSync(outDir, { recursive: true });
  const slug = RUN?.replace(/^\d{4}-\d{2}-\d{2}-/, '') ?? 'video';
  const stem = `${slug}-part-${PART}-${sizeTag}-animatic`;
  const name = `${stem}-v${nextVersion(outDir, stem)}`;
  const out = path.join(outDir, `${name}.mp4`);
  const list = path.join(outDir, `${name}.txt`);
  const still = (id: string) => path.join(dir, `${id}.png`).replace(/\\/g, '/');
  const lines = shots.flatMap((s) => [
    `file '${still(s.shot.id)}'`,
    `duration ${((s.endFrame - s.startFrame) / fps).toFixed(3)}`,
  ]);
  // The last picture is named twice, or the list's last duration is not kept.
  const last = shots.at(-1);
  if (last) lines.push(`file '${still(last.shot.id)}'`);
  writeFileSync(list, `${lines.join('\n')}\n`, 'utf8');
  const { width, height } = SIZES[SIZE];
  const r = run('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    list,
    '-i',
    mix,
    '-vf',
    `${width > height ? 'scale=-2:540' : 'scale=540:-2'},fps=${fps},format=yuv420p`,
    '-c:v',
    'libx264',
    '-tune',
    'stillimage',
    '-crf',
    '23',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-shortest',
    out,
  ]);
  rmSync(list, { force: true });
  if (r.status !== 0)
    throw new Error(
      `The rough storyboard could not be made: ${(r.stderr ?? '').trim().slice(0, 300)}`,
    );
  const seconds = shots.reduce((n, s) => n + (s.endFrame - s.startFrame), 0) / fps;
  log(`  ${rel(out)}: ${shots.length} pictures over ${seconds.toFixed(1)} s, with the sound`);
}

/** A part's renders are never overwritten: each takes the next free version number. */
function nextVersion(outDir: string, name: string): number {
  let v = 1;
  while (existsSync(path.join(outDir, `${name}-v${v}.mp4`))) v++;
  return v;
}

/** A preview is half the size each way and more roughly packed: a quarter of the picture to draw. */
const PREVIEW_SCALE = 0.5;

/**
 * The part as a video. The final one is never written over: each takes the next version
 * number. A preview is a scratch copy to check first (Part 2, section 11, step 9): small
 * and quick, in its own folder, numbered the same way.
 */
async function video(timedPart: Storyboard, preview = false, clip: [number, number] | null = null) {
  const mix = path.join(audioDir, 'mix.wav');
  if (!existsSync(mix)) throw new Error('No sound yet for this part. Run the --sound stage first.');
  const url = await bundled();
  const props = inputProps(timedPart, true);
  const composition = await selectComposition({
    serveUrl: url,
    id: 'Storyboard',
    inputProps: props,
  });
  const outDir = path.join(partDir, clip ? 'clips' : preview ? 'preview' : 'out');
  mkdirSync(outDir, { recursive: true });
  const slug = RUN?.replace(/^\d{4}-\d{2}-\d{2}-/, '') ?? 'video';
  const base = `${slug}-part-${PART}-${sizeTag}`;
  // Numbered like every render: a look at one preview can never stand for the next.
  const stem = clip ? `${base}-${clip[0]}-${clip[1]}s` : preview ? `${base}-preview` : base;
  const name = `${stem}-v${nextVersion(outDir, stem)}`;
  const out = path.join(outDir, `${name}.mp4`);
  const t0 = Date.now();
  await renderMedia({
    composition,
    serveUrl: url,
    codec: 'h264',
    audioCodec: 'aac',
    outputLocation: out,
    inputProps: props,
    ...(preview ? { scale: PREVIEW_SCALE } : {}),
    ...(clip
      ? {
          frameRange: [
            Math.round(clip[0] * composition.fps),
            Math.min(composition.durationInFrames, Math.round(clip[1] * composition.fps)) - 1,
          ] as [number, number],
        }
      : {}),
    concurrency: Math.max(1, Math.min(Math.floor(os.cpus().length / 2), 4)),
  });
  const secs = (Date.now() - t0) / 1000;
  if (clip) {
    log(`  ${rel(out)}: seconds ${clip[0]} to ${clip[1]}, in ${secs.toFixed(1)} s`);
    return;
  }
  const videoSecs = composition.durationInFrames / composition.fps;
  log(
    `  ${rel(out)}: ${videoSecs.toFixed(2)} s of video, ${composition.width * (preview ? PREVIEW_SCALE : 1)}x${composition.height * (preview ? PREVIEW_SCALE : 1)}, in ${secs.toFixed(1)} s (${(secs / videoSecs).toFixed(2)} s per video second)`,
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
  const madeFrom: MadeFrom = {
    video: `${name}.mp4`,
    storyboard: shaOfFile(path.join(partDir, 'storyboard.json')),
    pictures: picturesSha(path.join(partDir, 'storyboard.json')),
    mix: shaOfFile(mix),
    madeAt: new Date().toISOString(),
  };
  writeFileSync(
    path.join(outDir, `${name}.json`),
    `${JSON.stringify(madeFrom, null, 2)}\n`,
    'utf8',
  );
}

/**
 * A new sound on the newest finished video of the part, without drawing a single frame again
 * (Biku, 2026-10-21: "its only changing sounds why take that much time?"). It takes the
 * pictures of that video as they are and lays the mix as it stands under them, as the next
 * version. It refuses when the plan's pictures have changed since that video was made: then
 * only --video will do.
 */
function resound() {
  const mix = path.join(audioDir, 'mix.wav');
  if (!existsSync(mix)) throw new Error('No sound yet for this part. Run the --sound stage first.');
  const outDir = path.join(partDir, 'out');
  const slug = RUN?.replace(/^\d{4}-\d{2}-\d{2}-/, '') ?? 'video';
  const stem = `${slug}-part-${PART}-${sizeTag}`;
  const last = nextVersion(outDir, stem) - 1;
  if (last < 1)
    throw new Error(`There is no finished video of part ${PART} yet. Run --video first.`);
  const from = `${stem}-v${last}`;
  const recordFile = path.join(outDir, `${from}.json`);
  const record = existsSync(recordFile)
    ? (JSON.parse(readFileSync(recordFile, 'utf8')) as MadeFrom)
    : null;
  const storyboardFile = path.join(partDir, 'storyboard.json');
  const pictures = picturesSha(storyboardFile);
  const same =
    record !== null &&
    (record.pictures
      ? record.pictures === pictures
      : record.storyboard === shaOfFile(storyboardFile));
  if (!same) {
    throw new Error(
      `The pictures of part ${PART} have changed since ${from}.mp4 was made, so its pictures cannot be kept. Run --video.`,
    );
  }
  const name = `${stem}-v${last + 1}`;
  const out = path.join(outDir, `${name}.mp4`);
  const r = run('ffmpeg', [
    '-v',
    'error',
    '-y',
    '-i',
    path.join(outDir, `${from}.mp4`),
    '-i',
    mix,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '320k',
    out,
  ]);
  if (r.status !== 0)
    throw new Error(`The new sound could not be put on the video:
${r.stderr}`);
  const srt = path.join(outDir, `${from}.srt`);
  if (existsSync(srt)) copyFileSync(srt, path.join(outDir, `${name}.srt`));
  const madeFrom: MadeFrom = {
    video: `${name}.mp4`,
    storyboard: shaOfFile(storyboardFile),
    pictures,
    mix: shaOfFile(mix),
    madeAt: new Date().toISOString(),
    soundOn: `${from}.mp4`,
  };
  writeFileSync(
    path.join(outDir, `${name}.json`),
    `${JSON.stringify(madeFrom, null, 2)}
`,
    'utf8',
  );
  log(`  ${rel(out)}: the pictures of ${from}.mp4 with the sound as it stands`);
}

async function main() {
  const stages = ['voice', 'time', 'sound', 'stills', 'animatic', 'preview', 'video', 'resound'];
  const clipArg = value('clip');
  const clip = clipArg?.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (clipArg && (!clip || Number(clip[2]) <= Number(clip[1]))) {
    throw new Error('Give the seconds of a clip as --clip=<from>-<to>, for example --clip=9-15');
  }
  if (!stages.some(want) && !clip) {
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
  if (args.has('--animatic')) await timed('animatic', () => animatic(timedPart ?? loadTimed()));
  // A preview is asked for by name; --all makes the stills and the final video.
  if (args.has('--preview')) await timed('preview', () => video(timedPart ?? loadTimed(), true));
  if (want('video')) await timed('video', () => video(timedPart ?? loadTimed()));
  // Asked for by name: a new sound on the pictures already made.
  if (args.has('--resound')) await timed('resound', async () => resound());
  if (clip) {
    const range: [number, number] = [Number(clip[1]), Number(clip[2])];
    await timed('clip', () => video(timedPart ?? loadTimed(), false, range));
  }
}

try {
  await main();
} catch (err) {
  console.log((err as Error).message);
  process.exitCode = 1;
} finally {
  await finishRendering();
}
