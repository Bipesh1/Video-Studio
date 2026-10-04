import type { VoiceTrack } from '@studio/shared';
import { CUT_LEAD_MS } from './lookTestPlan';

export type ShotTime = { id: string; startMs: number; endMs: number };

/**
 * Where each shot starts and ends, in ms, for a video whose shots each open on a voice line
 * (no React, so the CLI can use it). A shot runs until the next shot's line, so one shot may
 * cover several lines.
 */
export function shotTimesFor(track: VoiceTrack, shotLines: readonly string[]): ShotTime[] {
  const starts = shotLines.map((id, i) => {
    const line = track.lines.find((l) => l.id === id);
    if (!line) throw new Error(`The shot plan needs voice line "${id}"`);
    return i === 0 ? 0 : Math.max(0, line.startMs - CUT_LEAD_MS);
  });
  return shotLines.map((id, i) => ({
    id,
    startMs: starts[i] ?? 0,
    endMs: starts[i + 1] ?? track.durationMs,
  }));
}
