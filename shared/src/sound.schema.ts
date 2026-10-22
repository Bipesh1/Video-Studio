import { z } from 'zod';

/**
 * Contracts for sound (Part 2, section 4, steps 6 to 8): the plan a video hands to the mix
 * worker (Python, `audio/src/studio_audio/mix.py`) and the report the worker writes back.
 * The mood and effect names here are the same lists the Python workers hold; a test on each
 * side fails if they drift apart.
 */

/** The music moods (`audio/src/studio_audio/music.py`, MOODS). */
export const MUSIC_MOODS = [
  'tense',
  'sorrow',
  'hope',
  'triumph',
  'reflective',
  'curious',
  'upbeat',
  'calm',
  'comic',
  'unease',
  'closing-in',
  'aftermath',
] as const;
export type MusicMood = (typeof MUSIC_MOODS)[number];

/** The sound effects (`audio/src/studio_audio/sfx.py`, EFFECTS). */
export const SFX_NAMES = [
  'whoosh',
  'pop',
  'thud',
  'click',
  'footsteps',
  'wind',
  'crowd-murmur',
  'creak',
  'blip',
  'hit',
  'ding',
  'heartbeat',
  'rain',
  'tick',
  'applause',
  'drumroll',
  'heartbeat-rising',
  'clunk',
  'boom',
  'hum',
  'thunder',
  'rewind',
  'river',
  'waves',
  'underwater',
  'birds',
  'night',
  'traffic',
  'cafe',
  'home',
  'office',
  'phone-ring',
  'knock',
  'splash',
  'paper',
  'coins',
  'bubbles',
] as const;
export type SfxName = (typeof SFX_NAMES)[number];

/** Effects that run under a whole shot instead of marking one moment. */
export const AMBIENT_SFX: readonly SfxName[] = [
  'wind',
  'crowd-murmur',
  'heartbeat',
  'rain',
  'tick',
  'applause',
  'heartbeat-rising',
  'hum',
  'river',
  'waves',
  'underwater',
  'birds',
  'night',
  'traffic',
  'cafe',
  'home',
  'office',
];

/** Loudness every finished sound track is mastered to. Lessons can never loosen these. */
export const LOUDNESS_TARGET = { lufs: -14, toleranceLu: 0.5, truePeakDb: -1 } as const;

const ms = z.number().min(0);

/** From this moment on, the music is in this mood. Moods blend into each other. */
export const musicSegmentSchema = z.object({
  mood: z.enum(MUSIC_MOODS),
  startMs: ms,
});

/** One sound effect at one moment. */
export const sfxCueSchema = z.object({
  name: z.enum(SFX_NAMES),
  atMs: ms,
  /** How long it runs. Needed only for footsteps and the ambient effects. */
  durationMs: z.number().positive().optional(),
  /** Louder or quieter than the effect's usual level. An effect never comes near the voice. */
  gainDb: z.number().min(-24).max(6).default(0),
  /** -1 is left, 0 the middle, 1 right. */
  pan: z.number().min(-1).max(1).default(0),
  /** A different number gives a slightly different take of the same effect. */
  seed: z.number().int().min(0).default(0),
});

/**
 * The instruments a video's music is played on (`audio/src/studio_audio/music.py`, PALETTES),
 * chosen for its topic (Biku, 2026-10-21: every Short "has the same background sounds"):
 * `own` keeps each mood's own instruments.
 */
export const MUSIC_PALETTES = [
  'own',
  'body',
  'space',
  'water',
  'food',
  'mystery',
  'bright',
] as const;
export type MusicPalette = (typeof MUSIC_PALETTES)[number];

/**
 * How a video's sound is handled: a Short (`short`) opens on a hit, its music a little quicker
 * and nearer; a long video (`long`) has calmer music, further under the voice.
 */
export const SOUND_PROFILES = ['short', 'long'] as const;
export type SoundProfile = (typeof SOUND_PROFILES)[number];

/**
 * The video's own music: every mood written fresh from its seed, moved to its own key and
 * speed, and played on the instruments of its palette, so no two videos share a tune.
 */
export const scoreSchema = z
  .object({
    seed: z.number().int().min(0),
    /** Semitones up or down from each mood's own key. */
    shift: z.number().int().min(-6).max(6).default(0),
    /** The speed against each mood's own, 0.8 to 1.25. */
    tempo: z.number().min(0.8).max(1.25).default(1),
    palette: z.enum(MUSIC_PALETTES).default('own'),
    profile: z.enum(SOUND_PROFILES).default('long'),
  })
  .strict();
export type Score = z.infer<typeof scoreSchema>;

export const soundPlanSchema = z
  .object({
    version: z.literal(1),
    /** The video's own music. Left out: the moods as written, the same in every video. */
    score: scoreSchema.optional(),
    /** The video's length. Needed only when there is no voice track to take it from. */
    durationMs: z.number().positive().optional(),
    music: z.array(musicSegmentSchema).default([]),
    sfx: z.array(sfxCueSchema).default([]),
    /** Turns all the music up or down against the voice. */
    musicGainDb: z.number().min(-12).max(6).default(0),
    /**
     * Stretches where the music stops after it has begun (a quiet scene later in a video: Biku's
     * script, 2026-10-14, "The music stops."). It fades out as the stretch begins and comes back
     * in after it, if there is music still to come.
     */
    hush: z
      .array(
        z
          .object({
            fromMs: ms,
            toMs: ms,
            /** A quick cut out and a quick return, for a drop before a reveal. */
            sharp: z.boolean().optional(),
          })
          .refine((h) => h.toMs > h.fromMs, 'a hush ends after it begins'),
      )
      .default([]),
  })
  .superRefine((plan, ctx) => {
    for (let i = 1; i < plan.music.length; i++) {
      const prev = plan.music[i - 1];
      const cur = plan.music[i];
      if (prev && cur && cur.startMs <= prev.startMs) {
        ctx.addIssue({
          code: 'custom',
          message: `music ${i} must start after the mood before it`,
        });
      }
    }
    if (plan.music.length === 0 && plan.sfx.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'a sound plan needs some music or an effect' });
    }
  });

/** What the mix worker writes next to mix.wav. */
export const mixReportSchema = z.object({
  version: z.literal(1),
  audioFile: z.string().min(1),
  sampleRate: z.literal(48000),
  durationMs: ms,
  lufs: z.number(),
  truePeakDb: z.number(),
  clipped: z.boolean(),
  /** Loudness within the tolerance and the true peak under the limit. */
  onTarget: z.boolean(),
  silent: z.boolean(),
  targetLufs: z.number(),
  truePeakLimitDb: z.number(),
  hasVoice: z.boolean(),
  voiceLufs: z.number().nullable(),
  /** The share of the video in which someone is speaking, 0 to 1. */
  speechShare: z.number().min(0).max(1),
  /** How far the music sits under the voice while someone speaks, and in the pauses. */
  musicUnderVoiceDb: z.number().nullable(),
  musicInPausesDb: z.number().nullable(),
  music: z.array(musicSegmentSchema),
  sfx: z.array(
    z.object({
      name: z.enum(SFX_NAMES),
      atMs: ms,
      seconds: z.number().positive(),
      levelAgainstVoiceDb: z.number(),
      overVoice: z.boolean(),
    }),
  ),
});

export type MusicSegment = z.infer<typeof musicSegmentSchema>;
export type SfxCue = z.infer<typeof sfxCueSchema>;
export type SoundPlan = z.infer<typeof soundPlanSchema>;
export type MixReport = z.infer<typeof mixReportSchema>;

/** A mix is good to ship when it is on target, not clipped, and no louder than the limit. */
export function mixProblems(report: MixReport): string[] {
  const out: string[] = [];
  const { lufs, toleranceLu, truePeakDb } = LOUDNESS_TARGET;
  if (report.silent) out.push('the mix is silent');
  if (Math.abs(report.lufs - lufs) > toleranceLu) {
    out.push(`loudness is ${report.lufs} LUFS, outside ${lufs} plus or minus ${toleranceLu}`);
  }
  if (report.truePeakDb > truePeakDb + 0.05) {
    out.push(`true peak is ${report.truePeakDb} dB, above the ${truePeakDb} dB limit`);
  }
  if (report.clipped) out.push('the sound clips');
  if (report.musicUnderVoiceDb !== null && report.musicUnderVoiceDb > -12) {
    out.push(`the music is only ${-report.musicUnderVoiceDb} dB under the voice`);
  }
  for (const cue of report.sfx) {
    if (cue.levelAgainstVoiceDb > -3) {
      out.push(`the ${cue.name} at ${cue.atMs} ms is as loud as the voice`);
    }
  }
  return out;
}
