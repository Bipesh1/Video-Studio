import { describe, expect, it } from 'vitest';
import { beatWords, listeningBody, speakingBody } from './gesture';
import { resolvePose } from './pose';
import { holdObject, stand } from './poses';

/** Talking with the body: beats on the words a speaker leans on, nods from the ones listening. */

const fps = 30;
const words = [
  { startMs: 0, endMs: 300 },
  { startMs: 320, endMs: 600, emphasis: true },
  { startMs: 1200, endMs: 1500 },
];

describe('talking with the body', () => {
  it('beats on stressed words and after real pauses, never two close together', () => {
    expect(beatWords(words).map((w) => w.startMs)).toEqual([320]);
    const many = Array.from({ length: 12 }, (_, i) => ({
      startMs: i * 400,
      endMs: i * 400 + 300,
      emphasis: true,
    }));
    const beats = beatWords(many).map((w) => w.startMs);
    beats.slice(1).forEach((at, i) => expect(at - (beats[i] ?? 0)).toBeGreaterThanOrEqual(1400));
  });

  it('nods the head and lifts a free hand on a stressed word, and is still between words', () => {
    const pose = resolvePose(stand);
    const during = speakingBody(pose, Math.round(0.5 * fps), fps, words, 3);
    expect(during.headTilt).not.toBe(pose.headTilt);
    expect(during.arms.front.upper).toBeGreaterThan(pose.arms.front.upper);
    const after = speakingBody(pose, Math.round(3 * fps), fps, words, 3);
    expect(after).toEqual(pose);
    // Feet never move.
    expect(during.legs).toEqual(pose.legs);
  });

  it('leaves a hand that holds something where it is', () => {
    const pose = resolvePose(holdObject);
    const during = speakingBody(pose, Math.round(0.5 * fps), fps, words, 3);
    expect(during.arms).toEqual(pose.arms);
  });

  it('gives a listener a small nod a moment after some stressed words, and nothing else', () => {
    const pose = resolvePose(stand);
    const seen = Array.from({ length: 60 }, (_, f) => listeningBody(pose, f, fps, words, 11));
    for (const p of seen) {
      expect(p.arms).toEqual(pose.arms);
      expect(Math.abs(p.headTilt - pose.headTilt)).toBeLessThanOrEqual(1.51);
    }
  });
});
