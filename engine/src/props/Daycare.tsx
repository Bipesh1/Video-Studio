import { VIEWER_FONT } from '../overlays/text';
import { clamp, easeOutBack } from '../rig/math';
import { accent, ink, lineWeights, pick } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * Things of a daycare at closing time (Style 4), for the late fine (2026-10-17): the notice
 * board by the door, which holds the rule the story turns on. Outlined, a flat fill, one shadow
 * tone and one glint, like every prop.
 */

/** The board's size, in head units, round its middle. */
export const NOTICE_BOARD = { width: 1.7, height: 1.25 } as const;

/** What is pinned to the board: nothing, the fine, or the fine taken back. */
export const NOTES = {
  none: null,
  fine: { lines: ['LATE FINE', '$3'], stress: 1 },
  'no-fine': { lines: ['NO MORE', 'LATE FINE'], stress: 0 },
} as const;
export type Note = keyof typeof NOTES;

/** When a note being pinned arrives, in seconds from the start of its shot. */
export const PIN_AT = 0.5;

const font = `${VIEWER_FONT}, sans-serif`;

/**
 * A cork board in a wooden frame, hung on the wall round its middle, with two old slips of paper
 * pinned in its corners. `note` is the sheet in the middle; with `pinT` (seconds since the shot
 * began) it is pinned up PIN_AT seconds in, with a small bounce.
 */
export function NoticeBoard({
  uid,
  shadowSide,
  note = 'none',
  pinT,
}: PropProps & { note?: Note; pinT?: number }) {
  const frame = paintOf('brown');
  const cork = paintOf('tan');
  const paper = paintOf('cream');
  const red = pick(accent('crimson'), 0);
  const w = NOTICE_BOARD.width / 2;
  const h = NOTICE_BOARD.height / 2;
  const off = lightOffset(shadowSide, 0.04);
  const box = (x0: number, y0: number, x1: number, y1: number) =>
    `M ${x0} ${y0} L ${x1} ${y0} L ${x1} ${y1} L ${x0} ${y1} Z`;
  const pin = (x: number, y: number, key: string) => (
    <circle
      key={key}
      cx={x}
      cy={y}
      r={0.04}
      fill={red}
      stroke={ink}
      strokeWidth={lineWeights.detail}
    />
  );
  const sheet = NOTES[note];
  const grow =
    pinT === undefined ? 1 : clamp(easeOutBack(clamp((pinT - PIN_AT) / 0.35, 0, 1), 1.6), 0, 1.2);
  return (
    <g>
      <Shaded id={`${uid}-board-frame`} d={box(-w, -h, w, h)} {...frame} offset={off} />
      <Shaded
        id={`${uid}-board-cork`}
        d={box(-w + 0.1, -h + 0.1, w - 0.1, h - 0.1)}
        {...cork}
        offset={lightOffset(shadowSide, 0.02)}
        strokeWidth={lineWeights.detail}
      />
      {/* Old slips in the corners, left from other days. */}
      <Shaded
        id={`${uid}-board-slip1`}
        d={box(-w + 0.18, -h + 0.18, -w + 0.46, -h + 0.5)}
        {...paper}
        offset={lightOffset(shadowSide, 0.015)}
        strokeWidth={lineWeights.detail}
      />
      {detail(`M ${-w + 0.24} ${-h + 0.3} L ${-w + 0.4} ${-h + 0.3}`, 's1')}
      {detail(`M ${-w + 0.24} ${-h + 0.38} L ${-w + 0.36} ${-h + 0.38}`, 's2')}
      {pin(-w + 0.32, -h + 0.22, 'p1')}
      <Shaded
        id={`${uid}-board-slip2`}
        d={box(w - 0.48, h - 0.46, w - 0.18, h - 0.18)}
        {...paper}
        offset={lightOffset(shadowSide, 0.015)}
        strokeWidth={lineWeights.detail}
      />
      {pin(w - 0.33, h - 0.42, 'p2')}
      {sheet && grow > 0 && (
        <g transform={`scale(${grow})`}>
          <Shaded
            id={`${uid}-board-note`}
            d={box(-0.5, -0.4, 0.5, 0.42)}
            fill={paper.fill}
            shadow={paper.shadow}
            offset={lightOffset(shadowSide, 0.02)}
          />
          {sheet.lines.map((line, k) => (
            <g key={line} transform={`translate(0 ${k === 0 ? -0.06 : 0.3}) scale(0.01)`}>
              <text
                textAnchor="middle"
                fontFamily={font}
                fontWeight={800}
                fontSize={k === sheet.stress ? (line.length < 4 ? 32 : 21) : 19}
                fill={k === sheet.stress ? red : ink}
              >
                {line}
              </text>
            </g>
          ))}
          {pin(0, -0.33, 'p3')}
          <Glint x={0.38} y={-0.34} length={0.08} turn={-35} />
        </g>
      )}
    </g>
  );
}
