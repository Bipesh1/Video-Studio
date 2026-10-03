import type { VoiceTrack } from '@studio/shared';

/** The look test's shots, in order, each tied to the voice line it shows (no React, so the CLI can use it). */
export const SHOT_LINES = ['n1', 'd1', 'n2', 'n3'] as const;
export type ShotId = (typeof SHOT_LINES)[number];

export const SHOT_TITLES: Record<ShotId, string> = {
  n1: 's1 atmospheric, costumed ruler',
  d1: 's2 simple night, two characters, Tom speaks',
  n2: 's3 close-up, strong emotion and an effect',
  n3: 's4 walking shot',
};

/** Cut this many ms before a line starts, so the picture leads the words slightly. */
export const CUT_LEAD_MS = 250;

/** Where each shot starts and ends, in ms. Shot length always comes from the voice timings. */
export function shotTimes(
  track: VoiceTrack,
): Array<{ id: ShotId; startMs: number; endMs: number }> {
  const starts = SHOT_LINES.map((id, i) => {
    const line = track.lines.find((l) => l.id === id);
    if (!line) throw new Error(`The look test needs voice line "${id}"`);
    return i === 0 ? 0 : Math.max(0, line.startMs - CUT_LEAD_MS);
  });
  return SHOT_LINES.map((id, i) => ({
    id,
    startMs: starts[i] ?? 0,
    endMs: starts[i + 1] ?? track.durationMs,
  }));
}
