/**
 * `npm run qa -- --run=<run> --part=<n> [--size=16:9]`: the self-check of a finished part
 * (Phase 4E; Part 2, section 12).
 *
 * It measures the newest video of the part in that shape (the file plays, the length, picture
 * and voice in step, no dead silence, the loudness, nothing drowning the words, captions that
 * fit, everyone in frame, no face under the title or the captions, feet on the ground, nothing
 * jumping, no picture held too long, things picked up within reach), cuts a strip of frames
 * across every move inside a shot and every cut that keeps someone on screen, and reads what
 * Claude saw when it looked at the stills and the strips (qa-look-<shape>.json in the part's
 * folder). Then it writes the plain-language report: qa-report-<shape>.md.
 *
 * It ends with an error while anything is left to fix, or while the stills and strips of this
 * very video have not been looked at.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  FPS,
  SIZES,
  SIZE_NAMES,
  checkPlan,
  checkStoryboard,
  fileCheck,
  lengthCheck,
  lookChecks,
  loudnessCheck,
  madeFromCheck,
  mixReportSchema,
  parseLoudness,
  parseOrExplain,
  parseProbe,
  parseSilences,
  partCount,
  qaLookSchema,
  qaPage,
  qaReportSchema,
  qaStrips,
  qaVerdict,
  samePicturesCheck,
  silenceCheck,
  soundDifference,
  stepCheck,
  voiceTrackSchema,
  wordsHeardCheck,
} from '@studio/shared';
import type { MadeFrom, QaCheck, QaLook, QaReport, QaStrip, SizeName } from '@studio/shared';
import { captionCheck, pictureChecks } from '../../engine/src/stage/measure';
import { pictureDifference } from './media.js';
import { projectRoot, run } from './system.js';
import { loadStoryboard, loadWorld } from './world.js';

/** Today's date where the studio runs. */
const today = (): string => {
  const d = new Date();
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
};

const argv = process.argv.slice(2);
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const RUN = value('run');
if (!RUN) throw new Error('Give the run folder: --run=<folder name under runs/>');
const PART = Number(value('part') ?? 1);
/** Check the small preview of the part instead of its final video. */
const PREVIEW = argv.includes('--preview');

const runDir = path.join(projectRoot, 'runs', RUN);
const partDir = path.join(runDir, `part-${PART}`);
const outDir = path.join(partDir, PREVIEW ? 'preview' : 'out');
const rel = (file: string) => path.relative(projectRoot, file);
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));

/** The newest video of the part, in the shape asked for or in whichever shape was made last. */
function newestVideo(): { file: string; size: SizeName } {
  const asked = value('size');
  if (asked && !(SIZE_NAMES as readonly string[]).includes(asked)) {
    throw new Error(`--size is one of ${SIZE_NAMES.join(', ')}`);
  }
  const found = (existsSync(outDir) ? readdirSync(outDir) : []).flatMap((name) => {
    const m = (PREVIEW ? /-(\d+)x(\d+)-preview-v(\d+)\.mp4$/ : /-(\d+)x(\d+)-v(\d+)\.mp4$/).exec(
      name,
    );
    if (!m) return [];
    const size = `${m[1]}:${m[2]}` as SizeName;
    if (!(SIZE_NAMES as readonly string[]).includes(size) || (asked && size !== asked)) return [];
    return [{ file: path.join(outDir, name), size, version: Number(m[3]) }];
  });
  const newest = found.sort((a, b) => b.version - a.version)[0];
  if (!newest) {
    throw new Error(
      `There is no ${PREVIEW ? 'preview' : 'video'} of part ${PART}${asked ? ` in ${asked}` : ''} yet. Make it first: npm run make -- --run=${RUN} --part=${PART} --${PREVIEW ? 'preview' : 'video'}`,
    );
  }
  return newest;
}

/** A file's sound as mono samples at a low rate, enough to tell one mix from another. */
const COMPARE_RATE = 8000;
function samplesOf(file: string): Int16Array | null {
  const raw = path.join(
    os.tmpdir(),
    `qa-${createHash('sha1').update(file).digest('hex').slice(0, 10)}.raw`,
  );
  const r = run(
    'ffmpeg',
    [
      '-v',
      'error',
      '-y',
      '-i',
      file,
      '-vn',
      '-ac',
      '1',
      '-ar',
      String(COMPARE_RATE),
      '-f',
      's16le',
      raw,
    ],
    { timeoutMs: 300_000 },
  );
  if (r.status !== 0 || !existsSync(raw)) return null;
  const bytes = readFileSync(raw);
  return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
}

const shaOfFile = (file: string) =>
  createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);

function cutStrips(video: string, strips: readonly QaStrip[], dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const strip of strips) {
    const out = path.join(dir, `${strip.id}.png`);
    if (existsSync(out)) continue;
    const r = run('ffmpeg', [
      '-v',
      'error',
      '-y',
      '-ss',
      (strip.fromMs / 1000).toFixed(3),
      '-t',
      String(strip.seconds),
      '-i',
      video,
      '-vf',
      `fps=${strip.fps},scale=480:-1,tile=6x2`,
      '-frames:v',
      '1',
      out,
    ]);
    if (r.status !== 0) throw new Error(`Could not cut the strip ${strip.id}: ${r.stderr}`);
  }
}

function main(): void {
  const world = loadWorld();
  const whole = loadStoryboard(path.join(runDir, 'storyboard.json'));
  const parts = partCount(whole);
  if (PART < 1 || PART > parts)
    throw new Error(`This video has ${parts} part(s); there is no part ${PART}.`);
  const timedFile = path.join(partDir, 'storyboard.json');
  if (!existsSync(timedFile)) {
    throw new Error(
      `Part ${PART} has no times from its voice yet. Run: npm run make -- --run=${RUN} --part=${PART} --voice --time`,
    );
  }
  const part = loadStoryboard(timedFile);
  const track = parseOrExplain(
    voiceTrackSchema,
    readJson(path.join(partDir, 'audio', 'timings.json')),
    'audio/timings.json',
  );
  const mixFile = path.join(partDir, 'audio', 'mix.json');
  const mix = existsSync(mixFile)
    ? parseOrExplain(mixReportSchema, readJson(mixFile), 'audio/mix.json')
    : null;
  const { file: video, size: sizeName } = newestVideo();
  const full = SIZES[sizeName];
  // A preview is half the size each way; the pictures are measured at full size all the same.
  const size = full;
  const fileSize = PREVIEW ? { width: full.width / 2, height: full.height / 2 } : full;
  const shape = sizeName.replace(':', 'x');
  const format = world.formats[whole.format] ?? null;
  console.log(`Checking ${rel(video)}`);

  // ---- the file itself
  const probed = run('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_streams',
    '-show_format',
    video,
  ]);
  const probe = probed.status === 0 ? parseProbe(probed.stdout) : null;
  const played = run('ffmpeg', ['-v', 'error', '-i', video, '-f', 'null', '-'], {
    timeoutMs: 300_000,
  });
  const heard = run(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      video,
      '-filter_complex',
      'ebur128=peak=true',
      '-f',
      'null',
      '-',
    ],
    { timeoutMs: 300_000 },
  );
  const quiet = run(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      video,
      '-af',
      'silencedetect=noise=-45dB:d=0.5',
      '-f',
      'null',
      '-',
    ],
    { timeoutMs: 300_000 },
  );
  const seconds = probe?.seconds ?? 0;

  // ---- is this video of this plan and this sound?
  const recordFile = video.replace(/\.mp4$/, '.json');
  const record = existsSync(recordFile) ? (readJson(recordFile) as MadeFrom) : null;
  const mixWav = path.join(partDir, 'audio', 'mix.wav');
  const inVideo = samplesOf(video);
  const inMix = existsSync(mixWav) ? samplesOf(mixWav) : null;
  const sound = inVideo && inMix ? soundDifference(inVideo, inMix, COMPARE_RATE) : null;

  // ---- the plan it was built from
  const planned = checkPlan(whole, world);
  const named = checkStoryboard(whole, world);
  const plan: QaCheck = {
    id: 'plan',
    title: "The plan's own checks still pass",
    by: 'measured',
    detail: `every name in the library, the staging rules, the format's beats, for all ${planned.shots} shots of the video`,
    findings: [
      ...[...named.problems, ...planned.problems].map((text) => ({
        level: 'problem' as const,
        text,
      })),
      ...planned.notes.map((text) => ({ level: 'note' as const, text })),
    ],
  };

  // ---- what Claude saw
  const strips = qaStrips(part);
  const stripDir = path.join(partDir, 'qa', path.basename(video, '.mp4'));
  cutStrips(video, strips, stripDir);
  const lookFile = path.join(partDir, `qa-look-${shape}.json`);
  const look: QaLook | null = existsSync(lookFile)
    ? parseOrExplain(qaLookSchema, readJson(lookFile), rel(lookFile))
    : null;
  const shotIds = part.scenes.flatMap((scene) => scene.shots.map((s) => s.id));
  const videoName = path.basename(video);
  // A look taken at another render of this part stands for this one if the two show the same
  // pictures, frame for frame: a preview for its final video, an earlier render for a later.
  let same: QaCheck | null = null;
  if (look && look.video !== videoName) {
    const other = [
      path.join(partDir, 'out', look.video),
      path.join(partDir, 'preview', look.video),
    ].find((f) => existsSync(f));
    if (other) {
      const values = pictureDifference(other, video);
      const otherProbe = parseProbe(
        run('ffprobe', [
          '-v',
          'error',
          '-print_format',
          'json',
          '-show_streams',
          '-show_format',
          other,
        ]).stdout,
      );
      same = samePicturesCheck({
        looked: look.video,
        video: videoName,
        values,
        frames: {
          looked: Math.round((otherProbe?.seconds ?? 0) * FPS),
          video: Math.round(seconds * FPS),
        },
        fps: FPS,
      });
    }
  }
  const carried = same !== null && same.findings.length === 0;
  const looked = look && (look.video === videoName || carried) ? look : null;

  const input = {
    storyboard: part,
    track,
    size,
    cards: world.characters,
    fps: FPS,
    mark: world.brands[whole.brand]?.watermark ?? null,
  };
  const report: QaReport = qaReportSchema.parse({
    version: 1,
    title: whole.title,
    part: PART,
    parts,
    size: sizeName,
    video: videoName,
    seconds,
    checkedOn: today(),
    checks: [
      fileCheck({ probe, decodeErrors: `${played.stderr ?? ''}`, size: fileSize, fps: FPS }),
      madeFromCheck({ record, storyboard: shaOfFile(timedFile), sound }),
      lengthCheck({ seconds, parts, format }),
      stepCheck({ storyboard: part, track, videoSeconds: seconds }),
      silenceCheck({ silences: parseSilences(`${quiet.stderr ?? ''}`, seconds * 1000), track }),
      loudnessCheck({ measured: parseLoudness(`${heard.stderr ?? ''}`) }),
      wordsHeardCheck({ mix, track }),
      captionCheck(track, size),
      ...pictureChecks(input, format ? { maxShotS: format.shotLength.max } : {}),
      plan,
      ...(same ? [same] : []),
      ...lookChecks({
        look,
        video: carried && look ? look.video : videoName,
        shots: shotIds,
        strips: strips.map((s) => s.id),
      }),
    ],
    fixed: looked?.fixed ?? [],
    notes: looked?.notes ?? [],
  });

  writeFileSync(
    path.join(partDir, `qa-${shape}.json`),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  const page = path.join(partDir, `qa-report-${shape}.md`);
  writeFileSync(page, qaPage(report), 'utf8');

  const verdict = qaVerdict(report);
  const worth = verdict.notes + report.notes.length;
  for (const check of report.checks) {
    const bad = check.findings.filter((f) => f.level === 'problem').length;
    console.log(`  ${bad ? 'FIX ' : 'ok  '} ${check.title}: ${check.detail}`);
    for (const f of check.findings) {
      console.log(`        ${f.level}: ${f.text}${f.shot ? ` (${f.shot})` : ''}`);
    }
  }
  if (!looked) {
    const sheets = path.join(partDir, 'stills');
    console.log('\nTo look at before this part can pass:');
    console.log(`  the stills, one per shot: ${rel(sheets)} (sheet-${shape}-*.png)`);
    console.log(`  ${strips.length} strips of frames: ${rel(stripDir)}`);
    for (const s of strips) console.log(`    ${s.id}: ${s.what}`);
    console.log(`  then write what you saw in ${rel(lookFile)} (video: "${videoName}")`);
  }
  console.log(`\n${rel(page)}`);
  console.log(
    verdict.ready
      ? `Ready to show: every check passed${worth ? `, ${worth} thing(s) worth a second look` : ''}.`
      : `Not ready: ${verdict.problems} thing(s) to fix.`,
  );
  if (!verdict.ready) process.exitCode = 1;
}

main();
