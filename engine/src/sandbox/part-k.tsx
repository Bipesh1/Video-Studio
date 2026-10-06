import type { ReactNode } from 'react';
import { Background } from '../backgrounds/Background';
import { placeSpec } from '../backgrounds/places';
import { Framed, SHOTS, focusBetween, focusOn, shoulderPlacement } from '../camera/Framing';
import type { Shot } from '../camera/Framing';
import { EXPRESSIONS } from '../face/expressions';
import { Book } from '../props/Book';
import { Chair } from '../props/Chair';
import { Coin } from '../props/Coin';
import { CUP_REST, Cup } from '../props/Cup';
import { InHand, Placed } from '../props/Hold';
import { LANTERN_DROP, Lantern } from '../props/Lantern';
import { TABLE, Table } from '../props/Table';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { ELBOW_DOWN } from '../rig/ik';
import { vec } from '../rig/math';
import { resolvePose } from '../rig/pose';
import type { Pose } from '../rig/pose';
import { sit, stand } from '../rig/poses';
import { FARMER } from '../wardrobe/costumes/farmer';
import { QUEEN } from '../wardrobe/costumes/queen';
import { RULER } from '../wardrobe/costumes/ruler';
import { SOLDIER } from '../wardrobe/costumes/soldier';
import { outfitFrom } from '../wardrobe/garments';
import type { Identity } from '../wardrobe/types';
import { Label } from './Sandbox';
import type { Colors } from './Sandbox';

/**
 * Phase 2E sandbox sheets: one scene framed the four ways, and characters seen from behind.
 * The scene is laid out once, wide; the other three shots are the same scene with the camera
 * moved in, so the place and where people are never change.
 */

const W = 1080;
const H = 1920;
const SEED = 3105;
const HEAD = 200;
const FLOOR = 1430;

const HOME = outfitFrom({
  onePiece: { kind: 'dress', cloth: 'cream' },
  shoes: { kind: 'boots', cloth: 'brown' },
});
const CHILD = outfitFrom({
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

const gran = { x: 290, groundY: FLOOR, head: HEAD, facing: 'right' as const };
const kid = { x: 880, groundY: FLOOR, head: HEAD * 0.86, facing: 'left' as const };
const granPose = resolvePose(READ);
const kidPose = resolvePose(SHOW);

const reads: NonNullable<CharacterProps['prop']> = (hands, info) => (
  <g transform={`translate(${hands.front.center.x + 0.1} ${hands.front.center.y - 0.3})`}>
    <g transform="scale(0.8)">
      <Book uid={`${info.uid}-book`} shadowSide={info.shadowSide} open />
    </g>
  </g>
);
const showsCoin: NonNullable<CharacterProps['prop']> = (hands, info) => (
  <InHand frame={hands.front} how="upright" reach={0.24}>
    <Coin uid={`${info.uid}-coin`} shadowSide={info.shadowSide} />
  </InHand>
);

/** The whole scene, laid out wide. `uid` keeps the ids of each copy apart. */
function HomeScene({ uid, withGran = true }: { uid: string; withGran?: boolean }) {
  return (
    <>
      <Background spec={placeSpec('home-interior', SEED)} width={W} height={H} frame={0} fps={30} />
      {withGran && (
        <>
          <Placed x={gran.x} y={FLOOR} head={HEAD}>
            <Chair uid={`${uid}-chair`} shadowSide={1} />
          </Placed>
          <Character
            {...gran}
            pose={granPose}
            face={EXPRESSIONS.happy}
            turn={0.5}
            age="elder"
            identity={GRAN}
            outfit={HOME}
            prop={reads}
          />
        </>
      )}
      <Placed x={gran.x + 1.55 * HEAD} y={FLOOR} head={HEAD}>
        <Table uid={`${uid}-table`} shadowSide={1} width={1.6} />
        <g transform={`translate(0.3 ${-TABLE.top - CUP_REST.mug})`}>
          <Cup uid={`${uid}-cup`} shadowSide={1} />
        </g>
        <g transform={`translate(-0.32 ${-TABLE.top - LANTERN_DROP})`}>
          <Lantern uid={`${uid}-lamp`} shadowSide={1} />
        </g>
      </Placed>
      <Character
        {...kid}
        pose={kidPose}
        face={EXPRESSIONS.happy}
        turn={0.5}
        age="child"
        identity={KID}
        outfit={CHILD}
        prop={showsCoin}
      />
    </>
  );
}

const NAMES: Record<Shot, string> = {
  wide: 'wide',
  medium: 'medium',
  'close-up': 'close-up',
  'over-shoulder': 'over the shoulder',
};

export function FramingSheet({ c }: { c: Colors }) {
  const size = { width: W, height: H };
  const kidFocus = focusOn(kid, kidPose);
  const granFocus = focusOn(gran, granPose);
  const cw = W / 2;
  const ch = H / 2;
  return (
    <>
      {SHOTS.map((shot, i) => {
        const left = cw * (i % 2);
        const top = ch * Math.floor(i / 2);
        const focus = shot === 'wide' ? focusBetween(granFocus, kidFocus) : kidFocus;
        const near = shoulderPlacement(size, 'left');
        let picture: ReactNode;
        if (shot === 'over-shoulder') {
          picture = (
            <>
              <Framed shot={shot} focus={focus} {...size}>
                <HomeScene uid={`fr${i}`} withGran={false} />
              </Framed>
              <Character
                {...near}
                pose={resolvePose(stand)}
                face={EXPRESSIONS.neutral}
                turn={0.5}
                age="elder"
                identity={GRAN}
                outfit={HOME}
                back
              />
            </>
          );
        } else {
          picture = (
            <Framed shot={shot} focus={focus} {...size}>
              <HomeScene uid={`fr${i}`} />
            </Framed>
          );
        }
        return (
          <g key={shot}>
            <svg x={left + 4} y={top + 4} width={cw - 8} height={ch - 8} viewBox={`0 0 ${W} ${H}`}>
              {picture}
              {/* The caption area: the bottom quarter stays free of faces. */}
              <rect x={0} y={H * 0.75} width={W} height={4} fill={c.label} opacity={0.5} />
            </svg>
            <rect
              x={left + 4}
              y={top + ch - 58}
              width={cw - 8}
              height={50}
              fill={c.base}
              opacity={0.85}
            />
            <Label x={left + cw / 2} y={top + ch - 24} c={c}>
              {NAMES[shot]}
            </Label>
          </g>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Seen from behind

const BACKS: Array<{ label: string; extra: Partial<CharacterProps> }> = [
  { label: 'plain', extra: {} },
  {
    label: 'short hair',
    extra: { identity: { skinTone: 4, hair: 'short-crop', hairColor: 'black' } },
  },
  { label: 'afro', extra: { identity: { skinTone: 6, hair: 'afro', hairColor: 'black' } } },
  {
    label: 'long hair',
    extra: { identity: { skinTone: 2, hair: 'long', hairColor: 'auburn' }, outfit: HOME },
  },
  { label: 'bun, elder', extra: { identity: GRAN, outfit: HOME, age: 'elder' } },
  { label: 'ponytail, child', extra: { identity: KID, outfit: CHILD, age: 'child' } },
  { label: 'bald', extra: { identity: { skinTone: 7, hair: 'bald', hairColor: 'black' } } },
  { label: 'king', extra: { outfit: RULER } },
  {
    label: 'queen',
    extra: { outfit: QUEEN, identity: { skinTone: 4, hair: 'bun', hairColor: 'black' } },
  },
  { label: 'soldier', extra: { outfit: SOLDIER } },
  { label: 'farmer', extra: { outfit: FARMER } },
  {
    label: 'hooded',
    extra: {
      outfit: outfitFrom({
        top: { kind: 'shirt', cloth: 'steel' },
        bottom: { kind: 'trousers', cloth: 'steel' },
        shoes: { kind: 'boots', cloth: 'steel' },
        cloak: { cloth: 'forest', hood: true },
      }),
    },
  },
];

export function BackViewsSheet({ c }: { c: Colors }) {
  const cols = 4;
  const cw = W / cols;
  const ch = 620;
  const head = 104;
  return (
    <>
      {BACKS.map((b, i) => {
        const cx = cw * (i % cols) + cw / 2;
        const top = ch * Math.floor(i / cols);
        const groundY = top + ch - 70;
        return (
          <g key={b.label}>
            <rect x={cw * (i % cols) + 6} y={groundY} width={cw - 12} height={40} fill={c.ground} />
            <Character
              x={cx}
              groundY={groundY}
              head={head}
              pose={resolvePose(stand)}
              face={EXPRESSIONS.neutral}
              turn={0.5}
              back
              {...b.extra}
            />
            <Label x={cx} y={top + 40} c={c}>
              {b.label}
            </Label>
          </g>
        );
      })}
    </>
  );
}
