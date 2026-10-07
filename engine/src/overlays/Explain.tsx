import { Earth, FullMoon, Planet, Sun } from '../props/Sky';
import { clamp, easeOutBack } from '../rig/math';
import { accent, ink, lineWeights, pick, tokens, white } from '../tokens';
import { VIEWER_FONT, fitSize, textBasis, textWidth, viewerText } from './text';

/**
 * Explainer graphics for the science videos (Style 9): a big number, an arrow with a label,
 * and a diagram of one thing going round another. Like titles they are drawn over the picture
 * in the caption font, pop in with a small bounce, and keep out of the caption area.
 */

const font = `${VIEWER_FONT}, sans-serif`;
const POP_FRAMES = 7;
const pop = (frame: number | undefined): number =>
  frame === undefined ? 1 : easeOutBack(clamp(frame / POP_FRAMES, 0, 1), 1.9);

/** The sizes of a big number in a frame, before anything is drawn. */
export function bigNumberLayout(value: string, width: number, height: number, y?: number) {
  const text = viewerText(value);
  const basis = textBasis(width, height);
  const size = fitSize([text], basis * 0.135, basis * 0.84);
  // High in the frame, above the head of someone in a wide shot.
  const at = y ?? (width > height ? 0.085 : 0.15);
  return { text, basis, size, cx: width / 2, cy: height * at };
}

/** The box a big number and its caption take on screen. */
export function bigNumberBox(
  value: string,
  caption: string | undefined,
  width: number,
  height: number,
  y?: number,
) {
  const { text, size, cx, cy } = bigNumberLayout(value, width, height, y);
  const w = Math.max(textWidth(text, size), caption ? textWidth(caption, size * 0.3) : 0);
  return { x: cx - w / 2, y: cy - size * 0.75, width: w, height: size * (caption ? 1.5 : 1) };
}

/**
 * A big number: the one figure a shot is about ("1,670 km/h", "Day 1", "Year 100"), large in
 * gold with the captions' black outline, and an optional short line under it in a cream box.
 */
export function BigNumber({
  value,
  caption,
  width,
  height,
  frame,
  y,
  paint = 'gold',
}: {
  value: string;
  caption?: string;
  width: number;
  height: number;
  /** Frames since it appeared, for the pop. Left out, it is simply there. */
  frame?: number;
  /** Where its middle sits, as a share of the frame height. */
  y?: number;
  /** The number's color: an accent of the style by name. */
  paint?: string;
}) {
  const { text, basis, size, cx, cy } = bigNumberLayout(value, width, height, y);
  const s = pop(frame);
  if (s <= 0) return null;
  const sub = caption ? viewerText(caption) : null;
  const subSize = sub ? fitSize([sub], size * 0.3, basis * 0.8) : 0;
  const subW = sub ? textWidth(sub, subSize) + subSize * 1.6 : 0;
  const cream = accent('cream');
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <text
        x={0}
        y={size * 0.34}
        textAnchor="middle"
        fontFamily={font}
        fontWeight={700}
        fontSize={size}
        fill={pick(accent(paint), 0)}
        stroke={ink}
        strokeWidth={size * 0.16}
        strokeLinejoin={tokens.line.join}
        paintOrder="stroke"
      >
        {text}
      </text>
      {sub && (
        <g transform={`translate(0 ${size * 0.74})`}>
          <rect
            x={-subW / 2}
            y={-subSize * 0.9}
            width={subW}
            height={subSize * 1.8}
            rx={subSize * 0.4}
            fill={pick(cream, 0)}
            stroke={ink}
            strokeWidth={basis * 0.006}
          />
          <text
            x={0}
            y={subSize * 0.34}
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

/** The box a pointer's label takes on screen. `at` is its middle, as shares of the frame. */
export function pointerBox(
  text: string,
  at: { x: number; y: number },
  width: number,
  height: number,
) {
  const basis = textBasis(width, height);
  const size = fitSize([viewerText(text)], basis * 0.056, basis * 0.6);
  const bw = textWidth(viewerText(text), size) + size * 1.5;
  const bh = size * 1.75;
  return { x: at.x * width - bw / 2, y: at.y * height - bh / 2, width: bw, height: bh, size };
}

/**
 * An arrow with a label: a cream box with a few words, and a bold arrow from it to the thing
 * it names. `at` is the middle of the box and `to` the point of the arrow, both as shares of
 * the frame. The box pops in and the arrow grows out of it.
 */
export function Pointer({
  text,
  at,
  to,
  width,
  height,
  frame,
  paint = 'cream',
}: {
  text: string;
  at: { x: number; y: number };
  to: { x: number; y: number };
  width: number;
  height: number;
  frame?: number;
  paint?: string;
}) {
  const box = pointerBox(text, at, width, height);
  const basis = textBasis(width, height);
  const s = pop(frame);
  if (s <= 0) return null;
  const tones = accent(paint);
  const cx = at.x * width;
  const cy = at.y * height;
  const tip = { x: to.x * width, y: to.y * height };
  const dx = tip.x - cx;
  const dy = tip.y - cy;
  const reach = Math.hypot(dx, dy) || 1;
  const ux = dx / reach;
  const uy = dy / reach;
  // The arrow leaves from the edge of the box, not from under it.
  const out = Math.min(
    Math.abs(ux) > 1e-6 ? box.width / 2 / Math.abs(ux) : Infinity,
    Math.abs(uy) > 1e-6 ? box.height / 2 / Math.abs(uy) : Infinity,
  );
  const grown = frame === undefined ? 1 : clamp((frame - 3) / 6, 0, 1);
  const start = { x: cx + ux * out, y: cy + uy * out };
  const end = {
    x: start.x + (tip.x - start.x) * grown,
    y: start.y + (tip.y - start.y) * grown,
  };
  const shaft = basis * 0.014;
  const head = basis * 0.04;
  const edge = basis * 0.006;
  const neck = { x: end.x - ux * head, y: end.y - uy * head };
  const arrow = `M ${neck.x - uy * head * 0.6} ${neck.y + ux * head * 0.6} L ${end.x} ${end.y} L ${neck.x + uy * head * 0.6} ${neck.y - ux * head * 0.6} Z`;
  const line = `M ${start.x} ${start.y} L ${neck.x} ${neck.y}`;
  return (
    <g>
      {grown > 0.1 && reach > out + head && (
        <g strokeLinecap={tokens.line.cap} strokeLinejoin={tokens.line.join}>
          <path d={line} fill="none" stroke={ink} strokeWidth={shaft + 2 * edge} />
          <path d={arrow} fill={ink} stroke={ink} strokeWidth={2 * edge} />
          <path d={line} fill="none" stroke={white} strokeWidth={shaft} />
          <path d={arrow} fill={white} />
        </g>
      )}
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <rect
          x={-box.width / 2}
          y={-box.height / 2}
          width={box.width}
          height={box.height}
          rx={box.height * 0.22}
          fill={pick(tones, 0)}
          stroke={ink}
          strokeWidth={edge}
        />
        <text
          x={0}
          y={box.size * 0.34}
          textAnchor="middle"
          fontFamily={font}
          fontWeight={600}
          fontSize={box.size}
          fill={ink}
        >
          {viewerText(text)}
        </text>
      </g>
    </g>
  );
}

/** What can sit in the middle of an orbit diagram, and what can go round it. */
export const ORBIT_BODIES = ['sun', 'earth', 'moon', 'planet'] as const;
export type OrbitBody = (typeof ORBIT_BODIES)[number];

/** Seconds one trip round takes in the diagram. Not to scale: it has to be seen to move. */
export const ORBIT_SECONDS = 6;

/**
 * An orbit diagram: one thing in the middle, a tilted ring round it, and a smaller thing
 * going round on the ring, behind the middle on the far side and in front on the near side.
 * Sizes and speeds are for reading, not to scale. `t` is seconds.
 */
export function OrbitDiagram({
  center,
  around,
  width,
  height,
  t,
  y = 0.42,
}: {
  center: OrbitBody;
  around: OrbitBody;
  width: number;
  height: number;
  t: number;
  /** Where the middle sits, as a share of the frame height. */
  y?: number;
}) {
  const basis = textBasis(width, height);
  const unit = basis * 0.105;
  const [rx, ry] = [4.2, 1.5];
  const angle = (2 * Math.PI * t) / ORBIT_SECONDS;
  const px = rx * Math.cos(angle);
  const py = ry * Math.sin(angle);
  // On the far half of the ring the traveller is behind the middle and a little smaller.
  const far = py < 0;
  const body = (kind: OrbitBody, uid: string, r: number) =>
    kind === 'sun' ? (
      <Sun uid={uid} shadowSide={1} r={r} t={t} />
    ) : kind === 'earth' ? (
      <Earth uid={uid} shadowSide={1} r={r} t={t} />
    ) : kind === 'moon' ? (
      <FullMoon uid={uid} shadowSide={1} r={r} paint="gray" />
    ) : (
      <Planet uid={uid} shadowSide={1} r={r} />
    );
  const big = center === 'sun' ? 1.25 : 1.15;
  const small = around === 'moon' ? 0.4 : 0.52;
  const traveller = (
    <g transform={`translate(${px} ${py}) scale(${far ? 0.9 : 1})`}>
      {body(around, 'orbit-b', small)}
    </g>
  );
  const ring = (front: boolean) => (
    <path
      d={`M ${-rx} 0 A ${rx} ${ry} 0 0 ${front ? 0 : 1} ${rx} 0`}
      fill="none"
      strokeLinecap={tokens.line.cap}
      strokeDasharray="0.3 0.34"
    />
  );
  const drawRing = (front: boolean) => (
    <>
      <g stroke={ink} strokeWidth={0.1 + 2 * lineWeights.outline}>
        {ring(front)}
      </g>
      <g stroke={white} strokeWidth={0.1}>
        {ring(front)}
      </g>
    </>
  );
  return (
    <g transform={`translate(${width / 2} ${height * y}) scale(${unit}) rotate(-8)`}>
      {drawRing(false)}
      {far && traveller}
      {body(center, 'orbit-a', big)}
      {drawRing(true)}
      {!far && traveller}
    </g>
  );
}

/** The sizes of a page of writing in a frame, before anything is drawn. */
export function pageLayout(lines: readonly string[], width: number, height: number) {
  const basis = textBasis(width, height);
  const texts = lines.map(viewerText);
  // A wide frame has room for a bigger sheet.
  const w = basis * (width > height ? 1.12 : 0.88);
  const size = fitSize(texts, basis * 0.074, w * 0.84);
  const lineH = size * 1.75;
  const h = lineH * texts.length + size * 2.5;
  return {
    texts,
    basis,
    size,
    lineH,
    w,
    h,
    cx: width / 2,
    cy: height * (width > height ? 0.4 : 0.36),
  };
}

/** The box a page of writing takes on screen. */
export function pageBox(lines: readonly string[], width: number, height: number) {
  const { w, h, cx, cy } = pageLayout(lines, width, height);
  return { x: cx - w / 2, y: cy - h / 2, width: w, height: h };
}

/**
 * A page held up to the camera: a bill, a letter, a notice. A cream sheet with a gold band and
 * a few short lines of writing; one line can be marked in gold. It pops in like a title and
 * keeps out of the caption area. Use it in a shot with nobody in it: it fills the picture.
 */
export function Page({
  lines,
  stress,
  width,
  height,
  frame,
}: {
  lines: readonly string[];
  /** Which line is marked, counting from 0. */
  stress?: number | undefined;
  width: number;
  height: number;
  frame?: number;
}) {
  const { texts, basis, size, lineH, w, h, cx, cy } = pageLayout(lines, width, height);
  const s = pop(frame);
  if (s <= 0) return null;
  const paper = accent('cream');
  const gold = accent('gold');
  const edge = basis * 0.006;
  const left = -w / 2 + size * 0.85;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(-1.5) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={edge * 2} fill={pick(paper, 1)} />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h - edge * 4}
        rx={edge * 2}
        fill={pick(paper, 0)}
      />
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={edge * 2}
        fill="none"
        stroke={ink}
        strokeWidth={edge}
      />
      <rect
        x={left}
        y={-h / 2 + size * 0.62}
        width={w - size * 1.7}
        height={size * 0.4}
        fill={pick(gold, 0)}
        stroke={ink}
        strokeWidth={edge * 0.6}
      />
      {texts.map((text, i) => {
        const y = -h / 2 + size * 2.3 + i * lineH;
        return (
          <g key={`${i}-${text}`}>
            {i === stress && (
              <rect
                x={left - size * 0.3}
                y={y - size * 1.0}
                width={textWidth(text, size) + size * 0.6}
                height={size * 1.36}
                rx={size * 0.2}
                fill={pick(gold, 0)}
              />
            )}
            <text
              x={left}
              y={y}
              fontFamily={font}
              fontWeight={i === stress ? 700 : 600}
              fontSize={size}
              fill={ink}
            >
              {text}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** A counter's number as it is written: whole, with commas, after its sign ("$1,234,567"). */
export const meterText = (value: number, prefix = ''): string =>
  prefix +
  Math.max(0, Math.floor(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** The sizes of the corner counter in a frame. `digits` is the longest number it will show. */
export function meterLayout(label: string, digits: number, width: number, height: number) {
  const basis = textBasis(width, height);
  const size = basis * 0.038;
  const small = basis * 0.0205;
  const cell = size * 0.6;
  // Every fourth place is a comma, which takes half the room of a figure.
  const w = Math.max(textWidth(viewerText(label), small), cell * digits * 0.9) + size * 0.9;
  const h = size * 1.2 + small * 1.75;
  const margin = basis * 0.022;
  return {
    basis,
    size,
    small,
    cell,
    w,
    h,
    x: width - w - margin,
    y: height * (width > height ? 0.03 : 0.045),
  };
}

/** The box the corner counter takes on screen. */
export function meterBox(label: string, digits: number, width: number, height: number) {
  const { x, y, w, h } = meterLayout(label, digits, width, height);
  return { x, y, width: w, height: h };
}

/**
 * A counter in the top corner that runs through the whole video: a dark plate with a few
 * words and a number in gold. Every figure has its own place, so the number does not shake
 * as it climbs.
 */
export function Meter({
  label,
  text,
  digits,
  width,
  height,
  opacity = 1,
}: {
  label: string;
  /** The number as written, from meterText. */
  text: string;
  digits: number;
  width: number;
  height: number;
  opacity?: number;
}) {
  const { basis, size, small, cell, w, h, x, y } = meterLayout(label, digits, width, height);
  if (opacity <= 0) return null;
  const plate = accent('steel');
  const gold = accent('gold');
  const edge = basis * 0.004;
  const right = x + w - size * 0.45;
  // Each figure has its own place, counted from the right; a comma takes half of one.
  const chars = [...text];
  const places: number[] = [];
  let at = 0;
  for (let i = chars.length - 1; i >= 0; i--) {
    const wide = chars[i] === ',' ? 0.5 : 1;
    places[i] = at + wide / 2;
    at += wide;
  }
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={h * 0.16} fill={pick(plate, 1)} />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={h * 0.16}
        fill="none"
        stroke={ink}
        strokeWidth={edge}
      />
      <text
        x={right}
        y={y + small * 1.35}
        textAnchor="end"
        fontFamily={font}
        fontWeight={500}
        fontSize={small}
        fill={white}
      >
        {viewerText(label)}
      </text>
      {chars.map((ch, i) => (
        <text
          key={i}
          x={right - (places[i] ?? 0) * cell}
          y={y + small * 1.75 + size * 0.86}
          textAnchor="middle"
          fontFamily={font}
          fontWeight={700}
          fontSize={size}
          fill={pick(gold, 0)}
        >
          {ch}
        </text>
      ))}
    </g>
  );
}

/** How wide and tall a tag is, in head units. */
export function sceneTagSize(text: string) {
  const size = 0.3;
  return { size, width: textWidth(viewerText(text), size) + 0.36, height: 0.52 };
}

/**
 * A tag tied to a thing in the scene ("SUNLIGHT", "USA, one year"): a small cream label on a
 * short string, drawn in the scene in head units so it stays with its thing. The origin is
 * where the string is tied.
 */
export function SceneTag({
  text,
  frame,
  below = false,
}: {
  text: string;
  frame?: number;
  /** True for a tag that hangs under its thing, like a price tag, instead of standing on it. */
  below?: boolean;
}) {
  const { size, width, height } = sceneTagSize(text);
  const s = pop(frame);
  if (s <= 0) return null;
  const tones = accent('cream');
  const dy = below ? 0.3 : -0.3;
  return (
    <g transform={`scale(${s})`}>
      <path
        d={`M 0 0 L 0.06 ${dy}`}
        stroke={ink}
        strokeWidth={lineWeights.detail * 1.6}
        strokeLinecap={tokens.line.cap}
      />
      <g transform={`translate(0.06 ${dy + (below ? height : 0)}) rotate(-4)`}>
        <rect
          x={-width / 2}
          y={-height}
          width={width}
          height={height}
          rx={0.1}
          fill={pick(tones, 0)}
          stroke={ink}
          strokeWidth={lineWeights.outline}
        />
        {/* The words are set at a size a browser draws well, then scaled to the scene. */}
        <g transform={`translate(0 ${-height / 2 + size * 0.36}) scale(0.01)`}>
          <text
            textAnchor="middle"
            fontFamily={font}
            fontWeight={700}
            fontSize={size * 100}
            fill={ink}
          >
            {viewerText(text)}
          </text>
        </g>
      </g>
    </g>
  );
}
