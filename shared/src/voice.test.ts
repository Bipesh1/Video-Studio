import { describe, expect, it } from 'vitest';
import { parseOrExplain, voiceScriptSchema, voiceTrackSchema } from './voice.schema';

const goodTrack = {
  version: 1,
  audioFile: 'voice.wav',
  sampleRate: 24000,
  durationMs: 2000,
  timingSource: 'kokoro',
  loudnessLufs: -16,
  lines: [
    {
      id: 'n1',
      speaker: 'narrator',
      voice: 'am_michael',
      text: 'Hello there.',
      startMs: 300,
      endMs: 1500,
    },
  ],
  words: [
    { text: 'Hello', startMs: 300, endMs: 800, lineId: 'n1', emphasis: false },
    { text: 'there.', startMs: 800, endMs: 1500, lineId: 'n1', emphasis: true },
  ],
};

describe('voice contracts', () => {
  it('accept a valid voice track', () => {
    expect(voiceTrackSchema.safeParse(goodTrack).success).toBe(true);
  });

  it('reject words out of order or past the end of the audio', () => {
    const late = structuredClone(goodTrack);
    late.words[1] = { ...late.words[1]!, endMs: 2500 };
    expect(voiceTrackSchema.safeParse(late).success).toBe(false);
    const backwards = structuredClone(goodTrack);
    backwards.words[1] = { ...backwards.words[1]!, startMs: 100, endMs: 200 };
    expect(voiceTrackSchema.safeParse(backwards).success).toBe(false);
  });

  it('reject a word that ends before it starts', () => {
    const bad = structuredClone(goodTrack);
    bad.words[0] = { ...bad.words[0]!, startMs: 900, endMs: 800 };
    expect(voiceTrackSchema.safeParse(bad).success).toBe(false);
  });

  it('fill defaults in a voice script and reject bad voice ids', () => {
    const s = voiceScriptSchema.parse({
      lines: [{ id: 'n1', speaker: 'narrator', voice: 'am_michael', text: 'Hi.' }],
    });
    expect(s.lines[0]?.speed).toBe(1);
    expect(s.leadInMs).toBe(300);
    expect(() =>
      parseOrExplain(
        voiceScriptSchema,
        { lines: [{ id: 'n1', speaker: 'x', voice: 'Michael', text: 'Hi' }] },
        'voice-script.json',
      ),
    ).toThrow(/voice-script\.json is not valid/);
  });
});
