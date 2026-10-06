import { describe, expect, it } from 'vitest';
import {
  SAME_PICTURE,
  SHORTS_MAX_S,
  cutUse,
  deliveryPage,
  differingStretches,
  mergeSoundPlans,
  outputChoiceSchema,
  outputCuts,
  outputLookCheck,
  outputLookSchema,
  parsePictureDifference,
  pictureDifferenceFilter,
  samePicturesCheck,
} from './output';
import type { Cut, Delivered } from './output';
import { brandSchema } from './plugins.schema';
import type { QaCheck } from './qa.schema';
import type { SoundPlan } from './sound.schema';

/**
 * The output of a video (Phase 4F): which files a choice of shapes asks for, one sound plan
 * for the whole video, telling the same pictures from different ones, and the page that says
 * what to upload where.
 */

describe('which files to deliver', () => {
  it('makes every shape from every part, the whole video in each', () => {
    const cuts = outputCuts({ sizes: ['16:9', '9:16'], vertical: 'full' }, 3);
    expect(cuts).toEqual([
      { size: '16:9', kind: 'full', parts: [1, 2, 3] },
      { size: '9:16', kind: 'full', parts: [1, 2, 3] },
    ]);
  });

  it('makes the vertical one from the first part alone when it is a teaser', () => {
    const cuts = outputCuts({ sizes: ['16:9', '9:16', '4:5'], vertical: 'teaser' }, 2);
    expect(cuts[0]).toEqual({ size: '16:9', kind: 'full', parts: [1, 2] });
    expect(cuts[1]).toEqual({ size: '9:16', kind: 'teaser', parts: [1] });
    // Only the tall shape is ever a teaser, and a video in one part has nothing to tease.
    expect(cuts[2]?.kind).toBe('full');
    expect(outputCuts({ sizes: ['9:16'], vertical: 'teaser' }, 1)[0]?.kind).toBe('full');
  });

  it('refuses a shape it does not know, the same shape twice, and no shape at all', () => {
    expect(outputChoiceSchema.safeParse({ sizes: ['1:1'], vertical: 'full' }).success).toBe(false);
    expect(
      outputChoiceSchema.safeParse({ sizes: ['9:16', '9:16'], vertical: 'full' }).success,
    ).toBe(false);
    expect(outputChoiceSchema.safeParse({ sizes: [], vertical: 'full' }).success).toBe(false);
    expect(outputChoiceSchema.safeParse({ sizes: ['16:9'], vertical: 'half' }).success).toBe(false);
  });

  it('says in plain words where each file goes', () => {
    const wide: Cut = { size: '16:9', kind: 'full', parts: [1, 2] };
    const tall: Cut = { size: '9:16', kind: 'full', parts: [1, 2] };
    const teaser: Cut = { size: '9:16', kind: 'teaser', parts: [1] };
    expect(cutUse(wide, 85)).toBe('YouTube, as a normal wide video');
    expect(cutUse(tall, 85)).toBe('YouTube Shorts and Facebook Reels');
    expect(cutUse(teaser, 42)).toContain('as a teaser for the full video');
    // A vertical video over three minutes is not a Short.
    expect(SHORTS_MAX_S).toBe(180);
    expect(cutUse(tall, 200)).toContain('too long for a YouTube Short');
  });

  it("takes a page's usual shapes from its brand file, the whole video unless it says teaser", () => {
    const brand = {
      id: 'my-page',
      pageName: 'My Page',
      version: 1,
      colors: { captionEmphasis: 'gold', titleRibbon: 'crimson', label: 'cream' },
      font: 'Fredoka',
      captions: { maxLines: 2, maxWordsPerPage: 5 },
      watermark: null,
      closingCard: null,
      defaults: { format: 'story', voice: 'narrator', sizes: ['16:9', '9:16'] },
      identityMode: 'auto',
    };
    expect(brandSchema.parse(brand).defaults.vertical).toBe('full');
    const teasing = { ...brand, defaults: { ...brand.defaults, vertical: 'teaser' } };
    expect(brandSchema.parse(teasing).defaults.vertical).toBe('teaser');
  });
});

describe('one sound plan for the whole video', () => {
  const plan = (music: SoundPlan['music'], sfx: SoundPlan['sfx'] = []): SoundPlan => ({
    version: 1,
    music,
    sfx,
    musicGainDb: 0,
  });
  const ding = { name: 'ding', atMs: 60, gainDb: 0, pan: 0, seed: 0 } as const;

  it('moves the music and effects of each part to where the part begins', () => {
    const whole = mergeSoundPlans(
      [
        plan(
          [
            { mood: 'curious', startMs: 0 },
            { mood: 'sorrow', startMs: 32000 },
          ],
          [ding],
        ),
        plan(
          [
            { mood: 'tense', startMs: 0 },
            { mood: 'calm', startMs: 30000 },
          ],
          [ding, ding],
        ),
      ],
      [0, 42233],
    );
    expect(whole.music).toEqual([
      { mood: 'curious', startMs: 0 },
      { mood: 'sorrow', startMs: 32000 },
      { mood: 'tense', startMs: 42233 },
      { mood: 'calm', startMs: 72233 },
    ]);
    expect(whole.sfx.map((s) => s.atMs)).toEqual([60, 42293, 42293]);
    // Every effect keeps a number of its own, so two of a kind are two takes.
    expect(whole.sfx.map((s) => s.seed)).toEqual([0, 1, 2]);
  });

  it('lets music in the same mood play on across a join', () => {
    const whole = mergeSoundPlans(
      [
        plan([{ mood: 'tense', startMs: 0 }]),
        plan([
          { mood: 'tense', startMs: 0 },
          { mood: 'hope', startMs: 9000 },
        ]),
      ],
      [0, 40000],
    );
    expect(whole.music).toEqual([
      { mood: 'tense', startMs: 0 },
      { mood: 'hope', startMs: 49000 },
    ]);
  });
});

describe('the same pictures', () => {
  it('compares with the same number of squares whatever the shape of the frame', () => {
    expect(pictureDifferenceFilter({ width: 1920, height: 1080 })).toContain(
      'scale=240:-2:flags=area',
    );
    expect(pictureDifferenceFilter({ width: 1920, height: 1080 })).toContain(
      'scale=30:-2:flags=area',
    );
    const tall = pictureDifferenceFilter({ width: 1080, height: 1920 });
    expect(tall).toContain('scale=136:-2:flags=area');
    expect(tall).toContain('scale=17:-2:flags=area');
    // A half-size preview is compared the same way as its final.
    expect(pictureDifferenceFilter({ width: 540, height: 960 })).toBe(tall);
  });

  it('reads the strongest difference of every frame', () => {
    const log = [
      '[Parsed_metadata_6 @ 0x1] frame:0    pts:0       pts_time:0',
      '[Parsed_metadata_6 @ 0x1] lavfi.signalstats.YMAX=2',
      '[Parsed_metadata_6 @ 0x1] frame:1    pts:512     pts_time:0.0333',
      '[Parsed_metadata_6 @ 0x1] lavfi.signalstats.YMAX=44',
    ].join('\n');
    expect(parsePictureDifference(log)).toEqual([2, 44]);
    expect(parsePictureDifference('nothing')).toEqual([]);
  });

  it('finds the stretches that differ, and joins frames a blink apart', () => {
    const values = Array.from({ length: 90 }, () => 3);
    for (const f of [30, 31, 33, 34]) values[f] = 44;
    values[70] = 19;
    expect(differingStretches(values, 30)).toEqual([
      { fromMs: 1000, toMs: 1167, worst: 44 },
      { fromMs: 2333, toMs: 2367, worst: 19 },
    ]);
    // What making a file again leaves, and a preview drawn at half size, are not differences.
    expect(differingStretches([1, 3, 12, 14], 30)).toEqual([]);
    expect(SAME_PICTURE).toBeGreaterThan(14);
    expect(SAME_PICTURE).toBeLessThan(19);
  });

  const check = (values: number[] | null, frames = { looked: 90, video: 90 }) =>
    samePicturesCheck({ looked: 'a-preview.mp4', video: 'a-v1.mp4', values, frames, fps: 30 });

  it('lets a look stand for a video that shows the same pictures', () => {
    const same = check(Array.from({ length: 90 }, () => 9));
    expect(same.findings).toEqual([]);
    expect(same.detail).toContain('Claude looked at "a-preview.mp4"');
    expect(same.detail).toContain('the strongest difference is 9 of 255');
  });

  it('asks for another look where the pictures differ, the lengths differ, or they cannot be compared', () => {
    const values = Array.from({ length: 90 }, () => 2);
    values[45] = 60;
    expect(check(values).findings[0]?.text).toContain(
      'the picture is not the one that was looked at, from 0:02 for 0.0 s',
    );
    expect(
      check(
        Array.from({ length: 90 }, () => 2),
        { looked: 90, video: 120 },
      ).findings[0]?.text,
    ).toContain('is not as long as "a-preview.mp4"');
    expect(check(null).findings[0]?.text).toContain('could not be compared');
  });
});

describe('what Claude saw of a finished file', () => {
  const look = outputLookSchema.parse({
    version: 1,
    video: 'story-16x9-v2.mp4',
    joins: 'ok',
    cover: 'ok',
  });

  it('passes when the joins and the cover of this very file were looked at', () => {
    const check = outputLookCheck({ look, video: 'story-16x9-v2.mp4', joins: 1 });
    expect(check.findings).toEqual([]);
    expect(check.title).toBe('Every join and the cover hold up');
    expect(outputLookCheck({ look, video: 'story-16x9-v2.mp4', joins: 0 }).title).toBe(
      'The cover holds up',
    );
  });

  it('does not count a look never taken, taken at another file, or one that found a fault', () => {
    expect(
      outputLookCheck({ look: null, video: 'story-16x9-v2.mp4', joins: 1 }).findings[0]?.text,
    ).toContain('have not been looked at yet');
    expect(
      outputLookCheck({ look, video: 'story-16x9-v3.mp4', joins: 1 }).findings[0]?.text,
    ).toContain('the file is now "story-16x9-v3.mp4"; look again');
    const bad = { ...look, joins: { no: 'the picture cuts to black for a frame' } };
    expect(
      outputLookCheck({ look: bad, video: 'story-16x9-v2.mp4', joins: 1 }).findings[0]?.text,
    ).toBe('a join: the picture cuts to black for a frame');
  });
});

describe('the page that says what to upload', () => {
  const passed: QaCheck = {
    id: 'plays',
    title: 'The file plays',
    by: 'measured',
    detail: '1920x1080',
    findings: [],
  };
  const wide: Delivered = {
    cut: { size: '16:9', kind: 'full', parts: [1, 2] },
    video: 'story-16x9-v2.mp4',
    captions: 'story-16x9-v2.srt',
    cover: 'story-16x9-v2-cover-side.jpg',
    seconds: 84.63,
    checks: [passed],
    from: ['story-part-1-16x9-v14.mp4', 'story-part-2-16x9-v4.mp4'],
  };

  it('says first that everything is ready, then each file and where it goes', () => {
    const page = deliveryPage({
      title: 'The Honest Farmer',
      madeOn: '2026-10-07',
      delivered: [wide],
      waiting: [],
      notes: [],
    });
    expect(page.split('\n')[0]).toBe('# The Honest Farmer: what to upload');
    expect(page).toContain('**Ready to upload.** Every file below passed its checks.');
    expect(page).toContain('## Wide full video (1 min 25 s)');
    expect(page).toContain('For YouTube, as a normal wide video.');
    expect(page).toContain('- Video: `story-16x9-v2.mp4`');
    expect(page).toContain('- Cover picture: `story-16x9-v2-cover-side.jpg`');
    expect(page).toContain('- Captions file: `story-16x9-v2.srt`');
    expect(page).toContain('| The file plays | passed: 1920x1080 |');
    expect(page).toContain('Claude cannot hear');
    expect(page).not.toContain('## Still to do');
    expect(page).not.toMatch(/[—―]/);
  });

  it('says what is still to do: a failed check, and a shape whose parts are not made', () => {
    const failed = {
      ...wide,
      checks: [
        {
          ...passed,
          findings: [{ level: 'problem' as const, text: 'the file has no sound in it' }],
        },
      ],
    };
    const page = deliveryPage({
      title: 'The Honest Farmer',
      madeOn: '2026-10-07',
      delivered: [failed],
      waiting: [
        {
          cut: { size: '9:16', kind: 'teaser', parts: [1] },
          why: ['part 1 has no video in 9:16 yet'],
        },
      ],
      notes: ['He sleeps on the bare floor.'],
    });
    expect(page).toContain('**Not all ready yet.**');
    expect(page).toContain('- story-16x9-v2.mp4: the file has no sound in it');
    expect(page).toContain('- Vertical teaser: part 1 has no video in 9:16 yet');
    expect(page).toContain('| The file plays | NOT passed: 1920x1080 |');
    expect(page).toContain('## Worth a second look');
    expect(page).toContain('- He sleeps on the bare floor.');
    const none = deliveryPage({
      title: 'T',
      madeOn: '2026-10-07',
      delivered: [],
      waiting: [],
      notes: [],
    });
    expect(none).toContain('**Nothing to upload yet.**');
  });
});
