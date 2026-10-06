import { DEG } from '../rig/math';
import { seeded } from '../rig/random';
import { ink, lineWeights, tokens } from '../tokens';

/**
 * Motion lines (Style 3.7): short black lines trailing something that moves fast, such as a
 * runner, a fist or a thrown thing. They sit just behind the moving thing, side by side along
 * the way it travels, and jitter every other frame so they feel like speed.
 *
 * Placed in the scene, not on a character: x and y are the screen point of the moving thing,
 * and `head` is the head size of the characters in the shot, so the line weight matches theirs.
 */
/**
 * A motion line is a stroke that is the whole drawing, like a stick limb, so it takes its
 * weight from the limbs and not from the fine outline (guide version 12).
 */
const MOTION_LINE_WEIGHT = 0.6;

export function MotionLines({
  x,
  y,
  head,
  direction,
  count = 3,
  length = 0.9,
  spread = 0.5,
  frame = 0,
  seed = 1,
}: {
  x: number;
  y: number;
  /** Head diameter of the characters in the shot, px. */
  head: number;
  /** The way the thing is moving, in degrees: 0 is to the right, 90 is down, 180 is to the left. */
  direction: number;
  count?: number;
  /** Length of the longest line, in head units. */
  length?: number;
  /** How far apart the outermost lines are, in head units. */
  spread?: number;
  /** The frame number, so the lines jitter. Left out, they hold still. */
  frame?: number;
  seed?: number;
}) {
  const beat = Math.floor(frame / 2);
  const back = (direction + 180) * DEG;
  const dir = { x: Math.cos(back), y: Math.sin(back) };
  const across = { x: -dir.y, y: dir.x };
  return (
    <g
      transform={`translate(${x} ${y}) scale(${head})`}
      stroke={ink}
      strokeWidth={lineWeights.limb * MOTION_LINE_WEIGHT}
      strokeLinecap={tokens.line.cap}
      fill="none"
    >
      {Array.from({ length: count }, (_, i) => {
        const lane = count === 1 ? 0 : (i / (count - 1) - 0.5) * spread;
        // The middle lines are the longest; each one starts a little way behind the thing.
        const middle = 1 - Math.abs(count === 1 ? 0 : (i / (count - 1)) * 2 - 1) * 0.45;
        const len = length * middle * (0.75 + 0.25 * seeded(`${seed}:len${i}:${beat}`));
        const gap = 0.12 + 0.16 * seeded(`${seed}:gap${i}:${beat}`);
        const ax = across.x * lane + dir.x * gap;
        const ay = across.y * lane + dir.y * gap;
        return <line key={i} x1={ax} y1={ay} x2={ax + dir.x * len} y2={ay + dir.y * len} />;
      })}
    </g>
  );
}
