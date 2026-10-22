import fineTokens from '../../../styles/fine-print/tokens.json';
import { Glow, Puff } from '../explainer/bodyKit';

/**
 * A big bright cloud of breath, with a trail of small puffs out to the left, a little lower, where
 * the mouth is (2026-10-21, the cover of "Where Does Your Fat Go When You Lose Weight?": "a person
 * breathing out a big, bright, visible cloud"). Drawn round 0,0, about one unit across; the
 * trail reaches to about -0.78, 0.32.
 */

const J = fineTokens.journey;
const NAVY = fineTokens.line.color;

export function BreathCloud({ uid, t = 0 }: { uid: string; t?: number }) {
  const trail = [
    { x: -0.78, y: 0.32, r: 0.045 },
    { x: -0.68, y: 0.29, r: 0.055 },
    { x: -0.58, y: 0.25, r: 0.065 },
    { x: -0.48, y: 0.2, r: 0.075 },
    { x: -0.38, y: 0.15, r: 0.09 },
  ];
  return (
    <g>
      <Glow id={`${uid}-glow`} cx={0} cy={0} r={0.85} colour={J.fatGlow} strength={0.8} />
      {trail.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y + 0.01 * Math.sin(t * 2 + i)})`}>
          <Puff
            r={p.r}
            fill={J.breath}
            shade={J.breathShade}
            seed={i + 5}
            stroke={NAVY}
            sw={0.012}
          />
        </g>
      ))}
      <g transform={`rotate(${2 * Math.sin(t * 0.8)})`}>
        <Puff r={0.46} fill={J.breath} shade={J.breathShade} seed={11} stroke={NAVY} sw={0.016} />
        <ellipse cx={-0.12} cy={-0.16} rx={0.16} ry={0.07} fill={J.clockFace} opacity={0.85} />
      </g>
    </g>
  );
}
