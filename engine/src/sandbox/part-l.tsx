import type { ReactNode } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../backgrounds/Background';
import { placeSpec } from '../backgrounds/places';
import { Fade } from '../camera/Camera';
import { Framed, focusBetween, focusOn, shoulderPlacement } from '../camera/Framing';
import type { Focus, Shot } from '../camera/Framing';
import { HeadSymbol } from '../effects/Symbol';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Label, TitleCard } from '../overlays/Titles';
import { Book } from '../props/Book';
import { Chair } from '../props/Chair';
import { COIN_RADIUS, Coin } from '../props/Coin';
import { CUP_REST, Cup } from '../props/Cup';
import { Door } from '../props/Door';
import { InHand, Placed } from '../props/Hold';
import { LANTERN_DROP, Lantern } from '../props/Lantern';
import { TABLE, Table } from '../props/Table';
import { cheerAt } from '../rig/actions';
import { chainAt } from '../rig/chain';
import type { Link } from '../rig/chain';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { ELBOW_DOWN } from '../rig/ik';
import { blinkAt, gazeAt, withLife } from '../rig/life';
import { clamp, smoothstep, vec } from '../rig/math';
import { resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { sit, stand } from '../rig/poses';
import { WALKS, walkAt } from '../rig/walk';
import { outfitFrom } from '../wardrobe/garments';
import type { Identity } from '../wardrobe/types';

/**
 * The Phase 2E test scene, "The Golden Coin": two places, the props, the four shot sizes, a
 * title card and a label, in one small story that makes sense (playbook, L-0013).
 * Scene 1, a street by day: a girl walking home spots a coin on the road and picks it up.
 * Scene 2, home that evening: she comes in at the door and shows it to her grandmother.
 * Each scene is laid out once, wide; the closer shots are the same layout with the camera
 * moved in. The place changes once, with a quick fade and a label for the time.
 */

const W = 1080;
const H = 1920;
const SIZE = { width: W, height: H };
const SEED = 3105;
const HEAD = 200;
const KID_HEAD = HEAD * 0.86;

const SCENE_2 = 5.8;
export const STORY_SECONDS = 14;

const HOME = outfitFrom({
  onePiece: { kind: 'dress', cloth: 'cream' },
  shoes: { kind: 'boots', cloth: 'brown' },
});
const KID_CLOTHES = outfitFrom({
  top: { kind: 'shirt', cloth: 'orange', sleeves: 'short' },
  bottom: { kind: 'trousers', cloth: 'denim' },
  shoes: { kind: 'sneakers', cloth: 'white' },
});
const GRAN: Identity = { skinTone: 2, hair: 'bun', hairColor: 'gray' };
const KID: Identity = { skinTone: 3, hair: 'ponytail', hairColor: 'dark-brown' };

const READ: Pose = {
  ...sit,
  id: 'read',
  headTilt: 4,
  arms: {
    front: { reach: vec(0.6, 0.42), bend: ELBOW_DOWN },
    back: { reach: vec(0.5, 0.46), bend: ELBOW_DOWN },
  },
};
const SHOW: Pose = {
  ...stand,
  id: 'show',
  headTilt: -4,
  arms: { front: { upper: 112, lower: 30 }, back: { upper: -12, lower: 8 } },
};

const face = (name: ExpressionName) => EXPRESSIONS[name];
const standing = resolvePose(stand);
const showing = resolvePose(SHOW);
const reading = resolvePose(READ);
const skip = (s: number) => walkAt(s, WALKS.happy).pose;

type Prop = NonNullable<CharacterProps['prop']>;
const showsCoin: Prop = (hands, info) => (
  <InHand frame={hands.front} how="upright" reach={0.24}>
    <Coin uid={`${info.uid}-coin`} shadowSide={info.shadowSide} />
  </InHand>
);
const reads: Prop = (hands, info) => (
  <g transform={`translate(${hands.front.center.x + 0.1} ${hands.front.center.y - 0.3})`}>
    <g transform="scale(0.8)">
      <Book uid={`${info.uid}-book`} shadowSide={info.shadowSide} open />
    </g>
  </g>
);

type SceneProps = { t: number; frame: number; fps: number };

// ---------------------------------------------------------------------------------------------
// Scene 1: the street

const STREET_GROUND = 0.7 * H + 60;
const STOPS = 2.4;
const SPOTS = 2.6;
const PICKED_UP = 3.6;
const KID_STOPS_AT = 500;
const COIN_AT = 690;
const KID_WALKS: Link[] = [
  { from: 0, at: skip },
  { from: STOPS, at: () => standing },
];
const KID_STARTS_AT = KID_STOPS_AT - chainAt(STOPS, KID_WALKS).rootX * KID_HEAD;

function Street({ t, frame, fps }: SceneProps) {
  const picked = t >= PICKED_UP;
  const kidAt = {
    x: picked ? KID_STOPS_AT : KID_STARTS_AT,
    groundY: STREET_GROUND,
    head: KID_HEAD,
  };
  const pose = picked
    ? withLife(showing, frame, fps, SEED)
    : t > STOPS + 0.15
      ? withLife(chainAt(t, KID_WALKS), frame, fps, SEED)
      : chainAt(t, KID_WALKS);
  // The camera cuts in on her as she holds the coin up: the same street, closer.
  const shot: Shot = picked ? 'medium' : 'wide';
  const focus: Focus = focusOn({ ...kidAt, x: KID_STOPS_AT }, picked ? showing : standing);
  // Where the coin lies, in her own head units, so her eyes can go to it.
  const coinOnRoad = vec((COIN_AT - kidAt.x) / KID_HEAD, -0.1);
  return (
    <Framed shot={shot} focus={focus} {...SIZE}>
      <Background spec={placeSpec('day-street', SEED)} {...SIZE} frame={frame} fps={fps} />
      {!picked && (
        <Placed x={COIN_AT} y={STREET_GROUND - COIN_RADIUS * KID_HEAD * 0.5} head={KID_HEAD}>
          <g transform="scale(1 0.45)">
            <Coin uid="road-coin" shadowSide={1} />
          </g>
        </Placed>
      )}
      <Character
        {...kidAt}
        pose={pose}
        face={face(
          picked
            ? t > PICKED_UP + 0.9
              ? 'laughing'
              : 'happy'
            : t >= SPOTS
              ? 'surprised'
              : 'happy',
        )}
        turn={picked ? 0.5 : 1}
        blink={blinkAt(frame, fps, SEED)}
        age="child"
        identity={KID}
        outfit={KID_CLOTHES}
        {...(picked ? { prop: showsCoin } : {})}
        {...(t >= SPOTS && !picked ? { lookAt: coinOnRoad } : {})}
        headEffects={t >= SPOTS && t < SPOTS + 0.8 ? <HeadSymbol kind="!" t={t - SPOTS} /> : null}
      />
    </Framed>
  );
}

// ---------------------------------------------------------------------------------------------
// Scene 2: home, that evening

const FLOOR = 1430;
const gran = { x: 230, groundY: FLOOR, head: HEAD, facing: 'right' as const };
const TABLE_AT = gran.x + 1.5 * HEAD;
const DOOR_AT = 1000;
const KID_HOME_AT = 760;
const DOOR_OPENS = 0.7;
const KID_ENTERS = 1.1;
const KID_ARRIVES = KID_ENTERS + (DOOR_AT - KID_HOME_AT) / (skip(1).rootX * KID_HEAD);
const OVER_SHOULDER = 2.6;
const GRAN_CLOSE = 4.6;
const TOGETHER = 6.4;
/** She faces left as she comes in, so her own "forward" is toward the room. */
const KID_COMES_IN: Link[] = [
  { from: 0, at: skip },
  { from: KID_ARRIVES - KID_ENTERS, at: () => showing },
  { from: TOGETHER - KID_ENTERS, at: cheerAt },
];

function Home({ t, frame, fps }: SceneProps) {
  const shot: Shot =
    t < OVER_SHOULDER
      ? 'wide'
      : t < GRAN_CLOSE
        ? 'over-shoulder'
        : t < TOGETHER
          ? 'close-up'
          : 'wide';
  const kidPose = chainAt(Math.max(0, t - KID_ENTERS), KID_COMES_IN);
  const kidAt = { x: DOOR_AT, groundY: FLOOR, head: KID_HEAD, facing: 'left' as const };
  const kidHere = { ...kidAt, x: KID_HOME_AT };
  const kidFocus = focusOn(kidHere, showing);
  const granFocus = focusOn(gran, reading);
  const focus =
    shot === 'over-shoulder'
      ? kidFocus
      : shot === 'close-up'
        ? granFocus
        : focusBetween(granFocus, kidFocus);
  const granFace: ExpressionName =
    t < KID_ENTERS + 0.3
      ? 'neutral'
      : t < GRAN_CLOSE + 0.7
        ? 'surprised'
        : t < TOGETHER
          ? 'happy'
          : 'laughing';
  const kidLocal = vec((kidHere.x - gran.x) / HEAD, -2.6);
  const scene: ReactNode = (
    <>
      <Background spec={placeSpec('home-interior', SEED)} {...SIZE} frame={frame} fps={fps} />
      <Placed x={DOOR_AT} y={FLOOR} head={HEAD}>
        <Door uid="home-door" shadowSide={1} open={0.9 * smoothstep((t - DOOR_OPENS) / 0.45)} />
      </Placed>
      <Placed x={gran.x} y={FLOOR} head={HEAD}>
        <Chair uid="home-chair" shadowSide={1} />
      </Placed>
      <Character
        {...gran}
        pose={withLife(reading, frame, fps, SEED + 2)}
        face={face(granFace)}
        turn={0.5}
        blink={blinkAt(frame, fps, SEED + 2)}
        gaze={gazeAt(frame, fps, SEED + 2)}
        age="elder"
        identity={GRAN}
        outfit={HOME}
        prop={reads}
        {...(t >= KID_ENTERS + 0.3 ? { lookAt: kidLocal } : {})}
      />
      <Placed x={TABLE_AT} y={FLOOR} head={HEAD}>
        <Table uid="home-table" shadowSide={1} width={1.5} />
        <g transform={`translate(0.3 ${-TABLE.top - CUP_REST.mug})`}>
          <Cup uid="home-cup" shadowSide={1} />
        </g>
        <g transform={`translate(-0.3 ${-TABLE.top - LANTERN_DROP})`}>
          <Lantern uid="home-lamp" shadowSide={1} t={t} />
        </g>
      </Placed>
      {t >= KID_ENTERS - 0.05 && (
        <Character
          {...kidAt}
          pose={kidPose}
          face={face(t >= TOGETHER ? 'laughing' : 'happy')}
          turn={t < KID_ARRIVES ? 1 : 0.5}
          blink={blinkAt(frame, fps, SEED)}
          age="child"
          identity={KID}
          outfit={KID_CLOTHES}
          {...(t >= KID_ARRIVES ? { prop: showsCoin } : {})}
        />
      )}
    </>
  );
  return (
    <>
      <Framed shot={shot} focus={focus} {...SIZE}>
        {scene}
      </Framed>
      {/* Over the grandmother's shoulder: she is the near one, seen from behind. */}
      {shot === 'over-shoulder' && (
        <Character
          {...shoulderPlacement(SIZE, 'left')}
          pose={standing}
          face={face('neutral')}
          turn={0.5}
          age="elder"
          identity={GRAN}
          outfit={HOME}
          back
        />
      )}
      {t < 2.3 && <Label text="That evening" {...SIZE} frame={frame - Math.round(0.25 * fps)} />}
    </>
  );
}

export function StoryVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cut = Math.round(SCENE_2 * fps);
  const titleFrom = Math.round(0.3 * fps);
  const titleGone = clamp((t - 2.0) / 0.2, 0, 1);
  return (
    <>
      {t < SCENE_2 ? (
        <Street t={t} frame={frame} fps={fps} />
      ) : (
        <Home t={t - SCENE_2} frame={frame - cut} fps={fps} />
      )}
      {t < 2.2 && (
        <g opacity={1 - titleGone}>
          <TitleCard
            title="The Golden Coin"
            subtitle="A test scene"
            {...SIZE}
            frame={frame - titleFrom}
            y={0.2}
          />
        </g>
      )}
      {/* The place and the time change here, so a quick fade, not a plain cut. */}
      <Fade frame={frame} at={cut} {...SIZE} />
    </>
  );
}

/** Title cards and labels over a place, to judge their size, their fit and their look. */
export function TitlesSheet() {
  const cw = W / 2;
  const ch = H / 2;
  const cells: Array<{ place: Parameters<typeof placeSpec>[0]; over: ReactNode }> = [
    { place: 'day-street', over: <TitleCard title="The Golden Coin" {...SIZE} /> },
    {
      place: 'castle',
      over: (
        <TitleCard
          title="The King Who Taxed the Moon"
          subtitle="A folktale"
          paint="denim"
          {...SIZE}
        />
      ),
    },
    {
      place: 'home-interior',
      over: (
        <>
          <Label text="That evening" {...SIZE} />
          <Label text="Grandmother" at="top-right" paint="gold" {...SIZE} />
        </>
      ),
    },
    { place: 'night-street', over: <Label text="Three days later" at="top" {...SIZE} /> },
  ];
  return (
    <>
      {cells.map((cell, i) => (
        <svg
          key={i}
          x={cw * (i % 2) + 4}
          y={ch * Math.floor(i / 2) + 4}
          width={cw - 8}
          height={ch - 8}
          viewBox={`0 0 ${W} ${H}`}
        >
          <Background spec={placeSpec(cell.place, SEED)} {...SIZE} frame={0} fps={30} />
          {cell.over}
        </svg>
      ))}
    </>
  );
}
