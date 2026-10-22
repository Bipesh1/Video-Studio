/**
 * `npm run output -- --run=<run> [--sizes=16:9,9:16] [--vertical=full|teaser] [--cover=words]`:
 * the finished files of a video, ready to upload (Phase 4F).
 *
 * A video is delivered in the shapes its page usually takes (the brand file), or in the ones
 * given here, which are then kept in the run's own file. The vertical shape is the whole video
 * or a teaser, its first part alone. For each file it:
 *   - takes the newest video of every part in that shape; each has to have passed its own
 *     self-check as that very video (`npm run qa`), or the file waits and says what for
 *   - mixes the sound once for the whole video, so music runs on across the joins
 *   - joins the pictures, going dark before a part that opens on a fade, and adds the page's
 *     closing card when the brand has one
 *   - writes one captions file and draws the cover picture
 *   - checks the finished file: it plays, its pictures are the parts that passed, its sound is
 *     the mix, the loudness, no dead silence, nothing drowning the words
 * Then it writes `delivery.md`, the page that says what to upload where. Nothing is ever
 * written over: every file takes the next version number.
 */
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { serializeSrt } from '@remotion/captions';
import {
  COVER_WIDE,
  FPS,
  JOIN_DIP_S,
  SAME_PICTURE,
  SIZES,
  SIZE_NAMES,
  SOUND_MATCH_DB,
  VERTICAL_CUTS,
  checkResult,
  clock,
  deliveryPage,
  fileCheck,
  joinFilter,
  joinTracks,
  loudnessCheck,
  mergeSoundPlans,
  mixReportSchema,
  outputChoiceSchema,
  outputCuts,
  outputLookCheck,
  outputLookSchema,
  parseOrExplain,
  partCount,
  qaReportSchema,
  qaVerdict,
  silenceCheck,
  soundDifference,
  soundPlanSchema,
  voiceTrackSchema,
  wordsHeardCheck,
} from '@studio/shared';
import type {
  Cut,
  Delivered,
  OutputChoice,
  QaCheck,
  SizeName,
  Storyboard,
  VerticalCut,
  VoiceTrack,
} from '@studio/shared';
import { buildPages, toCaptions } from '../../engine/src/overlays/captionPages';
import {
  COMPARE_RATE,
  decodeErrors,
  loudnessOf,
  pictureDifference,
  probeFile,
  samplesOf,
  shaOfFile,
  silencesOf,
} from './media.js';
import { bundle, finishRendering, renderMedia, renderStill, selectComposition } from './render.js';
import { mixRun } from './sound-stage.js';
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
/** The cover's title style; left out, `side`: beside the picture when wide, across the bottom when tall. */
const COVER_LAYOUT = value('cover') ?? 'side';

const runDir = path.join(projectRoot, 'runs', RUN);
const outDir = path.join(runDir, 'out');
const engineDir = path.join(projectRoot, 'engine');
const rel = (file: string) => path.relative(projectRoot, file);
const readJson = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const tag = (size: SizeName) => size.replace(':', 'x');
const log = (msg: string) => {
  console.log(msg);
  appendFileSync(path.join(runDir, 'log.txt'), `${new Date().toISOString()}  output  ${msg}\n`);
};

const world = loadWorld();
const whole = loadStoryboard(path.join(runDir, 'storyboard.json'));
const parts = partCount(whole);
const brand = world.brands[whole.brand];
const slug = RUN.replace(/^\d{4}-\d{2}-\d{2}-/, '');

/** The shapes to deliver: given here, or kept from before in the run's file, or the page's usual. */
function choice(): OutputChoice {
  const runFile = path.join(runDir, 'run.json');
  const kept = existsSync(runFile) ? (readJson(runFile) as Record<string, unknown>) : {};
  const sizes = value('sizes')?.split(',') ?? kept['sizes'] ?? brand?.defaults.sizes ?? ['16:9'];
  const vertical = value('vertical') ?? kept['vertical'] ?? brand?.defaults.vertical ?? 'full';
  const chosen = parseOrExplain(
    outputChoiceSchema,
    { sizes, vertical },
    `the shapes to deliver (sizes: ${SIZE_NAMES.join(', ')}; vertical: ${VERTICAL_CUTS.join(' or ')})`,
  );
  if ((value('sizes') || value('vertical')) && existsSync(runFile)) {
    writeFileSync(runFile, `${JSON.stringify({ ...kept, ...chosen }, null, 2)}\n`, 'utf8');
  }
  return chosen;
}

type Piece = {
  part: number;
  file: string;
  seconds: number;
  fadesIn: boolean;
  track: VoiceTrack;
  storyboard: Storyboard;
};

/** The newest video of a part in a shape, if there is one. */
function newestOf(part: number, size: SizeName): string | null {
  const dir = path.join(runDir, `part-${part}`, 'out');
  const found = (existsSync(dir) ? readdirSync(dir) : []).flatMap((name) => {
    const m = new RegExp(`-${tag(size)}-v(\\d+)\\.mp4$`).exec(name);
    return m ? [{ file: path.join(dir, name), version: Number(m[1]) }] : [];
  });
  return found.sort((a, b) => b.version - a.version)[0]?.file ?? null;
}

/** The parts of a cut, each finished and passed as the very video that will be used. */
function piecesOf(cut: Cut): { pieces: Piece[]; why: string[]; notes: string[] } {
  const pieces: Piece[] = [];
  const why: string[] = [];
  const notes: string[] = [];
  for (const part of cut.parts) {
    const partDir = path.join(runDir, `part-${part}`);
    const file = newestOf(part, cut.size);
    if (!file) {
      why.push(
        `part ${part} has no video in ${cut.size} yet (npm run make -- --run=${RUN} --part=${part} --size=${cut.size} --preview, check it, then --video)`,
      );
      continue;
    }
    const checked = path.join(partDir, `qa-${tag(cut.size)}.json`);
    const report = existsSync(checked)
      ? parseOrExplain(qaReportSchema, readJson(checked), rel(checked))
      : null;
    if (!report || report.video !== path.basename(file)) {
      why.push(
        `part ${part}: ${path.basename(file)} has not been through the self-check (npm run qa)`,
      );
      continue;
    }
    if (!qaVerdict(report).ready) {
      why.push(`part ${part}: the self-check of ${path.basename(file)} still has things to fix`);
      continue;
    }
    notes.push(...report.notes);
    const storyboard = loadStoryboard(path.join(partDir, 'storyboard.json'));
    pieces.push({
      part,
      file,
      seconds: probeFile(file)?.seconds ?? 0,
      fadesIn: storyboard.scenes[0]?.shots[0]?.transition === 'fade',
      track: parseOrExplain(
        voiceTrackSchema,
        readJson(path.join(partDir, 'audio', 'timings.json')),
        'audio/timings.json',
      ),
      storyboard,
    });
  }
  return { pieces, why, notes };
}

/** Seconds the page's closing card adds after the last shot. */
const closingSeconds = brand?.closingCard?.seconds ?? 0;

/**
 * The sound of a whole cut, mixed once: the parts' voices end to end, each exactly as long as
 * its pictures, and one sound plan across them all. Made in runs/<run>/cuts/<kind>/.
 */
function soundOf(kind: VerticalCut, pieces: readonly Piece[]): { dir: string; track: VoiceTrack } {
  const dir = path.join(runDir, 'cuts', kind);
  const audioDir = path.join(dir, 'audio');
  mkdirSync(audioDir, { recursive: true });
  const starts = pieces.map((_, i) =>
    Math.round(pieces.slice(0, i).reduce((sum, p) => sum + p.seconds, 0) * 1000),
  );
  const total = pieces.reduce((sum, p) => sum + p.seconds, 0) + closingSeconds;
  const track: VoiceTrack = {
    ...joinTracks(
      pieces.map((p) => p.track),
      starts,
    ),
    durationMs: Math.round(total * 1000),
  };
  const plan = mergeSoundPlans(
    pieces.map((p) =>
      parseOrExplain(
        soundPlanSchema,
        readJson(path.join(runDir, `part-${p.part}`, 'sound-plan.json')),
        'sound-plan.json',
      ),
    ),
    starts,
  );
  const write = (file: string, text: string) => {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== text) writeFileSync(file, text, 'utf8');
  };
  const voices = pieces.map((p) => path.join(runDir, `part-${p.part}`, 'audio', 'voice.wav'));
  const voice = path.join(audioDir, 'voice.wav');
  // Made again only when a part's voice is newer: the mix skips work its inputs have not changed.
  const stale =
    !existsSync(voice) || voices.some((v) => statSync(v).mtimeMs > statSync(voice).mtimeMs);
  if (stale) {
    const last = pieces.length - 1;
    const padded = pieces.map(
      (p, i) =>
        `[${i}:a]apad=whole_dur=${(p.seconds + (i === last ? closingSeconds : 0)).toFixed(4)}[a${i}]`,
    );
    const joined = `${padded.join(';')};${pieces.map((_, i) => `[a${i}]`).join('')}concat=n=${pieces.length}:v=0:a=1[a]`;
    const r = run('ffmpeg', [
      '-v',
      'error',
      '-y',
      ...voices.flatMap((v) => ['-i', v]),
      '-filter_complex',
      joined,
      '-map',
      '[a]',
      '-c:a',
      'pcm_s16le',
      voice,
    ]);
    if (r.status !== 0) throw new Error(`The voices could not be put end to end:\n${r.stderr}`);
  }
  write(path.join(audioDir, 'timings.json'), `${JSON.stringify(track, null, 2)}\n`);
  write(path.join(dir, 'sound-plan.json'), `${JSON.stringify(plan, null, 2)}\n`);
  for (const line of mixRun(dir)) log(`    ${line}`);
  return { dir, track };
}

let serveUrl: string | null = null;
const bundled = async () =>
  (serveUrl ??= await bundle({
    entryPoint: path.join(engineDir, 'src', 'index.ts'),
    publicDir: path.join(engineDir, 'public'),
  }));

/** The page's closing card as a short clip in a shape, when the brand has one. */
async function closingClip(kind: VerticalCut, size: SizeName): Promise<string | null> {
  const card = brand?.closingCard;
  if (!card) return null;
  const url = await bundled();
  const inputProps = {
    text: card.text,
    ...(card.subtext ? { subtext: card.subtext } : {}),
    size,
    seconds: card.seconds,
    paint: brand.colors.titleRibbon,
  };
  const composition = await selectComposition({ serveUrl: url, id: 'ClosingCard', inputProps });
  const out = path.join(runDir, 'cuts', kind, `closing-${tag(size)}.mp4`);
  await renderMedia({
    composition,
    serveUrl: url,
    codec: 'h264',
    outputLocation: out,
    inputProps,
    muted: true,
  });
  return out;
}

/** The cover picture of a cut: one shot of the video with the title on it. */
async function cover(cut: Cut, pieces: readonly Piece[], out: string): Promise<void> {
  const shots = (sb: Storyboard) => sb.scenes.flatMap((scene) => scene.shots);
  const wanted = whole.cover?.shot;
  const holder = pieces.find((p) => shots(p.storyboard).some((s) => s.id === wanted)) ?? pieces[0];
  if (!holder) throw new Error('There is no part to take a cover from.');
  const inCut = holder && shots(holder.storyboard).some((s) => s.id === wanted);
  const url = await bundled();
  const inputProps = {
    storyboard: holder.storyboard,
    cards: world.characters,
    size: cut.size,
    shot: inCut && wanted ? wanted : (shots(holder.storyboard)[0]?.id ?? ''),
    at: inCut ? (whole.cover?.at ?? 0.6) : 0.6,
    ...(inCut && whole.cover?.framing ? { framing: whole.cover.framing } : {}),
    title: whole.title,
    layout: COVER_LAYOUT,
    ...(brand ? { paint: brand.colors.titleRibbon } : {}),
  };
  const composition = await selectComposition({ serveUrl: url, id: 'Cover', inputProps });
  await renderStill({
    composition,
    serveUrl: url,
    output: out,
    inputProps,
    imageFormat: 'jpeg',
    jpegQuality: 92,
    // A wide cover is the size YouTube asks for; the others are the size of the video.
    ...(cut.size === '16:9' ? { scale: COVER_WIDE.width / SIZES['16:9'].width } : {}),
  });
}

/** The thumbnails picked for this video: the newest version of each shape in the out folder. */
function pickedThumbnails(): string[] {
  if (!existsSync(outDir)) return [];
  const newest = new Map<string, { v: number; file: string }>();
  for (const file of readdirSync(outDir)) {
    const m = /-(\d+x\d+)-thumbnail-v(\d+)\.jpg$/.exec(file);
    if (!m?.[1]) continue;
    const v = Number(m[2]);
    if (v > (newest.get(m[1])?.v ?? 0)) newest.set(m[1], { v, file });
  }
  return [...newest.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([, t]) => t.file);
}

function nextVersion(base: string): number {
  let v = 1;
  while (existsSync(path.join(outDir, `${base}-v${v}.mp4`))) v++;
  return v;
}

/** One cut, made and checked. */
async function deliver(cut: Cut, pieces: readonly Piece[]): Promise<Delivered> {
  const size = SIZES[cut.size];
  const { dir, track } = soundOf(cut.kind, pieces);
  const mix = path.join(dir, 'audio', 'mix.wav');
  const closing = await closingClip(cut.kind, cut.size);
  const pictures = [
    ...pieces.map((p) => ({ file: p.file, seconds: p.seconds, fadesIn: p.fadesIn })),
    ...(closing ? [{ file: closing, seconds: closingSeconds, fadesIn: true }] : []),
  ];
  mkdirSync(outDir, { recursive: true });
  const base = `${slug}${cut.kind === 'teaser' ? '-teaser' : ''}-${tag(cut.size)}`;
  const name = `${base}-v${nextVersion(base)}`;
  const out = path.join(outDir, `${name}.mp4`);
  const joined = run(
    'ffmpeg',
    [
      '-v',
      'error',
      '-n',
      ...pictures.flatMap((p) => ['-i', p.file]),
      '-i',
      mix,
      '-filter_complex',
      joinFilter(pictures),
      '-map',
      '[v]',
      '-map',
      `${pictures.length}:a`,
      '-r',
      String(FPS),
      ...['-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '14'],
      // The colours every player and video site expects (BT.709, standard range).
      ...['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709'],
      // The sound is packed as finely as the parts' own (about 320k), so the finished file stays
      // as close to its mix as they do; at 256k busy music left a little too much behind.
      ...['-color_range', 'tv', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000'],
      ...['-movflags', '+faststart'],
      out,
    ],
    { timeoutMs: 900_000 },
  );
  if (joined.status !== 0 || !existsSync(out)) {
    throw new Error(`The parts could not be joined:\n${joined.stderr}`);
  }

  // One captions file for the whole of it.
  const pages = buildPages(toCaptions(track.words));
  writeFileSync(
    path.join(outDir, `${name}.srt`),
    serializeSrt({
      lines: pages.map((p) =>
        p.lines.flat().map((w, i) => (i === 0 ? { ...w, text: w.text.trim() } : w)),
      ),
    }),
  );
  const coverFile = path.join(outDir, `${name}-cover-${COVER_LAYOUT}.jpg`);
  await cover(cut, pieces, coverFile);

  // ---- the finished file, checked
  const probe = probeFile(out);
  const seconds = probe?.seconds ?? 0;
  const total = pictures.reduce((sum, p) => sum + p.seconds, 0);
  const checks: QaCheck[] = [
    fileCheck({ probe, decodeErrors: decodeErrors(out), size, fps: FPS }),
    {
      id: 'length',
      title: 'It is as long as its parts together',
      by: 'measured',
      detail: `${seconds.toFixed(1)} s; ${pictures.length === 1 ? 'its one part is' : `its ${pictures.length} pieces add up to`} ${total.toFixed(1)} s`,
      findings:
        Math.abs(seconds - total) > 0.1
          ? [
              {
                level: 'problem',
                text: `the file is ${seconds.toFixed(2)} s but its parts add up to ${total.toFixed(2)} s`,
              },
            ]
          : [],
    },
  ];
  // Its pictures are the parts that passed, frame for frame, but for the dip into each join.
  const dip = Math.ceil(JOIN_DIP_S * FPS) + 1;
  let from = 0;
  let worst = 0;
  const strayed: QaCheck['findings'] = [];
  pictures.forEach((p, i) => {
    const values = pictureDifference(out, p.file, { from, seconds: p.seconds });
    // The last frame is left out too: a part's length rounds up past its last frame, so the
    // stretch can end on the first frame of the next part (2026-10-15: a join failed on that
    // one frame alone, where the next part opened on a different picture).
    const judged = values?.slice(0, pictures[i + 1]?.fadesIn ? -dip : -1) ?? [];
    const top = Math.max(0, ...judged);
    worst = Math.max(worst, top);
    if (!values)
      strayed.push({
        level: 'problem',
        text: `${path.basename(p.file)} could not be compared with its stretch of the file`,
      });
    else if (top > SAME_PICTURE) {
      strayed.push({
        level: 'problem',
        atMs: Math.round(from * 1000),
        text: `from ${clock(from * 1000)} the pictures are not those of ${path.basename(p.file)}`,
      });
    }
    from += p.seconds;
  });
  checks.push({
    id: 'pictures',
    title: 'Its pictures are the parts that passed',
    by: 'measured',
    detail: `every frame against ${pieces.map((p) => path.basename(p.file)).join(' and ')} (the strongest difference is ${Math.round(worst)} of 255; over ${SAME_PICTURE} would be a different picture)`,
    findings: strayed,
  });
  const inFile = samplesOf(out);
  const inMix = samplesOf(mix);
  const sound = inFile && inMix ? soundDifference(inFile, inMix, COMPARE_RATE) : null;
  checks.push({
    id: 'sound',
    title: 'Its sound is the mix made for the whole video',
    by: 'measured',
    detail: sound
      ? `second for second (what is left over is ${Math.abs(Math.round(sound.worstDb))} dB under it at most)`
      : 'the sound could not be compared',
    findings:
      !sound || sound.worstDb > SOUND_MATCH_DB
        ? [{ level: 'problem', text: 'the sound in the file is not the mix made for it' }]
        : [],
  });
  const mixReport = parseOrExplain(
    mixReportSchema,
    readJson(path.join(dir, 'audio', 'mix.json')),
    'audio/mix.json',
  );
  checks.push(
    silenceCheck({ silences: silencesOf(out, seconds * 1000), track }),
    loudnessCheck({ measured: loudnessOf(out) }),
    wordsHeardCheck({ mix: mixReport, track }),
  );

  // ---- what there is to look at: each join, and the cover
  const lookDir = path.join(outDir, 'look', name);
  mkdirSync(lookDir, { recursive: true });
  let at = 0;
  pictures.slice(0, -1).forEach((p, i) => {
    at += p.seconds;
    run('ffmpeg', [
      ...['-v', 'error', '-y', '-ss', Math.max(0, at - 0.5).toFixed(3), '-t', '1.2', '-i', out],
      ...['-vf', 'fps=15,scale=480:-1,tile=6x3', '-frames:v', '1'],
      path.join(lookDir, `join-${i + 1}.png`),
    ]);
  });
  const lookFile = path.join(outDir, `${name}.look.json`);
  const look = existsSync(lookFile)
    ? parseOrExplain(outputLookSchema, readJson(lookFile), rel(lookFile))
    : null;
  checks.push(outputLookCheck({ look, video: `${name}.mp4`, joins: pictures.length - 1 }));
  const coverBytes = statSync(coverFile).size;
  if (cut.size === '16:9' && coverBytes > COVER_WIDE.maxBytes) {
    checks.push({
      id: 'cover-size',
      title: 'The cover is small enough to upload',
      by: 'measured',
      detail: `${(coverBytes / 1e6).toFixed(1)} MB`,
      findings: [
        {
          level: 'problem',
          text: `the cover is over ${COVER_WIDE.maxBytes / 1e6} MB, the most YouTube takes`,
        },
      ],
    });
  }

  const from_ = pieces.map((p) => path.basename(p.file));
  writeFileSync(
    path.join(outDir, `${name}.json`),
    `${JSON.stringify({ video: `${name}.mp4`, from: from_, mix: shaOfFile(mix), madeAt: new Date().toISOString(), checks }, null, 2)}\n`,
    'utf8',
  );
  log(`  ${rel(out)}: ${seconds.toFixed(2)} s, ${size.width}x${size.height}`);
  for (const check of checks) {
    log(`    ${checkResult(check) === 'failed' ? 'FIX ' : 'ok  '} ${check.title}: ${check.detail}`);
    for (const f of check.findings) log(`          ${f.level}: ${f.text}`);
  }
  if (!look || look.video !== `${name}.mp4`) {
    log(
      `    to look at: ${rel(lookDir)} (each join) and ${rel(coverFile)}; then write ${rel(lookFile)}`,
    );
  }
  return {
    cut,
    video: `${name}.mp4`,
    captions: `${name}.srt`,
    cover: path.basename(coverFile),
    thumbnails: pickedThumbnails(),
    seconds,
    checks,
    from: from_,
  };
}

/** A cut already delivered from these very part videos is not made again: only looked up. */
async function alreadyDelivered(cut: Cut, pieces: readonly Piece[]): Promise<Delivered | null> {
  const base = `${slug}${cut.kind === 'teaser' ? '-teaser' : ''}-${tag(cut.size)}`;
  const version = nextVersion(base) - 1;
  if (version < 1) return null;
  const name = `${base}-v${version}`;
  const recordFile = path.join(outDir, `${name}.json`);
  if (!existsSync(recordFile)) return null;
  const record = readJson(recordFile) as { from: string[]; mix: string; checks: QaCheck[] };
  const same =
    JSON.stringify(record.from) === JSON.stringify(pieces.map((p) => path.basename(p.file))) &&
    existsSync(path.join(runDir, 'cuts', cut.kind, 'audio', 'mix.wav')) &&
    record.mix === shaOfFile(path.join(runDir, 'cuts', cut.kind, 'audio', 'mix.wav'));
  if (!same) return null;
  // A file that failed a measured check is not one to stand on: it is made again, as the next
  // version, and the failed one is kept beside it.
  const failed = record.checks.some(
    (c) => c.id !== 'output-look' && c.findings.some((f) => f.level === 'problem'),
  );
  if (failed) return null;
  // The look may have been written since: read it afresh.
  const lookFile = path.join(outDir, `${name}.look.json`);
  const look = existsSync(lookFile)
    ? parseOrExplain(outputLookSchema, readJson(lookFile), rel(lookFile))
    : null;
  const checks = record.checks.map((c) =>
    c.id === 'output-look'
      ? outputLookCheck({
          look,
          video: `${name}.mp4`,
          joins: pieces.length - 1 + (closingSeconds ? 1 : 0),
        })
      : c,
  );
  writeFileSync(recordFile, `${JSON.stringify({ ...record, checks }, null, 2)}\n`, 'utf8');
  log(`  ${rel(path.join(outDir, `${name}.mp4`))}: already made from these parts`);
  // Another cover style is drawn beside the ones already there.
  const coverFile = path.join(outDir, `${name}-cover-${COVER_LAYOUT}.jpg`);
  if (!existsSync(coverFile)) {
    await cover(cut, pieces, coverFile);
    log(`    ${rel(coverFile)}`);
  }
  for (const check of checks) {
    if (checkResult(check) === 'failed') {
      log(`    FIX  ${check.title}: ${check.findings.map((f) => f.text).join('; ')}`);
    }
  }
  return {
    cut,
    video: `${name}.mp4`,
    captions: `${name}.srt`,
    cover: path.basename(coverFile),
    thumbnails: pickedThumbnails(),
    seconds: probeFile(path.join(outDir, `${name}.mp4`))?.seconds ?? 0,
    checks,
    from: record.from,
  };
}

async function main(): Promise<void> {
  const cuts = outputCuts(choice(), parts);
  const delivered: Delivered[] = [];
  const waiting: Array<{ cut: Cut; why: string[] }> = [];
  const notes = new Set<string>();
  for (const cut of cuts) {
    log(`${cut.size} ${cut.kind === 'teaser' ? 'teaser' : 'full video'}:`);
    const { pieces, why, notes: found } = piecesOf(cut);
    if (why.length) {
      waiting.push({ cut, why });
      for (const w of why) log(`  waiting: ${w}`);
      continue;
    }
    for (const n of found) notes.add(n);
    delivered.push((await alreadyDelivered(cut, pieces)) ?? (await deliver(cut, pieces)));
  }
  const page = path.join(runDir, 'delivery.md');
  writeFileSync(
    page,
    deliveryPage({
      title: whole.title,
      madeOn: today(),
      delivered,
      waiting,
      notes: [...notes],
    }),
    'utf8',
  );
  log(rel(page));
  const failed = delivered.some((d) => d.checks.some((c) => checkResult(c) === 'failed'));
  if (failed || waiting.length) process.exitCode = 1;
}

try {
  await main();
} catch (err) {
  console.log((err as Error).message);
  process.exitCode = 1;
} finally {
  await finishRendering();
}
