import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { timeShots } from './assembly';
import fixture from './fixtures/moon-tax.storyboard.json';
import {
  emptyPictureCheck,
  stillPictureCheck,
  checkResult,
  clock,
  fileCheck,
  lengthCheck,
  lookChecks,
  loudnessCheck,
  madeFromCheck,
  parseLoudness,
  parseProbe,
  parseSilences,
  qaPage,
  qaStrips,
  qaVerdict,
  silenceCheck,
  soundDifference,
  stepCheck,
  wordsHeardCheck,
} from './qa';
import type { VideoProbe } from './qa';
import { QA_QUESTIONS, STORY_CHECK, STYLE_CHECK, qaLookSchema, qaReportSchema } from './qa.schema';
import type { QaLook, QaReport } from './qa.schema';
import type { MixReport } from './sound.schema';
import { plainWords, storyboardSchema } from './storyboard.schema';
import type { Storyboard } from './storyboard.schema';
import type { VoiceTrack } from './voice.schema';

/**
 * The self-check of a finished part (Phase 4E): each measured check passes what is right and
 * names what is wrong in plain words, a look that was not taken or was taken at an older video
 * never counts, and the report says first whether the part is ready.
 */

const here = dirname(fileURLToPath(import.meta.url));

/** A voice for the worked example: every word 300 ms, 400 ms between lines, 900 ms at the end. */
function spoken(sb: Storyboard): VoiceTrack {
  const lines: VoiceTrack['lines'] = [];
  const words: VoiceTrack['words'] = [];
  let at = 300;
  for (const scene of sb.scenes) {
    for (const line of scene.lines) {
      const startMs = at;
      for (const text of plainWords(line.text).split(' ')) {
        words.push({ text, startMs: at, endMs: at + 300, lineId: line.id, emphasis: false });
        at += 300;
      }
      lines.push({
        id: line.id,
        speaker: line.speaker,
        voice: 'af_heart',
        text: line.text,
        startMs,
        endMs: at,
      });
      at += 400;
    }
  }
  return {
    version: 1,
    audioFile: 'voice.wav',
    sampleRate: 48000,
    durationMs: at + 500,
    timingSource: 'kokoro',
    loudnessLufs: -14,
    lines,
    words,
  };
}

const plan = storyboardSchema.parse(fixture);
const track = spoken(plan);
const timed = timeShots(plan, track);
const videoSeconds = track.durationMs / 1000;
const texts = (check: { findings: Array<{ text: string }> }) =>
  check.findings.map((f) => f.text).join('\n');

const probe: VideoProbe = {
  seconds: 42.23,
  width: 1920,
  height: 1080,
  fps: 30,
  videoCodec: 'h264',
  pixelFormat: 'yuv420p',
  audioCodec: 'aac',
  audioSeconds: 42.24,
};
const wide = { width: 1920, height: 1080 };

describe('the questions of the self-check', () => {
  it('asks the Style Check word for word as the style guide has it', () => {
    const guide = readFileSync(join(here, '..', '..', 'styles', 'ink-stick', 'guide.md'), 'utf8');
    const section = guide.slice(guide.indexOf('### Style 11.'), guide.indexOf('### Style 12.'));
    const asked = [...section.matchAll(/^\d+\. (.+)$/gm)].map((m) => m[1]);
    expect(STYLE_CHECK.map((q) => q.text)).toEqual(asked);
    expect(STYLE_CHECK).toHaveLength(11);
  });

  it('gives every question its own id', () => {
    expect(new Set(QA_QUESTIONS.map((q) => q.id)).size).toBe(QA_QUESTIONS.length);
    expect(STORY_CHECK).toHaveLength(7);
  });
});

describe('reading ffprobe and ffmpeg', () => {
  it('reads the size, speed, length and sound of a video file', () => {
    const json = JSON.stringify({
      streams: [
        {
          codec_type: 'video',
          codec_name: 'h264',
          pix_fmt: 'yuvj420p',
          width: 1920,
          height: 1080,
          avg_frame_rate: '30/1',
          duration: '42.233333',
        },
        { codec_type: 'audio', codec_name: 'aac', duration: '42.240000' },
      ],
      format: { duration: '42.240000' },
    });
    expect(parseProbe(json)).toEqual({ ...probe, seconds: 42.233333, pixelFormat: 'yuvj420p' });
    expect(parseProbe('not json')).toBeNull();
    expect(parseProbe(JSON.stringify({ streams: [{ codec_type: 'audio' }] }))).toBeNull();
    const silent = parseProbe(
      JSON.stringify({ streams: [{ codec_type: 'video', avg_frame_rate: '30/1' }] }),
    );
    expect(silent?.audioCodec).toBeNull();
  });

  it('reads the loudness and the true peak from the summary, not from the running lines', () => {
    const log = [
      '[Parsed_ebur128_0] t: 1.0  M: -20.1 S:-120.7  I: -19.9 LUFS  LRA: 0.0 LU',
      '[Parsed_ebur128_0] Summary:',
      '  Integrated loudness:',
      '    I:         -14.0 LUFS',
      '    Threshold: -24.8 LUFS',
      '  True peak:',
      '    Peak:       -1.1 dBFS',
    ].join('\n');
    expect(parseLoudness(log)).toEqual({ lufs: -14.0, truePeakDb: -1.1 });
    expect(parseLoudness('nothing here')).toBeNull();
  });

  it('reads every stretch of silence, one still open at the end too', () => {
    const log = [
      '[silencedetect @ 0x1] silence_start: 3.5',
      '[silencedetect @ 0x1] silence_end: 4.25 | silence_duration: 0.75',
      '[silencedetect @ 0x1] silence_start: 40',
    ].join('\n');
    expect(parseSilences(log, 42000)).toEqual([
      { startMs: 3500, endMs: 4250 },
      { startMs: 40000, endMs: 42000 },
    ]);
    expect(parseSilences('', 42000)).toEqual([]);
  });
});

describe('the file plays', () => {
  const check = (p: VideoProbe | null, decodeErrors = '') =>
    fileCheck({ probe: p, decodeErrors, size: wide, fps: 30 });

  it('passes a file of the right size and speed with picture and sound', () => {
    expect(checkResult(check(probe))).toBe('passed');
    expect(checkResult(check({ ...probe, pixelFormat: 'yuvj420p' }))).toBe('passed');
  });

  it('names a wrong size, a wrong speed, no sound, and sound of another length', () => {
    expect(texts(check({ ...probe, width: 1080, height: 1920 }))).toContain(
      'it should be 1920x1080',
    );
    expect(texts(check({ ...probe, fps: 25 }))).toContain('25 pictures a second');
    expect(texts(check({ ...probe, audioCodec: null, audioSeconds: null }))).toContain(
      'no sound in it',
    );
    expect(texts(check({ ...probe, audioSeconds: 40 }))).toContain('s shorter than the picture');
    expect(texts(check({ ...probe, videoCodec: 'vp9' }))).toContain('some phones cannot play');
  });

  it('fails a file that cannot be opened or is damaged inside', () => {
    expect(texts(check(null))).toContain('could not be opened');
    expect(texts(check(probe, '\n[h264 @ 0x1] error while decoding MB 12 3\n'))).toContain(
      'damaged inside: [h264 @ 0x1] error while decoding',
    );
  });
});

describe('the length', () => {
  const story = { name: 'Story', lengthRange: { min: 20, max: 180 } };

  it('lets a part run up to a minute and no more', () => {
    expect(checkResult(lengthCheck({ seconds: 42.2, parts: 2, format: story }))).toBe('passed');
    expect(texts(lengthCheck({ seconds: 61, parts: 2, format: story }))).toContain(
      'a part may be up to 60 s',
    );
    expect(texts(lengthCheck({ seconds: 3, parts: 2, format: story }))).toContain(
      'only 3.0 s long',
    );
  });

  it('holds a video in one part to its format', () => {
    expect(texts(lengthCheck({ seconds: 12, parts: 1, format: story }))).toContain(
      'a story video runs 20 to 180 s',
    );
    // A part of a longer video is not the whole video.
    expect(checkResult(lengthCheck({ seconds: 12, parts: 3, format: story }))).toBe('passed');
  });
});

describe('picture and voice in step', () => {
  const check = (storyboard: Storyboard, v: VoiceTrack = track, s = videoSeconds) =>
    stepCheck({ storyboard, track: v, videoSeconds: s });
  const edited = (edit: (sb: Storyboard) => void): Storyboard => {
    const copy = structuredClone(timed);
    edit(copy);
    return copy;
  };

  it('passes shots timed from their own voice', () => {
    expect(check(timed).findings).toEqual([]);
    expect(check(timed).detail).toContain('13 shots end to end');
  });

  it('wants times in the shots', () => {
    expect(texts(check(plan))).toContain('shot "s1a" has no time from the voice yet');
  });

  it('names a gap and an overlap between two shots', () => {
    const gap = edited((sb) => {
      const shot = sb.scenes[0]?.shots[0];
      if (shot?.endMs) shot.endMs -= 500;
    });
    expect(texts(check(gap))).toContain('shots "s1a" and "s1b" leave a gap of 0.50 s');
    const overlap = edited((sb) => {
      const shot = sb.scenes[0]?.shots[1];
      if (shot?.startMs) shot.startMs -= 200;
    });
    expect(texts(check(overlap))).toContain('overlap by 0.20 s');
  });

  it('notices a voice that says other words, or leaves a line out', () => {
    const other = structuredClone(track);
    const first = other.lines[0];
    if (first) first.text = 'Something else entirely';
    expect(texts(check(timed, other))).toContain(
      'the voice says other words than the plan for line "n1"',
    );
    const missing = { ...track, lines: track.lines.slice(1) };
    expect(texts(check(timed, missing))).toContain('the voice never says line "n1"');
  });

  it('notices a picture that comes on after its words have begun', () => {
    const late = edited((sb) => {
      const first = sb.scenes[1]?.shots[0];
      const before = sb.scenes[0]?.shots[1];
      if (first?.startMs !== undefined && before) {
        first.startMs += 500;
        before.endMs = first.startMs;
      }
    });
    expect(texts(check(late))).toContain('line "n2" starts 0.35 s before its picture comes on');
  });

  it('notices words that run past their picture', () => {
    const early = edited((sb) => {
      const last = sb.scenes[0]?.shots[1];
      const next = sb.scenes[1]?.shots[0];
      if (last?.endMs !== undefined && next) {
        last.endMs -= 600;
        next.startMs = last.endMs;
      }
    });
    expect(texts(check(early))).toMatch(/the words of line "n1" run 0\.\d+ s past their picture/);
  });

  it('notices a picture and a voice of different lengths', () => {
    expect(texts(check(timed, track, videoSeconds - 1))).toContain('render the video again');
    const longer = { ...track, durationMs: track.durationMs + 2000 };
    expect(texts(check(timed, longer, videoSeconds + 2))).toContain(
      "put the voice's times in again",
    );
  });
});

describe('silence and loudness', () => {
  it('fails on dead silence and points out a long pause between words', () => {
    expect(checkResult(silenceCheck({ silences: [], track }))).toBe('passed');
    const dead = silenceCheck({ silences: [{ startMs: 23000, endMs: 23800 }], track });
    expect(texts(dead)).toContain('dead silence for 0.8 s from 0:23');
    expect(checkResult(dead)).toBe('failed');
    const paused = structuredClone(track);
    for (const w of paused.words.slice(5)) {
      w.startMs += 4000;
      w.endMs += 4000;
    }
    const pause = silenceCheck({ silences: [], track: paused });
    expect(checkResult(pause)).toBe('noted');
    expect(texts(pause)).toContain('nobody speaks for 4.0 s');
  });

  it('holds the finished file to -14 LUFS, give or take half, and the peak to -1 dB', () => {
    expect(checkResult(loudnessCheck({ measured: { lufs: -14.0, truePeakDb: -1.1 } }))).toBe(
      'passed',
    );
    expect(checkResult(loudnessCheck({ measured: { lufs: -14.4, truePeakDb: -1.0 } }))).toBe(
      'passed',
    );
    expect(texts(loudnessCheck({ measured: { lufs: -16, truePeakDb: -3 } }))).toContain(
      'the loudness is -16 LUFS',
    );
    expect(texts(loudnessCheck({ measured: { lufs: -14, truePeakDb: -0.4 } }))).toContain(
      'the highest peak is -0.4 dB',
    );
    expect(texts(loudnessCheck({ measured: null }))).toContain('could not be measured');
  });
});

describe('nothing drowns the words', () => {
  const mix: MixReport = {
    version: 1,
    audioFile: 'mix.wav',
    sampleRate: 48000,
    durationMs: track.durationMs,
    lufs: -14,
    truePeakDb: -1.1,
    clipped: false,
    onTarget: true,
    silent: false,
    targetLufs: -14,
    truePeakLimitDb: -1,
    hasVoice: true,
    voiceLufs: -14.1,
    speechShare: 0.7,
    musicUnderVoiceDb: -17,
    musicInPausesDb: -11,
    music: [{ mood: 'curious', startMs: 0 }],
    sfx: [
      { name: 'ding', atMs: 60, seconds: 0.9, levelAgainstVoiceDb: -12, overVoice: true },
      { name: 'thud', atMs: 29995, seconds: 0.5, levelAgainstVoiceDb: -2, overVoice: false },
    ],
  };

  it('passes effects and music that sit under the voice', () => {
    const check = wordsHeardCheck({ mix, track });
    expect(check.findings).toEqual([]);
    expect(check.detail).toContain(
      '2 sound effects, the loudest of those over words 12 dB under the voice',
    );
    expect(check.detail).toContain('the music sits 17 dB under the voice');
  });

  it('names an effect as loud as the words it lands on, and music too close to the voice', () => {
    const loud = structuredClone(mix);
    const thud = loud.sfx[1];
    if (thud) thud.overVoice = true;
    expect(texts(wordsHeardCheck({ mix: loud, track }))).toContain(
      'the thud at 0:30 is as loud as the words it lands on',
    );
    expect(texts(wordsHeardCheck({ mix: { ...mix, musicUnderVoiceDb: -6 }, track }))).toContain(
      'only 6 dB under the voice',
    );
  });

  it('refuses a mix that is missing or belongs to another voice', () => {
    expect(texts(wordsHeardCheck({ mix: null, track }))).toContain('no report of the mix');
    expect(texts(wordsHeardCheck({ mix: { ...mix, durationMs: 1000 }, track }))).toContain(
      'not of this voice',
    );
  });
});

describe('the video is of this plan and this sound', () => {
  const rate = 8000;
  /** Ten seconds of something like a voice over music: two tones that come and go, and a hiss. */
  const mixOf = (seconds = 10): Int16Array => {
    const out = new Int16Array(rate * seconds);
    let noise = 7;
    for (let i = 0; i < out.length; i++) {
      const t = i / rate;
      noise = (noise * 1103515245 + 12345) % 2147483648;
      const hiss = (noise / 2147483648 - 0.5) * 600;
      out[i] = Math.round(
        6000 * Math.sin(2 * Math.PI * 220 * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.7 * t)) +
          2500 * Math.sin(2 * Math.PI * 523 * t) +
          hiss,
      );
    }
    return out;
  };
  const mix = mixOf();
  /** The mix as a video file carries it: a touch quieter, a few samples late, a little noise. */
  const encoded = (source: Int16Array, lag = 12): Int16Array =>
    source.map((_, i) => Math.round((source[i - lag] ?? 0) * 0.97 + ((i * 37) % 11) - 5));

  it('finds the sound of a video to be its mix, a few samples late and a touch quieter', () => {
    const { worstDb } = soundDifference(encoded(mix), mix, rate);
    expect(worstDb).toBeLessThan(-30);
  });

  it('finds one second where another sound effect was mixed in', () => {
    const other = mix.slice();
    // A thud in the seventh second that the mix as it stands does not have.
    for (let i = 0; i < rate / 2; i++) {
      const at = 6 * rate + 1000 + i;
      other[at] = (other[at] ?? 0) + Math.round(5000 * Math.sin(2 * Math.PI * 90 * (i / rate)));
    }
    const found = soundDifference(encoded(other), mix, rate);
    expect(found.worstDb).toBeGreaterThan(-30);
    expect(found.atMs).toBe(6000);
  });

  it('passes a video made from the plan and the mix as they stand', () => {
    const record = {
      video: 'a-v2.mp4',
      storyboard: 'abc',
      mix: 'def',
      madeAt: '2026-10-06T00:00:00Z',
    };
    const good = madeFromCheck({ record, storyboard: 'abc', sound: { worstDb: -40, atMs: 0 } });
    expect(good.findings).toEqual([]);
    expect(good.detail).toContain('40 dB under it at most');
  });

  it('fails a video older than its plan, one with the last mix in it, and one with no record', () => {
    const record = {
      video: 'a-v2.mp4',
      storyboard: 'abc',
      mix: 'def',
      madeAt: '2026-10-06T00:00:00Z',
    };
    const sound = { worstDb: -40, atMs: 0 };
    expect(texts(madeFromCheck({ record, storyboard: 'xyz', sound }))).toContain(
      'the plan has changed since this video was made; render it again',
    );
    expect(
      texts(madeFromCheck({ record, storyboard: 'abc', sound: { worstDb: -18, atMs: 29000 } })),
    ).toContain('the sound in the video is not the mix as it stands now (they part most at 0:29)');
    expect(texts(madeFromCheck({ record: null, storyboard: 'abc', sound }))).toContain(
      'there is no record of what this video was made from',
    );
    expect(texts(madeFromCheck({ record, storyboard: 'abc', sound: null }))).toContain(
      'could not be compared',
    );
  });

  it('passes a video whose plan changed only in its sound, when the sound is the new mix', () => {
    // Biku, 2026-10-21: "its only changing sounds why take that much time?"
    const record = {
      video: 'a-v3.mp4',
      storyboard: 'abc',
      pictures: 'pic',
      mix: 'new',
      madeAt: '2026-10-21T00:00:00Z',
      soundOn: 'a-v2.mp4',
    };
    const sound = { worstDb: -40, atMs: 0 };
    expect(madeFromCheck({ record, storyboard: 'xyz', pictures: 'pic', sound }).findings).toEqual(
      [],
    );
    expect(texts(madeFromCheck({ record, storyboard: 'xyz', pictures: 'other', sound }))).toContain(
      'the plan has changed since this video was made',
    );
  });
});

describe('what Claude saw', () => {
  const shots = ['s1a', 's1b'];
  const strips = ['cut-s1a-s1b', 's1a-move-1'];
  const video = 'story-part-1-16x9-v3.mp4';
  const look: QaLook = qaLookSchema.parse({
    version: 1,
    video,
    stills: { s1a: 'ok', s1b: 'ok' },
    strips: { 'cut-s1a-s1b': 'ok', 's1a-move-1': 'ok' },
    playbook: 'ok',
  });
  const found = (l: QaLook | null) =>
    lookChecks({ look: l, video, shots, strips }).flatMap((c) =>
      c.findings.map((f) => `${c.id}: ${f.text}`),
    );

  it('passes when every still and strip of this very video was looked at and found right', () => {
    expect(found(look)).toEqual([]);
    expect(lookChecks({ look, video, shots, strips }).map((c) => c.id)).toEqual([
      'style',
      'story',
      'motion',
      'playbook',
    ]);
  });

  it('does not count a look that was never taken, or was taken at an older video', () => {
    expect(found(null)).toEqual([
      'style: the stills and the strips of frames have not been looked at yet',
    ]);
    const older = { ...look, video: 'story-part-1-16x9-v2.mp4' };
    expect(found(older)).toHaveLength(1);
    expect(found(older)[0]).toContain('the video is now "story-part-1-16x9-v3.mp4"; look again');
  });

  it('names a still or a strip that was skipped', () => {
    const skipped = {
      ...look,
      stills: { s1a: 'ok' as const },
      strips: { 's1a-move-1': 'ok' as const },
    };
    expect(found(skipped)).toEqual([
      'style: still "s1b" has not been looked at',
      'story: still "s1b" has not been looked at',
      'motion: strip "cut-s1a-s1b" has not been looked at',
    ]);
  });

  it('turns every "no" into something to fix, under the check its question belongs to', () => {
    const no = qaLookSchema.parse({
      ...look,
      stills: {
        s1a: { no: [{ q: 'style-9', what: 'the caption sits over the bag' }] },
        s1b: { no: [{ q: 'story-hands', what: 'the coin turns into the bag' }] },
      },
      strips: {
        ...look.strips,
        'cut-s1a-s1b': { no: [{ q: 'motion-cut', what: 'he faces the other way' }] },
      },
      playbook: { no: [{ q: 'playbook', what: 'a new time comes in on a plain cut' }] },
    });
    expect(found(no)).toEqual([
      'style: still "s1a": the caption sits over the bag (Is the caption area clear? No.)',
      'story: still "s1b": the coin turns into the bag (Are hands on the things they hold? No.)',
      'motion: strip "cut-s1a-s1b": he faces the other way (Is everyone the same on both sides of the cut: place, direction, posture? No.)',
      'playbook: a new time comes in on a plain cut (Was every rule in the loaded playbooks followed? No.)',
    ]);
  });

  it('refuses an answer to a question the self-check does not ask', () => {
    const bad = {
      ...look,
      stills: { s1a: { no: [{ q: 'style-99', what: 'something' }] }, s1b: 'ok' },
    };
    expect(qaLookSchema.safeParse(bad).success).toBe(false);
  });
});

describe('what to look at', () => {
  it('lists a strip for every move inside a shot and every change of shot that keeps someone on screen', () => {
    const sb = structuredClone(timed);
    const first = sb.scenes[0]?.shots[0];
    const king = first?.actors[0];
    if (king)
      king.then = [
        { at: 0.5, pose: 'kneel' },
        { at: 0.25, expression: 'angry' },
      ].sort((a, b) => a.at - b.at);
    const strips = qaStrips(sb);
    const ids = strips.map((s) => s.id);
    expect(ids.slice(0, 3)).toEqual(['s1a-move-1', 's1a-move-2', 'cut-s1a-s1b']);
    // One strip for every change of shot that keeps someone on screen, a change of scene included.
    const shots = sb.scenes.flatMap((scene) => scene.shots);
    const kept = shots.filter((shot, i) => {
      const before = shots[i - 1];
      return before?.actors.some((a) => shot.actors.some((b) => b.character === a.character));
    });
    expect(ids.filter((id) => id.startsWith('cut-'))).toEqual(
      kept.map((shot) => `cut-${shots[shots.indexOf(shot) - 1]?.id}-${shot.id}`),
    );
    const scenesOf = new Map(
      sb.scenes.flatMap((scene) => scene.shots.map((s) => [s.id, scene.id])),
    );
    expect(
      kept.some(
        (shot) => scenesOf.get(shot.id) !== scenesOf.get(shots[shots.indexOf(shot) - 1]?.id ?? ''),
      ),
    ).toBe(true);
    for (const strip of strips) {
      expect(strip.fromMs).toBeGreaterThanOrEqual(0);
      expect(strip.what).toMatch(/^the (cut|fade|move) /);
    }
  });
});

describe('the report', () => {
  const base: QaReport = qaReportSchema.parse({
    version: 1,
    title: 'The Honest Farmer',
    part: 1,
    parts: 2,
    size: '16:9',
    video: 'honest-farmer-part-1-16x9-v12.mp4',
    seconds: 42.23,
    checkedOn: '2026-10-06',
    checks: [
      fileCheck({ probe, decodeErrors: '', size: wide, fps: 30 }),
      lengthCheck({ seconds: 42.23, parts: 2, format: null }),
      ...lookChecks({ look: null, video: 'x.mp4', shots: [], strips: [] }).slice(1),
    ],
    fixed: [],
    notes: [],
  });

  it('says first that a clean part is ready, and lists what was checked', () => {
    const page = qaPage(base);
    expect(qaVerdict(base)).toEqual({ ready: true, problems: 0, notes: 0 });
    expect(page.split('\n')[0]).toBe('# Self-check: The Honest Farmer, part 1 of 2 (wide)');
    expect(page).toContain('**Ready for you to watch.** Every check passed.');
    // What Claude noted while looking counts as worth a second look too.
    const noted = qaPage({ ...base, notes: ['The title touches his hat for a second.'] });
    expect(noted).toContain('Every check passed, with 1 thing worth a second look.');
    expect(page).toContain('| The file plays | passed |');
    expect(page).toContain('## What the studio measured');
    expect(page).toContain('## What Claude looked at');
    expect(page).toContain('Claude cannot hear');
    expect(page).not.toContain('## To fix');
    expect(page).not.toMatch(/[—―]/);
  });

  it('says first what is left to fix, with where and when', () => {
    const broken: QaReport = {
      ...base,
      checks: [
        ...base.checks,
        {
          id: 'smooth',
          title: 'Nothing jumps',
          by: 'measured',
          detail: 'every frame',
          findings: [
            {
              level: 'problem',
              shot: 's1a',
              atMs: 1350,
              text: 'Tomas jumps 0.64 of a head in one frame',
            },
          ],
        },
        {
          id: 'held',
          title: 'No picture is held too long',
          by: 'measured',
          detail: 'every shot',
          findings: [{ level: 'note', shot: 's2a', atMs: 8180, text: 'the shot stays for 4.6 s' }],
        },
      ],
      fixed: ['The coin came from nowhere; he now kneels by the bag.'],
      notes: ['The title touches his hat for a second.'],
    };
    const page = qaPage(broken);
    expect(qaVerdict(broken)).toEqual({ ready: false, problems: 1, notes: 1 });
    expect(page).toContain('**Not ready: 1 thing to fix first.**');
    expect(page).toContain('- Tomas jumps 0.64 of a head in one frame (shot s1a, at 0:01).');
    expect(page).toContain('- The shot stays for 4.6 s (shot s2a, at 0:08).');
    expect(page).toContain('- The title touches his hat for a second.');
    expect(page).toContain('| Nothing jumps | NOT passed |');
    expect(page).toContain('| No picture is held too long | passed, with a note |');
    expect(page).toContain('## Found and put right on the way');
    expect(page.indexOf('## To fix')).toBeLessThan(page.indexOf('## What the studio measured'));
  });

  it('says a time the way a person does', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(8180)).toBe('0:08');
    expect(clock(83400)).toBe('1:23');
  });
});

describe('the picture is never empty', () => {
  it('passes a page that always has something on it', () => {
    const check = emptyPictureCheck({ filled: Array(30).fill(0.2), rate: 10 });
    expect(check.findings).toEqual([]);
  });
  it('lets a moment of empty page by, at a cut', () => {
    const filled = [...Array(10).fill(0.2), 0, 0, 0, ...Array(10).fill(0.2)];
    expect(emptyPictureCheck({ filled, rate: 10 }).findings).toEqual([]);
  });
  it('finds a stretch of nearly empty page, and when it starts', () => {
    const filled = [...Array(20).fill(0.2), ...Array(12).fill(0.01), ...Array(5).fill(0.3)];
    const [finding] = emptyPictureCheck({ filled, rate: 10 }).findings;
    expect(finding?.level).toBe('problem');
    expect(finding?.atMs).toBe(2000);
    expect(finding?.text).toContain('1.2 s');
  });
  it('finds an empty page that runs to the end', () => {
    const filled = [...Array(5).fill(0.2), ...Array(8).fill(0)];
    expect(emptyPictureCheck({ filled, rate: 10 }).findings).toHaveLength(1);
  });
});

describe('the picture keeps moving', () => {
  it('passes a picture where something new happens every second or two', () => {
    const changed = Array.from({ length: 60 }, (_, i) => (i % 15 < 5 ? 12 : 1.2));
    expect(stillPictureCheck({ changed, rate: 10 }).findings).toEqual([]);
  });
  it('lets a short hold by', () => {
    const changed = [...Array(10).fill(10), ...Array(19).fill(1), ...Array(10).fill(10)];
    expect(stillPictureCheck({ changed, rate: 10 }).findings).toEqual([]);
  });
  it('finds a picture stuck for more than three seconds, and when it starts', () => {
    const changed = [...Array(10).fill(10), ...Array(30).fill(1), ...Array(10).fill(10)];
    const [finding] = stillPictureCheck({ changed, rate: 10 }).findings;
    expect(finding?.level).toBe('problem');
    expect(finding?.atMs).toBe(1000);
    expect(finding?.text).toContain('4.0 s');
  });
});
