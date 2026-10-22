import { useId } from 'react';
import type { ReactNode } from 'react';
import { Face } from '../face/Face';
import { MOUTH_FORMS } from '../face/talk';
import type { MouthForm } from '../face/talk';
import type { EyeStyle, FaceParams } from '../face/types';
import { FacialHairShape, HAIR_BEHIND_BODY, HairBack, HairFront } from '../wardrobe/hair';
import type { HairCtx } from '../wardrobe/hair';
import { Footwear, trouserEnd } from '../wardrobe/Footwear';
import { DEFAULT_SKIN, identityHair, skinColors } from '../wardrobe/identity';
import { Tube } from '../wardrobe/Shaded';
import type { Age, Identity, Outfit, PieceContext } from '../wardrobe/types';
import { body } from './body';
import { NO_SWAY } from './follow';
import type { Sway } from './follow';
import { Hand, handTransform } from './Hand';
import { armLayers } from './layers';
import type { HandStyle } from './Hand';
import { DEG, clamp, length, lerpVec, mul, rotate, sub, vec } from './math';
import { MirrorContext } from './mirror';
import type { Vec2 } from './math';
import { computeSkeleton } from './skeleton';
import type { ArmJoints, Facing, HandPose, LegJoints, ResolvedPose } from './types';
import { ink, lighten, lineWeights, tokens } from '../tokens';
import { TONED_LIGHT, useToned } from './tone';

/** Where a hand is, for drawing a held prop. All in the character's local head units. */
export type HandFrame = { center: Vec2; forearm: number; hand: HandPose };

/** Extra drawing context a held prop may use. */
export type PropInfo = {
  uid: string;
  shadowSide: 1 | -1;
  /** How far the loose end of a held thing trails the hand, in head units. Zero at rest. */
  sway: Vec2;
  /** Seconds since the scene began, for a held thing that moves by itself (a flame). */
  t?: number;
};

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
  /** The talking mouth shape of the moment: talkAt(frame, fps, wordsOfTheLine). */
  talk?: MouthForm;
  /** A point to look at, in this character's local head units. */
  lookAt?: Vec2;
  /** A small offset of the eyes from where they are looking: eye darts (see gazeAt). */
  gaze?: Vec2;
  /** Follow-through for capes, hair and held things (see swayOf). Left out: nothing sways. */
  sway?: Sway;
  eyeStyle?: EyeStyle;
  /** Identity mode (Style 3.4): skin tone, hair and facial hair. Omit for default white heads. */
  identity?: Identity;
  /** A costume (Style 3.5, tier 1 or 2). Omit for a pure stick figure. */
  outfit?: Outfit;
  /** Age cues: a child has a smaller body under the same head; an elder stoops. */
  age?: Age;
  /** Overrides the hand style the identity and outfit imply. */
  handStyle?: HandStyle;
  /** Head squash for impacts, clamped to the token limit (Style 8: at most 8%). */
  squash?: number;
  /** Draws a held prop between the arm and the gripping fingers. */
  prop?: (hands: { front: HandFrame; back: HandFrame }, info: PropInfo) => ReactNode;
  /** Effects drawn in head space around the head: sweat drops, symbols (Style 3.7). */
  headEffects?: ReactNode;
  /**
   * Seen from behind: no face, hair and headwear cover the back of the head, a cape hangs over
   * the body. For the near person in an over-the-shoulder shot (see camera/Framing).
   */
  back?: boolean;
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

/** Convert a point in a character's local head units to a screen point: the reverse of toLocal. */
export function toScreen(
  local: Vec2,
  c: { x: number; groundY: number; head: number; facing?: Facing },
): Vec2 {
  const sign = c.facing === 'left' ? -1 : 1;
  return vec(c.x + local.x * c.head * sign, c.groundY + local.y * c.head);
}

/** A child's body is this fraction of an adult's, under a head of the same size. */
export const CHILD_BODY = 0.78;
/** How far an elder leans forward, in degrees; the head tips back to keep the face level. */
export const ELDER_STOOP = 11;

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
  talk = MOUTH_FORMS.closed,
  lookAt,
  gaze,
  sway = NO_SWAY,
  eyeStyle = 'round',
  identity,
  outfit,
  age = 'adult',
  handStyle,
  squash = 0,
  prop,
  headEffects,
  back = false,
}: CharacterProps) => {
  const toned = useToned();
  const uid = `c${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const sign = facing === 'left' ? -1 : 1;
  const t = clamp(turn, 0, 1);
  // An elder stoops forward. Seen from the front that lean points at the viewer, so only a
  // little of it shows; it grows as the body turns to profile.
  const stoop = age === 'elder' ? ELDER_STOOP * (0.3 + 0.7 * t) : 0;
  const posed = stoop
    ? { ...pose, torsoLean: pose.torsoLean + stoop, headTilt: pose.headTilt - stoop * 0.7 }
    : pose;
  const j = computeSkeleton(posed, {
    shoulderSpread: outfit?.shoulderSpread ?? 0,
    hipSpread: outfit?.hipSpread ?? 0,
    turn: t,
  });
  // A child: everything below the head shrinks toward the ground point, and the head follows
  // the neck down, so the head is big for the body.
  const k = age === 'child' ? CHILD_BODY : 1;
  const bodyScale =
    k === 1 ? undefined : `translate(${posed.rootX} 0) scale(${k}) translate(${-posed.rootX} 0)`;
  const headAt = vec(j.head.x + (k - 1) * (j.neck.x - posed.rootX), j.head.y + (k - 1) * j.neck.y);
  const rx = body.headRadiusX;
  const ry = body.headRadiusY;
  const outline = lineWeights.outline;
  const sq = clamp(squash, -tokens.motion.maxSquash, tokens.motion.maxSquash);
  // Light comes from the upper left of the screen, so the shadow sits on the screen-right side.
  const shadowSide: 1 | -1 = sign;

  const skinSet = identity ? skinColors(identity.skinTone) : DEFAULT_SKIN;
  const skin = skinSet.skin;
  const hands: HandStyle = handStyle ?? (outfit?.gloves ? 'glove' : identity ? 'skin' : 'bare');
  const ctx: PieceContext = {
    j,
    lean: posed.torsoLean,
    turn: t,
    shadowSide,
    uid,
    skin,
    sway: sway.body,
    back,
  };
  const hairCtx: HairCtx | null = identity
    ? {
        hair: identityHair(identity),
        skin,
        turn: t,
        shadowSide,
        uid,
        wrap: identity.wrap ?? 'crimson',
        sway: sway.body,
        back,
      }
    : null;

  let look = vec(0, 0);
  if (lookAt) {
    const d = rotate(sub(lookAt, headAt), -j.headAngle * DEG);
    const l = length(d);
    if (l > 1e-6) look = mul(d, 1 / l);
  }
  if (gaze) look = vec(look.x + gaze.x, look.y + gaze.y);

  const frames = {
    front: { center: j.arms.front.hand, forearm: j.arms.front.forearm, hand: posed.hands.front },
    back: { center: j.arms.back.hand, forearm: j.arms.back.forearm, hand: posed.hands.back },
  };

  const arm = (a: ArmJoints, which: 'front' | 'back') => {
    const sleeves = outfit?.sleeves;
    const short = outfit?.sleeveLength === 'short';
    return (
      <g>
        {sleeves && !short ? (
          <Tube pts={[a.shoulder, a.elbow, a.wrist]} spec={sleeves} shadowSide={shadowSide} />
        ) : (
          <polyline points={line([a.shoulder, a.elbow, a.wrist])} {...limbProps} />
        )}
        {sleeves && short && (
          <Tube
            pts={[a.shoulder, lerpVec(a.shoulder, a.elbow, 0.62)]}
            spec={sleeves}
            shadowSide={shadowSide}
          />
        )}
        {outfit?.shoulder?.(ctx, which)}
      </g>
    );
  };
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
            pts={[
              l.hip,
              l.knee,
              // The trouser leg ends inside the shoe, wherever the shoe sits on the leg.
              outfit.boots
                ? trouserEnd(
                    l.foot,
                    l.knee,
                    dir,
                    outfit.boots.style === 'sneaker' ? 'sneaker' : 'boot',
                  )
                : l.foot,
            ]}
            spec={outfit.trousers}
            shadowSide={shadowSide}
          />
        ) : (
          // A bare stick leg ends inside the shoe too, so its round end never shows under the sole
          // (Biku, 2026-10-06: "the legs go through the shoes").
          <polyline
            points={line([
              l.hip,
              l.knee,
              outfit?.boots
                ? trouserEnd(
                    l.foot,
                    l.knee,
                    dir,
                    outfit.boots.style === 'sneaker' ? 'sneaker' : 'boot',
                  )
                : l.foot,
            ])}
            {...limbProps}
          />
        )}
        {outfit?.boots && (
          <Footwear
            foot={l.foot}
            knee={l.knee}
            dir={dir}
            spec={outfit.boots}
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

  const headTransform = `translate(${headAt.x} ${headAt.y}) rotate(${j.headAngle}) translate(0 ${ry}) scale(${1 + sq} ${1 - sq}) translate(0 ${-ry})`;
  // Hair that falls down the back is drawn behind the whole body, not over the shoulders.
  const hairBehind = Boolean(identity && HAIR_BEHIND_BODY.includes(identity.hair));
  // Seen from behind, a head with hair is all hair: it is filled with the hair color.
  const backOfHead = back && identity && identity.hair !== 'bald' ? identityHair(identity) : null;
  // The toned look: no outline round the head, and a lit edge on the skin toward the light.
  const headLine = toned ? 0 : outline;

  return (
    <g transform={`translate(${x} ${groundY}) scale(${sign * head} ${head})`}>
      {hairBehind && hairCtx && identity && (
        <g transform={headTransform}>
          <HairBack style={identity.hair} ctx={hairCtx} />
        </g>
      )}
      <g transform={bodyScale}>
        {!back && outfit?.back?.(ctx)}
        {layers.back === 'behind' && backArm}
        {layers.front === 'behind' && frontSleeve}
        {leg(j.legs.back, 'back')}
        <line x1={j.hip.x} y1={j.hip.y} x2={j.neck.x} y2={j.neck.y} {...limbProps} />
        {outfit?.torso?.(ctx)}
        {leg(j.legs.front, 'front')}
        {outfit?.overTorso?.(ctx)}
        {layers.back === 'chest' && backArm}
        {/* From behind, a cape hangs over the body instead of showing round its edges. */}
        {back && outfit?.back?.(ctx)}
      </g>

      <g transform={headTransform}>
        <defs>
          <clipPath id={`${uid}-head`}>
            <ellipse rx={rx - headLine / 2} ry={ry - headLine / 2} />
          </clipPath>
        </defs>
        {hairCtx && identity && !hairBehind && <HairBack style={identity.hair} ctx={hairCtx} />}
        <ellipse rx={rx} ry={ry} fill={backOfHead ? backOfHead.shadow : skinSet.shadow} />
        {/* Shading, rim light and every face feature stay inside the head outline. */}
        <g clipPath={`url(#${uid}-head)`}>
          {skinSet.rim && !backOfHead && (
            <ellipse cx={-0.075 * shadowSide} cy={-0.06} rx={rx} ry={ry} fill={skinSet.rim} />
          )}
          <ellipse
            cx={(-0.075 + (skinSet.rim ? 0.03 : 0)) * shadowSide}
            cy={-0.06 + (skinSet.rim ? 0.03 : 0)}
            rx={rx}
            ry={ry}
            fill={backOfHead ? backOfHead.fill : skin}
          />
          {toned && !backOfHead && (
            <g>
              <defs>
                <clipPath id={`${uid}-lit`}>
                  <ellipse cx={-0.075 * shadowSide} cy={-0.06} rx={rx} ry={ry} />
                </clipPath>
              </defs>
              <g clipPath={`url(#${uid}-lit)`}>
                <ellipse rx={rx * 1.2} ry={ry * 1.2} fill={lighten(skin, TONED_LIGHT * 0.6)} />
                <ellipse cx={-0.04 * shadowSide} cy={-0.03} rx={rx} ry={ry} fill={skin} />
              </g>
            </g>
          )}
          {!back && (
            <Face
              params={face}
              turn={t}
              blink={blink}
              look={look}
              eyeStyle={eyeStyle}
              skin={skin}
              lidColor={skinSet.shadow}
              talk={talk}
              aged={age === 'elder'}
              idPrefix={uid}
            />
          )}
        </g>
        {!toned && <ellipse rx={rx} ry={ry} fill="none" stroke={ink} strokeWidth={outline} />}
        {hairCtx && identity && (
          <>
            {!back && <FacialHairShape kind={identity.facialHair ?? 'none'} ctx={hairCtx} />}
            <HairFront style={identity.hair} ctx={hairCtx} />
          </>
        )}
        {outfit?.headwear?.(ctx)}
        <MirrorContext.Provider value={sign}>{headEffects}</MirrorContext.Provider>
      </g>

      <g transform={bodyScale}>
        {layers.back === 'top' && backArm}
        {layers.front === 'top' && frontSleeve}
        {!frontGrips && handOf(j.arms.front, pose.hands.front)}
        {prop?.(frames, { uid, shadowSide, sway: sway.hand })}
        {backGrips && handOf(j.arms.back, pose.hands.back)}
        {frontGrips && handOf(j.arms.front, pose.hands.front)}
      </g>
    </g>
  );
};
