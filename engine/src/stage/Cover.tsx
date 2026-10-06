import { FPS, SIZES } from '@studio/shared';
import type { CharacterCard, Framing, SizeName, Storyboard } from '@studio/shared';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Fade } from '../camera/Camera';
import { shotTransform } from '../camera/Framing';
import { ClosingCard } from '../overlays/Brand';
import { VIEWER_FONT, fitSize, textBasis, viewerText, wrapWords } from '../overlays/text';
import { TitleCard } from '../overlays/Titles';
import { ink, tokens } from '../tokens';
import { lookFrom } from '../wardrobe/cast';
import { timedShots } from './layout';
import { ShotPicture } from './ShotPicture';
import { stageShot } from './staging';

/**
 * The cover picture of a video and the closing card of a page (Phase 4F). A cover is one shot
 * of the video, held at its best moment and framed for a small picture, with the title on it.
 * Four ways of setting the title, by name:
 *   words   the title in big outlined letters across the bottom, its last word in gold
 *   ribbon  the title on the same ribbon the video opens with
 *   band    the title in white on a dark band along the bottom
 *   side    in a wide cover: the picture slid to the right and the title stacked on the left,
 *           so nothing in the picture is under it (in a tall cover it is the same as words)
 */

export const COVER_LAYOUTS = ['words', 'ribbon', 'band', 'side'] as const;
export type CoverLayout = (typeof COVER_LAYOUTS)[number];

export type CoverProps = {
  /** A part of the video with the voice's times in its shots. */
  storyboard: Storyboard;
  cards: Record<string, CharacterCard>;
  size: SizeName;
  /** The shot the cover shows, and how far into it (0 to 1). */
  shot: string;
  at: number;
  /** A shot size to show it in, when the shot's own is not the best for a small picture. */
  framing?: Framing;
  title: string;
  layout: CoverLayout;
  /** The ribbon's color: a token accent. */
  paint?: string;
};

export const calculateCoverMetadata: CalculateMetadataFunction<CoverProps> = ({ props }) => ({
  ...SIZES[props.size],
  fps: FPS,
  durationInFrames: 1,
});

const font = `${VIEWER_FONT}, sans-serif`;

/** The title in big outlined letters, bottom up from `bottom`: centred, or from the left at `left`. */
function BigWords({
  lines,
  width,
  bottom,
  size,
  gold,
  left,
}: {
  lines: readonly string[];
  width: number;
  bottom: number;
  size: number;
  /** Turn the last word gold, as captions do for the word that matters. */
  gold: boolean;
  left?: number;
}) {
  const lineHeight = size * 1.08;
  return (
    <g>
      {lines.map((line, i) => {
        const words = line.split(' ');
        const last = i === lines.length - 1;
        return (
          <text
            key={i}
            x={left ?? width / 2}
            y={bottom - (lines.length - 1 - i) * lineHeight}
            textAnchor={left === undefined ? 'middle' : 'start'}
            fontFamily={font}
            fontWeight={700}
            fontSize={size}
            stroke={tokens.captions.stroke}
            strokeWidth={size * 0.2}
            strokeLinejoin={tokens.line.join}
            paintOrder="stroke"
          >
            {words.map((word, k) => (
              <tspan
                key={k}
                fill={
                  gold && last && k === words.length - 1
                    ? tokens.captions.emphasis
                    : tokens.captions.fill
                }
              >
                {k === 0 ? word : ` ${word}`}
              </tspan>
            ))}
          </text>
        );
      })}
    </g>
  );
}

export const Cover = ({
  storyboard,
  cards,
  shot,
  at,
  framing,
  title,
  layout,
  paint,
}: CoverProps) => {
  const { width, height, fps } = useVideoConfig();
  const size = { width, height };
  // The shot as the cover wants it: held still, in the size asked for.
  const held: Storyboard = {
    ...storyboard,
    scenes: storyboard.scenes.map((scene) => ({
      ...scene,
      shots: scene.shots.map((s) =>
        s.id === shot
          ? {
              ...s,
              camera: { ...s.camera, move: 'none' as const, ...(framing ? { framing } : {}) },
              transition: 'cut' as const,
            }
          : s,
      ),
    })),
  };
  const shots = timedShots(held, fps);
  const ts = shots.find((s) => s.shot.id === shot) ?? shots[0];
  if (!ts) return null;
  const frame = Math.min(
    ts.endFrame - 1,
    Math.round(ts.startFrame + (ts.endFrame - ts.startFrame) * at),
  );
  const looks = new Map(
    held.cast.map((m) => [m.id, lookFrom(m.card ? (cards[m.card] ?? {}) : (m.look ?? {}), m.id)]),
  );
  const words = viewerText(title);
  const basis = textBasis(width, height);
  const wide = width > height;
  const lines = wrapWords(words, wide ? 18 : 11).slice(0, 3);
  const big = fitSize(lines, basis * (wide ? 0.17 : 0.2), width * 0.9);
  const bandH = lines.length * big * 1.08 + big * 0.7;
  // To the side: the picture slides right as far as the scene reaches, and the title stacks
  // up in the room that leaves.
  const aside = layout === 'side' && wide;
  const staged = stageShot({ ts, shots, storyboard: held, cards, track: null, size, frame, fps });
  const framed = shotTransform(staged.shot.camera.framing, staged.focus, size, staged.side);
  const slide = aside ? Math.max(0, Math.min(0.2 * width, -framed.x)) : 0;
  const stack = wrapWords(words, 9).slice(0, 4);
  const stackSize = fitSize(stack, basis * 0.22, width * 0.4);
  const stackBottom = height / 2 + ((stack.length - 1) * stackSize * 1.08) / 2 + stackSize * 0.35;
  return (
    <AbsoluteFill style={{ backgroundColor: ink }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g transform={`translate(${slide} 0)`}>
          <ShotPicture
            ts={ts}
            shots={shots}
            storyboard={held}
            cards={cards}
            looks={looks}
            track={null}
            size={size}
            frame={frame}
            fps={fps}
          />
        </g>
        {aside && (
          <BigWords
            lines={stack}
            width={width}
            bottom={stackBottom}
            size={stackSize}
            gold
            left={width * 0.05}
          />
        )}
        {layout === 'ribbon' && (
          <g
            transform={`translate(${width / 2} ${height * (wide ? 0.82 : 0.84)}) scale(${wide ? 1.35 : 1})`}
          >
            <g transform={`translate(${-width / 2} 0)`}>
              <TitleCard title={words} {...size} y={0} {...(paint ? { paint } : {})} />
            </g>
          </g>
        )}
        {(layout === 'words' || (layout === 'side' && !wide)) && (
          <BigWords lines={lines} width={width} bottom={height * 0.93} size={big} gold />
        )}
        {layout === 'band' && (
          <>
            <rect y={height - bandH} width={width} height={bandH} fill={ink} />
            <BigWords
              lines={lines}
              width={width}
              bottom={height - big * 0.55}
              size={big}
              gold={false}
            />
          </>
        )}
      </svg>
    </AbsoluteFill>
  );
};

export type ClosingCardVideoProps = {
  text: string;
  subtext?: string;
  size: SizeName;
  seconds: number;
  paint?: string;
};

export const calculateClosingMetadata: CalculateMetadataFunction<ClosingCardVideoProps> = ({
  props,
}) => ({
  ...SIZES[props.size],
  fps: FPS,
  durationInFrames: Math.max(1, Math.round(props.seconds * FPS)),
});

/** The closing card as a short clip that comes up out of the dark the last shot went into. */
export const ClosingCardVideo = ({ text, subtext, paint }: ClosingCardVideoProps) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: ink }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <ClosingCard
          text={text}
          {...(subtext ? { subtext } : {})}
          width={width}
          height={height}
          frame={frame - 4}
          {...(paint ? { paint } : {})}
        />
        <Fade frame={frame} at={0} width={width} height={height} />
      </svg>
    </AbsoluteFill>
  );
};
