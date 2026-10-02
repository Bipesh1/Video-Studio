import { useId } from 'react';
import type { ReactNode } from 'react';
import { Face } from '../face/Face';
import type { EyeStyle, FaceParams } from '../face/types';
import { body } from './body';
import { Hand, handTransform } from './Hand';
import type { HandStyle } from './Hand';
import { DEG, clamp, length, mul, rotate, sub, vec } from './math';
import type { Vec2 } from './math';
import { computeSkeleton } from './skeleton';
import type { ArmJoints, Facing, HandPose, ResolvedPose } from './types';
import { ink, lineWeights, tokens } from '../tokens';

/** Where a hand is, for drawing a held prop. All in the character's local head units. */
export type HandFrame = { center: Vec2; forearm: number; hand: HandPose };

export type CharacterProps = {
  /** Screen x of the character origin (the ground point under the hip at rootX 0), px. */
  x: number;
  /** Screen y of the ground line, px. */
  groundY: number;
  /** Head diameter in px. Every line weight scales from this (Style 3.2). */
  head: number;
  facing?: Facing;
  pose: ResolvedPose;
  face: FaceParams;
  /** Head turn: 0 front, 0.5 three-quarter, 1 profile. */
  turn?: number;
  blink?: number;
  /** Talking mouth openness, 0 to 1. */
  talk?: number;
  /** A point to look at, in this character's local head units. */
  lookAt?: Vec2;
  eyeStyle?: EyeStyle;
  handStyle?: HandStyle;
  skin?: string;
  skinShadow?: string;
  /** Head squash for impacts, clamped to the token limit (Style 8: at most 8%). */
  squash?: number;
  /** Draws a held prop between the arm and the gripping fingers. */
  prop?: (hands: { front: HandFrame; back: HandFrame }) => ReactNode;
};

const limbProps = {
  fill: 'none',
  stroke: ink,
  strokeWidth: lineWeights.limb,
  strokeLinecap: tokens.line.cap,
  strokeLinejoin: tokens.line.join,
} as const;

const line = (ptsList: readonly Vec2[]) => ptsList.map((p) => `${p.x},${p.y}`).join(' ');

/** Convert a screen point to a character's local head units, for lookAt. */
export function toLocal(
  screen: Vec2,
  c: { x: number; groundY: number; head: number; facing?: Facing },
): Vec2 {
  const sign = c.facing === 'left' ? -1 : 1;
  return vec(((screen.x - c.x) / c.head) * sign, (screen.y - c.groundY) / c.head);
}

/**
 * One Ink Stick character: stick body, head and face, hands. Draw order (Part 2, section 7.1):
 * back arm, back leg, body, front leg, head, front arm, held prop, gripping fingers.
 */
export const Character = ({
  x,
  groundY,
  head,
  facing = 'right',
  pose,
  face,
  turn = 0,
  blink = 0,
  talk = 0,
  lookAt,
  eyeStyle = 'round',
  handStyle = 'bare',
  skin = tokens.fill.head,
  skinShadow = tokens.fill.headShadow,
  squash = 0,
  prop,
}: CharacterProps) => {
  const uid = `c${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const sign = facing === 'left' ? -1 : 1;
  const j = computeSkeleton(pose);
  const rx = body.headRadiusX;
  const ry = body.headRadiusY;
  const outline = lineWeights.outline;
  const sq = clamp(squash, -tokens.motion.maxSquash, tokens.motion.maxSquash);
  // Light comes from the upper left of the screen, so the shadow sits on the screen-right side.
  const shadowSide = sign;

  let look = vec(0, 0);
  if (lookAt) {
    const d = rotate(sub(lookAt, j.head), -j.headAngle * DEG);
    const l = length(d);
    if (l > 1e-6) look = mul(d, 1 / l);
  }

  const frames = {
    front: { center: j.arms.front.hand, forearm: j.arms.front.forearm, hand: pose.hands.front },
    back: { center: j.arms.back.hand, forearm: j.arms.back.forearm, hand: pose.hands.back },
  };

  const armLine = (a: ArmJoints) => (
    <polyline points={line([a.shoulder, a.elbow, a.wrist])} {...limbProps} />
  );
  const hand = (a: ArmJoints, h: HandPose) => (
    <Hand
      shape={h.shape}
      style={handStyle}
      thumb={h.thumb}
      transform={handTransform(a.hand, a.forearm, h)}
    />
  );
  const backGrips = pose.hands.back.shape === 'grip';
  const frontGrips = pose.hands.front.shape === 'grip';

  return (
    <g transform={`translate(${x} ${groundY}) scale(${sign * head} ${head})`}>
      {armLine(j.arms.back)}
      {!backGrips && hand(j.arms.back, pose.hands.back)}
      <polyline points={line([j.hip, j.legs.back.knee, j.legs.back.foot])} {...limbProps} />
      <line x1={j.hip.x} y1={j.hip.y} x2={j.neck.x} y2={j.neck.y} {...limbProps} />
      <polyline points={line([j.hip, j.legs.front.knee, j.legs.front.foot])} {...limbProps} />

      <g
        transform={`translate(${j.head.x} ${j.head.y}) rotate(${j.headAngle}) translate(0 ${ry}) scale(${1 + sq} ${1 - sq}) translate(0 ${-ry})`}
      >
        <defs>
          <clipPath id={`${uid}-head`}>
            <ellipse rx={rx - outline / 2} ry={ry - outline / 2} />
          </clipPath>
        </defs>
        <ellipse rx={rx} ry={ry} fill={skinShadow} />
        {/* Shadow crescent and every face feature stay inside the head outline. */}
        <g clipPath={`url(#${uid}-head)`}>
          <ellipse cx={-0.075 * shadowSide} cy={-0.06} rx={rx} ry={ry} fill={skin} />
          <Face
            params={face}
            turn={turn}
            blink={blink}
            look={look}
            eyeStyle={eyeStyle}
            skin={skin}
            talk={talk}
            idPrefix={uid}
          />
        </g>
        <ellipse rx={rx} ry={ry} fill="none" stroke={ink} strokeWidth={outline} />
      </g>

      {armLine(j.arms.front)}
      {!frontGrips && hand(j.arms.front, pose.hands.front)}
      {prop?.(frames)}
      {backGrips && hand(j.arms.back, pose.hands.back)}
      {frontGrips && hand(j.arms.front, pose.hands.front)}
    </g>
  );
};
