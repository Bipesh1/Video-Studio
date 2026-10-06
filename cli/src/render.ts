/**
 * Every command draws through this file. It keeps one hidden browser open for the whole
 * command instead of starting a new one for every picture (faster, and one scratch profile
 * instead of thousands), and it keeps all scratch files inside the project (see scratch.ts).
 *
 * Call `finishRendering()` when the command is done, or the open browser keeps it alive.
 */
import './scratch.js';
import { bundle as remotionBundle } from '@remotion/bundler';
import {
  openBrowser,
  renderMedia as remotionRenderMedia,
  renderStill as remotionRenderStill,
  selectComposition as remotionSelectComposition,
} from '@remotion/renderer';

type Browser = Awaited<ReturnType<typeof openBrowser>>;

/** A browser's first start after a fresh build can take a while on this machine. */
const PATIENCE_MS = 120_000;

let shared: Promise<Browser> | null = null;
const browser = (): Promise<Browser> => (shared ??= openBrowser('chrome'));

export const bundle = remotionBundle;

export async function selectComposition(
  options: Parameters<typeof remotionSelectComposition>[0],
): ReturnType<typeof remotionSelectComposition> {
  return remotionSelectComposition({
    timeoutInMilliseconds: PATIENCE_MS,
    ...options,
    puppeteerInstance: await browser(),
  });
}

export async function renderStill(
  options: Parameters<typeof remotionRenderStill>[0],
): ReturnType<typeof remotionRenderStill> {
  return remotionRenderStill({
    timeoutInMilliseconds: PATIENCE_MS,
    ...options,
    puppeteerInstance: await browser(),
  });
}

export async function renderMedia(
  options: Parameters<typeof remotionRenderMedia>[0],
): ReturnType<typeof remotionRenderMedia> {
  return remotionRenderMedia({
    timeoutInMilliseconds: PATIENCE_MS,
    ...options,
    puppeteerInstance: await browser(),
  });
}

/** Close the shared browser. Safe to call when nothing was drawn. */
export async function finishRendering(): Promise<void> {
  if (!shared) return;
  const open = shared;
  shared = null;
  try {
    await (await open).close({ silent: true });
  } catch {
    // A browser that is already gone needs no closing.
  }
}
