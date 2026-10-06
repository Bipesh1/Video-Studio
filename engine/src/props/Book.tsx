import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** The closed book's width and height, in head units. */
export const BOOK = { width: 0.56, height: 0.7 } as const;

/**
 * A book (Style 4) with its middle at the origin. Closed: a bright cover with a gold mark, the
 * edge of the pages showing down one side. Open: two cream pages with a few lines of writing,
 * the cover showing round the edge. Hold it with InHand how="upright"; an open book sits a
 * little above the hands of someone reading.
 */
export function Book({
  uid,
  shadowSide,
  paint = 'crimson',
  open = false,
}: PropProps & { paint?: string; open?: boolean }) {
  const cover = paintOf(paint);
  const pages = paintOf('cream');
  const gold = paintOf('gold');
  const off = lightOffset(shadowSide, 0.035);
  if (open) {
    return (
      <g>
        <Shaded
          id={`${uid}-book-cover`}
          d="M -0.56 -0.3 L 0.56 -0.3 L 0.56 0.36 L 0 0.42 L -0.56 0.36 Z"
          {...cover}
          offset={off}
        />
        <Shaded
          id={`${uid}-book-pages`}
          d="M -0.5 -0.34 Q -0.25 -0.4 0 -0.3 Q 0.25 -0.4 0.5 -0.34 L 0.5 0.3 Q 0.25 0.24 0 0.34 Q -0.25 0.24 -0.5 0.3 Z"
          {...pages}
          offset={lightOffset(shadowSide, 0.03)}
          strokeWidth={0.03}
        />
        {detail('M 0 -0.3 L 0 0.34')}
        {detail('M -0.4 -0.16 L -0.12 -0.18')}
        {detail('M -0.4 0 L -0.12 -0.02')}
        {detail('M 0.12 -0.18 L 0.4 -0.16')}
        {detail('M 0.12 -0.02 L 0.4 0')}
      </g>
    );
  }
  const w = BOOK.width / 2;
  const h = BOOK.height / 2;
  return (
    <g>
      {/* The block of pages shows along the right side and the bottom. */}
      <Shaded
        id={`${uid}-book-pages`}
        d={`M ${-w + 0.05} ${-h + 0.04} L ${w} ${-h + 0.04} L ${w} ${h} L ${-w + 0.05} ${h} Z`}
        {...pages}
        offset={lightOffset(shadowSide, 0.02)}
        strokeWidth={0.03}
      />
      <Shaded
        id={`${uid}-book-cover`}
        d={`M ${-w} ${-h} L ${w - 0.05} ${-h} L ${w - 0.05} ${h - 0.05} L ${-w} ${h - 0.05} Z`}
        {...cover}
        offset={off}
      />
      {detail(`M ${-w + 0.08} ${-h} L ${-w + 0.08} ${h - 0.05}`)}
      <Shaded
        id={`${uid}-book-mark`}
        d="M -0.08 -0.16 L 0.12 -0.16 L 0.12 0.02 L -0.08 0.02 Z"
        {...gold}
        offset={lightOffset(shadowSide, 0.015)}
        strokeWidth={0.03}
      />
      <Glint x={0.04} y={-0.27} length={0.14} />
    </g>
  );
}
