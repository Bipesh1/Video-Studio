import type { ReactNode } from 'react';
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
  gloves?: boolean;
  sleeves?: TubeSpec;
  trousers?: TubeSpec;
  boots?: { fill: string; shadow: string; trim?: readonly [string, string] };
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
