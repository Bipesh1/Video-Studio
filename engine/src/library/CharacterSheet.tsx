import type { CharacterCard } from '@studio/shared';
import type { ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import type { CalculateMetadataFunction } from 'remotion';
import { Background } from '../backgrounds/Background';
import { EXPRESSIONS } from '../face/expressions';
import type { ExpressionName } from '../face/expressions';
import { ACTIONS } from '../rig/actions';
import type { ActionName } from '../rig/actions';
import { Character } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { SEATED_POSES, poseById, stand } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import type { Facing, ResolvedPose } from '../rig/types';
import { stageFor, stageX } from '../stage/layout';
import { StandingProp } from '../stage/props';
import { ink, lineWeights, palette, pick, tokens, white } from '../tokens';
import { castFromCard } from '../wardrobe/cast';
import { cloth } from '../wardrobe/cloth';
import { assetById } from './data';
import type { SheetPage } from './sheetPages';

/**
 * The pictures of a saved character (characters/<id>.json), drawn from the card and nothing
 * else, so they show exactly what a video will show:
 *   CharacterSheet  page "sheet"        front view, side view and what they wear, close up
 *                   page "expressions"  the faces approved for them
 *                   page "poses"        the poses approved for them, then the ones that are theirs
 *   CastLineup      a whole cast standing together at the game table
 */

const font = 'Arial, Helvetica, sans-serif';
export const SHEET_WIDTH = 1920;
const TOP = 120;
const FACE_ROW = 470;
const POSE_ROW = 420;
/** A pose takes one of these across the page; someone sitting at a table takes two. */
const UNITS = 7;
const UNIT = SHEET_WIDTH / UNITS;
const POSE_HEAD = 80;

const field = pick(palette('cold-dawn'), 1);
const ground = pick(palette('cold-dawn'), 0);

export type CharacterSheetProps = { card: CharacterCard; page: SheetPage };

/** The style's cloth colors in the words Biku uses for them. */
const CLOTH_WORDS: Record<string, string> = {
  crimson: 'red',
  glint: 'sky blue',
  forest: 'green',
  denim: 'navy',
  ocean: 'blue',
  steel: 'dark gray',
};
const clothWord = (name: string): string => CLOTH_WORDS[name] ?? name;

/** The names Biku gave the standard poses and faces; the rest use their library names. */
const PLAIN: Record<string, string> = {
  stand: 'standing',
  sit: 'sitting at a table',
  point: 'pointing',
  'cross-arms': 'arms crossed',
  'hands-up': 'hands up',
  'sit-reach': 'reaching for an object',
  walk: 'walking',
  surprised: 'shocked',
};
const plain = (kind: 'pose' | 'expression', name: string): string =>
  PLAIN[name] ??
  (
    assetById(`${kind}/${name}`) ??
    assetById(`action/${name}`) ?? { name: name.replace(/-/g, ' ') }
  ).name.toLowerCase();

/** What a card's clothes are, piece by piece, with the cloth colors they use. */
function wearing(card: CharacterCard): Array<{ label: string; cloths: string[] }> {
  if (!card.outfit) return [];
  if ('costume' in card.outfit)
    return [{ label: `the ${card.outfit.costume} costume`, cloths: [] }];
  const c = card.outfit.clothes;
  const out: Array<{ label: string; cloths: string[] }> = [];
  if (c.hat) out.push({ label: `${clothWord(c.hat.cloth)} ${c.hat.kind}`, cloths: [c.hat.cloth] });
  if (c.glasses) out.push({ label: 'round glasses', cloths: [] });
  if (c.scarf) out.push({ label: `${clothWord(c.scarf.cloth)} scarf`, cloths: [c.scarf.cloth] });
  if (c.tie) {
    const stripe = c.tie.stripe ?? 'gold';
    out.push({
      label: `${clothWord(c.tie.cloth)} tie with ${clothWord(stripe)} stripes`,
      cloths: [c.tie.cloth, stripe],
    });
  }
  for (const piece of [c.top, c.bottom, c.onePiece, c.shoes]) {
    if (piece)
      out.push({ label: `${clothWord(piece.cloth)} ${piece.kind}`, cloths: [piece.cloth] });
  }
  if (c.cloak) out.push({ label: `${clothWord(c.cloak.cloth)} cloak`, cloths: [c.cloak.cloth] });
  return out;
}

const Words = ({
  x,
  y,
  size = 30,
  bold = true,
  anchor = 'middle',
  fill = ink,
  children,
}: {
  x: number;
  y: number;
  size?: number;
  bold?: boolean;
  anchor?: 'start' | 'middle' | 'end';
  fill?: string;
  children: ReactNode;
}) => (
  <text
    x={x}
    y={y}
    textAnchor={anchor}
    fontFamily={font}
    fontWeight={bold ? 700 : 400}
    fontSize={size}
    fill={fill}
  >
    {children}
  </text>
);

const Heading = ({ card, what }: { card: CharacterCard; what: string }) => (
  <>
    <Words x={50} y={74} size={52} anchor="start">
      {card.name}
    </Words>
    <Words x={SHEET_WIDTH - 50} y={74} size={34} anchor="end" bold={false}>
      {what}
    </Words>
  </>
);

const standHead = computeSkeleton(resolvePose(stand)).head;

/** The moment of an action that shows it best: a walk at the widest point of its stride. */
const ACTION_MOMENT: Record<string, number> = { walk: 0 };

/** The pose or action a card names, held at a moment that shows it. */
function poseOf(name: string): ResolvedPose {
  const action = ACTIONS[name as ActionName];
  return action ? action(ACTION_MOMENT[name] ?? 0.3) : resolvePose(poseById(name));
}

/** The view each pose reads best in. */
const POSE_TURN: Record<string, number> = {
  stand: 0,
  'cross-arms': 0,
  'hands-up': 0,
  'open-arms': 0,
  shrug: 0,
  'hand-on-heart': 0.35,
  'head-tilt': 0.35,
  'fix-tie': 0.35,
  walk: 1,
};
/** The face that goes with a pose of their own; the standard poses wear the card's own face. */
const POSE_FACE: Record<string, ExpressionName> = {
  'rub-hands': 'smug',
  shrug: 'surprised',
  'open-arms': 'happy',
  'hand-on-heart': 'happy',
  'sit-promise': 'happy',
  'sit-slump': 'sad',
  'head-tilt': 'thinking',
  'fix-tie': 'smug',
};

function SheetPageView({ card }: { card: CharacterCard }) {
  const cast = castFromCard(card);
  const worn = wearing(card);
  const cloths = [...new Set(worn.flatMap((w) => w.cloths))];
  const panel = 580;
  const gap = (SHEET_WIDTH - 3 * panel) / 4;
  const left = (i: number) => gap + i * (panel + gap);
  const bottom = 990;
  const head = 215;
  const bust = 360;
  return (
    <>
      <Heading card={card} what="character sheet" />
      {[0, 1].map((i) => (
        <rect key={i} x={left(i)} y={bottom - 70} width={panel} height={70} fill={ground} />
      ))}
      {(['front view', 'side view'] as const).map((label, i) => (
        <g key={label}>
          <Character
            x={left(i) + panel / 2}
            groundY={bottom - 36}
            head={head}
            pose={resolvePose(stand)}
            face={cast.face}
            turn={i === 0 ? 0 : 1}
            {...cast.look}
          />
          <Words x={left(i) + panel / 2} y={bottom + 50}>
            {label}
          </Words>
        </g>
      ))}
      <defs>
        <clipPath id="sheet-bust">
          <rect x={left(2)} y={TOP} width={panel} height={bottom - TOP} />
        </clipPath>
      </defs>
      <g clipPath="url(#sheet-bust)">
        <Character
          x={left(2) + panel / 2 - standHead.x * bust}
          groundY={TOP + 170 + bust / 2 - standHead.y * bust}
          head={bust}
          pose={resolvePose(stand)}
          face={cast.face}
          turn={0.3}
          {...cast.look}
        />
      </g>
      <Words x={left(2) + panel / 2} y={bottom + 50}>
        {worn.length ? worn.map((w) => w.label).join(', ') : 'a plain stick figure'}
      </Words>
      {cloths.map((name, i) => {
        const k = cloth(name);
        const x = left(2) + panel / 2 - (cloths.length - 1) * 85 - 40 + i * 170;
        return (
          <g key={name}>
            <circle cx={x} cy={bottom + 105} r={22} fill={k.shadow} />
            <path
              d={`M ${x - 22} ${bottom + 105} A 22 22 0 0 1 ${x + 22} ${bottom + 105} Z`}
              fill={k.fill}
            />
            <circle
              cx={x}
              cy={bottom + 105}
              r={22}
              fill="none"
              stroke={ink}
              strokeWidth={lineWeights.outline * 190}
            />
            <Words x={x + 32} y={bottom + 114} size={24} anchor="start" bold={false}>
              {clothWord(name)}
            </Words>
          </g>
        );
      })}
    </>
  );
}

function ExpressionsPageView({ card }: { card: CharacterCard }) {
  const cast = castFromCard(card);
  const faces = (card.expressions ?? [card.expression]).filter((f) => f in EXPRESSIONS);
  const cols = 4;
  const cw = SHEET_WIDTH / cols;
  const head = 270;
  return (
    <>
      <Heading card={card} what="expressions" />
      {faces.map((name, i) => {
        const cx = cw * (i % cols) + cw / 2;
        const top = TOP + FACE_ROW * Math.floor(i / cols);
        const id = `face-${i}`;
        return (
          <g key={name}>
            <defs>
              <clipPath id={id}>
                <rect x={cx - cw / 2 + 10} y={top} width={cw - 20} height={FACE_ROW - 70} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${id})`}>
              <Character
                x={cx - standHead.x * head}
                groundY={top + 60 + head / 2 - standHead.y * head}
                head={head}
                pose={resolvePose(stand)}
                face={EXPRESSIONS[name as ExpressionName]}
                turn={0.3}
                {...cast.look}
              />
            </g>
            <Words x={cx} y={top + FACE_ROW - 30}>
              {plain('expression', name)}
            </Words>
          </g>
        );
      })}
    </>
  );
}

/** The poses of a card laid out in rows: one place each, two for someone sitting at a table. */
function poseRows(card: CharacterCard) {
  const names = [...new Set([...(card.poses ?? ['stand']), ...(card.signature ?? [])])];
  const own = new Set((card.signature ?? []).filter((n) => !(card.poses ?? []).includes(n)));
  const rows: Array<Array<{ name: string; at: number; span: number; own: boolean }>> = [[]];
  let used = 0;
  for (const name of names) {
    const span = SEATED_POSES.includes(name) ? 2 : 1;
    if (used + span > UNITS) {
      rows.push([]);
      used = 0;
    }
    (rows[rows.length - 1] ?? []).push({ name, at: used, span, own: own.has(name) });
    used += span;
  }
  return rows;
}

function PosesPageView({ card }: { card: CharacterCard }) {
  const cast = castFromCard(card);
  const head = POSE_HEAD * cast.size;
  return (
    <>
      <Heading card={card} what="poses" />
      {poseRows(card).map((row, r) => {
        const groundY = TOP + POSE_ROW * r + POSE_ROW - 78;
        return (
          <g key={r}>
            <rect x={0} y={groundY} width={SHEET_WIDTH} height={22} fill={ground} />
            {row.map(({ name, at, span, own }) => {
              const seated = span === 2;
              const pose = poseOf(name);
              const cx = (at + span / 2) * UNIT;
              // Someone sitting has the desk two heads in front of them.
              const x = seated ? cx - 1.25 * head : cx;
              const face = POSE_FACE[name];
              return (
                <g key={name}>
                  {seated && (
                    <>
                      <StandingProp
                        id="chair"
                        uid={`ch-${name}`}
                        x={x}
                        groundY={groundY}
                        head={head}
                        t={0}
                      />
                    </>
                  )}
                  <Character
                    x={x - pose.rootX * head}
                    groundY={groundY}
                    head={head}
                    pose={pose}
                    face={face ? EXPRESSIONS[face] : cast.face}
                    turn={POSE_TURN[name] ?? 0.5}
                    {...cast.look}
                  />
                  {/* The desk, and what lies on it, in front of whoever sits at it. */}
                  {seated && (
                    <StandingProp
                      id="game-table"
                      uid={`tb-${name}`}
                      x={x + 2 * head}
                      groundY={groundY}
                      head={head}
                      t={0}
                    />
                  )}
                  {name === 'sit-reach' && (
                    <StandingProp
                      id="golden-ball"
                      uid={`ball-${name}`}
                      x={x + 1.07 * head}
                      groundY={groundY}
                      head={head}
                      t={0}
                      up={1.22}
                    />
                  )}
                  <Words x={cx} y={groundY + 58} size={26}>
                    {plain('pose', name)}
                  </Words>
                  {own && (
                    <Words x={cx} y={groundY + 88} size={20} bold={false}>
                      their own
                    </Words>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
}

const sheetHeight = ({ card, page }: CharacterSheetProps): number =>
  page === 'sheet'
    ? 1150
    : page === 'expressions'
      ? TOP + FACE_ROW * Math.ceil((card.expressions ?? [card.expression]).length / 4) + 10
      : TOP + POSE_ROW * poseRows(card).length + 30;

export const calculateSheetMetadata: CalculateMetadataFunction<CharacterSheetProps> = ({
  props,
}) => ({ width: SHEET_WIDTH, height: sheetHeight(props) });

export const CharacterSheet = (props: CharacterSheetProps) => {
  const height = sheetHeight(props);
  return (
    <AbsoluteFill style={{ backgroundColor: field }}>
      <svg width={SHEET_WIDTH} height={height} viewBox={`0 0 ${SHEET_WIDTH} ${height}`}>
        {props.page === 'sheet' && <SheetPageView card={props.card} />}
        {props.page === 'expressions' && <ExpressionsPageView card={props.card} />}
        {props.page === 'poses' && <PosesPageView card={props.card} />}
      </svg>
    </AbsoluteFill>
  );
};

/** A card as a plain stick figure, for the composition's default. */
export const SHEET_PLACEHOLDER: CharacterSheetProps = {
  card: {
    id: 'nobody',
    name: 'Nobody',
    description: 'A plain stick figure, until a card is given.',
    tags: ['placeholder', 'plain'],
    age: 'adult',
    size: 1,
    eyeStyle: 'round',
    expression: 'neutral',
    version: 1,
    added: '2026-10-11',
  },
  page: 'sheet',
};

export const LINEUP_SIZE = { width: 1920, height: 1080 } as const;
export type CastLineupProps = { cards: CharacterCard[]; names: boolean };

/** How far from the middle of the desk each pair stands, in heads: the near one, the far one. */
const BESIDE_TABLE = [2.3, 3.65] as const;
/** How far apart the ones further out stand: close enough that a cast of five stays in the picture. */
const FURTHER_OUT = 1.35;

/**
 * A cast standing together at the game table on the game-show stage, as a wide shot of a video
 * would show them: the first half of the cards to the left of the desk, the rest to the right,
 * everyone turned a little toward the middle.
 */
export const CastLineup = ({ cards, names }: CastLineupProps) => {
  const size = LINEUP_SIZE;
  const stage = stageFor(
    { place: 'game-show', treatment: 'atmospheric', palette: 'warm-interior' },
    size,
    4182,
  );
  const half = Math.ceil(cards.length / 2);
  const spots = cards.map((card, i) => {
    const onLeft = i < half;
    // Counted outward from the desk on each side.
    const rank = onLeft ? half - 1 - i : i - half;
    const out = BESIDE_TABLE[rank] ?? BESIDE_TABLE[1] + FURTHER_OUT * (rank - 1);
    const facing: Facing = onLeft ? 'right' : 'left';
    return { card, x: stage.centre + (onLeft ? -1 : 1) * out * stage.head, facing };
  });
  const onDesk = (id: string, x: number, key: string) => (
    <StandingProp
      key={key}
      id={id}
      uid={`lineup-${key}`}
      x={stageX(stage, x)}
      groundY={stage.groundY}
      head={stage.head}
      t={0}
      up={1.22}
    />
  );
  return (
    <AbsoluteFill>
      <svg {...size} viewBox={`0 0 ${size.width} ${size.height}`}>
        <Background spec={stage.background} {...size} frame={0} fps={tokens.motion.fps} />
        <StandingProp
          id="game-table"
          uid="lineup-table"
          x={stage.centre}
          groundY={stage.groundY}
          head={stage.head}
          t={0}
        />
        {onDesk('cash-pile', 0.5, 'cash')}
        {[0.355, 0.397, 0.603, 0.645].map((x) => onDesk('golden-ball', x, `ball-${x}`))}
        {spots.map(({ card, x, facing }) => {
          const cast = castFromCard(card);
          const head = stage.head * cast.size;
          return (
            <g key={card.id}>
              <Character
                x={x}
                groundY={stage.groundY}
                head={head}
                facing={facing}
                pose={resolvePose(stand)}
                face={cast.face}
                turn={0.3}
                {...cast.look}
              />
              {names && (
                <text
                  x={x}
                  y={stage.groundY + 0.62 * stage.head}
                  textAnchor="middle"
                  fontFamily={font}
                  fontWeight={700}
                  fontSize={0.23 * stage.head}
                  fill={white}
                  stroke={ink}
                  strokeWidth={0.04 * stage.head}
                  paintOrder="stroke"
                  strokeLinejoin={tokens.line.join}
                >
                  {card.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
