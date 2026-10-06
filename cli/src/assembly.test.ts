import path from 'node:path';
import {
  CUT_LEAD_MS,
  LEAD_IN_MS,
  partCount,
  partStoryboard,
  plainWords,
  soundPlanFor,
  soundPlanSchema,
  storyboardSchema,
  timeShots,
  voiceScriptFor,
  voiceScriptSchema,
  voiceTrackSchema,
} from '@studio/shared';
import type { Storyboard, VoiceScript, VoiceTrack } from '@studio/shared';
import { describe, expect, it } from 'vitest';
import { projectRoot } from './system';
import { loadStoryboard, loadWorld } from './world';

/**
 * Assembly hand-offs (Phase 4D): a part of the storyboard becomes a voice script, the voice's
 * times go into the shots, and the shots' music and effects become a plan for the mix.
 */

const world = loadWorld();
const plan = loadStoryboard(
  path.join(projectRoot, 'runs', '2026-10-06-honest-farmer', 'storyboard.json'),
);

/** A voice track as the worker would write it: 320 ms a word, the script's pauses between lines. */
function fakeTrack(script: VoiceScript): VoiceTrack {
  let at = script.leadInMs;
  const lines: VoiceTrack['lines'] = [];
  const words: VoiceTrack['words'] = [];
  for (const line of script.lines) {
    const start = at;
    for (const word of line.text.split(/\s+/).filter(Boolean)) {
      words.push({
        text: word.replace(/\*/g, ''),
        startMs: at,
        endMs: at + 280,
        lineId: line.id,
        emphasis: word.includes('*'),
      });
      at += 320;
    }
    lines.push({
      id: line.id,
      speaker: line.speaker,
      voice: line.voice,
      text: line.text,
      startMs: start,
      endMs: at - 40,
    });
    at += line.pauseAfterMs;
  }
  return voiceTrackSchema.parse({
    version: 1,
    audioFile: 'voice.wav',
    sampleRate: 24000,
    durationMs: at + script.tailMs,
    timingSource: 'kokoro',
    loudnessLufs: -17,
    lines,
    words,
  });
}

const part = (n: number) => partStoryboard(plan, n);
const timed = (n: number): { sb: Storyboard; track: VoiceTrack } => {
  const track = fakeTrack(voiceScriptFor(part(n), world));
  return { sb: timeShots(part(n), track), track };
};

describe('one part of a video', () => {
  it('stands alone as a storyboard of its own', () => {
    expect(partCount(plan)).toBe(2);
    const one = part(1);
    const two = part(2);
    expect(storyboardSchema.safeParse(one).success).toBe(true);
    expect(storyboardSchema.safeParse(two).success).toBe(true);
    expect(one.scenes.map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4']);
    expect(two.scenes.map((s) => s.id)).toEqual(['s5', 's6', 's7', 's8', 's9']);
    expect(two.scenes.every((s) => s.chapter === 1)).toBe(true);
    expect(one.cast).toEqual(plan.cast);
  });

  it('keeps the title to the first part', () => {
    const titles = (sb: Storyboard) =>
      sb.scenes.flatMap((s) => s.shots).filter((s) => s.overlay?.kind === 'title').length;
    expect(titles(part(1))).toBe(1);
    expect(titles(part(2))).toBe(0);
  });

  it('says so when there is no such part', () => {
    expect(() => part(3)).toThrow('has no part 3');
  });
});

describe('the voice script', () => {
  it('gives every line its speaker’s Kokoro voice, its speed and its pause', () => {
    const script = voiceScriptSchema.parse(voiceScriptFor(part(1), world));
    expect(script.leadInMs).toBe(LEAD_IN_MS);
    const byId = new Map(script.lines.map((l) => [l.id, l]));
    expect(byId.get('n1')?.voice).toBe(world.voices.narrator?.kokoroVoice);
    expect(byId.get('d1')?.voice).toBe(world.voices.woman?.kokoroVoice);
    expect(byId.get('d1')?.speaker).toBe('wife');
    expect(byId.get('n2')?.pauseAfterMs).toBe(900);
    // A line with no pause of its own takes the format's usual one.
    expect(byId.get('n3')?.pauseAfterMs).toBe(world.formats.story?.pacing.pauseMs.normal);
    expect(script.lines.map((l) => l.id)).toEqual(
      part(1).scenes.flatMap((s) => s.lines.map((l) => l.id)),
    );
  });

  it('keeps the words exactly, emphasis marks and all', () => {
    const script = voiceScriptFor(part(2), world);
    const lines = part(2).scenes.flatMap((s) => s.lines);
    expect(script.lines.map((l) => l.text)).toEqual(lines.map((l) => l.text));
  });

  it('follows a slower voice and a longer pause scale', () => {
    const w = structuredClone(world);
    const narrator = w.voices.narrator;
    if (!narrator) throw new Error('no narrator');
    narrator.speed = 0.9;
    narrator.pauseScale = 1.5;
    const script = voiceScriptFor(part(1), w);
    expect(script.lines[0]?.speed).toBe(0.9);
    expect(script.lines[1]?.pauseAfterMs).toBe(1350);
  });

  it('refuses a speaker with no voice', () => {
    const sb = structuredClone(part(1));
    const wife = sb.cast.find((m) => m.id === 'wife');
    if (wife) delete wife.voice;
    expect(() => voiceScriptFor(sb, world)).toThrow('"wife" speaks line "d1" and has no voice');
  });
});

describe('shot times from the voice', () => {
  it('covers every moment of the track, in order, from zero to the end', () => {
    for (const n of [1, 2]) {
      const { sb, track } = timed(n);
      expect(storyboardSchema.safeParse(sb).success).toBe(true);
      const shots = sb.scenes.flatMap((s) => s.shots);
      expect(shots[0]?.startMs).toBe(0);
      expect(shots[shots.length - 1]?.endMs).toBe(track.durationMs);
      shots.forEach((shot, i) => {
        expect(shot.endMs).toBeGreaterThan(shot.startMs ?? 0);
        if (i > 0) expect(shot.startMs).toBe(shots[i - 1]?.endMs);
      });
    }
  });

  it('starts each shot just before the word it opens on', () => {
    const { sb, track } = timed(1);
    for (const scene of sb.scenes) {
      for (const line of scene.lines) {
        const words = track.words.filter((w) => w.lineId === line.id);
        const shots = scene.shots.filter((s) => s.line === line.id);
        let before = 0;
        shots.forEach((shot, i) => {
          const first = words[before];
          if (!first) throw new Error('no word');
          if (shot.startMs !== 0) {
            expect(shot.startMs).toBeLessThanOrEqual(first.startMs);
            expect(first.startMs - (shot.startMs ?? 0)).toBeLessThanOrEqual(CUT_LEAD_MS);
          }
          if (i > 0) expect(shot.startMs).toBeGreaterThanOrEqual(words[before - 1]?.endMs ?? 0);
          before += plainWords(shot.words).split(' ').length;
        });
      }
    }
  });

  it('never cuts into the line before', () => {
    const { sb, track } = timed(2);
    const firstOf = new Map(
      sb.scenes.flatMap((s) =>
        s.lines.map((l) => [l.id, s.shots.find((shot) => shot.line === l.id)] as const),
      ),
    );
    track.lines.forEach((line, i) => {
      const prev = track.lines[i - 1];
      if (prev) expect(firstOf.get(line.id)?.startMs).toBeGreaterThan(prev.endMs);
    });
  });

  it('says so when the voice track is for other lines', () => {
    const track = fakeTrack(voiceScriptFor(part(2), world));
    expect(() => timeShots(part(1), track)).toThrow('has no line "n1"');
  });
});

describe('the sound plan', () => {
  it('starts each mood where its scene starts, and does not restart one that carries on', () => {
    const { sb } = timed(1);
    const plan1 = soundPlanSchema.parse(soundPlanFor(sb));
    expect(plan1.music.map((m) => m.mood)).toEqual(['curious', 'tense', 'sorrow']);
    expect(plan1.music[0]?.startMs).toBe(0);
    expect(plan1.music[1]?.startMs).toBe(sb.scenes[2]?.shots[0]?.startMs);
    expect(plan1.music[2]?.startMs).toBe(sb.scenes[3]?.shots[0]?.startMs);
  });

  it('places every effect inside its shot, and lets steps and wind run for it', () => {
    const { sb } = timed(1);
    const plan1 = soundPlanFor(sb);
    const shots = sb.scenes.flatMap((s) => s.shots);
    expect(plan1.sfx).toHaveLength(shots.reduce((n, s) => n + s.sfx.length, 0));
    const inShot = (id: string) => {
      const shot = shots.find((s) => s.id === id);
      return plan1.sfx.filter((c) => c.atMs >= (shot?.startMs ?? 0) && c.atMs < (shot?.endMs ?? 0));
    };
    const steps = inShot('s2c').find((c) => c.name === 'footsteps');
    const s2c = shots.find((s) => s.id === 's2c');
    expect(steps?.durationMs).toBeGreaterThan(400);
    expect((steps?.atMs ?? 0) + (steps?.durationMs ?? 0)).toBeLessThanOrEqual(s2c?.endMs ?? 0);
    expect(steps?.gainDb).toBe(-2);
    expect(inShot('s1b').find((c) => c.name === 'wind')?.durationMs).toBeGreaterThan(1000);
    expect(inShot('s2d').find((c) => c.name === 'pop')?.durationMs).toBeUndefined();
  });

  it('needs the shots to have times', () => {
    expect(() => soundPlanFor(part(1))).toThrow('no times yet');
  });
});
