import type { CharacterCard, QaCheck, QaFinding, Storyboard, VoiceTrack } from '@studio/shared';
import { PUNCH_IN_FRAMES, panShare, punchInZoom, pushInZoom } from '../camera/Camera';
import { shotTransform } from '../camera/Framing';
import { captionBox, captionLayout } from '../overlays/captionLayout';
import type { Box } from '../overlays/captionLayout';
import { buildPages, pageAt, toCaptions } from '../overlays/captionPages';
import type { CaptionPage } from '../overlays/captionPages';
import { labelBox, titleCardBox } from '../overlays/Titles';
import { movePose } from '../rig/chain';
import { CHILD_BODY, toScreen } from '../rig/Character';
import { vec } from '../rig/math';
import { computeSkeleton } from '../rig/skeleton';
import { lookFrom } from '../wardrobe/cast';
import { timedShots } from './layout';
import type { Size, TimedShot } from './layout';
import { TITLE_FADE, TITLE_SECONDS, captionOptions, captionPagesFor, titleY } from './screen';
import { stageShot } from './staging';

/**
 * The self-check's measurements of the pictures (Part 2, section 12): where every head lands
 * on screen on every frame, where the title, a label and the captions are, where feet are
 * against the ground, and how fast anything moves. It measures the same working-out the
 * picture is drawn from (staging.ts), so what it finds is what is on screen.
 */

type Circle = { x: number; y: number; r: number };

export type SeenPerson = {
  id: string;
  /** The head on screen: its middle and its radius, px. */
  head: Circle;
  /** The same before any camera move (push-in, pan): how the body itself sits in the framing. */
  steady: Circle;
  /** How far the lowest foot or knee is under the ground line, in head units; negative is above it. */
  lowest: number;
  /** True while they hold a pose, false while an action carries them. */
  held: boolean;
};

export type FrameMeasure = {
  frame: number;
  ms: number;
  shot: string;
  people: SeenPerson[];
  title: Box | null;
  label: Box | null;
  caption: Box | null;
  /** Things someone takes in this shot that they cannot reach. */
  outOfReach: Array<{ who: string; thing: string }>;
};

export type MeasureInput = {
  /** The part's storyboard, with the voice's times in its shots. */
  storyboard: Storyboard;
  track: VoiceTrack | null;
  size: Size;
  cards: Record<string, CharacterCard>;
  fps: number;
};

/** One frame of a shot, measured. */
export function measureFrame(
  input: MeasureInput,
  ts: TimedShot,
  shots: readonly TimedShot[],
  pages: readonly CaptionPage[],
  frame: number,
): FrameMeasure {
  const { storyboard, track, size, cards, fps } = input;
  const staged = stageShot({ ts, shots, storyboard, cards, track, size, frame, fps });
  const { shot, drawn, near, focus, side, local, duration } = staged;
  const t = shotTransform(shot.camera.framing, focus, size, side);
  // The camera's own move, the way ShotPicture applies it over the framed scene.
  const eye = { x: size.width / 2, y: size.height * 0.36 };
  const strength = shot.camera.strength;
  const zoom =
    shot.camera.move === 'push-in'
      ? pushInZoom(local, duration, 0.32 * strength)
      : shot.camera.move === 'punch-in'
        ? punchInZoom(local, 2, 0.7 * strength, PUNCH_IN_FRAMES)
        : 1;
  const slide =
    shot.camera.move === 'pan' ? 0.3 * strength * size.width * panShare(local, 0, duration) : 0;

  const people = drawn
    .filter((d) => d !== near)
    .map((d): SeenPerson => {
      const member = storyboard.cast.find((m) => m.id === d.actor.character);
      const look = lookFrom(
        member?.card ? (cards[member.card] ?? {}) : (member?.look ?? {}),
        d.actor.character,
      );
      let pose = d.poseAt(frame);
      if (d.moving) pose = movePose(pose, -pose.rootX);
      const j = computeSkeleton(pose);
      // A child's body is smaller under a head of the same size, so the head sits lower.
      const k = look.age === 'child' ? CHILD_BODY : 1;
      const head = vec(j.head.x + (k - 1) * (j.neck.x - pose.rootX), j.head.y + (k - 1) * j.neck.y);
      const at = toScreen(head, d.placement);
      const steady = {
        x: at.x * t.scale + t.x,
        y: at.y * t.scale + t.y,
        r: (d.placement.head / 2) * t.scale,
      };
      const lowest = Math.max(
        j.legs.front.foot.y,
        j.legs.back.foot.y,
        j.legs.front.knee.y,
        j.legs.back.knee.y,
      );
      return {
        id: d.actor.character,
        steady,
        head: {
          x: eye.x + (steady.x - eye.x) * zoom - slide,
          y: eye.y + (steady.y - eye.y) * zoom,
          r: steady.r * zoom,
        },
        lowest: lowest * k,
        held: !d.momentAt(frame).action,
      };
    });

  const ms = (frame / fps) * 1000;
  const overlay = shot.overlay;
  const titleUp = local / fps < TITLE_SECONDS + TITLE_FADE;
  const page = pageAt(pages, ms);
  return {
    frame,
    ms,
    shot: shot.id,
    people,
    title:
      overlay?.kind === 'title' && titleUp
        ? titleCardBox(overlay.text, size.width, size.height, titleY(size))
        : null,
    label: overlay?.kind === 'label' ? labelBox(overlay.text, size.width, size.height) : null,
    caption: page ? captionBox(page, size.width, size.height) : null,
    outOfReach: drawn.flatMap((d) =>
      d.outOfReach.map((thing) => ({ who: d.actor.character, thing })),
    ),
  };
}

/** Every frame of a part, measured, shot by shot. */
export function measurePart(input: MeasureInput): Array<{ ts: TimedShot; frames: FrameMeasure[] }> {
  const shots = timedShots(input.storyboard, input.fps);
  const pages = captionPagesFor(input.storyboard, input.track, input.size);
  return shots.map((ts) => {
    const frames: FrameMeasure[] = [];
    for (let f = ts.startFrame; f < ts.endFrame; f++) {
      frames.push(measureFrame(input, ts, shots, pages, f));
    }
    return { ts, frames };
  });
}

// ------------------------------------------------------------------ what the measurements mean

/** How much of a head is out of the picture, as a share of its width: 0 inside, 1 gone. */
export function cutOff(head: Circle, size: Size): number {
  const d = 2 * head.r;
  return Math.max(
    0,
    (head.r - head.x) / d,
    (head.x + head.r - size.width) / d,
    (head.r - head.y) / d,
    (head.y + head.r - size.height) / d,
  );
}

/** The share of a face that a box covers. The face is the middle of the head, where the features are. */
export function faceCovered(head: Circle, box: Box | null): number {
  if (!box) return 0;
  const half = head.r * 0.8;
  const w = Math.min(head.x + half, box.x + box.width) - Math.max(head.x - half, box.x);
  const h = Math.min(head.y + half, box.y + box.height) - Math.max(head.y - half, box.y);
  return w > 0 && h > 0 ? (w * h) / (4 * half * half) : 0;
}

/** How far a head travels from one frame to the next, as a share of its own width. */
export const headTravel = (from: Circle, to: Circle): number =>
  Math.hypot(to.x - from.x, to.y - from.y) / (2 * to.r);

/** A head more cut off than this by the edge of the picture is worth a look; past half, it is gone. */
export const HEAD_CUT_NOTE = 0.3;
export const HEAD_CUT_GONE = 0.5;
/** A face covered by more than this share is covered. */
export const FACE_COVERED = 0.08;
/** Legs deeper than this under the ground line, in head units, go through the ground. */
export const SUNK = 0.06;
/** A held pose whose lowest foot or knee is higher than this, in head units, floats. */
export const FLOATING = 0.12;
/**
 * The furthest a head may travel in one frame, as a share of its own width, before the eye
 * loses it: a jump, not a move (L-0030). A walk is about 0.05, a body getting up about 0.1.
 */
export const JUMP = 0.3;
/** Frames after a cut in which a body may still be settling into its new shot. */
const CUT_FRAMES = 9;
/** A shot with nothing moving in it for longer than this, in seconds, is a held picture. */
export const HELD_PICTURE_S = 4;

const sayName = (storyboard: Storyboard, id: string): string =>
  storyboard.cast.find((m) => m.id === id)?.name ?? id;

/**
 * The checks of the pictures: everyone inside the frame, no face under the title or the
 * captions, feet on the ground, nothing jumping, no picture held too long, and whatever is
 * picked up within reach.
 */
export function pictureChecks(input: MeasureInput, limits: { maxShotS?: number } = {}): QaCheck[] {
  const { storyboard, size, fps } = input;
  const measured = measurePart(input);
  const name = (id: string) => sayName(storyboard, id);
  const inFrame: QaFinding[] = [];
  const faces: QaFinding[] = [];
  const feet: QaFinding[] = [];
  const jumps: QaFinding[] = [];
  const held: QaFinding[] = [];
  const reach: QaFinding[] = [];
  let fastest = { share: 0, who: '', shot: '' };
  let longest = { s: 0, shot: '' };
  let longestStill = 0;
  let frames = 0;

  for (const { ts, frames: all } of measured) {
    const shot = ts.shot;
    const at = { shot: shot.id };
    frames += all.length;
    const ids = [...new Set(all.flatMap((m) => m.people.map((p) => p.id)))];
    const speaker = ts.scene.lines.find((l) => l.id === shot.line)?.speaker;
    for (const id of ids) {
      const seen = all.flatMap((m) => {
        const p = m.people.find((x) => x.id === id);
        return p ? [{ m, p }] : [];
      });
      // In the picture. Walking or running in or out of it is how people arrive and leave, so
      // someone on the move is judged only by whether they are ever seen; someone holding a
      // pose has to be in the picture while they hold it.
      const every = seen.map(({ m, p }) => ({ ms: m.ms, cut: cutOff(p.head, size), held: p.held }));
      const everSeen = every.some((c) => c.cut < HEAD_CUT_GONE);
      const cuts = everSeen ? every.filter((c) => c.held) : every;
      const worst = cuts.reduce((a, b) => (b.cut > a.cut ? b : a), { ms: 0, cut: 0, held: true });
      if (worst.cut >= HEAD_CUT_GONE) {
        // Whoever the shot is about has to be in it. Someone standing by may fall outside a
        // narrow frame that favours another; that is worth a look, not a fault.
        const about =
          ids.length === 1 || shot.camera.focus === id || speaker === id || !shot.camera.focus;
        inFrame.push({
          level: about ? 'problem' : 'note',
          ...at,
          atMs: worst.ms,
          text: about
            ? `${name(id)}'s head is out of the picture`
            : `${name(id)} is in this shot's plan but falls outside the picture`,
        });
      } else if (worst.cut > HEAD_CUT_NOTE) {
        inFrame.push({
          level: 'note',
          ...at,
          atMs: worst.ms,
          text: `the edge of the picture cuts off ${Math.round(worst.cut * 100)}% of ${name(id)}'s head`,
        });
      }
      // Faces clear of what is laid over the picture.
      for (const [what, pick] of [
        ['the title', (m: FrameMeasure) => m.title],
        ['the label', (m: FrameMeasure) => m.label],
        ['the captions', (m: FrameMeasure) => m.caption],
      ] as const) {
        const covered = seen.filter(({ m, p }) => faceCovered(p.head, pick(m)) > FACE_COVERED);
        // A single frame is a caption popping in as a head passes; a few frames is a face covered.
        const first = covered[0];
        if (first && covered.length >= 4) {
          faces.push({
            level: 'problem',
            ...at,
            atMs: first.m.ms,
            text: `${what} ${what === 'the captions' ? 'cover' : 'covers'} ${name(id)}'s face`,
          });
        }
      }
      // Feet against the ground.
      const sunk = seen.find(({ p }) => p.lowest > SUNK);
      if (sunk) {
        feet.push({
          level: 'problem',
          ...at,
          atMs: sunk.m.ms,
          text: `${name(id)}'s legs go through the ground`,
        });
      }
      const floating = seen.find(({ p }) => p.held && p.lowest < -FLOATING);
      if (floating && !sunk) {
        feet.push({
          level: 'problem',
          ...at,
          atMs: floating.m.ms,
          text: `${name(id)} floats above the ground`,
        });
      }
      // Nothing jumps: getting into a pose never carries a head further in one frame than
      // the eye can follow. An action from the library (a fall, a swing) is as fast as it
      // was drawn to be, so only the frames of a held pose and the way into one are judged.
      let jump = { share: 0, ms: 0 };
      for (let i = 1; i < seen.length; i++) {
        const a = seen[i - 1];
        const b = seen[i];
        if (!a || !b || !b.p.held || b.m.frame - ts.startFrame < CUT_FRAMES) continue;
        const share = headTravel(a.p.steady, b.p.steady);
        if (share > jump.share) jump = { share, ms: b.m.ms };
      }
      if (jump.share > fastest.share) fastest = { share: jump.share, who: id, shot: shot.id };
      if (jump.share > JUMP) {
        jumps.push({
          level: 'problem',
          ...at,
          atMs: jump.ms,
          text: `${name(id)} jumps ${jump.share.toFixed(2)} of a head in one frame; a move has to take several frames to be seen`,
        });
      }
    }
    // Reach.
    for (const miss of all[0]?.outOfReach ?? []) {
      reach.push({
        level: 'problem',
        ...at,
        text: `the ${miss.thing} is too far from ${name(miss.who)} to pick up, or behind them; stand it just in front of them`,
      });
    }
    // How long the picture is held.
    const s = (ts.endFrame - ts.startFrame) / fps;
    if (s > longest.s) longest = { s, shot: shot.id };
    const still =
      shot.actors.every((a) => !a.action && a.then.length === 0) &&
      (shot.camera.move === 'none' || shot.camera.move === 'shake');
    if (still) longestStill = Math.max(longestStill, s);
    if (limits.maxShotS !== undefined && s > limits.maxShotS + 1.2) {
      held.push({
        level: 'problem',
        ...at,
        atMs: ((ts.startFrame / fps) * 1000) | 0,
        text: `the shot stays for ${s.toFixed(1)} s; a shot may take up to ${limits.maxShotS} s`,
      });
    } else if (limits.maxShotS !== undefined && s > limits.maxShotS + 0.05) {
      held.push({
        level: 'note',
        ...at,
        atMs: ((ts.startFrame / fps) * 1000) | 0,
        text: `the shot stays for ${s.toFixed(1)} s, a little over the ${limits.maxShotS} s a shot should take`,
      });
    } else if (still && s > HELD_PICTURE_S) {
      held.push({
        level: 'note',
        ...at,
        atMs: ((ts.startFrame / fps) * 1000) | 0,
        text: `one picture is held for ${s.toFixed(1)} s with nothing moving in it but breathing and blinking`,
      });
    }
  }

  const shots = measured.length;
  const picked = measured.reduce(
    (n, { ts }) =>
      n +
      ts.shot.actors.filter((a) => a.then.some((step) => typeof step.holds === 'string')).length,
    0,
  );
  return [
    {
      id: 'in-frame',
      title: 'Everyone is inside the picture',
      by: 'measured',
      detail: `where every head lands on screen, on all ${frames} frames of the ${shots} shots`,
      findings: inFrame,
    },
    {
      id: 'faces-clear',
      title: 'No face is under the title or the captions',
      by: 'measured',
      detail: 'every face against the title, any label and the captions, on every frame',
      findings: faces,
    },
    {
      id: 'feet',
      title: 'Feet are on the ground',
      by: 'measured',
      detail: 'the lowest foot or knee of every body against the ground line, on every frame',
      findings: feet,
    },
    {
      id: 'smooth',
      title: 'Nothing jumps',
      by: 'measured',
      detail: fastest.who
        ? `the furthest anyone moves in one frame on the way into a pose is ${fastest.share.toFixed(2)} of a head (${name(fastest.who)}, shot ${fastest.shot}); a jump would be over ${JUMP}`
        : 'nobody changes pose',
      findings: jumps,
    },
    {
      id: 'held',
      title: 'No picture is held too long',
      by: 'measured',
      detail: `the longest shot is ${longest.s.toFixed(1)} s (${longest.shot}); the longest with nothing moving in it is ${longestStill.toFixed(1)} s`,
      findings: held,
    },
    {
      id: 'reach',
      title: 'Whatever is picked up is within reach',
      by: 'measured',
      detail: picked
        ? `${picked} time${picked === 1 ? '' : 's'} someone takes a thing in their hand inside a shot`
        : 'nobody takes a thing in their hand inside a shot',
      findings: reach,
    },
  ];
}

/** A caption has to stay at least this long to be read, ms. */
export const CAPTION_MIN_MS = 300;
/** Captions may take up to this share of the frame's width. */
export const CAPTION_MAX_WIDTH = 0.92;
/** Caption letters are at least this share of the frame's shorter side, to read on a phone. */
export const CAPTION_MIN_SIZE = 0.045;

/** Captions fit the screen: lines, width, size, place, and long enough to read. */
export function captionCheck(track: VoiceTrack, size: Size): QaCheck {
  const options = captionOptions(size);
  const pages = buildPages(toCaptions(track.words), options);
  const findings: QaFinding[] = [];
  let widest = 0;
  let shortest = Infinity;
  for (const page of pages) {
    const box = captionBox(page, size.width, size.height);
    const text = page.lines.map((l) => l.map((w) => w.text.trim()).join(' ')).join(' / ');
    const at = { atMs: page.startMs };
    widest = Math.max(widest, box.width / size.width);
    shortest = Math.min(shortest, page.endMs - page.startMs);
    if (page.lines.length > options.maxLines) {
      findings.push({
        level: 'problem',
        ...at,
        text: `the caption "${text}" takes ${page.lines.length} lines; ${options.maxLines} is the most`,
      });
    }
    if (box.width > size.width * CAPTION_MAX_WIDTH) {
      findings.push({
        level: 'problem',
        ...at,
        text: `the caption "${text}" is too wide for the screen`,
      });
    }
    if (box.y + box.height > size.height * 0.985) {
      findings.push({
        level: 'problem',
        ...at,
        text: `the caption "${text}" runs off the bottom of the screen`,
      });
    }
    if (page.endMs - page.startMs < CAPTION_MIN_MS) {
      findings.push({
        level: 'note',
        ...at,
        text: `the caption "${text}" is up for only ${((page.endMs - page.startMs) / 1000).toFixed(2)} s`,
      });
    }
    if (/[—―]/.test(text)) {
      findings.push({
        level: 'problem',
        ...at,
        text: `the caption "${text}" has an em dash in it`,
      });
    }
  }
  const { fontSize } = captionLayout(1, size.width, size.height);
  if (fontSize < Math.min(size.width, size.height) * CAPTION_MIN_SIZE) {
    findings.push({
      level: 'problem',
      text: 'the caption letters are too small to read on a phone',
    });
  }
  const lines = options.maxLines === 1 ? 'one line' : `up to ${options.maxLines} lines`;
  return {
    id: 'captions',
    title: 'Captions fit the screen',
    by: 'measured',
    detail: pages.length
      ? `${pages.length} captions of ${lines}; the widest takes ${Math.round(widest * 100)}% of the width; the briefest stays up ${(shortest / 1000).toFixed(1)} s`
      : 'no captions',
    findings,
  };
}
