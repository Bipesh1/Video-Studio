import type {
  CharacterCard,
  Overlay,
  QaCheck,
  QaFinding,
  Storyboard,
  VoiceTrack,
} from '@studio/shared';
import {
  driftShare,
  panShare,
  pullBackZoom,
  PUNCH_IN_FRAMES,
  punchInZoom,
  pushInZoom,
} from '../camera/Camera';
import { layoutScale, shotTransform } from '../camera/Framing';
import { captionBox, captionLayout } from '../overlays/captionLayout';
import type { Box } from '../overlays/captionLayout';
import { buildPages, pageAt, toCaptions } from '../overlays/captionPages';
import type { CaptionPage } from '../overlays/captionPages';
import { markBox } from '../overlays/Brand';
import { bubbleBox, bubbleLayout } from '../overlays/Bubble';
import {
  bigNumberBox,
  bigWordsBox,
  meterBox,
  meterText,
  pageBox,
  pointerBox,
  SAFE_916,
} from '../overlays/Explain';
import type { Mark } from '../overlays/Brand';
import { labelBox, titleCardBox } from '../overlays/Titles';
import { movePose } from '../rig/chain';
import { CHILD_BODY, toScreen } from '../rig/Character';
import { clamp, vec } from '../rig/math';
import { CARRIED_POSES } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import { lookFrom } from '../wardrobe/cast';
import { stageX, timedShots } from './layout';
import { SCENERY, propHeight, propReach, standingProp } from './props';
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
  /** The page's mark, when the brand has one. */
  mark: Box | null;
  /** The counter in the corner, when the video has one. */
  meter: Box | null;
  /** Things someone takes in this shot that they cannot reach. */
  outOfReach: Array<{ who: string; thing: string }>;
  /** The things standing or hanging in the shot, furniture apart: the body of each on screen, px. */
  things: Array<{ key: string; prop: string; box: Box }>;
  /**
   * In a wide shot, how big people are against a wide shot's usual size: 1 as usual, less when
   * the camera has moved back to fit everything in. Null in any other shot.
   */
  back: number | null;
};

export type MeasureInput = {
  /** The part's storyboard, with the voice's times in its shots. */
  storyboard: Storyboard;
  track: VoiceTrack | null;
  size: Size;
  cards: Record<string, CharacterCard>;
  fps: number;
  /** The page's mark, when the brand has one. */
  mark?: Mark | null;
};

/**
 * Where a person or a thing of a shot is on screen at a frame, px: a head, or the middle of a
 * prop. For an arrow that names what it points at. Null when the shot has no such thing.
 */
export function pointOnScreen(
  input: MeasureInput,
  ts: TimedShot,
  shots: readonly TimedShot[],
  frame: number,
  target: string,
): { x: number; y: number } | null {
  const { storyboard, track, size, cards, fps } = input;
  const staged = stageShot({ ts, shots, storyboard, cards, track, size, frame, fps });
  const t = shotTransform(staged.shot.camera.framing, staged.focus, size, staged.side);
  const person = staged.drawn.find((d) => d.actor.character === target);
  const thing = staged.shot.props.find((p) => p.prop === target);
  const at = person
    ? toScreen(computeSkeleton(person.pose).head, person.placement)
    : thing
      ? vec(
          stageX(staged.stage, thing.x),
          staged.stage.groundY -
            ((standingProp(thing.prop)?.eyeHeight ?? 0.5) + propHeight(thing)) * staged.stage.head,
        )
      : null;
  return at ? { x: at.x * t.scale + t.x, y: at.y * t.scale + t.y } : null;
}

/**
 * Where a shot's arrow points and where its label sits, as shares of the frame. A named target
 * is found where it is in this frame shape. Left to itself the label sits well above the target,
 * a little toward the middle of the picture, and always whole inside the frame.
 */
export function pointerPlace(
  input: MeasureInput,
  ts: TimedShot,
  shots: readonly TimedShot[],
  overlay: Extract<Overlay, { kind: 'pointer' }>,
  /** The frame being drawn: the arrow follows a target that moves. Left out, where it is as the shot begins. */
  frame?: number,
): { at: { x: number; y: number }; to: { x: number; y: number }; seen: boolean } {
  const { width, height } = input.size;
  const targetAt = (f: number): { x: number; y: number } => {
    if (typeof overlay.to !== 'string') return overlay.to;
    const found = pointOnScreen(input, ts, shots, f, overlay.to);
    return found ? { x: found.x / width, y: found.y / height } : { x: 0.5, y: 0.4 };
  };
  // The label keeps its place, worked out from where the target is as the shot begins; the
  // arrow's tip goes with the target (Biku, 2026-10-12: "the arrow ... doesnt move with copy
  // cat"), and stays inside the picture while someone is still on their way in.
  const first = targetAt(ts.startFrame + 8);
  const now = frame === undefined ? first : targetAt(frame);
  const to = { x: clamp(now.x, 0.04, 0.96), y: clamp(now.y, 0.04, 0.96) };
  // Someone still outside the picture has no label yet: an arrow at nothing says nothing.
  const seen = now.x > 0.02 && now.x < 0.98;
  if (overlay.at) return { at: overlay.at, to, seen };
  const half = pointerBox(overlay.text, { x: 0.5, y: 0.5 }, width, height).width / 2 / width;
  const air = Math.min(0.5, half + 0.03);
  // A video with a counter in its top corner: the label keeps under it.
  const meter = input.storyboard.meter;
  const counter = meter
    ? meterBox(meter.label, meterText(meter.perSecond * 200, meter.prefix).length, width, height)
    : null;
  const top = counter ? (counter.y + counter.height) / height + 0.07 : 0.08;
  return {
    at: {
      x: clamp(first.x + (first.x > 0.5 ? -0.1 : 0.1), air, 1 - air),
      y: clamp(first.y - 0.3, top, 0.6),
    },
    to,
    seen,
  };
}

/** Where someone's head is on screen at a frame, px, and how big. Null when they are not in the shot. */
export function headOnScreen(
  input: MeasureInput,
  ts: TimedShot,
  shots: readonly TimedShot[],
  frame: number,
  who: string,
): { x: number; y: number; r: number } | null {
  const { storyboard, track, size, cards, fps } = input;
  const staged = stageShot({ ts, shots, storyboard, cards, track, size, frame, fps });
  const t = shotTransform(staged.shot.camera.framing, staged.focus, size, staged.side);
  const person = staged.drawn.find((d) => d.actor.character === who);
  if (!person) return null;
  const at = toScreen(computeSkeleton(person.pose).head, person.placement);
  return {
    x: at.x * t.scale + t.x,
    y: at.y * t.scale + t.y,
    r: (person.placement.head / 2) * t.scale,
  };
}

/** How far each kind of hat stands above the top of the head, as a share of the head's radius. */
const HAT_RISE: Record<string, number> = {
  beanie: 0.85,
  cap: 0.5,
  'brim-hat': 0.85,
  'top-hat': 1.6,
};

/** How far someone's hat stands above their head, as a share of its radius; no hat, nothing. */
function hatRise(input: MeasureInput, id: string): number {
  const member = input.storyboard.cast.find((m) => m.id === id);
  const outfit = (member?.card ? input.cards[member.card] : member?.look)?.outfit;
  const hat = outfit && 'clothes' in outfit ? outfit.clothes.hat?.kind : undefined;
  return hat ? (HAT_RISE[hat] ?? 0) : 0;
}

/** How far through its shot a drifting balloon sets off, arrives and bursts. */
const DRIFT = { from: 0.22, to: 0.72, burst: 0.76 } as const;

/**
 * Where a shot's bubble is at a frame, px: its middle, the point its tail leads to, and how
 * many frames ago it burst. It sits above its owner's head, a little toward the middle of the
 * picture, or beside the head when there is no room above; it is always whole inside the frame.
 * A balloon with somewhere to go drifts there through the middle of the shot and bursts.
 */
export function bubblePlace(
  input: MeasureInput,
  ts: TimedShot,
  shots: readonly TimedShot[],
  overlay: Extract<Overlay, { kind: 'bubble' }>,
  frame: number,
): { at: { x: number; y: number }; tail: { x: number; y: number } | null; burst?: number } {
  const { width, height } = input.size;
  const settled = ts.startFrame + 8;
  const owner = headOnScreen(input, ts, shots, settled, overlay.of) ?? {
    x: width / 2,
    y: height * 0.4,
    r: height * 0.06,
  };
  const { bw, bh, size } = bubbleLayout(overlay.lines, width, height);
  const margin = height * 0.03;
  const inside = (x: number) => clamp(x, bw / 2 + margin, width - bw / 2 - margin);
  const toMiddle = owner.x > width / 2 ? -1 : 1;
  // A hat stands above the head: the bubble clears the hat, not just the head under it.
  const crown = owner.r * (1 + hatRise(input, overlay.of));
  // Above the head, as high as the tail likes or as high as the frame allows, so long as a
  // little air is left over the head.
  let home = {
    x: inside(owner.x + toMiddle * bw * 0.16),
    y: Math.max(margin + bh / 2, owner.y - crown - size * 1.7 - bh / 2),
  };
  // Beside the head only when the bubble would come down onto the head itself: over the top of a
  // hat is better than over a face.
  if (home.y + bh / 2 > owner.y - owner.r - size * 0.3) {
    home = {
      x: inside(owner.x + toMiddle * (owner.r + size * 1.3 + bw / 2)),
      y: clamp(owner.y - owner.r * 0.7, bh / 2 + margin, height * 0.6),
    };
  }
  const away = Math.hypot(home.x - owner.x, home.y - owner.y) || 1;
  // The tail starts at the edge of the head, or at the top of the hat when it leads upward.
  const up = Math.max(0, (owner.y - home.y) / away);
  const edge = owner.r * 1.08 + (crown - owner.r) * up;
  const tail = {
    x: owner.x + ((home.x - owner.x) / away) * edge,
    y: owner.y + ((home.y - owner.y) / away) * edge,
  };
  const target = overlay.to ? headOnScreen(input, ts, shots, settled, overlay.to) : null;
  if (!target) return { at: home, tail };
  const duration = ts.endFrame - ts.startFrame;
  const share = (frame - ts.startFrame) / Math.max(1, duration);
  const k = clamp((share - DRIFT.from) / (DRIFT.to - DRIFT.from), 0, 1);
  const eased = k * k * (3 - 2 * k);
  // It comes to rest against the side of the listener's head it arrives from.
  const side = home.x > target.x ? 1 : -1;
  const end = {
    x: target.x + side * (target.r + bw / 2 + size * 0.2),
    y: target.y - target.r * 0.2,
  };
  const at = {
    x: home.x + (end.x - home.x) * eased,
    // A balloon bobs a little on its way.
    y: home.y + (end.y - home.y) * eased - Math.sin(Math.PI * eased) * bh * 0.25,
  };
  const burstAt = ts.startFrame + Math.round(DRIFT.burst * duration);
  return {
    at,
    tail: k > 0.02 ? null : tail,
    ...(frame >= burstAt ? { burst: frame - burstAt } : {}),
  };
}

/** The box a bubble takes at a frame, or null once it has burst. */
function bubbleLabel(
  input: MeasureInput,
  ts: TimedShot,
  shots: readonly TimedShot[],
  overlay: Extract<Overlay, { kind: 'bubble' }>,
  frame: number,
): Box | null {
  const place = bubblePlace(input, ts, shots, overlay, frame);
  if (place.burst !== undefined) return null;
  return bubbleBox(overlay.lines, place.at, input.size.width, input.size.height);
}

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
      : shot.camera.move === 'pull-back'
        ? pullBackZoom(local, duration, 0.32 * strength)
        : shot.camera.move === 'drift'
          ? 1 + (2 * 0.08 * strength * size.width) / size.width
          : shot.camera.move === 'punch-in'
            ? punchInZoom(local, 2, 0.7 * strength, PUNCH_IN_FRAMES)
            : 1;
  const slide =
    shot.camera.move === 'pan'
      ? 0.3 * strength * size.width * panShare(local, 0, duration)
      : shot.camera.move === 'drift'
        ? 0.08 * strength * size.width * driftShare(local, duration)
        : 0;

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
        held: !d.momentAt(frame).action && !CARRIED_POSES.includes(d.momentAt(frame).pose ?? ''),
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
    label:
      overlay?.kind === 'label'
        ? labelBox(overlay.text, size.width, size.height)
        : overlay?.kind === 'number'
          ? bigNumberBox(overlay.text, overlay.caption, size.width, size.height)
          : overlay?.kind === 'pointer'
            ? pointerBox(
                overlay.text,
                pointerPlace(input, ts, shots, overlay).at,
                size.width,
                size.height,
              )
            : overlay?.kind === 'page'
              ? pageBox(overlay.lines, size.width, size.height, overlay.tally !== undefined)
              : overlay?.kind === 'words'
                ? bigWordsBox(overlay.lines, size.width, size.height, overlay.low)
                : overlay?.kind === 'bubble'
                  ? bubbleLabel(input, ts, shots, overlay, frame)
                  : null,
    caption: page ? captionBox(page, size.width, size.height) : null,
    mark: input.mark ? markBox(input.mark, size.width, size.height) : null,
    meter: storyboard.meter
      ? meterBox(
          storyboard.meter.label,
          meterText(storyboard.meter.perSecond * 200, storyboard.meter.prefix).length,
          size.width,
          size.height,
        )
      : null,
    outOfReach: drawn.flatMap((d) =>
      d.outOfReach.map((thing) => ({ who: d.actor.character, thing })),
    ),
    things: staged.shotNow.props.flatMap((p, i) => {
      // Scenery, and a thing close to the camera, may run off the edge on purpose.
      if (SCENERY.includes(p.prop) || p.near) return [];
      const reach = propReach(p);
      const head = staged.stage.head;
      const x = stageX(staged.stage, p.x) - staged.cameraX;
      const y = staged.stage.groundY - propHeight(p) * head;
      const onScreen = (px: number, py: number) => ({
        x: eye.x + (px * t.scale + t.x - eye.x) * zoom - slide,
        y: eye.y + (py * t.scale + t.y - eye.y) * zoom,
      });
      const from = onScreen(x - reach.side * head, y - reach.up * head);
      const to = onScreen(x + reach.side * head, y + reach.down * head);
      return [
        {
          key: `${p.prop}-${i}`,
          prop: p.prop,
          box: { x: from.x, y: from.y, width: to.x - from.x, height: to.y - from.y },
        },
      ];
    }),
    back: shot.camera.framing === 'wide' ? t.scale / layoutScale(size) : null,
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

/** How much of a thing is out of the picture, as a share of its body: 0 inside, 1 gone. */
export function thingOut(box: Box, size: Size): number {
  const w = Math.min(box.x + box.width, size.width) - Math.max(box.x, 0);
  const h = Math.min(box.y + box.height, size.height) - Math.max(box.y, 0);
  const area = box.width * box.height;
  if (area <= 0) return 0;
  return 1 - (Math.max(0, w) * Math.max(0, h)) / area;
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
/** A thing more out of the picture than this is worth a look; past half, it is not really in it. */
export const THING_CUT_NOTE = 0.2;
export const THING_CUT_GONE = 0.5;
/** A wide shot in which people are smaller than this share of their usual size stands far back. */
export const FAR_BACK = 0.7;
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
  const things: QaFinding[] = [];
  const safe: QaFinding[] = [];
  const tall = size.height > size.width;
  const safeBox = {
    x: SAFE_916.x * size.width,
    y: SAFE_916.y * size.height,
    width: SAFE_916.width * size.width,
    height: SAFE_916.height * size.height,
  };
  // How far a box reaches outside the safe area, px (0 when it is inside).
  const outside = (b: Box | null) =>
    !b
      ? 0
      : Math.max(
          safeBox.x - b.x,
          safeBox.y - b.y,
          b.x + b.width - (safeBox.x + safeBox.width),
          b.y + b.height - (safeBox.y + safeBox.height),
          0,
        );
  let thingsSeen = 0;
  let fastest = { share: 0, who: '', shot: '' };
  let longest = { s: 0, shot: '' };
  let longestStill = 0;
  let frames = 0;

  for (const { ts, frames: all } of measured) {
    // Words over the picture stay clear of the app's own buttons in a tall video.
    if (tall) {
      for (const [what, pick] of [
        ['the captions', (m: FrameMeasure) => m.caption],
        ['the counter', (m: FrameMeasure) => m.meter],
        ['the label or number', (m: FrameMeasure) => m.label],
      ] as const) {
        const worst = all.reduce((a, m) => Math.max(a, outside(pick(m))), 0);
        if (
          worst > size.height * 0.01 &&
          !safe.some((f) => f.shot === ts.shot.id && f.text.startsWith(what))
        ) {
          safe.push({
            level: 'note',
            shot: ts.shot.id,
            text: `${what} reach ${Math.round(worst)} px outside the part of a tall picture the apps keep clear of their buttons`,
          });
        }
      }
    }
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
      // In a shot of the eyes alone the head is meant to be bigger than the picture.
      const eyesOnly = shot.camera.framing === 'eyes';
      const every = seen.map(({ m, p }) => ({
        ms: m.ms,
        cut: eyesOnly ? 0 : cutOff(p.head, size),
        held: p.held,
      }));
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
        ['the label or number', (m: FrameMeasure) => m.label],
        ['the captions', (m: FrameMeasure) => m.caption],
        ["the page's mark", (m: FrameMeasure) => m.mark],
        ['the counter', (m: FrameMeasure) => m.meter],
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
    // The things of the shot, in the picture like the people. A wide shot shows all of them; a
    // closer shot has to show only what someone looks at or what an arrow names.
    const wide = shot.camera.framing === 'wide';
    const named =
      shot.overlay?.kind === 'pointer' && typeof shot.overlay.to === 'string'
        ? shot.overlay.to
        : null;
    const keys = [...new Set(all.flatMap((m) => m.things.map((x) => x.key)))];
    for (const key of keys) {
      const seen = all.flatMap((m) => {
        const x = m.things.find((y) => y.key === key);
        return x ? [{ ms: m.ms, out: thingOut(x.box, size), prop: x.prop }] : [];
      });
      const best = seen.reduce((a, b) => (b.out < a.out ? b : a));
      const lookedAt = shot.actors.some(
        (a) => a.lookAt === best.prop || a.then.some((step) => step.lookAt === best.prop),
      );
      const pointedAt = best.prop === named;
      const closeOnFace = shot.camera.framing === 'close-up' || shot.camera.framing === 'eyes';
      if (!wide && !pointedAt && !(lookedAt && !closeOnFace)) continue;
      thingsSeen++;
      const what = best.prop.replace(/-/g, ' ');
      if (best.out >= THING_CUT_GONE) {
        things.push({
          level: wide || pointedAt ? 'problem' : 'note',
          ...at,
          atMs: best.ms,
          text: pointedAt
            ? `the arrow points at the ${what}, which is out of the picture`
            : `the ${what} is out of the picture, or more than half of it is`,
        });
      } else if (best.out > THING_CUT_NOTE) {
        things.push({
          level: 'note',
          ...at,
          atMs: best.ms,
          text: `the edge of the picture cuts off ${Math.round(best.out * 100)}% of the ${what}`,
        });
      }
    }
    const back = Math.min(...all.map((m) => m.back ?? 1));
    if (shot.actors.length > 0 && back < FAR_BACK) {
      things.push({
        level: 'note',
        ...at,
        text: `the camera stands back to fit everyone and everything in, so people are ${Math.round(back * 100)}% of their usual size; in this shape, put people and things nearer each other, or a thing above them`,
      });
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
      id: 'things-in-frame',
      title: 'The things a shot shows are inside the picture',
      by: 'measured',
      detail: thingsSeen
        ? `the body of every thing standing or hanging in a shot against the edges of the picture, on every frame (${thingsSeen} checked)`
        : 'no shot of this part has a thing standing or hanging in it',
      findings: things,
    },
    ...(tall
      ? [
          {
            id: 'safe-area',
            title: "Words over the picture are clear of the apps' own buttons",
            by: 'measured' as const,
            detail:
              'the captions, the counter and any label against the middle 900 by 1400 of a tall picture, on every frame',
            findings: safe,
          },
        ]
      : []),
    {
      id: 'faces-clear',
      title: 'No face is under the title or the captions',
      by: 'measured',
      detail: `every face against the title, any label, the captions${input.mark ? " and the page's mark" : ''}, on every frame`,
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
