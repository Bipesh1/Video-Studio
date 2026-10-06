import { describe, expect, it } from 'vitest';
import { dist } from './math';
import { computeSkeleton } from './skeleton';
import { DEFAULT_WALK, WALKS, walkAt, walkSpeed } from './walk';
import type { WalkMood } from './walk';

const fps = 30;
const frames = Math.round(3 * DEFAULT_WALK.period * fps);
const sides = ['front', 'back'] as const;

describe('walk cycle', () => {
  it('feet reach their targets every frame (IK never clamps)', () => {
    for (let f = 0; f <= frames; f++) {
      const w = walkAt(f / fps);
      const j = computeSkeleton(w.pose);
      for (const s of sides) expect(dist(j.legs[s].foot, w.feet[s].pos)).toBeLessThan(1e-6);
    }
  });

  it('planted feet sit exactly on the ground line and never slide', () => {
    const lastPlanted: Record<(typeof sides)[number], number | null> = { front: null, back: null };
    for (let f = 0; f <= frames; f++) {
      const w = walkAt(f / fps);
      const j = computeSkeleton(w.pose);
      for (const s of sides) {
        const foot = w.feet[s];
        if (foot.planted) {
          expect(Math.abs(j.legs[s].foot.y)).toBeLessThan(1e-6);
          const prev = lastPlanted[s];
          if (prev !== null) expect(foot.pos.x).toBeCloseTo(prev, 9);
          lastPlanted[s] = foot.pos.x;
        } else {
          lastPlanted[s] = null;
        }
      }
    }
  });

  it('swinging feet never go below the ground', () => {
    for (let f = 0; f <= frames; f++) {
      const w = walkAt(f / fps);
      for (const s of sides) expect(w.feet[s].pos.y).toBeLessThanOrEqual(1e-9);
    }
  });

  it('always has at least one foot on the ground (a walk, not a run)', () => {
    for (let f = 0; f <= frames; f++) {
      const w = walkAt(f / fps);
      expect(w.feet.front.planted || w.feet.back.planted).toBe(true);
    }
  });

  it('moves forward at a steady speed and repeats each cycle', () => {
    const v = walkSpeed(DEFAULT_WALK);
    expect(walkAt(2).pose.rootX).toBeCloseTo(2 * v, 9);
    const a = walkAt(0.3).pose;
    const b = walkAt(0.3 + DEFAULT_WALK.period).pose;
    expect(b.legs.front.upper).toBeCloseTo(a.legs.front.upper, 6);
    expect(b.hipY).toBeCloseTo(a.hipY, 9);
  });

  it('knees bend forward, toward the facing direction', () => {
    for (let f = 0; f <= frames; f += 3) {
      const j = computeSkeleton(walkAt(f / fps).pose);
      for (const s of sides) {
        const { hip, knee, foot } = j.legs[s];
        // Knee on the +x side of the hip-to-foot line.
        const cross = (foot.x - hip.x) * (knee.y - hip.y) - (foot.y - hip.y) * (knee.x - hip.x);
        expect(cross).toBeLessThanOrEqual(1e-9);
      }
    }
  });
});

describe('walks with a mood (Phase 2C)', () => {
  const moods = Object.keys(WALKS) as WalkMood[];

  it('all keep their feet planted and within reach, whatever the mood', () => {
    for (const mood of moods) {
      const p = WALKS[mood];
      const last: Record<(typeof sides)[number], number | null> = { front: null, back: null };
      for (let f = 0; f <= Math.round(3 * p.period * fps); f++) {
        const w = walkAt(f / fps, p);
        const j = computeSkeleton(w.pose);
        for (const s of sides) {
          expect(dist(j.legs[s].foot, w.feet[s].pos), `${mood} ${s} foot`).toBeLessThan(1e-6);
          const foot = w.feet[s];
          if (foot.planted) {
            const prev = last[s];
            if (prev !== null && Math.abs(foot.pos.x - prev) > 1e-9) {
              // A new plant is a whole stride on, never a slide.
              expect(foot.pos.x - prev).toBeGreaterThan(p.stride * 0.9);
            }
            last[s] = foot.pos.x;
          }
        }
      }
    }
  });

  it('differ where a viewer would see it', () => {
    const speed = (m: WalkMood) => walkSpeed(WALKS[m]);
    expect(speed('tired')).toBeLessThan(speed('normal') * 0.6);
    expect(speed('happy')).toBeGreaterThan(speed('normal') * 1.2);
    // Proud leans back with the chin up; tired leans forward with the head down.
    expect(WALKS.proud.lean).toBeLessThan(0);
    expect(walkAt(0.3, WALKS.proud).pose.headTilt).toBeLessThan(-5);
    expect(WALKS.tired.lean).toBeGreaterThan(10);
    expect(walkAt(0.3, WALKS.tired).pose.headTilt).toBeGreaterThan(10);
    // Sneaking is low, on high steps, with the hands held up in front.
    expect(WALKS.sneaky.hipHeight).toBeLessThan(WALKS.normal.hipHeight - 0.15);
    expect(WALKS.sneaky.lift).toBeGreaterThan(WALKS.normal.lift * 1.5);
    const sneak = computeSkeleton(walkAt(0.4, WALKS.sneaky).pose);
    expect(sneak.arms.front.hand.y).toBeLessThan(sneak.hip.y - 0.4);
    expect(sneak.arms.front.hand.x).toBeGreaterThan(sneak.shoulder.x);
    // Happy bounces more than twice as much as a plain walk.
    expect(WALKS.happy.bob).toBeGreaterThan(WALKS.normal.bob * 2);
  });
});
