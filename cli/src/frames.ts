/**
 * Renders a few frames of a sandbox video as stills and lays them side by side in one sheet,
 * to look at a move before rendering the whole video.
 *
 *   npm run frames -- --video=journey --at=0,2.5,4,6 [--out=engine/out/frames]
 *
 * `--at` lists seconds. The stills and the sheet go into `--out` (by default engine/out/frames/).
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { bundle, finishRendering, renderStill, selectComposition } from './render.js';
import { videoId } from '../../engine/src/sandbox/sheets.js';
import type { VideoSheet } from '../../engine/src/sandbox/sheets.js';

const projectRoot = path.resolve(import.meta.dirname, '..', '..');
const args = process.argv.slice(2);
const arg = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const video = arg('video') as VideoSheet | undefined;
const at = (arg('at') ?? '0').split(',').map(Number);
const out = path.resolve(projectRoot, arg('out') ?? path.join('engine', 'out', 'frames'));
if (!video) throw new Error('Say which video: --video=<name>');
mkdirSync(out, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(projectRoot, 'engine', 'src', 'index.ts') });
const composition = await selectComposition({ serveUrl, id: videoId(video), inputProps: {} });
const files: string[] = [];
for (const s of at) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  const file = path.join(out, `${video}-${s.toFixed(2)}s.png`);
  await renderStill({ composition, serveUrl, output: file, inputProps: {}, frame, scale: 0.5 });
  files.push(file);
  console.log(`  ${path.relative(projectRoot, file)}`);
}
await finishRendering();
const sheet = path.join(out, `${video}-sheet.png`);
execFileSync('ffmpeg', [
  '-y',
  '-loglevel',
  'error',
  ...files.flatMap((f) => ['-i', f]),
  '-filter_complex',
  `${files.map((_, i) => `[${i}:v]`).join('')}hstack=inputs=${files.length}`,
  sheet,
]);
console.log(`  ${path.relative(projectRoot, sheet)}`);
