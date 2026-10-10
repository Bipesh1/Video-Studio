import { z } from 'zod';

/**
 * Character cards (Part 2, sections 7.3 and 9): `characters/<id>.json` saves how one recurring
 * person looks, so they are the same in every shot and every video. A card is only data; the
 * engine turns it into skin, hair, clothes, age and a default face.
 */

const name = z.string().regex(/^[a-z][a-z0-9-]*$/, 'lower case words joined by hyphens');

/**
 * Tier 1 clothing, mixed freely. Each garment names a token cloth color. The field is called
 * `cloth`, not `color`, so the engine's guard against hand-typed colors stays strict.
 */
export const clothesSchema = z
  .object({
    top: z
      .object({
        kind: z.enum(['tank-top', 'shirt', 't-shirt', 'hoodie', 'jacket', 'lab-coat']),
        cloth: name,
        sleeves: z.enum(['long', 'short']).optional(),
        /** What shows under an open jacket or lab coat. Left out, white. */
        under: name.optional(),
      })
      .strict()
      .optional(),
    bottom: z
      .object({ kind: z.enum(['trousers', 'skirt']), cloth: name })
      .strict()
      .optional(),
    /** One garment from shoulder to hem, instead of a top and a bottom. */
    onePiece: z
      .object({ kind: z.enum(['dress', 'robe']), cloth: name })
      .strict()
      .optional(),
    shoes: z
      .object({ kind: z.enum(['sneakers', 'boots']), cloth: name })
      .strict()
      .optional(),
    hat: z
      .object({ kind: z.enum(['brim-hat', 'top-hat']), cloth: name })
      .strict()
      .optional(),
    /** A pair of glasses. */
    glasses: z.boolean().optional(),
    /** A cloak down the back with drapes over the shoulders; hood: true pulls the hood up. */
    cloak: z.object({ cloth: name, hood: z.boolean().optional() }).strict().optional(),
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.onePiece && (c.top || c.bottom)) {
      ctx.addIssue({
        code: 'custom',
        message: 'a dress or robe replaces the top and bottom; give one or the other',
      });
    }
  });

export type Clothes = z.infer<typeof clothesSchema>;

export const characterCardSchema = z
  .object({
    /** Also the file name: characters/<id>.json. */
    id: name,
    name: z.string().min(1),
    /** Who they are, in one or two plain sentences. */
    description: z.string().min(10),
    tags: z.array(z.string().regex(/^[a-z0-9][a-z0-9 -]*$/)).min(2),
    age: z.enum(['child', 'adult', 'elder']),
    /** Head size beside an adult in the same shot: 1 is an adult, about 0.85 a child. */
    size: z.number().min(0.5).max(1.3),
    /** Skin and hair. Left out, the character has the default white head of the references. */
    identity: z
      .object({
        skinTone: z.number().int().min(1).max(8),
        hair: name,
        hairColor: name,
        facialHair: z.enum(['beard', 'moustache']).optional(),
        /** Accent color of a head wrap. */
        wrap: name.optional(),
      })
      .strict()
      .optional(),
    /** A full costume by its library name, or tier 1 clothes. Left out: a plain stick figure. */
    outfit: z
      .union([z.object({ costume: name }).strict(), z.object({ clothes: clothesSchema }).strict()])
      .optional(),
    eyeStyle: z.enum(['round', 'stern']),
    /** The face they wear when a shot gives no other. */
    expression: name,
    /** A voice file name under voices/, once voices are chosen. */
    voice: z.string().min(1).optional(),
    version: z.number().int().min(1),
    added: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export type CharacterCard = z.infer<typeof characterCardSchema>;
