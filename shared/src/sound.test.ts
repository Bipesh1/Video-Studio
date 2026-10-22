import { describe, expect, it } from 'vitest';
import {
  AMBIENT_SFX,
  LOUDNESS_TARGET,
  MUSIC_MOODS,
  SFX_NAMES,
  mixProblems,
  mixReportSchema,
  soundPlanSchema,
} from './sound.schema';
import type { MixReport } from './sound.schema';

const report = (over: Partial<MixReport> = {}): MixReport => ({
  version: 1,
  audioFile: 'mix.wav',
  sampleRate: 48000,
  durationMs: 20000,
  lufs: -14.02,
  truePeakDb: -1.1,
  clipped: false,
  onTarget: true,
  silent: false,
  targetLufs: -14,
  truePeakLimitDb: -1,
  hasVoice: true,
  voiceLufs: -14.1,
  speechShare: 0.66,
  musicUnderVoiceDb: -17,
  musicInPausesDb: -11,
  music: [{ mood: 'curious', startMs: 0 }],
  sfx: [{ name: 'ding', atMs: 8250, seconds: 0.9, levelAgainstVoiceDb: -8, overVoice: false }],
  ...over,
});

describe('sound plan', () => {
  it('accepts music moods in order and effects with defaults', () => {
    const plan = soundPlanSchema.parse({
      version: 1,
      music: [
        { mood: 'curious', startMs: 0 },
        { mood: 'tense', startMs: 9000 },
      ],
      sfx: [{ name: 'whoosh', atMs: 1200 }],
    });
    expect(plan.sfx[0]).toMatchObject({ gainDb: 0, pan: 0, seed: 0 });
    expect(plan.musicGainDb).toBe(0);
  });

  it('refuses a mood or an effect that does not exist', () => {
    expect(
      soundPlanSchema.safeParse({ version: 1, music: [{ mood: 'spooky', startMs: 0 }] }).success,
    ).toBe(false);
    expect(
      soundPlanSchema.safeParse({ version: 1, sfx: [{ name: 'explosion', atMs: 0 }] }).success,
    ).toBe(false);
  });

  it('refuses moods out of order, an empty plan, and an effect turned up too far', () => {
    const outOfOrder = soundPlanSchema.safeParse({
      version: 1,
      music: [
        { mood: 'calm', startMs: 5000 },
        { mood: 'hope', startMs: 2000 },
      ],
    });
    expect(outOfOrder.success).toBe(false);
    expect(soundPlanSchema.safeParse({ version: 1 }).success).toBe(false);
    expect(
      soundPlanSchema.safeParse({ version: 1, sfx: [{ name: 'hit', atMs: 0, gainDb: 12 }] })
        .success,
    ).toBe(false);
  });

  it('names twelve moods and keeps the ambient effects inside the effect list', () => {
    expect(MUSIC_MOODS).toHaveLength(12);
    expect(new Set(SFX_NAMES).size).toBe(SFX_NAMES.length);
    for (const name of AMBIENT_SFX) expect(SFX_NAMES).toContain(name);
  });
});

describe('mix report', () => {
  it('passes a mix that is on target', () => {
    expect(mixReportSchema.safeParse(report()).success).toBe(true);
    expect(mixProblems(report())).toEqual([]);
  });

  it('names what is wrong with a mix that is too loud, clipped or drowning the voice', () => {
    const bad = mixProblems(
      report({
        lufs: -11.5,
        truePeakDb: -0.2,
        clipped: true,
        musicUnderVoiceDb: -6,
        sfx: [{ name: 'hit', atMs: 100, seconds: 0.3, levelAgainstVoiceDb: -1, overVoice: true }],
      }),
    );
    expect(bad).toHaveLength(5);
    expect(bad.join(' ')).toContain('LUFS');
    expect(bad.join(' ')).toContain('true peak');
    expect(bad.join(' ')).toContain('hit');
  });

  it('holds the loudness target the plan sets', () => {
    expect(LOUDNESS_TARGET).toEqual({ lufs: -14, toleranceLu: 0.5, truePeakDb: -1 });
  });

  it('accepts a video with no voice', () => {
    const silentVoice = report({
      hasVoice: false,
      voiceLufs: null,
      speechShare: 0,
      musicUnderVoiceDb: null,
      musicInPausesDb: null,
    });
    expect(mixReportSchema.safeParse(silentVoice).success).toBe(true);
    expect(mixProblems(silentVoice)).toEqual([]);
  });
});
