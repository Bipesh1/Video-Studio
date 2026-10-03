/**
 * `npm run look-test -- <stages>`: builds the Phase 1 look test (Part 2, section 18).
 *
 * Stages, run in this order when given:
 *   --voice      speak runs/<run>/voice-script.json into audio/voice.wav and audio/timings.json
 *   --stills     render one still per shot into stills/ (look at these before the video)
 *   --video      render out/look-test.mp4 (1080x1920, 30 fps, H.264, AAC) and out/look-test.srt
 *   --match      render the style match sheets from style-check.json into out/
 *   --audition   the same lines in every American English Kokoro voice, into the audition run
 *   --all        voice, stills, video and match
 * Every stage logs its timing to runs/<run>/log.txt.
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
import { bundle } from '@remotion/bundler';
import { serializeSrt } from '@remotion/captions';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { parseOrExplain, voiceTrackSchema } from '@studio/shared';
import type { VoiceTrack } from '@studio/shared';
import { SHOT_TITLES, shotTimes } from '../../engine/src/compositions/lookTestPlan';
import { buildPages, toCaptions } from '../../engine/src/overlays/captionPages';
import { projectRoot, run } from './system.js';

const RUN = '2026-10-03-look-test';
const AUDITION_RUN = '2026-10-03-voice-audition';
const runDir = path.join(projectRoot, 'runs', RUN);
const engineDir = path.join(projectRoot, 'engine');
const publicDir = path.join(engineDir, 'public');
const publicRun = path.join(publicDir, 'runs', RUN);
const audioProject = path.join(projectRoot, 'audio');

const args = new Set(process.argv.slice(2));
const all = args.has('--all');
const want = (s: string) => all || args.has(`--${s}`);

const log = (msg: string) => {
  const line = `${new Date().toISOString()}  ${msg}`;
  console.log(msg);
  mkdirSync(runDir, { recursive: true });
  appendFileSync(path.join(runDir, 'log.txt'), `${line}\n`);
};

async function timed<T>(stage: string, fn: () => Promise<T> | T): Promise<T> {
  const t0 = Date.now();
  log(`${stage}: start`);
  const result = await fn();
  log(`${stage}: done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  return result;
}

function python(args: string[]) {
  const r = run('uv', ['run', 'python', '-m', 'studio_audio.voice', ...args], {
    cwd: audioProject,
    timeoutMs: 60 * 60_000,
  });
  const out = `${r.stdout ?? ''}`
    .trim()
    .split(/\r?\n/)
    .filter((l) => !/warn|LSTM|WeightNorm/i.test(l));
  if (r.status !== 0) {
    console.error(r.stderr);
    throw new Error(`The voice worker failed (exit code ${r.status}).`);
  }
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

/** Copy what the renderer needs into the engine's public folder. */
function stagePublicFiles() {
  mkdirSync(path.join(publicRun, 'stills'), { recursive: true });
  copyFileSync(path.join(runDir, 'audio', 'voice.wav'), path.join(publicRun, 'voice.wav'));
  const refDir = path.join(publicDir, 'reference');
  mkdirSync(refDir, { recursive: true });
  for (const f of ['reference-a-king.jpeg', 'reference-b-night-scene.jpeg']) {
    copyFileSync(
      path.join(projectRoot, 'styles', 'ink-stick', 'reference', f),
      path.join(refDir, f),
    );
  }
}

let serveUrl: string | null = null;
async function bundled() {
  if (!serveUrl) {
    stagePublicFiles();
    serveUrl = await timed('bundle', () =>
      bundle({ entryPoint: path.join(engineDir, 'src', 'index.ts'), publicDir }),
    );
  }
  return serveUrl;
}

async function stills(track: VoiceTrack) {
  const url = await bundled();
  const inputProps = { track, audioSrc: null };
  const composition = await selectComposition({ serveUrl: url, id: 'LookTest', inputProps });
  mkdirSync(path.join(runDir, 'stills'), { recursive: true });
  for (const s of shotTimes(track)) {
    // A frame 60% into the shot: past the cut, while the words are on screen.
    const frame = Math.round(((s.startMs + (s.endMs - s.startMs) * 0.6) / 1000) * composition.fps);
    const out = path.join(runDir, 'stills', `${s.id}.png`);
    await renderStill({ composition, serveUrl: url, output: out, frame, inputProps });
    copyFileSync(out, path.join(publicRun, 'stills', `${s.id}.png`));
    log(`  still ${s.id} at frame ${frame}: ${path.relative(projectRoot, out)}`);
  }
}

async function video(track: VoiceTrack) {
  const url = await bundled();
  const inputProps = { track, audioSrc: `runs/${RUN}/voice.wav` };
  const composition = await selectComposition({ serveUrl: url, id: 'LookTest', inputProps });
  const outDir = path.join(runDir, 'out');
  mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, 'look-test.mp4');
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
  writeFileSync(path.join(outDir, 'look-test.srt'), srt);
  log(`  ${path.relative(projectRoot, path.join(outDir, 'look-test.srt'))}`);
}

type StyleCheckFile = {
  shots: Array<{
    id: keyof typeof SHOT_TITLES;
    summary: string;
    checks: Array<{ n: number; question: string; answer: 'yes' | 'no' | 'n/a'; note: string }>;
  }>;
};

async function match() {
  const file = path.join(runDir, 'style-check.json');
  if (!existsSync(file))
    throw new Error('No style-check.json yet. Look at the stills and write it first.');
  const data = JSON.parse(readFileSync(file, 'utf8')) as StyleCheckFile;
  const url = await bundled();
  for (const shot of data.shots) {
    if (!existsSync(path.join(publicRun, 'stills', `${shot.id}.png`))) {
      copyFileSync(
        path.join(runDir, 'stills', `${shot.id}.png`),
        path.join(publicRun, 'stills', `${shot.id}.png`),
      );
    }
    const inputProps = {
      title: SHOT_TITLES[shot.id],
      stillSrc: `runs/${RUN}/stills/${shot.id}.png`,
      checks: shot.checks,
      summary: shot.summary,
    };
    const composition = await selectComposition({ serveUrl: url, id: 'StyleMatch', inputProps });
    const out = path.join(runDir, 'out', `style-match-${shot.id}.png`);
    mkdirSync(path.dirname(out), { recursive: true });
    await renderStill({ composition, serveUrl: url, output: out, inputProps });
    log(`  ${path.relative(projectRoot, out)}`);
  }
}

async function faceMatch() {
  const url = await bundled();
  const composition = await selectComposition({ serveUrl: url, id: 'FaceMatch', inputProps: {} });
  const out = path.join(runDir, 'out', 'face-match.png');
  mkdirSync(path.dirname(out), { recursive: true });
  await renderStill({ composition, serveUrl: url, output: out, inputProps: {} });
  log(`  ${path.relative(projectRoot, out)}`);
}

async function audition() {
  const script = JSON.parse(readFileSync(path.join(runDir, 'voice-script.json'), 'utf8')) as {
    lines: Array<{ id: string; text: string }>;
  };
  const lines = script.lines.filter((l) => l.id === 'n1' || l.id === 'd1').map((l) => l.text);
  const outDir = path.join(projectRoot, 'runs', AUDITION_RUN, 'out');
  python(['audition', '--out', outDir, ...lines.flatMap((l) => ['--line', l])]);
}

async function main() {
  if (![...args].length) {
    console.log('Give at least one stage: --voice --stills --video --match --audition or --all');
    process.exitCode = 1;
    return;
  }
  if (want('voice')) {
    await timed('voice', () =>
      python([
        'synth',
        '--script',
        path.join(runDir, 'voice-script.json'),
        '--out',
        path.join(runDir, 'audio'),
      ]),
    );
  }
  const needsTrack = want('stills') || want('video');
  const track = needsTrack ? loadTrack() : null;
  if (track && want('stills')) await timed('stills', () => stills(track));
  if (track && want('video')) await timed('video', () => video(track));
  if (want('match')) await timed('match', match);
  if (want('match') || args.has('--faces')) await timed('faces', faceMatch);
  if (args.has('--audition')) await timed('audition', audition);
}

await main();
