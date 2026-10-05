import { useId } from 'react';
import type { ReactNode } from 'react';
import { Face } from '../face/Face';
import type { EyeStyle, FaceParams } from '../face/types';
import { FacialHairShape, HairBack, HairFront } from '../wardrobe/hair';
import type { HairCtx } from '../wardrobe/hair';
import { DEFAULT_SKIN, identityHair, skinColors } from '../wardrobe/identity';
import { Shaded, Tube, lightOffset } from '../wardrobe/Shaded';
import type { Identity, Outfit, PieceContext } from '../wardrobe/types';
import { body } from './body';
import { Hand, handTransform } from './Hand';
import { armLayers } from './layers';
import type { HandStyle } from './Hand';
import { DEG, clamp, length, mul, rotate, sub, vec } from './math';
import type { Vec2 } from './math';
import { computeSkeleton } from './skeleton';
import type { ArmJoints, Facing, HandPose, LegJoints, ResolvedPose } from './types';
import { ink, lineWeights, tokens } from '../tokens';

/** Where a hand is, for drawing a held prop. All in the character's local head units. */
export type HandFrame = { center: Vec2; forearm: number; hand: HandPose };

/** Extra drawing context a held prop may use. */
export type PropInfo = { uid: string; shadowSide: 1 | -1 };

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
  /** Head and body turn: 0 front, 0.5 three-quarter, 1 profile. */
  turn?: number;
  blink?: number;
  /** Talking mouth openness, 0 to 1. */
  talk?: number;
  /** A point to look at, in this character's local head units. */
  lookAt?: Vec2;
  eyeStyle?: EyeStyle;
  /** Identity mode (Style 3.4): skin tone, hair and facial hair. Omit for default white heads. */
  identity?: Identity;
  /** A costume (Style 3.5, tier 1 or 2). Omit for a pure stick figure. */
  outfit?: Outfit;
  /** Overrides the hand style the identity and outfit imply. */
  handStyle?: HandStyle;
  /** Head squash for impacts, clamped to the token limit (Style 8: at most 8%). */
  squash?: number;
  /** Draws a held prop between the arm and the gripping fingers. */
  prop?: (hands: { front: HandFrame; back: HandFrame }, info: PropInfo) => ReactNode;
  /** Effects drawn in head space around the head: sweat drops, symbols (Style 3.7). */
  headEffects?: ReactNode;
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

/** Where a trouser leg ends inside a boot, so the tube's round end never shows under the sole. */
const ankle = (l: LegJoints): Vec2 => {
  const dx = l.foot.x - l.knee.x;
  const dy = l.foot.y - l.knee.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: l.foot.x - (dx / len) * 0.16, y: l.foot.y - (dy / len) * 0.16 };
};

/** A chunky outlined boot at a foot, toe pointing along dir (Style 3.1). */
function Boot({
  leg,
  dir,
  outfit,
  id,
  shadowSide,
}: {
  leg: LegJoints;
  dir: 1 | -1;
  outfit: NonNullable<Outfit['boots']>;
  id: string;
  shadowSide: 1 | -1;
}) {
  const f = leg.foot;
  const X = (v: number) => f.x + v * dir;
  const d = `M ${X(-0.09)} ${f.y} L ${X(0.2)} ${f.y} Q ${X(0.26)} ${f.y} ${X(0.24)} ${f.y - 0.07} Q ${X(0.2)} ${f.y - 0.12} ${X(0.08)} ${f.y - 0.13} L ${X(0.08)} ${f.y - 0.24} L ${X(-0.09)} ${f.y - 0.24} Z`;
  const trim = outfit.trim;
  return (
    <g>
      <Shaded
        id={id}
        d={d}
        fill={outfit.fill}
        shadow={outfit.shadow}
        offset={lightOffset(shadowSide, 0.035)}
      />
      {trim && (
        <Shaded
          id={`${id}-t`}
          d={`M ${X(-0.11)} ${f.y - 0.29} L ${X(0.1)} ${f.y - 0.29} L ${X(0.1)} ${f.y - 0.22} L ${X(-0.11)} ${f.y - 0.22} Z`}
          fill={trim[0]}
          shadow={trim[1]}
          offset={lightOffset(shadowSide, 0.02)}
        />
      )}
    </g>
  );
}

/**
 * One Ink Stick character. Draw order (Part 2, section 7.1, with costume layers):
 * cape back, back arm, back leg, torso and costume, front leg, costume over the torso,
 * head (hair behind, head, face, facial hair, hair in front, headwear), front arm,
 * held prop, gripping fingers. On a wide costumed body the arms change places so the chest
 * agrees with the way the head is turned (see armLayers).
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
  identity,
  outfit,
  handStyle,
  squash = 0,
  prop,
  headEffects,
}: CharacterProps) => {
  const uid = `c${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const sign = facing === 'left' ? -1 : 1;
  const t = clamp(turn, 0, 1);
  const j = computeSkeleton(pose, { shoulderSpread: outfit?.shoulderSpread ?? 0, turn: t });
  const rx = body.headRadiusX;
  const ry = body.headRadiusY;
  const outline = lineWeights.outline;
  const sq = clamp(squash, -tokens.motion.maxSquash, tokens.motion.maxSquash);
  // Light comes from the upper left of the screen, so the shadow sits on the screen-right side.
  const shadowSide: 1 | -1 = sign;

  const skinSet = identity ? skinColors(identity.skinTone) : DEFAULT_SKIN;
  const skin = skinSet.skin;
  const hands: HandStyle = handStyle ?? (outfit?.gloves ? 'glove' : identity ? 'skin' : 'bare');
  const ctx: PieceContext = { j, lean: pose.torsoLean, turn: t, shadowSide, uid, skin };
  const hairCtx: HairCtx | null = identity
    ? {
        hair: identityHair(identity),
        skin,
        turn: t,
        shadowSide,
        uid,
        wrap: identity.wrap ?? 'crimson',
      }
    : null;

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

  const arm = (a: ArmJoints, which: 'front' | 'back') => (
    <g>
      {outfit?.sleeves ? (
        <Tube pts={[a.shoulder, a.elbow, a.wrist]} spec={outfit.sleeves} shadowSide={shadowSide} />
      ) : (
        <polyline points={line([a.shoulder, a.elbow, a.wrist])} {...limbProps} />
      )}
      {outfit?.shoulder?.(ctx, which)}
    </g>
  );
  const handOf = (a: ArmJoints, h: HandPose) => (
    <Hand
      shape={h.shape}
      style={hands}
      thumb={h.thumb}
      skin={skin}
      transform={handTransform(a.hand, a.forearm, h)}
    />
  );
  const leg = (l: LegJoints, which: 'front' | 'back') => {
    // Boots point outward in front view and forward in profile, like the sneakers in Reference B.
    const dir: 1 | -1 = which === 'front' || t > 0.35 ? 1 : -1;
    return (
      <g>
        {outfit?.trousers ? (
          <Tube
            pts={[l.hip, l.knee, outfit.boots ? ankle(l) : l.foot]}
            spec={outfit.trousers}
            shadowSide={shadowSide}
          />
        ) : (
          <polyline points={line([l.hip, l.knee, l.foot])} {...limbProps} />
        )}
        {outfit?.boots && (
          <Boot
            leg={l}
            dir={dir}
            outfit={outfit.boots}
            id={`${uid}-boot-${which}`}
            shadowSide={shadowSide}
          />
        )}
      </g>
    );
  };
  const backGrips = pose.hands.back.shape === 'grip';
  const frontGrips = pose.hands.front.shape === 'grip';
  // Hands that cover the face are drawn after the head.
  const layers = armLayers(
    (outfit?.shoulderSpread ?? 0) > 0,
    t,
    pose.hands.front.over === true,
    pose.hands.back.over === true,
  );
  const backArm = (
    <>
      {arm(j.arms.back, 'back')}
      {!backGrips && handOf(j.arms.back, pose.hands.back)}
    </>
  );
  const frontSleeve = arm(j.arms.front, 'front');

  return (
    <g transform={`translate(${x} ${groundY}) scale(${sign * head} ${head})`}>
      {outfit?.back?.(ctx)}
      {layers.back === 'behind' && backArm}
      {layers.front === 'behind' && frontSleeve}
      {leg(j.legs.back, 'back')}
      <line x1={j.hip.x} y1={j.hip.y} x2={j.neck.x} y2={j.neck.y} {...limbProps} />
      {outfit?.torso?.(ctx)}
      {leg(j.legs.front, 'front')}
      {outfit?.overTorso?.(ctx)}
      {layers.back === 'chest' && backArm}

      <g
        transform={`translate(${j.head.x} ${j.head.y}) rotate(${j.headAngle}) translate(0 ${ry}) scale(${1 + sq} ${1 - sq}) translate(0 ${-ry})`}
      >
        <defs>
          <clipPath id={`${uid}-head`}>
            <ellipse rx={rx - outline / 2} ry={ry - outline / 2} />
          </clipPath>
        </defs>
        {hairCtx && identity && <HairBack style={identity.hair} ctx={hairCtx} />}
        <ellipse rx={rx} ry={ry} fill={skinSet.shadow} />
        {/* Shading, rim light and every face feature stay inside the head outline. */}
        <g clipPath={`url(#${uid}-head)`}>
          {skinSet.rim && (
            <ellipse cx={-0.075 * shadowSide} cy={-0.06} rx={rx} ry={ry} fill={skinSet.rim} />
          )}
          <ellipse
            cx={(-0.075 + (skinSet.rim ? 0.03 : 0)) * shadowSide}
            cy={-0.06 + (skinSet.rim ? 0.03 : 0)}
            rx={rx}
            ry={ry}
            fill={skin}
          />
          <Face
            params={face}
            turn={t}
            blink={blink}
            look={look}
            eyeStyle={eyeStyle}
            skin={skin}
            lidColor={skinSet.shadow}
            talk={talk}
            idPrefix={uid}
          />
        </g>
        <ellipse rx={rx} ry={ry} fill="none" stroke={ink} strokeWidth={outline} />
        {hairCtx && identity && (
          <>
            <FacialHairShape kind={identity.facialHair ?? 'none'} ctx={hairCtx} />
            <HairFront style={identity.hair} ctx={hairCtx} />
          </>
        )}
        {outfit?.headwear?.(ctx)}
        {headEffects}
      </g>

      {layers.back === 'top' && backArm}
      {layers.front === 'top' && frontSleeve}
      {!frontGrips && handOf(j.arms.front, pose.hands.front)}
      {prop?.(frames, { uid, shadowSide })}
      {backGrips && handOf(j.arms.back, pose.hands.back)}
      {frontGrips && handOf(j.arms.front, pose.hands.front)}
    </g>
  );
};
