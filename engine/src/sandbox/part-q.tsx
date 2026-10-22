import type { ReactNode } from 'react';
import { useCurrentFrame } from 'remotion';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { Icon } from '../explainer/ThumbParts';
import { VIEWER_FONT } from '../overlays/text';
import { ink, white } from '../tokens';

/**
 * Look 3 of the motion-graphics test, moving (Biku picked it, 2026-10-16: "3 may be"): a small
 * cinema drawn at an angle like a tiny model, that builds itself up, the camera gliding round
 * it, then pushing into the bucket and opening on where the snack dollar goes, the money as
 * blocks that rise and coins that drop onto them. Twelve seconds, no voice: a test of the look in
 * motion before any video is made in it.
 *
 * Then the colours (his words: "can the colour combination be more immersive... not like
 * charts... a little bit different and better"): each palette (`isoPalettes` in the tokens) is
 * a lit space, not a flat sheet: a sky that fades top to bottom, a soft glow behind the scene,
 * specks of light drifting up. `IsoPalettesSheet` shows them side by side.
 */

const C = fineTokens.colors;
const PAL = fineTokens.isoPalettes;
type Palette = (typeof PAL)['mint'];
export type PaletteName = keyof typeof PAL;
const W = 1080;
const H = 1920;
const font = `${VIEWER_FONT}, Arial, sans-serif`;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const outCubic = (x: number) => 1 - (1 - x) ** 3;
const outBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
const inOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const at = (f: number, start: number, frames: number) => clamp((f - start) / frames);

function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(ch(a, i) * (1 - t) + ch(b, i) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** The camera on the small world: where its middle lands, how close, and how far it has turned. */
type Cam = { cx: number; cy: number; zoom: number; turn: number };
type Pt = readonly [number, number];

const project =
  (cam: Cam) =>
  (x: number, y: number, z: number): Pt => {
    const a = (cam.turn * Math.PI) / 180;
    const X = x * Math.cos(a) - y * Math.sin(a);
    const Y = x * Math.sin(a) + y * Math.cos(a);
    return [cam.cx + (X - Y) * 0.866 * cam.zoom, cam.cy + ((X + Y) * 0.5 - z) * cam.zoom];
  };
const poly = (pts: Pt[]) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;

function Block({
  p,
  x0,
  x1,
  y0,
  y1,
  z0,
  z1,
  fill,
}: {
  p: ReturnType<typeof project>;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  fill: string;
}) {
  if (z1 <= z0 + 0.5) return null;
  return (
    <g>
      <path d={poly([p(x0, y1, z1), p(x1, y1, z1), p(x1, y1, z0), p(x0, y1, z0)])} fill={fill} />
      <path
        d={poly([p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, z0), p(x1, y0, z0)])}
        fill={mix(fill, C.dark, 0.28)}
      />
      <path
        d={poly([p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)])}
        fill={mix(fill, C.light, 0.3)}
      />
    </g>
  );
}

function Floor({ p, grow, pal }: { p: ReturnType<typeof project>; grow: number; pal: Palette }) {
  const s = 420 * outBack(grow);
  if (grow <= 0) return null;
  return (
    <>
      <path
        d={poly([p(-s, -s, 0), p(s, -s, 0), p(s, s, 0), p(-s, s, 0)])}
        fill={mix(pal.floor, C.dark, 0.08)}
      />
      <path
        d={poly([p(-s, s, 0), p(s, s, 0), p(s, s, -40), p(-s, s, -40)])}
        fill={mix(pal.floor, C.dark, 0.3)}
      />
      <path
        d={poly([p(s, -s, 0), p(s, s, 0), p(s, s, -40), p(s, -s, -40)])}
        fill={mix(pal.floor, C.dark, 0.42)}
      />
    </>
  );
}

/** The space round the scene: a sky fading top to bottom, a glow behind the scene, specks of light. */
function Space({ pal, f, id }: { pal: Palette; f: number; id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.skyTop} />
          <stop offset="1" stopColor={pal.skyBottom} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0" stopColor={pal.glow} stopOpacity={pal.glowOpacity} />
          <stop offset="1" stopColor={pal.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      <rect width={W} height={H} fill={`url(#${id}-glow)`} />
      {pal.specksOpacity > 0 &&
        Array.from({ length: 16 }, (_, i) => {
          const x = (i * 337) % W;
          const y = H - ((i * 211 + f * (1.2 + (i % 3) * 0.5)) % (H + 100));
          return (
            <circle
              key={i}
              cx={x + 20 * Math.sin(f / 30 + i)}
              cy={y}
              r={3 + (i % 4) * 2}
              fill={pal.specks}
              opacity={pal.specksOpacity * (0.4 + (0.6 * ((i * 7) % 5)) / 4)}
            />
          );
        })}
    </>
  );
}

function Pop({ p, x, y, children }: { p: number; x: number; y: number; children: ReactNode }) {
  if (p <= 0) return null;
  const s = 0.4 + 0.6 * outBack(p);
  return (
    <g
      opacity={clamp(p * 2.5)}
      transform={`translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`}
    >
      {children}
    </g>
  );
}

function Pill({
  x,
  y,
  text,
  size,
  fill,
}: {
  x: number;
  y: number;
  text: string;
  size: number;
  fill: string;
}) {
  const w = size * 0.62 * text.length + size * 1.2;
  const h = size * 1.6;
  return (
    <g>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={fill} />
      <text
        x={x}
        y={y + size * 0.36}
        fontFamily={font}
        fontSize={size}
        fontWeight={700}
        fill={C.light}
        textAnchor="middle"
      >
        {text}
      </text>
    </g>
  );
}

function Title({
  f,
  start,
  lines,
  fill,
}: {
  f: number;
  start: number;
  lines: string[];
  fill: string;
}) {
  return (
    <>
      {lines.map((line, i) => (
        <Pop key={i} p={at(f, start + i * 6, 9)} x={540} y={300 + i * 88}>
          <text
            x={540}
            y={320 + i * 88}
            fontFamily={font}
            fontSize={70}
            fontWeight={700}
            fill={fill}
            textAnchor="middle"
          >
            {line}
          </text>
        </Pop>
      ))}
    </>
  );
}

const bucketAt = (x: number, y: number, size: number) => (
  <Icon
    name="bucket"
    x={x / W}
    y={y / H}
    size={size / H}
    turn={0}
    crossed={false}
    W={W}
    H={H}
    line={5}
  />
);

/** The cinema counter building itself up: frames 0 to about 200. */
function Counter({ f, pal, id }: { f: number; pal: Palette; id: string }) {
  // The camera glides round, a touch closer through the scene, and dives into the bucket at the end.
  const glide = clamp(f / 200);
  const dive = inOut(at(f, 178, 22));
  const cam: Cam = { cx: 540, cy: 1340, zoom: 1 + 0.08 * glide, turn: -12 + 22 * glide };
  const p = project(cam);
  // The dive: everything grows about the bucket, which comes to the middle of the picture.
  const [bx0, by0] = p(40, 0, 190);
  const zoomIn = 1 + 5 * dive;
  const into = `translate(${bx0 + (540 - bx0) * dive} ${by0 - 110 + (760 - by0 + 110) * dive}) scale(${zoomIn}) translate(${-bx0} ${-(by0 - 110)})`;
  const counter = 190 * outBack(at(f, 12, 16));
  const machine = 310 * outBack(at(f, 26, 16));
  const drop = at(f, 58, 14);
  const [bx, by] = p(40, 0, 190);
  const fall = (1 - outBack(drop)) * 700;
  const [sx, sy] = p(250, -120, 470);
  const bob = 10 * Math.sin(f / 9);
  const sign = at(f, 92, 10);
  return (
    <>
      <Space pal={pal} f={f} id={id} />
      <Title f={f} start={66} lines={['WHY DOES POPCORN']} fill={pal.ink} />
      <Pop p={at(f, 76, 9)} x={540} y={400}>
        <Pill x={540} y={400} text="COST $10?" size={70} fill={pal.machine} />
      </Pop>
      <g transform={into}>
        <Floor p={p} grow={at(f, 0, 14)} pal={pal} />
        {machine > 0 && (
          <path
            d={poly([p(-230, -60, 0), p(-40, -60, 0), p(120, -360, 0), p(-70, -360, 0)])}
            fill={C.dark}
            opacity={0.14 * clamp(machine / 310)}
          />
        )}
        <Block
          p={p}
          x0={-240}
          x1={-70}
          y0={-60}
          y1={60}
          z0={190}
          z1={190 + machine}
          fill={pal.machine}
        />
        {machine >= 300 && (
          <path
            d={poly([p(-215, 60, 460), p(-95, 60, 460), p(-95, 60, 260), p(-215, 60, 260)])}
            fill={C.popcorn}
          />
        )}
        {machine >= 300 &&
          Array.from({ length: 10 }, (_, i) => {
            const born = 42 + i * 3;
            if (f < born) return null;
            const jump = 18 * Math.max(0, Math.sin((f - born) / 4 + i)) ** 8;
            const [kx, ky] = p(
              -200 + (i % 4) * 30,
              60,
              280 + Math.floor(i / 4) * 45 + (i % 2) * 12 + jump,
            );
            return (
              <circle
                key={i}
                cx={kx}
                cy={ky}
                r={16 * cam.zoom}
                fill={i % 3 ? C.butter : C.yellow}
              />
            );
          })}
        <Block p={p} x0={-300} x1={300} y0={-70} y1={70} z0={0} z1={counter} fill={pal.counter} />
        {drop > 0 && bucketAt(bx, by - 120 * cam.zoom - fall, 250 * cam.zoom)}
        {sign > 0 && dive < 0.3 && (
          <Pop p={sign} x={sx} y={sy}>
            <ellipse
              cx={sx}
              cy={p(250, -120, 190)[1] + 10}
              rx={110}
              ry={26}
              fill={C.dark}
              opacity={0.15}
            />
            <rect x={sx - 150} y={sy - 90 + bob} width={300} height={170} rx={24} fill={pal.sign} />
            <text
              x={sx}
              y={sy + 40 + bob}
              fontFamily={font}
              fontSize={120}
              fontWeight={700}
              fill={pal.signText}
              textAnchor="middle"
            >
              $10
            </text>
          </Pop>
        )}
      </g>
    </>
  );
}

/** Where the snack dollar goes: from frame 0 of its own scene. */
function Money({ f, pal, id }: { f: number; pal: Palette; id: string }) {
  const cam: Cam = {
    cx: 540,
    cy: 1340,
    zoom: 1.04 - 0.05 * clamp(f / 160),
    turn: 10 - 16 * clamp(f / 160),
  };
  const p = project(cam);
  const red = 470 * outBack(at(f, 16, 22));
  const teal = 132 * outBack(at(f, 40, 16));
  const [rx, ry] = p(-140, 0, 640);
  const [tx, ty] = p(160, 0, 170);
  return (
    <>
      <Space pal={pal} f={f} id={id} />
      <Title f={f} start={4} lines={['WHERE YOUR SNACK', 'DOLLAR GOES']} fill={pal.ink} />
      <Floor p={p} grow={1} pal={pal} />
      <Block p={p} x0={-230} x1={-50} y0={-90} y1={90} z0={0} z1={red} fill={pal.big} />
      <Block p={p} x0={70} x1={250} y0={-90} y1={90} z0={0} z1={teal} fill={pal.small} />
      {[0, 1, 2].map((i) => {
        const land = at(f, 50 + i * 8, 10);
        if (land <= 0) return null;
        const [cx, cy] = p(-140, 0, 470 + 18 + i * 26 + (1 - outCubic(land)) * 240);
        return (
          <g key={i}>
            <ellipse
              cx={cx}
              cy={cy + 10}
              rx={70 * cam.zoom}
              ry={36 * cam.zoom}
              fill={mix(pal.coin, C.dark, 0.3)}
            />
            <ellipse cx={cx} cy={cy} rx={70 * cam.zoom} ry={36 * cam.zoom} fill={pal.coin} />
          </g>
        );
      })}
      <Pop p={at(f, 74, 9)} x={rx} y={ry - 30}>
        <Pill x={rx} y={ry - 30} text="CINEMA 82¢" size={54} fill={pal.big} />
      </Pop>
      <Pop p={at(f, 96, 9)} x={tx + 60} y={ty - 40}>
        <Pill x={tx + 60} y={ty - 40} text="18¢" size={60} fill={pal.small} />
        {['CORN, BUTTER,', 'BUCKET'].map((line, k) => (
          <text
            key={k}
            x={tx + 10}
            y={ty + 70 + k * 54}
            fontFamily={font}
            fontSize={44}
            fontWeight={700}
            fill={pal.ink}
            textAnchor="start"
          >
            {line}
          </text>
        ))}
      </Pop>
    </>
  );
}

/** The cut from the counter into the money: the next scene opens in a circle out of the bucket. */
export function IsoMotionVideo({ palette = 'mint' }: { palette?: PaletteName }) {
  const f = useCurrentFrame();
  const pal = PAL[palette];
  const CUT = 196;
  const open = inOut(at(f, CUT, 16));
  if (f < CUT) return <Counter f={f} pal={pal} id="iso-a" />;
  return (
    <>
      <Counter f={Math.min(f, CUT + 4)} pal={pal} id="iso-a" />
      <defs>
        <clipPath id="iso-open">
          <circle cx={540} cy={760} r={open * 1300} />
        </clipPath>
      </defs>
      <g clipPath="url(#iso-open)">
        <Money f={f - CUT} pal={pal} id="iso-b" />
      </g>
    </>
  );
}

const SHOWN: Array<{ name: PaletteName; label: string }> = [
  { name: 'mint', label: '1  Now: mint' },
  { name: 'night', label: '2  Cinema night' },
  { name: 'sunset', label: '3  Sunset' },
  { name: 'ocean', label: '4  Deep ocean' },
];

/** The palettes side by side, each on the two moments as they stand when built. */
export const IsoPalettesSheet = () => {
  const k = 0.235;
  const tw = W * k;
  const th = H * k;
  const gap = (W - SHOWN.length * tw) / (SHOWN.length + 1);
  return (
    <>
      {SHOWN.map((s, col) => {
        const x = gap + col * (tw + gap);
        const pal = PAL[s.name];
        return (
          <g key={s.name}>
            <rect x={x} y={70} width={tw} height={60} rx={12} fill={white} />
            <text
              x={x + tw / 2}
              y={111}
              fontFamily={font}
              fontSize={28}
              fontWeight={700}
              fill={ink}
              textAnchor="middle"
            >
              {s.label}
            </text>
            {[0, 1].map((row) => {
              const y = 160 + row * (th + 30);
              const id = `pal-${s.name}-${row}`;
              return (
                <g key={row}>
                  <defs>
                    <clipPath id={`${id}-clip`}>
                      <rect width={W} height={H} />
                    </clipPath>
                  </defs>
                  <g transform={`translate(${x} ${y}) scale(${k})`} clipPath={`url(#${id}-clip)`}>
                    {row === 0 ? (
                      <Counter f={150} pal={pal} id={id} />
                    ) : (
                      <Money f={140} pal={pal} id={id} />
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        );
      })}
    </>
  );
};
