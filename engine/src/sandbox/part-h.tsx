import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Background, backgroundSpec } from '../backgrounds/Background';
import type { BackgroundSpec } from '../backgrounds/Background';
import { Fade, Pan, PunchIn, Shake } from '../camera/Camera';
import { AngerMark } from '../effects/AngerMark';
import { DizzyStars } from '../effects/Dizzy';
import { Impact } from '../effects/Impact';
import { MotionLines } from '../effects/MotionLines';
import { FlyingSweat, RestingSweat } from '../effects/Sweat';
import { HeadSymbol } from '../effects/Symbol';
import { TearStreams } from '../effects/Tears';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { cheerAt } from '../rig/actions';
import { chainAt } from '../rig/chain';
import type { Link } from '../rig/chain';
import { Character, toScreen } from '../rig/Character';
import { swayOf } from '../rig/follow';
import { blinkAt, withLife } from '../rig/life';
import { smoothstep } from '../rig/math';
import { FALL, JUMP, PUNCH, fallBackAt, jumpAt, punchAt } from '../rig/moves';
import { resolvePose } from '../rig/pose';
import { handsUp, stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import { turnAt } from '../rig/turn';
import { GAITS, WALKS, walkAt, walkSpeed } from '../rig/walk';
import { SOLDIER } from '../wardrobe/costumes/soldier';
import { outfitFrom } from '../wardrobe/garments';
import { Block } from './Block';
import { boulderProp } from './fixtures';

/**
 * The Phase 2D action test clip: three shots that use the action moves, the effects and the
 * camera moves together. A hooded thief is spotted, chased and caught by a guard. It is one
 * story in one place on one afternoon, so the setting never changes (Biku, 2026-10-06).
 * Shot 1, the chase: sneak, run, jump, motion lines, a symbol, a following camera.
 * Shot 2, caught: they run in, he turns, a punch, impact flash, shake, and he is knocked flat
 *   at once; dizzy stars, a cheer. The cut into it is on the running, so the chase carries over.
 * Shot 3, later: push, a proud walk, tears, a pan and a fast push-in, after a quick fade.
 * No sound. The crate and the boulder are test stand-ins until the props are drawn in 2E.
 */

const W = 1080;
const H = 1920;
const HEAD = 180;
const GROUND = 1340;
const SEED = 2604;

/** Where the shots change, in seconds. */
const CUT_1 = 4.2;
const CUT_2 = 9.8;
export const ACTION_SECONDS = 13.8;

/** The one place the whole story happens in. */
const PLACE: BackgroundSpec = backgroundSpec('simple', 'clear-day', SEED, {
  horizon: 0.68,
  silhouettes: [
    { kind: 'tree', x: 0.7, size: 0.3, layer: 'mid' },
    { kind: 'bush', x: 0.1, size: 0.12, layer: 'mid' },
  ],
  tufts: 9,
});

const THIEF = outfitFrom({
  top: { kind: 'shirt', cloth: 'steel' },
  bottom: { kind: 'trousers', cloth: 'steel' },
  shoes: { kind: 'boots', cloth: 'steel' },
  cloak: { cloth: 'forest', hood: true },
});

const face = (name: ExpressionName) => EXPRESSIONS[name];
const standing = resolvePose(stand);
const still = () => standing;
const run = (s: number) => walkAt(s, GAITS.run).pose;
const RUN_SPEED = walkSpeed(GAITS.run);
/** A running jump: the long crouch is skipped, so the runner plants and springs at once. */
const leap = (s: number) => jumpAt(JUMP.crouch + s, 0.95, 2.3);
const PLANT = JUMP.takeoff - JUMP.crouch;
/** Running on out of a leap: just after the feet touch down. */
const LANDED = JUMP.land - JUMP.crouch + 0.14;

type ShotProps = { t: number; frame: number; fps: number };

// ---------------------------------------------------------------------------------------------
// Shot 1: the chase

const SPOTTED = 1;
const BOLT = 1.3;
const THIEF_LEAP = 3.1;
const THIEF_CHASE: Link[] = [
  { from: 0, at: (s) => walkAt(s, WALKS.sneaky).pose },
  { from: BOLT, at: run },
  { from: THIEF_LEAP, at: leap },
  { from: THIEF_LEAP + LANDED, at: run },
];
const TAKEOFF_X = chainAt(THIEF_LEAP + PLANT, THIEF_CHASE).rootX;
const CRATE_X = TAKEOFF_X + 1.2;
/** How far behind the thief the guard runs, in heads. */
const GAP = 2.4;
const GUARD_START = chainAt(BOLT, THIEF_CHASE).rootX - GAP - RUN_SPEED * BOLT;
const GUARD_LEAP = (TAKEOFF_X - GUARD_START) / RUN_SPEED - PLANT;
const GUARD_CHASE: Link[] = [
  { from: 0, at: run },
  { from: GUARD_LEAP, at: leap },
  { from: GUARD_LEAP + LANDED, at: run },
];

function Chase({ t, frame, fps }: ShotProps) {
  const thief = chainAt(t, THIEF_CHASE);
  const guard = chainAt(t, GUARD_CHASE);
  // The camera rides with the thief.
  const cam = thief.rootX;
  const sx = (world: number) => 590 + (world - cam) * HEAD;
  const thiefAt = { x: sx(0), groundY: GROUND, head: HEAD };
  const guardAt = { x: sx(GUARD_START), groundY: GROUND, head: HEAD };
  const running = t > BOLT + 0.15 && (t < THIEF_LEAP || t > THIEF_LEAP + LANDED + 0.1);
  const thiefBack = toScreen(computeSkeleton(thief).neck, thiefAt);
  const guardBack = toScreen(computeSkeleton(guard).neck, guardAt);
  return (
    <>
      <Background
        spec={PLACE}
        width={W}
        height={H}
        frame={frame}
        fps={fps}
        cameraX={cam * HEAD}
        endless
      />
      <g transform={`translate(${sx(CRATE_X)} ${GROUND}) scale(${HEAD})`}>
        <Block x={0} y={-0.34} width={0.95} height={0.68} paint="brown" />
      </g>
      <MotionLines
        x={guardBack.x - 0.8 * HEAD}
        y={guardBack.y + 0.45 * HEAD}
        head={HEAD}
        direction={0}
        frame={frame}
        seed={2}
      />
      <Character
        {...guardAt}
        pose={guard}
        face={face('shouting')}
        turn={1}
        outfit={SOLDIER}
        headEffects={<AngerMark t={t} />}
      />
      {running && (
        <MotionLines
          x={thiefBack.x - 0.55 * HEAD}
          y={thiefBack.y - 0.55 * HEAD}
          head={HEAD}
          direction={0}
          length={0.6}
          spread={0.36}
          frame={frame}
          seed={5}
        />
      )}
      <Character
        {...thiefAt}
        pose={thief}
        face={face(t < SPOTTED ? 'determined' : t < BOLT ? 'surprised' : 'afraid')}
        turn={1}
        blink={blinkAt(frame, fps, SEED)}
        outfit={THIEF}
        sway={swayOf((f) => chainAt(f / fps, THIEF_CHASE), frame, fps)}
        headEffects={
          <>
            {t >= SPOTTED && t < SPOTTED + 0.8 && <HeadSymbol kind="!" t={t - SPOTTED} />}
            {t >= BOLT + 0.3 && <FlyingSweat t={t} seed={SEED} count={3} />}
          </>
        }
      />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Shot 2: caught

/** Where the two end up standing, in heads from the left of the picture. */
const THIEF_STANDS = 3.15;
const GUARD_STANDS = THIEF_STANDS - 2.25;
/** They run in on the cut, so the chase carries straight over from shot 1. */
const RUN_IN = 1;
const THIEF_ENTERS = THIEF_STANDS - RUN_SPEED * RUN_IN;
const GUARD_ENTERS = THIEF_ENTERS - GAP;
const GUARD_ARRIVES = (GUARD_STANDS - GUARD_ENTERS) / RUN_SPEED;
const TURNS = 1.1;
const HANDS_UP = 1.35;
const PUNCH_AT = 2.1;
const HIT = PUNCH_AT + PUNCH.hit;
const LANDS = HIT + FALL.ground;
const STEPS_UP = HIT + 1;
const STEP_TIME = 1.2;
const VICTORY = STEPS_UP + STEP_TIME;

const GUARD_CATCHES: Link[] = [
  { from: 0, at: run },
  { from: GUARD_ARRIVES, at: still },
  { from: PUNCH_AT, at: punchAt },
  { from: PUNCH_AT + PUNCH.end, at: still },
  { from: STEPS_UP, at: (s) => walkAt(s, WALKS.proud).pose },
  { from: VICTORY, at: cheerAt },
];
/** The thief faces right while he runs in and left once he has turned: one chain for each. */
const THIEF_RUNS_IN: Link[] = [
  { from: 0, at: run },
  { from: RUN_IN, at: still },
];
const THIEF_CAUGHT: Link[] = [
  { from: 0, at: still },
  { from: HANDS_UP, at: () => resolvePose(handsUp) },
  // The blow knocks him flat at once: the fall starts on the frame it lands.
  { from: HIT, at: fallBackAt },
];

function Caught({ t, frame, fps }: ShotProps) {
  const at = (seconds: number) => Math.round(seconds * fps);
  // The camera holds for the fight, then goes with the thief as he is knocked down.
  const camera = 1.9 * HEAD * smoothstep((t - HIT - 0.05) / 0.7);
  const sx = (world: number) => 150 + world * HEAD - camera;

  const guardPose = chainAt(t, GUARD_CATCHES);
  const guardWaits = t > GUARD_ARRIVES + 0.15 && t < PUNCH_AT;
  const guardTurn = turnAt(frame, [
    { frame: 0, facing: 'right', turn: 1 },
    { frame: at(GUARD_ARRIVES), facing: 'right', turn: 0.5 },
    { frame: at(STEPS_UP), facing: 'right', turn: 1 },
    { frame: at(VICTORY), facing: 'right', turn: 0.35 },
  ]);
  const guardAt = { x: sx(GUARD_ENTERS), groundY: GROUND, head: HEAD };
  const punching = t >= PUNCH_AT && t < PUNCH_AT + PUNCH.end;
  const hitPose = chainAt(HIT, GUARD_CATCHES);
  const fist = toScreen(computeSkeleton(hitPose).arms.front.hand, guardAt);

  const thiefTurn = turnAt(frame, [
    { frame: 0, facing: 'right', turn: 1 },
    { frame: at(TURNS), facing: 'left', turn: 0.5 },
  ]);
  const turned = thiefTurn.facing === 'left';
  const thiefPoseAt = (seconds: number) =>
    turned ? chainAt(seconds, THIEF_CAUGHT) : chainAt(seconds, THIEF_RUNS_IN);
  const thiefWaits = t > RUN_IN + 0.15 && t < HIT;
  const thiefPose = thiefWaits ? withLife(thiefPoseAt(t), frame, fps, SEED + 1) : thiefPoseAt(t);
  const thiefAt = {
    x: sx(turned ? THIEF_STANDS : THIEF_ENTERS),
    groundY: GROUND,
    head: HEAD,
    facing: thiefTurn.facing,
  };
  const thiefFace: ExpressionName =
    t < RUN_IN
      ? 'afraid'
      : t < TURNS + 0.15
        ? 'exhausted'
        : t < HIT
          ? 'afraid'
          : t < LANDS + 0.2
            ? 'wailing'
            : 'exhausted';
  const thiefHead = toScreen(computeSkeleton(thiefPose).head, thiefAt);
  const sinceHit = t - HIT;
  return (
    <Shake frame={frame} fps={fps} at={[at(HIT), at(LANDS)]} width={W} height={H} seed={SEED}>
      <Background
        spec={PLACE}
        width={W}
        height={H}
        frame={frame}
        fps={fps}
        cameraX={camera}
        endless
      />
      <Character
        {...guardAt}
        pose={guardWaits ? withLife(guardPose, frame, fps, SEED) : guardPose}
        face={face(
          t >= VICTORY ? 'laughing' : punching || t < GUARD_ARRIVES ? 'shouting' : 'angry',
        )}
        turn={guardTurn.turn}
        blink={blinkAt(frame, fps, SEED)}
        outfit={SOLDIER}
        headEffects={t < HIT + 0.4 ? <AngerMark t={t} /> : null}
      />
      <Character
        {...thiefAt}
        pose={thiefPose}
        face={face(thiefFace)}
        turn={thiefTurn.turn}
        blink={thiefWaits ? blinkAt(frame, fps, SEED + 1) : 0}
        outfit={THIEF}
        squash={sinceHit >= 0 && sinceHit < 0.13 ? 0.08 * (1 - sinceHit / 0.13) : 0}
        sway={swayOf((f) => thiefPoseAt(f / fps), frame, fps)}
        headEffects={
          <>
            {t >= RUN_IN + 0.1 && t < TURNS + 0.15 && <RestingSweat side={-1} />}
            {t >= TURNS + 0.2 && t < TURNS + 0.9 && <HeadSymbol kind="!" t={t - TURNS - 0.2} />}
            {t >= HANDS_UP && t < HIT && <FlyingSweat t={t} seed={SEED} />}
            {t >= LANDS + 0.15 && <DizzyStars t={t - LANDS} count={4} />}
          </>
        }
      />
      {punching && t < HIT && (
        <MotionLines
          x={toScreen(computeSkeleton(guardPose).arms.front.hand, guardAt).x - 0.25 * HEAD}
          y={fist.y}
          head={HEAD}
          direction={0}
          length={0.7}
          spread={0.3}
          frame={frame}
        />
      )}
      <Impact x={fist.x + 0.25 * HEAD} y={fist.y} head={HEAD} t={sinceHit} seed={3} />
      <Impact
        x={thiefHead.x}
        y={GROUND - 0.2 * HEAD}
        head={HEAD}
        t={t - LANDS}
        size={0.8}
        seed={8}
      />
    </Shake>
  );
}

// ---------------------------------------------------------------------------------------------
// Shot 3: later, the punishment

const PUSH_SPEED = walkSpeed(GAITS.push);

function Work({ t, frame, fps }: ShotProps) {
  const at = (seconds: number) => Math.round(seconds * fps);
  const push = walkAt(t, GAITS.push).pose;
  // The guard strolls behind at the thief's pace.
  const stroll = walkAt((t * PUSH_SPEED) / walkSpeed(WALKS.proud), WALKS.proud).pose;
  const reveal = 380;
  return (
    <PunchIn frame={frame} at={at(2.5)} strength={0.3} focus={{ x: 640, y: 930 }}>
      <Pan frame={frame} from={at(0.5)} to={at(1.8)} dx={reveal}>
        <Background
          spec={PLACE}
          width={W + reveal}
          height={H}
          frame={frame}
          fps={fps}
          cameraX={PUSH_SPEED * HEAD * t}
          endless
        />
        <Character
          x={880 - 3.1 * HEAD - stroll.rootX * HEAD}
          groundY={GROUND}
          head={HEAD}
          pose={stroll}
          face={face('smug')}
          turn={1}
          blink={blinkAt(frame, fps, SEED)}
          outfit={SOLDIER}
        />
        <Character
          x={880 - push.rootX * HEAD}
          groundY={GROUND}
          head={HEAD}
          pose={push}
          face={face('wailing')}
          turn={1}
          outfit={THIEF}
          prop={boulderProp}
          headEffects={<TearStreams turn={1} t={t} />}
        />
      </Pan>
    </PunchIn>
  );
}

export function ActionVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cut1 = Math.round(CUT_1 * fps);
  const cut2 = Math.round(CUT_2 * fps);
  return (
    <>
      {t < CUT_1 ? (
        <Chase t={t} frame={frame} fps={fps} />
      ) : t < CUT_2 ? (
        // A plain cut on the running: the same place, the same afternoon, the same chase.
        <Caught t={t - CUT_1} frame={frame - cut1} fps={fps} />
      ) : (
        <Work t={t - CUT_2} frame={frame - cut2} fps={fps} />
      )}
      {/* Time has passed before the last shot, so it gets a quick fade, not a plain cut. */}
      <Fade frame={frame} at={cut2} width={W} height={H} />
    </>
  );
}
