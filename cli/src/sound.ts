/**
 * `npm run sound -- <command>`: music, sound effects and the mix (Phase 3).
 *
 *   list                     name every music mood and every sound effect
 *   samples                  one 20-second sample of every mood, as MP3s
 *   reel                     every sound effect in one MP3 to listen to
 *   mix --run=<run>          mix the run's voice with its sound-plan.json into audio/mix.wav
 *   check [--run=<run>]      fail unless every sample and the reel (and the run's mix, when a
 *                            run is given) are on target
 *
 * Samples and the reel go to runs/2026-10-06-sound-test/out. Loudness target: -14 LUFS with
 * the true peak at or below -1 dB (shared/src/sound.schema.ts, LOUDNESS_TARGET).
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { LOUDNESS_TARGET, MUSIC_MOODS, SFX_NAMES } from '@studio/shared';
import { hasSoundPlan, loadMixReport, mixRun, python } from './sound-stage.js';
import { projectRoot } from './system.js';

const SOUND_TEST_RUN = '2026-10-06-sound-test';

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--'));
const value = (name: string) =>
  argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const runDir = path.join(projectRoot, 'runs', value('run') ?? SOUND_TEST_RUN);
const outDir = path.join(projectRoot, 'runs', SOUND_TEST_RUN, 'out');

type Levels = { lufs: number; truePeakDb: number; clipped: boolean; onTarget: boolean };
type Samples = { moods: Array<Levels & { mood: string; file: string }> };
type Reel = Levels & { file: string; effects: Array<{ name: string; clipped: boolean }> };

const readJson = <T>(file: string): T => JSON.parse(readFileSync(file, 'utf8')) as T;
const rel = (file: string) => path.relative(projectRoot, file);

function list() {
  for (const line of python('music', ['list'])) console.log(`music  ${line}`);
  for (const line of python('sfx', ['list'])) console.log(`sfx    ${line}`);
}

function samples() {
  mkdirSync(outDir, { recursive: true });
  for (const line of python('music', ['samples', '--out', outDir])) console.log(line);
}

function reel() {
  mkdirSync(outDir, { recursive: true });
  for (const line of python('sfx', ['reel', '--out', outDir])) console.log(line);
}

function mix() {
  if (!value('run')) throw new Error('Give the run to mix: npm run sound -- mix --run=<folder>');
  for (const line of mixRun(runDir)) console.log(line);
  const r = loadMixReport(runDir);
  console.log(
    `${rel(path.join(runDir, 'audio', 'mix.wav'))}: ${r.lufs} LUFS, true peak ${r.truePeakDb} dB` +
      (r.musicUnderVoiceDb === null ? '' : `, music ${-r.musicUnderVoiceDb} dB under the voice`),
  );
}

/** Phase 3 acceptance: loudness within target on every sample; no clipping. */
function check() {
  const problems: string[] = [];
  const judge = (what: string, l: Levels) => {
    if (!l.onTarget) {
      problems.push(
        `${what}: ${l.lufs} LUFS, true peak ${l.truePeakDb} dB (target ${LOUDNESS_TARGET.lufs} LUFS, peak ${LOUDNESS_TARGET.truePeakDb} dB)`,
      );
    }
    if (l.clipped) problems.push(`${what}: clipped`);
  };
  const samplesFile = path.join(outDir, 'music-samples.json');
  const reelFile = path.join(outDir, 'sfx-reel.json');
  if (!existsSync(samplesFile)) problems.push('no mood samples yet: npm run sound -- samples');
  else {
    const s = readJson<Samples>(samplesFile);
    for (const mood of MUSIC_MOODS) {
      const found = s.moods.find((m) => m.mood === mood);
      if (!found) problems.push(`no sample for the mood ${mood}`);
      else {
        judge(`music ${mood}`, found);
        if (!existsSync(path.join(outDir, found.file))) problems.push(`${found.file} is missing`);
      }
    }
  }
  if (!existsSync(reelFile)) problems.push('no effects reel yet: npm run sound -- reel');
  else {
    const r = readJson<Reel>(reelFile);
    judge('effects reel', r);
    for (const name of SFX_NAMES) {
      const found = r.effects.find((e) => e.name === name);
      if (!found) problems.push(`the reel has no ${name}`);
      else if (found.clipped) problems.push(`sfx ${name}: clipped`);
    }
  }
  if (hasSoundPlan(runDir)) {
    try {
      mixRun(runDir);
    } catch (err) {
      problems.push((err as Error).message);
    }
  }
  if (problems.length) {
    console.log(problems.join('\n'));
    console.log('The sound check failed. The lines above say what is off target.');
    process.exitCode = 1;
    return;
  }
  console.log(
    `Sound is on target: ${MUSIC_MOODS.length} mood samples and ${SFX_NAMES.length} effects at ` +
      `${LOUDNESS_TARGET.lufs} LUFS, true peak at or below ${LOUDNESS_TARGET.truePeakDb} dB, no clipping.`,
  );
}

const commands: Record<string, () => void> = { list, samples, reel, mix, check };
const action = command ? commands[command] : undefined;
if (!action) {
  console.log('Commands: list, samples, reel, mix --run=<run>, check');
  process.exitCode = 1;
} else {
  action();
}
