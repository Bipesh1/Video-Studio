import type { ReactNode } from 'react';
import {
  Background,
  SILHOUETTE_KINDS,
  TREATMENTS,
  backgroundSpec,
} from '../backgrounds/Background';
import type { BackgroundSpec } from '../backgrounds/Background';
import { AngerMark } from '../effects/AngerMark';
import { DizzyStars } from '../effects/Dizzy';
import { IMPACT_SECONDS, Impact } from '../effects/Impact';
import { MotionLines } from '../effects/MotionLines';
import { FlyingSweat, RestingSweat } from '../effects/Sweat';
import { HeadSymbol } from '../effects/Symbol';
import { TearDrops, TearStreams } from '../effects/Tears';
import { EXPRESSIONS, EXPRESSION_NAMES } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { MOUTH_FORMS } from '../face/talk';
import { Scepter } from '../props/Scepter';
import { ACTIONS } from '../rig/actions';
import type { ActionName } from '../rig/actions';
import { body } from '../rig/body';
import { Character } from '../rig/Character';
import type { CharacterProps, HandFrame } from '../rig/Character';
import { swayOf } from '../rig/follow';
import { Hand } from '../rig/Hand';
import { vec } from '../rig/math';
import { JUMP, PUNCH, SWING } from '../rig/moves';
import { poseAt, resolvePose } from '../rig/pose';
import { POSES, handsUp, holdObject, stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import { HAND_SHAPES } from '../rig/types';
import type { HandShape, ResolvedPose } from '../rig/types';
import { walkAt } from '../rig/walk';
import { boulderProp, clubProp, crateProp, ropeProp } from '../sandbox/fixtures';
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
  sneakers: { shoes: { kind: 'sneakers', cloth: 'white' } },
  boots: { shoes: { kind: 'boots', cloth: 'steel' } },
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
      };
      return (
        <>
          {p.id === 'sit' && <Seat x={BOX / 2 + (view.dx ?? 0)} head={POSE_HEAD} />}
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
    (o) => figure(o, standPose, { outfit: outfitFrom(GARMENT_LOOKS[g]) }, g === 'hood' ? 0.4 : 0),
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
