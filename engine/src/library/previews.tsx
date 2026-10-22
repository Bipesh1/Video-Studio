import type { ReactNode } from 'react';
import {
  Background,
  SILHOUETTE_KINDS,
  TREATMENTS,
  backgroundSpec,
} from '../backgrounds/Background';
import type { BackgroundSpec } from '../backgrounds/Background';
import { PLACES, placeSpec } from '../backgrounds/places';
import type { PlaceName } from '../backgrounds/places';
import { AngerMark } from '../effects/AngerMark';
import { Explosion, Fire, SMOKE_LEVELS, Smoke, SmokeBank } from '../effects/Blast';
import { Crumbs, Erased } from '../effects/Erase';
import { DollarEyes, ShockLines } from '../effects/Reaction';
import { Paper, PencilLine, circlePath } from '../effects/Pencil';
import { DizzyStars } from '../effects/Dizzy';
import { IMPACT_SECONDS, Impact } from '../effects/Impact';
import { MotionLines } from '../effects/MotionLines';
import { FlyingSweat, RestingSweat } from '../effects/Sweat';
import { HeadSymbol } from '../effects/Symbol';
import { TearDrops, TearStreams } from '../effects/Tears';
import { EXPRESSIONS, EXPRESSION_NAMES } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { MOUTH_FORMS } from '../face/talk';
import { CoinRain } from '../effects/CoinRain';
import { Banknote, CashJar, GavelHand, PADDLE_MARKS, Paddle, Podium } from '../props/Auction';
import { Bag } from '../props/Bag';
import { Bill, Bills, Bread, Coal, CoinStack, Envelope, FuelCan } from '../props/Bill';
import { Book } from '../props/Book';
import { Chair } from '../props/Chair';
import { BackRow } from '../props/Crowd';
import { WristChains } from '../props/Chains';
import { Crate } from '../props/Crate';
import { Coin } from '../props/Coin';
import { Cup } from '../props/Cup';
import { Car } from '../props/Car';
import { NoticeBoard } from '../props/Daycare';
import { Door } from '../props/Door';
import { CashPile, GameTable, GoldenBall } from '../props/Game';
import { InHand, Placed } from '../props/Hold';
import { ChatBubbles, Phone, WallClock } from '../props/Home';
import {
  DiningTable,
  LobsterPlate,
  LongBill,
  Menu,
  SaladPlate,
  WaterGlass,
  WaterJug,
} from '../props/Dinner';
import { Lantern } from '../props/Lantern';
import { Torch } from '../props/Torch';
import { Rocket } from '../props/Rocket';
import { Bulb, Gloom } from '../props/Room';
import { Scepter } from '../props/Scepter';
import { Shield } from '../props/Shield';
import { Asteroid, BlackHole, Earth, FullMoon, Planet, Sun } from '../props/Sky';
import { Sword } from '../props/Sword';
import { Table } from '../props/Table';
import { RopeBarrier, Wagon } from '../props/Wagon';
import { RainCloud, Wind } from '../props/Weather';
import { ACTIONS } from '../rig/actions';
import { chainAt } from '../rig/chain';
import type { ActionName } from '../rig/actions';
import { body } from '../rig/body';
import { Character } from '../rig/Character';
import type { CharacterProps, HandFrame } from '../rig/Character';
import { swayOf } from '../rig/follow';
import { Hand } from '../rig/Hand';
import { vec } from '../rig/math';
import { JUMP, PUNCH, SWING } from '../rig/moves';
import { poseAt, resolvePose } from '../rig/pose';
import { POSES, SEATED_POSES, handsUp, holdObject, stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import { HAND_SHAPES } from '../rig/types';
import type { HandShape, ResolvedPose } from '../rig/types';
import { walkAt } from '../rig/walk';
import { boulderProp, clubProp, crateProp, ropeProp } from '../sandbox/fixtures';
import {
  DrawerCabinet,
  KitchenCounter,
  NotebookLying,
  NotebookOpen,
  Plate,
  SeasonWindow,
  SharesPlate,
  SplitLight,
} from '../props/Kitchen';
import { BreathCloud } from '../props/BreathCloud';
import { FoodBreathCloud, XrayFat } from '../props/FoodBreath';
import { BlackHoleGlow } from '../props/BlackHoleGlow';
import { Rod } from '../sandbox/Rod';
import { accent, ink, lineWeights, palette, pick, tokens } from '../tokens';
import { COSTUMES } from '../wardrobe/cast';
import { GARMENTS, outfitFrom } from '../wardrobe/garments';
import type { Clothes, Garment } from '../wardrobe/garments';
import { HAIR_STYLES } from '../wardrobe/hair';
import { AGES, FACIAL_HAIR } from '../wardrobe/types';
import type { Age, Identity, Outfit } from '../wardrobe/types';

/**
 * One small picture of every library asset, drawn into a square of PREVIEW_SIZE. These make the
 * golden stills in knowledge/golden/assets/ and the catalog pages. A new asset is not in the
 * library until it has a preview here and an entry in library/index.json (the tests check both).
 */
export const PREVIEW_SIZE = 400;
const BOX = PREVIEW_SIZE;
const SEED = 4182;

/** turn: 0 front, 0.5 three-quarter, 1 profile. Omitted, each asset uses its own best view. */
export type PreviewOptions = { turn?: number };
export type Preview = (o: PreviewOptions) => ReactNode;

/** The flat fields previews sit on (Style 5.1: no outlines in a background). */
export const previewBase = (dark: boolean): string =>
  dark ? pick(palette('storm-slate'), 1) : pick(palette('cold-dawn'), 1);

const standPose = resolvePose(stand);
const standHead = computeSkeleton(standPose).head;

type Extra = Partial<CharacterProps>;

/** A head and shoulders, centered in the square. */
const headShot = (o: PreviewOptions, extra: Extra = {}, turn = 0.35, head = 250): ReactNode => (
  <Character
    x={BOX / 2 - standHead.x * head}
    groundY={BOX * 0.52 - standHead.y * head}
    head={head}
    pose={standPose}
    face={EXPRESSIONS.neutral}
    turn={o.turn ?? turn}
    {...extra}
  />
);

/** A smaller head set low in the square, leaving room for an effect above it. */
const effectShot = (o: PreviewOptions, extra: Extra, turn: number): ReactNode => (
  <Character
    x={BOX / 2 - standHead.x * 170}
    groundY={BOX * 0.64 - standHead.y * 170}
    head={170}
    pose={standPose}
    face={EXPRESSIONS.neutral}
    turn={o.turn ?? turn}
    {...extra}
  />
);

/** A whole figure standing on a ground line near the bottom of the square. */
const figure = (
  o: PreviewOptions,
  pose: ResolvedPose,
  extra: Extra = {},
  turn = 0,
  x = BOX / 2,
  head = 88,
): ReactNode => (
  <Character
    x={x - pose.rootX * head}
    groundY={362}
    head={head}
    pose={pose}
    face={EXPRESSIONS.neutral}
    turn={o.turn ?? turn}
    {...extra}
  />
);

const POSE_HEAD = 88;

/** The view each pose reads best in, and where it sits in the square. */
const POSE_VIEWS: Record<string, { turn?: number; dx?: number; face?: ExpressionName }> = {
  'hold-object': { turn: 0.5, dx: -30 },
  point: { turn: 0.5, dx: -30 },
  sit: { turn: 0.5, dx: 10 },
  kneel: { turn: 0.5, dx: -10, face: 'sad' },
  lie: { turn: 0, dx: -40, face: 'exhausted' },
  'cross-arms': { turn: 0, face: 'determined' },
  'look-up': { turn: 0.5, face: 'surprised' },
  'look-down': { turn: 0.5, face: 'sad' },
  cower: { turn: 0.5, face: 'afraid' },
  hug: { turn: 0.5, dx: -30, face: 'happy' },
  'folded-upside-down': { turn: 0.5, dx: -75, face: 'afraid' },
  'sit-reach': { turn: 0.5, dx: -40, face: 'thinking' },
  'sit-promise': { turn: 0.5, dx: 10, face: 'happy' },
  'sit-hands-up': { turn: 0.5, dx: 10, face: 'surprised' },
  'sit-slump': { turn: 0.5, dx: 0, face: 'sad' },
  'sit-phone': { turn: 0.5, dx: -10, face: 'determined' },
  'open-arms': { turn: 0, face: 'happy' },
  'hand-on-heart': { turn: 0.35, face: 'happy' },
  'rub-hands': { turn: 0.5, dx: -25, face: 'smug' },
  'head-tilt': { turn: 0.35, face: 'thinking' },
  'fix-tie': { turn: 0.35, face: 'smug' },
  'hold-cup': { turn: 0.35, face: 'neutral' },
  sip: { turn: 0.35, face: 'neutral' },
};

/** A moment of each action that shows what it is. */
const ACTION_VIEWS: Record<
  ActionName,
  {
    time: number;
    turn: number;
    face: ExpressionName;
    head?: number;
    dx?: number;
    prop?: CharacterProps['prop'];
  }
> = {
  float: { time: 0.9, turn: 0.4, face: 'surprised' },
  walk: { time: 0.3, turn: 1, face: 'neutral' },
  'walk-proud': { time: 0.36, turn: 1, face: 'smug' },
  'walk-tired': { time: 0.5, turn: 1, face: 'exhausted' },
  'walk-sneaky': { time: 0.4, turn: 1, face: 'determined' },
  'walk-happy': { time: 0.26, turn: 1, face: 'happy' },
  cheer: { time: 0.12, turn: 0, face: 'laughing' },
  cry: { time: 0.1, turn: 0.5, face: 'wailing' },
  run: { time: 0.27, turn: 1, face: 'determined' },
  carry: { time: 0.3, turn: 1, face: 'exhausted', dx: -20, prop: crateProp },
  push: { time: 0.3, turn: 1, face: 'determined', dx: -70, head: 80, prop: boulderProp },
  pull: { time: 0.3, turn: 1, face: 'determined', dx: -30, prop: ropeProp },
  jump: { time: (JUMP.takeoff + JUMP.land) / 2, turn: 1, face: 'determined', head: 72 },
  fall: { time: 0.42, turn: 1, face: 'surprised', dx: 20, head: 80 },
  'fall-back': { time: 0.42, turn: 1, face: 'surprised', dx: 30, head: 80 },
  punch: { time: PUNCH.hit, turn: 1, face: 'angry', dx: -30 },
  swing: { time: SWING.windup, turn: 1, face: 'angry', head: 76, prop: clubProp },
  recoil: { time: 0.1, turn: 1, face: 'afraid', dx: 20 },
};

/** A plain block to sit on: a stand-in for a chair, throne or rock. */
const Seat = ({ x, head }: { x: number; head: number }) => (
  <rect
    x={x - 0.62 * head}
    y={362 - body.shin * head + 5}
    width={0.74 * head}
    height={body.shin * head - 5}
    rx={5}
    fill={pick(palette('cold-dawn'), 0)}
  />
);

const rodProp: CharacterProps['prop'] = (hands) =>
  hands.front.hand.shape === 'grip' ? <Rod frame={hands.front} /> : null;
const scepterProp: CharacterProps['prop'] = (hands, info) =>
  hands.front.hand.shape === 'grip' ? (
    <Scepter frame={hands.front} uid={info.uid} shadowSide={info.shadowSide} sway={info.sway} />
  ) : null;

const identity = (o: Partial<Identity>): Identity => ({
  skinTone: 3,
  hair: 'short-crop',
  hairColor: 'dark-brown',
  wrap: 'gold',
  ...o,
});

/** Each tier 1 garment on its own, with a plain white top where a bottom alone would look odd. */
const GARMENT_LOOKS: Record<Garment, Clothes> = {
  'tank-top': { top: { kind: 'tank-top', cloth: 'white' } },
  shirt: { top: { kind: 'shirt', cloth: 'forest' } },
  trousers: { bottom: { kind: 'trousers', cloth: 'denim' } },
  skirt: { top: { kind: 'tank-top', cloth: 'white' }, bottom: { kind: 'skirt', cloth: 'denim' } },
  dress: { onePiece: { kind: 'dress', cloth: 'crimson' } },
  robe: { onePiece: { kind: 'robe', cloth: 'steel' } },
  cloak: { top: { kind: 'shirt', cloth: 'white' }, cloak: { cloth: 'crimson' } },
  hood: { onePiece: { kind: 'robe', cloth: 'denim' }, cloak: { cloth: 'forest', hood: true } },
  'brim-hat': { hat: { kind: 'brim-hat', cloth: 'gold' } },
  'top-hat': {
    hat: { kind: 'top-hat', cloth: 'steel' },
    top: { kind: 'jacket', cloth: 'steel', under: 'cream' },
    bottom: { kind: 'trousers', cloth: 'brown' },
  },
  cap: { hat: { kind: 'cap', cloth: 'forest' } },
  beanie: { hat: { kind: 'beanie', cloth: 'orange' } },
  tie: { tie: { cloth: 'crimson', stripe: 'gold' } },
  scarf: { scarf: { cloth: 'glint' } },
  sneakers: { shoes: { kind: 'sneakers', cloth: 'white' } },
  boots: { shoes: { kind: 'boots', cloth: 'steel' } },
  't-shirt': {
    top: { kind: 't-shirt', cloth: 'orange' },
    bottom: { kind: 'trousers', cloth: 'denim' },
  },
  hoodie: { top: { kind: 'hoodie', cloth: 'ocean' }, bottom: { kind: 'trousers', cloth: 'steel' } },
  jacket: {
    top: { kind: 'jacket', cloth: 'brown', under: 'cream' },
    bottom: { kind: 'trousers', cloth: 'denim' },
  },
  'lab-coat': {
    top: { kind: 'lab-coat', cloth: 'white', under: 'glint' },
    bottom: { kind: 'trousers', cloth: 'denim' },
  },
  glasses: { glasses: true },
};

/** The same person at three ages, so only the age cue differs. */
const AGE_LOOKS: Record<Age, { identity: Identity; size: number }> = {
  child: { identity: identity({ hair: 'ponytail' }), size: 0.86 },
  adult: { identity: identity({}), size: 1 },
  elder: { identity: identity({ hairColor: 'gray', facialHair: 'beard' }), size: 1 },
};
const EVERYDAY: Outfit = outfitFrom({
  top: { kind: 'shirt', cloth: 'forest', sleeves: 'short' },
  bottom: { kind: 'trousers', cloth: 'denim' },
  shoes: { kind: 'boots', cloth: 'steel' },
});

const scene = (spec: BackgroundSpec): ReactNode => (
  <Background spec={spec} width={BOX} height={BOX} frame={0} fps={tokens.motion.fps} />
);

/** A background with nothing in it, so one element can be shown alone. */
const bare = {
  moon: null,
  stars: 0,
  clouds: 0,
  rays: false,
  hills: false,
  silhouettes: [],
  tufts: 0,
} satisfies Partial<BackgroundSpec>;

const upright: HandFrame = {
  center: vec(0, 0),
  forearm: 90,
  hand: { shape: 'grip', thumb: 1, gripAxis: -90 },
};

/** The bare black hand beside the outlined glove, the two ways every hand shape is drawn. */
const hands = (shape: HandShape): ReactNode => (
  <>
    {(['bare', 'glove'] as const).map((style, i) => (
      <g
        key={style}
        transform={`translate(${(shape === 'point' ? 85 : 115) + i * 170} 205) scale(430)`}
      >
        {shape === 'grip' && <Rod frame={upright} length={0.8} />}
        <Hand
          shape={shape}
          style={style}
          thumb={1}
          transform={shape === 'mitten' ? 'rotate(0)' : 'rotate(-90)'}
        />
      </g>
    ))}
  </>
);

/** A color with its shadow tone, outlined like a prop (Style 4). */
const swatch = (name: string): ReactNode => {
  const [fill = ink, shadow = ink] = accent(name);
  const id = `lib-swatch-${name}`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={90} y={105} width={220} height={190} rx={34} />
        </clipPath>
      </defs>
      <rect x={90} y={105} width={220} height={190} rx={34} fill={fill} />
      <path d="M 90 295 L 310 150 L 310 295 Z" fill={shadow} clipPath={`url(#${id})`} />
      <rect
        x={90}
        y={105}
        width={220}
        height={190}
        rx={34}
        fill="none"
        stroke={ink}
        strokeWidth={lineWeights.outline * 250}
      />
    </g>
  );
};

const entries: Array<[string, Preview]> = [
  ['rig/character', (o) => figure(o, standPose)],

  ...POSES.map((p): [string, Preview] => [
    `pose/${p.id}`,
    (o) => {
      const view = POSE_VIEWS[p.id] ?? {};
      const extra: Extra = {
        ...(p === holdObject ? { prop: rodProp } : {}),
        ...(view.face ? { face: EXPRESSIONS[view.face] } : {}),
        // Seen as it is used: a dressed man in the crate, so the folded limbs read.
        ...(p.id === 'folded-upside-down'
          ? {
              identity: identity({ skinTone: 7, hair: 'short-crop', hairColor: 'black' }),
              outfit: EVERYDAY,
            }
          : {}),
      };
      return (
        <>
          {SEATED_POSES.includes(p.id) && <Seat x={BOX / 2 + (view.dx ?? 0)} head={POSE_HEAD} />}
          {p.id === 'folded-upside-down' && (
            <Placed x={BOX / 2} y={362} head={POSE_HEAD}>
              <Crate uid="lib-pose-crate" shadowSide={1} cutaway inverted />
            </Placed>
          )}
          {figure(o, resolvePose(p), extra, view.turn ?? 0, BOX / 2 + (view.dx ?? 0), POSE_HEAD)}
        </>
      );
    },
  ]),
  ...(Object.keys(ACTIONS) as ActionName[]).map((name): [string, Preview] => [
    `action/${name}`,
    (o) => {
      const view = ACTION_VIEWS[name];
      return figure(
        o,
        ACTIONS[name](view.time),
        { face: EXPRESSIONS[view.face], ...(view.prop ? { prop: view.prop } : {}) },
        view.turn,
        BOX / 2 + (view.dx ?? 0),
        view.head ?? POSE_HEAD,
      );
    },
  ]),
  // Seen from behind: the king, crown and cape.
  [
    'rig/back-view',
    (o) =>
      figure(
        o,
        standPose,
        { back: true, ...(COSTUMES.ruler ? { outfit: COSTUMES.ruler } : {}) },
        0.5,
      ),
  ],
  ['motion/life', (o) => headShot(o, { blink: 1 })],
  ['motion/talking-mouth', (o) => headShot(o, { talk: MOUTH_FORMS.open })],
  // Caught in the middle of the snap, after the wind-up: the arms are on their way up.
  [
    'motion/pose-moves',
    (o) =>
      figure(
        o,
        poseAt(6, [
          { frame: 0, pose: stand },
          { frame: 1, pose: handsUp },
        ]),
        { face: EXPRESSIONS.surprised },
        0.5,
      ),
  ],
  // The cape trails behind a walking body.
  [
    'motion/follow-through',
    (o) =>
      figure(
        o,
        walkAt(0.3).pose,
        {
          ...(COSTUMES.ruler ? { outfit: COSTUMES.ruler } : {}),
          sway: swayOf((f) => walkAt(f / 30).pose, 9, 30),
        },
        1,
      ),
  ],
  // The moment a sneak turns into a run: half way through the blend between the two.
  [
    'motion/chain',
    (o) =>
      figure(
        o,
        chainAt(0.05, [
          { from: -0.5, at: ACTIONS['walk-sneaky'] },
          { from: 0, at: ACTIONS.run },
        ]),
        { face: EXPRESSIONS.afraid },
        1,
      ),
  ],
  ['motion/eye-darts', (o) => headShot(o, { gaze: vec(0.35, 0.1) })],
  ['motion/head-turn', (o) => headShot(o, {}, 0.7)],

  ...EXPRESSION_NAMES.map((name): [string, Preview] => [
    `expression/${name}`,
    (o) => headShot(o, { face: EXPRESSIONS[name] }),
  ]),
  ['eyes/stern', (o) => headShot(o, { face: EXPRESSIONS.angry, eyeStyle: 'stern' })],

  ...HAND_SHAPES.map((shape): [string, Preview] => [`hand/${shape}`, () => hands(shape)]),

  ...tokens.skinTones.map((_, i): [string, Preview] => [
    `skin/tone-${i + 1}`,
    (o) => headShot(o, { identity: identity({ skinTone: i + 1, hair: 'bald' }) }),
  ]),
  ...HAIR_STYLES.map((hair): [string, Preview] => [
    `hair/${hair}`,
    (o) => headShot(o, { identity: identity({ hair }) }, 0.35, 190),
  ]),
  ...Object.keys(tokens.hair).map((hairColor): [string, Preview] => [
    `hair-color/${hairColor}`,
    (o) =>
      headShot(
        o,
        { identity: identity({ skinTone: 2, hair: 'straight-bob', hairColor }) },
        0.35,
        200,
      ),
  ]),
  ...FACIAL_HAIR.map((facialHair): [string, Preview] => [
    `facial-hair/${facialHair}`,
    (o) =>
      headShot(o, {
        identity: identity({ skinTone: 4, hair: 'short-crop', hairColor: 'black', facialHair }),
      }),
  ]),

  ...GARMENTS.map((g): [string, Preview] => [
    `clothing/${g}`,
    (o) =>
      g === 'glasses'
        ? headShot(o, { outfit: outfitFrom(GARMENT_LOOKS[g]) })
        : figure(o, standPose, { outfit: outfitFrom(GARMENT_LOOKS[g]) }, g === 'hood' ? 0.4 : 0),
  ]),
  ...Object.keys(COSTUMES).map((name): [string, Preview] => [
    `costume/${name}`,
    (o) =>
      name === 'ruler'
        ? figure(
            o,
            resolvePose(holdObject),
            { outfit: COSTUMES.ruler as Outfit, prop: scepterProp, face: EXPRESSIONS.determined },
            0.5,
            BOX / 2 - 45,
            80,
          )
        : figure(o, standPose, { outfit: COSTUMES[name] as Outfit }, 0.4, BOX / 2, 80),
  ]),
  ...AGES.map((age): [string, Preview] => [
    `age/${age}`,
    (o) =>
      figure(
        o,
        standPose,
        { age, identity: AGE_LOOKS[age].identity, outfit: EVERYDAY },
        0.5,
        BOX / 2,
        88 * AGE_LOOKS[age].size,
      ),
  ]),
  [
    'prop/scepter',
    () => (
      <g transform="translate(200 250) scale(205)">
        <Scepter frame={upright} uid="lib-scepter" shadowSide={1} />
      </g>
    ),
  ],
  // Each prop on its own, standing where the ground line of a figure would be.
  ...(
    [
      [
        'sword',
        150,
        250,
        (u) => <g transform="translate(-0.56 0)">{<Sword uid={u} shadowSide={1} />}</g>,
      ],
      ['shield', 250, 210, (u) => <Shield uid={u} shadowSide={1} />],
      ['coin', 430, 200, (u) => <Coin uid={u} shadowSide={1} />],
      ['bag', 330, 80, (u) => <Bag uid={u} shadowSide={1} />],
      ['book', 330, 200, (u) => <Book uid={u} shadowSide={1} />],
      ['book-open', 280, 200, (u) => <Book uid={u} shadowSide={1} open />],
      ['lantern', 250, 90, (u) => <Lantern uid={u} shadowSide={1} />],
      ['torch', 250, 260, (u) => <Torch uid={u} shadowSide={1} t={0.4} />],
      ['torch-low', 250, 260, (u) => <Torch uid={u} shadowSide={1} flame={0.62} t={0.4} />],
      ['torch-dying', 250, 260, (u) => <Torch uid={u} shadowSide={1} flame={0.34} t={0.4} />],
      ['torch-out', 250, 260, (u) => <Torch uid={u} shadowSide={1} flame={0} t={0.4} />],
      ['cup', 340, 200, (u) => <Cup uid={u} shadowSide={1} />],
      ['goblet', 340, 200, (u) => <Cup uid={u} shadowSide={1} kind="goblet" />],
      ['door', 80, 370, (u) => <Door uid={u} shadowSide={1} open={0.3} />],
      ['chair', 170, 350, (u) => <Chair uid={u} shadowSide={1} />],
      ['throne', 122, 362, (u) => <Chair uid={u} shadowSide={1} kind="throne" />],
      ['table', 150, 320, (u) => <Table uid={u} shadowSide={1} />],
      ['rocket', 104, 372, (u) => <Rocket uid={u} shadowSide={1} />],
      [
        'rocket-flying',
        80,
        262,
        (u) => (
          <g transform="rotate(32)">
            <Rocket uid={u} shadowSide={1} flame={1} t={0.3} />
          </g>
        ),
      ],
      ['sun', 78, 200, (u) => <Sun uid={u} shadowSide={1} t={0.6} />],
      ['full-moon', 130, 200, (u) => <FullMoon uid={u} shadowSide={1} />],
      ['earth', 96, 200, (u) => <Earth uid={u} shadowSide={1} t={3} />],
      ['planet', 120, 200, (u) => <Planet uid={u} shadowSide={1} />],
      [
        'planet-ringed',
        62,
        200,
        (u) => <Planet uid={u} shadowSide={1} paint="tan" bands ring="cream" />,
      ],
      ['planet-giant', 120, 200, (u) => <Planet uid={u} shadowSide={1} paint="brown" bands />],
      ['planet-ice', 120, 200, (u) => <Planet uid={u} shadowSide={1} paint="glint" />],
      [
        'asteroid',
        90,
        250,
        (u) => (
          <g transform="translate(-0.9 0.4)">
            <Asteroid uid={u} shadowSide={1} t={0.2} />
          </g>
        ),
      ],
      ['black-hole', 60, 200, (u) => <BlackHole uid={u} shadowSide={1} t={0.4} />],
      ['envelope', 150, 200, (u) => <Envelope uid={u} shadowSide={1} t={0.4} />],
      ['bill', 300, 200, (u) => <Bill uid={u} shadowSide={1} />],
      ['bills', 300, 250, (u) => <Bills uid={u} shadowSide={1} />],
      ['coin-stack', 220, 320, (u) => <CoinStack uid={u} shadowSide={1} coins={12} />],
      ['coin-tower', 86, 372, (u) => <CoinStack uid={u} shadowSide={1} coins={48} />],
      ['coal', 300, 290, (u) => <Coal uid={u} shadowSide={1} />],
      ['fuel-can', 280, 330, (u) => <FuelCan uid={u} shadowSide={1} />],
      ['bread', 300, 280, (u) => <Bread uid={u} shadowSide={1} />],
      ['wind', 120, 200, () => <Wind t={0.3} />],
      ['rain-cloud', 130, 190, (u) => <RainCloud uid={u} shadowSide={1} t={0.2} />],
      ['crate', 130, 340, (u) => <Crate uid={u} shadowSide={1} />],
      ['crate-upside-down', 130, 340, (u) => <Crate uid={u} shadowSide={1} inverted />],
      ['crate-cutaway', 130, 340, (u) => <Crate uid={u} shadowSide={1} cutaway />],
      ['wagon', 96, 300, (u) => <Wagon uid={u} shadowSide={1} />],
      ['rope-barrier', 110, 300, (u) => <RopeBarrier uid={u} shadowSide={1} />],
      ['golden-ball', 520, 310, (u) => <GoldenBall uid={u} shadowSide={1} />],
      ['ball-split', 400, 330, (u) => <GoldenBall uid={u} shadowSide={1} word="split" />],
      ['ball-steal', 400, 330, (u) => <GoldenBall uid={u} shadowSide={1} word="steal" />],
      [
        'ball-split-opening',
        400,
        330,
        (u) => <GoldenBall uid={u} shadowSide={1} word="split" open={0.55} />,
      ],
      [
        'ball-steal-opening',
        400,
        330,
        (u) => <GoldenBall uid={u} shadowSide={1} word="steal" open={0.55} />,
      ],
      ['cash-pile', 260, 310, (u) => <CashPile uid={u} shadowSide={1} />],
      ['cash-half', 260, 310, (u) => <CashPile uid={u} shadowSide={1} columns={1} />],
      ['game-table', 110, 290, (u) => <GameTable uid={u} shadowSide={1} />],
      ['podium', 150, 330, (u) => <Podium uid={u} shadowSide={1} />],
      ['iron-chair', 170, 350, (u) => <Chair uid={u} shadowSide={1} made="iron" />],
      ['iron-table', 150, 320, (u) => <Table uid={u} shadowSide={1} made="iron" />],
      ['bulb', 150, 230, (u) => <Bulb uid={u} shadowSide={1} cord={3} />],
      ['bulb-flicker', 150, 230, (u) => <Bulb uid={u} shadowSide={1} cord={3} on={0.55} />],
      ['bulb-dim', 150, 230, (u) => <Bulb uid={u} shadowSide={1} cord={3} on={0.15} />],
      [
        'gloom',
        150,
        230,
        (u) => (
          <>
            <Bulb uid={u} shadowSide={1} cord={3} on={0.15} />
            <Gloom />
          </>
        ),
      ],
      [
        'gloom-flicker',
        150,
        230,
        (u) => (
          <>
            <Bulb uid={u} shadowSide={1} cord={3} on={0.55} />
            <Gloom depth={0.22} />
          </>
        ),
      ],
      ['back-row', 96, 420, (u) => <BackRow uid={u} shadowSide={1} state="calm" />],
      [
        'back-row-raising',
        96,
        420,
        (u) => <BackRow uid={u} shadowSide={1} state="raising" shotT={1.05} />,
      ],
      ['back-row-raised', 96, 420, (u) => <BackRow uid={u} shadowSide={1} state="raised" />],
      ['back-row-turned', 96, 420, (u) => <BackRow uid={u} shadowSide={1} state="turned" />],
      ['house-row', 96, 420, (u) => <BackRow uid={u} shadowSide={1} state="calm" badged />],
      [
        'house-row-raising',
        96,
        420,
        (u) => <BackRow uid={u} shadowSide={1} state="raising" badged shotT={1.05} />,
      ],
      [
        'house-row-raised',
        96,
        420,
        (u) => <BackRow uid={u} shadowSide={1} state="raised" badged />,
      ],
      [
        'house-row-turned',
        96,
        420,
        (u) => <BackRow uid={u} shadowSide={1} state="turned" badged />,
      ],
      [
        'smoke-creeping',
        110,
        380,
        () => <SmokeBank t={1} height={SMOKE_LEVELS.low} reach={0.55} />,
      ],
      ['smoke-low', 110, 380, () => <SmokeBank t={1} height={SMOKE_LEVELS.low} />],
      [
        'smoke-rising',
        110,
        380,
        () => <SmokeBank t={1} height={(SMOKE_LEVELS.low + SMOKE_LEVELS.table) / 2} />,
      ],
      ['smoke-table', 110, 380, () => <SmokeBank t={1} height={SMOKE_LEVELS.table} />],
      [
        'smoke-filling',
        110,
        380,
        () => <SmokeBank t={1} height={(SMOKE_LEVELS.table + SMOKE_LEVELS.high) / 2} />,
      ],
      ['smoke-high', 110, 380, () => <SmokeBank t={1} height={SMOKE_LEVELS.high} />],
      ['sofa', 170, 350, (u) => <Chair uid={u} shadowSide={1} kind="sofa" />],
      ['phone', 480, 260, (u) => <Phone uid={u} shadowSide={1} />],
      ['chat-bubbles', 170, 200, (u) => <ChatBubbles uid={u} shadowSide={1} shotT={1} />],
      ['chat-full', 170, 200, (u) => <ChatBubbles uid={u} shadowSide={1} />],
      ['wall-clock', 240, 200, (u) => <WallClock uid={u} shadowSide={1} />],
      ['wall-clock-spinning', 240, 200, (u) => <WallClock uid={u} shadowSide={1} shotT={2.1} />],
      ['wall-clock-3-55', 240, 200, (u) => <WallClock uid={u} shadowSide={1} at={3 + 55 / 60} />],
      ['wall-clock-4-00', 240, 200, (u) => <WallClock uid={u} shadowSide={1} at={4} />],
      ['wall-clock-4-15', 240, 200, (u) => <WallClock uid={u} shadowSide={1} at={4.25} />],
      ['wall-clock-4-20', 240, 200, (u) => <WallClock uid={u} shadowSide={1} at={4 + 20 / 60} />],
      ['wall-clock-4-30', 240, 200, (u) => <WallClock uid={u} shadowSide={1} at={4.5} />],
      ['wall-clock-4-40', 240, 200, (u) => <WallClock uid={u} shadowSide={1} at={4 + 40 / 60} />],
      [
        'wall-clock-to-4-40',
        240,
        200,
        (u) => (
          <WallClock uid={u} shadowSide={1} at={4 + 35 / 60} until={4 + 40 / 60} shotT={1.2} />
        ),
      ],
      ['car', 50, 300, (u) => <Car uid={u} shadowSide={1} />],
      ['car-crimson', 50, 300, (u) => <Car uid={u} shadowSide={1} paint="crimson" />],
      ['car-gold', 50, 300, (u) => <Car uid={u} shadowSide={1} paint="gold" />],
      ['car-steel', 50, 300, (u) => <Car uid={u} shadowSide={1} paint="steel" />],
      ['notice-board', 170, 200, (u) => <NoticeBoard uid={u} shadowSide={1} />],
      [
        'notice-board-fine-pinning',
        170,
        200,
        (u) => <NoticeBoard uid={u} shadowSide={1} note="fine" pinT={0.62} />,
      ],
      ['notice-board-fine', 170, 200, (u) => <NoticeBoard uid={u} shadowSide={1} note="fine" />],
      [
        'notice-board-no-fine',
        170,
        200,
        (u) => <NoticeBoard uid={u} shadowSide={1} note="no-fine" />,
      ],
      ['dining-table', 110, 290, (u) => <DiningTable uid={u} shadowSide={1} />],
      ['kitchen-sink', 95, 330, (u) => <KitchenCounter uid={u} shadowSide={1} />],
      ['kitchen-sink-done', 95, 330, (u) => <KitchenCounter uid={u} shadowSide={1} dishes={1} />],
      ['plate', 420, 200, (u) => <Plate uid={u} shadowSide={1} />],
      ['notebook-blue', 420, 230, (u) => <NotebookLying uid={u} shadowSide={1} paint="blue" />],
      ['notebook-orange', 420, 230, (u) => <NotebookLying uid={u} shadowSide={1} paint="orange" />],
      [
        'notebook-blue-landing',
        420,
        230,
        (u) => <NotebookLying uid={u} shadowSide={1} paint="blue" />,
      ],
      ['notebook-blue-open', 380, 200, (u) => <NotebookOpen uid={u} shadowSide={1} paint="blue" />],
      [
        'notebook-orange-open',
        380,
        200,
        (u) => <NotebookOpen uid={u} shadowSide={1} paint="orange" />,
      ],
      [
        'window-seasons',
        170,
        200,
        (u) => <SeasonWindow uid={u} shadowSide={1} season={1.6} t={1} />,
      ],
      [
        'window-night',
        170,
        200,
        (u) => <SeasonWindow uid={u} shadowSide={1} night season={3} t={1} />,
      ],
      ['window-winter', 170, 200, (u) => <SeasonWindow uid={u} shadowSide={1} season={0} t={1} />],
      ['window-autumn', 170, 200, (u) => <SeasonWindow uid={u} shadowSide={1} season={3} t={1} />],
      ['drawer-cabinet', 170, 330, (u) => <DrawerCabinet uid={u} shadowSide={1} />],
      [
        'drawer-cabinet-opening',
        170,
        330,
        (u) => <DrawerCabinet uid={u} shadowSide={1} open={0.6} />,
      ],
      ['drawer-cabinet-open', 170, 330, (u) => <DrawerCabinet uid={u} shadowSide={1} open={1} />],
      [
        'drawer-cabinet-empty',
        170,
        330,
        (u) => <DrawerCabinet uid={u} shadowSide={1} open={1} holding={false} />,
      ],
      ['plate-shares', 150, 200, (u) => <SharesPlate uid={u} shadowSide={1} />],
      ['gloom-split', 150, 200, (u) => <SplitLight uid={u} />],
      [
        'black-hole-glow',
        110,
        200,
        (u) => <BlackHoleGlow cx={0} cy={0} R={0.5} t={1} u={1 / 300} uid={`${u}-bh`} />,
      ],
      [
        'black-hole-glow-centred',
        150,
        200,
        (u) => <BlackHoleGlow cx={0} cy={0} R={0.5} t={1} u={1 / 300} uid={`${u}-bh`} />,
      ],
      ['breath-cloud', 300, 200, (u) => <BreathCloud uid={u} t={1} />],
      ['food-breath-cloud', 300, 200, (u) => <FoodBreathCloud uid={u} t={1} />],
      ['xray-fat', 300, 200, (u) => <XrayFat uid={u} t={1} />],
      ['plate-salad', 560, 230, (u) => <SaladPlate uid={u} shadowSide={1} />],
      ['plate-lobster', 420, 250, (u) => <LobsterPlate uid={u} shadowSide={1} />],
      ['water-glass', 560, 250, (u) => <WaterGlass uid={u} shadowSide={1} />],
      ['menu', 300, 250, (u) => <Menu uid={u} shadowSide={1} />],
      ['water-jug', 420, 230, (u) => <WaterJug uid={u} shadowSide={1} />],
      ['bill-long', 70, 290, (u) => <LongBill uid={u} shadowSide={1} shotT={0.9} />],
      ['bill-long-out', 70, 290, (u) => <LongBill uid={u} shadowSide={1} />],
      [
        'gavel-rise',
        230,
        320,
        (u) => (
          <g transform="translate(-0.3 0)">
            <GavelHand uid={u} shadowSide={1} lift={0.7} />
          </g>
        ),
      ],
      ['cash-jar', 112, 372, (u) => <CashJar uid={u} shadowSide={1} hand />],
      ['cash-jar-low', 120, 372, (u) => <CashJar uid={u} shadowSide={1} holds="coins" />],
      [
        'gavel',
        260,
        290,
        (u) => (
          <g transform="translate(-0.26 0)">
            <GavelHand uid={u} shadowSide={1} />
          </g>
        ),
      ],
      [
        'gavel-raised',
        230,
        320,
        (u) => (
          <g transform="translate(-0.3 0)">
            <GavelHand uid={u} shadowSide={1} lift={1} />
          </g>
        ),
      ],
      [
        'gavel-knock',
        230,
        320,
        (u) => (
          <g transform="translate(-0.3 0)">
            <GavelHand uid={u} shadowSide={1} lift={0.45} />
          </g>
        ),
      ],
      ['banknote', 400, 200, (u) => <Banknote uid={u} shadowSide={1} />],
      ['banknote-20', 400, 200, (u) => <Banknote uid={u} shadowSide={1} worth="20" />],
      ...Object.entries(PADDLE_MARKS).map(
        ([name, mark]): [string, number, number, (uid: string) => ReactNode] => [
          name,
          330,
          300,
          (u) => <Paddle uid={u} shadowSide={1} mark={mark} />,
        ],
      ),
      [
        'crate-cutaway-upside-down',
        130,
        340,
        (u) => <Crate uid={u} shadowSide={1} cutaway inverted />,
      ],
    ] as Array<[string, number, number, (uid: string) => ReactNode]>
  ).map(([name, head, y, draw]): [string, Preview] => [
    `prop/${name}`,
    () => (
      <Placed x={BOX / 2} y={y} head={head}>
        {draw(`lib-${name}`)}
      </Placed>
    ),
  ]),
  // Wrist chains on someone walking, head up.
  [
    'prop/chains',
    (o) =>
      figure(
        o,
        walkAt(0.3).pose,
        {
          face: EXPRESSIONS.determined,
          identity: identity({ skinTone: 7, hair: 'short-crop', hairColor: 'black' }),
          outfit: EVERYDAY,
          prop: (hands, info) => (
            <WristChains hands={hands} uid={`${info.uid}-ch`} shadowSide={info.shadowSide} />
          ),
        },
        0.5,
        BOX / 2,
        88,
      ),
  ],
  // A prop in a hand: a sword held out, the fingers wrapped over its grip.
  [
    'prop/in-hand',
    (o) =>
      figure(
        o,
        resolvePose(holdObject),
        {
          face: EXPRESSIONS.determined,
          prop: (hands, info) =>
            hands.front.hand.shape === 'grip' ? (
              <InHand frame={hands.front}>
                <Sword uid={`${info.uid}-sw`} shadowSide={info.shadowSide} />
              </InHand>
            ) : null,
        },
        0.5,
        BOX / 2 - 60,
        80,
      ),
  ],
  [
    'effect/sweat-flying',
    (o) =>
      headShot(
        o,
        { face: EXPRESSIONS.afraid, headEffects: <FlyingSweat t={0.28} seed={SEED} /> },
        0.35,
        200,
      ),
  ],
  [
    'effect/sweat-resting',
    (o) => headShot(o, { face: EXPRESSIONS.exhausted, headEffects: <RestingSweat side={-1} /> }),
  ],
  [
    'effect/dollar-eyes',
    (o) =>
      headShot(
        o,
        { face: EXPRESSIONS.tempted, headEffects: <DollarEyes turn={o.turn ?? 0.35} /> },
        0.35,
        210,
      ),
  ],
  [
    'effect/shock-lines',
    (o) => headShot(o, { face: EXPRESSIONS.horrified, headEffects: <ShockLines /> }, 0.35, 180),
  ],
  [
    'effect/tear-streams',
    (o) =>
      headShot(
        o,
        {
          face: EXPRESSIONS.wailing,
          headEffects: <TearStreams turn={o.turn ?? 0.35} t={0.2} />,
        },
        0.35,
        210,
      ),
  ],
  [
    'effect/tear-drops',
    (o) =>
      headShot(
        o,
        { face: EXPRESSIONS.sad, headEffects: <TearDrops turn={o.turn ?? 0.35} t={0.75} /> },
        0.35,
        210,
      ),
  ],
  [
    'effect/anger-mark',
    (o) => headShot(o, { face: EXPRESSIONS.angry, headEffects: <AngerMark t={0.1} /> }, 0.5, 210),
  ],
  [
    'effect/dizzy-stars',
    (o) => effectShot(o, { face: EXPRESSIONS.exhausted, headEffects: <DizzyStars t={0.2} /> }, 0.2),
  ],
  [
    'effect/symbol-exclaim',
    (o) =>
      effectShot(o, { face: EXPRESSIONS.surprised, headEffects: <HeadSymbol kind="!" /> }, 0.5),
  ],
  [
    'effect/symbol-question',
    (o) => effectShot(o, { face: EXPRESSIONS.thinking, headEffects: <HeadSymbol kind="?" /> }, 0.5),
  ],
  [
    'effect/symbol-dots',
    (o) => effectShot(o, { face: EXPRESSIONS.neutral, headEffects: <HeadSymbol kind="..." /> }, 0),
  ],
  [
    'effect/coin-rain',
    (o) => effectShot(o, { face: EXPRESSIONS.happy, headEffects: <CoinRain t={0.2} /> }, 0.2),
  ],
  [
    'effect/explosion',
    () => (
      <Placed x={BOX / 2} y={BOX * 0.56} head={70}>
        <Explosion t={0.34} size={2} seed={3} />
      </Placed>
    ),
  ],
  [
    'effect/fire',
    () => (
      <Placed x={BOX / 2} y={350} head={150}>
        <Fire t={0.3} size={1.9} />
      </Placed>
    ),
  ],
  [
    'effect/pencil-line',
    () => (
      <g>
        <Paper width={BOX} height={BOX} />
        <PencilLine
          d={`M 20 ${BOX * 0.78} C 140 ${BOX * 0.6}, 300 ${BOX * 0.72}, ${BOX - 20} ${BOX * 0.7}`}
          progress={1}
        />
        <PencilLine d={circlePath(BOX * 0.36, BOX * 0.34, 70, 0.8)} progress={1} weight={6} />
      </g>
    ),
  ],
  [
    'effect/erased',
    (o) => (
      <g>
        <Paper width={BOX} height={BOX} />
        <Erased
          at={{ x: BOX * 0.62, y: BOX * 0.5 }}
          radius={150}
          amount={1}
          width={BOX}
          height={BOX}
        >
          {headShot(o, { face: EXPRESSIONS.hollow }, 0.35, 230)}
        </Erased>
        <Crumbs
          crumbs={[0, 1, 2, 3, 4, 5].map((i) => ({
            at: i * 0.12,
            from: { x: BOX * 0.62 + i * 14, y: BOX * 0.55 },
          }))}
          t={1.1}
          groundY={BOX - 30}
          size={12}
        />
      </g>
    ),
  ],
  [
    'effect/smoke',
    () => (
      <Placed x={BOX / 2} y={380} head={86}>
        <Smoke t={1.1} size={1} />
      </Placed>
    ),
  ],
  ['effect/impact', () => <Impact x={BOX / 2} y={BOX / 2} head={210} t={IMPACT_SECONDS * 0.4} />],
  [
    'effect/motion-lines',
    (o) => {
      const run = ACTIONS.run(0.27);
      return (
        <>
          <MotionLines x={176} y={196} head={88} direction={0} length={1} />
          {figure(o, run, { face: EXPRESSIONS.determined }, 1, BOX / 2 + 30)}
        </>
      );
    },
  ],

  ...TREATMENTS.map((treatment): [string, Preview] => [
    `background/${treatment}`,
    () =>
      scene(
        backgroundSpec(treatment, treatment === 'simple' ? 'dusk-violet' : 'storm-slate', SEED),
      ),
  ]),
  ...Object.keys(tokens.palettes).map((name): [string, Preview] => [
    `palette/${name}`,
    () => scene(backgroundSpec('simple', name, SEED)),
  ]),
  [
    'background-element/moon',
    () =>
      scene(
        backgroundSpec('simple', 'dusk-violet', SEED, {
          ...bare,
          moon: { x: 0.5, y: 0.4, r: 0.2 },
        }),
      ),
  ],
  [
    'background-element/stars',
    () => scene(backgroundSpec('simple', 'dusk-violet', SEED, { ...bare, stars: 45 })),
  ],
  [
    'background-element/clouds',
    () => scene(backgroundSpec('atmospheric', 'storm-slate', SEED, { ...bare, clouds: 6 })),
  ],
  [
    'background-element/light-rays',
    () => scene(backgroundSpec('atmospheric', 'storm-slate', SEED, { ...bare, rays: true })),
  ],
  [
    'background-element/hills',
    () => scene(backgroundSpec('atmospheric', 'cold-dawn', SEED, { ...bare, hills: true })),
  ],
  [
    'background-element/grass-tufts',
    () => scene(backgroundSpec('simple', 'clear-day', SEED, { ...bare, tufts: 9 })),
  ],
  ...(Object.keys(PLACES) as PlaceName[]).map((name): [string, Preview] => [
    `place/${name}`,
    () => scene(placeSpec(name, SEED)),
  ]),
  ...SILHOUETTE_KINDS.map((kind): [string, Preview] => [
    `silhouette/${kind}`,
    () =>
      scene(
        backgroundSpec('simple', 'dusk-violet', SEED, {
          ...bare,
          silhouettes: [{ kind, x: 0.5, size: 0.42, layer: 'near' }],
        }),
      ),
  ]),

  ...Object.keys(tokens.accents).map((name): [string, Preview] => [
    `color/${name}`,
    () => swatch(name),
  ]),
];

export const PREVIEWS: Readonly<Record<string, Preview>> = Object.fromEntries(entries);
