import path from 'node:path';
import {
  CUT_LEAD_MS,
  LEAD_IN_MS,
  QUESTION_LIFT,
  partCount,
  partStoryboard,
  picturesOnly,
  plainWords,
  sameWords,
  scriptLineSchema,
  arrivalOf,
  graphicSoundCues,
  soundPlanFor,
  soundPlanSchema,
  storyboardSchema,
  timeShots,
  voiceScriptFor,
  voiceScriptSchema,
  voiceTrackSchema,
} from '@studio/shared';
import type { Storyboard, VoiceScript, VoiceTrack } from '@studio/shared';
import { describe, expect, it } from 'vitest';
import { projectRoot } from './system';
import { loadStoryboard, loadWorld } from './world';

/**
 * Assembly hand-offs (Phase 4D): a part of the storyboard becomes a voice script, the voice's
 * times go into the shots, and the shots' music and effects become a plan for the mix.
 */

const world = loadWorld();
const plan = loadStoryboard(
  path.join(projectRoot, 'runs', '2026-10-06-honest-farmer', 'storyboard.json'),
);

/** A voice track as the worker would write it: 320 ms a word, the script's pauses between lines. */
function fakeTrack(script: VoiceScript): VoiceTrack {
  let at = script.leadInMs;
  const lines: VoiceTrack['lines'] = [];
  const words: VoiceTrack['words'] = [];
  for (const line of script.lines) {
    const start = at;
    for (const word of line.text.split(/\s+/).filter(Boolean)) {
      words.push({
        text: word.replace(/\*/g, ''),
        startMs: at,
        endMs: at + 280,
        lineId: line.id,
        emphasis: word.includes('*'),
      });
      at += 320;
    }
    lines.push({
      id: line.id,
      speaker: line.speaker,
      voice: line.voice,
      text: line.text,
      startMs: start,
      endMs: at - 40,
    });
    at += line.pauseAfterMs;
  }
  return voiceTrackSchema.parse({
    version: 1,
    audioFile: 'voice.wav',
    sampleRate: 24000,
    durationMs: at + script.tailMs,
    timingSource: 'kokoro',
    loudnessLufs: -17,
    lines,
    words,
  });
}

const part = (n: number) => partStoryboard(plan, n);
const timed = (n: number): { sb: Storyboard; track: VoiceTrack } => {
  const track = fakeTrack(voiceScriptFor(part(n), world));
  return { sb: timeShots(part(n), track), track };
};

describe('one part of a video', () => {
  it('stands alone as a storyboard of its own', () => {
    expect(partCount(plan)).toBe(2);
    const one = part(1);
    const two = part(2);
    expect(storyboardSchema.safeParse(one).success).toBe(true);
    expect(storyboardSchema.safeParse(two).success).toBe(true);
    expect(one.scenes.map((s) => s.id)).toEqual(['s1', 's2', 's3', 's4']);
    expect(two.scenes.map((s) => s.id)).toEqual(['s5', 's6', 's7', 's8', 's9']);
    expect(two.scenes.every((s) => s.chapter === 1)).toBe(true);
    expect(one.cast).toEqual(plan.cast);
  });

  it('keeps the title to the first part', () => {
    const titles = (sb: Storyboard) =>
      sb.scenes.flatMap((s) => s.shots).filter((s) => s.overlay?.kind === 'title').length;
    expect(titles(part(1))).toBe(1);
    expect(titles(part(2))).toBe(0);
  });

  it('says so when there is no such part', () => {
    expect(() => part(3)).toThrow('has no part 3');
  });

  it('carries a gauge into the next part at its last value, and puts one away when it is done', () => {
    const ids = (n: number) => part(n).scenes.flatMap((s) => s.shots.map((t) => t.id));
    const [a1, a2] = ids(1);
    const [b1] = ids(2);
    const last1 = ids(1).at(-1);
    if (!a1 || !a2 || !b1 || !last1) throw new Error('the plan has too few shots');
    const withGauges: Storyboard = {
      ...plan,
      gauges: [
        {
          label: 'SHEEP LEFT',
          kind: 'count',
          keys: [
            { shot: a1, value: 10 },
            { shot: a2, on: 'the', value: 7 },
            { shot: b1, value: 3 },
          ],
        },
        { label: 'DONE', kind: 'steps', of: 3, keys: [{ shot: a1, value: 1 }], until: last1 },
      ],
    };
    expect(storyboardSchema.safeParse(withGauges).success).toBe(true);
    const one = partStoryboard(withGauges, 1);
    const two = partStoryboard(withGauges, 2);
    expect(one.gauges?.map((g) => g.keys.length)).toEqual([2, 1]);
    expect(one.gauges?.[1]?.until).toBe(last1);
    // Part 2 starts already at 7, then counts to 3; the steps were put away in part 1.
    expect(two.gauges).toEqual([
      {
        label: 'SHEEP LEFT',
        kind: 'count',
        keys: [
          { shot: b1, value: 7, now: true },
          { shot: b1, value: 3 },
        ],
      },
    ]);
    expect(storyboardSchema.safeParse(two).success).toBe(true);
  });

  it('refuses a gauge whose keys are out of the order of the shots', () => {
    const [a1, a2] = part(1).scenes.flatMap((s) => s.shots.map((t) => t.id));
    if (!a1 || !a2) throw new Error('the plan has too few shots');
    const wrong = storyboardSchema.safeParse({
      ...plan,
      gauges: [
        {
          label: 'BACKWARDS',
          kind: 'bar',
          keys: [
            { shot: a2, value: 1 },
            { shot: a1, value: 2 },
          ],
        },
      ],
    });
    expect(wrong.success).toBe(false);
  });
});

describe('the voice script', () => {
  it('gives every line its speaker’s Kokoro voice, its speed and its pause', () => {
    const script = voiceScriptSchema.parse(voiceScriptFor(part(1), world));
    expect(script.leadInMs).toBe(LEAD_IN_MS);
    const byId = new Map(script.lines.map((l) => [l.id, l]));
    expect(byId.get('n1')?.voice).toBe(world.voices.narrator?.kokoroVoice);
    expect(byId.get('d1')?.voice).toBe(world.voices.woman?.kokoroVoice);
    expect(byId.get('d1')?.speaker).toBe('wife');
    expect(byId.get('n2')?.pauseAfterMs).toBe(900);
    // A line with no pause of its own takes the format's usual one.
    expect(byId.get('n3')?.pauseAfterMs).toBe(world.formats.story?.pacing.pauseMs.normal);
    expect(script.lines.map((l) => l.id)).toEqual(
      part(1).scenes.flatMap((s) => s.lines.map((l) => l.id)),
    );
  });

  it('passes on how a line is said, a blended voice and the lift of the questions', () => {
    const one = part(1);
    const first = one.scenes[0]?.lines[0];
    if (!first) throw new Error('part 1 has no line');
    const say = first.text.replace(/\*/g, '').replace(/\.$/, '...');
    const shaped: Storyboard = {
      ...one,
      scenes: one.scenes.map((s, i) =>
        i === 0
          ? { ...s, lines: s.lines.map((l, j) => (j === 0 ? { ...l, say, speed: 0.9 } : l)) }
          : s,
      ),
    };
    const narrator = world.voices.narrator;
    if (!narrator) throw new Error('no narrator voice');
    const blended = {
      ...world,
      voices: {
        ...world.voices,
        narrator: { ...narrator, blend: [{ kokoroVoice: 'am_onyx', share: 0.3 }] },
      },
    };
    const script = voiceScriptSchema.parse(voiceScriptFor(shaped, blended));
    expect(script.questionLift).toBe(QUESTION_LIFT);
    const line = script.lines[0];
    expect(line?.say).toBe(say);
    expect(line?.text).toBe(first.text);
    expect(line?.speed).toBeCloseTo(0.9 * narrator.speed, 2);
    expect(line?.blend).toEqual([
      { voice: narrator.kokoroVoice, weight: 0.7 },
      { voice: 'am_onyx', weight: 0.3 },
    ]);
    // A voice with nothing mixed in, and a line said as written, carry neither.
    const plain = voiceScriptFor(one, world).lines[0];
    expect(plain && 'blend' in plain).toBe(false);
    expect(plain && 'say' in plain).toBe(false);
  });

  it('refuses a line said in other words than its own', () => {
    const line = { id: 'l1', speaker: 'narrator', voice: 'am_onyx', text: 'He *stays.*' };
    expect(scriptLineSchema.safeParse({ ...line, say: 'He... stays.' }).success).toBe(true);
    expect(scriptLineSchema.safeParse({ ...line, say: 'He stays put.' }).success).toBe(false);
    expect(sameWords("It's fine. Is it?", "It's fine... Is it?")).toBe(true);
    // Chatterbox's mood and sound tags are not words.
    expect(sameWords('Is that smoke?', '[surprised] Is that... smoke? [chuckle]')).toBe(true);
    expect(
      storyboardSchema.safeParse({
        ...part(1),
        scenes: part(1).scenes.map((s, i) =>
          i === 0 ? { ...s, lines: s.lines.map((l) => ({ ...l, say: 'Other words.' })) } : s,
        ),
      }).success,
    ).toBe(false);
  });

  it('keeps the words exactly, emphasis marks and all', () => {
    const script = voiceScriptFor(part(2), world);
    const lines = part(2).scenes.flatMap((s) => s.lines);
    expect(script.lines.map((l) => l.text)).toEqual(lines.map((l) => l.text));
  });

  it('follows a slower voice and a longer pause scale', () => {
    const w = structuredClone(world);
    const narrator = w.voices.narrator;
    if (!narrator) throw new Error('no narrator');
    narrator.speed = 0.9;
    narrator.pauseScale = 1.5;
    const script = voiceScriptFor(part(1), w);
    expect(script.lines[0]?.speed).toBe(0.9);
    expect(script.lines[1]?.pauseAfterMs).toBe(1350);
  });

  it('refuses a speaker with no voice', () => {
    const sb = structuredClone(part(1));
    const wife = sb.cast.find((m) => m.id === 'wife');
    if (wife) delete wife.voice;
    expect(() => voiceScriptFor(sb, world)).toThrow('"wife" speaks line "d1" and has no voice');
  });
});

describe('shot times from the voice', () => {
  it('covers every moment of the track, in order, from zero to the end', () => {
    for (const n of [1, 2]) {
      const { sb, track } = timed(n);
      expect(storyboardSchema.safeParse(sb).success).toBe(true);
      const shots = sb.scenes.flatMap((s) => s.shots);
      expect(shots[0]?.startMs).toBe(0);
      expect(shots[shots.length - 1]?.endMs).toBe(track.durationMs);
      shots.forEach((shot, i) => {
        expect(shot.endMs).toBeGreaterThan(shot.startMs ?? 0);
        if (i > 0) expect(shot.startMs).toBe(shots[i - 1]?.endMs);
      });
    }
  });

  it('starts each shot just before the word it opens on', () => {
    const { sb, track } = timed(1);
    for (const scene of sb.scenes) {
      for (const line of scene.lines) {
        const words = track.words.filter((w) => w.lineId === line.id);
        const shots = scene.shots.filter((s) => s.line === line.id);
        let before = 0;
        shots.forEach((shot, i) => {
          const first = words[before];
          if (!first) throw new Error('no word');
          if (shot.startMs !== 0) {
            expect(shot.startMs).toBeLessThanOrEqual(first.startMs);
            expect(first.startMs - (shot.startMs ?? 0)).toBeLessThanOrEqual(CUT_LEAD_MS);
          }
          if (i > 0) expect(shot.startMs).toBeGreaterThanOrEqual(words[before - 1]?.endMs ?? 0);
          before += plainWords(shot.words).split(' ').length;
        });
      }
    }
  });

  it('never cuts into the line before', () => {
    const { sb, track } = timed(2);
    const firstOf = new Map(
      sb.scenes.flatMap((s) =>
        s.lines.map((l) => [l.id, s.shots.find((shot) => shot.line === l.id)] as const),
      ),
    );
    track.lines.forEach((line, i) => {
      const prev = track.lines[i - 1];
      if (prev) expect(firstOf.get(line.id)?.startMs).toBeGreaterThan(prev.endMs);
    });
  });

  it('says so when the voice track is for other lines', () => {
    const track = fakeTrack(voiceScriptFor(part(2), world));
    expect(() => timeShots(part(1), track)).toThrow('has no line "n1"');
  });
});

describe('the sound plan', () => {
  it('starts each mood where its scene starts, and does not restart one that carries on', () => {
    const { sb } = timed(1);
    const plan1 = soundPlanSchema.parse(soundPlanFor(sb));
    expect(plan1.music.map((m) => m.mood)).toEqual(['curious', 'tense', 'sorrow']);
    expect(plan1.music[0]?.startMs).toBe(0);
    expect(plan1.music[1]?.startMs).toBe(sb.scenes[2]?.shots[0]?.startMs);
    expect(plan1.music[2]?.startMs).toBe(sb.scenes[3]?.shots[0]?.startMs);
  });

  /** The story's places with no sound of their own, so a test can hear the rest alone. */
  const unplaced = (sb: ReturnType<typeof timed>['sb']) => {
    for (const scene of sb.scenes) scene.place = 'the-table';
    return sb;
  };

  it('gives every video its own music, and a Short its own handling', () => {
    // Biku, 2026-10-21: every Short had "the same background sounds".
    const { sb } = timed(1);
    const long = soundPlanSchema.parse(soundPlanFor(sb));
    expect(long.score?.seed).toBe(sb.seed);
    expect(long.score?.profile).toBe('long');
    const other = structuredClone(sb);
    other.seed = sb.seed + 1;
    const next = soundPlanSchema.parse(soundPlanFor(other)).score;
    expect([next?.shift, next?.tempo]).not.toEqual([long.score?.shift, long.score?.tempo]);
    // An opening with no sound of its own gets the hit; one that has its own keeps it.
    const opening = sb.scenes[0]?.shots[0];
    if (opening) opening.sfx = [];
    const short = soundPlanSchema.parse(
      soundPlanFor(sb, 'wind', [], { profile: 'short', opens: true }),
    );
    expect(short.score?.tempo).toBeGreaterThan(long.score?.tempo ?? 0);
    expect(short.sfx).toContainEqual(expect.objectContaining({ name: 'hit', atMs: 0 }));
    // Only the part the video opens with opens on a hit.
    const later = soundPlanFor(sb, 'wind', [], { profile: 'short', opens: false });
    expect(later.sfx.some((c) => c.name === 'hit' && c.atMs === 0)).toBe(false);
    sb.score = { palette: 'body' };
    expect(soundPlanFor(sb).score?.palette).toBe('body');
  });

  it('cuts the music just before a reveal and brings it back with a hit', () => {
    const { sb } = timed(1);
    const shot = sb.scenes[1]?.shots[0];
    if (!shot?.startMs) throw new Error('no shot');
    shot.drop = true;
    const plan1 = soundPlanSchema.parse(soundPlanFor(sb));
    const at = Math.round(shot.startMs);
    expect(plan1.hush).toContainEqual({ fromMs: at - 700, toMs: at + 20, sharp: true });
    expect(plan1.sfx).toContainEqual(expect.objectContaining({ name: 'hit', atMs: at }));
  });

  it('leaves what is only heard out of the pictures', () => {
    const { sb } = timed(1);
    const quieter = structuredClone(sb);
    quieter.score = { palette: 'mystery' };
    const scene = quieter.scenes[0];
    const shot = scene?.shots[0];
    if (!scene || !shot) throw new Error('no shot');
    scene.mood = 'sorrow';
    shot.sfx = [{ name: 'ding', at: 'start', gainDb: 0 }];
    shot.drop = true;
    expect(picturesOnly(quieter)).toEqual(picturesOnly(sb));
    shot.camera = { ...shot.camera, framing: shot.camera.framing === 'wide' ? 'close-up' : 'wide' };
    expect(picturesOnly(quieter)).not.toEqual(picturesOnly(sb));
  });

  it('puts the room tone of the format under a scene with no music, or the wind', () => {
    const sb = unplaced(timed(1).sb);
    const first = sb.scenes[0];
    if (!first) throw new Error('no scene');
    first.quiet = true;
    expect(soundPlanFor(sb).sfx[0]?.name).toBe('wind');
    const hum = soundPlanFor(sb, 'hum').sfx[0];
    expect(hum?.name).toBe('hum');
    expect(hum?.atMs).toBe(first.shots[0]?.startMs);
    expect(world.formats.dilemma?.roomTone).toBe('hum');
  });

  it('stops the music for a quiet scene after it has begun, and goes on after it', () => {
    // Biku's script, 2026-10-14: "The music stops."
    const sb = unplaced(timed(1).sb);
    const second = sb.scenes[1];
    if (!second) throw new Error('no scene');
    second.quiet = true;
    const plan1 = soundPlanSchema.parse(soundPlanFor(sb, 'hum'));
    const from = second.shots[0]?.startMs;
    const to = second.shots[second.shots.length - 1]?.endMs;
    expect(plan1.hush).toEqual([{ fromMs: from, toMs: to }]);
    expect(plan1.music[0]?.startMs).toBe(0);
    expect(plan1.sfx.find((c) => c.name === 'hum')?.atMs).toBe(from);
  });

  it('places every effect inside its shot, and lets steps and wind run for it', () => {
    const sb = unplaced(timed(1).sb);
    const plan1 = soundPlanFor(sb);
    const shots = sb.scenes.flatMap((s) => s.shots);
    expect(plan1.sfx).toHaveLength(shots.reduce((n, s) => n + s.sfx.length, 0));
    const inShot = (id: string) => {
      const shot = shots.find((s) => s.id === id);
      return plan1.sfx.filter((c) => c.atMs >= (shot?.startMs ?? 0) && c.atMs < (shot?.endMs ?? 0));
    };
    const steps = inShot('s2c').find((c) => c.name === 'footsteps');
    const s2c = shots.find((s) => s.id === 's2c');
    expect(steps?.durationMs).toBeGreaterThan(400);
    expect((steps?.atMs ?? 0) + (steps?.durationMs ?? 0)).toBeLessThanOrEqual(s2c?.endMs ?? 0);
    expect(steps?.gainDb).toBe(-2);
    expect(inShot('s1b').find((c) => c.name === 'wind')?.durationMs).toBeGreaterThan(1000);
    expect(inShot('s2d').find((c) => c.name === 'pop')?.durationMs).toBeUndefined();
  });

  it('needs the shots to have times', () => {
    expect(() => soundPlanFor(part(1))).toThrow('no times yet');
  });

  // Biku, 2026-10-20: "we need more background sounds that's according to the story".
  it('runs the sound of each place under its scene, one sound across its shots', () => {
    const sb = unplaced(timed(1).sb);
    const first = sb.scenes[0];
    if (!first) throw new Error('no scene');
    first.place = 'forest';
    const birds = soundPlanFor(sb).sfx.filter((c) => c.name === 'birds');
    expect(birds).toHaveLength(1);
    expect(birds[0]?.atMs).toBe(first.shots[0]?.startMs);
    expect((birds[0]?.atMs ?? 0) + (birds[0]?.durationMs ?? 0)).toBe(
      first.shots[first.shots.length - 1]?.endMs,
    );
    expect(birds[0]?.gainDb).toBe(-3);
  });

  it('lets a scene or a shot choose its own place sound, and a quiet one needs no room tone', () => {
    const sb = unplaced(timed(1).sb);
    const first = sb.scenes[0];
    const shot = first?.shots[1];
    if (!first || !shot) throw new Error('no scene');
    first.ambience = 'river';
    first.quiet = true;
    shot.ambience = 'underwater';
    const plan1 = soundPlanSchema.parse(soundPlanFor(sb, 'hum'));
    expect(plan1.sfx.some((c) => c.name === 'hum')).toBe(false);
    const names = plan1.sfx.filter((c) => c.durationMs !== undefined).map((c) => c.name);
    expect(names.slice(0, 2)).toEqual(['river', 'underwater']);
    expect(plan1.sfx.find((c) => c.name === 'river')?.gainDb).toBe(0);
  });
});

describe('the sound of a graphic building up', () => {
  const shot = (over: Record<string, unknown>) => ({
    id: 's01',
    line: 'l01',
    words: 'Your ticket goes to the cinema',
    camera: { framing: 'wide', move: 'none', strength: 0.2 },
    actors: [],
    props: [],
    effects: [],
    sfx: [],
    transition: 'cut',
    startMs: 0,
    endMs: 3000,
    ...over,
  });
  const board = (shots: unknown[]) =>
    ({ scenes: [{ id: 'a', lines: [], shots }] }) as unknown as Storyboard;
  const words = [
    { lineId: 'l01', text: 'Your', startMs: 100 },
    { lineId: 'l01', text: 'ticket', startMs: 700 },
    { lineId: 'l01', text: 'cinema', startMs: 1900 },
  ];
  it('gives every piece a sound on the moment it lands', () => {
    const graphic = {
      kind: 'flow',
      nodes: [
        { label: 'YOU', on: 'your' },
        { label: 'THE CINEMA', on: 'cinema' },
      ],
      links: [{ label: '$11', on: 'ticket' }],
    };
    const cues = graphicSoundCues(board([shot({ graphic })]), words);
    expect(cues.map((c) => c.name)).toEqual(['pop', 'whoosh', 'pop']);
    expect(cues[1]?.atMs).toBeGreaterThan(650);
    expect(cues[2]?.atMs).toBeGreaterThan(1850);
  });
  it('whooshes when the camera travels to the next picture', () => {
    const cues = graphicSoundCues(
      board([
        shot({}),
        shot({ id: 's02', transition: 'travel-right', startMs: 3000, endMs: 6000 }),
      ]),
      [],
    );
    expect(cues).toHaveLength(1);
    expect(cues[0]?.name).toBe('whoosh');
  });
  it('never puts two sounds on top of each other', () => {
    const graphic = {
      kind: 'receipt',
      lines: [
        { label: 'CORN', value: '35¢', on: 'your' },
        { label: 'BUCKET', value: '45¢', on: 'your' },
      ],
    };
    const cues = graphicSoundCues(board([shot({ graphic })]), words);
    for (let i = 1; i < cues.length; i++) {
      expect((cues[i]?.atMs ?? 0) - (cues[i - 1]?.atMs ?? 0)).toBeGreaterThanOrEqual(200);
    }
  });
});

describe('how a picture arrives', () => {
  const g = { kind: 'number' };
  it('travels between two graphics that ask for a plain cut, in each direction in turn', () => {
    expect(arrivalOf({ transition: 'cut', graphic: g }, { graphic: g }, 1)).toBe('travel-up');
    expect(arrivalOf({ transition: 'cut', graphic: g }, { graphic: g }, 2)).toBe('travel-left');
  });
  it('keeps what a shot asks for, and a cut that is not between two graphics', () => {
    expect(arrivalOf({ transition: 'match', graphic: g }, { graphic: g }, 1)).toBe('match');
    expect(arrivalOf({ transition: 'cut' }, {}, 1)).toBe('cut');
    expect(arrivalOf({ transition: 'cut', graphic: g }, undefined, 0)).toBe('cut');
  });
});
