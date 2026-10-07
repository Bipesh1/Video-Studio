import type { ReactNode } from 'react';
import { Bag, BAG_DROP } from '../props/Bag';
import { BOOK, Book } from '../props/Book';
import { Chair } from '../props/Chair';
import { COIN_RADIUS, Coin } from '../props/Coin';
import { CUP_REST, Cup } from '../props/Cup';
import { EXPLOSION_SECONDS, Explosion, Fire, Smoke } from '../effects/Blast';
import { Door } from '../props/Door';
import { InHand, Placed } from '../props/Hold';
import { LANTERN_DROP, Lantern } from '../props/Lantern';
import { Rocket } from '../props/Rocket';
import { Scepter } from '../props/Scepter';
import { SHIELD, Shield } from '../props/Shield';
import { Asteroid, BlackHole, Earth, FullMoon, Planet, Sun } from '../props/Sky';
import { Sword } from '../props/Sword';
import { Table } from '../props/Table';
import type { CharacterProps } from '../rig/Character';

/**
 * Props by their library name, for a storyboard: how each one sits in a hand (`holds` on an
 * actor) and how each one stands in a scene (`props` on a shot). The props themselves are
 * drawn in `engine/src/props/`; this only knows how to put each one where a shot asks.
 */

type HeldProp = NonNullable<CharacterProps['prop']>;

/**
 * How far a thing hanging from a hand would go below the ground (y = 0 in a character's own
 * space), so it can be lifted to rest on it. A low hand, as when sitting, is the usual cause.
 */
const sunk = (handY: number, drop: number): number => Math.max(0, handY + drop);

/** Props that hang down from the hand that holds them. */
export const HANGING: readonly string[] = ['bag', 'lantern'];

const HELD: Record<string, HeldProp> = {
  scepter: (hands, info) => (
    <Scepter frame={hands.front} uid={info.uid} shadowSide={info.shadowSide} sway={info.sway} />
  ),
  sword: (hands, info) => (
    <InHand frame={hands.front}>
      <Sword uid={`${info.uid}-sword`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  shield: (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <Shield uid={`${info.uid}-shield`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  coin: (hands, info) => (
    <InHand frame={hands.front} how="upright" reach={0.24}>
      <Coin uid={`${info.uid}-coin`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  bag: (hands, info) => (
    <g transform={`translate(0 ${-sunk(hands.front.center.y, BAG_DROP)})`}>
      <InHand frame={hands.front} how="hang" sway={info.sway}>
        <Bag uid={`${info.uid}-bag`} shadowSide={info.shadowSide} />
      </InHand>
    </g>
  ),
  book: (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <Book uid={`${info.uid}-book`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  'book-open': (hands, info) => (
    <g transform={`translate(${hands.front.center.x + 0.1} ${hands.front.center.y - 0.3})`}>
      <g transform="scale(0.8)">
        <Book uid={`${info.uid}-book`} shadowSide={info.shadowSide} open />
      </g>
    </g>
  ),
  lantern: (hands, info) => (
    <g transform={`translate(0 ${-sunk(hands.front.center.y, LANTERN_DROP)})`}>
      <InHand frame={hands.front} how="hang" sway={info.sway}>
        <Lantern uid={`${info.uid}-lantern`} shadowSide={info.shadowSide} />
      </InHand>
    </g>
  ),
  cup: (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <Cup uid={`${info.uid}-cup`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  goblet: (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <Cup uid={`${info.uid}-goblet`} shadowSide={info.shadowSide} kind="goblet" />
    </InHand>
  ),
};

/**
 * How high off the ground a hand takes hold of a thing standing there, in head units: the neck
 * of a bag, the ring of a lantern, low down for anything else.
 */
export const gripHeight = (id: string): number =>
  id === 'bag' ? BAG_DROP : id === 'lantern' ? LANTERN_DROP : 0.3;

/** Props a hand must close round: the held hand becomes a gripping fist. */
export const GRIPPED: readonly string[] = ['scepter', 'sword', 'bag', 'lantern', 'cup', 'goblet'];

/** Props someone sits on: they take their place, their facing and their size from the sitter. */
export const SEATS: readonly string[] = ['chair', 'throne'];

/** The library props an actor can hold. */
export const HELD_PROPS: readonly string[] = Object.keys(HELD);

export const heldProp = (id: string): HeldProp | undefined => HELD[id];

type Standing = {
  /**
   * The prop, drawn in head units with the ground at y = 0 under its middle. `t` is seconds
   * since the scene began; `shotT` is seconds since the shot began, for a thing that happens
   * once, like an explosion.
   */
  draw: (uid: string, t: number, shotT: number) => ReactNode;
  /** A thing of the sky: how high its middle hangs, in heads, when a shot does not say. */
  hangs?: number;
  /** Roughly how high the middle of the thing is, in head units: where eyes go to look at it. */
  eyeHeight: number;
  /** Drawn before the people (something to sit on or stand in front of) or after them. */
  behindPeople: boolean;
};

const lift = (by: number, node: ReactNode) => <g transform={`translate(0 ${-by})`}>{node}</g>;

const STANDING: Record<string, Standing> = {
  chair: { draw: (uid) => <Chair uid={uid} shadowSide={1} />, eyeHeight: 0.9, behindPeople: true },
  throne: {
    draw: (uid) => <Chair uid={uid} shadowSide={1} kind="throne" />,
    eyeHeight: 1.4,
    behindPeople: true,
  },
  door: { draw: (uid) => <Door uid={uid} shadowSide={1} />, eyeHeight: 2.2, behindPeople: true },
  table: {
    draw: (uid) => <Table uid={uid} shadowSide={1} width={1.5} />,
    eyeHeight: 1.1,
    behindPeople: false,
  },
  bag: {
    draw: (uid) => lift(BAG_DROP, <Bag uid={uid} shadowSide={1} />),
    eyeHeight: 0.45,
    behindPeople: false,
  },
  lantern: {
    draw: (uid, t) => lift(LANTERN_DROP, <Lantern uid={uid} shadowSide={1} t={t} />),
    eyeHeight: 0.45,
    behindPeople: false,
  },
  coin: {
    draw: (uid) => lift(COIN_RADIUS, <Coin uid={uid} shadowSide={1} />),
    eyeHeight: 0.17,
    behindPeople: false,
  },
  cup: {
    draw: (uid) => lift(CUP_REST.mug, <Cup uid={uid} shadowSide={1} />),
    eyeHeight: 0.2,
    behindPeople: false,
  },
  goblet: {
    draw: (uid) => lift(CUP_REST.goblet, <Cup uid={uid} shadowSide={1} kind="goblet" />),
    eyeHeight: 0.3,
    behindPeople: false,
  },
  book: {
    draw: (uid) => lift(BOOK.height / 2, <Book uid={uid} shadowSide={1} />),
    eyeHeight: 0.35,
    behindPeople: false,
  },
  'book-open': {
    draw: (uid) => lift(0.3, <Book uid={uid} shadowSide={1} open />),
    eyeHeight: 0.3,
    behindPeople: false,
  },
  shield: {
    draw: (uid) => lift(SHIELD.height / 2, <Shield uid={uid} shadowSide={1} />),
    eyeHeight: 0.57,
    behindPeople: false,
  },
  sword: {
    // Stuck upright in the ground, point down.
    draw: (uid) => (
      <g transform="translate(0 -1.5) rotate(90)">
        <Sword uid={uid} shadowSide={1} />
      </g>
    ),
    eyeHeight: 1,
    behindPeople: false,
  },
};

/**
 * The things of the sky and of the science videos, each round its own middle. In a wide frame
 * the sky of a wide shot is about five heads tall, so they hang a little over three heads up.
 */
const sky = (hangs: number, draw: Standing['draw'], behindPeople = true): Standing => ({
  draw,
  hangs,
  eyeHeight: 0,
  behindPeople,
});
Object.assign(STANDING, {
  sun: sky(3.3, (uid, t) => <Sun uid={uid} shadowSide={1} t={t} r={1.15} />),
  'full-moon': sky(3.4, (uid) => <FullMoon uid={uid} shadowSide={1} paint="gray" />),
  earth: sky(3.1, (uid, t) => <Earth uid={uid} shadowSide={1} t={t} />),
  planet: sky(3.3, (uid) => <Planet uid={uid} shadowSide={1} />),
  'planet-ringed': sky(3.3, (uid) => (
    <Planet uid={uid} shadowSide={1} paint="tan" bands ring="cream" />
  )),
  'planet-giant': sky(3.1, (uid) => (
    <Planet uid={uid} shadowSide={1} paint="brown" bands r={1.5} />
  )),
  'planet-ice': sky(3.3, (uid) => <Planet uid={uid} shadowSide={1} paint="glint" />),
  asteroid: sky(3.6, (uid, t) => <Asteroid uid={uid} shadowSide={1} t={t} />),
  'black-hole': sky(3.2, (uid, t) => <BlackHole uid={uid} shadowSide={1} t={t} />),
  'rocket-flying': sky(2.6, (uid, t) => (
    <g transform="rotate(28) translate(0 1.6)">
      <Rocket uid={uid} shadowSide={1} flame={1} t={t} />
    </g>
  )),
  rocket: {
    draw: (uid) => <Rocket uid={uid} shadowSide={1} />,
    eyeHeight: 1.8,
    behindPeople: true,
  },
  // An explosion goes off as its shot begins. It is in front of people: it is what the shot shows.
  explosion: sky(1.6, (_uid, _t, shotT) => <Explosion t={shotT} size={2} />, false),
  fire: {
    draw: (_uid, t) => <Fire t={t} smoke />,
    eyeHeight: 0.7,
    behindPeople: true,
  },
  smoke: {
    draw: (_uid, t) => <Smoke t={t} />,
    eyeHeight: 1.6,
    behindPeople: true,
  },
} satisfies Record<string, Standing>);

/** How long an explosion placed in a shot is on screen, in seconds. */
export const BLAST_SECONDS = EXPLOSION_SECONDS;

/** The library props that can stand in a scene. */
export const STANDING_PROPS: readonly string[] = Object.keys(STANDING);

export const standingProp = (id: string): Standing | undefined => STANDING[id];

/** One prop standing on the ground of a scene at screen point x, groundY. */
export function StandingProp({
  id,
  uid,
  x,
  groundY,
  head,
  t,
  shotT = t,
  flip = false,
  up,
  size = 1,
}: {
  id: string;
  uid: string;
  x: number;
  groundY: number;
  head: number;
  /** Seconds since the scene began, for a flame that flickers or a planet that turns. */
  t: number;
  /** Seconds since the shot began, for a thing that happens once. */
  shotT?: number;
  flip?: boolean;
  /** How high its middle is off the ground, in heads. Left out, its usual height. */
  up?: number | undefined;
  /** Bigger or smaller than drawn. */
  size?: number | undefined;
}) {
  const prop = STANDING[id];
  if (!prop) return null;
  const lifted = up ?? prop.hangs ?? 0;
  return (
    <Placed x={x} y={groundY - lifted * head} head={head * size} flip={flip}>
      {prop.draw(uid, t, shotT)}
    </Placed>
  );
}

/** How high a thing placed in a shot is off the ground, in heads. */
export const propHeight = (p: { prop: string; y?: number | undefined }): number =>
  p.y ?? STANDING[p.prop]?.hangs ?? 0;
