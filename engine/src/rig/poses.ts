import { STAND_HIP_HEIGHT, body } from './body';
import { ELBOW_DOWN, KNEE_FORWARD } from './ik';
import { vec } from './math';
import type { Pose } from './pose';

/**
 * Phase 1 pose set. Space: head units, character facing +x, y down.
 * Standing feet are placed with IK on the ground line, knees bowing slightly outward.
 * Arm angles are degrees from straight down, positive toward the facing direction.
 */

const feet = (spread = 0.2) =>
  ({
    front: { foot: vec(spread, 0), bend: -1 },
    back: { foot: vec(-spread, 0), bend: 1 },
  }) as const;

export const stand: Pose = {
  id: 'stand',
  arms: { front: { upper: 16, lower: 6 }, back: { upper: -16, lower: -6 } },
  legs: feet(),
};

/** Waving uses a resting (mitten) hand, per guide v2. */
export const wave: Pose = {
  id: 'wave',
  headTilt: -4,
  // The upper arm goes out to the side first, so it never crosses the face.
  arms: { front: { upper: 120, lower: 42 }, back: { upper: -16, lower: -6 } },
  legs: feet(),
};

/** Pointing shows one extended finger (guide v2). */
export const point: Pose = {
  id: 'point',
  torsoLean: 4,
  headTilt: -2,
  arms: {
    front: { upper: 86, lower: 2, hand: 'point', thumb: -1 },
    // A resting arm bends forward at the elbow, never backward.
    back: { upper: -12, lower: 8 },
  },
  legs: feet(0.24),
};

export const shrug: Pose = {
  id: 'shrug',
  headTilt: 9,
  arms: { front: { upper: 42, lower: 98 }, back: { upper: -42, lower: -98 } },
  legs: feet(),
};

export const handsUp: Pose = {
  id: 'hands-up',
  hipHeight: 1.35,
  arms: { front: { upper: 115, lower: 47 }, back: { upper: -115, lower: -47 } },
  legs: feet(0.28),
};

/**
 * Holding an upright object out in front, like the king's sword arm in Reference A: the arm
 * reaches forward and a little down, the elbow ahead of the shoulder, never folded back.
 * The other arm hangs relaxed with a slight forward bend. The hand grips with fingers.
 */
export const holdObject: Pose = {
  id: 'hold-object',
  arms: {
    front: { reach: vec(0.92, 0.46), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: { upper: -12, lower: 8 },
  },
  legs: feet(0.22),
};

/** Both hands pressed over the mouth in shock. Both arms are drawn in front of the face. */
export const handsOverMouth: Pose = {
  id: 'hands-over-mouth',
  torsoLean: -3,
  headTilt: -3,
  arms: {
    front: { reach: vec(0.13, -0.4), bend: 1, thumb: -1, over: true },
    back: { reach: vec(-0.13, -0.38), bend: -1, thumb: 1, over: true },
  },
  legs: feet(),
};

/** Both knees bend forward, for crouches and seats seen from the side. */
const crouchFeet = (front: number, back: number) =>
  ({
    front: { foot: vec(front, 0), bend: KNEE_FORWARD },
    back: { foot: vec(back, 0), bend: KNEE_FORWARD },
  }) as const;

/** A relaxed arm at the side: a little behind the body, bending forward at the elbow. */
const resting = { upper: -12, lower: 8 } as const;

// ---------------------------------------------------------------------------------------------
// Phase 2C poses. Heights are written from the bone lengths, so they follow the body if its
// proportions ever change.

/**
 * Sitting on a seat as high as the shins are long: thighs level, shins straight down, hands on
 * the lap. The seat itself is a prop or a set piece.
 */
export const sit: Pose = {
  id: 'sit',
  hipHeight: body.shin,
  torsoLean: -2,
  arms: {
    front: { reach: vec(0.46, 0.86), bend: ELBOW_DOWN },
    back: { reach: vec(0.33, 0.88), bend: ELBOW_DOWN },
  },
  legs: crouchFeet(body.thigh + 0.04, body.thigh - 0.09),
};

/** Down on one knee, the other foot planted, a hand on the raised knee and the head bowed. */
export const kneel: Pose = {
  id: 'kneel',
  hipHeight: body.thigh + 0.02,
  torsoLean: 5,
  headTilt: 7,
  arms: { front: { reach: vec(0.56, 0.88), bend: ELBOW_DOWN }, back: resting },
  legs: {
    front: { foot: vec(0.52, 0), bend: KNEE_FORWARD },
    back: { upper: -8, lower: -100 },
  },
};

/**
 * Lying on the ground on one side, head down: asleep, fallen or defeated. One arm lies along
 * the body and the other reaches forward along the ground, so the two never clump at the hip.
 */
export const lie: Pose = {
  id: 'lie',
  hipHeight: 0.1,
  torsoLean: 71,
  headTilt: 12,
  arms: { front: { upper: -72, lower: -8 }, back: { upper: 74, lower: 6 } },
  legs: { front: { upper: -84, lower: -4 }, back: { upper: -93, lower: 4 } },
};

/** Arms folded across the chest. Both forearms are drawn in front of the body. */
export const crossArms: Pose = {
  id: 'cross-arms',
  torsoLean: -2,
  arms: {
    front: { upper: 24, lower: -124, over: true },
    back: { upper: -24, lower: 124, over: true },
  },
  legs: feet(0.22),
};

/** Standing with the head tipped back to look at something above. */
export const lookUp: Pose = {
  id: 'look-up',
  torsoLean: -4,
  headTilt: -22,
  arms: { front: { upper: 10, lower: 8 }, back: resting },
  legs: feet(),
};

/** Standing with the head bowed to look at something below. */
export const lookDown: Pose = {
  id: 'look-down',
  torsoLean: 5,
  headTilt: 22,
  arms: { front: { upper: 10, lower: 8 }, back: resting },
  legs: feet(),
};

/** Crouched and hunched with both arms raised over the top of the head; the face still shows. */
export const cower: Pose = {
  id: 'cower',
  hipHeight: STAND_HIP_HEIGHT * 0.78,
  torsoLean: 20,
  headTilt: 8,
  arms: {
    front: { reach: vec(0.46, -1.0), bend: ELBOW_DOWN, over: true },
    back: { reach: vec(0.12, -1.1), bend: ELBOW_DOWN, over: true },
  },
  legs: crouchFeet(0.26, -0.22),
};

/**
 * A hug: leaning in with both arms wrapped around someone standing close in front. Stand the
 * two about 1.2 head-widths apart, facing each other, so their heads sit cheek to cheek.
 */
export const hug: Pose = {
  id: 'hug',
  torsoLean: 10,
  headTilt: -6,
  arms: {
    front: { reach: vec(0.98, 0.16), bend: ELBOW_DOWN },
    back: { reach: vec(0.92, 0.34), bend: ELBOW_DOWN },
  },
  legs: feet(0.24),
};

/**
 * Folded up inside a crate that has been set down on its lid: the head and one hand on the
 * boards, the back sloping up, the knees doubled over the chest. It is drawn for the inside of
 * the crate prop (`CRATE` in props/Crate.tsx), whose lid is this far under the head; stand the
 * person 0.85 of a head behind the middle of the crate.
 */
export const FOLDED_REST = 0.36;
export const foldedUpsideDown: Pose = {
  id: 'folded-upside-down',
  hipHeight: 1.77,
  torsoLean: 115,
  headTilt: 35,
  arms: {
    front: { reach: vec(-0.42, 0.8), bend: ELBOW_DOWN },
    back: { reach: vec(-0.78, 0.3), bend: ELBOW_DOWN },
  },
  legs: { front: { upper: 104, lower: -150 }, back: { upper: 80, lower: -138 } },
};

// ---------------------------------------------------------------------------------------------
// Sitting at a table. Each is the seat of `sit` with the arms and the back doing something
// else, so a seated person can act without getting up. The desk they sit at (`GAME_TABLE` in
// props/Game.tsx) has its top 1.22 heads up and its middle about two heads in front of them.

/** Sitting, one arm stretched out over the table to something lying on it, the body leaning in. */
export const sitReach: Pose = {
  ...sit,
  id: 'sit-reach',
  torsoLean: 7,
  headTilt: 6,
  arms: {
    front: { reach: vec(0.95, 0.04), bend: ELBOW_DOWN },
    back: sit.arms.back,
  },
};

/** Sitting with one hand flat on the chest: a promise, or "who, me?". */
export const sitPromise: Pose = {
  ...sit,
  id: 'sit-promise',
  torsoLean: 2,
  headTilt: -3,
  arms: {
    front: { reach: vec(0.12, 0.34), bend: -1, over: true },
    back: sit.arms.back,
  },
};

/** Sitting with both hands thrown up: giving up on someone, or a win. */
export const sitHandsUp: Pose = {
  ...sit,
  id: 'sit-hands-up',
  torsoLean: -6,
  headTilt: -5,
  arms: { front: { upper: 118, lower: 44 }, back: { upper: -118, lower: -44 } },
};

/** Sitting slumped: the back bent forward, the head hanging, the hands dropped in the lap. */
export const sitSlump: Pose = {
  ...sit,
  id: 'sit-slump',
  torsoLean: 8,
  headTilt: 18,
  arms: {
    front: { reach: vec(0.3, 0.98), bend: ELBOW_DOWN },
    back: { reach: vec(0.2, 1.0), bend: ELBOW_DOWN },
  },
};

/**
 * Sitting with a phone held up in front of the chest and the head bowed over it: reading,
 * scrolling, arguing in a chat. The phone is the held prop `phone`.
 */
export const sitPhone: Pose = {
  ...sit,
  id: 'sit-phone',
  torsoLean: 5,
  headTilt: 15,
  arms: {
    front: { reach: vec(0.5, 0.3), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: sit.arms.back,
  },
};

/**
 * Standing with a cup held in front of the chest in the near hand: at a party, waiting.
 * Drawn for "How to Make Sure You Never Get Asked Out" (2026-10-14).
 */
export const holdCup: Pose = {
  id: 'hold-cup',
  arms: {
    front: { reach: vec(0.62, 0.5), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: stand.arms.back,
  },
  legs: feet(),
};

/** The cup raised to the mouth and the chin up a little: a sip, to have something to do. */
export const sip: Pose = {
  id: 'sip',
  headTilt: -8,
  arms: {
    front: {
      reach: vec(0.4, -0.22),
      bend: ELBOW_DOWN,
      hand: 'grip',
      gripAxis: -90,
      thumb: 1,
      over: true,
    },
    back: stand.arms.back,
  },
  legs: feet(),
};

/** Every pose that sits on a seat: a chair stays theirs through any of them. */
export const SEATED_POSES: readonly string[] = [
  sit.id,
  sitReach.id,
  sitPromise.id,
  sitHandsUp.id,
  sitSlump.id,
  sitPhone.id,
];

// ---------------------------------------------------------------------------------------------
// Poses that show who someone is: drawn for the game theory cast, free for anyone.

/** Both arms held wide open, the chest lifted: a welcome, trust, "come here". */
export const openArms: Pose = {
  id: 'open-arms',
  torsoLean: -2,
  headTilt: -3,
  // The upper arms come down and out, the forearms turn up: open hands, not a scarecrow.
  arms: { front: { upper: 50, lower: 44 }, back: { upper: -50, lower: -44 } },
  legs: feet(0.22),
};

/** Standing with one hand flat on the chest: a promise, sincerity, "you have my word". */
export const handOnHeart: Pose = {
  id: 'hand-on-heart',
  headTilt: -3,
  // The far arm crosses the chest with its elbow down and out, so the hand lies on the heart
  // and the near arm hangs free.
  arms: {
    front: stand.arms.front,
    back: { reach: vec(0.1, 0.37), bend: 1, over: true },
  },
  legs: feet(),
};

/**
 * Standing straight with one hand up at the knot of the tie and the chin a little lifted:
 * straightening it, pleased with how that went.
 */
export const fixTie: Pose = {
  id: 'fix-tie',
  headTilt: -5,
  // The near arm folds shut in front of the chest, elbow down, so the hand comes back up to the
  // knot. A hand reached to the collar any other way throws the elbow out to the side.
  arms: {
    front: { upper: 18, lower: 175 },
    back: stand.arms.back,
  },
  legs: feet(),
};

/**
 * Leaning in with both hands together in front of the chest, one over the other: rubbing the
 * hands at a deal about to go his way. The chin stays up, the eyes on the other person.
 */
export const rubHands: Pose = {
  id: 'rub-hands',
  torsoLean: 9,
  headTilt: -5,
  arms: {
    front: { reach: vec(0.44, 0.34), bend: ELBOW_DOWN, over: true },
    back: { reach: vec(0.37, 0.45), bend: ELBOW_DOWN, over: true },
  },
  legs: feet(0.24),
};

/** Standing still with the head tipped to one side: watching, weighing someone up. */
export const headTilt: Pose = {
  id: 'head-tilt',
  torsoLean: -1,
  headTilt: 14,
  arms: stand.arms,
  legs: feet(),
};

/**
 * Poses of a body held up by what it is in or on, not by the ground under its feet. The
 * self-check does not ask where their feet are.
 */
export const CARRIED_POSES: readonly string[] = [foldedUpsideDown.id];

/** The Phase 1 set, kept together for its sheet. */
export const PHASE1_POSES = [
  stand,
  wave,
  point,
  shrug,
  handsUp,
  holdObject,
  handsOverMouth,
] as const;
/** The Phase 2C starter set. */
export const MORE_POSES = [sit, kneel, lie, crossArms, lookUp, lookDown, cower, hug] as const;
/** Poses drawn for one story and kept for the next. */
export const STORY_POSES = [
  foldedUpsideDown,
  sitReach,
  sitPromise,
  sitHandsUp,
  sitSlump,
  sitPhone,
  holdCup,
  sip,
] as const;

/** Poses that carry a character: the signature moves of a recurring cast. */
export const CAST_POSES = [openArms, handOnHeart, rubHands, headTilt, fixTie] as const;

export const POSES = [...PHASE1_POSES, ...MORE_POSES, ...STORY_POSES, ...CAST_POSES] as const;
export type PoseId = (typeof POSES)[number]['id'];

export const poseById = (id: string): Pose => {
  const p = POSES.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown pose "${id}"`);
  return p;
};
