import { DEG, clamp, lerp, smoothstep } from '../rig/math';
import type { Vec2 } from '../rig/math';
import { ink, lineWeights, tokens } from '../tokens';
import { Shaded, lightOffset } from './Shaded';
import type { Outfit } from './types';

/**
 * How a shoe sits on the end of a leg (Biku, 2026-10-06: "the shoes look like they are not
 * properly attached to the leg"). The upper part of the shoe always follows the shin, so the
 * leg goes down into it.
 *  - A foot on the ground stays flat while the shin leans as far as an ankle bends.
 *  - Past that, leaning forward lifts the heel and leaning back lifts the toe.
 *  - A shin lying forward along the ground (a kneeling leg, a body face down) points the foot
 *    straight back, in line with it.
 *  - A foot in the air is square to its shin.
 * No part of a shoe goes under the ground.
 */
export type ShoeFit = {
  /** How far the whole shoe is turned, degrees: above zero the toe points down. */
  foot: number;
  /** How far the upper part leans on the foot, degrees: above zero it leans toward the toe. */
  ankle: number;
  /** How far the shoe sits up the shin, so a lifted heel leaves the toe on the ground. */
  slide: number;
  /** How far the shin leans from upright, degrees: above zero the knee is ahead of the foot. */
  shin: number;
};

/** An ankle on a planted foot bends this far toward the toe and this far back, degrees. */
const ANKLE_FORWARD = 30;
const ANKLE_BACK = 35;
/** A foot this far off the ground is fully in the air. */
const AIRBORNE = 0.23;
/** A shoe never slides farther than this up the shin, or is raised more than this off the ground. */
const MAX_SLIDE = 0.3;
const MAX_RAISE = 0.3;
/** How far up the shin from the ankle a trouser leg ends, inside the shoe. */
const TROUSER_IN_SHOE = 0.15;

const TOE = { boot: 0.24, sneaker: 0.38 } as const;
type Style = keyof typeof TOE;

/** Where a shoe sits for a foot and the knee above it. `toe` is how long the shoe is in front. */
export function shoeFit(foot: Vec2, knee: Vec2, dir: 1 | -1, toe: number): ShoeFit {
  const dx = (knee.x - foot.x) * dir;
  const dy = knee.y - foot.y;
  const shin = Math.hypot(dx, dy) < 1e-6 ? 0 : Math.atan2(dx, -dy) / DEG;
  const lift = Math.max(0, -foot.y);
  // On the ground: flat inside the ankle's range, heel or toe lifted outside it, and turned
  // right round to point back when the shin lies forward along the ground.
  const lying = smoothstep((shin - 60) / 25);
  const planted = shin - clamp(shin, -ANKLE_BACK, ANKLE_FORWARD) + lying * 120;
  const free = smoothstep((lift - 0.03) / (AIRBORNE - 0.03));
  const turn = lerp(planted, shin, free);
  // A lifted heel would push the toe into the ground, so the shoe moves up the shin instead.
  const dig = toe * Math.sin(turn * DEG) - lift;
  const slide = clamp(dig / Math.max(0.35, Math.cos(shin * DEG)), 0, MAX_SLIDE);
  return { foot: turn, ankle: shin - turn, slide, shin };
}

type P = readonly [number, number];

const turned = ([x, y]: P, deg: number): P => {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [x * c - y * s, x * s + y * c];
};

/**
 * The outermost points of each shoe standing flat, toe toward +x, ankle at the origin, used to
 * keep it clear of the ground. `sole` points belong to the foot; `upper` points lean with the
 * shin.
 */
const CORNERS: Record<Style, { sole: P[]; upper: P[] }> = {
  boot: {
    sole: [
      [-0.09, 0],
      [0.26, 0],
      [0.24, -0.07],
      [0.2, -0.12],
      [0.08, -0.13],
    ],
    upper: [
      [0.08, -0.24],
      [-0.09, -0.24],
    ],
  },
  sneaker: {
    sole: [
      [-0.13, 0],
      [0.39, 0],
      [0.38, -0.075],
      [0.35, -0.16],
      [0.2, -0.165],
      [-0.15, -0.13],
    ],
    upper: [
      [0.07, -0.21],
      [0.06, -0.25],
      [-0.1, -0.25],
    ],
  },
};

/** Everything needed to draw a shoe on a leg, and to end the trouser leg inside it. */
function place(foot: Vec2, knee: Vec2 | undefined, dir: 1 | -1, style: Style) {
  const fit = shoeFit(foot, knee ?? { x: foot.x, y: foot.y - 1 }, dir, TOE[style]);
  const up = turned([0, -fit.slide], fit.shin);
  const solePoint = (p: P): P => {
    const [x, y] = turned(p, fit.foot);
    return [x + up[0], y + up[1]];
  };
  const upperPoint = (p: P): P => solePoint(turned(p, fit.ankle));
  // Whatever is still under the ground is lifted clear of it.
  const lowest = Math.max(
    ...CORNERS[style].sole.map((p) => solePoint(p)[1]),
    ...CORNERS[style].upper.map((p) => upperPoint(p)[1]),
  );
  const raise = clamp(foot.y + lowest, 0, MAX_RAISE);
  const page = ([x, y]: P): Vec2 => ({ x: foot.x + x * dir, y: foot.y + y - raise });
  return { fit, sole: (p: P) => page(solePoint(p)), upper: (p: P) => page(upperPoint(p)) };
}

/** Where a trouser leg ends: a little way up the shin from the ankle, inside the shoe. */
export function trouserEnd(foot: Vec2, knee: Vec2, dir: 1 | -1, style: Style = 'boot'): Vec2 {
  return place(foot, knee, dir, style).upper([0, -TROUSER_IN_SHOE]);
}

/**
 * Footwear at a foot (Style 3.1: chunky outlined sneakers or boots), toe pointing along dir.
 * boot: the tall default. sneaker: the low white shoe on Reference B's frightened figure,
 * about half a head long, with a round toe cap, a sole stripe and two lace lines.
 */
export function Footwear({
  foot,
  knee,
  dir,
  spec,
  id,
  shadowSide,
}: {
  foot: Vec2;
  /** The knee above this foot. Left out, the shoe stands upright and flat. */
  knee?: Vec2;
  dir: 1 | -1;
  spec: NonNullable<Outfit['boots']>;
  id: string;
  shadowSide: 1 | -1;
}) {
  const style: Style = spec.style === 'sneaker' ? 'sneaker' : 'boot';
  const placed = place(foot, knee, dir, style);
  const at = (v: Vec2) => `${v.x} ${v.y}`;
  const sole = (p: P) => at(placed.sole(p));
  const upper = (p: P) => at(placed.upper(p));
  const off = lightOffset(shadowSide, 0.035);
  const line = (d: string, key: string) => (
    <path
      key={key}
      d={d}
      fill="none"
      stroke={ink}
      strokeWidth={lineWeights.detail}
      strokeLinecap={tokens.line.cap}
    />
  );

  if (style === 'sneaker') {
    const d = `M ${sole([-0.13, 0])} L ${sole([0.3, 0])} Q ${sole([0.39, 0])} ${sole([0.38, -0.075])} Q ${sole([0.35, -0.16])} ${sole([0.2, -0.165])} L ${upper([0.07, -0.21])} L ${upper([0.06, -0.25])} L ${upper([-0.1, -0.25])} Q ${sole([-0.15, -0.13])} ${sole([-0.13, 0])} Z`;
    return (
      <g>
        <Shaded id={id} d={d} fill={spec.fill} shadow={spec.shadow} offset={off} />
        {line(`M ${sole([-0.13, -0.05])} L ${sole([0.37, -0.05])}`, 'sole')}
        {line(`M ${sole([0.2, -0.165])} Q ${sole([0.25, -0.1])} ${sole([0.22, -0.05])}`, 'toe')}
        {line(`M ${upper([0.07, -0.21])} L ${sole([0.13, -0.12])}`, 'lace1')}
        {line(`M ${sole([0.13, -0.19])} L ${sole([0.18, -0.115])}`, 'lace2')}
      </g>
    );
  }

  const d = `M ${sole([-0.09, 0])} L ${sole([0.2, 0])} Q ${sole([0.26, 0])} ${sole([0.24, -0.07])} Q ${sole([0.2, -0.12])} ${sole([0.08, -0.13])} L ${upper([0.08, -0.24])} L ${upper([-0.09, -0.24])} Z`;
  const trim = spec.trim;
  return (
    <g>
      <Shaded id={id} d={d} fill={spec.fill} shadow={spec.shadow} offset={off} />
      {trim && (
        <Shaded
          id={`${id}-t`}
          d={`M ${upper([-0.11, -0.29])} L ${upper([0.1, -0.29])} L ${upper([0.1, -0.22])} L ${upper([-0.11, -0.22])} Z`}
          fill={trim[0]}
          shadow={trim[1]}
          offset={lightOffset(shadowSide, 0.02)}
        />
      )}
    </g>
  );
}
