import { lineWeights, shade } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** The doorway's width and height, in head units: a standing character is about 3.5 high. */
export const DOOR = { width: 2, height: 4.1 } as const;

/**
 * A wooden door in its frame (Style 4), standing on the ground with the middle of its
 * threshold at the origin. Planks, two iron bands and a gold ring to pull. `open` runs from 0
 * (shut) to 1 (wide open): the door swings on its left edge and shows the dark of the room
 * behind. Stand it with Placed; draw a character after it to put them in the doorway.
 */
export function Door({ uid, shadowSide, open = 0 }: PropProps & { open?: number }) {
  const wood = paintOf('brown');
  const iron = paintOf('steel');
  const gold = paintOf('gold');
  const w = DOOR.width / 2;
  const h = DOOR.height;
  const swing = Math.max(0, Math.min(1, open));
  // Seen from the front, an opening door gets narrower as it turns on its hinges.
  const leaf = (2 * w - 0.2) * (1 - 0.72 * swing);
  const left = -w + 0.1;
  const x = (u: number) => left + leaf * u;
  const off = lightOffset(shadowSide, 0.05);
  return (
    <g>
      <Shaded
        id={`${uid}-door-frame`}
        d={`M ${-w - 0.14} 0 L ${-w - 0.14} ${-h - 0.14} L ${w + 0.14} ${-h - 0.14} L ${w + 0.14} 0 Z`}
        fill={wood.shadow}
        shadow={shade(wood.shadow, 0.25)}
        offset={off}
      />
      {/* The room behind: dark, and only seen once the door starts to open. */}
      <rect
        x={-w + 0.1}
        y={-h + 0.02}
        width={2 * w - 0.2}
        height={h - 0.02}
        fill={shade(wood.shadow, 0.7)}
      />
      <Shaded
        id={`${uid}-door-leaf`}
        d={`M ${x(0)} 0 L ${x(0)} ${-h + 0.02} L ${x(1)} ${-h + 0.02} L ${x(1)} 0 Z`}
        {...wood}
        offset={off}
      />
      {detail(`M ${x(1 / 3)} ${-h + 0.02} L ${x(1 / 3)} 0`)}
      {detail(`M ${x(2 / 3)} ${-h + 0.02} L ${x(2 / 3)} 0`)}
      {[-h * 0.8, -h * 0.22].map((y, i) => (
        <Shaded
          key={i}
          id={`${uid}-door-band${i}`}
          d={`M ${x(0)} ${y - 0.1} L ${x(0.82)} ${y - 0.1} L ${x(0.82)} ${y + 0.1} L ${x(0)} ${y + 0.1} Z`}
          {...iron}
          offset={lightOffset(shadowSide, 0.025)}
          strokeWidth={lineWeights.detail}
        />
      ))}
      <Shaded
        id={`${uid}-door-ring`}
        d={`M ${x(0.8) - 0.11} ${-h * 0.5} A 0.11 0.11 0 1 0 ${x(0.8) + 0.11} ${-h * 0.5} A 0.11 0.11 0 1 0 ${x(0.8) - 0.11} ${-h * 0.5} Z`}
        {...gold}
        offset={lightOffset(shadowSide, 0.03)}
      />
      <Glint x={x(0.8) - 0.03} y={-h * 0.5 - 0.04} length={0.06} turn={-35} />
    </g>
  );
}
