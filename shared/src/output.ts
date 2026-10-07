import { z } from 'zod';
import { SIZE_NAMES, VERTICAL_CUTS } from './plugins.schema';
import type { SizeName, VerticalCut } from './plugins.schema';
import { clock } from './qa';
import type { QaCheck } from './qa.schema';
import type { SoundPlan } from './sound.schema';

/**
 * The output of a video (Phase 4F): which shapes it is delivered in, how its parts become one
 * file with one sound, whether two renders show the same pictures, and the page Biku reads
 * that says what to upload where.
 */

/** What a video is delivered as. A page has its usual answer; any one video may have its own. */
export const outputChoiceSchema = z
  .object({
    sizes: z.array(z.enum(SIZE_NAMES)).min(1),
    vertical: z.enum(VERTICAL_CUTS),
  })
  .strict()
  .refine((c) => new Set(c.sizes).size === c.sizes.length, { message: 'a size is listed twice' });
export type OutputChoice = z.infer<typeof outputChoiceSchema>;

/**
 * What the video sites take, checked in their own help pages on 2026-10-07. YouTube shows a
 * square or vertical video of up to three minutes as a Short, and wants a cover of 1280x720
 * under 2 MB.
 */
export const SHORTS_MAX_S = 180;
export const COVER_WIDE = { width: 1280, height: 720, maxBytes: 2_000_000 } as const;

/** One file to deliver: a shape, and the parts of the video it is made of. */
export type Cut = { size: SizeName; kind: VerticalCut; parts: number[] };

/** The files a choice asks for, for a video of so many parts. */
export function outputCuts(choice: OutputChoice, parts: number): Cut[] {
  const all = Array.from({ length: parts }, (_, i) => i + 1);
  return choice.sizes.map((size) =>
    size === '9:16' && choice.vertical === 'teaser' && parts > 1
      ? { size, kind: 'teaser', parts: [1] }
      : { size, kind: 'full', parts: all },
  );
}

/** Where a cut is put up, in plain words. */
export function cutUse(cut: Cut, seconds: number): string {
  if (cut.size === '16:9') return 'YouTube, as a normal wide video';
  if (cut.size === '4:5') return 'a Facebook or Instagram feed post';
  // The vertical video is for Facebook Reels; it can go up as a YouTube Short too, which
  // Biku does only when he says so (2026-10-07).
  const short =
    seconds <= SHORTS_MAX_S
      ? 'Facebook Reels (it also fits as a YouTube Short, if you want one)'
      : `Facebook Reels (it is over ${SHORTS_MAX_S / 60} minutes, too long for a YouTube Short)`;
  return cut.kind === 'teaser' ? `${short}, as a teaser for the full video` : short;
}

/**
 * The sound plans of the parts as one plan for the whole video. Music that is in the same
 * mood on both sides of a join plays on across it; a change of mood blends as it does inside
 * a part. `startsMs` is where each part begins in the whole video.
 */
export function mergeSoundPlans(
  plans: readonly SoundPlan[],
  startsMs: readonly number[],
): SoundPlan {
  const music: SoundPlan['music'] = [];
  const sfx: SoundPlan['sfx'] = [];
  plans.forEach((plan, i) => {
    const by = startsMs[i] ?? 0;
    for (const segment of plan.music) {
      if (music[music.length - 1]?.mood === segment.mood) continue;
      music.push({ ...segment, startMs: segment.startMs + by });
    }
    for (const cue of plan.sfx) sfx.push({ ...cue, atMs: cue.atMs + by, seed: sfx.length });
  });
  return { version: 1, music, sfx, musicGainDb: plans[0]?.musicGainDb ?? 0 };
}

// ------------------------------------------------------------------ the same pictures

/**
 * The ffmpeg filter that compares two videos frame by frame: both small and gray, one taken
 * from the other, and what is left averaged over small squares. It prints the strongest square
 * of every frame (0 to 255). Making a video file again leaves a few; a caption, a hand or a
 * bag that is in one and not in the other leaves dozens.
 */
export function pictureDifferenceFilter(size: { width: number; height: number }): string {
  // The same number of squares whatever the shape: 240 wide for a 16:9 frame, 135 for a 9:16.
  const w = 2 * Math.round(Math.sqrt((240 * 135 * size.width) / size.height) / 2);
  const small = Math.max(2, Math.round(w / 8));
  return (
    `[0:v]scale=${w}:-2:flags=area,format=gray[a];[1:v]scale=${w}:-2:flags=area,format=gray[b];` +
    `[a][b]blend=all_mode=difference,scale=${small}:-2:flags=area,signalstats,` +
    'metadata=print:key=lavfi.signalstats.YMAX'
  );
}

/** The strongest difference of each frame, from what the filter printed. */
export function parsePictureDifference(log: string): number[] {
  return [...log.matchAll(/lavfi\.signalstats\.YMAX=(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]));
}

/**
 * A frame whose strongest square differs by more than this shows something else. Measured on
 * the sample story (2026-10-07), wide and tall: two final renders of the same pictures differ
 * by 3 at most, a preview and its final by 14 (thin lines drawn at half size), while the
 * smallest real difference found, the top of a bag behind a caption, left 19, and a caption
 * left 44.
 */
export const SAME_PICTURE = 16;

/** The stretches in which two videos show different pictures. */
export function differingStretches(
  values: readonly number[],
  fps: number,
  limit = SAME_PICTURE,
): Array<{ fromMs: number; toMs: number; worst: number }> {
  const out: Array<{ from: number; to: number; worst: number }> = [];
  values.forEach((v, frame) => {
    if (v <= limit) return;
    const last = out[out.length - 1];
    if (last && frame - last.to <= 2) {
      last.to = frame;
      last.worst = Math.max(last.worst, v);
    } else out.push({ from: frame, to: frame, worst: v });
  });
  return out.map((s) => ({
    fromMs: Math.round((s.from / fps) * 1000),
    toMs: Math.round(((s.to + 1) / fps) * 1000),
    worst: s.worst,
  }));
}

/**
 * The pictures are the ones that were looked at: this video against the one Claude looked at,
 * frame for frame. With this, a look taken at a preview stands for the final render of the
 * same plan, and one taken at an earlier render stands for a later one that shows the same.
 */
export function samePicturesCheck(input: {
  /** The video that was looked at, and the one being checked. */
  looked: string;
  video: string;
  /** The strongest difference of each frame; null when the two could not be compared. */
  values: readonly number[] | null;
  /** How many frames each has. */
  frames: { looked: number; video: number };
  fps: number;
}): QaCheck {
  const { looked, video, values, frames, fps } = input;
  const findings: QaCheck['findings'] = [];
  const stretches = values ? differingStretches(values, fps) : [];
  if (!values) {
    findings.push({ level: 'problem', text: `"${video}" could not be compared with "${looked}"` });
  } else if (Math.abs(frames.looked - frames.video) > 1) {
    findings.push({
      level: 'problem',
      text: `"${video}" is not as long as "${looked}", the video that was looked at; look again`,
    });
  } else {
    for (const s of stretches.slice(0, 6)) {
      findings.push({
        level: 'problem',
        atMs: s.fromMs,
        text: `the picture is not the one that was looked at, from ${clock(s.fromMs)} for ${((s.toMs - s.fromMs) / 1000).toFixed(1)} s; look at the stills and strips again`,
      });
    }
  }
  const worst = values?.length ? Math.max(...values) : 0;
  return {
    id: 'same-pictures',
    title: 'The pictures are the ones that were looked at',
    by: 'measured',
    detail: `Claude looked at "${looked}"; every frame of this video was compared with it (the strongest difference is ${Math.round(worst)} of 255; over ${SAME_PICTURE} would be a different picture)`,
    findings,
  };
}

// ------------------------------------------------------------------ what Claude saw of the output

const yesOrNo = z.union([z.literal('ok'), z.object({ no: z.string().min(3) }).strict()]);

/** Claude's look at a delivered file: each join between parts, and the cover. */
export const outputLookSchema = z
  .object({
    version: z.literal(1),
    video: z.string().min(1),
    joins: yesOrNo,
    cover: yesOrNo,
    notes: z.array(z.string().min(3)).default([]),
  })
  .strict();
export type OutputLook = z.infer<typeof outputLookSchema>;

/** The joins and the cover, looked at. A look at another file does not count. */
export function outputLookCheck(input: {
  look: OutputLook | null;
  video: string;
  joins: number;
}): QaCheck {
  const { look, video, joins } = input;
  const findings: QaCheck['findings'] = [];
  if (!look) {
    findings.push({
      level: 'problem',
      text: 'the joins and the cover have not been looked at yet',
    });
  } else if (look.video !== video) {
    findings.push({
      level: 'problem',
      text: `the look was at "${look.video}", but the file is now "${video}"; look again`,
    });
  } else {
    if (look.joins !== 'ok') findings.push({ level: 'problem', text: `a join: ${look.joins.no}` });
    if (look.cover !== 'ok')
      findings.push({ level: 'problem', text: `the cover: ${look.cover.no}` });
  }
  return {
    id: 'output-look',
    title: joins ? 'Every join and the cover hold up' : 'The cover holds up',
    by: 'looked',
    detail: joins
      ? `a strip of frames across ${joins === 1 ? 'the join' : `each of the ${joins} joins`} between parts, and the cover picture`
      : 'the cover picture',
    findings,
  };
}

// ------------------------------------------------------------------ the page Biku reads

export type Delivered = {
  cut: Cut;
  /** File names, in the run's out folder. */
  video: string;
  captions: string;
  cover: string;
  seconds: number;
  checks: QaCheck[];
  /** The part videos it is made of. */
  from: string[];
};

const SHAPES: Record<string, string> = {
  '16:9': 'Wide',
  '9:16': 'Vertical',
  '4:5': 'Nearly square',
};
const lengthOf = (seconds: number): string => {
  const s = Math.round(seconds);
  return s < 60 ? `${s} seconds` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
};

/** What was made and where it goes, as a page: the files first, then what is left to do. */
export function deliveryPage(input: {
  title: string;
  madeOn: string;
  delivered: readonly Delivered[];
  /** Cuts that could not be made yet, and why. */
  waiting: ReadonlyArray<{ cut: Cut; why: string[] }>;
  /** Things worth Biku's eye, gathered from the checks of the parts. */
  notes: readonly string[];
}): string {
  const { title, madeOn, delivered, waiting, notes } = input;
  const problems = delivered.flatMap((d) =>
    d.checks.flatMap((c) =>
      c.findings.filter((f) => f.level === 'problem').map((f) => `${d.video}: ${f.text}`),
    ),
  );
  const ready = delivered.length > 0 && !problems.length && !waiting.length;
  const out: string[] = [
    `# ${title}: what to upload`,
    '',
    ready
      ? '**Ready to upload.** Every file below passed its checks.'
      : delivered.length
        ? '**Not all ready yet.** See "Still to do" below.'
        : '**Nothing to upload yet.** See "Still to do" below.',
    '',
    `Made on ${madeOn}. Everything is in this run's \`out\` folder.`,
    '',
  ];
  for (const d of delivered) {
    const name = d.cut.kind === 'teaser' ? 'teaser' : 'full video';
    out.push(
      `## ${SHAPES[d.cut.size] ?? d.cut.size} ${name} (${lengthOf(d.seconds)})`,
      '',
      `For ${cutUse(d.cut, d.seconds)}.`,
      '',
      `- Video: \`${d.video}\``,
      `- Cover picture: \`${d.cover}\``,
      `- Captions file: \`${d.captions}\``,
      `- Title to type in: ${title}`,
      '',
      '| Check | Result |',
      '| --- | --- |',
      ...d.checks.map(
        (c) =>
          `| ${c.title} | ${c.findings.some((f) => f.level === 'problem') ? 'NOT passed' : 'passed'}: ${c.detail} |`,
      ),
      '',
    );
  }
  if (problems.length || waiting.length) {
    out.push('## Still to do', '');
    for (const p of problems) out.push(`- ${p}`);
    for (const w of waiting) {
      const name = `${SHAPES[w.cut.size] ?? w.cut.size} ${w.cut.kind === 'teaser' ? 'teaser' : 'full video'}`;
      for (const why of w.why) out.push(`- ${name}: ${why}`);
    }
    out.push('');
  }
  if (notes.length) out.push('## Worth a second look', '', ...notes.map((n) => `- ${n}`), '');
  out.push(
    '## What these checks cannot judge',
    '',
    '- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.',
    '- Whether the story holds you.',
    '',
  );
  return out.join('\n');
}
