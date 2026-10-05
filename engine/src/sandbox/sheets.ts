/** Sandbox sheets for the draw, look and fix loop (Part 2, section 6). No React here, so the CLI can import it. */
export const STILL_SHEETS = [
  'expressions',
  'turns',
  'poses',
  'hands',
  'walk-strip',
  'bg-simple',
  'bg-atmospheric',
  'bg-palettes',
  'costume',
  'identity',
  'hair-turns',
  'new-expressions',
  'clothes',
  'costumes-b',
  'ages',
  'people',
] as const;
export const VIDEO_SHEETS = { walk: 4, motion: 7, atmos: 4 } as const;
export const BACKGROUNDS = ['light', 'dark'] as const;

export type StillSheet = (typeof STILL_SHEETS)[number];
export type VideoSheet = keyof typeof VIDEO_SHEETS;
export type SheetName = StillSheet | VideoSheet;
export type SandboxBg = (typeof BACKGROUNDS)[number];

export const stillId = (sheet: StillSheet, bg: SandboxBg) => `Sandbox-${sheet}-${bg}`;
export const videoId = (sheet: VideoSheet) => `Sandbox-${sheet}`;
