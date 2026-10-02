/**
 * `npm run sheets`: renders the sandbox sheets for the draw, look and fix loop (Part 2, section 6).
 * Bundles once, then renders every sheet on a light and a dark background, plus a phone-size copy.
 *
 * Options:
 *   --only=expressions,poses   render just these sheets
 *   --video                    also render the walk and motion videos
 *   --golden                   copy the light stills into knowledge/golden/ as reference stills
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import {
  BACKGROUNDS,
  STILL_SHEETS,
  VIDEO_SHEETS,
  stillId,
  videoId,
} from '../../engine/src/sandbox/sheets';
import type { VideoSheet } from '../../engine/src/sandbox/sheets';
import { projectRoot } from './system.js';

const args = process.argv.slice(2);
const only = args
  .find((a) => a.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',');
const withVideo = args.includes('--video');
const golden = args.includes('--golden');

const engineDir = path.join(projectRoot, 'engine');
const outDir = path.join(engineDir, 'out', 'sandbox');
const goldenDir = path.join(projectRoot, 'knowledge', 'golden');
mkdirSync(outDir, { recursive: true });

const started = Date.now();
console.log('Bundling the engine...');
const serveUrl = await bundle({ entryPoint: path.join(engineDir, 'src', 'index.ts') });

const sheets = STILL_SHEETS.filter((s) => !only || only.includes(s));
for (const sheet of sheets) {
  for (const bg of BACKGROUNDS) {
    const id = stillId(sheet, bg);
    const composition = await selectComposition({ serveUrl, id, inputProps: {} });
    const full = path.join(outDir, `${sheet}-${bg}.png`);
    const phone = path.join(outDir, `${sheet}-${bg}-phone.png`);
    await renderStill({ composition, serveUrl, output: full, inputProps: {} });
    await renderStill({ composition, serveUrl, output: phone, inputProps: {}, scale: 1 / 3 });
    console.log(`  ${path.relative(projectRoot, full)}`);
    if (golden && bg === 'light') {
      mkdirSync(goldenDir, { recursive: true });
      const target = path.join(goldenDir, `rig-${sheet}.png`);
      copyFileSync(full, target);
      console.log(`  golden: ${path.relative(projectRoot, target)}`);
    }
  }
}

if (withVideo) {
  const concurrency = Math.max(1, Math.min(Math.floor(os.cpus().length / 2), 4));
  for (const sheet of Object.keys(VIDEO_SHEETS) as VideoSheet[]) {
    if (only && !only.includes(sheet)) continue;
    const id = videoId(sheet);
    const composition = await selectComposition({ serveUrl, id, inputProps: {} });
    const outputLocation = path.join(outDir, `${sheet}.mp4`);
    const t0 = Date.now();
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation,
      inputProps: {},
      concurrency,
    });
    const secs = (Date.now() - t0) / 1000;
    const perSecond = secs / VIDEO_SHEETS[sheet];
    console.log(
      `  ${path.relative(projectRoot, outputLocation)} (${secs.toFixed(1)} s, ${perSecond.toFixed(2)} s per video second)`,
    );
  }
}

console.log(`Done in ${((Date.now() - started) / 1000).toFixed(0)} s.`);
