import { z } from 'zod';

/** A CSS hex color such as #16161A. Every visual value in the engine must be one of these from tokens.json. */
export const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'expected a 6-digit hex color like #16161A');

/** An inclusive [min, max] range where min <= max. */
const range = z
  .tuple([z.number(), z.number()])
  .refine(([lo, hi]) => lo <= hi, { message: 'range must be [min, max] with min <= max' });

const unit = z.number().min(0).max(1);

export const styleTokensSchema = z
  .object({
    id: z.string().min(1),
    version: z.number().int().positive(),
    line: z.object({
      color: hexColor,
      outlinePctOfHead: range,
      limbPctOfHead: range,
      detailPctOfHead: range,
      browPctOfHead: unit,
      cap: z.enum(['round', 'butt', 'square']),
      join: z.enum(['round', 'miter', 'bevel']),
    }),
    proportions: z.object({
      headToHeight: unit,
      headAspectMax: z.number().min(1),
      torsoHeads: z.number().positive(),
      upperArmHeads: z.number().positive(),
      lowerArmHeads: z.number().positive(),
      legHeads: z.number().positive(),
      handHeads: z.number().positive(),
    }),
    fill: z.object({
      head: hexColor,
      headShadow: hexColor,
      shadowDarken: range,
      shadowEdge: z.enum(['hard']),
      lightFrom: z.enum(['upper-left', 'upper-right', 'left', 'right', 'top']),
      characterGradients: z.literal(false),
    }),
    skinTones: z.array(hexColor).length(8),
    darkSkinRimFromIndex: z.number().int().min(0).max(7),
    // Guide v3: hair fills named in Style 3.4, each [fill, shadow].
    hair: z.record(z.string(), z.tuple([hexColor, hexColor])),
    face: z.object({
      eyeWidthPctOfHead: unit,
      pupilPctOfEye: unit,
      mouthInterior: hexColor,
      // Guide v6: face feature lines are thinner and softer than outlines.
      featureLinePctOfHead: unit,
      featureLineColor: hexColor,
      // Guide v7: wrinkles and creases are fine tapered strokes; this is their fullest thickness.
      creasePctOfHead: unit,
      nose: z.literal(false),
      ears: z.literal(false),
    }),
    effects: z.object({
      sweat: hexColor,
      anger: hexColor,
    }),
    accents: z.record(z.string(), z.array(hexColor).min(2).max(3)),
    palettes: z.record(z.string(), z.array(hexColor).min(3)),
    background: z.object({
      outlines: z.literal(false),
      treatments: z.object({
        simple: z.array(z.string()),
        atmospheric: z.array(z.string()),
      }),
      lightRayOpacity: range,
      moon: hexColor,
    }),
    motion: z.object({
      fps: z.number().int().positive(),
      poseTransitionFrames: z.tuple([z.number().int(), z.number().int()]),
      blinkEverySeconds: range,
      maxSquash: unit,
      mouthShapes: z.array(z.string()).min(1),
    }),
    captions: z.object({
      fill: hexColor,
      stroke: hexColor,
      emphasis: hexColor,
      safeBottomPct916: unit,
    }),
    // Guide v2: resting hands are mittens; hands that hold or point show fingers.
    hands: z.object({
      resting: z.enum(['mitten']),
      holding: z.enum(['fingers']),
      pointing: z.enum(['one-finger']),
      gripFingers: z.number().int().min(3).max(4),
    }),
    clothingTiers: z.array(z.string()).length(3),
    violence: z.enum(['implied-only']),
  })
  .strict();

export type StyleTokens = z.infer<typeof styleTokensSchema>;

/** Validate a parsed tokens.json. Throws a plain-language error listing every problem. */
export function parseStyleTokens(input: unknown): StyleTokens {
  const result = styleTokensSchema.safeParse(input);
  if (result.success) return result.data;
  const lines = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`);
  throw new Error(`tokens.json is not valid:\n${lines.join('\n')}`);
}
