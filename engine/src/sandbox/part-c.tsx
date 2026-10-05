import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { Character } from '../rig/Character';
import type { CharacterProps } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { holdObject, point, stand, wave } from '../rig/poses';
import type { ResolvedPose } from '../rig/types';
import { walkAt } from '../rig/walk';
import { FARMER } from '../wardrobe/costumes/farmer';
import { QUEEN } from '../wardrobe/costumes/queen';
import { SOLDIER } from '../wardrobe/costumes/soldier';
import { outfitFrom } from '../wardrobe/garments';
import type { Clothes } from '../wardrobe/garments';
import type { Age, Identity, Outfit } from '../wardrobe/types';
import { Rod } from './Rod';
import { Label } from './Sandbox';
import type { Colors } from './Sandbox';

/** Phase 2B sandbox sheets: tier 1 clothes, the new costumes, ages, and a mixed cast. */

const W = 1080;

const rodProp: CharacterProps['prop'] = (hands) =>
  hands.front.hand.shape === 'grip' ? <Rod frame={hands.front} /> : null;

const standing = resolvePose(stand);
const walking = walkAt(0.2).pose;
const striding = walkAt(0.62).pose;

type Cell = {
  label: string;
  pose?: ResolvedPose;
  turn?: number;
  expression?: ExpressionName;
  outfit?: Outfit;
  identity?: Identity;
  age?: Age;
  /** Head size as a fraction of the sheet's adult head. */
  size?: number;
  rod?: boolean;
};

/** A grid of whole figures, each standing on its own strip of ground. */
function Grid({
  cells,
  columns,
  cellHeight,
  head,
  c,
}: {
  cells: Cell[];
  columns: number;
  cellHeight: number;
  head: number;
  c: Colors;
}) {
  const cw = W / columns;
  return (
    <>
      {cells.map((cell, i) => {
        const cx = cw * (i % columns) + cw / 2;
        const top = cellHeight * Math.floor(i / columns);
        const groundY = top + cellHeight - 62;
        const pose = cell.pose ?? standing;
        const h = head * (cell.size ?? 1);
        return (
          <g key={`${i}-${cell.label}`}>
            <rect
              x={cw * (i % columns) + 8}
              y={groundY}
              width={cw - 16}
              height={46}
              fill={c.ground}
            />
            <Character
              x={cx - pose.rootX * h - (cell.rod ? 30 : 0)}
              groundY={groundY}
              head={h}
              pose={pose}
              face={EXPRESSIONS[cell.expression ?? 'neutral']}
              turn={cell.turn ?? 0}
              {...(cell.outfit ? { outfit: cell.outfit } : {})}
              {...(cell.identity ? { identity: cell.identity } : {})}
              {...(cell.age ? { age: cell.age } : {})}
              {...(cell.rod ? { prop: rodProp } : {})}
            />
            <Label x={cx} y={top + 36} c={c}>
              {cell.label}
            </Label>
          </g>
        );
      })}
    </>
  );
}

const wear = (clothes: Clothes) => outfitFrom(clothes);

/** The outfit on Reference B's frightened figure. */
const REFERENCE_B = wear({
  top: { kind: 'tank-top', cloth: 'white' },
  bottom: { kind: 'trousers', cloth: 'denim' },
  shoes: { kind: 'sneakers', cloth: 'white' },
});
const WORK = wear({
  top: { kind: 'shirt', cloth: 'forest' },
  bottom: { kind: 'trousers', cloth: 'steel' },
  shoes: { kind: 'boots', cloth: 'steel' },
});
const SKIRT = wear({
  top: { kind: 'shirt', cloth: 'orange', sleeves: 'short' },
  bottom: { kind: 'skirt', cloth: 'denim' },
  shoes: { kind: 'sneakers', cloth: 'white' },
});
const DRESS = wear({
  onePiece: { kind: 'dress', cloth: 'crimson' },
  shoes: { kind: 'sneakers', cloth: 'white' },
});
const ROBE = wear({
  onePiece: { kind: 'robe', cloth: 'steel' },
  shoes: { kind: 'boots', cloth: 'steel' },
});
const TRAVELER = wear({
  top: { kind: 'shirt', cloth: 'white' },
  bottom: { kind: 'trousers', cloth: 'denim' },
  shoes: { kind: 'boots', cloth: 'steel' },
  cloak: { cloth: 'crimson' },
});
const HOODED = wear({
  onePiece: { kind: 'robe', cloth: 'denim' },
  shoes: { kind: 'boots', cloth: 'steel' },
  cloak: { cloth: 'forest', hood: true },
});
const HAT = wear({
  top: { kind: 'shirt', cloth: 'glint', sleeves: 'short' },
  bottom: { kind: 'trousers', cloth: 'denim' },
  shoes: { kind: 'sneakers', cloth: 'white' },
  hat: { kind: 'brim-hat', cloth: 'gold' },
});

export function ClothesSheet({ c }: { c: Colors }) {
  const cells: Cell[] = [
    { label: 'tank top, jeans, sneakers', outfit: REFERENCE_B },
    { label: 'shirt, trousers, boots', outfit: WORK },
    { label: 'short sleeves, skirt', outfit: SKIRT },
    { label: 'dress', outfit: DRESS, expression: 'happy' },
    { label: 'robe', outfit: ROBE },
    { label: 'cloak, hood down', outfit: TRAVELER },
    { label: 'pointing, 3/4', outfit: REFERENCE_B, pose: resolvePose(point), turn: 0.5 },
    { label: 'holding, 3/4', outfit: WORK, pose: resolvePose(holdObject), turn: 0.5, rod: true },
    { label: 'hood up, 3/4', outfit: HOODED, turn: 0.5 },
    { label: 'walking', outfit: REFERENCE_B, pose: walking, turn: 1 },
    { label: 'dress, walking', outfit: DRESS, pose: striding, turn: 1 },
    { label: 'straw hat, walking', outfit: HAT, pose: walking, turn: 1 },
  ];
  return <Grid cells={cells} columns={3} cellHeight={480} head={84} c={c} />;
}

export function CostumesBSheet({ c }: { c: Colors }) {
  const row = (name: string, outfit: Outfit, mid: Cell): Cell[] => [
    { label: `${name}, front`, outfit },
    { ...mid, outfit, turn: 0.5 },
    { label: `${name}, walking`, outfit, pose: walking, turn: 1 },
  ];
  const cells: Cell[] = [
    ...row('soldier', SOLDIER, {
      label: 'soldier, pointing',
      pose: resolvePose(point),
      expression: 'determined',
    }),
    ...row('queen', QUEEN, {
      label: 'queen, waving',
      pose: resolvePose(wave),
      expression: 'happy',
    }),
    ...row('farmer', FARMER, {
      label: 'farmer, holding',
      pose: resolvePose(holdObject),
      rod: true,
    }),
  ];
  return <Grid cells={cells} columns={3} cellHeight={640} head={104} c={c} />;
}

const PLAIN = wear({
  top: { kind: 'shirt', cloth: 'forest', sleeves: 'short' },
  bottom: { kind: 'trousers', cloth: 'denim' },
  shoes: { kind: 'boots', cloth: 'steel' },
});
const CHILD: Identity = { skinTone: 3, hair: 'ponytail', hairColor: 'dark-brown' };
const ADULT: Identity = { skinTone: 3, hair: 'short-crop', hairColor: 'dark-brown' };
const ELDER: Identity = { skinTone: 3, hair: 'short-crop', hairColor: 'gray', facialHair: 'beard' };

export function AgesSheet({ c }: { c: Colors }) {
  const trio = (label: string, pose: ResolvedPose, turn: number): Cell[] => [
    {
      label: `child, ${label}`,
      age: 'child',
      size: 0.86,
      identity: CHILD,
      outfit: PLAIN,
      pose,
      turn,
    },
    { label: `adult, ${label}`, age: 'adult', identity: ADULT, outfit: PLAIN, pose, turn },
    { label: `elder, ${label}`, age: 'elder', identity: ELDER, outfit: PLAIN, pose, turn },
  ];
  const cells: Cell[] = [
    ...trio('front', standing, 0),
    ...trio('3/4', standing, 0.5),
    ...trio('walking', walking, 1),
  ];
  return <Grid cells={cells} columns={3} cellHeight={640} head={110} c={c} />;
}

export function PeopleSheet({ c }: { c: Colors }) {
  const long = (turn: number, label: string): Cell => ({
    label,
    turn,
    identity: { skinTone: 2, hair: 'long', hairColor: 'auburn' },
    outfit: DRESS,
  });
  const cells: Cell[] = [
    {
      label: 'tone 1, bob',
      turn: 0.5,
      identity: { skinTone: 1, hair: 'straight-bob', hairColor: 'blond' },
      outfit: SKIRT,
      expression: 'happy',
    },
    {
      label: 'tone 4, bun, queen',
      turn: 0.5,
      identity: { skinTone: 4, hair: 'bun', hairColor: 'black' },
      outfit: QUEEN,
      expression: 'smug',
    },
    {
      label: 'tone 6, fade, soldier',
      turn: 0.5,
      identity: { skinTone: 6, hair: 'fade', hairColor: 'black' },
      outfit: SOLDIER,
      expression: 'determined',
    },
    {
      label: 'tone 8, braids, child',
      turn: 0.5,
      age: 'child',
      size: 0.86,
      identity: { skinTone: 8, hair: 'braids', hairColor: 'black' },
      outfit: REFERENCE_B,
      expression: 'surprised',
    },
    {
      label: 'tone 5, beard, farmer',
      turn: 0.5,
      identity: { skinTone: 5, hair: 'short-crop', hairColor: 'black', facialHair: 'beard' },
      outfit: FARMER,
    },
    {
      label: 'tone 7, elder, robe',
      turn: 0.5,
      age: 'elder',
      identity: { skinTone: 7, hair: 'bald', hairColor: 'white', facialHair: 'beard' },
      outfit: ROBE,
      expression: 'thinking',
    },
    long(0, 'long hair, front'),
    long(0.5, 'long hair, 3/4'),
    long(1, 'long hair, profile'),
  ];
  return <Grid cells={cells} columns={3} cellHeight={640} head={104} c={c} />;
}
