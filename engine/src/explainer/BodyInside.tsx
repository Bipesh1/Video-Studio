import type { ReactNode } from 'react';
import { tokens } from '../tokens';
import { Bead } from './BodyHall';
import { Glow, J, LINE, Local, NS, Puff, Tag, at, font, inView, lerp, pxOf, rnd } from './bodyKit';
import type { State } from './bodyKit';
import { clamp, outBack, smooth } from './Journey';
import type { View } from './Journey';

/**
 * The inside of you, in the world `body`: the mascot seen from the side and cut open, glowing on
 * a dark ground, with his airway, lungs, heart, blood and the fat under the skin of his belly.
 * One fat cell of that belly opens to its drop of oil, and the oil to its atoms: carbon,
 * hydrogen and oxygen, which come apart, join with oxygen, and leave as water and gas.
 * Drawn in metres, his feet at 0; the atoms in tenths of a millimetre round the cell.
 */

// ---- the layout, in metres
export const HEAD = { x: 0.02, y: -1.52, r: 0.17 };
export const NOSE = { x: 0.235, y: -1.49 };
export const MOUTH_BODY = { x: 0.19, y: -1.415 };
export const LUNGS = { x: 0.03, y: -1.08 };
export const BELLY = { x: 0.2, y: -0.84 };
export const CELL = { x: 0.2432, y: -0.8389, r: 0.0082 };
export const ATOM = 1e-4;
/** The fat under the belly's skin: the outer curve of the belly, from top to bottom. */
const BELLY_EDGE: [number, number][] = [
  [0.24, -0.97],
  [0.262, -0.91],
  [0.272, -0.84],
  [0.266, -0.77],
  [0.25, -0.71],
  [0.225, -0.65],
];
const FAT_DEPTH = 0.072;
/** The vessel from the belly's fat up to the lungs. */
const VESSEL: [number, number][] = [
  [0.215, -0.8],
  [0.15, -0.76],
  [0.05, -0.77],
  [-0.03, -0.84],
  [-0.05, -0.95],
  [-0.02, -1.02],
];
const pointOn = (pts: [number, number][], u: number): [number, number] => {
  const n = pts.length - 1;
  const f = clamp(u) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const a = pts[i] ?? [0, 0];
  const b = pts[i + 1] ?? a;
  return [lerp(a[0], b[0], f - i), lerp(a[1], b[1], f - i)];
};
const smoothPath = (pts: [number, number][]) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0]?.[0]} ${pts[0]?.[1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i] ?? [0, 0];
    const q = pts[i + 1] ?? p;
    d += ` Q ${p[0]} ${p[1]} ${(p[0] + q[0]) / 2} ${(p[1] + q[1]) / 2}`;
  }
  const last = pts[pts.length - 1] ?? [0, 0];
  return `${d} L ${last[0]} ${last[1]}`;
};

/** The fat cells of the belly: packed along its edge, four deep inside the skin. */
const FAT_CELLS: { x: number; y: number; r: number; i: number }[] = (() => {
  const out: { x: number; y: number; r: number; i: number }[] = [];
  let i = 0;
  for (let u = 0.02; u < 0.98; u += 0.026) {
    const [ox, oy] = pointOn(BELLY_EDGE, u);
    const [nx, ny] = pointOn(BELLY_EDGE, u + 0.01);
    const len = Math.hypot(nx - ox, ny - oy) || 1;
    // Inward from the skin: along the edge's normal, toward the body.
    const ix = -(ny - oy) / len;
    const iy = (nx - ox) / len;
    for (let d = 0; d < 4; d++) {
      const depth = 0.012 + d * 0.0155 + 0.0015 * rnd(i, 4);
      // A little out of line, and of different sizes, as real fat is.
      const jx = (rnd(i, 8) - 0.5) * 0.004;
      const jy = (rnd(i, 9) - 0.5) * 0.004;
      out.push({
        x: ox + ix * depth + jx,
        y: oy + iy * depth + jy,
        r: 0.006 + 0.003 * rnd(i, 5),
        i,
      });
      i++;
    }
  }
  return out;
})();
/** The belly's edge moved inward by d metres. */
const inwardEdge = (d: number) =>
  BELLY_EDGE.map(([x, y], i): [number, number] => {
    const [nx, ny] = BELLY_EDGE[Math.min(BELLY_EDGE.length - 1, i + 1)] ?? [x, y];
    const [px, py] = BELLY_EDGE[Math.max(0, i - 1)] ?? [x, y];
    const len = Math.hypot(nx - px, ny - py) || 1;
    return [x - ((ny - py) / len) * d, y + ((nx - px) / len) * d];
  });

// ============================================================================================
/** The dark ground inside you: deep plum, glowing in the middle, specks drifting. */
function InsideGround({ v, s }: { v: View; s: State }) {
  const specks = Array.from({ length: 36 }, (_, i) => {
    const x = ((rnd(i, 1) * v.W + s.t * 12 * (0.5 + rnd(i, 2))) % (v.W + 80)) - 40;
    const y = (((rnd(i, 3) * v.H - s.t * 18 * (0.4 + rnd(i, 4))) % v.H) + v.H) % v.H;
    const r = (6 + 22 * rnd(i, 5)) * pxOf(v);
    return <circle key={i} cx={x} cy={y} r={r} fill={J.flesh} opacity={0.06 + 0.08 * rnd(i, 6)} />;
  });
  return (
    <g>
      <defs>
        <radialGradient id="bi-ground" cx="0.5" cy="0.45" r="0.8">
          <stop offset="0" stopColor={J.bodyMid} />
          <stop offset="1" stopColor={J.bodyDark} />
        </radialGradient>
      </defs>
      <rect width={v.W} height={v.H} fill="url(#bi-ground)" />
      {specks}
    </g>
  );
}

/** His outline from the side: the head with its afro and face, the hoodie see-through. */
function Silhouette({ v, s }: { v: View; s: State }) {
  const p = pxOf(v);
  if (!inView(v, 0.03, -1.1, 0.9, 30)) return null;
  const skin = tokens.skinTones[4] ?? J.skin;
  const breath = s.thing('inhale', 1.1) * (1 - s.thing('exhale', 1)) * 0.012;
  const torso = `M 0.1 -1.36 L 0.09 -1.33 Q 0.17 -1.3 ${0.19 + breath} -1.2 Q ${0.21 + breath} -1.1 0.235 -1.0 Q 0.25 -0.98 0.24 -0.97 Q 0.27 -0.9 0.272 -0.84 Q 0.27 -0.75 0.24 -0.69 Q 0.225 -0.64 0.2 -0.6 L -0.17 -0.6 Q -0.2 -0.7 -0.18 -0.85 Q -0.2 -1.0 -0.19 -1.1 Q -0.19 -1.26 -0.12 -1.3 Q -0.05 -1.34 -0.02 -1.36 Z`;
  const sw = { stroke: LINE.color, strokeWidth: 5 * p, strokeLinejoin: 'round' as const, ...NS };
  // The head from the side: round at the back, then the forehead, nose, lips and chin.
  const r = HEAD.r;
  const jaw = [HEAD.x + r * Math.cos(0.8), HEAD.y + r * Math.sin(0.8)];
  const brow = [HEAD.x + r * Math.cos(-0.95), HEAD.y + r * Math.sin(-0.95)];
  const head = `M ${jaw[0]} ${jaw[1]} A ${r} ${r} 0 1 1 ${brow[0]} ${brow[1]} Q 0.172 -1.62 0.18 -1.565 Q 0.19 -1.545 0.205 -1.52 Q ${NOSE.x + 0.004} ${NOSE.y + 0.004} 0.212 -1.474 Q 0.198 -1.468 0.194 -1.46 Q 0.205 -1.447 0.197 -1.434 Q 0.188 -1.427 0.196 -1.418 Q 0.2 -1.405 0.19 -1.396 Q 0.19 -1.37 0.17 -1.36 Q 0.15 -1.35 ${jaw[0]} ${jaw[1]} Z`;
  return (
    <Local v={v}>
      {/* The legs below, faint. */}
      <path
        d="M -0.15 -0.6 L -0.12 0 L 0.0 0 L 0.02 -0.45 L 0.06 0 L 0.18 0 L 0.19 -0.6 Z"
        fill={J.sandShade}
        opacity={0.3}
        {...sw}
      />
      {/* The neck, then the hoodie, see-through, over the body. */}
      <path d="M 0.02 -1.4 L 0.1 -1.4 L 0.1 -1.32 L 0.02 -1.32 Z" fill={skin} />
      <path d={torso} fill={J.swim} opacity={0.26} {...sw} />
      <path d="M 0.0 -1.36 Q 0.08 -1.3 0.09 -1.36" fill="none" {...sw} />
      {/* The head, and his afro over the back and top of it. */}
      <path d={head} fill={skin} {...sw} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = Math.PI * (0.45 + 1.3 * (i / 11));
        return (
          <circle
            key={i}
            cx={HEAD.x - 0.05 + 0.17 * Math.cos(a)}
            cy={HEAD.y - 0.06 + 0.16 * Math.sin(a)}
            r={0.058}
            fill={J.hair}
            {...sw}
          />
        );
      })}
      <circle cx={HEAD.x - 0.05} cy={HEAD.y - 0.06} r={0.165} fill={J.hair} />
      {/* The ear, the eye and its brow. */}
      <path
        d="M 0.005 -1.535 Q -0.03 -1.51 0.0 -1.475 Q 0.02 -1.48 0.02 -1.5"
        fill={skin}
        {...sw}
      />
      <circle cx={0.14} cy={-1.555} r={0.026} fill={J.clockFace} {...sw} />
      <circle cx={0.15} cy={-1.553} r={0.013} fill={LINE.color} />
      <circle cx={0.154} cy={-1.558} r={0.004} fill={J.clockFace} />
      <path d="M 0.115 -1.6 Q 0.14 -1.612 0.165 -1.598" fill="none" {...sw} />
    </Local>
  );
}

/** The airway: nose and mouth into the throat, down the windpipe, into the lungs. */
function Airway({ v }: { v: View }) {
  const p = pxOf(v);
  const sw = { stroke: J.airwayShade, ...NS };
  return (
    <Local v={v}>
      <path
        d={`M ${NOSE.x - 0.02} -1.48 Q 0.13 -1.5 0.09 -1.47 Q 0.07 -1.44 0.075 -1.4`}
        fill="none"
        stroke={J.airway}
        strokeWidth={0.026}
        strokeLinecap="round"
      />
      <path
        d="M 0.18 -1.415 Q 0.12 -1.42 0.08 -1.41"
        fill="none"
        stroke={J.airway}
        strokeWidth={0.02}
        strokeLinecap="round"
      />
      <path
        d="M 0.075 -1.41 L 0.06 -1.2"
        stroke={J.airway}
        strokeWidth={0.03}
        strokeLinecap="round"
      />
      {Array.from({ length: 7 }, (_, i) => {
        const y = -1.38 + i * 0.026;
        const x = lerp(0.075, 0.06, (y + 1.41) / 0.21);
        return (
          <line key={i} x1={x - 0.014} y1={y} x2={x + 0.014} y2={y} strokeWidth={3 * p} {...sw} />
        );
      })}
    </Local>
  );
}

/** One lung: a soft rounded lobe with branching airways inside. */
function Lung({ cx, cy, flip, shade }: { cx: number; cy: number; flip: number; shade: boolean }) {
  const d = `M ${cx} ${cy - 0.14} Q ${cx + flip * 0.1} ${cy - 0.13} ${cx + flip * 0.11} ${cy} Q ${cx + flip * 0.11} ${cy + 0.12} ${cx + flip * 0.03} ${cy + 0.13} Q ${cx - flip * 0.06} ${cy + 0.12} ${cx - flip * 0.05} ${cy + 0.02} Q ${cx - flip * 0.04} ${cy - 0.1} ${cx} ${cy - 0.14} Z`;
  return (
    <g>
      <path
        d={d}
        fill={shade ? J.lungShade : J.lung}
        stroke={LINE.color}
        strokeWidth={0.006}
        strokeLinejoin="round"
      />
      <path
        d={`M ${cx - flip * 0.02} ${cy - 0.1} Q ${cx + flip * 0.03} ${cy - 0.02} ${cx + flip * 0.02} ${cy + 0.08} M ${cx + flip * 0.01} ${cy - 0.03} L ${cx + flip * 0.07} ${cy + 0.02} M ${cx + flip * 0.02} ${cy + 0.03} L ${cx - flip * 0.03} ${cy + 0.08}`}
        fill="none"
        stroke={J.lungShade}
        strokeWidth={0.008}
        strokeLinecap="round"
      />
      <ellipse
        cx={cx + flip * 0.03}
        cy={cy - 0.06}
        rx={0.025}
        ry={0.04}
        fill={J.clockFace}
        opacity={0.25}
      />
    </g>
  );
}

/** The lungs, breathing; lifting a little barbell; full of gas on its way out. */
function Lungs({ v, s }: { v: View; s: State }) {
  if (!inView(v, LUNGS.x, LUNGS.y, 0.2, 40)) return null;
  const p = pxOf(v);
  const inhale = s.thing('inhale', 1.1);
  const lift = s.thing('barbell', 0.5);
  const gas = s.thing('lungs-in', 1);
  const breathe =
    1 + 0.03 * Math.sin(s.t * 2.2) + 0.12 * smooth(inhale) * (1 - s.thing('exhale', 1));
  const strain = lift > 0 ? 0.03 * Math.sin(s.t * 20) * (1 - smooth(lift)) : 0;
  const barY = LUNGS.y - 0.2 - 0.07 * outBack(lift) + strain;
  const [gx, gy] = at(v, LUNGS.x, LUNGS.y);
  return (
    <g>
      <Glow
        id="bi-lungs"
        cx={gx}
        cy={gy}
        r={0.26 * v.k}
        colour={gas > 0 ? J.gasLight : J.lung}
        strength={0.5 + 0.3 * gas}
      />
      <Local v={v}>
        <g
          transform={`translate(${LUNGS.x} ${LUNGS.y}) scale(${breathe} ${breathe * (1 - strain)}) translate(${-LUNGS.x} ${-LUNGS.y})`}
        >
          <Lung cx={LUNGS.x - 0.04} cy={LUNGS.y} flip={-1} shade />
          <Lung cx={LUNGS.x + 0.05} cy={LUNGS.y} flip={1} shade={false} />
          <path
            d={`M 0.06 -1.2 L ${LUNGS.x - 0.02} -1.13 M 0.06 -1.2 L ${LUNGS.x + 0.07} -1.14`}
            stroke={J.airway}
            strokeWidth={0.016}
            strokeLinecap="round"
          />
          {gas > 0 &&
            Array.from({ length: 16 }, (_, i) => (
              <circle
                key={i}
                cx={LUNGS.x - 0.08 + 0.17 * rnd(i, 81) + 0.005 * Math.sin(s.t * 3 + i)}
                cy={LUNGS.y - 0.1 + 0.2 * rnd(i, 82)}
                r={0.008 * smooth(gas * 2 - rnd(i, 83))}
                fill={J.gas}
                stroke={LINE.color}
                strokeWidth={0.002}
              />
            ))}
        </g>
        {lift > 0 && (
          <g opacity={clamp(lift * 4)}>
            {/* Two little arms from the lungs, holding a barbell up. */}
            <path
              d={`M ${LUNGS.x - 0.13} ${LUNGS.y - 0.06} Q ${LUNGS.x - 0.2} ${barY + 0.08} ${LUNGS.x - 0.14} ${barY} M ${LUNGS.x + 0.15} ${LUNGS.y - 0.06} Q ${LUNGS.x + 0.22} ${barY + 0.08} ${LUNGS.x + 0.16} ${barY}`}
              fill="none"
              stroke={J.lungShade}
              strokeWidth={0.014}
              strokeLinecap="round"
            />
            <line
              x1={LUNGS.x - 0.22}
              y1={barY}
              x2={LUNGS.x + 0.24}
              y2={barY}
              stroke={J.treadmillRail}
              strokeWidth={0.012}
              strokeLinecap="round"
            />
            {[-0.2, -0.17, 0.19, 0.22].map((dx) => (
              <rect
                key={dx}
                x={LUNGS.x + dx - 0.012}
                y={barY - 0.04}
                width={0.024}
                height={0.08}
                rx={0.006}
                fill={J.treadmill}
                stroke={LINE.color}
                strokeWidth={0.003}
              />
            ))}
            {[-1, 1].map((d) => (
              <path
                key={d}
                d={`M ${LUNGS.x + d * 0.27} ${barY - 0.03} l ${d * 0.03} -0.02 M ${LUNGS.x + d * 0.27} ${barY + 0.01} l ${d * 0.035} 0`}
                stroke={J.clockFace}
                strokeWidth={5 * p}
                strokeLinecap="round"
                opacity={0.7}
                {...NS}
              />
            ))}
          </g>
        )}
      </Local>
    </g>
  );
}

/** The heart, the diaphragm under the lungs, the stomach and the gut. */
function Organs({ v, s }: { v: View; s: State }) {
  if (!inView(v, 0.05, -0.9, 0.3, 40)) return null;
  const beat = 1 + 0.08 * Math.max(0, Math.sin(s.t * 7.5)) ** 4;
  return (
    <Local v={v}>
      <path
        d="M -0.17 -0.95 Q 0.03 -1.0 0.235 -0.95"
        fill="none"
        stroke={J.muscle}
        strokeWidth={0.012}
        strokeLinecap="round"
      />
      <g transform={`translate(0.1 -0.995) scale(${beat})`}>
        <path
          d="M 0 0.035 Q -0.05 0.0 -0.03 -0.025 Q -0.012 -0.04 0 -0.02 Q 0.012 -0.04 0.03 -0.025 Q 0.05 0.0 0 0.035 Z"
          fill={J.heart}
          stroke={LINE.color}
          strokeWidth={0.004}
        />
      </g>
      <ellipse
        cx={0.09}
        cy={-0.875}
        rx={0.075}
        ry={0.045}
        fill={J.stomach}
        stroke={LINE.color}
        strokeWidth={0.004}
        transform="rotate(-12 0.09 -0.875)"
      />
      <path
        d="M -0.12 -0.82 Q -0.06 -0.86 0.0 -0.82 Q 0.06 -0.78 0.12 -0.82 Q 0.16 -0.78 0.1 -0.74 Q 0.04 -0.7 -0.02 -0.74 Q -0.08 -0.78 -0.12 -0.72 Q -0.06 -0.66 0.04 -0.67 Q 0.12 -0.68 0.16 -0.66"
        fill="none"
        stroke={J.airwayShade}
        strokeWidth={0.02}
        strokeLinecap="round"
        opacity={0.75}
      />
    </Local>
  );
}

/** The vessel from the belly to the lungs, its blood flowing; grey gas riding it on the way. */
function Vessel({ v, s }: { v: View; s: State }) {
  if (!inView(v, 0.08, -0.88, 0.25, 40)) return null;
  const blood = s.thing('blood', 0.6);
  const d = smoothPath(VESSEL);
  return (
    <g>
      <Local v={v}>
        <path
          d={d}
          fill="none"
          stroke={J.vessel}
          strokeWidth={0.02}
          strokeLinecap="round"
          opacity={0.85}
        />
        <path
          d={d}
          fill="none"
          stroke={J.heartGlow}
          strokeWidth={0.006}
          strokeLinecap="round"
          opacity={0.6}
        />
        {Array.from({ length: 14 }, (_, i) => {
          const [x, y] = pointOn(VESSEL, (s.t * 0.25 + i / 14) % 1);
          return <ellipse key={i} cx={x} cy={y} rx={0.006} ry={0.004} fill={J.cell} />;
        })}
        {blood > 0 &&
          Array.from({ length: 9 }, (_, i) => {
            const u = (s.since('blood') * 0.32 + i / 9) % 1;
            const [x, y] = pointOn(VESSEL, u);
            return (
              <circle
                key={`g${i}`}
                cx={x}
                cy={y}
                r={0.008 * clamp(blood * 3 - i * 0.2)}
                fill={J.gas}
                stroke={LINE.color}
                strokeWidth={0.0025}
              />
            );
          })}
      </Local>
    </g>
  );
}

/** The fat under the belly's skin: rows of round yellow cells, behind a flap of skin that peels back. */
function BellyFat({ v, s }: { v: View; s: State }) {
  if (!inView(v, BELLY.x, BELLY.y, 0.2, 60)) return null;
  const p = pxOf(v);
  const open = s.stop === 'belly' ? s.thing('cells', 0.9) : 1;
  const peel = s.stop === 'belly' ? smooth(clamp(s.local / (s.fps * 2.4)) * 1.3) : 1;
  const show = Math.max(open, peel);
  const glow = s.thing('cells', 0.6) * (1 - s.thing('oil', 0.5)) * (s.stop === 'belly' ? 1 : 0);
  const inner = inwardEdge(FAT_DEPTH);
  const band = `${smoothPath(BELLY_EDGE)} L ${inner
    .slice()
    .reverse()
    .map(([x, y]) => `${x} ${y}`)
    .join(' L ')} Z`;
  const skin = tokens.skinTones[4] ?? J.skin;
  return (
    <g>
      <Local v={v}>
        <path d={band} fill={J.cellPlasma} opacity={0.8} />
        {FAT_CELLS.map((c) => {
          const shown = clamp(show * 1.6 - rnd(c.i, 7) * 0.6);
          if (shown <= 0) return null;
          if (Math.hypot(c.x - CELL.x, c.y - CELL.y) < 0.004) return null;
          return (
            <g key={c.i} opacity={shown}>
              <circle
                cx={c.x}
                cy={c.y}
                r={c.r}
                fill={J.cellPlasma}
                stroke={J.cellWall}
                strokeWidth={0.0016}
              />
              <circle cx={c.x + 0.0005} cy={c.y + 0.0005} r={c.r * 0.78} fill={J.fat} />
              <circle
                cx={c.x - c.r * 0.28}
                cy={c.y - c.r * 0.32}
                r={c.r * 0.2}
                fill={J.fatGlow}
                opacity={0.85}
              />
            </g>
          );
        })}
        {/* The skin, and the hoodie over it, along the belly's edge. */}
        <path d={smoothPath(inwardEdge(0.004))} fill="none" stroke={skin} strokeWidth={0.007} />
        <path d={smoothPath(BELLY_EDGE)} fill="none" stroke={J.swim} strokeWidth={0.008} />
      </Local>
      {glow > 0 && (
        <Glow
          id="bi-fatglow"
          cx={at(v, BELLY.x + 0.03, BELLY.y)[0]}
          cy={at(v, BELLY.x + 0.03, BELLY.y)[1]}
          r={0.16 * v.k}
          colour={J.fatGlow}
          strength={0.4 * glow}
        />
      )}
      <FatCell v={v} s={s} shown={show} />
      {/* The flap of skin and hoodie over the fat, peeling back from the top. */}
      {peel < 1 && (
        <Local v={v}>
          <g
            transform={`rotate(${-75 * peel} 0.24 -0.97) translate(${0.06 * peel} 0)`}
            opacity={1 - 0.6 * peel}
          >
            <path d={band} fill={skin} stroke={LINE.color} strokeWidth={4 * p} {...NS} />
            <path d={smoothPath(BELLY_EDGE)} fill="none" stroke={J.swim} strokeWidth={0.016} />
          </g>
        </Local>
      )}
    </g>
  );
}

/** The fat cell the camera goes into: its wall, its nucleus pushed aside, its big drop of oil. */
function FatCell({ v, s, shown }: { v: View; s: State; shown: number }) {
  if (shown <= 0 || !inView(v, CELL.x, CELL.y, CELL.r, 400)) return null;
  const open = s.thing('oil', 0.9);
  const inside = s.stop === 'chain' || s.stop === 'pieces' || s.stop === 'leftovers';
  const [cx, cy] = at(v, CELL.x, CELL.y);
  const R = CELL.r * v.k;
  const p = pxOf(v);
  if (R > v.H * 30) return null;
  const gap = (inside ? 1 : open) * 70;
  const arc = (r: number) => {
    const a0 = ((-90 + gap / 2) * Math.PI) / 180;
    const a1 = ((270 - gap / 2) * Math.PI) / 180;
    return `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
  };
  const drop = R * (0.8 + 0.08 * open);
  return (
    <g opacity={clamp(shown * 1.5)}>
      <Glow id="bi-cell" cx={cx} cy={cy} r={R * 2} colour={J.fatGlow} strength={0.4 + 0.4 * open} />
      <circle cx={cx} cy={cy} r={R} fill={J.cellPlasma} opacity={0.9} />
      <path
        d={arc(R)}
        fill="none"
        stroke={J.cellWall}
        strokeWidth={Math.max(2 * p, R * 0.08)}
        strokeLinecap="round"
      />
      <path
        d={arc(R * 1.04)}
        fill="none"
        stroke={LINE.color}
        strokeWidth={Math.max(1.5 * p, R * 0.02)}
        strokeLinecap="round"
      />
      <defs>
        <radialGradient id="bi-oil" cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor={J.fatLight} />
          <stop offset="0.6" stopColor={J.fat} />
          <stop offset="1" stopColor={J.fatShade} />
        </radialGradient>
      </defs>
      <circle
        cx={cx + R * 0.04}
        cy={cy + R * 0.05 - R * 0.06 * open}
        r={drop}
        fill="url(#bi-oil)"
        stroke={J.fatShade}
        strokeWidth={Math.max(1, R * 0.015)}
      />
      <ellipse
        cx={cx - drop * 0.35}
        cy={cy - drop * 0.38}
        rx={drop * 0.24}
        ry={drop * 0.13}
        fill={J.fatGlow}
        opacity={0.85}
        transform={`rotate(-30 ${cx - drop * 0.35} ${cy - drop * 0.38})`}
      />
      <ellipse
        cx={cx + R * 0.72}
        cy={cy + R * 0.55}
        rx={R * 0.13}
        ry={R * 0.08}
        fill={J.nucleus}
        transform={`rotate(-40 ${cx + R * 0.72} ${cy + R * 0.55})`}
      />
    </g>
  );
}

// ============================================================================================
// The oil's atoms, in tenths of a millimetre round the cell's middle.
type Atom = { x: number; y: number; kind: 'C' | 'H' | 'O'; group: number };
type Bond = [number, number];
/** A fat molecule: the glycerol spine on the left, three long chains of carbon running right. */
const MOLECULE: { atoms: Atom[]; bonds: Bond[] } = (() => {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];
  const add = (x: number, y: number, kind: Atom['kind'], group: number) => {
    atoms.push({ x, y, kind, group });
    return atoms.length - 1;
  };
  let group = 0;
  const spine: number[] = [];
  for (let i = 0; i < 3; i++) {
    const y = -13 + 13 * i;
    const g = add(-25, y, 'C', group);
    const hs =
      i === 1
        ? [[-28.5, y]]
        : [
            [-28, y - 2.4],
            [-28, y + 2.4],
          ];
    for (const [hx, hy] of hs) bonds.push([g, add(hx ?? 0, hy ?? 0, 'H', group)]);
    group++;
    if (spine.length) bonds.push([spine[spine.length - 1] ?? 0, g]);
    spine.push(g);
    const o = add(-20.5, y, 'O', -1);
    bonds.push([g, o]);
    const c0 = add(-16, y, 'C', group);
    bonds.push([o, c0]);
    bonds.push([c0, add(-16, y - 4.4, 'O', -1)]);
    group++;
    let prev = c0;
    const n = 9 + i;
    for (let j = 1; j <= n; j++) {
      const x = -16 + 3.6 * j;
      const up = j % 2 ? 1 : -1;
      const cy = y + up * 1.1;
      const c = add(x, cy, 'C', group);
      bonds.push([prev, c]);
      bonds.push([c, add(x, cy + up * 3.0, 'H', group)]);
      bonds.push([c, add(x + (j === n ? 2.6 : 0), cy - up * (j === n ? 0 : 3.0), 'H', group)]);
      if (j === n) bonds.push([c, add(x + 1.6, cy + up * 2.6, 'H', group)]);
      prev = c;
      group++;
    }
  }
  return { atoms, bonds };
})();
const CARBONS = MOLECULE.atoms.map((a, i) => ({ a, i })).filter((x) => x.a.kind === 'C');

/** The oil round the molecule: shining yellow, other molecules soft behind it. */
function OilBack({ v, s }: { v: View; s: State }) {
  const k = v.k * ATOM;
  const [cx, cy] = at(v, CELL.x, CELL.y);
  const fade = clamp((k * 40 - v.W * 0.25) / (v.W * 0.2));
  if (fade <= 0) return null;
  const ghosts = Array.from({ length: 7 }, (_, i) => {
    const gx = cx + (rnd(i, 11) - 0.5) * 140 * k + 3 * k * Math.sin(s.t * 0.4 + i);
    const gy = cy + (rnd(i, 12) - 0.5) * 220 * k;
    return (
      <g
        key={i}
        transform={`translate(${gx} ${gy}) rotate(${rnd(i, 13) * 60 - 30}) scale(${0.6 * k})`}
        opacity={0.18}
      >
        <path
          d="M -40 0 L -30 3 L -20 -3 L -10 3 L 0 -3 L 10 3 L 20 -3 L 30 3 L 40 -3"
          fill="none"
          stroke={J.fatShade}
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
    );
  });
  return (
    <g opacity={fade}>
      <defs>
        <radialGradient id="bi-oilback" cx="0.5" cy="0.45" r="0.8">
          <stop offset="0" stopColor={J.fatLight} />
          <stop offset="1" stopColor={J.fatShade} />
        </radialGradient>
      </defs>
      <rect width={v.W} height={v.H} fill="url(#bi-oilback)" />
      {ghosts}
    </g>
  );
}

/** Where each carbon's piece has gone: apart, joined with oxygen, and on as gas and water. */
function pieceAt(i: number, a: Atom, s: State) {
  const apart = s.thing('apart', 1.0);
  const out = 1 + 0.75 * smooth(apart);
  const gas = s.since('gas');
  const later = gas > 1e8 ? 3 : Math.max(0, gas);
  return {
    x: a.x * out + 1.5 * apart * Math.sin(i * 1.7 + s.t * 1.3),
    y:
      a.y * out +
      1.5 * apart * Math.cos(i * 1.3 + s.t * 1.1) -
      4 * later * (a.kind === 'C' ? 1 : 0),
  };
}

/** The molecule, and what becomes of it. */
function Atoms({ v, s }: { v: View; s: State }) {
  const k = v.k * ATOM;
  const near = clamp((k * 50 - v.W * 0.3) / (v.W * 0.3));
  if (near <= 0 || k > v.W) return null;
  const [cx, cy] = at(v, CELL.x, CELL.y);
  const P = (x: number, y: number): [number, number] => [cx + x * k, cy + y * k];
  const apart = s.thing('apart', 1.0);
  const joins = s.thing('joins', 1.2);
  const water = s.thing('water', 0.8);
  const gas = s.thing('gas', 0.8);
  const hi = { C: s.thing('carbon', 0.5), H: s.thing('hydrogen', 0.5), O: s.thing('oxygen', 0.5) };
  const focus =
    s.stop === 'chain' ? (hi.O > 0 ? 'O' : hi.H > 0 ? 'H' : hi.C > 0 ? 'C' : null) : null;
  const pos = MOLECULE.atoms.map((a, i) => {
    if (apart <= 0) return { x: a.x, y: a.y };
    // A hydrogen or the chain's own oxygen rides with the carbon it is bonded to.
    const host = MOLECULE.bonds.find(
      ([p, q]) => (p === i || q === i) && MOLECULE.atoms[p === i ? q : p]?.kind === 'C',
    );
    const hc = host ? (host[0] === i ? host[1] : host[0]) : i;
    const h = MOLECULE.atoms[hc] ?? a;
    const c = pieceAt(hc, h, s);
    return { x: c.x + (a.x - h.x), y: c.y + (a.y - h.y) };
  });
  const sw = Math.max(1, 0.35 * k);
  const bonds = MOLECULE.bonds.map(([p, q], i) => {
    const a = pos[p];
    const b = pos[q];
    if (!a || !b) return null;
    const ka = MOLECULE.atoms[p]?.kind;
    const kb = MOLECULE.atoms[q]?.kind;
    // Carbon to carbon, and carbon to the spine's oxygen, break apart.
    const breaks = ka !== 'H' && kb !== 'H';
    const o = breaks ? 1 - smooth(apart * 3) : 1 - water;
    if (o <= 0) return null;
    const [x1, y1] = P(a.x, a.y);
    const [x2, y2] = P(b.x, b.y);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={LINE.color}
        strokeWidth={sw}
        opacity={o}
      />
    );
  });
  // Oxygen from your breath, flying in to each carbon in pairs.
  const incoming: ReactNode[] = [];
  if (joins > 0)
    CARBONS.forEach(({ a, i }, n) => {
      const c = pieceAt(i, a, s);
      const k2 = clamp(joins * 1.6 - (n % 9) * 0.07);
      const ang = rnd(n, 91) * Math.PI * 2;
      for (const side of [-1, 1]) {
        const tx = c.x + side * 2.4;
        const ty = c.y;
        const fx = c.x + Math.cos(ang) * 60;
        const fy = c.y + Math.sin(ang) * 60;
        const [x, y] = P(lerp(fx, tx, smooth(k2)), lerp(fy, ty, smooth(k2)));
        incoming.push(
          <Bead
            key={`o${i}${side}`}
            x={x}
            y={y}
            r={1.15 * k}
            kind="O"
            stroke={Math.max(1, 0.15 * k)}
            glow={k2 < 1 ? 0.6 : 0}
          />,
        );
      }
    });
  const atoms = MOLECULE.atoms.map((a, i) => {
    const q = pos[i];
    if (!q) return null;
    const [x, y] = P(q.x, q.y);
    const r = (a.kind === 'H' ? 0.8 : 1.25) * k;
    const glow = focus === a.kind ? 0.5 + 0.5 * Math.sin(s.t * 6) : 0;
    const dim = focus && focus !== a.kind ? 0.55 : 1;
    return (
      <g key={i} opacity={dim}>
        <Bead x={x} y={y} r={r} kind={a.kind} stroke={Math.max(1, 0.15 * k)} glow={glow} />
      </g>
    );
  });
  // As gas: a grey bubble round each carbon and its two oxygens. As water: blue drops among the hydrogens.
  const bubbles =
    gas > 0
      ? CARBONS.map(({ a, i }, n) => {
          const c = pieceAt(i, a, s);
          const [x, y] = P(c.x, c.y);
          const g = clamp(gas * 1.6 - (n % 7) * 0.08);
          return (
            <g key={`b${i}`} opacity={g}>
              <circle
                cx={x}
                cy={y}
                r={4.4 * k * outBack(g)}
                fill={J.gas}
                fillOpacity={0.5}
                stroke={J.gasShade}
                strokeWidth={Math.max(1, 0.55 * k)}
              />
              <circle
                cx={x - 1.6 * k}
                cy={y - 1.8 * k}
                r={0.9 * k}
                fill={J.gasLight}
                opacity={0.7}
              />
            </g>
          );
        })
      : null;
  const drops =
    water > 0
      ? MOLECULE.atoms.map((a, i) => {
          if (a.kind !== 'H' || i % 2) return null;
          const q = pos[i];
          if (!q) return null;
          const [x, y] = P(q.x, q.y + 2 * water);
          const w = clamp(water * 1.6 - rnd(i, 97) * 0.5);
          const r = 2.6 * k * outBack(w);
          return (
            <g key={`w${i}`} opacity={w}>
              <path
                d={`M ${x} ${y - r * 1.5} Q ${x + r} ${y - r * 0.2} ${x + r} ${y + r * 0.3} A ${r} ${r} 0 1 1 ${x - r} ${y + r * 0.3} Q ${x - r} ${y - r * 0.2} ${x} ${y - r * 1.5} Z`}
                fill={J.water}
                opacity={0.9}
                stroke={J.waterDeep}
                strokeWidth={Math.max(1, 0.3 * k)}
              />
            </g>
          );
        })
      : null;
  const tagAt = (x: number, y: number): [number, number] => [CELL.x + x * ATOM, CELL.y + y * ATOM];
  return (
    <g opacity={near}>
      {bonds}
      {drops}
      {atoms}
      {incoming}
      {bubbles}
      <Tag
        v={v}
        x={tagAt(6, -9)[0]}
        y={tagAt(6, -9)[1]}
        text="CARBON"
        shown={hi.C * (1 - hi.H)}
        colour={J.carbon}
      />
      <Tag
        v={v}
        x={tagAt(10, 9)[0]}
        y={tagAt(10, 9)[1]}
        text="HYDROGEN"
        shown={hi.H * (1 - hi.O)}
      />
      <Tag
        v={v}
        x={tagAt(-16, -21)[0]}
        y={tagAt(-16, -21)[1]}
        text="OXYGEN"
        shown={hi.O * (s.stop === 'chain' ? 1 : 0)}
        colour={J.oxygenShade}
      />
      <Tag
        v={v}
        x={tagAt(0, 26)[0]}
        y={tagAt(0, 26)[1]}
        text="WATER"
        shown={water * (1 - gas)}
        colour={J.waterDeep}
      />
      <Tag
        v={v}
        x={tagAt(-8, -30)[0]}
        y={tagAt(-8, -30)[1]}
        text="CARBON DIOXIDE"
        shown={gas}
        colour={J.gasShade}
      />
    </g>
  );
}

/** A glass of soda, fizzing with the same grey bubbles, in a round window over the atoms. */
function Soda({ v, s }: { v: View; s: State }) {
  // Said last in its line, it stays into the next shot and fades as the camera flies on.
  const leaving = s.stop === 'leftovers' ? 0 : clamp((s.local / s.fps - 1.4) / 0.5);
  const shown = s.thing('soda', 0.6) * (1 - leaving);
  if (shown <= 0) return null;
  const p = pxOf(v);
  const R = 200 * p * outBack(shown);
  const cx = v.W * 0.74;
  const cy = v.H * 0.2;
  return (
    <g opacity={clamp(shown * 3)}>
      <circle cx={cx} cy={cy} r={R} fill={J.livingWall} stroke={LINE.color} strokeWidth={6 * p} />
      <g transform={`translate(${cx} ${cy}) scale(${R / 175})`}>
        <path
          d="M -55 -95 L 55 -95 L 45 105 L -45 105 Z"
          fill={J.glass}
          opacity={0.5}
          stroke={LINE.color}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path d="M -52 -60 L 52 -60 L 45 105 L -45 105 Z" fill={J.soda} opacity={0.85} />
        <path d="M -52 -60 L 52 -60 L 50 -48 L -50 -48 Z" fill={J.sodaLight} />
        {Array.from({ length: 12 }, (_, i) => {
          const u = (s.t * 0.6 + rnd(i, 101)) % 1;
          return (
            <circle
              key={i}
              cx={-38 + 76 * rnd(i, 102)}
              cy={95 - u * 150}
              r={4 + 5 * rnd(i, 103)}
              fill={J.gasLight}
              stroke={J.gasShade}
              strokeWidth={2}
              opacity={u < 0.9 ? 0.9 : 0}
            />
          );
        })}
        <line
          x1={20}
          y1={-130}
          x2={8}
          y2={60}
          stroke={J.cross}
          strokeWidth={10}
          strokeLinecap="round"
        />
      </g>
      <text
        x={cx}
        y={cy + R + 56 * p}
        fontFamily={font}
        fontWeight={800}
        fontSize={44 * p}
        fill={J.clockFace}
        stroke={LINE.color}
        strokeWidth={8 * p}
        paintOrder="stroke"
        textAnchor="middle"
      >
        SODA FIZZ
      </text>
    </g>
  );
}

// ============================================================================================
/** Oxygen from the air, in pairs, streaming in at your nose and down to the lungs. */
const AIR_IN: [number, number][] = [
  [0.55, -1.62],
  [0.4, -1.55],
  [NOSE.x + 0.01, -1.485],
  [0.13, -1.49],
  [0.08, -1.43],
  [0.07, -1.3],
  [0.06, -1.2],
  [0.03, -1.1],
];
/** The gas on its way out: up the windpipe and out of your mouth. */
const AIR_OUT: [number, number][] = [
  [0.03, -1.1],
  [0.06, -1.2],
  [0.07, -1.33],
  [0.08, -1.41],
  [0.15, -1.418],
  [MOUTH_BODY.x + 0.02, -1.415],
  [0.42, -1.45],
];
function Breath({ v, s }: { v: View; s: State }) {
  if (!inView(v, 0.2, -1.4, 0.4, 40)) return null;
  const inhale = s.thing('inhale', 0.4);
  const out = s.stop === 'cloud' ? 1 : 0;
  const flow: ReactNode[] = [];
  if (inhale > 0 || s.stop === 'nose') {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const u = (s.t * (0.35 + 0.45 * inhale) + i / n) % 1;
      const [x, y] = pointOn(AIR_IN, u);
      const r = 0.0075;
      const [sx, sy] = at(v, x, y);
      const R = r * v.k;
      const o =
        (s.stop === 'nose' ? 0.35 + 0.65 * inhale : inhale) * (u > 0.92 ? (1 - u) / 0.08 : 1);
      const ang = i * 1.3 + s.t * 2;
      flow.push(
        <g key={`i${i}`} opacity={o}>
          <Bead
            x={sx - R * 0.8 * Math.cos(ang)}
            y={sy - R * 0.8 * Math.sin(ang)}
            r={R}
            kind="O"
            stroke={Math.max(1, R * 0.12)}
          />
          <Bead
            x={sx + R * 0.8 * Math.cos(ang)}
            y={sy + R * 0.8 * Math.sin(ang)}
            r={R}
            kind="O"
            stroke={Math.max(1, R * 0.12)}
          />
        </g>,
      );
    }
  }
  if (out > 0)
    for (let i = 0; i < 16; i++) {
      const u = (s.t * 0.6 + i / 16) % 1;
      const [x, y] = pointOn(AIR_OUT, u);
      const [sx, sy] = at(v, x, y);
      const R = 0.009 * v.k;
      flow.push(
        <circle
          key={`o${i}`}
          cx={sx}
          cy={sy}
          r={R}
          fill={J.gas}
          stroke={LINE.color}
          strokeWidth={Math.max(1, R * 0.15)}
        />,
      );
    }
  const [tx, ty] = [0.42, -1.66];
  return (
    <g>
      {flow}
      <Tag
        v={v}
        x={tx}
        y={ty}
        text="OXYGEN IN"
        shown={inhale * (s.stop === 'nose' ? 1 : 0)}
        colour={J.oxygenShade}
      />
    </g>
  );
}

// ============================================================================================
/** The inside of you at one frame. */
export function Inside({ v, s }: { v: View; s: State }) {
  const close = v.cam.w < 0.02;
  return (
    <g>
      <InsideGround v={v} s={s} />
      {!close && (
        <g>
          <Silhouette v={v} s={s} />
          <Airway v={v} />
          <Organs v={v} s={s} />
          <Vessel v={v} s={s} />
          <Lungs v={v} s={s} />
          <Breath v={v} s={s} />
        </g>
      )}
      <BellyFat v={v} s={s} />
      <OilBack v={v} s={s} />
      <Atoms v={v} s={s} />
      <Soda v={v} s={s} />
      {!close && (
        <g>
          <Tag
            v={v}
            x={BELLY.x + 0.02}
            y={BELLY.y - 0.16}
            text="FAT CELLS"
            shown={s.thing('cells', 0.5) * (s.stop === 'belly' ? 1 : 0)}
            colour={J.fatShade}
          />
          <Tag
            v={v}
            x={CELL.x}
            y={CELL.y - CELL.r * 1.8}
            text="OIL"
            shown={s.thing('oil', 0.5) * (v.cam.w < 0.12 ? 1 : 0)}
            colour={J.fatShade}
          />
          <Tag
            v={v}
            x={LUNGS.x - 0.02}
            y={LUNGS.y + 0.2}
            text="LUNGS"
            shown={s.thing('lungs-in', 0.5)}
          />
          <Tag
            v={v}
            x={0.16}
            y={-0.7}
            text="BLOOD"
            shown={s.thing('blood', 0.5) * (1 - s.thing('lungs-in'))}
            colour={J.vessel}
          />
        </g>
      )}
      {s.stop === 'cloud' && (
        <g transform={`translate(${at(v, 0.3, -1.44)[0]} ${at(v, 0.3, -1.44)[1]})`} opacity={0.9}>
          <Puff r={0.06 * v.k} fill={J.breath} shade={J.breathShade} seed={2} />
        </g>
      )}
    </g>
  );
}
