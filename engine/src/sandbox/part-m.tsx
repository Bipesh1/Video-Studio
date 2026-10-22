import { characterCardSchema, parseOrExplain } from '@studio/shared';
import type { CSSProperties, ReactNode } from 'react';
import cheatCard from '../../../characters/cheat.json';
import copycatCard from '../../../characters/copycat.json';
import saintCard from '../../../characters/saint.json';
import youCard from '../../../characters/you.json';
import { Background, backgroundSpec } from '../backgrounds/Background';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Placed } from '../props/Hold';
import { Bulb } from '../props/Room';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { sit, sitReach, stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import type { Facing } from '../rig/types';
import { StandingProp } from '../stage/props';
import { ink, tokens, white } from '../tokens';
import { castFromCard } from '../wardrobe/cast';

/**
 * A look test for the game theory videos (asked by Biku, 2026-10-11): "The Table" as a dark
 * room under one bulb, in three numbered looks side by side, each on three pictures and each
 * tile the size of a phone. Nothing here changes the style: the grey of looks 2 and 3 is the
 * night room with its colour taken out for the test. The look he picks is then built properly.
 *
 *   1  the style's own night room, everyone and everything in colour
 *   2  a grey room and grey furniture; the cast keep their colours; the gold is bright
 *   3  everything grey; only the gold has colour
 *   4  between 2 and 3 (second sheet): a grey room, the cast's colours kept but dimmed
 *
 * The second sheet narrows it to 2, 4 and 3 on pictures that ask the real question: can the
 * four still be told apart, and does the gold win the eye?
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

type Look = 1 | 2 | 3 | 4;
const GREY: CSSProperties = { filter: 'grayscale(1) brightness(0.82)' };
const NO_COLOUR: CSSProperties = { filter: 'grayscale(1)' };
const DIMMED: CSSProperties = { filter: 'saturate(0.42)' };
/** The room and its furniture; the people. Left out, they keep their colours. */
const worldOf = (look: Look): CSSProperties | undefined => (look === 1 ? undefined : GREY);
const peopleOf = (look: Look): CSSProperties | undefined =>
  look === 3 ? NO_COLOUR : look === 4 ? DIMMED : undefined;

const room = backgroundSpec('atmospheric', 'storm-slate', SEED, {
  horizon: 0.64,
  ground: 'floor',
  tufts: 0,
  silhouettes: [],
  interior: { windows: [], columns: 0, banners: 0, shelf: false, fittings: [] },
});

const standHead = computeSkeleton(resolvePose(stand)).head;

const person = (
  who: keyof typeof CAST,
  face: ExpressionName,
  at: { x: number; groundY: number; head: number; facing?: Facing },
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

/** The bulb over the table, and the light it throws on the floor under it. */
const light = (x: number, groundY: number, head: number, up: number, id: string): ReactNode => (
  <>
    {/* The bulb lights the wall behind the table, so black limbs stand out against it. */}
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={white} stopOpacity={0.42} />
        <stop offset="0.55" stopColor={white} stopOpacity={0.2} />
        <stop offset="1" stopColor={white} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse
      cx={x}
      cy={groundY - 2.1 * head}
      rx={5.2 * head}
      ry={4.6 * head}
      fill={`url(#${id})`}
    />
    <ellipse
      cx={x}
      cy={groundY + 0.12 * head}
      rx={3.6 * head}
      ry={0.55 * head}
      fill={white}
      opacity={tokens.background.lightRayOpacity[0]}
    />
    <Placed x={x} y={groundY - up * head} head={head}>
      <Bulb uid="look-bulb" shadowSide={1} />
    </Placed>
  </>
);

/** Two at the table under the bulb, the gold between them. */
function AtTheTable({ look }: { look: Look }) {
  const head = 150;
  const groundY = 1290;
  const cx = W / 2;
  const left = cx - 1.75 * head;
  const right = cx + 1.75 * head;
  const thing = (id: string, x: number, flip = false) => (
    <StandingProp
      id={id}
      uid={`t-${id}-${x}`}
      x={x}
      groundY={groundY}
      head={head}
      t={0}
      flip={flip}
    />
  );
  return (
    <>
      {light(cx, groundY, head, 4.3, `glow-table-${look}`)}
      <g style={worldOf(look)}>
        {thing('chair', left)}
        {thing('chair', right, true)}
      </g>
      <g style={peopleOf(look)}>
        {person('cheat', 'smug', { x: left, groundY, head })}
        {person('saint', 'afraid', { x: right, groundY, head, facing: 'left' })}
      </g>
      <g style={worldOf(look)}>{thing('table', cx)}</g>
      <StandingProp
        id="coin-stack"
        uid="t-gold"
        x={cx}
        groundY={groundY}
        head={head}
        t={0}
        up={1.22}
      />
    </>
  );
}

/** The eyes, as close as the camera goes: the moment of deciding. */
function TheEyes({ look }: { look: Look }) {
  const head = 900;
  return (
    <>
      <defs>
        <radialGradient id={`glow-eyes-${look}`}>
          <stop offset="0" stopColor={white} stopOpacity={0.4} />
          <stop offset="1" stopColor={white} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={W / 2} cy={760} rx={1000} ry={1150} fill={`url(#glow-eyes-${look})`} />
      <TheFace look={look} head={head} />
    </>
  );
}

function TheFace({ look, head }: { look: Look; head: number }) {
  return (
    <g style={peopleOf(look)}>
      <Character
        x={W / 2 - standHead.x * head}
        groundY={900 - standHead.y * head}
        head={head}
        pose={resolvePose(stand)}
        face={EXPRESSIONS.horrified}
        turn={0.2}
        {...CAST.copycat.look}
      />
    </g>
  );
}

/** You, alone at the table with the gold, looking out at us. */
function YouAlone({ look }: { look: Look }) {
  const head = 215;
  const groundY = 1400;
  const x = W / 2 - 1.5 * head;
  const table = x + 1.75 * head;
  return (
    <>
      {light(table, groundY, head, 3.9, `glow-you-${look}`)}
      <g style={worldOf(look)}>
        <StandingProp id="chair" uid="y-chair" x={x} groundY={groundY} head={head} t={0} />
      </g>
      <g style={peopleOf(look)}>
        {person('you', 'suspicious', { x, groundY, head }, { turn: 0.3 })}
      </g>
      <g style={worldOf(look)}>
        <StandingProp id="table" uid="y-table" x={table} groundY={groundY} head={head} t={0} />
      </g>
      <StandingProp
        id="coin-stack"
        uid="y-gold"
        x={table}
        groundY={groundY}
        head={head}
        t={0}
        up={1.22}
      />
    </>
  );
}

/** All four side by side under the bulb: can they be told apart at a glance? */
function TheFour({ look }: { look: Look }) {
  const head = 140;
  const groundY = 1290;
  const cx = W / 2;
  const standing = { pose: resolvePose(stand), turn: 0.3 };
  const at = (heads: number, facing: Facing) => ({ x: cx + heads * head, groundY, head, facing });
  return (
    <>
      {light(cx, groundY, head, 4.6, `glow-four-${look}`)}
      <g style={peopleOf(look)}>
        {person('cheat', 'smug', at(-2.75, 'right'), standing)}
        {person('saint', 'happy', at(-1.4, 'right'), standing)}
        {person('copycat', 'neutral', at(1.4, 'left'), standing)}
        {person('you', 'neutral', at(2.75, 'left'), standing)}
      </g>
      <g style={worldOf(look)}>
        <StandingProp id="table" uid="f-table" x={cx} groundY={groundY} head={head * 0.8} t={0} />
      </g>
      <StandingProp
        id="coin-stack"
        uid="f-gold"
        x={cx}
        groundY={groundY}
        head={head * 0.8}
        t={0}
        up={1.22}
      />
    </>
  );
}

/** The Cheat reaching for the gold: the moment the look is for. */
function TheReach({ look }: { look: Look }) {
  const head = 230;
  const groundY = 1400;
  const x = W / 2 - 1.55 * head;
  const table = x + 1.85 * head;
  return (
    <>
      {light(table, groundY, head, 3.7, `glow-reach-${look}`)}
      <g style={worldOf(look)}>
        <StandingProp id="chair" uid="r-chair" x={x} groundY={groundY} head={head} t={0} />
      </g>
      <g style={peopleOf(look)}>
        {person('cheat', 'smug', { x, groundY, head }, { pose: resolvePose(sitReach) })}
      </g>
      <g style={worldOf(look)}>
        <StandingProp id="table" uid="r-table" x={table} groundY={groundY} head={head} t={0} />
      </g>
      <StandingProp
        id="coin-stack"
        uid="r-gold"
        x={table - 0.3 * head}
        groundY={groundY}
        head={head}
        t={0}
        up={1.22}
      />
    </>
  );
}

type Picture = (props: { look: Look }) => ReactNode;
const TILE_W = W / 3;
const TILE_H = H / 3;

/** The first sheet: looks 1, 2 and 3. */
export const TableLooksSheet = () => (
  <LooksSheet pictures={[AtTheTable, TheEyes, YouAlone]} looks={[1, 2, 3]} />
);

/** The second sheet: 2 against 3, with 4 between them. */
export const TableLooksBSheet = () => (
  <LooksSheet pictures={[TheFour, TheReach, TheEyes]} looks={[2, 4, 3]} />
);

function LooksSheet({ pictures, looks }: { pictures: Picture[]; looks: Look[] }) {
  return (
    <>
      {pictures.map((Picture, row) =>
        looks.map((look, col) => (
          <g key={`${row}-${look}`}>
            {/* Each tile is a whole tall frame, drawn at the size of a phone. */}
            <svg
              x={col * TILE_W}
              y={row * TILE_H}
              width={TILE_W}
              height={TILE_H}
              viewBox={`0 0 ${W} ${H}`}
            >
              <g style={worldOf(look)}>
                <Background spec={room} width={W} height={H} frame={0} fps={FPS} />
              </g>
              <Picture look={look} />
            </svg>
            <circle
              cx={col * TILE_W + 34}
              cy={row * TILE_H + 34}
              r={24}
              fill={white}
              stroke={ink}
              strokeWidth={3}
            />
            <text
              x={col * TILE_W + 34}
              y={row * TILE_H + 46}
              textAnchor="middle"
              fontFamily={font}
              fontWeight={700}
              fontSize={34}
              fill={ink}
            >
              {look}
            </text>
            <rect
              x={col * TILE_W}
              y={row * TILE_H}
              width={TILE_W}
              height={TILE_H}
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
