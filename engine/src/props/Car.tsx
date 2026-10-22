import { accent, ink, lineWeights, pick, tokens } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * A small car seen from the side (Style 4), for a street of stuck traffic (the late fine,
 * 2026-10-17). Its windows are open glass: someone sitting at the car's x in a sitting pose
 * shows through them from the chest up, and the body hides the rest. The car stands on the
 * ground with its middle at the origin and faces right. In head units: a standing character is
 * about 3.5 high.
 */
export const CAR = { length: 4.6, roof: 3.05, beltline: 1.55, wheel: 0.42 } as const;

/** The cloth colours a car comes in. */
export const CAR_PAINTS = ['ocean', 'crimson', 'gold', 'steel'] as const;
export type CarPaint = (typeof CAR_PAINTS)[number];

export function Car({ uid, shadowSide, paint = 'ocean' }: PropProps & { paint?: CarPaint }) {
  const body = paintOf(paint);
  const tyre = paintOf('steel');
  const glass = pick(accent('glint'), 0);
  const l = CAR.length / 2;
  const off = lightOffset(shadowSide, 0.05);
  const r = CAR.wheel;
  // The sills come down close to the road, so the feet of someone sitting inside never show.
  const bottom = -0.08;
  const belt = -CAR.beltline;
  const roof = -CAR.roof;
  // The body below the windows: a long box with a rounded nose and tail and two wheel arches.
  const lower = [
    `M ${-l} ${bottom - 0.1}`,
    `L ${-l} ${belt + 0.3}`,
    `Q ${-l} ${belt} ${-l + 0.35} ${belt}`,
    `L ${l - 0.55} ${belt}`,
    `Q ${l} ${belt + 0.05} ${l} ${belt + 0.45}`,
    `L ${l} ${bottom - 0.1}`,
    `Q ${l} ${bottom} ${l - 0.12} ${bottom}`,
    `L ${l * 0.62 + r + 0.12} ${bottom}`,
    `A ${r + 0.12} ${r + 0.12} 0 0 0 ${l * 0.62 - r - 0.12} ${bottom}`,
    `L ${-l * 0.62 + r + 0.12} ${bottom}`,
    `A ${r + 0.12} ${r + 0.12} 0 0 0 ${-l * 0.62 - r - 0.12} ${bottom}`,
    `L ${-l + 0.12} ${bottom}`,
    `Q ${-l} ${bottom} ${-l} ${bottom - 0.1}`,
    'Z',
  ].join(' ');
  // The cabin: two pillars and a roof round two open windows.
  const front = l * 0.42;
  const back = -l * 0.78;
  const cabin = [
    `M ${back} ${belt}`,
    `L ${back + 0.35} ${roof + 0.1}`,
    `Q ${back + 0.4} ${roof} ${back + 0.55} ${roof}`,
    `L ${front - 0.55} ${roof}`,
    `Q ${front - 0.4} ${roof} ${front - 0.3} ${roof + 0.12}`,
    `L ${front + 0.35} ${belt}`,
    'Z',
  ].join(' ');
  const pane = (x0: number, x1: number, lean0: number, lean1: number) =>
    `M ${x0} ${belt - 0.02} L ${x0 + lean0} ${roof + 0.2} L ${x1 - lean1} ${roof + 0.2} L ${x1} ${belt - 0.02} Z`;
  const mid = (back + front) / 2 + 0.25;
  return (
    <g>
      {/* The cabin: its frame is the body colour with the two windows cut out of it. */}
      <path d={pane(back + 0.12, mid - 0.08, 0.28, 0)} fill={glass} opacity={0.22} />
      <path d={pane(mid + 0.08, front + 0.22, 0, 0.5)} fill={glass} opacity={0.22} />
      <path
        d={`${cabin} ${pane(back + 0.12, mid - 0.08, 0.28, 0)} ${pane(mid + 0.08, front + 0.22, 0, 0.5)}`}
        fill={body.fill}
        fillRule="evenodd"
        stroke={ink}
        strokeWidth={lineWeights.outline}
        strokeLinejoin={tokens.line.join}
      />
      <Glint x={front - 0.2} y={roof + 0.45} length={0.22} turn={-55} />
      {/* The dark underside between the wheels: the road under a car is in shadow, and it hides
          the feet of whoever sits inside. */}
      <path
        d={`M ${-l * 0.62} 0 L ${-l * 0.62} ${bottom} L ${l * 0.62} ${bottom} L ${l * 0.62} 0 Z`}
        fill={tyre.shadow}
      />
      {[-l * 0.62, l * 0.62].map((x) => (
        <circle key={x} cx={x} cy={-r} r={r + 0.1} fill={tyre.shadow} />
      ))}
      <Shaded id={`${uid}-car-body`} d={lower} {...body} offset={off} />
      {detail(`M ${mid} ${belt + 0.05} L ${mid} ${bottom - 0.05}`, 'door')}
      {detail(`M ${mid - 0.55} ${belt + 0.45} L ${mid - 0.2} ${belt + 0.45}`, 'handle-a')}
      {detail(`M ${mid + 0.35} ${belt + 0.45} L ${mid + 0.7} ${belt + 0.45}`, 'handle-b')}
      {/* Lights: a pale headlamp at the nose, a red one at the tail. */}
      <path
        d={`M ${l - 0.04} ${belt + 0.55} L ${l - 0.3} ${belt + 0.55} L ${l - 0.3} ${belt + 0.8} L ${l - 0.02} ${belt + 0.8} Z`}
        fill={pick(accent('cream'), 0)}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      <path
        d={`M ${-l + 0.02} ${belt + 0.45} L ${-l + 0.24} ${belt + 0.45} L ${-l + 0.24} ${belt + 0.75} L ${-l + 0.02} ${belt + 0.75} Z`}
        fill={pick(accent('crimson'), 0)}
        stroke={ink}
        strokeWidth={lineWeights.detail}
      />
      {[-l * 0.62, l * 0.62].map((x, i) => (
        <g key={i}>
          <Shaded
            id={`${uid}-car-wheel${i}`}
            d={`M ${x - r} ${-r} A ${r} ${r} 0 1 0 ${x + r} ${-r} A ${r} ${r} 0 1 0 ${x - r} ${-r} Z`}
            {...tyre}
            offset={lightOffset(shadowSide, 0.03)}
          />
          <circle
            cx={x}
            cy={-r}
            r={r * 0.45}
            fill={pick(accent('steel'), 2)}
            stroke={ink}
            strokeWidth={lineWeights.detail}
          />
        </g>
      ))}
    </g>
  );
}
