import { describe, expect, it } from 'vitest';
import { JOIN_DIP_S, joinFilter, joinTracks } from './assembly';
import type { VoiceTrack } from './voice.schema';

/**
 * Joining the finished parts of a video into one (the first piece of Phase 4F): the join is
 * one dip, never a cut to black, and the captions of the whole video run on one clock.
 */

describe('the join between parts', () => {
  it('takes the part before to dark when the next one opens on a fade', () => {
    const filter = joinFilter([
      { seconds: 42.233, fadesIn: false },
      { seconds: 42.4, fadesIn: true },
    ]);
    expect(filter.split(';')).toEqual([
      `[0:v]fade=t=out:st=42.033:d=${JOIN_DIP_S}[v0]`,
      `[0:a]afade=t=out:st=42.033:d=${JOIN_DIP_S}[a0]`,
      '[1:v]null[v1]',
      `[1:a]afade=t=in:st=0:d=${JOIN_DIP_S}[a1]`,
      '[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]',
    ]);
  });

  it('leaves the picture alone on a plain cut, and still eases the sound across it', () => {
    const filter = joinFilter([
      { seconds: 30, fadesIn: false },
      { seconds: 30, fadesIn: false },
      { seconds: 20, fadesIn: true },
    ]);
    const chains = filter.split(';');
    expect(chains[0]).toBe('[0:v]null[v0]');
    // The middle part goes dark for the third, and its sound dips at both ends.
    expect(chains[2]).toBe(`[1:v]fade=t=out:st=29.800:d=${JOIN_DIP_S}[v1]`);
    expect(chains[3]).toBe(
      `[1:a]afade=t=in:st=0:d=${JOIN_DIP_S},afade=t=out:st=29.800:d=${JOIN_DIP_S}[a1]`,
    );
    // The last part's sound comes in and is not taken out again.
    expect(chains[5]).toBe(`[2:a]afade=t=in:st=0:d=${JOIN_DIP_S}[a2]`);
    expect(chains[6]).toBe('[v0][a0][v1][a1][v2][a2]concat=n=3:v=1:a=1[v][a]');
  });

  it('needs at least two parts', () => {
    expect(() => joinFilter([{ seconds: 30, fadesIn: false }])).toThrow('at least two parts');
  });
});

describe('one voice for the whole video', () => {
  const track = (id: string, durationMs: number): VoiceTrack => ({
    version: 1,
    audioFile: 'voice.wav',
    sampleRate: 48000,
    durationMs,
    timingSource: 'kokoro',
    loudnessLufs: -14,
    lines: [
      { id, speaker: 'narrator', voice: 'af_heart', text: 'Two words.', startMs: 300, endMs: 1100 },
    ],
    words: [
      { text: 'Two', startMs: 300, endMs: 600, lineId: id, emphasis: false },
      { text: 'words.', startMs: 600, endMs: 1100, lineId: id, emphasis: true },
    ],
  });

  it('moves every line and word of a part to where the part begins', () => {
    const joined = joinTracks([track('n1', 42230), track('n10', 42400)], [0, 42233]);
    expect(joined.durationMs).toBe(84633);
    expect(joined.lines.map((l) => [l.id, l.startMs, l.endMs])).toEqual([
      ['n1', 300, 1100],
      ['n10', 42533, 43333],
    ]);
    expect(joined.words.map((w) => w.startMs)).toEqual([300, 600, 42533, 42833]);
    expect(joined.words[3]).toMatchObject({ text: 'words.', lineId: 'n10', emphasis: true });
  });

  it('has no voice to join when there are no parts', () => {
    expect(() => joinTracks([], [])).toThrow('no voice to join');
  });
});
