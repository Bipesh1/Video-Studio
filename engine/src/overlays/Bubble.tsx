import { clamp, easeOutBack } from '../rig/math';
import { accent, ink, pick, tokens, white } from '../tokens';
import { VIEWER_FONT, fitSize, textBasis, textWidth, viewerText } from './text';

/**
 * A bubble over someone's head (Style 9): what they think, in a cloud with small puffs leading
 * down to the head, or what they say, in a balloon with a pointed tail. A few short lines in
 * the caption font. Like a label it is an outlined shape with a flat fill, pops in with a small
 * bounce and keeps out of the caption area. A speech balloon can also drift off across the
 * picture and burst.
 */

const font = `${VIEWER_FONT}, sans-serif`;
const POP_FRAMES = 7;
const pop = (frame: number | undefined): number =>
  frame === undefined ? 1 : easeOutBack(clamp(frame / POP_FRAMES, 0, 1), 1.9);

export type BubbleShape = 'thought' | 'speech';

/** The sizes of a bubble in a frame, before anything is drawn. */
export function bubbleLayout(lines: readonly string[], width: number, height: number) {
  const texts = lines.map(viewerText);
  const basis = textBasis(width, height);
  const size = fitSize(texts, basis * 0.058, basis * 0.78);
  const lead = size * 1.3;
  const bw = Math.max(...texts.map((t) => textWidth(t, size))) + size * 2;
  const bh = texts.length * lead + size * 1.1;
  return { texts, basis, size, lead, bw, bh };
}

/** The box a bubble takes on screen. `at` is its middle, px. */
export function bubbleBox(
  lines: readonly string[],
  at: { x: number; y: number },
  width: number,
  height: number,
) {
  const { bw, bh } = bubbleLayout(lines, width, height);
  return { x: at.x - bw / 2, y: at.y - bh / 2, width: bw, height: bh };
}

/** Frames a bursting balloon's flash stays up. */
export const BURST_FRAMES = 6;

export function Bubble({
  shape,
  lines,
  stress,
  at,
  tail,
  width,
  height,
  frame,
  burst,
}: {
  shape: BubbleShape;
  lines: readonly string[];
  /** Which line is marked in gold, counting from 0. */
  stress?: number | undefined;
  /** The middle of the bubble, px. */
  at: { x: number; y: number };
  /** The point its tail leads to (the top of a head), px. Null: a balloon adrift, with no tail. */
  tail: { x: number; y: number } | null;
  width: number;
  height: number;
  /** Frames since it appeared, for the pop. Left out, it is simply there. */
  frame?: number | undefined;
  /** Frames since it burst. Left out, it is whole. */
  burst?: number | undefined;
}) {
  const { texts, basis, size, lead, bw, bh } = bubbleLayout(lines, width, height);
  const edge = basis * 0.006;
  const gold = pick(accent('gold'), 0);
  if (burst !== undefined && burst >= 0) {
    if (burst >= BURST_FRAMES) return null;
    // The flash of a balloon bursting: a white star with a black edge, gone in a moment.
    const k = clamp((burst + 1) / BURST_FRAMES, 0, 1);
    const r = (bh / 2) * (0.7 + 0.8 * k);
    const points = Array.from({ length: 16 }, (_, i) => {
      const a = (Math.PI * 2 * i) / 16;
      const rr = i % 2 === 0 ? r : r * 0.5;
      return `${at.x + Math.cos(a) * rr * (bw / bh) * 0.7} ${at.y + Math.sin(a) * rr}`;
    });
    return (
      <path
        d={`M ${points.join(' L ')} Z`}
        fill={white}
        stroke={ink}
        strokeWidth={edge}
        strokeLinejoin={tokens.line.join}
        opacity={1 - k * 0.5}
      />
    );
  }
  const s = pop(frame);
  if (s <= 0) return null;
  const hw = bw / 2;
  const hh = bh / 2;
  // The tail: from the edge of the bubble toward the head, stopping a little short of it.
  const dx = tail ? tail.x - at.x : 0;
  const dy = tail ? tail.y - at.y : 0;
  const reach = Math.hypot(dx, dy) || 1;
  const ux = dx / reach;
  const uy = dy / reach;
  const out = Math.min(
    Math.abs(ux) > 1e-6 ? hw / Math.abs(ux) : Infinity,
    Math.abs(uy) > 1e-6 ? hh / Math.abs(uy) : Infinity,
  );
  const root = { x: ux * out * 0.86, y: uy * out * 0.86 };
  const gap = Math.max(0, reach - out);
  const body =
    shape === 'speech' ? (
      <>
        {tail && gap > size * 0.3 && (
          <path
            d={`M ${root.x - uy * size * 0.5} ${root.y + ux * size * 0.5} L ${ux * (out + gap * 0.8)} ${uy * (out + gap * 0.8)} L ${root.x + uy * size * 0.5} ${root.y - ux * size * 0.5} Z`}
            fill={white}
            stroke={ink}
            strokeWidth={edge}
            strokeLinejoin={tokens.line.join}
          />
        )}
        <rect
          x={-hw}
          y={-hh}
          width={bw}
          height={bh}
          rx={hh * 0.5}
          fill={white}
          stroke={ink}
          strokeWidth={edge}
        />
        {/* The balloon again without an edge, so the tail joins it with no line between. */}
        {tail && gap > size * 0.3 && (
          <path
            d={`M ${root.x - uy * size * 0.42} ${root.y + ux * size * 0.42} L ${ux * out * 1.02} ${uy * out * 1.02} L ${root.x + uy * size * 0.42} ${root.y - ux * size * 0.42} Z`}
            fill={white}
          />
        )}
      </>
    ) : (
      (() => {
        // A cloud: round bumps all the way round a soft middle. Every bump is drawn with an
        // edge first and then again without one, so only the outside of the cloud has a line.
        const across = Math.max(3, Math.round(bw / (size * 1.5)));
        const down = Math.max(1, Math.round(bh / (size * 1.6)));
        const bumps: Array<{ x: number; y: number; r: number }> = [];
        for (let i = 0; i < across; i++) {
          const x = -hw + ((i + 0.5) / across) * bw;
          const r = (bw / across) * 0.62;
          bumps.push({ x, y: -hh + r * 0.35, r }, { x, y: hh - r * 0.35, r });
        }
        for (let i = 0; i < down; i++) {
          const y = -hh + ((i + 0.5) / down) * bh;
          const r = (bh / down) * 0.5;
          bumps.push({ x: -hw + r * 0.3, y, r }, { x: hw - r * 0.3, y, r });
        }
        const puffs = tail
          ? [0.3, 0.6, 0.86].map((k, i) => ({
              x: ux * (out + gap * k),
              y: uy * (out + gap * k),
              r: size * (0.34 - i * 0.09),
            }))
          : [];
        return (
          <>
            {gap > size * 0.8 &&
              puffs.map((p, i) => (
                <circle
                  key={`p${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill={white}
                  stroke={ink}
                  strokeWidth={edge}
                />
              ))}
            {bumps.map((b, i) => (
              <circle
                key={`e${i}`}
                cx={b.x}
                cy={b.y}
                r={b.r}
                fill={white}
                stroke={ink}
                strokeWidth={edge * 2}
              />
            ))}
            {bumps.map((b, i) => (
              <circle key={`f${i}`} cx={b.x} cy={b.y} r={b.r - edge * 0.5} fill={white} />
            ))}
            <rect x={-hw} y={-hh} width={bw} height={bh} rx={size * 0.5} fill={white} />
          </>
        );
      })()
    );
  const top = -((texts.length - 1) * lead) / 2;
  return (
    <g transform={`translate(${at.x} ${at.y}) scale(${s})`}>
      {body}
      {texts.map((text, i) => (
        <g key={i} transform={`translate(0 ${top + i * lead})`}>
          {i === stress && (
            <rect
              x={-textWidth(text, size) / 2 - size * 0.3}
              y={-size * 0.62}
              width={textWidth(text, size) + size * 0.6}
              height={size * 1.24}
              rx={size * 0.3}
              fill={gold}
            />
          )}
          <text
            x={0}
            y={size * 0.34}
            textAnchor="middle"
            fontFamily={font}
            fontWeight={600}
            fontSize={size}
            fill={ink}
          >
            {text}
          </text>
        </g>
      ))}
    </g>
  );
}
