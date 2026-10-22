import { describe, expect, it } from 'vitest';
import { packagingSchema } from './packaging.schema';

const good = {
  version: 1,
  title: 'Could Humans Evolve to Hold Their Breath Like Seals?',
  question: 'Could a human body ever change enough to stay underwater as long as a seal?',
  promise: 'You will know the diving trick hidden in your own body.',
  answer: 'Slowly, yes: one sea-going people already has a bigger built-in oxygen tank.',
  thumbnail: {
    subject: 'You under the bathwater beside a seal',
    words: 'HOLD YOUR BREATH LIKE A SEAL?',
  },
  firstTenSeconds: 'You under the bathwater, a counter ticking, the question asked over it.',
  whyClick: 'Everyone has held their breath in a bath, and the answer is a surprise.',
  kind: 'what-if',
};

// The package comes first (knowledge/playbooks/explainers.md, 2026-10-21).
describe('the package of a video', () => {
  it('takes a title, a promise, an answer and a thumbnail that adds to the title', () => {
    expect(packagingSchema.safeParse(good).success).toBe(true);
  });
  it('refuses a thumbnail with more than six words', () => {
    const many = {
      ...good,
      thumbnail: { ...good.thumbnail, words: 'ONE TWO THREE FOUR FIVE SIX SEVEN' },
    };
    expect(packagingSchema.safeParse(many).success).toBe(false);
  });
  it('refuses thumbnail words that only repeat the title', () => {
    const same = { ...good, thumbnail: { ...good.thumbnail, words: 'Like Seals?' } };
    expect(packagingSchema.safeParse(same).success).toBe(false);
  });
  it('refuses a package with no reason a stranger would click', () => {
    const rest: Record<string, unknown> = { ...good };
    delete rest.whyClick;
    expect(packagingSchema.safeParse(rest).success).toBe(false);
  });
});
