/**
 * Reading finished video and sound files with ffmpeg and ffprobe: what a file is, whether it
 * plays, how loud it is, where it is silent, what it sounds like, and whether two videos show
 * the same pictures. Used by the self-check of a part (qa.ts) and by the output step.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  parseLoudness,
  parsePictureDifference,
  parseProbe,
  pictureDifferenceFilter,
  parseSilences,
} from '@studio/shared';
import type { VideoProbe } from '@studio/shared';
import { run } from './system.js';

const LONG = { timeoutMs: 900_000 };

export const shaOfFile = (file: string): string =>
  createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);

export function probeFile(file: string): VideoProbe | null {
  const r = run('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_streams',
    '-show_format',
    file,
  ]);
  return r.status === 0 ? parseProbe(r.stdout) : null;
}

/** What ffmpeg complains of while playing a whole file through; empty when nothing. */
export const decodeErrors = (file: string): string =>
  `${run('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], LONG).stderr ?? ''}`;

export function loudnessOf(file: string): { lufs: number; truePeakDb: number } | null {
  const r = run(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      file,
      '-filter_complex',
      'ebur128=peak=true',
      '-f',
      'null',
      '-',
    ],
    LONG,
  );
  return parseLoudness(`${r.stderr ?? ''}`);
}

export function silencesOf(file: string, endMs: number): Array<{ startMs: number; endMs: number }> {
  const r = run(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-i',
      file,
      '-af',
      'silencedetect=noise=-45dB:d=0.5',
      '-f',
      'null',
      '-',
    ],
    LONG,
  );
  return parseSilences(`${r.stderr ?? ''}`, endMs);
}

/** The rate sound is compared at: enough to tell one mix from another. */
export const COMPARE_RATE = 8000;

/** A file's sound as mono samples at a low rate. */
export function samplesOf(file: string): Int16Array | null {
  const raw = path.join(
    os.tmpdir(),
    `sound-${createHash('sha1').update(file).digest('hex').slice(0, 10)}-${process.pid}.raw`,
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
    LONG,
  );
  if (r.status !== 0 || !existsSync(raw)) return null;
  const bytes = readFileSync(raw);
  rmSync(raw, { force: true });
  return new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
}

/**
 * How much two videos differ, frame by frame (see pictureDifferenceFilter). `from` and
 * `seconds` take a stretch of the first video to set against the whole of the second.
 */
export function pictureDifference(
  first: string,
  second: string,
  stretch?: { from: number; seconds: number },
): number[] | null {
  const shape = probeFile(second);
  if (!shape) return null;
  const r = run(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      // Half a frame early, so the stretch opens on its own first frame: a start rounded up to
      // the next thousandth of a second begins one frame late, and every cut then shows as a
      // difference (the fourth part of the Sun's bill, 2026-10-07).
      ...(stretch
        ? ['-ss', Math.max(0, stretch.from - 1 / 60).toFixed(3), '-t', stretch.seconds.toFixed(3)]
        : []),
      '-i',
      first,
      '-i',
      second,
      '-filter_complex',
      pictureDifferenceFilter(shape),
      '-f',
      'null',
      '-',
    ],
    LONG,
  );
  if (r.status !== 0) return null;
  const values = parsePictureDifference(`${r.stderr ?? ''}`);
  return values.length ? values : null;
}
