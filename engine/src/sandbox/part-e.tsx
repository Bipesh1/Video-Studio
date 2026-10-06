import { useCurrentFrame, useVideoConfig } from 'remotion';
import { EXPRESSIONS } from '../face/expressions';
import { Scepter } from '../props/Scepter';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { swayOf } from '../rig/follow';
import { blinkAt, gazeAt, withLife } from '../rig/life';
import { blendPoses, mixPoses, moveFrames, resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { holdObject, stand } from '../rig/poses';
import type { ResolvedPose } from '../rig/types';
import { walkAt } from '../rig/walk';
import { RULER } from '../wardrobe/costumes/ruler';
import { outfitFrom } from '../wardrobe/garments';
import type { Identity } from '../wardrobe/types';
import type { Colors } from './Sandbox';

/**
 * Phase 2C motion polish, in motion: a walk, a stop and a raised arm, so the follow-through of
 * the cape, the hair and the scepter can be judged. The camera rides with each character and
 * the ground marks slide past.
 */

const W = 1080;
const STOP = 75;
const RAISE = 118;
const SETTLE = 8;

const scepterProp: CharacterProps['prop'] = (hands, info) =>
  hands.front.hand.shape === 'grip' ? (
    <Scepter frame={hands.front} uid={info.uid} shadowSide={info.shadowSide} sway={info.sway} />
  ) : null;

/** The scepter thrust up and forward. */
const RAISED: Pose = {
  ...holdObject,
  id: 'raise',
  torsoLean: -3,
  arms: {
    front: { upper: 128, lower: 14, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: { upper: -12, lower: 8 },
  },
};

/** Walk, stop, then (for the one who holds something) raise it. One function of the frame. */
function act(frame: number, fps: number, holds: boolean): ResolvedPose {
  const carry = (f: number): ResolvedPose => {
    const w = walkAt(f / fps).pose;
    if (!holds) return w;
    const h = resolvePose(holdObject);
    return {
      ...w,
      arms: { front: h.arms.front, back: w.arms.back },
      hands: { front: h.hands.front, back: w.hands.back },
    };
  };
  if (frame < STOP) return carry(frame);
  const last = carry(STOP);
  const rest = resolvePose(holds ? holdObject : stand, last.rootX + 0.2);
  if (frame < STOP + SETTLE) return blendPoses(last, rest, (frame - STOP) / SETTLE);
  if (!holds || frame < RAISE) return rest;
  const up = resolvePose(RAISED, rest.rootX);
  const { windup, transition } = moveFrames(rest, up);
  const f = frame - RAISE;
  if (f >= windup + transition) return up;
  if (f < windup) return mixPoses(rest, up, -0.12 * Math.sin(((f / windup) * Math.PI) / 2), 0);
  return blendPoses(rest, up, (f - windup) / transition);
}

const LONG_HAIR: Identity = { skinTone: 2, hair: 'long', hairColor: 'auburn' };
const DRESS = outfitFrom({
  onePiece: { kind: 'dress', cloth: 'forest' },
  shoes: { kind: 'sneakers', cloth: 'white' },
  cloak: { cloth: 'crimson' },
});

function Runner({
  groundY,
  holds,
  seed,
  c,
  extra,
}: {
  groundY: number;
  holds: boolean;
  seed: number;
  c: Colors;
  extra: Partial<CharacterProps>;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = 150;
  const moving = (f: number) => act(f, fps, holds);
  const pose = moving(frame);
  const still = frame >= STOP + SETTLE;
  const camera = pose.rootX * head;
  // Marks one head apart on the ground, sliding past as the character walks.
  const first = Math.floor((camera - 400) / head);
  return (
    <>
      <rect x={0} y={groundY} width={W} height={70} fill={c.ground} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect
          key={i}
          x={(first + i) * head - camera + 400}
          y={groundY + 26}
          width={26}
          height={10}
          fill={c.base}
        />
      ))}
      <Character
        x={400 - camera}
        groundY={groundY}
        head={head}
        pose={still ? withLife(pose, frame, fps, seed) : pose}
        face={EXPRESSIONS.determined}
        turn={1}
        blink={blinkAt(frame, fps, seed)}
        gaze={gazeAt(frame, fps, seed)}
        sway={swayOf(moving, frame, fps)}
        {...extra}
      />
    </>
  );
}

export const POLISH_SECONDS = 6;

export function PolishVideo({ c }: { c: Colors }) {
  return (
    <>
      <Runner groundY={840} holds seed={31} c={c} extra={{ outfit: RULER, prop: scepterProp }} />
      <Runner
        groundY={1720}
        holds={false}
        seed={47}
        c={c}
        extra={{ outfit: DRESS, identity: LONG_HAIR }}
      />
    </>
  );
}
