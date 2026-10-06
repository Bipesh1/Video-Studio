import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { white } from '../tokens';
import { EXPRESSIONS } from './expressions';
import type { ExpressionName } from './expressions';
import { Face } from './Face';
import { MOUTH_FORMS } from './talk';
import type { MouthForm } from './talk';

/**
 * A speaking face moves its mouth whatever its expression (Biku, 2026-10-06: "when the wife
 * says keep the gold the mouth doesn't move"). A face whose own mouth is open, like shouting,
 * used to stay frozen open through its whole line.
 */

const draw = (expression: ExpressionName, talk: MouthForm): string =>
  renderToStaticMarkup(
    <svg>
      <Face
        params={EXPRESSIONS[expression]}
        turn={0.5}
        blink={0}
        look={{ x: 0, y: 0 }}
        eyeStyle="round"
        skin={white}
        lidColor={white}
        talk={talk}
        idPrefix="t"
      />
    </svg>,
  );

const speaking = (form: MouthForm): MouthForm => ({ ...form, speaking: true });
const OPEN_FACES: ExpressionName[] = ['shouting', 'laughing', 'wailing', 'surprised', 'exhausted'];

describe('a speaking face', () => {
  it.each(OPEN_FACES)('moves the open mouth of a %s face with the words', (name) => {
    const shut = draw(name, speaking(MOUTH_FORMS.closed));
    const half = draw(name, speaking(MOUTH_FORMS.half));
    const full = draw(name, speaking(MOUTH_FORMS.open));
    expect(shut).not.toBe(half);
    expect(half).not.toBe(full);
    expect(shut).not.toBe(full);
  });

  it.each(OPEN_FACES)('leaves a silent %s face with its own mouth', (name) => {
    const silent = draw(name, MOUTH_FORMS.closed);
    // Fully open while speaking is the expression's own mouth: nothing is added to it.
    expect(draw(name, speaking(MOUTH_FORMS.open))).toBe(silent);
  });

  it('still opens the closed mouth of a calm face, as before', () => {
    for (const name of ['neutral', 'determined', 'sad'] as const) {
      const closed = draw(name, speaking(MOUTH_FORMS.closed));
      expect(draw(name, MOUTH_FORMS.closed)).toBe(closed);
      expect(draw(name, speaking(MOUTH_FORMS.open))).not.toBe(closed);
      expect(draw(name, speaking(MOUTH_FORMS.round))).not.toBe(closed);
    }
  });
});

describe('a sleeping face', () => {
  it('has both eyes closed, as the one soft line a blink passes through', () => {
    const asleep = draw('asleep', MOUTH_FORMS.closed);
    const awake = draw('neutral', MOUTH_FORMS.closed);
    // No whites of the eyes and no pupils: nothing is clipped to an eye shape.
    expect(awake).toContain('<clipPath');
    expect(asleep).not.toContain('<clipPath');
    expect(EXPRESSIONS.asleep.eyes.upperLid).toBe(1);
  });
});
