import { clamp } from './math';
import { seeded } from './random';
import type { ResolvedPose } from './types';

/**
 * Talking with the body (2026-10-14, for the Shorts): real people nod, tip the head and move a
 * hand on the words they lean on, and the ones listening react when something lands. Until now
 * only the mouth moved. These are small additions to whatever pose someone already holds, so
 * they never fight an action and never move the feet.
 */

export type SpokenWord = { startMs: number; endMs: number; emphasis?: boolean };

/**
 * How long a beat of the head or hand takes, and how far it goes. Biku, 2026-10-14, of the
 * first try (0.42 s, 4.5 degrees, a beat on every phrase): "it looks like they are tweaking".
 * So: fewer, slower and smaller.
 */
const BEAT_S = 0.9;
const NOD_DEG = 2.2;
const LEAN_DEG = 0.8;
const HAND_UP_DEG = 9;
const HAND_BEND_DEG = 14;
/** At least this long between two beats of the same speaker. */
const BEAT_GAP_MS = 1400;
/** A word that starts after this much silence opens a phrase, and gets a beat. */
const PHRASE_GAP_MS = 260;
/** A listener answers a stressed word this long after it, with a smaller nod. */
const LISTEN_DELAY_S = 0.35;
const LISTEN_NOD_DEG = 1.5;

/** A rise and fall over a beat that starts at `start` seconds: 0 outside it, 1 at its height. */
const bump = (t: number, start: number, length = BEAT_S): number => {
  const k = (t - start) / length;
  return k <= 0 || k >= 1 ? 0 : Math.sin(Math.PI * k) ** 2;
};

/**
 * The words a speaker leans on: the stressed ones, and the first of a phrase after a real
 * pause, never two within BEAT_GAP_MS of each other.
 */
export function beatWords(words: readonly SpokenWord[]): SpokenWord[] {
  const out: SpokenWord[] = [];
  words.forEach((w, i) => {
    const before = words[i - 1];
    const wanted = w.emphasis || (before !== undefined && w.startMs - before.endMs > PHRASE_GAP_MS);
    const last = out[out.length - 1];
    if (wanted && (!last || w.startMs - last.startMs >= BEAT_GAP_MS)) out.push(w);
  });
  return out;
}

/** How strong the beat is at a time, 0 to 1, from the strongest beat word under way. */
function beatAt(words: readonly SpokenWord[], t: number, delay = 0): number {
  let most = 0;
  for (const w of words) most = Math.max(most, bump(t, w.startMs / 1000 + delay));
  return most;
}

/** Whether a hand hangs free (not holding anything up, not raised): a hand that can beat. */
const hangs = (pose: ResolvedPose): boolean =>
  pose.hands.front.shape === 'mitten' && Math.abs(pose.arms.front.upper) < 45;

/**
 * Someone speaking: the head nods a little and the body leans in on each beat word; a hand
 * that hangs free lifts and turns on the stressed words. Each speaker beats in their own way.
 */
export function speakingBody(
  pose: ResolvedPose,
  frame: number,
  fps: number,
  words: readonly SpokenWord[],
  seed: number,
): ResolvedPose {
  if (words.length === 0) return pose;
  const t = frame / fps;
  const beats = beatWords(words);
  const nod = beatAt(beats, t);
  const stressed = beatAt(
    beats.filter((w) => w.emphasis),
    t,
  );
  // Some people talk with their hands more than others.
  const hands = 0.6 + 0.6 * seeded(`${seed}:gesture:hands`);
  const direction = seeded(`${seed}:gesture:nod`) < 0.5 ? 1 : -1;
  const out: ResolvedPose = {
    ...pose,
    headTilt: pose.headTilt + direction * NOD_DEG * nod,
    torsoLean: pose.torsoLean + LEAN_DEG * nod,
  };
  if (stressed > 0 && hangs(pose)) {
    const lift = clamp(stressed * hands, 0, 1);
    out.arms = {
      ...pose.arms,
      front: {
        ...pose.arms.front,
        upper: pose.arms.front.upper + HAND_UP_DEG * lift,
        lower: pose.arms.front.lower + HAND_BEND_DEG * lift,
      },
    };
  }
  return out;
}

/**
 * Someone listening while another speaks: on some of the speaker's stressed words, a small nod
 * a moment later, as a listener takes a point in. Who nods on which word is their own.
 */
export function listeningBody(
  pose: ResolvedPose,
  frame: number,
  fps: number,
  words: readonly SpokenWord[],
  seed: number,
): ResolvedPose {
  const taken = words.filter((w, i) => w.emphasis && seeded(`${seed}:listen:${i}`) < 0.35);
  if (taken.length === 0) return pose;
  const nod = beatAt(taken, frame / fps, LISTEN_DELAY_S);
  return nod > 0 ? { ...pose, headTilt: pose.headTilt + LISTEN_NOD_DEG * nod } : pose;
}
