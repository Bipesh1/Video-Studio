import { z } from 'zod';
import { MUSIC_MOODS } from './sound.schema';

/**
 * The plug-ins a video picks (Part 1, section 6; Part 2, sections 8 and 9): a format (what
 * kind of video), a brand (which page it is for) and a voice. Each is one small JSON file
 * under `formats/`, `brands/` or `voices/`. The engine never changes during a video run; a
 * run only picks plug-ins and writes a storyboard.
 */

/** Lower case words joined by hyphens: the form of every id and file name. */
export const idSchema = z.string().regex(/^[a-z][a-z0-9-]*$/, 'lower case words joined by hyphens');

/** Text a viewer reads. Ground rule 14: no em dashes. */
export const viewerTextSchema = z
  .string()
  .min(1)
  .refine((t) => !t.includes('—'), { message: 'viewer text must not contain an em dash' });

export const SCRIPT_MODES = ['as-is', 'refine', 'original'] as const;
export type ScriptMode = (typeof SCRIPT_MODES)[number];

/** How close the camera is (engine/src/camera/Framing.tsx). */
export const FRAMINGS = ['wide', 'medium', 'close-up', 'over-shoulder'] as const;
export type Framing = (typeof FRAMINGS)[number];

/** What the camera does during a shot (engine/src/camera/Camera.tsx). */
export const CAMERA_MOVES = ['none', 'push-in', 'punch-in', 'pan', 'shake', 'follow'] as const;
export type CameraMove = (typeof CAMERA_MOVES)[number];

/** The vertical shape of a video is the whole of it, or a teaser: its first part alone. */
export const VERTICAL_CUTS = ['full', 'teaser'] as const;
export type VerticalCut = (typeof VERTICAL_CUTS)[number];

/** The two background treatments (Style 5.2). */
export const TREATMENTS = ['simple', 'atmospheric'] as const;
export type Treatment = (typeof TREATMENTS)[number];

/** The sizes a video can be delivered in (Part 2, section 11, step 10). All are 30 fps. */
export const SIZES = {
  '9:16': { width: 1080, height: 1920, use: 'phone, Reels and Shorts' },
  '4:5': { width: 1080, height: 1350, use: 'the feed' },
  '16:9': { width: 1920, height: 1080, use: 'wide screens' },
} as const;
export type SizeName = keyof typeof SIZES;
export const SIZE_NAMES = Object.keys(SIZES) as [SizeName, ...SizeName[]];
export const FPS = 30;

/**
 * A long video is built in chapters of at most this many seconds, each made and shown to Biku
 * alone, then joined (decided with Biku on 2026-10-06).
 */
export const CHAPTER_MAX_S = 60;

const secondsRange = z
  .object({ min: z.number().positive(), max: z.number().positive() })
  .strict()
  .refine((r) => r.min <= r.max, { message: 'min must not be more than max' });

/** One step of a format's structure: what the video is doing at that point. */
export const beatSchema = z
  .object({
    id: idSchema,
    /** What this part of the video has to do for the viewer, in one plain sentence. */
    purpose: z.string().min(10),
    /** Roughly what share of the video it takes, 0 to 1. The shares of a format add up to 1. */
    share: z.number().gt(0).max(1),
    /** The music it usually wants. The first is the default; a script can pick another. */
    moods: z.array(z.enum(MUSIC_MOODS)).min(1),
    /** Shot sizes that suit it, most typical first. */
    preferredShots: z.array(z.enum(FRAMINGS)).min(1),
    /** Which background treatment it leans to. */
    backgroundTreatment: z.enum([...TREATMENTS, 'either']),
    /** A beat a script may leave out. */
    optional: z.boolean().default(false),
  })
  .strict();

export const formatSchema = z
  .object({
    /** Also the file name: formats/<id>.json. */
    id: idSchema,
    name: z.string().min(1),
    /** What kind of video this is and when to pick it. */
    description: z.string().min(20),
    version: z.number().int().min(1),
    /** The beats in order. A video follows them in this order. */
    structure: z.array(beatSchema).min(2),
    /** How long the whole video may be, in seconds. */
    lengthRange: secondsRange,
    /** How long one shot may stay on screen, in seconds. */
    shotLength: secondsRange,
    /** What the first seconds must do. */
    hookRules: z.array(z.string().min(10)).min(1),
    pacing: z
      .object({
        /** Spoken words a minute the script is written for. */
        wordsPerMinute: secondsRange,
        /** A new question, turn or danger at least this often, in seconds. */
        rehookEveryS: secondsRange,
        /** Silence after a line, in ms: the usual pause and the pause after a big moment. */
        pauseMs: z
          .object({ normal: z.number().int().min(0), afterBeat: z.number().int().min(0) })
          .strict(),
      })
      .strict(),
    /** How many sound effects a minute suits it. */
    sfxDensity: z
      .object({ level: z.enum(['low', 'medium', 'high']), perMinute: secondsRange })
      .strict(),
    /** full: every spoken word on screen. keywords: only the emphasized words. */
    captionMode: z.enum(['full', 'keywords']),
    factRules: z
      .object({
        /** True when every claim must be traceable to a saved source. */
        sourcesRequired: z.boolean(),
        rules: z.array(z.string().min(10)),
      })
      .strict(),
  })
  .strict()
  .superRefine((f, ctx) => {
    const total = f.structure.reduce((sum, b) => sum + b.share, 0);
    if (Math.abs(total - 1) > 0.011) {
      ctx.addIssue({
        code: 'custom',
        message: `the beat shares add up to ${total.toFixed(2)}, not 1`,
      });
    }
    const seen = new Set<string>();
    for (const b of f.structure) {
      if (seen.has(b.id))
        ctx.addIssue({ code: 'custom', message: `beat "${b.id}" is listed twice` });
      seen.add(b.id);
    }
    if (f.shotLength.max > f.lengthRange.max) {
      ctx.addIssue({ code: 'custom', message: 'a shot cannot be longer than the whole video' });
    }
    if (f.factRules.sourcesRequired && f.factRules.rules.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'a factual format needs at least one fact rule' });
    }
  });

/**
 * A brand: which page a video is for. Colors are named from the style's accents, never typed
 * as values (ground rule 5), and the only font is the bundled one.
 */
export const brandSchema = z
  .object({
    /** Also the file name: brands/<id>.json. */
    id: idSchema,
    /** The page's name as viewers see it. */
    pageName: viewerTextSchema,
    version: z.number().int().min(1),
    colors: z
      .object({
        /** The accent a caption's emphasized word takes. */
        captionEmphasis: idSchema,
        /** The cloth color of the title ribbon. */
        titleRibbon: idSchema,
        /** The color of a label box. */
        label: idSchema,
      })
      .strict(),
    font: z.literal('Fredoka'),
    captions: z
      .object({
        maxLines: z.number().int().min(1).max(2),
        /** Words on screen at once, at most. */
        maxWordsPerPage: z.number().int().min(2).max(10),
      })
      .strict(),
    /** A small mark in a corner of every frame, or none. */
    watermark: z
      .object({
        text: viewerTextSchema,
        corner: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
        opacity: z.number().gt(0).max(1),
      })
      .strict()
      .nullable(),
    /** The card after the last shot, or none. */
    closingCard: z
      .object({
        text: viewerTextSchema,
        subtext: viewerTextSchema.optional(),
        seconds: z.number().min(1).max(6),
      })
      .strict()
      .nullable(),
    defaults: z
      .object({
        format: idSchema,
        /** The narrator: a file name under voices/. */
        voice: idSchema,
        /** The shapes its videos are made in. The first is the one each part is shown in. */
        sizes: z.array(z.enum(SIZE_NAMES)).min(1),
        /** The vertical shape is the whole video, or a teaser: its first part alone. */
        vertical: z.enum(VERTICAL_CUTS).default('full'),
      })
      .strict(),
    /**
     * auto: skin tones and hair are used when who a person is matters to the story.
     * always: every character has them (Style 3.4).
     */
    identityMode: z.enum(['auto', 'always']),
  })
  .strict()
  .superRefine((b, ctx) => {
    if (new Set(b.defaults.sizes).size !== b.defaults.sizes.length) {
      ctx.addIssue({ code: 'custom', message: 'a size is listed twice' });
    }
  });

/** A voice: which Kokoro voice speaks, at what pace, and how hard words are said. */
export const voiceProfileSchema = z
  .object({
    /** Also the file name: voices/<id>.json. */
    id: idSchema,
    name: z.string().min(1),
    /** Who it suits, in one plain sentence. */
    description: z.string().min(10),
    version: z.number().int().min(1),
    kokoroVoice: z
      .string()
      .regex(/^[a-z]{2}_[a-z]+$/, 'expected a Kokoro voice id like am_michael'),
    speed: z.number().min(0.5).max(2),
    /** Multiplies every pause the script asks for: above 1 is slower and weightier. */
    pauseScale: z.number().min(0.5).max(2),
    /**
     * How to say words Kokoro gets wrong: the word as written, and its phonemes. Used as
     * Kokoro's inline form [word](/phonemes/), so the script's own words never change.
     */
    pronunciations: z.record(z.string().min(1), z.string().min(1)).default({}),
  })
  .strict();

export type Beat = z.infer<typeof beatSchema>;
export type Format = z.infer<typeof formatSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type VoiceProfile = z.infer<typeof voiceProfileSchema>;
