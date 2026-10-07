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
