import { tokens, white } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import type { PropProps } from './Hold';

/**
 * Weather a shot can be about: a gust of wind and a cloud that rains. The cloud is a thing and
 * is outlined; moving air and falling water are not, so they have no outline.
 */

/** A gust of wind: three pale lines that curl at the end and drift. Its middle is the origin. */
export function Wind({ t = 0 }: Partial<PropProps> & { t?: number }) {
  const line = (y: number, length: number, phase: number, key: string) => {
    const x = 0.14 * Math.sin(t * 1.6 + phase);
    const from = -length / 2 + x;
    const to = length / 2 + x;
    return (
      <path
        key={key}
        d={`M ${from} ${y} Q ${from + length * 0.5} ${y - 0.2} ${to - 0.3} ${y} Q ${to + 0.08} ${y + 0.14} ${to + 0.08} ${y - 0.12} Q ${to + 0.06} ${y - 0.32} ${to - 0.16} ${y - 0.28}`}
        fill="none"
        stroke={white}
        strokeWidth={0.075}
        strokeLinecap={tokens.line.cap}
        strokeLinejoin={tokens.line.join}
        opacity={0.86}
      />
    );
  };
  return (
    <g>
      {line(-0.42, 1.7, 0, 'a')}
      {line(0, 2.3, 1.3, 'b')}
      {line(0.42, 1.4, 2.6, 'c')}
    </g>
  );
}

/** A white cloud that rains: drops fall from it on a loop. The bottom of the cloud is the origin. */
export function RainCloud({ uid, shadowSide, t = 0 }: PropProps & { t?: number }) {
  const drops = [-0.78, -0.46, -0.16, 0.14, 0.44, 0.72].map((x, i) => {
    const fall = (((t * 1.5 + i * 0.37) % 1) + 1) % 1;
    return { x: x - fall * 0.12, y: 0.12 + fall * 1.2, fade: fall > 0.8 ? (1 - fall) * 5 : 1 };
  });
  return (
    <g>
      {drops.map((d) => (
        <path
          key={d.x.toFixed(3)}
          d={`M ${d.x} ${d.y} q 0.06 0.1 0 0.16 q -0.07 -0.05 0 -0.16 Z`}
          fill={tokens.effects.sweat}
          opacity={d.fade}
        />
      ))}
      <Shaded
        id={`${uid}-cloud`}
        d="M -0.9 0 Q -1.16 -0.04 -1.1 -0.32 Q -1.05 -0.6 -0.72 -0.58 Q -0.6 -0.96 -0.2 -0.9 Q 0.1 -1.16 0.45 -0.86 Q 0.9 -0.9 0.98 -0.5 Q 1.2 -0.3 1 0 Z"
        fill={tokens.fill.head}
        shadow={tokens.fill.headShadow}
        offset={lightOffset(shadowSide ?? 1, 0.07)}
      />
    </g>
  );
}
