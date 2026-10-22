import type { ReactNode } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Crumbs, Erased } from '../effects/Erase';
import type { Crumb } from '../effects/Erase';
import { Paper, PencilLine, graphite, wobble } from '../effects/Pencil';
import { EXPRESSIONS, faceAt, faceAtStrength } from '../face/expressions';
import type { ExpressionName, FaceKey } from '../face/expressions';
import { CHILD_BODY, Character, toLocal, toScreen } from '../rig/Character';
import type { HandFrame } from '../rig/Character';
import { ELBOW_DOWN } from '../rig/ik';
import { blinkAt, withLife } from '../rig/life';
import { add, clamp, fromDown, length, lerp, mul, smoothstep, sub, vec } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { mixPoses, resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { sit } from '../rig/poses';
import { computeSkeleton, shoulderOf } from '../rig/skeleton';
import type { HandShape, ResolvedPose } from '../rig/types';
import { accent, ink, mix } from '../tokens';
import { lookFrom } from '../wardrobe/cast';

/**
 * A test for the short films, on one moment of Biku's script "Erased" (scene 3, "The Sun
 * Without a Face"): Grandpa draws the sun with his finger and cannot remember what comes next;
 * his hand begins to fade; the boy waits, then adds the smile himself.
 *
 * It tries the three things the studio could not do before: a line that draws itself, part of
 * a person being rubbed out, and slow acting that holds. Biku's rules for it: no face changes
 * without a cause, and nothing that looks as if a child had made it.
 *
 * Each person has one line of feeling:
 *   Grandpa  content, until the circle is done and nothing comes: then lost. A small smile
 *            only at the very end, when he sees what the boy drew.
 *   the boy  happy, watching; worried a beat after Grandpa stops; set, while he draws; soft
 *            when he looks back at him.
 */

export const ERASED_TEST_SECONDS = 18;
const W = 1920;
const H = 1080;
const HEAD = 124;
const GROUND = 806;

// ---- when things happen, in frames at 30 a second
const T = {
  worldIn: 6,
  peopleIn: 30,
  raise: [84, 132],
  trace: [132, 226],
  rise: [226, 272],
  lost: 282,
  droop: [304, 372],
  fade: [312, 392],
  boyTurns: 318,
  boyWorry: 330,
  boyRaise: [366, 400],
  boySet: 366,
  eye1: [408, 418],
  eye2: [424, 434],
  smile: [442, 478],
  boyLower: [486, 522],
  boySoft: 488,
  grandpaSees: 494,
  grandpaSmiles: 506,
} as const;

const span = (f: number, [a, b]: readonly [number, number]): number =>
  smoothstep(clamp((f - a) / (b - a), 0, 1));

// ---- the two of them
/** How high the seat of the bench is: where someone sitting has their hips. */
const SIT_HIP = sit.hipHeight ?? 0.7;
const GRANDPA = { x: 1000, groundY: GROUND, head: HEAD, facing: 'left' as const };
const BOY_GROUND = GROUND - SIT_HIP * HEAD * (1 - CHILD_BODY);
const BOY = { x: 1232, groundY: BOY_GROUND, head: HEAD, facing: 'left' as const };
const TURN = 0.5;

const grandpaLook = lookFrom(
  {
    identity: { skinTone: 2, hair: 'short-crop', hairColor: 'gray', facialHair: 'moustache' },
    outfit: {
      clothes: {
        top: { kind: 'jacket', cloth: 'brown', under: 'cream' },
        bottom: { kind: 'trousers', cloth: 'steel' },
        shoes: { kind: 'boots', cloth: 'brown' },
        hat: { kind: 'brim-hat', cloth: 'tan' },
        glasses: true,
      },
    },
  },
  'grandpa',
);
const boyLook = lookFrom(
  {
    age: 'child',
    identity: { skinTone: 2, hair: 'short-crop', hairColor: 'brown' },
    outfit: {
      clothes: {
        top: { kind: 't-shirt', cloth: 'ocean' },
        bottom: { kind: 'trousers', cloth: 'denim' },
        shoes: { kind: 'sneakers', cloth: 'crimson' },
      },
    },
  },
  'boy',
);

/** Sitting, with the front hand somewhere of its own. */
const reaching = (reach: Vec2, hand: HandShape = 'mitten'): Pose => ({
  ...sit,
  id: 'sit-reach-test',
  arms: { ...sit.arms, front: { reach, bend: ELBOW_DOWN, hand } },
});
const slow = (a: Pose, b: Pose, t: number): ResolvedPose =>
  mixPoses(resolvePose(a), resolvePose(b), t, t);

/** Where the middle of someone's front hand is on screen, as the puppet itself works it out. */
function handOnScreen(
  pose: ResolvedPose,
  who: typeof GRANDPA,
  look: ReturnType<typeof lookFrom>,
  past = 0,
): Vec2 {
  const j = computeSkeleton(pose, {
    shoulderSpread: look.outfit?.shoulderSpread ?? 0,
    hipSpread: look.outfit?.hipSpread ?? 0,
    turn: TURN,
  });
  const k = look.age === 'child' ? CHILD_BODY : 1;
  // `past` is how far beyond the middle of the hand, along the forearm: the tip of a finger.
  const hand = add(j.arms.front.hand, mul(fromDown(j.arms.front.forearm), past));
  return toScreen(vec(pose.rootX + k * (hand.x - pose.rootX), k * hand.y), who);
}

/** The reach that points a straight arm from the shoulder at a point on screen. */
function reachToward(point: Vec2, who: typeof GRANDPA, far: number): Vec2 {
  const shoulder = shoulderOf(vec(0, -SIT_HIP), sit.torsoLean ?? 0);
  const d = sub(toLocal(point, who), shoulder);
  return mul(d, far / (length(d) || 1));
}

// ---- the sun: drawn small at his fingertip, then it rises into the sky and grows
const TRACE_C = vec(0.8, -0.72);
const TRACE_R = 0.2;
// Up and a little to the left of them both, so neither arm crosses the other's face to reach it.
const SUN = { x: 800, y: 240, r: 92 };
const traceAngle = (p: number): number => -Math.PI / 2 + 2 * Math.PI * 1.05 * p;
const traceReach = (p: number): Vec2 => {
  const a = traceAngle(p);
  return add(TRACE_C, mul(vec(Math.cos(a), Math.sin(a)), TRACE_R * wobble(a)));
};
/** How far the tip of a pointing finger is from the middle of its hand, in heads. */
const FINGER = 0.3;
// The line is where the tip of his finger has been, frame by frame: nothing is drawn that his
// finger did not draw.
const TRACED: Vec2[] = Array.from({ length: T.trace[1] - T.trace[0] + 1 }, (_, i) =>
  handOnScreen(
    resolvePose(reaching(traceReach(span(T.trace[0] + i, T.trace)), 'point')),
    GRANDPA,
    grandpaLook,
    FINGER,
  ),
);
// The middle of what he drew, and how wide and tall it came out. A finger does not draw a true
// circle; as the shape rises to be the sun it rounds out, and keeps the wobble of his hand.
const xs = TRACED.map((p) => p.x);
const ys = TRACED.map((p) => p.y);
const TRACE_AT = vec(
  (Math.min(...xs) + Math.max(...xs)) / 2,
  (Math.min(...ys) + Math.max(...ys)) / 2,
);
const TRACE_W = (Math.max(...xs) - Math.min(...xs)) / 2;
const TRACE_H = (Math.max(...ys) - Math.min(...ys)) / 2;
const TRACE_SIZE = (TRACE_W + TRACE_H) / 2;
const sunAt = (f: number) => {
  const t = span(f, T.rise);
  return {
    x: lerp(TRACE_AT.x, SUN.x, t),
    y: lerp(TRACE_AT.y, SUN.y, t),
    r: lerp(TRACE_SIZE, SUN.r, t),
    wide: lerp(1, SUN.r / TRACE_W, t),
    tall: lerp(1, SUN.r / TRACE_H, t),
  };
};
/** The circle as far as his finger has got, where it is now: at his finger, or up in the sky. */
const sunPath = (f: number): string => {
  const sun = sunAt(f);
  const upTo = clamp(f - T.trace[0], 0, TRACED.length - 1);
  const points = TRACED.slice(0, upTo + 1).map((p) => {
    const d = sub(p, TRACE_AT);
    return `${sun.x + d.x * sun.wide} ${sun.y + d.y * sun.tall}`;
  });
  return points.length > 1 ? `M ${points.join(' L ')}` : '';
};

const HOVER_FAR = 1.2;
const HALF = reaching(vec(0.82, -0.12));

function grandpaPose(f: number): ResolvedPose {
  if (f < T.raise[0]) return resolvePose(sit);
  if (f < T.trace[0]) return slow(sit, reaching(traceReach(0), 'point'), span(f, T.raise));
  if (f < T.trace[1]) return resolvePose(reaching(traceReach(span(f, T.trace)), 'point'));
  const sun = sunAt(Math.min(f, T.rise[1]));
  const hover = reaching(reachToward(sun, GRANDPA, HOVER_FAR), 'point');
  if (f < T.rise[1]) return slow(reaching(traceReach(1), 'point'), hover, span(f, T.rise));
  if (f < T.droop[0]) return resolvePose(hover);
  // It sinks halfway and stays there, forgotten in the air.
  return slow(hover, HALF, span(f, T.droop));
}

const BOY_LAP = reaching(vec(0.46, 0.84), 'grip');
function boyPose(f: number): ResolvedPose {
  const up = reachToward(SUN, BOY, 1.12);
  // His hand moves with what he draws: a dab for each eye, a sweep for the smile.
  const dab = (s: readonly [number, number]) =>
    Math.sin(Math.PI * clamp((f - s[0]) / (s[1] - s[0]), 0, 1));
  const sweep = clamp((f - T.smile[0]) / (T.smile[1] - T.smile[0]), 0, 1);
  const drawing = add(
    up,
    vec(
      0.03 * dab(T.eye1) +
        0.03 * dab(T.eye2) +
        (f >= T.smile[0] ? 0.1 * (smoothstep(sweep) - 0.5) : 0),
      f >= T.smile[0] ? 0.05 * Math.sin(Math.PI * sweep) : 0,
    ),
  );
  if (f < T.boyRaise[0]) return resolvePose(BOY_LAP);
  if (f < T.boyRaise[1]) return slow(BOY_LAP, reaching(up, 'grip'), span(f, T.boyRaise));
  if (f < T.boyLower[0]) return resolvePose(reaching(drawing, 'grip'));
  return slow(reaching(up, 'grip'), BOY_LAP, span(f, T.boyLower));
}

// ---- faces: one line of feeling each, changed only where something causes it
const face = (name: ExpressionName, strength: number) => ({
  expression: faceAtStrength(EXPRESSIONS[name], strength),
  id: `${name}-${strength}`,
});
const GRANDPA_FACES: FaceKey[] = [
  { frame: 0, ...face('happy', 0.55) },
  { frame: T.lost, ...face('hollow', 0.8) },
  { frame: T.grandpaSmiles, ...face('happy', 0.3) },
];
const BOY_FACES: FaceKey[] = [
  { frame: 0, ...face('happy', 0.7) },
  { frame: T.boyWorry, ...face('sad', 0.5) },
  { frame: T.boySet, ...face('determined', 0.4) },
  { frame: T.boySoft, ...face('happy', 0.5) },
];

/** A look that moves from one thing to the next over a third of a second, not in a jump. */
function lookingAt(f: number, keys: ReadonlyArray<{ frame: number; at: Vec2 }>): Vec2 {
  let now = keys[0]?.at ?? vec(0, 0);
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (!k) continue;
    const t = smoothstep(clamp((f - k.frame) / 10, 0, 1));
    now = vec(lerp(now.x, k.at.x, t), lerp(now.y, k.at.y, t));
  }
  return now;
}

/** The pencil the boy holds: drawn in his hand, along his forearm, point outward. */
const pencil = (hands: { front: HandFrame }): ReactNode => {
  const dir = fromDown(hands.front.forearm);
  const a = sub(hands.front.center, mul(dir, 0.16));
  const b = add(hands.front.center, mul(dir, 0.3));
  const tip = add(b, mul(dir, 0.09));
  const gold = accent('gold');
  return (
    <g strokeLinecap="round">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ink} strokeWidth={0.105} />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={gold[0]} strokeWidth={0.062} />
      <line x1={b.x} y1={b.y} x2={tip.x} y2={tip.y} stroke={ink} strokeWidth={0.05} />
    </g>
  );
};

// ---- the place: a hill, a tree and a bench, in pencil
const SEAT = GROUND - SIT_HIP * HEAD;
const HILL = `M -40 ${GROUND + 70} C 380 ${GROUND - 70}, 760 ${GROUND - 20}, 1100 ${GROUND + 2} S 1700 ${GROUND + 40}, 1980 ${GROUND - 30}`;
const TRUNK = `M 1560 ${GROUND + 22} C 1552 ${GROUND - 150}, 1572 ${GROUND - 250}, 1556 ${GROUND - 372} M 1612 ${GROUND + 26} C 1618 ${GROUND - 140}, 1600 ${GROUND - 250}, 1620 ${GROUND - 366}`;
const CROWN = `M 1556 ${GROUND - 372} C 1420 ${GROUND - 380}, 1376 ${GROUND - 520}, 1470 ${GROUND - 596} C 1470 ${GROUND - 700}, 1620 ${GROUND - 730}, 1672 ${GROUND - 640} C 1790 ${GROUND - 640}, 1820 ${GROUND - 500}, 1730 ${GROUND - 440} C 1720 ${GROUND - 390}, 1660 ${GROUND - 362}, 1620 ${GROUND - 366}`;
const BENCH_BACK = `M 906 ${SEAT - 150} H 1318 M 906 ${SEAT - 104} H 1318 M 916 ${SEAT - 168} V ${SEAT} M 1308 ${SEAT - 168} V ${SEAT}`;
const BENCH_SEAT = `M 888 ${SEAT} H 1336 M 888 ${SEAT + 20} H 1336 M 888 ${SEAT} V ${SEAT + 20} M 1336 ${SEAT} V ${SEAT + 20} M 922 ${SEAT + 20} V ${GROUND + 6} M 1302 ${SEAT + 20} V ${GROUND + 8}`;

export const ErasedTest = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame;

  const gBare = grandpaPose(f);
  const gPose = withLife(gBare, f, fps, 11);
  const bPose = withLife(boyPose(f), f, fps, 23);
  const gHand = handOnScreen(gBare, GRANDPA, grandpaLook);
  const gFinger = handOnScreen(gBare, GRANDPA, grandpaLook, FINGER);
  const sun = sunAt(f);
  const gHeadAt = vec(GRANDPA.x - 6, GROUND - 2.25 * HEAD);
  const bHeadAt = vec(BOY.x - 6, BOY_GROUND - 1.92 * HEAD);

  const grandpaEyes = lookingAt(f, [
    { frame: 0, at: bHeadAt },
    { frame: T.raise[0] - 8, at: gFinger },
    { frame: T.trace[1], at: sun },
    { frame: T.grandpaSees, at: bHeadAt },
  ]);
  // While he draws, his eyes are on his own fingertip.
  const gEyes = f >= T.raise[0] && f < T.trace[1] ? gFinger : grandpaEyes;
  const bEyes = lookingAt(f, [
    { frame: 0, at: gHand },
    { frame: T.trace[1], at: SUN },
    { frame: T.boyTurns, at: gHeadAt },
    { frame: T.boySet, at: SUN },
    { frame: T.boyLower[0], at: gHeadAt },
  ]);
  const boyEyes = f < T.trace[1] ? (f < T.raise[0] ? gHeadAt : gHand) : bEyes;

  // The rubbing out starts at his raised hand and spreads down the arm as it sinks.
  const fade = span(f, T.fade);
  const crumbs: Crumb[] = Array.from({ length: 16 }, (_, i) => {
    const born = T.fade[0] + 4 + i * 6;
    const from = handOnScreen(grandpaPose(born), GRANDPA, grandpaLook);
    return { at: born / fps, from: vec(from.x + ((i * 37) % 44) - 22, from.y + 10) };
  });

  const people = clamp((f - T.peopleIn) / 26, 0, 1);
  const draw = (start: number, frames: number) => clamp((f - start) / frames, 0, 1);
  // The camera: wide while the place is drawn, then in on the two of them and their sun by the
  // time he stops, and a slow creep closer after that.
  const push =
    1 +
    0.4 * smoothstep(clamp((f - 50) / 250, 0, 1)) +
    0.06 * smoothstep(clamp((f - 300) / 240, 0, 1));
  const tone = mix(graphite, ink, 0.25);

  return (
    <AbsoluteFill>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Paper width={W} height={H} />
        <g transform={`translate(960 540) scale(${push}) translate(-1072 -500)`}>
          <PencilLine d={HILL} progress={draw(T.worldIn, 40)} weight={5} />
          <PencilLine d={TRUNK} progress={draw(T.worldIn + 14, 30)} weight={5} />
          <PencilLine d={CROWN} progress={draw(T.worldIn + 26, 38)} weight={5} />
          <PencilLine d={BENCH_BACK} progress={draw(T.worldIn + 8, 34)} weight={5} />
          <PencilLine d={BENCH_SEAT} progress={draw(T.worldIn + 8, 34)} weight={5} />
          {/* The sun: a circle from his fingertip that rises and grows, then the boy's face on it. */}
          <path
            d={sunPath(f)}
            fill="none"
            stroke={tone}
            strokeWidth={lerp(5, 7, span(f, T.rise))}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={f >= T.trace[0] ? 1 : 0}
          />
          <PencilLine
            d={`M ${SUN.x - 30} ${SUN.y - 26} q -3 12 1 24`}
            progress={draw(T.eye1[0], T.eye1[1] - T.eye1[0])}
            weight={8}
            tone={tone}
          />
          <PencilLine
            d={`M ${SUN.x + 28} ${SUN.y - 28} q 4 12 -1 25`}
            progress={draw(T.eye2[0], T.eye2[1] - T.eye2[0])}
            weight={8}
            tone={tone}
          />
          <PencilLine
            d={`M ${SUN.x - 46} ${SUN.y + 18} C ${SUN.x - 26} ${SUN.y + 58}, ${SUN.x + 30} ${SUN.y + 64}, ${SUN.x + 50} ${SUN.y + 12}`}
            progress={smoothstep(draw(T.smile[0], T.smile[1] - T.smile[0]))}
            weight={7}
            tone={tone}
          />
          <ellipse
            cx={1112}
            cy={GROUND + 14}
            rx={250}
            ry={13}
            fill={graphite}
            opacity={0.13 * people}
          />
          <g opacity={people}>
            <Erased
              at={gHand}
              radius={(0.3 + 0.32 * fade) * HEAD}
              amount={fade}
              width={W}
              height={H}
            >
              <Character
                {...GRANDPA}
                pose={gPose}
                face={faceAt(f, GRANDPA_FACES, 22)}
                turn={TURN}
                blink={blinkAt(f, fps, 11)}
                lookAt={toLocal(gEyes, GRANDPA)}
                {...grandpaLook}
              />
            </Erased>
            <Character
              {...BOY}
              pose={bPose}
              face={faceAt(f, BOY_FACES, 18)}
              turn={TURN}
              blink={blinkAt(f, fps, 23)}
              lookAt={toLocal(boyEyes, BOY)}
              {...boyLook}
              prop={pencil}
            />
          </g>
          <Crumbs crumbs={crumbs} t={f / fps} groundY={GROUND + 6} size={12} seed={5} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
