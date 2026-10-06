import { Audio } from '@remotion/media';
import { FPS, SIZES } from '@studio/shared';
import type { CharacterCard, SizeName, Storyboard, VoiceTrack } from '@studio/shared';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Fade } from '../camera/Camera';
import { Captions } from '../overlays/Captions';
import { DEFAULT_PAGE_OPTIONS, buildPages, toCaptions } from '../overlays/captionPages';
import type { PageOptions } from '../overlays/captionPages';
import { Label, TitleCard } from '../overlays/Titles';
import { clamp } from '../rig/math';
import { ink } from '../tokens';
import { lookFrom } from '../wardrobe/cast';
import { shotAt, timedShots } from './layout';
import type { Size } from './layout';
import { ShotPicture } from './ShotPicture';

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

/** A wide frame shows one longer line at a time; a tall one takes two short lines. */
export const captionOptions = (size: Size): PageOptions =>
  size.width > size.height
    ? { ...DEFAULT_PAGE_OPTIONS, maxLineChars: 34, maxLines: 1 }
    : DEFAULT_PAGE_OPTIONS;

/** How long the title stays, in seconds, and how long it takes to go. */
const TITLE_SECONDS = 2.6;
const TITLE_FADE = 0.25;

export const StoryboardVideo = ({
  storyboard,
  track,
  audioSrc,
  cards,
  colors,
}: StoryboardVideoProps) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
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
  const pages = track ? buildPages(toCaptions(track.words), captionOptions(size)) : [];
  const local = frame - ts.startFrame;
  const overlay = ts.shot.overlay;
  const titleGone = clamp((local / fps - TITLE_SECONDS) / TITLE_FADE, 0, 1);
  // A fade is on the first frames of the shot that asks for it and the last of the one before.
  const next = shots[ts.index + 1];
  const fadeAt =
    ts.shot.transition === 'fade'
      ? ts.startFrame
      : next?.shot.transition === 'fade'
        ? next.startFrame
        : null;
  return (
    <AbsoluteFill style={{ backgroundColor: ink }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <ShotPicture
          ts={ts}
          shots={shots}
          storyboard={storyboard}
          cards={cards}
          looks={looks}
          track={track}
          size={size}
          frame={frame}
          fps={fps}
        />
        {overlay?.kind === 'title' && titleGone < 1 && (
          <g opacity={1 - titleGone}>
            <TitleCard
              title={overlay.text}
              {...size}
              frame={local - 4}
              y={width > height ? 0.13 : 0.17}
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
        {fadeAt !== null && <Fade frame={frame} at={fadeAt} {...size} />}
      </svg>
      <Captions pages={pages} />
      {audioSrc && <Audio src={staticFile(audioSrc)} />}
    </AbsoluteFill>
  );
};
