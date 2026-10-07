import { accent, ink, lineWeights, pick } from '../tokens';

/**
 * Coins raining onto someone's head: gold coins that fall one after another, turning as they
 * come, and are gone as they land. Drawn in head space, on a loop. `t` is time in seconds.
 */
export function CoinRain({ t, count = 9 }: { t: number; count?: number }) {
  const gold = accent('gold');
  const coins = Array.from({ length: count }, (_, i) => {
    const fall = (((t * 1.05 + i / count) % 1) + 1) % 1;
    return {
      key: i,
      x: -0.5 + ((i * 0.381) % 1) * 1.0,
      y: -2.2 + fall * 1.62,
      turn: 0.3 + 0.7 * Math.abs(Math.cos(t * 5 + i * 1.9)),
      fade: fall > 0.9 ? (1 - fall) * 10 : fall < 0.08 ? fall * 12.5 : 1,
    };
  });
  return (
    <g>
      {coins.map((c) => (
        <g key={c.key} opacity={c.fade}>
          <ellipse
            cx={c.x}
            cy={c.y}
            rx={0.16 * c.turn}
            ry={0.16}
            fill={pick(gold, 0)}
            stroke={ink}
            strokeWidth={lineWeights.outline}
          />
          <ellipse cx={c.x} cy={c.y} rx={0.08 * c.turn} ry={0.08} fill={pick(gold, 1)} />
        </g>
      ))}
    </g>
  );
}
