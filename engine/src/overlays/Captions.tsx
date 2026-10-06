import { loadFont } from '@remotion/fonts';
import { interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { tokens } from '../tokens';
import { pageAt } from './captionPages';
import { VIEWER_FONT } from './text';
import type { CaptionPage } from './captionPages';

/** Heavy rounded, openly licensed caption font (Style 9), bundled locally (SIL OFL 1.1). */
export const CAPTION_FONT = VIEWER_FONT;

// loadFont holds rendering until the font is ready, so frames never use a fallback font.
void loadFont({
  family: CAPTION_FONT,
  url: staticFile('fonts/Fredoka-Variable.ttf'),
  weight: '300 700',
});

type Props = {
  pages: readonly CaptionPage[];
  /** Caption font size in px for a 1080 wide frame; scales with the frame width. */
  size?: number;
};

/**
 * Captions in the caption-safe area: the bottom quarter of a 9:16 frame (Style 7).
 * White with a black outline in the weight of the line art; emphasized words turn gold (Style 9).
 * Each page pops in over 4 frames.
 */
export const Captions = ({ pages, size = 78 }: Props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const page = pageAt(pages, ms);
  if (!page) return null;

  const scale = width / 1080;
  const fontSize = size * scale;
  const lineHeight = fontSize * 1.18;
  const safeTop = height * (1 - tokens.captions.safeBottomPct916);
  const blockHeight = lineHeight * page.lines.length;
  const firstBaseline = safeTop + (height - safeTop - blockHeight) * 0.42 + fontSize;
  const pageFrame = Math.round((page.startMs / 1000) * fps);
  const pop = interpolate(frame, [pageFrame, pageFrame + 4], [0.86, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', inset: 0 }}
    >
      <g
        transform={`translate(${width / 2} ${firstBaseline + blockHeight / 2}) scale(${pop}) translate(${-width / 2} ${-(firstBaseline + blockHeight / 2)})`}
      >
        {page.lines.map((line, li) => (
          <text
            key={li}
            x={width / 2}
            y={firstBaseline + li * lineHeight}
            textAnchor="middle"
            fontFamily={`${CAPTION_FONT}, sans-serif`}
            fontWeight={700}
            fontSize={fontSize}
            stroke={tokens.captions.stroke}
            strokeWidth={fontSize * 0.2}
            strokeLinejoin={tokens.line.join}
            paintOrder="stroke"
          >
            {line.map((w, wi) => (
              <tspan key={wi} fill={w.emphasis ? tokens.captions.emphasis : tokens.captions.fill}>
                {wi === 0 ? w.text.trim() : ` ${w.text.trim()}`}
              </tspan>
            ))}
          </text>
        ))}
      </g>
    </svg>
  );
};
