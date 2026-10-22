/**
 * Reading finished video and sound files with ffmpeg and ffprobe: what a file is, whether it
 * plays, how loud it is, where it is silent, what it sounds like, and whether two videos show
 * the same pictures. Used by the self-check of a part (qa.ts) and by the output step.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
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

/**
 * How much of the middle of each picture has something drawn in it, `rate` times a second:
 * the band under the title and above the captions of a tall explainer page (470 to 1270 of
 * 1920), as a share of its pixels that stand apart from the band's most common colour. For
 * the self-check that the picture is never empty (`emptyPictureCheck`).
 */
export function pictureFill(video: string, rate: number, scratch: string): number[] | null {
  const bytes = bandFrames(video, rate, scratch);
  if (!bytes) return null;
  const size = BAND_W * BAND_H * 3;
  const out: number[] = [];
  for (let f = 0; f + size <= bytes.length; f += size) {
    // The band's own colour: the commonest, to the nearest sixteenth of each channel.
    const counts = new Map<number, number>();
    for (let i = f; i < f + size; i += 3) {
      const key =
        ((bytes[i] ?? 0) >> 4) * 256 + ((bytes[i + 1] ?? 0) >> 4) * 16 + ((bytes[i + 2] ?? 0) >> 4);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    const page = [
      ((common >> 8) << 4) + 8,
      (((common >> 4) & 15) << 4) + 8,
      ((common & 15) << 4) + 8,
    ];
    let drawn = 0;
    for (let i = f; i < f + size; i += 3) {
      const d =
        Math.abs((bytes[i] ?? 0) - (page[0] ?? 0)) +
        Math.abs((bytes[i + 1] ?? 0) - (page[1] ?? 0)) +
        Math.abs((bytes[i + 2] ?? 0) - (page[2] ?? 0));
      if (d > 60) drawn += 1;
    }
    out.push(drawn / (BAND_W * BAND_H));
  }
  return out;
}

/**
 * How much the middle of the picture has changed since one second before, `rate` times a
 * second: the mean difference of the band's pixels (0 to 255), small and blurred so grain and
 * the trembling line hardly count. For the self-check that the picture never stands still for
 * long (`stillPictureCheck`). The first second has nothing to compare with and is left out.
 */
export function pictureChange(video: string, rate: number, scratch: string): number[] | null {
  const bytes = bandFrames(video, rate, scratch);
  if (!bytes) return null;
  const size = BAND_W * BAND_H * 3;
  const frames = Math.floor(bytes.length / size);
  const out: number[] = [];
  for (let f = rate; f < frames; f++) {
    let sum = 0;
    for (let i = 0; i < size; i++) {
      sum += Math.abs((bytes[f * size + i] ?? 0) - (bytes[(f - rate) * size + i] ?? 0));
    }
    out.push(sum / size);
  }
  return out;
}

const BAND_W = 54;
const BAND_H = 40;

/** The band under the title and above the captions, small, `rate` times a second, as raw RGB. */
function bandFrames(video: string, rate: number, scratch: string): Buffer | null {
  mkdirSync(scratch, { recursive: true });
  const raw = path.join(scratch, 'fill.rgb');
  const r = run(
    'ffmpeg',
    [
      '-v',
      'error',
      '-y',
      '-i',
      video,
      '-vf',
      `fps=${rate},crop=iw:ih*0.4167:0:ih*0.2448,scale=${BAND_W}:${BAND_H}:flags=area`,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgb24',
      raw,
    ],
    LONG,
  );
  if (r.status !== 0 || !existsSync(raw)) return null;
  const bytes = readFileSync(raw);
  rmSync(raw, { force: true });
  return bytes;
}
