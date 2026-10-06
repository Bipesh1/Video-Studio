import type { Format } from './plugins.schema';
import { CHAPTER_MAX_S } from './plugins.schema';
import { MOTION_CHECK, QA_QUESTIONS, STORY_CHECK, STYLE_CHECK } from './qa.schema';
import type { QaAnswer, QaCheck, QaFinding, QaLook, QaQuestion, QaReport } from './qa.schema';
import { LOUDNESS_TARGET } from './sound.schema';
import type { MixReport } from './sound.schema';
import { plainWords } from './storyboard.schema';
import type { Storyboard } from './storyboard.schema';
import type { VoiceTrack } from './voice.schema';

/**
 * The self-check's own checks on a finished part (Part 2, section 12, step 1): the file
 * plays, the length is right, picture and voice are in step, there is no dead silence, the
 * sound is at its level. Plus what Claude's own look found, and the report page. The checks
 * of the pictures themselves are in the engine (stage/measure.ts), which knows where things
 * are drawn.
 */

/** A time in a part the way a person says it: 0:07. */
export const clock = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const seconds = (ms: number, digits = 1): string => `${(ms / 1000).toFixed(digits)} s`;
const problem = (text: string, at: Partial<QaFinding> = {}): QaFinding => ({
  level: 'problem',
  ...at,
  text,
});
const note = (text: string, at: Partial<QaFinding> = {}): QaFinding => ({
  level: 'note',
  ...at,
  text,
});

export const checkResult = (check: QaCheck): 'passed' | 'noted' | 'failed' =>
  check.findings.some((f) => f.level === 'problem')
    ? 'failed'
    : check.findings.length
      ? 'noted'
      : 'passed';

// ------------------------------------------------------------------ reading ffmpeg and ffprobe

export type VideoProbe = {
  seconds: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  pixelFormat: string;
  audioCodec: string | null;
  audioSeconds: number | null;
};

/** What `ffprobe -print_format json -show_streams -show_format` says about a video file. */
export function parseProbe(json: string): VideoProbe | null {
  type Stream = Record<string, string | number | undefined>;
  let data: { streams?: Stream[]; format?: { duration?: string } };
  try {
    data = JSON.parse(json) as typeof data;
  } catch {
    return null;
  }
  const video = data.streams?.find((s) => s['codec_type'] === 'video');
  const audio = data.streams?.find((s) => s['codec_type'] === 'audio');
  if (!video) return null;
  const [n, d] = String(video['avg_frame_rate'] ?? '0/1')
    .split('/')
    .map(Number);
  return {
    seconds: Number(video['duration'] ?? data.format?.duration ?? 0),
    width: Number(video['width'] ?? 0),
    height: Number(video['height'] ?? 0),
    fps: d ? (n ?? 0) / d : 0,
    videoCodec: String(video['codec_name'] ?? ''),
    pixelFormat: String(video['pix_fmt'] ?? ''),
    audioCodec: audio ? String(audio['codec_name'] ?? '') : null,
    audioSeconds: audio ? Number(audio['duration'] ?? data.format?.duration ?? 0) : null,
  };
}

/** The summary ffmpeg's `ebur128=peak=true` filter prints: loudness of the whole file and its true peak. */
export function parseLoudness(log: string): { lufs: number; truePeakDb: number } | null {
  const summary = log.slice(Math.max(0, log.lastIndexOf('Summary:')));
  const lufs = /I:\s*(-?[\d.]+)\s*LUFS/.exec(summary);
  const peak = /Peak:\s*(-?[\d.]+|-inf)\s*dBFS/.exec(summary);
  if (!lufs || !peak) return null;
  return {
    lufs: Number(lufs[1]),
    truePeakDb: peak[1] === '-inf' ? -Infinity : Number(peak[1]),
  };
}

/** The stretches ffmpeg's `silencedetect` filter found, in ms. One still open at the end runs to `endMs`. */
export function parseSilences(
  log: string,
  endMs: number,
): Array<{ startMs: number; endMs: number }> {
  const out: Array<{ startMs: number; endMs: number }> = [];
  let open: number | null = null;
  for (const line of log.split(/\r?\n/)) {
    const start = /silence_start:\s*(-?[\d.]+)/.exec(line);
    const end = /silence_end:\s*(-?[\d.]+)/.exec(line);
    if (start) open = Math.max(0, Number(start[1]) * 1000);
    if (end && open !== null) {
      out.push({ startMs: Math.round(open), endMs: Math.round(Number(end[1]) * 1000) });
      open = null;
    }
  }
  if (open !== null) out.push({ startMs: Math.round(open), endMs });
  return out;
}

// ------------------------------------------------------------------ the measured checks

/** The file plays: right size and speed, picture and sound both there, nothing broken inside. */
export function fileCheck(input: {
  probe: VideoProbe | null;
  /** What ffmpeg complained of while playing the whole file through; empty when nothing. */
  decodeErrors: string;
  size: { width: number; height: number };
  fps: number;
}): QaCheck {
  const { probe, decodeErrors, size, fps } = input;
  const findings: QaFinding[] = [];
  if (!probe) {
    findings.push(problem('the video file could not be opened'));
  } else {
    if (probe.width !== size.width || probe.height !== size.height) {
      findings.push(
        problem(
          `the picture is ${probe.width}x${probe.height}; it should be ${size.width}x${size.height}`,
        ),
      );
    }
    if (Math.abs(probe.fps - fps) > 0.01) {
      findings.push(problem(`it shows ${probe.fps} pictures a second; it should be ${fps}`));
    }
    if (probe.videoCodec !== 'h264' || !/^yuvj?420p$/.test(probe.pixelFormat)) {
      findings.push(
        problem(
          `the picture is stored as ${probe.videoCodec} ${probe.pixelFormat}, which some phones cannot play; it should be h264 yuv420p`,
        ),
      );
    }
    if (probe.audioCodec === null) findings.push(problem('the file has no sound in it'));
    else if (probe.audioCodec !== 'aac') {
      findings.push(problem(`the sound is stored as ${probe.audioCodec}; it should be aac`));
    }
    if (probe.audioSeconds !== null && Math.abs(probe.audioSeconds - probe.seconds) > 0.15) {
      const by = Math.abs(probe.audioSeconds - probe.seconds).toFixed(2);
      findings.push(
        problem(
          `the sound is ${by} s ${probe.audioSeconds < probe.seconds ? 'shorter' : 'longer'} than the picture`,
        ),
      );
    }
  }
  const first = decodeErrors.split(/\r?\n/).find((l) => l.trim());
  if (first) findings.push(problem(`the file is damaged inside: ${first.trim().slice(0, 160)}`));
  return {
    id: 'plays',
    title: 'The file plays',
    by: 'measured',
    detail: probe
      ? `${probe.width}x${probe.height}, ${Math.round(probe.fps)} pictures a second, ${probe.seconds.toFixed(1)} s, picture and sound both there; played through from start to finish`
      : 'the file could not be read',
    findings,
  };
}

/** The length is right: a part is at most a minute, and a video in one part fits its format. */
export function lengthCheck(input: {
  seconds: number;
  parts: number;
  format: Pick<Format, 'lengthRange' | 'name'> | null;
}): QaCheck {
  const { seconds: s, parts, format } = input;
  const findings: QaFinding[] = [];
  if (s > CHAPTER_MAX_S + 0.05) {
    findings.push(
      problem(`the part is ${s.toFixed(1)} s long; a part may be up to ${CHAPTER_MAX_S} s`),
    );
  }
  if (s < 5) findings.push(problem(`the part is only ${s.toFixed(1)} s long`));
  if (parts === 1 && format) {
    const { min, max } = format.lengthRange;
    if (s < min || s > max) {
      findings.push(
        problem(
          `the video is ${s.toFixed(1)} s long; a ${format.name.toLowerCase()} video runs ${min} to ${max} s`,
        ),
      );
    }
  }
  return {
    id: 'length',
    title: 'The length is right',
    by: 'measured',
    detail: `${s.toFixed(1)} s; a part may be up to ${CHAPTER_MAX_S} s`,
    findings,
  };
}

/** How far the voice's words may run past the picture that shows them, ms. */
const WORDS_PAST_PICTURE_MS = 80;

/**
 * Picture and voice are in step: the shots follow each other with no gap from the first frame
 * to the last, the voice speaks the words the plan has, and each line's words are heard while
 * its own shots are on screen.
 */
export function stepCheck(input: {
  /** The part's storyboard, with the voice's times in its shots. */
  storyboard: Storyboard;
  track: VoiceTrack;
  /** How long the finished picture is, in seconds. */
  videoSeconds: number;
}): QaCheck {
  const { storyboard, track, videoSeconds } = input;
  const findings: QaFinding[] = [];
  const shots = storyboard.scenes.flatMap((scene) => scene.shots);
  const untimed = shots.filter((s) => s.startMs === undefined || s.endMs === undefined);
  for (const s of untimed) {
    findings.push(problem(`shot "${s.id}" has no time from the voice yet`, { shot: s.id }));
  }
  if (!untimed.length) {
    const first = shots[0];
    if (first && (first.startMs ?? 0) > 1) {
      findings.push(problem(`the first shot starts ${seconds(first.startMs ?? 0, 2)} in`));
    }
    shots.forEach((s, i) => {
      const before = shots[i - 1];
      if (!before) return;
      const gap = (s.startMs ?? 0) - (before.endMs ?? 0);
      if (Math.abs(gap) > 1) {
        findings.push(
          problem(
            `shots "${before.id}" and "${s.id}" ${gap > 0 ? 'leave a gap of' : 'overlap by'} ${seconds(Math.abs(gap), 2)}`,
            { shot: s.id, atMs: s.startMs ?? 0 },
          ),
        );
      }
    });
    const end = shots[shots.length - 1]?.endMs ?? 0;
    if (Math.abs(end - track.durationMs) > 40) {
      findings.push(
        problem(
          `the last shot ends at ${seconds(end, 2)} but the voice runs to ${seconds(track.durationMs, 2)}; put the voice's times in again`,
        ),
      );
    }
    if (Math.abs(videoSeconds * 1000 - track.durationMs) > 70) {
      findings.push(
        problem(
          `the picture is ${videoSeconds.toFixed(2)} s long but the sound is ${seconds(track.durationMs, 2)}; render the video again`,
        ),
      );
    }
  }
  for (const scene of storyboard.scenes) {
    for (const line of scene.lines) {
      const spoken = track.lines.find((l) => l.id === line.id);
      if (!spoken) {
        findings.push(problem(`the voice never says line "${line.id}"; make the voice again`));
        continue;
      }
      if (plainWords(spoken.text) !== plainWords(line.text)) {
        findings.push(
          problem(
            `the voice says other words than the plan for line "${line.id}"; make the voice again`,
          ),
        );
      }
      const of = scene.shots.filter((s) => s.line === line.id);
      const words = track.words.filter((w) => w.lineId === line.id);
      const from = of[0]?.startMs;
      const to = of[of.length - 1]?.endMs;
      const firstWord = words[0];
      const lastWord = words[words.length - 1];
      if (from === undefined || to === undefined || !firstWord || !lastWord) continue;
      if (firstWord.startMs < from - 20) {
        findings.push(
          problem(
            `line "${line.id}" starts ${seconds(from - firstWord.startMs, 2)} before its picture comes on`,
            { atMs: firstWord.startMs },
          ),
        );
      }
      if (lastWord.endMs > to + WORDS_PAST_PICTURE_MS) {
        findings.push(
          problem(
            `the words of line "${line.id}" run ${seconds(lastWord.endMs - to, 2)} past their picture`,
            { atMs: to },
          ),
        );
      }
    }
  }
  return {
    id: 'in-step',
    title: 'Picture and voice are in step',
    by: 'measured',
    detail: `${shots.length} shots end to end with no gap, each line heard while its own pictures are on screen; picture and voice end together at ${seconds(track.durationMs)}`,
    findings,
  };
}

/** A pause between words this long is worth a look, ms. */
const LONG_PAUSE_MS = 3000;

/** No dead silence: the sound never drops out, and nobody is quiet for too long. */
export function silenceCheck(input: {
  /** Stretches of the finished file with no sound at all. */
  silences: ReadonlyArray<{ startMs: number; endMs: number }>;
  track: VoiceTrack;
}): QaCheck {
  const findings: QaFinding[] = input.silences.map((s) =>
    problem(`dead silence for ${seconds(s.endMs - s.startMs)} from ${clock(s.startMs)}`, {
      atMs: s.startMs,
    }),
  );
  let longest = 0;
  const words = input.track.words;
  words.forEach((w, i) => {
    const before = words[i - 1];
    if (!before) return;
    const pause = w.startMs - before.endMs;
    longest = Math.max(longest, pause);
    if (pause > LONG_PAUSE_MS) {
      findings.push(
        note(`nobody speaks for ${seconds(pause)} from ${clock(before.endMs)}`, {
          atMs: before.endMs,
        }),
      );
    }
  });
  return {
    id: 'silence',
    title: 'There is no dead silence',
    by: 'measured',
    detail: `the sound never drops out; the longest pause between words is ${seconds(longest)}`,
    findings,
  };
}

/** How far over the true-peak limit a finished file may measure: the last step of making it moves peaks a hair. */
const PEAK_SLACK_DB = 0.05;

/** The sound is at its level: loudness on target and no peak over the limit, in the finished file. */
export function loudnessCheck(input: {
  measured: { lufs: number; truePeakDb: number } | null;
}): QaCheck {
  const { lufs, toleranceLu, truePeakDb } = LOUDNESS_TARGET;
  const findings: QaFinding[] = [];
  const m = input.measured;
  if (!m) findings.push(problem('the loudness of the finished file could not be measured'));
  else {
    if (Math.abs(m.lufs - lufs) > toleranceLu) {
      findings.push(
        problem(
          `the loudness is ${m.lufs} LUFS; it should be ${lufs}, give or take ${toleranceLu}`,
        ),
      );
    }
    if (m.truePeakDb > truePeakDb + PEAK_SLACK_DB) {
      findings.push(
        problem(
          `the highest peak is ${m.truePeakDb} dB; it must stay at or under ${truePeakDb} dB`,
        ),
      );
    }
  }
  return {
    id: 'loudness',
    title: 'The sound is at the right level',
    by: 'measured',
    detail: m
      ? `loudness ${m.lufs.toFixed(1)} LUFS, the level video sites play at (the target is ${lufs}, give or take ${toleranceLu}); highest peak ${m.truePeakDb.toFixed(1)} dB (the limit is ${truePeakDb})`
      : 'not measured',
    findings,
  };
}

/** An effect that lands on words must sit at least this far under the voice, dB. */
export const EFFECT_UNDER_VOICE_DB = -4;
/** Music under a speaking voice must sit at least this far under it, dB. */
export const MUSIC_UNDER_VOICE_DB = -12;

/** Words are never drowned: effects and music sit under the voice while someone speaks. */
export function wordsHeardCheck(input: { mix: MixReport | null; track: VoiceTrack }): QaCheck {
  const { mix, track } = input;
  const findings: QaFinding[] = [];
  if (!mix) {
    findings.push(problem('there is no report of the mix; mix the sound again'));
  } else {
    if (Math.abs(mix.durationMs - track.durationMs) > 40) {
      findings.push(problem('the mix is not of this voice; mix the sound again'));
    }
    for (const fx of mix.sfx) {
      if (fx.overVoice && fx.levelAgainstVoiceDb > EFFECT_UNDER_VOICE_DB) {
        findings.push(
          problem(
            `the ${fx.name} at ${clock(fx.atMs)} is as loud as the words it lands on (${fx.levelAgainstVoiceDb} dB against the voice)`,
            { atMs: fx.atMs },
          ),
        );
      }
    }
    if (mix.musicUnderVoiceDb !== null && mix.musicUnderVoiceDb > MUSIC_UNDER_VOICE_DB) {
      findings.push(
        problem(
          `the music is only ${Math.abs(mix.musicUnderVoiceDb)} dB under the voice while someone speaks`,
        ),
      );
    }
  }
  const loudest = mix?.sfx.filter((f) => f.overVoice).map((f) => f.levelAgainstVoiceDb) ?? [];
  const effects = mix
    ? mix.sfx.length
      ? `${mix.sfx.length} sound effects${loudest.length ? `, the loudest of those over words ${Math.abs(Math.max(...loudest))} dB under the voice` : ', none of them over words'}`
      : 'no sound effects'
    : 'no mix report';
  const music =
    mix && mix.musicUnderVoiceDb !== null
      ? `; the music sits ${Math.abs(mix.musicUnderVoiceDb)} dB under the voice while someone speaks`
      : '';
  return {
    id: 'words-heard',
    title: 'Nothing drowns the words',
    by: 'measured',
    detail: `${effects}${music}`,
    findings,
  };
}

// ------------------------------------------------------------------ what Claude saw

const questionText = (id: string): string => QA_QUESTIONS.find((q) => q.id === id)?.text ?? id;

/** The checks made by looking: every still, every strip of frames, and the playbook. */
export function lookChecks(input: {
  look: QaLook | null;
  /** The video that has to have been looked at. */
  video: string;
  /** The shots, one still each. */
  shots: readonly string[];
  /** The strips of frames across each move and cut, by name. */
  strips: readonly string[];
}): QaCheck[] {
  const { look, video, shots, strips } = input;
  const stale =
    look === null
      ? 'the stills and the strips of frames have not been looked at yet'
      : look.video !== video
        ? `the look was at "${look.video}", but the video is now "${video}"; look again`
        : null;
  const answered = (
    ids: readonly string[],
    answers: Record<string, QaAnswer> | undefined,
    questions: readonly QaQuestion[],
    what: string,
  ): QaFinding[] => {
    if (stale) return [];
    const out: QaFinding[] = [];
    for (const id of ids) {
      const answer = answers?.[id];
      if (answer === undefined) {
        out.push(
          problem(`${what} "${id}" has not been looked at`, what === 'still' ? { shot: id } : {}),
        );
      } else if (answer !== 'ok') {
        for (const no of answer.no) {
          if (!questions.some((q) => q.id === no.q)) continue;
          out.push(
            problem(
              `${what} "${id}": ${no.what} (${questionText(no.q)} No.)`,
              what === 'still' ? { shot: id } : {},
            ),
          );
        }
      }
    }
    return out;
  };
  const count = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;
  const first = stale ? [problem(stale)] : [];
  const playbook: QaFinding[] =
    stale || !look || look.playbook === 'ok'
      ? []
      : look.playbook.no.map((no) => problem(`${no.what} (${questionText(no.q)} No.)`));
  return [
    {
      id: 'style',
      title: 'Every still passes the Style Check',
      by: 'looked',
      detail: `${count(shots.length, 'still')}, each against the ${STYLE_CHECK.length} questions of the style guide`,
      findings: [...first, ...answered(shots, look?.stills, STYLE_CHECK, 'still')],
    },
    {
      id: 'story',
      title: 'Every still tells its part of the story',
      by: 'looked',
      detail: `${count(shots.length, 'still')}, each against ${STORY_CHECK.length} questions: in frame, face visible, expression, hands, feet, action, setting`,
      findings: answered(shots, look?.stills, STORY_CHECK, 'still'),
    },
    {
      id: 'motion',
      title: 'Every move and every cut holds up frame by frame',
      by: 'looked',
      detail: `${count(strips.length, 'strip')} of frames, one across each move inside a shot and each cut that keeps someone on screen`,
      findings: answered(strips, look?.strips, MOTION_CHECK, 'strip'),
    },
    {
      id: 'playbook',
      title: 'The playbook was followed',
      by: 'looked',
      detail:
        'the rules of the general, format and style playbooks, read against the finished part',
      findings: playbook,
    },
  ];
}

// ------------------------------------------------------------------ what to look at

/** A strip of frames from the video: a few pictures side by side, to look at a move or a cut. */
export type QaStrip = { id: string; fromMs: number; seconds: number; fps: number; what: string };

/**
 * Every move inside a shot and every change of shot that keeps someone on screen (L-0030),
 * a change of scene included: that is where a person or a thing is seen to jump.
 */
export function qaStrips(part: Storyboard): QaStrip[] {
  const strips: QaStrip[] = [];
  const shots = part.scenes.flatMap((scene) => scene.shots);
  shots.forEach((shot, i) => {
    const start = shot.startMs ?? 0;
    const length = (shot.endMs ?? start) - start;
    const before = shots[i - 1];
    if (before && before.actors.some((a) => shot.actors.some((b) => b.character === a.character))) {
      strips.push({
        id: `cut-${before.id}-${shot.id}`,
        fromMs: Math.max(0, start - 400),
        seconds: 0.8,
        fps: 15,
        what: `the ${shot.transition === 'fade' ? 'fade' : 'cut'} from ${before.id} to ${shot.id}`,
      });
    }
    const steps = [...new Set(shot.actors.flatMap((a) => a.then.map((step) => step.at)))].sort(
      (x, y) => x - y,
    );
    steps.forEach((at, k) => {
      strips.push({
        id: `${shot.id}-move-${k + 1}`,
        fromMs: Math.max(0, start + at * length - 250),
        seconds: 1.6,
        fps: 7.5,
        what: `the move ${Math.round(at * 100)}% into ${shot.id}`,
      });
    });
  });
  return strips;
}

// ------------------------------------------------------------------ the report

export type QaVerdict = { ready: boolean; problems: number; notes: number };

export function qaVerdict(report: Pick<QaReport, 'checks'>): QaVerdict {
  const all = report.checks.flatMap((c) => c.findings);
  const problems = all.filter((f) => f.level === 'problem').length;
  return { ready: problems === 0, problems, notes: all.length - problems };
}

const SHAPES: Record<string, string> = { '16:9': 'wide', '9:16': 'tall', '4:5': 'nearly square' };
const RESULT_WORDS = { passed: 'passed', noted: 'passed, with a note', failed: 'NOT passed' };

/** The self-check as a page Biku reads: the verdict first, then what was checked and what was found. */
export function qaPage(report: QaReport): string {
  const verdict = qaVerdict(report);
  const things = (n: number) => `${n} thing${n === 1 ? '' : 's'}`;
  // What the checks noted, and what Claude noted while looking.
  const worth = verdict.notes + report.notes.length;
  const part = report.parts > 1 ? `, part ${report.part} of ${report.parts}` : '';
  const out: string[] = [
    `# Self-check: ${report.title}${part} (${SHAPES[report.size] ?? report.size})`,
    '',
    verdict.ready
      ? `**Ready for you to watch.** Every check passed${worth ? `, with ${things(worth)} worth a second look` : ''}.`
      : `**Not ready: ${things(verdict.problems)} to fix first.**`,
    '',
    `Video: \`${report.video}\` (${report.seconds.toFixed(1)} s). Checked on ${report.checkedOn}.`,
    '',
  ];
  const where = (f: QaFinding) => {
    const bits = [
      f.shot ? `shot ${f.shot}` : '',
      f.atMs !== undefined ? `at ${clock(f.atMs)}` : '',
    ];
    const text = bits.filter(Boolean).join(', ');
    return text ? ` (${text})` : '';
  };
  const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  const list = (level: QaFinding['level']) =>
    report.checks.flatMap((c) =>
      c.findings.filter((f) => f.level === level).map((f) => `- ${capital(f.text)}${where(f)}.`),
    );
  const problems = list('problem');
  if (problems.length) out.push('## To fix', '', ...problems, '');
  const notes = [...list('note'), ...report.notes.map((n) => `- ${n}`)];
  if (notes.length) out.push('## Worth a second look', '', ...notes, '');
  const table = (by: QaCheck['by']) => [
    '| Check | Result | What was checked |',
    '| --- | --- | --- |',
    ...report.checks
      .filter((c) => c.by === by)
      .map((c) => `| ${c.title} | ${RESULT_WORDS[checkResult(c)]} | ${c.detail} |`),
    '',
  ];
  out.push('## What the studio measured', '', ...table('measured'));
  out.push('## What Claude looked at', '', ...table('looked'));
  if (report.fixed.length) {
    out.push('## Found and put right on the way', '', ...report.fixed.map((f) => `- ${f}`), '');
  }
  out.push(
    '## What this check cannot judge',
    '',
    '- How it sounds. Claude cannot hear: the levels are measured, the listening is yours.',
    '- Whether the story holds you. That is yours to say when you watch it.',
    '',
  );
  return out.join('\n');
}
