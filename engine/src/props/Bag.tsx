import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** How far the bottom of the bag hangs below its tied neck, in head units. */
export const BAG_DROP = 0.86;

/**
 * A cloth bag tied at the neck (Style 4): a sack of coins, grain or loot. The tied neck is at
 * the origin and the bag hangs below it. Hold it with InHand how="hang" and a gripping hand,
 * or stand it on the ground with Placed at its bottom (BAG_DROP below the origin).
 */
export function Bag({ uid, shadowSide, paint = 'tan' }: PropProps & { paint?: string }) {
  const cloth = paintOf(paint);
  const tie = paintOf('brown');
  const off = lightOffset(shadowSide, 0.05);
  return (
    <g>
      {/* The gathered cloth above the tie. */}
      <Shaded
        id={`${uid}-bag-top`}
        d="M -0.1 0.02 Q -0.2 -0.1 -0.16 -0.17 Q -0.06 -0.11 0 -0.19 Q 0.07 -0.11 0.17 -0.16 Q 0.2 -0.08 0.1 0.02 Z"
        {...cloth}
        offset={lightOffset(shadowSide, 0.03)}
      />
      <Shaded
        id={`${uid}-bag-body`}
        d={`M -0.09 0.03 Q -0.4 0.22 -0.38 0.56 Q -0.36 ${BAG_DROP} 0 ${BAG_DROP} Q 0.36 ${BAG_DROP} 0.38 0.56 Q 0.4 0.22 0.09 0.03 Z`}
        {...cloth}
        offset={off}
      />
      <Shaded
        id={`${uid}-bag-tie`}
        d="M -0.12 -0.02 L 0.12 -0.02 L 0.12 0.06 L -0.12 0.06 Z"
        {...tie}
        offset={lightOffset(shadowSide, 0.015)}
      />
      {detail('M -0.05 0.14 Q -0.14 0.3 -0.12 0.46')}
      {detail('M 0.08 0.16 Q 0.14 0.28 0.12 0.4')}
      <Glint x={-0.2} y={0.42} length={0.1} turn={-70} />
    </g>
  );
}
