import type { Graphic } from '@studio/shared';
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { VIEWER_FONT } from '../overlays/text';
import { Icon } from './ThumbParts';
import { JourneyPicture } from './Journey';
import { WaterPicture } from './WaterWorld';
import { SunsetPicture } from './SunsetWorld';
import { BodyPicture } from './BodyWorld';
import { DivePicture } from './DiveWorld';

/**
 * The explainer graphics of What's the Catch?, in its own style (styles/fine-print/guide.md, look 4
 * of the look test, picked by Biku on 2026-10-15). Every piece arrives one at a time, at the
 * frame given for it in `times` (the shot's own frames, worked out from the words that name it),
 * so the explanation builds up step by step as the narrator speaks: boxes pop in, arrows draw
 * themselves and coins flow down them, bars grow while their numbers count up, a receipt prints,
 * a price tag drops and swings.
 *
 * Drawn on a page of 1080 by 1920 (the tall picture), fitted to any frame.
 *
 * The page is never left empty while the narrator talks (Biku, 2026-10-16: "in between videos
 * there are multiple frames where there is no information or little information shown. doesnt
 * look good"): what is still to come stands from the first frame as a pale outline of itself,
 * and fills in with colour on its word (`Ghost`); the first piece arrives as the shot begins
 * (`stepFrames`); a big number can carry a picture of what it counts.
 */

const C = fineTokens.colors;
const LINE = fineTokens.line;
const M = fineTokens.motion;
const PAGE = fineTokens.design;
const font = `${VIEWER_FONT}, Arial, sans-serif`;
/**
 * Where a graphic's body is drawn: its top (470 on the page it is laid out on) is moved up to
 * `BODY_AT` and it is drawn at `BODY_SCALE`, as large as it can be and still end above the
 * captions (two lines of caption reach up to about 1250 of the 1920).
 */
const BODY_TOP = 470;
const BODY_AT = 420;
const BODY_SCALE = 0.88;
/**
 * The page colours (2026-10-16, "very immersive and attractive"): every picture on a bold field
 * of its own, never the colour of the one before, chosen so the picture's own things stay clear
 * on it (a yellow tag is never on the sun page, a red number never on coral).
 */
const PAGES = fineTokens.pages;
export type PageName = keyof typeof PAGES;
function pageChoices(g: Graphic): PageName[] {
  switch (g.kind) {
    case 'scene':
      return g.name === 'cinema-auditorium' ? ['coral', 'sun', 'sky'] : ['sun', 'sky', 'cream'];
    case 'number':
      return g.picture === 'ticket'
        ? ['sun', 'mint', 'sky']
        : g.picture === 'coin'
          ? ['mint', 'sky', 'cream']
          : g.picture === 'bucket'
            ? ['mint', 'sky', 'sun']
            : ['sun', 'mint', 'sky'];
    case 'queue':
      return ['sky', 'cream', 'mint'];
    case 'tag':
      return ['mint', 'coral', 'sky'];
    case 'flow':
      return ['cream', 'sky', 'coral'];
    case 'split':
      return ['sky', 'cream', 'coral'];
    case 'bars':
      return ['sun', 'sky', 'cream'];
    case 'receipt':
      return ['coral', 'mint', 'sky'];
    case 'journey':
      return ['sky', 'cream', 'mint'];
  }
}
/** The colour of a page, for what is drawn around a picture (a match fills the frame with it). */
export const pageColour = (name: PageName): string => PAGES[name];
/** The page of every shot in turn: its first choice not used by either of the two before it. */
export function pagesFor(graphics: readonly (Graphic | undefined)[]): PageName[] {
  const out: PageName[] = [];
  for (const g of graphics) {
    const recent = out.slice(-2);
    const choices: PageName[] = g ? pageChoices(g) : ['cream'];
    out.push(choices.find((c) => !recent.includes(c)) ?? choices[0] ?? 'cream');
  }
  return out;
}
/** The camera never stops: how far it pushes in over a shot, and the kick as each piece lands. */
const PUSH = 0.06;
const KICK = 0.03;
/** The ground of a scene: its page's own colour, a little deeper, not a beige of its own. */
const Floor = createContext<string>(C.floor);
const deeper = (hex: string, k = 0.16) => {
  const ch = (i: number) => parseInt(hex.slice(i, i + 2), 16);
  const ink = [1, 3, 5].map((i) => parseInt(LINE.color.slice(i, i + 2), 16));
  return `#${[1, 3, 5]
    .map((i, n) =>
      Math.round(ch(i) * (1 - k) + (ink[n] ?? 0) * k)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
};
/** Far enough past the page's edges that a floor or a counter, drawn smaller, still reaches them. */
const EDGE = 2400;
/** How strong the pale outline of what is still to come is, and how far the page creeps closer. */
const GHOST_OPACITY = 0.14;

/**
 * True while the graphic is drawn as its own pale outline: the finished picture, flat in one
 * colour, with no words or numbers in it (they would give away what the narrator is about to say).
 */
const Ghosting = createContext(false);
/** A colour as three shares of full, for the filter that flattens the pale outline. */
const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/**
 * The look of a video's graphics: the flat bold pages of the first videos, or the small 2.5D
 * world in deep ocean colours Biku picked on 2026-10-16 (look 3 of the motion-graphics test,
 * "3 may be", palette 4, "last one looks good"). In the world the page is a lit space (a sky
 * fading top to bottom, a glow, specks of light drifting up) over a floor seen at an angle, so
 * words and lines drawn on it are light, and bars rise as blocks.
 */
const OCEAN = fineTokens.isoPalettes.ocean;
type Theme = {
  world: boolean;
  /** Words and lines drawn straight on the page. */
  ink: string;
  /** The box behind a title's stressed line, and its words. */
  box: string;
  boxText: string;
  /** The colour of the pale outline of what is still to come. */
  ghost: string;
  /** The boxes of a flow, top to bottom. */
  nodes: string[];
};
const FLAT_THEME: Theme = {
  world: false,
  ink: C.dark,
  box: C.dark,
  boxText: C.light,
  ghost: LINE.color,
  nodes: [C.teal, C.red, C.dark, C.yellow],
};
const WORLD_THEME: Theme = {
  world: true,
  ink: OCEAN.ink,
  box: OCEAN.sign,
  boxText: OCEAN.signText,
  ghost: OCEAN.ink,
  nodes: [C.teal, OCEAN.machine, OCEAN.counter, C.yellow],
};
const ThemeOf = createContext<Theme>(FLAT_THEME);
export type ExplainerLook = 'flat' | 'world';
/** The colour a picture's page fills the frame with, for the moves between pictures. */
export const lookColour = (look: ExplainerLook, page: PageName): string =>
  look === 'world' ? OCEAN.skyTop : PAGES[page];

// ---- the 2.5D world: a point of it on the page, seen from the front at an angle
type Pt = readonly [number, number];
/** Where the world's floor is centred on the page (in the body's own units). */
const WORLD_Y = 1210;
const iso = (x: number, y: number, z: number, cx = 540, cy = WORLD_Y): Pt => [
  cx + (x - y) * 0.866,
  cy + (x + y) * 0.5 - z,
];
const poly = (pts: Pt[]) => `M ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
/** Two colours mixed, `t` of the way from `a` to `b`. */
function mixHex(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(ch(a, i) * (1 - t) + ch(b, i) * t)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/** A block of the world: its top lit, its left face in its colour, its right face in shade. */
function IsoBlock({
  x0,
  x1,
  y0,
  y1,
  z0,
  z1,
  fill,
}: {
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
      <path
        d={poly([iso(x0, y1, z1), iso(x1, y1, z1), iso(x1, y1, z0), iso(x0, y1, z0)])}
        fill={fill}
      />
      <path
        d={poly([iso(x1, y0, z1), iso(x1, y1, z1), iso(x1, y1, z0), iso(x1, y0, z0)])}
        fill={mixHex(fill, C.dark, 0.28)}
      />
      <path
        d={poly([iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)])}
        fill={mixHex(fill, C.light, 0.3)}
      />
    </g>
  );
}

/** The floor of the world under every picture: a wide slab seen at an angle. */
function WorldFloor() {
  const s = 560;
  return (
    <>
      <path
        d={poly([iso(-s, -s, 0), iso(s, -s, 0), iso(s, s, 0), iso(-s, s, 0)])}
        fill={mixHex(OCEAN.floor, C.dark, 0.06)}
      />
      <path
        d={poly([iso(-s, s, 0), iso(s, s, 0), iso(s, s, -46), iso(-s, s, -46)])}
        fill={mixHex(OCEAN.floor, C.dark, 0.3)}
      />
      <path
        d={poly([iso(s, -s, 0), iso(s, s, 0), iso(s, s, -46), iso(s, -s, -46)])}
        fill={mixHex(OCEAN.floor, C.dark, 0.42)}
      />
    </>
  );
}

/** The space round the world: a sky fading top to bottom, a glow behind the middle, specks of light. */
function WorldSpace({ width, height, local }: { width: number; height: number; local: number }) {
  return (
    <>
      <defs>
        <linearGradient id="fp-world-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={OCEAN.skyTop} />
          <stop offset="1" stopColor={OCEAN.skyBottom} />
        </linearGradient>
        <radialGradient id="fp-world-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={OCEAN.glow} stopOpacity={OCEAN.glowOpacity} />
          <stop offset="1" stopColor={OCEAN.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill="url(#fp-world-sky)" />
      <rect width={width} height={height} fill="url(#fp-world-glow)" />
      {Array.from({ length: 16 }, (_, i) => {
        const x = ((i * 337) % 1080) * (width / 1080);
        const y = height - ((i * 211 + local * (1.2 + (i % 3) * 0.5)) % (height + 100));
        return (
          <circle
            key={i}
            cx={x + 20 * Math.sin(local / 30 + i)}
            cy={y}
            r={(3 + (i % 4) * 2) * (height / 1920)}
            fill={OCEAN.specks}
            opacity={OCEAN.specksOpacity * (0.4 + (0.6 * ((i * 7) % 5)) / 4)}
          />
        );
      })}
    </>
  );
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const outCubic = (x: number) => 1 - (1 - x) ** 3;
const outBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
const progress = (local: number, start: number, frames: number) => clamp((local - start) / frames);

/** A line round things and people; none on charts. */
const outlined = { stroke: LINE.color, strokeWidth: LINE.width, strokeLinejoin: 'round' as const };

const box = (x: number, y: number, w: number, h: number, r = 0) =>
  r > 0
    ? `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
    : `M ${x} ${y} H ${x + w} V ${y + h} H ${x} Z`;
const ring = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

function Words({
  x,
  y,
  size,
  fill,
  anchor = 'middle',
  weight = 700,
  opacity = 1,
  children,
}: {
  x: number;
  y: number;
  size: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  children: ReactNode;
}) {
  const theme = useContext(ThemeOf);
  if (useContext(Ghosting)) return null;
  return (
    <text
      x={x}
      y={y}
      fontFamily={font}
      fontSize={size}
      fontWeight={weight}
      fill={fill ?? theme.ink}
      textAnchor={anchor}
      opacity={opacity}
    >
      {children}
    </text>
  );
}

/** A size for words that fit in `width`: about 0.6 of a size per letter. */
const fit = (text: string, width: number, most: number) =>
  Math.min(most, width / (0.6 * Math.max(1, text.length)));

/** Pops in about (cx, cy): from small and clear to full, a little past and back. */
function Pop({ p, cx, cy, children }: { p: number; cx: number; cy: number; children: ReactNode }) {
  if (p <= 0) return null;
  const s = 0.55 + 0.45 * outBack(p);
  return (
    <g
      opacity={clamp(p * 2.2)}
      transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}
    >
      {children}
    </g>
  );
}

/**
 * The title, big and bold inside the picture: the stressed line light on a dark box, tipped a
 * little, as on the channel's thumbnails; any other line in the dark ink.
 */
/**
 * When each word of a title lands, in the shot's frames: the frame the narrator says it, found
 * among the shot's spoken words in order; a word that is not said lands a few frames after the
 * one before (the first at once). Motion graphics (2026-10-16): the words move with the voice.
 */
function titleWordFrames(
  title: NonNullable<Graphic['title']>,
  spoken: readonly { word: string; frame: number }[],
): number[][] {
  const bare = (w: string) => w.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (title.now) {
    let n = 0;
    return title.lines.map((line) => line.split(' ').map(() => 2 + 5 * n++));
  }
  let from = 0;
  let last = -3;
  return title.lines.map((line) =>
    line.split(' ').map((word) => {
      const want = bare(word);
      const hit = want
        ? spoken.findIndex((s, k) => k >= from && (s.word === want || s.word.startsWith(want)))
        : -1;
      const frame = hit >= 0 ? Math.max(0, spoken[hit]?.frame ?? 0) : last + 3;
      if (hit >= 0) from = hit + 1;
      last = Math.max(last, frame);
      return Math.max(0, frame);
    }),
  );
}

/**
 * The title, big and bold inside the picture: the stressed line light on a dark box, tipped a
 * little, as on the thumbnails; any other line in the dark ink. Each word rises into place as
 * it is said, and the box wipes in from the left under the first word of its line.
 */
function Title({
  title,
  local,
  spoken,
}: {
  title: NonNullable<Graphic['title']>;
  local: number;
  spoken: readonly { word: string; frame: number }[];
}) {
  const theme = useContext(ThemeOf);
  const sizes = title.lines.length === 1 ? [140] : [104, 140];
  const ys = title.lines.length === 1 ? [260] : [175, 335];
  const at = titleWordFrames(title, spoken);
  return (
    <>
      {title.lines.map((line, i) => {
        const y = ys[i] ?? 260;
        const size = fit(line, 900, sizes[i] ?? 110);
        const boxed = title.stress === i;
        const w = size * 0.6 * line.length + 70;
        const frames = at[i] ?? [];
        // The box grows with its words: as far as the words already said reach.
        const parts = line.split(' ');
        const total = line.length;
        const wipe = parts.reduce((sum, word, k) => {
          const share = (word.length + (k > 0 ? 1 : 0)) / total;
          return sum + share * outCubic(progress(local, (frames[k] ?? 0) - 1, M.popFrames));
        }, 0);
        // Each word fades in and rises; the offsets are written as the change from the word
        // before, as a tspan's dy carries on to the words after it.
        const rise = frames.map(
          (f) => (1 - outBack(progress(local, f, M.popFrames))) * size * 0.45,
        );
        const shown = frames.map((f) => clamp(progress(local, f, M.popFrames) * 2.2));
        if (shown.every((s) => s <= 0)) return null;
        return (
          <g key={i} transform={boxed ? `rotate(-2 540 ${y})` : undefined}>
            {boxed && wipe > 0 && (
              <path
                d={box(
                  540 - w / 2,
                  y - size * 0.92,
                  // Its padding, the words said so far, and half a letter to spare.
                  Math.min(w, 35 + wipe * (w - 70) + (wipe > 0 ? 35 + size * 0.3 : 0)),
                  size * 1.18,
                  18,
                )}
                fill={theme.box}
              />
            )}
            <Words x={540} y={y} size={size} fill={boxed ? theme.boxText : theme.ink}>
              {line.split(' ').map((word, k) => (
                <tspan
                  key={k}
                  dy={(rise[k] ?? 0) - (k > 0 ? (rise[k - 1] ?? 0) : 0)}
                  opacity={shown[k] ?? 1}
                >
                  {k > 0 ? ` ${word}` : word}
                </tspan>
              ))}
            </Words>
          </g>
        );
      })}
    </>
  );
}

const lines = (text: string) => text.split(' / ');

/**
 * Steam rising off something hot (fresh popcorn): three soft wisps that rise, sway and fade, one
 * after another, so a held picture is never quite still (2026-10-16).
 */
function Steam({ x, y, local, size = 1 }: { x: number; y: number; local: number; size?: number }) {
  if (useContext(Ghosting)) return null;
  return (
    <g opacity={0.45}>
      {[0, 1, 2].map((i) => {
        const k = ((local + i * 22) % 66) / 66;
        const sx = x + (i - 1) * 38 * size;
        const top = y - 150 * size * k;
        const sway = 14 * size * Math.sin(local / 9 + i * 2);
        return (
          <path
            key={i}
            d={`M ${sx} ${top + 70 * size} Q ${sx + sway} ${top + 35 * size} ${sx} ${top} T ${sx} ${top - 50 * size}`}
            fill="none"
            stroke={C.mid}
            strokeWidth={9 * size}
            strokeLinecap="round"
            opacity={Math.sin(Math.PI * k)}
          />
        );
      })}
    </g>
  );
}

// ------------------------------------------------------------------ the kinds

type Kind<K extends Graphic['kind']> = {
  g: Extract<Graphic, { kind: K }>;
  local: number;
  times: number[];
};

/** A coin with a dollar sign: what money is, wherever it moves. */
function Coin({
  x,
  y,
  r = 34,
  opacity = 1,
}: {
  x: number;
  y: number;
  r?: number;
  opacity?: number;
}) {
  const ghost = useContext(Ghosting);
  // The small coins that run along an arrow have no outline of their own; a big one does.
  if (ghost && r < 100) return null;
  return (
    <g opacity={opacity}>
      <path d={ring(x, y, r)} fill={C.yellow} {...outlined} />
      <Words x={x} y={y + r * 0.42} size={r * 1.2} fill={C.dark}>
        $
      </Words>
    </g>
  );
}

function Flow({ g, local, times }: Kind<'flow'>) {
  const n = g.nodes.length;
  const boxH = n > 3 ? 140 : 160;
  const top = 500;
  const last = n > 3 ? 1220 : 1180;
  const gap = (last - top) / Math.max(1, n - 1);
  const theme = useContext(ThemeOf);
  const fills = theme.nodes;
  const at = (i: number) => top + i * gap;
  return (
    <>
      {g.nodes.slice(0, -1).map((_, i) => {
        const start = times[i * 2 + 1] ?? 0;
        const p = progress(local, start, M.drawFrames);
        if (p <= 0) return null;
        const link = g.links[i];
        const y1 = at(i) + boxH + 6;
        const y2 = at(i + 1) - 10;
        const end = y1 + (y2 - 34 - y1) * outCubic(p);
        const flowing = local - start - M.drawFrames;
        const phase = flowing >= 0 ? (flowing % M.coinFrames) / M.coinFrames : -1;
        const mid = (y1 + y2) / 2;
        return (
          <g key={i}>
            <path
              d={`M 540 ${y1} L 540 ${end}`}
              stroke={theme.ink}
              strokeWidth={10}
              strokeLinecap="round"
            />
            {p > 0.85 && (
              <path d={`M 505 ${y2 - 44} L 540 ${y2 - 4} L 575 ${y2 - 44} Z`} fill={theme.ink} />
            )}
            {phase >= 0 && (
              <Coin
                x={540}
                y={y1 + 30 + (y2 - y1 - 80) * phase}
                opacity={Math.sin(Math.PI * phase) * 1.4}
              />
            )}
            {link?.label &&
              lines(link.label).map((l, k, all) => (
                <Words
                  key={k}
                  x={600}
                  y={mid + 20 + (k - (all.length - 1) / 2) * 64}
                  size={56}
                  anchor="start"
                  opacity={clamp(p * 1.5)}
                >
                  {l}
                </Words>
              ))}
            {link?.aside &&
              lines(link.aside).map((l, k, all) => (
                <Words
                  key={k}
                  x={480}
                  y={mid + 20 + (k - (all.length - 1) / 2) * 64}
                  size={56}
                  anchor="end"
                  fill={C.red}
                  opacity={clamp(p * 1.5)}
                >
                  {l}
                </Words>
              ))}
          </g>
        );
      })}
      {g.nodes.map((node, i) => {
        const y = at(i);
        return (
          <Pop
            key={i}
            p={progress(local, times[i * 2] ?? 0, M.popFrames)}
            cx={540}
            cy={y + boxH / 2}
          >
            <path d={box(230, y, 620, boxH, 30)} fill={fills[i % fills.length]} />
            <Words x={540} y={y + boxH / 2 + 26} size={fit(node.label, 560, 80)} fill={C.light}>
              {node.label}
            </Words>
          </Pop>
        );
      })}
    </>
  );
}

function Split({ g, local, times }: Kind<'split'>) {
  const top = 480;
  const bottom = 1330;
  const x = 120;
  const w = 380;
  const theme = useContext(ThemeOf);
  const fills = [C.red, C.yellow, C.teal, C.green, C.mid];
  let y = top;
  const parts = g.parts.map((p, i) => {
    const h = (bottom - top) * p.share;
    const part = { ...p, y, h, fill: fills[i % fills.length] as string, i };
    y += h;
    return part;
  });
  // Big shares are labelled beside their own middle; small ones in a list that keeps them apart.
  let below = 0;
  return (
    <>
      {parts.map((p) => {
        const grow = outCubic(progress(local, times[p.i] ?? 0, M.growFrames));
        if (grow <= 0) return null;
        return <path key={p.i} d={box(x, p.y, w, p.h * grow)} fill={p.fill} />;
      })}
      {parts.map((p) => {
        const shown = progress(local, (times[p.i] ?? 0) + 4, M.popFrames);
        if (shown <= 0) return null;
        const mid = p.y + p.h / 2;
        if (p.h >= 170) {
          below = Math.max(below, mid + 140);
          return (
            <Pop key={p.i} p={shown} cx={x + w + 40} cy={mid}>
              <Words x={x + w + 40} y={mid - 20} size={fit(p.label, 480, 58)} anchor="start">
                {p.label}
              </Words>
              <Words
                x={x + w + 40}
                y={mid + 100}
                size={120}
                fill={p.i === 0 ? C.red : theme.ink}
                anchor="start"
              >
                {p.value}
              </Words>
            </Pop>
          );
        }
        const ly = Math.max(mid + 18, below + 72);
        below = ly;
        return (
          <g key={p.i} opacity={clamp(shown * 1.5)}>
            <path
              d={`M ${x + w + 6} ${mid} L ${x + w + 40} ${ly - 16}`}
              stroke={theme.ink}
              strokeWidth={4}
              fill="none"
            />
            <Words x={x + w + 52} y={ly} size={58} anchor="start">
              {p.label} <tspan fill={C.teal}>{p.value}</tspan>
            </Words>
          </g>
        );
      })}
    </>
  );
}

/** A number written the way it was given, at a share of its value: "$7.65" at half is "$3.83". */
function partOf(text: string, k: number): string {
  const m = /^([^0-9]*)([\d,]*\.?\d+)(.*)$/.exec(text);
  if (!m || k >= 1) return text;
  const raw = Number((m[2] ?? '0').replace(/,/g, ''));
  const decimals = (m[2] ?? '').includes('.') ? ((m[2] ?? '').split('.')[1]?.length ?? 0) : 0;
  const v = raw * k;
  const shown = (m[2] ?? '').includes(',')
    ? Math.round(v).toLocaleString('en-US')
    : v.toFixed(decimals);
  return `${m[1] ?? ''}${shown}${m[3] ?? ''}`;
}

function Bars({ g, local, times }: Kind<'bars'>) {
  const theme = useContext(ThemeOf);
  if (theme.world) return <WorldBars g={g} local={local} times={times} />;
  const n = g.bars.length;
  const slot = 840 / n;
  const w = slot * 0.62;
  const base = 1300;
  const tallest = Math.max(...g.bars.map((b) => b.value), 1);
  return (
    <>
      <path
        d={`M 100 ${base} L 980 ${base}`}
        stroke={theme.ink}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {g.bars.map((b, i) => {
        const start = times[i] ?? 0;
        const grow = outCubic(progress(local, start, M.growFrames));
        if (grow <= 0) return null;
        const cx = 120 + slot * (i + 0.5);
        const h = (b.value / tallest) * 760 * grow;
        const text = b.text ?? String(b.value);
        return (
          <g key={i}>
            <path d={box(cx - w / 2, base - h, w, h, 12)} fill={g.stress === i ? C.red : C.teal} />
            <Words
              x={cx}
              y={base - h - 24}
              size={fit(text, slot, 64)}
              fill={g.stress === i ? C.red : theme.ink}
            >
              {partOf(text, grow)}
            </Words>
            {lines(b.label).map((l, k) => (
              <Words key={k} x={cx} y={base + 70 + k * 62} size={fit(l, slot, 60)}>
                {l}
              </Words>
            ))}
          </g>
        );
      })}
    </>
  );
}

function Tag({ g, local, times }: Kind<'tag'>) {
  const start = times[0] ?? 0;
  const drop = progress(local, start, 12);
  if (drop <= 0) return null;
  const after = Math.max(0, local - start - 12);
  const swing =
    -7 + 16 * Math.exp(-after / 14) * Math.sin(after / 3.2) + 1.3 * Math.sin(after / 17);
  const lift = (1 - outBack(drop)) * 700;
  const wasP = g.was ? progress(local, times[1] ?? start + 20, M.popFrames) : 0;
  const strike = g.was ? progress(local, (times[1] ?? start + 20) + 8, M.drawFrames) : 0;
  const theme = useContext(ThemeOf);
  return (
    <>
      <path d={`M 540 470 L 540 ${640 - lift}`} stroke={theme.ink} strokeWidth={6} />
      <g transform={`translate(0 ${-lift}) rotate(${swing} 540 640)`}>
        <path
          d="M 470 640 L 610 640 L 820 760 L 820 1220 Q 820 1250 790 1250 L 290 1250 Q 260 1250 260 1220 L 260 760 Z"
          fill={C.yellow}
          {...outlined}
        />
        <path d={ring(540, 720, 30)} fill={C.background} {...outlined} />
        <Words x={540} y={1030} size={fit(g.price, 500, 190)} fill={C.dark}>
          {g.price}
        </Words>
        {g.note && (
          <Words x={540} y={1160} size={fit(g.note, 460, 54)} weight={500} fill={C.dark}>
            {g.note}
          </Words>
        )}
      </g>
      {g.was && (
        <Pop p={wasP} cx={760} cy={1340}>
          <path d={box(610, 1270, 300, 140, 18)} fill={C.light} {...outlined} />
          <Words x={760} y={1372} size={fit(g.was, 260, 88)} fill={C.mid}>
            {g.was}
          </Words>
          <path
            d={`M 630 1390 L ${630 + 260 * strike} ${1390 - 100 * strike}`}
            stroke={C.red}
            strokeWidth={14}
            strokeLinecap="round"
          />
        </Pop>
      )}
    </>
  );
}

function Receipt({ g, local, times }: Kind<'receipt'>) {
  const rows = [...g.lines, ...(g.total ? [g.total] : [])];
  const rowH = 118;
  const top = 480;
  const printed = rows.map((_, i) => progress(local, times[i] ?? 0, 8));
  const shown = printed.reduce((a, p) => a + p, 0);
  if (shown <= 0) return null;
  const bottom = top + 130 + rowH * shown + 50;
  // The torn bottom edge, from right to left: a row of small teeth.
  const step = 700 / 13;
  const teeth = Array.from(
    { length: 13 },
    (_, i) => `L ${890 - (i + 0.5) * step} ${bottom + 22} L ${890 - (i + 1) * step} ${bottom}`,
  ).join(' ');
  return (
    <>
      <path
        d={`M 190 ${top} L 890 ${top} L 890 ${bottom} ${teeth} Z`}
        fill={C.light}
        {...outlined}
      />
      <Words x={540} y={top + 84} size={58} weight={600} fill={C.dark}>
        RECEIPT
      </Words>
      {rows.map((r, i) => {
        const p = printed[i] ?? 0;
        if (p <= 0) return null;
        const y = top + 130 + rowH * i + 72;
        const total = g.total && i === rows.length - 1;
        return (
          <g key={i} opacity={clamp(p * 1.4)}>
            {total && (
              <path
                d={`M 220 ${y - 78} L 860 ${y - 78}`}
                stroke={C.dark}
                strokeWidth={4}
                strokeDasharray="14 12"
              />
            )}
            <Words
              x={310}
              y={y}
              size={fit(r.label, 300, total ? 54 : 46)}
              anchor="start"
              weight={total ? 700 : 500}
              fill={C.dark}
            >
              {r.label}
            </Words>
            <Words x={850} y={y} size={total ? 80 : 62} anchor="end" fill={total ? C.red : C.dark}>
              {r.value}
            </Words>
          </g>
        );
      })}
    </>
  );
}

function BigNumber({ g, local, times }: Kind<'number'>) {
  const said = times[0] ?? 0;
  // A number that counts up does not wait for its word: it is there from the start of the shot
  // and climbs, landing on its value as the narrator says it, so the page is never empty.
  const early = g.countUp && said > M.popFrames;
  const start = early ? 0 : said;
  const p = progress(local, start, M.popFrames);
  const count = !g.countUp
    ? 1
    : early
      ? outCubic(progress(local, 0, said + 4))
      : outCubic(progress(local, start, M.countFrames));
  // A number with a picture of what it counts stands under it: a ticket, a coin, a bucket.
  const pic = g.picture;
  const y = pic ? 1150 : 1000;
  return (
    <Pop p={p} cx={540} cy={pic ? 850 : 900}>
      {pic === 'coin' && <Coin x={540} y={700} r={190} />}
      {pic && pic !== 'coin' && (
        <Icon
          name={pic}
          x={0.5}
          y={700 / PAGE.height}
          size={(pic === 'ticket' ? 620 : 460) / PAGE.height}
          turn={pic === 'ticket' ? -8 : 0}
          crossed={false}
          W={PAGE.width}
          H={PAGE.height}
          line={LINE.width * 1.6}
        />
      )}
      {pic === 'bucket' && <Steam x={540} y={520} local={local} />}
      {/* Once it has landed, the number breathes, just enough to be alive. */}
      <g
        transform={`translate(540 ${y}) scale(${count >= 1 ? 1 + 0.014 * Math.sin(local / 11) : 1}) translate(-540 ${-y})`}
      >
        <Words x={540} y={y} size={fit(g.value, 960, pic ? 250 : 300)} fill={C.red}>
          {partOf(g.value, count)}
        </Words>
      </g>
      {g.caption && (
        <Words x={540} y={y + 120} size={fit(g.caption, 920, 66)}>
          {g.caption}
        </Words>
      )}
    </Pop>
  );
}

/** A faceless person: a round head, a body in one colour, two legs. */
function Person({ x, ground, k, body }: { x: number; ground: number; k: number; body: string }) {
  const hip = ground - 230 * k;
  const shoulder = hip - 270 * k;
  return (
    <g>
      <path
        d={box(x - 46 * k, hip - 10, 36 * k, ground - hip + 10, 16 * k)}
        fill={C.dark}
        {...outlined}
      />
      <path
        d={box(x + 10 * k, hip - 10, 36 * k, ground - hip + 10, 16 * k)}
        fill={C.dark}
        {...outlined}
      />
      <path
        d={box(x - 66 * k, shoulder, 132 * k, hip - shoulder + 20, 50 * k)}
        fill={body}
        {...outlined}
      />
      <path d={ring(x, shoulder - 66 * k, 58 * k)} fill={C.mid} {...outlined} />
    </g>
  );
}

function Queue({ g, local, times }: Kind<'queue'>) {
  const ground = 1400;
  const start = times[0] ?? 0;
  const k = g.people > 4 ? 0.8 : 1;
  const spacing = g.people > 4 ? 120 : 170;
  const bodies = [C.red, C.teal, C.yellow, C.dark, C.green, C.mid];
  return (
    <>
      <rect
        x={-EDGE}
        y={ground}
        width={PAGE.width + 2 * EDGE}
        height={PAGE.height}
        fill={useContext(Floor)}
      />
      <path d={box(40, 560, 300, 180, 20)} fill={C.dark} {...outlined} />
      <Words x={190} y={690} size={fit(g.sign ?? '$9', 260, 110)} fill={C.yellow}>
        {g.sign ?? '$9'}
      </Words>
      <path d={box(-EDGE, 1010, 310 + EDGE, ground - 1010)} fill={C.teal} {...outlined} />
      <path d={box(-EDGE, 990, 320 + EDGE, 34)} fill={C.dark} {...outlined} />
      {Array.from({ length: g.people }, (_, i) => {
        const p = outCubic(progress(local, start + i * M.stagger, 14));
        if (p <= 0) return null;
        const x = 420 + i * spacing + (1 - p) * 500;
        // In line, each shifts their weight now and then, out of step with the others.
        const lean = p >= 1 ? 1.6 * Math.sin((local - start) / 13 + i * 1.9) : 0;
        return (
          <g key={i} transform={`rotate(${lean} ${x} ${ground})`}>
            <Person x={x} ground={ground} k={k} body={bodies[i % bodies.length] as string} />
          </g>
        );
      })}
    </>
  );
}

function CinemaCounter({ g, local, times }: Kind<'scene'>) {
  const at = (item: string) => {
    if (g.show.length === 0) return 1;
    const i = g.show.findIndex((s) => s.item === item);
    return i < 0 ? 0 : progress(local, times[i] ?? 0, M.popFrames);
  };
  const kernels = Array.from({ length: 34 }, (_, i) => ({
    x: 200 + ((i * 53) % 230),
    y: 900 - Math.floor(i / 6) * 34 - ((i * 17) % 20),
    r: 20 + ((i * 7) % 9),
    c: i % 3 === 0 ? C.light : C.yellow,
  }));
  const hand = at('hand');
  return (
    <>
      <rect
        x={-EDGE}
        y={1380}
        width={PAGE.width + 2 * EDGE}
        height={PAGE.height}
        fill={useContext(Floor)}
      />
      {!g.title && (g.show.length === 0 || g.show.some((s) => s.item === 'board') || g.sign) && (
        <Pop p={g.show.some((s) => s.item === 'board') ? at('board') : 1} cx={540} cy={360}>
          <path d={box(120, 190, 840, 340, 26)} fill={C.dark} {...outlined} />
          <Words x={540} y={300} size={fit(g.signLabel ?? 'POPCORN', 760, 74)} fill={C.light}>
            {g.signLabel ?? 'POPCORN'}
          </Words>
          <Words x={540} y={480} size={190} fill={C.yellow}>
            {g.sign ?? '$9'}
          </Words>
        </Pop>
      )}
      <Pop p={at('machine')} cx={305} cy={860}>
        <path d="M 150 600 L 460 600 L 430 560 L 180 560 Z" fill={C.red} {...outlined} />
        <path d={box(140, 600, 330, 510, 14)} fill={C.red} {...outlined} />
        <path d={box(172, 640, 266, 300, 10)} fill={C.light} {...outlined} />
        {kernels.map((k, i) => (
          <path
            key={i}
            d={ring(
              k.x,
              k.y +
                4 * Math.sin(local / 5 + i) -
                30 * Math.max(0, Math.sin(local / 7 + i * 2.3)) ** 14,
              k.r,
            )}
            fill={k.c}
          />
        ))}
        <path d={box(172, 980, 266, 60, 8)} fill={C.yellow} {...outlined} />
      </Pop>
      <Pop p={at('bucket')} cx={780} cy={1000}>
        <Steam x={780} y={790} local={local} size={0.8} />
        {/* The same bucket as everywhere else in the channel: real-looking popcorn, heaped. */}
        <Icon
          name="bucket"
          x={780 / PAGE.width}
          y={945 / PAGE.height}
          size={330 / PAGE.height}
          turn={0}
          crossed={false}
          W={PAGE.width}
          H={PAGE.height}
          line={LINE.width}
        />
      </Pop>
      <path d={box(-EDGE, 1110, PAGE.width + 2 * EDGE, 270)} fill={C.teal} {...outlined} />
      <path d={box(-EDGE, 1100, PAGE.width + 2 * EDGE, 34)} fill={C.dark} {...outlined} />
      {hand > 0 && (
        <g transform={`translate(${(1 - outCubic(hand)) * 520} 0)`}>
          <path d={box(590, 1168, 250, 124, 12)} fill={C.green} {...outlined} />
          <Words x={700} y={1250} size={62}>
            {g.note ?? '$10'}
          </Words>
          <path d={box(880, 1180, 240, 104, 14)} fill={C.dark} {...outlined} />
          <path d={box(800, 1176, 110, 112, 48)} fill={C.mid} {...outlined} />
          <path d={box(770, 1196, 74, 40, 20)} fill={C.mid} {...outlined} />
        </g>
      )}
    </>
  );
}

/**
 * A cinema auditorium with the lights down: rows of red seats facing the lit screen, and a pipe
 * from the popcorn machine through the wall, puffing the smell of popcorn over the seats (drawn
 * for "Why Does Cinema Popcorn Cost Ten Dollars?", 2026-10-15). The pipe draws itself along
 * when it arrives; the smell drifts out in puffs and keeps coming.
 */
function CinemaAuditorium({ g, local, times }: Kind<'scene'>) {
  const at = (item: string) => {
    if (g.show.length === 0) return 1;
    const i = g.show.findIndex((s) => s.item === item);
    return i < 0 ? 0 : progress(local, times[i] ?? 0, M.popFrames);
  };
  const pipeAt = (() => {
    const i = g.show.findIndex((s) => s.item === 'pipe');
    return i < 0 ? (g.show.length === 0 ? -99 : null) : (times[i] ?? 0);
  })();
  const smellAt = (() => {
    const i = g.show.findIndex((s) => s.item === 'smell');
    return i < 0 ? (g.show.length === 0 ? -99 : null) : (times[i] ?? 0);
  })();
  const pipe = pipeAt === null ? 0 : outCubic(progress(local, pipeAt, M.drawFrames + 6));
  // The pipe runs in from the wall at the left, along under the ceiling, and turns down.
  const PIPE = 'M -120 600 L 330 600 Q 380 600 380 650 L 380 760';
  const PIPE_LENGTH = 450 + 80 + 110;
  const rows = [
    { y: 1060, w: 120, gap: 140, from: -60 },
    { y: 1190, w: 136, gap: 156, from: -100 },
    { y: 1330, w: 150, gap: 172, from: -140 },
  ];
  const puffs =
    smellAt === null
      ? []
      : Array.from({ length: 6 }, (_, i) => {
          const age = local - smellAt - i * 9;
          if (age < 0) return null;
          const k = (age % 54) / 54;
          return {
            key: i,
            x: 380 + 260 * k + 30 * Math.sin(age / 7 + i),
            y: 800 + 120 * k,
            r: 30 + 40 * k,
            o: Math.sin(Math.PI * k) * 0.85,
          };
        });
  return (
    <>
      {/* The dark room. */}
      <rect x={-EDGE} y={470} width={PAGE.width + 2 * EDGE} height={PAGE.height} fill={C.dark} />
      <Pop p={at('screen')} cx={600} cy={720}>
        <path d={box(470, 560, 560, 330, 14)} fill={C.light} {...outlined} />
        {/* What the film shows: hills under a sun, flat. */}
        <path d="M 490 870 L 640 720 L 740 810 L 840 700 L 1010 870 Z" fill={C.teal} />
        <path d={ring(900, 640, 44)} fill={C.yellow} />
      </Pop>
      {pipe > 0 && (
        <path
          d={PIPE}
          fill="none"
          stroke={C.mid}
          strokeWidth={46}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${PIPE_LENGTH * pipe} ${PIPE_LENGTH}`}
        />
      )}
      {pipe >= 1 && <path d={box(340, 750, 80, 46, 10)} fill={C.mid} {...outlined} />}
      {puffs.map(
        (p) =>
          p && (
            <path key={p.key} d={ring(p.x, p.y, p.r)} fill={C.yellow} opacity={p.o * at('smell')} />
          ),
      )}
      {rows.map((row) =>
        Array.from({ length: Math.ceil((PAGE.width + 2 * -row.from) / row.gap) + 1 }, (_, i) => (
          <path
            key={`${row.y}-${i}`}
            d={box(row.from + i * row.gap, row.y, row.w, 150, 30)}
            fill={C.red}
            {...outlined}
          />
        )),
      )}
    </>
  );
}

/**
 * Bars in the world: blocks standing in a row across the floor, rising while their numbers count
 * up, each labelled on the floor in front of it; the one that matters in red.
 */
function WorldBars({ g, local, times }: Kind<'bars'>) {
  const theme = useContext(ThemeOf);
  const n = g.bars.length;
  const tallest = Math.max(...g.bars.map((b) => b.value), 1);
  const step = n > 3 ? 150 : 185;
  const foot = n > 3 ? 105 : 125;
  return (
    <>
      {g.bars.map((b, i) => {
        const grow = outBack(progress(local, times[i] ?? 0, M.growFrames));
        const shown = progress(local, times[i] ?? 0, M.popFrames);
        // Along the row a block moves right on the page without coming closer.
        const a = (i - (n - 1) / 2) * step;
        const h = Math.max(0, (b.value / tallest) * 540 * grow);
        const fill = g.stress === i ? OCEAN.machine : i % 2 ? OCEAN.counter : C.teal;
        const text = b.text ?? String(b.value);
        const [tx, ty] = iso(a, -a, h);
        const [fx, fy] = iso(a + foot / 2, -a + foot / 2, 0);
        return (
          <g key={i}>
            {shown > 0 && (
              <IsoBlock
                x0={a - foot / 2}
                x1={a + foot / 2}
                y0={-a - foot / 2}
                y1={-a + foot / 2}
                z0={0}
                z1={Math.max(1, h)}
                fill={fill}
              />
            )}
            {shown > 0 && (
              <Words
                x={tx}
                y={ty - 50}
                size={fit(text, step * 1.3, 64)}
                fill={g.stress === i ? C.yellow : theme.ink}
                opacity={clamp(shown * 1.5)}
              >
                {partOf(text, clamp(grow))}
              </Words>
            )}
            {lines(b.label).map((l, k) => (
              <Words
                key={k}
                x={fx}
                y={fy + 70 + k * 50}
                size={fit(l, step * 1.25, 46)}
                opacity={clamp(shown * 1.5)}
              >
                {l}
              </Words>
            ))}
          </g>
        );
      })}
    </>
  );
}

/** The card tablet on its stand: the screen facing us, or its back while it is turned away. */
function Tablet({
  cx,
  cy,
  foot,
  facing,
  buttons,
  custom,
  press,
}: {
  cx: number;
  cy: number;
  /** Where the stand meets the counter. */
  foot: Pt;
  /** 0 turned away, 1 facing us; it swings round between. */
  facing: number;
  /** How far in each of the three tip buttons is. */
  buttons: number[];
  /** The CUSTOM button lighting up, and being pressed. */
  custom: number;
  press: number;
}) {
  const w = 390;
  const h = 300;
  const front = facing >= 0.5;
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * facing)));
  const any = buttons.some((b) => b > 0);
  const FILLS = [OCEAN.machine, C.yellow, C.teal];
  const LABELS = ['20%', '25%', '30%'];
  return (
    <g>
      <path
        d={`M ${foot[0]} ${foot[1]} L ${cx} ${cy + h / 2}`}
        stroke={C.dark}
        strokeWidth={18}
        strokeLinecap="round"
      />
      <ellipse cx={foot[0]} cy={foot[1]} rx={46} ry={16} fill={C.dark} />
      <g transform={`translate(${cx} ${cy}) scale(${sx} 1) translate(${-cx} ${-cy})`}>
        <path d={box(cx - w / 2, cy - h / 2, w, h, 26)} fill={C.dark} {...outlined} />
        {front && (
          <>
            <path d={box(cx - w / 2 + 16, cy - h / 2 + 16, w - 32, h - 32, 14)} fill={OCEAN.ink} />
            {!any && (
              <>
                <Words x={cx} y={cy - 30} size={34} fill={C.mid}>
                  TOTAL
                </Words>
                <Words x={cx} y={cy + 50} size={86} fill={C.dark}>
                  $6.00
                </Words>
              </>
            )}
            {any && (
              <>
                <Words x={cx} y={cy - 90} size={32} fill={C.dark}>
                  ADD A TIP
                </Words>
                {LABELS.map((label, i) => {
                  const p = buttons[i] ?? 0;
                  if (p <= 0) return null;
                  const bx = cx + (i - 1) * 118;
                  return (
                    <Pop key={label} p={p} cx={bx} cy={cy - 10}>
                      <path d={box(bx - 52, cy - 52, 104, 84, 16)} fill={FILLS[i] ?? C.teal} />
                      <Words x={bx} y={cy + 4} size={40} fill={i === 1 ? C.dark : C.light}>
                        {label}
                      </Words>
                    </Pop>
                  );
                })}
                {(buttons[2] ?? 0) > 0 &&
                  (['CUSTOM', 'NO TIP'] as const).map((label, i) => {
                    const bx = cx + (i === 0 ? -82 : 82);
                    const by = cy + 78 + (i === 0 ? press * 6 : 0);
                    const lit = i === 0 ? custom : 0;
                    return (
                      <g key={label}>
                        {lit > 0 && (
                          <path
                            d={box(bx - 82, by - 30, 164, 60, 30)}
                            fill="none"
                            stroke={C.yellow}
                            strokeWidth={8 + 4 * Math.sin(lit * 9)}
                            opacity={clamp(lit * 2)}
                          />
                        )}
                        <path
                          d={box(bx - 72, by - 24, 144, 48, 24)}
                          fill={lit > 0 ? mixHex(C.mid, C.yellow, clamp(lit)) : C.mid}
                        />
                        <Words x={bx} y={by + 10} size={26} fill={C.dark}>
                          {label}
                        </Words>
                      </g>
                    );
                  })}
              </>
            )}
          </>
        )}
      </g>
    </g>
  );
}

/** A takeaway cup standing on the counter at (x, y): a cream cup, an orange sleeve, a dark lid. */
function Cup({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path
        d={`M ${x - 48} ${y - 150} L ${x + 48} ${y - 150} L ${x + 38} ${y} L ${x - 38} ${y} Z`}
        fill={C.popcorn}
        {...outlined}
      />
      <path
        d={`M ${x - 45} ${y - 108} L ${x + 45} ${y - 108} L ${x + 41} ${y - 58} L ${x - 41} ${y - 58} Z`}
        fill={OCEAN.counter}
        {...outlined}
      />
      <path d={box(x - 56, y - 172, 112, 26, 10)} fill={C.dark} {...outlined} />
    </g>
  );
}

/**
 * The coffee shop counter in the 2.5D world (drawn for "Why Every Screen Asks You for a Tip Now",
 * 2026-10-16): the counter, the faceless barista behind it, the card tablet on its stand with
 * its tip buttons, the price sign, a takeaway cup. Only the things listed arrive, each on its
 * word; `zoom` closes the camera in on the tablet, `turn` swings it round to face us, `gaze`
 * draws the barista's look at the screen, `finger` presses CUSTOM.
 */
function CoffeeCounter({ g, local, times }: Kind<'scene'>) {
  const ghost = useContext(Ghosting);
  const listed = (item: string) => g.show.length === 0 || g.show.some((s) => s.item === item);
  const when = (item: string): number | null => {
    if (g.show.length === 0) return -99;
    const i = g.show.findIndex((s) => s.item === item);
    return i < 0 ? null : (times[i] ?? 0);
  };
  const at = (item: string, frames: number = M.popFrames) => {
    const t = when(item);
    return t === null ? 0 : progress(local, t, frames);
  };
  const foot = iso(220, 40, 190);
  const scx = foot[0];
  const scy = foot[1] - 250;
  const zoomAt = when('zoom');
  const zoom = zoomAt === null ? 0 : outCubic(progress(local, zoomAt, 24));
  const Z = 1 + 1.15 * zoom;
  const into = `translate(${scx + (540 - scx) * zoom} ${scy + (840 - scy) * zoom}) scale(${Z}) translate(${-scx} ${-scy})`;
  const turnAt = when('turn');
  const facing = turnAt === null ? 1 : outCubic(progress(local, turnAt, 16));
  const buttonsAt = when('buttons');
  const buttons = [0, 1, 2].map((i) =>
    buttonsAt === null ? 0 : progress(local, buttonsAt + i * 4, M.popFrames),
  );
  const [bx, bground] = iso(-250, -130, 0);
  const k = 0.82;
  const head: Pt = [bx, bground - (230 + 270 + 66) * k];
  const gaze = at('gaze', M.drawFrames);
  const fingerT = at('finger', 14);
  const press = clamp((local - ((when('finger') ?? 9999) + 14)) / 4);
  const [cupX, cupY] = iso(-160, 20, 190);
  const customAt = Math.max(at('custom'), press);
  const end: Pt = [scx - 82, scy + 78];
  return (
    <g transform={`translate(540 1000) scale(${COUNTER_SCALE}) translate(-540 -1000)`}>
      <g transform={into}>
        {listed('sign') && (
          <Pop p={at('sign')} cx={300} cy={600}>
            <path d="M 220 470 L 220 520 M 380 470 L 380 520" stroke={OCEAN.ink} strokeWidth={5} />
            <path d={box(160, 520, 280, 190, 22)} fill={C.dark} {...outlined} />
            <Words x={300} y={580} size={40} fill={OCEAN.ink}>
              COFFEE
            </Words>
            <Words x={300} y={680} size={110} fill={C.yellow}>
              $6
            </Words>
          </Pop>
        )}
        {listed('barista') && (
          <Pop p={at('barista')} cx={bx} cy={bground - 300}>
            <Person x={bx} ground={bground} k={k} body={C.teal} />
          </Pop>
        )}
        <IsoBlock x0={-330} x1={330} y0={-75} y1={75} z0={0} z1={190} fill={OCEAN.counter} />
        {listed('cup') && (
          <Pop p={at('cup')} cx={cupX} cy={cupY - 80}>
            <Cup x={cupX} y={cupY} />
            <Steam x={cupX} y={cupY - 200} local={local} size={0.55} />
          </Pop>
        )}
        {listed('tablet') && (
          <Pop p={at('tablet')} cx={scx} cy={scy}>
            <Tablet
              cx={scx}
              cy={scy}
              foot={foot}
              facing={facing}
              buttons={ghost ? [1, 1, 1] : buttons}
              custom={customAt}
              press={press}
            />
          </Pop>
        )}
        {listed('gaze') && gaze > 0 && !ghost && (
          <path
            d={`M ${head[0] + 50} ${head[1]} L ${head[0] + 50 + (scx - 120 - head[0] - 50) * gaze} ${head[1] + (scy - head[1]) * gaze}`}
            stroke={C.yellow}
            strokeWidth={9}
            strokeDasharray="4 20"
            strokeLinecap="round"
          />
        )}
        {listed('finger') && fingerT > 0 && !ghost && (
          <g
            transform={`translate(${end[0] + (1 - outCubic(fingerT)) * 420} ${end[1] + 18 + press * 6 + (1 - outCubic(fingerT)) * 520})`}
          >
            {/* A hand from the bottom right, one finger pointing up and left at the button. */}
            <path
              d="M 0 0 Q -6 -8 4 -12 L 60 30 L 120 40 Q 150 60 140 110 L 90 170 L 20 120 L 30 60 Z"
              fill={C.mid}
              {...outlined}
            />
          </g>
        )}
      </g>
    </g>
  );
}
/** How much larger the coffee counter is drawn than the world's other things, about the counter. */
const COUNTER_SCALE = 1.3;

/**
 * One graphic at a frame of its shot. `times` is the frame each of its pieces arrives
 * (graphicSteps order); `duration` is the shot's length in frames.
 */
export function ExplainerGraphic({
  graphic,
  local,
  duration,
  times,
  width,
  height,
  page = 'cream',
  look = 'flat',
  spoken = [],
  bare = false,
  clock = local,
  fps = 30,
}: {
  graphic: Graphic;
  local: number;
  duration: number;
  times: number[];
  width: number;
  height: number;
  /** The colour of the page under it (`pagesFor`). */
  page?: PageName;
  /** Flat pages, or the 2.5D world. */
  look?: ExplainerLook;
  /** The narrator's words in this shot, each with the frame it is said: the title follows them. */
  spoken?: readonly { word: string; frame: number }[];
  /** Without its page colour and without the slow drift: for a picture laid on something else. */
  bare?: boolean;
  /** The frame within the whole part: the time of a journey's world, which runs on across shots. */
  clock?: number;
  fps?: number;
}) {
  const k = Math.min(width / PAGE.width, height / PAGE.height);
  // The camera never stops: it pushes slowly in, sways a little, and kicks in as each piece
  // after the first lands (a number as it finishes counting).
  const kickAt = [
    ...times.slice(1),
    ...(graphic.kind === 'number' && graphic.countUp ? [(times[0] ?? 0) + M.countFrames] : []),
  ];
  const kick = kickAt.reduce((sum, at) => {
    const x = local - at;
    return sum + (x < 0 ? 0 : x < 3 ? x / 3 : Math.exp(-(x - 3) / 7));
  }, 0);
  const through = clamp(local / Math.max(1, duration));
  const drift = bare ? 1 : 1 + PUSH * through + KICK * Math.min(1.5, kick);
  const sway = bare ? 0 : 12 * Math.sin(local / 38);
  const tilt = bare ? 0 : 0.45 * Math.sin(local / 53 + 1);
  const ox = (width - PAGE.width * k) / 2;
  const oy = (height - PAGE.height * k) / 2;
  const g = graphic;
  if (g.kind === 'journey') {
    const Picture =
      g.world === 'water'
        ? WaterPicture
        : g.world === 'sunset'
          ? SunsetPicture
          : g.world === 'dive'
            ? DivePicture
            : g.world === 'body'
              ? BodyPicture
              : JourneyPicture;
    // A journey has no page and no card: the camera flies through its world, and only the title
    // is laid over it.
    return (
      <g>
        <Picture
          g={g}
          local={local}
          duration={duration}
          times={times}
          clock={clock}
          fps={fps}
          width={width}
          height={height}
        />
        {g.title && (
          <g
            transform={
              width > height
                ? `translate(${(width - PAGE.width * k * 1.6) / 2} 0) scale(${k * 1.6})`
                : `translate(${ox} ${oy}) scale(${k})`
            }
          >
            <ThemeOf.Provider
              value={
                g.world === 'water' || g.world === 'dive' || g.world === 'body'
                  ? FLAT_THEME
                  : WORLD_THEME
              }
            >
              <Title title={g.title} local={local} spoken={spoken} />
            </ThemeOf.Provider>
          </g>
        )}
      </g>
    );
  }
  const bodyAt = (times: number[]) => {
    switch (g.kind) {
      case 'flow':
        return <Flow g={g} local={local} times={times} />;
      case 'split':
        return <Split g={g} local={local} times={times} />;
      case 'bars':
        return <Bars g={g} local={local} times={times} />;
      case 'tag':
        return <Tag g={g} local={local} times={times} />;
      case 'receipt':
        return <Receipt g={g} local={local} times={times} />;
      case 'number':
        return <BigNumber g={g} local={local} times={times} />;
      case 'queue':
        return <Queue g={g} local={local} times={times} />;
      case 'scene':
        return g.name === 'cinema-auditorium' ? (
          <CinemaAuditorium g={g} local={local} times={times} />
        ) : g.name === 'coffee-counter' ? (
          <CoffeeCounter g={g} local={local} times={times} />
        ) : (
          <CinemaCounter g={g} local={local} times={times} />
        );
    }
  };
  // Until every piece is in, the finished picture stands under it as a pale outline of itself.
  const last = Math.max(0, ...times);
  const ghost = !bare && local < last + M.popFrames;
  const theme = look === 'world' ? WORLD_THEME : FLAT_THEME;
  const ghostRgb = rgbOf(theme.ghost);
  return (
    <g>
      <defs>
        {/* Everything in one flat colour, the line colour, keeping only its shape. */}
        <filter id="fp-ghost" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values={`0 0 0 0 ${ghostRgb[0]} 0 0 0 0 ${ghostRgb[1]} 0 0 0 0 ${ghostRgb[2]} 0 0 0 1 0`}
          />
        </filter>
      </defs>
      {!bare && theme.world && <WorldSpace width={width} height={height} local={local} />}
      {!bare && !theme.world && (
        <>
          <defs>
            {/* A soft light in the middle of the page, so it is a space and not a sheet. */}
            <radialGradient id="fp-page-light" cx="0.5" cy="0.42" r="0.75">
              <stop offset="0" stopColor={C.light} stopOpacity={0.28} />
              <stop offset="1" stopColor={C.light} stopOpacity={0} />
            </radialGradient>
          </defs>
          <rect width={width} height={height} fill={PAGES[page]} />
          <rect width={width} height={height} fill="url(#fp-page-light)" />
        </>
      )}
      <g transform={`translate(${ox} ${oy}) scale(${k})`}>
        <g
          transform={`translate(${540 + sway} 860) rotate(${tilt}) scale(${drift}) translate(-540 -860)`}
        >
          <g
            transform={`translate(540 ${BODY_AT}) scale(${BODY_SCALE}) translate(-540 ${-BODY_TOP})`}
          >
            <ThemeOf.Provider value={theme}>
              {theme.world && !bare && <WorldFloor />}
              {ghost && (
                <g opacity={GHOST_OPACITY} filter="url(#fp-ghost)">
                  <Ghosting.Provider value>{bodyAt(times.map(() => -10_000))}</Ghosting.Provider>
                </g>
              )}
              <Floor.Provider
                value={
                  bare
                    ? C.floor
                    : theme.world
                      ? mixHex(OCEAN.floor, C.dark, 0.06)
                      : deeper(PAGES[page])
                }
              >
                {bodyAt(times)}
              </Floor.Provider>
            </ThemeOf.Provider>
          </g>
          <ThemeOf.Provider value={theme}>
            {g.title && <Title title={g.title} local={local} spoken={spoken} />}
          </ThemeOf.Provider>
        </g>
      </g>
    </g>
  );
}

/** The page colour of the style, for a picture that lays it under everything. */
export const PAGE_COLOUR = C.background;
