import { Boil, Finish } from '../camera/Finish';
import { Audio } from '@remotion/media';
import { FPS, SIZES, TRAVELS, arrivalOf } from '@studio/shared';
import type { CharacterCard, SizeName, Storyboard, Travel, VoiceTrack } from '@studio/shared';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Fade } from '../camera/Camera';
import {
  REWIND_FRAMES,
  RewindFilters,
  RewindOverlay,
  RewindStamp,
  rewindDone,
  rewindShake,
} from '../camera/Rewind';
import { Watermark } from '../overlays/Brand';
import type { Mark } from '../overlays/Brand';
import { Bubble } from '../overlays/Bubble';
import { Captions } from '../overlays/Captions';
import {
  BigNumber,
  BigWords,
  Meter,
  OrbitDiagram,
  Page,
  Pointer,
  countedText,
  meterText,
} from '../overlays/Explain';
import { Gauges } from '../overlays/Gauge';
import { Label, TitleCard } from '../overlays/Titles';
import type { Overlay } from '@studio/shared';
import { clamp, easeOutBack } from '../rig/math';
import { ink, white } from '../tokens';
import { lookFrom } from '../wardrobe/cast';
import { shotAt, timedShots } from './layout';
import type { TimedShot } from './layout';
import { bubblePlace, pointerPlace } from './measure';
import { TITLE_FADE, TITLE_SECONDS, captionPagesFor, titleY } from './screen';
import { ShotPicture } from './ShotPicture';
import { lookColour, pagesFor } from '../explainer/Graphic';

export { HEAD_EFFECTS } from './names';

/**
 * Any storyboard as a video (Phase 4D). One part of a video is one storyboard whose shots
 * have times; this draws whichever shot is on screen: the place in its light, the people in
 * their poses with their faces, what they hold, the things around them, the camera, a title
 * or label, the captions and the sound. Nothing here knows a particular story.
 */

export type StoryboardVideoProps = {
  storyboard: Storyboard;
  /** The voice track of this part: word times for captions and talking mouths. */
  track: VoiceTrack | null;
  /** The finished sound, under engine/public. */
  audioSrc: string | null;
  size: SizeName;
  /** The saved characters the cast uses, by id. */
  cards: Record<string, CharacterCard>;
  /** The accent a caption's stressed word takes, and the ribbon and label colors (the brand). */
  colors?: { titleRibbon: string; label: string };
  /** The page's mark in a corner of every frame, when the brand has one. */
  mark?: Mark | null;
  /**
   * For a video with a counter in its corner: how far into the whole video this part starts,
   * in ms, and whether it is the last part, where the counter stops and fades.
   */
  meterStartMs?: number;
  meterEnds?: boolean;
  /** For a counter that starts on a shot: when that is in the whole video, in ms. Left out, at the start. */
  meterFromMs?: number;
};

export const calculateStoryboardMetadata: CalculateMetadataFunction<StoryboardVideoProps> = ({
  props,
}) => {
  const size = SIZES[props.size];
  const shots = timedShots(props.storyboard, FPS);
  const last = shots[shots.length - 1];
  const fromTrack = props.track ? Math.ceil((props.track.durationMs / 1000) * FPS) : 0;
  return {
    width: size.width,
    height: size.height,
    fps: FPS,
    durationInFrames: Math.max(FPS, fromTrack, last?.endFrame ?? 0),
  };
};

export { captionOptions } from './screen';

/** True when two shots in a row hold up the same page, whatever line is marked. */
const samePage = (before: Overlay | undefined, now: Overlay): boolean =>
  before?.kind === 'page' && now.kind === 'page' && before.lines.join('|') === now.lines.join('|');

/** True when two shots in a row of one scene show the same person's bubble. */
const sameBubble = (before: TimedShot | undefined, now: TimedShot): boolean => {
  const a = before?.shot.overlay;
  const b = now.shot.overlay;
  return (
    before?.scene.id === now.scene.id &&
    a?.kind === 'bubble' &&
    b?.kind === 'bubble' &&
    a.of === b.of &&
    a.shape === b.shape
  );
};

/** Frames the counter takes to fade as the video ends, and how long before that it stops. */
const METER_FADE = 24;
const METER_HOLD = 54;

/** The most figures a video's counter can come to: three minutes of it, written out. */
export const meterDigits = (meter: { perSecond: number; prefix?: string | undefined }): number =>
  meterText(meter.perSecond * 200, meter.prefix).length;

/** A whip: frames to swing out and in, how far across the picture, and how much blur at its fastest. */
const WHIP_OUT = 3;
const WHIP_IN = 5;
const WHIP_SHIFT = 0.35;
const WHIP_BLUR = 0.03;
const easeOutCubic = (t: number): number => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
const easeInOutCubic = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
};
/**
 * The camera travelling from one picture to the next (2026-10-16): the frames it takes, how far a
 * dive goes in before the next picture has grown out of its point, and the blur at its fastest.
 */
export const TRAVEL_FRAMES = 14;
/** A lens takes longer: it pops open, holds so the inside can be seen, then grows. */
export const LENS_FRAMES = 32;
const DIVE_ZOOM = 6;
const TRAVEL_BLUR = 0.02;
const TRAVEL_DIRECTION: Record<
  Exclude<Travel, 'dive' | 'match' | 'wipe' | 'iris' | 'lens'>,
  { x: number; y: number }
> = {
  'travel-right': { x: 1, y: 0 },
  'travel-left': { x: -1, y: 0 },
  'travel-down': { x: 0, y: 1 },
  'travel-up': { x: 0, y: -1 },
};

export const StoryboardVideo = ({
  storyboard,
  track,
  audioSrc,
  cards,
  colors,
  mark,
  meterStartMs = 0,
  meterEnds = true,
  meterFromMs = 0,
}: StoryboardVideoProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames: lastFrame } = useVideoConfig();
  // In the last part the counter stops a little before the end, then fades.
  const meterStop = meterEnds ? lastFrame - METER_HOLD : lastFrame;
  /** How long the counter has been running at a frame of this part, in ms; negative before it starts. */
  const meterNowMs = (f: number) => meterStartMs + (f / fps) * 1000 - meterFromMs;
  const size = { width, height };
  const shots = timedShots(storyboard, fps);
  const ts = shotAt(shots, frame);
  if (!ts) return null;
  const looks = new Map(
    storyboard.cast.map((m) => [
      m.id,
      lookFrom(m.card ? (cards[m.card] ?? {}) : (m.look ?? {}), m.id),
    ]),
  );
  const pages = captionPagesFor(storyboard, track, size);
  const local = frame - ts.startFrame;
  const overlay = ts.shot.overlay;
  const titleGone = clamp((local / fps - TITLE_SECONDS) / TITLE_FADE, 0, 1);
  // A fade is on the first frames of the shot that asks for it and the last of the one before.
  const next = shots[ts.index + 1];
  // A whip: the old shot swings out to the left over its last frames and the new one swings in
  // from the right over its first, blurred as it moves.
  const whip = (() => {
    if (ts.shot.transition === 'whip' && local < WHIP_IN) {
      const k = 1 - easeOutCubic(local / WHIP_IN);
      return { dx: k * WHIP_SHIFT * width, blur: k * WHIP_BLUR * width };
    }
    const left = ts.endFrame - frame;
    if (next?.shot.transition === 'whip' && left <= WHIP_OUT) {
      const k = 1 - (left - 1) / WHIP_OUT;
      return { dx: -k * k * WHIP_SHIFT * width, blur: k * WHIP_BLUR * width };
    }
    return { dx: 0, blur: 0 };
  })();
  // The camera travelling here from the last picture: both are drawn while it moves, the last
  // held on its final frame.
  const before = shots[ts.index - 1];
  const arrives = arrivalOf(ts.shot, before?.shot, ts.index);
  const travelFrames = arrives === 'lens' ? LENS_FRAMES : TRAVEL_FRAMES;
  const travel =
    before && (TRAVELS as readonly string[]).includes(arrives) && local < travelFrames
      ? {
          kind: arrives as Travel,
          k: easeInOutCubic((local + 1) / (travelFrames + 1)),
          u: (local + 1) / (travelFrames + 1),
          before,
        }
      : null;
  const picture = (at: TimedShot, f: number) => (
    <Boil {...size} frame={f} amount={storyboard.finish?.boil ?? 0}>
      <ShotPicture
        ts={at}
        shots={shots}
        storyboard={storyboard}
        cards={cards}
        looks={looks}
        track={track}
        size={size}
        frame={f}
        fps={fps}
      />
    </Boil>
  );
  const travelled = (() => {
    if (!travel) return null;
    const { kind, k } = travel;
    const old = picture(travel.before, travel.before.endFrame - 1);
    const now = picture(ts, frame);
    // While a match or a dive brings in a picture smaller than the frame, the frame round it
    // fills with its page colour as it fades in: one picture changing colour, not a card on top.
    const page = ts.shot.graphic
      ? lookColour(
          storyboard.explainerLook ?? 'flat',
          pagesFor(shots.map((s) => s.shot.graphic))[ts.index] ?? 'cream',
        )
      : null;
    const wash = (shown: number) =>
      page ? <rect width={width} height={height} fill={page} opacity={shown} /> : null;
    if (kind === 'lens') {
      // A magnifying glass: a ringed circle pops open on the point with this picture inside,
      // holds while the camera leans in, then grows until it is the whole frame.
      const { u } = travel;
      const at = ts.shot.diveAt ?? { x: 0.5, y: 0.5 };
      const px = at.x * width;
      const py = at.y * height;
      const r0 = 0.24 * Math.min(width, height);
      const pop = easeOutBack(clamp(u / 0.3, 0, 1), 1.7);
      const grow = easeInOutCubic(clamp((u - 0.55) / 0.45, 0, 1));
      const far = Math.hypot(Math.max(px, width - px), Math.max(py, height - py)) * 1.05;
      const r = r0 * pop + (far - r0) * grow;
      // Inside, the next picture is centred on the lens, and slides back to the middle as it grows.
      const dx = (px - width / 2) * (1 - grow);
      const dy = (py - height / 2) * (1 - grow);
      const lean = 1 + 0.12 * clamp(u / 0.6, 0, 1);
      const ring = 0.012 * Math.min(width, height) * (1 - grow);
      const id = `lens-${ts.index}`;
      return (
        <>
          <g transform={`translate(${px} ${py}) scale(${lean}) translate(${-px} ${-py})`}>{old}</g>
          <defs>
            <clipPath id={id}>
              <circle cx={px} cy={py} r={Math.max(0, r)} />
            </clipPath>
          </defs>
          <circle
            cx={px}
            cy={py + ring * 1.5}
            r={Math.max(0, r + ring)}
            fill={ink}
            opacity={0.35}
          />
          <g clipPath={`url(#${id})`}>
            <g transform={`translate(${dx} ${dy})`}>{now}</g>
          </g>
          {ring > 0.5 && (
            <circle
              cx={px}
              cy={py}
              r={Math.max(0, r)}
              fill="none"
              stroke={white}
              strokeWidth={ring * 2}
            />
          )}
        </>
      );
    }
    if (kind === 'wipe' || kind === 'iris') {
      // The next picture is uncovered over the last: a slanted edge sweeping from the left with
      // a dark band leading it, or a circle opening from a point with a dark ring round it.
      const id = `wipe-${ts.index}`;
      const band = 0.035 * width;
      if (kind === 'wipe') {
        const slant = 0.3 * width;
        const pos = k * (width + slant + band);
        const shape = (x: number) =>
          `M -2 -2 L ${x} -2 L ${x - slant} ${height + 2} L -2 ${height + 2} Z`;
        return (
          <>
            {old}
            <defs>
              <clipPath id={id}>
                <path d={shape(pos - band)} />
              </clipPath>
            </defs>
            <path d={shape(pos)} fill={ink} />
            <g clipPath={`url(#${id})`}>{now}</g>
          </>
        );
      }
      const at = ts.shot.diveAt ?? { x: 0.5, y: 0.5 };
      const r = k * Math.hypot(width, height) * 1.05;
      return (
        <>
          {old}
          <defs>
            <clipPath id={id}>
              <circle cx={at.x * width} cy={at.y * height} r={r} />
            </clipPath>
          </defs>
          <circle cx={at.x * width} cy={at.y * height} r={r + band * 0.6} fill={ink} />
          <g clipPath={`url(#${id})`}>{now}</g>
        </>
      );
    }
    if (kind === 'match') {
      // A thing of the last picture becomes a thing of this one: the camera holds on it as it
      // moves and grows to where and how big the new thing is, and the picture around it
      // changes. Both pictures are moved alike, so the two things stay one on the other.
      const a = ts.shot.matchFrom ?? { x: 0.5, y: 0.5, size: 0.2 };
      const b = ts.shot.matchTo ?? a;
      const r = b.size / a.size;
      const cx = (a.x + (b.x - a.x) * k) * width;
      const cy = (a.y + (b.y - a.y) * k) * height;
      const oldScale = 1 + (r - 1) * k;
      const newScale = oldScale / r;
      const shown = clamp((k - 0.25) / 0.4, 0, 1);
      return (
        <>
          <g
            transform={`translate(${cx} ${cy}) scale(${oldScale}) translate(${-a.x * width} ${-a.y * height})`}
          >
            {old}
          </g>
          {wash(shown)}
          <g
            transform={`translate(${cx} ${cy}) scale(${newScale}) translate(${-b.x * width} ${-b.y * height})`}
            opacity={shown}
          >
            {now}
          </g>
        </>
      );
    }
    if (kind === 'dive') {
      // Into a point of the last picture, and the next grows out of that same point.
      const at = ts.shot.diveAt ?? { x: 0.5, y: 0.5 };
      const px = at.x * width;
      const py = at.y * height;
      const about = (scale: number) =>
        `translate(${px} ${py}) scale(${scale}) translate(${-px} ${-py})`;
      // The last picture stays under the next until the next covers the whole frame: no edge
      // of dark between them.
      const grown = clamp((k - 0.3) / 0.45, 0, 1);
      return (
        <>
          <g transform={about(1 + (DIVE_ZOOM - 1) * k * k)}>{old}</g>
          {wash(grown)}
          <g transform={about(0.12 + 0.88 * easeOutCubic(k))} opacity={grown}>
            {now}
          </g>
        </>
      );
    }
    const d = TRAVEL_DIRECTION[kind];
    const blur = TRAVEL_BLUR * width * Math.sin(Math.PI * k);
    return (
      <g {...(blur > 0.5 ? { filter: 'url(#travel-blur)' } : {})}>
        <defs>
          <filter id="travel-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={`${d.x ? blur : 0} ${d.y ? blur : 0}`} />
          </filter>
        </defs>
        <g transform={`translate(${-d.x * k * width} ${-d.y * k * height})`}>{old}</g>
        <g transform={`translate(${d.x * (1 - k) * width} ${d.y * (1 - k) * height})`}>{now}</g>
      </g>
    );
  })();
  // A rewind into the next shot: over the last frames of this one, everything since the start of
  // its scene plays backwards, fast, ending on the scene's first frame.
  const rewinding = (() => {
    if (next?.shot.transition !== 'rewind') return null;
    const left = ts.endFrame - frame;
    if (left > REWIND_FRAMES) return null;
    const k = 1 - left / REWIND_FRAMES;
    const from = Math.max(ts.sceneStartFrame, ts.endFrame - REWIND_FRAMES - 1);
    const sceneStart = shots.find((s) => s.scene === ts.scene)?.startFrame ?? ts.sceneStartFrame;
    const back = Math.round(from - (from - sceneStart) * rewindDone(k));
    const at = shotAt(shots, back) ?? ts;
    const style = next.shot.rewind?.style ?? 'film';
    return { k, frame: back, at, style, shake: rewindShake(style, k, frame / fps, height) };
  })();
  const fadeAt =
    ts.shot.transition === 'fade'
      ? ts.startFrame
      : next?.shot.transition === 'fade'
        ? next.startFrame
        : null;
  return (
    <AbsoluteFill style={{ backgroundColor: ink }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="whip-blur" x="-20%" y="0" width="140%" height="100%">
            <feGaussianBlur stdDeviation={`${whip.blur} 0`} />
          </filter>
        </defs>
        {rewinding ? (
          <>
            <defs>
              <RewindFilters style={rewinding.style} k={rewinding.k} t={frame / fps} />
            </defs>
            <g
              transform={`translate(${rewinding.shake.dx} ${rewinding.shake.dy})`}
              filter="url(#rewind-look)"
            >
              {picture(rewinding.at, rewinding.frame)}
            </g>
            <RewindOverlay
              style={rewinding.style}
              k={rewinding.k}
              t={frame / fps}
              W={width}
              H={height}
            />
          </>
        ) : (
          <g
            transform={`translate(${whip.dx} 0)`}
            {...(whip.blur > 0.5 ? { filter: 'url(#whip-blur)' } : {})}
          >
            {travelled ?? picture(ts, frame)}
          </g>
        )}
        {ts.shot.rewind && (
          <RewindStamp
            label={ts.shot.rewind.label}
            style={ts.shot.rewind.style}
            frame={local}
            W={width}
            H={height}
          />
        )}
        {storyboard.finish && (
          <Finish
            {...size}
            frame={frame}
            grain={storyboard.finish.grain}
            vignette={storyboard.finish.vignette}
          />
        )}
        {overlay?.kind === 'title' && titleGone < 1 && (
          <g opacity={1 - titleGone}>
            <TitleCard
              title={overlay.text}
              {...size}
              frame={local - 4}
              y={titleY(size)}
              {...(colors ? { paint: colors.titleRibbon } : {})}
            />
          </g>
        )}
        {overlay?.kind === 'label' && (
          <Label
            text={overlay.text}
            {...size}
            frame={local - 4}
            {...(colors ? { paint: colors.label } : {})}
          />
        )}
        {overlay?.kind === 'number' && (
          <BigNumber
            value={overlay.text}
            {...(overlay.caption ? { caption: overlay.caption } : {})}
            {...size}
            frame={local - 4}
            // A counter runs up over the first two thirds of its shot and then stands.
            {...(overlay.countUp
              ? {
                  shown: countedText(
                    overlay.text,
                    (local - 4) / Math.max(1, (ts.endFrame - ts.startFrame) * 0.66),
                  ),
                }
              : {})}
          />
        )}
        {overlay?.kind === 'words' && (
          <BigWords
            lines={overlay.lines}
            stress={overlay.stress}
            low={overlay.low}
            {...size}
            // The words a video opens on are there from its first frame; later ones pop in.
            {...(ts.index === 0 ? {} : { frame: local - 4 })}
          />
        )}
        {overlay?.kind === 'pointer' &&
          (() => {
            const place = pointerPlace(
              { storyboard, track, size, cards, fps },
              ts,
              shots,
              overlay,
              frame,
            );
            return place.seen ? (
              <Pointer
                text={overlay.text}
                at={place.at}
                to={place.to}
                {...size}
                frame={local - 4}
              />
            ) : null;
          })()}
        {overlay?.kind === 'page' && (
          <Page
            lines={overlay.lines}
            stress={overlay.stress}
            tally={overlay.tally}
            cover={overlay.cover}
            local={local}
            {...size}
            // A page that was already up in the shot before stays up: it does not pop in again.
            {...(samePage(shots[ts.index - 1]?.shot.overlay, overlay) ? {} : { frame: local - 4 })}
          />
        )}
        {overlay?.kind === 'bubble' && (
          <Bubble
            shape={overlay.shape}
            lines={overlay.lines}
            stress={overlay.stress}
            {...bubblePlace({ storyboard, track, size, cards, fps }, ts, shots, overlay, frame)}
            {...size}
            // A bubble that was already up in the shot before stays up: it does not pop in again.
            {...(sameBubble(shots[ts.index - 1], ts) ? {} : { frame: local - 4 })}
          />
        )}
        {overlay?.kind === 'orbit' && (
          <>
            <OrbitDiagram
              center={overlay.center}
              around={overlay.around}
              {...size}
              t={local / fps}
            />
            {overlay.text && <Label text={overlay.text} {...size} frame={local - 4} at="top" />}
          </>
        )}
        {storyboard.meter && (
          <Meter
            label={storyboard.meter.label}
            digits={meterDigits(storyboard.meter)}
            text={meterText(
              (storyboard.meter.perSecond * Math.max(0, meterNowMs(Math.min(frame, meterStop)))) /
                1000,
              storyboard.meter.prefix,
            )}
            {...size}
            // It comes in on the shot it starts on, and in the last part it fades as the video ends.
            opacity={
              clamp(((meterNowMs(frame) / 1000) * fps) / METER_FADE, 0, 1) *
              (meterEnds ? clamp((lastFrame - frame) / METER_FADE, 0, 1) : 1)
            }
          />
        )}
        {storyboard.gauges && (
          <Gauges
            gauges={storyboard.gauges}
            titleLines={ts.shot.graphic?.title?.lines.length ?? 0}
            shots={shots}
            track={track}
            frame={frame}
            fps={fps}
            {...size}
          />
        )}
        {mark && <Watermark mark={mark} {...size} />}
        {fadeAt !== null && <Fade frame={frame} at={fadeAt} {...size} />}
      </svg>
      {/* The words of a line do not run on while the picture rewinds. */}
      {!rewinding && <Captions pages={pages} />}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}
    </AbsoluteFill>
  );
};
