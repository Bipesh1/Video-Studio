import path from 'node:path';
import { CHAPTER_MAX_S, MUSIC_MOODS, checkStoryboard, storyboardSchema } from '@studio/shared';
import type { Storyboard, World } from '@studio/shared';
import { describe, expect, it } from 'vitest';
import fixture from '../../shared/src/fixtures/moon-tax.storyboard.json';
import { projectRoot } from './system';
import { loadStoryboard, loadWorld, worldProblems } from './world';

/**
 * The real plug-in files and the real library, checked together (Phase 4A): the six formats,
 * the brand, the voices and the saved characters load, agree with each other, and the worked
 * example storyboard asks for nothing that does not exist.
 */

const world = loadWorld();
const example = (edit: (sb: Storyboard) => void = () => {}): Storyboard => {
  const sb = storyboardSchema.parse(structuredClone(fixture));
  edit(sb);
  return sb;
};
const problems = (sb: Storyboard, w: World = world) => checkStoryboard(sb, w).problems.join('\n');

describe('the plug-in files', () => {
  it('has the six starter formats of the plan, and the niches of his own', () => {
    expect(Object.keys(world.formats).sort()).toEqual([
      'black-history',
      'dilemma',
      'dilemma-comedy',
      'dilemma-explainer',
      'dilemma-story',
      'dilemma-thriller',
      'explainer',
      'fine-print',
      'news-short',
      'promo',
      'quote',
      'story',
      'top-list',
    ]);
  });

  it('gives every format a hook, the 2 to 4 second shot of the plan, and real moods', () => {
    for (const f of Object.values(world.formats)) {
      expect(f.hookRules.join(' ')).toContain('first 3 seconds');
      expect(f.shotLength.min).toBe(2);
      // An explainer graphic is held while it builds piece by piece (The Fine Print), and a
      // journey's camera travels through one world (The Fine Print, the Black history page), so
      // their shots may run longer; a shot of people changes within about four seconds.
      const travels = f.id === 'fine-print' || f.id === 'black-history';
      expect(f.shotLength.max).toBeLessThanOrEqual(travels ? 7 : 5);
      for (const beat of f.structure) {
        for (const mood of beat.moods) expect(MUSIC_MOODS).toContain(mood);
      }
    }
  });

  it('lets the long formats reach three minutes, the length Biku wants', () => {
    for (const id of ['story', 'explainer', 'top-list']) {
      expect(world.formats[id]?.lengthRange.max).toBe(180);
    }
  });

  it('asks the factual formats for sources and not the others', () => {
    const factual = Object.values(world.formats)
      .filter((f) => f.factRules.sourcesRequired)
      .map((f) => f.id)
      .sort();
    expect(factual).toEqual([
      'black-history',
      'dilemma',
      'dilemma-comedy',
      'dilemma-explainer',
      'dilemma-story',
      'dilemma-thriller',
      'explainer',
      'fine-print',
      'news-short',
      'quote',
      'top-list',
    ]);
  });

  it('has a brand whose defaults and colors exist, and voices for it', () => {
    expect(worldProblems(world)).toEqual([]);
    const brand = Object.values(world.brands)[0];
    expect(brand).toBeDefined();
    expect(world.voices[brand?.defaults.voice ?? '']).toBeDefined();
    expect(world.voices.narrator).toBeDefined();
  });

  it('notices a brand that points at something missing', () => {
    const broken = structuredClone(world);
    const brand = Object.values(broken.brands)[0];
    if (!brand) throw new Error('no brand');
    brand.defaults.format = 'documentary';
    brand.colors.label = 'pink';
    const found = worldProblems(broken).join('\n');
    expect(found).toContain('no format called "documentary"');
    expect(found).toContain('"pink", which is not a style color');
  });
});

describe('the worked example storyboard', () => {
  it('loads from its file and asks for nothing that is missing', () => {
    const sb = loadStoryboard(
      path.join(projectRoot, 'shared', 'src', 'fixtures', 'moon-tax.storyboard.json'),
    );
    const report = checkStoryboard(sb, world);
    expect(report.problems).toEqual([]);
    expect(report.chapters).toHaveLength(1);
    expect(report.chapters[0]?.measured).toBe(false);
    expect(report.seconds).toBeGreaterThan(20);
    expect(report.seconds).toBeLessThan(CHAPTER_MAX_S);
    expect(report.needs).toContain('costume/ruler');
    expect(report.needs).toContain('place/castle');
    expect(report.needs).toContain('sfx/ding');
    expect(report.needs).toContain('music/tense');
    expect(report.needs).toContain('overlay/title-card');
  });
});

describe('what the check catches', () => {
  it('names a pose, place, prop, effect or costume the library does not have', () => {
    const sb = example((s) => {
      const shot = s.scenes[0]?.shots[0];
      const actor = shot?.actors[0];
      if (!shot || !actor) throw new Error('no shot');
      actor.pose = 'salute';
      actor.holds = 'trident';
      shot.effects = [{ effect: 'lightning', on: 'king' }];
      const first = s.scenes[0];
      if (first) first.place = 'harbor';
      const king = s.cast[0];
      if (king) king.look = { outfit: { costume: 'pirate' } };
    });
    const found = problems(sb);
    expect(found).toContain('no pose called "salute"');
    expect(found).toContain('no prop called "trident"');
    expect(found).toContain('no effect called "lightning"');
    expect(found).toContain('no place called "harbor"');
    expect(found).toContain('no costume called "pirate"');
    expect(found).toContain('npm run library -- search');
  });

  it('names a format, brand, voice or saved character that does not exist', () => {
    const sb = example((s) => {
      s.format = 'documentary';
      s.brand = 'other-page';
      s.voice = 'deep-slow';
      const villager = s.cast[2];
      if (villager) villager.card = 'old-sailor';
    });
    const found = problems(sb);
    expect(found).toContain('no format called "documentary"');
    expect(found).toContain('no brand called "other-page"');
    expect(found).toContain('no voice called "deep-slow"');
    expect(found).toContain('no saved character "old-sailor"');
  });

  it('accepts a saved character from a card', () => {
    const sb = example((s) => {
      const king = s.cast[0];
      if (!king) throw new Error('no king');
      delete king.look;
      king.card = 'sample-queen';
    });
    const report = checkStoryboard(sb, world);
    expect(report.problems).toEqual([]);
    expect(report.needs).toContain('costume/queen');
  });

  it('has the game theory cast saved: three who speak, and you, who never does', () => {
    const all = Object.values(world.characters).filter((c) => c.series === 'game-theory');
    // The Trainer runs the games: in the cast, with a voice of his own, and not a player.
    expect(all.filter((c) => c.host).map((c) => c.id)).toEqual(['trainer']);
    expect(world.voices[world.characters.trainer?.voice ?? '']).toBeDefined();
    const cast = all.filter((c) => !c.host);
    expect(cast.map((c) => c.id).sort()).toEqual(['cheat', 'copycat', 'saint', 'you']);
    expect(cast.filter((c) => !c.voice).map((c) => c.id)).toEqual(['you']);
    // Each has the seven faces and the seven poses Biku asked for.
    for (const c of cast) {
      expect(c.expressions, c.id).toEqual(
        expect.arrayContaining([
          'neutral',
          'happy',
          'suspicious',
          'surprised',
          'sad',
          'smug',
          'thinking',
        ]),
      );
      expect(c.poses, c.id).toEqual([
        'stand',
        'sit',
        'point',
        'cross-arms',
        'hands-up',
        'sit-reach',
        'walk',
      ]);
    }
  });

  /** The moon tax example with its first two people on screen played by two of a fixed cast. */
  const withCast = (first: string, second: string, edit: (sb: Storyboard) => void = () => {}) =>
    example((s) => {
      s.series = 'game-theory';
      const seen = new Set(
        s.scenes.flatMap((sc) => sc.shots.flatMap((sh) => sh.actors)).map((a) => a.character),
      );
      const [a, b] = s.cast.filter((m) => seen.has(m.id));
      if (!a || !b) throw new Error('the example needs two people on screen');
      for (const [member, card] of [
        [a, first],
        [b, second],
      ] as const) {
        delete member.look;
        delete member.voice;
        member.card = card;
      }
      edit(s);
    });

  it('holds a game theory video to at least two of its fixed cast', () => {
    const none = example((s) => {
      s.series = 'game-theory';
    });
    expect(problems(none)).toContain('shows at least two of its cast');
    // You are in the cast but do not count: the three who speak do.
    expect(problems(withCast('cheat', 'you'))).toContain('this one shows cheat');
    // Neither does the Trainer, who runs the game: he is not one of its two players.
    expect(problems(withCast('cheat', 'trainer'))).toContain('this one shows cheat');
    expect(checkStoryboard(withCast('cheat', 'saint'), world).problems).toEqual([]);
    const unknown = example((s) => {
      s.series = 'cooking';
    });
    expect(problems(unknown)).toContain('no cast called "cooking"');
  });

  it('does not let a video give one of a fixed cast another voice', () => {
    const sb = withCast('cheat', 'copycat', (s) => {
      const cheat = s.cast.find((m) => m.card === 'cheat');
      if (cheat) cheat.voice = 'narrator';
    });
    expect(problems(sb)).toContain('keeps its own voice ("cheat")');
  });

  it('wants a voice for anyone who speaks', () => {
    const sb = example((s) => {
      const mira = s.cast[1];
      if (mira) delete mira.voice;
    });
    expect(problems(sb)).toContain('speaks but has no voice');
  });

  it('keeps the scenes to the beats of the format, in order, with none missing', () => {
    const unknown = example((s) => {
      const scene = s.scenes[1];
      if (scene) scene.beat = 'flashback';
    });
    expect(problems(unknown)).toContain('has no beat called "flashback"');
    const order = example((s) => {
      const scene = s.scenes[3];
      if (scene) scene.beat = 'hook';
    });
    expect(problems(order)).toContain('comes after a later beat');
    expect(problems(order)).toContain('no scene plays the "turning-point" beat');
  });

  // What's the Catch?, Biku 2026-10-21: "don't always follow a rigid structure".
  it('lets a free-order format take its middle beats in any order, the hook first and the payoff last', () => {
    const w = structuredClone(world);
    const story = w.formats.story;
    if (!story) throw new Error('no story format');
    story.freeOrder = true;
    const beats = story.structure.map((b) => b.id);
    const first = beats[0] ?? '';
    for (const b of story.structure.slice(1, -1)) b.optional = true;
    const swapped = example((s) => {
      const a = s.scenes[1];
      const b = s.scenes[2];
      if (a && b && beats.length > 3) [a.beat, b.beat] = [beats[2] ?? a.beat, beats[1] ?? b.beat];
    });
    expect(problems(swapped, w)).not.toContain('comes after a later beat');
    const late = example((s) => {
      const scene = s.scenes[0];
      if (scene) scene.beat = beats[1] ?? scene.beat;
    });
    expect(problems(late, w)).toContain(`it must open on "${first}"`);
  });

  it('wants sources for a factual format', () => {
    const w = structuredClone(world);
    const story = w.formats.story;
    if (!story) throw new Error('no story format');
    story.factRules = { sourcesRequired: true, rules: ['Every fact comes from a saved source.'] };
    expect(problems(example(), w)).toContain('lists none');
    const sourced = example((s) => {
      s.sources = ['A folktale written for this video; nothing in it is a fact.'];
    });
    expect(problems(sourced, w)).toBe('');
  });

  it('refuses an em dash in a line, except in a script used as it is', () => {
    const edit = (s: Storyboard) => {
      const line = s.scenes[4]?.lines[0];
      const shot = s.scenes[4]?.shots[0];
      if (!line || !shot) throw new Error('no line');
      line.text = 'So the tax ended — at last.';
      shot.words = 'So the tax ended — at last.';
    };
    expect(problems(example(edit))).toContain('has an em dash');
    const asIs = example((s) => {
      edit(s);
      s.mode = 'as-is';
    });
    const report = checkStoryboard(asIs, world);
    expect(report.problems).toEqual([]);
    expect(report.notes.join('\n')).toContain('the captions show a comma there');
  });

  it('measures chapters from the shot times once the voice has set them', () => {
    const timed = (shotMs: number) =>
      example((s) => {
        let t = 0;
        for (const scene of s.scenes) {
          for (const shot of scene.shots) {
            shot.startMs = t;
            shot.endMs = t + shotMs;
            t += shotMs;
          }
        }
      });
    const fine = checkStoryboard(timed(3000), world);
    expect(fine.problems).toEqual([]);
    expect(fine.chapters[0]).toMatchObject({ measured: true, seconds: 39 });
    const slow = problems(timed(5200));
    expect(slow).toContain('stays on screen 5.2 s');
    expect(slow).toContain('chapter 1 runs 67.6 s; a chapter is at most 60 s');
  });

  it('splits the length by chapter', () => {
    const sb = example((s) => {
      for (const scene of s.scenes.slice(3)) scene.chapter = 2;
    });
    const report = checkStoryboard(sb, world);
    expect(report.chapters.map((c) => c.chapter)).toEqual([1, 2]);
    expect(report.chapters[0]?.scenes).toEqual(['s1', 's2', 's3']);
    expect((report.chapters[0]?.seconds ?? 0) + (report.chapters[1]?.seconds ?? 0)).toBeCloseTo(
      report.seconds,
      0,
    );
  });

  it('refuses a video too short or too long for its format', () => {
    const w = structuredClone(world);
    const story = w.formats.story;
    if (!story) throw new Error('no story format');
    story.lengthRange = { min: 90, max: 180 };
    expect(problems(example(), w)).toContain('needs at least 90 s');
    story.lengthRange = { min: 5, max: 15 };
    story.shotLength = { min: 2, max: 4 };
    expect(problems(example(), w)).toContain('allows up to 15 s');
  });

  it('says so when a cast member is never seen or heard', () => {
    const sb = example((s) => {
      s.cast.push({ id: 'guard', name: 'A guard nobody sees' });
    });
    expect(checkStoryboard(sb, world).notes.join('\n')).toContain('"guard" is never seen or heard');
  });
});
