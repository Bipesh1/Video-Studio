import { z } from 'zod';

/**
 * Explainer graphics of What's the Catch? (its own style, `styles/fine-print/guide.md`; Biku
 * picked the look on 2026-10-15). A shot shows one, in place of a scene, and its pieces arrive
 * one at a time: each piece may name `on`, a word of the shot's words, and comes in as that
 * word is spoken. A piece without `on` comes in after the one before it.
 */

/** A word of the shot's words that a piece comes in on. */
const on = z.string().min(1).max(40).optional();
const label = z.string().min(1).max(28);

/** One or two short lines at the top; `stress` is the line in red. */
const titleSchema = z
  .object({
    lines: z.array(z.string().min(1).max(24)).min(1).max(2),
    stress: z.number().int().min(0).max(1).optional(),
    /**
     * Up at once, a word after another in the first second, instead of each word waiting to be
     * said: for the question a video opens on, which must be on screen within its first three
     * seconds (Biku's rule, 2026-10-11) even when the narrator says its words last.
     */
    now: z.boolean().optional(),
  })
  .strict();

export const GRAPHIC_SCENES = ['cinema-counter', 'cinema-auditorium', 'coffee-counter'] as const;
/** The things of each scene that can arrive one by one; the rest of the scene is always there. */
export const SCENE_THINGS = {
  'cinema-counter': ['board', 'machine', 'bucket', 'hand'],
  'cinema-auditorium': ['screen', 'pipe', 'smell'],
  // A coffee shop counter, drawn in the 2.5D world (2026-10-16, "Why Every Screen Asks You for a
  // Tip Now"): the card tablet, its tip buttons, the tablet turning round to face you, the price
  // sign, a takeaway cup, the faceless barista, the barista's look at the screen, the CUSTOM
  // button lighting up, a finger pressing it, and the camera closing in on the screen.
  'coffee-counter': [
    'tablet',
    'buttons',
    'turn',
    'sign',
    'cup',
    'barista',
    'gaze',
    'custom',
    'finger',
    'zoom',
  ],
} as const;
export const SCENE_ITEMS = [
  'board',
  'machine',
  'bucket',
  'hand',
  'screen',
  'pipe',
  'smell',
  'tablet',
  'buttons',
  'turn',
  'sign',
  'cup',
  'barista',
  'gaze',
  'custom',
  'finger',
  'zoom',
] as const;

/**
 * The journey worlds (Biku, 2026-10-17: "the animation should be very immersive, not a bunch of
 * slideshows ... like opening up a planet and showing it"): one drawn world the camera travels
 * through without a cut, from the thing in your hand out to space and into a satellite, while
 * things open up to show their inside. Each world has places the camera stops at (`STOPS`) and
 * things that arrive on the words that name them (`THINGS`).
 */
export const JOURNEY_WORLDS = ['orbit', 'water', 'sunset', 'dive', 'body'] as const;
export const JOURNEY_STOPS = {
  // The Earth, its GPS satellites, and you on a street with your phone (2026-10-17, "Why Your
  // Phone's Map Needs Einstein"): the phone's screen, you in the street, the clouds over the
  // city, the whole Earth with the satellites round it, the sky above you with four satellites,
  // one satellite close, the inside of that satellite, the Earth in its well of gravity.
  orbit: ['phone', 'street', 'clouds', 'earth', 'sky', 'satellite', 'inside', 'well'],
  // A glass of water and where its water came from (2026-10-18, "Why Is the Water in Your Glass
  // Older Than the Sun?"): the glass on the kitchen counter, one drop on its rim, the tap above
  // it, the coast outside the window, one water molecule inside the drop, the whole Earth, a
  // comet, the Sun, the Sun and its planets, the dark icy cloud before the Sun, one speck of dust
  // in it, the cloud falling into a disk, the young Earth, and the house with its shower and rain.
  water: [
    'glass',
    'drop',
    'tap',
    'outside',
    'molecule',
    'earth',
    'comet',
    'sun',
    'system',
    'cloud',
    'dust',
    'disk',
    'young-earth',
    'house',
  ],
  // A beach at sunset (2026-10-18, "Why Is the Sun Already Gone When You Watch It Set?"): the
  // phone's screen filming it, the beach with you and the Sun on the sea, closer to the sea, the
  // glass of water on its towel, its straw at the waterline, the sky above cut open into its
  // layers of air, a high Sun over them, the curve of the Earth with a low Sun, your phone with
  // the horizon, the real Sun below it, both Suns with the phone in front, and the low Sun close.
  sunset: [
    'screen',
    'beach',
    'sea',
    'glass',
    'straw',
    'sky',
    'high',
    'curve',
    'phone',
    'below',
    'gap',
    'sunclose',
  ],
  // Holding your breath (2026-10-19, "Could Humans Evolve to Hold Their Breath Like Seals?"):
  // places joined by water, the camera diving into one and coming up in the next. Your bathroom
  // (the bath with you under the water, the counter beside it, wide and from above; inside your
  // chest, the lungs, the heart, your whole body, the spleen, close in among its red cells and
  // in the blood they pour into), the Earth from space, a cold sea with a seal, the Bajau's warm
  // sea (their village, a family on its platform, the houseboats, a diver on the reef, the scan
  // on the shore and a gene inside it, a journal page in the sky and its figure), and the pool of
  // the breath-hold record with its oxygen tank.
  dive: [
    'bath',
    'counter',
    'figure',
    'rise',
    'chest',
    'lungs',
    'heart',
    'limbs',
    'spleen',
    'cells',
    'stream',
    'globe',
    'seal',
    'village',
    'family',
    'boats',
    'reef',
    'scan',
    'scan-close',
    'dna',
    'page',
    'page-figure',
    'pool',
    'tank',
  ],
  // Where your fat goes (2026-10-21, "Where Does Your Fat Go When You Lose Weight?"): a show in a
  // hall. On its stage a house set of three rooms (a living room with a sofa, your bathroom with
  // you on the scale, a gym with a treadmill) and a giant old balance with two scientists; the
  // experts stand in rows in front. Your feet on the scale, you on it, the whole hall, the rows of
  // experts, the blob of fat over the scale and its atoms; the breath cloud, the sweat, the
  // dinner plate in the cloud; the gym, the sofa, the balance, its two pans and its beam. Inside
  // you, in a cutaway: the belly, one fat cell, the oil's chain of atoms, the nose, the lungs, the
  // chain pulled apart, the two leftovers, the blood.
  body: [
    'feet',
    'scale',
    'hall',
    'crowd',
    'blob',
    'atoms',
    'belly',
    'cell',
    'chain',
    'nose',
    'lungs',
    'pieces',
    'leftovers',
    'blood',
    'cloud',
    'sweat',
    'gym',
    'balance',
    'left-pan',
    'right-pan',
    'beam',
    'sofa',
    'plate',
    // Close on the front row (2026-10-22, after a study of Kurzgesagt's staging: big subjects,
    // a camera that keeps moving): the doctors, the dietitians, the trainers, the two signs, the
    // trainer flexing; and close on the toilet beside you on the stage.
    'doctor',
    'dietitian',
    'trainer',
    'signs',
    'flex',
    'toilet-seat',
  ],
} as const;
export const JOURNEY_THINGS = {
  // The map's blue dot, the satellites, a beam a satellite would shine if it watched you (and
  // its cross), the time signals rippling down, the satellite's shell opening on its clock, the
  // four distances meeting at you, a clock on the ground beside a clock in orbit, the grid of
  // gravity, the blue dot sliding away, and the clock set slow.
  orbit: [
    'dot',
    'satellites',
    'beam',
    'no-beam',
    'signals',
    'open',
    'ranges',
    'clocks',
    'well',
    'drift',
    'slow',
  ],
  // The drop and the frost creeping over it, the tap dripping, the sea, the clouds and the rain,
  // the molecule and its atoms opening out, one hydrogen growing heavy and glowing, the oceans,
  // a comet, the Sun, the heavy hydrogen fading in its heat, the picture shrinking into a
  // computer's screen and frost creeping over that, time running back to the cloud before the
  // Sun, the speck of dust, the coat of ice, the cloud falling in to make the Sun and planets,
  // rocks falling to the young Earth, time running on to today, a shower, rain on the window.
  water: [
    'drop',
    'frost',
    'tap',
    'sea',
    'clouds',
    'rain',
    'molecule',
    'open',
    'heavy',
    'oceans',
    'comet',
    'sun',
    'fade',
    'computer',
    'screen-frost',
    'rewind',
    'dust',
    'ice',
    'collapse',
    'planets',
    'rocks',
    'today',
    'shower',
    'raindrop',
  ],
  // The Sun on the phone's screen, the shimmer over the sea, the phone held up, the Sun sitting on
  // the sea, the straight line everyone imagines (and it cracking away), the straw, the layers of
  // air opening, a beam coming down through them, a high Sun, a low Sun and its beam skimming the
  // air, riding the beam into the phone, the straight line back to the Sun on the sea, the real
  // Sun below the horizon, the phone in front, the Sun squashed into an oval, and the outline of
  // the real Sun under the waterline on the screen.
  sunset: [
    'sun',
    'shimmer',
    'phone',
    'sun-on-sea',
    'straight',
    'crack',
    'straw',
    'layers',
    'beam',
    'high-sun',
    'low-sun',
    'skim',
    'ride',
    'straight-back',
    'real-sun',
    'screen-front',
    'oval',
    'ghost',
  ],
  // A seal's shape in the bath's ripples, the Earth's halo, your lungs opening, the oxygen
  // fading, the heart slowing, the blood leaving the hands and the feet, the spleen named, its
  // sponge of red cells squeezing, the cells pouring out and a tank drawn round them, the seal's
  // spleen glowing, the houseboats, a bigger tank inside a Bajau, the diver, the fish, the two
  // spleens on the scan, a tennis ball beside them, the strand of DNA, a thousand years passing,
  // the journal page, its gene glowing, a hormone with a question mark, the record's clock, the
  // oxygen tank, your heart glowing, your spleen squeezing, you coming up, the counter stopping.
  dive: [
    'ripple-seal',
    'halo',
    'lungs',
    'fading',
    'heart',
    'hands',
    'feet',
    'spleen',
    'squeeze',
    'pour',
    'tank',
    'seal-spleen',
    'houseboats',
    'big-tank',
    'diver',
    'fish',
    'bajau-spleen',
    'saluan-spleen',
    'tennis',
    'genes',
    'years',
    'journal',
    'gene',
    'hormone',
    'record',
    'oxygen-tank',
    'heart-glow',
    'spleen-squeeze',
    'surface',
    'stop',
  ],
  // The scale's number, the blob of fat lifting off, the doctors, dietitians and trainers, the red
  // cross over them, their signs (energy, heat, muscle), one pointing at the toilet, the blob
  // breaking into atoms, the belly's fat cells, the oil in one, its carbon, hydrogen and oxygen, a
  // breath in, the lungs lifting a barbell, the chain snapping apart, oxygen joining each piece,
  // the water, the gas, a glass of soda, the blood, the lungs, the breath out, a drop of sweat,
  // the toilet, burger-shaped puffs, the scientists, the four blocks on the balance, the beam
  // level, panting, dizzy stars, the dinner plate in the cloud.
  body: [
    'readout',
    'fat-blob',
    'doctors',
    'dietitians',
    'trainers',
    'asked',
    'wrong',
    'energy',
    'heat',
    'muscle',
    'toilet',
    'atoms',
    'cells',
    'oil',
    'carbon',
    'hydrogen',
    'oxygen',
    'inhale',
    'barbell',
    'apart',
    'joins',
    'water',
    'gas',
    'soda',
    'blood',
    'lungs-in',
    'exhale',
    'sweat',
    'pee',
    'burgers',
    'scientists',
    'fat-block',
    'oxygen-block',
    'gas-block',
    'water-block',
    'level',
    'panting',
    'dizzy',
    'plate',
  ],
} as const;
type JourneyStopName = (typeof JOURNEY_STOPS)[keyof typeof JOURNEY_STOPS][number];
type JourneyThingName = (typeof JOURNEY_THINGS)[keyof typeof JOURNEY_THINGS][number];
const JOURNEY_ALL_STOPS = [
  ...new Set([
    ...JOURNEY_STOPS.orbit,
    ...JOURNEY_STOPS.water,
    ...JOURNEY_STOPS.sunset,
    ...JOURNEY_STOPS.dive,
    ...JOURNEY_STOPS.body,
  ]),
] as unknown as readonly [JourneyStopName, ...JourneyStopName[]];
const JOURNEY_ALL_THINGS = [
  ...new Set([
    ...JOURNEY_THINGS.orbit,
    ...JOURNEY_THINGS.water,
    ...JOURNEY_THINGS.sunset,
    ...JOURNEY_THINGS.dive,
    ...JOURNEY_THINGS.body,
  ]),
] as unknown as readonly [JourneyThingName, ...JourneyThingName[]];
export const JOURNEY_ANCHORS = [
  'you',
  'phone',
  'satellite',
  'clock',
  'earth',
  'none',
  'drop',
  'atom',
  'screen',
  'sun',
  'sea',
  'gap',
  'straw',
  'bottom',
  'counter',
  'spleen',
  'boats',
  'gene',
  'tank',
  'lungs',
  'cloud',
  'sweat',
  'left-pan',
  'right-pan',
  'beam',
] as const;

export const graphicSchema = z.discriminatedUnion('kind', [
  /** Follow the money: boxes top to bottom, arrows between them with coins flowing. */
  z
    .object({
      kind: z.literal('flow'),
      title: titleSchema.optional(),
      nodes: z.array(z.object({ label, on }).strict()).min(2).max(4),
      /** The arrow from each box to the next: a label beside it (" / " breaks a line), and one on the other side. */
      links: z
        .array(
          z
            .object({
              label: z.string().min(1).max(40).optional(),
              aside: z.string().min(1).max(40).optional(),
              on,
            })
            .strict(),
        )
        .max(3)
        .default([]),
    })
    .strict()
    .refine((g) => g.links.length <= g.nodes.length - 1, {
      message: 'a flow has at most one arrow between each two boxes',
    }),
  /** Where the money goes: one bar split into shares, filled share by share. */
  z
    .object({
      kind: z.literal('split'),
      title: titleSchema.optional(),
      parts: z
        .array(
          z
            .object({
              label,
              value: z.string().min(1).max(10),
              share: z.number().positive().max(1),
              on,
            })
            .strict(),
        )
        .min(2)
        .max(5),
    })
    .strict()
    .refine((g) => Math.abs(g.parts.reduce((a, p) => a + p.share, 0) - 1) < 0.02, {
      message: 'the shares of a split add up to the whole (1)',
    }),
  /** A comparison: bars growing, their numbers counting up; `stress` is the bar in red. */
  z
    .object({
      kind: z.literal('bars'),
      title: titleSchema.optional(),
      bars: z
        .array(
          z
            .object({
              label,
              value: z.number().nonnegative(),
              text: z.string().min(1).max(10).optional(),
              on,
            })
            .strict(),
        )
        .min(2)
        .max(5),
      stress: z.number().int().min(0).max(4).optional(),
    })
    .strict(),
  /** A price tag dropping in and swinging; `was`, an old price, crossed out on `wasOn`. */
  z
    .object({
      kind: z.literal('tag'),
      title: titleSchema.optional(),
      price: z.string().min(1).max(14),
      note: z.string().min(1).max(18).optional(),
      was: z.string().min(1).max(8).optional(),
      on,
      wasOn: on,
    })
    .strict(),
  /** A receipt printing line by line, the total in red. */
  z
    .object({
      kind: z.literal('receipt'),
      title: titleSchema.optional(),
      lines: z
        .array(z.object({ label, value: z.string().min(1).max(10), on }).strict())
        .min(1)
        .max(6),
      total: z
        .object({ label, value: z.string().min(1).max(10), on })
        .strict()
        .optional(),
    })
    .strict(),
  /** One big number, counting up if asked, with a few words under it. */
  z
    .object({
      kind: z.literal('number'),
      title: titleSchema.optional(),
      value: z.string().min(1).max(10),
      caption: z.string().min(1).max(28).optional(),
      /** A picture of what the number counts, above it, so the page is never a bare number. */
      picture: z.enum(['ticket', 'coin', 'bucket']).optional(),
      countUp: z.boolean().default(false),
      on,
    })
    .strict(),
  /** Faceless people walking into a queue at a counter, its price on a sign. */
  z
    .object({
      kind: z.literal('queue'),
      title: titleSchema.optional(),
      people: z.number().int().min(1).max(6),
      sign: z.string().min(1).max(14).optional(),
      on,
    })
    .strict(),
  /**
   * An illustrated place, its things arriving one by one. Only the things listed in `show`
   * are drawn (with none listed, all of them, from the start); the place itself always is.
   */
  z
    .object({
      kind: z.literal('scene'),
      name: z.enum(GRAPHIC_SCENES),
      title: titleSchema.optional(),
      /** The sign of the place: its top line and its price. */
      signLabel: z.string().min(1).max(14).optional(),
      sign: z.string().min(1).max(8).optional(),
      /** What the hand holds out. */
      note: z.string().min(1).max(6).optional(),
      show: z.array(z.object({ item: z.enum(SCENE_ITEMS), on }).strict()).default([]),
    })
    .strict()
    .refine(
      (g) => g.show.every((s) => (SCENE_THINGS[g.name] as readonly string[]).includes(s.item)),
      { message: 'a scene shows only its own things (SCENE_THINGS)' },
    ),
  /**
   * A journey through one drawn world: the camera flies from `from` (the last shot's stop) to
   * `at` without a cut, over the shot's start or the whole shot, and things arrive on their
   * words. `keep` lists things already there from earlier shots. A callout puts a number and a
   * few words in the picture, pointing at a thing, without leaving the world.
   */
  z
    .object({
      kind: z.literal('journey'),
      world: z.enum(JOURNEY_WORLDS),
      title: titleSchema.optional(),
      from: z.enum(JOURNEY_ALL_STOPS).optional(),
      at: z.enum(JOURNEY_ALL_STOPS),
      fly: z.enum(['start', 'whole']).default('start'),
      keep: z.array(z.enum(JOURNEY_ALL_THINGS)).default([]),
      /**
       * `cam` moves the camera on to another stop of the world on the thing's word, so one shot
       * can go close on one thing after another (the body world only, for now).
       */
      show: z
        .array(
          z
            .object({
              item: z.enum(JOURNEY_ALL_THINGS),
              on,
              cam: z.enum(JOURNEY_ALL_STOPS).optional(),
            })
            .strict(),
        )
        .default([]),
      callout: z
        .object({
          value: z.string().min(1).max(10),
          caption: z.string().min(1).max(40).optional(),
          at: z.enum(JOURNEY_ANCHORS).default('none'),
          on,
        })
        .strict()
        .optional(),
    })
    .strict()
    .refine(
      (g) =>
        [g.at, ...(g.from ? [g.from] : [])].every((s) =>
          (JOURNEY_STOPS[g.world] as readonly string[]).includes(s),
        ) &&
        [...g.keep, ...g.show.map((x) => x.item)].every((t) =>
          (JOURNEY_THINGS[g.world] as readonly string[]).includes(t),
        ) &&
        g.show.every(
          (x) =>
            !x.cam ||
            (g.world === 'body' && (JOURNEY_STOPS.body as readonly string[]).includes(x.cam)),
        ),
      { message: "a journey stops only at its own world's stops and shows only its own things" },
    ),
]);
export type Graphic = z.infer<typeof graphicSchema>;
export type JourneyStop = (typeof JOURNEY_ALL_STOPS)[number];
export type JourneyThing = (typeof JOURNEY_ALL_THINGS)[number];
export const GRAPHIC_KINDS = [
  'flow',
  'split',
  'bars',
  'tag',
  'receipt',
  'number',
  'queue',
  'scene',
  'journey',
] as const;

/** The pieces of a graphic that arrive one at a time, in order, each with the word it comes in on. */
export function graphicSteps(g: Graphic): (string | undefined)[] {
  switch (g.kind) {
    case 'flow': {
      const out: (string | undefined)[] = [];
      g.nodes.forEach((n, i) => {
        out.push(n.on);
        if (i < g.nodes.length - 1) out.push(g.links[i]?.on);
      });
      return out;
    }
    case 'split':
      return g.parts.map((p) => p.on);
    case 'bars':
      return g.bars.map((b) => b.on);
    case 'tag':
      return [g.on, ...(g.was ? [g.wasOn] : [])];
    case 'receipt':
      return [...g.lines.map((l) => l.on), ...(g.total ? [g.total.on] : [])];
    case 'number':
    case 'queue':
      return [g.on];
    case 'scene':
      return g.show.map((s) => s.on);
    case 'journey':
      return [...g.show.map((s) => s.on), ...(g.callout ? [g.callout.on] : [])];
  }
}

const bareWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The frame of a shot each piece of a graphic arrives on: the moment its word is spoken (found
 * among the line's timed words, in order, from where the shot starts). A piece with no word, or
 * whose word is not found, arrives a little after the one before it; with no words at all, the
 * pieces are spread through the first three quarters of the shot. The first piece never waits
 * for its word: it comes in as the shot begins, so no picture opens on an empty page (Biku,
 * 2026-10-16); the rest stand as pale outlines until theirs.
 */
export function stepFrames(
  steps: readonly (string | undefined)[],
  words: readonly { text: string; startMs: number }[],
  startFrame: number,
  duration: number,
  fps: number,
  /** False for a journey: its world is on screen from the first frame, so its things wait for their words. */
  firstAtOnce = true,
): number[] {
  const timed = words
    .map((w) => ({
      word: bareWord(w.text),
      frame: Math.round((w.startMs / 1000) * fps) - startFrame,
    }))
    .filter((w) => w.frame >= -3 && w.frame < duration);
  let from = 0;
  let last = -1;
  const out: number[] = [];
  const spread = (i: number) => Math.round(4 + (i * duration * 0.75) / Math.max(1, steps.length));
  steps.forEach((on, i) => {
    const want = on ? bareWord(on) : '';
    const matches = (w: { word: string }) => w.word === want || w.word.startsWith(want);
    const hit = want ? timed.findIndex((w, k) => k >= from && matches(w)) : -1;
    // A word said before the piece ahead of it (a callout on "hundred" after a drop of sweat on
    // "sweat") is still its word: found anywhere in the shot, without moving the search on.
    const early = want && hit < 0 ? timed.findIndex(matches) : -1;
    let frame: number;
    if (hit >= 0) {
      frame = Math.max(0, timed[hit]?.frame ?? 0);
      from = hit + 1;
    } else if (early >= 0) {
      frame = Math.max(0, timed[early]?.frame ?? 0);
    } else if (timed.length === 0 || last < 0) {
      frame = last < 0 && !on ? spread(i) : Math.max(spread(i), last + 8);
    } else {
      frame = last + 8;
    }
    out.push(frame);
    last = frame;
  });
  if (firstAtOnce && out.length > 0) out[0] = Math.min(out[0] ?? 0, FIRST_PIECE_BY);
  return out;
}

/** The frame of a shot by which its graphic's first piece is in. */
export const FIRST_PIECE_BY = 4;
