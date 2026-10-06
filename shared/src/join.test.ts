import { describe, expect, it } from 'vitest';
import { JOIN_DIP_S, joinFilter, joinTracks, partStoryboard } from './assembly';
import fixture from './fixtures/moon-tax.storyboard.json';
import { storyboardSchema } from './storyboard.schema';
import type { VoiceTrack } from './voice.schema';

/**
 * Joining the finished parts of a video into one (Phase 4F): the pictures join on one dip,
 * never a cut to black, and the voice of the whole video runs on one clock. The sound itself
 * is not joined: it is mixed once for the whole video (output.test.ts).
 */

describe('the join between parts', () => {
  it('takes the part before to dark when the next one opens on a fade', () => {
    const filter = joinFilter([
      { seconds: 42.233, fadesIn: false },
      { seconds: 42.4, fadesIn: true },
    ]);
    expect(filter.split(';')).toEqual([
      `[0:v]fade=t=out:st=42.033:d=${JOIN_DIP_S}[v0]`,
      '[1:v]null[v1]',
      '[v0][v1]concat=n=2:v=1:a=0,format=yuv420p[v]',
    ]);
  });

  it('leaves the picture alone on a plain cut, and goes dark before a closing card', () => {
    const chains = joinFilter([
      { seconds: 30, fadesIn: false },
      { seconds: 30, fadesIn: false },
      // The page's closing card comes up out of the dark.
      { seconds: 3, fadesIn: true },
    ]).split(';');
    expect(chains[0]).toBe('[0:v]null[v0]');
    expect(chains[1]).toBe(`[1:v]fade=t=out:st=29.800:d=${JOIN_DIP_S}[v1]`);
    expect(chains[2]).toBe('[2:v]null[v2]');
    expect(chains[3]).toBe('[v0][v1][v2]concat=n=3:v=1:a=0,format=yuv420p[v]');
    // No sound is touched: every chain is a picture.
    expect(chains.join(';')).not.toMatch(/:a\]|afade/);
  });

  it('passes a video in one part through as it is', () => {
    expect(joinFilter([{ seconds: 30, fadesIn: false }])).toBe(
      '[0:v]null[v0];[v0]format=yuv420p[v]',
    );
    expect(() => joinFilter([])).toThrow('nothing to join');
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

describe('a part and the cover', () => {
  it('leaves the cover with the whole video, so choosing another never changes a part', () => {
    const whole = storyboardSchema.parse({ ...fixture, cover: { shot: 's2b', framing: 'medium' } });
    expect(whole.cover).toEqual({ shot: 's2b', at: 0.6, framing: 'medium' });
    const part = partStoryboard(whole, 1);
    expect('cover' in part).toBe(false);
    const other = storyboardSchema.parse({ ...fixture, cover: { shot: 's1a', at: 0.2 } });
    expect(JSON.stringify(partStoryboard(other, 1))).toBe(JSON.stringify(part));
  });

  it('refuses a cover of a shot that is not in the video', () => {
    const bad = storyboardSchema.safeParse({ ...fixture, cover: { shot: 's99z' } });
    expect(JSON.stringify(bad.error?.issues ?? [])).toContain(
      'the cover shows shot \\"s99z\\", which is not in the video',
    );
  });
});
