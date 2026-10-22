import fineTokens from '../../../styles/fine-print/tokens.json';
import { Glow, Puff } from '../explainer/bodyKit';
import { tokens } from '../tokens';

/**
 * Two cover pictures for "Where Does Your Fat Go When You Lose Weight?" (2026-10-21, after Biku:
 * "the drawing of the thumbnail isn't good. it should be shown in a way that catches the viewer's
 * attention"):
 *   FoodBreathCloud  a cloud of breath stuffed with a burger, fries, a pizza slice and a doughnut,
 *                    a trail of puffs out to the left where the mouth is ("exhale your burger");
 *   XrayFat          the mascot from the side, see-through, the yellow fat in his belly rising
 *                    up his windpipe as a glowing stream and puffing out of his open mouth.
 * Both are drawn round 0,0 about one unit across, for a poster's thing layer.
 */

const J = fineTokens.journey;
const NAVY = fineTokens.line.color;
const SW = 0.012;

function Burger({ x, y, s, turn = 0 }: { x: number; y: number; s: number; turn?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${s})`}>
      <path d="M -1 0 Q 0 -1.1 1 0 Z" fill={J.bun} stroke={NAVY} strokeWidth={0.07} />
      {[-0.45, -0.1, 0.25, 0.55].map((sx, i) => (
        <ellipse
          key={i}
          cx={sx}
          cy={-0.45 + Math.abs(sx) * 0.3}
          rx={0.07}
          ry={0.04}
          fill={J.towelStripe}
        />
      ))}
      <path
        d="M -1.08 0.02 Q -0.8 0.18 -0.55 0.04 Q -0.3 0.2 0 0.04 Q 0.3 0.2 0.55 0.04 Q 0.8 0.18 1.08 0.02 L 1.05 0.12 L -1.05 0.12 Z"
        fill={J.lettuce}
        stroke={NAVY}
        strokeWidth={0.05}
      />
      <path
        d="M -1 0.12 L 1 0.12 L 0.85 0.3 L -0.85 0.3 Z"
        fill={J.cheese}
        stroke={NAVY}
        strokeWidth={0.05}
      />
      <rect
        x={-1}
        y={0.24}
        width={2}
        height={0.3}
        rx={0.15}
        fill={J.patty}
        stroke={NAVY}
        strokeWidth={0.07}
      />
      <path
        d="M -0.95 0.54 L 0.95 0.54 L 0.88 0.75 Q 0 0.88 -0.88 0.75 Z"
        fill={J.bun}
        stroke={NAVY}
        strokeWidth={0.07}
      />
    </g>
  );
}

function Fries({ x, y, s, turn = 0 }: { x: number; y: number; s: number; turn?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${s})`}>
      {[-0.45, -0.22, 0, 0.22, 0.45, -0.32, 0.1, 0.34].map((fx, i) => (
        <rect
          key={i}
          x={fx - 0.08}
          y={-0.95 + (i % 3) * 0.12}
          width={0.16}
          height={0.9}
          rx={0.03}
          fill={i % 2 ? J.cheese : J.fatLight}
          stroke={NAVY}
          strokeWidth={0.05}
          transform={`rotate(${(i - 3.5) * 4} ${fx} 0)`}
        />
      ))}
      <path
        d="M -0.7 -0.25 L 0.7 -0.25 L 0.55 0.75 L -0.55 0.75 Z"
        fill={J.cross}
        stroke={NAVY}
        strokeWidth={0.07}
      />
      <path d="M -0.7 -0.25 Q 0 0.05 0.7 -0.25" fill="none" stroke={NAVY} strokeWidth={0.05} />
      <circle cx={0} cy={0.3} r={0.18} fill={J.cheese} stroke={NAVY} strokeWidth={0.04} />
    </g>
  );
}

function Pizza({ x, y, s, turn = 0 }: { x: number; y: number; s: number; turn?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${turn}) scale(${s})`}>
      <path
        d="M 0 0.9 L -0.75 -0.55 Q 0 -0.85 0.75 -0.55 Z"
        fill={J.cheese}
        stroke={NAVY}
        strokeWidth={0.07}
      />
      <path
        d="M -0.8 -0.58 Q 0 -0.95 0.8 -0.58 L 0.72 -0.42 Q 0 -0.72 -0.72 -0.42 Z"
        fill={J.bunShade}
        stroke={NAVY}
        strokeWidth={0.06}
      />
      {[
        [-0.2, -0.3],
        [0.25, -0.25],
        [0.02, 0.2],
      ].map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={0.14} fill={J.cross} stroke={NAVY} strokeWidth={0.04} />
      ))}
    </g>
  );
}

function Doughnut({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={0.9} fill={J.bun} stroke={NAVY} strokeWidth={0.07} />
      <path
        d="M -0.8 -0.1 Q -0.85 -0.8 0 -0.82 Q 0.85 -0.8 0.8 -0.1 Q 0.6 0.25 0.4 0 Q 0.2 0.3 0 0.05 Q -0.25 0.3 -0.45 0.02 Q -0.65 0.25 -0.8 -0.1 Z"
        fill={J.lung}
        stroke={NAVY}
        strokeWidth={0.05}
      />
      <circle r={0.3} fill={J.breath} stroke={NAVY} strokeWidth={0.06} />
      {[
        [-0.5, -0.45, 20],
        [0.35, -0.55, -30],
        [0.55, -0.2, 60],
        [-0.3, -0.65, 80],
      ].map(([sx, sy, a], i) => (
        <rect
          key={i}
          x={(sx ?? 0) - 0.08}
          y={(sy ?? 0) - 0.025}
          width={0.16}
          height={0.05}
          rx={0.025}
          fill={i % 2 ? J.oxygen : J.water}
          transform={`rotate(${a} ${sx} ${sy})`}
        />
      ))}
    </g>
  );
}

/** The breath cloud full of food: a burger, fries, a pizza slice and a doughnut. */
export function FoodBreathCloud({ uid, t = 0 }: { uid: string; t?: number }) {
  const trail = [
    { x: -0.78, y: 0.32, r: 0.045 },
    { x: -0.68, y: 0.29, r: 0.055 },
    { x: -0.58, y: 0.25, r: 0.065 },
    { x: -0.48, y: 0.2, r: 0.075 },
    { x: -0.38, y: 0.15, r: 0.09 },
  ];
  return (
    <g>
      <Glow id={`${uid}-glow`} cx={0} cy={0} r={0.9} colour={J.fatGlow} strength={0.9} />
      {trail.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y + 0.01 * Math.sin(t * 2 + i)})`}>
          <Puff r={p.r} fill={J.breath} shade={J.breathShade} seed={i + 5} stroke={NAVY} sw={SW} />
        </g>
      ))}
      <Puff r={0.5} fill={J.breath} shade={J.breathShade} seed={11} stroke={NAVY} sw={0.016} />
      <Pizza x={0.2} y={-0.2} s={0.17} turn={25} />
      <Fries x={-0.2} y={-0.12} s={0.16} turn={-12} />
      <Doughnut x={0.22} y={0.2} s={0.11} />
      <Burger x={-0.06} y={0.12} s={0.2} turn={-6} />
    </g>
  );
}

/** The mascot from the side, see-through, the fat in his belly rising and puffing out of his mouth. */
export function XrayFat({ uid, t = 0 }: { uid: string; t?: number }) {
  const skin = tokens.skinTones[4] ?? J.skin;
  const head = { x: 0.02, y: -1.52, r: 0.17 };
  const jaw = [head.x + head.r * Math.cos(0.8), head.y + head.r * Math.sin(0.8)];
  const brow = [head.x + head.r * Math.cos(-0.95), head.y + head.r * Math.sin(-0.95)];
  const headPath = `M ${jaw[0]} ${jaw[1]} A ${head.r} ${head.r} 0 1 1 ${brow[0]} ${brow[1]} Q 0.172 -1.62 0.18 -1.565 Q 0.19 -1.545 0.205 -1.52 Q 0.24 -1.486 0.212 -1.474 Q 0.198 -1.468 0.194 -1.46 Q 0.21 -1.445 0.2 -1.43 L 0.2 -1.39 Q 0.19 -1.37 0.17 -1.36 Q 0.15 -1.35 ${jaw[0]} ${jaw[1]} Z`;
  const torso =
    'M 0.1 -1.36 L 0.09 -1.33 Q 0.17 -1.3 0.19 -1.2 Q 0.21 -1.1 0.235 -1.0 Q 0.27 -0.9 0.28 -0.82 Q 0.28 -0.72 0.24 -0.66 L 0.2 -0.6 L -0.17 -0.6 Q -0.2 -0.7 -0.18 -0.85 Q -0.2 -1.0 -0.19 -1.1 Q -0.19 -1.26 -0.12 -1.3 Q -0.05 -1.34 -0.02 -1.36 Z';
  // The way the fat leaves: from the belly, up the windpipe, out of the mouth.
  const way: [number, number][] = [
    [0.15, -0.8],
    [0.06, -0.92],
    [0.03, -1.05],
    [0.06, -1.2],
    [0.075, -1.33],
    [0.1, -1.41],
    [0.2, -1.41],
  ];
  const at = (u: number): [number, number] => {
    const f = Math.min(0.9999, Math.max(0, u)) * (way.length - 1);
    const i = Math.floor(f);
    const a = way[i] ?? [0, 0];
    const b = way[i + 1] ?? a;
    return [a[0] + (b[0] - a[0]) * (f - i), a[1] + (b[1] - a[1]) * (f - i)];
  };
  const fatCells = Array.from({ length: 26 }, (_, i) => {
    const a = i * 2.4;
    const d = 0.02 + 0.065 * Math.sqrt((i + 0.5) / 26);
    return {
      x: 0.16 + Math.cos(a) * d * 0.9,
      y: -0.8 + Math.sin(a) * d * 1.3,
      r: 0.022 + 0.008 * ((i * 7) % 3),
    };
  });
  return (
    <g transform="translate(-0.02 1.1)">
      <Glow id={`${uid}-belly`} cx={0.16} cy={-0.8} r={0.28} colour={J.fatGlow} strength={1} />
      {/* The hoodie, see-through, and the neck. */}
      <path d="M 0.02 -1.4 L 0.1 -1.4 L 0.1 -1.32 L 0.02 -1.32 Z" fill={skin} />
      <path
        d={torso}
        fill={J.swim}
        fillOpacity={0.35}
        stroke={NAVY}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      {/* The lungs and the windpipe, faint, so the fat's way stands out. */}
      <ellipse cx={-0.02} cy={-1.08} rx={0.09} ry={0.13} fill={J.lung} opacity={0.55} />
      <ellipse cx={0.09} cy={-1.08} rx={0.09} ry={0.13} fill={J.lung} opacity={0.7} />
      <path
        d="M 0.075 -1.41 L 0.06 -1.2"
        stroke={J.airway}
        strokeWidth={0.03}
        strokeLinecap="round"
      />
      {/* The fat in the belly: a glowing heap of yellow cells. */}
      {fatCells.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={c.r} fill={J.fat} stroke={J.fatShade} strokeWidth={0.005} />
          <circle cx={c.x - c.r * 0.3} cy={c.y - c.r * 0.35} r={c.r * 0.3} fill={J.fatGlow} />
        </g>
      ))}
      {/* The glowing stream rising out of it. */}
      <path
        d={`M ${way.map(([x, y]) => `${x} ${y}`).join(' L ')}`}
        fill="none"
        stroke={J.fatGlow}
        strokeWidth={0.04}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
      {Array.from({ length: 16 }, (_, i) => {
        const [x, y] = at((i / 16 + t * 0.3) % 1);
        return (
          <circle key={i} cx={x} cy={y} r={0.016} fill={J.fat} stroke={NAVY} strokeWidth={0.004} />
        );
      })}
      {/* The head from the side, mouth open, eye wide; his afro over it. */}
      <path d={headPath} fill={skin} stroke={NAVY} strokeWidth={SW} strokeLinejoin="round" />
      <ellipse
        cx={0.196}
        cy={-1.412}
        rx={0.018}
        ry={0.026}
        fill={J.patty}
        stroke={NAVY}
        strokeWidth={0.006}
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = Math.PI * (0.45 + 1.3 * (i / 11));
        return (
          <circle
            key={i}
            cx={head.x - 0.05 + 0.17 * Math.cos(a)}
            cy={head.y - 0.06 + 0.16 * Math.sin(a)}
            r={0.058}
            fill={J.hair}
            stroke={NAVY}
            strokeWidth={SW}
          />
        );
      })}
      <circle cx={head.x - 0.05} cy={head.y - 0.06} r={0.165} fill={J.hair} />
      <path
        d="M 0.005 -1.535 Q -0.03 -1.51 0.0 -1.475 Q 0.02 -1.48 0.02 -1.5"
        fill={skin}
        stroke={NAVY}
        strokeWidth={SW}
      />
      <circle cx={0.135} cy={-1.555} r={0.034} fill={J.clockFace} stroke={NAVY} strokeWidth={SW} />
      <circle cx={0.148} cy={-1.553} r={0.011} fill={NAVY} />
      <path
        d="M 0.105 -1.615 Q 0.135 -1.635 0.165 -1.612"
        fill="none"
        stroke={NAVY}
        strokeWidth={SW}
      />
      {/* The fat leaving his mouth as golden puffs. */}
      {[0.27, 0.36, 0.47].map((px, i) => (
        <g key={i} transform={`translate(${px} ${-1.42 - i * 0.02})`}>
          <Puff
            r={0.035 + i * 0.022}
            fill={J.fatLight}
            shade={J.fat}
            seed={i + 2}
            stroke={NAVY}
            sw={0.008}
          />
        </g>
      ))}
    </g>
  );
}
