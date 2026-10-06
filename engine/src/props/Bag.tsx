import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** How far the bottom of the bag hangs below the point it is held by, in head units. */
export const BAG_DROP = 1.04;
/** Half the height of the stretch of neck a fist closes round. */
const GRIP = 0.115;

/**
 * A cloth bag tied at the neck (Style 4): a sack of coins, grain or loot. The origin is the
 * middle of its gathered neck, where a hand holds it: the gathered cloth shows above the
 * fist, the tie and the full bag hang below it, so the hand grips the bag instead of sitting
 * on it (Biku, 2026-10-06). Hold it with InHand how="hang" and a gripping hand, or stand it
 * on the ground with Placed at its bottom (BAG_DROP below the origin).
 */
export function Bag({ uid, shadowSide, paint = 'tan' }: PropProps & { paint?: string }) {
  const cloth = paintOf(paint);
  const tie = paintOf('brown');
  const off = lightOffset(shadowSide, 0.05);
  return (
    <g>
      {/* The neck: a narrow stretch of gathered cloth, the part a fist closes round. */}
      <Shaded
        id={`${uid}-bag-neck`}
        d={`M -0.07 ${-GRIP - 0.02} L 0.07 ${-GRIP - 0.02} Q 0.075 0 0.1 ${GRIP + 0.06} L -0.1 ${GRIP + 0.06} Q -0.075 0 -0.07 ${-GRIP - 0.02} Z`}
        {...cloth}
        offset={lightOffset(shadowSide, 0.02)}
      />
      {/* The gathered cloth fanning out above the hand. */}
      <Shaded
        id={`${uid}-bag-top`}
        d={`M -0.085 ${-GRIP} Q -0.21 ${-GRIP - 0.1} -0.17 ${-GRIP - 0.19} Q -0.06 ${-GRIP - 0.12} 0 ${-GRIP - 0.21} Q 0.07 ${-GRIP - 0.12} 0.18 ${-GRIP - 0.18} Q 0.21 ${-GRIP - 0.09} 0.085 ${-GRIP} Z`}
        {...cloth}
        offset={lightOffset(shadowSide, 0.03)}
      />
      <Shaded
        id={`${uid}-bag-body`}
        d={`M -0.09 ${GRIP + 0.1} Q -0.4 ${GRIP + 0.3} -0.38 ${GRIP + 0.6} Q -0.36 ${BAG_DROP} 0 ${BAG_DROP} Q 0.36 ${BAG_DROP} 0.38 ${GRIP + 0.6} Q 0.4 ${GRIP + 0.3} 0.09 ${GRIP + 0.1} Z`}
        {...cloth}
        offset={off}
      />
      {/* The tie, just below where the hand holds. */}
      <Shaded
        id={`${uid}-bag-tie`}
        d={`M -0.115 ${GRIP + 0.04} L 0.115 ${GRIP + 0.04} L 0.115 ${GRIP + 0.12} L -0.115 ${GRIP + 0.12} Z`}
        {...tie}
        offset={lightOffset(shadowSide, 0.015)}
      />
      {detail(`M -0.05 ${GRIP + 0.22} Q -0.14 ${GRIP + 0.38} -0.12 ${GRIP + 0.54}`)}
      {detail(`M 0.08 ${GRIP + 0.24} Q 0.14 ${GRIP + 0.36} 0.12 ${GRIP + 0.48}`)}
      <Glint x={-0.2} y={GRIP + 0.5} length={0.1} turn={-70} />
    </g>
  );
}
