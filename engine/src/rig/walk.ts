import { ELBOW_DOWN, KNEE_FORWARD } from './ik';
import { smoothstep, vec } from './math';
import type { Vec2 } from './math';
import { armToHand, legToFoot } from './pose';
import { shoulderOf } from './skeleton';
import type { HandPose, HandShape, ResolvedPose } from './types';

/**
 * Procedural walk cycle with feet locked to the ground (Part 2, section 7.4).
 * Each foot alternates a stance phase (planted at one ground point while the body moves over it)
 * and a swing phase (lifted in an arc to the next plant). The two feet are half a cycle apart.
 */
export type WalkParams = {
  /** Seconds for a full cycle of two steps. */
  period: number;
  /** Fraction of the cycle each foot is planted. Above 0.5 means both feet are down at times. */
  stance: number;
  /** Distance a foot travels relative to the hip while planted, head units. */
  stride: number;
  /** Peak foot lift during swing, head units. */
  lift: number;
  hipHeight: number;
  /** Hip dip at each foot contact, head units. */
  bob: number;
  /** Arm swing either side of straight down, degrees. */
  armSwing: number;
  /** Forward lean of the torso, degrees. */
  lean: number;
  /** Head tilt, degrees: negative is chin up, positive is head down. Default level. */
  headTilt?: number;
  /** How far the head nods with each step, degrees. Default none. */
  headNod?: number;
  /** Elbow bend of the swinging arms, degrees. Default 18. */
  armBend?: number;
  /** Arms held up in front instead of swinging, as when sneaking: the pose of the near arm. */
  carry?: { upper: number; lower: number };
  /**
   * Where in the cycle the hip is lowest, 0 to 0.5. Default 0.05, just after a foot lands (a
   * walk). A run is lowest in the middle of each step and highest in the air between steps.
   */
  bobPhase?: number;
  /** How early the swinging foot kicks up behind before coming forward, 0 to 1. A run kicks. */
  kick?: number;
  /**
   * Hands held on something instead of swinging, as when pushing, pulling or carrying: where
   * each hand is, from the ground point under the hip, in head units. They do not bob.
   */
  hold?: { front: Vec2; back: Vec2; hand?: HandShape; gripAxis?: number };
};

export const DEFAULT_WALK: WalkParams = {
  period: 1.0,
  stance: 0.6,
  stride: 0.9,
  lift: 0.16,
  hipHeight: 1.33,
  bob: 0.025,
  armSwing: 26,
  lean: 4,
};

/**
 * Walks with a mood (Phase 2C). Each is the same planted-foot walk with different numbers, so
 * the mood shows in the whole body: speed, step height, bounce, lean, head and arms.
 */
export const WALKS = {
  normal: DEFAULT_WALK,
  /** Chest out, chin up, slow high steps and a wide arm swing. */
  proud: {
    period: 1.15,
    stance: 0.6,
    stride: 0.9,
    lift: 0.26,
    hipHeight: 1.34,
    bob: 0.02,
    armSwing: 36,
    lean: -6,
    headTilt: -9,
    armBend: 8,
  },
  /** Slow short steps that barely leave the ground, bent forward, head down, arms hanging. */
  tired: {
    period: 1.5,
    stance: 0.68,
    stride: 0.62,
    lift: 0.07,
    hipHeight: 1.27,
    bob: 0.04,
    armSwing: 9,
    lean: 14,
    headTilt: 16,
    headNod: 3,
    armBend: 5,
  },
  /** Crouched, with high careful steps, the head pushed forward and the hands held up. */
  sneaky: {
    period: 1.3,
    stance: 0.62,
    stride: 0.84,
    lift: 0.34,
    hipHeight: 1.1,
    bob: 0.02,
    armSwing: 5,
    lean: 17,
    headTilt: -12,
    carry: { upper: 38, lower: 96 },
  },
  /** Quick and bouncy, with a big arm swing and the head up. */
  happy: {
    period: 0.8,
    stance: 0.56,
    stride: 0.9,
    lift: 0.24,
    hipHeight: 1.31,
    bob: 0.06,
    armSwing: 46,
    lean: -1,
    headTilt: -5,
    headNod: 4,
    armBend: 26,
  },
} as const satisfies Record<string, WalkParams>;

export type WalkMood = keyof typeof WALKS;

/**
 * Ways of moving on foot that are more than a walk (Phase 2D). The same planted-foot cycle
 * drives them all, so no foot ever slides.
 */
export const GAITS = {
  /** A flat-out run: both feet in the air between steps, the body thrown forward, elbows pumping. */
  run: {
    period: 0.62,
    stance: 0.36,
    stride: 1.0,
    lift: 0.5,
    kick: 1,
    hipHeight: 1.25,
    bob: 0.05,
    bobPhase: 0.18,
    armSwing: 55,
    armBend: 95,
    lean: 18,
    headTilt: -12,
  },
  /** Carrying a load in both arms in front of the body: leaning back against it, short heavy steps. */
  carry: {
    period: 1.15,
    stance: 0.64,
    stride: 0.72,
    lift: 0.1,
    hipHeight: 1.3,
    bob: 0.04,
    armSwing: 0,
    lean: -7,
    headTilt: 3,
    hold: { front: vec(0.56, -1.72), back: vec(0.44, -1.66) },
  },
  /** Pushing something heavy: the body leans hard into its arms and drives with short steps. */
  push: {
    period: 1.1,
    stance: 0.66,
    stride: 0.66,
    lift: 0.08,
    hipHeight: 1.12,
    bob: 0.03,
    armSwing: 0,
    lean: 34,
    headTilt: -20,
    hold: { front: vec(1.6, -1.74), back: vec(1.52, -1.5) },
  },
  /**
   * Pulling on a rope or handle held in both fists, leaning back against it. Run the time
   * backward (see ACTIONS.pull) and the character steps backward as it pulls.
   */
  pull: {
    period: 1.2,
    stance: 0.66,
    stride: 0.6,
    lift: 0.08,
    hipHeight: 1.2,
    bob: 0.03,
    armSwing: 0,
    lean: -26,
    headTilt: 12,
    hold: { front: vec(0.78, -1.76), back: vec(0.52, -1.72), hand: 'grip', gripAxis: -9 },
  },
} as const satisfies Record<string, WalkParams>;

export type Gait = keyof typeof GAITS;

/** Forward speed in head units per second. */
export const walkSpeed = (p: WalkParams): number => p.stride / (p.stance * p.period);

export type FootState = { pos: Vec2; planted: boolean };

function footAt(time: number, phaseOffset: number, p: WalkParams): FootState {
  const v = walkSpeed(p);
  const cycles = time / p.period + phaseOffset;
  const cycleIndex = Math.floor(cycles);
  const phase = cycles - cycleIndex;
  // Time at which this foot's current stance began; the hip was then half a stride behind it.
  const stanceStart = (cycleIndex - phaseOffset) * p.period;
  const plantX = v * stanceStart + p.stride / 2;
  if (phase < p.stance) return { pos: vec(plantX, 0), planted: true };
  const s = (phase - p.stance) / (1 - p.stance);
  // A kick lifts the foot early, while it is still behind the body, as in a run.
  const rise = Math.sin(Math.PI * s ** (1 - 0.45 * (p.kick ?? 0)));
  return {
    pos: vec(plantX + v * p.period * smoothstep(s), -p.lift * rise),
    planted: false,
  };
}

export type WalkFrame = {
  pose: ResolvedPose;
  feet: { front: FootState; back: FootState };
};

/** The walking pose at a time in seconds. rootX advances at walkSpeed. */
export function walkAt(time: number, p: WalkParams = DEFAULT_WALK): WalkFrame {
  const v = walkSpeed(p);
  const phase = (((time / p.period) % 1) + 1) % 1;
  // The hip dips just after each contact (phase 0 and 0.5) and rises as a leg passes under it.
  const low = p.bobPhase ?? 0.05;
  const hipY = -p.hipHeight + p.bob * Math.cos(4 * Math.PI * (phase - low));
  const hip = vec(v * time, hipY);
  const front = footAt(time, 0, p);
  const back = footAt(time, 0.5, p);
  // Arms swing opposite to the leg on their side.
  const swing = p.armSwing * Math.cos(2 * Math.PI * phase);
  const bend = p.armBend ?? 18;
  // Carried arms stay up in front and only bob with the steps; the far one sits a little lower.
  const shoulder = shoulderOf(hip, p.lean);
  const held = (at: Vec2) => armToHand(shoulder, vec(hip.x + at.x, at.y), ELBOW_DOWN);
  const arms = p.hold
    ? { front: held(p.hold.front), back: held(p.hold.back) }
    : p.carry
      ? {
          front: { upper: p.carry.upper - swing, lower: p.carry.lower },
          back: { upper: p.carry.upper - 14 + swing, lower: p.carry.lower - 10 },
        }
      : { front: { upper: -swing, lower: bend }, back: { upper: swing, lower: bend } };
  const hand: HandPose = {
    shape: p.hold?.hand ?? 'mitten',
    thumb: 1,
    ...(p.hold?.gripAxis !== undefined ? { gripAxis: p.hold.gripAxis } : {}),
  };
  return {
    pose: {
      rootX: hip.x,
      hipY,
      torsoLean: p.lean,
      headTilt: (p.headTilt ?? 0) + (p.headNod ?? 0) * Math.cos(4 * Math.PI * (phase - low)),
      headBob: 0,
      arms,
      legs: {
        front: legToFoot(hip, front.pos, KNEE_FORWARD),
        back: legToFoot(hip, back.pos, KNEE_FORWARD),
      },
      hands: { front: hand, back: hand },
    },
    feet: { front, back },
  };
}
