import { body } from './body';
import { DEG, dot, fromDown } from './math';
import type { Vec2 } from './math';
import type { HandPose, HandShape } from './types';
import { ink, lineWeights, shade, tokens, white } from '../tokens';
import { useToned } from './tone';

/**
 * bare: filled black, the default stick hand. glove: white with black outlines, for costumes
 * with sleeves. skin: identity mode, filled with the skin tone and outlined (Style 3.4).
 */
export type HandStyle = 'bare' | 'glove' | 'skin';

/** The shapes below are drawn for a 0.3 head-unit hand; this keeps them on the token size. */
const S = body.hand / 0.3;

type Paint = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  detail: string;
  /** Parts drawn as separate outlined shapes (gloves and skin), not one black silhouette. */
  outlined: boolean;
  /** Glove cuff and stitched finger lines. */
  cuff: boolean;
};

const paintFor = (style: HandStyle, skin: string): Paint => {
  const outlined = {
    stroke: ink,
    strokeWidth: lineWeights.outline * 0.85,
    detail: ink,
    outlined: true,
  };
  if (style === 'glove') return { ...outlined, fill: white, cuff: true };
  if (style === 'skin') return { ...outlined, fill: skin, cuff: false };
  // A bare hand is one black silhouette; a hairline of the same black merges the parts.
  return {
    fill: ink,
    stroke: ink,
    strokeWidth: 0.012,
    detail: white,
    outlined: false,
    cuff: false,
  };
};

const round = { strokeLinejoin: tokens.line.join, strokeLinecap: tokens.line.cap } as const;

/** Resting hand: a rounded mitten with a small thumb bump. +y points to the fingertips. */
function Mitten({ p, thumb }: { p: Paint; thumb: 1 | -1 }) {
  const glove = p.cuff;
  const tx = thumb * 0.11;
  return (
    <g {...round}>
      {glove && (
        <rect
          x={-0.1}
          y={-0.2}
          width={0.2}
          height={0.08}
          rx={0.025}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
        />
      )}
      <ellipse
        cx={tx}
        cy={-0.045}
        rx={0.05}
        ry={0.085}
        transform={`rotate(${-thumb * 28} ${tx} -0.045)`}
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
      />
      <ellipse
        cx={0}
        cy={0.01}
        rx={0.125}
        ry={0.15}
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
      />
      {glove && (
        <>
          <path
            d="M -0.035 0.08 L -0.035 0.15"
            stroke={p.detail}
            strokeWidth={lineWeights.detail}
            fill="none"
          />
          <path
            d="M 0.035 0.08 L 0.035 0.15"
            stroke={p.detail}
            strokeWidth={lineWeights.detail}
            fill="none"
          />
        </>
      )}
    </g>
  );
}

/** Thin detail line weight for hands: the low end of the token range, so small fingers stay open. */
const fine = tokens.line.detailPctOfHead[0];

/**
 * Gripping hand: a closed fist around a handle, like the king's glove in Reference A. The
 * handle runs along the hand's x axis through the origin; +y points away from the wrist.
 * The fingers are fat bands stacked along the handle. They start on the wrist side of it and
 * end in knuckles just past it, so they hide the handle completely: it shows only above and
 * below the fist. The thumb lies across the top of the fist on the wrist side.
 */
function Grip({ p, thumb }: { p: Paint; thumb: 1 | -1 }) {
  const fingers = [-0.09, -0.03, 0.03, 0.09];
  /** Where the fingers start (wrist side of the handle) and where the knuckles end. */
  const from = -0.075;
  const to = 0.115;
  if (p.outlined) {
    const tx = thumb * 0.1;
    return (
      <g {...round}>
        {p.cuff && (
          <rect
            x={-0.1}
            y={-0.25}
            width={0.2}
            height={0.08}
            rx={0.025}
            fill={p.fill}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
          />
        )}
        <rect
          x={-0.125}
          y={-0.18}
          width={0.25}
          height={0.2}
          rx={0.075}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
        />
        {fingers.map((x) => (
          <rect
            key={x}
            x={x - 0.031}
            y={from}
            width={0.062}
            height={to - from}
            rx={0.031}
            fill={p.fill}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth * 0.8}
          />
        ))}
        <ellipse
          cx={tx}
          cy={-0.085}
          rx={0.043}
          ry={0.082}
          transform={`rotate(${thumb * 14} ${tx} -0.085)`}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth * 0.8}
        />
      </g>
    );
  }
  return (
    <g {...round}>
      <rect
        x={-0.125}
        y={-0.16}
        width={0.25}
        height={to + 0.16}
        rx={0.09}
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
      />
      {[-0.06, 0, 0.06].map((x) => (
        <path
          key={x}
          d={`M ${x} ${from + 0.03} L ${x} ${to - 0.012}`}
          stroke={p.detail}
          strokeWidth={fine}
          fill="none"
        />
      ))}
      <path
        d={`M ${thumb * 0.06} -0.145 Q ${thumb * 0.02} -0.09 ${thumb * 0.075} ${from + 0.01}`}
        stroke={p.detail}
        strokeWidth={fine}
        fill="none"
      />
    </g>
  );
}

/**
 * Pointing hand: a fist with the index finger extended along +y (away from the wrist),
 * on the thumb side, and the curled fingers marked across the knuckles.
 */
function Point({ p, thumb }: { p: Paint; thumb: 1 | -1 }) {
  const glove = p.outlined;
  const fx = thumb * 0.05;
  const fw = 0.085;
  const inner = fx - thumb * (fw / 2);
  return (
    <g {...round}>
      {p.cuff && (
        <rect
          x={-0.095}
          y={-0.22}
          width={0.19}
          height={0.08}
          rx={0.025}
          fill={p.fill}
          stroke={p.stroke}
          strokeWidth={p.strokeWidth}
        />
      )}
      <ellipse
        cx={thumb * 0.105}
        cy={-0.06}
        rx={0.045}
        ry={0.075}
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth={glove ? p.strokeWidth * 0.8 : p.strokeWidth}
      />
      <rect
        x={-0.115}
        y={-0.15}
        width={0.23}
        height={0.22}
        rx={0.08}
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
      />
      <rect
        x={fx - fw / 2}
        y={-0.04}
        width={fw}
        height={0.32}
        rx={fw / 2}
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth={glove ? p.strokeWidth * 0.8 : p.strokeWidth}
      />
      <path
        d={`M ${inner} 0.065 L ${-thumb * 0.1} 0.065`}
        stroke={p.detail}
        strokeWidth={glove ? lineWeights.detail : fine}
        fill="none"
      />
    </g>
  );
}

export const Hand = ({
  shape,
  style,
  thumb,
  transform,
  skin = tokens.fill.head,
}: {
  shape: HandShape;
  style: HandStyle;
  thumb: 1 | -1;
  transform: string;
  skin?: string;
}) => {
  const toned = useToned();
  const painted = paintFor(style, skin);
  // The toned look: a hand drawn in parts has a thin edge in a darker tone of its own colour.
  const p =
    toned && painted.outlined
      ? { ...painted, stroke: shade(painted.fill, 0.3), strokeWidth: painted.strokeWidth * 0.6 }
      : painted;
  return (
    <g transform={`${transform} scale(${S})`}>
      {shape === 'grip' ? (
        <Grip p={p} thumb={thumb} />
      ) : shape === 'point' ? (
        <Point p={p} thumb={thumb} />
      ) : (
        <Mitten p={p} thumb={thumb} />
      )}
    </g>
  );
};

/**
 * SVG transform that places a hand at its center, with +y along the forearm.
 * A gripping hand with a gripAxis turns so its handle line follows that axis instead,
 * flipped if needed so the fingers still point away from the wrist.
 */
export function handTransform(center: Vec2, forearm: number, hand: HandPose): string {
  const base = `translate(${center.x} ${center.y})`;
  if (hand.shape === 'grip' && hand.gripAxis !== undefined) {
    const g = hand.gripAxis;
    const yAxis = { x: -Math.sin(g * DEG), y: Math.cos(g * DEG) };
    const flip = dot(yAxis, fromDown(forearm)) < 0 ? -1 : 1;
    return `${base} rotate(${g}) scale(1 ${flip})`;
  }
  return `${base} rotate(${-forearm})`;
}
