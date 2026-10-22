import fineTokens from '../../../styles/fine-print/tokens.json';
import { BlendDefs } from '../explainer/Blend';
import { EXPRESSIONS } from '../face/expressions';
import { VIEWER_FONT } from '../overlays/text';
import { Character } from '../rig/Character';
import { resolvePose } from '../rig/pose';
import { openArms, stand, wave } from '../rig/poses';
import { outfitFrom } from '../wardrobe/garments';
import type { Clothes } from '../wardrobe/garments';
import type { Identity } from '../wardrobe/types';

/**
 * The What's the Catch? mascot, four designs for Biku to pick (2026-10-21). He picked look C of
 * the black-hole test: the channel's own stick-figure character blended into its worlds (lines
 * toned to the channel's navy, colours warmed, the scene's light on his edge). Each design is
 * apart from the game theory cast (no orange beanie, no glasses with a scarf, no green cap, no
 * tie, no grey suit), so the two channels never share a face. Shown full length with a big
 * friendly face, and again small, as on a phone.
 */

const J = fineTokens.journey;
const NAVY = fineTokens.line.color;
const font = `${VIEWER_FONT}, Arial, sans-serif`;

type Design = { name: string; identity: Identity; clothes: Clothes };
export const MASCOT_DESIGNS: Design[] = [
  {
    name: 'TEAL HOODIE',
    identity: { skinTone: 4, hair: 'afro', hairColor: 'black' },
    clothes: {
      top: { kind: 'hoodie', cloth: 'ocean' },
      bottom: { kind: 'trousers', cloth: 'tan' },
      shoes: { kind: 'sneakers', cloth: 'white' },
    },
  },
  {
    name: 'YELLOW JACKET',
    identity: { skinTone: 2, hair: 'short-crop', hairColor: 'brown' },
    clothes: {
      top: { kind: 'jacket', cloth: 'gold' },
      bottom: { kind: 'trousers', cloth: 'denim' },
      shoes: { kind: 'boots', cloth: 'brown' },
    },
  },
  {
    name: 'RED HOODIE',
    identity: { skinTone: 5, hair: 'locs', hairColor: 'black' },
    clothes: {
      top: { kind: 'hoodie', cloth: 'crimson' },
      bottom: { kind: 'trousers', cloth: 'steel' },
      shoes: { kind: 'sneakers', cloth: 'white' },
    },
  },
  {
    name: 'GREEN JACKET',
    identity: { skinTone: 1, hair: 'ponytail', hairColor: 'auburn' },
    clothes: {
      top: { kind: 'jacket', cloth: 'forest' },
      bottom: { kind: 'trousers', cloth: 'denim' },
      shoes: { kind: 'sneakers', cloth: 'white' },
    },
  },
];

function Mascot({
  design,
  x,
  ground,
  head,
  pose,
  face,
  id,
  u,
}: {
  design: Design;
  x: number;
  ground: number;
  head: number;
  pose: 'wave' | 'stand' | 'open';
  face: keyof typeof EXPRESSIONS;
  id: string;
  u: number;
}) {
  const body = (
    <Character
      x={x}
      groundY={ground}
      head={head}
      facing="right"
      pose={resolvePose(pose === 'wave' ? wave : pose === 'open' ? openArms : stand)}
      face={EXPRESSIONS[face]}
      turn={0.2}
      identity={design.identity}
      outfit={outfitFrom(design.clothes)}
    />
  );
  return (
    <g>
      <BlendDefs id={id} u={u} />
      <g filter={`url(#${id}-rim)`} opacity={0.85}>
        {body}
      </g>
      <g filter={`url(#${id}-blend)`}>{body}</g>
    </g>
  );
}

/** Four designs in a grid: each big, waving, with a small copy as a phone would show it. */
export function MascotSheet({ W, H }: { W: number; H: number }) {
  const u = W / 1080;
  const cw = W / 2;
  const ch = H / 2;
  return (
    <g>
      <defs>
        <radialGradient id="mx-bg" cx="0.5" cy="0.45" r="0.8">
          <stop offset="0" stopColor={J.nebulaLight} />
          <stop offset="1" stopColor={J.space} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#mx-bg)" />
      {MASCOT_DESIGNS.map((d, i) => {
        const cx = (i % 2) * cw + cw / 2;
        const cy = Math.floor(i / 2) * ch;
        return (
          <g key={i}>
            <rect
              x={(i % 2) * cw + 12 * u}
              y={cy + 12 * u}
              width={cw - 24 * u}
              height={ch - 24 * u}
              rx={24 * u}
              fill={J.space}
              opacity={0.35}
            />
            <text
              x={cx - cw / 2 + 40 * u}
              y={cy + 90 * u}
              fontFamily={font}
              fontWeight={800}
              fontSize={72 * u}
              fill={J.gold}
              stroke={NAVY}
              strokeWidth={10 * u}
              paintOrder="stroke"
            >
              {i + 1}
            </text>
            <text
              x={cx}
              y={cy + ch - 40 * u}
              fontFamily={font}
              fontWeight={800}
              fontSize={36 * u}
              fill={J.clockFace}
              textAnchor="middle"
            >
              {d.name}
            </text>
            <Mascot
              design={d}
              x={cx - 40 * u}
              ground={cy + ch - 110 * u}
              head={118 * u}
              pose={i % 2 ? 'open' : 'wave'}
              face="happy"
              id={`mx${i}`}
              u={u}
            />
            <Mascot
              design={d}
              x={cx + 175 * u}
              ground={cy + ch - 110 * u}
              head={34 * u}
              pose="stand"
              face="surprised"
              id={`mxs${i}`}
              u={u}
            />
          </g>
        );
      })}
    </g>
  );
}

export function MascotSheetVideo() {
  return <MascotSheet W={1080} H={1920} />;
}
