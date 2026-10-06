import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Background, backgroundSpec } from '../backgrounds/Background';
import { Pan, PunchIn, Shake } from '../camera/Camera';
import { AngerMark } from '../effects/AngerMark';
import { DizzyStars } from '../effects/Dizzy';
import { Impact } from '../effects/Impact';
import { MotionLines } from '../effects/MotionLines';
import { FlyingSweat } from '../effects/Sweat';
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
import { FALL, JUMP, PUNCH, fallAt, jumpAt, punchAt, recoilAt } from '../rig/moves';
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
 * camera moves together. A hooded thief is spotted, chased and caught by a guard.
 * Shot 1, the chase: sneak, run, jump, motion lines, a symbol, a following camera.
 * Shot 2, the fight: punch, impact flash, shake, recoil, a turn, a trip, dizzy stars, a cheer.
 * Shot 3, the punishment: push, a proud walk, tears, a pan and a fast push-in.
 * No sound. The crate and the boulder are test stand-ins until the props are drawn in 2E.
 */

const W = 1080;
const H = 1920;
const HEAD = 180;
const GROUND = 1340;
const SEED = 2604;

/** Where the cuts fall, in seconds. */
const CUT_1 = 4;
const CUT_2 = 9.4;
export const ACTION_SECONDS = 13.5;

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
];
const TAKEOFF_X = chainAt(THIEF_LEAP + PLANT, THIEF_CHASE).rootX;
const CRATE_X = TAKEOFF_X + 1.2;
/** The guard runs flat out the whole shot, 2.4 heads behind the thief when the thief bolts. */
const GUARD_START = chainAt(BOLT, THIEF_CHASE).rootX - 2.4 - RUN_SPEED * BOLT;
const GUARD_LEAP = (TAKEOFF_X - GUARD_START) / RUN_SPEED - PLANT;
const GUARD_CHASE: Link[] = [
  { from: 0, at: run },
  { from: GUARD_LEAP, at: leap },
];

function Chase({ t, frame, fps }: ShotProps) {
  const thief = chainAt(t, THIEF_CHASE);
  const guard = chainAt(t, GUARD_CHASE);
  // The camera rides with the thief.
  const cam = thief.rootX;
  const sx = (world: number) => 590 + (world - cam) * HEAD;
  const thiefAt = { x: sx(0), groundY: GROUND, head: HEAD };
  const guardAt = { x: sx(GUARD_START), groundY: GROUND, head: HEAD };
  const running = t > BOLT + 0.15 && t < THIEF_LEAP;
  const thiefBack = toScreen(computeSkeleton(thief).neck, thiefAt);
  const guardBack = toScreen(computeSkeleton(guard).neck, guardAt);
  return (
    <>
      <Background
        spec={backgroundSpec('simple', 'clear-day', SEED, {
          horizon: 0.68,
          silhouettes: [
            { kind: 'tree', x: 0.7, size: 0.3, layer: 'mid' },
            { kind: 'bush', x: 0.1, size: 0.12, layer: 'mid' },
          ],
          tufts: 9,
        })}
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
// Shot 2: the fight

const THIEF_STANDS = 2.25;
const PUNCH_AT = 0.9;
const HIT = PUNCH_AT + PUNCH.hit;
const FLEE = 2;
const FLEE_RUN = 0.5;
const TRIP = FLEE + 0.3 + FLEE_RUN;
const LANDS = TRIP + FALL.ground;
const GUARD_RUNS = 3;
const GUARD_RUN_TIME = 4.1 / RUN_SPEED;
const VICTORY = GUARD_RUNS + GUARD_RUN_TIME;

const GUARD_FIGHT: Link[] = [
  { from: 0, at: still },
  { from: PUNCH_AT, at: punchAt },
  { from: PUNCH_AT + PUNCH.end, at: still },
  { from: GUARD_RUNS, at: run },
  { from: VICTORY, at: cheerAt },
];
/** The thief faces left until he turns to run, so he has one chain for each way he faces. */
const THIEF_CAUGHT: Link[] = [
  { from: 0, at: () => resolvePose(handsUp) },
  { from: HIT, at: recoilAt },
];
const THIEF_FLEES: Link[] = [
  { from: 0, at: still },
  { from: 0.3, at: run },
  { from: 0.3 + FLEE_RUN, at: fallAt },
];
/** Where the thief stands after the stagger: the place he turns and runs from. */
const THIEF_STAGGERED = THIEF_STANDS - chainAt(FLEE, THIEF_CAUGHT).rootX;

function Fight({ t, frame, fps }: ShotProps) {
  const at = (seconds: number) => Math.round(seconds * fps);
  // The camera holds for the fight, then follows the thief as he runs and falls.
  const camera = 4.9 * HEAD * smoothstep((t - (FLEE + 0.25)) / 1);
  const sx = (world: number) => 310 + world * HEAD - camera;

  const guardPose = t < PUNCH_AT ? withLife(standing, frame, fps, SEED) : chainAt(t, GUARD_FIGHT);
  const guardTurn = turnAt(frame, [
    { frame: 0, facing: 'right', turn: 0.8 },
    { frame: at(GUARD_RUNS), facing: 'right', turn: 1 },
    { frame: at(VICTORY), facing: 'right', turn: 0.35 },
  ]);
  const guardAt = { x: sx(0), groundY: GROUND, head: HEAD };
  const punching = t >= PUNCH_AT && t < PUNCH_AT + PUNCH.end;
  const fist = toScreen(computeSkeleton(punchAt(PUNCH.hit)).arms.front.hand, guardAt);

  const thiefTurn = turnAt(frame, [
    { frame: 0, facing: 'left', turn: 0.8 },
    { frame: at(FLEE), facing: 'right', turn: 1 },
  ]);
  const fleeing = thiefTurn.facing === 'right';
  const thiefPoseAt = (seconds: number) =>
    fleeing ? chainAt(seconds - FLEE, THIEF_FLEES) : chainAt(seconds, THIEF_CAUGHT);
  const thiefPose = t < HIT ? withLife(thiefPoseAt(t), frame, fps, SEED + 1) : thiefPoseAt(t);
  const thiefAt = {
    x: sx(fleeing ? THIEF_STAGGERED : THIEF_STANDS),
    groundY: GROUND,
    head: HEAD,
    facing: thiefTurn.facing,
  };
  const thiefFace: ExpressionName =
    t < HIT
      ? 'afraid'
      : t < HIT + 0.5
        ? 'wailing'
        : t < TRIP
          ? 'afraid'
          : t < LANDS
            ? 'surprised'
            : 'exhausted';
  const thiefHead = toScreen(computeSkeleton(thiefPose).head, thiefAt);
  const sinceHit = t - HIT;
  return (
    <Shake frame={frame} fps={fps} at={[at(HIT), at(LANDS)]} width={W} height={H} seed={SEED}>
      <Background
        spec={backgroundSpec('simple', 'dusk-violet', SEED, { horizon: 0.68, tufts: 8 })}
        width={W}
        height={H}
        frame={frame}
        fps={fps}
        cameraX={camera}
      />
      <Character
        {...guardAt}
        pose={guardPose}
        face={face(t >= VICTORY ? 'laughing' : punching ? 'shouting' : 'angry')}
        turn={guardTurn.turn}
        blink={blinkAt(frame, fps, SEED)}
        outfit={SOLDIER}
        headEffects={t < GUARD_RUNS ? <AngerMark t={t} /> : null}
      />
      <Character
        {...thiefAt}
        pose={thiefPose}
        face={face(thiefFace)}
        turn={thiefTurn.turn}
        blink={t < HIT ? blinkAt(frame, fps, SEED + 1) : 0}
        outfit={THIEF}
        squash={sinceHit >= 0 && sinceHit < 0.13 ? 0.08 * (1 - sinceHit / 0.13) : 0}
        sway={swayOf((f) => thiefPoseAt(f / fps), frame, fps)}
        headEffects={
          <>
            {t < TRIP && <FlyingSweat t={t} seed={SEED} />}
            {t >= LANDS + 0.1 && <DizzyStars t={t - LANDS} />}
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
        x={thiefHead.x - 0.2 * HEAD}
        y={GROUND - 0.25 * HEAD}
        head={HEAD}
        t={t - LANDS}
        size={0.8}
        seed={8}
      />
    </Shake>
  );
}

// ---------------------------------------------------------------------------------------------
// Shot 3: the punishment

const PUSH_SPEED = walkSpeed(GAITS.push);

function Work({ t, frame, fps }: ShotProps) {
  const at = (seconds: number) => Math.round(seconds * fps);
  const push = walkAt(t, GAITS.push).pose;
  // The guard strolls behind at the thief's pace.
  const stroll = walkAt((t * PUSH_SPEED) / walkSpeed(WALKS.proud), WALKS.proud).pose;
  const reveal = 380;
  return (
    <PunchIn frame={frame} at={at(2.5)} strength={0.3} focus={{ x: 640, y: 930 }}>
      <Pan frame={frame} from={at(0.4)} to={at(1.7)} dx={reveal}>
        <Background
          spec={backgroundSpec('simple', 'clear-day', SEED + 3, {
            horizon: 0.68,
            silhouettes: [{ kind: 'buildings', x: 0.2, size: 0.22, layer: 'mid' }],
            tufts: 10,
          })}
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
  if (t < CUT_1) return <Chase t={t} frame={frame} fps={fps} />;
  if (t < CUT_2) {
    return <Fight t={t - CUT_1} frame={frame - Math.round(CUT_1 * fps)} fps={fps} />;
  }
  return <Work t={t - CUT_2} frame={frame - Math.round(CUT_2 * fps)} fps={fps} />;
}
