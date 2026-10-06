import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** How high the table top is and how wide the table is by default, in head units. */
export const TABLE = { top: 1.22, width: 2.4 } as const;

/**
 * A wooden table seen from the side (Style 4), standing on the ground with the middle of its
 * width at the origin. Things stand on it at y = -TABLE.top. Stand it with Placed; draw it
 * after a character sitting behind it and before anything on its top.
 */
export function Table({ uid, shadowSide, width = TABLE.width }: PropProps & { width?: number }) {
  const wood = paintOf('brown');
  const top = paintOf('tan');
  const w = width / 2;
  const t = TABLE.top;
  const off = lightOffset(shadowSide, 0.035);
  const leg = (x: number, key: string) => (
    <Shaded
      key={key}
      id={`${uid}-table-${key}`}
      d={`M ${x - 0.07} 0 L ${x - 0.08} ${-t + 0.2} L ${x + 0.08} ${-t + 0.2} L ${x + 0.07} 0 Z`}
      {...wood}
      offset={lightOffset(shadowSide, 0.025)}
    />
  );
  return (
    <g>
      {leg(-w + 0.24, 'leg-a')}
      {leg(w - 0.24, 'leg-b')}
      <Shaded
        id={`${uid}-table-apron`}
        d={`M ${-w + 0.12} ${-t + 0.1} L ${w - 0.12} ${-t + 0.1} L ${w - 0.12} ${-t + 0.3} L ${-w + 0.12} ${-t + 0.3} Z`}
        {...wood}
        offset={off}
      />
      <Shaded
        id={`${uid}-table-top`}
        d={`M ${-w} ${-t} L ${w} ${-t} L ${w} ${-t + 0.13} L ${-w} ${-t + 0.13} Z`}
        {...top}
        offset={off}
      />
      {detail(`M ${-w + 0.3} ${-t + 0.2} L ${w - 0.3} ${-t + 0.2}`)}
      <Glint x={-w + 0.4} y={-t + 0.05} length={0.3} />
    </g>
  );
}
