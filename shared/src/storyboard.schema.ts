import { z } from 'zod';
import { characterCardSchema } from './character.schema';
import {
  CAMERA_MOVES,
  FRAMINGS,
  SCRIPT_MODES,
  TREATMENTS,
  idSchema,
  viewerTextSchema,
  finishSchema,
} from './plugins.schema';
import {
  AMBIENT_SFX,
  MUSIC_MOODS,
  MUSIC_PALETTES,
  SFX_NAMES,
  SOUND_PROFILES,
} from './sound.schema';
import { SAY_MESSAGE, sameWords } from './voice.schema';
import { graphicSchema } from './graphic.schema';
import { posterLayerSchema } from './thumbnail.schema';

/**
 * The storyboard (Part 2, section 10): `runs/<run>/storyboard.json`, the single source of
 * truth for a video (ground rule 4). Every later stage reads it and nothing else: the voice
 * speaks its lines, the engine draws its shots, the mix places its music and effects.
 *
 * A video is a list of scenes, a scene is a list of spoken lines and a list of shots, and
 * every shot acts out some of the words of one line. This file checks the shape and that the
 * storyboard agrees with itself. Whether the names it uses exist (a pose, a place, a voice)
 * is checked against the library and the plug-ins in `storyboard.check.ts`.
 */

export const NARRATOR = 'narrator';

/** How someone looks, when they are not a saved character: the same fields a card holds. */
export const lookSchema = characterCardSchema
  .pick({ age: true, size: true, identity: true, outfit: true, eyeStyle: true })
  .partial()
  .strict();

/** One person in the video. */
export const castMemberSchema = z
  .object({
    /** How shots refer to them. */
    id: idSchema.refine((id) => id !== NARRATOR, { message: '"narrator" is not a cast member' }),
    /** Who they are in the story, for the people reading the storyboard. */
    name: z.string().min(1),
    /** A saved character (characters/<card>.json), for a series. */
    card: idSchema.optional(),
    /** Or how they look, for this video only. Neither: a plain stick figure. */
    look: lookSchema.optional(),
    /** Their voice (voices/<voice>.json), when they speak. */
    voice: idSchema.optional(),
    /**
     * True for the host of the video: the one who tells it. A host is seen speaking, and is
     * also heard over pictures they are not in (a page, a place, someone else's face).
     */
    host: z.boolean().optional(),
  })
  .strict()
  .refine((m) => !(m.card && m.look), {
    message: 'give a saved card or a look, not both',
  });

/** One line to speak: the narrator's, or a cast member's. */
export const storyLineSchema = z
  .object({
    id: idSchema,
    speaker: z.union([z.literal(NARRATOR), idSchema]),
    /** The words. *Asterisks* mark a word the captions emphasize. */
    text: z.string().min(1),
    speed: z.number().min(0.5).max(2).optional(),
    /**
     * The line as the voice reads it: the very same words, with commas and "..." where the voice
     * should breathe or hold. The captions and the checks keep `text`.
     */
    say: z.string().min(1).optional(),
    /** Silence after the line, in ms. Left out: the format's usual pause. */
    pauseAfterMs: z.number().int().min(0).max(5000).optional(),
    /**
     * True for a thought: the line is heard in the speaker's own voice while their mouth stays
     * shut. For what someone tells themselves, which nobody else in the room hears.
     */
    thought: z.boolean().optional(),
  })
  .strict()
  .refine((l) => !l.say || sameWords(l.text, l.say), { message: SAY_MESSAGE, path: ['say'] });

const lookAtSchema = z.union([z.enum(['camera', 'up', 'down', 'ahead']), idSchema]);

/**
 * A change inside a shot (Biku, 2026-10-06: "it can't change the posture in continuous
 * frames?"). Part of the way through the shot the person moves, in one continuous motion, into
 * a new pose or action, takes a new face, turns their eyes, or picks something up or puts it
 * down. Anything a step leaves out stays as it was.
 */
export const actorStepSchema = z
  .object({
    /** When in the shot it happens: 0 is the start, 1 the end. */
    at: z.number().gt(0).lt(1),
    pose: idSchema.optional(),
    action: idSchema.optional(),
    expression: idSchema.optional(),
    /** How strongly the face is worn from here on, 0.2 to 1: a feeling that builds. Left out, fully. */
    strength: z.number().min(0.2).max(1).optional(),
    lookAt: lookAtSchema.optional(),
    /** A prop to take in the hand, or null to let go of what is held. */
    holds: idSchema.nullable().optional(),
  })
  .strict()
  .refine((step) => !(step.pose && step.action), {
    message: 'a step takes a pose or an action, not both',
  })
  .refine(
    (step) =>
      step.pose !== undefined ||
      step.action !== undefined ||
      step.expression !== undefined ||
      step.strength !== undefined ||
      step.lookAt !== undefined ||
      step.holds !== undefined,
    { message: 'a step has to change something' },
  );

/** One person in one shot. */
export const actorSchema = z
  .object({
    character: idSchema,
    /** A held pose from the library, or an action. One or the other. */
    pose: idSchema.optional(),
    action: idSchema.optional(),
    /** The face it needs. Every shot with a character names one (writing rule 7). */
    expression: idSchema,
    /** How strongly the face is worn, 0.2 to 1: half a feeling, on its way to the whole. Left out, fully. */
    strength: z.number().min(0.2).max(1).optional(),
    facing: z.enum(['left', 'right']),
    headTurn: z.enum(['front', 'three-quarter', 'profile']).default('three-quarter'),
    /** Where they stand across the wide layout: 0 is the left edge, 1 the right. */
    x: z.number().min(0).max(1).optional(),
    /** Who or what they look at: a cast member, a prop in the shot, or a direction. */
    lookAt: lookAtSchema.default('ahead'),
    /** A library prop in their hand. */
    holds: idSchema.optional(),
    /** Seen from behind, as the near person in an over-the-shoulder shot. */
    back: z.boolean().default(false),
    /** What they do next inside the shot, in order (see actorStepSchema). */
    then: z.array(actorStepSchema).default([]),
  })
  .strict()
  .refine((a) => Boolean(a.pose) !== Boolean(a.action), {
    message: 'an actor needs a pose or an action, one and not both',
  });

/** A thing standing in the scene (things in a hand are on the actor). */
export const placedPropSchema = z
  .object({
    prop: idSchema,
    /** Where it stands across the wide layout: 0 is the left edge, 1 the right. */
    x: z.number().min(0).max(1),
    /**
     * How high it is off the ground, in heads: for the Sun, a planet, a rocket in flight.
     * Left out, a thing of the sky hangs at its usual height and everything else stands.
     */
    y: z.number().min(0).max(14).optional(),
    /** Bigger or smaller than usual: 1 is as drawn. */
    size: z.number().min(0.1).max(6).optional(),
    /**
     * Close to the camera: drawn in front of everyone, bigger, darker and a little soft, its
     * foot below the bottom of the picture, so the shot has depth (step 5, 2026-10-14). Best at
     * an edge of the picture, where it frames the scene and hides nobody.
     */
    near: z.boolean().optional(),
    /** A few words on a tag tied to it ("SUNLIGHT"), which pops up a moment into the shot. */
    tag: viewerTextSchema.optional(),
    /** Where it starts, when it slides to its place as the shot opens: an envelope under a door. */
    from: z.number().min(-0.2).max(1.2).optional(),
    /**
     * When in the shot it sets off, for a thing that slides: 0 is as the shot opens (the usual),
     * 0.4 lets something else happen first, such as a ball opening.
     */
    slideAt: z.number().min(0).max(0.9).optional(),
    /**
     * Its own place in a picture taller than it is wide, where it differs: a tall picture is
     * narrow and has a great deal of sky, so a thing beside someone in the wide picture is
     * often better above them in the tall one. What is left out stays as above.
     */
    tall: z
      .object({
        x: z.number().min(0).max(1).optional(),
        y: z.number().min(0).max(14).optional(),
        size: z.number().min(0.1).max(6).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

/** A point on the screen, as shares of the frame: 0, 0 is the top left corner. */
const pointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();

/** What an orbit diagram can show in its middle and going round. */
export const ORBIT_BODIES = ['sun', 'earth', 'moon', 'planet'] as const;

/**
 * Text or a graphic over the picture: the video's title, a label for a place, date or name,
 * the one big number a shot is about, an arrow with a label, or a diagram of an orbit.
 */
export const overlaySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('title'), text: viewerTextSchema }).strict(),
  z.object({ kind: z.literal('label'), text: viewerTextSchema }).strict(),
  z
    .object({
      kind: z.literal('number'),
      text: viewerTextSchema,
      /** A few words under the number. */
      caption: viewerTextSchema.optional(),
      /** True for a number that runs up from nothing to its figure over the shot, like a counter. */
      countUp: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      /**
       * A few big words over the scene, in up to three short lines: the question a video opens
       * on, shown while it is asked. The scene stays in view behind them.
       */
      kind: z.literal('words'),
      lines: z.array(viewerTextSchema).min(1).max(3),
      /** Which line is in gold, counting from 0. */
      stress: z.number().int().min(0).max(2).optional(),
      /**
       * Low in the picture, where the captions would be, when the one who asks is seen close
       * and their face fills the top.
       */
      low: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('pointer'),
      text: viewerTextSchema,
      /**
       * What the arrow points at: a person or a thing in the shot by name, so the arrow finds it
       * in a wide frame and a tall one alike, or a point on the screen.
       */
      to: z.union([idSchema, pointSchema]),
      /** The middle of the label. Left out, it sits up and to the side of what it names. */
      at: pointSchema.optional(),
    })
    .strict(),
  z
    .object({
      /** A page held up to the camera: a bill or a letter, with a few short lines of writing. */
      kind: z.literal('page'),
      lines: z.array(viewerTextSchema).min(1).max(5),
      /** Which line is marked in gold, counting from 0. */
      stress: z.number().int().min(0).max(4).optional(),
      /**
       * A page of a notebook kept as a tally (2026-10-20, "She Wrote Down Every Dish She Washed
       * for a Year"): under the lines, tally marks fill in group by group and a count runs up
       * to this number over the shot.
       */
      tally: z.number().int().min(1).max(99999).optional(),
      /** The notebook's cover down the page's left edge: hers blue, his orange. */
      cover: z.enum(['blue', 'orange']).optional(),
    })
    .strict(),
  z
    .object({
      /**
       * A bubble over someone's head: what they think (a cloud) or say (a balloon), in a few
       * short lines. It is for words the picture shows and nobody speaks; a spoken line is a
       * line of the script.
       */
      kind: z.literal('bubble'),
      /** Whose bubble it is: a person in the shot. */
      of: idSchema,
      shape: z.enum(['thought', 'speech']).default('thought'),
      lines: z.array(viewerTextSchema).min(1).max(3),
      /** Which line is marked in gold, counting from 0. */
      stress: z.number().int().min(0).max(2).optional(),
      /** A balloon that drifts across to this person in the shot and bursts on them. */
      to: idSchema.optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('orbit'),
      center: z.enum(ORBIT_BODIES),
      around: z.enum(ORBIT_BODIES),
      /** A few words under the diagram. */
      text: viewerTextSchema.optional(),
    })
    .strict(),
]);
export type Overlay = z.infer<typeof overlaySchema>;

/** An effect drawn on or beside someone: sweat, tears, an anger mark, a symbol. */
export const shotEffectSchema = z.object({ effect: idSchema, on: idSchema }).strict();

/** A sound effect in a shot. The mix turns these into the sound plan. */
/** The ways the camera can travel from one picture to the next. */
export const TRAVELS = [
  'travel-left',
  'travel-right',
  'travel-up',
  'travel-down',
  'dive',
  'match',
  'wipe',
  'iris',
  'lens',
] as const;
export type Travel = (typeof TRAVELS)[number];
/** The directions the camera takes in turn when a shot asks for none (`arrivalOf`). */
const AUTO_TRAVEL: readonly Travel[] = ['travel-right', 'travel-up', 'travel-left', 'travel-down'];
/**
 * How a shot arrives: as it asks, or, between two explainer graphics where it asks for a plain
 * cut, the camera travels from one picture to the next, in each direction in turn (2026-10-16:
 * What's the Catch? never falls back to cutting between pages).
 */
export function arrivalOf(
  shot: { transition: string; graphic?: unknown },
  before: { graphic?: unknown } | undefined,
  index: number,
): string {
  // Two shots of one journey: the camera flies on from where it was, so nothing travels.
  const kindOf = (g: unknown) => (g as { kind?: string } | undefined)?.kind;
  if (kindOf(shot.graphic) === 'journey' && kindOf(before?.graphic) === 'journey')
    return shot.transition;
  if (shot.transition === 'cut' && shot.graphic && before?.graphic) {
    return AUTO_TRAVEL[index % AUTO_TRAVEL.length] ?? 'travel-right';
  }
  return shot.transition;
}
/** A thing in a picture, for a match: its middle and its height, as shares of the frame. */
const spotSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    size: z.number().min(0.01).max(1),
  })
  .strict();

export const shotSoundSchema = z
  .object({
    name: z.enum(SFX_NAMES),
    /** When in the shot it happens. */
    at: z.enum(['start', 'middle', 'end']).default('start'),
    gainDb: z.number().min(-24).max(6).default(0),
  })
  .strict();

export const cameraSchema = z
  .object({
    framing: z.enum(FRAMINGS),
    move: z.enum(CAMERA_MOVES).default('none'),
    /** How strong the move is, 0 to 1. */
    strength: z.number().min(0).max(1).default(0.2),
    /** The cast member the camera favours. Left out: everyone in the shot. */
    focus: idSchema.optional(),
  })
  .strict();

/** Where a picture shot's camera is: a point of the picture (shares) and how close it is (1: all of it). */
const pictureCameraSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    zoom: z.number().min(1).max(12),
  })
  .strict();

/**
 * A picture made for the moment, drawn instead of the scene (2026-10-14): what each choice gets
 * you, side by side; one person among thousands. It is built from the same layers as a
 * thumbnail (shared/src/thumbnail.schema.ts), and its camera moves from `from` to `to` over the
 * shot, so it can pull back from one face to the whole crowd. Nobody in it speaks: it is said
 * over by the host or the narrator.
 */
export const pictureSchema = z
  .object({
    layers: z.array(posterLayerSchema).min(1).max(40),
    from: pictureCameraSchema.optional(),
    to: pictureCameraSchema.optional(),
  })
  .strict();

export const shotSchema = z
  .object({
    id: idSchema,
    /** The line this shot is seen under. */
    line: idSchema,
    /** The part of that line's words spoken while this shot is on screen. */
    words: z.string().min(1),
    camera: cameraSchema,
    actors: z.array(actorSchema).default([]),
    props: z.array(placedPropSchema).default([]),
    effects: z.array(shotEffectSchema).default([]),
    sfx: z.array(shotSoundSchema).default([]),
    /** Text over the picture: the video's title, or a label for a place, date or name. */
    overlay: overlaySchema.optional(),
    /** A picture made for the moment, in place of the scene. */
    picture: pictureSchema.optional(),
    /**
     * An explainer graphic of What's the Catch?'s own style, in place of the scene: its pieces
     * arrive one at a time as the words name them (shared/src/graphic.schema.ts).
     */
    graphic: graphicSchema.optional(),
    /** The sound of the place under this shot, when it differs from its scene's (a journey
     * that travels from a bath to the sea). */
    ambience: z
      .enum(SFX_NAMES)
      .refine((n) => AMBIENT_SFX.includes(n), {
        message: 'an ambience is a sound that runs on (a bed)',
      })
      .optional(),
    /**
     * The reveal lands here: the music stops just before the shot and comes back with a hit as
     * it begins, so the surprise is heard as well as seen. Once or twice a video.
     */
    drop: z.boolean().optional(),
    /** How this shot arrives. A fade is for a change of time or place (lesson L-0013). */
    /**
     * whip: a quick sideways swing of the camera into the shot, with a blur (2026-10-14): for
     * the energy of a Short, between two moments of the same scene. Use it a few times a video.
     */
    /**
     * The camera travelling from the last picture to this one, as if both were places in one
     * world (What's the Catch?, 2026-10-16: "very immersive"): travel-left, -right, -up and
     * -down slide the old picture away and this one in; dive zooms into a point of the old
     * picture (`diveAt`, shares of the frame) and this one grows out of it; match turns a thing
     * of the old picture into a thing of this one (`matchFrom` becomes `matchTo`: the camera
     * holds on it while the picture around it changes); wipe sweeps the next picture in from
     * the left behind a slanted dark edge; iris opens it in a growing circle from a point of the
     * last picture (`diveAt`). Wipe and iris are the motion-graphics moves (2026-10-16).
     * lens: a magnifying glass on a point of the last picture (`diveAt`): a ringed circle pops
     * open there with this picture inside, holds a moment, then grows to fill the frame
     * (2026-10-22, from the Kurzgesagt Shorts: into the ovary, into a cell).
     */
    transition: z.enum(['cut', 'fade', 'whip', 'rewind', ...TRAVELS]).default('cut'),
    /**
     * A rewind into this shot (Biku, 2026-10-18: "a proper rewind animation"): over the last
     * moments of the shot before, everything since the start of the last scene plays backwards,
     * fast, and stops on this shot with `label` stamped on it ("10 MINUTES EARLIER"), in one of
     * three looks: an old video tape, a clean cartoon, a film reel.
     */
    rewind: z
      .object({
        label: z.string().min(1).max(28),
        // Biku picked the film reel on 2026-10-18 ("3 is alright").
        style: z.enum(['tape', 'cartoon', 'film']).default('film'),
      })
      .strict()
      .optional(),
    /** For a match: the thing in the last picture, and the thing in this one it becomes. */
    matchFrom: spotSchema.optional(),
    matchTo: spotSchema.optional(),
    /** Where in the last picture a dive goes in: the thing the next picture grows out of. */
    diveAt: z
      .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
      .strict()
      .optional(),
    /** Filled in by the voice stage: shot length is always driven by the audio. */
    startMs: z.number().min(0).optional(),
    endMs: z.number().min(0).optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if ((s.startMs === undefined) !== (s.endMs === undefined)) {
      ctx.addIssue({
        code: 'custom',
        message: 'a shot has both a start and an end time, or neither',
      });
    }
    if (s.startMs !== undefined && s.endMs !== undefined && s.endMs <= s.startMs) {
      ctx.addIssue({ code: 'custom', message: 'a shot must end after it starts' });
    }
    const seen = new Set<string>();
    for (const a of s.actors) {
      if (seen.has(a.character)) {
        ctx.addIssue({ code: 'custom', message: `"${a.character}" is in the shot twice` });
      }
      seen.add(a.character);
    }
  });

export const sceneSchema = z
  .object({
    id: idSchema,
    /** Which chapter of the video it belongs to, counting from 1. */
    chapter: z.number().int().min(1).default(1),
    /** The beat of the format this scene plays. */
    beat: idSchema,
    /** The music mood from the start of this scene. */
    mood: z.enum(MUSIC_MOODS),
    /**
     * True for a scene with no music under it. It holds only before the first music of the
     * video: once music has begun it plays on.
     */
    quiet: z.boolean().optional(),
    /**
     * The sound of the place, under the whole scene, music or not (Biku, 2026-10-20: "we need
     * more background sounds that's according to the story"): a river, a café, the sea. Left
     * out, the place picks its own (PLACE_AMBIENCE in shared/src/assembly.ts).
     */
    ambience: z
      .enum(SFX_NAMES)
      .refine((n) => AMBIENT_SFX.includes(n), {
        message: 'an ambience is a sound that runs on (a bed)',
      })
      .optional(),
    /** The place (the plan calls it the set), its treatment and its colors. */
    place: idSchema,
    treatment: z.enum(TREATMENTS),
    palette: idSchema,
    lines: z.array(storyLineSchema).min(1),
    shots: z.array(shotSchema).min(1),
  })
  .strict();

/** Words with emphasis marks and spacing taken out, for comparing a line with its shots. */
export const plainWords = (text: string): string =>
  text.replace(/\*/g, '').split(/\s+/).filter(Boolean).join(' ');

/** A gauge's change: on a word of a shot (left out, as the shot begins), to a value. */
export const gaugeKeySchema = z
  .object({
    shot: idSchema,
    on: z.string().min(1).max(40).optional(),
    value: z.number(),
    /** Already at this value as the shot begins (a part carrying on from the one before). */
    now: z.boolean().optional(),
  })
  .strict();
/** A gauge over the picture that carries the story; see `gauges` on the storyboard. */
export const gaugeSchema = z
  .object({
    label: viewerTextSchema,
    /** bar: fills from 0 to `max`; count: a number that rolls to each value; steps: "2/3". */
    kind: z.enum(['bar', 'count', 'steps']),
    max: z.number().positive().optional(),
    /** For steps: how many there are. */
    of: z.number().int().min(2).max(9).optional(),
    /** For a count: written before and after the number ("$", " kg"). */
    prefix: z.string().max(3).optional(),
    suffix: z.string().max(6).optional(),
    keys: z.array(gaugeKeySchema).min(1).max(12),
    /** The last shot it is on screen in; left out, to the end of the video. */
    until: idSchema.optional(),
  })
  .strict();
export type Gauge = z.infer<typeof gaugeSchema>;

export const storyboardSchema = z
  .object({
    version: z.literal(1),
    /** The video's title, as a viewer would see it. */
    title: viewerTextSchema,
    /** What Biku asked for, in his words. */
    request: z.string().min(1),
    mode: z.enum(SCRIPT_MODES),
    format: idSchema,
    style: idSchema,
    brand: idSchema,
    /** The narrator's voice (voices/<voice>.json). */
    voice: idSchema,
    /** Every bit of chance in the video (blinks, stars, tune) starts from this number. */
    seed: z.number().int().min(0),
    /** How it is finished (the format's, copied in by the draft); left out, plain. */
    finish: finishSchema.optional(),
    /**
     * How a What's the Catch? video's explainer graphics are drawn: `flat`, the bold pages of the
     * first videos, or `world`, the small 2.5D world in deep ocean colours Biku picked on
     * 2026-10-16 ("3 may be", then "last one looks good"). Left out, flat.
     */
    explainerLook: z.enum(['flat', 'world']).optional(),
    /**
     * The video's own music (2026-10-21, Biku: every Short had "the same background sounds"):
     * the instruments for its topic, and whether it is a Short or a long video. Left out: the
     * palette is the moods' own and the shape of the run decides the profile; the tune always
     * comes from the storyboard's seed.
     */
    score: z
      .object({
        palette: z.enum(MUSIC_PALETTES).optional(),
        profile: z.enum(SOUND_PROFILES).optional(),
      })
      .strict()
      .optional(),
    /** Where the facts come from. Needed by factual formats. */
    sources: z.array(z.string().min(1)).default([]),
    /** The lessons this storyboard was written under (knowledge/lessons-log.md). */
    appliedLessons: z
      .array(z.string().regex(/^L-\d{4}$/, 'a lesson id looks like L-0007'))
      .default([]),
    cast: z.array(castMemberSchema).default([]),
    /**
     * The series the video belongs to, when it has a fixed cast of saved characters (for a game
     * theory video, "game-theory"). At least two of that cast's speaking members must be in it.
     */
    series: idSchema.optional(),
    /**
     * The cover picture: which shot it shows, how far into it, and in what size of shot. Left
     * out, the cover is the opening shot.
     */
    cover: z
      .object({
        shot: idSchema,
        at: z.number().min(0).max(1).default(0.6),
        framing: z.enum(FRAMINGS).optional(),
      })
      .strict()
      .optional(),
    /**
     * A counter in the top corner of the whole video: a few words and a number that climbs by
     * `perSecond` from the first frame, and stops and fades as the video ends.
     */
    meter: z
      .object({
        label: viewerTextSchema,
        perSecond: z.number().positive(),
        /** A sign before the number, such as "$". */
        prefix: z.string().max(3).optional(),
        /**
         * The shot the counter starts on: it is not shown before that shot, and counts from
         * nothing there (seconds since the smoke came in). Left out, it runs from the first frame.
         * A part of a video keeps the name of a shot in an earlier part, so that it is a shot of
         * the video is checked on the whole plan (plan.ts), not here.
         */
        from: idSchema.optional(),
      })
      .strict()
      .optional(),
    /**
     * Gauges at the top of the picture that carry the story (2026-10-22, after two Kurzgesagt
     * Shorts, knowledge/playbooks/kurzgesagt-study.md): a bar that fills and drains, a number
     * that counts up or down, or steps ("2/3"). Each changes on its keys, each key on a word of
     * its shot, and stays up until its `until` shot ends. At most two at once.
     */
    gauges: z.array(gaugeSchema).max(3).optional(),
    scenes: z.array(sceneSchema).min(1),
  })
  .strict()
  .superRefine((sb, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const shotIds = sb.scenes.flatMap((s) => s.shots.map((t) => t.id));
    for (const g of sb.gauges ?? []) {
      const at = g.keys.map((k) => shotIds.indexOf(k.shot));
      g.keys.forEach((k, i) => {
        if ((at[i] ?? -1) < 0)
          issue(`the gauge "${g.label}" changes on shot "${k.shot}", which is not in the plan`);
        if (
          g.kind === 'steps' &&
          (!Number.isInteger(k.value) || k.value < 0 || k.value > (g.of ?? 3))
        )
          issue(`the gauge "${g.label}" counts whole steps from 0 to ${g.of ?? 3}`);
      });
      if (at.some((x, i) => i > 0 && x < (at[i - 1] ?? 0)))
        issue(`the keys of the gauge "${g.label}" are not in the order of the shots`);
      if (g.until && !shotIds.includes(g.until))
        issue(`the gauge "${g.label}" stays up until shot "${g.until}", which is not in the plan`);
    }
    const once = (ids: string[], what: string) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) issue(`${what} "${id}" is used twice`);
        seen.add(id);
      }
    };
    const cast = new Set(sb.cast.map((m) => m.id));
    if (sb.cover && !sb.scenes.some((scene) => scene.shots.some((s) => s.id === sb.cover?.shot))) {
      issue(`the cover shows shot "${sb.cover.shot}", which is not in the video`);
    }
    once(
      sb.cast.map((m) => m.id),
      'cast member',
    );
    once(
      sb.scenes.map((s) => s.id),
      'scene',
    );
    once(
      sb.scenes.flatMap((s) => s.lines.map((l) => l.id)),
      'line',
    );
    once(
      sb.scenes.flatMap((s) => s.shots.map((s2) => s2.id)),
      'shot',
    );

    // Chapters count up from 1 with no gap, and a chapter's scenes sit together.
    let chapter = 1;
    sb.scenes.forEach((scene, i) => {
      if (i === 0 && scene.chapter !== 1) issue('the first scene must be in chapter 1');
      if (scene.chapter < chapter) issue(`scene "${scene.id}" goes back to an earlier chapter`);
      if (scene.chapter > chapter + 1) issue(`scene "${scene.id}" skips a chapter`);
      chapter = Math.max(chapter, scene.chapter);
    });

    for (const scene of sb.scenes) {
      const lineIds = scene.lines.map((l) => l.id);
      for (const line of scene.lines) {
        if (line.speaker !== NARRATOR && !cast.has(line.speaker)) {
          issue(`line "${line.id}" is spoken by "${line.speaker}", who is not in the cast`);
        }
      }
      // Shots follow the lines in order, and together they speak every word of each line.
      let at = 0;
      for (const shot of scene.shots) {
        const index = lineIds.indexOf(shot.line);
        if (index === -1) {
          issue(`shot "${shot.id}" is on line "${shot.line}", which is not in scene "${scene.id}"`);
          continue;
        }
        if (index < at) issue(`shot "${shot.id}" goes back to an earlier line`);
        at = Math.max(at, index);
        const inShot = new Set(shot.actors.map((a) => a.character));
        for (const a of shot.actors) {
          if (!cast.has(a.character))
            issue(`shot "${shot.id}" uses "${a.character}", who is not in the cast`);
          const named = !['camera', 'up', 'down', 'ahead'].includes(a.lookAt);
          const isProp = shot.props.some((p) => p.prop === a.lookAt);
          const isHeld = shot.actors.some((o) => o.holds === a.lookAt);
          if (named && !inShot.has(a.lookAt) && !isProp && !isHeld) {
            issue(
              `in shot "${shot.id}", "${a.character}" looks at "${a.lookAt}", which is not in the shot`,
            );
          }
          if (a.lookAt === a.character)
            issue(`in shot "${shot.id}", "${a.character}" looks at themselves`);
          let moment = 0;
          let inHand = a.holds;
          for (const step of a.then) {
            if (step.at <= moment) {
              issue(`in shot "${shot.id}", the steps of "${a.character}" are not in order of time`);
            }
            moment = step.at;
            if (step.holds !== undefined) inHand = step.holds ?? undefined;
            const target = step.lookAt;
            if (target === undefined || ['camera', 'up', 'down', 'ahead'].includes(target))
              continue;
            const there =
              inShot.has(target) ||
              shot.props.some((p) => p.prop === target) ||
              shot.actors.some((o) => o.holds === target) ||
              inHand === target;
            if (!there || target === a.character) {
              issue(
                `in shot "${shot.id}", "${a.character}" then looks at "${target}", which is not in the shot`,
              );
            }
          }
        }
        for (const e of shot.effects) {
          if (!inShot.has(e.on))
            issue(`shot "${shot.id}" puts an effect on "${e.on}", who is not in the shot`);
        }
        if (shot.camera.focus && !inShot.has(shot.camera.focus)) {
          issue(`shot "${shot.id}" focuses on "${shot.camera.focus}", who is not in the shot`);
        }
        if (shot.overlay?.kind === 'bubble') {
          for (const who of [shot.overlay.of, shot.overlay.to]) {
            if (who !== undefined && !inShot.has(who))
              issue(`shot "${shot.id}" has a bubble for "${who}", who is not in the shot`);
          }
        }
        if (shot.camera.framing === 'over-shoulder' && shot.actors.length < 2) {
          issue(`shot "${shot.id}" is over the shoulder, which needs two people`);
        }
      }
      for (const line of scene.lines) {
        const shots = scene.shots.filter((s) => s.line === line.id);
        if (shots.length === 0) {
          issue(`line "${line.id}" has no shot`);
          continue;
        }
        const spoken = plainWords(shots.map((s) => s.words).join(' '));
        if (spoken !== plainWords(line.text)) {
          issue(`the shots of line "${line.id}" do not add up to its words`);
        }
      }
    }

    // Times, once the voice stage has filled them in: all shots or none, in order, no overlap.
    const shots = sb.scenes.flatMap((s) => s.shots);
    const timed = shots.filter((s) => s.startMs !== undefined);
    if (timed.length > 0 && timed.length < shots.length) {
      issue('some shots have times and some do not');
    }
    for (let i = 1; i < timed.length; i++) {
      const prev = timed[i - 1];
      const cur = timed[i];
      if (prev?.endMs !== undefined && cur?.startMs !== undefined && cur.startMs + 1 < prev.endMs) {
        issue(`shot "${cur.id}" starts before shot "${prev.id}" ends`);
      }
    }
  });

export type Look = z.infer<typeof lookSchema>;
export type CastMember = z.infer<typeof castMemberSchema>;
export type StoryLine = z.infer<typeof storyLineSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type ActorStep = z.infer<typeof actorStepSchema>;
export type Shot = z.infer<typeof shotSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Storyboard = z.infer<typeof storyboardSchema>;

/**
 * How fast the Kokoro voices speak at speed 1, in words a minute, with no pauses counted.
 * Measured on the look test and Moon Tax tracks (185 and 207 for the narrator; character
 * voices run faster). Used to guess a length before the voice exists; the guess can be an
 * eighth out either way.
 */
export const SPEAKING_WPM = 195;

/** A rough spoken length for words not yet voiced, pauses not included. */
export function estimateSeconds(text: string, wordsPerMinute = SPEAKING_WPM): number {
  const count = plainWords(text).split(' ').filter(Boolean).length;
  return (count / wordsPerMinute) * 60;
}

/** What someone is doing during one stretch of a shot: from `at` until their next step. */
export type ActorMoment = {
  at: number;
  pose?: string;
  action?: string;
  expression: string;
  /** How strongly the face is worn, 0.2 to 1. */
  strength: number;
  lookAt: string;
  holds?: string;
};

/**
 * A person's shot as stretches of time: how they start, then each step with everything it
 * left unsaid carried on from the stretch before.
 */
export function actorMoments(actor: Actor): ActorMoment[] {
  const first: ActorMoment = {
    at: 0,
    ...(actor.action ? { action: actor.action } : { pose: actor.pose ?? 'stand' }),
    expression: actor.expression,
    strength: actor.strength ?? 1,
    lookAt: actor.lookAt,
    ...(actor.holds ? { holds: actor.holds } : {}),
  };
  const out = [first];
  for (const step of actor.then) {
    const before = out[out.length - 1] ?? first;
    const moves = step.pose !== undefined || step.action !== undefined;
    const holds = step.holds === undefined ? before.holds : (step.holds ?? undefined);
    out.push({
      at: step.at,
      ...(moves
        ? step.action
          ? { action: step.action }
          : { pose: step.pose ?? 'stand' }
        : before.action
          ? { action: before.action }
          : { pose: before.pose ?? 'stand' }),
      expression: step.expression ?? before.expression,
      // A new face comes on fully unless the step says how strongly; the same face keeps its strength.
      strength: step.strength ?? (step.expression === undefined ? before.strength : 1),
      lookAt: step.lookAt ?? before.lookAt,
      ...(holds ? { holds } : {}),
    });
  }
  return out;
}
