import type { ReactNode } from 'react';
import {
  Background,
  SILHOUETTE_KINDS,
  TREATMENTS,
  backgroundSpec,
} from '../backgrounds/Background';
import type { BackgroundSpec } from '../backgrounds/Background';
import { FlyingSweat, RestingSweat } from '../effects/Sweat';
import { EXPRESSIONS, EXPRESSION_NAMES } from '../face/expressions';
import { Scepter } from '../props/Scepter';
import { Character } from '../rig/Character';
import type { CharacterProps, HandFrame } from '../rig/Character';
import { Hand } from '../rig/Hand';
import { vec } from '../rig/math';
import { resolvePose } from '../rig/pose';
import { POSES, holdObject, stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import { HAND_SHAPES } from '../rig/types';
import type { HandShape, ResolvedPose } from '../rig/types';
import { walkAt } from '../rig/walk';
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

const rodProp: CharacterProps['prop'] = (hands) =>
  hands.front.hand.shape === 'grip' ? <Rod frame={hands.front} /> : null;
const scepterProp: CharacterProps['prop'] = (hands, info) =>
  hands.front.hand.shape === 'grip' ? (
    <Scepter frame={hands.front} uid={info.uid} shadowSide={info.shadowSide} />
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
    (o) =>
      p === holdObject
        ? figure(o, resolvePose(p), { prop: rodProp }, 0.5, BOX / 2 - 30)
        : figure(o, resolvePose(p), {}, p.id === 'point' ? 0.5 : 0, p.id === 'point' ? 170 : 200),
  ]),
  [
    'action/walk',
    (o) => {
      const pose = walkAt(0.3).pose;
      return figure(o, pose, {}, 1);
    },
  ],
  ['motion/life', (o) => headShot(o, { blink: 1 })],
  ['motion/talking-mouth', (o) => headShot(o, { talk: 1 })],

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
