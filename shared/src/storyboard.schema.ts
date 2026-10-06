import { z } from 'zod';
import { characterCardSchema } from './character.schema';
import {
  CAMERA_MOVES,
  FRAMINGS,
  SCRIPT_MODES,
  TREATMENTS,
  idSchema,
  viewerTextSchema,
} from './plugins.schema';
import { MUSIC_MOODS, SFX_NAMES } from './sound.schema';

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
    /** Silence after the line, in ms. Left out: the format's usual pause. */
    pauseAfterMs: z.number().int().min(0).max(5000).optional(),
  })
  .strict();

/** One person in one shot. */
export const actorSchema = z
  .object({
    character: idSchema,
    /** A held pose from the library, or an action. One or the other. */
    pose: idSchema.optional(),
    action: idSchema.optional(),
    /** The face it needs. Every shot with a character names one (writing rule 7). */
    expression: idSchema,
    facing: z.enum(['left', 'right']),
    headTurn: z.enum(['front', 'three-quarter', 'profile']).default('three-quarter'),
    /** Where they stand across the wide layout: 0 is the left edge, 1 the right. */
    x: z.number().min(0).max(1).optional(),
    /** Who or what they look at: a cast member, a prop in the shot, or a direction. */
    lookAt: z.union([z.enum(['camera', 'up', 'down', 'ahead']), idSchema]).default('ahead'),
    /** A library prop in their hand. */
    holds: idSchema.optional(),
    /** Seen from behind, as the near person in an over-the-shoulder shot. */
    back: z.boolean().default(false),
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
  })
  .strict();

/** An effect drawn on or beside someone: sweat, tears, an anger mark, a symbol. */
export const shotEffectSchema = z.object({ effect: idSchema, on: idSchema }).strict();

/** A sound effect in a shot. The mix turns these into the sound plan. */
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
    overlay: z
      .object({ kind: z.enum(['title', 'label']), text: viewerTextSchema })
      .strict()
      .optional(),
    /** How this shot arrives. A fade is for a change of time or place (lesson L-0013). */
    transition: z.enum(['cut', 'fade']).default('cut'),
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
    /** Where the facts come from. Needed by factual formats. */
    sources: z.array(z.string().min(1)).default([]),
    /** The lessons this storyboard was written under (knowledge/lessons-log.md). */
    appliedLessons: z
      .array(z.string().regex(/^L-\d{4}$/, 'a lesson id looks like L-0007'))
      .default([]),
    cast: z.array(castMemberSchema).default([]),
    scenes: z.array(sceneSchema).min(1),
  })
  .strict()
  .superRefine((sb, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    const once = (ids: string[], what: string) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) issue(`${what} "${id}" is used twice`);
        seen.add(id);
      }
    };
    const cast = new Set(sb.cast.map((m) => m.id));
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
        }
        for (const e of shot.effects) {
          if (!inShot.has(e.on))
            issue(`shot "${shot.id}" puts an effect on "${e.on}", who is not in the shot`);
        }
        if (shot.camera.focus && !inShot.has(shot.camera.focus)) {
          issue(`shot "${shot.id}" focuses on "${shot.camera.focus}", who is not in the shot`);
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
