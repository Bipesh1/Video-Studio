import { stepFrames } from '@studio/shared';
import type { Gauge, VoiceTrack } from '@studio/shared';
import { clamp, easeOutBack } from '../rig/math';
import type { TimedShot } from '../stage/layout';
import { accent, ink, pick, white } from '../tokens';
import { SAFE_916 } from './Explain';
import { VIEWER_FONT, textBasis, viewerText } from './text';

/**
 * Gauges that carry the story (2026-10-22, after two Kurzgesagt Shorts: a hormone's bar filling
 * and draining, "Amount of Repairs Left" counting down, "2/3" of the cycle's phases). Each is a
 * small plate at the top of the picture, inside the part a tall video's app leaves clear; it
 * pops in on its first change, moves to each new value on its word (a bar springs, a count
 * rolls, a step fills), gives a small pulse as it changes, and goes when its last shot ends.
 */

const font = `${VIEWER_FONT}, sans-serif`;
/** Frames a change takes: a count rolls, a bar springs to its new length. */
const CHANGE_FRAMES = 18;
const POP_FRAMES = 9;

type Timed = { frame: number; value: number };

/** The frames of a gauge's changes in this part: on their words, or at once for one carried in. */
export function gaugeTimes(
  g: Gauge,
  shots: readonly TimedShot[],
  track: VoiceTrack | null,
  fps: number,
): { keys: Timed[]; shown: number; gone: number } {
  const keys: Timed[] = [];
  for (const k of g.keys) {
    const ts = shots.find((s) => s.shot.id === k.shot);
    if (!ts) continue;
    if (k.now) {
      keys.push({ frame: -1e6, value: k.value });
      continue;
    }
    const duration = ts.endFrame - ts.startFrame;
    const [at = 0] = stepFrames([k.on], track?.words ?? [], ts.startFrame, duration, fps, false);
    keys.push({ frame: ts.startFrame + (k.on ? at : 0), value: k.value });
  }
  const until = g.until ? shots.find((s) => s.shot.id === g.until) : undefined;
  const last = shots[shots.length - 1];
  return {
    keys,
    shown: keys[0]?.frame ?? 0,
    gone: until ? until.endFrame : (last?.endFrame ?? 0) + 1e6,
  };
}

/** The value at a frame, moving from the last key to the next over a few frames. */
function valueAt(keys: readonly Timed[], frame: number, kind: Gauge['kind']) {
  let from = 0;
  let value = 0;
  let since = Infinity;
  for (const k of keys) {
    if (k.frame > frame) break;
    from = value;
    value = k.value;
    since = frame - k.frame;
  }
  const u = clamp(since / CHANGE_FRAMES, 0, 1);
  // A bar springs a little past its new length and settles; a count and steps ease in.
  const e = kind === 'bar' ? easeOutBack(u, 1.4) : 1 - (1 - u) ** 3;
  return { shown: from + (value - from) * e, target: value, since };
}

const countText = (v: number, g: Gauge) =>
  `${g.prefix ?? ''}${Math.round(v)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${g.suffix ?? ''}`;

export function Gauges({
  gauges,
  shots,
  track,
  frame,
  fps,
  width,
  height,
  titleLines = 0,
}: {
  gauges: readonly Gauge[];
  shots: readonly TimedShot[];
  track: VoiceTrack | null;
  frame: number;
  fps: number;
  width: number;
  height: number;
  /** The lines of a big title at the top of this shot's picture: the gauges stand below it. */
  titleLines?: number;
}) {
  const basis = textBasis(width, height);
  const tall = width < height;
  const w = basis * 0.5;
  const h = basis * 0.135;
  const gap = basis * 0.018;
  const x0 = tall ? SAFE_916.x * width : width * 0.03;
  const below = titleLines >= 2 ? 0.205 : titleLines === 1 ? 0.16 : 0;
  const y0 = tall ? Math.max(SAFE_916.y, below) * height : height * (0.03 + below * 0.6);
  const plate = pick(accent('steel'), 1);
  const gold = pick(accent('gold'), 0);
  let row = 0;
  return (
    <g>
      {gauges.map((g, i) => {
        const t = gaugeTimes(g, shots, track, fps);
        if (frame < t.shown || frame >= t.gone + POP_FRAMES) return null;
        const into = t.shown < -1e5 ? 1 : clamp((frame - t.shown) / POP_FRAMES, 0, 1);
        const out = clamp((t.gone + POP_FRAMES - frame) / POP_FRAMES, 0, 1);
        const { shown, since } = valueAt(t.keys, frame, g.kind);
        const pulse = since < 10 ? 1 + 0.06 * Math.sin((since / 10) * Math.PI) : 1;
        const s = easeOutBack(into, 1.6) * out * pulse;
        const y = y0 + row * (h + gap);
        row += 1;
        const label = viewerText(g.label);
        const small = h * 0.27;
        const big = h * 0.48;
        const pad = h * 0.16;
        const cx = x0 + w / 2;
        const cy = y + h / 2;
        return (
          <g
            key={i}
            transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}
            opacity={Math.min(1, into * 2) * out}
          >
            <rect x={x0} y={y} width={w} height={h} rx={h * 0.22} fill={plate} />
            <text
              x={x0 + pad}
              y={y + pad + small * 0.8}
              fontFamily={font}
              fontWeight={600}
              fontSize={small}
              fill={white}
            >
              {label}
            </text>
            {g.kind === 'bar' && (
              <g>
                <rect
                  x={x0 + pad}
                  y={y + h * 0.6}
                  width={w - 2 * pad}
                  height={h * 0.22}
                  rx={h * 0.11}
                  fill={ink}
                />
                <rect
                  x={x0 + pad}
                  y={y + h * 0.6}
                  width={(w - 2 * pad) * clamp(shown / (g.max ?? 100), 0, 1.04)}
                  height={h * 0.22}
                  rx={h * 0.11}
                  fill={gold}
                />
              </g>
            )}
            {g.kind === 'count' && (
              <text
                x={x0 + w - pad}
                y={y + h - pad * 0.9}
                textAnchor="end"
                fontFamily={font}
                fontWeight={800}
                fontSize={big}
                fill={gold}
              >
                {countText(shown, g)}
              </text>
            )}
            {g.kind === 'steps' &&
              (() => {
                const of = g.of ?? 3;
                const r = h * 0.1;
                const step = (w - 2 * pad - big * 1.6) / of;
                return (
                  <g>
                    {Array.from({ length: of }, (_, k) => {
                      const fill = clamp(shown - k, 0, 1);
                      const px = x0 + pad + r + k * step;
                      const py = y + h * 0.71;
                      return (
                        <g key={k}>
                          <circle cx={px} cy={py} r={r} fill={ink} />
                          <circle cx={px} cy={py} r={r * easeOutBack(fill, 1.6)} fill={gold} />
                        </g>
                      );
                    })}
                    <text
                      x={x0 + w - pad}
                      y={y + h - pad * 0.9}
                      textAnchor="end"
                      fontFamily={font}
                      fontWeight={800}
                      fontSize={big}
                      fill={gold}
                    >
                      {`${Math.round(shown)}/${of}`}
                    </text>
                  </g>
                );
              })()}
          </g>
        );
      })}
    </g>
  );
}
