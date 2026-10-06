/**
 * The sound stage of a run: voice, music and effects become one finished track.
 *
 * A run folder with a `sound-plan.json` (contract: shared/src/sound.schema.ts) gets
 * `audio/mix.wav`, the music and effects on their own, and `audio/mix.json` with the measured
 * levels. The stage is skipped when the mix is already newer than everything it is made from.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { mixProblems, mixReportSchema, parseOrExplain, soundPlanSchema } from '@studio/shared';
import type { MixReport } from '@studio/shared';
import { projectRoot, run } from './system.js';

const audioProject = path.join(projectRoot, 'audio');

/** Run one of the Python sound workers and return what it printed. */
export function python(module: string, args: string[], timeoutMs = 30 * 60_000): string[] {
  const r = run('uv', ['run', 'python', '-m', `studio_audio.${module}`, ...args], {
    cwd: audioProject,
    timeoutMs,
  });
  const out = `${r.stdout ?? ''}`.trim().split(/\r?\n/).filter(Boolean);
  if (r.status !== 0) {
    const why = [...out, `${r.stderr ?? ''}`.trim()].filter(Boolean).slice(-6).join('\n');
    throw new Error(`The ${module} worker failed (exit code ${r.status}).\n${why}`);
  }
  return out;
}

export const planPath = (runDir: string) => path.join(runDir, 'sound-plan.json');
export const hasSoundPlan = (runDir: string) => existsSync(planPath(runDir));

export function loadMixReport(runDir: string): MixReport {
  const file = path.join(runDir, 'audio', 'mix.json');
  if (!existsSync(file)) throw new Error('No mix yet. Run the sound stage first.');
  return parseOrExplain(mixReportSchema, JSON.parse(readFileSync(file, 'utf8')), 'audio/mix.json');
}

const modified = (file: string) => (existsSync(file) ? statSync(file).mtimeMs : 0);

/**
 * Mix a run. Returns lines to log. Throws in plain words if the plan is not valid, or if the
 * finished mix misses the loudness target, clips, or lets music or an effect near the voice.
 */
export function mixRun(runDir: string): string[] {
  const plan = planPath(runDir);
  if (!existsSync(plan)) throw new Error(`There is no sound-plan.json in ${runDir}.`);
  parseOrExplain(soundPlanSchema, JSON.parse(readFileSync(plan, 'utf8')), 'sound-plan.json');
  const audioDir = path.join(runDir, 'audio');
  const voice = path.join(audioDir, 'voice.wav');
  const mix = path.join(audioDir, 'mix.wav');
  const lines: string[] = [];
  const fresh =
    modified(mix) > 0 &&
    modified(path.join(audioDir, 'mix.json')) > 0 &&
    modified(mix) > Math.max(modified(plan), modified(voice));
  if (fresh) {
    lines.push('mix is already up to date (the plan and the voice have not changed)');
  } else {
    const args = ['build', '--plan', plan, '--out', audioDir];
    if (existsSync(voice)) args.push('--voice', voice);
    lines.push(...python('mix', args).slice(-1));
  }
  const report = loadMixReport(runDir);
  const problems = mixProblems(report);
  if (problems.length) {
    throw new Error(
      `The mix is not good enough to use:\n${problems.map((p) => `  - ${p}`).join('\n')}`,
    );
  }
  return lines;
}
