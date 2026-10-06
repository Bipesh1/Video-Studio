import { describe, expect, it } from 'vitest';
import {
  EXPRESSIONS,
  EXPRESSION_BLEND_FRAMES,
  GUIDE_EMOTIONS,
  blendFace,
  faceAt,
} from './expressions';
import { EYE_W, eyeSlots } from './layout';
import { MOUTH_FORMS, MOUTH_SHAPES, mouthShapeAt, shapesOfWord, talkAt } from './talk';
import { tokens } from '../tokens';

describe('expressions', () => {
  it('include every emotion in the Style 3.6 table', () => {
    for (const e of GUIDE_EMOTIONS) expect(EXPRESSIONS[e]).toBeDefined();
  });

  it('are all different from each other', () => {
    const seen = new Set(Object.values(EXPRESSIONS).map((f) => JSON.stringify(f)));
    expect(seen.size).toBe(Object.keys(EXPRESSIONS).length);
  });

  it('follow the guide table', () => {
    const n = EXPRESSIONS.neutral;
    // Angry: sharp V, inner ends low, half-closed eyes, small pupils.
    expect(EXPRESSIONS.angry.browLeft.tilt).toBeGreaterThan(15);
    expect(EXPRESSIONS.angry.eyes.upperLid).toBeGreaterThan(0.3);
    expect(EXPRESSIONS.angry.eyes.pupil).toBeLessThan(n.eyes.pupil);
    // Sad: inner ends raised, pupils low, mouth curves down.
    expect(EXPRESSIONS.sad.browLeft.tilt).toBeLessThan(0);
    expect(EXPRESSIONS.sad.eyes.lookY).toBeGreaterThan(0);
    expect(EXPRESSIONS.sad.mouth.curve).toBeLessThan(0);
    // Happy: arched brows, upward mouth.
    expect(EXPRESSIONS.happy.browLeft.arch).toBeGreaterThan(n.browLeft.arch);
    expect(EXPRESSIONS.happy.mouth.curve).toBeGreaterThan(0);
    // Afraid: raised wavy brows, wide eyes, small pupils, gritted teeth.
    expect(EXPRESSIONS.afraid.browLeft.raise).toBeGreaterThan(n.browLeft.raise);
    expect(EXPRESSIONS.afraid.browLeft.wave).toBeGreaterThan(0);
    expect(EXPRESSIONS.afraid.eyes.pupil).toBeLessThan(0.7);
    expect(EXPRESSIONS.afraid.eyes.scale).toBeGreaterThan(1);
    expect(EXPRESSIONS.afraid.mouth.teeth).toBe('gritted');
    // Surprised: high arcs, very wide eyes, small round O.
    expect(EXPRESSIONS.surprised.eyes.scale).toBeGreaterThan(1);
    expect(EXPRESSIONS.surprised.mouth.round).toBe(1);
    // Thinking and smug: one brow raised.
    expect(EXPRESSIONS.thinking.browRight.raise).toBeGreaterThan(
      EXPRESSIONS.thinking.browLeft.raise,
    );
    expect(EXPRESSIONS.smug.browRight.raise).toBeGreaterThan(EXPRESSIONS.smug.browLeft.raise);
    // Exhausted: heavy lids, slack open mouth.
    expect(EXPRESSIONS.exhausted.eyes.upperLid).toBeGreaterThan(0.5);
    expect(EXPRESSIONS.exhausted.mouth.open).toBeGreaterThan(0);
  });

  it('include the wailing and horrified faces Biku asked for', () => {
    const w = EXPRESSIONS.wailing;
    expect(w.eyes.squeeze).toBe(true);
    expect(w.eyes.strain).toBe(true);
    expect(w.mouth.tongue).toBeGreaterThan(0);
    expect(w.mouth.teeth).toBe('top');
    const h = EXPRESSIONS.horrified;
    expect(h.eyes.scale).toBeGreaterThan(1.1);
    expect(h.eyes.pupil).toBeLessThan(0.5);
    expect(h.browLeft.raise).toBeGreaterThan(EXPRESSIONS.neutral.browLeft.raise);
  });

  it('carry the reference details Biku asked for at Checkpoint 1 (L-0001)', () => {
    const a = EXPRESSIONS.angry;
    expect(a.browLeft.curl).toBeGreaterThan(0);
    expect(a.mouth.corners).toBeGreaterThan(0.5);
    const f = EXPRESSIONS.afraid;
    expect(f.mouth.teeth).toBe('gritted');
    expect(f.eyes.bags).toBe(true);
    expect(f.eyes.worry).toBe(true);
    expect(f.mouth.chin).toBe(true);
    expect(tokens.face.eyeWidthPctOfHead).toBeGreaterThanOrEqual(0.28);
  });

  it('draw the frightened face as measured on Reference B (L-0006)', () => {
    const f = EXPRESSIONS.afraid;
    // The face tips down toward where the character looks: the eye on that side sits lower.
    expect(f.frame?.tilt).toBeGreaterThan(5);
    // The shading is on the lower lids, pushed up, and the upper lids stay open.
    expect(f.eyes.lowerShaded).toBe(true);
    expect(f.eyes.lowerLid).toBeGreaterThan(0.2);
    expect(f.eyes.upperLid).toBe(0);
    // Worried brows: inner ends raised, lighter than the token weight, sagging in the middle.
    expect(f.browLeft.tilt).toBeLessThan(-15);
    expect(f.browLeft.weight).toBeLessThan(0.7);
    expect(f.browLeft.arch).toBeLessThan(0);
    // The grimace is wide enough to fill the lower head.
    expect(f.mouth.width).toBeGreaterThan(0.4);
    // Only the wince shades the lower lid; a happy squint stays a cheek.
    expect(EXPRESSIONS.happy.eyes.lowerShaded).toBe(false);
  });

  it('blend smoothly between endpoints', () => {
    expect(blendFace(EXPRESSIONS.neutral, EXPRESSIONS.angry, 0)).toEqual(EXPRESSIONS.neutral);
    expect(blendFace(EXPRESSIONS.neutral, EXPRESSIONS.angry, 1)).toEqual(EXPRESSIONS.angry);
    const mid = blendFace(EXPRESSIONS.neutral, EXPRESSIONS.angry, 0.5);
    expect(mid.browLeft.tilt).toBeGreaterThan(EXPRESSIONS.neutral.browLeft.tilt);
    expect(mid.browLeft.tilt).toBeLessThan(EXPRESSIONS.angry.browLeft.tilt);
  });

  it('change over 3 to 4 frames and never pop', () => {
    expect(EXPRESSION_BLEND_FRAMES).toBeGreaterThanOrEqual(3);
    expect(EXPRESSION_BLEND_FRAMES).toBeLessThanOrEqual(4);
    const keys = [
      { frame: 0, expression: 'neutral' as const },
      { frame: 10, expression: 'angry' as const },
    ];
    expect(faceAt(10, keys)).toEqual(EXPRESSIONS.neutral);
    const between = faceAt(12, keys);
    expect(between).not.toEqual(EXPRESSIONS.neutral);
    expect(between).not.toEqual(EXPRESSIONS.angry);
    expect(faceAt(10 + EXPRESSION_BLEND_FRAMES, keys)).toEqual(EXPRESSIONS.angry);
  });
});

describe('talking mouth', () => {
  const fps = 30;
  const words = [
    { startMs: 500, endMs: 900 },
    { startMs: 1200, endMs: 1700 },
  ];

  it('uses the five mouth shapes named in tokens', () => {
    expect([...MOUTH_SHAPES].sort()).toEqual(['closed', 'half', 'open', 'round', 'wide']);
    expect(Object.keys(MOUTH_FORMS).sort()).toEqual([...tokens.motion.mouthShapes].sort());
  });

  it('reads the shapes of a word from its spelling', () => {
    expect(shapesOfWord('moon')).toEqual(['closed', 'round', 'half']);
    expect(shapesOfWord('me')).toEqual(['closed', 'wide']);
    expect(shapesOfWord('Pay,')).toEqual(['closed', 'open', 'wide']);
    // A silent e at the end is not spoken, but the e of "the" is.
    expect(shapesOfWord('gave')).toEqual(['half', 'open', 'half']);
    expect(shapesOfWord('the')).toEqual(['half', 'wide']);
    expect(shapesOfWord('phone')).toEqual(['half', 'round', 'half']);
    expect(shapesOfWord('1969')).toEqual([]);
  });

  it('forms the word: lips together on m, round on oo', () => {
    const moon = [{ startMs: 1000, endMs: 1500, text: 'moon' }];
    expect(mouthShapeAt(30, fps, moon)).toBe('closed');
    const during: string[] = [];
    for (let f = 30; f < 45; f++) during.push(mouthShapeAt(f, fps, moon));
    expect(during).toContain('round');
    expect(during).not.toContain('open');
    expect(talkAt(36, fps, moon)).toMatchObject(MOUTH_FORMS.round);
  });

  it('knows when the line is being spoken, lips together or not', () => {
    const line = [
      { startMs: 1000, endMs: 1300, text: 'Keep' },
      { startMs: 1300, endMs: 1400, text: 'the' },
      { startMs: 1400, endMs: 1900, text: 'gold!' },
    ];
    // Before and after the line the mouth is the expression's own.
    expect(talkAt(20, fps, line).speaking).toBeUndefined();
    expect(talkAt(70, fps, line).speaking).toBeUndefined();
    const during = Array.from({ length: 26 }, (_, i) => talkAt(31 + i, fps, line));
    expect(during.every((form) => form.speaking === true)).toBe(true);
    // And inside the line the lips do meet and part.
    const openings = new Set(during.map((form) => form.open));
    expect(openings.size).toBeGreaterThan(1);
  });

  it('holds every shape for at least two frames', () => {
    const word = [{ startMs: 0, endMs: 600, text: 'moonlight' }];
    const shapes = Array.from({ length: 18 }, (_, f) => mouthShapeAt(f, fps, word));
    let run = 1;
    for (let f = 1; f < shapes.length; f++) {
      if (shapes[f] === shapes[f - 1]) run++;
      else {
        expect(run).toBeGreaterThanOrEqual(2);
        run = 1;
      }
    }
    expect(new Set(shapes).size).toBeGreaterThanOrEqual(4);
  });

  it('keeps the vowel of a word too short for all its shapes', () => {
    const quick = [{ startMs: 0, endMs: 90, text: 'the' }];
    expect(mouthShapeAt(0, fps, quick)).toBe('wide');
    expect(mouthShapeAt(2, fps, quick)).toBe('wide');
  });

  it('stays a little open in the short gaps inside a phrase', () => {
    const phrase = [
      { startMs: 0, endMs: 300, text: 'pay' },
      { startMs: 380, endMs: 700, text: 'me' },
      { startMs: 1400, endMs: 1700, text: 'now' },
    ];
    expect(mouthShapeAt(10, fps, phrase)).toBe('half');
    expect(mouthShapeAt(30, fps, phrase)).toBe('closed');
    expect(mouthShapeAt(60, fps, phrase)).toBe('closed');
  });

  it('moves only the speaking character: words from other lines leave the mouth closed', () => {
    const track = [
      { startMs: 0, endMs: 1000, lineId: 'n1' },
      { startMs: 1500, endMs: 2200, lineId: 'd1' },
    ];
    const toms = track.filter((w) => w.lineId === 'd1');
    for (let f = 0; f < 30; f++) expect(mouthShapeAt(f, fps, toms)).toBe('closed');
    const during = new Set<string>();
    for (let f = 46; f < 66; f++) during.add(mouthShapeAt(f, fps, toms));
    expect(during.size).toBeGreaterThan(1);
  });

  it('stays closed between words and moves during words', () => {
    expect(mouthShapeAt(0, fps, words)).toBe('closed');
    expect(mouthShapeAt(31, fps, words)).toBe('closed');
    for (const w of words) {
      const shapes = new Set<string>();
      for (let f = Math.ceil((w.startMs / 1000) * fps); f < (w.endMs / 1000) * fps; f++) {
        shapes.add(mouthShapeAt(f, fps, words));
      }
      expect(shapes.has('open')).toBe(true);
      expect(shapes.has('half')).toBe(true);
    }
  });
});

describe('eyes as the head turns', () => {
  const half = (slot: { widthFactor: number }) => (EYE_W * slot.widthFactor) / 2;

  it('never puts one eye on top of the other, at any turn (Biku, 2026-10-06)', () => {
    for (let turn = 0; turn <= 1.0001; turn += 0.0125) {
      const [near, far] = eyeSlots(turn);
      if (!near || !far) continue;
      // The eyes may just overlap, as in the references, but never by more than a sliver.
      const overlap = near.x + half(near) - (far.x - half(far));
      expect(overlap).toBeLessThan(EYE_W * 0.08);
      expect(far.x).toBeGreaterThan(near.x + half(near) * 0.9);
    }
  });

  it('keeps the front and three-quarter views where they have always been', () => {
    const [frontNear, frontFar] = eyeSlots(0);
    expect(frontNear?.x).toBeCloseTo(-(frontFar?.x ?? 0), 9);
    expect(frontNear?.widthFactor).toBe(1);
    expect(frontFar?.widthFactor).toBe(1);
    const [near, far] = eyeSlots(0.5);
    expect(near?.x).toBeCloseTo(0.015, 9);
    expect(far?.x).toBeCloseTo(0.285, 9);
    expect(near?.widthFactor).toBe(1);
    expect(far?.widthFactor).toBeCloseTo(0.8, 9);
  });

  it('shows one eye from three quarters of the way to profile, at the front of the face', () => {
    expect(eyeSlots(0.6)).toHaveLength(2);
    expect(eyeSlots(0.75)).toHaveLength(1);
    const profile = eyeSlots(1);
    expect(profile).toHaveLength(1);
    expect(profile[0]?.side).toBe(-1);
    expect(profile[0]?.x).toBeCloseTo(0.25, 9);
    expect(profile[0]?.widthFactor).toBeCloseTo(0.8, 9);
  });

  it('moves the eyes smoothly: no jump from one step of a turn to the next', () => {
    let last = eyeSlots(0)[0]?.x ?? 0;
    for (let turn = 0.0125; turn <= 1.0001; turn += 0.0125) {
      const x = eyeSlots(turn)[0]?.x ?? 0;
      expect(Math.abs(x - last)).toBeLessThan(0.01);
      last = x;
    }
  });
});
