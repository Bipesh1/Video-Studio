import { describe, expect, it } from 'vitest';
import {
  CHAPTER_MAX_S,
  SIZES,
  brandSchema,
  formatSchema,
  voiceProfileSchema,
} from './plugins.schema';

const beat = (id: string, share: number, optional = false) => ({
  id,
  purpose: 'What this part of the video does for the viewer.',
  share,
  moods: ['curious'],
  preferredShots: ['medium'],
  backgroundTreatment: 'either',
  ...(optional ? { optional } : {}),
});

const format = () => ({
  id: 'story',
  name: 'Story',
  description: 'A tale with characters who want something, told from start to end.',
  version: 1,
  structure: [beat('hook', 0.2), beat('middle', 0.6), beat('end', 0.2)],
  lengthRange: { min: 20, max: 180 },
  shotLength: { min: 2, max: 4 },
  hookRules: ['The first 3 seconds show the most striking image.'],
  pacing: {
    wordsPerMinute: { min: 140, max: 165 },
    rehookEveryS: { min: 20, max: 30 },
    pauseMs: { normal: 450, afterBeat: 900 },
  },
  sfxDensity: { level: 'medium', perMinute: { min: 6, max: 14 } },
  captionMode: 'full',
  factRules: { sourcesRequired: false, rules: [] },
});

const brand = () => ({
  id: 'my-page',
  pageName: 'My Page',
  version: 1,
  colors: { captionEmphasis: 'gold', titleRibbon: 'crimson', label: 'cream' },
  font: 'Fredoka',
  captions: { maxLines: 2, maxWordsPerPage: 5 },
  watermark: null,
  closingCard: null,
  defaults: { format: 'story', voice: 'narrator', sizes: ['9:16', '4:5', '16:9'] },
  identityMode: 'auto',
});

const voice = () => ({
  id: 'narrator',
  name: 'Narrator',
  description: 'The storyteller: a calm, clear voice.',
  version: 1,
  kokoroVoice: 'am_michael',
  speed: 1,
  pauseScale: 1,
});

describe('format', () => {
  it('accepts a full format and fills in that a beat is not optional', () => {
    const f = formatSchema.parse(format());
    expect(f.structure[0]?.optional).toBe(false);
  });

  it('refuses beat shares that do not add up to the whole video', () => {
    const bad = format();
    bad.structure = [beat('hook', 0.2), beat('middle', 0.5)];
    const r = formatSchema.safeParse(bad);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('add up to');
  });

  it('refuses the same beat twice, a mood that does not exist and a backwards range', () => {
    const twice = format();
    twice.structure = [beat('hook', 0.5), beat('hook', 0.5)];
    expect(formatSchema.safeParse(twice).success).toBe(false);

    const mood = format();
    mood.structure[0] = { ...beat('hook', 0.2), moods: ['spooky'] };
    expect(formatSchema.safeParse(mood).success).toBe(false);

    const range = format();
    range.lengthRange = { min: 90, max: 30 };
    expect(formatSchema.safeParse(range).success).toBe(false);
  });

  it('makes a factual format say what its fact rules are', () => {
    const bad = format();
    bad.factRules = { sourcesRequired: true, rules: [] };
    expect(formatSchema.safeParse(bad).success).toBe(false);
  });

  it('refuses a field it does not know, so a typing slip is not silently ignored', () => {
    expect(formatSchema.safeParse({ ...format(), lenghtRange: { min: 1, max: 2 } }).success).toBe(
      false,
    );
  });
});

describe('brand', () => {
  it('accepts a brand with no watermark and no closing card', () => {
    expect(brandSchema.safeParse(brand()).success).toBe(true);
  });

  it('accepts a watermark and a closing card', () => {
    const b = {
      ...brand(),
      watermark: { text: 'My Page', corner: 'top-right', opacity: 0.6 },
      closingCard: { text: 'Follow for more', seconds: 2 },
    };
    expect(brandSchema.safeParse(b).success).toBe(true);
  });

  it('refuses an em dash in anything a viewer reads', () => {
    expect(brandSchema.safeParse({ ...brand(), pageName: 'Tales — Old and New' }).success).toBe(
      false,
    );
    const card = { ...brand(), closingCard: { text: 'The end — for now', seconds: 2 } };
    expect(brandSchema.safeParse(card).success).toBe(false);
  });

  it('refuses a typed color value, another font, a size twice and an unknown size', () => {
    const color = brand();
    color.colors.captionEmphasis = '#E9C23B';
    expect(brandSchema.safeParse(color).success).toBe(false);
    expect(brandSchema.safeParse({ ...brand(), font: 'Comic Sans' }).success).toBe(false);
    const twice = brand();
    twice.defaults.sizes = ['9:16', '9:16'];
    expect(brandSchema.safeParse(twice).success).toBe(false);
    const unknown = brand();
    unknown.defaults.sizes = ['1:1'];
    expect(brandSchema.safeParse(unknown).success).toBe(false);
  });
});

describe('voice', () => {
  it('accepts a voice and gives it an empty pronunciation list', () => {
    expect(voiceProfileSchema.parse(voice()).pronunciations).toEqual({});
  });

  it('refuses a voice id Kokoro would not know and a speed out of range', () => {
    expect(voiceProfileSchema.safeParse({ ...voice(), kokoroVoice: 'Michael' }).success).toBe(
      false,
    );
    expect(voiceProfileSchema.safeParse({ ...voice(), speed: 3 }).success).toBe(false);
  });
});

describe('sizes and chapters', () => {
  it('offers the three sizes of the plan', () => {
    expect(SIZES['9:16']).toMatchObject({ width: 1080, height: 1920 });
    expect(SIZES['4:5']).toMatchObject({ width: 1080, height: 1350 });
    expect(SIZES['16:9']).toMatchObject({ width: 1920, height: 1080 });
  });

  it('keeps a chapter to a minute', () => {
    expect(CHAPTER_MAX_S).toBe(60);
  });
});
