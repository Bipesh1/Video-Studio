import type { SfxCue, SoundPlan } from './sound.schema';
import { AMBIENT_SFX } from './sound.schema';
import type { World } from './storyboard.check';
import { NARRATOR, plainWords } from './storyboard.schema';
import type { Storyboard } from './storyboard.schema';
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

/** The voice of whoever speaks a line: the narrator's, a cast member's, or their card's. */
function voiceOf(sb: Storyboard, speaker: string, world: World) {
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
    lines: lines.map((line) => {
      const voice = voiceOf(part, line.speaker, world);
      if (!voice) throw new Error(`"${line.speaker}" speaks line "${line.id}" and has no voice.`);
      return {
        id: line.id,
        speaker: line.speaker,
        voice: voice.kokoroVoice,
        text: line.text,
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
 * Footsteps and the ambient effects run for the length of their shot.
 */
/** How loud the breath of the room is under a scene with no music, against an effect's usual level. */
const ROOM_TONE_DB = -6;

export function soundPlanFor(timed: Storyboard): SoundPlan {
  const music: SoundPlan['music'] = [];
  const sfx: SfxCue[] = [];
  let quietSoFar = false;
  let room: SfxCue | null = null;
  for (const scene of timed.scenes) {
    const first = scene.shots[0];
    if (first?.startMs === undefined)
      throw new Error('The shots have no times yet. Make the voice first.');
    // A quiet scene has no music, as long as none has begun. Music that comes in after a
    // quiet opening comes in where its scene starts.
    const quiet = scene.quiet === true && music.length === 0;
    if (quiet) {
      quietSoFar = true;
      // A scene with no music is not dead air: a faint breath of the room runs under it, one
      // long stretch for as long as the quiet lasts.
      const last = scene.shots[scene.shots.length - 1];
      const from = first.startMs;
      const to = last?.endMs ?? from;
      if (room && Math.abs(room.atMs + (room.durationMs ?? 0) - from) < 400) {
        room.durationMs = to - room.atMs;
      } else {
        room = {
          name: 'wind',
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
      for (const sound of shot.sfx) {
        const runs = sound.name === 'footsteps' || AMBIENT_SFX.includes(sound.name);
        const atMs =
          sound.at === 'middle'
            ? start + length / 2
            : sound.at === 'end'
              ? Math.max(start, end - 450)
              : start + 60;
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
  return { version: 1, music, sfx, musicGainDb: 0 };
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
