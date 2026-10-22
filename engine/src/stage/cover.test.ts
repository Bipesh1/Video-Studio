import { describe, expect, it } from 'vitest';
import { allWords } from './Cover';

describe('the cover title', () => {
  it('keeps every word of a long title, in no more lines than it is given', () => {
    const title = 'How to Make Sure You Never Get Asked Out';
    const lines = allWords(title, 11, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
    expect(lines.join(' ')).toBe(title);
  });
});
