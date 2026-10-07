import { useId } from 'react';
import type { ReactNode } from 'react';
import { DEG, lerp } from '../rig/math';
import { seeded } from '../rig/random';
import { MASK_HIDE, MASK_SHOW, ink, mix, shade, tokens, white } from '../tokens';
import { bgRoles } from './roles';
import type { BgRoles } from './roles';

/**
 * Backgrounds (Style 5). Two treatments chosen by mood:
 * simple (Reference B): flat color fields, flat shapes, black silhouettes;
 * atmospheric (Reference A): soft painted sky, soft clouds, light rays, stars, haze.
 * No outlines anywhere. Built in layers that shift at different speeds when the camera pans.
 */

/** The two background treatments (Style 5.2). */
export const TREATMENTS = ['simple', 'atmospheric'] as const;
export type Treatment = (typeof TREATMENTS)[number];

/** Every silhouette shape a background can place. */
export const SILHOUETTE_KINDS = [
  'bush',
  'tree',
  'rock',
  'buildings',
  'house',
  'castle',
  'pine',
  'lamp-post',
  'fence',
] as const;

export type Silhouette = {
  kind: (typeof SILHOUETTE_KINDS)[number];
  /** Horizontal position as a fraction of the frame width. */
  x: number;
  /** Size as a fraction of the frame height. */
  size: number;
  layer?: 'near' | 'mid';
};

/** What the ground is: grass with tufts, a paved street, or the floor of a room. */
export type GroundKind = 'grass' | 'road' | 'floor';

/**
 * A room (Style 5.3): a flat wall and floor, a soft vignette, and windows as the light. Every
 * place and size is a fraction of the frame. Columns and banners make a hall; a shelf makes a
 * home.
 */
export type Interior = {
  windows: Array<{ x: number; y: number; w: number; h: number; arched?: boolean }>;
  columns: number;
  banners: number;
  shelf: boolean;
};

export type BackgroundSpec = {
  treatment: Treatment;
  palette: string;
  seed: number;
  /** Horizon height as a fraction of the frame height. */
  horizon: number;
  /** Moon position and radius as fractions of the frame (x of width, y and r of height). */
  moon: { x: number; y: number; r: number } | null;
  stars: number;
  clouds: number;
  rays: boolean;
  hills: boolean;
  silhouettes: Silhouette[];
  tufts: number;
  ground: GroundKind;
  /** Set for a room. The sky, hills and clouds are then left out. */
  interior: Interior | null;
};

/** Palettes that read as night: they get a moon and stars by default. */
export const NIGHT_PALETTES: readonly string[] = ['storm-slate', 'dusk-violet', 'danger'];

/** Sensible defaults per treatment. Override any field. */
export function backgroundSpec(
  treatment: Treatment,
  palette: string,
  seed: number,
  overrides: Partial<BackgroundSpec> = {},
): BackgroundSpec {
  // Moon and stars belong to night palettes only.
  const night = NIGHT_PALETTES.includes(palette);
  const defaults: BackgroundSpec =
    treatment === 'simple'
      ? {
          treatment,
          palette,
          seed,
          horizon: 0.74,
          moon: night ? { x: 0.2, y: 0.1, r: 0.05 } : null,
          stars: night ? 12 : 0,
          clouds: 0,
          rays: false,
          hills: false,
          silhouettes: [{ kind: 'bush', x: -0.03, size: 0.17, layer: 'near' }],
          tufts: 5,
          ground: 'grass',
          interior: null,
        }
      : {
          treatment,
          palette,
          seed,
          horizon: 0.76,
          moon: null,
          stars: night ? 34 : 0,
          clouds: 6,
          rays: true,
          hills: true,
          silhouettes: [{ kind: 'rock', x: 0.97, size: 0.12, layer: 'near' }],
          tufts: 4,
          ground: 'grass',
          interior: null,
        };
  return { ...defaults, ...overrides };
}

type Ctx = {
  spec: BackgroundSpec;
  roles: BgRoles;
  w: number;
  h: number;
  t: number;
  cameraX: number;
  id: string;
  atmo: boolean;
  endless: boolean;
  world: World | null;
};

/**
 * How far past its own canvas a background has to reach, px. In a tall frame a scene is wider
 * than the picture (L-0033), so the camera sees past both sides of the canvas, and above and
 * below it when it moves back to fit several people.
 */
export type World = { left: number; right: number; top: number; bottom: number };

const rnd = (c: Ctx, key: string) => seeded(`${c.spec.seed}:${key}`);

/** In an endless background a ground-level layer repeats every this many frame widths. */
const TILE = 1.2;

/**
 * A layer that moves with the camera at a given depth (0 = sky, about 1 = foreground).
 * A layer that repeats is drawn twice, one tile apart, and wraps round as the camera travels,
 * so an endless background never runs out however far the camera goes.
 */
const Layer = ({
  c,
  depth,
  repeats = false,
  children,
}: {
  c: Ctx;
  depth: number;
  repeats?: boolean;
  children: ReactNode;
}) => {
  // In an endless background what does not repeat stays put: the sky, the moon, the flat ground.
  const shift = c.endless && !repeats ? 0 : c.cameraX * depth;
  const tile = TILE * c.w;
  if (!c.endless && repeats && c.world) {
    // A wider world: the hills, bushes and grass stand again one tile along on each side.
    return (
      <>
        {c.world.left > 0 && <g transform={`translate(${-tile - shift} 0)`}>{children}</g>}
        <g transform={`translate(${-shift} 0)`}>{children}</g>
        {c.world.right > 0 && <g transform={`translate(${tile - shift} 0)`}>{children}</g>}
      </>
    );
  }
  if (!(c.endless && repeats)) return <g transform={`translate(${-shift} 0)`}>{children}</g>;
  const offset = ((shift % tile) + tile) % tile;
  return (
    <>
      {/* A wider world can be seen to the left of the canvas too. */}
      {c.world && c.world.left > 0 && (
        <g transform={`translate(${-tile - offset} 0)`}>{children}</g>
      )}
      <g transform={`translate(${-offset} 0)`}>{children}</g>
      <g transform={`translate(${tile - offset} 0)`}>{children}</g>
    </>
  );
};

function Sky({ c }: { c: Ctx }) {
  const gid = `${c.id}-sky`;
  return (
    <>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.atmo ? c.roles.skyTop : c.roles.skyBottom} />
          <stop offset="1" stopColor={c.roles.skyBottom} />
        </linearGradient>
      </defs>
      <rect x={-c.w} y={0} width={c.w * 3} height={c.h} fill={`url(#${gid})`} />
      {/* Above the canvas the sky goes on in the tone it has at the top. */}
      {c.world && c.world.top > 0 && (
        <rect
          x={-c.w}
          y={-c.world.top}
          width={c.w * 3}
          height={c.world.top + 1}
          fill={c.atmo ? c.roles.skyTop : c.roles.skyBottom}
        />
      )}
    </>
  );
}

function Rays({ c }: { c: Ctx }) {
  const [lo, hi] = tokens.background.lightRayOpacity;
  const src = { x: -0.15 * c.w, y: -0.12 * c.h };
  const L = 2.2 * c.h;
  const beams = [
    { a: 52, spread: 3.2 },
    { a: 61, spread: 2.2 },
    { a: 70, spread: 4.0 },
  ];
  return (
    <>
      <defs>
        <filter id={`${c.id}-rayblur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={c.h * 0.012} />
        </filter>
      </defs>
      <g filter={`url(#${c.id}-rayblur)`}>
        {beams.map((b, k) => {
          const p = (deg: number) => ({
            x: src.x + Math.cos(deg * DEG) * L,
            y: src.y + Math.sin(deg * DEG) * L,
          });
          const p1 = p(b.a - b.spread);
          const p2 = p(b.a + b.spread);
          const pulse = 0.5 + 0.5 * Math.sin((2 * Math.PI * c.t) / 6 + k * 1.7);
          return (
            <path
              key={k}
              d={`M ${src.x} ${src.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Z`}
              fill={c.roles.ray}
              opacity={lerp(lo, hi, pulse)}
            />
          );
        })}
      </g>
    </>
  );
}

function Stars({ c }: { c: Ctx }) {
  const top = c.spec.horizon * c.h * 0.78;
  return (
    <>
      {Array.from({ length: c.spec.stars }, (_, i) => {
        const x = lerp(-0.2, 1.2, rnd(c, `sx${i}`)) * c.w;
        const y = rnd(c, `sy${i}`) * top;
        const r =
          c.h * (c.atmo ? 0.0009 + 0.0018 * rnd(c, `sr${i}`) : 0.0014 + 0.0024 * rnd(c, `sr${i}`));
        const faint = 0.3 + 0.7 * rnd(c, `sb${i}`);
        const twinkle = 0.75 + 0.25 * Math.sin(c.t * 2.4 + rnd(c, `st${i}`) * 6.28);
        return <circle key={i} cx={x} cy={y} r={r} fill={c.roles.star} opacity={faint * twinkle} />;
      })}
    </>
  );
}

function Moon({ c }: { c: Ctx }) {
  const m = c.spec.moon;
  if (!m) return null;
  const cx = m.x * c.w;
  const cy = m.y * c.h;
  const r = m.r * c.h;
  const mid = `${c.id}-moon`;
  return (
    <>
      <defs>
        <mask
          id={mid}
          maskUnits="userSpaceOnUse"
          x={cx - r * 2}
          y={cy - r * 2}
          width={r * 4}
          height={r * 4}
        >
          <rect x={cx - r * 2} y={cy - r * 2} width={r * 4} height={r * 4} fill={MASK_SHOW} />
          <circle cx={cx + r * 0.42} cy={cy - r * 0.2} r={r * 0.9} fill={MASK_HIDE} />
        </mask>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={c.roles.moon} mask={`url(#${mid})`} />
    </>
  );
}

function Clouds({ c }: { c: Ctx }) {
  const [dark, midTone, light] = c.roles.clouds;
  const span = c.w * 1.8;
  const clouds = Array.from({ length: c.spec.clouds }, (_, i) => {
    const cw = c.w * (0.35 + 0.3 * rnd(c, `cw${i}`));
    const speed = c.w * 0.008 * (0.5 + rnd(c, `cv${i}`));
    const x0 = rnd(c, `cx${i}`) * span;
    const cx = ((((x0 + speed * c.t) % span) + span) % span) - c.w * 0.4;
    const cy = c.h * (0.06 + 0.42 * rnd(c, `cy${i}`));
    const blobs = Array.from({ length: 7 }, (_, k) => {
      const u = k / 6;
      const rx = cw * (0.12 + 0.08 * rnd(c, `cb${i}-${k}`));
      // A bumpier top and taller blobs give the clouds more volume, like Reference A.
      const lift = Math.sin(Math.PI * u) * cw * 0.09 + rnd(c, `cl${i}-${k}`) * cw * 0.05;
      return { x: cx + (u - 0.5) * cw, y: cy - lift, rx, ry: rx * 0.6 };
    });
    return { blobs, key: i };
  });
  const pass = (fill: string, dx: number, dy: number, s: number) =>
    clouds.map((cl) =>
      cl.blobs.map((b, k) => (
        <ellipse
          key={`${cl.key}-${k}-${fill}`}
          cx={b.x + dx * b.rx}
          cy={b.y + dy * b.ry}
          rx={b.rx * s}
          ry={b.ry * s}
          fill={fill}
        />
      )),
    );
  const blur = c.atmo ? `url(#${c.id}-cloudblur)` : undefined;
  return (
    <>
      {c.atmo && (
        <defs>
          <filter id={`${c.id}-cloudblur`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation={c.h * 0.004} />
          </filter>
        </defs>
      )}
      <g filter={blur}>
        {pass(dark, 0, 0.45, 1)}
        {pass(midTone, 0, 0, 0.95)}
        {/* The lighter edge faces the light (upper left). */}
        {pass(light, -0.18, -0.38, 0.72)}
      </g>
    </>
  );
}

function hillPath(c: Ctx, key: string, base: number, amp: number): string {
  const p1 = rnd(c, `${key}a`) * 6.28;
  const p2 = rnd(c, `${key}b`) * 6.28;
  const pts: string[] = [];
  // In an endless background, and in one that stands again to each side of its canvas, the
  // hills must meet themselves one tile along.
  const round = (2 * Math.PI) / TILE;
  const [f1, f2] = c.endless || c.world ? [2 * round, 3 * round] : [7.5, 17];
  for (let i = 0; i <= 48; i++) {
    const u = lerp(-0.5, 1.5, i / 48);
    const y = base - amp * (0.6 + 0.4 * Math.sin(u * f1 + p1) + 0.25 * Math.sin(u * f2 + p2));
    pts.push(`${u * c.w} ${y}`);
  }
  return `M ${-0.5 * c.w} ${c.h} L ${pts.join(' L ')} L ${1.5 * c.w} ${c.h} Z`;
}

function Haze({ c }: { c: Ctx }) {
  const gid = `${c.id}-haze`;
  const y = c.spec.horizon * c.h;
  return (
    <>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.roles.haze} stopOpacity={0} />
          <stop offset="1" stopColor={c.roles.haze} stopOpacity={0.45} />
        </linearGradient>
      </defs>
      <rect x={-c.w} y={y - c.h * 0.16} width={c.w * 3} height={c.h * 0.18} fill={`url(#${gid})`} />
    </>
  );
}

function Ground({ c }: { c: Ctx }) {
  const y = c.spec.horizon * c.h;
  const gid = `${c.id}-ground`;
  return (
    <>
      {c.atmo && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.roles.groundFar} />
            <stop offset="0.5" stopColor={c.roles.ground} />
          </linearGradient>
        </defs>
      )}
      <rect
        x={-c.w}
        y={y}
        width={c.w * 3}
        height={c.h - y + 2}
        fill={c.spec.ground === 'road' ? c.roles.road : c.atmo ? `url(#${gid})` : c.roles.ground}
      />
      {/* Below the canvas the ground goes on. */}
      {c.world && c.world.bottom > 0 && (
        <rect
          x={-c.w}
          y={c.h}
          width={c.w * 3}
          height={c.world.bottom}
          fill={c.spec.ground === 'road' ? c.roles.road : c.roles.ground}
        />
      )}
      {/* A street has a paler strip along its far edge, where it meets the houses. */}
      {c.spec.ground === 'road' && (
        <rect
          x={-c.w}
          y={y}
          width={c.w * 3}
          height={c.h * 0.014}
          fill={mix(c.roles.road, c.roles.skyBottom, 0.4)}
        />
      )}
    </>
  );
}

/** The back wall of a room, and the band where it meets the floor. */
function Wall({ c }: { c: Ctx }) {
  const gid = `${c.id}-wall`;
  const floor = c.spec.horizon * c.h;
  return (
    <>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.atmo ? shade(c.roles.wall, 0.3) : c.roles.wall} />
          <stop offset="1" stopColor={c.roles.wall} />
        </linearGradient>
      </defs>
      <rect x={-c.w} y={0} width={c.w * 3} height={floor} fill={`url(#${gid})`} />
      {/* Above the canvas the wall goes on in the tone it has at the top. */}
      {c.world && c.world.top > 0 && (
        <rect
          x={-c.w}
          y={-c.world.top}
          width={c.w * 3}
          height={c.world.top + 1}
          fill={c.atmo ? shade(c.roles.wall, 0.3) : c.roles.wall}
        />
      )}
      <rect
        x={-c.w}
        y={floor - c.h * 0.02}
        width={c.w * 3}
        height={c.h * 0.02}
        fill={c.roles.trim}
      />
    </>
  );
}

/** Windows: flat panes of light with a plain frame, and the light they throw into the room. */
function Windows({ c, room }: { c: Ctx; room: Interior }) {
  const [lo, hi] = tokens.background.lightRayOpacity;
  const floor = c.spec.horizon * c.h;
  return (
    <>
      {room.windows.map((win, i) => {
        const x = win.x * c.w;
        const y = win.y * c.h;
        const w = win.w * c.w;
        const h = win.h * c.h;
        const bar = Math.max(c.h * 0.006, w * 0.07);
        const pane = win.arched
          ? `M ${x - w / 2} ${y + h} L ${x - w / 2} ${y + w / 2} A ${w / 2} ${w / 2} 0 0 1 ${x + w / 2} ${y + w / 2} L ${x + w / 2} ${y + h} Z`
          : `M ${x - w / 2} ${y} L ${x + w / 2} ${y} L ${x + w / 2} ${y + h} L ${x - w / 2} ${y + h} Z`;
        const pulse = 0.5 + 0.5 * Math.sin((2 * Math.PI * c.t) / 7 + i * 1.3);
        return (
          <g key={i}>
            {/* The light falls across the wall and onto the floor, away from the window. */}
            <path
              d={`M ${x - w / 2} ${y + h} L ${x + w / 2} ${y + h} L ${x + w * 1.5} ${floor + c.h * 0.16} L ${x - w * 0.2} ${floor + c.h * 0.16} Z`}
              fill={c.roles.light}
              opacity={lo + (hi - lo) * (c.atmo ? pulse : 0.5)}
            />
            <path d={pane} fill={c.roles.light} />
            <rect x={x - bar / 2} y={y} width={bar} height={h} fill={c.roles.trim} />
            <rect x={x - w / 2} y={y + h * 0.48} width={w} height={bar} fill={c.roles.trim} />
            <rect
              x={x - w / 2 - bar}
              y={y + h}
              width={w + 2 * bar}
              height={bar * 1.6}
              fill={c.roles.trim}
            />
          </g>
        );
      })}
    </>
  );
}

/** Columns along the back wall of a hall, with banners hanging between them. */
function Hall({ c, room }: { c: Ctx; room: Interior }) {
  const floor = c.spec.horizon * c.h;
  const stone = mix(c.roles.wall, c.roles.ground, 0.45);
  const lit = mix(c.roles.wall, c.roles.light, 0.3);
  const cloth = mix(c.roles.wall, c.roles.moon, 0.45);
  const columns = Array.from({ length: room.columns }, (_, i) => ((i + 0.5) / room.columns) * c.w);
  const cw = c.h * 0.034;
  const gaps = columns.slice(0, -1).map((x, i) => (x + (columns[i + 1] ?? x)) / 2);
  // Columns run on up past the top of the canvas.
  const up = c.world?.top ?? 0;
  return (
    <>
      {gaps.slice(0, room.banners).map((x, i) => {
        const bw = c.h * 0.05;
        const top = c.h * 0.06;
        const drop = c.h * (0.2 + 0.03 * (i % 2));
        return (
          <g key={`banner-${i}`}>
            <path
              d={`M ${x - bw / 2} ${top} L ${x + bw / 2} ${top} L ${x + bw / 2} ${top + drop} L ${x} ${top + drop - bw * 0.45} L ${x - bw / 2} ${top + drop} Z`}
              fill={cloth}
            />
            <rect
              x={x - bw * 0.12}
              y={top}
              width={bw * 0.24}
              height={drop - bw * 0.45}
              fill={mix(c.roles.wall, c.roles.moon, 0.2)}
            />
          </g>
        );
      })}
      {columns.map((x, i) => (
        <g key={`column-${i}`}>
          <rect x={x - cw / 2} y={-up} width={cw} height={floor + up} fill={stone} />
          <rect x={x - cw / 2} y={-up} width={cw * 0.28} height={floor + up} fill={lit} />
          <rect
            x={x - cw * 0.8}
            y={floor - c.h * 0.03}
            width={cw * 1.6}
            height={c.h * 0.03}
            fill={stone}
          />
          <rect x={x - cw * 0.8} y={c.h * 0.03} width={cw * 1.6} height={c.h * 0.02} fill={stone} />
        </g>
      ))}
    </>
  );
}

/** A shelf on the wall with a jar, a pot and a stack of books: a home. */
function Shelf({ c }: { c: Ctx }) {
  const y = c.spec.horizon * c.h * 0.5;
  const x = c.w * 0.1;
  const w = c.w * 0.3;
  const u = c.h * 0.01;
  const dark = mix(c.roles.wall, c.roles.ground, 0.7);
  const mid = mix(c.roles.wall, c.roles.ground, 0.4);
  return (
    <g>
      <rect x={x} y={y} width={w} height={u * 1.2} fill={c.roles.trim} />
      <rect x={x + w * 0.1} y={y + u * 1.2} width={u * 0.8} height={u * 2.4} fill={c.roles.trim} />
      <rect x={x + w * 0.86} y={y + u * 1.2} width={u * 0.8} height={u * 2.4} fill={c.roles.trim} />
      {/* A jar with a lid. */}
      <rect x={x + w * 0.1} y={y - u * 5} width={u * 3.4} height={u * 5} rx={u * 0.8} fill={mid} />
      <rect x={x + w * 0.1 + u * 0.5} y={y - u * 5.8} width={u * 2.4} height={u} fill={dark} />
      {/* A round pot. */}
      <ellipse cx={x + w * 0.5} cy={y - u * 2.2} rx={u * 2.6} ry={u * 2.2} fill={dark} />
      {/* Three books leaning together. */}
      {[0, 1, 2].map((k) => (
        <rect
          key={k}
          x={x + w * 0.72 + k * u * 1.5}
          y={y - u * (4.4 + (k % 2))}
          width={u * 1.3}
          height={u * (4.4 + (k % 2))}
          fill={k === 1 ? dark : mid}
        />
      ))}
    </g>
  );
}

/** The soft darkening toward the corners that every room gets (Style 5.3). */
function Vignette({ c }: { c: Ctx }) {
  const gid = `${c.id}-vignette`;
  return (
    <>
      <defs>
        <radialGradient id={gid} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.45" stopColor={ink} stopOpacity={0} />
          <stop offset="1" stopColor={ink} stopOpacity={c.atmo ? 0.5 : 0.3} />
        </radialGradient>
      </defs>
      <rect
        x={-(c.world?.left ?? 0)}
        y={-(c.world?.top ?? 0)}
        width={c.w + (c.world?.left ?? 0) + (c.world?.right ?? 0)}
        height={c.h + (c.world?.top ?? 0) + (c.world?.bottom ?? 0)}
        fill={`url(#${gid})`}
      />
    </>
  );
}

function Tufts({ c }: { c: Ctx }) {
  const y0 = c.spec.horizon * c.h;
  if (c.spec.ground !== 'grass') return null;
  return (
    <>
      {Array.from({ length: c.spec.tufts }, (_, i) => {
        const x = lerp(-0.1, 1.1, rnd(c, `tx${i}`)) * c.w;
        const y = y0 + c.h * 0.004 + c.h * 0.08 * rnd(c, `ty${i}`) ** 2;
        const s = c.h * (0.014 + 0.012 * rnd(c, `ts${i}`));
        const sway = 4 * Math.sin(c.t * 1.4 + rnd(c, `tp${i}`) * 6.28);
        const d = `M ${-s} 0 L ${-s * 0.6} ${-s * 0.9} L ${-s * 0.25} 0 L 0 ${-s * 1.3} L ${s * 0.3} 0 L ${s * 0.65} ${-s} L ${s} 0 Z`;
        return (
          <path
            key={i}
            d={d}
            transform={`translate(${x} ${y}) rotate(${sway})`}
            fill={c.atmo ? c.roles.tuft : c.roles.near}
          />
        );
      })}
    </>
  );
}

/** White curling detail lines on a black silhouette, like the bush in Reference B. */
const Curl = ({ x, y, r, w }: { x: number; y: number; r: number; w: number }) => (
  <path
    d={`M ${x - r} ${y + r * 0.2} Q ${x - r} ${y - r} ${x} ${y - r} Q ${x + r * 0.9} ${y - r} ${x + r * 0.7} ${y - r * 0.1} Q ${x + r * 0.45} ${y + r * 0.35} ${x + r * 0.05} ${y}`}
    fill="none"
    stroke={white}
    strokeWidth={w}
    strokeLinecap={tokens.line.cap}
  />
);

function SilhouetteShape({ c, s, i }: { c: Ctx; s: Silhouette; i: number }) {
  const base = c.spec.horizon * c.h + (s.layer === 'mid' ? 0 : c.h * 0.03);
  // A foreground shape frames the picture from its edge. In a world wider than the picture it
  // keeps to the far sides of that world, clear of where people stand.
  const spread =
    s.layer !== 'mid' && c.world && !c.endless ? 1 + (c.world.left + c.world.right) / c.w : 1;
  const x = c.w / 2 + (s.x - 0.5) * c.w * spread;
  const size = s.size * c.h;
  const fill = s.layer === 'mid' ? c.roles.mid : c.roles.near;
  const detailW = c.h * 0.0035;
  const near = s.layer !== 'mid';
  switch (s.kind) {
    case 'bush': {
      const blobs = [
        [0, -0.62, 0.36],
        [-0.38, -0.4, 0.34],
        [0.38, -0.42, 0.33],
        [-0.55, -0.05, 0.36],
        [0.55, -0.08, 0.35],
        [0, -0.15, 0.45],
        [-0.15, -0.85, 0.24],
      ] as const;
      return (
        <g>
          {blobs.map(([bx, by, br], k) => (
            <circle key={k} cx={x + bx * size} cy={base + by * size} r={br * size} fill={fill} />
          ))}
          {near &&
            [
              [-0.3, -0.45],
              [0.15, -0.7],
              [0.3, -0.2],
              [-0.45, 0.0],
            ].map(([cx = 0, cy = 0], k) => (
              <Curl key={k} x={x + cx * size} y={base + cy * size} r={size * 0.09} w={detailW} />
            ))}
        </g>
      );
    }
    case 'tree':
      return (
        <g>
          <rect
            x={x - size * 0.06}
            y={base - size * 0.7}
            width={size * 0.12}
            height={size * 0.75}
            fill={fill}
          />
          {[
            [0, -1.05, 0.36],
            [-0.3, -0.8, 0.3],
            [0.3, -0.82, 0.3],
            [0, -0.75, 0.32],
          ].map(([bx = 0, by = 0, br = 0], k) => (
            <circle key={k} cx={x + bx * size} cy={base + by * size} r={br * size} fill={fill} />
          ))}
          {near && <Curl x={x - size * 0.1} y={base - size * 0.95} r={size * 0.08} w={detailW} />}
        </g>
      );
    case 'rock':
      return (
        <path
          // A mound with sloping sides that runs off the bottom of the frame.
          d={`M ${x - size * 1.7} ${c.h + 4} Q ${x - size * 1.2} ${base + size * 0.2} ${x - size * 0.8} ${base - size * 0.45} Q ${x - size * 0.4} ${base - size * 0.85} ${x + size * 0.1} ${base - size * 0.8} Q ${x + size * 0.8} ${base - size * 0.7} ${x + size * 1.1} ${base - size * 0.1} Q ${x + size * 1.4} ${base + size * 0.5} ${x + size * 1.8} ${c.h + 4} Z`}
          fill={fill}
        />
      );
    case 'house': {
      const night = NIGHT_PALETTES.includes(c.spec.palette);
      const w = size * 0.95;
      const wallH = size * 0.56;
      const roof = near ? fill : mix(fill, ink, 0.2);
      // Windows glow at night and catch the sky by day.
      const glass = night ? c.roles.moon : mix(fill, c.roles.skyBottom, 0.55);
      const pane = size * 0.13;
      return (
        <g>
          <rect
            x={x + w * 0.2}
            y={base - size * 0.98}
            width={size * 0.1}
            height={size * 0.3}
            fill={roof}
          />
          <rect x={x - w / 2} y={base - wallH} width={w} height={wallH + 2} fill={fill} />
          <path
            d={`M ${x - w * 0.6} ${base - wallH} L ${x} ${base - size} L ${x + w * 0.6} ${base - wallH} Z`}
            fill={roof}
          />
          <rect
            x={x - w * 0.34}
            y={base - wallH * 0.74}
            width={pane}
            height={pane}
            fill={glass}
            opacity={night ? 0.9 : 1}
          />
          <rect
            x={x + w * 0.34 - pane}
            y={base - wallH * 0.74}
            width={pane}
            height={pane}
            fill={glass}
            opacity={night ? 0.9 : 1}
          />
          <rect
            x={x - size * 0.07}
            y={base - wallH * 0.52}
            width={size * 0.14}
            height={wallH * 0.52 + 2}
            fill={mix(fill, ink, near ? 0 : 0.35)}
          />
          {near && <Curl x={x} y={base - size * 0.72} r={size * 0.06} w={detailW} />}
        </g>
      );
    }
    case 'castle': {
      const night = NIGHT_PALETTES.includes(c.spec.palette);
      const dark = mix(fill, ink, near ? 0 : 0.35);
      const glow = night ? c.roles.moon : mix(fill, c.roles.skyBottom, 0.55);
      // A row of battlements along the top of a wall or tower.
      const battlements = (cx: number, top: number, width: number, count: number) => {
        const step = width / (count * 2 - 1);
        return Array.from({ length: count }, (_, k) => (
          <rect
            key={`${cx}-${k}`}
            x={cx - width / 2 + k * 2 * step}
            y={top - step * 0.9}
            width={step}
            height={step * 0.9 + 1}
            fill={fill}
          />
        ));
      };
      const keepW = size * 0.62;
      const keepH = size * 0.56;
      const towerW = size * 0.22;
      const towerH = size * 0.92;
      return (
        <g>
          {[-1, 1].map((side) => {
            const tx = x + side * size * 0.42;
            return (
              <g key={side}>
                <rect
                  x={tx - towerW / 2}
                  y={base - towerH}
                  width={towerW}
                  height={towerH + 2}
                  fill={fill}
                />
                {battlements(tx, base - towerH, towerW * 1.25, 3)}
                <rect
                  x={tx - size * 0.022}
                  y={base - towerH * 0.72}
                  width={size * 0.044}
                  height={size * 0.1}
                  fill={glow}
                  opacity={night ? 0.9 : 1}
                />
              </g>
            );
          })}
          <rect x={x - keepW / 2} y={base - keepH} width={keepW} height={keepH + 2} fill={fill} />
          {battlements(x, base - keepH, keepW, 5)}
          <path
            d={`M ${x - size * 0.09} ${base + 2} L ${x - size * 0.09} ${base - size * 0.16} A ${size * 0.09} ${size * 0.09} 0 0 1 ${x + size * 0.09} ${base - size * 0.16} L ${x + size * 0.09} ${base + 2} Z`}
            fill={dark}
          />
        </g>
      );
    }
    case 'pine':
      return (
        <g>
          <rect
            x={x - size * 0.035}
            y={base - size * 0.3}
            width={size * 0.07}
            height={size * 0.32}
            fill={fill}
          />
          {[
            [0.3, 0.2, 0.62],
            [0.24, 0.42, 0.82],
            [0.17, 0.62, 1],
          ].map(([half = 0, from = 0, to = 0], k) => (
            <path
              key={k}
              d={`M ${x - size * half} ${base - size * from} L ${x} ${base - size * to} L ${x + size * half} ${base - size * from} Z`}
              fill={fill}
            />
          ))}
        </g>
      );
    case 'lamp-post': {
      const night = NIGHT_PALETTES.includes(c.spec.palette);
      const pole = size * 0.035;
      const head = { x: x - size * 0.16, y: base - size * 0.94 };
      return (
        <g>
          {night && (
            <circle
              cx={head.x}
              cy={head.y + size * 0.05}
              r={size * 0.26}
              fill={c.roles.moon}
              opacity={0.2}
            />
          )}
          <rect x={x - pole / 2} y={base - size} width={pole} height={size + 2} fill={fill} />
          <rect
            x={x - pole * 1.1}
            y={base - size * 0.06}
            width={pole * 2.2}
            height={size * 0.06 + 2}
            fill={fill}
          />
          <rect
            x={head.x}
            y={base - size}
            width={size * 0.16 + pole / 2}
            height={pole}
            fill={fill}
          />
          <path
            d={`M ${head.x - size * 0.05} ${head.y + size * 0.1} L ${head.x - size * 0.035} ${head.y} L ${head.x + size * 0.035} ${head.y} L ${head.x + size * 0.05} ${head.y + size * 0.1} Z`}
            fill={night ? c.roles.moon : mix(fill, c.roles.skyBottom, 0.55)}
          />
          <rect
            x={head.x - size * 0.06}
            y={head.y - size * 0.02}
            width={size * 0.12}
            height={size * 0.025}
            fill={fill}
          />
        </g>
      );
    }
    case 'fence': {
      const posts = 9;
      const span = size * 2.4;
      const step = span / (posts - 1);
      const pw = size * 0.07;
      const ph = size * 0.6;
      return (
        <g>
          {[0.2, 0.42].map((u) => (
            <rect
              key={u}
              x={x - span / 2}
              y={base - ph * (1 - u) - size * 0.03}
              width={span}
              height={size * 0.05}
              fill={fill}
            />
          ))}
          {Array.from({ length: posts }, (_, k) => {
            const px = x - span / 2 + k * step;
            return (
              <path
                key={k}
                d={`M ${px - pw / 2} ${base + 2} L ${px - pw / 2} ${base - ph + pw * 0.6} L ${px} ${base - ph} L ${px + pw / 2} ${base - ph + pw * 0.6} L ${px + pw / 2} ${base + 2} Z`}
                fill={fill}
              />
            );
          })}
        </g>
      );
    }
    case 'buildings': {
      const blocks = Array.from({ length: 7 }, (_, k) => ({
        bx: x + (k - 3) * size * 0.32,
        bh: size * (0.5 + 0.6 * rnd(c, `b${i}-${k}`)),
        bw: size * (0.26 + 0.1 * rnd(c, `bw${i}-${k}`)),
      }));
      return (
        <g>
          {blocks.map((b, k) => (
            <rect
              key={k}
              x={b.bx - b.bw / 2}
              y={base - b.bh}
              width={b.bw}
              height={b.bh + 2}
              fill={fill}
            />
          ))}
        </g>
      );
    }
  }
}

export type BackgroundProps = {
  spec: BackgroundSpec;
  width: number;
  height: number;
  frame: number;
  fps: number;
  /** Camera pan in px; layers shift by their depth for parallax (Part 2, section 7.5). */
  cameraX?: number;
  /**
   * For a camera that travels a long way, as when it follows a runner: the hills, silhouettes
   * and grass repeat for ever instead of sliding out of the picture. The sky, the moon, the
   * clouds and the flat ground stay where they are.
   */
  endless?: boolean;
  /** How far past the canvas it has to reach, when the camera can see past it (see World). */
  world?: World | null;
};

/** A complete background as SVG elements, sized to width by height. Pure: driven by frame. */
export const Background = ({
  spec,
  width,
  height,
  frame,
  fps,
  cameraX = 0,
  endless = false,
  world = null,
}: BackgroundProps) => {
  const id = `bg${useId().replace(/[^A-Za-z0-9_-]/g, '')}`;
  const base = bgRoles(spec.palette);
  // On a street the far and middle shapes are buildings, so they take their tone from the
  // paving, not from grass.
  const roles: BgRoles =
    spec.ground === 'road'
      ? {
          ...base,
          far: mix(base.skyBottom, base.road, 0.3),
          mid: mix(base.skyBottom, base.road, 0.62),
        }
      : base;
  const c: Ctx = {
    spec,
    roles,
    w: width,
    h: height,
    t: frame / fps,
    cameraX,
    id,
    atmo: spec.treatment === 'atmospheric',
    endless,
    world,
  };
  const mids = spec.silhouettes.filter((s) => s.layer === 'mid');
  const nears = spec.silhouettes.filter((s) => s.layer !== 'mid');
  const room = spec.interior;
  if (room) {
    // A room is one flat wall and a floor, so it moves as one piece with the camera.
    return (
      <g>
        <Layer c={c} depth={0.85}>
          <Wall c={c} />
          <Windows c={c} room={room} />
          {room.shelf && <Shelf c={c} />}
          <Hall c={c} room={room} />
          <Ground c={c} />
        </Layer>
        <Layer c={c} depth={1.15}>
          {nears.map((s, i) => (
            <SilhouetteShape key={i} c={c} s={s} i={i} />
          ))}
        </Layer>
        <Vignette c={c} />
      </g>
    );
  }
  return (
    <g>
      <Layer c={c} depth={0}>
        <Sky c={c} />
      </Layer>
      <Layer c={c} depth={0.04}>
        <Stars c={c} />
        <Moon c={c} />
      </Layer>
      {spec.rays && (
        <Layer c={c} depth={0.08}>
          <Rays c={c} />
        </Layer>
      )}
      {spec.clouds > 0 && (
        <Layer c={c} depth={0.15}>
          <Clouds c={c} />
        </Layer>
      )}
      {spec.hills && (
        <>
          <Layer c={c} depth={0.25} repeats>
            <path d={hillPath(c, 'far', spec.horizon * height, height * 0.07)} fill={c.roles.far} />
          </Layer>
          <Layer c={c} depth={0.45} repeats>
            <path
              d={hillPath(c, 'mid', spec.horizon * height + height * 0.012, height * 0.035)}
              fill={c.roles.mid}
            />
          </Layer>
        </>
      )}
      <Layer c={c} depth={0.5} repeats>
        {mids.map((s, i) => (
          <SilhouetteShape key={i} c={c} s={s} i={i} />
        ))}
      </Layer>
      {c.atmo && <Haze c={c} />}
      <Layer c={c} depth={0.85}>
        <Ground c={c} />
      </Layer>
      <Layer c={c} depth={0.85} repeats>
        <Tufts c={c} />
      </Layer>
      <Layer c={c} depth={1.15} repeats={endless || !world}>
        {nears.map((s, i) => (
          <SilhouetteShape key={i} c={c} s={s} i={i + mids.length} />
        ))}
      </Layer>
    </g>
  );
};
