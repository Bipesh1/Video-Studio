import { TORCH_FLAMES, Torch } from '../props/Torch';
import type { ReactNode } from 'react';
import {
  BANKNOTE,
  Banknote,
  CashJar,
  GavelHand,
  PADDLE_MARKS,
  Paddle,
  Podium,
  gavelLiftAt,
  gavelRiseAt,
} from '../props/Auction';
import { Bag, BAG_DROP } from '../props/Bag';
import {
  BILL,
  Bill,
  Bills,
  Bread,
  Coal,
  CoinStack,
  ENVELOPE,
  Envelope,
  FuelCan,
} from '../props/Bill';
import { BOOK, Book } from '../props/Book';
import { Chair } from '../props/Chair';
import { BACK_ROW, BackRow } from '../props/Crowd';
import { WristChains } from '../props/Chains';
import { COIN_RADIUS, Coin } from '../props/Coin';
import { Crate } from '../props/Crate';
import { CUP_REST, Cup } from '../props/Cup';
import {
  EXPLOSION_SECONDS,
  Explosion,
  Fire,
  SMOKE_LEVELS,
  Smoke,
  SmokeBank,
  smokeRise,
} from '../effects/Blast';
import {
  DiningTable,
  LobsterPlate,
  LongBill,
  Menu,
  SaladPlate,
  WaterGlass,
  WaterJug,
} from '../props/Dinner';
import { CAR_PAINTS, Car } from '../props/Car';
import { NoticeBoard } from '../props/Daycare';
import { Door } from '../props/Door';
import { CashPile, GameTable, GoldenBall, ballOpenAt } from '../props/Game';
import { InHand, Placed } from '../props/Hold';
import { ChatBubbles, Phone, WallClock } from '../props/Home';
import {
  CABINET,
  COUNTER,
  DrawerCabinet,
  KitchenCounter,
  NotebookHeld,
  NotebookLying,
  NotebookOpen,
  Plate,
  SeasonWindow,
  SharesPlate,
  SplitLight,
  drawerOpenAt,
  notebookDropAt,
  seasonAt,
} from '../props/Kitchen';
import { LANTERN_DROP, Lantern } from '../props/Lantern';
import { Rocket } from '../props/Rocket';
import { BlackHoleGlow } from '../props/BlackHoleGlow';
import { BreathCloud } from '../props/BreathCloud';
import { FoodBreathCloud, XrayFat } from '../props/FoodBreath';
import { Bulb, Gloom, flickerAt } from '../props/Room';
import { Scepter } from '../props/Scepter';
import { SHIELD, Shield } from '../props/Shield';
import { Asteroid, BlackHole, Earth, FullMoon, Planet, Sun } from '../props/Sky';
import { Sword } from '../props/Sword';
import { Table } from '../props/Table';
import { RopeBarrier, Wagon } from '../props/Wagon';
import { RainCloud, Wind } from '../props/Weather';
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
  // A kitchen at home (2026-10-20): a clean plate, and the two notebooks, shut or open to write.
  plate: (hands, info) => (
    <InHand frame={hands.front} how="upright" reach={0.12}>
      <Plate uid={`${info.uid}-plate`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  'notebook-blue': (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <NotebookHeld uid={`${info.uid}-nb`} shadowSide={info.shadowSide} paint="blue" />
    </InHand>
  ),
  'notebook-orange': (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <NotebookHeld uid={`${info.uid}-nb`} shadowSide={info.shadowSide} paint="orange" />
    </InHand>
  ),
  'notebook-blue-open': (hands, info) => (
    <g transform={`translate(${hands.front.center.x + 0.08} ${hands.front.center.y - 0.22})`}>
      <NotebookOpen uid={`${info.uid}-nbo`} shadowSide={info.shadowSide} paint="blue" />
    </g>
  ),
  'notebook-orange-open': (hands, info) => (
    <g transform={`translate(${hands.front.center.x + 0.08} ${hands.front.center.y - 0.22})`}>
      <NotebookOpen uid={`${info.uid}-nbo`} shadowSide={info.shadowSide} paint="orange" />
    </g>
  ),
  // Held up by a corner, at the fingertips, so the whole of it shows beside the hand.
  envelope: (hands, info) => (
    <InHand frame={hands.front} how="upright" reach={0.2}>
      <Envelope uid={`${info.uid}-envelope`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  bill: (hands, info) => (
    <InHand frame={hands.front} how="upright" reach={0.26}>
      <Bill uid={`${info.uid}-bill`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  // Held up by a corner, like the bill, so the whole note shows beside the hand.
  banknote: (hands, info) => (
    <InHand frame={hands.front} how="upright" reach={0.12}>
      <g transform={`scale(${info.shadowSide} 1)`}>
        <Banknote uid={`${info.uid}-note`} shadowSide={1} />
      </g>
    </InHand>
  ),
  // A bidding paddle keeps its face to us, above the fist that holds it. Each bid is its own
  // paddle by name.
  ...Object.fromEntries(
    Object.entries(PADDLE_MARKS).map(([name, mark]): [string, HeldProp] => [
      name,
      (hands, info) => (
        <InHand frame={hands.front} how="upright">
          {/* Its holder may face left, which would turn the writing round: turn it back. */}
          <g transform={`scale(${info.shadowSide} 1)`}>
            <Paddle uid={`${info.uid}-paddle`} shadowSide={1} mark={mark} />
          </g>
        </InHand>
      ),
    ]),
  ),
  // A phone in a fist, its screen to us whichever way its holder faces.
  phone: (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <Phone uid={`${info.uid}-phone`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  // A burning torch held upright, its flame as much as the story has left: torch, then
  // torch-low, torch-dying, torch-out.
  ...Object.fromEntries(
    Object.entries(TORCH_FLAMES).map(([name, flame]): [string, HeldProp] => [
      name,
      (hands, info) => (
        <InHand frame={hands.front} how="upright">
          <Torch
            uid={`${info.uid}-torch`}
            shadowSide={info.shadowSide}
            flame={flame}
            t={info.t ?? 0}
          />
        </InHand>
      ),
    ]),
  ),
  // A dinner out (the comedy short of the split bill): a menu held up, the waiter's jug.
  menu: (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <Menu uid={`${info.uid}-menu`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  'water-jug': (hands, info) => (
    <InHand frame={hands.front} how="upright">
      <WaterJug uid={`${info.uid}-jug`} shadowSide={info.shadowSide} />
    </InHand>
  ),
  // Worn on both wrists, not held: the chain hangs between the two hands.
  chains: (hands, info) => (
    <WristChains hands={hands} uid={`${info.uid}-chains`} shadowSide={info.shadowSide} />
  ),
};

/**
 * How high off the ground a hand takes hold of a thing standing there, in head units: the neck
 * of a bag, the ring of a lantern, low down for anything else.
 */
export const gripHeight = (id: string): number =>
  id === 'bag' ? BAG_DROP : id === 'lantern' ? LANTERN_DROP : 0.3;

/** Props a hand must close round: the held hand becomes a gripping fist. */
export const GRIPPED: readonly string[] = [
  'scepter',
  'sword',
  'bag',
  'lantern',
  'cup',
  'goblet',
  ...Object.keys(PADDLE_MARKS),
  'phone',
  ...Object.keys(TORCH_FLAMES),
  'menu',
  'water-jug',
];

/** Props someone sits on: they take their place, their facing and their size from the sitter. */
export const SEATS: readonly string[] = ['chair', 'throne', 'sofa', 'iron-chair'];

/**
 * Furniture: part of the room. The camera does not move back to fit it in, and it may run off
 * the edge of a narrow picture like the walls do.
 */
export const SCENERY: readonly string[] = [
  ...SEATS,
  'door',
  'table',
  'iron-table',
  'game-table',
  'dining-table',
  'kitchen-sink',
  'kitchen-sink-done',
  'drawer-cabinet',
  'drawer-cabinet-opening',
  'drawer-cabinet-open',
  'drawer-cabinet-empty',
  'gloom-split',
  'podium',
  'gloom',
  'gloom-flicker',
  'smoke-creeping',
  'smoke-low',
  'smoke-rising',
  'smoke-table',
  'smoke-filling',
  'smoke-high',
  'back-row',
  'back-row-raising',
  'back-row-raised',
  'back-row-turned',
  'house-row',
  'house-row-raising',
  'house-row-raised',
  'house-row-turned',
];

/** The library props an actor can hold. */
export const HELD_PROPS: readonly string[] = Object.keys(HELD);

export const heldProp = (id: string): HeldProp | undefined => HELD[id];

/** How much larger a torch planted in the ground is drawn than one held in a fist. */
const PLANTED = 1.7;

/** The wall clock at set times, by name: its time in hours, and where it creeps on to. */
const CLOCK_TIMES: ReadonlyArray<readonly [string, number, number | undefined]> = [
  ['wall-clock-3-55', 3 + 55 / 60, undefined],
  ['wall-clock-4-00', 4, undefined],
  ['wall-clock-4-15', 4.25, undefined],
  ['wall-clock-4-20', 4 + 20 / 60, undefined],
  ['wall-clock-4-30', 4.5, undefined],
  ['wall-clock-4-40', 4 + 40 / 60, undefined],
  ['wall-clock-to-4-40', 4 + 35 / 60, 4 + 40 / 60],
];

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
  sofa: {
    draw: (uid) => <Chair uid={uid} shadowSide={1} kind="sofa" />,
    eyeHeight: 1,
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
  // Lying on the floor or a table, its glow lighting what is round it.
  envelope: {
    draw: (uid, t) => lift(ENVELOPE.height / 2, <Envelope uid={uid} shadowSide={1} t={t} />),
    eyeHeight: 0.22,
    behindPeople: false,
  },
  bill: {
    draw: (uid) => lift(BILL.height / 2, <Bill uid={uid} shadowSide={1} />),
    eyeHeight: 0.35,
    behindPeople: false,
  },
  bills: {
    draw: (uid) => <Bills uid={uid} shadowSide={1} />,
    eyeHeight: 0.15,
    behindPeople: false,
  },
  'coin-stack': {
    draw: (uid) => <CoinStack uid={uid} shadowSide={1} coins={12} />,
    eyeHeight: 0.5,
    behindPeople: true,
  },
  'coin-tower': {
    draw: (uid) => <CoinStack uid={uid} shadowSide={1} coins={48} />,
    eyeHeight: 1.9,
    behindPeople: true,
  },
  coal: { draw: (uid) => <Coal uid={uid} shadowSide={1} />, eyeHeight: 0.25, behindPeople: false },
  'fuel-can': {
    draw: (uid) => <FuelCan uid={uid} shadowSide={1} />,
    eyeHeight: 0.4,
    behindPeople: false,
  },
  bread: {
    draw: (uid) => <Bread uid={uid} shadowSide={1} />,
    eyeHeight: 0.22,
    behindPeople: false,
  },
  // A closed crate hides whoever stands at its place; the cutaway is drawn behind them, so
  // the person folded up inside it shows.
  crate: {
    draw: (uid) => <Crate uid={uid} shadowSide={1} />,
    eyeHeight: 1.1,
    behindPeople: false,
  },
  'crate-upside-down': {
    draw: (uid) => <Crate uid={uid} shadowSide={1} inverted />,
    eyeHeight: 1.1,
    behindPeople: false,
  },
  'crate-cutaway': {
    draw: (uid) => <Crate uid={uid} shadowSide={1} cutaway />,
    eyeHeight: 1.1,
    behindPeople: true,
  },
  'crate-cutaway-upside-down': {
    draw: (uid) => <Crate uid={uid} shadowSide={1} cutaway inverted />,
    eyeHeight: 1.1,
    behindPeople: true,
  },
  // In front of the people riding in it: its side hides their legs.
  wagon: { draw: (uid) => <Wagon uid={uid} shadowSide={1} />, eyeHeight: 1.2, behindPeople: false },
  'rope-barrier': {
    draw: (uid) => <RopeBarrier uid={uid} shadowSide={1} />,
    eyeHeight: 1,
    behindPeople: false,
  },
  wind: sky(2.4, (_uid, t) => <Wind t={t} />),
  // The game across a table. A ball named "-opening" opens a moment into its shot; the others
  // are shut, or already open on their word.
  'game-table': {
    draw: (uid) => <GameTable uid={uid} shadowSide={1} />,
    eyeHeight: 1.2,
    behindPeople: false,
  },
  'golden-ball': {
    draw: (uid) => <GoldenBall uid={uid} shadowSide={1} />,
    eyeHeight: 0.2,
    behindPeople: false,
  },
  'ball-split': {
    draw: (uid) => <GoldenBall uid={uid} shadowSide={1} word="split" />,
    eyeHeight: 0.3,
    behindPeople: false,
  },
  'ball-steal': {
    draw: (uid) => <GoldenBall uid={uid} shadowSide={1} word="steal" />,
    eyeHeight: 0.3,
    behindPeople: false,
  },
  'ball-split-opening': {
    draw: (uid, _t, shotT) => (
      <GoldenBall uid={uid} shadowSide={1} word="split" open={ballOpenAt(shotT)} />
    ),
    eyeHeight: 0.3,
    behindPeople: false,
  },
  'ball-steal-opening': {
    draw: (uid, _t, shotT) => (
      <GoldenBall uid={uid} shadowSide={1} word="steal" open={ballOpenAt(shotT)} />
    ),
    eyeHeight: 0.3,
    behindPeople: false,
  },
  'cash-pile': {
    draw: (uid) => <CashPile uid={uid} shadowSide={1} />,
    eyeHeight: 0.4,
    behindPeople: false,
  },
  'cash-half': {
    draw: (uid) => <CashPile uid={uid} shadowSide={1} columns={1} />,
    eyeHeight: 0.2,
    behindPeople: false,
  },
  // An auction. The gloved hand comes up from behind the podium: list it before the podium, at
  // the height of the podium's top. One named "-knock" strikes a moment into its shot.
  podium: {
    draw: (uid) => <Podium uid={uid} shadowSide={1} />,
    eyeHeight: 1.5,
    behindPeople: false,
  },
  gavel: {
    draw: (uid) => <GavelHand uid={uid} shadowSide={1} />,
    eyeHeight: 0.3,
    behindPeople: false,
  },
  'gavel-raised': {
    draw: (uid) => <GavelHand uid={uid} shadowSide={1} lift={1} />,
    eyeHeight: 0.5,
    behindPeople: false,
  },
  'gavel-rise': {
    draw: (uid, _t, shotT) => <GavelHand uid={uid} shadowSide={1} lift={gavelRiseAt(shotT)} />,
    eyeHeight: 0.5,
    behindPeople: false,
  },
  'gavel-knock': {
    draw: (uid, _t, shotT) => <GavelHand uid={uid} shadowSide={1} lift={gavelLiftAt(shotT)} />,
    eyeHeight: 0.3,
    behindPeople: false,
  },
  // The jar the money ends up in: behind the podium, the auctioneer's other hand on its lid.
  'cash-jar': {
    draw: (uid) => <CashJar uid={uid} shadowSide={1} hand />,
    eyeHeight: 1.6,
    behindPeople: true,
  },
  'cash-jar-low': {
    draw: (uid) => <CashJar uid={uid} shadowSide={1} holds="coins" />,
    eyeHeight: 1.6,
    behindPeople: true,
  },
  banknote: {
    draw: (uid) => lift(BANKNOTE.height / 2, <Banknote uid={uid} shadowSide={1} />),
    eyeHeight: 0.21,
    behindPeople: false,
  },
  'banknote-20': {
    draw: (uid) => lift(BANKNOTE.height / 2, <Banknote uid={uid} shadowSide={1} worth="20" />),
    eyeHeight: 0.21,
    behindPeople: false,
  },
  // Bare grey metal, for the dark room of the game theory videos.
  'iron-chair': {
    draw: (uid) => <Chair uid={uid} shadowSide={1} made="iron" />,
    eyeHeight: 0.9,
    behindPeople: true,
  },
  'iron-table': {
    draw: (uid) => <Table uid={uid} shadowSide={1} width={1.5} made="iron" />,
    eyeHeight: 1.1,
    behindPeople: false,
  },
  // The others in the room: four plain figures on a step along the back wall. A house row wears
  // gold badges. Raising, their hands go up one after another over the shot; raised keeps them up.
  'back-row': {
    draw: (uid) => <BackRow uid={uid} shadowSide={1} state="calm" />,
    eyeHeight: 3.7,
    behindPeople: true,
  },
  'back-row-raising': {
    draw: (uid, _t, shotT) => <BackRow uid={uid} shadowSide={1} state="raising" shotT={shotT} />,
    eyeHeight: 3.7,
    behindPeople: true,
  },
  'back-row-raised': {
    draw: (uid) => <BackRow uid={uid} shadowSide={1} state="raised" />,
    eyeHeight: 3.7,
    behindPeople: true,
  },
  'back-row-turned': {
    draw: (uid) => <BackRow uid={uid} shadowSide={1} state="turned" />,
    eyeHeight: 3.7,
    behindPeople: true,
  },
  'house-row': {
    draw: (uid) => <BackRow uid={uid} shadowSide={1} state="calm" badged />,
    eyeHeight: 3.7,
    behindPeople: true,
  },
  'house-row-raising': {
    draw: (uid, _t, shotT) => (
      <BackRow uid={uid} shadowSide={1} state="raising" badged shotT={shotT} />
    ),
    eyeHeight: 3.7,
    behindPeople: true,
  },
  'house-row-raised': {
    draw: (uid) => <BackRow uid={uid} shadowSide={1} state="raised" badged />,
    eyeHeight: 3.7,
    behindPeople: true,
  },
  'house-row-turned': {
    draw: (uid) => <BackRow uid={uid} shadowSide={1} state="turned" badged />,
    eyeHeight: 3.7,
    behindPeople: true,
  },
  // Smoke filling the room from the floor up, in front of everyone: creeping in from the left,
  // lying along the floor, rising to the table, at the table, filling to the shoulders, there.
  'smoke-creeping': {
    draw: (_uid, t, shotT) => (
      <SmokeBank t={t} height={SMOKE_LEVELS.low} reach={smokeRise(0.02, 1, shotT, 3)} />
    ),
    eyeHeight: 0.3,
    behindPeople: false,
  },
  'smoke-low': {
    draw: (_uid, t) => <SmokeBank t={t} height={SMOKE_LEVELS.low} />,
    eyeHeight: 0.3,
    behindPeople: false,
  },
  'smoke-rising': {
    draw: (_uid, t, shotT) => (
      <SmokeBank t={t} height={smokeRise(SMOKE_LEVELS.low, SMOKE_LEVELS.table, shotT)} />
    ),
    eyeHeight: 0.8,
    behindPeople: false,
  },
  'smoke-table': {
    draw: (_uid, t) => <SmokeBank t={t} height={SMOKE_LEVELS.table} />,
    eyeHeight: 1,
    behindPeople: false,
  },
  'smoke-filling': {
    draw: (_uid, t, shotT) => (
      <SmokeBank t={t} height={smokeRise(SMOKE_LEVELS.table, SMOKE_LEVELS.high, shotT)} />
    ),
    eyeHeight: 1.3,
    behindPeople: false,
  },
  'smoke-high': {
    draw: (_uid, t) => <SmokeBank t={t} height={SMOKE_LEVELS.high} />,
    eyeHeight: 1.4,
    behindPeople: false,
  },
  // The one light of a dark room, hanging over the table.
  bulb: sky(4.3, (uid, t) => <Bulb uid={uid} shadowSide={1} t={t} />),
  // The bulb failing: it stutters through its shot, or burns low. With it, list a gloom after
  // everything else in the shot, so the room darkens as the light goes.
  'bulb-flicker': sky(4.3, (uid, _t, shotT) => (
    <Bulb uid={uid} shadowSide={1} on={flickerAt(shotT)} />
  )),
  'bulb-dim': sky(4.3, (uid, t) => <Bulb uid={uid} shadowSide={1} on={0.15} t={t} />),
  gloom: { draw: () => <Gloom />, eyeHeight: 0, behindPeople: false },
  'gloom-flicker': {
    draw: (_uid, _t, shotT) => <Gloom depth={0.5 * (1 - flickerAt(shotT))} />,
    eyeHeight: 0,
    behindPeople: false,
  },
  // An evening on the phone: the chat fills up over its shot, and the clock's hands run away.
  'chat-bubbles': sky(
    2.9,
    (uid, _t, shotT) => <ChatBubbles uid={uid} shadowSide={1} shotT={shotT} />,
    false,
  ),
  // Every message up from the start: for the shot after the one they arrived in.
  'chat-full': sky(2.9, (uid) => <ChatBubbles uid={uid} shadowSide={1} />, false),
  'wall-clock': sky(3.1, (uid) => <WallClock uid={uid} shadowSide={1} />),
  'wall-clock-spinning': sky(3.1, (uid, _t, shotT) => (
    <WallClock uid={uid} shadowSide={1} shotT={shotT} />
  )),
  // A daycare at closing time (the late fine, 2026-10-17): the clock over the door at set
  // times, the last one creeping on to twenty to five over its shot.
  ...Object.fromEntries(
    CLOCK_TIMES.map(([name, at, until]) => [
      name,
      sky(3.1, (uid: string, _t: number, shotT: number) => (
        <WallClock uid={uid} shadowSide={1} at={at} until={until} shotT={shotT} />
      )),
    ]),
  ),
  // A street of stuck traffic: a car facing right, in four colours (`car` is blue). Someone
  // sitting at its x shows through the windows; list the car after them.
  ...Object.fromEntries(
    CAR_PAINTS.map((paint) => [
      paint === 'ocean' ? 'car' : `car-${paint}`,
      {
        draw: (uid: string) => <Car uid={uid} shadowSide={1} paint={paint} />,
        eyeHeight: 1.6,
        behindPeople: false,
      },
    ]),
  ),
  // The notice board by its door, hung at eye height: empty, the fine pinned up half a second
  // into its shot, the fine, and the fine taken back.
  'notice-board': sky(2.5, (uid) => <NoticeBoard uid={uid} shadowSide={1} />),
  'notice-board-fine-pinning': sky(2.5, (uid, _t, shotT) => (
    <NoticeBoard uid={uid} shadowSide={1} note="fine" pinT={shotT} />
  )),
  'notice-board-fine': sky(2.5, (uid) => <NoticeBoard uid={uid} shadowSide={1} note="fine" />),
  'notice-board-no-fine': sky(2.5, (uid) => (
    <NoticeBoard uid={uid} shadowSide={1} note="no-fine" />
  )),
  'rain-cloud': sky(3.6, (uid, t) => <RainCloud uid={uid} shadowSide={1} t={t} />),
  // An explosion goes off as its shot begins. It is in front of people: it is what the shot shows.
  explosion: sky(1.6, (_uid, _t, shotT) => <Explosion t={shotT} size={2} />, false),
  // A dinner out. The table is drawn after whoever sits at it; things stand on its top at
  // y = 1.22. The long bill runs out over its shot from the table's right end (stand it at the
  // table's x); `bill-long-out` is the same bill already all the way out, for the shots after.
  'dining-table': {
    draw: (uid) => <DiningTable uid={uid} shadowSide={1} />,
    eyeHeight: 1.2,
    behindPeople: false,
  },
  'plate-salad': {
    draw: (uid) => <SaladPlate uid={uid} shadowSide={1} />,
    eyeHeight: 0.1,
    behindPeople: false,
  },
  'plate-lobster': {
    draw: (uid) => <LobsterPlate uid={uid} shadowSide={1} />,
    eyeHeight: 0.2,
    behindPeople: false,
  },
  'water-glass': {
    draw: (uid) => <WaterGlass uid={uid} shadowSide={1} />,
    eyeHeight: 0.15,
    behindPeople: false,
  },
  'bill-long': {
    draw: (uid, _t, shotT) => <LongBill uid={uid} shadowSide={1} shotT={shotT} />,
    eyeHeight: 1.2,
    behindPeople: false,
  },
  'bill-long-out': {
    draw: (uid) => <LongBill uid={uid} shadowSide={1} />,
    eyeHeight: 0.6,
    behindPeople: false,
  },
  fire: {
    draw: (_uid, t) => <Fire t={t} smoke />,
    eyeHeight: 0.7,
    behindPeople: true,
  },
  // A burning torch planted upright in the ground, the same torch as the one held, drawn larger:
  // for a picture where nobody can hold it (a thumbnail of the bridge thriller, 2026-10-16).
  'torch-planted': {
    draw: (uid, t) => (
      <g transform={`translate(0 ${-0.42 * PLANTED}) scale(${PLANTED})`}>
        <Torch uid={`${uid}-torch`} shadowSide={1} flame={1} t={t} />
      </g>
    ),
    eyeHeight: 1.6,
    behindPeople: false,
  },
  smoke: {
    draw: (_uid, t) => <Smoke t={t} />,
    eyeHeight: 1.6,
    behindPeople: true,
  },
  // A kitchen at home (2026-10-20). The counter stands behind whoever works at it; its top is at
  // y = 1.75, where a notebook can lie. The notebooks lie shut on a table (y = 1.22) or the
  // counter; `notebook-blue-landing` drops onto its place as its shot begins. The window hangs
  // on the wall: the seasons pass in `window-seasons` over its shot. The cabinet's drawer opens
  // half a second into `drawer-cabinet-opening` on his orange notebook. The shared plate hangs in
  // front of the scene; the split light goes after everyone, its middle between the two people.
  'kitchen-sink': {
    draw: (uid) => <KitchenCounter uid={uid} shadowSide={1} />,
    eyeHeight: COUNTER.top,
    behindPeople: true,
  },
  'kitchen-sink-done': {
    draw: (uid) => <KitchenCounter uid={uid} shadowSide={1} dishes={1} />,
    eyeHeight: COUNTER.top,
    behindPeople: true,
  },
  'notebook-blue': {
    draw: (uid) => <NotebookLying uid={uid} shadowSide={1} paint="blue" />,
    eyeHeight: 0.1,
    behindPeople: false,
  },
  'notebook-orange': {
    draw: (uid) => <NotebookLying uid={uid} shadowSide={1} paint="orange" />,
    eyeHeight: 0.1,
    behindPeople: false,
  },
  'notebook-blue-landing': {
    draw: (uid, _t, shotT) => {
      const at = notebookDropAt(shotT);
      return (
        <g transform={`translate(0 ${-at.up}) rotate(${at.turn})`} opacity={at.seen}>
          <NotebookLying uid={uid} shadowSide={1} paint="blue" />
        </g>
      );
    },
    eyeHeight: 0.1,
    behindPeople: false,
  },
  // The open notebooks standing up on their own, for a poster: held up, their tally to us.
  'notebook-blue-open': {
    draw: (uid) => lift(0.27, <NotebookOpen uid={uid} shadowSide={1} paint="blue" />),
    eyeHeight: 0.27,
    behindPeople: false,
  },
  'notebook-orange-open': {
    draw: (uid) => lift(0.27, <NotebookOpen uid={uid} shadowSide={1} paint="orange" />),
    eyeHeight: 0.27,
    behindPeople: false,
  },
  'window-seasons': sky(2.9, (uid, t, shotT) => (
    <SeasonWindow uid={uid} shadowSide={1} season={seasonAt(shotT)} t={t} />
  )),
  'window-night': sky(2.9, (uid, t) => (
    <SeasonWindow uid={uid} shadowSide={1} night season={3} t={t} />
  )),
  'window-winter': sky(2.9, (uid, t) => <SeasonWindow uid={uid} shadowSide={1} season={0} t={t} />),
  'window-autumn': sky(2.9, (uid, t) => <SeasonWindow uid={uid} shadowSide={1} season={3} t={t} />),
  'drawer-cabinet': {
    draw: (uid) => <DrawerCabinet uid={uid} shadowSide={1} />,
    eyeHeight: CABINET.height,
    behindPeople: true,
  },
  'drawer-cabinet-opening': {
    draw: (uid, _t, shotT) => <DrawerCabinet uid={uid} shadowSide={1} open={drawerOpenAt(shotT)} />,
    eyeHeight: CABINET.height,
    behindPeople: true,
  },
  'drawer-cabinet-open': {
    draw: (uid) => <DrawerCabinet uid={uid} shadowSide={1} open={1} />,
    eyeHeight: CABINET.height,
    behindPeople: true,
  },
  'drawer-cabinet-empty': {
    draw: (uid) => <DrawerCabinet uid={uid} shadowSide={1} open={1} holding={false} />,
    eyeHeight: CABINET.height,
    behindPeople: true,
  },
  'plate-shares': sky(
    2.2,
    (uid, _t, shotT) => <SharesPlate uid={uid} shadowSide={1} shotT={shotT} />,
    false,
  ),
  'gloom-split': { draw: (uid) => <SplitLight uid={uid} />, eyeHeight: 0, behindPeople: false },
  // The black hole at the What's the Catch? drawing bar (2026-10-21), the hole one head across,
  // its disk about seven: for a poster, behind whoever falls toward it.
  // The same, its middle exactly where it is placed: for a poster's thing layer.
  'black-hole-glow-centred': {
    draw: (uid, t) => <BlackHoleGlow cx={0} cy={0} R={0.5} t={t} u={1 / 300} uid={`${uid}-bh`} />,
    eyeHeight: 0,
    behindPeople: true,
  },
  'black-hole-glow': sky(2.6, (uid, t) => (
    <BlackHoleGlow cx={0} cy={0} R={0.5} t={t} u={1 / 300} uid={`${uid}-bh`} />
  )),
  // A big bright cloud of breath with a trail down to the mouth: for a poster, its middle where
  // it is placed.
  'breath-cloud': {
    draw: (uid, t) => <BreathCloud uid={uid} t={t} />,
    eyeHeight: 0,
    behindPeople: false,
  },
  // The same cloud full of food, and the mascot seen through with his fat leaving by the mouth:
  // the covers of the fat Short.
  'food-breath-cloud': {
    draw: (uid, t) => <FoodBreathCloud uid={uid} t={t} />,
    eyeHeight: 0,
    behindPeople: false,
  },
  'xray-fat': {
    draw: (uid, t) => <XrayFat uid={uid} t={t} />,
    eyeHeight: 0,
    behindPeople: false,
  },
} satisfies Record<string, Standing>);

type Reach = { side: number; up: number; down: number };
const stands = (side: number, up: number): Reach => ({ side, up, down: 0 });
const ball = (r: number, side = r): Reach => ({ side, up: r, down: r });

/**
 * How far each thing reaches from where it is placed, in heads: to each side, up and down. A
 * wide shot keeps this much of it in the picture, and the self-check measures it against the
 * frame. It is the body of the thing: a glow or a tail of fire may run past the edge.
 */
const REACH: Record<string, Reach> = {
  chair: stands(0.5, 1.6),
  throne: stands(0.7, 2.4),
  door: stands(0.8, 3.2),
  table: stands(0.85, 1.3),
  bag: stands(0.35, 0.7),
  lantern: stands(0.25, 0.7),
  coin: stands(0.2, 0.35),
  cup: stands(0.2, 0.4),
  goblet: stands(0.2, 0.55),
  book: stands(0.3, 0.5),
  'book-open': stands(0.4, 0.4),
  shield: stands(0.45, 1.15),
  sword: stands(0.3, 1.8),
  sun: ball(1.8),
  'full-moon': ball(1.1),
  earth: ball(1.6),
  planet: ball(1.2),
  'planet-ringed': ball(1.2, 2.45),
  'planet-giant': ball(1.5),
  'planet-ice': ball(1.2),
  asteroid: ball(0.8),
  'black-hole': ball(1.4, 3),
  'rocket-flying': { side: 1.2, up: 1.7, down: 1.9 },
  rocket: stands(0.75, 3.3),
  explosion: { side: 2, up: 2, down: 1.6 },
  fire: stands(0.9, 1.6),
  'dining-table': stands(1.55, 1.25),
  'plate-salad': stands(0.3, 0.2),
  'plate-lobster': stands(0.45, 0.6),
  'water-glass': stands(0.1, 0.35),
  'bill-long': stands(1.6, 1.3),
  'bill-long-out': stands(1.6, 1.3),
  'torch-planted': stands(0.3, 2.6),
  smoke: stands(0.8, 2.8),
  envelope: stands(0.33, 0.44),
  bill: stands(0.27, 0.7),
  bills: stands(0.4, 0.26),
  'coin-stack': stands(0.23, 1.0),
  'coin-tower': stands(0.23, 3.8),
  coal: stands(0.46, 0.5),
  'fuel-can': stands(0.38, 0.84),
  bread: stands(0.44, 0.44),
  crate: stands(1.25, 2.2),
  'crate-upside-down': stands(1.25, 2.2),
  'crate-cutaway': stands(1.25, 2.2),
  'crate-cutaway-upside-down': stands(1.25, 2.2),
  wagon: stands(1.65, 1.2),
  'rope-barrier': stands(1.1, 1.3),
  wind: { side: 1.3, up: 0.7, down: 0.6 },
  'game-table': stands(1.55, 1.25),
  'golden-ball': stands(0.2, 0.4),
  'ball-split': stands(0.2, 0.86),
  'ball-steal': stands(0.2, 0.86),
  'ball-split-opening': stands(0.2, 0.86),
  'ball-steal-opening': stands(0.2, 0.86),
  'cash-pile': stands(0.54, 0.78),
  'cash-half': stands(0.29, 0.78),
  'rain-cloud': { side: 1.15, up: 1.1, down: 1.3 },
  podium: stands(0.95, 1.5),
  'iron-chair': stands(0.5, 1.6),
  'iron-table': stands(0.85, 1.3),
  bulb: ball(0.25),
  'bulb-flicker': ball(0.25),
  'bulb-dim': ball(0.25),
  gloom: ball(0.1),
  'gloom-flicker': ball(0.1),
  sofa: stands(0.78, 1.7),
  'gavel-rise': { side: 0.7, up: 1.05, down: 0 },
  'chat-bubbles': { side: 0.9, up: 1.05, down: 1.05 },
  'chat-full': { side: 0.9, up: 1.05, down: 1.05 },
  'smoke-creeping': stands(2.3, 0.9),
  'smoke-low': stands(2.3, 0.9),
  'smoke-rising': stands(2.3, 1.9),
  'smoke-table': stands(2.3, 1.9),
  'smoke-filling': stands(2.3, 1.9),
  'smoke-high': stands(2.3, 1.9),
  'back-row': stands(BACK_ROW.half, 4.4),
  'back-row-raising': stands(BACK_ROW.half, 4.4),
  'back-row-raised': stands(BACK_ROW.half, 4.4),
  'back-row-turned': stands(BACK_ROW.half, 4.4),
  'house-row': stands(BACK_ROW.half, 4.4),
  'house-row-raising': stands(BACK_ROW.half, 4.4),
  'house-row-raised': stands(BACK_ROW.half, 4.4),
  'house-row-turned': stands(BACK_ROW.half, 4.4),
  'wall-clock': ball(0.62),
  'wall-clock-spinning': ball(0.62),
  ...Object.fromEntries(CLOCK_TIMES.map(([name]) => [name, ball(0.62)])),
  ...Object.fromEntries(
    CAR_PAINTS.map((paint) => [paint === 'ocean' ? 'car' : `car-${paint}`, stands(2.3, 3.05)]),
  ),
  'notice-board': ball(0.85, 0.85),
  'notice-board-fine-pinning': ball(0.85, 0.85),
  'notice-board-fine': ball(0.85, 0.85),
  'notice-board-no-fine': ball(0.85, 0.85),
  'cash-jar': stands(0.8, 3.0),
  'cash-jar-low': stands(0.8, 2.75),
  gavel: { side: 0.7, up: 0.5, down: 0 },
  'gavel-raised': { side: 0.7, up: 1.05, down: 0 },
  'gavel-knock': { side: 0.7, up: 1.05, down: 0 },
  banknote: stands(0.39, 0.42),
  'banknote-20': stands(0.39, 0.42),
  'kitchen-sink': stands(COUNTER.half + 0.1, COUNTER.top + 0.85),
  'kitchen-sink-done': stands(COUNTER.half + 0.1, COUNTER.top + 0.85),
  'notebook-blue': stands(0.42, 0.2),
  'notebook-orange': stands(0.42, 0.2),
  'notebook-blue-landing': stands(0.42, 0.2),
  'notebook-blue-open': stands(0.4, 0.55),
  'notebook-orange-open': stands(0.4, 0.55),
  'window-seasons': ball(0.85, 1.0),
  'window-night': ball(0.85, 1.0),
  'window-winter': ball(0.85, 1.0),
  'window-autumn': ball(0.85, 1.0),
  'drawer-cabinet': stands(CABINET.half, CABINET.height),
  'drawer-cabinet-opening': stands(CABINET.half + 0.1, CABINET.height),
  'drawer-cabinet-open': stands(CABINET.half + 0.1, CABINET.height),
  'drawer-cabinet-empty': stands(CABINET.half + 0.1, CABINET.height),
  'plate-shares': ball(1.0, 1.3),
  'gloom-split': ball(0.1),
  'black-hole-glow': ball(1.8, 3.4),
  'black-hole-glow-centred': ball(1.8, 3.4),
  'breath-cloud': ball(0.6),
  'food-breath-cloud': ball(0.6),
  'xray-fat': ball(0.6),
};

/** The things whose reach is written down: every one that can stand in a scene. */
export const REACHES: readonly string[] = Object.keys(REACH);

/** How far a thing placed in a shot reaches, in heads, at the size the shot gives it. */
export function propReach(p: { prop: string; size?: number | undefined }): Reach {
  const reach = REACH[p.prop] ?? stands(0.5, 1);
  const k = p.size ?? 1;
  return { side: reach.side * k, up: reach.up * k, down: reach.down * k };
}

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

/** How far above what it lies on a hand closes on a small thing lifted off the ground. */
const LIFTED_GRIP = 0.15;

/**
 * How high off the ground a hand takes hold of a thing placed in a shot, in heads. A thing on
 * the ground is taken where `gripHeight` says; a thing lying on a table is taken up there, where
 * it is (a coin on a desk was reached for on the floor under it, and the whole body bowed down).
 */
export const gripPoint = (p: { prop: string; y?: number | undefined }): number =>
  propHeight(p) > 0 ? propHeight(p) + LIFTED_GRIP : gripHeight(p.prop);
