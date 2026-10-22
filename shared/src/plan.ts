import { voiceOf } from './assembly';
import { AMBIENT_SFX } from './sound.schema';
import { flatLayers } from './thumbnail.schema';
import type { LibraryIndex } from './library.schema';
import type { Format } from './plugins.schema';
import type { Script } from './script.schema';
import type { World } from './storyboard.check';
import { NARRATOR, SPEAKING_WPM, actorMoments, plainWords } from './storyboard.schema';
import type { Actor, Scene, Shot, Storyboard } from './storyboard.schema';

/**
 * The shot plan (Part 2, section 11, stage 3): the script becomes a storyboard. Claude decides
 * what each shot shows; this file does the mechanical parts and holds the plan to the rules of
 * staging the studio has learned.
 *
 *   draftStoryboard   the script laid out as scenes and shots of 2 to 4 seconds, with every
 *                     decision still to make marked "todo"
 *   checkPlan         staging rules: a shot shows something, a speaker is on screen, people
 *                     face who they look at, the picture changes
 *   storyboardPage    the shot list as a page Biku can read
 */

const TODO = 'todo';
/** Props that hang down from the hand, so a low hand puts them on the floor. */
const HANGING_PROPS = ['bag', 'lantern'];
const SECONDS_PER_WORD = 60 / SPEAKING_WPM;
const JOINING_WORDS = new Set([
  'and',
  'but',
  'then',
  'because',
  'when',
  'so',
  'while',
  'or',
  'until',
  'since',
]);

// ------------------------------------------------------------------ words into shots

/**
 * Splits a line's words into shots, each as near the middle of the allowed shot length as the
 * sentence allows, cut at a full stop or comma where there is one and never inside an
 * emphasized phrase. `pauseS` is the silence after the line, which the last shot also holds.
 */
export function splitIntoShots(
  text: string,
  opts: { minS: number; maxS: number; pauseS?: number; speed?: number },
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const n = words.length;
  if (n === 0) return [];
  const perWord = SECONDS_PER_WORD / (opts.speed ?? 1);
  const pause = opts.pauseS ?? 0;
  const target = (opts.minS + opts.maxS) / 2;

  // Is a cut allowed after word i (0-based), and what does it cost?
  let open = false;
  const cutCost: number[] = [];
  for (let i = 0; i < n; i++) {
    const w = words[i] as string;
    const stars = (w.match(/\*/g) ?? []).length;
    if (stars % 2 === 1) open = !open;
    const next = (words[i + 1] ?? '').toLowerCase().replace(/[^a-z]/g, '');
    if (open) cutCost.push(Infinity);
    else if (/[.!?]["')\]*]*$/.test(w)) cutCost.push(0);
    else if (/[,;:]["')\]*]*$/.test(w)) cutCost.push(0.08);
    else if (JOINING_WORDS.has(next)) cutCost.push(0.3);
    else cutCost.push(1.2);
  }
  cutCost[n - 1] = 0;

  const pieceCost = (from: number, to: number): number => {
    const seconds = (to - from) * perWord + (to === n ? pause : 0);
    let cost = ((seconds - target) / target) ** 2;
    if (seconds > opts.maxS) cost += 4 * (seconds - opts.maxS);
    if (seconds < opts.minS) cost += 0.8 * (opts.minS - seconds);
    return cost + (cutCost[to - 1] ?? 0);
  };

  const best = new Array<number>(n + 1).fill(Infinity);
  const from = new Array<number>(n + 1).fill(0);
  best[0] = 0;
  for (let to = 1; to <= n; to++) {
    for (let start = 0; start < to; start++) {
      const cost = (best[start] ?? Infinity) + pieceCost(start, to);
      if (cost < (best[to] ?? Infinity)) {
        best[to] = cost;
        from[to] = start;
      }
    }
  }
  const pieces: string[] = [];
  for (let end = n; end > 0; end = from[end] ?? 0) {
    pieces.unshift(words.slice(from[end] ?? 0, end).join(' '));
  }
  return pieces;
}

/** How long each shot of a scene is on screen, guessed from its words until the voice exists. */
export function shotSeconds(
  scene: Scene,
  format: Format | undefined,
  voiceSpeed = 1,
  /** Each speaker's own voice, when known: its pace and how it scales pauses. */
  voiceFor?: (speaker: string) => { speed: number; pauseScale: number } | undefined,
): Map<string, number> {
  const out = new Map<string, number>();
  const pause = format?.pacing.pauseMs.normal ?? 500;
  for (const line of scene.lines) {
    const shots = scene.shots.filter((s) => s.line === line.id);
    const own = voiceFor?.(line.speaker);
    const speed = own?.speed ?? voiceSpeed;
    const pauseScale = own?.pauseScale ?? 1;
    shots.forEach((shot, i) => {
      if (shot.startMs !== undefined && shot.endMs !== undefined) {
        out.set(shot.id, (shot.endMs - shot.startMs) / 1000);
        return;
      }
      const count = plainWords(shot.words).split(' ').filter(Boolean).length;
      const speech = (count * SECONDS_PER_WORD) / ((line.speed ?? 1) * speed);
      const tail = i === shots.length - 1 ? ((line.pauseAfterMs ?? pause) * pauseScale) / 1000 : 0;
      out.set(shot.id, speech + tail);
    });
  }
  return out;
}

// ------------------------------------------------------------------ the draft

const letters = (i: number): string =>
  i < 26 ? String.fromCharCode(97 + i) : letters(Math.floor(i / 26) - 1) + letters(i % 26);

/**
 * The script laid out as a storyboard with everything mechanical done: scenes by beat and
 * chapter, lines copied word for word, words cut into shots, speakers put on screen for their
 * own lines, the format's usual music and shot sizes. What only a director can decide is
 * marked "todo" (the place, its colors, each expression), and the check refuses a storyboard
 * that still has one.
 */
export function draftStoryboard(script: Script, world: World, seed: number): unknown {
  const format = world.formats[script.format];
  const pauseMs = format?.pacing.pauseMs.normal ?? 500;
  const shotLength = format?.shotLength ?? { min: 2, max: 4 };
  const scenes: unknown[] = [];
  let i = 0;
  while (i < script.lines.length) {
    const first = script.lines[i];
    if (!first) break;
    let j = i;
    while (script.lines[j]?.beat === first.beat && script.lines[j]?.chapter === first.chapter) j++;
    const lines = script.lines.slice(i, j);
    const beat = format?.structure.find((b) => b.id === first.beat);
    const id = `s${scenes.length + 1}`;
    const sizes = beat?.preferredShots.filter((s) => s !== 'over-shoulder') ?? ['medium'];
    const shots: unknown[] = [];
    for (const line of lines) {
      const pieces = splitIntoShots(line.text, {
        minS: shotLength.min,
        maxS: shotLength.max,
        pauseS: (line.pauseAfterMs ?? pauseMs) / 1000,
        ...(line.speed ? { speed: line.speed } : {}),
      });
      for (const words of pieces) {
        const speaking = line.speaker !== NARRATOR;
        shots.push({
          id: `${id}${letters(shots.length)}`,
          line: line.id,
          words,
          camera: { framing: sizes[shots.length % sizes.length] ?? 'medium', move: 'none' },
          actors: speaking
            ? [{ character: line.speaker, pose: 'stand', expression: TODO, facing: 'right' }]
            : [],
          ...(scenes.length === 0 && shots.length === 0
            ? { overlay: { kind: 'title', text: script.title } }
            : {}),
        });
      }
    }
    scenes.push({
      id,
      chapter: first.chapter,
      beat: first.beat,
      mood: beat?.moods[0] ?? 'calm',
      place: TODO,
      treatment: beat?.backgroundTreatment === 'atmospheric' ? 'atmospheric' : 'simple',
      palette: TODO,
      lines: lines.map(({ id: lineId, speaker, text, say, speed, pauseAfterMs, thought }) => ({
        id: lineId,
        speaker,
        text,
        ...(say ? { say } : {}),
        ...(speed ? { speed } : {}),
        ...(pauseAfterMs !== undefined ? { pauseAfterMs } : {}),
        ...(thought ? { thought } : {}),
      })),
      shots,
    });
    i = j;
  }
  return {
    version: 1,
    title: script.title,
    request: script.request,
    mode: script.mode,
    format: script.format,
    style: world.library.style,
    brand: script.brand,
    voice: script.voice,
    seed,
    ...(world.formats[script.format]?.finish
      ? { finish: world.formats[script.format]?.finish }
      : {}),
    sources: script.sources,
    appliedLessons: [],
    cast: script.speakers.map((p) => ({ id: p.id, name: p.name, voice: p.voice })),
    scenes,
  };
}

/** The storyboard must speak the script exactly: same lines, same words, same speakers. */
export function scriptMismatch(sb: Storyboard, script: Script): string[] {
  const out: string[] = [];
  const planned = sb.scenes.flatMap((s) =>
    s.lines.map((l) => ({ ...l, chapter: s.chapter, beat: s.beat })),
  );
  if (planned.length !== script.lines.length) {
    out.push(
      `the storyboard has ${planned.length} lines and the script has ${script.lines.length}`,
    );
  }
  script.lines.forEach((line, i) => {
    const p = planned[i];
    if (!p) return;
    if (p.id !== line.id)
      out.push(`line ${i + 1} is "${line.id}" in the script and "${p.id}" in the storyboard`);
    else {
      if (p.text !== line.text) out.push(`line "${line.id}" does not have the script's words`);
      if ((p.say ?? '') !== (line.say ?? '') || (p.speed ?? 1) !== (line.speed ?? 1))
        out.push(`line "${line.id}" is not said the way the script has it (its pace or pauses)`);
      if (p.speaker !== line.speaker)
        out.push(
          `line "${line.id}" is spoken by "${line.speaker}" in the script and "${p.speaker}" in the storyboard`,
        );
      if (p.chapter !== line.chapter)
        out.push(
          `line "${line.id}" is in part ${line.chapter} of the script and part ${p.chapter} of the storyboard`,
        );
      if (p.beat !== line.beat)
        out.push(
          `line "${line.id}" plays the "${line.beat}" beat in the script and "${p.beat}" in the storyboard`,
        );
    }
  });
  if (sb.title !== script.title) out.push('the storyboard and the script have different titles');
  if (sb.mode !== script.mode) out.push('the storyboard and the script are in different modes');
  return out;
}

// ------------------------------------------------------------------ the staging check

export type PlanReport = {
  problems: string[];
  notes: string[];
  shots: number;
  soundEffects: number;
};

/** What a shot shows of its people, as text: two shots with the same text are the same picture. */
const actorsKey = (shot: Shot): string =>
  JSON.stringify(
    shot.actors.map(({ character, pose, action, expression, facing, x, then }) => [
      character,
      pose,
      action,
      expression,
      facing,
      x,
      then,
    ]),
  );
const sameActors = (a: Shot, b: Shot): boolean => actorsKey(a) === actorsKey(b);

/**
 * Staging rules, on top of `checkStoryboard`: is every shot a picture, and do the pictures
 * make sense one after another? Problems must be fixed; notes are worth a second look.
 */

/**
 * Where each face sits: from unhappy to glad, and from still to stirred, each -1 to 1. It is
 * for telling a step of feeling (hopeful to doubtful) from a leap (glad to terrified).
 */
const FEELING: Record<string, readonly [number, number]> = {
  neutral: [0, 0],
  happy: [0.8, 0.3],
  laughing: [1, 0.8],
  sad: [-0.7, -0.5],
  angry: [-0.8, 0.8],
  shouting: [-0.9, 1],
  afraid: [-0.8, 0.7],
  surprised: [0.1, 0.9],
  determined: [0.2, 0.5],
  thinking: [0, -0.1],
  smug: [0.5, 0],
  exhausted: [-0.4, -0.9],
  wailing: [-1, 1],
  horrified: [-1, 0.9],
  asleep: [0, -1],
  suspicious: [-0.3, 0.1],
  wink: [0.6, 0.2],
  dread: [-0.8, 0.4],
  calculating: [-0.1, 0],
  tempted: [0.4, 0.5],
  lying: [0.3, 0.1],
  guilty: [-0.6, -0.3],
  hollow: [-0.6, -0.8],
  bored: [0, -0.5],
};
/** How far apart two feelings are before going from one to the other is a leap. */
const FEELING_LEAP = 1.3;
/** A face that changes this many times within this many of its owner's shots changes too often: it reads as random. */
const FACE_CHANGES_RUN = 3;
const FACE_CHANGES_SPAN = 4;

type Feeling = { expression: string; strength: number };
const sameFeeling = (a: Feeling, b: Feeling) =>
  a.expression === b.expression && a.strength === b.strength;
const faceName = (f: Feeling) =>
  f.strength < 1 ? `${f.expression} at ${Math.round(f.strength * 100)}%` : f.expression;
const isLeap = (a: Feeling, b: Feeling): boolean => {
  const from = FEELING[a.expression];
  const to = FEELING[b.expression];
  if (!from || !to) return false;
  return (
    Math.hypot(
      to[0] * b.strength - from[0] * a.strength,
      to[1] * b.strength - from[1] * a.strength,
    ) > FEELING_LEAP
  );
};

/**
 * In a video with a fixed cast, everyone the viewer needs is met in the first half minute
 * (Biku, 2026-10-11, from a review of the Dollar Auction: "Where did he come from?").
 */
export const NEW_FACE_AFTER_S = 30;

export function checkPlan(sb: Storyboard, world: World): PlanReport {
  const problems: string[] = [];
  const notes: string[] = [];
  const format = world.formats[sb.format];
  const voiceSpeed = world.voices[sb.voice]?.speed ?? 1;
  let titles = 0;
  let soundEffects = 0;
  let totalSeconds = 0;
  let run: { framing: string; count: number; from: string } | null = null;
  let previous: { shot: Shot; scene: Scene } | null = null;
  const lastSeen = new Map<string, { actor: Actor; shot: string }>();
  // A Short plays again as soon as it ends: one whose last picture is where its first was
  // replays without a jump (2026-10-14).
  const lastScene = sb.scenes[sb.scenes.length - 1];
  const lastShot = lastScene?.shots[lastScene.shots.length - 1];
  const firstScene = sb.scenes[0];
  if (
    world.brands[sb.brand]?.defaults.sizes[0] === '9:16' &&
    lastShot &&
    firstScene &&
    lastScene &&
    (lastScene.place !== firstScene.place ||
      lastShot.camera.framing !== firstScene.shots[0]?.camera.framing)
  ) {
    notes.push(
      `the last shot "${lastShot.id}" is not where the first one is; a Short loops straight back to its start, so ending in the same place and shot size as the opening makes the replay seamless`,
    );
  }
  // A Short is judged in its first second (2026-10-14): a vertical video does not open on a
  // picture that holds still.
  const firstShot = sb.scenes[0]?.shots[0];
  const vertical = world.brands[sb.brand]?.defaults.sizes[0] === '9:16';
  if (
    vertical &&
    firstShot &&
    firstShot.camera.move === 'none' &&
    !firstShot.actors.some((a) => a.action || (a.then ?? []).length > 0)
  ) {
    notes.push(
      `the first shot "${firstShot.id}" holds still; a Short is judged in its first second: give it a camera move (push-in, drift) or someone moving`,
    );
  }
  // Which of their shots each person's face changes in, counting their shots from 1, and who
  // has already been told their face changes too often.
  const faceChanges = new Map<string, number[]>();
  const shotsWith = new Map<string, number>();
  const restless = new Set<string>();
  /** A change of face in someone's nth shot: true when it is one too many, too close together. */
  const changed = (who: string, nth: number): boolean => {
    const at = [...(faceChanges.get(who) ?? []), nth];
    faceChanges.set(who, at);
    const first = at[at.length - FACE_CHANGES_RUN];
    if (first === undefined || nth - first + 1 > FACE_CHANGES_SPAN || restless.has(who))
      return false;
    restless.add(who);
    return true;
  };
  const tooOften = (who: string, at: string) =>
    `"${who}" changes face ${FACE_CHANGES_RUN} times in ${FACE_CHANGES_SPAN} shots by ${at}; hold a face longer, and change it only when something happens to them`;
  const firstSeen = new Map<string, { at: number; shot: string }>();
  const lastStood = new Map<string, { x: number; shot: string }>();
  const all = sb.scenes.flatMap((scene) => scene.shots.map((shot) => ({ shot, scene })));

  for (const scene of sb.scenes) {
    const seconds = shotSeconds(scene, format, voiceSpeed, (sp) => voiceOf(sb, sp, world));
    const beat = format?.structure.find((b) => b.id === scene.beat);
    if (beat && !beat.moods.includes(scene.mood)) {
      notes.push(
        `scene "${scene.id}" plays ${scene.mood} music; the "${beat.id}" beat usually takes ${beat.moods.join(' or ')}`,
      );
    }
    if (
      previous &&
      previous.scene.palette !== scene.palette &&
      scene.shots[0]?.transition !== 'fade' &&
      previous.scene.chapter === scene.chapter
    ) {
      notes.push(
        `scene "${scene.id}" changes the light from ${previous.scene.palette} to ${scene.palette} on a plain cut; a change of time or place reads better with a fade`,
      );
    }
    for (const line of scene.lines) {
      if (line.speaker === NARRATOR) continue;
      // A host tells the whole video: seen speaking where they are in the shot, heard over
      // the rest. How often they are seen is counted for the whole plan, further down.
      if (sb.cast.find((m) => m.id === line.speaker)?.host) continue;
      const shots = scene.shots.filter((s) => s.line === line.id);
      const seen = shots.filter((s) =>
        s.actors.some((a) => a.character === line.speaker && !a.back),
      );
      if (seen.length === 0) {
        problems.push(
          `"${line.speaker}" speaks line "${line.id}" but their face is in none of its shots, so nobody is seen talking`,
        );
      } else if (seen.length < shots.length) {
        notes.push(`"${line.speaker}" speaks line "${line.id}" and is not on screen for all of it`);
      }
    }
    for (const shot of scene.shots) {
      const at = `shot "${shot.id}"`;
      const length = seconds.get(shot.id) ?? 0;
      for (const a of shot.actors) {
        if (!firstSeen.has(a.character)) {
          firstSeen.set(a.character, { at: totalSeconds, shot: shot.id });
        }
      }
      totalSeconds += length;
      // A sound under the scene (a murmur, rain, a clock) is the place, not an effect.
      soundEffects += shot.sfx.filter((x) => !AMBIENT_SFX.includes(x.name)).length;
      const timed = shot.startMs !== undefined;
      if (!timed && format && length > format.shotLength.max + 0.6) {
        problems.push(
          `${at} would stay on screen about ${length.toFixed(1)} s; the picture should change every ${format.shotLength.min} to ${format.shotLength.max} s. Split its words into two shots.`,
        );
      }
      if (!timed && format && length < format.shotLength.min - 0.5) {
        notes.push(
          `${at} would be on screen only about ${length.toFixed(1)} s, too quick to take in; give it more of the line's words`,
        );
      }
      if (
        shot.actors.length === 0 &&
        shot.props.length === 0 &&
        !shot.overlay &&
        !shot.picture &&
        !shot.graphic
      ) {
        problems.push(`${at} shows nobody and nothing. Put someone in it, or a thing, or a title.`);
      }
      if (shot.actors.length >= 2 && shot.actors.some((a) => a.x === undefined)) {
        problems.push(
          `${at} has ${shot.actors.length} people; say where each one stands (x), so they do not land on top of each other`,
        );
      }
      const placed = shot.actors.filter((a): a is Actor & { x: number } => a.x !== undefined);
      for (let a = 0; a < placed.length; a++) {
        for (let b = a + 1; b < placed.length; b++) {
          const one = placed[a] as Actor & { x: number };
          const two = placed[b] as Actor & { x: number };
          const hugging = one.pose === 'hug' || two.pose === 'hug';
          if (Math.abs(one.x - two.x) < 0.12 && !hugging) {
            problems.push(
              `in ${at}, "${one.character}" and "${two.character}" stand on the same spot`,
            );
          }
        }
      }
      for (const actor of shot.actors) {
        const other = placed.find((o) => o.character === actor.lookAt);
        if (other && actor.x !== undefined && other.x !== actor.x) {
          const toward = other.x > actor.x ? 'right' : 'left';
          if (actor.facing !== toward) {
            problems.push(
              `in ${at}, "${actor.character}" looks at "${other.character}" but faces away from them`,
            );
          }
        }
      }
      // Each of these is said once, however many stretches of the shot it holds for.
      const note = (text: string) => {
        if (!notes.includes(text)) notes.push(text);
      };
      const isLow = (pose: string | undefined) =>
        pose === 'sit' || pose?.startsWith('sit-') || pose === 'kneel' || pose === 'lie';
      for (const actor of shot.actors) {
        for (const moment of actorMoments(actor)) {
          if (isLow(moment.pose) && moment.holds && HANGING_PROPS.includes(moment.holds)) {
            note(
              `in ${at}, "${actor.character}" is down low holding the ${moment.holds}, which hangs to the floor; stand it in the scene beside them instead`,
            );
          }
        }
      }
      if (shot.camera.framing === 'close-up' || shot.camera.framing === 'eyes') {
        for (const actor of shot.actors) {
          if (actor.then.some((step) => step.pose !== undefined || step.action !== undefined)) {
            notes.push(
              `in ${at}, "${actor.character}" changes pose inside a close-up, which shows only the face; make it a medium shot`,
            );
          }
        }
      }
      // A closer shot is cut at the hips or the chin, so it cannot show the ground or a hand.
      if (shot.camera.framing !== 'wide') {
        for (const actor of shot.actors) {
          for (const moment of actorMoments(actor)) {
            const onGround = shot.props.some((p) => p.prop === moment.lookAt);
            if (onGround && !isLow(moment.pose)) {
              note(
                `in ${at}, "${actor.character}" looks at the ${moment.lookAt} standing on the ground, which a ${shot.camera.framing} shot cuts off; make the shot wide`,
              );
            }
            const inHand = moment.holds !== undefined && moment.lookAt === moment.holds;
            if ((shot.camera.framing === 'close-up' || shot.camera.framing === 'eyes') && inHand) {
              note(
                `in ${at}, "${actor.character}" looks at the ${moment.holds} in their hand, which a close-up cuts off; make it a medium shot`,
              );
            }
          }
        }
      }
      if (shot.camera.framing === 'over-shoulder') {
        const backs = shot.actors.filter((a) => a.back).length;
        if (backs !== 1)
          problems.push(
            `${at} is over the shoulder: exactly one person is seen from behind (back), the one whose shoulder it is`,
          );
      } else if (shot.actors.some((a) => a.back) && shot.actors.every((a) => a.back)) {
        notes.push(`${at} shows only backs; no face carries the feeling`);
      }
      if (shot.overlay?.kind === 'title') {
        titles += 1;
        if (scene.chapter !== 1)
          problems.push(
            `${at} shows the title in part ${scene.chapter}; the title belongs only at the start of part 1`,
          );
      }
      // A plain cut is the same moment seen again: nobody turns round, gets up, moves somewhere
      // else or gains or loses what is in their hand between two frames (Biku, 2026-10-06:
      // "its direction changes and looks like the posture didn't change in continuous
      // frames"). That holds inside a scene, and into a new scene in the same place unless
      // it comes in with a fade, which says time has passed.
      const sameMoment =
        previous &&
        (previous.scene.id === scene.id ||
          (shot.transition !== 'fade' && previous.scene.place === scene.place));
      // Who and what was last seen in this same moment, and in which shot. A fade or a new
      // place starts afresh.
      if (!sameMoment) {
        lastSeen.clear();
        lastStood.clear();
      }
      if (previous && sameMoment) {
        const sameFraming = previous.shot.camera.framing === shot.camera.framing;
        const travels = (other: Shot) => other.camera.move === 'follow';
        const sameSize = sameFraming && !travels(shot) && !travels(previous.shot);
        const shared = shot.actors.some((a) =>
          previous?.shot.actors.some((b) => b.character === a.character),
        );
        if (sameFraming && shared && travels(shot) !== travels(previous.shot)) {
          note(
            `${at} is the same size of shot as "${previous.shot.id}", but the camera travels in one and stands still in the other, so the place jumps on the cut; change the shot size`,
          );
        }
        for (const actor of shot.actors) {
          // The last shot they were in, which may be a few shots back: a close-up of someone
          // else in between does not change what they hold or which way they face.
          const seen = lastSeen.get(actor.character);
          if (!seen || seen.actor.back || actor.back) continue;
          const earlier = seen.actor;
          const justBefore = seen.shot === previous.shot.id;
          const was = actorMoments(earlier).at(-1);
          const is = actorMoments(actor)[0];
          if (!was || !is) continue;
          const who = `"${actor.character}"`;
          const after = justBefore ? `the cut from "${seen.shot}"` : `"${seen.shot}"`;
          // A face does not change between two frames either (Biku, 2026-10-12: "one second its
          // one expression and another second its another"). It comes over the cut as it was and
          // changes inside a shot, after what causes it.
          if (!sameFeeling(was, is)) {
            if (changed(actor.character, (shotsWith.get(actor.character) ?? 0) + 1))
              note(tooOften(actor.character, at));
            note(
              `in ${at}, ${who} changes face on the cut (${faceName(is)}, after ${faceName(was)}); start them with the face they had and change it inside the shot (a step), a beat after what causes it`,
            );
            if (isLeap(was, is)) {
              note(
                `in ${at}, ${who} goes from ${faceName(was)} straight to ${faceName(is)}: a leap of feeling. Right for a shock the viewer watches happen; otherwise go through a face between them`,
              );
            }
          }
          if (earlier.facing !== actor.facing) {
            note(
              `in ${at}, ${who} faces the other way after ${after}; keep them facing the same way`,
            );
          }
          if (was.holds !== is.holds) {
            const hands = (thing: string | undefined) =>
              thing ? `holding the ${thing}` : 'with empty hands';
            note(
              `in ${at}, ${who} is ${hands(is.holds)} after ${after}, which left them ${hands(was.holds)}; let them take it inside a shot (a step), or bring the scene in with a fade`,
            );
          }
          if (isLow(was.pose) !== isLow(is.pose)) {
            const [from, to] = isLow(was.pose) ? ['down', 'up'] : ['up', 'down'];
            note(
              `in ${at}, ${who} is ${to} after ${after}, which left them ${from}; show them getting ${to} inside a shot (a step)`,
            );
          } else if (sameSize && justBefore) {
            const moved =
              earlier.x !== undefined &&
              actor.x !== undefined &&
              Math.abs(earlier.x - actor.x) > 0.03;
            const reposed = was.pose !== undefined && is.pose !== undefined && was.pose !== is.pose;
            if (moved || reposed) {
              note(
                `in ${at}, ${who} jumps to a new ${moved ? 'place' : 'pose'} after ${after}, a shot of the same size; let them get there inside a shot (a step), or change the shot size`,
              );
            }
          }
        }
      }
      // A thing standing in the scene stays where it stands from shot to shot.
      const once = (name: string) => shot.props.filter((p) => p.prop === name).length === 1;
      for (const prop of shot.props) {
        if (!once(prop.prop)) continue;
        const stood = lastStood.get(prop.prop);
        if (stood && Math.abs(stood.x - prop.x) > 0.03) {
          note(
            `in ${at}, the ${prop.prop} stands somewhere else than in "${stood.shot}"; a thing stays where it is from shot to shot`,
          );
        }
        lastStood.set(prop.prop, { x: prop.x, shot: shot.id });
      }
      for (const actor of shot.actors) {
        lastSeen.set(actor.character, { actor, shot: shot.id });
        if (actor.back) continue;
        const nth = (shotsWith.get(actor.character) ?? 0) + 1;
        shotsWith.set(actor.character, nth);
        const moments = actorMoments(actor);
        let changes = 0;
        moments.forEach((moment, i) => {
          const before = moments[i - 1];
          if (!before || sameFeeling(before, moment)) return;
          changes += 1;
          if (changed(actor.character, nth)) note(tooOften(actor.character, at));
          if (isLeap(before, moment)) {
            note(
              `in ${at}, "${actor.character}" goes from ${faceName(before)} straight to ${faceName(moment)}: a leap of feeling. Right for a shock the viewer watches happen; otherwise go through a face between them`,
            );
          }
        });
        if (changes > 1) {
          note(
            `in ${at}, "${actor.character}" changes face ${changes} times; one change of feeling is all a shot of a few seconds can show`,
          );
        }
      }
      // The picture changes: not the same size of shot again and again, not the same picture twice.
      if (run && run.framing === shot.camera.framing) run.count += 1;
      else run = { framing: shot.camera.framing, count: 1, from: shot.id };
      if (run.count === 4)
        notes.push(`four ${run.framing} shots in a row from "${run.from}"; vary the shot size`);
      if (
        previous &&
        previous.scene.id === scene.id &&
        previous.shot.camera.framing === shot.camera.framing &&
        previous.shot.camera.focus === shot.camera.focus &&
        sameActors(previous.shot, shot) &&
        !shot.overlay &&
        shot.effects.length === previous.shot.effects.length
      ) {
        notes.push(
          `${at} is the same picture as "${previous.shot.id}"; change the size or the pose, or let a face change inside it (a step)`,
        );
      }
      previous = { shot, scene };
    }
  }
  if (titles > 1) problems.push(`the title is shown ${titles} times; once is enough`);
  if (sb.meter?.from && !all.some((x) => x.shot.id === sb.meter?.from)) {
    problems.push(`the counter starts on shot "${sb.meter.from}", which is not in the video`);
  }

  const opening = all[0]?.shot;
  if (opening && opening.actors.length === 0) {
    notes.push(
      'the first shot has nobody in it; the first 3 seconds should be the most striking picture',
    );
  }
  if (format && totalSeconds > 20) {
    const perMinute = (soundEffects / totalSeconds) * 60;
    const { min, max } = format.sfxDensity.perMinute;
    if (perMinute > max * 1.2)
      notes.push(
        `about ${perMinute.toFixed(0)} sound effects a minute; the ${format.id} format suits ${min} to ${max}`,
      );
    if (perMinute < min * 0.6)
      notes.push(
        `about ${perMinute.toFixed(0)} sound effects a minute; the ${format.id} format suits ${min} to ${max}. Steps, doors and things landing make the pictures feel real.`,
      );
  }
  // One story, told in one place by the people met at its start: pointed out for a video with
  // a fixed cast, where the cast plays the whole thing.
  if (sb.series) {
    for (const [id, seen] of firstSeen) {
      if (seen.at <= NEW_FACE_AFTER_S) continue;
      const name = sb.cast.find((m) => m.id === id)?.name ?? id;
      notes.push(
        `"${name}" is first seen about ${clock(seen.at)} in (shot "${seen.shot}"); after the first ${NEW_FACE_AFTER_S} seconds a new face makes a viewer ask where they came from. Let someone already in the story do it, or bring them in at the start`,
      );
    }
    const home = sb.scenes[0]?.place;
    const away = [...new Set(sb.scenes.map((sc) => sc.place).filter((p) => p !== home))];
    if (away.length) {
      notes.push(
        `the story leaves the ${home} for ${away.join(', ')}; one story in one place is easier to follow. Show it where the cast already is, if the words allow`,
      );
    }
  }
  return { problems, notes, shots: all.length, soundEffects };
}

// ------------------------------------------------------------------ the page Biku reads

const FRAMING_WORDS: Record<string, string> = {
  wide: 'Wide shot',
  medium: 'Medium shot',
  'close-up': 'Close-up',
  eyes: 'Only the eyes',
  'over-shoulder': 'Over the shoulder',
};
const MOVE_WORDS: Record<string, string> = {
  'push-in': 'the camera moves slowly closer',
  'punch-in': 'the camera jumps closer',
  pan: 'the camera slides across',
  whip: 'the camera swings in',
  shake: 'the picture jolts',
  follow: 'the camera travels along',
  tilt: 'the picture is tipped to one side',
  'pull-back': 'the camera moves slowly back',
  drift: 'the camera drifts slowly across',
};
const LOOK_WORDS: Record<string, string> = {
  camera: 'looking at us',
  up: 'looking up',
  down: 'looking down',
};
/** What a pose or an action looks like as a verb, for the page. Others fall back to their name. */
const DOING_WORDS: Record<string, string> = {
  'pose/stand': 'stands',
  'pose/wave': 'waves',
  'pose/point': 'points',
  'pose/shrug': 'shrugs',
  'pose/hands-up': 'throws both hands up',
  'pose/hold-object': 'holds out a hand',
  'pose/hands-over-mouth': 'covers the mouth with both hands',
  'pose/sit': 'sits',
  'pose/sit-reach': 'sits and reaches across the table',
  'pose/sit-promise': 'sits with a hand on the heart',
  'pose/sit-hands-up': 'sits and throws both hands up',
  'pose/sit-slump': 'sits slumped',
  'pose/sit-phone': 'sits bowed over a phone',
  'pose/kneel': 'kneels',
  'pose/lie': 'lies down',
  'pose/cross-arms': 'stands with arms crossed',
  'pose/look-up': 'looks up',
  'pose/look-down': 'looks down',
  'pose/cower': 'cowers',
  'pose/hug': 'hugs',
  'pose/open-arms': 'opens both arms wide',
  'pose/hand-on-heart': 'stands with a hand on the heart',
  'pose/rub-hands': 'leans in, rubbing both hands',
  'pose/head-tilt': 'tilts the head, watching',
  'pose/fix-tie': 'straightens the tie',
  'action/walk': 'walks',
  'action/walk-proud': 'struts',
  'action/walk-tired': 'trudges',
  'action/walk-sneaky': 'creeps',
  'action/walk-happy': 'walks with a bounce',
  'action/cheer': 'cheers',
  'action/cry': 'cries',
  'action/run': 'runs',
  'action/carry': 'carries a load',
  'action/push': 'pushes',
  'action/pull': 'pulls',
  'action/jump': 'jumps',
  'action/fall': 'falls forward',
  'action/fall-back': 'is knocked onto the back',
  'action/punch': 'throws a punch',
  'action/swing': 'swings',
  'action/recoil': 'staggers back',
};

const nameOf = (library: LibraryIndex, id: string): string =>
  (
    library.assets.find((a) => a.id === id)?.name ??
    id.slice(id.indexOf('/') + 1).replace(/-/g, ' ')
  ).toLowerCase();

const sentence = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** One shot in plain words: the size of shot, who is in it, what they do and feel. */
export function describeShot(shot: Shot, sb: Storyboard, world: World): string {
  // "Tomas, the farmer" is "Tomas" in a sentence.
  const who = new Map(sb.cast.map((m) => [m.id, m.name.split(',')[0] ?? m.name]));
  // "The queen" at the start of a sentence, "the queen" inside one.
  const person = (id: string) =>
    (who.get(id) ?? id).replace(/^(His|Her|Their|The|A|An) /, (m) => m.toLowerCase());
  const thing = (id: string) => `the ${nameOf(world.library, `prop/${id}`)}`;
  const parts: string[] = [];
  if (shot.transition === 'fade') parts.push('Fade in');
  if (shot.transition === 'whip') parts.push('The camera swings in');
  if (shot.graphic) {
    const g = shot.graphic;
    const title = g.title ? ` "${g.title.lines.join(' ')}"` : '';
    return `An explainer graphic, ${GRAPHIC_WORDS[g.kind]}${title}, its pieces arriving as they are named.`;
  }
  if (shot.picture) {
    const words = flatLayers(shot.picture.layers)
      .flatMap((l) => (l.kind === 'tag' ? [l.text] : l.kind === 'words' ? l.lines : []))
      .join(', ');
    const crowd = flatLayers(shot.picture.layers).some((l) => l.kind === 'crowd');
    const moves =
      shot.picture.from && shot.picture.to && shot.picture.from.zoom > shot.picture.to.zoom;
    return `A picture made for the moment${crowd ? ', a crowd' : ''}${moves ? ', the camera pulling back' : ''}${words ? ` (${words})` : ''}.`;
  }
  const focus = shot.camera.focus ? ` on ${person(shot.camera.focus)}` : '';
  parts.push(`${FRAMING_WORDS[shot.camera.framing] ?? shot.camera.framing}${focus}`);
  for (const actor of shot.actors) {
    const id = actor.action ? `action/${actor.action}` : `pose/${actor.pose ?? 'stand'}`;
    let doing = DOING_WORDS[id] ?? nameOf(world.library, id);
    if (actor.holds) {
      doing =
        id === 'pose/hold-object'
          ? `holds ${thing(actor.holds)}`
          : `${doing}, holding ${thing(actor.holds)}`;
    }
    const bits = [
      `${person(actor.character)} ${doing}`,
      nameOf(world.library, `expression/${actor.expression}`),
    ];
    const sameAsPose =
      (actor.lookAt === 'up' && actor.pose === 'look-up') ||
      (actor.lookAt === 'down' && actor.pose === 'look-down') ||
      (actor.holds !== undefined && actor.lookAt === actor.holds && id !== 'pose/hold-object');
    if (LOOK_WORDS[actor.lookAt] && !sameAsPose) bits.push(LOOK_WORDS[actor.lookAt] as string);
    else if (actor.lookAt !== 'ahead' && !LOOK_WORDS[actor.lookAt] && !sameAsPose) {
      bits.push(`looking at ${who.has(actor.lookAt) ? person(actor.lookAt) : thing(actor.lookAt)}`);
    }
    if (actor.back) bits.push('seen from behind');
    // What they do next inside the shot, each as a short clause.
    for (const step of actor.then) {
      const next: string[] = [];
      const move = step.action ? `action/${step.action}` : step.pose ? `pose/${step.pose}` : null;
      if (move) {
        const verb = DOING_WORDS[move] ?? nameOf(world.library, move);
        next.push(move === 'pose/hold-object' && step.holds ? `holds ${thing(step.holds)}` : verb);
      }
      if (step.holds && move !== 'pose/hold-object') next.push(`takes ${thing(step.holds)}`);
      if (step.holds === null) next.push('lets go');
      if (step.expression)
        next.push(`looks ${nameOf(world.library, `expression/${step.expression}`)}`);
      if (step.lookAt && LOOK_WORDS[step.lookAt]) next.push(LOOK_WORDS[step.lookAt] as string);
      else if (step.lookAt && step.lookAt !== 'ahead') {
        next.push(`looks at ${who.has(step.lookAt) ? person(step.lookAt) : thing(step.lookAt)}`);
      }
      bits.push(`then ${next.join(' and ')}`);
    }
    parts.push(bits.join(', '));
  }
  if (shot.props.length) {
    const things = [...new Set(shot.props.map((p) => nameOf(world.library, `prop/${p.prop}`)))];
    parts.push(`In the scene: ${things.join(', ')}`);
  }
  for (const e of shot.effects) {
    parts.push(`${nameOf(world.library, `effect/${e.effect}`)} on ${person(e.on)}`);
  }
  if (shot.camera.move !== 'none') parts.push(MOVE_WORDS[shot.camera.move] ?? shot.camera.move);
  if (shot.overlay) {
    const o = shot.overlay;
    parts.push(
      o.kind === 'title'
        ? `Title: "${o.text}"`
        : o.kind === 'label'
          ? `Label: "${o.text}"`
          : o.kind === 'number'
            ? `Big number: "${o.text}"${o.caption ? ` (${o.caption})` : ''}`
            : o.kind === 'pointer'
              ? `An arrow labelled "${o.text}"`
              : o.kind === 'page'
                ? `A page held up to the camera: "${o.lines.join(' / ')}"`
                : o.kind === 'words'
                  ? `Big words over the picture: "${o.lines.join(' ')}"`
                  : o.kind === 'bubble'
                    ? `${o.shape === 'speech' ? 'A speech balloon' : 'A thought bubble'} over ${person(o.of)}: "${o.lines.join(' / ')}"${o.to ? `, which drifts across to ${person(o.to)} and bursts` : ''}`
                    : `A diagram: the ${o.around} going round the ${o.center}`,
    );
  }
  return `${parts.map(sentence).join('. ')}.`;
}

/** What each explainer graphic is, in a word or two, for the shot list. */
const GRAPHIC_WORDS: Record<string, string> = {
  flow: 'the money flowing from box to box',
  split: 'where the money goes, share by share',
  bars: 'bars growing side by side',
  tag: 'a price tag dropping in',
  receipt: 'a receipt printing line by line',
  number: 'one big number',
  queue: 'people walking into a queue',
  scene: 'an illustrated place',
};

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** The whole shot list as a page: parts, scenes, and for each shot the words, the picture and the sound. */
export function storyboardPage(sb: Storyboard, world: World): string {
  const format = world.formats[sb.format];
  const voiceSpeed = world.voices[sb.voice]?.speed ?? 1;
  const who = new Map(sb.cast.map((m) => [m.id, m.name]));
  const out: string[] = [`# ${sb.title}: shot list`, ''];
  const shotCount = sb.scenes.reduce((n, s) => n + s.shots.length, 0);
  const lengths = sb.scenes.map((s) =>
    [...shotSeconds(s, format, voiceSpeed, (sp) => voiceOf(sb, sp, world)).values()].reduce(
      (a, b) => a + b,
      0,
    ),
  );
  const total = lengths.reduce((a, b) => a + b, 0);
  const parts = Math.max(...sb.scenes.map((s) => s.chapter));
  out.push(
    `${shotCount} shots in ${sb.scenes.length} scenes, about ${clock(total)}, in ${parts} ${parts === 1 ? 'part' : 'parts'}. Times are estimates until the voice is made.`,
    '',
    `Cast: ${sb.cast.map((m) => m.name).join('; ') || 'nobody'}.`,
    '',
  );
  let at = 0;
  let chapter = 0;
  sb.scenes.forEach((scene, i) => {
    if (scene.chapter !== chapter) {
      chapter = scene.chapter;
      const seconds = sb.scenes.reduce(
        (sum, s, k) => sum + (s.chapter === chapter ? (lengths[k] ?? 0) : 0),
        0,
      );
      out.push(`## Part ${chapter} (about ${clock(seconds)})`, '');
    }
    const place = nameOf(world.library, `place/${scene.place}`);
    const light = nameOf(world.library, `palette/${scene.palette}`);
    out.push(
      `### Scene ${i + 1}: ${scene.beat.replace(/-/g, ' ')}`,
      '',
      `Place: ${place}, ${light} colors. Music: ${scene.mood}.`,
      '',
      '| Shot | At | Who speaks | Words | What you see | Sound |',
      '| --- | --- | --- | --- | --- | --- |',
    );
    const seconds = shotSeconds(scene, format, voiceSpeed, (sp) => voiceOf(sb, sp, world));
    for (const shot of scene.shots) {
      const line = scene.lines.find((l) => l.id === shot.line);
      const speaker =
        !line || line.speaker === NARRATOR ? 'Narrator' : (who.get(line.speaker) ?? line.speaker);
      const words = shot.words.replace(/\*([^*]+)\*/g, '**$1**').replace(/\|/g, '\\|');
      const sound = shot.sfx.map((s) => s.name.replace(/-/g, ' ')).join(', ') || ' ';
      out.push(
        `| ${shot.id} | ${clock(at)} | ${speaker} | ${words} | ${describeShot(shot, sb, world).replace(/\|/g, '\\|')} | ${sound} |`,
      );
      at += seconds.get(shot.id) ?? 0;
    }
    out.push('');
  });
  out.push(...feelingPlan(sb, world));
  return `${out.join('\n').trimEnd()}\n`;
}

/**
 * The feeling plan (step 5, 2026-10-14): each person's line of feeling, scene by scene, with
 * every change and what is said when it happens, so a face that changes without a cause is
 * seen before anything is drawn (L-0040: one line of feeling, each change after its cause).
 */
export function feelingPlan(sb: Storyboard, world: World): string[] {
  const out = [
    '## How each person feels',
    '',
    'One line of feeling for each person, scene by scene. A face changes only where something causes it: each change shows the shot and what is said then.',
    '',
  ];
  const feel = (expression: string, strength?: number) =>
    `${nameOf(world.library, `expression/${expression}`).toLowerCase()}${strength !== undefined && strength < 0.7 ? ', a little' : ''}`;
  for (const member of sb.cast) {
    const rows: string[] = [];
    sb.scenes.forEach((scene, i) => {
      const steps: string[] = [];
      let last = '';
      for (const shot of scene.shots) {
        const actor = shot.actors.find((a) => a.character === member.id);
        if (!actor) continue;
        const faces = [
          { face: feel(actor.expression, actor.strength), at: 0 },
          ...(actor.then ?? [])
            .filter((s) => s.expression)
            .map((s) => ({ face: feel(s.expression ?? '', s.strength), at: s.at })),
        ];
        for (const { face } of faces) {
          if (face === last) continue;
          const cause = shot.words.replace(/\*/g, '');
          steps.push(last === '' ? face : `${face} (${shot.id}, "${cause}")`);
          last = face;
        }
      }
      if (steps.length)
        rows.push(`- Scene ${i + 1}, ${scene.beat.replace(/-/g, ' ')}: ${steps.join(' → ')}`);
    });
    if (rows.length) out.push(`**${member.name}**`, '', ...rows, '');
  }
  return out;
}
