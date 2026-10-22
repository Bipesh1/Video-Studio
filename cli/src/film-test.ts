/**
 * `npm run film-test -- [--id=ErasedTest] [--out=<folder>]`: renders a hand-built test scene for
 * the short films as a silent video, into `runs/2026-10-14-erased/test/` unless told otherwise.
 * Each render takes the next version number; nothing is written over.
 */
import { existsSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundle, finishRendering, renderMedia, selectComposition } from './render.js';
import { projectRoot } from './system.js';

const argv = process.argv.slice(2);
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const id = value('id') ?? 'ErasedTest';
const outDir = path.resolve(projectRoot, value('out') ?? 'runs/2026-10-14-erased/test');
mkdirSync(outDir, { recursive: true });
const name = id.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
let v = 1;
while (existsSync(path.join(outDir, `${name}-v${v}.mp4`))) v++;
const outputLocation = path.join(outDir, `${name}-v${v}.mp4`);

try {
  const engineDir = path.join(projectRoot, 'engine');
  const serveUrl = await bundle({
    entryPoint: path.join(engineDir, 'src', 'index.ts'),
    publicDir: path.join(engineDir, 'public'),
  });
  const composition = await selectComposition({ serveUrl, id, inputProps: {} });
  const t0 = Date.now();
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation,
    inputProps: {},
    muted: true,
    concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
  });
  const seconds = composition.durationInFrames / composition.fps;
  console.log(
    `${path.relative(projectRoot, outputLocation)}: ${seconds.toFixed(1)} s, ${composition.width}x${composition.height}, in ${((Date.now() - t0) / 1000).toFixed(0)} s`,
  );
} finally {
  await finishRendering();
}
