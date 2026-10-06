import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** How long the sword is from pommel to point, in head units. */
export const SWORD_LENGTH = 1.6;

/**
 * A sword (Style 4), drawn along +x with the grip at the origin: a bright blade with a line
 * down the middle, a gold cross-guard and pommel, a brown grip. Hold it with InHand and a
 * gripping hand. A story prop only: it threatens, it is raised, it is never shown wounding
 * anyone (violence by implication, Style 4).
 */
export function Sword({ uid, shadowSide }: PropProps) {
  const blade = paintOf('glint');
  const gold = paintOf('gold');
  const grip = paintOf('brown');
  const off = lightOffset(shadowSide, 0.03);
  return (
    <g>
      <Shaded
        id={`${uid}-sword-blade`}
        d="M 0.14 -0.075 L 1.12 -0.075 L 1.38 0 L 1.12 0.075 L 0.14 0.075 Z"
        {...blade}
        offset={off}
      />
      {detail('M 0.22 0 L 1.08 0')}
      <Shaded
        id={`${uid}-sword-grip`}
        d="M -0.16 -0.045 L 0.1 -0.045 L 0.1 0.045 L -0.16 0.045 Z"
        {...grip}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <Shaded
        id={`${uid}-sword-guard`}
        d="M 0.08 -0.21 Q 0.13 -0.24 0.17 -0.21 L 0.17 0.21 Q 0.13 0.24 0.08 0.21 Z"
        {...gold}
        offset={off}
      />
      <Shaded
        id={`${uid}-sword-pommel`}
        d="M -0.27 0 A 0.065 0.065 0 1 0 -0.14 0 A 0.065 0.065 0 1 0 -0.27 0 Z"
        {...gold}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <Glint x={0.5} y={-0.038} length={0.26} />
    </g>
  );
}
