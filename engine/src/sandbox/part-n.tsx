import { characterCardSchema, parseOrExplain } from '@studio/shared';
import type { ReactNode } from 'react';
import cheatCard from '../../../characters/cheat.json';
import copycatCard from '../../../characters/copycat.json';
import saintCard from '../../../characters/saint.json';
import trainerCard from '../../../characters/trainer.json';
import youCard from '../../../characters/you.json';
import { Background } from '../backgrounds/Background';
import { placeSpec } from '../backgrounds/places';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Placed } from '../props/Hold';
import { Bulb } from '../props/Room';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { vec } from '../rig/math';
import { resolvePose } from '../rig/pose';
import { fixTie, sit, sitReach, sitSlump, stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import type { Facing } from '../rig/types';
import { StandingProp } from '../stage/props';
import { ink, tokens, white } from '../tokens';
import { castFromCard } from '../wardrobe/cast';

/**
 * The Table, as built (Biku picked look 2 on 2026-10-11): the grey room under one bulb, the
 * cast in their own colours, the gold the brightest thing. Two sheets for his eye:
 *   table-faces  the six faces drawn for this mood, each on one of the cast
 *   table-shots  nine key pictures of how these videos are filmed, each tile a phone
 */

const W = 1080;
const H = 1920;
const SEED = 2207;
const FPS = tokens.motion.fps;
const font = 'Arial, Helvetica, sans-serif';

const card = (raw: unknown, name: string) =>
  castFromCard(parseOrExplain(characterCardSchema, raw, `characters/${name}.json`));
const CAST = {
  cheat: card(cheatCard, 'cheat'),
  saint: card(saintCard, 'saint'),
  copycat: card(copycatCard, 'copycat'),
  you: card(youCard, 'you'),
};
type Who = keyof typeof CAST;

const room = placeSpec('the-table', SEED);
const standHead = computeSkeleton(resolvePose(stand)).head;

const Room = () => <Background spec={room} width={W} height={H} frame={0} fps={FPS} />;

type Spot = { x: number; groundY: number; head: number; facing?: Facing };

const person = (
  who: Who,
  face: ExpressionName,
  at: Spot,
  extra: Partial<CharacterProps> = {},
): ReactNode => (
  <Character
    {...at}
    pose={resolvePose(sit)}
    face={EXPRESSIONS[face]}
    turn={0.5}
    {...CAST[who].look}
    {...extra}
  />
);

/** A head filling the picture, its middle at cx, cy. */
const face = (
  who: Who,
  expression: ExpressionName,
  head: number,
  cx: number,
  cy: number,
  extra: Partial<CharacterProps> = {},
): ReactNode => (
  <Character
    x={cx - standHead.x * head}
    groundY={cy - standHead.y * head}
    head={head}
    pose={resolvePose(stand)}
    face={EXPRESSIONS[expression]}
    turn={0.25}
    {...CAST[who].look}
    {...extra}
  />
);

const thing = (id: string, at: Spot, key: string, more: { flip?: boolean; up?: number } = {}) => (
  <StandingProp
    id={id}
    uid={`n-${key}`}
    x={at.x}
    groundY={at.groundY}
    head={at.head}
    t={0}
    {...more}
  />
);

const bulb = (x: number, y: number, head: number, on = 1, key = 'b') => (
  <Placed x={x} y={y} head={head}>
    <Bulb uid={`n-bulb-${key}`} shadowSide={1} on={on} />
  </Placed>
);

const caption = (text: string, y = H - 90) => (
  <text
    x={W / 2}
    y={y}
    textAnchor="middle"
    fontFamily={font}
    fontWeight={700}
    fontSize={62}
    fill={white}
    stroke={ink}
    strokeWidth={10}
    paintOrder="stroke"
    strokeLinejoin={tokens.line.join}
  >
    {text}
  </text>
);

// ------------------------------------------------------------------ the six faces

const FACES: Array<[ExpressionName, Who, string]> = [
  ['dread', 'saint', 'dread'],
  ['calculating', 'cheat', 'calculating'],
  ['tempted', 'copycat', 'tempted'],
  ['lying', 'cheat', 'lying'],
  ['guilty', 'you', 'guilty'],
  ['hollow', 'saint', 'hollow'],
];

export function TableFacesSheet() {
  const tw = W / 2;
  const th = H / 3;
  return (
    <>
      {FACES.map(([expression, who, label], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <g key={expression}>
            {/* The view is a band across the middle of a tall frame, so the room's light is behind the head. */}
            <svg
              x={col * tw}
              y={row * th}
              width={tw}
              height={th}
              viewBox={`0 320 ${W} ${(W * th) / tw}`}
            >
              <Room />
              {face(who, expression, 700, W / 2, 880)}
              {caption(label, 320 + (W * th) / tw - 70)}
            </svg>
            <rect
              x={col * tw}
              y={row * th}
              width={tw}
              height={th}
              fill="none"
              stroke={ink}
              strokeWidth={2}
            />
          </g>
        );
      })}
    </>
  );
}

// ------------------------------------------------------------------ nine key pictures

const HEAD = 150;
const GROUND = 1400;
const CX = W / 2;
const LEFT: Spot = { x: CX - 1.75 * HEAD, groundY: GROUND, head: HEAD };
const RIGHT: Spot = { x: CX + 1.75 * HEAD, groundY: GROUND, head: HEAD, facing: 'left' };
const MID: Spot = { x: CX, groundY: GROUND, head: HEAD };

/** The table under the bulb with the gold on it; `people` sit between the chairs and the table. */
const table = (people: ReactNode, key: string, on = 1): ReactNode => (
  <>
    {bulb(CX, GROUND - 4.4 * HEAD, HEAD, on, key)}
    {thing('iron-chair', LEFT, `${key}-cl`)}
    {thing('iron-chair', RIGHT, `${key}-cr`, { flip: true })}
    {people}
    {thing('iron-table', MID, `${key}-t`)}
    {thing('coin-stack', MID, `${key}-g`, { up: 1.22 })}
  </>
);

const SHOTS: Array<[string, ReactNode]> = [
  ['1  the room, before', table(null, 's1')],
  [
    '2  two sit down',
    table(
      <>
        {person('cheat', 'calculating', LEFT)}
        {person('saint', 'dread', RIGHT)}
      </>,
      's2',
    ),
  ],
  [
    '3  the reach',
    <g
      key="s3"
      transform={`translate(${CX} ${GROUND - 2 * HEAD}) scale(1.75) translate(${-(CX - 1.0 * HEAD)} ${-(GROUND - 1.9 * HEAD)})`}
    >
      {table(<>{person('cheat', 'tempted', LEFT, { pose: resolvePose(sitReach) })}</>, 's3')}
    </g>,
  ],
  // Only the eyes: the moment of deciding.
  ['4  the eyes', face('copycat', 'dread', 1750, CX, 1010, { turn: 0.15 })],
  [
    '5  over the shoulder',
    <g key="s5">
      {bulb(CX + 110, 330, 230, 1, 's5')}
      {thing('iron-chair', { x: CX + 320, groundY: 1500, head: 230 }, 's5-c', { flip: true })}
      {person('cheat', 'lying', { x: CX + 320, groundY: 1500, head: 230, facing: 'left' })}
      {thing('iron-table', { x: CX - 60, groundY: 1500, head: 230 }, 's5-t')}
      {thing('coin-stack', { x: CX - 60, groundY: 1500, head: 230 }, 's5-g', { up: 1.22 })}
      {/* The back of a head, near and low in its corner: we look past it at the liar. */}
      {face('you', 'neutral', 640, 70, 1650, { back: true, turn: 0.5 })}
    </g>,
  ],
  [
    '6  the tilt: it is done',
    <g
      key="s6"
      transform={`rotate(-7 ${CX} ${H / 2}) scale(1.16) translate(${-CX * 0.138} ${-H * 0.069})`}
    >
      {table(
        <>
          {person('cheat', 'smug', LEFT, { pose: resolvePose(sitReach) })}
          {person('saint', 'guilty', RIGHT, { pose: resolvePose(sitSlump) })}
        </>,
        's6',
      )}
    </g>,
  ],
  [
    '7  the light fails',
    <g key="s7">
      {table(
        <>
          {person('cheat', 'hollow', LEFT)}
          {person('saint', 'hollow', RIGHT, { pose: resolvePose(sitSlump) })}
        </>,
        's7',
        0.15,
      )}
      <rect width={W} height={H} fill={ink} opacity={0.5} />
    </g>,
  ],
  [
    '8  alone with it',
    <g
      key="s8"
      transform={`translate(${CX} ${GROUND - 2 * HEAD}) scale(1.6) translate(${-(CX + 1.1 * HEAD)} ${-(GROUND - 1.7 * HEAD)})`}
    >
      {table(person('saint', 'hollow', RIGHT, { pose: resolvePose(sitSlump) }), 's8')}
    </g>,
  ],
  // The last look is at us.
  ['9  to the viewer', face('you', 'calculating', 900, CX, 900, { turn: 0, gaze: vec(0, 0) })],
];

export function TableShotsSheet() {
  const tw = W / 3;
  const th = H / 3;
  return (
    <>
      {SHOTS.map(([label, picture], i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <g key={label}>
            <svg x={col * tw} y={row * th} width={tw} height={th} viewBox={`0 0 ${W} ${H}`}>
              <Room />
              {picture}
              {caption(label)}
            </svg>
            <rect
              x={col * tw}
              y={row * th}
              width={tw}
              height={th}
              fill="none"
              stroke={ink}
              strokeWidth={2}
            />
          </g>
        );
      })}
    </>
  );
}

// ------------------------------------------------------------------ the Trainer, three looks

/** The Trainer's card with one thing changed, for choosing his look by eye. */
const TRAINER_LOOKS: Array<[string, ReturnType<typeof card>]> = [
  ['1', card(trainerCard, 'trainer')],
  ['2', card({ ...trainerCard, eyeStyle: 'stern' }, 'trainer')],
  [
    '3',
    card(
      { ...trainerCard, identity: { skinTone: 1, hair: 'short-crop', hairColor: 'black' } },
      'trainer',
    ),
  ],
];

const TRAINER_SIZE = trainerCard.size;

/** Three pictures of one look: running the game, the aside to the camera, the tie. */
const trainerPictures = (look: ReturnType<typeof card>['look'], key: string): ReactNode[] => {
  const trainer = (expression: ExpressionName, at: Spot, extra: Partial<CharacterProps> = {}) => (
    <Character
      {...at}
      head={at.head * TRAINER_SIZE}
      pose={resolvePose(stand)}
      face={EXPRESSIONS[expression]}
      turn={0.35}
      {...look}
      {...extra}
    />
  );
  const BEHIND: Spot = { x: CX, groundY: GROUND - 0.25 * HEAD, head: HEAD };
  return [
    // Friendly to the player: he stands behind the table and runs the game.
    <g key="a">
      {bulb(CX, GROUND - 4.6 * HEAD, HEAD, 1, `${key}-a`)}
      {thing('iron-chair', LEFT, `${key}-a-cl`)}
      {thing('iron-chair', RIGHT, `${key}-a-cr`, { flip: true })}
      {trainer('happy', { ...BEHIND, facing: 'left' })}
      {person('saint', 'happy', LEFT)}
      {person('cheat', 'calculating', RIGHT)}
      {thing('iron-table', MID, `${key}-a-t`)}
      {thing('coin-stack', MID, `${key}-a-g`, { up: 1.22 })}
    </g>,
    // The aside: the smile is gone and he looks at us; the player sits behind him, unaware.
    <g
      key="b"
      transform={`translate(${CX} ${GROUND - 2.4 * HEAD}) scale(1.9) translate(${-(CX - 0.5 * HEAD)} ${-(GROUND - 2.9 * HEAD)})`}
    >
      {bulb(CX, GROUND - 4.6 * HEAD, HEAD, 1, `${key}-b`)}
      {thing('iron-chair', LEFT, `${key}-b-cl`)}
      {trainer('bored', BEHIND, { turn: 0, gaze: vec(0, 0) })}
      {person('saint', 'happy', LEFT)}
      {thing('iron-table', MID, `${key}-b-t`)}
      {thing('coin-stack', MID, `${key}-b-g`, { up: 1.22 })}
    </g>,
    // It worked: he straightens his tie.
    <g
      key="c"
      transform={`translate(${CX} ${GROUND - 2.4 * HEAD}) scale(2.3) translate(${-CX} ${-(GROUND - 2.7 * HEAD)})`}
    >
      {trainer('smug', BEHIND, { pose: resolvePose(fixTie) })}
      {thing('iron-table', MID, `${key}-c-t`)}
      {thing('coin-stack', MID, `${key}-c-g`, { up: 1.22 })}
    </g>,
  ];
};

export function TrainerLooksSheet() {
  const tw = W / 3;
  const th = H / 3;
  return (
    <>
      {TRAINER_LOOKS.map(([label, cast], col) =>
        trainerPictures(cast.look, `tl${col}`).map((picture, row) => (
          <g key={`${label}-${row}`}>
            <svg x={col * tw} y={row * th} width={tw} height={th} viewBox={`0 0 ${W} ${H}`}>
              <Room />
              {picture}
              {row === 0 ? caption(label, 150) : null}
            </svg>
            <rect
              x={col * tw}
              y={row * th}
              width={tw}
              height={th}
              fill="none"
              stroke={ink}
              strokeWidth={2}
            />
          </g>
        )),
      )}
    </>
  );
}

// ------------------------------------------------------------------ the others in the room

/** The Trainer as he stands in a built shot: on the same floor, behind the table. */
const trainerAt = (expression: ExpressionName, extra: Partial<CharacterProps> = {}): ReactNode => (
  <Character
    x={CX}
    groundY={GROUND}
    head={HEAD * TRAINER_SIZE}
    facing="left"
    pose={resolvePose(stand)}
    face={EXPRESSIONS[expression]}
    turn={0.35}
    {...card(trainerCard, 'trainer').look}
    {...extra}
  />
);

const GOLD_AT: Spot = { x: CX - 0.5 * HEAD, groundY: GROUND, head: HEAD };

/** A whole room: the row at the back, the Trainer, two players, the table and the gold. */
const fullRoom = (row: string, people: ReactNode, key: string): ReactNode => (
  <>
    {bulb(CX, GROUND - 4.7 * HEAD, HEAD, 1, key)}
    {thing(row, MID, `${key}-row`)}
    {thing('iron-chair', LEFT, `${key}-cl`)}
    {thing('iron-chair', RIGHT, `${key}-cr`, { flip: true })}
    {people}
    {thing('iron-table', MID, `${key}-t`)}
    {thing('coin-stack', GOLD_AT, `${key}-g`, { up: 1.22 })}
  </>
);

const ROWS: Array<[string, ReactNode]> = [
  [
    '1  the public, watching',
    fullRoom(
      'back-row',
      <>
        {trainerAt('happy')}
        {person('copycat', 'thinking', LEFT)}
        {person('saint', 'happy', RIGHT)}
      </>,
      'r1',
    ),
  ],
  [
    '2  House Actors (gold badges)',
    fullRoom(
      'house-row',
      <>
        {trainerAt('bored', { turn: 0, gaze: vec(0, 0) })}
        {person('copycat', 'dread', LEFT)}
        {person('cheat', 'calculating', RIGHT)}
      </>,
      'r2',
    ),
  ],
  [
    '3  every hand goes up',
    fullRoom(
      'house-row-raised',
      <>
        {trainerAt('smug', { pose: resolvePose(fixTie) })}
        {person('copycat', 'tempted', LEFT)}
        {person('cheat', 'smug', RIGHT)}
      </>,
      'r3',
    ),
  ],
  [
    '4  they turn away',
    fullRoom(
      'back-row-turned',
      <>
        {trainerAt('bored', { turn: 0, gaze: vec(0, 0) })}
        {person('saint', 'dread', LEFT)}
        {person('copycat', 'guilty', RIGHT)}
      </>,
      'r4',
    ),
  ],
];

export function TableRowsSheet() {
  const tw = W / 2;
  const th = H / 2;
  return (
    <>
      {ROWS.map(([label, picture], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <g key={label}>
            <svg x={col * tw} y={row * th} width={tw} height={th} viewBox={`0 0 ${W} ${H}`}>
              <Room />
              {/* A wide shot of the room in a tall frame closes in to about five heads across. */}
              <g
                transform={`translate(${CX} ${GROUND - 2.3 * HEAD}) scale(1.3) translate(${-CX} ${-(GROUND - 2.3 * HEAD)})`}
              >
                {picture}
              </g>
              {caption(label)}
            </svg>
            <rect
              x={col * tw}
              y={row * th}
              width={tw}
              height={th}
              fill="none"
              stroke={ink}
              strokeWidth={2}
            />
          </g>
        );
      })}
    </>
  );
}
