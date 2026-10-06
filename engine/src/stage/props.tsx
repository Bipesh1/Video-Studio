import type { ReactNode } from 'react';
import { Bag, BAG_DROP } from '../props/Bag';
import { BOOK, Book } from '../props/Book';
import { Chair } from '../props/Chair';
import { COIN_RADIUS, Coin } from '../props/Coin';
import { CUP_REST, Cup } from '../props/Cup';
import { Door } from '../props/Door';
import { InHand, Placed } from '../props/Hold';
import { LANTERN_DROP, Lantern } from '../props/Lantern';
import { Scepter } from '../props/Scepter';
import { SHIELD, Shield } from '../props/Shield';
import { Sword } from '../props/Sword';
import { Table } from '../props/Table';
import type { CharacterProps } from '../rig/Character';

/**
 * Props by their library name, for a storyboard: how each one sits in a hand (`holds` on an
 * actor) and how each one stands in a scene (`props` on a shot). The props themselves are
 * drawn in `engine/src/props/`; this only knows how to put each one where a shot asks.
 */

type HeldProp = NonNullable<CharacterProps['prop']>;

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
    <InHand frame={hands.front} how="hang" sway={info.sway}>
      <Bag uid={`${info.uid}-bag`} shadowSide={info.shadowSide} />
    </InHand>
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
    <InHand frame={hands.front} how="hang" sway={info.sway}>
      <Lantern uid={`${info.uid}-lantern`} shadowSide={info.shadowSide} />
    </InHand>
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

/** Props a hand must close round: the held hand becomes a gripping fist. */
export const GRIPPED: readonly string[] = ['scepter', 'sword', 'bag', 'lantern', 'cup', 'goblet'];

/** The library props an actor can hold. */
export const HELD_PROPS: readonly string[] = Object.keys(HELD);

export const heldProp = (id: string): HeldProp | undefined => HELD[id];

type Standing = {
  /** The prop, drawn in head units with the ground at y = 0 under its middle. */
  draw: (uid: string, t: number) => ReactNode;
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
  flip = false,
}: {
  id: string;
  uid: string;
  x: number;
  groundY: number;
  head: number;
  /** Seconds, for a flame that flickers. */
  t: number;
  flip?: boolean;
}) {
  const prop = STANDING[id];
  if (!prop) return null;
  return (
    <Placed x={x} y={groundY} head={head} flip={flip}>
      {prop.draw(uid, t)}
    </Placed>
  );
}
