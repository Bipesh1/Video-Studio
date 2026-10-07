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
): Map<string, number> {
  const out = new Map<string, number>();
  const pause = format?.pacing.pauseMs.normal ?? 500;
  for (const line of scene.lines) {
    const shots = scene.shots.filter((s) => s.line === line.id);
    shots.forEach((shot, i) => {
      if (shot.startMs !== undefined && shot.endMs !== undefined) {
        out.set(shot.id, (shot.endMs - shot.startMs) / 1000);
        return;
      }
      const count = plainWords(shot.words).split(' ').filter(Boolean).length;
      const speech = (count * SECONDS_PER_WORD) / ((line.speed ?? 1) * voiceSpeed);
      const tail = i === shots.length - 1 ? (line.pauseAfterMs ?? pause) / 1000 : 0;
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
      lines: lines.map(({ id: lineId, speaker, text, speed, pauseAfterMs }) => ({
        id: lineId,
        speaker,
        text,
        ...(speed ? { speed } : {}),
        ...(pauseAfterMs !== undefined ? { pauseAfterMs } : {}),
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
  const lastStood = new Map<string, { x: number; shot: string }>();
  const all = sb.scenes.flatMap((scene) => scene.shots.map((shot) => ({ shot, scene })));

  for (const scene of sb.scenes) {
    const seconds = shotSeconds(scene, format, voiceSpeed);
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
      totalSeconds += length;
      soundEffects += shot.sfx.length;
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
      if (shot.actors.length === 0 && shot.props.length === 0 && !shot.overlay) {
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
        pose === 'sit' || pose === 'kneel' || pose === 'lie';
      for (const actor of shot.actors) {
        for (const moment of actorMoments(actor)) {
          if (isLow(moment.pose) && moment.holds && HANGING_PROPS.includes(moment.holds)) {
            note(
              `in ${at}, "${actor.character}" is down low holding the ${moment.holds}, which hangs to the floor; stand it in the scene beside them instead`,
            );
          }
        }
      }
      if (shot.camera.framing === 'close-up') {
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
            if (shot.camera.framing === 'close-up' && inHand) {
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
      for (const actor of shot.actors) lastSeen.set(actor.character, { actor, shot: shot.id });
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
          `${at} is the same picture as "${previous.shot.id}"; change the size, the pose or the face`,
        );
      }
      previous = { shot, scene };
    }
  }
  if (titles > 1) problems.push(`the title is shown ${titles} times; once is enough`);
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
  return { problems, notes, shots: all.length, soundEffects };
}

// ------------------------------------------------------------------ the page Biku reads

const FRAMING_WORDS: Record<string, string> = {
  wide: 'Wide shot',
  medium: 'Medium shot',
  'close-up': 'Close-up',
  'over-shoulder': 'Over the shoulder',
};
const MOVE_WORDS: Record<string, string> = {
  'push-in': 'the camera moves slowly closer',
  'punch-in': 'the camera jumps closer',
  pan: 'the camera slides across',
  shake: 'the picture jolts',
  follow: 'the camera travels along',
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
  'pose/kneel': 'kneels',
  'pose/lie': 'lies down',
  'pose/cross-arms': 'stands with arms crossed',
  'pose/look-up': 'looks up',
  'pose/look-down': 'looks down',
  'pose/cower': 'cowers',
  'pose/hug': 'hugs',
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
              : `A diagram: the ${o.around} going round the ${o.center}`,
    );
  }
  return `${parts.map(sentence).join('. ')}.`;
}

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
    [...shotSeconds(s, format, voiceSpeed).values()].reduce((a, b) => a + b, 0),
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
    const seconds = shotSeconds(scene, format, voiceSpeed);
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
  return `${out.join('\n').trimEnd()}\n`;
}
