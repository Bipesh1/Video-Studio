import type { ReactNode } from 'react';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Bag, BAG_DROP } from '../props/Bag';
import { Book } from '../props/Book';
import { Chair } from '../props/Chair';
import { Coin } from '../props/Coin';
import { CUP_REST, Cup } from '../props/Cup';
import { Door } from '../props/Door';
import { InHand, Placed } from '../props/Hold';
import { LANTERN_DROP, Lantern } from '../props/Lantern';
import { Shield } from '../props/Shield';
import { Sword } from '../props/Sword';
import { TABLE, Table } from '../props/Table';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { ELBOW_DOWN } from '../rig/ik';
import { vec } from '../rig/math';
import { resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { holdObject, sit, stand } from '../rig/poses';
import { FARMER } from '../wardrobe/costumes/farmer';
import { RULER } from '../wardrobe/costumes/ruler';
import { SOLDIER } from '../wardrobe/costumes/soldier';
import { outfitFrom } from '../wardrobe/garments';
import { Label } from './Sandbox';
import type { Colors } from './Sandbox';

/** Phase 2E sandbox sheets: every prop on its own, and props in the hands and rooms they are for. */

const W = 1080;
const base = { shadowSide: 1 as const };

type Item = { label: string; draw: (uid: string) => ReactNode; lift?: number; scale?: number };

const ITEMS: Item[] = [
  {
    label: 'sword',
    draw: (uid) => (
      <g transform="translate(-0.55 -0.7)">
        <Sword uid={uid} {...base} />
      </g>
    ),
  },
  {
    label: 'shield',
    draw: (uid) => (
      <g transform="translate(0 -0.75)">
        <Shield uid={uid} {...base} />
      </g>
    ),
  },
  {
    label: 'coin',
    draw: (uid) => (
      <g transform="translate(0 -0.6)">
        <Coin uid={uid} {...base} />
      </g>
    ),
    scale: 1.7,
  },
  {
    label: 'bag',
    draw: (uid) => (
      <g transform={`translate(0 ${-BAG_DROP})`}>
        <Bag uid={uid} {...base} />
      </g>
    ),
  },
  {
    label: 'book',
    draw: (uid) => (
      <g transform="translate(0 -0.5)">
        <Book uid={uid} {...base} />
      </g>
    ),
  },
  {
    label: 'book, open',
    draw: (uid) => (
      <g transform="translate(0 -0.55)">
        <Book uid={uid} {...base} open />
      </g>
    ),
  },
  {
    label: 'lantern',
    draw: (uid) => (
      <g transform={`translate(0 ${-LANTERN_DROP})`}>
        <Lantern uid={uid} {...base} />
      </g>
    ),
  },
  {
    label: 'cup: mug',
    draw: (uid) => (
      <g transform={`translate(0 ${-CUP_REST.mug})`}>
        <Cup uid={uid} {...base} />
      </g>
    ),
    scale: 1.5,
  },
  {
    label: 'cup: goblet',
    draw: (uid) => (
      <g transform={`translate(0 ${-CUP_REST.goblet})`}>
        <Cup uid={uid} {...base} kind="goblet" />
      </g>
    ),
    scale: 1.5,
  },
  { label: 'chair', draw: (uid) => <Chair uid={uid} {...base} />, scale: 0.72 },
  { label: 'table', draw: (uid) => <Table uid={uid} {...base} />, scale: 0.72 },
  { label: 'throne', draw: (uid) => <Chair uid={uid} {...base} kind="throne" />, scale: 0.6 },
  { label: 'door, shut', draw: (uid) => <Door uid={uid} {...base} />, scale: 0.42 },
  { label: 'door, opening', draw: (uid) => <Door uid={uid} {...base} open={0.5} />, scale: 0.42 },
  { label: 'door, open', draw: (uid) => <Door uid={uid} {...base} open={1} />, scale: 0.42 },
];

export function PropsSheet({ c }: { c: Colors }) {
  const cols = 3;
  const cw = W / cols;
  const ch = 380;
  const head = 190;
  return (
    <>
      {ITEMS.map((item, i) => {
        const cx = cw * (i % cols) + cw / 2;
        const top = ch * Math.floor(i / cols);
        const groundY = top + ch - 46;
        return (
          <g key={item.label}>
            <rect x={cw * (i % cols) + 8} y={groundY} width={cw - 16} height={30} fill={c.ground} />
            <Placed x={cx} y={groundY} head={head * (item.scale ?? 1)}>
              {item.draw(`prop-${i}`)}
            </Placed>
            <Label x={cx} y={top + 36} c={c}>
              {item.label}
            </Label>
          </g>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Props in use

type Prop = NonNullable<CharacterProps['prop']>;

/** Sword out in front, shield on the other arm. */
const GUARD: Pose = {
  id: 'guard',
  torsoLean: 3,
  arms: {
    front: { reach: vec(0.86, 0.3), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -52, thumb: 1 },
    back: { reach: vec(0.42, 0.5), bend: ELBOW_DOWN },
  },
  legs: { front: { foot: vec(0.3, 0), bend: -1 }, back: { foot: vec(-0.26, 0), bend: 1 } },
};
/** One hand held up to show something small at the fingertips. */
const SHOW: Pose = {
  ...stand,
  id: 'show',
  headTilt: -4,
  arms: { front: { upper: 112, lower: 30 }, back: { upper: -12, lower: 8 } },
};
/** Carrying something that hangs from the fist at the side. */
const CARRY_LOW: Pose = {
  ...stand,
  id: 'carry-low',
  arms: {
    front: { upper: 14, lower: 10, hand: 'grip', thumb: 1 },
    back: { upper: -12, lower: 8 },
  },
};
/** Sitting and reading: both hands up in front holding a book. */
const READ: Pose = {
  ...sit,
  id: 'read',
  headTilt: 10,
  arms: {
    front: { reach: vec(0.6, 0.42), bend: ELBOW_DOWN },
    back: { reach: vec(0.5, 0.46), bend: ELBOW_DOWN },
  },
};
/** Sitting with a cup raised in one hand. */
const TOAST: Pose = {
  ...sit,
  id: 'toast',
  arms: {
    front: { reach: vec(0.62, 0.02), bend: ELBOW_DOWN, hand: 'grip', gripAxis: -90, thumb: 1 },
    back: { reach: vec(0.33, 0.88), bend: ELBOW_DOWN },
  },
};
/** Reaching forward for a door ring. */
const REACH: Pose = {
  ...stand,
  id: 'reach',
  torsoLean: 6,
  arms: {
    front: { reach: vec(0.95, 0.2), bend: ELBOW_DOWN, hand: 'grip', thumb: 1 },
    back: { upper: -12, lower: 8 },
  },
};

const armed: Prop = (hands, info) => (
  <>
    <InHand frame={hands.back} how="upright">
      <Shield uid={`${info.uid}-sh`} shadowSide={info.shadowSide} />
    </InHand>
    <InHand frame={hands.front}>
      <Sword uid={`${info.uid}-sw`} shadowSide={info.shadowSide} />
    </InHand>
  </>
);
const showsCoin: Prop = (hands, info) => (
  <InHand frame={hands.front} how="upright" reach={0.24}>
    <Coin uid={`${info.uid}-coin`} shadowSide={info.shadowSide} />
  </InHand>
);
const carriesBag: Prop = (hands, info) => (
  <InHand frame={hands.front} how="hang" sway={info.sway}>
    <Bag uid={`${info.uid}-bag`} shadowSide={info.shadowSide} />
  </InHand>
);
const carriesLantern: Prop = (hands, info) => (
  <InHand frame={hands.front} how="hang" sway={info.sway}>
    <Lantern uid={`${info.uid}-lan`} shadowSide={info.shadowSide} />
  </InHand>
);
const reads: Prop = (hands, info) => (
  <g transform={`translate(${hands.front.center.x + 0.1} ${hands.front.center.y - 0.3})`}>
    <g transform="scale(0.8)">
      <Book uid={`${info.uid}-book`} shadowSide={info.shadowSide} open />
    </g>
  </g>
);
const drinks: Prop = (hands, info) => (
  <InHand frame={hands.front} how="upright">
    <Cup uid={`${info.uid}-cup`} shadowSide={info.shadowSide} kind="goblet" />
  </InHand>
);

const HOME = outfitFrom({
  onePiece: { kind: 'dress', cloth: 'cream' },
  shoes: { kind: 'boots', cloth: 'brown' },
});
const CHILD = outfitFrom({
  top: { kind: 'shirt', cloth: 'orange', sleeves: 'short' },
  bottom: { kind: 'trousers', cloth: 'denim' },
  shoes: { kind: 'sneakers', cloth: 'white' },
});

type Scene = {
  label: string;
  face: ExpressionName;
  pose: Pose;
  prop?: Prop;
  extra?: Partial<CharacterProps>;
  /** Things standing in the scene behind the character, then in front of them. */
  behind?: (uid: string) => ReactNode;
  front?: (uid: string) => ReactNode;
  dx?: number;
};

const SCENES: Scene[] = [
  {
    label: 'sword and shield',
    face: 'determined',
    pose: GUARD,
    prop: armed,
    extra: { outfit: SOLDIER },
    dx: -40,
  },
  {
    label: 'a coin held up',
    face: 'happy',
    pose: SHOW,
    prop: showsCoin,
    extra: {
      outfit: CHILD,
      age: 'child',
      identity: { skinTone: 3, hair: 'ponytail', hairColor: 'dark-brown' },
    },
  },
  {
    label: 'a bag carried',
    face: 'smug',
    pose: CARRY_LOW,
    prop: carriesBag,
    extra: { outfit: FARMER },
  },
  {
    label: 'a lantern carried',
    face: 'afraid',
    pose: { ...holdObject, id: 'lantern' },
    prop: carriesLantern,
    extra: { outfit: FARMER },
    dx: -40,
  },
  {
    label: 'reading at a table',
    face: 'thinking',
    pose: READ,
    prop: reads,
    extra: {
      outfit: HOME,
      age: 'elder',
      identity: { skinTone: 2, hair: 'bun', hairColor: 'gray' },
    },
    dx: -60,
    behind: (uid) => <Chair uid={`${uid}-chair`} {...base} />,
    front: (uid) => (
      <g transform="translate(1.55 0)">
        <Table uid={`${uid}-table`} {...base} width={1.7} />
        <g transform={`translate(0.3 ${-TABLE.top - CUP_REST.mug})`}>
          <Cup uid={`${uid}-mug`} {...base} />
        </g>
        <g transform={`translate(-0.35 ${-TABLE.top - LANTERN_DROP})`}>
          <Lantern uid={`${uid}-lamp`} {...base} />
        </g>
      </g>
    ),
  },
  {
    label: 'a king on his throne',
    face: 'smug',
    pose: TOAST,
    prop: drinks,
    extra: { outfit: RULER },
    dx: -30,
    behind: (uid) => <Chair uid={`${uid}-throne`} {...base} kind="throne" />,
  },
  {
    label: 'at a door',
    face: 'surprised',
    pose: REACH,
    extra: { outfit: FARMER },
    dx: -90,
    behind: (uid) => (
      <g transform="translate(1.75 0)">
        <Door uid={`${uid}-door`} {...base} open={0.35} />
      </g>
    ),
  },
  {
    label: 'sitting on a chair',
    face: 'neutral',
    pose: sit,
    extra: { outfit: CHILD },
    behind: (uid) => <Chair uid={`${uid}-chair2`} {...base} />,
  },
  {
    label: 'coins and a bag on a table',
    face: 'happy',
    pose: stand,
    extra: { outfit: FARMER },
    dx: -110,
    front: (uid) => (
      <g transform="translate(1.6 0)">
        <Table uid={`${uid}-t2`} {...base} width={1.9} />
        <g transform={`translate(-0.45 ${-TABLE.top - BAG_DROP})`}>
          <Bag uid={`${uid}-b2`} {...base} />
        </g>
        {[0.2, 0.5, 0.36].map((x, k) => (
          <g key={k} transform={`translate(${x} ${-TABLE.top - 0.17 - (k === 2 ? 0.26 : 0)})`}>
            <Coin uid={`${uid}-c${k}`} {...base} />
          </g>
        ))}
      </g>
    ),
  },
];

export function PropsInUseSheet({ c }: { c: Colors }) {
  const cols = 3;
  const cw = W / cols;
  const ch = 630;
  const head = 104;
  return (
    <>
      {SCENES.map((s, i) => {
        const left = cw * (i % cols);
        const top = ch * Math.floor(i / cols);
        const groundY = top + ch - 70;
        const x = left + cw / 2 + (s.dx ?? 0);
        const id = `use-${i}`;
        return (
          <g key={s.label}>
            <defs>
              <clipPath id={id}>
                <rect x={left + 4} y={top + 48} width={cw - 8} height={ch - 50} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id})`}>
              <rect x={left + 4} y={groundY} width={cw - 8} height={50} fill={c.ground} />
              {s.behind && (
                <Placed x={x} y={groundY} head={head}>
                  {s.behind(id)}
                </Placed>
              )}
              <Character
                x={x}
                groundY={groundY}
                head={head}
                pose={resolvePose(s.pose)}
                face={EXPRESSIONS[s.face]}
                turn={0.5}
                {...(s.prop ? { prop: s.prop } : {})}
                {...s.extra}
              />
              {s.front && (
                <Placed x={x} y={groundY} head={head}>
                  {s.front(id)}
                </Placed>
              )}
            </g>
            <Label x={left + cw / 2} y={top + 36} c={c}>
              {s.label}
            </Label>
          </g>
        );
      })}
    </>
  );
}
