import { clamp, easeOutBack } from '../rig/math';
import { accent, ink, pick, tokens } from '../tokens';
import { textBasis, VIEWER_FONT, fitSize, textWidth, viewerText, wrapWords } from './text';

/**
 * Titles and labels (Style 9): outlined boxes and banners with flat fills, made like props,
 * with the caption font on them. They pop in with a small bounce and then hold still.
 * A title card names the video or a chapter; a label names a place, a date or a person.
 * Neither goes in the caption area at the bottom of the frame.
 */

const font = `${VIEWER_FONT}, sans-serif`;

/** Frames a title or label takes to pop in. */
export const TITLE_POP_FRAMES = 7;

const pop = (frame: number | undefined): number =>
  frame === undefined ? 1 : easeOutBack(clamp(frame / TITLE_POP_FRAMES, 0, 1), 1.9);

/** The line weight of title boxes, matched to the characters: a share of the frame width. */
const edgeFor = (width: number) => width * 0.0075;

/**
 * A title card: a ribbon banner across the upper middle of the frame with the title on it in
 * white, and an optional smaller line under it on a cream box. Long titles wrap onto two
 * lines and shrink to fit.
 */
export function TitleCard({
  title,
  subtitle,
  width,
  height,
  frame,
  paint = 'crimson',
  y = 0.3,
}: {
  title: string;
  subtitle?: string;
  width: number;
  height: number;
  /** Frames since it appeared, for the pop. Left out, it is simply there. */
  frame?: number;
  /** The banner's color: the name of a token accent. */
  paint?: string;
  /** Where its middle sits, as a share of the frame height. */
  y?: number;
}) {
  const tones = accent(paint);
  // A wide frame has room for a longer line, so a short title stays on one.
  const lines = wrapWords(viewerText(title), width > height ? 24 : 16).slice(0, 3);
  const basis = textBasis(width, height);
  const maxText = basis * 0.72;
  const size = fitSize(lines, basis * 0.105, maxText);
  const lineHeight = size * 1.12;
  const textW = Math.max(...lines.map((l) => textWidth(l, size)));
  const edge = edgeFor(basis);
  const bw = Math.min(basis * 0.9, textW + size * 1.5);
  const bh = lineHeight * lines.length + size * 0.7;
  const cx = width / 2;
  const cy = height * y;
  const tail = size * 0.55;
  const s = pop(frame);
  if (s <= 0) return null;
  // A ribbon: a box with a swallow-tail cut into each end.
  const ribbon = `M ${-bw / 2 - tail} ${-bh / 2} L ${bw / 2 + tail} ${-bh / 2} L ${bw / 2} 0 L ${bw / 2 + tail} ${bh / 2} L ${-bw / 2 - tail} ${bh / 2} L ${-bw / 2} 0 Z`;
  const sub = subtitle ? viewerText(subtitle) : null;
  const subSize = sub ? fitSize([sub], size * 0.46, basis * 0.7) : 0;
  const subW = sub ? textWidth(sub, subSize) + subSize * 1.6 : 0;
  const subH = subSize * 1.7;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <path d={ribbon} fill={pick(tones, 1)} />
      <path
        d={`M ${-bw / 2 - tail} ${-bh / 2} L ${bw / 2 + tail} ${-bh / 2} L ${bw / 2 + tail * 0.18} ${bh * 0.32} L ${-bw / 2 - tail * 0.18} ${bh * 0.32} Z`}
        fill={pick(tones, 0)}
      />
      <path
        d={ribbon}
        fill="none"
        stroke={ink}
        strokeWidth={edge}
        strokeLinejoin={tokens.line.join}
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={0}
          y={(i - (lines.length - 1) / 2) * lineHeight + size * 0.35}
          textAnchor="middle"
          fontFamily={font}
          fontWeight={700}
          fontSize={size}
          fill={tokens.captions.fill}
          stroke={tokens.captions.stroke}
          strokeWidth={size * 0.16}
          strokeLinejoin={tokens.line.join}
          paintOrder="stroke"
        >
          {line}
        </text>
      ))}
      {sub && (
        <g transform={`translate(0 ${bh / 2 + subH * 0.72})`}>
          <rect
            x={-subW / 2}
            y={-subH / 2}
            width={subW}
            height={subH}
            rx={subH * 0.22}
            fill={pick(accent('cream'), 0)}
            stroke={ink}
            strokeWidth={edge * 0.8}
          />
          <text
            x={0}
            y={subSize * 0.35}
            textAnchor="middle"
            fontFamily={font}
            fontWeight={600}
            fontSize={subSize}
            fill={ink}
          >
            {sub}
          </text>
        </g>
      )}
    </g>
  );
}

/** Where a label can sit: the top corners or the top middle, clear of faces and captions. */
export const LABEL_PLACES = ['top-left', 'top-right', 'top'] as const;

/**
 * A label: a small outlined cream box with dark text, for a place ("The palace"), a date
 * ("Three days later") or a name. It sits at the top of the frame.
 */
export function Label({
  text,
  width,
  height,
  frame,
  at = 'top-left',
  paint = 'cream',
}: {
  text: string;
  width: number;
  height: number;
  frame?: number;
  at?: (typeof LABEL_PLACES)[number];
  paint?: string;
}) {
  const tones = accent(paint);
  const words = viewerText(text);
  const basis = textBasis(width, height);
  const size = fitSize([words], basis * 0.052, basis * 0.74);
  const bw = textWidth(words, size) + size * 1.5;
  const bh = size * 1.75;
  const edge = edgeFor(basis) * 0.8;
  const margin = basis * 0.05;
  const cx =
    at === 'top-left' ? margin + bw / 2 : at === 'top-right' ? width - margin - bw / 2 : width / 2;
  const cy = height * 0.075;
  const s = pop(frame);
  if (s <= 0) return null;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <rect x={-bw / 2} y={-bh / 2} width={bw} height={bh} rx={bh * 0.22} fill={pick(tones, 1)} />
      <rect
        x={-bw / 2}
        y={-bh / 2}
        width={bw}
        height={bh * 0.82}
        rx={bh * 0.22}
        fill={pick(tones, 0)}
      />
      <rect
        x={-bw / 2}
        y={-bh / 2}
        width={bw}
        height={bh}
        rx={bh * 0.22}
        fill="none"
        stroke={ink}
        strokeWidth={edge}
      />
      <text
        x={0}
        y={size * 0.34}
        textAnchor="middle"
        fontFamily={font}
        fontWeight={600}
        fontSize={size}
        fill={ink}
      >
        {words}
      </text>
    </g>
  );
}
