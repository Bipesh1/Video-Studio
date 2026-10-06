import { useContext } from 'react';
import { clamp, easeOutBack } from '../rig/math';
import { MirrorContext } from '../rig/mirror';
import { ink, lineWeights, tokens, white } from '../tokens';

export const SYMBOLS = ['!', '?', '...'] as const;
export type SymbolKind = (typeof SYMBOLS)[number];

/** Seconds a symbol takes to pop in. */
export const SYMBOL_POP = 0.2;

const pop = (t: number | undefined, delay = 0): number =>
  t === undefined ? 1 : easeOutBack(clamp((t - delay) / SYMBOL_POP, 0, 1), 2.4);

/**
 * A symbol over the head (Style 3.7): a bold outlined `!` for surprise, `?` for puzzlement or
 * `...` for a stunned silence. It pops in with a small bounce (Style 8); the dots arrive one
 * after another. Drawn in head space, and it never reads backward on a character facing left.
 */
export function HeadSymbol({
  kind,
  t,
  x = 0.14,
  y = -1,
  size = 0.56,
}: {
  kind: SymbolKind;
  /** Seconds since it appeared. Left out, it is simply there. */
  t?: number;
  x?: number;
  /** Where its middle sits: -0.5 is the top of the head. */
  y?: number;
  /** Its height in head units. */
  size?: number;
}) {
  const mirror = useContext(MirrorContext);
  const s = size;
  // A little finer than a head outline, so the white of a small dot still shows.
  const edge = lineWeights.outline * 0.8;
  const shape = {
    fill: white,
    stroke: ink,
    strokeWidth: edge,
    strokeLinejoin: tokens.line.join,
  } as const;
  const stroke = (d: string, w: number) => (
    <g fill="none" strokeLinecap={tokens.line.cap} strokeLinejoin={tokens.line.join}>
      <path d={d} stroke={ink} strokeWidth={w + 2 * edge} />
      <path d={d} stroke={white} strokeWidth={w} />
    </g>
  );

  let glyph;
  if (kind === '!') {
    // A bar that is wider at the top, over a dot.
    const d = `M ${-0.15 * s} ${-0.44 * s} Q 0 ${-0.56 * s} ${0.15 * s} ${-0.44 * s} L ${0.07 * s} ${0.14 * s} Q 0 ${0.2 * s} ${-0.07 * s} ${0.14 * s} Z`;
    glyph = (
      <>
        <path d={d} {...shape} />
        <circle cy={0.39 * s} r={0.13 * s} {...shape} />
      </>
    );
  } else if (kind === '?') {
    // A hook drawn as one thick line, over a dot.
    const d = `M ${-0.19 * s} ${-0.27 * s} C ${-0.19 * s} ${-0.56 * s} ${0.22 * s} ${-0.56 * s} ${0.2 * s} ${-0.26 * s} C ${0.19 * s} ${-0.08 * s} ${0.01 * s} ${-0.1 * s} ${0.01 * s} ${0.1 * s}`;
    glyph = (
      <>
        {stroke(d, 0.15 * s)}
        <circle cx={0.01 * s} cy={0.39 * s} r={0.13 * s} {...shape} />
      </>
    );
  } else {
    glyph = (
      <>
        {[-1, 0, 1].map((i) => (
          <circle
            key={i}
            cx={i * 0.42 * s}
            cy={0.12 * s}
            r={0.17 * s * pop(t, (i + 1) * 0.22)}
            {...shape}
          />
        ))}
      </>
    );
  }
  const scale = kind === '...' ? 1 : pop(t);
  if (scale <= 0) return null;
  return (
    <g
      transform={`translate(${x} ${y + 0.5 * s}) scale(${mirror * scale} ${scale}) translate(0 ${-0.5 * s})`}
    >
      {glyph}
    </g>
  );
}
