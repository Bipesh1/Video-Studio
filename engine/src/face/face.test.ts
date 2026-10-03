import { describe, expect, it } from 'vitest';
import {
  EXPRESSIONS,
  EXPRESSION_BLEND_FRAMES,
  GUIDE_EMOTIONS,
  blendFace,
  faceAt,
} from './expressions';
import { MOUTH_SHAPES, mouthShapeAt } from './talk';
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
    // Afraid: raised wavy brows, wide eyes, tiny pupils, gritted teeth.
    expect(EXPRESSIONS.afraid.browLeft.raise).toBeGreaterThan(n.browLeft.raise);
    expect(EXPRESSIONS.afraid.browLeft.wave).toBeGreaterThan(0);
    expect(EXPRESSIONS.afraid.eyes.pupil).toBeLessThan(0.6);
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

  it('uses the three mouth shapes named in tokens', () => {
    expect([...MOUTH_SHAPES].sort()).toEqual(['closed', 'half', 'open']);
    expect(tokens.motion.mouthShapes).toHaveLength(3);
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
