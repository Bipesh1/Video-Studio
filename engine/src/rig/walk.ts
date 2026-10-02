import { KNEE_FORWARD } from './ik';
import { smoothstep, vec } from './math';
import type { Vec2 } from './math';
import { legToFoot } from './pose';
import type { ResolvedPose } from './types';

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
  return {
    pos: vec(plantX + v * p.period * smoothstep(s), -p.lift * Math.sin(Math.PI * s)),
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
  const hipY = -p.hipHeight + p.bob * Math.cos(4 * Math.PI * (phase - 0.05));
  const hip = vec(v * time, hipY);
  const front = footAt(time, 0, p);
  const back = footAt(time, 0.5, p);
  // Arms swing opposite to the leg on their side.
  const swing = p.armSwing * Math.cos(2 * Math.PI * phase);
  return {
    pose: {
      rootX: hip.x,
      hipY,
      torsoLean: p.lean,
      headTilt: 0,
      headBob: 0,
      arms: { front: { upper: -swing, lower: 18 }, back: { upper: swing, lower: 18 } },
      legs: {
        front: legToFoot(hip, front.pos, KNEE_FORWARD),
        back: legToFoot(hip, back.pos, KNEE_FORWARD),
      },
      hands: { front: { shape: 'mitten', thumb: 1 }, back: { shape: 'mitten', thumb: 1 } },
    },
    feet: { front, back },
  };
}
