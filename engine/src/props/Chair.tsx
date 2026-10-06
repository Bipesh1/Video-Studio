import { body } from '../rig/body';
import { lineWeights } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** The seat is as high as a shin is long, which is where the sit pose puts the hips. */
export const SEAT_HEIGHT = body.shin;

/**
 * A chair seen from the side (Style 4), facing +x, standing on the ground. The origin is the
 * ground point under the sitter's hips, so a character in the sit pose at the same place sits
 * on it. chair: plain wood. throne: a tall gold frame with a cushioned back and seat, for a
 * ruler. Stand it with Placed and draw it before the character who sits on it; `flip` on
 * Placed turns it to face left.
 */
export function Chair({
  uid,
  shadowSide,
  kind = 'chair',
}: PropProps & { kind?: 'chair' | 'throne' }) {
  const s = SEAT_HEIGHT;
  const off = lightOffset(shadowSide, 0.04);
  if (kind === 'throne') {
    const gold = paintOf('gold');
    const cushion = paintOf('crimson');
    return (
      <g>
        <Shaded
          id={`${uid}-throne-back`}
          d={`M -0.5 0 L -0.5 -2.5 Q -0.34 -2.78 -0.18 -2.5 L -0.18 ${-s} L -0.5 ${-s} Z`}
          {...gold}
          offset={off}
        />
        <Shaded
          id={`${uid}-throne-pad`}
          d={`M -0.2 ${-s - 0.1} L -0.2 -2.3 Q -0.1 -2.36 -0.06 -2.26 L -0.06 ${-s - 0.1} Z`}
          {...cushion}
          offset={lightOffset(shadowSide, 0.02)}
          strokeWidth={lineWeights.detail}
        />
        <Shaded
          id={`${uid}-throne-base`}
          d={`M -0.5 0 L -0.5 ${-s + 0.02} L 0.62 ${-s + 0.02} L 0.62 0 Z`}
          {...gold}
          offset={off}
        />
        <Shaded
          id={`${uid}-throne-seat`}
          d={`M -0.2 ${-s - 0.1} L 0.66 ${-s - 0.1} Q 0.72 ${-s - 0.04} 0.66 ${-s + 0.04} L -0.2 ${-s + 0.04} Z`}
          {...cushion}
          offset={lightOffset(shadowSide, 0.02)}
          strokeWidth={lineWeights.detail}
        />
        {/* The armrest and its post. */}
        <Shaded
          id={`${uid}-throne-arm`}
          d={`M -0.3 ${-s - 0.52} L 0.56 ${-s - 0.52} Q 0.66 ${-s - 0.45} 0.56 ${-s - 0.38} L 0.52 ${-s - 0.38} L 0.52 ${-s + 0.02} L 0.4 ${-s + 0.02} L 0.4 ${-s - 0.38} L -0.3 ${-s - 0.38} Z`}
          {...gold}
          offset={lightOffset(shadowSide, 0.025)}
        />
        {detail(`M -0.36 -0.12 L 0.48 -0.12`)}
        <Glint x={-0.34} y={-2.45} length={0.1} turn={-60} />
      </g>
    );
  }
  const wood = paintOf('brown');
  return (
    <g>
      <Shaded
        id={`${uid}-chair-back`}
        d={`M -0.42 0 L -0.44 -1.72 Q -0.37 -1.8 -0.3 -1.72 L -0.3 0 Z`}
        {...wood}
        offset={off}
      />
      <Shaded
        id={`${uid}-chair-leg`}
        d={`M 0.4 0 L 0.4 ${-s + 0.02} L 0.52 ${-s + 0.02} L 0.52 0 Z`}
        {...wood}
        offset={lightOffset(shadowSide, 0.025)}
      />
      <Shaded
        id={`${uid}-chair-seat`}
        d={`M -0.44 ${-s - 0.08} L 0.58 ${-s - 0.08} L 0.58 ${-s + 0.04} L -0.44 ${-s + 0.04} Z`}
        {...wood}
        offset={lightOffset(shadowSide, 0.025)}
      />
      {detail(`M -0.3 -0.3 L 0.4 -0.3`)}
      {detail(`M -0.43 -1.3 L -0.31 -1.3`)}
      <Glint x={-0.1} y={-s - 0.045} length={0.16} />
    </g>
  );
}
