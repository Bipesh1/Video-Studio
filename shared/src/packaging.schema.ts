import { z } from 'zod';

/**
 * A video's package (2026-10-21): what a stranger sees before they click, and what the video
 * promises them, decided before the script is written. The strongest creators settle the idea,
 * the title and the thumbnail first, and drop an idea they cannot package
 * (knowledge/playbooks/explainers.md, section 1). A format with `packaging: true` refuses a
 * script whose run has no `packaging.json`.
 */
const words = (n: number) => (s: string) => s.trim().split(/\s+/).filter(Boolean).length <= n;

export const packagingSchema = z
  .object({
    version: z.literal(1),
    /** The title as it will stand on YouTube: plain words a stranger understands. */
    title: z.string().min(8).max(70),
    /** The question in a stranger's head when they read the title. */
    question: z.string().min(8).max(140),
    /** What the viewer will know, or see differently, by the end. */
    promise: z.string().min(10).max(200),
    /** The answer, in one sentence: the payoff the last line gives. */
    answer: z.string().min(10).max(240),
    thumbnail: z
      .object({
        /** The one big subject, close and bright: what the eye lands on first. */
        subject: z.string().min(5).max(160),
        /** The few big words on it: they add to the title, never repeat it. */
        words: z
          .string()
          .min(2)
          .max(40)
          .refine(words(6), { message: 'a thumbnail carries six words at most' }),
      })
      .strict(),
    /** What the first ten seconds show and say: the title's promise proved at once. */
    firstTenSeconds: z.string().min(10).max(300),
    /** Why a stranger scrolling past would click, in a sentence. Not "it is interesting". */
    whyClick: z.string().min(20).max(300),
    /** The kind of topic: an everyday surprise, a big "what if", or a big question everyone has. */
    kind: z.enum(['everyday', 'what-if', 'big-question']),
  })
  .strict()
  .refine(
    (p) =>
      p.thumbnail.words.trim().toLowerCase() !== p.title.trim().toLowerCase() &&
      !p.title.toLowerCase().includes(p.thumbnail.words.trim().toLowerCase()),
    { message: "the thumbnail's words repeat the title: they should add to it" },
  );
export type Packaging = z.infer<typeof packagingSchema>;
