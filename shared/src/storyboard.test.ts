import { describe, expect, it } from 'vitest';
import fixture from './fixtures/moon-tax.storyboard.json';
import { estimateSeconds, plainWords, storyboardSchema } from './storyboard.schema';
import type { Storyboard } from './storyboard.schema';

type Raw = typeof fixture;
/** A fresh copy of the worked example, changed by one edit. */
const edited = (edit: (sb: Raw) => void): Raw => {
  const copy = structuredClone(fixture) as Raw;
  edit(copy);
  return copy;
};
const issues = (input: unknown): string =>
  JSON.stringify(storyboardSchema.safeParse(input).error?.issues ?? []);
const scene = (sb: Raw, i: number) => sb.scenes[i] as Raw['scenes'][number];
const shot = (sb: Raw, s: number, i: number) =>
  scene(sb, s).shots[i] as Raw['scenes'][number]['shots'][number];

describe('storyboard', () => {
  it('accepts the worked example and fills in the defaults', () => {
    const sb: Storyboard = storyboardSchema.parse(fixture);
    const first = sb.scenes[0]?.shots[0];
    expect(first?.transition).toBe('cut');
    expect(first?.actors[0]?.headTurn).toBe('three-quarter');
    expect(first?.actors[0]?.lookAt).toBe('ahead');
    expect(first?.props).toEqual([]);
    expect(sb.scenes[0]?.shots[1]?.camera.strength).toBe(0.2);
  });

  it('refuses a shot whose words are not the words of its line', () => {
    const bad = edited((sb) => {
      shot(sb, 0, 1).words = 'declared that the moon was his.';
    });
    expect(issues(bad)).toContain('do not add up to its words');
  });

  it('refuses a line no shot shows, and a shot on a line of another scene', () => {
    const noShot = edited((sb) => {
      scene(sb, 4).lines.push({
        id: 'n5b',
        speaker: 'narrator',
        text: 'Nobody paid again.',
        pauseAfterMs: 400,
      });
    });
    expect(issues(noShot)).toContain('has no shot');
    const wrongScene = edited((sb) => {
      shot(sb, 1, 0).line = 'n1';
    });
    expect(issues(wrongScene)).toContain('is not in scene');
  });

  it('refuses people who are not in the cast, on screen or speaking', () => {
    const actor = edited((sb) => {
      (shot(sb, 0, 0).actors[0] as { character: string }).character = 'queen';
    });
    expect(issues(actor)).toContain('not in the cast');
    const speaker = edited((sb) => {
      (scene(sb, 2).lines[1] as { speaker: string }).speaker = 'guard';
    });
    expect(issues(speaker)).toContain('who is not in the cast');
  });

  it('refuses an actor with both a pose and an action, or with neither', () => {
    const both = edited((sb) => {
      Object.assign(shot(sb, 0, 0).actors[0] as object, { action: 'walk' });
    });
    expect(issues(both)).toContain('a pose or an action');
    const neither = edited((sb) => {
      delete (shot(sb, 0, 0).actors[0] as { pose?: string }).pose;
    });
    expect(issues(neither)).toContain('a pose or an action');
  });

  it('refuses an actor with no expression', () => {
    const bad = edited((sb) => {
      delete (shot(sb, 0, 0).actors[0] as { expression?: string }).expression;
    });
    expect(storyboardSchema.safeParse(bad).success).toBe(false);
  });

  it('refuses a look at someone who is not there, and an effect on someone who is not there', () => {
    const look = edited((sb) => {
      Object.assign(shot(sb, 0, 1).actors[0] as object, { lookAt: 'mira' });
    });
    expect(issues(look)).toContain('which is not in the shot');
    const effect = edited((sb) => {
      Object.assign(shot(sb, 0, 0), { effects: [{ effect: 'sweat-resting', on: 'mira' }] });
    });
    expect(issues(effect)).toContain('who is not in the shot');
  });

  it('lets an actor look at a prop in the shot or in a hand', () => {
    const sb = storyboardSchema.parse(fixture);
    const held = sb.scenes[1]?.shots[1]?.actors[0];
    expect(held?.lookAt).toBe('coin');
    const placed = edited((s) => {
      Object.assign(shot(s, 0, 1), { props: [{ prop: 'throne', x: 0.8 }] });
      Object.assign(shot(s, 0, 1).actors[0] as object, { lookAt: 'throne' });
    });
    expect(storyboardSchema.safeParse(placed).success).toBe(true);
  });

  it('refuses an over-the-shoulder shot of one person', () => {
    const bad = edited((sb) => {
      shot(sb, 0, 1).camera.framing = 'over-shoulder';
    });
    expect(issues(bad)).toContain('needs two people');
  });

  it('refuses ids used twice', () => {
    const shots = edited((sb) => {
      shot(sb, 1, 0).id = 's1a';
    });
    expect(issues(shots)).toContain('shot \\"s1a\\" is used twice');
    const cast = edited((sb) => {
      sb.cast.push({ id: 'king', name: 'Another king' } as Raw['cast'][number]);
    });
    expect(issues(cast)).toContain('cast member');
  });

  it('refuses a cast member with both a saved card and a look, and one called narrator', () => {
    const both = edited((sb) => {
      Object.assign(sb.cast[0] as object, { card: 'sample-queen' });
    });
    expect(issues(both)).toContain('not both');
    const narrator = edited((sb) => {
      (sb.cast[2] as { id: string }).id = 'narrator';
    });
    expect(storyboardSchema.safeParse(narrator).success).toBe(false);
  });

  it('keeps chapters in order with no gap', () => {
    const ok = edited((sb) => {
      scene(sb, 4).chapter = 2;
      scene(sb, 5).chapter = 2;
    });
    expect(storyboardSchema.safeParse(ok).success).toBe(true);
    const skip = edited((sb) => {
      scene(sb, 5).chapter = 3;
    });
    expect(issues(skip)).toContain('skips a chapter');
    const back = edited((sb) => {
      scene(sb, 2).chapter = 2;
    });
    expect(issues(back)).toContain('goes back to an earlier chapter');
    const start = edited((sb) => {
      for (const s of sb.scenes) s.chapter = 2;
    });
    expect(issues(start)).toContain('must be in chapter 1');
  });

  it('refuses an em dash in a title or a label', () => {
    const title = edited((sb) => {
      sb.title = 'The King — and the Moon';
    });
    expect(storyboardSchema.safeParse(title).success).toBe(false);
    const label = edited((sb) => {
      Object.assign(shot(sb, 1, 0), { overlay: { kind: 'label', text: 'Later — that night' } });
    });
    expect(storyboardSchema.safeParse(label).success).toBe(false);
  });

  it('wants shot times on every shot or none, in order', () => {
    const some = edited((sb) => {
      Object.assign(shot(sb, 0, 0), { startMs: 300, endMs: 2100 });
    });
    expect(issues(some)).toContain('some shots have times');
    const half = edited((sb) => {
      Object.assign(shot(sb, 0, 0), { startMs: 300 });
    });
    expect(issues(half)).toContain('both a start and an end');
    const all = edited((sb) => {
      let t = 0;
      for (const s of sb.scenes) {
        for (const sh of s.shots) {
          Object.assign(sh, { startMs: t, endMs: t + 2500 });
          t += 2500;
        }
      }
    });
    expect(storyboardSchema.safeParse(all).success).toBe(true);
    const overlap = edited((sb) => {
      let t = 0;
      for (const s of sb.scenes) {
        for (const sh of s.shots) {
          Object.assign(sh, { startMs: t, endMs: t + 3000 });
          t += 2500;
        }
      }
    });
    expect(issues(overlap)).toContain('starts before shot');
  });

  it('refuses a mode, a sound effect or a lesson id it does not know', () => {
    expect(storyboardSchema.safeParse({ ...fixture, mode: 'rewrite' }).success).toBe(false);
    const sound = edited((sb) => {
      Object.assign(shot(sb, 0, 0), { sfx: [{ name: 'explosion' }] });
    });
    expect(storyboardSchema.safeParse(sound).success).toBe(false);
    expect(storyboardSchema.safeParse({ ...fixture, appliedLessons: ['lesson 7'] }).success).toBe(
      false,
    );
  });
});

describe('words and lengths', () => {
  it('compares words without emphasis marks or extra spaces', () => {
    expect(plainWords('the  *moon*   belonged')).toBe('the moon belonged');
  });

  it('estimates spoken length from the word count', () => {
    expect(estimateSeconds('one two three four five', 150)).toBeCloseTo(2, 5);
    expect(estimateSeconds('')).toBe(0);
  });
});
