import { accent, ink, pick, white } from '../tokens';
import { VIEWER_FONT } from '../overlays/text';
import { clamp } from '../rig/math';

/**
 * The rewind (Biku, 2026-10-18: "i want a proper rewind animation"): the story so far plays
 * backwards, fast, and stops where the story begins, with a stamp like "10 MINUTES EARLIER".
 * The picture under it is drawn by StoryboardVideo (the earlier shots at reversed times); this
 * draws what tells the eye it is a rewind, in one of three styles he picks from:
 *
 *   tape     an old video tape: wobbling scan lines, a band of noise rolling up, a washed-out
 *            picture, REW and a ◀◀ in the corner, a counter running back
 *   cartoon  clean and bold: streaks rushing in, a clock whose hands spin backwards, a big ◀◀
 *   film     a film reel: the picture flickers warm and grainy, scratches, the frame jumping
 *
 * `k` runs from 0 to 1 over the rewind; `t` is seconds (for the noise and flicker).
 */

export const REWIND_STYLES = ['tape', 'cartoon', 'film'] as const;
export type RewindStyle = (typeof REWIND_STYLES)[number];

/** How long the rewind runs, in frames at 30 a second, and how long its stamp stays after. */
export const REWIND_FRAMES = 42;
export const STAMP_FRAMES = 40;

const font = `${VIEWER_FONT}, sans-serif`;
const gold = pick(accent('gold'), 0);
const red = pick(accent('crimson'), 0);
const cream = pick(accent('cream'), 0);

/** How fast the picture runs back at a point of the rewind: slow, rushing, slowing to a stop. */
export function rewindSpeed(k: number): number {
  return Math.sin(Math.PI * clamp(k, 0, 1));
}

/** How far back the picture has gone (0 none, 1 all the way), eased so it starts and stops gently. */
export function rewindDone(k: number): number {
  const x = clamp(k, 0, 1);
  return x * x * (3 - 2 * x);
}

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

/** The filter the picture is drawn through while it rewinds: washed out, warm, or as it is. */
export function RewindFilters({ style, k, t }: { style: RewindStyle; k: number; t: number }) {
  const on = rewindSpeed(k);
  if (style === 'tape') {
    const sat = 1 - 0.55 * on;
    return (
      <filter id="rewind-look" x="0" y="0" width="100%" height="100%">
        <feColorMatrix type="saturate" values={`${sat}`} />
        <feComponentTransfer>
          <feFuncR type="linear" slope={1 + 0.08 * on} intercept={0.02 * on} />
          <feFuncG type="linear" slope={1} />
          <feFuncB type="linear" slope={1 + 0.15 * on} intercept={0.03 * on} />
        </feComponentTransfer>
      </filter>
    );
  }
  if (style === 'film') {
    const flick = 1 - 0.18 * on * (0.5 + 0.5 * Math.sin(t * 71));
    return (
      <filter id="rewind-look" x="0" y="0" width="100%" height="100%">
        <feColorMatrix
          type="matrix"
          values={`${0.393 + 0.607 * (1 - on)} ${0.769 * on} ${0.189 * on} 0 0 ${0.349 * on} ${0.686 + 0.314 * (1 - on)} ${0.168 * on} 0 0 ${0.272 * on} ${0.534 * on} ${0.131 + 0.869 * (1 - on)} 0 0 0 0 0 1 0`}
        />
        <feComponentTransfer>
          <feFuncR type="linear" slope={flick} />
          <feFuncG type="linear" slope={flick} />
          <feFuncB type="linear" slope={flick} />
        </feComponentTransfer>
        <feGaussianBlur stdDeviation={`0 ${3 * on}`} />
      </filter>
    );
  }
  return (
    <filter id="rewind-look" x="0" y="0" width="100%" height="100%">
      <feGaussianBlur stdDeviation={`${6 * on} 0`} />
    </filter>
  );
}

/** How the picture itself is shaken while it rewinds: a tape wobbles sideways, a film jumps. */
export function rewindShake(style: RewindStyle, k: number, t: number, H: number) {
  const on = rewindSpeed(k);
  if (style === 'tape') return { dx: 6 * on * Math.sin(t * 47), dy: 0 };
  if (style === 'film') return { dx: 0, dy: on * (Math.floor(t * 24) % 3 === 0 ? 0.012 * H : 0) };
  return { dx: 0, dy: 0 };
}

/** What is drawn over the picture while it rewinds. */
export function RewindOverlay({
  style,
  k,
  t,
  W,
  H,
}: {
  style: RewindStyle;
  k: number;
  t: number;
  W: number;
  H: number;
}) {
  const on = rewindSpeed(k);
  const u = W / 1080;
  const arrows = (x: number, y: number, s: number, fill: string) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 0 L 40 -26 L 40 26 Z" fill={fill} />
      <path d="M 38 0 L 78 -26 L 78 26 Z" fill={fill} />
    </g>
  );
  if (style === 'tape') {
    const band = ((1 - ((t * 0.9) % 1)) * 1.3 - 0.15) * H;
    return (
      <g>
        {Array.from({ length: Math.ceil(H / (6 * u)) }, (_, i) => (
          <rect
            key={i}
            x={0}
            y={i * 6 * u}
            width={W}
            height={2 * u}
            fill={ink}
            opacity={0.18 * on}
          />
        ))}
        {Array.from({ length: 18 }, (_, i) => (
          <rect
            key={`n${i}`}
            x={rnd(i + Math.floor(t * 30)) * W - 60 * u}
            y={band + (rnd(i * 3 + Math.floor(t * 30)) - 0.5) * 70 * u}
            width={(60 + 200 * rnd(i * 7)) * u}
            height={(2 + 4 * rnd(i * 5)) * u}
            fill={white}
            opacity={0.55 * on}
          />
        ))}
        <rect x={0} y={band - 30 * u} width={W} height={60 * u} fill={white} opacity={0.07 * on} />
        <g opacity={clamp(on * 3, 0, 1)}>
          {arrows(70 * u, 150 * u, 1.3 * u, white)}
          <text
            x={190 * u}
            y={168 * u}
            fontFamily={font}
            fontWeight={700}
            fontSize={54 * u}
            fill={white}
          >
            REW
          </text>
          <text
            x={W - 70 * u}
            y={168 * u}
            fontFamily={font}
            fontWeight={700}
            fontSize={46 * u}
            fill={white}
            textAnchor="end"
          >
            {`0:${String(Math.max(0, Math.round(10 * (1 - rewindDone(k))))).padStart(2, '0')}:00`}
          </text>
        </g>
      </g>
    );
  }
  if (style === 'film') {
    return (
      <g>
        {Array.from({ length: 5 }, (_, i) => {
          const x = rnd(i * 13 + Math.floor(t * 18)) * W;
          return (
            <rect
              key={i}
              x={x}
              y={0}
              width={(1.5 + 2 * rnd(i)) * u}
              height={H}
              fill={i % 2 ? white : ink}
              opacity={0.35 * on}
            />
          );
        })}
        {Array.from({ length: 40 }, (_, i) => (
          <circle
            key={`d${i}`}
            cx={rnd(i * 17 + Math.floor(t * 24)) * W}
            cy={rnd(i * 29 + Math.floor(t * 24)) * H}
            r={(1 + 3 * rnd(i)) * u}
            fill={i % 3 ? ink : cream}
            opacity={0.45 * on}
          />
        ))}
        <rect x={0} y={0} width={34 * u} height={H} fill={ink} opacity={0.8 * on} />
        <rect x={W - 34 * u} y={0} width={34 * u} height={H} fill={ink} opacity={0.8 * on} />
        {Array.from({ length: 14 }, (_, i) => {
          const y = ((i * 140 + t * 2200) % (H + 140)) - 70;
          return (
            <g key={`h${i}`} opacity={0.8 * on}>
              <rect x={8 * u} y={y} width={18 * u} height={26 * u} rx={4 * u} fill={cream} />
              <rect x={W - 26 * u} y={y} width={18 * u} height={26 * u} rx={4 * u} fill={cream} />
            </g>
          );
        })}
        <g opacity={clamp(on * 3, 0, 1)}>{arrows(W / 2 - 60 * u, H * 0.14, 1.5 * u, cream)}</g>
      </g>
    );
  }
  // cartoon: streaks rushing in from the edges toward the middle, a clock spinning backwards.
  const cx = W / 2;
  const cy = H * 0.42;
  // The big arrows stand by the clock at the top, clear of the faces in the middle.
  const clockX = W - 150 * u;
  const clockY = 230 * u;
  const back = -rewindDone(k) * 360 * 5;
  return (
    <g>
      {Array.from({ length: 70 }, (_, i) => {
        const a = rnd(i * 3) * Math.PI * 2;
        const f = (rnd(i * 7) + t * 2.2) % 1;
        const r0 = (1 - f) * Math.hypot(W, H) * 0.62 + 40 * u;
        const len = (80 + 240 * (1 - f)) * u * on;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r0}
            y1={cy + Math.sin(a) * r0}
            x2={cx + Math.cos(a) * (r0 + len)}
            y2={cy + Math.sin(a) * (r0 + len)}
            stroke={white}
            strokeWidth={(3 + 5 * (1 - f)) * u}
            strokeLinecap="round"
            opacity={0.55 * on}
          />
        );
      })}
      <g opacity={clamp(on * 3, 0, 1)}>
        <circle cx={clockX} cy={clockY} r={92 * u} fill={cream} stroke={ink} strokeWidth={8 * u} />
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x={clockX - 3 * u}
            y={clockY - 84 * u}
            width={6 * u}
            height={14 * u}
            fill={ink}
            transform={`rotate(${i * 30} ${clockX} ${clockY})`}
          />
        ))}
        <line
          x1={clockX}
          y1={clockY}
          x2={clockX}
          y2={clockY - 68 * u}
          stroke={red}
          strokeWidth={7 * u}
          strokeLinecap="round"
          transform={`rotate(${back} ${clockX} ${clockY})`}
        />
        <line
          x1={clockX}
          y1={clockY}
          x2={clockX}
          y2={clockY - 44 * u}
          stroke={ink}
          strokeWidth={10 * u}
          strokeLinecap="round"
          transform={`rotate(${back / 12} ${clockX} ${clockY})`}
        />
        <circle cx={clockX} cy={clockY} r={9 * u} fill={ink} />
        <g opacity={0.95}>{arrows(70 * u, clockY, 2.2 * u, gold)}</g>
      </g>
    </g>
  );
}

/** The stamp the rewind stops on: "10 MINUTES EARLIER", slammed in, then fading. */
export function RewindStamp({
  label,
  style,
  frame,
  W,
  H,
}: {
  label: string;
  style: RewindStyle;
  frame: number;
  W: number;
  H: number;
}) {
  if (frame < 0 || frame > STAMP_FRAMES) return null;
  // Sized by the short side, so a wide picture's stamp is no bigger than a tall one's, and set
  // high in a wide picture, clear of the faces (the dishes video, 2026-10-20).
  const u = Math.min(W, H) / 1080;
  const inK = clamp(frame / 5, 0, 1);
  const out = clamp((STAMP_FRAMES - frame) / 10, 0, 1);
  const s = 1.25 - 0.25 * inK;
  const words = label.toUpperCase();
  const size = Math.min(96, 1500 / Math.max(8, words.length)) * u;
  const boxW = words.length * size * 0.62 + 80 * u;
  const y = W > H ? H * 0.1 : H * 0.2;
  const fill = style === 'tape' ? white : style === 'film' ? cream : gold;
  const text = style === 'cartoon' ? ink : ink;
  return (
    <g
      opacity={inK * out}
      transform={`translate(${W / 2} ${y}) scale(${s}) rotate(${style === 'cartoon' ? -3 : 0})`}
    >
      {style === 'tape' ? (
        <text
          x={0}
          y={size * 0.35}
          fontFamily={font}
          fontWeight={700}
          fontSize={size}
          fill={white}
          stroke={ink}
          strokeWidth={8 * u}
          paintOrder="stroke"
          textAnchor="middle"
        >
          {`◀◀ ${words}`}
        </text>
      ) : (
        <>
          <rect
            x={-boxW / 2}
            y={-size * 0.8}
            width={boxW}
            height={size * 1.55}
            rx={14 * u}
            fill={fill}
            stroke={ink}
            strokeWidth={8 * u}
          />
          <text
            x={0}
            y={size * 0.35}
            fontFamily={font}
            fontWeight={700}
            fontSize={size}
            fill={text}
            textAnchor="middle"
          >
            {words}
          </text>
        </>
      )}
    </g>
  );
}
