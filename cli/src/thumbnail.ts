/**
 * `npm run thumbnail -- --run=<run> [--size=9:16|16:9|4:5] [--only=<id>]`: draws the thumbnails
 * of a video from `runs/<run>/thumbnails.json` into `runs/<run>/thumbnails/`. With
 * `--file=<json>` in place of `--run`, it draws a saved design (`library/thumbnail-designs/`)
 * into a folder beside that file; `--cast=<run>` lends it the cast of that video.
 *
 * A thumbnail is not a frame of the video, and not a shot with words on it (Biku, 2026-10-13).
 * It is a poster built in layers, with the video's cast, rooms, things and smoke placed and
 * sized freely, and a few big words of its own (contract: shared/src/thumbnail.schema.ts; the
 * drawing: engine/src/stage/Poster.tsx). The file can hold several: each is drawn, numbered
 * in the order it is written, and all of them are put side by side on one sheet, at the size a
 * phone shows them and again at the size of a feed, for him to pick from by eye.
 *
 * These are choices, not deliveries: drawing again replaces them. `--pick=<id>` copies the one
 * he chose into `out/` beside the video, under the next free version number.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { SIZES, flatLayers, parseOrExplain, thumbnailsSchema } from '@studio/shared';
import type { SizeName, Thumbnail } from '@studio/shared';
import { posterProblems } from '../../engine/src/stage/posterCheck';
import { bundle, finishRendering, renderStill, selectComposition } from './render.js';
import { projectRoot, run } from './system.js';
import { loadStoryboard, loadWorld } from './world.js';

const argv = process.argv.slice(2);
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const RUN = value('run');
// A saved design has no video behind it: `--file=<its json>` draws it beside that file, with
// figures of its own in place of a cast.
const DESIGN = value('file');
if (!RUN && !DESIGN) {
  throw new Error('Say which video (--run=<run folder>) or which saved design (--file=<json>).');
}
const runDir = RUN ? path.join(projectRoot, 'runs', RUN) : null;
const file = DESIGN
  ? path.resolve(projectRoot, DESIGN)
  : path.join(runDir ?? projectRoot, 'thumbnails.json');
if (!existsSync(file)) {
  throw new Error(
    `There is no ${path.relative(projectRoot, file)} yet: describe the thumbnails there first.`,
  );
}
const world = loadWorld();
// A saved design with the cast of a series in it borrows that cast from one of its videos
// (`--cast=<run folder>`): the game theory design draws the Saint and the Copycat from their cards.
const CAST_RUN = value('cast');
const castDir = runDir ?? (CAST_RUN ? path.join(projectRoot, 'runs', CAST_RUN) : null);
const whole = castDir ? loadStoryboard(path.join(castDir, 'storyboard.json')) : null;
const cast = whole?.cast ?? [];
const outDir = runDir
  ? path.join(runDir, 'thumbnails')
  : path.join(path.dirname(file), path.basename(file, '.json'));
const rel = (p: string) => path.relative(projectRoot, p);
const everyOne = parseOrExplain(
  thumbnailsSchema,
  JSON.parse(readFileSync(file, 'utf8')),
  rel(file),
).thumbnails;
// One shape at a time: the one asked for, or the shape of the first poster in the file.
const SIZE = (value('size') ?? everyOne[0]?.size ?? '16:9') as SizeName;
if (!(SIZE in SIZES)) throw new Error(`"${SIZE}" is not a shape the studio makes.`);
const tag = SIZE.replace(':', 'x');
const thumbnails = everyOne.filter((t) => t.size === SIZE);
if (!thumbnails.length) throw new Error(`No thumbnail in ${rel(file)} is laid out for ${SIZE}.`);
/** The width YouTube asks for of a wide thumbnail (1280 by 720, under 2 MB). */
const YOUTUBE_WIDTH = 1280;
const fileOf = (thumb: Thumbnail, n: number) => path.join(outDir, `${n}-${thumb.id}-${tag}.jpg`);
const numbered = thumbnails.map((thumb, i) => ({ thumb, n: i + 1 }));
const wordsOf = (thumb: Thumbnail): string =>
  flatLayers(thumb.layers)
    .flatMap((l) =>
      l.kind === 'words' ? l.lines : l.kind === 'headline' ? l.lines.map((x) => x.text) : [],
    )
    .join(' ')
    .replace(/\*/g, '');

/** Copy the chosen one beside the video, never over another. */
function pick(id: string): void {
  const chosen = numbered.find((t) => t.thumb.id === id || String(t.n) === id);
  if (!chosen) throw new Error(`There is no thumbnail "${id}" in ${rel(file)}.`);
  const from = fileOf(chosen.thumb, chosen.n);
  if (!existsSync(from)) throw new Error(`${rel(from)} has not been drawn yet.`);
  if (!runDir) throw new Error('A saved design is not picked for a video: draw it for a run.');
  const dir = path.join(runDir, 'out');
  mkdirSync(dir, { recursive: true });
  const name = RUN?.replace(/^\d{4}-\d{2}-\d{2}-/, '') ?? 'video';
  let v = 1;
  while (existsSync(path.join(dir, `${name}-${tag}-thumbnail-v${v}.jpg`))) v++;
  const to = path.join(dir, `${name}-${tag}-thumbnail-v${v}.jpg`);
  copyFileSync(from, to);
  console.log(`${rel(to)}: thumbnail ${chosen.n}, "${wordsOf(chosen.thumb)}"`);
}

/** Every thumbnail on one sheet: a row at the size of a phone, a row at the size of a feed. */
function sheet(files: readonly string[]): void {
  const { width, height } = SIZES[SIZE];
  const wide = width > height;
  // Large to judge the drawing, and small as a phone's feed shows it (a wide one about 168
  // by 94): what cannot be read in the small row cannot be read by a viewer.
  const big = wide ? 405 : 640;
  const w = Math.round((big * width) / height / 2) * 2;
  const small = wide ? 94 : 200;
  const sw = Math.round((small * width) / height / 2) * 2;
  const cell = Math.max(w, 300) + 40;
  const font = 'C\\:/Windows/Fonts/arialbd.ttf';
  const label = (n: number) =>
    `drawtext=fontfile='${font}':text='${n}':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=14`;
  const parts: string[] = [];
  files.forEach((_, i) => {
    parts.push(
      `[${i}:v]split=2[a${i}][b${i}]`,
      `[a${i}]scale=${w}:${big}:flags=lanczos,pad=${cell}:${big + 90}:(ow-iw)/2:70:0x2B2B2B,${label(i + 1)}[big${i}]`,
      `[b${i}]scale=${sw}:${small}:flags=lanczos,pad=${cell}:${small + 40}:(ow-iw)/2:10:0x2B2B2B[small${i}]`,
    );
  });
  const row = (name: string) =>
    files.length > 1
      ? `${files.map((_, i) => `[${name}${i}]`).join('')}hstack=inputs=${files.length}[${name}]`
      : `[${name}0]null[${name}]`;
  parts.push(row('big'), row('small'), '[big][small]vstack=inputs=2[out]');
  const out = path.join(outDir, `sheet-${tag}.png`);
  const r = run('ffmpeg', [
    '-v',
    'error',
    '-y',
    ...files.flatMap((f) => ['-i', f]),
    '-filter_complex',
    parts.join(';'),
    '-map',
    '[out]',
    '-frames:v',
    '1',
    out,
  ]);
  if (r.status === 0) console.log(`  ${rel(out)}: all ${files.length} side by side`);
  else console.log(`  could not make the sheet: ${(r.stderr ?? '').trim().slice(0, 300)}`);
}

async function draw(): Promise<void> {
  const only = value('only');
  const wanted = numbered.filter((t) => !only || t.thumb.id === only);
  if (!wanted.length) throw new Error(`There is no thumbnail "${only}" in ${rel(file)}.`);
  // Nothing is drawn from a poster that names something the studio does not have.
  const problems = wanted.flatMap((t) => posterProblems(t.thumb, cast));
  if (problems.length) {
    throw new Error(
      `The thumbnails cannot be drawn yet:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
    );
  }
  mkdirSync(outDir, { recursive: true });
  const engineDir = path.join(projectRoot, 'engine');
  const serveUrl = await bundle({
    entryPoint: path.join(engineDir, 'src', 'index.ts'),
    publicDir: path.join(engineDir, 'public'),
  });
  for (const { thumb, n } of wanted) {
    const inputProps = {
      size: SIZE,
      thumbnail: thumb,
      cast,
      cards: world.characters,
      seed: whole?.seed ?? 1,
    };
    const composition = await selectComposition({ serveUrl, id: 'Poster', inputProps });
    const out = fileOf(thumb, n);
    await renderStill({
      composition,
      serveUrl,
      output: out,
      inputProps,
      imageFormat: 'jpeg',
      jpegQuality: 92,
      ...(SIZE === '16:9' ? { scale: YOUTUBE_WIDTH / SIZES['16:9'].width } : {}),
    });
    console.log(`  ${n}  ${rel(out)}: "${wordsOf(thumb)}"`);
  }
  const all = numbered.map((t) => fileOf(t.thumb, t.n));
  if (all.every((f) => existsSync(f))) sheet(all);
}

const chosen = value('pick');
try {
  if (chosen) pick(chosen);
  else await draw();
} finally {
  await finishRendering();
}
