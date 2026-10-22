import type { Score, SfxCue, SfxName, SoundPlan, SoundProfile } from './sound.schema';
import { AMBIENT_SFX } from './sound.schema';
import type { World } from './storyboard.check';
import { graphicSteps, stepFrames } from './graphic.schema';
import type { Graphic } from './graphic.schema';
import { NARRATOR, TRAVELS, arrivalOf, plainWords } from './storyboard.schema';
import type { Storyboard, Travel } from './storyboard.schema';
import { QUESTION_LIFT } from './voice.schema';
import type { VoiceScript, VoiceTrack } from './voice.schema';

/**
 * Assembly (Phase 4D; stages 5 to 8 of a run): the hand-offs that turn one part of a
 * storyboard into a video. No drawing and no sound is made here; these are the small exact
 * steps between the stages, so each stage gets a validated file.
 *
 *   partStoryboard   one part of the video as a storyboard of its own
 *   voiceScriptFor   its lines as a script for the voice worker
 *   timeShots        the voice's word times written into the shots
 *   soundPlanFor     its music moods and sound effects as a plan for the mix
 */

/** Silence before the first word and after the last, in ms. */
export const LEAD_IN_MS = 300;
export const TAIL_MS = 900;
/** A cut lands this long before the line it opens on is spoken. */
export const CUT_LEAD_MS = 150;
/** Inside a line, a cut lands this long before the word the next shot starts on. */
const WORD_LEAD_MS = 50;

/** How many parts a storyboard has. */
export const partCount = (sb: Storyboard): number => Math.max(...sb.scenes.map((s) => s.chapter));

/**
 * One part of the video as a storyboard that stands alone: its scenes, counted as part 1, with
 * any times cleared. A part is built, shown and approved on its own, then joined to the others.
 */
export function partStoryboard(sb: Storyboard, part: number): Storyboard {
  const scenes = sb.scenes.filter((s) => s.chapter === part);
  if (scenes.length === 0)
    throw new Error(`This video has no part ${part}. It has ${partCount(sb)}.`);
  // The cover belongs to the whole video, not to a part: choosing another cover must not
  // make a part's plan look changed.
  const rest = { ...sb };
  delete rest.cover;
  const gauges = partGauges(sb, scenes);
  if (gauges) rest.gauges = gauges;
  else delete rest.gauges;
  return {
    ...rest,
    scenes: scenes.map((scene) => ({
      ...scene,
      chapter: 1,
      shots: scene.shots.map((shot) => {
        const copy = { ...shot };
        delete copy.startMs;
        delete copy.endMs;
        return copy;
      }),
    })),
  };
}

/**
 * A part's gauges: one that changed in an earlier part starts here already at its last value,
 * its changes in later parts wait for them, and one put away before this part is left out.
 */
function partGauges(sb: Storyboard, scenes: Storyboard['scenes']): Storyboard['gauges'] {
  if (!sb.gauges) return undefined;
  const order = sb.scenes.flatMap((s) => s.shots.map((t) => t.id));
  const here = scenes.flatMap((s) => s.shots.map((t) => t.id));
  const first = here[0];
  if (first === undefined) return undefined;
  const from = order.indexOf(first);
  const to = order.indexOf(here[here.length - 1] ?? first);
  const out = sb.gauges.flatMap((g) => {
    const until = g.until ? order.indexOf(g.until) : Infinity;
    if (until < from) return [];
    const carried = g.keys.filter((k) => order.indexOf(k.shot) < from).at(-1);
    const keys = [
      ...(carried ? [{ shot: first, value: carried.value, now: true }] : []),
      ...g.keys.filter((k) => here.includes(k.shot)),
    ];
    if (keys.length === 0) return [];
    const kept = { ...g, keys };
    if (until > to) delete kept.until;
    return [kept];
  });
  return out.length ? out : undefined;
}

/** The voice of whoever speaks a line: the narrator's, a cast member's, or their card's. */
/** The voice a speaker of a storyboard is heard in. */
export function voiceOf(sb: Storyboard, speaker: string, world: World) {
  if (speaker === NARRATOR) return world.voices[sb.voice];
  const member = sb.cast.find((m) => m.id === speaker);
  const id = member?.voice ?? (member?.card ? world.characters[member.card]?.voice : undefined);
  return id ? world.voices[id] : undefined;
}

/** A part's lines as the voice worker reads them: each with its Kokoro voice, speed and pause. */
export function voiceScriptFor(part: Storyboard, world: World): VoiceScript {
  const pause = world.formats[part.format]?.pacing.pauseMs.normal ?? 500;
  const lines = part.scenes.flatMap((s) => s.lines);
  return {
    leadInMs: LEAD_IN_MS,
    tailMs: TAIL_MS,
    questionLift: QUESTION_LIFT,
    lines: lines.map((line) => {
      const voice = voiceOf(part, line.speaker, world);
      if (!voice) throw new Error(`"${line.speaker}" speaks line "${line.id}" and has no voice.`);
      const mixed = voice.blend ?? [];
      const rest = 1 - mixed.reduce((sum, v) => sum + v.share, 0);
      return {
        id: line.id,
        speaker: line.speaker,
        voice: voice.kokoroVoice,
        ...(mixed.length
          ? {
              blend: [
                { voice: voice.kokoroVoice, weight: Math.round(rest * 100) / 100 },
                ...mixed.map((v) => ({ voice: v.kokoroVoice, weight: v.share })),
              ],
            }
          : {}),
        text: line.text,
        ...(line.say ? { say: line.say } : {}),
        ...(voice.engine === 'chatterbox' && voice.sample
          ? { engine: 'chatterbox' as const, sample: voice.sample }
          : {}),
        speed: Math.round((line.speed ?? 1) * voice.speed * 100) / 100,
        pauseAfterMs: Math.round((line.pauseAfterMs ?? pause) * voice.pauseScale),
      };
    }),
  };
}

/**
 * Writes the voice's times into the shots: shot length is always driven by the audio. A shot
 * starts just before its first word; the first shot of a line starts just before the line; the
 * first shot starts at zero and the last ends with the track, so the shots cover every moment.
 */
export function timeShots(part: Storyboard, track: VoiceTrack): Storyboard {
  const starts: number[] = [];
  let previousEnd = 0;
  for (const scene of part.scenes) {
    for (const line of scene.lines) {
      const spoken = track.lines.find((l) => l.id === line.id);
      if (!spoken)
        throw new Error(`The voice track has no line "${line.id}". Make the voice again.`);
      const words = track.words.filter((w) => w.lineId === line.id);
      const shots = scene.shots.filter((s) => s.line === line.id);
      const counts = shots.map((s) => plainWords(s.words).split(' ').filter(Boolean).length);
      const total = counts.reduce((a, b) => a + b, 0);
      let before = 0;
      shots.forEach((_, i) => {
        if (i === 0) {
          const cut = Math.max(previousEnd + 60, spoken.startMs - CUT_LEAD_MS);
          starts.push(starts.length === 0 ? 0 : Math.min(cut, spoken.startMs));
        } else {
          // The word this shot opens on, even if the voice split the line's words differently.
          const index = Math.min(words.length - 1, Math.round((before / total) * words.length));
          const word = words[index];
          const prior = words[index - 1];
          const at = word ? word.startMs - WORD_LEAD_MS : spoken.startMs;
          starts.push(Math.max(prior ? prior.endMs : spoken.startMs, at));
        }
        before += counts[i] ?? 0;
      });
      previousEnd = spoken.endMs;
    }
  }
  let k = 0;
  return {
    ...part,
    scenes: part.scenes.map((scene) => ({
      ...scene,
      shots: scene.shots.map((shot) => {
        const startMs = Math.round(starts[k] ?? 0);
        const endMs = Math.round(starts[k + 1] ?? track.durationMs);
        k += 1;
        return { ...shot, startMs, endMs: Math.max(endMs, startMs + 1) };
      }),
    })),
  };
}

/**
 * The part's sound as a plan for the mix: the mood from the start of each scene (a mood that
 * carries on is not started again), and each shot's effects at their moment in the shot.
 * Footsteps and the ambient effects run for the length of their shot. `roomTone` is the sound
 * under a scene with no music: the format's own, or the wind.
 */
/** How loud the breath of the room is under a scene with no music, against an effect's usual level. */
const ROOM_TONE_DB = -6;

/**
 * The sound of each named place, under any scene set there that does not choose its own
 * (`ambience` on the scene or the shot). Biku, 2026-10-20: "we need more background sounds
 * that's according to the story and whatever these story needs". A place with no sound of its
 * own (space, the bare room of the game theory videos) is left to the music and the room tone.
 */
export const PLACE_AMBIENCE: Readonly<Record<string, SfxName>> = {
  'night-street': 'night',
  'day-street': 'traffic',
  city: 'traffic',
  field: 'birds',
  forest: 'birds',
  plain: 'wind',
  'bare-rock': 'wind',
  castle: 'wind',
  'gorge-bridge': 'river',
  sea: 'waves',
  'home-interior': 'home',
  'living-room': 'home',
  kitchen: 'home',
  lab: 'office',
  restaurant: 'cafe',
  daycare: 'home',
  classroom: 'office',
  'game-show': 'crowd-murmur',
  'auction-room': 'crowd-murmur',
};
/** How loud a place's sound is: softer under music, fuller where there is none. */
const AMBIENCE_DB = { music: -3, quiet: 0 } as const;

/**
 * The sound of an explainer graphic building up (What's the Catch?, 2026-10-16: make the videos
 * "very immersive and attractive with the animations"): every piece that lands gets its own
 * small sound on the frame it lands, a pop for a box, a click for a receipt line, a coin's ding
 * for a number landing or a total, a soft whoosh for an arrow drawing itself and for the camera
 * travelling to the next picture. Sparing: never two within a fifth of a second, and quiet
 * under the voice.
 */
export const ARRIVAL_SOUNDS = {
  pop: { name: 'pop', gainDb: -6 },
  blip: { name: 'blip', gainDb: -9 },
  click: { name: 'click', gainDb: -4 },
  ding: { name: 'ding', gainDb: -7 },
  whoosh: { name: 'whoosh', gainDb: -8 },
  thud: { name: 'thud', gainDb: -10 },
} as const satisfies Record<string, { name: SfxName; gainDb: number }>;
const ARRIVAL_GAP_MS = 200;

const JOURNEY_ARRIVALS = ['pop', 'blip', 'click', 'pop'] as const;

/** Which sound each piece of a graphic makes as it lands, in graphicSteps order. */
function arrivalSounds(g: Graphic): (keyof typeof ARRIVAL_SOUNDS)[] {
  switch (g.kind) {
    case 'flow':
      return graphicSteps(g).map((_, i) => (i % 2 === 0 ? 'pop' : 'whoosh'));
    case 'receipt':
      return graphicSteps(g).map((_, i, all) =>
        g.total && i === all.length - 1 ? 'ding' : 'click',
      );
    case 'number':
      return [g.countUp ? 'ding' : 'pop'];
    case 'tag':
      return g.was ? ['thud', 'click'] : ['thud'];
    case 'journey':
      // Not the same pop for every thing that lands: a few sounds in turn, so the ear does not
      // tire of one (each also comes in a slightly different take).
      return [
        ...g.show.map((_, i) => JOURNEY_ARRIVALS[i % JOURNEY_ARRIVALS.length] ?? 'pop'),
        ...(g.callout ? ['ding' as const] : []),
      ];
    default:
      return graphicSteps(g).map(() => 'pop');
  }
}

/** Every sound of the graphics of a timed storyboard, from the words its pieces land on. */
export function graphicSoundCues(
  timed: Storyboard,
  words: readonly { lineId: string; text: string; startMs: number }[],
  fps = 30,
): SfxCue[] {
  const cues: SfxCue[] = [];
  const add = (sound: keyof typeof ARRIVAL_SOUNDS, atMs: number) => {
    if (cues.some((c) => Math.abs(c.atMs - atMs) < ARRIVAL_GAP_MS)) return;
    const { name, gainDb } = ARRIVAL_SOUNDS[sound];
    cues.push({ name, atMs: Math.max(0, Math.round(atMs)), gainDb, pan: 0, seed: cues.length });
  };
  const all = timed.scenes.flatMap((s) => s.shots);
  for (const scene of timed.scenes) {
    for (const shot of scene.shots) {
      const startMs = shot.startMs ?? 0;
      const endMs = shot.endMs ?? startMs;
      const index = all.indexOf(shot);
      const arrives = arrivalOf(shot, all[index - 1], index);
      if (TRAVELS.includes(arrives as Travel)) add('whoosh', startMs - 120);
      // A rewind: the tape whirring back over the last moments of the shot before, and its click.
      if (shot.transition === 'rewind') {
        const { gainDb } = ARRIVAL_SOUNDS.whoosh;
        cues.push({
          name: 'rewind',
          atMs: Math.max(0, Math.round(startMs - 1400)),
          gainDb,
          pan: 0,
          seed: cues.length,
        });
      }
      if (!shot.graphic) continue;
      // A journey's camera flying to a new place: the rush of it as it sets off.
      if (
        shot.graphic.kind === 'journey' &&
        shot.graphic.from &&
        shot.graphic.from !== shot.graphic.at
      ) {
        add('whoosh', startMs + 60);
      }
      const startFrame = Math.round((startMs / 1000) * fps);
      const duration = Math.max(1, Math.round((endMs / 1000) * fps) - startFrame);
      const mine = words.filter((w) => w.lineId === shot.line);
      const frames = stepFrames(
        graphicSteps(shot.graphic),
        mine,
        startFrame,
        duration,
        fps,
        shot.graphic.kind !== 'journey',
      );
      const sounds = arrivalSounds(shot.graphic);
      frames.forEach((f, i) => {
        const sound = sounds[i];
        if (sound) add(sound, ((startFrame + f) / fps) * 1000 + 40);
      });
    }
  }
  return cues.sort((a, b) => a.atMs - b.atMs);
}

/** How far a Short's music is quickened against a long video's. */
const SHORT_TEMPO = 1.05;
/** The hush before a reveal, and how loud the hit that ends it is. */
const DROP_HUSH_MS = 700;
const DROP_HIT_DB = -7;
/** The hit a Short opens on, so the first second is heard as well as seen. */
const OPENING_HIT_DB = -9;

/**
 * The video's own music, from its seed (2026-10-21, Biku: every Short had "the same background
 * sounds"): each video moves the moods to a key and a speed of its own, the Short a little
 * quicker, on the instruments of the palette the plan chose for its topic.
 */
export function scoreFor(timed: Storyboard, profile: SoundProfile): Score {
  const seed = timed.seed;
  const shift = (seed % 7) - 3;
  const tempo =
    (0.94 + (Math.floor(seed / 7) % 5) * 0.03) * (profile === 'short' ? SHORT_TEMPO : 1);
  return {
    seed,
    shift,
    tempo: Math.round(Math.min(1.25, Math.max(0.8, tempo)) * 1000) / 1000,
    palette: timed.score?.palette ?? 'own',
    profile: timed.score?.profile ?? profile,
  };
}

export function soundPlanFor(
  timed: Storyboard,
  roomTone: SfxName = 'wind',
  words: readonly { lineId: string; text: string; startMs: number }[] = [],
  options: {
    /** A Short or a long video; the storyboard's own choice wins. */
    profile?: SoundProfile;
    /** True for the part the video opens with: a Short opens on a hit. */
    opens?: boolean;
  } = {},
): SoundPlan {
  const score = scoreFor(timed, options.profile ?? 'long');
  const music: SoundPlan['music'] = [];
  const sfx: SfxCue[] = [];
  const hush: SoundPlan['hush'] = [];
  let quietSoFar = false;
  let room: SfxCue | null = null;
  for (const scene of timed.scenes) {
    const first = scene.shots[0];
    if (first?.startMs === undefined)
      throw new Error('The shots have no times yet. Make the voice first.');
    // A quiet scene has no music. Before any has begun, the music simply starts later, where
    // its scene starts; once it has begun, it stops for the scene (a hush) and the mood goes on
    // after it.
    const quiet = scene.quiet === true;
    // The sound of the place under each shot: the shot's own, the scene's, or the place's.
    const placeSound = (shot: (typeof scene.shots)[number]): SfxName | undefined =>
      shot.ambience ?? scene.ambience ?? (shot.graphic ? undefined : PLACE_AMBIENCE[scene.place]);
    const placed = scene.shots.every((shot) => placeSound(shot) !== undefined);
    if (quiet && music.length > 0) {
      const last = scene.shots[scene.shots.length - 1];
      const to = last?.endMs ?? first.startMs;
      const going = hush[hush.length - 1];
      if (going && Math.abs(going.toMs - first.startMs) < 400) going.toMs = to;
      else hush.push({ fromMs: first.startMs, toMs: to });
    }
    if (quiet) quietSoFar = true;
    if (quiet && !placed) {
      // A scene with no music is not dead air: a faint breath of the room runs under it, one
      // long stretch for as long as the quiet lasts.
      const last = scene.shots[scene.shots.length - 1];
      const from = first.startMs;
      const to = last?.endMs ?? from;
      if (room && Math.abs(room.atMs + (room.durationMs ?? 0) - from) < 400) {
        room.durationMs = to - room.atMs;
      } else {
        room = {
          name: roomTone,
          atMs: from,
          durationMs: to - from,
          gainDb: ROOM_TONE_DB,
          pan: 0,
          seed: 0,
        };
        sfx.push(room);
      }
    }
    if (!quiet && music[music.length - 1]?.mood !== scene.mood) {
      music.push({
        mood: scene.mood,
        startMs: music.length === 0 && !quietSoFar ? 0 : first.startMs,
      });
    }
    for (const shot of scene.shots) {
      const start = shot.startMs ?? 0;
      const end = shot.endMs ?? start;
      const length = end - start;
      const place = placeSound(shot);
      if (place) {
        // One sound across shot after shot of the same place, not one that restarts at every cut.
        const gainDb = quiet ? AMBIENCE_DB.quiet : AMBIENCE_DB.music;
        const going = [...sfx]
          .reverse()
          .find(
            (c) =>
              c.name === place &&
              c.gainDb === gainDb &&
              c.durationMs !== undefined &&
              c.atMs + c.durationMs >= start - 400,
          );
        if (going) going.durationMs = Math.max(500, Math.round(end - going.atMs));
        else
          sfx.push({
            name: place,
            atMs: Math.round(start),
            durationMs: Math.max(500, Math.round(end - start)),
            gainDb,
            pan: 0,
            seed: sfx.length,
          });
      }
      for (const sound of shot.sfx) {
        const runs = sound.name === 'footsteps' || AMBIENT_SFX.includes(sound.name);
        const atMs =
          sound.at === 'middle'
            ? start + length / 2
            : sound.at === 'end'
              ? Math.max(start, end - 450)
              : start + 60;
        // A sound that runs on (a room's murmur, a clock) asked for by shot after shot is one
        // sound across them, not one that stops and starts again at every cut.
        const going = runs
          ? [...sfx]
              .reverse()
              .find(
                (c) =>
                  c.name === sound.name &&
                  c.gainDb === sound.gainDb &&
                  c.durationMs !== undefined &&
                  c.atMs + c.durationMs >= atMs - 400,
              )
          : undefined;
        if (going) {
          going.durationMs = Math.max(500, Math.round(end - going.atMs - 150));
          continue;
        }
        sfx.push({
          name: sound.name,
          atMs: Math.round(atMs),
          ...(runs ? { durationMs: Math.max(500, Math.round(end - atMs - 150)) } : {}),
          gainDb: sound.gainDb,
          pan: 0,
          seed: sfx.length,
        });
      }
    }
  }
  // The arrivals of the explainer graphics, unless the plan already has that sound there.
  for (const cue of graphicSoundCues(timed, words)) {
    if (sfx.some((c) => c.name === cue.name && Math.abs(c.atMs - cue.atMs) < 300)) continue;
    sfx.push({ ...cue, seed: sfx.length });
  }
  // A reveal: the music stops just before it and comes back with a hit as it lands.
  for (const shot of timed.scenes.flatMap((scene) => scene.shots)) {
    if (!shot.drop || shot.startMs === undefined) continue;
    const at = Math.round(shot.startMs);
    hush.push({ fromMs: Math.max(0, at - DROP_HUSH_MS), toMs: at + 20, sharp: true });
    sfx.push({ name: 'hit', atMs: at, gainDb: DROP_HIT_DB, pan: 0, seed: sfx.length });
  }
  hush.sort((a, b) => a.fromMs - b.fromMs);
  // A Short opens on a hit: viewers decide in the first second, by ear as well as by eye.
  if (
    score.profile === 'short' &&
    options.opens &&
    !sfx.some((c) => c.atMs < 150 && c.durationMs === undefined)
  ) {
    sfx.push({ name: 'hit', atMs: 0, gainDb: OPENING_HIT_DB, pan: 0, seed: sfx.length });
  }
  sfx.sort((a, b) => a.atMs - b.atMs);
  return { version: 1, score, music, sfx, musicGainDb: 0, hush };
}

// ------------------------------------------------------------------ joining the parts

/** Seconds the picture takes to go dark before a part that opens on a fade. */
export const JOIN_DIP_S = 0.2;

/** One finished piece of picture, as the join needs to know it. */
export type JoinPart = {
  /** How long it is, in seconds. */
  seconds: number;
  /** True when it opens on a fade from dark, so the piece before it has to go dark first. */
  fadesIn: boolean;
};

/**
 * The ffmpeg filter that joins the pictures of finished parts into one, in order. Where the
 * next piece opens on a fade from dark, the one before goes dark over its last frames, so the
 * join is one dip and not a cut to black. Inputs are the videos in order; the output is [v].
 * The sound is not joined: it is mixed once for the whole video (mergeSoundPlans).
 */
export function joinFilter(parts: readonly JoinPart[]): string {
  if (!parts.length) throw new Error('There is nothing to join.');
  const chains: string[] = [];
  parts.forEach((part, i) => {
    const next = parts[i + 1];
    const from = Math.max(0, part.seconds - JOIN_DIP_S).toFixed(3);
    chains.push(
      next?.fadesIn
        ? `[${i}:v]fade=t=out:st=${from}:d=${JOIN_DIP_S}[v${i}]`
        : `[${i}:v]null[v${i}]`,
    );
  });
  const labels = parts.map((_, i) => `[v${i}]`).join('');
  chains.push(
    parts.length > 1
      ? `${labels}concat=n=${parts.length}:v=1:a=0,format=yuv420p[v]`
      : '[v0]format=yuv420p[v]',
  );
  return chains.join(';');
}

/**
 * The voices of the parts as one voice for the whole video: every line and word moved to
 * where its part begins. `starts` is where each part begins in the joined video, in ms.
 */
export function joinTracks(tracks: readonly VoiceTrack[], starts: readonly number[]): VoiceTrack {
  const first = tracks[0];
  if (!first) throw new Error('There is no voice to join.');
  const shift = <T extends { startMs: number; endMs: number }>(items: readonly T[], by: number) =>
    items.map((item) => ({ ...item, startMs: item.startMs + by, endMs: item.endMs + by }));
  const last = tracks.length - 1;
  return {
    ...first,
    durationMs: (starts[last] ?? 0) + (tracks[last]?.durationMs ?? 0),
    lines: tracks.flatMap((t, i) => shift(t.lines, starts[i] ?? 0)),
    words: tracks.flatMap((t, i) => shift(t.words, starts[i] ?? 0)),
  };
}
