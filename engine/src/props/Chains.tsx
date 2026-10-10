import type { HandFrame } from '../rig/Character';
import { accent, ink, lineWeights, pick, tokens } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import type { PropProps } from './Hold';

/**
 * Wrist chains: an iron cuff on each wrist and a chain hanging between the two hands. They are
 * worn, not held, so they go in a Character's `prop` slot with both hand frames and follow the
 * arms through any pose or walk. Nothing is shown hurting anyone (Style 4).
 */
export function WristChains({
  hands,
  uid,
  shadowSide,
}: PropProps & { hands: { front: HandFrame; back: HandFrame } }) {
  const iron = accent('steel');
  const link = pick(iron, 2);
  const wrist = (frame: HandFrame) => {
    const a = (frame.forearm * Math.PI) / 180;
    return { x: frame.center.x - 0.17 * Math.sin(a), y: frame.center.y - 0.17 * Math.cos(a) };
  };
  const a = wrist(hands.front);
  const b = wrist(hands.back);
  const apart = Math.hypot(a.x - b.x, a.y - b.y);
  // The chain is a fixed length, so it hangs deeper the closer the hands come together.
  const sag = Math.max(0.16, 0.62 - apart * 0.32);
  const hang = `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${Math.max(a.y, b.y) + sag * 1.9} ${b.x} ${b.y}`;
  const strand = (color: string, width: number, dash?: string) => (
    <path
      d={hang}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap={tokens.line.cap}
      {...(dash ? { strokeDasharray: dash } : {})}
    />
  );
  const cuff = (frame: HandFrame, at: { x: number; y: number }, key: string) => (
    <g key={key} transform={`translate(${at.x} ${at.y}) rotate(${-frame.forearm})`}>
      <Shaded
        id={`${uid}-cuff-${key}`}
        d="M -0.115 -0.06 L 0.115 -0.06 Q 0.15 0 0.115 0.06 L -0.115 0.06 Q -0.15 0 -0.115 -0.06 Z"
        fill={link}
        shadow={pick(iron, 0)}
        offset={lightOffset(shadowSide, 0.02)}
      />
    </g>
  );
  return (
    <g>
      {/* Links: a dark strand with lighter beads along it. */}
      {strand(ink, 0.07 + lineWeights.outline * 2)}
      {strand(link, 0.05, '0.085 0.06')}
      {cuff(hands.back, b, 'back')}
      {cuff(hands.front, a, 'front')}
    </g>
  );
}
