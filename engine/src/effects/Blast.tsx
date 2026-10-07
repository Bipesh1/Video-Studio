import { DEG, clamp, lerp } from '../rig/math';
import { seeded } from '../rig/random';
import { accent, ink, lighten, lineWeights, mix, pick, tokens, white } from '../tokens';

/**
 * Explosions, fire and smoke for the science videos. All three are drawn in head units round
 * their own origin, so a scene places them like a prop: the explosion round its middle, the
 * fire and the smoke standing on the ground at y = 0. They are things happening in the world,
 * so the burning shapes are outlined like the impact flash (Style 3.7); nothing in them is a
 * wound, and nobody is ever shown hurt by one (Style 4).
 */

const orange = pick(accent('orange'), 0);
const gold = pick(accent('gold'), 0);
const rock = accent('brown');
/** Smoke: the light gray of the steel accent, paler as it thins. */
const smokeDark = pick(accent('steel'), 2);
const smokeLight = lighten(smokeDark, 0.45);

/** Seconds an explosion lasts, from the first flash to the last of the smoke. */
export const EXPLOSION_SECONDS = 1.8;

/**
 * A lumpy cloud: a ring of balls round a middle one, outlined as one shape. The outline is the
 * same balls drawn a little bigger in ink underneath.
 */
function Cloud({
  r,
  fill,
  seed,
  lumps = 8,
  edged = true,
  wobble = 0,
}: {
  r: number;
  fill: string;
  seed: string;
  lumps?: number;
  edged?: boolean;
  wobble?: number;
}) {
  const balls = [
    { x: 0, y: 0, s: r * 0.72 },
    ...Array.from({ length: lumps }, (_, i) => {
      const a = (360 * i * DEG) / lumps + seeded(`${seed}:a${i}`) * 0.5;
      const out = r * (0.52 + 0.14 * seeded(`${seed}:o${i}`));
      return {
        x: out * Math.cos(a + wobble),
        y: out * Math.sin(a + wobble),
        s: r * (0.36 + 0.14 * seeded(`${seed}:s${i}`)),
      };
    }),
  ];
  return (
    <g>
      {edged &&
        balls.map((b, i) => (
          <circle key={`e${i}`} cx={b.x} cy={b.y} r={b.s + lineWeights.outline} fill={ink} />
        ))}
      {balls.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.s} fill={fill} />
      ))}
    </g>
  );
}

/**
 * An explosion: a white flash, a ball of fire that bursts out and rolls up into gray smoke,
 * and bits of rock thrown clear. `t` is seconds since it went off; before 0 and after
 * EXPLOSION_SECONDS nothing is drawn. `size` is the radius of the fireball in head units.
 */
export function Explosion({ t, size = 2, seed = 1 }: { t: number; size?: number; seed?: number }) {
  if (t < 0 || t >= EXPLOSION_SECONDS) return null;
  const key = `blast${seed}`;
  // Out fast, then slowly on.
  const burst = 1 - (1 - clamp(t / 0.28, 0, 1)) ** 3;
  const grow = 0.3 + 0.7 * burst + 0.22 * clamp((t - 0.28) / 1.5, 0, 1);
  // The fire cools to smoke, lifts and thins.
  const cool = clamp((t - 0.45) / 0.7, 0, 1);
  const lift = -size * 0.9 * clamp((t - 0.4) / 1.4, 0, 1) ** 1.3;
  const gone = clamp((t - 1.25) / (EXPLOSION_SECONDS - 1.25), 0, 1);
  const outer = mix(orange, smokeDark, cool);
  const inner = mix(gold, smokeLight, cool);
  const flash = clamp(1 - t / 0.16, 0, 1);
  const spikes = 11;
  const star = Array.from({ length: spikes * 2 }, (_, i) => {
    const reach = size * (i % 2 === 0 ? 1.7 + 0.3 * seeded(`${key}:f${i}`) : 0.8) * (0.5 + burst);
    const a = (360 * i * DEG) / (spikes * 2) + seed;
    return `${reach * Math.cos(a)} ${reach * Math.sin(a)}`;
  });
  return (
    <g>
      {/* Bits of rock thrown out on arcs, falling as they go. */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (-160 + 140 * (i / 6) + 14 * seeded(`${key}:d${i}`)) * DEG;
        const speed = size * (2.4 + 1.4 * seeded(`${key}:v${i}`));
        const x = Math.cos(a) * speed * t;
        const y = Math.sin(a) * speed * t + 2.6 * size * t * t;
        const s = size * (0.07 + 0.06 * seeded(`${key}:c${i}`));
        if (t < 0.06) return null;
        return (
          <path
            key={i}
            d={`M ${-s} ${-s * 0.4} L ${s * 0.2} ${-s} L ${s} ${s * 0.1} L ${-s * 0.2} ${s} Z`}
            transform={`translate(${x} ${y}) rotate(${t * 500 + i * 60})`}
            fill={pick(rock, 0)}
            stroke={ink}
            strokeWidth={lineWeights.outline}
            strokeLinejoin={tokens.line.join}
            opacity={1 - gone}
          />
        );
      })}
      <g transform={`translate(0 ${lift})`} opacity={1 - gone}>
        <Cloud r={size * grow} fill={outer} seed={key} wobble={t * 0.5} />
        <Cloud r={size * grow * 0.66} fill={inner} seed={`${key}i`} lumps={6} edged={false} />
        {cool < 1 && <circle r={size * grow * 0.3 * (1 - cool)} fill={lighten(gold, 0.6)} />}
      </g>
      {flash > 0 && (
        <path
          d={`M ${star.join(' L ')} Z`}
          fill={white}
          stroke={ink}
          strokeWidth={lineWeights.outline}
          strokeLinejoin={tokens.line.join}
          opacity={flash}
        />
      )}
    </g>
  );
}

/** One tongue of flame standing on the ground: its tip sways and stretches with `sway`. */
const tongue = (x: number, w: number, h: number, sway: number) =>
  `M ${x - w} 0 Q ${x - w * 1.25} ${-h * 0.42} ${x - w * 0.34 + sway * 0.4} ${-h * 0.62} Q ${x - w * 0.5 + sway} ${-h * 0.86} ${x + sway * 1.4} ${-h} Q ${x + w * 0.28 + sway} ${-h * 0.74} ${x + w * 0.62 + sway * 0.4} ${-h * 0.56} Q ${x + w * 1.25} ${-h * 0.34} ${x + w} 0 Z`;

/**
 * Smoke: gray puffs that rise from the ground at y = 0, growing and thinning as they go, one
 * after another for as long as it is drawn. `size` is about how wide the column is.
 */
export function Smoke({ t, size = 1, seed = 1 }: { t: number; size?: number; seed?: number }) {
  const puffs = 5;
  const period = 2.4;
  return (
    <g>
      {Array.from({ length: puffs }, (_, i) => {
        const u = ((((t + (i * period) / puffs) / period) % 1) + 1) % 1;
        const drift = size * 0.5 * Math.sin(u * 3 + i * 1.7 + seed);
        return (
          <g
            key={i}
            transform={`translate(${drift * u} ${-size * (0.5 + 3.4 * u)})`}
            opacity={clamp(u * 6, 0, 1) * (1 - u) ** 1.2 * 0.92}
          >
            <Cloud
              r={size * lerp(0.34, 0.95, u)}
              fill={mix(smokeDark, smokeLight, u)}
              seed={`smoke${seed}-${i}`}
              lumps={6}
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * A fire burning on the ground at y = 0: three tongues of flame that lick and sway, orange
 * outside and gold within. `smoke` adds the smoke rising off it. `size` is its height in head
 * units; make it small for a campfire and big for a burning building.
 */
export function Fire({
  t,
  size = 1.4,
  seed = 1,
  smoke = false,
}: {
  t: number;
  size?: number;
  seed?: number;
  smoke?: boolean;
}) {
  const flick = (k: number) => Math.sin(t * 7 + k * 2.3 + seed) + 0.5 * Math.sin(t * 17 + k);
  const s = size;
  const tongues = [
    { x: -0.3 * s, w: 0.26 * s, h: 0.74 * s, k: 0 },
    { x: 0.3 * s, w: 0.25 * s, h: 0.66 * s, k: 1 },
    { x: 0, w: 0.34 * s, h: 1 * s, k: 2 },
  ];
  const flame = (scale: number, fill: string, edged: boolean) =>
    tongues.map((f) => (
      <path
        key={`${fill}${f.k}`}
        d={tongue(
          f.x * scale,
          f.w * scale,
          f.h * scale * (1 + 0.07 * flick(f.k)),
          0.05 * s * flick(f.k + 3),
        )}
        fill={fill}
        {...(edged
          ? { stroke: ink, strokeWidth: lineWeights.outline, strokeLinejoin: tokens.line.join }
          : {})}
      />
    ));
  return (
    <g>
      {smoke && (
        <g transform={`translate(0 ${-s * 0.5})`}>
          <Smoke t={t} size={s * 0.42} seed={seed} />
        </g>
      )}
      {/* The glow on the ground is light: no outline. */}
      <ellipse cy={-s * 0.04} rx={s * 1.05} ry={s * 0.2} fill={gold} opacity={0.22} />
      {flame(1, orange, true)}
      {flame(0.66, gold, false)}
      {flame(0.34, lighten(gold, 0.55), false)}
    </g>
  );
}
