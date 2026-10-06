import path from 'node:path';
import {
  checkPlan,
  checkStoryboard,
  describeShot,
  draftStoryboard,
  plainWords,
  scriptMismatch,
  shotSeconds,
  splitIntoShots,
  storyboardPage,
  storyboardSchema,
} from '@studio/shared';
import type { Shot, Storyboard } from '@studio/shared';
import { describe, expect, it } from 'vitest';
import { loadScript } from './script-stage';
import { projectRoot } from './system';
import { loadStoryboard, loadWorld } from './world';

/**
 * The shot planner (Phase 4C): a script is laid out as shots of 2 to 4 seconds, the staging
 * rules catch pictures that do not work, and the sample story's full plan passes.
 */

const world = loadWorld();
const dir = path.join(projectRoot, 'runs', '2026-10-06-honest-farmer');
const script = loadScript(dir);
const plan = (edit: (sb: Storyboard) => void = () => {}): Storyboard => {
  const sb = structuredClone(loadStoryboard(path.join(dir, 'storyboard.json')));
  edit(sb);
  return sb;
};
const shotOf = (sb: Storyboard, id: string): Shot => {
  const found = sb.scenes.flatMap((s) => s.shots).find((s) => s.id === id);
  if (!found) throw new Error(`no shot ${id}`);
  return found;
};
const problems = (sb: Storyboard) => checkPlan(sb, world).problems.join('\n');
const notes = (sb: Storyboard) => checkPlan(sb, world).notes.join('\n');

describe('cutting words into shots', () => {
  const opts = { minS: 2, maxS: 4, pauseS: 0.45 };

  it('keeps a short line as one shot', () => {
    expect(splitIntoShots('Nobody saw him. And nobody would ever know.', opts)).toEqual([
      'Nobody saw him. And nobody would ever know.',
    ]);
    expect(splitIntoShots('*I* would have known.', opts)).toHaveLength(1);
  });

  it('cuts a long line at its commas and full stops, into shots of 2 to 4 seconds', () => {
    const line =
      'His name was Tomas. He worked his field from morning until night, and his family still went hungry.';
    const shots = splitIntoShots(line, opts);
    expect(shots.length).toBeGreaterThan(1);
    expect(shots.join(' ')).toBe(line);
    for (const s of shots.slice(0, -1)) expect(/[.,!?]$/.test(s)).toBe(true);
    for (const s of shots) {
      const seconds = (s.split(' ').length * 60) / 195;
      expect(seconds).toBeLessThanOrEqual(4.05);
    }
  });

  it('never cuts inside words marked for emphasis', () => {
    const line =
      'one two three four five six seven *eight nine ten eleven twelve thirteen* fourteen fifteen sixteen';
    const shots = splitIntoShots(line, opts);
    expect(shots.join(' ')).toBe(line);
    for (const s of shots) expect((s.match(/\*/g) ?? []).length % 2).toBe(0);
  });

  it('counts the pause after the line as part of the last shot', () => {
    const line = 'one two three four five six seven eight nine ten eleven twelve';
    expect(splitIntoShots(line, { minS: 2, maxS: 4, pauseS: 0 })).toHaveLength(1);
    expect(splitIntoShots(line, { minS: 2, maxS: 4, pauseS: 1.5 }).length).toBeGreaterThan(1);
  });

  it('gives nothing for no words', () => {
    expect(splitIntoShots('  ', opts)).toEqual([]);
  });
});

describe('the draft', () => {
  const draft = () => storyboardSchema.parse(draftStoryboard(script, world, 7));

  it('is a storyboard that speaks the script word for word, in the same parts', () => {
    const sb = draft();
    expect(scriptMismatch(sb, script)).toEqual([]);
    expect(sb.cast.map((m) => m.id)).toEqual(script.speakers.map((p) => p.id));
    expect(Math.max(...sb.scenes.map((s) => s.chapter))).toBe(2);
    expect(sb.seed).toBe(7);
  });

  it('cuts every line into shots no longer than the format allows', () => {
    const sb = draft();
    const format = world.formats[sb.format];
    for (const scene of sb.scenes) {
      for (const [, seconds] of shotSeconds(scene, format)) {
        expect(seconds).toBeLessThanOrEqual((format?.shotLength.max ?? 4) + 0.6);
      }
    }
  });

  it('puts the title on the first shot and each speaker on screen for their own line', () => {
    const sb = draft();
    const shots = sb.scenes.flatMap((s) => s.shots);
    expect(shots[0]?.overlay).toEqual({ kind: 'title', text: 'The Honest Farmer' });
    expect(shots.filter((s) => s.overlay).length).toBe(1);
    for (const scene of sb.scenes) {
      for (const line of scene.lines.filter((l) => l.speaker !== 'narrator')) {
        for (const shot of scene.shots.filter((s) => s.line === line.id)) {
          expect(shot.actors.map((a) => a.character)).toEqual([line.speaker]);
        }
      }
    }
  });

  it('marks every decision "todo", and the checks refuse it until they are made', () => {
    const sb = draft();
    expect(sb.scenes.every((s) => s.place === 'todo' && s.palette === 'todo')).toBe(true);
    const names = checkStoryboard(sb, world).problems.join('\n');
    expect(names).toContain('no place called "todo"');
    expect(names).toContain('no expression called "todo"');
    expect(problems(sb)).toContain('shows nobody and nothing');
  });

  it('is the same every time for the same script', () => {
    expect(draftStoryboard(script, world, 7)).toEqual(draftStoryboard(script, world, 7));
  });
});

describe('the sample plan', () => {
  it('passes every check and speaks the script word for word', () => {
    const sb = plan();
    expect(checkStoryboard(sb, world).problems).toEqual([]);
    expect(checkPlan(sb, world).problems).toEqual([]);
    expect(scriptMismatch(sb, script)).toEqual([]);
  });

  it('has shots of 2 to 4 seconds, in two parts under a minute, with everything in the library', () => {
    const sb = plan();
    const report = checkStoryboard(sb, world);
    expect(report.chapters).toHaveLength(2);
    for (const c of report.chapters) expect(c.seconds).toBeLessThan(55);
    const format = world.formats[sb.format];
    for (const scene of sb.scenes) {
      for (const [, seconds] of shotSeconds(scene, format)) {
        expect(seconds).toBeGreaterThan(1.5);
        expect(seconds).toBeLessThanOrEqual(4.6);
      }
    }
    const have = new Set(world.library.assets.map((a) => a.id));
    expect(report.needs.filter((id) => !have.has(id))).toEqual([]);
  });

  it('gives every person in every shot a face, and every speaker a voice', () => {
    const sb = plan();
    for (const shot of sb.scenes.flatMap((s) => s.shots)) {
      for (const actor of shot.actors) expect(actor.expression).not.toBe('todo');
    }
    for (const id of ['tomas', 'wife', 'queen']) {
      expect(sb.cast.find((m) => m.id === id)?.voice).toBeTruthy();
    }
  });
});

describe('staging rules', () => {
  it('refuses a shot that shows nobody and nothing', () => {
    const sb = plan((s) => {
      shotOf(s, 's2b').actors = [];
      shotOf(s, 's2b').effects = [];
    });
    expect(problems(sb)).toContain('shot "s2b" shows nobody and nothing');
  });

  it('accepts a shot of a thing alone, or of a title alone', () => {
    const thing = plan((s) => {
      const shot = shotOf(s, 's2d');
      shot.actors = [];
      shot.effects = [];
    });
    expect(problems(thing)).toBe('');
  });

  it('wants to know where each of two people stands, and not on the same spot', () => {
    const unplaced = plan((s) => {
      delete shotOf(s, 's4b').actors[1]?.x;
    });
    expect(problems(unplaced)).toContain('say where each one stands');
    const same = plan((s) => {
      const wife = shotOf(s, 's4b').actors[1];
      if (wife) wife.x = 0.33;
    });
    expect(problems(same)).toContain('stand on the same spot');
  });

  it('refuses someone who looks at a person while facing away from them', () => {
    const sb = plan((s) => {
      const wife = shotOf(s, 's4b').actors[1];
      if (wife) wife.facing = 'right';
    });
    expect(problems(sb)).toContain('"wife" looks at "tomas" but faces away');
  });

  it('wants a speaker’s face in at least one shot of their line', () => {
    const gone = plan((s) => {
      shotOf(s, 's6c').actors = [
        {
          character: 'queen',
          pose: 'sit',
          expression: 'thinking',
          facing: 'left',
          headTurn: 'three-quarter',
          lookAt: 'ahead',
          back: false,
          then: [],
          x: 0.7,
        },
      ];
      shotOf(s, 's6c').camera = { framing: 'close-up', move: 'none', strength: 0.2 };
    });
    expect(problems(gone)).toContain(
      '"tomas" speaks line "d4" but their face is in none of its shots',
    );
    const behind = plan((s) => {
      const tomas = shotOf(s, 's6c').actors[0];
      if (tomas) tomas.back = true;
    });
    expect(problems(behind)).toContain('nobody is seen talking');
  });

  it('wants exactly one back in an over-the-shoulder shot', () => {
    const sb = plan((s) => {
      const tomas = shotOf(s, 's6b').actors[0];
      if (tomas) tomas.back = false;
    });
    expect(problems(sb)).toContain('over the shoulder: exactly one person is seen from behind');
  });

  it('keeps the title to the start of part 1, once', () => {
    const late = plan((s) => {
      shotOf(s, 's5a').overlay = { kind: 'title', text: 'The Honest Farmer' };
    });
    const found = problems(late);
    expect(found).toContain('shows the title in part 2');
    expect(found).toContain('shown 2 times');
  });

  it('refuses a shot that stays too long', () => {
    const sb = plan((s) => {
      const scene = s.scenes[0];
      if (!scene) throw new Error('no scene');
      scene.shots = [
        {
          ...shotOf(s, 's1a'),
          words: 'A poor farmer found *100* gold coins on an empty road.',
        },
        { ...shotOf(s, 's1b'), line: 'n2' },
      ];
      const line = scene.lines[0];
      if (line) line.pauseAfterMs = 3000;
    });
    expect(problems(sb)).toContain('shot "s1a" would stay on screen about');
  });
});

describe('things worth a second look', () => {
  it('points out the same picture twice in a row', () => {
    const sb = plan((s) => {
      const a = shotOf(s, 's3a');
      const b = shotOf(s, 's3b');
      b.camera = { ...a.camera };
      b.actors = structuredClone(a.actors);
    });
    expect(notes(sb)).toContain('shot "s3b" is the same picture as "s3a"');
  });

  it('points out four shots of the same size in a row', () => {
    const sb = plan((s) => {
      for (const id of ['s2a', 's2b', 's2c', 's2d']) shotOf(s, id).camera.framing = 'medium';
    });
    expect(notes(sb)).toContain('four medium shots in a row');
  });

  it('points out music that does not suit the beat, and a change of light on a plain cut', () => {
    const mood = plan((s) => {
      const scene = s.scenes[0];
      if (scene) scene.mood = 'triumph';
    });
    expect(notes(mood)).toContain('scene "s1" plays triumph music; the "hook" beat usually takes');
    const light = plan((s) => {
      shotOf(s, 's4a').transition = 'cut';
    });
    expect(notes(light)).toContain(
      'changes the light from clear-day to warm-interior on a plain cut',
    );
  });

  it('points out too few or too many sound effects', () => {
    const none = plan((s) => {
      for (const shot of s.scenes.flatMap((sc) => sc.shots)) shot.sfx = [];
    });
    expect(notes(none)).toContain('about 0 sound effects a minute');
    const lots = plan((s) => {
      for (const shot of s.scenes.flatMap((sc) => sc.shots)) {
        shot.sfx = [{ name: 'pop', at: 'start', gainDb: 0 }];
      }
    });
    expect(notes(lots)).toContain('sound effects a minute; the story format suits 6 to 14');
  });

  it('points out a shot too quick to take in', () => {
    const sb = plan((s) => {
      shotOf(s, 's2e').words = 'Inside was more money';
      shotOf(s, 's2f').words = 'than he had seen in his whole life.';
    });
    expect(notes(sb)).toContain('shot "s2e" would be on screen only about 1.2 s');
  });

  it('points out what a closer shot cuts off, and a bag that would drag on the floor', () => {
    const ground = plan((s) => {
      shotOf(s, 's2d').camera.framing = 'medium';
    });
    expect(notes(ground)).toContain(
      'looks at the bag standing on the ground, which a medium shot cuts off',
    );
    const hand = plan((s) => {
      const shot = shotOf(s, 's2e');
      shot.camera.framing = 'close-up';
    });
    expect(notes(hand)).toContain('looks at the coin in their hand, which a close-up cuts off');
    const low = plan((s) => {
      const tomas = shotOf(s, 's4a').actors[0];
      if (tomas) tomas.holds = 'bag';
    });
    expect(notes(low)).toContain('is down low holding the bag, which hangs to the floor');
    // The same holds for what a step brings about, and it is said only once.
    const later = plan((s) => {
      const tomas = shotOf(s, 's1b').actors[0];
      if (tomas) {
        tomas.then = [
          { at: 0.4, pose: 'kneel' },
          { at: 0.7, expression: 'sad' },
        ];
      }
    });
    expect(notes(later).split('is down low holding the bag')).toHaveLength(2);
  });

  it('points out a change of pose that a close-up would hide', () => {
    const close = plan((s) => {
      shotOf(s, 's4d').camera.framing = 'close-up';
    });
    expect(notes(close)).toContain('changes pose inside a close-up, which shows only the face');
    // A change of face alone is what a close-up is for.
    const face = plan((s) => {
      const tomas = shotOf(s, 's2b').actors[0];
      if (tomas) tomas.then = [{ at: 0.5, expression: 'afraid' }];
    });
    expect(notes(face)).not.toContain('changes pose inside a close-up');
  });

  it('checks the names in a step against the library', () => {
    const sb = plan((s) => {
      const tomas = shotOf(s, 's2d').actors[0];
      if (tomas) tomas.then = [{ at: 0.5, pose: 'moonwalk', expression: 'baffled' }];
    });
    const found = checkStoryboard(sb, world).problems.join('\n');
    expect(found).toContain('the library has no pose called "moonwalk"');
    expect(found).toContain('the library has no expression called "baffled"');
  });

  it('has nothing to point out in the sample plan', () => {
    expect(checkPlan(plan(), world).notes).toEqual([]);
  });
});

describe('agreeing with the script', () => {
  it('notices a changed word, a changed speaker and a line in another part', () => {
    const sb = plan((s) => {
      const scene = s.scenes[0];
      const line = scene?.lines[0];
      const shot = scene?.shots[0];
      if (!line || !shot) throw new Error('no line');
      line.text = line.text.replace('poor farmer', 'tired farmer');
      shot.words = shot.words.replace('poor farmer', 'tired farmer');
    });
    expect(scriptMismatch(sb, script).join('\n')).toContain(
      'line "n1" does not have the script\'s words',
    );
    const speaker = plan((s) => {
      const line = s.scenes[3]?.lines[1];
      if (line) line.speaker = 'narrator';
    });
    expect(scriptMismatch(speaker, script).join('\n')).toContain('spoken by "wife" in the script');
    const part = plan((s) => {
      for (const scene of s.scenes) scene.chapter = 1;
    });
    expect(scriptMismatch(part, script).join('\n')).toContain(
      'is in part 2 of the script and part 1',
    );
  });
});

describe('the shot list Biku reads', () => {
  const sb = plan();

  it('says each shot in a plain sentence', () => {
    expect(describeShot(shotOf(sb, 's1a'), sb, world)).toBe(
      'Wide shot. Tomas stands, surprised, looking at the bag, then kneels. In the scene: bag. The camera moves slowly closer. Title: "The Honest Farmer".',
    );
    // Every change inside a shot is said in order, in plain words.
    expect(describeShot(shotOf(sb, 's2d'), sb, world)).toContain(
      'Tomas walks, neutral, then stands and looks surprised and looks at the bag.',
    );
    expect(describeShot(shotOf(sb, 's2e'), sb, world)).toContain('then holds the coin');
    expect(describeShot(shotOf(sb, 's6b'), sb, world)).toContain(
      'Tomas stands, neutral, looking at the queen, seen from behind',
    );
    expect(describeShot(shotOf(sb, 's2b'), sb, world)).toBe('Close-up. Tomas looks down, sad.');
    expect(describeShot(shotOf(sb, 's4a'), sb, world).startsWith('Fade in. Wide shot.')).toBe(true);
  });

  it('lists every shot under its part and scene, with the words and the sound', () => {
    const page = storyboardPage(sb, world);
    expect(page).toContain('# The Honest Farmer: shot list');
    expect(page).toContain('30 shots in 9 scenes');
    expect(page).toContain('## Part 1 (about 0:');
    expect(page).toContain('## Part 2 (about 0:');
    expect(page).toContain('Place: throne room, warm interior colors. Music: tense.');
    expect(page.split('\n').filter((l) => /^\| s\d/.test(l))).toHaveLength(30);
    expect(page).toContain('| His wife | Keep the gold! The queen is rich. |');
    expect(page).toContain("**queen's**");
    expect(page).not.toContain('—');
    const words = page
      .split('\n')
      .filter((l) => /^\| s\d/.test(l))
      .map((l) => (l.split('|')[4] ?? '').replace(/\*\*/g, '*').trim())
      .join(' ');
    expect(plainWords(words)).toBe(plainWords(script.lines.map((l) => l.text).join(' ')));
  });
});
