import { lighten } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** How tall the rocket stands on its fins, in head units. */
export const ROCKET_HEIGHT = 3.3;

/**
 * A rocket (Style 4): a white body with a red nose and fins, one round window and a dark
 * nozzle. It stands on its fins with the ground at y = 0 under its middle. `flame` (0 to 1)
 * lights the engine: fire pours out below it, and `t` in seconds makes the fire flicker. To
 * fly it, lift it and turn it; the fire follows.
 */
export function Rocket({
  uid,
  shadowSide,
  flame = 0,
  t = 0,
  paint = 'crimson',
}: PropProps & { flame?: number; t?: number; paint?: string }) {
  const hull = { fill: paintOf('cream').fill, shadow: paintOf('cream').shadow };
  const trim = paintOf(paint);
  const metal = paintOf('steel');
  const glass = paintOf('glint');
  const orange = paintOf('orange');
  const gold = paintOf('gold');
  const off = lightOffset(shadowSide, 0.07);
  const h = ROCKET_HEIGHT;
  const flick = (k: number) => 1 + 0.1 * Math.sin(t * 13 + k * 2) + 0.06 * Math.sin(t * 29 + k);
  const fire = (width: number, length: number, k: number) =>
    `M ${-width} -0.3 Q ${-width * 1.2} ${length * 0.45 * flick(k)} ${0.05 * Math.sin(t * 10 + k)} ${length * flick(k)} Q ${width * 1.2} ${length * 0.45 * flick(k + 1)} ${width} -0.3 Z`;
  return (
    <g>
      {flame > 0 && (
        <g>
          <Shaded
            id={`${uid}-rocket-fire`}
            d={fire(0.3, 1.9 * flame, 0)}
            fill={orange.fill}
            shadow={orange.fill}
            offset={off}
          />
          <path d={fire(0.2, 1.3 * flame, 2)} fill={gold.fill} />
          <path d={fire(0.1, 0.75 * flame, 4)} fill={lighten(gold.fill, 0.5)} />
        </g>
      )}
      {/* The two fins it stands on, behind the body. */}
      <Shaded
        id={`${uid}-rocket-fin-l`}
        d="M -0.34 -1.25 Q -0.92 -0.8 -0.86 0 L -0.52 0 Q -0.5 -0.42 -0.34 -0.56 Z"
        {...trim}
        offset={off}
      />
      <Shaded
        id={`${uid}-rocket-fin-r`}
        d="M 0.34 -1.25 Q 0.92 -0.8 0.86 0 L 0.52 0 Q 0.5 -0.42 0.34 -0.56 Z"
        {...trim}
        offset={off}
      />
      <Shaded
        id={`${uid}-rocket-nozzle`}
        d="M -0.24 -0.46 L 0.24 -0.46 L 0.32 -0.2 L -0.32 -0.2 Z"
        {...metal}
        offset={lightOffset(shadowSide, 0.03)}
      />
      <Shaded
        id={`${uid}-rocket-body`}
        d={`M -0.4 -0.44 Q -0.52 -1.5 -0.36 ${-h + 0.95} L 0.36 ${-h + 0.95} Q 0.52 -1.5 0.4 -0.44 Z`}
        {...hull}
        offset={off}
      />
      <Shaded
        id={`${uid}-rocket-nose`}
        d={`M -0.36 ${-h + 0.95} Q -0.3 ${-h + 0.3} 0 ${-h} Q 0.3 ${-h + 0.3} 0.36 ${-h + 0.95} Q 0 ${-h + 1.05} -0.36 ${-h + 0.95} Z`}
        {...trim}
        offset={off}
      />
      <Shaded
        id={`${uid}-rocket-band`}
        d="M -0.455 -0.86 Q 0 -0.76 0.455 -0.86 L 0.44 -0.62 Q 0 -0.52 -0.44 -0.62 Z"
        {...trim}
        offset={off}
      />
      {/* The middle fin, seen edge on. */}
      {detail('M 0 -1.1 L 0 -0.1')}
      <Shaded
        id={`${uid}-rocket-ring`}
        d="M -0.25 -1.72 A 0.25 0.25 0 1 0 0.25 -1.72 A 0.25 0.25 0 1 0 -0.25 -1.72 Z"
        {...metal}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <Shaded
        id={`${uid}-rocket-window`}
        d="M -0.17 -1.72 A 0.17 0.17 0 1 0 0.17 -1.72 A 0.17 0.17 0 1 0 -0.17 -1.72 Z"
        {...glass}
        offset={lightOffset(shadowSide, 0.04)}
      />
      <Glint x={-0.06} y={-1.78} length={0.1} turn={-45} />
      {detail(`M -0.3 ${-h + 1.2} Q 0 ${-h + 1.28} 0.3 ${-h + 1.2}`)}
    </g>
  );
}
