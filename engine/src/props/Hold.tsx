import type { ReactNode } from 'react';
import type { HandFrame } from '../rig/Character';
import type { Vec2 } from '../rig/math';
import { accent, ink, lineWeights, pick, tokens, white } from '../tokens';

/**
 * How props are put into a scene (Part 2, section 7.7). Every prop is drawn in head units
 * around its own origin and takes `uid` and `shadowSide`; these two wrappers put it in a hand
 * or stand it in the scene. Props follow Style 4: fully outlined, flat fill, one shadow tone,
 * one small white glint, bright, a little oversized, no more than about six inner lines.
 */

export type PropProps = {
  /** Unique within the picture, for the shading clips. */
  uid: string;
  /** Which side the shadow falls on: 1 is screen right (light from the upper left). */
  shadowSide: 1 | -1;
};

/** A fill and its one shadow tone, from a token accent by name. */
export const paintOf = (name: string): { fill: string; shadow: string } => {
  const a = accent(name);
  return { fill: pick(a, 0), shadow: pick(a, 1) };
};

/** A thin inner detail line: a seam, a plank edge, a band. */
export const detail = (d: string, key?: string): ReactNode => (
  <path
    key={key}
    d={d}
    fill="none"
    stroke={ink}
    strokeWidth={lineWeights.detail}
    strokeLinecap={tokens.line.cap}
    strokeLinejoin={tokens.line.join}
  />
);

/** The one small white glint a prop gets (Style 4), a short rounded bar. */
export const Glint = ({
  x,
  y,
  length = 0.12,
  turn = 0,
}: {
  x: number;
  y: number;
  length?: number;
  turn?: number;
}) => (
  <rect
    x={-length / 2}
    y={-0.012}
    width={length}
    height={0.024}
    rx={0.012}
    fill={white}
    transform={`translate(${x} ${y}) rotate(${turn})`}
  />
);

/**
 * A prop in a hand. Use it inside a Character's `prop` slot with one of the hand frames.
 *  - grip (the default): the prop turns with the hand, like a sword or a cup. Its +x runs
 *    along the handle, and a gripping hand's fingers are drawn over it.
 *  - upright: the prop keeps its own way up whatever the arm does, like a shield or a book.
 *  - hang: the prop hangs straight down from the hand and swings a little, like a lantern or
 *    a bag. Give it the `sway` from the prop slot.
 * `reach` moves it along the forearm, past the hand: a coin held up at the fingertips.
 */
export const InHand = ({
  frame,
  how = 'grip',
  reach = 0,
  sway,
  children,
}: {
  frame: HandFrame;
  how?: 'grip' | 'upright' | 'hang';
  reach?: number;
  sway?: Vec2;
  children: ReactNode;
}) => {
  const forearm = (frame.forearm * Math.PI) / 180;
  const x = frame.center.x + reach * Math.sin(forearm);
  const y = frame.center.y + reach * Math.cos(forearm);
  const lag = sway ? Math.max(-18, Math.min(18, sway.x * 70)) : 0;
  const turn =
    how === 'grip'
      ? (frame.hand.gripAxis ?? 90 - frame.forearm) - (sway ? lag * 0.6 : 0)
      : how === 'hang'
        ? lag
        : 0;
  return <g transform={`translate(${x} ${y}) rotate(${turn})`}>{children}</g>;
};

/**
 * A prop standing in the scene: x and y are the screen point of its origin and `head` is the
 * head size of the characters beside it, so its size and line weights match theirs.
 * `flip` mirrors it to face left.
 */
export const Placed = ({
  x,
  y,
  head,
  flip = false,
  children,
}: {
  x: number;
  y: number;
  /** Head diameter of the characters in the shot, px. */
  head: number;
  flip?: boolean;
  children: ReactNode;
}) => <g transform={`translate(${x} ${y}) scale(${flip ? -head : head} ${head})`}>{children}</g>;
