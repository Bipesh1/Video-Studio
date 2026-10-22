import { EXPRESSIONS } from '../face/expressions';
import { Character, toScreen } from '../rig/Character';
import { clamp, lerp } from '../rig/math';
import { blendPoses, resolvePose } from '../rig/pose';
import { stand, wave } from '../rig/poses';
import { computeSkeleton } from '../rig/skeleton';
import type { ResolvedPose } from '../rig/types';
import { accent, ink, lineWeights, pick } from '../tokens';
import { outfitFrom } from '../wardrobe/garments';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import type { PropProps } from './Hold';
import { ironPaint } from './Table';

/**
 * The back row (Style 7: "crowds are tier 0 figures in the midground, smaller, still
 * outlined"): four plain stick figures standing in a gallery along the back wall, a plank with
 * a rail, above and behind whoever the scene is about. The wall under it stays open, so the
 * chairs and the table in front still read against the light. They are the others in the room: the public, or, wearing a small
 * gold badge, people working for the House. They are not characters: no names, no colours, no
 * lines. The origin is on the ground under the middle of the gallery; its middle is left empty
 * for someone standing in front of it.
 */
export const BACK_ROW = {
  /** How high the gallery floor is, in heads: the whole row clears the heads of people sitting in front. */
  step: 1.95,
  /** The size of a figure in the row beside a person in front. */
  scale: 0.58,
  /** Where each stands along the step, left to right, in heads from the middle. */
  places: [-1.95, -0.98, 0.98, 1.95],
  /** Half the length of the gallery. */
  half: 2.45,
  /** How much of their light is left at that distance (Style 5: depth by value). */
  light: 0.62,
} as const;

/** What the row is doing. */
export type RowState = 'calm' | 'raising' | 'raised' | 'turned';

/** How high the rail is above the plank, and where its posts stand, between the figures. */
const RAIL = 0.6;
const POSTS = [-2.42, -1.46, -0.5, 0.5, 1.46, 2.42] as const;

/** How much of the gallery's own light is left: more than the figures', so it still holds them up. */
const STRUCTURE_LIGHT = 0.72;

/**
 * What the row wears: a plain grey suit, so they are dressed like everyone else in the room and
 * still stay in the background (Biku, 2026-10-14: "make all these guys who actually appear in
 * there all wear clothes"; he picked look 3 of three).
 */
const ROW_CLOTHES = outfitFrom(
  {
    top: { kind: 'jacket', cloth: 'steel', under: 'white' },
    bottom: { kind: 'trousers', cloth: 'steel' },
    shoes: { kind: 'boots', cloth: 'steel' },
  },
  'back-row',
);

const STAND = resolvePose(stand);
const HAND_UP = resolvePose(wave);
/** Seconds into the shot the first hand goes up, between one hand and the next, and for one hand to rise. */
const RAISE = { first: 0.35, gap: 0.45, takes: 0.3 } as const;

const poseOf = (state: RowState, i: number, shotT: number): ResolvedPose => {
  if (state === 'raised') return HAND_UP;
  if (state !== 'raising') return STAND;
  // One after another, left to right: each sees the one before and follows.
  const k = clamp((shotT - RAISE.first - i * RAISE.gap) / RAISE.takes, 0, 1);
  return k <= 0 ? STAND : blendPoses(STAND, HAND_UP, k);
};

export function BackRow({
  uid,
  shadowSide,
  state = 'calm',
  badged = false,
  shotT = 0,
}: PropProps & { state?: RowState; badged?: boolean; shotT?: number }) {
  const { step, scale, places, half, light } = BACK_ROW;
  const gold = accent('gold');
  const iron = ironPaint();
  const figures = places.map((x, i) => {
    const at = { x, groundY: -step, head: scale, facing: x < 0 ? 'right' : 'left' } as const;
    const pose = poseOf(state, i, shotT);
    const joints = computeSkeleton(pose, {
      shoulderSpread: ROW_CLOTHES.shoulderSpread ?? 0,
      hipSpread: ROW_CLOTHES.hipSpread ?? 0,
      turn: 0.35,
    });
    // A badge sits on the chest, well under the chin, on the line of the body.
    const chest = toScreen(
      {
        x: lerp(joints.shoulder.x, joints.hip.x, 0.42),
        y: lerp(joints.shoulder.y, joints.hip.y, 0.42),
      },
      at,
    );
    return { at, pose, chest, key: `${uid}-row-${i}` };
  });
  return (
    <g>
      <g opacity={light}>
        {figures.map(({ at, pose, key }) => (
          <Character
            key={key}
            {...at}
            pose={pose}
            face={EXPRESSIONS.neutral}
            turn={0.35}
            outfit={ROW_CLOTHES}
            back={state === 'turned'}
          />
        ))}
      </g>
      {/* The badge keeps its full gold: it is the one thing in the row meant to be noticed. */}
      {badged && state !== 'turned'
        ? figures.map(({ chest, key }) => (
            <circle
              key={`${key}-badge`}
              cx={chest.x}
              cy={chest.y}
              r={scale * 0.13}
              fill={pick(gold, 0)}
              stroke={ink}
              strokeWidth={lineWeights.detail * scale * 1.4}
            />
          ))
        : null}
      {/* The gallery: the plank they stand on, and a rail at the waist on thin posts. It is as far
          back as they are, so it is as quiet. */}
      <g opacity={STRUCTURE_LIGHT}>
        {POSTS.map((x) => (
          <Shaded
            key={x}
            id={`${uid}-row-post-${x}`}
            d={`M ${x - 0.03} ${-step} L ${x - 0.03} ${-step - RAIL} L ${x + 0.03} ${-step - RAIL} L ${x + 0.03} ${-step} Z`}
            {...iron}
            offset={lightOffset(shadowSide, 0.012)}
          />
        ))}
        <Shaded
          id={`${uid}-row-rail`}
          d={`M ${-half} ${-step - RAIL} L ${-half} ${-step - RAIL - 0.07} L ${half} ${-step - RAIL - 0.07} L ${half} ${-step - RAIL} Z`}
          {...iron}
          offset={lightOffset(shadowSide, 0.015)}
        />
        <Shaded
          id={`${uid}-row-plank`}
          d={`M ${-half} ${-step + 0.14} L ${-half} ${-step} L ${half} ${-step} L ${half} ${-step + 0.14} Z`}
          {...iron}
          offset={lightOffset(shadowSide, 0.03)}
        />
      </g>
    </g>
  );
}
