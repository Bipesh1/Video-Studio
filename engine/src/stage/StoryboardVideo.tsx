import { Audio } from '@remotion/media';
import { FPS, SIZES } from '@studio/shared';
import type { CharacterCard, SizeName, Storyboard, VoiceTrack } from '@studio/shared';
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Fade } from '../camera/Camera';
import { Watermark } from '../overlays/Brand';
import type { Mark } from '../overlays/Brand';
import { Captions } from '../overlays/Captions';
import { BigNumber, OrbitDiagram, Pointer } from '../overlays/Explain';
import { Label, TitleCard } from '../overlays/Titles';
import { clamp } from '../rig/math';
import { ink } from '../tokens';
import { lookFrom } from '../wardrobe/cast';
import { shotAt, timedShots } from './layout';
import { pointerPlace } from './measure';
import { TITLE_FADE, TITLE_SECONDS, captionPagesFor, titleY } from './screen';
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
  /** The page's mark in a corner of every frame, when the brand has one. */
  mark?: Mark | null;
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

export const StoryboardVideo = ({
  storyboard,
  track,
  audioSrc,
  cards,
  colors,
  mark,
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
  const pages = captionPagesFor(storyboard, track, size);
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
          />
        )}
        {overlay?.kind === 'pointer' && (
          <Pointer
            text={overlay.text}
            {...pointerPlace({ storyboard, track, size, cards, fps }, ts, shots, overlay)}
            {...size}
            frame={local - 4}
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
        {mark && <Watermark mark={mark} {...size} />}
        {fadeAt !== null && <Fade frame={frame} at={fadeAt} {...size} />}
      </svg>
      <Captions pages={pages} />
      {audioSrc && <Audio src={staticFile(audioSrc)} />}
    </AbsoluteFill>
  );
};
