import { useCurrentFrame, useVideoConfig } from 'remotion';
import fineTokens from '../../../styles/fine-print/tokens.json';
import { EXPRESSIONS } from '../face/expressions';
import { BlackHoleGlow, Infall } from '../props/BlackHoleGlow';
import { VIEWER_FONT } from '../overlays/text';
import { floatAt } from '../rig/actions';
import { Character } from '../rig/Character';
import { ASTRONAUT } from '../wardrobe/costumes/astronaut';
import type { Identity } from '../wardrobe/types';

/**
 * The What's the Catch? look test (2026-10-21): one moment of "What happens if you fall into a
 * black hole?", drawn far beyond the channel's first flat worlds (a glowing disk of gas whose far
 * side is bent up over the hole by its gravity, nebulae, stars at three depths, bloom, grain), in
 * three versions for Biku to pick by eye:
 *   a  no character: a small faceless astronaut, as the channel draws people today;
 *   b  a new stick-figure mascot in the game theory drawing (the Ink Stick puppet), tumbling in;
 *   c  the same mascot blended into the world: its lines toned to the channel's navy, its
 *      colours warmed, and the disk's orange light catching its edge.
 * Biku, 2026-10-20 and 21: "the drawings are not that good for whats the catch", "an explainer
 * type channel that explains interesting topics with good drawings and animation", mixing in the
 * game theory drawings "if needed and where needed".
 */

const J = fineTokens.journey;
const NAVY = fineTokens.line.color;
const font = `${VIEWER_FONT}, Arial, sans-serif`;
export type CatchLook = 'a' | 'b' | 'c';

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const rnd = (i: number, j = 0) => {
  const x = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** A token colour as three numbers from 0 to 1, for a filter. */
const channels = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [number, number, number];
};

/** The mascot of the look test: a placeholder for a design Biku will choose. */
const MASCOT: Identity = { skinTone: 3, hair: 'short-crop', hairColor: 'dark-brown' };

/** The space round the hole: deep blue to violet, three soft nebulae drifting. */
function Space({ W, H, t, zoom }: { W: number; H: number; t: number; zoom: number }) {
  const u = W / 1080;
  const neb = (i: number, x: number, y: number, r: number, colour: string, o: number) => (
    <ellipse
      key={i}
      cx={x + 30 * u * Math.sin(t * 0.15 + i)}
      cy={y + 20 * u * Math.cos(t * 0.12 + i)}
      rx={r * zoom}
      ry={r * 0.7 * zoom}
      fill={colour}
      opacity={o}
      filter="url(#ct-soft)"
    />
  );
  return (
    <g>
      <defs>
        <radialGradient id="ct-space" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0" stopColor={J.nebula} />
          <stop offset="0.55" stopColor={J.space} />
          <stop offset="1" stopColor={J.night} />
        </radialGradient>
        <filter id="ct-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={60 * u} />
        </filter>
      </defs>
      <rect width={W} height={H} fill="url(#ct-space)" />
      {neb(1, W * 0.18, H * 0.2, 380 * u, J.nebulaMid, 0.55)}
      {neb(2, W * 0.85, H * 0.32, 320 * u, J.nebulaLight, 0.35)}
      {neb(3, W * 0.7, H * 0.86, 420 * u, J.nebulaMid, 0.45)}
      {neb(4, W * 0.1, H * 0.78, 260 * u, J.spaceGlow, 0.6)}
      {/* A far galaxy, tilted, turning slowly: something to look at below the hole. */}
      <g
        transform={`translate(${W * 0.24} ${H * 0.87}) rotate(${-25 + t * 2}) scale(1 0.45)`}
        opacity={0.7}
      >
        <circle r={120 * u} fill={J.nebulaLight} opacity={0.25} filter="url(#ct-soft)" />
        {[0, 1, 2, 3].map((k) => (
          <path
            key={k}
            d={`M 0 0 Q ${60 * u} ${-40 * u} ${110 * u} ${10 * u}`}
            fill="none"
            stroke={J.star}
            strokeWidth={6 * u}
            strokeLinecap="round"
            opacity={0.35}
            transform={`rotate(${k * 90})`}
          />
        ))}
        <circle r={18 * u} fill={J.sunCore} opacity={0.8} />
      </g>
    </g>
  );
}

/** Stars at three depths: the near ones larger, brighter and sliding faster as the camera moves in. */
function Stars({
  W,
  H,
  t,
  zoom,
  cx,
  cy,
}: {
  W: number;
  H: number;
  t: number;
  zoom: number;
  cx: number;
  cy: number;
}) {
  const u = W / 1080;
  const out = [];
  for (let layer = 0; layer < 3; layer++) {
    const n = [140, 70, 22][layer] ?? 0;
    const par = [0.3, 0.7, 1.4][layer] ?? 1;
    for (let i = 0; i < n; i++) {
      const bx = rnd(i, layer * 7) * W;
      const by = rnd(i, layer * 7 + 1) * H;
      // Outward from the hole as the camera pushes in: nearer stars slide faster.
      const k = 1 + (zoom - 1) * par;
      let x = cx + (bx - cx) * k;
      let y = cy + (by - cy) * k;
      // Light bent round the hole: stars close to it are pushed out into a ring.
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);
      const ring = 170 * u * zoom;
      if (d < ring * 2.2) {
        const push = (ring * ring) / Math.max(d, 1) / 3.2;
        x += (dx / Math.max(d, 1)) * push;
        y += (dy / Math.max(d, 1)) * push;
      }
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const tw = 0.55 + 0.45 * Math.sin(t * (1 + rnd(i, 9)) + i);
      const r = ([1.2, 2.0, 3.2][layer] ?? 1) * u * (0.7 + 0.6 * rnd(i, 3));
      out.push(
        <circle
          key={`${layer}-${i}`}
          cx={x}
          cy={y}
          r={r}
          fill={J.star}
          opacity={0.35 + 0.55 * tw}
        />,
      );
      if (layer === 2) {
        const g = r * 6 * tw;
        out.push(
          <path
            key={`g${i}`}
            d={`M ${x - g} ${y} L ${x + g} ${y} M ${x} ${y - g} L ${x} ${y + g}`}
            stroke={J.star}
            strokeWidth={1.2 * u}
            opacity={0.6 * tw}
          />,
        );
      }
    }
  }
  return <g>{out}</g>;
}

/** A small faceless astronaut, the channel's people as they are today: flat shapes, no face. */
function Faceless({ s, u }: { s: number; u: number }) {
  const k = s * u;
  return (
    <g transform={`scale(${k})`}>
      <rect
        x={-34}
        y={-20}
        width={68}
        height={86}
        rx={26}
        fill={J.clockFace}
        stroke={NAVY}
        strokeWidth={3}
      />
      <rect
        x={-50}
        y={-12}
        width={22}
        height={60}
        rx={11}
        fill={J.clockFace}
        stroke={NAVY}
        strokeWidth={3}
        transform="rotate(25 -39 18)"
      />
      <rect
        x={28}
        y={-12}
        width={22}
        height={60}
        rx={11}
        fill={J.clockFace}
        stroke={NAVY}
        strokeWidth={3}
        transform="rotate(-35 39 18)"
      />
      <rect
        x={-28}
        y={58}
        width={22}
        height={58}
        rx={11}
        fill={J.clockFace}
        stroke={NAVY}
        strokeWidth={3}
        transform="rotate(15 -17 62)"
      />
      <rect
        x={6}
        y={58}
        width={22}
        height={58}
        rx={11}
        fill={J.clockFace}
        stroke={NAVY}
        strokeWidth={3}
        transform="rotate(-20 17 62)"
      />
      <circle cx={0} cy={-50} r={36} fill={J.clockFace} stroke={NAVY} strokeWidth={3} />
      <ellipse cx={4} cy={-50} rx={24} ry={18} fill={J.gold} />
      <ellipse cx={-4} cy={-56} rx={8} ry={5} fill={J.sunCore} opacity={0.8} />
    </g>
  );
}

/** The mascot in its space suit, tumbling: the Ink Stick puppet. */
function Mascot({ t, head }: { t: number; head: number }) {
  const face = t < 2.5 ? EXPRESSIONS.surprised : EXPRESSIONS.horrified;
  return (
    <Character
      x={0}
      groundY={head * 2.9}
      head={head}
      facing="right"
      pose={floatAt(t)}
      face={face}
      turn={0.25}
      identity={MASCOT}
      outfit={ASTRONAUT}
      lookAt={{ x: 1, y: 0.8 }}
    />
  );
}

/** One frame of the look test. */
export function CatchLookPicture({
  look,
  t,
  W,
  H,
  zoomFrom = 1,
  zoomTo = 1.18,
  span = 8,
  words = true,
  scale = 1,
}: {
  look: CatchLook;
  t: number;
  W: number;
  H: number;
  zoomFrom?: number;
  zoomTo?: number;
  span?: number;
  words?: boolean;
  scale?: number;
}) {
  const u = W / 1080;
  const p = smooth(t / span);
  const zoom = zoomFrom + (zoomTo - zoomFrom) * p;
  const cx = W / 2;
  const cy = H * 0.6;
  const R = 205 * u * zoom;
  // The traveller drifts toward the hole, tumbling, and starts to stretch along the pull.
  const fx = W * (0.3 + 0.1 * p) + 20 * u * Math.sin(t * 0.8);
  const fy = H * (0.37 + 0.05 * p) + 14 * u * Math.cos(t * 0.6);
  const turn = -18 + 40 * p + 6 * Math.sin(t * 1.1);
  const toward = (Math.atan2(cy - fy, cx - fx) * 180) / Math.PI;
  const stretch = 1 + 0.35 * p * p;
  const size = (1 - 0.15 * p) * scale;
  const [nr, ng, nb] = channels(NAVY);
  const traveller =
    look === 'a' ? (
      <Faceless s={1.35 * size} u={u} />
    ) : (
      <g transform={`scale(${size}) translate(0 ${-210 * u})`}>
        <Mascot t={t} head={130 * u} />
      </g>
    );
  return (
    <g>
      <defs>
        {/* Blended: black lines toned to the channel's navy, colours warmed a little. */}
        <filter
          id="ct-blend"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feComponentTransfer>
            <feFuncR type="table" tableValues={`${nr} 0.55 1`} />
            <feFuncG type="table" tableValues={`${ng} 0.5 0.97`} />
            <feFuncB type="table" tableValues={`${nb} 0.45 0.9`} />
          </feComponentTransfer>
        </filter>
        {/* The disk's light on the edge facing it. */}
        <filter
          id="ct-rim"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodColor={J.sunFlare} result="c" />
          <feComposite in="c" in2="SourceAlpha" operator="in" result="s" />
          <feOffset in="s" dx={6 * u} dy={9 * u} result="o" />
          <feGaussianBlur in="o" stdDeviation={4 * u} />
        </filter>
        <filter id="ct-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={2}
            seed={Math.floor(t * 12) % 8}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.6  0 0 0 0 0.6  0 0 0 0 0.7  0 0 0 0.5 0"
          />
        </filter>
        <radialGradient id="ct-vignette" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.55" stopColor={J.night} stopOpacity={0} />
          <stop offset="1" stopColor={J.night} stopOpacity={0.75} />
        </radialGradient>
      </defs>
      <Space W={W} H={H} t={t} zoom={zoom} />
      <Stars W={W} H={H} t={t} zoom={zoom} cx={cx} cy={cy} />
      <BlackHoleGlow cx={cx} cy={cy} R={R} t={t} u={u} />
      <Infall cx={cx} cy={cy} R={R} t={t} u={u} />
      <g
        transform={`translate(${fx} ${fy}) rotate(${toward}) scale(${stretch} ${1 / Math.sqrt(stretch)}) rotate(${-toward}) rotate(${turn})`}
      >
        {look === 'c' && (
          <g filter="url(#ct-rim)" opacity={0.85}>
            {traveller}
          </g>
        )}
        <g filter={look === 'c' ? 'url(#ct-blend)' : undefined}>{traveller}</g>
      </g>
      <rect width={W} height={H} fill="url(#ct-vignette)" />
      <rect width={W} height={H} filter="url(#ct-grain)" opacity={0.12} />
      {words && (
        <g>
          {['WHAT IF YOU FELL', 'INTO A BLACK HOLE?'].map((line, i) => (
            <text
              key={i}
              x={W / 2}
              y={H * 0.12 + i * 105 * u}
              fontFamily={font}
              fontWeight={800}
              fontSize={84 * u}
              fill={i === 1 ? J.gold : J.clockFace}
              stroke={NAVY}
              strokeWidth={12 * u}
              paintOrder="stroke"
              textAnchor="middle"
            >
              {line}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}

/** The look test as a video: eight seconds of the camera easing in. */
export function CatchLookVideo({ look }: { look: CatchLook }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return <CatchLookPicture look={look} t={frame / fps} W={width} H={height} />;
}

/**
 * A thumbnail in each look: not a frame of the video but a poster, closer in, the traveller big,
 * and a few big words that add to the title ("What Happens If You Fall Into a Black Hole?").
 */
export function CatchLookThumb({ look }: { look: CatchLook }) {
  const { width: W, height: H } = useVideoConfig();
  const u = W / 1080;
  return (
    <g>
      <rect width={W} height={H} fill={J.night} />
      <g transform={`translate(${-W * 0.18} ${H * 0.15}) scale(1.35)`}>
        <CatchLookPicture
          look={look}
          t={6}
          W={W}
          H={H}
          zoomFrom={1.25}
          zoomTo={1.25}
          words={false}
          scale={1.8}
        />
      </g>
      {['YOU WOULD TURN', 'INTO SPAGHETTI'].map((line, i) => (
        <text
          key={i}
          x={W / 2}
          y={H * 0.075 + i * 125 * u}
          fontFamily={font}
          fontWeight={800}
          fontSize={108 * u}
          fill={i === 1 ? J.gold : J.clockFace}
          stroke={NAVY}
          strokeWidth={16 * u}
          paintOrder="stroke"
          textAnchor="middle"
        >
          {line}
        </text>
      ))}
    </g>
  );
}
