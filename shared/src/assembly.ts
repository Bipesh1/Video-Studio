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
  return {
    ...sb,
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
export function soundPlanFor(timed: Storyboard): SoundPlan {
  const music: SoundPlan['music'] = [];
  const sfx: SfxCue[] = [];
  for (const scene of timed.scenes) {
    const first = scene.shots[0];
    if (first?.startMs === undefined)
      throw new Error('The shots have no times yet. Make the voice first.');
    if (music[music.length - 1]?.mood !== scene.mood) {
      music.push({ mood: scene.mood, startMs: music.length === 0 ? 0 : first.startMs });
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
