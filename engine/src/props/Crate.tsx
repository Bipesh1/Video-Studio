import { VIEWER_FONT } from '../overlays/text';
import { accent, ink, lineWeights, pick, shade } from '../tokens';
import { Shaded, lightOffset } from '../wardrobe/Shaded';
import { Glint, detail, paintOf } from './Hold';
import type { PropProps } from './Hold';

/**
 * The crate's size in head units. `lid` is how thick the lid is and `wall` how thick the other
 * boards are: someone inside stands on the bottom board, or on the lid when the crate has been
 * set down upside down.
 */
export const CRATE = { width: 2.36, height: 2.2, lid: 0.36, wall: 0.14 } as const;

const font = `${VIEWER_FONT}, sans-serif`;

/**
 * A wooden shipping crate (Style 4), standing on the ground with the middle of its width at
 * the origin: plank front, two battens, a lid, three small air holes near the lid on the side
 * it faces, and THIS SIDE UP painted on it with an arrow.
 *
 *  - `cutaway` takes the front off to show the dark inside, with thin lines of light coming in
 *    through the air holes. The words are then on the edge of the lid. Draw the person inside
 *    after it.
 *  - `inverted` stands it on its lid, as a half turn would leave it: the words upside down and
 *    the arrow pointing at the ground.
 */
export function Crate({
  uid,
  shadowSide,
  cutaway = false,
  inverted = false,
}: PropProps & { cutaway?: boolean; inverted?: boolean }) {
  const wood = paintOf('tan');
  const dark = paintOf('brown');
  const w = CRATE.width / 2;
  const { height: h, lid, wall } = CRATE;
  const top = -(h - lid);
  // Stood on its lid, every part is where a half turn puts it.
  const px = (x: number) => (inverted ? -x : x);
  const py = (y: number) => (inverted ? -h - y : y);
  const box = (x0: number, y0: number, x1: number, y1: number) =>
    `M ${px(x0)} ${py(y0)} L ${px(x1)} ${py(y0)} L ${px(x1)} ${py(y1)} L ${px(x0)} ${py(y1)} Z`;
  const line = (x0: number, y0: number, x1: number, y1: number) =>
    `M ${px(x0)} ${py(y0)} L ${px(x1)} ${py(y1)}`;
  const off = lightOffset(shadowSide, 0.05);
  const board = (key: string, d: string, paint = wood) => (
    <Shaded key={key} id={`${uid}-crate-${key}`} d={d} {...paint} offset={off} />
  );
  // Painted words: set at a size a browser draws well, then scaled to the scene.
  const painted = (text: string, x: number, y: number, size: number) => (
    <g transform={`translate(${px(x)} ${py(y)}) rotate(${inverted ? 180 : 0}) scale(0.01)`}>
      <text textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={size * 100} fill={ink}>
        {text}
      </text>
    </g>
  );
  // An arrow pointing at the lid, its tip at x, y.
  const arrow = (x: number, y: number, long: number) => {
    const k = long / 4;
    const pts: Array<[number, number]> = [
      [x, y],
      [x + 1.5 * k, y + 1.7 * k],
      [x + 0.55 * k, y + 1.7 * k],
      [x + 0.55 * k, y + long],
      [x - 0.55 * k, y + long],
      [x - 0.55 * k, y + 1.7 * k],
      [x - 1.5 * k, y + 1.7 * k],
    ];
    return (
      <path d={`M ${pts.map(([ax, ay]) => `${px(ax)} ${py(ay)}`).join(' L ')} Z`} fill={ink} />
    );
  };
  const holes = [0, 1, 2].map((i) => top + 0.2 + i * 0.13);
  const lidBoard = board('lid', box(-w - 0.07, -h, w + 0.07, top));
  const glint = <Glint x={px(-w + 0.5)} y={py(-h + 0.09)} length={0.3} />;

  if (cutaway) {
    const light = pick(accent('cream'), 0);
    return (
      <g>
        {/* Dark, but light enough that black limbs still read against it. */}
        <path d={box(-w + wall, top, w - wall, -wall)} fill={shade(dark.fill, 0.12)} />
        {/* Light through the three air holes, falling a little way into the dark. */}
        {holes.map((y, i) => (
          <path
            key={i}
            d={line(w - wall, y, w - wall - 0.62 + i * 0.07, y + 0.1 + i * 0.03)}
            stroke={light}
            strokeWidth={0.028}
            strokeLinecap="round"
            opacity={0.55}
          />
        ))}
        {board('floor', box(-w, -wall, w, 0))}
        {board('side-a', box(-w, top, -w + wall, -wall))}
        {board('side-b', box(w - wall, top, w, -wall))}
        {holes.map((y, i) => (
          <path key={i} d={box(w - wall, y - 0.022, w, y + 0.022)} fill={light} />
        ))}
        {lidBoard}
        {painted('THIS SIDE UP', -0.2, top - 0.1, 0.21)}
        {arrow(0.98, -h + 0.06, lid - 0.12)}
      </g>
    );
  }
  return (
    <g>
      {board('front', box(-w, top, w, 0))}
      {detail(line(-w + 0.22, -0.46, w - 0.22, -0.46), 'seam-a')}
      {detail(line(-w + 0.22, -1.46, w - 0.22, -1.46), 'seam-b')}
      {board('batten-a', box(-w, top, -w + 0.22, 0), dark)}
      {board('batten-b', box(w - 0.22, top, w, 0), dark)}
      {lidBoard}
      {painted('THIS SIDE', 0, -1.06, 0.31)}
      {painted('UP', -0.24, -0.64, 0.31)}
      {arrow(0.36, -0.95, 0.36)}
      {holes.map((y, i) => (
        <circle
          key={i}
          cx={px(w - 0.46 - i * 0.17)}
          cy={py(top + 0.26)}
          r={0.045}
          fill={shade(dark.shadow, 0.55)}
          stroke={ink}
          strokeWidth={lineWeights.detail}
        />
      ))}
      {/* Nail heads at the ends of the battens. */}
      {[-w + 0.11, w - 0.11].flatMap((x) =>
        [top + 0.12, -0.12].map((y) => (
          <circle key={`${x}-${y}`} cx={px(x)} cy={py(y)} r={0.024} fill={ink} />
        )),
      )}
      {glint}
    </g>
  );
}
