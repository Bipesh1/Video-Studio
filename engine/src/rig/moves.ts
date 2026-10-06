import { STAND_HIP_HEIGHT, legLength } from './body';
import { KNEE_FORWARD } from './ik';
import { DEG, clamp, lerp, smoothstep, vec } from './math';
import type { Vec2 } from './math';
import { legToFoot } from './pose';
import type { HandPose, LimbAngles, ResolvedPose } from './types';

/**
 * One-shot action moves (Phase 2D): a jump, two falls, a punch, a swing with something held,
 * and the stagger of someone who has been hit. Each is a pose as a function of the seconds
 * since it began. It starts from a plain stand, and after its last moment it holds its last
 * pose. Every part of the body is on its own track of timed values, so a move can be tuned one
 * joint at a time.
 *
 * Violence is by implication only (Style 4): a hit is the attacker's swing, an impact flash
 * where it lands (effects/Impact) and the other person's recoil. Nothing is ever wounded.
 */

/**
 * How a value arrives at a key: smoothly (the default), speeding up all the way like something
 * falling ('in'), or fast at first and slowing like something thrown up ('out').
 */
type Ease = 'smooth' | 'in' | 'out';
type Key = readonly [time: number, value: number, ease?: Ease];

const EASES: Record<Ease, (u: number) => number> = {
  smooth: smoothstep,
  in: (u) => u * u,
  out: (u) => 1 - (1 - u) * (1 - u),
};

/** A value that eases from key to key. It holds before the first key and after the last. */
export function track(time: number, keys: readonly Key[]): number {
  const first = keys[0];
  if (!first) return 0;
  if (time <= first[0]) return first[1];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (a && b && time <= b[0]) {
      const u = (time - a[0]) / Math.max(1e-9, b[0] - a[0]);
      return lerp(a[1], b[1], EASES[b[2] ?? 'smooth'](u));
    }
  }
  return keys[keys.length - 1]?.[1] ?? first[1];
}

type ArmKey = readonly [time: number, upper: number, lower: number];

const armTrack = (time: number, keys: readonly ArmKey[]): LimbAngles => ({
  upper: track(
    time,
    keys.map(([t, upper]) => [t, upper] as const),
  ),
  lower: track(
    time,
    keys.map(([t, , lower]) => [t, lower] as const),
  ),
});

/** A foot that steps from one ground point to another between two moments, lifting as it goes. */
function step(time: number, from: number, to: number, t0: number, t1: number, lift: number): Vec2 {
  const u = clamp((time - t0) / (t1 - t0), 0, 1);
  return vec(lerp(from, to, smoothstep(u)), -lift * Math.sin(Math.PI * u));
}

const STAND = STAND_HIP_HEIGHT;
const FEET = 0.2;
const mitten = (thumb: 1 | -1): HandPose => ({ shape: 'mitten', thumb });
const fist = (thumb: 1 | -1): HandPose => ({ shape: 'grip', thumb });
const MITTENS = { front: mitten(-1), back: mitten(1) } as const;

/** The arms of the plain stand every move starts from. */
const REST = { front: [16, 6], back: [-16, -6] } as const;

function build(
  rootX: number,
  hipHeight: number,
  feet: { front: Vec2; back: Vec2 },
  rest: Omit<ResolvedPose, 'rootX' | 'hipY' | 'legs' | 'headBob'>,
): ResolvedPose {
  const hip = vec(rootX, -hipHeight);
  return {
    rootX,
    hipY: -hipHeight,
    headBob: 0,
    legs: {
      front: legToFoot(hip, feet.front, KNEE_FORWARD),
      back: legToFoot(hip, feet.back, KNEE_FORWARD),
    },
    ...rest,
  };
}

// ---------------------------------------------------------------------------------------------
// Jump

/** The moments of a jump, in seconds: lowest point of the crouch, take-off, landing, standing again. */
export const JUMP = { crouch: 0.2, takeoff: 0.3, land: 0.74, end: 1.1 } as const;

/**
 * A jump forward: crouch with the arms swung back, spring up with the arms thrown high, tuck
 * the legs in the air, land on bent knees and stand up. `height` is how high the hips rise and
 * `distance` how far forward the jump lands, in head units. A jump on the spot has distance 0.
 */
export function jumpAt(time: number, height = 0.9, distance = 1.5): ResolvedPose {
  const t = clamp(time, 0, JUMP.end);
  const u = clamp((t - JUMP.takeoff) / (JUMP.land - JUMP.takeoff), 0, 1);
  const inAir = u > 0 && u < 1;
  const rootX = distance * u;
  const legs = track(t, [
    [0, STAND],
    [JUMP.crouch, STAND * 0.7],
    [JUMP.takeoff, STAND],
    [JUMP.land, STAND * 0.96],
    [JUMP.land + 0.12, STAND * 0.68],
    [JUMP.end, STAND],
  ]);
  const hipHeight = legs + height * 4 * u * (1 - u);
  // In the air the feet hang from the hips and tuck up; on the ground they are planted.
  const tuck = (ahead: readonly Key[], below: readonly Key[]): Vec2 =>
    vec(rootX + track(u, ahead), -hipHeight + track(u, below));
  const landed = u >= 1 ? distance : 0;
  const feet = inAir
    ? {
        front: tuck(
          [
            [0, FEET],
            [0.5, 0.32],
            [1, 0.25],
          ],
          [
            [0, STAND],
            [0.5, 0.8],
            [1, STAND * 0.96],
          ],
        ),
        back: tuck(
          [
            [0, -FEET],
            [0.5, -0.02],
            [1, -0.15],
          ],
          [
            [0, STAND],
            [0.5, 0.94],
            [1, STAND * 0.96],
          ],
        ),
      }
    : {
        front: vec(landed + (u >= 1 ? 0.25 : FEET), 0),
        back: vec(landed - (u >= 1 ? 0.15 : FEET), 0),
      };
  const mid = (JUMP.takeoff + JUMP.land) / 2;
  const swing: readonly ArmKey[] = [
    [0, REST.front[0], REST.front[1]],
    [JUMP.crouch, -58, 22],
    [JUMP.takeoff, 150, 12],
    [mid, 164, 8],
    [JUMP.land, 96, 30],
    [JUMP.land + 0.12, 48, 40],
    [JUMP.end, REST.front[0], REST.front[1]],
  ];
  const front = armTrack(t, swing);
  const back = armTrack(t, [
    [0, REST.back[0], REST.back[1]],
    ...swing.slice(1, -1).map(([at, upper, lower]) => [at, upper - 14, lower + 6] as const),
    [JUMP.end, REST.back[0], REST.back[1]],
  ]);
  return build(rootX, hipHeight, feet, {
    torsoLean: track(t, [
      [0, 0],
      [JUMP.crouch, 24],
      [JUMP.takeoff, 10],
      [mid, -4],
      [JUMP.land, 10],
      [JUMP.land + 0.12, 22],
      [JUMP.end, 0],
    ]),
    headTilt: track(t, [
      [0, 0],
      [JUMP.crouch, -12],
      [mid, -6],
      [JUMP.land + 0.12, -10],
      [JUMP.end, 0],
    ]),
    arms: { front, back },
    hands: MITTENS,
  });
}

// ---------------------------------------------------------------------------------------------
// Falls

/** The moments of a fall, in seconds: hitting the ground, and lying still after the bounce. */
export const FALL = { ground: 0.6, end: 0.84 } as const;

/**
 * Falling flat on the face, as after a trip: a stumble, then the body tips over its feet like
 * a felled tree with the arms flying out, hits the ground, bounces once and lies still.
 */
export function fallAt(time: number): ResolvedPose {
  const t = clamp(time, 0, FALL.end);
  const g = FALL.ground;
  // How far the legs have tipped over the feet, in degrees: slowly at first, fast at the end.
  const tip = track(t, [
    [0, 0],
    [0.18, 11],
    [g, 86, 'in'],
  ]);
  // How straight the legs are: they buckle in the stumble and are straight when it lands.
  const straight = track(t, [
    [0, STAND / legLength],
    [0.18, 0.93],
    [0.42, 0.975],
    [g - 0.06, 0.995],
  ]);
  const bounce = track(t, [
    [g, 0],
    [g + 0.09, 0.1, 'out'],
    [FALL.end, 0, 'in'],
  ]);
  const reach = legLength * straight;
  // The feet come together under the point the body tips over, and end just off the ground.
  const gather = track(t, [
    [0.1, 0],
    [0.42, 1],
  ]);
  const lying = track(t, [
    [0.18, 0],
    [g, 1, 'in'],
  ]);
  return build(
    reach * Math.sin(tip * DEG),
    reach * Math.cos(tip * DEG) + bounce,
    {
      front: vec(lerp(FEET, 0, gather), -0.07 * lying),
      back: vec(lerp(-FEET, 0, gather), -0.15 * lying),
    },
    {
      torsoLean: track(t, [
        [0, 0],
        [0.18, 20],
        [g, 71, 'in'],
        [g + 0.09, 66, 'out'],
        [FALL.end, 71, 'in'],
      ]),
      headTilt: track(t, [
        [0, 0],
        [0.25, -16],
        [g, 0],
        [FALL.end, 12],
      ]),
      arms: {
        front: armTrack(t, [
          [0, REST.front[0], REST.front[1]],
          [0.26, 104, 24],
          [g, 86, 10],
          [FALL.end, 82, 12],
        ]),
        back: armTrack(t, [
          [0, REST.back[0], REST.back[1]],
          [0.26, 82, 34],
          [g, 72, 8],
          [FALL.end, 74, 6],
        ]),
      },
      hands: MITTENS,
    },
  );
}

/**
 * Falling flat on the back, as after being knocked down: the body goes over backward with the
 * arms flailing, lands, bounces once and lies still with one knee up.
 */
export function fallBackAt(time: number): ResolvedPose {
  const t = clamp(time, 0, FALL.end);
  const g = FALL.ground;
  const rootX = track(t, [
    [0, 0],
    [0.2, -0.16],
    [g, -1.2, 'in'],
  ]);
  const hipHeight = track(t, [
    [0, STAND],
    [0.2, 1.2],
    [g, 0.12, 'in'],
    [g + 0.09, 0.22, 'out'],
    [FALL.end, 0.12, 'in'],
  ]);
  const lying = track(t, [
    [0.2, 0],
    [g, 1, 'in'],
  ]);
  return build(
    rootX,
    hipHeight,
    {
      front: vec(lerp(FEET, 0.12, lying), -0.07 * lying),
      back: vec(lerp(-FEET, -0.34, lying), -0.05 * lying),
    },
    {
      torsoLean: track(t, [
        [0, 0],
        [0.2, -22],
        [g, -73, 'in'],
        [g + 0.09, -65, 'out'],
        [FALL.end, -70, 'in'],
      ]),
      headTilt: track(t, [
        [0, 0],
        [0.2, 14],
        [g, -10],
        [FALL.end, -8],
      ]),
      arms: {
        front: armTrack(t, [
          [0, REST.front[0], REST.front[1]],
          [0.24, 118, 30],
          [g, 62, 16],
          [FALL.end, 56, 14],
        ]),
        back: armTrack(t, [
          [0, REST.back[0], REST.back[1]],
          [0.24, 150, 20],
          [g, -112, -14],
          [FALL.end, -104, -10],
        ]),
      },
      hands: MITTENS,
    },
  );
}

// ---------------------------------------------------------------------------------------------
// Fight: wind-up, swing, hit, recoil

/** The moments of a punch, in seconds. The fist is at full reach at `hit`. */
export const PUNCH = { windup: 0.14, hit: 0.22, hold: 0.34, end: 0.64 } as const;

/** Stepping in for a strike and back out again: where the front foot is at a time. */
const lunge = (t: number, m: { windup: number; hit: number; hold: number; end: number }): Vec2 =>
  t < m.hold
    ? step(t, FEET, 0.58, m.windup, m.hit, 0.07)
    : step(t, 0.58, FEET, m.hold + 0.06, m.end, 0.05);

/**
 * A punch: the fist cocks back by the shoulder, then the body steps in and the arm shoots
 * straight out, holds a beat and comes back to a stand. Put an impact flash at the fist at
 * PUNCH.hit and start the other person's recoilAt there.
 */
export function punchAt(time: number): ResolvedPose {
  const t = clamp(time, 0, PUNCH.end);
  const m = PUNCH;
  const rootX = track(t, [
    [0, 0],
    [m.windup, -0.08],
    [m.hit, 0.26],
    [m.hold, 0.24],
    [m.end, 0],
  ]);
  const hipHeight = track(t, [
    [0, STAND],
    [m.windup, STAND * 0.95],
    [m.hit, STAND * 0.9],
    [m.hold, STAND * 0.91],
    [m.end, STAND],
  ]);
  const fists = t > 0.03 && t < m.end - 0.08;
  return build(
    rootX,
    hipHeight,
    { front: lunge(t, m), back: vec(-FEET, 0) },
    {
      torsoLean: track(t, [
        [0, 0],
        [m.windup, -9],
        [m.hit, 17],
        [m.hold, 14],
        [m.end, 0],
      ]),
      headTilt: track(t, [
        [0, 0],
        [m.windup, 5],
        [m.hit, -9],
        [m.end, 0],
      ]),
      arms: {
        front: armTrack(t, [
          [0, REST.front[0], REST.front[1]],
          [m.windup, -52, 128],
          [m.hit, 91, 2],
          [m.hold, 88, 6],
          [m.end, REST.front[0], REST.front[1]],
        ]),
        // The other fist comes up as a guard and pulls back as the punch goes out.
        back: armTrack(t, [
          [0, REST.back[0], REST.back[1]],
          [m.windup, 34, 104],
          [m.hit, -34, 96],
          [m.hold, -28, 92],
          [m.end, REST.back[0], REST.back[1]],
        ]),
      },
      hands: fists ? { front: fist(-1), back: fist(1) } : MITTENS,
    },
  );
}

/** The moments of a swing, in seconds. The held thing comes down on its target at `hit`. */
export const SWING = { windup: 0.22, hit: 0.32, hold: 0.44, end: 0.8 } as const;

/**
 * A swing with something held in the front hand (a sword, a club, a broom): it goes up and
 * back over the shoulder, comes down hard in front as the body steps in, follows through and
 * returns to being held upright. The hand grips all the way, and the handle turns with the arm.
 */
export function swingAt(time: number): ResolvedPose {
  const t = clamp(time, 0, SWING.end);
  const m = SWING;
  const rootX = track(t, [
    [0, 0],
    [m.windup, -0.1],
    [m.hit, 0.22],
    [m.hold, 0.24],
    [m.end, 0],
  ]);
  const hipHeight = track(t, [
    [0, STAND],
    [m.windup, STAND * 0.97],
    [m.hit, STAND * 0.88],
    [m.hold, STAND * 0.88],
    [m.end, STAND],
  ]);
  // The handle: upright when held, tipped back over the shoulder, then whipped down in front.
  const gripAxis = track(t, [
    [0, -90],
    [m.windup, -152],
    [m.hit, -12],
    [m.hold, 22],
    [m.end, -90],
  ]);
  return build(
    rootX,
    hipHeight,
    { front: lunge(t, m), back: vec(-FEET, 0) },
    {
      torsoLean: track(t, [
        [0, 0],
        [m.windup, -12],
        [m.hit, 19],
        [m.hold, 23],
        [m.end, 0],
      ]),
      headTilt: track(t, [
        [0, 0],
        [m.windup, 6],
        [m.hit, -10],
        [m.end, 0],
      ]),
      arms: {
        front: armTrack(t, [
          [0, 66, 24],
          [m.windup, 202, 30],
          [m.hit, 78, 8],
          [m.hold, 48, 10],
          [m.end, 66, 24],
        ]),
        back: armTrack(t, [
          [0, -12, 8],
          [m.windup, 40, 60],
          [m.hit, -40, 30],
          [m.hold, -44, 26],
          [m.end, -12, 8],
        ]),
      },
      hands: { front: { shape: 'grip', thumb: 1, gripAxis }, back: mitten(1) },
    },
  );
}

/** How a recoil goes: when it is over, and how far back the stagger ends, in head units. */
export const RECOIL = { end: 0.85, back: 0.6 } as const;

/**
 * Being hit from the front: the head snaps back, the body buckles away, two stumbling steps
 * backward, then upright again. Start it at the moment the blow lands. Follow it with
 * fallBackAt for a knock-down.
 */
export function recoilAt(time: number): ResolvedPose {
  const t = clamp(time, 0, RECOIL.end);
  const far = -RECOIL.back;
  const rootX = track(t, [
    [0, 0],
    [0.1, -0.16],
    [0.46, far],
  ]);
  const hipHeight = track(t, [
    [0, STAND],
    [0.1, STAND * 0.92],
    [0.46, STAND * 0.88],
    [RECOIL.end, STAND],
  ]);
  return build(
    rootX,
    hipHeight,
    {
      front: step(t, FEET, far + FEET, 0.28, 0.5, 0.1),
      back: step(t, -FEET, far - FEET, 0.04, 0.24, 0.12),
    },
    {
      torsoLean: track(t, [
        [0, 0],
        [0.07, -22],
        [0.3, -13],
        [0.58, 7],
        [RECOIL.end, 0],
      ]),
      headTilt: track(t, [
        [0, 0],
        [0.06, -28],
        [0.3, -8],
        [0.58, 12],
        [RECOIL.end, 0],
      ]),
      arms: {
        front: armTrack(t, [
          [0, REST.front[0], REST.front[1]],
          [0.09, 74, 38],
          [0.4, 44, 30],
          [RECOIL.end, REST.front[0], REST.front[1]],
        ]),
        back: armTrack(t, [
          [0, REST.back[0], REST.back[1]],
          [0.09, 56, 52],
          [0.4, -34, 20],
          [RECOIL.end, REST.back[0], REST.back[1]],
        ]),
      },
      hands: MITTENS,
    },
  );
}
