import type { ReactNode } from 'react';
import type { Vec2 } from '../rig/math';
import type { Joints } from '../rig/types';

/** What every costume piece and hair shape is drawn from. */
export type PieceContext = {
  j: Joints;
  /** Torso lean in degrees, for pieces drawn in the torso frame. */
  lean: number;
  /** Head and body turn: 0 front, 0.5 three-quarter, 1 profile. */
  turn: number;
  /** Local x sign of the shadow side (screen right, away from the upper-left light). */
  shadowSide: 1 | -1;
  /** Unique id prefix for clip paths and masks. */
  uid: string;
  skin: string;
  /**
   * How far loose cloth trails the shoulders, in head units (see rig/follow.ts). Zero at rest.
   * +x means the body has moved toward the facing direction and the cloth is behind it.
   */
  sway: Vec2;
  /** The character is seen from behind: headwear has no opening for a face. */
  back?: boolean;
};

export type Piece = (ctx: PieceContext) => ReactNode;

/** An outlined tube that follows a limb: a sleeve or a trouser leg. */
export type TubeSpec = { fill: string; shadow: string; width: number };

/**
 * A costume (Style 3.5). Pieces are layered SVG attached to bones, so they move with the body.
 * Draw order inside the character: back, back arm, back leg, torso, front leg, overTorso,
 * head (with headwear), front arm, held prop.
 */
export type Outfit = {
  id: string;
  tier: 0 | 1 | 2;
  /** Accent names the outfit uses. Style 3.5 allows at most 3 to 4 colors. */
  colors: readonly string[];
  shoulderSpread?: number;
  /** Moves the two leg roots apart, so trouser legs hang from the hips, not from one point. */
  hipSpread?: number;
  gloves?: boolean;
  sleeves?: TubeSpec;
  /** Short sleeves stop above the elbow and the rest of the arm stays a stick line. */
  sleeveLength?: 'long' | 'short';
  trousers?: TubeSpec;
  /** Footwear. boot is the chunky default; sneaker is the low shoe in Reference B. */
  boots?: {
    fill: string;
    shadow: string;
    trim?: readonly [string, string];
    style?: 'boot' | 'sneaker';
  };
  /** Behind everything: a cape lining. */
  back?: Piece;
  /** Over the torso line: a shirt or breastplate. */
  torso?: Piece;
  /** After the front leg, before the head: drapes, collar, armor skirt. */
  overTorso?: Piece;
  /** At each shoulder, drawn with that arm: pauldrons. */
  shoulder?: (ctx: PieceContext, arm: 'front' | 'back') => ReactNode;
  /** In head space, after the hair: crown, hat. */
  headwear?: Piece;
};

export type HairStyle =
  | 'bald'
  | 'short-crop'
  | 'fade'
  | 'afro'
  | 'locs'
  | 'braids'
  | 'straight-bob'
  | 'long'
  | 'bun'
  | 'ponytail'
  | 'head-wrap';

/** Facial hair that can be drawn; 'none' draws nothing. */
export const FACIAL_HAIR = ['beard', 'moustache'] as const;
export type FacialHair = 'none' | (typeof FACIAL_HAIR)[number];

/**
 * Identity mode (Style 3.4): skin tone 1 to 8, hair style and color, facial hair.
 * wrap names the accent used for a head wrap.
 */
export type Identity = {
  skinTone: number;
  hair: HairStyle;
  hairColor: string;
  facialHair?: FacialHair;
  wrap?: string;
};

/**
 * Age cues (Phase 2B). child: a smaller body under a full-size head. elder: a stooped back and
 * a few permanent creases on the face. Hair color and clothes carry the rest.
 */
export const AGES = ['child', 'adult', 'elder'] as const;
export type Age = (typeof AGES)[number];
