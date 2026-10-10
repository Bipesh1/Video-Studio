import { accent, ink, lineWeights, pick, tokens } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/** The wagon's size in head units: how long its bed is, how high its sides reach, its wheels. */
export const WAGON = { length: 3.3, side: 1.08, floor: 0.04, wheel: 0.56 } as const;

/**
 * An open farm wagon seen from the side (Style 4), standing on the ground with the middle of
 * its bed at the origin and its pole pointing right: a plank bed, two solid spoked wheels and
 * the pole a horse would be hitched to. The bed is slung low between the wheels: draw it
 * after the people riding in it, so its side hides their legs and they read as standing in it.
 */
export function Wagon({ uid, shadowSide }: PropProps) {
  const wood = paintOf('brown');
  const pale = paintOf('tan');
  const iron = paintOf('steel');
  const l = WAGON.length / 2;
  const { side, floor, wheel } = WAGON;
  const off = lightOffset(shadowSide, 0.045);
  const wheelAt = (x: number, key: string) => {
    const y = -wheel;
    const spoke = (turn: number) => {
      const dx = Math.cos((turn * Math.PI) / 180) * (wheel - 0.1);
      const dy = Math.sin((turn * Math.PI) / 180) * (wheel - 0.1);
      return detail(`M ${x - dx} ${y - dy} L ${x + dx} ${y + dy}`, `${key}-spoke-${turn}`);
    };
    return (
      <g key={key}>
        <Shaded
          id={`${uid}-wagon-${key}`}
          d={`M ${x - wheel} ${y} A ${wheel} ${wheel} 0 1 0 ${x + wheel} ${y} A ${wheel} ${wheel} 0 1 0 ${x - wheel} ${y} Z`}
          {...pale}
          offset={off}
        />
        <circle
          cx={x}
          cy={y}
          r={wheel - 0.1}
          fill="none"
          stroke={ink}
          strokeWidth={lineWeights.detail}
        />
        {[0, 45, 90, 135].map(spoke)}
        <Shaded
          id={`${uid}-wagon-${key}-hub`}
          d={`M ${x - 0.11} ${y} A 0.11 0.11 0 1 0 ${x + 0.11} ${y} A 0.11 0.11 0 1 0 ${x - 0.11} ${y} Z`}
          {...iron}
          offset={lightOffset(shadowSide, 0.02)}
        />
      </g>
    );
  };
  return (
    <g>
      {/* The pole a horse is hitched to, running forward from under the bed. */}
      <Shaded
        id={`${uid}-wagon-pole`}
        d={`M ${l - 0.1} ${-wheel - 0.06} L ${l + 1.5} ${-wheel + 0.02} L ${l + 1.5} ${-wheel + 0.12} L ${l - 0.1} ${-wheel + 0.08} Z`}
        {...wood}
        offset={lightOffset(shadowSide, 0.02)}
      />
      <Shaded
        id={`${uid}-wagon-bed`}
        d={`M ${-l} ${-side} L ${l} ${-side} L ${l - 0.08} ${-floor} L ${-l + 0.08} ${-floor} Z`}
        {...wood}
        offset={off}
      />
      {detail(
        `M ${-l + 0.05} ${-(side + floor) / 2} L ${l - 0.05} ${-(side + floor) / 2}`,
        'plank',
      )}
      {[-l + 0.3, 0, l - 0.3].map((x) => (
        <Shaded
          key={x}
          id={`${uid}-wagon-stake-${Math.round(x * 100)}`}
          d={`M ${x - 0.07} ${-side - 0.1} L ${x + 0.07} ${-side - 0.1} L ${x + 0.07} ${-floor + 0.02} L ${x - 0.07} ${-floor + 0.02} Z`}
          {...pale}
          offset={lightOffset(shadowSide, 0.02)}
          strokeWidth={lineWeights.detail}
        />
      ))}
      {wheelAt(-l + 0.75, 'wheel-a')}
      {wheelAt(l - 0.75, 'wheel-b')}
      <Glint x={-l + 0.73} y={-wheel - 0.05} length={0.07} turn={-35} />
    </g>
  );
}

/** How wide the rope barrier is and how high its posts stand, in head units. */
export const BARRIER = { width: 2.1, height: 1.3 } as const;

/**
 * A rope barrier: two wooden posts with a rope hanging between them, standing on the ground
 * with its middle at the origin. This far and no further.
 */
export function RopeBarrier({ uid, shadowSide }: PropProps) {
  const wood = paintOf('brown');
  const rope = pick(accent('tan'), 0);
  const w = BARRIER.width / 2;
  const h = BARRIER.height;
  const sag = `M ${-w} ${-h + 0.16} Q 0 ${-h + 0.7} ${w} ${-h + 0.16}`;
  const strand = (color: string, width: number) => (
    <path
      d={sag}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap={tokens.line.cap}
      strokeLinejoin={tokens.line.join}
    />
  );
  const post = (x: number, key: string) => (
    <Shaded
      key={key}
      id={`${uid}-barrier-${key}`}
      d={`M ${x - 0.09} 0 L ${x - 0.09} ${-h + 0.06} Q ${x} ${-h - 0.06} ${x + 0.09} ${-h + 0.06} L ${x + 0.09} 0 Z`}
      {...wood}
      offset={lightOffset(shadowSide, 0.03)}
    />
  );
  return (
    <g>
      {post(-w, 'post-a')}
      {post(w, 'post-b')}
      {/* The rope is outlined like everything else: a dark strand under a lighter one. */}
      {strand(ink, 0.085 + lineWeights.outline * 2)}
      {strand(rope, 0.085)}
    </g>
  );
}
