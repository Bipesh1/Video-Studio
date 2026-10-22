import { z } from 'zod';
import { idSchema, viewerTextSchema } from './plugins.schema';
import { characterCardSchema } from './character.schema';
import { graphicSchema } from './graphic.schema';

/** How someone of the poster's own looks: as on a character card. */
const lookSchema = characterCardSchema
  .pick({ age: true, size: true, identity: true, outfit: true, eyeStyle: true })
  .partial()
  .strict();

/**
 * Thumbnails (`runs/<run>/thumbnails.json`): pictures made to stop someone scrolling. A
 * thumbnail is not a frame of the video and not a shot with words on it (Biku, 2026-10-13:
 * "the cover image shouldnt be a frame of the actual video ... its a thumbnail right?", and of
 * three shots with words: "not one of them is good for a thumbnail it should portray what the
 * vdeo is about it should be designed properly").
 *
 * So a thumbnail is a poster, built in layers from the back to the front, each placed and
 * sized freely: the room, people of the video's cast at any size, plain grey figures, things,
 * smoke, a darkening for words to stand on, a sign with an arrow, labels like price tags,
 * panels to set two things against each other, and the words. Places are shares of the picture
 * (0 to 1 across and down); sizes are shares of its height.
 *
 * What the words are (Biku, the same day, with a comparison thumbnail as his example: a man
 * holding two cameras tagged $30 and $369): "it should be a great and general title related to
 * this story on text ... it doesnt even say what the video is". The words name the video, and
 * the picture shows what it is about at a glance, with labels where they help.
 *
 * Several can be described in one file, numbered in the order they are written, to be put
 * side by side for him to pick from by eye.
 */

const share = z.number().min(-0.5).max(1.5);
const point = z.object({ x: share, y: share }).strict();
const light = z.number().min(0.1).max(1);

/** A body the poster draws: where the middle of its head is, and how big that head is. */
const body = {
  x: share,
  y: share,
  /**
   * Where their feet stand, in place of `y`: for a whole figure on a ground line, which is
   * easier to place by the feet than by the head.
   */
  ground: share.optional(),
  /** The head's height as a share of the picture's height. */
  head: z.number().min(0.02).max(0.8),
  /** A pose by name, or a move by name (run, walk) caught `moment` seconds into it. */
  pose: idSchema.default('stand'),
  moment: z.number().min(0).max(5).default(0.2),
  facing: z.enum(['left', 'right']).default('right'),
  /** How far the head is turned: 0 to the front, 1 in profile. */
  turn: z.number().min(0).max(1).default(0.3),
  /** A point in the picture the eyes look at. Left out: straight ahead. */
  looksAt: point.optional(),
};

const FLAT_LAYERS = [
  /** A place of the library as the backdrop, in a palette. */
  z
    .object({
      kind: z.literal('room'),
      place: idSchema,
      palette: idSchema,
      treatment: z.enum(['simple', 'atmospheric']).default('atmospheric'),
    })
    .strict(),
  /**
   * A backdrop of the poster's own, in place of a room: one colour glowing out of a point into
   * a darker one, with rays of light from that point. A thumbnail does not have to look like
   * the video (Biku, 2026-10-13: "it should be a little bit diffrent that what actual video
   * looks like should be attractive and good").
   */
  z
    .object({
      kind: z.literal('backdrop'),
      /** Accents of the style, by name: the colour at the point, and the colour at the edges. */
      inner: idSchema,
      outer: idSchema,
      at: point,
      /** How many rays of light, 0 for none. */
      rays: z.number().int().min(0).max(40).default(16),
      /** How far the edges are darkened toward the line colour, 0 to 1. */
      deep: z.number().min(0).max(1).default(0.55),
    })
    .strict(),
  /** A soft light at a point, to lift whoever stands in front of it off the backdrop. */
  z
    .object({
      kind: z.literal('glow'),
      at: point,
      /** Its radius as a share of the picture's height. */
      radius: z.number().min(0.05).max(1.5),
      paint: idSchema.default('cream'),
      strength: z.number().min(0.1).max(1).default(0.7),
    })
    .strict(),
  /** One of the video's cast. */
  z
    .object({
      kind: z.literal('person'),
      character: idSchema,
      ...body,
      expression: idSchema,
      /** Marks round the head: sweat, tears and the like. */
      effects: z.array(idSchema).default([]),
      /** Depth by value: how much of their light is left, for someone further back. */
      light: light.default(1),
      /**
       * A pale edge all round them, like a cut-out sticker, as a share of the head: it lifts
       * the subject off whatever is behind. 0 for none.
       */
      outline: z.number().min(0).max(0.1).default(0),
    })
    .strict(),
  /**
   * A figure of the poster's own: a plain grey one of the crowd, or, with a `look`, someone
   * dressed for a film that has no saved cast yet (skin, hair and clothes as on a card).
   */
  z
    .object({
      kind: z.literal('extra'),
      ...body,
      expression: idSchema.default('neutral'),
      look: lookSchema.optional(),
      effects: z.array(idSchema).default([]),
      /** A gold badge on the chest: one of the paid ones. */
      badge: z.boolean().default(false),
      light: light.default(0.62),
      outline: z.number().min(0).max(0.1).default(0),
    })
    .strict(),
  /** A thing of the library standing at a point (its foot), drawn at a head's scale. */
  z
    .object({
      kind: z.literal('thing'),
      prop: idSchema,
      x: share,
      y: share,
      head: z.number().min(0.02).max(0.8),
      flip: z.boolean().default(false),
    })
    .strict(),
  /** A bank of smoke across the picture: where its top is, and how big its puffs are. */
  z
    .object({
      kind: z.literal('smoke'),
      top: share,
      head: z.number().min(0.03).max(0.6),
      /** Where the floor it stands on is. Left out: just under the picture. */
      floor: share.default(1.04),
      seed: z.number().int().min(1).default(1),
      light: light.default(1),
    })
    .strict(),
  /**
   * A picture inside the picture, from `top` down to `bottom`: the room again, covering what
   * lies under it. For two things side by side to compare, one panel above the other.
   */
  z
    .object({
      kind: z.literal('panel'),
      top: share,
      bottom: share,
      place: idSchema,
      palette: idSchema,
      treatment: z.enum(['simple', 'atmospheric']).default('atmospheric'),
    })
    .strict(),
  /** A plain band of the line colour across the picture: a place for a title, or a divider. */
  z
    .object({
      kind: z.literal('band'),
      top: share,
      bottom: share,
    })
    .strict(),
  /** A label like a price tag: a few words in a coloured box. */
  z
    .object({
      kind: z.literal('tag'),
      text: viewerTextSchema,
      x: share,
      y: share,
      /** The height of its letters as a share of the picture's height. */
      size: z.number().min(0.015).max(0.2).default(0.045),
      /** An accent of the style, by name. */
      paint: idSchema.default('cream'),
      tilt: z.number().min(-15).max(15).default(0),
    })
    .strict(),
  /** The picture darkened from one edge inward, so words stand clear on it. */
  z
    .object({
      kind: z.literal('shade'),
      from: z.enum(['top', 'bottom', 'left', 'right']),
      reach: z.number().min(0.05).max(1),
      strength: z.number().min(0.1).max(1).default(0.8),
    })
    .strict(),
  /** A small sign with an arrow from it to a point. */
  z
    .object({
      kind: z.literal('sign'),
      text: viewerTextSchema,
      at: point,
      to: point,
      /** An accent of the style, by name. */
      paint: idSchema.default('cream'),
    })
    .strict(),
  /** Rain falling across the picture, on a slant. */
  z
    .object({
      kind: z.literal('rain'),
      /** How many streaks. */
      count: z.number().int().min(10).max(400).default(120),
      /** How far a streak leans, as a share of its own length (0 is straight down). */
      slant: z.number().min(-1).max(1).default(0.25),
      light: light.default(0.5),
      seed: z.number().int().min(1).default(1),
    })
    .strict(),
  /** The ground: everything from a height down, in a colour, with its line. */
  z
    .object({
      kind: z.literal('floor'),
      y: share,
      /** An accent of the style, by name, and how far it is darkened toward the line colour. */
      paint: idSchema.default('steel'),
      deep: z.number().min(0).max(1).default(0.3),
    })
    .strict(),
  /**
   * A crowd: rows of plain figures from the back of the picture to the front, smaller and
   * dimmer the further back, for the moment the story pulls back from one person to everyone
   * (2026-10-14). `hole` keeps the figures away from a point, where someone of the cast stands.
   */
  z
    .object({
      kind: z.literal('crowd'),
      rows: z.number().int().min(1).max(20),
      cols: z.number().int().min(1).max(40),
      /** Where the heads of the back row and of the front row are. */
      top: share,
      bottom: share,
      left: share.default(0),
      right: share.default(1),
      /** The front row's head, as a share of the picture's height; the back row's is `back` of it. */
      head: z.number().min(0.01).max(0.3),
      back: z.number().min(0.2).max(1).default(0.5),
      pose: idSchema.default('stand'),
      expression: idSchema.default('neutral'),
      look: lookSchema.optional(),
      light: light.default(0.7),
      hole: point.optional(),
      holeRadius: z.number().min(0).max(1).default(0.08),
      seed: z.number().int().min(1).default(1),
    })
    .strict()
    .refine((c) => c.rows * c.cols <= 400, { message: 'a crowd is at most 400 figures' }),
  /** A sheet of paper with a few written words: a note, a ticket, a letter. */
  z
    .object({
      kind: z.literal('paper'),
      lines: z.array(viewerTextSchema).min(1).max(3),
      x: share,
      y: share,
      /** The height of its writing as a share of the picture's height. */
      size: z.number().min(0.02).max(0.2).default(0.08),
      /** The colour of the writing: an accent of the style, by name. */
      paint: idSchema.default('crimson'),
      tilt: z.number().min(-25).max(25).default(-6),
    })
    .strict(),
  /** The words: short, and not the title. */
  z
    .object({
      kind: z.literal('words'),
      /** A word wrapped in *asterisks* is gold by itself, as in the captions. */
      lines: z.array(viewerTextSchema).min(1).max(3),
      /** Which whole lines are gold, counting from 0. */
      gold: z.array(z.number().int().min(0).max(2)).default([]),
      x: share.default(0.5),
      /** Where the bottom of the last line sits. */
      bottom: share,
      /** The height of the letters as a share of the picture's height, before they are fitted. */
      size: z.number().min(0.02).max(0.3).default(0.09),
      /** How much of the picture's width they may take. */
      width: z.number().min(0.2).max(1).default(0.9),
      /**
       * True to fit each line to the width by itself, so a short line is set large and a long
       * one smaller and the block has straight sides, as thumbnail lettering usually does.
       * `size` is then the largest a line may get.
       */
      justify: z.boolean().default(false),
      /** Degrees the block is tipped, anticlockwise. */
      tilt: z.number().min(-15).max(15).default(0),
    })
    .strict(),
  /**
   * An explainer graphic of What's the Catch? (its own style, no characters), drawn whole, as it
   * stands at the end of its shot: the subject of that channel's thumbnails. `size` is the
   * height of its tall page as a share of the picture's; `page` lays the style's own page
   * colour under the whole picture first.
   */
  z
    .object({
      kind: z.literal('graphic'),
      graphic: graphicSchema,
      x: share.default(0.5),
      y: share.default(0.5),
      size: z.number().min(0.2).max(2).default(1),
      page: z.boolean().default(false),
    })
    .strict(),
  // What's the Catch? thumbnails, after Biku's reference (2026-10-15): a flat page, huge heavy
  // words, a thing circled in red, an arrow to it, the losing thing crossed out.
  /** The whole picture in one flat colour of the channel's style. */
  z
    .object({
      kind: z.literal('flat'),
      colour: z.enum([
        'background',
        'floor',
        'dark',
        'red',
        'yellow',
        'teal',
        'light',
        'mid',
        'green',
      ]),
    })
    .strict(),
  /** Huge heavy lines from the left; a `boxed` line is light on a dark box. */
  z
    .object({
      kind: z.literal('headline'),
      lines: z
        .array(
          z
            .object({
              text: viewerTextSchema,
              style: z.enum(['ink', 'boxed', 'red', 'light', 'gold']).default('ink'),
            })
            .strict(),
        )
        .min(1)
        .max(3),
      x: share.default(0.05),
      top: share.default(0.08),
      size: z.number().min(0.05).max(0.5).default(0.25),
      width: z.number().min(0.2).max(1).default(0.5),
    })
    .strict(),
  /** A thing drawn in the channel's style: `size` is its height as a share of the picture's. */
  z
    .object({
      kind: z.literal('icon'),
      name: z.enum([
        'bucket',
        'ticket',
        'shocked',
        'shocked-light',
        'tip-screen',
        'old-tip',
        'water-glass',
        'sun-blaze',
      ]),
      x: share,
      y: share,
      size: z.number().min(0.05).max(1.2),
      turn: z.number().min(-45).max(45).default(0),
      crossed: z.boolean().default(false),
    })
    .strict(),
  /** A red mark drawn by hand: a loose circle round a thing, or a curved arrow to it. */
  z
    .object({
      kind: z.literal('mark'),
      shape: z.enum(['circle', 'arrow']),
      at: point,
      to: point.optional(),
      rx: z.number().min(0.02).max(0.6).default(0.15),
      ry: z.number().min(0.02).max(0.6).default(0.3),
    })
    .strict(),
] as const;

const flatLayerSchema = z.union(FLAT_LAYERS);

/**
 * The picture cut in two along a leaning line, each side with layers of its own: two moods,
 * two times, before and after, set against each other. `at` is where the line crosses the
 * middle of the picture; `lean` is how much further right its top is than its bottom, as a
 * share of the width. Layers after the split lie over both sides (the title, a thing on the
 * line).
 */
const splitSchema = z
  .object({
    kind: z.literal('split'),
    at: z.number().min(0.1).max(0.9).default(0.5),
    lean: z.number().min(-0.6).max(0.6).default(0.12),
    left: z.array(flatLayerSchema).min(1).max(20),
    right: z.array(flatLayerSchema).min(1).max(20),
    /** The width of the pale line down the cut, as a share of the picture's height; 0 for none. */
    seam: z.number().min(0).max(0.03).default(0.008),
  })
  .strict();

export const posterLayerSchema = z.union([...FLAT_LAYERS, splitSchema]);

/** Every layer of a poster, those inside a split included. */
export const flatLayers = (layers: readonly PosterLayer[]): FlatPosterLayer[] =>
  layers.flatMap((l) => (l.kind === 'split' ? [...l.left, ...l.right] : [l]));

/** Things of the library that are someone drawn whole: the mascot seen through, on a cover. */
export const PERSON_THINGS: readonly string[] = ['xray-fat'];

export const thumbnailSchema = z
  .object({
    id: idSchema,
    /**
     * The shape it is laid out for. A YouTube thumbnail is wide (16:9, delivered at 1280 by
     * 720); the cover of a Short or a Reel is tall (9:16). One layout does not serve both.
     */
    size: z.enum(['16:9', '9:16', '4:5']).default('16:9'),
    /** What the picture is meant to show and make a stranger ask. For Biku, not drawn. */
    why: z.string().min(1),
    layers: z.array(posterLayerSchema).min(2).max(40),
  })
  .strict()
  .superRefine((t, ctx) => {
    const all = flatLayers(t.layers);
    const words = all.filter((l) => l.kind === 'words');
    if (words.length === 0 && !all.some((l) => l.kind === 'headline'))
      ctx.addIssue({ code: 'custom', message: 'a thumbnail has words' });
    const said = [
      ...words.flatMap((w) => w.lines.join(' ').split(/\s+/)),
      ...all.flatMap((l) => (l.kind === 'tag' ? l.text.split(/\s+/) : [])),
      ...all.flatMap((l) => (l.kind === 'paper' ? l.lines.join(' ').split(/\s+/) : [])),
      ...all.flatMap((l) =>
        l.kind === 'headline' ? l.lines.flatMap((x) => x.text.split(/\s+/)) : [],
      ),
    ].filter(Boolean);
    // Researched 2026-10-13 (knowledge/playbooks/thumbnails.md): past five or six words a
    // thumbnail cannot be read at the size a phone shows it.
    if (said.length > 6) {
      ctx.addIssue({
        code: 'custom',
        message: `a thumbnail says a few words, not ${said.length}: six at the most, labels included`,
      });
    }
    for (const w of words) {
      if (w.gold.some((i) => i >= w.lines.length)) {
        ctx.addIssue({ code: 'custom', message: 'a gold line is named that is not there' });
      }
    }
    // A channel with no characters (What's the Catch?) shows its explainer picture instead.
    if (
      !all.some(
        (l) =>
          l.kind === 'person' ||
          l.kind === 'extra' ||
          l.kind === 'crowd' ||
          l.kind === 'graphic' ||
          l.kind === 'icon' ||
          (l.kind === 'thing' && PERSON_THINGS.includes(l.prop)),
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'a thumbnail shows someone, or the explainer picture',
      });
    }
  });

export const thumbnailsSchema = z
  .object({
    version: z.literal(1),
    thumbnails: z.array(thumbnailSchema).min(1).max(9),
  })
  .strict()
  .refine((f) => new Set(f.thumbnails.map((t) => t.id)).size === f.thumbnails.length, {
    message: 'two thumbnails have the same id',
  });

export type PosterLayer = z.infer<typeof posterLayerSchema>;
export type FlatPosterLayer = z.infer<typeof flatLayerSchema>;
export type Thumbnail = z.infer<typeof thumbnailSchema>;
export type Thumbnails = z.infer<typeof thumbnailsSchema>;
