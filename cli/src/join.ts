/**
 * `npm run join -- --run=<run> [--size=16:9]`: joins the finished parts of a video into one
 * (the first piece of Phase 4F).
 *
 * It takes the newest video of every part in that shape. Each has to have passed its own
 * self-check as that very video (`npm run qa`); a part that has not is named and nothing is
 * joined. Where a part opens on a fade from dark, the part before it goes dark first, so the
 * join is one dip. The sound dips for a moment at each join. The joined video and one captions
 * file for the whole of it go to runs/<run>/out/, under the next version number; nothing is
 * ever written over. Then the joined file itself is checked: it plays, its length is the sum
 * of its parts, its loudness is on target and it has no dead silence.
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { serializeSrt } from '@remotion/captions';
import {
  FPS,
  SIZES,
  SIZE_NAMES,
  checkResult,
  fileCheck,
  joinFilter,
  joinTracks,
  loudnessCheck,
  parseLoudness,
  parseOrExplain,
  parseProbe,
  parseSilences,
  partCount,
  qaReportSchema,
  qaVerdict,
  silenceCheck,
  voiceTrackSchema,
} from '@studio/shared';
import type { QaCheck, SizeName, VoiceTrack } from '@studio/shared';
import { buildPages, toCaptions } from '../../engine/src/overlays/captionPages';
import { projectRoot, run } from './system.js';
import { loadStoryboard } from './world.js';

const argv = process.argv.slice(2);
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const RUN = value('run');
if (!RUN) throw new Error('Give the run folder: --run=<folder name under runs/>');
const SIZE = (value('size') ?? '16:9') as SizeName;
if (!(SIZE_NAMES as readonly string[]).includes(SIZE)) {
  throw new Error(`--size is one of ${SIZE_NAMES.join(', ')}`);
}

const runDir = path.join(projectRoot, 'runs', RUN);
const outDir = path.join(runDir, 'out');
const shape = SIZE.replace(':', 'x');
const rel = (file: string) => path.relative(projectRoot, file);
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const log = (msg: string) => {
  console.log(msg);
  appendFileSync(path.join(runDir, 'log.txt'), `${new Date().toISOString()}  join  ${msg}\n`);
};

/** The newest video of a part in this shape, if there is one. */
function newestOf(part: number): string | null {
  const dir = path.join(runDir, `part-${part}`, 'out');
  const found = (existsSync(dir) ? readdirSync(dir) : []).flatMap((name) => {
    const m = new RegExp(`-${shape}-v(\\d+)\\.mp4$`).exec(name);
    return m ? [{ file: path.join(dir, name), version: Number(m[1]) }] : [];
  });
  return found.sort((a, b) => b.version - a.version)[0]?.file ?? null;
}

function nextVersion(base: string): number {
  let v = 1;
  while (existsSync(path.join(outDir, `${base}-v${v}.mp4`))) v++;
  return v;
}

function main(): void {
  const whole = loadStoryboard(path.join(runDir, 'storyboard.json'));
  const parts = partCount(whole);
  if (parts < 2) throw new Error('This video has one part; there is nothing to join.');

  // ---- every part finished, and passed as the very video being joined
  const pieces: Array<{ file: string; track: VoiceTrack; fadesIn: boolean; seconds: number }> = [];
  const notReady: string[] = [];
  for (let part = 1; part <= parts; part++) {
    const partDir = path.join(runDir, `part-${part}`);
    const file = newestOf(part);
    if (!file) {
      notReady.push(`part ${part} has no video in ${SIZE} yet`);
      continue;
    }
    const checked = path.join(partDir, `qa-${shape}.json`);
    const report = existsSync(checked)
      ? parseOrExplain(qaReportSchema, readJson(checked), rel(checked))
      : null;
    if (!report || report.video !== path.basename(file)) {
      notReady.push(`part ${part}: ${path.basename(file)} has not been through the self-check`);
    } else if (!qaVerdict(report).ready) {
      notReady.push(
        `part ${part}: the self-check of ${path.basename(file)} still has things to fix`,
      );
    }
    const probe = parseProbe(
      run('ffprobe', [
        '-v',
        'error',
        '-print_format',
        'json',
        '-show_streams',
        '-show_format',
        file,
      ]).stdout,
    );
    const timed = loadStoryboard(path.join(partDir, 'storyboard.json'));
    pieces.push({
      file,
      track: parseOrExplain(
        voiceTrackSchema,
        readJson(path.join(partDir, 'audio', 'timings.json')),
        'audio/timings.json',
      ),
      fadesIn: timed.scenes[0]?.shots[0]?.transition === 'fade',
      seconds: probe?.seconds ?? 0,
    });
  }
  if (notReady.length) {
    throw new Error(
      `The parts cannot be joined yet:\n${notReady.map((n) => `  - ${n}`).join('\n')}`,
    );
  }

  // ---- join
  mkdirSync(outDir, { recursive: true });
  const slug = RUN?.replace(/^\d{4}-\d{2}-\d{2}-/, '') ?? 'video';
  const base = `${slug}-${shape}`;
  const name = `${base}-v${nextVersion(base)}`;
  const out = path.join(outDir, `${name}.mp4`);
  for (const p of pieces) log(`  ${rel(p.file)} (${p.seconds.toFixed(2)} s)`);
  const joined = run(
    'ffmpeg',
    [
      '-v',
      'error',
      '-n',
      ...pieces.flatMap((p) => ['-i', p.file]),
      '-filter_complex',
      joinFilter(pieces),
      '-map',
      '[v]',
      '-map',
      '[a]',
      '-r',
      String(FPS),
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      '14',
      '-c:a',
      'aac',
      '-b:a',
      '256k',
      '-movflags',
      '+faststart',
      out,
    ],
    { timeoutMs: 900_000 },
  );
  if (joined.status !== 0 || !existsSync(out)) {
    throw new Error(`The parts could not be joined:\n${joined.stderr}`);
  }

  // ---- one captions file for the whole video
  const starts = pieces.map((_, i) =>
    Math.round(pieces.slice(0, i).reduce((sum, p) => sum + p.seconds, 0) * 1000),
  );
  const track = joinTracks(
    pieces.map((p) => p.track),
    starts,
  );
  const pages = buildPages(toCaptions(track.words));
  writeFileSync(
    path.join(outDir, `${name}.srt`),
    serializeSrt({
      lines: pages.map((p) =>
        p.lines.flat().map((w, i) => (i === 0 ? { ...w, text: w.text.trim() } : w)),
      ),
    }),
  );

  // ---- the joined file itself, checked
  const size = SIZES[SIZE];
  const probe = parseProbe(
    run('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', out])
      .stdout,
  );
  const played = run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], {
    timeoutMs: 600_000,
  });
  const heard = run(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      out,
      '-filter_complex',
      'ebur128=peak=true',
      '-f',
      'null',
      '-',
    ],
    { timeoutMs: 600_000 },
  );
  const quiet = run(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      out,
      '-af',
      'silencedetect=noise=-45dB:d=0.5',
      '-f',
      'null',
      '-',
    ],
    { timeoutMs: 600_000 },
  );
  const total = pieces.reduce((sum, p) => sum + p.seconds, 0);
  const seconds = probe?.seconds ?? 0;
  const length: QaCheck = {
    id: 'length',
    title: 'It is as long as its parts together',
    by: 'measured',
    detail: `${seconds.toFixed(1)} s; the ${pieces.length} parts add up to ${total.toFixed(1)} s`,
    findings:
      Math.abs(seconds - total) > 0.1
        ? [
            {
              level: 'problem',
              text: `the joined video is ${seconds.toFixed(2)} s but its parts add up to ${total.toFixed(2)} s`,
            },
          ]
        : [],
  };
  const checks = [
    fileCheck({ probe, decodeErrors: `${played.stderr ?? ''}`, size, fps: FPS }),
    length,
    silenceCheck({ silences: parseSilences(`${quiet.stderr ?? ''}`, seconds * 1000), track }),
    loudnessCheck({ measured: parseLoudness(`${heard.stderr ?? ''}`) }),
  ];
  log(`  ${rel(out)}: ${seconds.toFixed(2)} s, ${size.width}x${size.height}`);
  log(`  ${rel(path.join(outDir, `${name}.srt`))}`);
  let bad = 0;
  for (const check of checks) {
    const failed = checkResult(check) === 'failed';
    if (failed) bad += 1;
    log(`  ${failed ? 'FIX ' : 'ok  '} ${check.title}: ${check.detail}`);
    for (const f of check.findings) log(`        ${f.level}: ${f.text}`);
  }
  if (bad) process.exitCode = 1;
}

main();
