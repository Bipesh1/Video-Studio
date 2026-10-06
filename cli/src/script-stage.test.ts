import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  CHAPTER_MAX_S,
  assignChapters,
  checkScript,
  lineSeconds,
  originalWords,
  scriptSchema,
  spokenWords,
} from '@studio/shared';
import type { Script } from '@studio/shared';
import { afterAll, describe, expect, it } from 'vitest';
import {
  checkRunScript,
  findMasterPrompt,
  loadOriginal,
  loadScript,
  newRun,
  scriptPage,
  splitRunIntoChapters,
} from './script-stage';
import { projectRoot } from './system';
import { loadWorld } from './world';

/**
 * The script stage (Phase 4B): the three modes keep their promises, a long script is split
 * into parts of at most a minute, and the two sample runs (the same script refined, and used
 * as it is) pass.
 */

const world = loadWorld();
const refineDir = path.join(projectRoot, 'runs', '2026-10-06-honest-farmer');
const asIsDir = path.join(projectRoot, 'runs', '2026-10-06-honest-farmer-as-is');
const original = loadOriginal(refineDir) as string;
const refined = () => structuredClone(loadScript(refineDir));
const asIs = () => structuredClone(loadScript(asIsDir));
const problems = (script: Script, text: string | null = original) =>
  checkScript(script, world, text ?? undefined).problems.join('\n');

const scratch = path.join(projectRoot, '.cache', `script-test-${process.pid}`);
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

describe('the sample runs', () => {
  it('pass their checks', () => {
    expect(checkRunScript(refineDir, world, projectRoot).problems).toEqual([]);
    expect(checkRunScript(asIsDir, world, projectRoot).problems).toEqual([]);
  });

  it('are split into parts of under a minute, the refined one shorter', () => {
    const a = checkRunScript(refineDir, world, projectRoot);
    const b = checkRunScript(asIsDir, world, projectRoot);
    expect(a.chapters).toHaveLength(2);
    expect(b.chapters).toHaveLength(3);
    for (const c of [...a.chapters, ...b.chapters]) expect(c.seconds).toBeLessThan(CHAPTER_MAX_S);
    expect(a.words).toBeLessThan(b.words);
    expect(b.words).toBe(originalWords(original).length);
  });
});

describe('as-is mode', () => {
  it('accepts the script only word for word', () => {
    expect(problems(asIs())).toBe('');
    const changed = asIs();
    const line = changed.lines[3];
    if (!line) throw new Error('no line');
    line.text = line.text.replace('so much money', 'that much money');
    const found = problems(changed);
    expect(found).toContain('not word for word what Biku wrote');
    expect(found).toContain('so much money');
    expect(found).toContain('that much money');
  });

  it('notices a word left off the end, a fixed slip, and a changed comma', () => {
    const cut = asIs();
    cut.lines.pop();
    expect(problems(cut)).toContain('not word for word');
    const comma = asIs();
    const first = comma.lines[0];
    if (!first) throw new Error('no line');
    first.text = first.text.replace('Hello everyone,', 'Hello everyone');
    expect(problems(comma)).toContain('not word for word');
  });

  it('lets a caption emphasis be added, since it changes no word', () => {
    const marked = asIs();
    const line = marked.lines[2];
    if (!line) throw new Error('no line');
    line.text = line.text.replace('100 gold coins', '*100* gold coins');
    expect(problems(marked)).toBe('');
  });

  it('does not judge Biku for a greeting or a long sentence, and lists no changes', () => {
    const report = checkScript(asIs(), world, original);
    expect(report.problems).toEqual([]);
    expect(report.notes.join('\n')).not.toContain('sentence of');
    const listed = asIs();
    listed.changes = ['Fixed a slip in the second line.'];
    expect(problems(listed)).toContain('changes nothing');
  });

  it('needs the original, and only notes a length the format does not like', () => {
    expect(problems(asIs(), null)).toContain('script-original.md');
    const w = structuredClone(world);
    const story = w.formats.story;
    if (!story) throw new Error('no story format');
    story.lengthRange = { min: 10, max: 60 };
    const report = checkScript(asIs(), w, original);
    expect(report.problems).toEqual([]);
    expect(report.notes.join('\n')).toContain('as-is mode keeps every word');
  });

  it('takes a name before a colon as the speaker, not as a word', () => {
    const text =
      '# Title\n\nNarrator: A farmer found a bag.\n\n**TOMAS:** It is not mine.\nNote: this stays.';
    expect(originalWords(text, ['tomas'])).toEqual(
      'A farmer found a bag. It is not mine. Note: this stays.'.split(' '),
    );
    expect(spokenWords('the  *moon*\n_belonged_')).toEqual(['the', 'moon', 'belonged']);
  });
});

describe('refine mode', () => {
  it('keeps every number and invents none', () => {
    const lost = refined();
    const line = lost.lines.find((l) => l.text.includes('For 3 days'));
    if (!line) throw new Error('no line');
    line.text = 'For days, Tomas could not sleep.';
    expect(problems(lost)).toContain('the number 3 from the original is missing');
    const invented = refined();
    const pay = invented.lines.find((l) => l.text.includes('10 gold coins'));
    if (!pay) throw new Error('no line');
    pay.text = 'And she gave him 50 gold coins every month, for the rest of his life.';
    const found = problems(invented);
    expect(found).toContain('the number 50 is not in the original');
    expect(found).toContain('the number 10 from the original is missing');
  });

  it('wants every change listed, and something to have changed', () => {
    const silent = refined();
    silent.changes = [];
    expect(problems(silent)).toContain('no change is listed');
    const same = asIs();
    same.mode = 'refine';
    expect(problems(same)).toContain('nothing was refined');
    expect(problems(refined(), null)).toContain('script-original.md');
  });

  it('refuses a greeting as the opening and an em dash', () => {
    const greeting = refined();
    const first = greeting.lines[0];
    if (!first) throw new Error('no line');
    first.text = 'Hello everyone, a poor farmer found 100 gold coins on an empty road.';
    expect(problems(greeting)).toContain('opens with a greeting');
    const dash = refined();
    const line = dash.lines[1];
    if (!line) throw new Error('no line');
    line.text = 'Nobody saw him — and nobody would ever know.';
    expect(problems(dash)).toContain('has an em dash');
  });

  it('points out a sentence too long to say in one breath', () => {
    const long = refined();
    const line = long.lines[2];
    if (!line) throw new Error('no line');
    line.text =
      'His name was Tomas and he worked his field from morning until night every single day of the year and his family still went hungry through the winter.';
    const report = checkScript(long, world, original);
    expect(report.notes.join('\n')).toContain('one idea per sentence');
  });
});

describe('original mode', () => {
  const written = () => {
    const s = refined();
    s.mode = 'original';
    s.changes = [];
    return s;
  };

  it('needs no original and no sources for a story', () => {
    expect(problems(written(), null)).toBe('');
  });

  it('needs sources for a factual format', () => {
    const w = structuredClone(world);
    const story = w.formats.story;
    if (!story) throw new Error('no story format');
    story.factRules = { sourcesRequired: true, rules: ['Every fact comes from a saved source.'] };
    expect(checkScript(written(), w).problems.join('\n')).toContain('lists none');
    const sourced = written();
    sourced.sources = ['A folktale written for this video; nothing in it is a fact.'];
    expect(checkScript(sourced, w).problems).toEqual([]);
  });
});

describe('every mode', () => {
  it('keeps the lines to the beats of the format, in order, with none missing', () => {
    const unknown = refined();
    const a = unknown.lines[4];
    if (!a) throw new Error('no line');
    a.beat = 'flashback';
    expect(problems(unknown)).toContain('has no beat called "flashback"');
    const order = refined();
    const b = order.lines[order.lines.length - 1];
    if (!b) throw new Error('no line');
    b.beat = 'hook';
    const found = problems(order);
    expect(found).toContain('comes after a later beat');
    expect(found).toContain('no line plays the "closing-line" beat');
  });

  it('refuses a part that runs over, and a speaker with no voice file', () => {
    const one = refined();
    for (const l of one.lines) l.chapter = 1;
    expect(problems(one)).toContain('a chapter is at most 60 s');
    const voice = refined();
    const queen = voice.speakers[2];
    if (!queen) throw new Error('no speaker');
    queen.voice = 'royal';
    expect(problems(voice)).toContain('no voice called "royal"');
  });

  it('refuses a line by someone not listed, in the shape of the file', () => {
    const raw = refined();
    raw.speakers = raw.speakers.filter((p) => p.id !== 'wife');
    expect(scriptSchema.safeParse(raw).success).toBe(false);
    const skip = refined();
    const last = skip.lines[skip.lines.length - 1];
    if (!last) throw new Error('no line');
    last.chapter = 4;
    expect(scriptSchema.safeParse(skip).success).toBe(false);
  });
});

describe('splitting into chapters', () => {
  const beats = (list: string[]) => list.map((beat) => ({ beat }));

  it('keeps a short script in one part', () => {
    expect(assignChapters(beats(['hook', 'setup', 'end']), [5, 20, 10])).toEqual([1, 1, 1]);
  });

  it('uses as few parts as fit, about even, each under the planning limit', () => {
    const seconds = new Array<number>(20).fill(7);
    const parts = assignChapters(beats(new Array<string>(20).fill('items')), seconds);
    expect(Math.max(...parts)).toBe(3);
    const lengths = [1, 2, 3].map((c) => parts.filter((p) => p === c).length * 7);
    for (const length of lengths) expect(length).toBeLessThanOrEqual(CHAPTER_MAX_S * 0.88);
    expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThanOrEqual(7);
    expect(parts).toEqual([...parts].sort((a, b) => a - b));
  });

  it('cuts where the story turns when that costs little', () => {
    const lines = beats(['a', 'a', 'a', 'a', 'a', 'b', 'b', 'b', 'b']);
    const seconds = [10, 10, 10, 10, 10, 10, 10, 10, 10];
    // An even split would cut inside beat a (after 4) or inside beat b; the beat edge wins.
    const parts = assignChapters(lines, seconds);
    expect(parts).toEqual([1, 1, 1, 1, 1, 2, 2, 2, 2]);
  });

  it('gives a line too long for any part a part to itself', () => {
    const parts = assignChapters(beats(['a', 'a', 'a']), [10, 70, 10]);
    expect(parts).toEqual([1, 2, 3]);
  });

  it('measures a line by its words, its speed and its pause', () => {
    const line = {
      text: 'one two three four five six seven eight nine ten eleven twelve thirteen',
    };
    expect(lineSeconds(line, 500)).toBeCloseTo(4.5, 1);
    expect(lineSeconds({ ...line, speed: 2 }, 500)).toBeCloseTo(2.5, 1);
    expect(lineSeconds({ ...line, pauseAfterMs: 1500 }, 500)).toBeCloseTo(5.5, 1);
  });
});

describe('the run folder', () => {
  const from = path.join(scratch, 'my-script.md');
  mkdirSync(scratch, { recursive: true });
  writeFileSync(from, 'A farmer found 100 gold coins.\n', 'utf8');
  const base = {
    root: scratch,
    date: '2026-10-06',
    format: 'story',
    brand: 'my-page',
    request: 'refine my script about the farmer',
  };

  it('is made with the request, his script untouched and the run settings', () => {
    const made = newRun({ ...base, slug: 'farmer', mode: 'refine', from }, world);
    expect(made.id).toBe('2026-10-06-farmer');
    expect(made.made).toEqual(['request.txt', 'script-original.md', 'run.json']);
    expect(readFileSync(path.join(made.dir, 'script-original.md'), 'utf8')).toBe(
      readFileSync(from, 'utf8'),
    );
    const run = JSON.parse(readFileSync(path.join(made.dir, 'run.json'), 'utf8')) as {
      mode: string;
      voice: string;
      sizes: string[];
    };
    expect(run).toMatchObject({ mode: 'refine', voice: 'narrator' });
    expect(run.sizes).toContain('9:16');
  });

  it('is never overwritten', () => {
    expect(() => newRun({ ...base, slug: 'farmer', mode: 'refine', from }, world)).toThrow(
      'never overwritten',
    );
  });

  it('refuses a mode with no script to start from, an unknown format and a bad name', () => {
    expect(() => newRun({ ...base, slug: 'no-script', mode: 'as-is' }, world)).toThrow('--from');
    expect(() =>
      newRun({ ...base, slug: 'film', mode: 'original', format: 'documentary' }, world),
    ).toThrow('no format called "documentary"');
    expect(() => newRun({ ...base, slug: 'My Video', mode: 'original' }, world)).toThrow(
      'lower case',
    );
    expect(existsSync(path.join(scratch, 'runs', '2026-10-06-no-script'))).toBe(false);
  });

  it('starts an original with no script file', () => {
    const made = newRun({ ...base, slug: 'moon', mode: 'original' }, world);
    expect(made.made).toEqual(['request.txt', 'run.json']);
  });

  it('finds a master prompt of Biku’s, for the format first', () => {
    expect(findMasterPrompt(scratch, 'story')).toBeNull();
    mkdirSync(path.join(scratch, 'prompts'), { recursive: true });
    writeFileSync(path.join(scratch, 'prompts', 'master.md'), 'Write like a campfire tale.\n');
    expect(findMasterPrompt(scratch, 'story')).toBe('prompts/master.md');
    writeFileSync(path.join(scratch, 'prompts', 'story.md'), 'Open with a question.\n');
    expect(findMasterPrompt(scratch, 'story')).toBe('prompts/story.md');
    expect(findMasterPrompt(scratch, 'quote')).toBe('prompts/master.md');
  });

  it('holds a script to a master prompt when there is one', () => {
    const dir = path.join(scratch, 'runs', '2026-10-06-farmer');
    const script = refined();
    writeFileSync(path.join(dir, 'script.json'), JSON.stringify(script), 'utf8');
    writeFileSync(path.join(dir, 'script-original.md'), original, 'utf8');
    expect(checkRunScript(dir, world, scratch).problems.join('\n')).toContain('master prompt');
    writeFileSync(
      path.join(dir, 'script.json'),
      JSON.stringify({ ...script, masterPrompt: 'prompts/story.md' }),
      'utf8',
    );
    expect(checkRunScript(dir, world, scratch).problems).toEqual([]);
  });

  it('splits a saved script into parts and writes them back', () => {
    const dir = path.join(scratch, 'runs', '2026-10-06-farmer');
    const flat = refined();
    for (const l of flat.lines) l.chapter = 1;
    writeFileSync(path.join(dir, 'script.json'), JSON.stringify(flat), 'utf8');
    const parts = splitRunIntoChapters(dir, world);
    expect(Math.max(...parts)).toBe(2);
    expect(loadScript(dir).lines.map((l) => l.chapter)).toEqual(parts);
  });
});

describe('the page Biku reads', () => {
  it('shows the parts, who speaks, what changed and where the original is', () => {
    const script = refined();
    const page = scriptPage(script, checkScript(script, world, original));
    expect(page).toContain('# The Honest Farmer');
    expect(page).toContain('## Part 1 (about 0:');
    expect(page).toContain('## Part 2 (about 0:');
    expect(page).toContain('| d4 | Tomas, the farmer | **I** would have known. |');
    expect(page).toContain('## What changed');
    expect(page).toContain('script-original.md');
    expect(page).not.toContain('—');
  });

  it('says plainly that an as-is script was not changed', () => {
    const script = asIs();
    const page = scriptPage(script, checkScript(script, world, original));
    expect(page).toContain('Not one word was changed.');
    expect(page).not.toContain('## What changed');
    expect(page).toContain('in 3 parts');
  });
});
