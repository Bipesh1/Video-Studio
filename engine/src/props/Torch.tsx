import { accent, ink, pick } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * How much of a torch's flame is left, from a fresh one to one burnt out. Drawn for the bridge
 * and torch thriller (2026-10-15), where the flame gets smaller as the film goes on: a story
 * asks for `torch`, then `torch-low`, `torch-dying` and `torch-out` in later shots.
 */
export const TORCH_FLAMES = {
  torch: 1,
  'torch-low': 0.62,
  'torch-dying': 0.34,
  'torch-out': 0,
} as const;
export type TorchName = keyof typeof TORCH_FLAMES;

/** How far above the fist the wrapped head of the torch sits, in head units. */
export const TORCH_TOP = 0.55;

/**
 * A burning torch (Style 4), held upright in a fist at the origin: a wooden stick, a head of
 * wrapped cloth near the top, and a flame on it. `flame` is how much fire is left (1 full, 0
 * out: then a thin wisp of smoke rises instead). The flame flickers with `t` in seconds. A
 * soft round of light lies behind it, light rather than part of the prop, so it has no
 * outline (as the lantern's).
 */
export function Torch({
  uid,
  shadowSide,
  flame = 1,
  t = 0,
}: PropProps & { flame?: number; t?: number }) {
  const wood = paintOf('brown');
  const wrap = paintOf('tan');
  const fire = pick(accent('orange'), 0);
  const core = pick(accent('gold'), 0);
  const flick = 1 + 0.08 * Math.sin(t * 11) + 0.05 * Math.sin(t * 27 + 1);
  const lean = 0.04 * Math.sin(t * 7);
  const h = 0.55 * flame * flick;
  const w = 0.17 * Math.max(0.45, flame);
  const top = -TORCH_TOP - 0.06;
  const tip = top - h;
  const outer = `M ${-w} ${top} Q ${-w * 1.1} ${top - h * 0.45} ${lean} ${tip} Q ${w * 1.1} ${top - h * 0.45} ${w} ${top} Q 0 ${top + 0.06} ${-w} ${top} Z`;
  const innerH = h * 0.55;
  const inner = `M ${-w * 0.5} ${top} Q ${-w * 0.55} ${top - innerH * 0.5} ${lean * 0.6} ${top - innerH} Q ${w * 0.55} ${top - innerH * 0.5} ${w * 0.5} ${top} Z`;
  return (
    <g>
      {/* Its light: soft all round, fading to nothing (light has no edge). */}
      {flame > 0 && (
        <>
          <defs>
            <radialGradient id={`${uid}-torch-light`}>
              <stop offset="0" stopColor={core} stopOpacity={0.32 * Math.max(0.4, flame)} />
              <stop offset="0.45" stopColor={core} stopOpacity={0.12 * Math.max(0.4, flame)} />
              <stop offset="1" stopColor={core} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            cy={top - h * 0.35}
            r={(0.8 + 1.0 * flame) * flick}
            fill={`url(#${uid}-torch-light)`}
          />
        </>
      )}
      {/* The stick, through the fist and on below it. */}
      <Shaded
        id={`${uid}-torch-stick`}
        d={`M -0.045 ${-TORCH_TOP + 0.08} L 0.045 ${-TORCH_TOP + 0.08} L 0.05 0.42 L -0.05 0.42 Z`}
        {...wood}
        offset={lightOffset(shadowSide, 0.015)}
      />
      {/* The wrapped head, with two bands of cloth. */}
      <Shaded
        id={`${uid}-torch-wrap`}
        d={`M -0.09 ${-TORCH_TOP - 0.06} L 0.09 ${-TORCH_TOP - 0.06} L 0.075 ${-TORCH_TOP + 0.1} L -0.075 ${-TORCH_TOP + 0.1} Z`}
        {...wrap}
        offset={lightOffset(shadowSide, 0.02)}
      />
      {detail(`M -0.085 ${-TORCH_TOP - 0.005} L 0.085 ${-TORCH_TOP - 0.005}`)}
      {detail(`M -0.08 ${-TORCH_TOP + 0.045} L 0.08 ${-TORCH_TOP + 0.045}`)}
      {flame > 0 ? (
        <>
          <path d={outer} fill={fire} stroke={ink} strokeWidth={0.012} strokeLinejoin="round" />
          <path d={inner} fill={core} />
        </>
      ) : (
        // Burnt out: a thin wisp of smoke from the black wrap.
        <path
          d={`M 0 ${top} Q ${0.06 + lean} ${top - 0.15} ${-0.02} ${top - 0.3} Q ${-0.08 + lean} ${top - 0.45} 0.02 ${top - 0.6}`}
          fill="none"
          stroke={pick(accent('steel'), 2)}
          strokeWidth={0.03}
          strokeLinecap="round"
          opacity={0.6}
        />
      )}
      <Glint x={-0.025} y={0.1} length={0.08} turn={-90} />
    </g>
  );
}
