/**
 * `npm run short -- --run=<run folder> <stages>`: builds a hand-built short video.
 *
 * The run folder holds voice-script.json and shots.json (composition id, output name, and the
 * voice line each shot opens on). Stages, run in this order when given:
 *   --voice      speak voice-script.json into audio/voice.wav and audio/timings.json
 *   --stills     render one still per shot into stills/ (look at these before the video)
 *   --video      render out/<output>-v<N>.mp4 and .srt; N is the next free version number
 *   --all        voice, stills and video
 * `--at=0.6` moves the still to that fraction of each shot. Every stage logs to log.txt.
 */
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serializeSrt } from '@remotion/captions';
import { parseOrExplain, voiceTrackSchema } from '@studio/shared';
import type { VoiceTrack } from '@studio/shared';
import { shotTimesFor } from '../../engine/src/compositions/shotPlan';
import { buildPages, toCaptions } from '../../engine/src/overlays/captionPages';
import { bundle, finishRendering, renderMedia, renderStill, selectComposition } from './render.js';
import { projectRoot, run } from './system.js';

type ShotsFile = {
  composition: string;
  output: string;
  shots: Array<{ line: string; title: string }>;
};

const argv = process.argv.slice(2);
const args = new Set(argv);
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const RUN = value('run');
if (!RUN) throw new Error('Give the run folder: --run=<folder name under runs/>');
const stillAt = Number(value('at') ?? 0.6);

const runDir = path.join(projectRoot, 'runs', RUN);
const engineDir = path.join(projectRoot, 'engine');
const publicDir = path.join(engineDir, 'public');
const publicRun = path.join(publicDir, 'runs', RUN);
const audioProject = path.join(projectRoot, 'audio');

const all = args.has('--all');
const want = (s: string) => all || args.has(`--${s}`);

const log = (msg: string) => {
  console.log(msg);
  appendFileSync(path.join(runDir, 'log.txt'), `${new Date().toISOString()}  ${msg}\n`);
};

async function timed<T>(stage: string, fn: () => Promise<T> | T): Promise<T> {
  const t0 = Date.now();
  log(`${stage}: start`);
  const result = await fn();
  log(`${stage}: done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return result;
}

function voice() {
  const r = run(
    'uv',
    [
      'run',
      'python',
      '-m',
      'studio_audio.voice',
      'synth',
      '--script',
      path.join(runDir, 'voice-script.json'),
      '--out',
      path.join(runDir, 'audio'),
    ],
    { cwd: audioProject, timeoutMs: 60 * 60_000 },
  );
  if (r.status !== 0) {
    console.error(r.stderr);
    throw new Error(`The voice worker failed (exit code ${r.status}).`);
  }
  const out = `${r.stdout ?? ''}`
    .trim()
    .split(/\r?\n/)
    .filter((l) => !/warn|LSTM|WeightNorm/i.test(l));
  for (const l of out.slice(-3)) log(`  ${l}`);
}

function loadTrack(): VoiceTrack {
  const file = path.join(runDir, 'audio', 'timings.json');
  if (!existsSync(file)) throw new Error('No voice track yet. Run the --voice stage first.');
  return parseOrExplain(
    voiceTrackSchema,
    JSON.parse(readFileSync(file, 'utf8')),
    'audio/timings.json',
  );
}

function loadShots(): ShotsFile {
  return JSON.parse(readFileSync(path.join(runDir, 'shots.json'), 'utf8')) as ShotsFile;
}

let serveUrl: string | null = null;
async function bundled() {
  if (!serveUrl) {
    mkdirSync(publicRun, { recursive: true });
    copyFileSync(path.join(runDir, 'audio', 'voice.wav'), path.join(publicRun, 'voice.wav'));
    serveUrl = await timed('bundle', () =>
      bundle({ entryPoint: path.join(engineDir, 'src', 'index.ts'), publicDir }),
    );
  }
  return serveUrl;
}

async function stills(track: VoiceTrack, plan: ShotsFile) {
  const url = await bundled();
  const shotLines = plan.shots.map((s) => s.line);
  const inputProps = { track, audioSrc: null, shotLines };
  const composition = await selectComposition({ serveUrl: url, id: plan.composition, inputProps });
  mkdirSync(path.join(runDir, 'stills'), { recursive: true });
  for (const s of shotTimesFor(track, shotLines)) {
    const frame = Math.round(
      ((s.startMs + (s.endMs - s.startMs) * stillAt) / 1000) * composition.fps,
    );
    const out = path.join(runDir, 'stills', `${s.id}.png`);
    await renderStill({ composition, serveUrl: url, output: out, frame, inputProps });
    log(`  still ${s.id} at frame ${frame}: ${path.relative(projectRoot, out)}`);
  }
}

/** Delivered outputs are never overwritten: each render takes the next free version number. */
function nextVersion(outDir: string, name: string): number {
  let v = 1;
  while (existsSync(path.join(outDir, `${name}-v${v}.mp4`))) v++;
  return v;
}

async function video(track: VoiceTrack, plan: ShotsFile) {
  const url = await bundled();
  const shotLines = plan.shots.map((s) => s.line);
  const inputProps = { track, audioSrc: `runs/${RUN}/voice.wav`, shotLines };
  const composition = await selectComposition({ serveUrl: url, id: plan.composition, inputProps });
  const outDir = path.join(runDir, 'out');
  mkdirSync(outDir, { recursive: true });
  const name = `${plan.output}-v${nextVersion(outDir, plan.output)}`;
  const out = path.join(outDir, `${name}.mp4`);
  const t0 = Date.now();
  await renderMedia({
    composition,
    serveUrl: url,
    codec: 'h264',
    audioCodec: 'aac',
    outputLocation: out,
    inputProps,
    concurrency: Math.max(1, Math.min(Math.floor(os.cpus().length / 2), 4)),
  });
  const secs = (Date.now() - t0) / 1000;
  const videoSecs = composition.durationInFrames / composition.fps;
  log(
    `  ${path.relative(projectRoot, out)}: ${videoSecs.toFixed(2)} s of video in ${secs.toFixed(1)} s (${(secs / videoSecs).toFixed(2)} s per video second)`,
  );
  // Captions file from the same pages the video shows.
  const pages = buildPages(toCaptions(track.words));
  const srt = serializeSrt({
    lines: pages.map((p) =>
      p.lines.flat().map((w, i) => (i === 0 ? { ...w, text: w.text.trim() } : w)),
    ),
  });
  writeFileSync(path.join(outDir, `${name}.srt`), srt);
  log(`  ${path.relative(projectRoot, path.join(outDir, `${name}.srt`))}`);
}

async function main() {
  if (!want('voice') && !want('stills') && !want('video')) {
    console.log('Give at least one stage: --voice --stills --video or --all');
    process.exitCode = 1;
    return;
  }
  if (want('voice')) await timed('voice', voice);
  const track = want('stills') || want('video') ? loadTrack() : null;
  const plan = loadShots();
  if (track && want('stills')) await timed('stills', () => stills(track, plan));
  if (track && want('video')) await timed('video', () => video(track, plan));
}

try {
  await main();
} finally {
  await finishRendering();
}
