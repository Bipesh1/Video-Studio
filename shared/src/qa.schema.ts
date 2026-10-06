import { z } from 'zod';
import { SIZE_NAMES, idSchema } from './plugins.schema';

/**
 * The self-check of a finished part (Part 2, section 12): what the studio measured, what
 * Claude looked at with its own eyes, and the plain-language report made from the two.
 */

/** One thing found. A problem has to be fixed before the part is shown; a note is worth a look. */
export const qaFindingSchema = z
  .object({
    level: z.enum(['problem', 'note']),
    /** The shot it is in, when it is in one. */
    shot: idSchema.optional(),
    /** When in the part it happens, ms. */
    atMs: z.number().min(0).optional(),
    /** What is wrong, in plain words. */
    text: z.string().min(3),
  })
  .strict();

/** One check: what it makes sure of, what was measured or looked at, and what it found. */
export const qaCheckSchema = z
  .object({
    id: z.string().min(1),
    /** A plain sentence that is true when the check passes. */
    title: z.string().min(3),
    /** Measured by the studio, or looked at by Claude. */
    by: z.enum(['measured', 'looked']),
    /** What was measured or looked at, with its numbers, in plain words. */
    detail: z.string(),
    findings: z.array(qaFindingSchema),
  })
  .strict();

export const qaReportSchema = z
  .object({
    version: z.literal(1),
    title: z.string().min(1),
    part: z.number().int().min(1),
    parts: z.number().int().min(1),
    size: z.enum(SIZE_NAMES),
    /** The video file that was checked. */
    video: z.string().min(1),
    seconds: z.number().min(0),
    checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checks: z.array(qaCheckSchema),
    /** What was found and put right on the way to this video. */
    fixed: z.array(z.string()),
    /** Things worth Biku's eye that are not faults. */
    notes: z.array(z.string()),
  })
  .strict();

export type QaFinding = z.infer<typeof qaFindingSchema>;
export type QaCheck = z.infer<typeof qaCheckSchema>;
export type QaReport = z.infer<typeof qaReportSchema>;

export type QaQuestion = { id: string; text: string };

/** The Style Check, word for word from the style guide (Style 11). A test holds the two together. */
export const STYLE_CHECK: readonly QaQuestion[] = [
  { id: 'style-1', text: 'Does every character and prop have a clean black outline?' },
  { id: 'style-2', text: 'Is the background free of outlines?' },
  { id: 'style-3', text: 'Are characters brighter and more saturated than the background?' },
  {
    id: 'style-4',
    text: "Is there at most one shadow tone per color, coming from the scene's light direction?",
  },
  { id: 'style-5', text: 'Are the heads round and a little over a quarter of body height?' },
  { id: 'style-6', text: 'Does the face clearly show the emotion the narration calls for?' },
  {
    id: 'style-7',
    text: 'Is identity mode on where the story needs it, with skin tone and hair correct?',
  },
  {
    id: 'style-8',
    text: 'Is the clothing tier the lowest one that still makes the character recognizable?',
  },
  { id: 'style-9', text: 'Is the caption area clear?' },
  { id: 'style-10', text: 'Is there no blood, wound or gore?' },
  {
    id: 'style-11',
    text: 'Does every hand that holds or points show fingers, while resting hands stay mittens?',
  },
];

/** The story check of every still (section 12, step 3). */
export const STORY_CHECK: readonly QaQuestion[] = [
  { id: 'story-in-frame', text: 'Is every character inside the frame?' },
  { id: 'story-face', text: 'Is each face visible where it matters?' },
  { id: 'story-expression', text: 'Does the expression fit the line?' },
  { id: 'story-hands', text: 'Are hands on the things they hold?' },
  { id: 'story-feet', text: 'Are feet on the ground?' },
  { id: 'story-action', text: 'Does the action match the words?' },
  { id: 'story-setting', text: 'Does the setting fit the story?' },
];

/** What a strip of frames across a move or a cut is looked at for (section 12, step 4; L-0030). */
export const MOTION_CHECK: readonly QaQuestion[] = [
  { id: 'motion-smooth', text: 'Does the move happen over several frames, with no jump?' },
  { id: 'motion-body', text: 'Does the body move like a body: feet down, knees the right way?' },
  {
    id: 'motion-cut',
    text: 'Is everyone the same on both sides of the cut: place, direction, posture?',
  },
];

/** The playbook check (section 12, step 5). */
export const PLAYBOOK_CHECK: readonly QaQuestion[] = [
  { id: 'playbook', text: 'Was every rule in the loaded playbooks followed?' },
];

export const QA_QUESTIONS: readonly QaQuestion[] = [
  ...STYLE_CHECK,
  ...STORY_CHECK,
  ...MOTION_CHECK,
  ...PLAYBOOK_CHECK,
];

const qaNoSchema = z
  .object({
    /** Which question the answer to is "no". */
    q: z.string().refine((id) => QA_QUESTIONS.some((q) => q.id === id), {
      message: 'not a question of the self-check',
    }),
    /** What is wrong, in plain words. */
    what: z.string().min(3),
  })
  .strict();

/** "ok" when every question is a yes; otherwise each "no" and what is wrong. */
export const qaAnswerSchema = z.union([
  z.literal('ok'),
  z.object({ no: z.array(qaNoSchema).min(1) }).strict(),
]);

/**
 * What Claude saw when it looked: an answer for every still, for every strip of frames, and
 * for the playbook. It names the video it looked at, so a look at an older render never
 * stands for a newer one.
 */
export const qaLookSchema = z
  .object({
    version: z.literal(1),
    video: z.string().min(1),
    stills: z.record(idSchema, qaAnswerSchema),
    strips: z.record(z.string(), qaAnswerSchema),
    playbook: qaAnswerSchema,
    /** What was found and put right on the way to this video, in plain words. */
    fixed: z.array(z.string().min(3)).default([]),
    /** Things worth Biku's eye that are not faults. */
    notes: z.array(z.string().min(3)).default([]),
  })
  .strict();

export type QaAnswer = z.infer<typeof qaAnswerSchema>;
export type QaLook = z.infer<typeof qaLookSchema>;
